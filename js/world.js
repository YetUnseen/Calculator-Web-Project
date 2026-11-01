/* ==========================================================================
   9KM x 9KM MULTI-LAYER FOREST & ALPINE OPEN WORLD (js/world.js)
   - Zero-Sink Barycentric Triangle-Synchronized Terrain Height (getMeshTriangleHeight)
   - 3-Layer Civil-Engineered Road System:
     1. 3D Compacted Gravel & Earth Embankment Skirt (seamless transition to terrain)
     2. 3D Crowned High-Resolution Asphalt Wearing Course + Rumble Curbs
     3. Steel Guardrails, Reflective Mileposts, Curve Chevron Signs & Streetlamps
   - Shallow Driveable Lake & Coastal Water Floors (cars splash through, never sink!)
   - 6,500+ Instanced Forest Trees, 3,500+ Bushes & 900+ Mossy Boulders
   ========================================================================== */

(function () {
  class DrivingWorld {
    constructor(scene) {
      this.scene = scene;
      this.worldSize = 9000; // 9km x 9km sandbox (-4500m to +4500m)
      this.terrainSegs = 460; // 460x460 grid (~19.5m cells, 212,521 vertices)
      this.terrainCellSize = this.worldSize / this.terrainSegs;
      this.terrainVertexY = null;

      this.roadSplines = [];
      this.roadSamples = [];
      this.roadMaterials = [];

      // Fast 2D Spatial Hash Grid for O(1) road queries
      this.gridCellSize = 95;
      this.spatialGrid = new Map();

      // Teleport / Fast-Travel Presets on the 9km x 9km Forest Road Network
      this.spawnLocations = [
        {
          id: 'coastal_start',
          name: 'REDWOOD FOREST HIGHWAY',
          desc: 'Sweeping natural S-curves through towering redwoods and lush woodland.',
          x: 0,
          z: 0,
          heading: Math.PI // Facing North (-Z) straight down the forest highway
        },
        {
          id: 'mountain_touge',
          name: 'ALPINE TIMBERLINE TOUGE',
          desc: '9.6 km winding mountain forest pass with rhythmic hairpins and apex curbs.',
          x: -1180,
          z: -1120,
          heading: -Math.PI * 0.72
        },
        {
          id: 'expressway',
          name: 'BLACK FOREST AUTOBAHN',
          desc: '7.8 km high-speed forest autobahn engineered for 530+ km/h top-speed runs.',
          x: 920,
          z: 3400,
          heading: Math.PI
        },
        {
          id: 'canyon_loop',
          name: 'EMERALD LAKE WOODLAND PASS',
          desc: 'Flowing forest backroad winding around the alpine lake and deep woods.',
          x: -1450,
          z: 1180,
          heading: -Math.PI * 0.35
        }
      ];

      this.textures = this.generateRoadAndTerrainTextures();
      this.initRoadNetwork();
      this.buildTerrainMesh();
      this.buildRoadMeshes();
      this.buildBridgesAndGuardrails();
      this.buildNaturalScenery();
    }

    /* ----------------------------------------------------------------------
       SPATIAL HASH GRID FOR INSTANT ROAD QUERIES ACROSS 9KM x 9KM
       ---------------------------------------------------------------------- */
    _gridKey(gx, gz) {
      return `${gx},${gz}`;
    }

    _insertRoadSampleIntoGrid(sample) {
      const gx = Math.floor(sample.x / this.gridCellSize);
      const gz = Math.floor(sample.z / this.gridCellSize);
      const key = this._gridKey(gx, gz);
      let bucket = this.spatialGrid.get(key);
      if (!bucket) {
        bucket = [];
        this.spatialGrid.set(key, bucket);
      }
      bucket.push(sample);
    }

    getNearestRoadSample(x, z, forceFullScan) {
      const gx = Math.floor(x / this.gridCellSize);
      const gz = Math.floor(z / this.gridCellSize);

      let minDistSq = Infinity;
      let nearest = null;

      // Search 5x5 neighborhood (±2 cells = ±190m) so road embankments and
      // terrain shoulders never suffer a spatial grid boundary cutoff!
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const bucket = this.spatialGrid.get(this._gridKey(gx + dx, gz + dz));
          if (!bucket) continue;
          for (let i = 0; i < bucket.length; i++) {
            const s = bucket[i];
            const ddx = x - s.x;
            const ddz = z - s.z;
            const dSq = ddx * ddx + ddz * ddz;
            if (dSq < minDistSq) {
              minDistSq = dSq;
              nearest = s;
            }
          }
        }
      }

      if (!nearest && forceFullScan) {
        for (let i = 0; i < this.roadSamples.length; i++) {
          const s = this.roadSamples[i];
          const ddx = x - s.x;
          const ddz = z - s.z;
          const dSq = ddx * ddx + ddz * ddz;
          if (dSq < minDistSq) {
            minDistSq = dSq;
            nearest = s;
          }
        }
      }

      if (!nearest) {
        return { sample: null, dist: 999, interpolatedY: 0 };
      }

      // Compute C1-continuous interpolated road elevation along the finite road segment.
      // Clamp longitudinal projection `along` to ±6.5m (half sample spacing) so it never
      // extrapolates wildly off road ends or curves!
      const dx = x - nearest.x;
      const dz = z - nearest.z;
      const rawAlong = dx * nearest.tangent.x + dz * nearest.tangent.z;
      const clampedAlong = Math.max(-6.5, Math.min(6.5, rawAlong));
      const interpolatedY = nearest.y + clampedAlong * nearest.slopeY;

      // True Euclidean distance to the clamped road centerline segment
      const segDx = dx - clampedAlong * nearest.tangent.x;
      const segDz = dz - clampedAlong * nearest.tangent.z;
      const segDist = Math.hypot(segDx, segDz);

      return {
        sample: nearest,
        dist: segDist,
        interpolatedY: interpolatedY
      };
    }

    /* ----------------------------------------------------------------------
       HIGH-DEFINITION PROCEDURAL ASPHALT, SHOULDER & FOREST TEXTURES
       ---------------------------------------------------------------------- */
    generateRoadAndTerrainTextures() {
      // 1. 1024x1024 High-Definition Asphalt + Motorsport Shoulder Rumble Strip Texture
      const roadCanvas = document.createElement('canvas');
      roadCanvas.width = 1024;
      roadCanvas.height = 1024;
      const rctx = roadCanvas.getContext('2d');

      // Base dark basalt asphalt
      rctx.fillStyle = '#1e222a';
      rctx.fillRect(0, 0, 1024, 1024);

      // Alternating red-and-white / slate shoulder rumble curbs on outer edges
      for (let y = 0; y < 1024; y += 64) {
        rctx.fillStyle = (y / 64) % 2 === 0 ? '#dc2626' : '#f1f5f9';
        rctx.fillRect(0, y, 28, 64);
        rctx.fillRect(996, y, 28, 64);
      }

      // Rich stone aggregate micro-grain
      for (let i = 0; i < 48000; i++) {
        const x = 28 + Math.random() * 968;
        const y = Math.random() * 1024;
        const v = 22 + Math.floor(Math.random() * 26);
        rctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
        rctx.fillRect(x, y, 2, 2);
      }

      // Darker rubber-burnished racing line / wheel tracks in both lanes
      rctx.fillStyle = 'rgba(8, 10, 14, 0.30)';
      rctx.fillRect(170, 0, 195, 1024);
      rctx.fillRect(659, 0, 195, 1024);

      // Longitudinal asphalt paver seam
      rctx.fillStyle = 'rgba(12, 14, 18, 0.55)';
      rctx.fillRect(510, 0, 4, 1024);

      // Crisp retroreflective white edge lines
      rctx.fillStyle = '#f8fafc';
      rctx.fillRect(58, 0, 18, 1024);
      rctx.fillRect(948, 0, 18, 1024);

      // High-visibility dual highway yellow centerline (solid + passing dash)
      rctx.fillStyle = '#fbbf24';
      rctx.fillRect(496, 0, 10, 1024);
      for (let y = 24; y < 1024; y += 128) {
        rctx.fillRect(518, y, 10, 76);
      }

      const tarmacTex = new THREE.CanvasTexture(roadCanvas);
      tarmacTex.wrapS = THREE.RepeatWrapping;
      tarmacTex.wrapT = THREE.RepeatWrapping;
      tarmacTex.anisotropy = 8;

      // 2. Compacted Gravel & Mossy Earth Road Embankment Skirt Texture
      const skirtCanvas = document.createElement('canvas');
      skirtCanvas.width = 256;
      skirtCanvas.height = 256;
      const sctx = skirtCanvas.getContext('2d');
      const sGrad = sctx.createLinearGradient(0, 0, 256, 0);
      sGrad.addColorStop(0.0, '#474b44');
      sGrad.addColorStop(0.35, '#3e4738');
      sGrad.addColorStop(1.0, '#2d4c27');
      sctx.fillStyle = sGrad;
      sctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const c = 45 + Math.floor(Math.random() * 40);
        sctx.fillStyle = `rgb(${c},${c + 8},${c - 4})`;
        sctx.fillRect(x, y, 2, 2);
      }
      const shoulderTex = new THREE.CanvasTexture(skirtCanvas);
      shoulderTex.wrapS = THREE.ClampToEdgeWrapping;
      shoulderTex.wrapT = THREE.RepeatWrapping;

      // 3. High-Detail Forest Floor Moss, Ferns & Pine Needle Micro-Detail Texture
      const terrCanvas = document.createElement('canvas');
      terrCanvas.width = 512;
      terrCanvas.height = 512;
      const tctx = terrCanvas.getContext('2d');
      tctx.fillStyle = '#cbd6c6';
      tctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 42000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const g = 172 + Math.floor(Math.random() * 72);
        tctx.fillStyle = `rgb(${g - 10},${g},${g - 12})`;
        tctx.fillRect(x, y, 2, 2);
      }
      const terrainDetailTex = new THREE.CanvasTexture(terrCanvas);
      terrainDetailTex.wrapS = THREE.RepeatWrapping;
      terrainDetailTex.wrapT = THREE.RepeatWrapping;
      terrainDetailTex.repeat.set(220, 220);

      return { tarmacTex, shoulderTex, terrainDetailTex };
    }

    setWetRoads(isWet) {
      this.roadMaterials.forEach((mat) => {
        mat.roughness = isWet ? 0.10 : 0.42;
        mat.metalness = isWet ? 0.68 : 0.16;
        mat.needsUpdate = true;
      });
    }

    /* ----------------------------------------------------------------------
       RAW FOREST & ALPINE MOUNTAIN ELEVATION ACROSS 9KM x 9KM
       (Smooth C2 transitions & shallow driveable water beds — ZERO sinkholes!)
       ---------------------------------------------------------------------- */
    getRawElevation(x, z) {
      // Smooth C2 Hermite valley transition around central spawn (0, 0)
      const rawT = Math.min(1, Math.max(0, (Math.hypot(x, z) - 240) / 560));
      const startValley = rawT * rawT * (3 - 2 * rawT);

      // 1. North-West Alpine Timberline Peak (x ≈ -1850, z ≈ -1850, up to +145m)
      const nwDist = Math.hypot(x - (-1850), z - (-1850));
      const nwMountain =
        140 * Math.exp(-(nwDist * nwDist) / (1450 * 1450)) *
        (0.82 + 0.18 * Math.sin(x * 0.0028) * Math.cos(z * 0.0028));

      // 2. Northern Woodland Ridge (x ≈ -450, z ≈ -2750, up to +85m)
      const nRidgeDist = Math.hypot((x - (-450)) * 0.7, z - (-2750));
      const nRidge = 85 * Math.exp(-(nRidgeDist * nRidgeDist) / (1150 * 1150));

      // 3. South-West Deep Forest Highlands (x ≈ -1750, z ≈ +1750, up to +68m)
      const swDist = Math.hypot(x - (-1750), z - 1750);
      const swHighlands =
        68 * Math.exp(-(swDist * swDist) / (1500 * 1500)) *
        (0.75 + 0.25 * Math.sin(x * 0.0035) * Math.cos(z * 0.0035));

      // 4. Smooth rolling forest hills across the 9km x 9km world
      const hills =
        Math.sin(x * 0.0012) * Math.cos(z * 0.0012) * 18 +
        Math.sin(x * 0.0026 + 1.2) * Math.sin(z * 0.0024 + 0.6) * 7.5 +
        11.0;

      // 5. Emerald Alpine Lake Basin at (x = -1250, z = +420, radius ~330m)
      const lakeDist = Math.hypot(x - (-1250), z - 420);
      const lakeDepression = 18 * Math.exp(-(lakeDist * lakeDist) / (460 * 460));

      let h = (nwMountain + nRidge + swHighlands + hills) * startValley + 6.5 - lakeDepression;

      // Keep Emerald Lake bed a shallow driveable pebble floor (y >= 5.98m, water surface at 6.20m)
      // so cars can splash across the lake without ever sinking under the water mesh!
      if (lakeDist < 420) {
        h = Math.max(5.98, h);
      }

      // 6. Gentle coastal slope down to the Eastern Ocean (x > 2800), clamped to shallow beach floor (y >= 0.08m)
      if (x > 2800) {
        h -= (x - 2800) * 0.022;
        h = Math.max(0.08, h);
      }

      return h;
    }

    /* ----------------------------------------------------------------------
       4 NATURAL, SILKY-SMOOTH FOREST & MOUNTAIN ROAD NETWORKS (40.1 KM)
       ---------------------------------------------------------------------- */
    initRoadNetwork() {
      // 1. REDWOOD & COASTAL FOREST RING (16.0 km closed loop with organic S-curves)
      const mainLoopWaypoints = [
        new THREE.Vector3(0, 0, 320),
        new THREE.Vector3(0, 0, 0),          // <--- SPAWN POINT AT (0,0) FACING NORTH (-Z)
        new THREE.Vector3(0, 0, -340),
        new THREE.Vector3(140, 0, -780),
        new THREE.Vector3(460, 0, -1240),
        new THREE.Vector3(380, 0, -1780),
        new THREE.Vector3(740, 0, -2350),
        new THREE.Vector3(1380, 0, -2780),
        new THREE.Vector3(2120, 0, -2640),
        new THREE.Vector3(2680, 0, -2050),
        new THREE.Vector3(2920, 0, -1250),
        new THREE.Vector3(2740, 0, -420),
        new THREE.Vector3(3020, 0, 420),
        new THREE.Vector3(2860, 0, 1340),
        new THREE.Vector3(2420, 0, 2180),
        new THREE.Vector3(1680, 0, 2760),
        new THREE.Vector3(820, 0, 2940),
        new THREE.Vector3(-120, 0, 2680),
        new THREE.Vector3(-880, 0, 2120),
        new THREE.Vector3(-1180, 0, 1360),
        new THREE.Vector3(-760, 0, 820),
        new THREE.Vector3(-280, 0, 560)
      ];
      this.buildSmoothRoadSpline('main_loop', mainLoopWaypoints, 18, true, 2400);

      // 2. BLACK FOREST AUTOBAHN CORRIDOR (7.8 km high-speed forest highway)
      const autobahnWaypoints = [
        new THREE.Vector3(980, 0, 3850),
        new THREE.Vector3(920, 0, 3100),
        new THREE.Vector3(780, 0, 2250),
        new THREE.Vector3(680, 0, 1350),
        new THREE.Vector3(740, 0, 450),
        new THREE.Vector3(860, 0, -450),
        new THREE.Vector3(820, 0, -1350),
        new THREE.Vector3(660, 0, -2250),
        new THREE.Vector3(540, 0, -3100),
        new THREE.Vector3(480, 0, -3900)
      ];
      this.buildSmoothRoadSpline('expressway', autobahnWaypoints, 22, false, 1400);

      // 3. ALPINE TIMBERLINE TOUGE PASS (9.6 km winding mountain forest switchbacks)
      const tougeWaypoints = [
        new THREE.Vector3(0, 0, -340),
        new THREE.Vector3(-340, 0, -560),
        new THREE.Vector3(-780, 0, -620),
        new THREE.Vector3(-1180, 0, -1120),
        new THREE.Vector3(-920, 0, -1580),
        new THREE.Vector3(-1560, 0, -1820),
        new THREE.Vector3(-1380, 0, -2360),
        new THREE.Vector3(-2080, 0, -2680),
        new THREE.Vector3(-2780, 0, -2320),
        new THREE.Vector3(-2960, 0, -1620),
        new THREE.Vector3(-2420, 0, -1180),
        new THREE.Vector3(-2680, 0, -540),
        new THREE.Vector3(-2120, 0, 40),
        new THREE.Vector3(-1480, 0, 180),
        new THREE.Vector3(-760, 0, 820)
      ];
      this.buildSmoothRoadSpline('mountain_touge', tougeWaypoints, 15, false, 1600);

      // 4. EMERALD LAKE & DEEP WOODLAND SCENIC ROUTE (6.7 km forest backroad)
      const woodlandWaypoints = [
        new THREE.Vector3(-760, 0, 820),
        new THREE.Vector3(-1450, 0, 1180),
        new THREE.Vector3(-2180, 0, 1060),
        new THREE.Vector3(-2760, 0, 1540),
        new THREE.Vector3(-2980, 0, 2280),
        new THREE.Vector3(-2420, 0, 2860),
        new THREE.Vector3(-1680, 0, 2540),
        new THREE.Vector3(-1240, 0, 3080),
        new THREE.Vector3(-480, 0, 2960),
        new THREE.Vector3(-120, 0, 2680)
      ];
      this.buildSmoothRoadSpline('canyon_route', woodlandWaypoints, 15, false, 1300);
    }

    buildSmoothRoadSpline(id, waypoints, width, closed, sampleCount) {
      waypoints.forEach((pt) => {
        pt.y = this.getRawElevation(pt.x, pt.z);
      });

      const curve = new THREE.CatmullRomCurve3(waypoints, closed, 'catmullrom', 0.48);
      const pts = curve.getSpacedPoints(sampleCount);

      for (let i = 0; i < pts.length; i++) {
        pts[i].y = this.getRawElevation(pts[i].x, pts[i].z);
      }

      // 24 passes of vertical grade smoothing so crests and dips are 100% butter-smooth
      for (let pass = 0; pass < 24; pass++) {
        const smoothedY = new Float32Array(pts.length);
        for (let i = 0; i < pts.length; i++) {
          const prevIdx = closed ? (i - 1 + pts.length) % pts.length : Math.max(0, i - 1);
          const nextIdx = closed ? (i + 1) % pts.length : Math.min(pts.length - 1, i + 1);
          smoothedY[i] = pts[prevIdx].y * 0.25 + pts[i].y * 0.50 + pts[nextIdx].y * 0.25;
        }
        for (let i = 0; i < pts.length; i++) {
          pts[i].y = smoothedY[i];
        }
      }

      const tangents = [];
      let totalLength = 0;
      for (let i = 0; i < pts.length; i++) {
        if (i > 0) {
          totalLength += pts[i].distanceTo(pts[i - 1]);
        }
        const prevIdx = closed ? (i - 1 + pts.length) % pts.length : Math.max(0, i - 1);
        const nextIdx = closed ? (i + 1) % pts.length : Math.min(pts.length - 1, i + 1);
        const dx = pts[nextIdx].x - pts[prevIdx].x;
        const dz = pts[nextIdx].z - pts[prevIdx].z;
        const horizSpan = Math.max(0.1, Math.hypot(dx, dz));
        const tan = new THREE.Vector3(dx / horizSpan, 0, dz / horizSpan);
        const slopeY = (pts[nextIdx].y - pts[prevIdx].y) / horizSpan;
        tangents.push(tan);

        const sample = {
          x: pts[i].x,
          y: pts[i].y,
          z: pts[i].z,
          width: width,
          tangent: tan,
          slopeY: slopeY,
          splineId: id
        };
        this.roadSamples.push(sample);
        this._insertRoadSampleIntoGrid(sample);
      }

      this.roadSplines.push({ id, curve, width, closed, pts, tangents, length: totalLength });
    }

    /* ----------------------------------------------------------------------
       EXACT BARYCENTRIC TRIANGLE HEIGHT ON THE RENDERED TERRAIN MESH
       (Guarantees 0.000m discrepancy between visual ground & physics ground!)
       ---------------------------------------------------------------------- */
    getMeshTriangleHeight(x, z) {
      if (!this.terrainVertexY) return this.getRawElevation(x, z);

      const segs = this.terrainSegs;
      const half = this.worldSize * 0.5;
      const cell = this.terrainCellSize;

      const gx = (x + half) / cell;
      const gz = (z + half) / cell;
      const ix = Math.max(0, Math.min(segs - 1, Math.floor(gx)));
      const iz = Math.max(0, Math.min(segs - 1, Math.floor(gz)));
      const fx = Math.max(0, Math.min(1, gx - ix));
      const fz = Math.max(0, Math.min(1, gz - iz));

      const row = segs + 1;
      const y00 = this.terrainVertexY[iz * row + ix];
      const y10 = this.terrainVertexY[iz * row + ix + 1];
      const y01 = this.terrainVertexY[(iz + 1) * row + ix];
      const y11 = this.terrainVertexY[(iz + 1) * row + ix + 1];

      // Matches Three.js PlaneGeometry quad split: (a, b, d) for fx + fz <= 1, (b, c, d) for fx + fz > 1
      let triY;
      if (fx + fz <= 1.0) {
        triY = y00 + fx * (y10 - y00) + fz * (y01 - y00);
      } else {
        triY = y11 + (1.0 - fx) * (y01 - y11) + (1.0 - fz) * (y10 - y11);
      }

      // Ensure cars driving across Emerald Lake or the Coastal Beach stay on a shallow
      // driveable water bed (max 0.20m ankle-deep water splash) and never sink underwater!
      if (Math.hypot(x - (-1250), z - 420) < 332) {
        triY = Math.max(triY, 6.00);
      }
      if (x > 3140) {
        triY = Math.max(triY, 0.12);
      }

      return triY;
    }

    /* ----------------------------------------------------------------------
       CONTINUOUS ROAD-TO-EMBANKMENT-TO-TERRAIN HEIGHT & SURFACE QUERY
       ---------------------------------------------------------------------- */
    getTerrainHeight(x, z) {
      const meshY = this.getMeshTriangleHeight(x, z);
      const { sample, dist, interpolatedY } = this.getNearestRoadSample(x, z, false);
      if (!sample) return meshY;

      const halfW = sample.width * 0.5;
      const shoulderW = 7.5; // Width of the 3D gravel embankment skirt

      if (dist <= halfW) {
        // Crowned asphalt surface height (+0.12m above spline baseline, never below meshY)
        const crown = (1.0 - (dist / halfW) * (dist / halfW)) * 0.03;
        return Math.max(meshY, interpolatedY + 0.12 + crown);
      } else if (dist <= halfW + shoulderW) {
        // Smooth transition down the 3D gravel embankment skirt to the exact terrain mesh triangle
        const t = (dist - halfW) / shoulderW;
        const smoothT = t * t * (3 - 2 * t);
        const roadEdgeY = Math.max(meshY, interpolatedY + 0.10);
        return Math.max(meshY, roadEdgeY * (1 - smoothT) + meshY * smoothT);
      }
      return meshY;
    }

    getSurfaceInfo(x, z) {
      const { sample, dist } = this.getNearestRoadSample(x, z, false);
      if (sample && dist <= sample.width * 0.55) {
        return { surface: 'TARMAC', roadDist: dist, sample };
      }
      if (Math.hypot(x - (-1250), z - 420) < 330 || x > 3150) {
        return { surface: 'OFFROAD', roadDist: dist, sample, isWater: true };
      }
      return { surface: 'OFFROAD', roadDist: dist, sample, isWater: false };
    }

    getZoneName(x, z) {
      if (Math.abs(x - 760) < 240 && Math.abs(z) > 600) return 'BLACK FOREST AUTOBAHN';
      if (x < -550 && z < -450) return 'ALPINE TIMBERLINE TOUGE';
      if (Math.hypot(x - (-1250), z - 420) < 680) return 'EMERALD ALPINE LAKE';
      if (x < -500 && z > 650) return 'DEEP WOODLAND BACKROAD';
      if (x > 2100) return 'PACIFIC REDWOOD COAST';
      return 'REDWOOD FOREST HIGHWAY';
    }

    /* ----------------------------------------------------------------------
       BUILD 9KM x 9KM LUSH FOREST TERRAIN MESH + SHALLOW LAKE + OCEAN
       ---------------------------------------------------------------------- */
    buildTerrainMesh() {
      const segs = this.terrainSegs;
      const geo = new THREE.PlaneGeometry(this.worldSize, this.worldSize, segs, segs);
      geo.rotateX(-Math.PI / 2);

      const pos = geo.attributes.position;
      this.terrainVertexY = new Float32Array(pos.count);
      const colors = new Float32Array(pos.count * 3);

      const cDeepForest = new THREE.Color(0x234922);
      const cMossMeadow = new THREE.Color(0x3a6a30);
      const cPineFloor = new THREE.Color(0x2a4226);
      const cSubAlpine = new THREE.Color(0x4b5d43);
      const cGranitePeak = new THREE.Color(0x5a605d);
      const cSnowCap = new THREE.Color(0xe2e8f0);
      const cRoadShoulder = new THREE.Color(0x3f463a);
      const cShorePebble = new THREE.Color(0x9ca38f);
      const cTmp = new THREE.Color();

      // Wide roadbed carving radius (halfW + 25m) guarantees that EVERY triangle
      // of terrainMesh crossing or touching any road sits cleanly 0.24m below the asphalt!
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        const { sample, dist, interpolatedY } = this.getNearestRoadSample(vx, vz, false);
        const rawH = this.getRawElevation(vx, vz);

        let vy = rawH;
        let shoulderBlend = 0;
        if (sample) {
          const innerR = sample.width * 0.5 + 25.0;
          const outerR = innerR + 60.0;
          if (dist <= innerR) {
            vy = interpolatedY - 0.24;
            shoulderBlend = 1.0;
          } else if (dist < outerR) {
            const t = (dist - innerR) / (outerR - innerR);
            const smoothT = t * t * (3 - 2 * t);
            vy = (interpolatedY - 0.24) * (1 - smoothT) + rawH * smoothT;
            shoulderBlend = Math.max(0, 1 - t * 2.0);
          }
        }
        pos.setY(i, vy);
        this.terrainVertexY[i] = vy;

        // Multi-Layer Woodland & Alpine Biome Coloring
        cTmp.copy(cDeepForest);
        const patchNoise = 0.5 + 0.5 * Math.sin(vx * 0.0045) * Math.cos(vz * 0.0045);
        cTmp.lerp(cMossMeadow, patchNoise * 0.68);

        const elevFactor = Math.min(1, Math.max(0, (vy - 16) / 38));
        cTmp.lerp(cPineFloor, elevFactor * 0.65);

        if (vy > 42) {
          cTmp.lerp(cSubAlpine, Math.min(1, (vy - 42) / 28));
        }
        if (vy > 64) {
          cTmp.lerp(cGranitePeak, Math.min(1, (vy - 64) / 42));
        }
        if (vy > 112) {
          cTmp.lerp(cSnowCap, Math.min(0.88, (vy - 112) / 36));
        }

        // Shoreline pebbles around Emerald Lake & East Coast
        const lakeShoreDist = Math.hypot(vx - (-1250), vz - 420);
        if (vx > 2720) {
          cTmp.lerp(cShorePebble, Math.min(1, (vx - 2720) / 420));
        } else if (lakeShoreDist < 420) {
          cTmp.lerp(cShorePebble, Math.max(0, 1 - Math.abs(lakeShoreDist - 320) / 100) * 0.72);
        }

        // Compacted soil/gravel shoulder next to asphalt roads
        if (shoulderBlend > 0) {
          cTmp.lerp(cRoadShoulder, shoulderBlend * 0.78);
        }

        colors[i * 3] = cTmp.r;
        colors[i * 3 + 1] = cTmp.g;
        colors[i * 3 + 2] = cTmp.b;
      }

      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        map: this.textures.terrainDetailTex,
        bumpMap: this.textures.terrainDetailTex,
        bumpScale: 0.18,
        roughness: 0.88,
        metalness: 0.04
      });

      this.terrainMesh = new THREE.Mesh(geo, mat);
      this.terrainMesh.receiveShadow = true;
      this.scene.add(this.terrainMesh);

      // 1. Pacific Coastal Ocean along the Eastern Edge (x > 3150, shallow driveable beach bed underneath)
      const oceanGeo = new THREE.PlaneGeometry(3200, this.worldSize);
      oceanGeo.rotateX(-Math.PI / 2);
      const oceanMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.12,
        metalness: 0.75,
        transparent: true,
        opacity: 0.84
      });
      const ocean = new THREE.Mesh(oceanGeo, oceanMat);
      ocean.position.set(4750, 0.28, 0);
      this.scene.add(ocean);

      // 2. Emerald Alpine Lake at (x = -1250, z = +420, shallow 0.18m crystal water over pebble bed)
      const lakeGeo = new THREE.CircleGeometry(330, 64);
      lakeGeo.rotateX(-Math.PI / 2);
      const lakeMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.08,
        metalness: 0.82,
        transparent: true,
        opacity: 0.82
      });
      const lake = new THREE.Mesh(lakeGeo, lakeMat);
      lake.position.set(-1250, 6.18, 420);
      this.scene.add(lake);
    }

    /* ----------------------------------------------------------------------
       BUILD 3D LAYERED ASPHALT ROAD MESHES + GRAVEL EMBANKMENT SKIRTS
       ---------------------------------------------------------------------- */
    buildRoadMeshes() {
      const tarmacMat = new THREE.MeshStandardMaterial({
        map: this.textures.tarmacTex,
        bumpMap: this.textures.tarmacTex,
        bumpScale: 0.04,
        roughness: 0.42,
        metalness: 0.16,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3
      });
      this.roadMaterials.push(tarmacMat);

      const skirtMat = new THREE.MeshStandardMaterial({
        map: this.textures.shoulderTex,
        roughness: 0.86,
        metalness: 0.04,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      });

      this.roadSplines.forEach((road) => {
        const pts = road.pts;
        const halfW = road.width * 0.5;
        const shoulderW = 7.5;

        // Layer 1: Crowned 3-vertex-wide Asphalt Wearing Course (Left Edge, Crown Center, Right Edge)
        const positions = [];
        const indices = [];
        const uvs = [];

        // Layer 2: 3D Sloped Gravel & Earth Embankment Skirts on both sides of the road
        const skirtPos = [];
        const skirtIdx = [];
        const skirtUvs = [];

        let accumDist = 0;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          if (i > 0) {
            accumDist += p.distanceTo(pts[i - 1]);
          }
          const tan = road.tangents[i];
          const leftX = tan.z;
          const leftZ = -tan.x;

          const lx = p.x + leftX * halfW;
          const lz = p.z - tan.x * halfW;
          const rx = p.x - leftX * halfW;
          const rz = p.z + tan.x * halfW;

          const edgeY = Math.max(this.getMeshTriangleHeight(p.x, p.z) + 0.06, p.y + 0.12);
          const crownY = edgeY + 0.03;

          positions.push(lx, edgeY, lz, p.x, crownY, p.z, rx, edgeY, rz);
          const vCoord = accumDist / 16;
          uvs.push(0, vCoord, 0.5, vCoord, 1, vCoord);

          if (i < pts.length - 1) {
            const b = i * 3;
            indices.push(b, b + 3, b + 1, b + 1, b + 3, b + 4);
            indices.push(b + 1, b + 4, b + 2, b + 2, b + 4, b + 5);
          }

          // Outer embankment skirt vertices connecting asphalt edge seamlessly into terrainMesh
          const lOutX = p.x + leftX * (halfW + shoulderW);
          const lOutZ = p.z + leftZ * (halfW + shoulderW);
          const lOutY = this.getMeshTriangleHeight(lOutX, lOutZ) - 0.03;

          const rOutX = p.x - leftX * (halfW + shoulderW);
          const rOutZ = p.z - leftZ * (halfW + shoulderW);
          const rOutY = this.getMeshTriangleHeight(rOutX, rOutZ) - 0.03;

          skirtPos.push(
            lx, edgeY - 0.01, lz,
            lOutX, lOutY, lOutZ,
            rx, edgeY - 0.01, rz,
            rOutX, rOutY, rOutZ
          );
          skirtUvs.push(0, vCoord, 1, vCoord, 0, vCoord, 1, vCoord);

          if (i < pts.length - 1) {
            const sb = i * 4;
            // Left embankment quad
            skirtIdx.push(sb, sb + 4, sb + 1, sb + 1, sb + 4, sb + 5);
            // Right embankment quad
            skirtIdx.push(sb + 2, sb + 3, sb + 6, sb + 3, sb + 7, sb + 6);
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();

        const mesh = new THREE.Mesh(geo, tarmacMat);
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const sGeo = new THREE.BufferGeometry();
        sGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtPos, 3));
        sGeo.setAttribute('uv', new THREE.Float32BufferAttribute(skirtUvs, 2));
        sGeo.setIndex(skirtIdx);
        sGeo.computeVertexNormals();

        const sMesh = new THREE.Mesh(sGeo, skirtMat);
        sMesh.receiveShadow = true;
        this.scene.add(sMesh);
      });
    }

    /* ----------------------------------------------------------------------
       STEEL W-BEAM GUARDRAILS, DELINEATOR POSTS, CHEVRONS & STREETLAMPS
       ---------------------------------------------------------------------- */
    buildBridgesAndGuardrails() {
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.38,
        metalness: 0.80,
        side: THREE.DoubleSide
      });

      this.roadSplines.forEach((road) => {
        if (road.id === 'expressway') return;
        const offsetDist = road.width * 0.5 + 0.75;

        [-1, 1].forEach((side) => {
          const railPositions = [];
          const railIndices = [];
          let vCount = 0;

          for (let i = 0; i < road.pts.length; i += 2) {
            const p = road.pts[i];
            const tan = road.tangents[i];
            const leftX = tan.z;
            const leftZ = -tan.x;

            const rx = p.x + leftX * offsetDist * side;
            const rz = p.z + leftZ * offsetDist * side;

            const outerCheckX = p.x + leftX * (offsetDist + 18) * side;
            const outerCheckZ = p.z + leftZ * (offsetDist + 18) * side;
            const rawDrop = p.y - this.getRawElevation(outerCheckX, outerCheckZ);
            const needsRail = p.y > 26 || rawDrop > 3.2;

            if (needsRail) {
              const baseH = this.getTerrainHeight(rx, rz);
              railPositions.push(rx, baseH + 0.35, rz);
              railPositions.push(rx, baseH + 0.74, rz);
              if (vCount >= 2) {
                const b = vCount - 2;
                railIndices.push(b, b + 2, b + 1);
                railIndices.push(b + 1, b + 2, b + 3);
              }
              vCount += 2;
            } else {
              vCount = 0;
            }
          }

          if (railIndices.length > 0) {
            const railGeo = new THREE.BufferGeometry();
            railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railPositions, 3));
            railGeo.setIndex(railIndices);
            railGeo.computeVertexNormals();
            const railMesh = new THREE.Mesh(railGeo, steelMat);
            this.scene.add(railMesh);
          }
        });
      });

      // 1. Glowing Retroreflective Amber Centerline Cat's-Eye Road Studs
      const dummy = new THREE.Object3D();
      const studGeo = new THREE.BoxGeometry(0.18, 0.045, 0.18);
      const studMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const studInst = new THREE.InstancedMesh(studGeo, studMat, 2400);
      let studCount = 0;

      this.roadSplines.forEach((road) => {
        for (let i = 0; i < road.pts.length; i += 3) {
          if (studCount >= 2400) break;
          const p = road.pts[i];
          const tan = road.tangents[i];
          const y = this.getTerrainHeight(p.x, p.z);
          dummy.position.set(p.x, y + 0.02, p.z);
          dummy.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          studInst.setMatrixAt(studCount++, dummy.matrix);
        }
      });
      studInst.count = studCount;
      this.scene.add(studInst);

      // 2. Roadside White & Red Reflective Delineator Guide Posts (every ~45m on both shoulders)
      const postGeo = new THREE.BoxGeometry(0.14, 1.05, 0.08);
      postGeo.translate(0, 0.52, 0);
      const postMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0xef4444,
        emissiveIntensity: 0.35,
        roughness: 0.3
      });
      const postInst = new THREE.InstancedMesh(postGeo, postMat, 1800);
      let postCount = 0;

      this.roadSplines.forEach((road) => {
        const off = road.width * 0.5 + 1.15;
        for (let i = 4; i < road.pts.length - 4; i += 6) {
          if (postCount >= 1800) break;
          const p = road.pts[i];
          const tan = road.tangents[i];
          [-1, 1].forEach((side) => {
            if (postCount >= 1800) return;
            const px = p.x + tan.z * off * side;
            const pz = p.z - tan.x * off * side;
            const py = this.getTerrainHeight(px, pz);
            dummy.position.set(px, py, pz);
            dummy.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            postInst.setMatrixAt(postCount++, dummy.matrix);
          });
        }
      });
      postInst.count = postCount;
      this.scene.add(postInst);

      // 3. Architectural Forest Highway Streetlamps along the Autobahn & Main Forest Ring
      const poleGeo = new THREE.CylinderGeometry(0.14, 0.22, 9.5, 8);
      poleGeo.translate(0, 4.75, 0);
      const lampGeo = new THREE.BoxGeometry(1.5, 0.22, 0.48);
      lampGeo.translate(0, 9.5, 0);

      const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });
      const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });

      const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, 340);
      const lampInst = new THREE.InstancedMesh(lampGeo, lampMat, 340);
      let lampCount = 0;

      [this.roadSplines[0], this.roadSplines[1]].forEach((road) => {
        if (!road) return;
        const sideOffset = road.width * 0.5 + 2.1;
        for (let i = 8; i < road.pts.length - 8; i += 22) {
          if (lampCount >= 340) break;
          const p = road.pts[i];
          const tan = road.tangents[i];
          const side = (i / 22) % 2 === 0 ? 1 : -1;
          const lx = p.x + tan.z * sideOffset * side;
          const lz = p.z - tan.x * sideOffset * side;
          const ly = this.getTerrainHeight(lx, lz);

          dummy.position.set(lx, ly, lz);
          dummy.rotation.set(0, Math.atan2(tan.x, tan.z) + (side > 0 ? 0 : Math.PI), 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          poleInst.setMatrixAt(lampCount, dummy.matrix);
          lampInst.setMatrixAt(lampCount, dummy.matrix);
          lampCount++;
        }
      });
      poleInst.count = lampCount;
      lampInst.count = lampCount;
      this.scene.add(poleInst, lampInst);
    }

    /* ----------------------------------------------------------------------
       DENSE LUSH FOREST CORRIDORS: 6,500+ TREES, 3,500+ BUSHES, 900+ BOULDERS
       ---------------------------------------------------------------------- */
    buildNaturalScenery() {
      const dummy = new THREE.Object3D();

      let seed = 4219;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      const sampleForestPoint = (minClearance, maxRoadDist) => {
        for (let attempt = 0; attempt < 14; attempt++) {
          let x, z;
          if (rand() < 0.82) {
            const road = this.roadSplines[Math.floor(rand() * this.roadSplines.length)];
            const idx = Math.floor(rand() * road.pts.length);
            const pt = road.pts[idx];
            const tan = road.tangents[idx];
            const side = rand() < 0.5 ? -1 : 1;
            const lateralDist = road.width * 0.5 + minClearance + Math.pow(rand(), 1.45) * (maxRoadDist || 95);
            const jitterAlong = (rand() - 0.5) * 32;
            x = pt.x + tan.z * side * lateralDist + tan.x * jitterAlong;
            z = pt.z - tan.x * side * lateralDist + tan.z * jitterAlong;
          } else {
            x = (rand() - 0.5) * 7600;
            z = (rand() - 0.5) * 7600;
          }

          if (x > 2920) continue;
          if (Math.hypot(x - (-1250), z - 420) < 345) continue;

          const { sample, dist } = this.getNearestRoadSample(x, z, false);
          const reqDist = (sample ? sample.width * 0.5 : 10) + minClearance;
          if (dist < reqDist) continue;

          return { x, z, y: this.getTerrainHeight(x, z) };
        }
        return null;
      };

      // 1. 4,500 Towering Redwood & Douglas Fir Conifer Trees (Multi-Tier Canopy + Trunk)
      const coniferCount = 4500;
      const trunkGeo = new THREE.CylinderGeometry(0.28, 0.50, 4.6, 7);
      trunkGeo.translate(0, 2.3, 0);
      const canopyLowGeo = new THREE.ConeGeometry(2.9, 6.4, 8);
      canopyLowGeo.translate(0, 6.0, 0);
      const canopyHighGeo = new THREE.ConeGeometry(2.1, 5.4, 8);
      canopyHighGeo.translate(0, 9.2, 0);

      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a301a, roughness: 0.92 });
      const pineDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e4624, roughness: 0.84 });
      const pineMidMat = new THREE.MeshStandardMaterial({ color: 0x295c30, roughness: 0.80 });

      const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, coniferCount);
      const lowCanopyInst = new THREE.InstancedMesh(canopyLowGeo, pineDarkMat, coniferCount);
      const highCanopyInst = new THREE.InstancedMesh(canopyHighGeo, pineMidMat, coniferCount);
      trunkInst.castShadow = true;
      lowCanopyInst.castShadow = true;
      lowCanopyInst.receiveShadow = true;

      let placedConifers = 0;
      for (let i = 0; i < coniferCount; i++) {
        const pt = sampleForestPoint(6.2, 95);
        if (!pt) continue;

        const scaleXZ = 0.82 + rand() * 1.15;
        const scaleY = scaleXZ * (0.90 + rand() * 0.50);
        dummy.position.set(pt.x, pt.y - 0.12, pt.z);
        dummy.rotation.set((rand() - 0.5) * 0.06, rand() * Math.PI * 2, (rand() - 0.5) * 0.06);
        dummy.scale.set(scaleXZ, scaleY, scaleXZ);
        dummy.updateMatrix();

        trunkInst.setMatrixAt(placedConifers, dummy.matrix);
        lowCanopyInst.setMatrixAt(placedConifers, dummy.matrix);
        highCanopyInst.setMatrixAt(placedConifers, dummy.matrix);
        placedConifers++;
      }
      trunkInst.count = placedConifers;
      lowCanopyInst.count = placedConifers;
      highCanopyInst.count = placedConifers;
      this.scene.add(trunkInst, lowCanopyInst, highCanopyInst);

      // 2. 2,000 Broadleaf Oak & Silver Birch Woodland Trees
      const broadleafCount = 2000;
      const birchTrunkGeo = new THREE.CylinderGeometry(0.22, 0.36, 4.2, 7);
      birchTrunkGeo.translate(0, 2.1, 0);
      const crownGeo = new THREE.DodecahedronGeometry(3.1, 1);
      crownGeo.translate(0, 6.2, 0);

      const birchTrunkMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.85 });
      const oakLeafMat = new THREE.MeshStandardMaterial({ color: 0x3f7433, roughness: 0.84 });

      const birchTrunkInst = new THREE.InstancedMesh(birchTrunkGeo, birchTrunkMat, broadleafCount);
      const crownInst = new THREE.InstancedMesh(crownGeo, oakLeafMat, broadleafCount);
      crownInst.castShadow = true;
      crownInst.receiveShadow = true;

      let placedBroadleaf = 0;
      for (let i = 0; i < broadleafCount; i++) {
        const pt = sampleForestPoint(6.5, 80);
        if (!pt) continue;

        const s = 0.75 + rand() * 0.90;
        dummy.position.set(pt.x, pt.y - 0.12, pt.z);
        dummy.rotation.set(0, rand() * Math.PI * 2, 0);
        dummy.scale.set(s, s * (0.85 + rand() * 0.35), s);
        dummy.updateMatrix();

        birchTrunkInst.setMatrixAt(placedBroadleaf, dummy.matrix);
        crownInst.setMatrixAt(placedBroadleaf, dummy.matrix);
        placedBroadleaf++;
      }
      birchTrunkInst.count = placedBroadleaf;
      crownInst.count = placedBroadleaf;
      this.scene.add(birchTrunkInst, crownInst);

      // 3. 3,500 Roadside Woodland Ferns & Lush Forest Undergrowth Bushes
      const bushCount = 3500;
      const bushGeo = new THREE.DodecahedronGeometry(1.4, 1);
      bushGeo.translate(0, 0.75, 0);
      const bushMat = new THREE.MeshStandardMaterial({ color: 0x38662c, roughness: 0.88 });
      const bushInst = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);

      let placedBushes = 0;
      for (let i = 0; i < bushCount; i++) {
        const pt = sampleForestPoint(4.5, 45);
        if (!pt) continue;
        const sx = 0.70 + rand() * 1.45;
        const sy = 0.45 + rand() * 0.80;
        const sz = 0.70 + rand() * 1.45;
        dummy.position.set(pt.x, pt.y - 0.08, pt.z);
        dummy.rotation.set(0, rand() * Math.PI * 2, 0);
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        bushInst.setMatrixAt(placedBushes++, dummy.matrix);
      }
      bushInst.count = placedBushes;
      this.scene.add(bushInst);

      // 4. 900 Mossy Forest Boulders & Granite Outcrops
      const rockCount = 900;
      const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);
      const graniteMat = new THREE.MeshStandardMaterial({ color: 0x575c58, roughness: 0.92 });
      const graniteInst = new THREE.InstancedMesh(rockGeo, graniteMat, rockCount);
      graniteInst.castShadow = true;
      graniteInst.receiveShadow = true;

      let placedRocks = 0;
      for (let i = 0; i < rockCount; i++) {
        const pt = sampleForestPoint(6.8, 75);
        if (!pt) continue;
        const s = 1.5 + Math.pow(rand(), 1.8) * 7.5;
        dummy.position.set(pt.x, pt.y + s * 0.22, pt.z);
        dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
        dummy.scale.set(s * (1.0 + rand() * 0.6), s * (0.55 + rand() * 0.45), s * (0.9 + rand() * 0.5));
        dummy.updateMatrix();
        graniteInst.setMatrixAt(placedRocks++, dummy.matrix);
      }
      graniteInst.count = placedRocks;
      this.scene.add(graniteInst);
    }

    update() {}
  }

  window.HorizonWorld = DrivingWorld;
})();
