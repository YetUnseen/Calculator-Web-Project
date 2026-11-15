/* ==========================================================================
   BACKSEAT RALLY — 9KM x 9KM 5-STAGE MULTI-SURFACE OPEN WORLD (js/world.js)
   - Barycentric Triangle-Synchronized Terrain Height (0.000m Zero-Sink!)
   - Hardware-Scaled Foliage & Textures via graphicsProfile
   - 5 Distinct Backseat Rally Stage Biomes & Surface Physics:
     1. PINE FOREST STAGE       (GRAVEL — 16.0 km)
     2. ALPINE TIMBERLINE PASS  (TARMAC — 9.6 km)
     3. SAKURA BLOSSOM PASS     (TARMAC — 6.7 km + Cherry Blossom Corridors)
     4. RIVERBEND CANYON        (MUD    — 6.2 km + Canyon Water Splashes)
     5. FROZEN LAKE & SNOW PASS (SNOW   — 7.8 km + Iced Alpine Lake)
   - Real-Time Co-Driver Pacenote Analyzer (getUpcomingPacenote)
   - 12-Checkpoint Timed Rally Stages (getStageCheckpoints)
   ========================================================================== */

(function () {
  class DrivingWorld {
    constructor(scene, graphicsProfile) {
      this.scene = scene;
      this.gfx = Object.assign(
        { foliageMult: 1.0, anisotropy: 8, shadowMapSize: 2048 },
        graphicsProfile || {}
      );

      this.worldSize = 9000; // 9km x 9km (-4500m to +4500m)
      this.terrainSegs = 460;
      this.terrainCellSize = this.worldSize / this.terrainSegs;
      this.terrainVertexY = null;

      this.roadSplines = [];
      this.roadSamples = [];
      this.roadMaterials = [];

      // Fast 2D Spatial Hash Grid for O(1) road & pacenote queries
      this.gridCellSize = 95;
      this.spatialGrid = new Map();

      // 5 Backseat Rally Stage Definitions
      this.spawnLocations = [
        {
          id: 'coastal_start',
          splineId: 'main_loop',
          name: 'PINE FOREST STAGE',
          surface: 'GRAVEL',
          desc: 'Classic loose-gravel forest special stage framed by towering redwoods & rally tape.',
          x: 0,
          z: 0,
          heading: Math.PI,
          medalTimes: { platinum: 92, gold: 108, silver: 128, bronze: 155 }
        },
        {
          id: 'mountain_touge',
          splineId: 'mountain_touge',
          name: 'ALPINE TIMBERLINE PASS',
          surface: 'TARMAC',
          desc: 'Technical tarmac mountain switchbacks with blind crests & exposed cliffside drops.',
          x: -1180,
          z: -1120,
          heading: -Math.PI * 0.72,
          medalTimes: { platinum: 105, gold: 122, silver: 145, bronze: 175 }
        },
        {
          id: 'canyon_loop',
          splineId: 'canyon_route',
          name: 'SAKURA BLOSSOM PASS',
          surface: 'TARMAC',
          desc: 'Flowing cherry-blossom touge serpentine with pink petal canopies and fast sweepers.',
          x: -760,
          z: 820,
          heading: -Math.PI * 0.62,
          medalTimes: { platinum: 84, gold: 98, silver: 118, bronze: 145 }
        },
        {
          id: 'riverbend_canyon',
          splineId: 'riverbend_canyon',
          name: 'RIVERBEND CANYON',
          surface: 'MUD',
          desc: 'Loose muddy canyon trails, red sandstone walls & shallow riverbed water crossings.',
          x: 1550,
          z: 1850,
          heading: -Math.PI * 0.45,
          medalTimes: { platinum: 88, gold: 104, silver: 124, bronze: 150 }
        },
        {
          id: 'expressway',
          splineId: 'expressway',
          name: 'FROZEN LAKE & SNOW PASS',
          surface: 'SNOW',
          desc: 'Low-grip packed snow corridor & frozen alpine mirror lake for Scandinavian flicks.',
          x: 920,
          z: 3400,
          heading: Math.PI,
          medalTimes: { platinum: 76, gold: 90, silver: 108, bronze: 132 }
        }
      ];

      this.textures = this.generateRoadAndTerrainTextures();
      this.initRoadNetwork();
      this.buildTerrainMesh();
      this.buildRoadMeshes();
      this.buildBridgesAndGuardrails();
      this.buildRallyStageVillages();
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

      const dx = x - nearest.x;
      const dz = z - nearest.z;
      const rawAlong = dx * nearest.tangent.x + dz * nearest.tangent.z;
      const clampedAlong = Math.max(-6.5, Math.min(6.5, rawAlong));
      const interpolatedY = nearest.y + clampedAlong * nearest.slopeY;

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
       PROCEDURAL MULTI-SURFACE ROAD & TERRAIN TEXTURES (TARMAC/GRAVEL/MUD/SNOW)
       ---------------------------------------------------------------------- */
    generateRoadAndTerrainTextures() {
      const aniso = this.gfx.anisotropy || 8;

      const makeSurfaceTex = (opts) => {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d');

        ctx.fillStyle = opts.base;
        ctx.fillRect(0, 0, 512, 512);

        // Outer rally shoulder curbing or verge ruts
        if (opts.curbs) {
          for (let y = 0; y < 512; y += 32) {
            ctx.fillStyle = (y / 32) % 2 === 0 ? '#dc2626' : '#f8fafc';
            ctx.fillRect(0, y, 16, 32);
            ctx.fillRect(496, y, 16, 32);
          }
        } else {
          ctx.fillStyle = opts.vergeColor;
          ctx.fillRect(0, 0, 26, 512);
          ctx.fillRect(486, 0, 26, 512);
        }

        // Tire tracks / ruts
        ctx.fillStyle = opts.rutColor;
        ctx.fillRect(92, 0, 96, 512);
        ctx.fillRect(324, 0, 96, 512);

        // Granular aggregate / gravel pebbles / mud clumps / snow grains
        for (let i = 0; i < 24000; i++) {
          const px = 16 + Math.random() * 480;
          const py = Math.random() * 512;
          ctx.fillStyle = opts.grainFn();
          const sz = opts.grainSize || 2;
          ctx.fillRect(px, py, sz, sz);
        }

        // Road markings (Tarmac only gets crisp highway/touge lines; Gravel/Mud/Snow get worn tracks)
        if (opts.lines) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(28, 0, 8, 512);
          ctx.fillRect(476, 0, 8, 512);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(250, 0, 5, 512);
          for (let y = 16; y < 512; y += 88) {
            ctx.fillRect(259, y, 5, 48);
          }
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = aniso;
        return tex;
      };

      const tarmacTex = makeSurfaceTex({
        base: '#1f232b',
        curbs: true,
        rutColor: 'rgba(8,10,14,0.32)',
        lines: true,
        grainSize: 2,
        grainFn: () => {
          const v = 22 + Math.floor(Math.random() * 24);
          return `rgb(${v},${v + 2},${v + 5})`;
        }
      });

      const gravelTex = makeSurfaceTex({
        base: '#6b553e',
        curbs: false,
        vergeColor: '#4c3e2b',
        rutColor: 'rgba(56, 40, 26, 0.35)',
        lines: false,
        grainSize: 3,
        grainFn: () => {
          const r = 82 + Math.floor(Math.random() * 48);
          const g = 65 + Math.floor(Math.random() * 38);
          const b = 45 + Math.floor(Math.random() * 28);
          return `rgb(${r},${g},${b})`;
        }
      });

      const mudTex = makeSurfaceTex({
        base: '#4a3222',
        curbs: false,
        vergeColor: '#3a2417',
        rutColor: 'rgba(28, 17, 10, 0.48)',
        lines: false,
        grainSize: 3,
        grainFn: () => {
          const r = 52 + Math.floor(Math.random() * 34);
          const g = 34 + Math.floor(Math.random() * 24);
          const b = 22 + Math.floor(Math.random() * 18);
          return `rgb(${r},${g},${b})`;
        }
      });

      const snowTex = makeSurfaceTex({
        base: '#cbd5e1',
        curbs: false,
        vergeColor: '#e2e8f0',
        rutColor: 'rgba(100, 116, 139, 0.28)',
        lines: false,
        grainSize: 2,
        grainFn: () => {
          const v = 195 + Math.floor(Math.random() * 55);
          return `rgb(${v},${v + 4},${Math.min(255, v + 8)})`;
        }
      });

      // Compacted Shoulder Skirt Texture
      const skirtCanvas = document.createElement('canvas');
      skirtCanvas.width = 256;
      skirtCanvas.height = 256;
      const sctx = skirtCanvas.getContext('2d');
      const sGrad = sctx.createLinearGradient(0, 0, 256, 0);
      sGrad.addColorStop(0.0, '#4a4337');
      sGrad.addColorStop(0.4, '#3e4738');
      sGrad.addColorStop(1.0, '#2b4724');
      sctx.fillStyle = sGrad;
      sctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 6500; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const c = 45 + Math.floor(Math.random() * 38);
        sctx.fillStyle = `rgb(${c},${c + 6},${c - 4})`;
        sctx.fillRect(x, y, 2, 2);
      }
      const shoulderTex = new THREE.CanvasTexture(skirtCanvas);
      shoulderTex.wrapS = THREE.ClampToEdgeWrapping;
      shoulderTex.wrapT = THREE.RepeatWrapping;

      // Micro-Detail Forest Terrain Texture
      const terrCanvas = document.createElement('canvas');
      terrCanvas.width = 512;
      terrCanvas.height = 512;
      const tctx = terrCanvas.getContext('2d');
      tctx.fillStyle = '#cbd6c6';
      tctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 36000; i++) {
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

      return { tarmacTex, gravelTex, mudTex, snowTex, shoulderTex, terrainDetailTex };
    }

    setWetRoads(isWet) {
      this.roadMaterials.forEach((mat) => {
        const baseRough = mat.userData.baseRoughness !== undefined ? mat.userData.baseRoughness : 0.42;
        const baseMetal = mat.userData.baseMetalness !== undefined ? mat.userData.baseMetalness : 0.16;
        mat.roughness = isWet ? Math.max(0.10, baseRough * 0.35) : baseRough;
        mat.metalness = isWet ? Math.min(0.70, baseMetal + 0.42) : baseMetal;
        mat.needsUpdate = true;
      });
    }

    /* ----------------------------------------------------------------------
       MULTI-BIOME RALLY ELEVATION ACROSS 9KM x 9KM (ZERO SINKHOLES!)
       ---------------------------------------------------------------------- */
    getRawElevation(x, z) {
      const rawT = Math.min(1, Math.max(0, (Math.hypot(x, z) - 240) / 560));
      const startValley = rawT * rawT * (3 - 2 * rawT);

      // 1. North-West Alpine Timberline Peak (x ≈ -1850, z ≈ -1850)
      const nwDist = Math.hypot(x - (-1850), z - (-1850));
      const nwMountain =
        140 * Math.exp(-(nwDist * nwDist) / (1450 * 1450)) *
        (0.82 + 0.18 * Math.sin(x * 0.0028) * Math.cos(z * 0.0028));

      // 2. Northern Woodland Ridge (x ≈ -450, z ≈ -2750)
      const nRidgeDist = Math.hypot((x - (-450)) * 0.7, z - (-2750));
      const nRidge = 85 * Math.exp(-(nRidgeDist * nRidgeDist) / (1150 * 1150));

      // 3. South-West Sakura Highlands (x ≈ -1750, z ≈ +1750)
      const swDist = Math.hypot(x - (-1750), z - 1750);
      const swHighlands =
        68 * Math.exp(-(swDist * swDist) / (1500 * 1500)) *
        (0.75 + 0.25 * Math.sin(x * 0.0035) * Math.cos(z * 0.0035));

      // 4. Rolling terrain harmonics
      const hills =
        Math.sin(x * 0.0012) * Math.cos(z * 0.0012) * 18 +
        Math.sin(x * 0.0026 + 1.2) * Math.sin(z * 0.0024 + 0.6) * 7.5 +
        11.0;

      // 5. Frozen / Emerald Alpine Lake Basin at (x = -1250, z = +420)
      const lakeDist = Math.hypot(x - (-1250), z - 420);
      const lakeDepression = 18 * Math.exp(-(lakeDist * lakeDist) / (460 * 460));

      // 6. Shallow Ice Lake Basin along Northern Snow Corridor (x = 760, z = -1950)
      const iceDist = Math.hypot(x - 760, z - (-1950));
      const iceBasin = 14 * Math.exp(-(iceDist * iceDist) / (520 * 520));

      let h =
        (nwMountain + nRidge + swHighlands + hills) * startValley +
        6.5 -
        lakeDepression -
        iceBasin * 0.5;

      // 7. Two signature Pine Forest Stage Table-Top Rally Jump Crests!
      const j1 = Math.hypot(x - 0, z - (-135));
      h += 3.2 * Math.exp(-(j1 * j1) / (28 * 28));
      const j2 = Math.hypot(x - 45, z - (-310));
      h += 2.8 * Math.exp(-(j2 * j2) / (30 * 30));

      if (lakeDist < 420) {
        h = Math.max(5.98, h);
      }

      if (x > 2800) {
        h -= (x - 2800) * 0.022;
        h = Math.max(0.08, h);
      }

      return h;
    }

    /* ----------------------------------------------------------------------
       5 BACKSEAT RALLY STAGE NETWORKS (46.3 KM TOTAL)
       ---------------------------------------------------------------------- */
    initRoadNetwork() {
      // 1. PINE FOREST STAGE (Technical Loose-Gravel Rally Special Stage)
      const mainLoopWaypoints = [
        new THREE.Vector3(0, 0, 180),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -140),
        new THREE.Vector3(55, 0, -310),
        new THREE.Vector3(-65, 0, -490),
        new THREE.Vector3(120, 0, -690),
        new THREE.Vector3(310, 0, -960),
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
      this.buildSmoothRoadSpline('main_loop', mainLoopWaypoints, 12.5, true, 2400, 'GRAVEL');

      // 2. FROZEN LAKE & SNOW PASS (7.8 km Packed Snow & Ice Corridor)
      const snowPassWaypoints = [
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
      this.buildSmoothRoadSpline('expressway', snowPassWaypoints, 20, false, 1400, 'SNOW');

      // 3. ALPINE TIMBERLINE PASS (9.6 km High-Elevation Tarmac Touge)
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
      this.buildSmoothRoadSpline('mountain_touge', tougeWaypoints, 14, false, 1600, 'TARMAC');

      // 4. SAKURA BLOSSOM PASS (6.7 km Cherry Blossom Mountain Tarmac)
      const sakuraWaypoints = [
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
      this.buildSmoothRoadSpline('canyon_route', sakuraWaypoints, 14, false, 1300, 'TARMAC');

      // 5. RIVERBEND CANYON (6.2 km Mud & Canyon Gravel Rally Trail)
      const riverbendWaypoints = [
        new THREE.Vector3(1680, 0, 2760),
        new THREE.Vector3(1550, 0, 1850),
        new THREE.Vector3(1980, 0, 1280),
        new THREE.Vector3(1420, 0, 740),
        new THREE.Vector3(2150, 0, 240),
        new THREE.Vector3(1680, 0, -360),
        new THREE.Vector3(2280, 0, -860),
        new THREE.Vector3(2920, 0, -1250)
      ];
      this.buildSmoothRoadSpline('riverbend_canyon', riverbendWaypoints, 15, false, 1100, 'MUD');
    }

    buildSmoothRoadSpline(id, waypoints, width, closed, sampleCount, surfaceType) {
      waypoints.forEach((pt) => {
        pt.y = this.getRawElevation(pt.x, pt.z);
      });

      const curve = new THREE.CatmullRomCurve3(waypoints, closed, 'catmullrom', 0.48);
      const pts = curve.getSpacedPoints(sampleCount);

      for (let i = 0; i < pts.length; i++) {
        pts[i].y = this.getRawElevation(pts[i].x, pts[i].z);
      }

      // 24-pass vertical grade smoothing for silk-smooth crests and zero micro-bumps
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
          splineId: id,
          surfaceType: surfaceType || 'TARMAC',
          index: i,
          cumDist: totalLength
        };
        this.roadSamples.push(sample);
        this._insertRoadSampleIntoGrid(sample);
      }

      this.roadSplines.push({
        id,
        curve,
        width,
        closed,
        pts,
        tangents,
        length: totalLength,
        surfaceType: surfaceType || 'TARMAC'
      });
    }

    /* ----------------------------------------------------------------------
       REAL-TIME CO-DRIVER PACENOTE LOOKAHEAD ANALYZER (BACKSEAT RALLY CORE!)
       ---------------------------------------------------------------------- */
    getUpcomingPacenote(x, z, vx, vz) {
      const { sample, dist } = this.getNearestRoadSample(x, z, false);
      if (!sample || dist > 55) {
        return {
          severity: 'OFFROAD',
          dir: 'RECOVERY',
          callout: 'OFF TRACK • RETURN TO STAGE',
          distMeters: Math.round(dist),
          color: '#f97316',
          icon: '⚠️',
          urgent: true
        };
      }

      const road = this.roadSplines.find((r) => r.id === sample.splineId);
      if (!road || road.pts.length < 20) {
        return {
          severity: 'STRAIGHT',
          dir: 'STRAIGHT',
          callout: 'FLAT OUT • KEEP CENTER',
          distMeters: 100,
          color: '#38bdf8',
          icon: '↑',
          urgent: false
        };
      }

      const pts = road.pts;
      const n = pts.length;
      const startIdx = sample.index;

      // Determine travel direction along spline (+1 or -1)
      const tan = road.tangents[startIdx];
      const speedSq = vx * vx + vz * vz;
      let travelSign = 1;
      if (speedSq > 2.0) {
        const dot = vx * tan.x + vz * tan.z;
        travelSign = dot >= 0 ? 1 : -1;
      }

      const stepWrap = (idx) => {
        if (road.closed) return ((idx % n) + n) % n;
        return Math.max(0, Math.min(n - 1, idx));
      };

      // Scan ahead from ~40m to ~160m (~6 to ~26 sample indices depending on spacing)
      const avgStep = Math.max(3.5, road.length / n);
      const minOffset = Math.max(3, Math.round(35 / avgStep));
      const maxOffset = Math.max(12, Math.round(165 / avgStep));
      const windowSpan = Math.max(4, Math.round(28 / avgStep));

      let maxAbsAngle = 0;
      let signedPeakAngle = 0;
      let peakOffset = minOffset;
      let peakCrestDelta = 0;
      let crestOffset = -1;

      for (let off = minOffset; off <= maxOffset; off += 2) {
        const iA = stepWrap(startIdx + travelSign * Math.max(0, off - windowSpan));
        const iM = stepWrap(startIdx + travelSign * off);
        const iB = stepWrap(startIdx + travelSign * (off + windowSpan));

        if (!road.closed && (iB === iM || iA === iM)) break;

        const t1 = road.tangents[iA];
        const t2 = road.tangents[iB];
        const cross = t1.x * t2.z - t1.z * t2.x;
        const dotT = Math.max(-1, Math.min(1, t1.x * t2.x + t1.z * t2.z));
        // Travel direction reverses cross sign if going backwards
        const signedAngleRad = Math.atan2(cross * travelSign, dotT);
        const absAngleDeg = Math.abs(signedAngleRad) * (180 / Math.PI);

        if (absAngleDeg > maxAbsAngle) {
          maxAbsAngle = absAngleDeg;
          signedPeakAngle = signedAngleRad * (180 / Math.PI);
          peakOffset = off;
        }

        // Crest / Blind Brow check
        const slopeBefore = (pts[iM].y - pts[iA].y) / Math.max(5, pts[iM].distanceTo(pts[iA]));
        const slopeAfter = (pts[iB].y - pts[iM].y) / Math.max(5, pts[iB].distanceTo(pts[iM]));
        const crestDrop = slopeBefore - slopeAfter;
        if (crestDrop > 0.045 && crestDrop > peakCrestDelta) {
          peakCrestDelta = crestDrop;
          crestOffset = off;
        }
      }

      const distMeters = Math.max(15, Math.round((peakOffset * avgStep) / 5) * 5);
      // In our world tangent frame (X east, Z south), positive cross * travelSign
      // corresponds to turning LEFT vs RIGHT: check heading math!
      // heading += steer * dt where left -> +yawRate -> sin(heading) turns +X toward +Z when heading=0,
      // Wait: velocity forward = (sinH, cosH). Increasing H rotates (sinH, cosH) -> (cosH, -sinH), cross = sinH*(-sinH) - cosH*(cosH) = -1 (NEGATIVE cross = LEFT!).
      const isLeft = signedPeakAngle < 0;
      const dirWord = isLeft ? 'LEFT' : 'RIGHT';
      const iconArrow = isLeft ? '↰' : '↱';

      let severity = '6';
      let label = `6 ${dirWord}`;
      let color = '#22c55e';
      let urgent = false;

      if (maxAbsAngle >= 105) {
        severity = 'HAIRPIN';
        label = `HAIRPIN ${dirWord}`;
        color = '#ef4444';
        urgent = true;
      } else if (maxAbsAngle >= 75) {
        severity = 'SQUARE';
        label = `1 ${dirWord} • ACUTE`;
        color = '#ef4444';
        urgent = true;
      } else if (maxAbsAngle >= 54) {
        severity = '2';
        label = `2 ${dirWord}`;
        color = '#f97316';
        urgent = true;
      } else if (maxAbsAngle >= 36) {
        severity = '3';
        label = `3 ${dirWord}`;
        color = '#f59e0b';
        urgent = false;
      } else if (maxAbsAngle >= 21) {
        severity = '4';
        label = `4 ${dirWord}`;
        color = '#eab308';
        urgent = false;
      } else if (maxAbsAngle >= 11) {
        severity = '5';
        label = `5 ${dirWord}`;
        color = '#84cc16';
        urgent = false;
      } else if (peakCrestDelta > 0.05) {
        severity = 'CREST';
        label = 'CAUTION • CREST OVER BROW';
        color = '#fbbf24';
        return {
          severity,
          dir: 'CREST',
          callout: label,
          distMeters: Math.max(20, Math.round((crestOffset * avgStep) / 5) * 5),
          color,
          icon: '⟰',
          urgent: true
        };
      } else {
        return {
          severity: 'STRAIGHT',
          dir: 'STRAIGHT',
          callout: `${distMeters}M • FLAT OUT`,
          distMeters,
          color: '#38bdf8',
          icon: '↑',
          urgent: false
        };
      }

      if (peakCrestDelta > 0.05 && Math.abs(crestOffset - peakOffset) < 12) {
        label += ' • CREST';
      }

      return {
        severity,
        dir: dirWord,
        callout: `${label}`,
        distMeters,
        color,
        icon: severity === 'HAIRPIN' ? (isLeft ? '↶' : '↷') : iconArrow,
        urgent
      };
    }

    /* ----------------------------------------------------------------------
       POINT-TO-POINT RALLY STAGE CHECKPOINT GENERATOR (12 GATES PER STAGE)
       ---------------------------------------------------------------------- */
    getStageCheckpoints(stageId) {
      const stage = this.spawnLocations.find((s) => s.id === stageId) || this.spawnLocations[0];
      const road = this.roadSplines.find((r) => r.id === stage.splineId) || this.roadSplines[0];

      // Find closest spline index to stage spawn coordinate
      let bestIdx = 0;
      let bestDistSq = Infinity;
      for (let i = 0; i < road.pts.length; i++) {
        const dx = road.pts[i].x - stage.x;
        const dz = road.pts[i].z - stage.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestIdx = i;
        }
      }

      // Check travel orientation matching spawn heading
      const spawnDirX = Math.sin(stage.heading);
      const spawnDirZ = Math.cos(stage.heading);
      const tanAtSpawn = road.tangents[bestIdx];
      const dirSign = spawnDirX * tanAtSpawn.x + spawnDirZ * tanAtSpawn.z >= 0 ? 1 : -1;

      const totalPts = road.pts.length;
      const spanSamples = road.closed ? Math.floor(totalPts * 0.65) : Math.max(60, dirSign > 0 ? totalPts - 1 - bestIdx : bestIdx);
      const count = 12;
      const checkpoints = [];

      for (let c = 1; c <= count; c++) {
        const t = c / count;
        let idx = bestIdx + dirSign * Math.round(spanSamples * t);
        if (road.closed) {
          idx = ((idx % totalPts) + totalPts) % totalPts;
        } else {
          idx = Math.max(0, Math.min(totalPts - 1, idx));
        }
        const pt = road.pts[idx];
        const tan = road.tangents[idx];
        checkpoints.push({
          index: c,
          x: pt.x,
          y: this.getTerrainHeight(pt.x, pt.z),
          z: pt.z,
          heading: Math.atan2(tan.x * dirSign, tan.z * dirSign),
          radius: road.width * 0.95
        });
      }

      return { stage, checkpoints };
    }

    /* ----------------------------------------------------------------------
       EXACT BARYCENTRIC TRIANGLE HEIGHT ON THE RENDERED TERRAIN MESH
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

      let triY;
      if (fx + fz <= 1.0) {
        triY = y00 + fx * (y10 - y00) + fz * (y01 - y00);
      } else {
        triY = y11 + (1.0 - fx) * (y01 - y11) + (1.0 - fz) * (y10 - y11);
      }

      if (Math.hypot(x - (-1250), z - 420) < 332) {
        triY = Math.max(triY, 6.00);
      }
      if (x > 3140) {
        triY = Math.max(triY, 0.12);
      }

      return triY;
    }

    getTerrainHeight(x, z) {
      const meshY = this.getMeshTriangleHeight(x, z);
      const { sample, dist, interpolatedY } = this.getNearestRoadSample(x, z, false);
      if (!sample) return meshY;

      const halfW = sample.width * 0.5;
      const shoulderW = 7.5;

      if (dist <= halfW) {
        const crown = (1.0 - (dist / halfW) * (dist / halfW)) * 0.03;
        return Math.max(meshY, interpolatedY + 0.12 + crown);
      } else if (dist <= halfW + shoulderW) {
        const t = (dist - halfW) / shoulderW;
        const smoothT = t * t * (3 - 2 * t);
        const roadEdgeY = Math.max(meshY, interpolatedY + 0.10);
        return Math.max(meshY, roadEdgeY * (1 - smoothT) + meshY * smoothT);
      }
      return meshY;
    }

    getSurfaceInfo(x, z) {
      const { sample, dist } = this.getNearestRoadSample(x, z, false);
      if (sample && dist <= sample.width * 0.56) {
        return { surface: sample.surfaceType || 'TARMAC', roadDist: dist, sample, isWater: false };
      }
      if (Math.hypot(x - (-1250), z - 420) < 330 || x > 3150) {
        return { surface: 'OFFROAD', roadDist: dist, sample, isWater: true };
      }
      return { surface: 'OFFROAD', roadDist: dist, sample, isWater: false };
    }

    getZoneName(x, z) {
      if (Math.abs(x - 760) < 320 && (z > 400 || z < -500)) return 'FROZEN LAKE & SNOW PASS';
      if (x < -550 && z < -450) return 'ALPINE TIMBERLINE PASS';
      if (Math.hypot(x - (-1250), z - 420) < 620) return 'FROZEN EMERALD LAKE';
      if (x < -450 && z > 650) return 'SAKURA BLOSSOM PASS';
      if (x > 1250 && z > 150 && z < 2350) return 'RIVERBEND CANYON';
      return 'PINE FOREST STAGE';
    }

    /* ----------------------------------------------------------------------
       BUILD 9KM x 9KM MULTI-BIOME RALLY TERRAIN + FROZEN LAKE + OCEAN
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
      const cSakuraGrass = new THREE.Color(0x527a3c);
      const cCanyonSand = new THREE.Color(0x8c6244);
      const cSnowBlanket = new THREE.Color(0xdbeafe);
      const cGranitePeak = new THREE.Color(0x5a605d);
      const cSnowCap = new THREE.Color(0xf1f5f9);
      const cRoadShoulder = new THREE.Color(0x464136);
      const cShorePebble = new THREE.Color(0x9ca38f);
      const cTmp = new THREE.Color();

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

        cTmp.copy(cDeepForest);
        const patchNoise = 0.5 + 0.5 * Math.sin(vx * 0.0045) * Math.cos(vz * 0.0045);
        cTmp.lerp(cMossMeadow, patchNoise * 0.68);

        const elevFactor = Math.min(1, Math.max(0, (vy - 16) / 38));
        cTmp.lerp(cPineFloor, elevFactor * 0.65);

        // Sakura Pass (SW quadrant z > 700, x < -400): lush bright spring green
        if (vx < -400 && vz > 700) {
          cTmp.lerp(cSakuraGrass, 0.55);
        }

        // Riverbend Canyon (SE inner sector 1300..2600, -900..2500): warm reddish canyon earth
        const canyonDist = Math.hypot((vx - 1850) * 0.85, (vz - 850) * 0.55);
        if (canyonDist < 850) {
          cTmp.lerp(cCanyonSand, Math.max(0, 1 - canyonDist / 850) * 0.78);
        }

        // Snow Pass Winter Zone around expressway corridor (x ~ 500..1150) & alpine peaks
        const snowCorridorDist = Math.abs(vx - 760);
        if (snowCorridorDist < 260 && Math.abs(vz) > 450) {
          cTmp.lerp(cSnowBlanket, Math.max(0, 1 - snowCorridorDist / 260) * 0.85);
        }

        if (vy > 64) {
          cTmp.lerp(cGranitePeak, Math.min(1, (vy - 64) / 42));
        }
        if (vy > 106) {
          cTmp.lerp(cSnowCap, Math.min(0.92, (vy - 106) / 36));
        }

        const lakeShoreDist = Math.hypot(vx - (-1250), vz - 420);
        if (vx > 2720) {
          cTmp.lerp(cShorePebble, Math.min(1, (vx - 2720) / 420));
        } else if (lakeShoreDist < 420) {
          cTmp.lerp(cShorePebble, Math.max(0, 1 - Math.abs(lakeShoreDist - 320) / 100) * 0.72);
        }

        if (shoulderBlend > 0) {
          cTmp.lerp(cRoadShoulder, shoulderBlend * 0.72);
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

      // 1. Pacific Coastal Ocean along Eastern Edge (x > 3150)
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

      // 2. Emerald Alpine Mirror Lake at (-1250, 420)
      const lakeGeo = new THREE.CircleGeometry(330, 64);
      lakeGeo.rotateX(-Math.PI / 2);
      const lakeMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.06,
        metalness: 0.85,
        transparent: true,
        opacity: 0.84
      });
      const lake = new THREE.Mesh(lakeGeo, lakeMat);
      lake.position.set(-1250, 6.18, 420);
      this.scene.add(lake);
    }

    /* ----------------------------------------------------------------------
       BUILD MULTI-SURFACE 3D ROAD MESHES + EMBANKMENT SKIRTS
       ---------------------------------------------------------------------- */
    buildRoadMeshes() {
      const makeRoadMat = (tex, roughness, metalness) => {
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          bumpMap: tex,
          bumpScale: 0.045,
          roughness: roughness,
          metalness: metalness,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -3
        });
        mat.userData = { baseRoughness: roughness, baseMetalness: metalness };
        this.roadMaterials.push(mat);
        return mat;
      };

      const surfaceMats = {
        TARMAC: makeRoadMat(this.textures.tarmacTex, 0.42, 0.16),
        GRAVEL: makeRoadMat(this.textures.gravelTex, 0.86, 0.04),
        MUD: makeRoadMat(this.textures.mudTex, 0.56, 0.22),
        SNOW: makeRoadMat(this.textures.snowTex, 0.34, 0.32)
      };

      const skirtMat = new THREE.MeshStandardMaterial({
        map: this.textures.shoulderTex,
        roughness: 0.88,
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

        const positions = [];
        const indices = [];
        const uvs = [];

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
          const lz = p.z + leftZ * halfW;
          const rx = p.x - leftX * halfW;
          const rz = p.z - leftZ * halfW;

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
            skirtIdx.push(sb, sb + 4, sb + 1, sb + 1, sb + 4, sb + 5);
            skirtIdx.push(sb + 2, sb + 3, sb + 6, sb + 3, sb + 7, sb + 6);
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();

        const mat = surfaceMats[road.surfaceType] || surfaceMats.TARMAC;
        const mesh = new THREE.Mesh(geo, mat);
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
       GUARDRAILS, RED/WHITE RALLY BARRIER TAPE, DELINEATORS & LAMPS
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

      // 1. Reflective Road Studs along Tarmac Touge & Snow Passes
      const dummy = new THREE.Object3D();
      const studGeo = new THREE.BoxGeometry(0.18, 0.045, 0.18);
      const studMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const studInst = new THREE.InstancedMesh(studGeo, studMat, 1800);
      let studCount = 0;

      this.roadSplines.forEach((road) => {
        if (road.surfaceType !== 'TARMAC') return;
        for (let i = 0; i < road.pts.length; i += 3) {
          if (studCount >= 1800) break;
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

      // 2. Rally Course Red/White Shoulder Posts & Delineators along ALL 5 Stages
      const postGeo = new THREE.BoxGeometry(0.14, 1.05, 0.10);
      postGeo.translate(0, 0.52, 0);
      const postMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0xef4444,
        emissiveIntensity: 0.42,
        roughness: 0.3
      });
      const postInst = new THREE.InstancedMesh(postGeo, postMat, 2200);
      let postCount = 0;

      this.roadSplines.forEach((road) => {
        const off = road.width * 0.5 + 1.15;
        for (let i = 4; i < road.pts.length - 4; i += 7) {
          if (postCount >= 2200) break;
          const p = road.pts[i];
          const tan = road.tangents[i];
          [-1, 1].forEach((side) => {
            if (postCount >= 2200) return;
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

      // 3. Highway Flood Lamps on Tarmac & Snow Passes
      const poleGeo = new THREE.CylinderGeometry(0.14, 0.22, 9.5, 8);
      poleGeo.translate(0, 4.75, 0);
      const lampGeo = new THREE.BoxGeometry(1.5, 0.22, 0.48);
      lampGeo.translate(0, 9.5, 0);

      const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });
      const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });

      const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, 280);
      const lampInst = new THREE.InstancedMesh(lampGeo, lampMat, 280);
      let lampCount = 0;

      [this.roadSplines[0], this.roadSplines[1]].forEach((road) => {
        if (!road) return;
        const sideOffset = road.width * 0.5 + 2.1;
        for (let i = 8; i < road.pts.length - 8; i += 28) {
          if (lampCount >= 280) break;
          const p = road.pts[i];
          const tan = road.tangents[i];
          const side = (i / 28) % 2 === 0 ? 1 : -1;
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
       3D RALLY STAGE START GANTRY VILLAGES, TENTS, BALES, TAPE & SPECTATORS
       ---------------------------------------------------------------------- */
    buildRallyStageVillages() {
      // Procedural canvas banner for the overhead truss gantry
      const bannerCanvas = document.createElement('canvas');
      bannerCanvas.width = 512;
      bannerCanvas.height = 128;
      const bctx = bannerCanvas.getContext('2d');
      bctx.fillStyle = '#0f172a';
      bctx.fillRect(0, 0, 512, 128);
      bctx.fillStyle = '#f97316';
      bctx.fillRect(0, 0, 512, 18);
      bctx.fillRect(0, 110, 512, 18);
      bctx.fillStyle = '#facc15';
      bctx.font = 'bold 42px sans-serif';
      bctx.fillText('BACKSEAT RALLY // START', 24, 78);
      const bannerTex = new THREE.CanvasTexture(bannerCanvas);

      // Red/white checkered rally tape texture
      const tapeCanvas = document.createElement('canvas');
      tapeCanvas.width = 256;
      tapeCanvas.height = 32;
      const tctx = tapeCanvas.getContext('2d');
      for (let x = 0; x < 256; x += 32) {
        tctx.fillStyle = (x / 32) % 2 === 0 ? '#ef4444' : '#f8fafc';
        tctx.fillRect(x, 0, 32, 32);
      }
      const tapeTex = new THREE.CanvasTexture(tapeCanvas);
      tapeTex.wrapS = THREE.RepeatWrapping;
      tapeTex.repeat.set(16, 1);

      const trussMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.75, roughness: 0.3 });
      const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex });
      const tapeMat = new THREE.MeshBasicMaterial({ map: tapeTex, side: THREE.DoubleSide });
      const baleMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.92 });
      const tentRoofMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.65 });
      const tentWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
      const lampRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const lampGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

      const dummy = new THREE.Object3D();
      const specGeo = new THREE.BoxGeometry(0.46, 1.55, 0.34);
      specGeo.translate(0, 0.78, 0);
      const specMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.8 });
      const specHeadGeo = new THREE.SphereGeometry(0.18, 7, 7);
      specHeadGeo.translate(0, 1.72, 0);
      const specHeadMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 });

      const totalSpecsMax = 320;
      const specBodyInst = new THREE.InstancedMesh(specGeo, specMat, totalSpecsMax);
      const specHeadInst = new THREE.InstancedMesh(specHeadGeo, specHeadMat, totalSpecsMax);
      const palette = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0xf97316, 0xe2e8f0];
      const tempCol = new THREE.Color();
      let specCount = 0;

      this.spawnLocations.forEach((stage) => {
        const road = this.roadSplines.find((r) => r.id === stage.splineId) || this.roadSplines[0];
        const halfW = (road ? road.width * 0.5 : 7.0) + 1.4;
        const baseY = this.getTerrainHeight(stage.x, stage.z);

        const village = new THREE.Group();
        village.position.set(stage.x, baseY, stage.z);
        village.rotation.y = stage.heading;

        // 1. Overhead Rally Start Truss Gantry Arch
        const towerGeo = new THREE.BoxGeometry(0.65, 6.2, 0.65);
        [-halfW, halfW].forEach((tx) => {
          const tower = new THREE.Mesh(towerGeo, trussMat);
          tower.position.set(tx, 3.1, 4.0);
          tower.castShadow = true;
          village.add(tower);
        });

        const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2 + 1.4, 1.35, 0.65), trussMat);
        crossBeam.position.set(0, 5.75, 4.0);
        crossBeam.castShadow = true;
        village.add(crossBeam);

        const frontSign = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 1.9, 1.25), bannerMat);
        frontSign.position.set(0, 5.75, 4.35);
        village.add(frontSign);

        const backSign = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 1.9, 1.25), bannerMat);
        backSign.position.set(0, 5.75, 3.65);
        backSign.rotation.y = Math.PI;
        village.add(backSign);

        // 5 Starting Countdown Lights on Gantry
        for (let l = -2; l <= 2; l++) {
          const lightOrb = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 10, 10),
            l === 2 ? lampGreenMat : lampRedMat
          );
          lightOrb.position.set(l * 0.95, 4.82, 4.0);
          village.add(lightOrb);
        }

        // 2. Twin Rally Service Park Canopies & Timing Tent beside Start Line
        [-halfW - 4.2, halfW + 4.2].forEach((sideX, idx) => {
          const canopyGroup = new THREE.Group();
          canopyGroup.position.set(sideX, 0, -6 + idx * 9);
          const pole = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.5, 3.4), tentWhiteMat);
          pole.position.y = 1.25;
          const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.25, 4), tentRoofMat);
          roof.position.y = 3.05;
          roof.rotation.y = Math.PI * 0.25;
          canopyGroup.add(pole, roof);
          village.add(canopyGroup);
        });

        // 3. Round Gold Hay Bales along outer start chute shoulders
        const baleGeo = new THREE.CylinderGeometry(0.68, 0.68, 1.05, 10);
        baleGeo.rotateZ(Math.PI * 0.5);
        for (let b = 0; b < 6; b++) {
          [-halfW - 0.5, halfW + 0.5].forEach((bx) => {
            const bale = new THREE.Mesh(baleGeo, baleMat);
            bale.position.set(bx, 0.58, 12 + b * 11);
            bale.rotation.y = (b % 2) * 0.2;
            village.add(bale);
          });
        }

        // 4. Red/White Rally Barrier Tape Ribbons flanking the first 85m
        const tapeGeo = new THREE.PlaneGeometry(85, 0.24);
        tapeGeo.rotateY(Math.PI * 0.5);
        [-halfW - 0.6, halfW + 0.6].forEach((rx) => {
          const ribbon = new THREE.Mesh(tapeGeo, tapeMat);
          ribbon.position.set(rx, 0.92, 42);
          village.add(ribbon);
        });

        this.scene.add(village);

        // 5. Stylized Low-Poly Spectator Crowds behind barrier tape
        const sinH = Math.sin(stage.heading);
        const cosH = Math.cos(stage.heading);
        for (let s = 0; s < 56; s++) {
          if (specCount >= totalSpecsMax) break;
          const side = s % 2 === 0 ? -1 : 1;
          const localX = side * (halfW + 1.8 + (s % 4) * 0.85);
          const localZ = -4 + Math.floor(s / 2) * 3.1;
          const wx = stage.x + localX * cosH + localZ * sinH;
          const wz = stage.z - localX * sinH + localZ * cosH;
          const wy = this.getTerrainHeight(wx, wz);

          dummy.position.set(wx, wy, wz);
          dummy.rotation.set(0, stage.heading + (side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5), 0);
          const sc = 0.88 + (s % 5) * 0.06;
          dummy.scale.set(sc, sc, sc);
          dummy.updateMatrix();
          specBodyInst.setMatrixAt(specCount, dummy.matrix);
          specHeadInst.setMatrixAt(specCount, dummy.matrix);
          tempCol.setHex(palette[s % palette.length]);
          if (specBodyInst.setColorAt) specBodyInst.setColorAt(specCount, tempCol);
          specCount++;
        }
      });

      specBodyInst.count = specCount;
      specHeadInst.count = specCount;
      if (specBodyInst.instanceColor) specBodyInst.instanceColor.needsUpdate = true;
      this.scene.add(specBodyInst, specHeadInst);
    }

    /* ----------------------------------------------------------------------
       HARDWARE-SCALED BIOME FOLIAGE: PINES, SAKURA BLOSSOMS, BUSHES & ROCKS
       ---------------------------------------------------------------------- */
    buildNaturalScenery() {
      this.sceneryInstanced = [];
      const dummy = new THREE.Object3D();

      let seed = 4219;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      const sampleForestPoint = (minClearance, maxRoadDist, specificSpline) => {
        for (let attempt = 0; attempt < 14; attempt++) {
          let x, z;
          if (specificSpline) {
            const idx = Math.floor(rand() * specificSpline.pts.length);
            const pt = specificSpline.pts[idx];
            const tan = specificSpline.tangents[idx];
            const side = rand() < 0.5 ? -1 : 1;
            const lateralDist = specificSpline.width * 0.5 + minClearance + Math.pow(rand(), 1.35) * (maxRoadDist || 55);
            const jitterAlong = (rand() - 0.5) * 28;
            x = pt.x + tan.z * side * lateralDist + tan.x * jitterAlong;
            z = pt.z - tan.x * side * lateralDist + tan.z * jitterAlong;
          } else if (rand() < 0.82) {
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

      // 1. Towering Conifers & Frosted Pines
      const coniferCount = 4200;
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
      this.sceneryInstanced.push(
        { mesh: trunkInst, maxCount: placedConifers, shadow: true },
        { mesh: lowCanopyInst, maxCount: placedConifers, shadow: true },
        { mesh: highCanopyInst, maxCount: placedConifers, shadow: false }
      );

      // 2. Broadleaf Oaks & Birch Trees
      const broadleafCount = 1600;
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
      this.sceneryInstanced.push(
        { mesh: birchTrunkInst, maxCount: placedBroadleaf, shadow: false },
        { mesh: crownInst, maxCount: placedBroadleaf, shadow: true }
      );

      // 3. Vibrant Pink SAKURA CHERRY BLOSSOM Trees along Sakura Blossom Pass (canyon_route)
      const sakuraSpline = this.roadSplines.find((r) => r.id === 'canyon_route');
      const sakuraCount = 750;
      const sakuraTrunkMat = new THREE.MeshStandardMaterial({ color: 0x452b22, roughness: 0.9 });
      const sakuraCrownMat = new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        emissive: 0xdb2777,
        emissiveIntensity: 0.14,
        roughness: 0.75
      });
      const sakuraTrunkInst = new THREE.InstancedMesh(birchTrunkGeo, sakuraTrunkMat, sakuraCount);
      const sakuraCrownInst = new THREE.InstancedMesh(crownGeo, sakuraCrownMat, sakuraCount);
      sakuraCrownInst.castShadow = true;

      let placedSakura = 0;
      for (let i = 0; i < sakuraCount; i++) {
        const pt = sampleForestPoint(5.2, 55, sakuraSpline);
        if (!pt) continue;
        const s = 0.8 + rand() * 0.85;
        dummy.position.set(pt.x, pt.y - 0.12, pt.z);
        dummy.rotation.set(0, rand() * Math.PI * 2, 0);
        dummy.scale.set(s, s * (0.82 + rand() * 0.32), s);
        dummy.updateMatrix();
        sakuraTrunkInst.setMatrixAt(placedSakura, dummy.matrix);
        sakuraCrownInst.setMatrixAt(placedSakura, dummy.matrix);
        placedSakura++;
      }
      sakuraTrunkInst.count = placedSakura;
      sakuraCrownInst.count = placedSakura;
      this.scene.add(sakuraTrunkInst, sakuraCrownInst);
      this.sceneryInstanced.push(
        { mesh: sakuraTrunkInst, maxCount: placedSakura, shadow: false },
        { mesh: sakuraCrownInst, maxCount: placedSakura, shadow: true }
      );

      // 4. Roadside Undergrowth Ferns & Bushes
      const bushCount = 3000;
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
      this.sceneryInstanced.push({ mesh: bushInst, maxCount: placedBushes, shadow: false });

      // 5. Mossy Forest Boulders & Canyon Sandstone Outcrops
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
      this.sceneryInstanced.push({ mesh: graniteInst, maxCount: placedRocks, shadow: true });

      this.setGraphicsProfile(this.gfx);
    }

    setGraphicsProfile(profile) {
      if (profile) {
        this.gfx = Object.assign({}, this.gfx || {}, profile);
      }
      const mult = Math.max(0.1, Math.min(1.0, (this.gfx && this.gfx.foliageMult) || 0.75));
      const shadows = !!(this.gfx && this.gfx.shadowsEnabled);
      if (this.sceneryInstanced) {
        for (let i = 0; i < this.sceneryInstanced.length; i++) {
          const entry = this.sceneryInstanced[i];
          entry.mesh.count = Math.max(0, Math.floor(entry.maxCount * mult));
          if (entry.shadow) {
            entry.mesh.castShadow = shadows;
          }
        }
      }
    }

    update() {}
  }

  window.HorizonWorld = DrivingWorld;
})();
