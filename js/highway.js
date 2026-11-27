/* ==========================================================================
   HIGHWAY ENVIRONMENT — SEAMLESS ENDLESS MULTI-LANE HIGHWAY & HORIZON
   - Smooth curvilinear coordinates (s, d) with local-tangent projection
   - Continuous seam-free 4-lane carriageway, shoulders, Jersey median & rail
   - Opposite 3-lane carriageway with ambient oncoming traffic
   - Pooled InstancedMesh streetlights, guardrail posts, gantries, signs & trees
   - 3 Lighting Presets: Afternoon, Sunset, Dusk
   ========================================================================== */

(function (root) {
  'use strict';

  const LANE_WIDTH = 3.7;
  const LANE_CENTERS = [-5.55, -1.85, 1.85, 5.55];
  const OPP_LANE_CENTERS = [-14.3, -18.0, -21.7];

  const ROAD_MIN_D = -9.5;
  const ROAD_MAX_D = 10.5;
  const ROAD_WIDTH = ROAD_MAX_D - ROAD_MIN_D; // 20.0m

  const OPP_MIN_D = -25.8;
  const OPP_MAX_D = -10.5;
  const OPP_WIDTH = OPP_MAX_D - OPP_MIN_D; // 15.3m

  const MEDIAN_CENTER_D = -10.0;
  const RIGHT_RAIL_D = 10.75;

  const STEP = 4.0;
  const ROW_BEHIND = 40; // 160m behind player
  const ROW_AHEAD = 175; // 700m ahead of player
  const NUM_ROWS = ROW_BEHIND + ROW_AHEAD + 1; // 216 rows
  const TEX_LEN = 24.0; // 6 * STEP (exact multiple of STEP = 4m)

  const WEATHER_PRESETS = [
    {
      id: 'afternoon',
      name: 'Afternoon',
      skyTop: 0x2563eb,
      skyHorizon: 0xbfe0f7,
      fogColor: 0xb9daef,
      fogNear: 195,
      fogFar: 575,
      sunColor: 0xfff8e7,
      sunIntensity: 1.45,
      hemiSky: 0xdbeafe,
      hemiGround: 0x475548,
      hemiIntensity: 0.92,
      ambientColor: 0x9fb8d4,
      ambientIntensity: 0.45,
      sunDir: [0.42, 0.72, -0.55],
      mountainColor: 0x7c97b0,
      headlightStrength: 0.08,
      lampGlow: 0x475569,
      cloudTint: 0xffffff,
      cloudAlpha: 0.34,
      starAlpha: 0.0,
      precip: 'none',
      wetRoad: false,
      snowy: false,
      isNight: false,
      grip: 1.0,
      weatherMult: 1.0
    },
    {
      id: 'sunset',
      name: 'Sunset',
      skyTop: 0x1e2b58,
      skyHorizon: 0xf59e6c,
      fogColor: 0xe29972,
      fogNear: 175,
      fogFar: 545,
      sunColor: 0xffb36b,
      sunIntensity: 1.55,
      hemiSky: 0xfdba74,
      hemiGround: 0x3b2f38,
      hemiIntensity: 0.78,
      ambientColor: 0x8b6e7f,
      ambientIntensity: 0.42,
      sunDir: [0.62, 0.19, -0.76],
      mountainColor: 0x6a5768,
      headlightStrength: 0.65,
      lampGlow: 0xffd27d,
      cloudTint: 0xffd1b0,
      cloudAlpha: 0.28,
      starAlpha: 0.15,
      precip: 'none',
      wetRoad: false,
      snowy: false,
      isNight: false,
      grip: 1.0,
      weatherMult: 1.05
    },
    {
      id: 'dusk',
      name: 'Night',
      skyTop: 0x050914,
      skyHorizon: 0x182548,
      fogColor: 0x131d38,
      fogNear: 155,
      fogFar: 495,
      sunColor: 0x9cb4ff,
      sunIntensity: 0.42,
      hemiSky: 0x3b4d7c,
      hemiGround: 0x141824,
      hemiIntensity: 0.56,
      ambientColor: 0x2c3858,
      ambientIntensity: 0.44,
      sunDir: [-0.45, 0.26, -0.85],
      mountainColor: 0x172038,
      headlightStrength: 1.0,
      lampGlow: 0xffd98a,
      cloudTint: 0x455885,
      cloudAlpha: 0.14,
      starAlpha: 0.90,
      precip: 'none',
      wetRoad: false,
      snowy: false,
      isNight: true,
      grip: 1.0,
      weatherMult: 1.15
    },
    {
      id: 'rain',
      name: 'Rain',
      skyTop: 0x354759,
      skyHorizon: 0x7b8d9e,
      fogColor: 0x738494,
      fogNear: 115,
      fogFar: 420,
      sunColor: 0xcbd5e1,
      sunIntensity: 0.85,
      hemiSky: 0x94a3b8,
      hemiGround: 0x334155,
      hemiIntensity: 0.78,
      ambientColor: 0x64748b,
      ambientIntensity: 0.50,
      sunDir: [0.30, 0.55, -0.60],
      mountainColor: 0x526170,
      headlightStrength: 0.72,
      lampGlow: 0xffe099,
      cloudTint: 0x64748b,
      cloudAlpha: 0.52,
      starAlpha: 0.0,
      precip: 'rain',
      wetRoad: true,
      snowy: false,
      isNight: false,
      grip: 0.78,
      weatherMult: 1.25
    },
    {
      id: 'night_rain',
      name: 'Night Rain',
      skyTop: 0x070b17,
      skyHorizon: 0x1e2942,
      fogColor: 0x172036,
      fogNear: 95,
      fogFar: 385,
      sunColor: 0x7c93c4,
      sunIntensity: 0.48,
      hemiSky: 0x334166,
      hemiGround: 0x111521,
      hemiIntensity: 0.58,
      ambientColor: 0x293552,
      ambientIntensity: 0.45,
      sunDir: [-0.35, 0.35, -0.80],
      mountainColor: 0x151c2e,
      headlightStrength: 1.0,
      lampGlow: 0xffe29a,
      cloudTint: 0x2a3652,
      cloudAlpha: 0.35,
      starAlpha: 0.0,
      precip: 'rain',
      wetRoad: true,
      snowy: false,
      isNight: true,
      grip: 0.75,
      weatherMult: 1.35
    },
    {
      id: 'snow',
      name: 'Snow',
      skyTop: 0x7a90a8,
      skyHorizon: 0xd5e1eb,
      fogColor: 0xcad8e4,
      fogNear: 110,
      fogFar: 410,
      sunColor: 0xf1f5f9,
      sunIntensity: 1.05,
      hemiSky: 0xe2e8f0,
      hemiGround: 0x94a3b8,
      hemiIntensity: 0.95,
      ambientColor: 0xb0c2d4,
      ambientIntensity: 0.58,
      sunDir: [0.32, 0.58, -0.62],
      mountainColor: 0x9badbf,
      headlightStrength: 0.70,
      lampGlow: 0xffe6a6,
      cloudTint: 0xe2e8f0,
      cloudAlpha: 0.45,
      starAlpha: 0.0,
      precip: 'snow',
      wetRoad: false,
      snowy: true,
      isNight: false,
      grip: 0.56,
      weatherMult: 1.40
    }
  ];
  const LIGHTING_PRESETS = WEATHER_PRESETS;

  const RADAR_FIRST_S = 1850;
  const RADAR_STEP = 2850;
  const RADAR_WARN_DIST = 380;
  const RADAR_LIMITS_KMH = [110, 130, 100, 120, 90, 140];

  const HAZARD_FIRST_S = 680;
  const HAZARD_STEP = 1120;

  function getRadarBySlot(slot) {
    const k = Math.max(0, Math.floor(slot || 0));
    const jitter = k === 0 ? 0 : Math.round((hash01(k * 17.3 + 5.1) - 0.5) * 600);
    const radarS = RADAR_FIRST_S + k * RADAR_STEP + jitter;
    const limitKmh = RADAR_LIMITS_KMH[k % RADAR_LIMITS_KMH.length];
    return { slot: k, radarS, limitKmh };
  }

  function getRadarInfo(s) {
    const currS = s || 0;
    let slot = currS <= RADAR_FIRST_S - 400 ? 0 : Math.max(0, Math.floor((currS - RADAR_FIRST_S) / RADAR_STEP) - 1);
    let info = getRadarBySlot(slot);
    while (info.radarS < currS) {
      slot++;
      info = getRadarBySlot(slot);
    }
    const distToRadar = info.radarS - currS;
    return {
      slot: info.slot,
      radarS: info.radarS,
      distToRadar,
      limitKmh: info.limitKmh,
      nearby: distToRadar <= RADAR_WARN_DIST
    };
  }

  function getShoulderHazardBySlot(slot) {
    const k = Math.max(0, Math.floor(slot || 0));
    const jitter = Math.round((hash01(k * 29.7 + 3.4) - 0.5) * 260);
    let hazardS = HAZARD_FIRST_S + k * HAZARD_STEP + jitter;
    const nearRadar = getRadarInfo(Math.max(0, hazardS - 200));
    if (nearRadar && Math.abs(hazardS - nearRadar.radarS) < 180) {
      hazardS += 240;
    }
    return { slot: k, hazardS, d: 8.72, length: 4.65, width: 1.86 };
  }

  function getShoulderHazardInfo(s) {
    const currS = s || 0;
    let slot =
      currS <= HAZARD_FIRST_S - 260
        ? 0
        : Math.max(0, Math.floor((currS - HAZARD_FIRST_S) / HAZARD_STEP) - 1);
    let info = getShoulderHazardBySlot(slot);
    while (info.hazardS < currS - 12) {
      slot++;
      info = getShoulderHazardBySlot(slot);
    }
    return {
      slot: info.slot,
      hazardS: info.hazardS,
      distToHazard: info.hazardS - currS,
      d: info.d,
      length: info.length,
      width: info.width
    };
  }

  // Pure curvilinear highway math (deterministic, C-infinity smooth, zero seams)
  function getCurvature(s) {
    return (
      0.00155 * Math.sin(s * 0.0022) +
      0.00105 * Math.sin(s * 0.0047 + 1.1) +
      0.00068 * Math.sin(s * 0.0083 + 2.4) +
      0.00032 * Math.sin(s * 0.0131 + 0.6)
    );
  }

  function getHeading(s) {
    return (
      (-0.00155 / 0.0022) * Math.cos(s * 0.0022) +
      (-0.00105 / 0.0047) * Math.cos(s * 0.0047 + 1.1) +
      (-0.00068 / 0.0083) * Math.cos(s * 0.0083 + 2.4) +
      (-0.00032 / 0.0131) * Math.cos(s * 0.0131 + 0.6)
    );
  }

  function getElevation(s) {
    return (
      3.4 * Math.sin(s * 0.0022) +
      1.7 * Math.sin(s * 0.0041 + 0.9)
    );
  }

  function getSlope(s) {
    return (
      3.4 * 0.0022 * Math.cos(s * 0.0022) +
      1.7 * 0.0041 * Math.cos(s * 0.0041 + 0.9)
    );
  }

  function hash01(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  function smoothstep(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Subtle biome color interpolation every ~3.2 km (no jarring biome seams)
  const BIOME_COLORS = [
    { grass: [0.27, 0.37, 0.21], hill: [0.32, 0.39, 0.25] }, // Valley Foothills
    { grass: [0.36, 0.38, 0.24], hill: [0.42, 0.40, 0.29] }, // Coastal Bluffs
    { grass: [0.45, 0.39, 0.28], hill: [0.50, 0.40, 0.30] }, // High Mesa
    { grass: [0.24, 0.35, 0.23], hill: [0.29, 0.37, 0.26] }  // Green Outskirts
  ];

  function getBiomeTint(s, distOut) {
    const segLen = 3200;
    const u = Math.max(0, s) / segLen;
    const idx0 = Math.floor(u) % BIOME_COLORS.length;
    const idx1 = (idx0 + 1) % BIOME_COLORS.length;
    const frac = u - Math.floor(u);
    const blend = smoothstep(0.7, 1.0, frac);
    const b0 = BIOME_COLORS[idx0];
    const b1 = BIOME_COLORS[idx1];
    const hFactor = Math.min(1, distOut / 110);
    return [
      lerp(lerp(b0.grass[0], b1.grass[0], blend), lerp(b0.hill[0], b1.hill[0], blend), hFactor),
      lerp(lerp(b0.grass[1], b1.grass[1], blend), lerp(b0.hill[1], b1.hill[1], blend), hFactor),
      lerp(lerp(b0.grass[2], b1.grass[2], blend), lerp(b0.hill[2], b1.hill[2], blend), hFactor)
    ];
  }

  function terrainHeightOffset(s, d) {
    const absD = d >= 0 ? d - 11.0 : -d - 26.0;
    if (absD <= 1.5) return -0.22;
    const fade = Math.min(1, (absD - 1.5) / 28);
    const wave =
      Math.sin(s * 0.011 + d * 0.032) * 3.8 +
      Math.cos(s * 0.023 - d * 0.021) * 2.1 +
      Math.sin(s * 0.0055 + 1.4) * 4.2;
    return -0.22 + fade * (0.45 + Math.max(-0.5, wave) * (0.4 + 0.6 * fade));
  }

  class HighwayEnvironment {
    constructor(scene, gfxProfile) {
      this.scene = scene;
      this.gfx = gfxProfile || { anisotropy: 4, foliageMult: 0.78, shadowsEnabled: true };

      this.lightingIndex = 0;
      this.lastBaseIdx = null;
      this.s0 = 0;

      // Local tangent LUT relative to player s0
      this.lutStartS = 0;
      this.lutX = new Float32Array(NUM_ROWS);
      this.lutY = new Float32Array(NUM_ROWS);
      this.lutZ = new Float32Array(NUM_ROWS);
      this.lutYaw = new Float32Array(NUM_ROWS);

      this.tempObj = new THREE.Object3D();
      this.tempVec = new THREE.Vector3();
      this.projOut = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };

      this.initSkyAndFog();
      this.initRoadTextures();
      this.initRoadRibbons();
      this.initRoadsideProps();
      this.initGantriesAndSigns();
      this.radarFlashes = {};
      this.initRadars();
      this.initShoulderHazards();
      this.initCurveChevrons();
      this.initFoliage();
      this.initPrecipitation();
      this.initOncomingTraffic();

      this.applyLightingPreset(0);
      this.update(0, 0, 0);
    }

    initSkyAndFog() {
      const preset = LIGHTING_PRESETS[0];
      this.scene.fog = new THREE.Fog(preset.fogColor, preset.fogNear, preset.fogFar);
      this.scene.background = new THREE.Color(preset.fogColor);

      // Sky dome
      const skyGeo = new THREE.SphereGeometry(880, 32, 20);
      this.skyUniforms = {
        uTopColor: { value: new THREE.Color(preset.skyTop) },
        uHorizonColor: { value: new THREE.Color(preset.skyHorizon) },
        uSunColor: { value: new THREE.Color(preset.sunColor) },
        uCloudColor: { value: new THREE.Color(preset.cloudTint) },
        uCloudAlpha: { value: preset.cloudAlpha },
        uStarAlpha: { value: preset.starAlpha },
        uSunDir: { value: new THREE.Vector3(...preset.sunDir).normalize() },
        uTime: { value: 0 }
      };

      const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: this.skyUniforms,
        vertexShader: [
          'varying vec3 vWorldDir;',
          'void main() {',
          '  vWorldDir = normalize(position);',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
          '}'
        ].join('\n'),
        fragmentShader: [
          'uniform vec3 uTopColor;',
          'uniform vec3 uHorizonColor;',
          'uniform vec3 uSunColor;',
          'uniform vec3 uCloudColor;',
          'uniform float uCloudAlpha;',
          'uniform float uStarAlpha;',
          'uniform vec3 uSunDir;',
          'uniform float uTime;',
          'varying vec3 vWorldDir;',
          'float hash(vec2 p) {',
          '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
          '}',
          'float noise(vec2 p) {',
          '  vec2 i = floor(p);',
          '  vec2 f = fract(p);',
          '  f = f * f * (3.0 - 2.0 * f);',
          '  float a = hash(i);',
          '  float b = hash(i + vec2(1.0, 0.0));',
          '  float c = hash(i + vec2(0.0, 1.0));',
          '  float d = hash(i + vec2(1.0, 1.0));',
          '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
          '}',
          'void main() {',
          '  vec3 dir = normalize(vWorldDir);',
          '  float h = clamp(dir.y, 0.0, 1.0);',
          '  vec3 col = mix(uHorizonColor, uTopColor, pow(h, 0.56));',
          '  float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);',
          '  col += uSunColor * pow(sunDot, 12.0) * 0.28;',
          '  col += uSunColor * smoothstep(0.9978, 0.9994, sunDot) * 1.15;',
          '  if (dir.y > 0.03) {',
          '    vec2 uv = dir.xz / (dir.y + 0.18) * 1.4 + vec2(uTime * 0.008, uTime * 0.003);',
          '    float n = noise(uv) * 0.6 + noise(uv * 2.2) * 0.4;',
          '    float cMask = smoothstep(0.54, 0.80, n) * smoothstep(0.03, 0.22, dir.y);',
          '    col = mix(col, uCloudColor, cMask * uCloudAlpha);',
          '  }',
          '  if (uStarAlpha > 0.01 && dir.y > 0.08) {',
          '    vec2 starCoord = vec2(atan(dir.z, dir.x) * 90.0, asin(clamp(dir.y, -1.0, 1.0)) * 180.0);',
          '    vec2 starCell = floor(starCoord);',
          '    vec2 starFrac = fract(starCoord) - 0.5;',
          '    float rnd = hash(starCell);',
          '    vec2 jitter = vec2(hash(starCell + 13.7), hash(starCell + 41.3)) - 0.5;',
          '    float dist = length(starFrac - jitter * 0.55);',
          '    float star = step(0.982, rnd) * smoothstep(0.24, 0.03, dist) * smoothstep(0.08, 0.35, dir.y);',
          '    col += vec3(0.88, 0.92, 1.0) * star * uStarAlpha;',
          '  }',
          '  gl_FragColor = vec4(col, 1.0);',
          '}'
        ].join('\n')
      });
      this.skyDome = new THREE.Mesh(skyGeo, skyMat);
      this.skyDome.frustumCulled = false;
      this.scene.add(this.skyDome);

      // Distant horizon mountain silhouette ring (rotates with highway heading)
      const segs = 96;
      const rad = 740;
      const mPos = [];
      const mIdx = [];
      for (let i = 0; i <= segs; i++) {
        const ang = (i / segs) * Math.PI * 2;
        const x = Math.cos(ang) * rad;
        const z = Math.sin(ang) * rad;
        const ridge =
          18 +
          Math.sin(ang * 5.0 + 0.4) * 14 +
          Math.cos(ang * 11.0 + 1.2) * 8 +
          Math.sin(ang * 19.0) * 5;
        mPos.push(x, -35, z);
        mPos.push(x, ridge, z);
        if (i < segs) {
          const b = i * 2;
          mIdx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        }
      }
      const mGeo = new THREE.BufferGeometry();
      mGeo.setAttribute('position', new THREE.Float32BufferAttribute(mPos, 3));
      mGeo.setIndex(mIdx);
      this.mountainMat = new THREE.MeshBasicMaterial({
        color: preset.mountainColor,
        side: THREE.DoubleSide,
        fog: true
      });
      this.mountainRing = new THREE.Mesh(mGeo, this.mountainMat);
      this.mountainRing.frustumCulled = false;
      this.scene.add(this.mountainRing);

      // Lights
      this.ambientLight = new THREE.AmbientLight(preset.ambientColor, preset.ambientIntensity);
      this.scene.add(this.ambientLight);

      this.hemiLight = new THREE.HemisphereLight(
        preset.hemiSky,
        preset.hemiGround,
        preset.hemiIntensity
      );
      this.scene.add(this.hemiLight);

      this.sunLight = new THREE.DirectionalLight(preset.sunColor, preset.sunIntensity);
      this.sunLight.position.set(140, 220, -160);
      this.sunLight.castShadow = !!(this.gfx && this.gfx.shadowsEnabled);
      const smSize = (this.gfx && this.gfx.shadowMapSize) || 1024;
      this.sunLight.shadow.mapSize.set(smSize, smSize);
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 360;
      this.sunLight.shadow.camera.left = -56;
      this.sunLight.shadow.camera.right = 56;
      this.sunLight.shadow.camera.top = 90;
      this.sunLight.shadow.camera.bottom = -25;
      this.sunLight.shadow.bias = -0.0002;
      this.sunLight.shadow.normalBias = 0.04;
      this.scene.add(this.sunLight);
      this.scene.add(this.sunLight.target);
      this.sunLight.target.position.set(0, 0, -45);
    }

    initRoadTextures() {
      const aniso = (this.gfx && this.gfx.anisotropy) || 4;

      // 1. Main 4-Lane Carriageway + Shoulders (width = 20m, length = 24m)
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 1024;
      const ctx = c.getContext('2d');

      const dToX = (d) => ((d - ROAD_MIN_D) / ROAD_WIDTH) * 1024;
      const mToPxX = (m) => (m / ROAD_WIDTH) * 1024;

      // Base asphalt
      ctx.fillStyle = '#383e47';
      ctx.fillRect(0, 0, 1024, 1024);

      // Shoulders slightly weathered lighter gray
      ctx.fillStyle = '#444b55';
      ctx.fillRect(0, 0, dToX(-7.4), 1024);
      ctx.fillRect(dToX(7.4), 0, 1024 - dToX(7.4), 1024);

      // Subtle tire wear bands down each lane
      ctx.fillStyle = 'rgba(20, 23, 28, 0.12)';
      for (let i = 0; i < LANE_CENTERS.length; i++) {
        const lc = LANE_CENTERS[i];
        ctx.fillRect(dToX(lc - 1.05), 0, mToPxX(0.55), 1024);
        ctx.fillRect(dToX(lc + 0.50), 0, mToPxX(0.55), 1024);
      }

      // Fine deterministic aggregate grain
      for (let i = 0; i < 16000; i++) {
        const rx = hash01(i * 1.37) * 1024;
        const ry = hash01(i * 2.91) * 1024;
        const bright = hash01(i * 4.13) > 0.5;
        ctx.fillStyle = bright ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.055)';
        ctx.fillRect(rx, ry, 2, 2);
      }

      // Shoulder rumble strip notches (outside edge lines)
      ctx.fillStyle = 'rgba(20, 23, 28, 0.45)';
      const rumbleCount = 48;
      for (let r = 0; r < rumbleCount; r++) {
        const y = (r / rumbleCount) * 1024;
        ctx.fillRect(dToX(-7.75), y, mToPxX(0.22), 7);
        ctx.fillRect(dToX(7.55), y, mToPxX(0.22), 7);
      }

      // Left edge line (solid amber/yellow) & right edge line (solid white)
      const edgeW = Math.max(4, mToPxX(0.16));
      ctx.fillStyle = '#f5b82e';
      ctx.fillRect(dToX(-7.4) - edgeW * 0.5, 0, edgeW, 1024);

      ctx.fillStyle = '#edf2f7';
      ctx.fillRect(dToX(7.4) - edgeW * 0.5, 0, edgeW, 1024);

      // Dashed white lane dividers at -3.7, 0.0, +3.7 (2 cycles per 24m = 12m each: 3.2m dash, 8.8m gap)
      const dashW = Math.max(4, mToPxX(0.14));
      const dashH = Math.round((3.2 / TEX_LEN) * 1024);
      ctx.fillStyle = '#f1f5f9';
      const dividers = [-3.7, 0.0, 3.7];
      for (let dIdx = 0; dIdx < dividers.length; dIdx++) {
        const px = dToX(dividers[dIdx]) - dashW * 0.5;
        ctx.fillRect(px, 80, dashW, dashH);
        ctx.fillRect(px, 592, dashW, dashH);
      }

      this.mainRoadTex = new THREE.CanvasTexture(c);
      this.mainRoadTex.wrapS = THREE.ClampToEdgeWrapping;
      this.mainRoadTex.wrapT = THREE.RepeatWrapping;
      this.mainRoadTex.anisotropy = aniso;
      if (THREE.sRGBEncoding !== undefined) this.mainRoadTex.encoding = THREE.sRGBEncoding;

      // 2. Opposite 3-Lane Carriageway Texture (width = 15.3m, d = -25.8 .. -10.5)
      const oc = document.createElement('canvas');
      oc.width = 512;
      oc.height = 512;
      const octx = oc.getContext('2d');
      const odToX = (d) => ((d - OPP_MIN_D) / OPP_WIDTH) * 512;
      const omToPxX = (m) => (m / OPP_WIDTH) * 512;

      octx.fillStyle = '#383e47';
      octx.fillRect(0, 0, 512, 512);
      octx.fillStyle = '#444b55';
      octx.fillRect(0, 0, odToX(-23.55), 512);
      octx.fillRect(odToX(-12.45), 0, 512 - odToX(-12.45), 512);

      // Edge lines
      octx.fillStyle = '#edf2f7';
      octx.fillRect(odToX(-23.55) - 2, 0, 4, 512);
      octx.fillStyle = '#f5b82e';
      octx.fillRect(odToX(-12.45) - 2, 0, 4, 512);

      // Dashed white lane lines between -14.3, -18.0, -21.7 -> dividers at -16.15 and -19.85
      octx.fillStyle = '#e2e8f0';
      const odashH = Math.round((3.2 / TEX_LEN) * 512);
      [-16.15, -19.85].forEach((dv) => {
        const px = odToX(dv) - 2;
        octx.fillRect(px, 40, 4, odashH);
        octx.fillRect(px, 296, 4, odashH);
      });

      this.oppRoadTex = new THREE.CanvasTexture(oc);
      this.oppRoadTex.wrapS = THREE.ClampToEdgeWrapping;
      this.oppRoadTex.wrapT = THREE.RepeatWrapping;
      this.oppRoadTex.anisotropy = aniso;
      if (THREE.sRGBEncoding !== undefined) this.oppRoadTex.encoding = THREE.sRGBEncoding;

      // 3. Concrete Median Barrier Texture (expansion joints every 6m)
      const mc = document.createElement('canvas');
      mc.width = 128;
      mc.height = 256;
      const mctx = mc.getContext('2d');
      mctx.fillStyle = '#9aa3af';
      mctx.fillRect(0, 0, 128, 256);
      for (let i = 0; i < 1200; i++) {
        mctx.fillStyle = hash01(i * 3.1) > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
        mctx.fillRect(hash01(i * 5.7) * 128, hash01(i * 7.3) * 256, 2, 2);
      }
      // Joint seams every 6m (4 seams per 24m)
      mctx.fillStyle = 'rgba(30, 35, 42, 0.45)';
      for (let j = 0; j < 4; j++) {
        mctx.fillRect(0, j * 64, 128, 3);
      }
      this.medianTex = new THREE.CanvasTexture(mc);
      this.medianTex.wrapS = THREE.ClampToEdgeWrapping;
      this.medianTex.wrapT = THREE.RepeatWrapping;
      if (THREE.sRGBEncoding !== undefined) this.medianTex.encoding = THREE.sRGBEncoding;

      // 4. Snow-Dusted 4-Lane & Opposite Road Textures
      const sc = document.createElement('canvas');
      sc.width = 1024;
      sc.height = 1024;
      const sctx = sc.getContext('2d');
      sctx.drawImage(c, 0, 0);
      // Frosty snow accumulation on shoulders
      sctx.fillStyle = 'rgba(226, 234, 244, 0.78)';
      sctx.fillRect(0, 0, dToX(-7.5), 1024);
      sctx.fillRect(dToX(7.5), 0, 1024 - dToX(7.5), 1024);
      // Light snow drift strips near lane borders & slushy center
      sctx.fillStyle = 'rgba(218, 228, 238, 0.24)';
      [-7.4, -3.7, 0.0, 3.7, 7.4].forEach((edgeD) => {
        sctx.fillRect(dToX(edgeD) - 18, 0, 36, 1024);
      });
      this.snowRoadTex = new THREE.CanvasTexture(sc);
      this.snowRoadTex.wrapS = THREE.ClampToEdgeWrapping;
      this.snowRoadTex.wrapT = THREE.RepeatWrapping;
      this.snowRoadTex.anisotropy = aniso;
      if (THREE.sRGBEncoding !== undefined) this.snowRoadTex.encoding = THREE.sRGBEncoding;

      const osc = document.createElement('canvas');
      osc.width = 512;
      osc.height = 512;
      const osctx = osc.getContext('2d');
      osctx.drawImage(oc, 0, 0);
      osctx.fillStyle = 'rgba(226, 234, 244, 0.78)';
      osctx.fillRect(0, 0, odToX(-23.65), 512);
      osctx.fillRect(odToX(-12.35), 0, 512 - odToX(-12.35), 512);
      this.oppSnowRoadTex = new THREE.CanvasTexture(osc);
      this.oppSnowRoadTex.wrapS = THREE.ClampToEdgeWrapping;
      this.oppSnowRoadTex.wrapT = THREE.RepeatWrapping;
      this.oppSnowRoadTex.anisotropy = aniso;
      if (THREE.sRGBEncoding !== undefined) this.oppSnowRoadTex.encoding = THREE.sRGBEncoding;
    }

    buildStripMesh(colCount, material, opts) {
      const o = opts || {};
      const vertCount = NUM_ROWS * colCount;
      const pos = new Float32Array(vertCount * 3);
      const uvs = new Float32Array(vertCount * 2);
      const cols = o.vertexColors ? new Float32Array(vertCount * 3) : null;
      const indices = [];

      for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < colCount; c++) {
          const idx = r * colCount + c;
          uvs[idx * 2] = c / Math.max(1, colCount - 1);
          uvs[idx * 2 + 1] = (r * STEP) / TEX_LEN;
          if (cols) {
            cols[idx * 3] = 0.3;
            cols[idx * 3 + 1] = 0.4;
            cols[idx * 3 + 2] = 0.25;
          }
        }
      }

      for (let r = 0; r < NUM_ROWS - 1; r++) {
        for (let c = 0; c < colCount - 1; c++) {
          const a = r * colCount + c;
          const b = a + 1;
          const d = (r + 1) * colCount + c;
          const e = d + 1;
          indices.push(a, b, d, b, e, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      if (cols) geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      geo.setIndex(indices);

      const mesh = new THREE.Mesh(geo, material);
      mesh.frustumCulled = false;
      mesh.receiveShadow = !!o.receiveShadow;
      mesh.castShadow = !!o.castShadow;
      this.scene.add(mesh);

      return { mesh, geo, pos, cols, colCount };
    }

    initRoadRibbons() {
      this.mainMat = new THREE.MeshStandardMaterial({
        map: this.mainRoadTex,
        roughness: 0.88,
        metalness: 0.04
      });
      this.mainStrip = this.buildStripMesh(2, this.mainMat, { receiveShadow: true });

      this.oppMat = new THREE.MeshStandardMaterial({
        map: this.oppRoadTex,
        roughness: 0.90,
        metalness: 0.04
      });
      this.oppStrip = this.buildStripMesh(2, this.oppMat, { receiveShadow: false });

      // Concrete Jersey Median Barrier (6 cross-section points around d = -10.0)
      const medianMat = new THREE.MeshStandardMaterial({
        map: this.medianTex,
        roughness: 0.92,
        metalness: 0.02
      });
      this.medianProfile = [
        { d: -10.42, y: -0.10 },
        { d: -10.30, y: 0.35 },
        { d: -10.14, y: 1.02 },
        { d: -9.86, y: 1.02 },
        { d: -9.70, y: 0.35 },
        { d: -9.58, y: -0.10 }
      ];
      this.medianStrip = this.buildStripMesh(6, medianMat, { receiveShadow: true, castShadow: true });

      // Continuous W-Beam Right Steel Guardrail along d = +10.75
      const railMat = new THREE.MeshStandardMaterial({
        color: 0xc2ccd8,
        roughness: 0.42,
        metalness: 0.18,
        side: THREE.DoubleSide
      });
      this.railProfile = [
        { d: 10.68, y: 0.54 },
        { d: 10.64, y: 0.70 },
        { d: 10.68, y: 0.86 },
        { d: 10.80, y: 0.86 },
        { d: 10.80, y: 0.54 }
      ];
      this.railStrip = this.buildStripMesh(5, railMat, { receiveShadow: true });

      // Left & Right Continuous Roadside Terrain Skirts (vertex-colored, zero seams)
      const terrainMat = new THREE.MeshLambertMaterial({
        vertexColors: true
      });
      this.rightTerrainOffsets = [10.35, 13.0, 22.0, 52.0, 105.0, 195.0];
      this.leftTerrainOffsets = [-195.0, -105.0, -52.0, -34.0, -27.5, -25.65];
      this.rightTerrainStrip = this.buildStripMesh(this.rightTerrainOffsets.length, terrainMat, {
        vertexColors: true,
        receiveShadow: true
      });
      this.leftTerrainStrip = this.buildStripMesh(this.leftTerrainOffsets.length, terrainMat, {
        vertexColors: true,
        receiveShadow: false
      });
    }

    initRoadsideProps() {
      // 1. Right Guardrail Support Posts (every 8m)
      this.postStep = 8;
      this.postCount = 110;
      const postGeo = new THREE.BoxGeometry(0.11, 0.90, 0.14);
      postGeo.translate(0, 0.42, 0);
      const postMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.55,
        metalness: 0.5
      });
      this.railPosts = new THREE.InstancedMesh(postGeo, postMat, this.postCount);
      this.railPosts.frustumCulled = false;
      this.scene.add(this.railPosts);

      // 2. Shoulder / Median Reflector Markers (every 24m)
      this.reflStep = 24;
      this.reflCount = 38;
      const reflGeo = new THREE.BoxGeometry(0.10, 0.16, 0.06);
      reflGeo.translate(0, 0.92, 0);
      const reflMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      this.medianReflectors = new THREE.InstancedMesh(reflGeo, reflMat, this.reflCount);
      this.medianReflectors.frustumCulled = false;
      this.scene.add(this.medianReflectors);

      const whiteReflGeo = new THREE.BoxGeometry(0.10, 0.14, 0.06);
      whiteReflGeo.translate(0, 0.72, 0);
      const whiteReflMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      this.rightReflectors = new THREE.InstancedMesh(whiteReflGeo, whiteReflMat, this.reflCount);
      this.rightReflectors.frustumCulled = false;
      this.scene.add(this.rightReflectors);

      // 3. Median Streetlights (every 56m)
      this.lampStep = 56;
      this.lampCount = 16;
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 8.6, 8);
      poleGeo.translate(0, 4.8, 0);
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.45,
        metalness: 0.62
      });
      this.lampPoles = new THREE.InstancedMesh(poleGeo, poleMat, this.lampCount);
      this.lampPoles.frustumCulled = false;
      this.scene.add(this.lampPoles);

      const armGeo = new THREE.BoxGeometry(3.6, 0.10, 0.12);
      armGeo.translate(0, 9.05, 0);
      this.lampArms = new THREE.InstancedMesh(armGeo, poleMat, this.lampCount);
      this.lampArms.frustumCulled = false;
      this.scene.add(this.lampArms);

      const bulbGeo = new THREE.BoxGeometry(0.55, 0.10, 0.28);
      this.lampBulbMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
      this.lampBulbsR = new THREE.InstancedMesh(bulbGeo, this.lampBulbMat, this.lampCount);
      this.lampBulbsR.frustumCulled = false;
      this.scene.add(this.lampBulbsR);

      this.lampBulbsL = new THREE.InstancedMesh(bulbGeo, this.lampBulbMat, this.lampCount);
      this.lampBulbsL.frustumCulled = false;
      this.scene.add(this.lampBulbsL);
    }

    makeSignCanvasTexture(line1, line2, bgColor, borderColor, textColor) {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 192;
      const ctx = c.getContext('2d');

      ctx.fillStyle = bgColor || '#0f5c3a';
      ctx.fillRect(0, 0, 512, 192);

      ctx.strokeStyle = borderColor || '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 492, 172);

      ctx.fillStyle = textColor || '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(line1, 256, 82);
      ctx.font = '600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(line2, 256, 138);

      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = (this.gfx && this.gfx.anisotropy) || 2;
      if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
      return tex;
    }

    initGantriesAndSigns() {
      // Overhead Highway Gantries (every 840m, pool of 2)
      this.gantryStep = 840;
      const gantryLegends = [
        ['NORTH 101 • BAYVIEW', 'NEXT EXIT 4 KM'],
        ['INTERSTATE 5 • WEST', 'EXPRESS LANES OPEN'],
        ['EXIT 42 • HARBOR BLVD', 'KEEP RIGHT 2 KM'],
        ['COASTAL HWY • PACIFICA', '24 KM  •  4 LANES'],
        ['ROUTE 80 • SIERRA', 'CLEAR ROAD AHEAD'],
        ['BAY BRIDGE • DOWNTOWN', '12 KM  •  NO TOLL']
      ];
      this.gantryTextures = gantryLegends.map((l) =>
        this.makeSignCanvasTexture(l[0], l[1], '#0d5b38', '#f8fafc', '#ffffff')
      );

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.48,
        metalness: 0.6
      });
      const signBackMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.7,
        metalness: 0.3
      });

      this.gantryPool = [];
      const spanWidth = 21.4; // spans d = -9.9 to +10.9 (centered at d = +0.5)
      for (let i = 0; i < 2; i++) {
        const g = new THREE.Group();

        const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 8.2, 8), steelMat);
        leftLeg.position.set(-spanWidth * 0.5, 4.1, 0);
        g.add(leftLeg);

        const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 8.2, 8), steelMat);
        rightLeg.position.set(spanWidth * 0.5, 4.1, 0);
        g.add(rightLeg);

        const trussTop = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.6, 0.35, 0.35), steelMat);
        trussTop.position.set(0, 8.15, 0);
        g.add(trussTop);

        const trussBot = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.6, 0.22, 0.35), steelMat);
        trussBot.position.set(0, 7.25, 0);
        g.add(trussBot);

        const boardMat = new THREE.MeshBasicMaterial({ map: this.gantryTextures[0] });
        const boardFace = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 3.0), boardMat);
        boardFace.position.set(-1.2, 6.95, 0.19);
        g.add(boardFace);

        const boardBack = new THREE.Mesh(new THREE.BoxGeometry(8.7, 3.1, 0.16), signBackMat);
        boardBack.position.set(-1.2, 6.95, 0.08);
        g.add(boardBack);

        this.scene.add(g);
        this.gantryPool.push({ group: g, boardMat, lastSlot: -1 });
      }

      // Roadside Speed Limit / Mile Marker Signs (every 260m, pool of 4)
      this.signStep = 260;
      const signLegends = [
        ['SPEED LIMIT', '110 KM/H', '#f8fafc', '#1e293b', '#0f172a'],
        ['HIGHWAY 101', 'STAY IN LANE', '#0d5b38', '#ffffff', '#ffffff'],
        ['KEEP RIGHT', 'EXCEPT TO PASS', '#f8fafc', '#1e293b', '#0f172a'],
        ['REST AREA', 'NEXT 8 KM', '#1d4ed8', '#ffffff', '#ffffff']
      ];
      this.signTextures = signLegends.map((l) =>
        this.makeSignCanvasTexture(l[0], l[1], l[2], l[3], l[4])
      );

      this.signPool = [];
      for (let i = 0; i < 4; i++) {
        const sg = new THREE.Group();
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.3, 6), steelMat);
        leg.position.set(0, 1.65, 0);
        sg.add(leg);

        const plateMat = new THREE.MeshBasicMaterial({ map: this.signTextures[i % this.signTextures.length] });
        const face = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.15), plateMat);
        face.position.set(0, 3.2, 0.05);
        sg.add(face);

        const back = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.2, 0.06), signBackMat);
        back.position.set(0, 3.2, 0.01);
        sg.add(back);

        this.scene.add(sg);
        this.signPool.push({ group: sg, plateMat, lastSlot: -1 });
      }
    }

    makeSpeedLimitTexture(limitKmh, isRadarWarning) {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, 496, 240);

      if (isRadarWarning) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(14, 14, 484, 54);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SPEED RADAR AHEAD', 256, 52);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(14, 14, 484, 50);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SPEED LIMIT', 256, 50);
      }

      // Red-ring speed limit circle
      const cx = 148;
      const cy = 160;
      const r = 74;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 15;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 58px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(limitKmh), cx, cy + 3);
      ctx.textBaseline = 'alphabetic';

      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'left';
      ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('KM/H', 250, 148);
      ctx.fillStyle = isRadarWarning ? '#b91c1c' : '#475569';
      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(isRadarWarning ? 'RADAR PATROL' : 'OBEY LIMIT', 250, 192);

      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = (this.gfx && this.gfx.anisotropy) || 2;
      if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
      return tex;
    }

    initRadars() {
      this.radarAlerts = {};
      this.radarSignTextures = {};
      this.limitSignTextures = {};
      const uniq = Array.from(new Set(RADAR_LIMITS_KMH));
      for (let i = 0; i < uniq.length; i++) {
        const lim = uniq[i];
        this.radarSignTextures[lim] = this.makeSpeedLimitTexture(lim, true);
        this.limitSignTextures[lim] = this.makeSpeedLimitTexture(lim, false);
      }

      // Radial white camera flash texture
      const fc = document.createElement('canvas');
      fc.width = 64;
      fc.height = 64;
      const fctx = fc.getContext('2d');
      const fgrad = fctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      fgrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      fgrad.addColorStop(0.35, 'rgba(235, 248, 255, 0.85)');
      fgrad.addColorStop(1.0, 'rgba(220, 240, 255, 0.0)');
      fctx.fillStyle = fgrad;
      fctx.fillRect(0, 0, 64, 64);
      const flashTex = new THREE.CanvasTexture(fc);

      const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45, metalness: 0.65 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.3 });
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x05080f, roughness: 0.15, metalness: 0.8 });

      // Pool of 2 Disguised Undercover Police Radar Cars parked on right emergency shoulder
      this.radarPool = [];
      for (let i = 0; i < 2; i++) {
        const rg = new THREE.Group();
        const isSuv = i % 2 === 1;
        let carMesh = null;
        if (root.HighwayVehicles && root.HighwayVehicles.createVehicleMesh) {
          carMesh = root.HighwayVehicles.createVehicleMesh({
            archetype: isSuv ? 'suv' : 'sedan',
            color: isSuv ? 0x2b3442 : 0xdbe2ea,
            custom: { tint: 'limo' },
            castShadow: false
          });
          carMesh.group.rotation.y = 0.05;
          carMesh.setHeadlights(0.20);
          rg.add(carMesh.group);
        } else {
          const fallbackBody = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.38, 4.5), darkMat);
          fallbackBody.position.set(0, 0.74, 0);
          rg.add(fallbackBody);
        }

        const camY = isSuv ? 1.38 : 1.12;
        const camZ = isSuv ? 1.24 : 0.92;
        const roofY = isSuv ? 1.72 : 1.44;
        const antZ = isSuv ? 1.05 : 0.72;

        // Compact rear-deck radar unit + recording LED facing approaching traffic (+Z)
        const radarBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.22), darkMat);
        radarBox.position.set(0, camY, camZ);
        rg.add(radarBox);

        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 10), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, camY, camZ + 0.12);
        rg.add(lens);

        const ledMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), ledMat);
        led.position.set(0.08, camY, camZ + 0.13);
        rg.add(led);

        // Subtle roof whip antenna
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.44, 5), poleMat);
        antenna.position.set(0, roofY + 0.22, antZ);
        rg.add(antenna);

        // Concealed undercover rear-window red & blue strobe strips (off until triggered)
        const redStrobeMat = new THREE.MeshBasicMaterial({
          color: 0xff1e2d,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        const blueStrobeMat = new THREE.MeshBasicMaterial({
          color: 0x1e88ff,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        const strobeGeo = new THREE.PlaneGeometry(0.28, 0.075);
        const redStrobe = new THREE.Mesh(strobeGeo, redStrobeMat);
        redStrobe.position.set(-0.24, camY + 0.06, camZ + 0.08);
        rg.add(redStrobe);

        const blueStrobe = new THREE.Mesh(strobeGeo, blueStrobeMat);
        blueStrobe.position.set(0.24, camY + 0.06, camZ + 0.08);
        rg.add(blueStrobe);

        const flashMat = new THREE.MeshBasicMaterial({
          map: flashTex,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.0
        });
        const flashSprite = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), flashMat);
        flashSprite.position.set(0, camY + 0.06, camZ + 0.28);
        rg.add(flashSprite);

        this.scene.add(rg);
        this.radarPool.push({
          group: rg,
          carMesh,
          ledMat,
          flashMat,
          redStrobeMat,
          blueStrobeMat,
          lastSlot: -1
        });
      }

      // Pool of 2 Radar Ahead Warning Signs (300m before each patrol)
      this.radarSignPool = [];
      const signBackMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.3 });
      for (let i = 0; i < 2; i++) {
        const sg = new THREE.Group();
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.4, 6), poleMat);
        leg.position.set(0, 1.7, 0);
        sg.add(leg);

        const plateMat = new THREE.MeshBasicMaterial({ map: this.radarSignTextures[RADAR_LIMITS_KMH[0]] });
        const face = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 1.25), plateMat);
        face.position.set(0, 3.35, 0.05);
        sg.add(face);

        const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.06), signBackMat);
        back.position.set(0, 3.35, 0.01);
        sg.add(back);

        this.scene.add(sg);
        this.radarSignPool.push({ group: sg, plateMat, lastSlot: -1 });
      }
    }

    getRadarInfo(s) {
      return getRadarInfo(s);
    }

    getRadarBySlot(slot) {
      return getRadarBySlot(slot);
    }

    triggerRadarFlash(slot) {
      this.radarFlashes[slot] = 1.0;
      if (this.radarAlerts) this.radarAlerts[slot] = 4.0;
    }

    initShoulderHazards() {
      this.hazardPool = [];
      const coneGeo = new THREE.ConeGeometry(0.18, 0.52, 8);
      coneGeo.translate(0, 0.26, 0);
      const coneBaseGeo = new THREE.BoxGeometry(0.36, 0.05, 0.36);
      coneBaseGeo.translate(0, 0.025, 0);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
      const coneStripMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      const coneBaseMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.8 });
      const stripGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.12, 8);
      stripGeo.translate(0, 0.30, 0);

      for (let i = 0; i < 2; i++) {
        const hg = new THREE.Group();
        const isSuv = i % 2 === 1;
        let carMesh = null;
        if (root.HighwayVehicles && root.HighwayVehicles.createVehicleMesh) {
          carMesh = root.HighwayVehicles.createVehicleMesh({
            archetype: isSuv ? 'suv' : 'sedan',
            color: isSuv ? 0x991b1b : 0x475569,
            castShadow: false
          });
          carMesh.group.rotation.y = 0.05;
          carMesh.setHeadlights(0.15);
          hg.add(carMesh.group);
        }

        // 3 reflective orange traffic cones placed behind the broken-down car
        for (let c = 0; c < 3; c++) {
          const cg = new THREE.Group();
          cg.position.set(-0.35 + c * 0.12, 0, 5.2 + c * 5.2);
          cg.add(new THREE.Mesh(coneGeo, coneMat));
          cg.add(new THREE.Mesh(stripGeo, coneStripMat));
          cg.add(new THREE.Mesh(coneBaseGeo, coneBaseMat));
          hg.add(cg);
        }

        this.scene.add(hg);
        this.hazardPool.push({ group: hg, carMesh });
      }
    }

    makeChevronTexture(dir) {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, 118, 118);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 22;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      if (dir > 0) {
        ctx.moveTo(42, 24);
        ctx.lineTo(88, 64);
        ctx.lineTo(42, 104);
      } else {
        ctx.moveTo(86, 24);
        ctx.lineTo(40, 64);
        ctx.lineTo(86, 104);
      }
      ctx.stroke();

      const tex = new THREE.CanvasTexture(c);
      if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
      return tex;
    }

    initCurveChevrons() {
      this.chevronStep = 36;
      this.chevronTexRight = this.makeChevronTexture(1);
      this.chevronTexLeft = this.makeChevronTexture(-1);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.55, metalness: 0.5 });
      const backMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
      const postGeo = new THREE.CylinderGeometry(0.045, 0.055, 2.05, 6);
      postGeo.translate(0, 1.02, 0);
      const faceGeo = new THREE.PlaneGeometry(1.05, 1.05);
      const backGeo = new THREE.BoxGeometry(1.08, 1.08, 0.05);

      this.chevronPool = [];
      for (let i = 0; i < 12; i++) {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(postGeo, postMat));
        const mat = new THREE.MeshBasicMaterial({ map: this.chevronTexRight });
        const face = new THREE.Mesh(faceGeo, mat);
        face.position.set(0, 1.85, 0.035);
        g.add(face);
        const back = new THREE.Mesh(backGeo, backMat);
        back.position.set(0, 1.85, 0);
        g.add(back);
        g.visible = false;
        this.scene.add(g);
        this.chevronPool.push({ group: g, mat, lastDir: 1 });
      }
    }

    initFoliage() {
      const fMult = this.gfx && this.gfx.foliageMult !== undefined ? this.gfx.foliageMult : 0.75;
      this.treeStep = 22;
      this.treeSlots = 40; // ~880m window
      this.treesPerSlot = Math.max(1, Math.round(3 * fMult));
      this.treeTotal = this.treeSlots * this.treesPerSlot;

      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 3.2, 6);
      trunkGeo.translate(0, 1.6, 0);
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4d3a2b });
      this.treeTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, this.treeTotal);
      this.treeTrunks.frustumCulled = false;
      this.scene.add(this.treeTrunks);

      const crownGeo = new THREE.ConeGeometry(2.1, 5.6, 7);
      crownGeo.translate(0, 5.1, 0);
      this.crownMat = new THREE.MeshLambertMaterial({ color: 0x3f6a3c });
      this.treeCrowns = new THREE.InstancedMesh(crownGeo, this.crownMat, this.treeTotal);
      this.treeCrowns.frustumCulled = false;
      this.scene.add(this.treeCrowns);
    }

    initPrecipitation() {
      const tier = (this.gfx && this.gfx.tier) || 'HIGH';
      const isLow = tier === 'LOW' || tier === 'I5_FAST';

      // 1. 3D Falling Rain Streaks (LineSegments)
      this.rainCount = isLow ? 220 : 480;
      this.rainPositions = new Float32Array(this.rainCount * 6);
      this.rainSeeds = new Float32Array(this.rainCount * 3);
      for (let i = 0; i < this.rainCount; i++) {
        const rx = (hash01(i * 1.73 + 1) - 0.5) * 44;
        const ry = hash01(i * 2.41 + 2) * 15;
        const rz = -44 + hash01(i * 3.17 + 3) * 54;
        this.rainSeeds[i * 3] = rx;
        this.rainSeeds[i * 3 + 1] = ry;
        this.rainSeeds[i * 3 + 2] = rz;
      }
      const rainGeo = new THREE.BufferGeometry();
      rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
      const rainMat = new THREE.LineBasicMaterial({
        color: 0xcbe0f5,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      });
      this.rainLines = new THREE.LineSegments(rainGeo, rainMat);
      this.rainLines.frustumCulled = false;
      this.rainLines.visible = false;
      this.scene.add(this.rainLines);

      // 2. 3D Falling Snowflakes (Points with soft radial sprite)
      const flakeCanvas = document.createElement('canvas');
      flakeCanvas.width = 32;
      flakeCanvas.height = 32;
      const fctx = flakeCanvas.getContext('2d');
      const fgrad = fctx.createRadialGradient(16, 16, 1, 16, 16, 15);
      fgrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      fgrad.addColorStop(0.5, 'rgba(240, 248, 255, 0.7)');
      fgrad.addColorStop(1.0, 'rgba(240, 248, 255, 0.0)');
      fctx.fillStyle = fgrad;
      fctx.fillRect(0, 0, 32, 32);
      const flakeTex = new THREE.CanvasTexture(flakeCanvas);

      this.snowCount = isLow ? 260 : 560;
      this.snowPositions = new Float32Array(this.snowCount * 3);
      for (let i = 0; i < this.snowCount; i++) {
        this.snowPositions[i * 3] = (hash01(i * 4.19 + 5) - 0.5) * 48;
        this.snowPositions[i * 3 + 1] = hash01(i * 5.03 + 6) * 14;
        this.snowPositions[i * 3 + 2] = -46 + hash01(i * 6.11 + 7) * 56;
      }
      const snowGeo = new THREE.BufferGeometry();
      snowGeo.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));
      const snowMat = new THREE.PointsMaterial({
        map: flakeTex,
        size: 0.28,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      });
      this.snowPoints = new THREE.Points(snowGeo, snowMat);
      this.snowPoints.frustumCulled = false;
      this.snowPoints.visible = false;
      this.scene.add(this.snowPoints);
    }

    updatePrecipitation(dt, playerSpeedMs) {
      const preset = WEATHER_PRESETS[this.lightingIndex];
      const spd = Math.max(0, playerSpeedMs || 0);

      if (this.rainLines) {
        const showRain = preset.precip === 'rain';
        this.rainLines.visible = showRain;
        if (showRain) {
          const streakZ = Math.min(1.85, 0.22 + spd * 0.032);
          const pos = this.rainPositions;
          const seeds = this.rainSeeds;
          for (let i = 0; i < this.rainCount; i++) {
            const sIdx = i * 3;
            let x = seeds[sIdx];
            let y = seeds[sIdx + 1] - 26 * dt;
            let z = seeds[sIdx + 2] + spd * dt;
            if (y < 0) y += 15;
            if (z > 10) z -= 54;
            seeds[sIdx + 1] = y;
            seeds[sIdx + 2] = z;

            const pIdx = i * 6;
            pos[pIdx] = x;
            pos[pIdx + 1] = y;
            pos[pIdx + 2] = z;
            pos[pIdx + 3] = x - 0.08;
            pos[pIdx + 4] = y - 0.92;
            pos[pIdx + 5] = z - streakZ;
          }
          this.rainLines.geometry.attributes.position.needsUpdate = true;
        }
      }

      if (this.snowPoints) {
        const showSnow = preset.precip === 'snow';
        this.snowPoints.visible = showSnow;
        if (showSnow) {
          const t = this.skyUniforms.uTime.value;
          const pos = this.snowPositions;
          for (let i = 0; i < this.snowCount; i++) {
            const idx = i * 3;
            let x = pos[idx] + Math.sin(t * 1.4 + i) * 1.3 * dt;
            let y = pos[idx + 1] - 3.6 * dt;
            let z = pos[idx + 2] + spd * dt;
            if (x > 24) x -= 48;
            else if (x < -24) x += 48;
            if (y < 0) y += 14;
            if (z > 10) z -= 56;
            pos[idx] = x;
            pos[idx + 1] = y;
            pos[idx + 2] = z;
          }
          this.snowPoints.geometry.attributes.position.needsUpdate = true;
        }
      }
    }

    initOncomingTraffic() {
      this.oncomingCars = [];
      if (!root.HighwayVehicles) return;
      const types = ['sedan', 'hatchback', 'semi', 'suv', 'van', 'bus', 'pickup', 'taxi'];
      for (let i = 0; i < types.length; i++) {
        const meshObj = root.HighwayVehicles.createVehicleMesh({
          archetype: types[i],
          castShadow: false
        });
        meshObj.setHeadlights(0.45);
        this.scene.add(meshObj.group);
        this.oncomingCars.push({
          s: 60 + i * 78,
          d: OPP_LANE_CENTERS[i % OPP_LANE_CENTERS.length],
          speed: 24 + (i % 4) * 3.2, // 86..121 km/h opposite direction
          meshObj
        });
      }
    }

    cycleLightingPreset() {
      const next = (this.lightingIndex + 1) % LIGHTING_PRESETS.length;
      this.applyLightingPreset(next);
      return LIGHTING_PRESETS[this.lightingIndex];
    }

    applyLightingPreset(index) {
      this.lightingIndex = ((index % WEATHER_PRESETS.length) + WEATHER_PRESETS.length) % WEATHER_PRESETS.length;
      const p = WEATHER_PRESETS[this.lightingIndex];

      this.scene.fog.color.setHex(p.fogColor);
      this.scene.fog.near = p.fogNear;
      this.scene.fog.far = p.fogFar;
      this.scene.background.setHex(p.fogColor);

      this.skyUniforms.uTopColor.value.setHex(p.skyTop);
      this.skyUniforms.uHorizonColor.value.setHex(p.skyHorizon);
      this.skyUniforms.uSunColor.value.setHex(p.sunColor);
      this.skyUniforms.uCloudColor.value.setHex(p.cloudTint);
      this.skyUniforms.uCloudAlpha.value = p.cloudAlpha;
      this.skyUniforms.uStarAlpha.value = p.starAlpha;

      this.ambientLight.color.setHex(p.ambientColor);
      this.ambientLight.intensity = p.ambientIntensity;
      this.hemiLight.color.setHex(p.hemiSky);
      this.hemiLight.groundColor.setHex(p.hemiGround);
      this.hemiLight.intensity = p.hemiIntensity;
      this.sunLight.color.setHex(p.sunColor);
      this.sunLight.intensity = p.sunIntensity;
      this.mountainMat.color.setHex(p.mountainColor);
      this.lampBulbMat.color.setHex(p.lampGlow);

      // Update road wetness & snow road textures
      if (this.mainMat && this.oppMat) {
        const targetMainTex = p.snowy ? this.snowRoadTex : this.mainRoadTex;
        const targetOppTex = p.snowy ? this.oppSnowRoadTex : this.oppRoadTex;
        if (this.mainMat.map !== targetMainTex) {
          this.mainMat.map = targetMainTex;
          this.mainMat.needsUpdate = true;
        }
        if (this.oppMat.map !== targetOppTex) {
          this.oppMat.map = targetOppTex;
          this.oppMat.needsUpdate = true;
        }
        this.mainMat.roughness = p.wetRoad ? 0.30 : p.snowy ? 0.65 : 0.88;
        this.mainMat.metalness = p.wetRoad ? 0.16 : 0.04;
        this.oppMat.roughness = p.wetRoad ? 0.34 : 0.90;
      }

      if (this.crownMat) {
        this.crownMat.color.setHex(p.snowy ? 0xaec2cf : 0x3f6a3c);
      }

      for (let i = 0; i < this.oncomingCars.length; i++) {
        this.oncomingCars[i].meshObj.setHeadlights(Math.max(0.35, p.headlightStrength));
      }
    }

    getCurrentLightingPreset() {
      return WEATHER_PRESETS[this.lightingIndex];
    }

    updateFrameLUT(s0) {
      this.s0 = s0;
      const baseIdx = Math.floor(s0 / STEP);
      const startIdx = baseIdx - ROW_BEHIND;
      const startS = startIdx * STEP;
      this.lutStartS = startS;

      const h0 = getHeading(s0);
      const e0 = getElevation(s0);

      // Integrate forward from s0 and backward from s0 so ds = 0 sits cleanly at (0, 0, 0)
      const anchorOffset = s0 - startS; // in [ROW_BEHIND * STEP, (ROW_BEHIND + 1) * STEP)
      const anchorRow = Math.floor(anchorOffset / STEP);

      // Build backward from s0 to row anchorRow, then step backward to row 0
      let curX = 0;
      let curZ = 0;
      const anchorS = startS + anchorRow * STEP;
      const midBackYaw = getHeading((s0 + anchorS) * 0.5) - h0;
      const backDs = anchorS - s0; // <= 0
      curX += Math.sin(midBackYaw) * backDs;
      curZ += -Math.cos(midBackYaw) * backDs;
      this.lutX[anchorRow] = curX;
      this.lutZ[anchorRow] = curZ;
      this.lutY[anchorRow] = getElevation(anchorS) - e0;
      this.lutYaw[anchorRow] = getHeading(anchorS) - h0;

      for (let i = anchorRow - 1; i >= 0; i--) {
        const sA = startS + (i + 1) * STEP;
        const sB = startS + i * STEP;
        const midYaw = getHeading((sA + sB) * 0.5) - h0;
        curX -= Math.sin(midYaw) * STEP;
        curZ -= -Math.cos(midYaw) * STEP;
        this.lutX[i] = curX;
        this.lutZ[i] = curZ;
        this.lutY[i] = getElevation(sB) - e0;
        this.lutYaw[i] = getHeading(sB) - h0;
      }

      // Build forward from anchorRow to NUM_ROWS - 1
      curX = this.lutX[anchorRow];
      curZ = this.lutZ[anchorRow];
      for (let i = anchorRow + 1; i < NUM_ROWS; i++) {
        const sA = startS + (i - 1) * STEP;
        const sB = startS + i * STEP;
        const midYaw = getHeading((sA + sB) * 0.5) - h0;
        curX += Math.sin(midYaw) * STEP;
        curZ += -Math.cos(midYaw) * STEP;
        this.lutX[i] = curX;
        this.lutZ[i] = curZ;
        this.lutY[i] = getElevation(sB) - e0;
        this.lutYaw[i] = getHeading(sB) - h0;
      }

      return baseIdx;
    }

    /**
     * Project curvilinear highway (s, d, yOff) into local 3D scene space around player s0.
     */
    project(s, d, out, yOffset) {
      const target = out || this.projOut;
      const f = (s - this.lutStartS) / STEP;
      let i0 = Math.floor(f);
      let frac = f - i0;
      if (i0 < 0) {
        i0 = 0;
        frac = 0;
      } else if (i0 >= NUM_ROWS - 1) {
        i0 = NUM_ROWS - 2;
        frac = 1;
      }

      const cx = lerp(this.lutX[i0], this.lutX[i0 + 1], frac);
      const cy = lerp(this.lutY[i0], this.lutY[i0 + 1], frac);
      const cz = lerp(this.lutZ[i0], this.lutZ[i0 + 1], frac);
      const yaw = lerp(this.lutYaw[i0], this.lutYaw[i0 + 1], frac);

      const rx = Math.cos(yaw);
      const rz = Math.sin(yaw);
      target.x = cx + rx * d;
      target.y = cy + (yOffset || 0);
      target.z = cz + rz * d;
      target.yaw = yaw;
      target.pitch = Math.atan2(this.lutY[i0 + 1] - this.lutY[i0], STEP);
      return target;
    }

    updateRibbons(baseIdx) {
      const mainPos = this.mainStrip.pos;
      const oppPos = this.oppStrip.pos;
      const medPos = this.medianStrip.pos;
      const railPos = this.railStrip.pos;
      const rtPos = this.rightTerrainStrip.pos;
      const rtCol = this.rightTerrainStrip.cols;
      const ltPos = this.leftTerrainStrip.pos;
      const ltCol = this.leftTerrainStrip.cols;

      const medProf = this.medianProfile;
      const railProf = this.railProfile;
      const rtOff = this.rightTerrainOffsets;
      const ltOff = this.leftTerrainOffsets;

      for (let r = 0; r < NUM_ROWS; r++) {
        const sRow = this.lutStartS + r * STEP;
        const cx = this.lutX[r];
        const cy = this.lutY[r];
        const cz = this.lutZ[r];
        const yaw = this.lutYaw[r];
        const rx = Math.cos(yaw);
        const rz = Math.sin(yaw);

        // Main 4-lane deck (2 cols)
        const mBase = r * 6;
        mainPos[mBase] = cx + rx * ROAD_MIN_D;
        mainPos[mBase + 1] = cy;
        mainPos[mBase + 2] = cz + rz * ROAD_MIN_D;
        mainPos[mBase + 3] = cx + rx * ROAD_MAX_D;
        mainPos[mBase + 4] = cy;
        mainPos[mBase + 5] = cz + rz * ROAD_MAX_D;

        // Opposite 3-lane deck (2 cols)
        oppPos[mBase] = cx + rx * OPP_MIN_D;
        oppPos[mBase + 1] = cy;
        oppPos[mBase + 2] = cz + rz * OPP_MIN_D;
        oppPos[mBase + 3] = cx + rx * OPP_MAX_D;
        oppPos[mBase + 4] = cy;
        oppPos[mBase + 5] = cz + rz * OPP_MAX_D;

        // Median Barrier (6 cols)
        for (let c = 0; c < 6; c++) {
          const idx = (r * 6 + c) * 3;
          const pt = medProf[c];
          medPos[idx] = cx + rx * pt.d;
          medPos[idx + 1] = cy + pt.y;
          medPos[idx + 2] = cz + rz * pt.d;
        }

        // Right Steel Guardrail (5 cols)
        for (let c = 0; c < 5; c++) {
          const idx = (r * 5 + c) * 3;
          const pt = railProf[c];
          railPos[idx] = cx + rx * pt.d;
          railPos[idx + 1] = cy + pt.y;
          railPos[idx + 2] = cz + rz * pt.d;
        }

        const isSnowy = WEATHER_PRESETS[this.lightingIndex].snowy;

        // Right terrain skirt (6 cols)
        for (let c = 0; c < 6; c++) {
          const idx = (r * 6 + c) * 3;
          const d = rtOff[c];
          rtPos[idx] = cx + rx * d;
          rtPos[idx + 1] = cy + terrainHeightOffset(sRow, d);
          rtPos[idx + 2] = cz + rz * d;
          if (isSnowy) {
            rtCol[idx] = 0.84;
            rtCol[idx + 1] = 0.88;
            rtCol[idx + 2] = 0.92;
          } else {
            const tint = getBiomeTint(sRow, d - 10.5);
            rtCol[idx] = tint[0];
            rtCol[idx + 1] = tint[1];
            rtCol[idx + 2] = tint[2];
          }
        }

        // Left terrain skirt (6 cols)
        for (let c = 0; c < 6; c++) {
          const idx = (r * 6 + c) * 3;
          const d = ltOff[c];
          ltPos[idx] = cx + rx * d;
          ltPos[idx + 1] = cy + terrainHeightOffset(sRow, d);
          ltPos[idx + 2] = cz + rz * d;
          if (isSnowy) {
            ltCol[idx] = 0.84;
            ltCol[idx + 1] = 0.88;
            ltCol[idx + 2] = 0.92;
          } else {
            const tint = getBiomeTint(sRow, -d - 25.5);
            ltCol[idx] = tint[0];
            ltCol[idx + 1] = tint[1];
            ltCol[idx + 2] = tint[2];
          }
        }
      }

      this.mainStrip.geo.attributes.position.needsUpdate = true;
      this.oppStrip.geo.attributes.position.needsUpdate = true;
      this.medianStrip.geo.attributes.position.needsUpdate = true;
      this.railStrip.geo.attributes.position.needsUpdate = true;
      this.rightTerrainStrip.geo.attributes.position.needsUpdate = true;
      this.rightTerrainStrip.geo.attributes.color.needsUpdate = true;
      this.leftTerrainStrip.geo.attributes.position.needsUpdate = true;
      this.leftTerrainStrip.geo.attributes.color.needsUpdate = true;

      if (baseIdx !== this.lastBaseIdx) {
        this.lastBaseIdx = baseIdx;
        this.mainStrip.geo.computeVertexNormals();
        this.oppStrip.geo.computeVertexNormals();
        this.medianStrip.geo.computeVertexNormals();
        this.railStrip.geo.computeVertexNormals();
        this.rightTerrainStrip.geo.computeVertexNormals();
        this.leftTerrainStrip.geo.computeVertexNormals();

        // Exact locked UV offset so dashed lane markings never slide or jump
        const phase = (((baseIdx - ROW_BEHIND) % 6) + 6) % 6;
        const uvOffset = phase / 6;
        this.mainRoadTex.offset.y = uvOffset;
        this.oppRoadTex.offset.y = uvOffset;
        this.snowRoadTex.offset.y = uvOffset;
        this.oppSnowRoadTex.offset.y = uvOffset;
        this.medianTex.offset.y = uvOffset;
      }
    }

    updateProps(s0, beamMode) {
      const obj = this.tempObj;
      const p = this.projOut;
      const activePreset = WEATHER_PRESETS[this.lightingIndex];
      const isNight = !!(activePreset && activePreset.isNight);
      const bMode = beamMode || 'off';
      const applyReflect = (mat, ds) => {
        if (!mat || !mat.color) return;
        if (!isNight) {
          if (bMode === 'long' && ds > 12 && ds < 130) {
            mat.color.setRGB(1.06, 1.07, 1.09);
          } else {
            mat.color.setRGB(1.0, 1.0, 1.0);
          }
          return;
        }
        let r = 0.62;
        let g = 0.63;
        let b = 0.66;
        if (bMode === 'long' && ds > 10 && ds < 200) {
          const t = Math.max(0, 1 - Math.abs(ds - 70) / 130);
          r += 0.50 * t;
          g += 0.53 * t;
          b += 0.56 * t;
        } else if (bMode === 'short' && ds > 6 && ds < 80) {
          const t = Math.max(0, 1 - Math.abs(ds - 34) / 46);
          r += 0.26 * t;
          g += 0.27 * t;
          b += 0.26 * t;
        }
        mat.color.setRGB(r, g, b);
      };

      // 1. Guardrail Posts (every 8m)
      const postBase = Math.floor((s0 - 120) / this.postStep) * this.postStep;
      for (let i = 0; i < this.postCount; i++) {
        const s = postBase + i * this.postStep;
        this.project(s, RIGHT_RAIL_D + 0.14, p, 0);
        obj.position.set(p.x, p.y, p.z);
        obj.rotation.set(0, -p.yaw, 0);
        obj.scale.set(1, 1, 1);
        obj.updateMatrix();
        this.railPosts.setMatrixAt(i, obj.matrix);
      }
      this.railPosts.instanceMatrix.needsUpdate = true;

      // 2. Median & Shoulder Reflector Markers (every 24m)
      const reflBase = Math.floor((s0 - 100) / this.reflStep) * this.reflStep;
      for (let i = 0; i < this.reflCount; i++) {
        const s = reflBase + i * this.reflStep;
        this.project(s, MEDIAN_CENTER_D, p, 0);
        obj.position.set(p.x, p.y, p.z);
        obj.rotation.set(0, -p.yaw, 0);
        obj.scale.set(1, 1, 1);
        obj.updateMatrix();
        this.medianReflectors.setMatrixAt(i, obj.matrix);

        this.project(s, RIGHT_RAIL_D - 0.08, p, 0);
        obj.position.set(p.x, p.y, p.z);
        obj.rotation.set(0, -p.yaw, 0);
        obj.updateMatrix();
        this.rightReflectors.setMatrixAt(i, obj.matrix);
      }
      this.medianReflectors.instanceMatrix.needsUpdate = true;
      this.rightReflectors.instanceMatrix.needsUpdate = true;

      // 3. Median Streetlights (every 56m)
      const lampBase = Math.floor((s0 - 120) / this.lampStep) * this.lampStep;
      for (let i = 0; i < this.lampCount; i++) {
        const s = lampBase + i * this.lampStep;
        this.project(s, MEDIAN_CENTER_D, p, 0);
        obj.position.set(p.x, p.y, p.z);
        obj.rotation.set(0, -p.yaw, 0);
        obj.scale.set(1, 1, 1);
        obj.updateMatrix();
        this.lampPoles.setMatrixAt(i, obj.matrix);
        this.lampArms.setMatrixAt(i, obj.matrix);

        // Twin light bulbs on either end of the cross-arm
        const rx = Math.cos(p.yaw);
        const rz = Math.sin(p.yaw);
        obj.position.set(p.x + rx * 1.55, p.y + 8.95, p.z + rz * 1.55);
        obj.updateMatrix();
        this.lampBulbsR.setMatrixAt(i, obj.matrix);

        obj.position.set(p.x - rx * 1.55, p.y + 8.95, p.z - rz * 1.55);
        obj.updateMatrix();
        this.lampBulbsL.setMatrixAt(i, obj.matrix);
      }
      this.lampPoles.instanceMatrix.needsUpdate = true;
      this.lampArms.instanceMatrix.needsUpdate = true;
      this.lampBulbsR.instanceMatrix.needsUpdate = true;
      this.lampBulbsL.instanceMatrix.needsUpdate = true;

      // 4. Overhead Highway Gantries (every 840m)
      const gStartSlot = Math.floor((s0 - 60) / this.gantryStep);
      for (let i = 0; i < this.gantryPool.length; i++) {
        const slot = gStartSlot + i;
        const gObj = this.gantryPool[i];
        const s = slot * this.gantryStep + 420; // offset from s=0 so first gantry is 420m ahead
        if (s < s0 - 130 || s > s0 + 680 || slot < 0) {
          gObj.group.visible = false;
          continue;
        }
        gObj.group.visible = true;
        if (gObj.lastSlot !== slot) {
          gObj.lastSlot = slot;
          gObj.boardMat.map = this.gantryTextures[slot % this.gantryTextures.length];
          gObj.boardMat.needsUpdate = true;
        }
        this.project(s, 0.5, p, 0);
        gObj.group.position.set(p.x, p.y, p.z);
        gObj.group.rotation.set(0, -p.yaw, 0);
        applyReflect(gObj.boardMat, s - s0);
      }

      // 5. Roadside Signs (every 260m)
      const sStartSlot = Math.floor((s0 - 80) / this.signStep);
      for (let i = 0; i < this.signPool.length; i++) {
        const slot = sStartSlot + i;
        const sObj = this.signPool[i];
        const s = slot * this.signStep + 140;
        if (s < s0 - 110 || s > s0 + 660 || slot < 0) {
          sObj.group.visible = false;
          continue;
        }
        sObj.group.visible = true;
        if (slot % 4 === 0 && this.limitSignTextures) {
          const zoneLimit = getRadarInfo(s).limitKmh;
          const tex = this.limitSignTextures[zoneLimit];
          if (tex && sObj.plateMat.map !== tex) {
            sObj.plateMat.map = tex;
            sObj.plateMat.needsUpdate = true;
          }
          sObj.lastSlot = slot;
        } else if (sObj.lastSlot !== slot) {
          sObj.lastSlot = slot;
          sObj.plateMat.map = this.signTextures[slot % this.signTextures.length];
          sObj.plateMat.needsUpdate = true;
        }
        this.project(s, 11.75, p, 0);
        sObj.group.position.set(p.x, p.y, p.z);
        sObj.group.rotation.set(0, -p.yaw, 0);
        applyReflect(sObj.plateMat, s - s0);
      }

      // 5b. Disguised Undercover Police Radar Cars & Warning Signs
      if (this.radarPool && this.radarSignPool) {
        const rStartSlot = Math.max(0, getRadarInfo(Math.max(0, s0 - 120)).slot);
        const tNow = this.skyUniforms ? this.skyUniforms.uTime.value : 0;
        for (let i = 0; i < this.radarPool.length; i++) {
          const slot = rStartSlot + i;
          const info = getRadarBySlot(slot);
          const rObj = this.radarPool[i];
          if (info.radarS < s0 - 120 || info.radarS > s0 + 660) {
            rObj.group.visible = false;
          } else {
            rObj.group.visible = true;
            this.project(info.radarS, 9.15, p, 0);
            rObj.group.position.set(p.x, p.y, p.z);
            rObj.group.rotation.set(p.pitch, -p.yaw, 0);
            if (rObj.carMesh) {
              rObj.carMesh.setHeadlights(isNight ? 0.55 : 0.15);
            }
            const pulse = 0.4 + 0.6 * Math.abs(Math.sin(tNow * 4.5 + i));
            rObj.ledMat.color.setRGB(pulse, 0.06, 0.06);
            rObj.flashMat.opacity = this.radarFlashes[slot] || 0;

            const alerting = !!(this.radarAlerts && this.radarAlerts[slot] > 0);
            if (rObj.redStrobeMat && rObj.blueStrobeMat) {
              if (alerting) {
                const phase = Math.floor(tNow * 9.5) % 2 === 0;
                rObj.redStrobeMat.opacity = phase ? 0.95 : 0.05;
                rObj.blueStrobeMat.opacity = phase ? 0.05 : 0.95;
              } else {
                rObj.redStrobeMat.opacity = 0;
                rObj.blueStrobeMat.opacity = 0;
              }
            }
          }

          const wObj = this.radarSignPool[i];
          const warnS = info.radarS - 300;
          if (warnS < s0 - 110 || warnS > s0 + 660) {
            wObj.group.visible = false;
          } else {
            wObj.group.visible = true;
            if (wObj.lastSlot !== slot) {
              wObj.lastSlot = slot;
              const tex = this.radarSignTextures[info.limitKmh];
              if (tex) {
                wObj.plateMat.map = tex;
                wObj.plateMat.needsUpdate = true;
              }
            }
            this.project(warnS, 11.4, p, 0);
            wObj.group.position.set(p.x, p.y, p.z);
            wObj.group.rotation.set(0, -p.yaw, 0);
            applyReflect(wObj.plateMat, warnS - s0);
          }
        }
      }

      // 5c. Broken-Down Emergency Shoulder Vehicles with Hazard Blinkers & Cones
      if (this.hazardPool) {
        const hStartSlot = Math.max(0, getShoulderHazardInfo(Math.max(0, s0 - 120)).slot);
        const tNow = this.skyUniforms ? this.skyUniforms.uTime.value : 0;
        const hazBlink = Math.floor(tNow * 2.4) % 2 === 0;
        for (let i = 0; i < this.hazardPool.length; i++) {
          const info = getShoulderHazardBySlot(hStartSlot + i);
          const hObj = this.hazardPool[i];
          if (info.hazardS < s0 - 120 || info.hazardS > s0 + 660) {
            hObj.group.visible = false;
          } else {
            hObj.group.visible = true;
            this.project(info.hazardS, info.d, p, 0);
            hObj.group.position.set(p.x, p.y, p.z);
            hObj.group.rotation.set(p.pitch, -p.yaw, 0);
            if (hObj.carMesh) {
              hObj.carMesh.setHeadlights(isNight ? 0.35 : 0.08);
              hObj.carMesh.setBlinker(2, hazBlink);
            }
          }
        }
      }

      // 5d. Outer-Bend Curve Warning Chevron Signs
      if (this.chevronPool) {
        const cStartSlot = Math.floor((s0 - 40) / this.chevronStep);
        let poolIdx = 0;
        for (let sl = 0; sl < 20 && poolIdx < this.chevronPool.length; sl++) {
          const slot = cStartSlot + sl;
          const s = slot * this.chevronStep;
          if (s < s0 - 40 || s > s0 + 580) continue;
          const curv = getCurvature(s);
          if (Math.abs(curv) < 0.00185) continue;
          const dir = curv > 0 ? 1 : -1;
          const cObj = this.chevronPool[poolIdx++];
          cObj.group.visible = true;
          if (cObj.lastDir !== dir) {
            cObj.lastDir = dir;
            cObj.mat.map = dir > 0 ? this.chevronTexRight : this.chevronTexLeft;
            cObj.mat.needsUpdate = true;
          }
          const dPos = dir > 0 ? -9.95 : 11.25;
          this.project(s, dPos, p, 0);
          cObj.group.position.set(p.x, p.y, p.z);
          cObj.group.rotation.set(0, -p.yaw, 0);
          applyReflect(cObj.mat, s - s0);
        }
        for (let k = poolIdx; k < this.chevronPool.length; k++) {
          this.chevronPool[k].group.visible = false;
        }
      }

      // 6. Sparse Roadside Trees
      const tSlotStart = Math.floor((s0 - 140) / this.treeStep);
      let instIdx = 0;
      for (let sl = 0; sl < this.treeSlots; sl++) {
        const slotId = tSlotStart + sl;
        for (let k = 0; k < this.treesPerSlot; k++) {
          const seed = slotId * 37 + k * 13;
          const rSide = hash01(seed + 1);
          const s = slotId * this.treeStep + hash01(seed + 2) * (this.treeStep * 0.85);
          const distOut = 18.5 + hash01(seed + 3) * 85;
          const d = rSide > 0.42 ? distOut : -(26.0 + distOut * 0.85);
          const yOff = terrainHeightOffset(s, d);
          const scale = 0.72 + hash01(seed + 4) * 0.85;

          this.project(s, d, p, yOff - 0.15);
          obj.position.set(p.x, p.y, p.z);
          obj.rotation.set(0, hash01(seed + 5) * Math.PI * 2, 0);
          obj.scale.set(scale, scale * (0.9 + hash01(seed + 6) * 0.35), scale);
          obj.updateMatrix();
          this.treeTrunks.setMatrixAt(instIdx, obj.matrix);
          this.treeCrowns.setMatrixAt(instIdx, obj.matrix);
          instIdx++;
        }
      }
      this.treeTrunks.instanceMatrix.needsUpdate = true;
      this.treeCrowns.instanceMatrix.needsUpdate = true;
    }

    updateOncomingTraffic(s0, dt, beamMode) {
      const p = this.projOut;
      const preset = WEATHER_PRESETS[this.lightingIndex];
      const isNight = !!(preset && preset.isNight);
      const baseHl = Math.max(0.35, preset ? preset.headlightStrength : 0.45);
      for (let i = 0; i < this.oncomingCars.length; i++) {
        const oc = this.oncomingCars[i];
        oc.s -= oc.speed * dt;
        if (oc.s < s0 - 140) {
          oc.s = s0 + 500 + (i * 41) % 140;
          oc.d = OPP_LANE_CENTERS[(i + Math.floor(s0 * 0.01)) % OPP_LANE_CENTERS.length];
          oc.flashBackTimer = 0;
          oc.flashBackCooldown = 0;
        } else if (oc.s > s0 + 660) {
          oc.s -= 620;
        }
        if (oc.flashBackCooldown > 0) oc.flashBackCooldown = Math.max(0, oc.flashBackCooldown - dt);
        const ds = oc.s - s0;
        if (isNight && beamMode === 'long' && ds > 28 && ds < 105 && (oc.flashBackCooldown || 0) <= 0) {
          oc.flashBackTimer = 0.44;
          oc.flashBackCooldown = 9.0;
        }
        const visible = ds > -135 && ds < 590;
        oc.meshObj.group.visible = visible;
        if (visible) {
          this.project(oc.s, oc.d, p, 0);
          oc.meshObj.group.position.set(p.x, p.y, p.z);
          oc.meshObj.group.rotation.set(-p.pitch, -p.yaw + Math.PI, 0);
          oc.meshObj.updateWheels(oc.speed, dt, 0);
          if (oc.flashBackTimer > 0) {
            oc.flashBackTimer = Math.max(0, oc.flashBackTimer - dt);
            const pulse = Math.floor((0.44 - oc.flashBackTimer) * 9.0) % 2 === 0;
            oc.meshObj.setHeadlights(pulse ? 2.15 : 0.90);
            if (oc.flashBackTimer === 0) {
              oc.meshObj.setHeadlights(baseHl);
            }
          }
        } else if (oc.flashBackTimer > 0) {
          oc.flashBackTimer = 0;
          oc.meshObj.setHeadlights(baseHl);
        }
      }
    }

    update(s0, dt, playerSpeedMs, beamMode) {
      const stepDt = dt || 0;
      this.skyUniforms.uTime.value += stepDt;
      if (this.radarFlashes) {
        const keys = Object.keys(this.radarFlashes);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const nextVal = this.radarFlashes[k] - stepDt * 2.8;
          if (nextVal <= 0) delete this.radarFlashes[k];
          else this.radarFlashes[k] = nextVal;
        }
      }
      if (this.radarAlerts) {
        const aKeys = Object.keys(this.radarAlerts);
        for (let i = 0; i < aKeys.length; i++) {
          const k = aKeys[i];
          const nextA = this.radarAlerts[k] - stepDt;
          if (nextA <= 0) delete this.radarAlerts[k];
          else this.radarAlerts[k] = nextA;
        }
      }
      const baseIdx = this.updateFrameLUT(s0);
      this.updateRibbons(baseIdx);
      this.updateProps(s0, beamMode);
      this.updatePrecipitation(dt || 0, playerSpeedMs || 0);
      this.updateOncomingTraffic(s0, dt || 0, beamMode);

      // Keep sky, distant mountains, and sun locked in compass orientation
      const heading = getHeading(s0);
      this.mountainRing.rotation.y = heading;

      const preset = WEATHER_PRESETS[this.lightingIndex];
      const sx = preset.sunDir[0];
      const sy = preset.sunDir[1];
      const sz = preset.sunDir[2];
      const cH = Math.cos(heading);
      const sH = Math.sin(heading);
      // Rotate world sunDir into local tangent frame (+heading around Y)
      const lx = sx * cH + sz * sH;
      const lz = -sx * sH + sz * cH;
      this.skyUniforms.uSunDir.value.set(lx, sy, lz).normalize();
      this.sunLight.position.set(lx * 240, Math.max(40, sy * 240), lz * 240 - 45);
    }
  }

  const api = {
    HighwayEnvironment,
    LANE_WIDTH,
    LANE_CENTERS,
    OPP_LANE_CENTERS,
    WEATHER_PRESETS,
    LIGHTING_PRESETS,
    RADAR_FIRST_S,
    RADAR_STEP,
    RADAR_WARN_DIST,
    RADAR_LIMITS_KMH,
    getCurvature,
    getHeading,
    getElevation,
    getSlope,
    getRadarInfo,
    getRadarBySlot,
    getShoulderHazardInfo,
    getShoulderHazardBySlot
  };

  if (typeof window !== 'undefined') {
    window.HighwayEnv = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root && (typeof window === 'undefined' || root !== window)) {
    root.HighwayEnv = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
