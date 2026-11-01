/* ==========================================================================
   OPEN ROAD DRIVING SIMULATOR: MAIN ENGINE, UNIFIED MENU & TELEMETRY
   ========================================================================== */

(function () {
  class PureDrivingGame {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.minimapCanvas = document.getElementById('minimap-canvas');
      this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

      // WebGL Renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (THREE.ACESFilmicToneMapping !== undefined) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.18;
      }
      if (THREE.sRGBEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }

      // Scene & Camera (9.5 km far plane for the 9km x 9km open world)
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.4,
        9500
      );

      // Camera modes: 0 = Chase Near, 1 = Chase Far, 2 = Cockpit Driver Cam, 3 = Hood Cam, 4 = Bumper Cam
      this.cameraMode = 0;
      this.cameraNames = ['CHASE NEAR', 'CHASE FAR', 'COCKPIT CAM', 'HOOD CAM', 'BUMPER CAM'];
      this.camPos = new THREE.Vector3(0, 4, 10);
      this.camLook = new THREE.Vector3(0, 2, -20);

      // Mouse-drag 360° Free-Look Orbit Camera state
      this.isMouseOrbiting = false;
      this.lastMouseX = 0;
      this.lastMouseY = 0;
      this.orbitYaw = 0;
      this.orbitPitch = 0;

      // Live Performance Sprint Timer, G-Meter & Thermal State
      this.perfTimer = {
        armed: true,
        running: false,
        startTime: 0,
        t100: null,
        t200: null,
        t300: null,
        vmax: 0
      };
      this.lastSpeedMs = 0;
      this.smoothLongG = 0;
      this.smoothLatG = 0;
      this.brakeHeat = 0;
      this.backfireFlashTimer = 0;
      this.lastGearForFlash = 1;

      // Default to KM/H so real-world 300–531 KM/H top speeds read directly!
      this.useKmh = true;

      // 6 Forest & Alpine Weather Presets (Randomized on Startup & Dynamic!)
      this.weatherPresets = [
        {
          name: 'SUNLIT FOREST NOON',
          skyTop: '#005bea',
          skyHorizon: '#8fd3f4',
          groundBounce: '#2a3d28',
          skyTopHex: 0x005bea,
          skyHorizonHex: 0x8fd3f4,
          cloudColorHex: 0xffffff,
          fogColor: 0x99d8f5,
          fogDensity: 0.00012,
          sunColor: 0xfff9eb,
          sunIntensity: 1.75,
          ambientColor: 0xaac4e6,
          ambientIntensity: 1.0,
          sunDir: [0.35, 0.82, 0.45],
          nightStars: 0.0,
          wetRoads: false,
          headlightsOn: false,
          rain: false
        },
        {
          name: 'GOLDEN HOUR SUNSET',
          skyTop: '#16235a',
          skyHorizon: '#ff8c61',
          groundBounce: '#2b2230',
          skyTopHex: 0x16235a,
          skyHorizonHex: 0xff8c61,
          cloudColorHex: 0xffd1b3,
          fogColor: 0xe69572,
          fogDensity: 0.00016,
          sunColor: 0xffb870,
          sunIntensity: 1.65,
          ambientColor: 0x9b82b8,
          ambientIntensity: 0.95,
          sunDir: [0.55, 0.28, -0.78],
          nightStars: 0.0,
          wetRoads: false,
          headlightsOn: false,
          rain: false
        },
        {
          name: 'EMERALD MORNING MIST',
          skyTop: '#244b5a',
          skyHorizon: '#a8d5cf',
          groundBounce: '#1f3326',
          skyTopHex: 0x244b5a,
          skyHorizonHex: 0xa8d5cf,
          cloudColorHex: 0xd8f3ef,
          fogColor: 0x9bc4be,
          fogDensity: 0.00038,
          sunColor: 0xe6fff9,
          sunIntensity: 1.35,
          ambientColor: 0x8cb8b2,
          ambientIntensity: 0.95,
          sunDir: [0.45, 0.42, 0.55],
          nightStars: 0.0,
          wetRoads: true,
          headlightsOn: true,
          rain: false
        },
        {
          name: 'RAINY FOREST STORM',
          skyTop: '#15202e',
          skyHorizon: '#4e6378',
          groundBounce: '#151f26',
          skyTopHex: 0x15202e,
          skyHorizonHex: 0x4e6378,
          cloudColorHex: 0x73889e,
          fogColor: 0x3d4f61,
          fogDensity: 0.00036,
          sunColor: 0xa6c4e0,
          sunIntensity: 1.05,
          ambientColor: 0x627a94,
          ambientIntensity: 0.88,
          sunDir: [0.25, 0.58, -0.65],
          nightStars: 0.0,
          wetRoads: true,
          headlightsOn: true,
          rain: true
        },
        {
          name: 'ALPINE DUSK TWILIGHT',
          skyTop: '#0d1536',
          skyHorizon: '#c9597a',
          groundBounce: '#1b162a',
          skyTopHex: 0x0d1536,
          skyHorizonHex: 0xc9597a,
          cloudColorHex: 0xe895ab,
          fogColor: 0x5c3658,
          fogDensity: 0.00022,
          sunColor: 0xff8a9e,
          sunIntensity: 1.25,
          ambientColor: 0x6e568f,
          ambientIntensity: 0.88,
          sunDir: [-0.62, 0.18, -0.72],
          nightStars: 0.45,
          wetRoads: false,
          headlightsOn: true,
          rain: false
        },
        {
          name: 'STARLIT NIGHT DRIVE',
          skyTop: '#050818',
          skyHorizon: '#23174a',
          groundBounce: '#120d24',
          skyTopHex: 0x050818,
          skyHorizonHex: 0x23174a,
          cloudColorHex: 0x382966,
          fogColor: 0x0e0c24,
          fogDensity: 0.00024,
          sunColor: 0x7c96ff,
          sunIntensity: 0.78,
          ambientColor: 0x463d80,
          ambientIntensity: 0.82,
          sunDir: [-0.45, 0.35, -0.75],
          nightStars: 1.0,
          wetRoads: true,
          headlightsOn: true,
          rain: false
        }
      ];
      this.weatherIndex = 0;
      this.weatherTimer = 0;

      // Input State
      this.input = {
        throttle: 0,
        brake: 0,
        left: false,
        right: false,
        handbrake: false,
        boost: false
      };

      this.currentCarIndex = 0;
      this.customPaintHex = null;

      this.initLightingAndSky();
      this.world = new window.HorizonWorld(this.scene);
      this.aiManager = new window.HorizonCars.AIDrivatarManager(this.scene, this.world);

      const initialSpec = window.HorizonCars.CAR_ROSTER[this.currentCarIndex];
      this.vehicle = new window.HorizonPhysicsVehicle(this.world, initialSpec);
      this.spawnPlayerCarMesh();

      this.camPos.set(
        this.vehicle.x - Math.sin(this.vehicle.heading) * 6.8,
        this.vehicle.y + 2.4,
        this.vehicle.z - Math.cos(this.vehicle.heading) * 6.8
      );

      this.initParticles();
      this.initRainSystem();
      this.initSkidmarks();

      this.calcLocked = true;
      this.initCalculatorLayer();
      this.bindEvents();
      this.populateGarageModal();
      this.populateFastTravelModal();
      // Pick a random forest weather preset on startup!
      this.applyRandomWeather();

      this.clock = new THREE.Clock();
      this.elapsedTime = 0;
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    /* ----------------------------------------------------------------------
       LIGHTING, CLOUD SKY DOME & CUBEMAP REFLECTIONS
       ---------------------------------------------------------------------- */
    initLightingAndSky() {
      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
      this.scene.add(this.ambientLight);

      this.hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x2c3548, 0.72);
      this.scene.add(this.hemiLight);

      this.sunLight = new THREE.DirectionalLight(0xffb870, 1.65);
      this.sunLight.position.set(380, 165, -420);
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 1200;
      const d = 135;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.bias = -0.0004;
      this.scene.add(this.sunLight);
      this.scene.add(this.sunLight.target);

      const skyGeo = new THREE.SphereGeometry(7800, 40, 24);
      const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          topColor: { value: new THREE.Color(0x16235a) },
          bottomColor: { value: new THREE.Color(0xff8c61) },
          cloudColor: { value: new THREE.Color(0xffd1b3) },
          sunDir: { value: new THREE.Vector3(0.55, 0.28, -0.78).normalize() },
          uTime: { value: 0.0 },
          uNightStars: { value: 0.0 }
        },
        vertexShader: `
          varying vec3 vLocalPos;
          void main() {
            vLocalPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform vec3 cloudColor;
          uniform vec3 sunDir;
          uniform float uTime;
          uniform float uNightStars;
          varying vec3 vLocalPos;

          float hash(vec2 p) {
            vec2 p2 = mod(p, 289.0);
            return fract(sin(dot(p2, vec2(12.9898, 78.233))) * 43758.5453);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }

          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
              v += a * noise(p);
              p *= 2.02;
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec3 dir = normalize(vLocalPos);
            float h = clamp(dir.y, 0.0001, 1.0);

            vec3 col = mix(bottomColor, topColor, pow(h, 0.55));

            float sunAmt = clamp(dot(dir, sunDir), 0.0, 1.0);
            float sunAmt2 = sunAmt * sunAmt;
            float sunAmt6 = sunAmt2 * sunAmt2 * sunAmt2;
            col += bottomColor * sunAmt6 * 0.52;
            col += vec3(1.0, 0.96, 0.86) * smoothstep(0.995, 0.9992, sunAmt) * 1.35;

            if (dir.y > 0.03) {
              vec2 uv = (dir.xz / (dir.y + 0.22)) * 1.55 + vec2(uTime * 0.012, uTime * 0.006);
              float c = fbm(uv);
              float cloudMask = smoothstep(0.45, 0.78, c) * smoothstep(0.03, 0.22, dir.y);
              vec3 litCloud = mix(cloudColor, vec3(1.0, 0.94, 0.84), sunAmt2 * sunAmt * 0.65);
              col = mix(col, litCloud, cloudMask * 0.72);
            }

            if (uNightStars > 0.01 && dir.y > 0.08) {
              float sHash = hash(floor((dir.xz / (dir.y + 0.15)) * 180.0));
              float starVal = smoothstep(0.985, 0.999, sHash);
              col += vec3(starVal) * uNightStars * smoothstep(0.08, 0.35, dir.y);
            }

            gl_FragColor = vec4(clamp(col, 0.0, 4.0), 1.0);
          }
        `
      });
      this.skyDome = new THREE.Mesh(skyGeo, skyMat);
      this.scene.add(this.skyDome);

      this.scene.fog = new THREE.FogExp2(0xe69572, 0.00038);
    }

    updateEnvironmentReflectionMap(preset) {
      const faces = [];
      for (let i = 0; i < 6; i++) {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext('2d');

        if (i === 2) {
          const topGrad = ctx.createRadialGradient(128, 128, 12, 128, 128, 180);
          topGrad.addColorStop(0.0, '#ffffff');
          topGrad.addColorStop(0.25, preset.skyHorizon);
          topGrad.addColorStop(1.0, preset.skyTop);
          ctx.fillStyle = topGrad;
          ctx.fillRect(0, 0, 256, 256);
        } else if (i === 3) {
          ctx.fillStyle = preset.groundBounce;
          ctx.fillRect(0, 0, 256, 256);
        } else {
          const grad = ctx.createLinearGradient(0, 0, 0, 256);
          grad.addColorStop(0.0, preset.skyTop);
          grad.addColorStop(0.46, preset.skyHorizon);
          grad.addColorStop(0.51, '#ffffff');
          grad.addColorStop(0.55, preset.skyHorizon);
          grad.addColorStop(0.62, '#1e3222');
          grad.addColorStop(1.0, preset.groundBounce);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 256, 256);
        }
        faces.push(c);
      }

      const cubeTex = new THREE.CubeTexture(faces);
      cubeTex.mapping = THREE.CubeReflectionMapping;
      cubeTex.needsUpdate = true;
      this.scene.environment = cubeTex;
    }

    applyRandomWeather() {
      let nextIdx = Math.floor(Math.random() * this.weatherPresets.length);
      if (nextIdx === this.weatherIndex && this.weatherPresets.length > 1) {
        nextIdx = (nextIdx + 1 + Math.floor(Math.random() * (this.weatherPresets.length - 1))) % this.weatherPresets.length;
      }
      this.applyWeatherPreset(nextIdx);
    }

    applyWeatherPreset(index) {
      this.weatherIndex = index % this.weatherPresets.length;
      const p = this.weatherPresets[this.weatherIndex];

      const u = this.skyDome.material.uniforms;
      u.topColor.value.setHex(p.skyTopHex);
      u.bottomColor.value.setHex(p.skyHorizonHex);
      u.cloudColor.value.setHex(p.cloudColorHex);
      u.sunDir.value.fromArray(p.sunDir).normalize();
      u.uNightStars.value = p.nightStars;

      this.scene.fog.color.setHex(p.fogColor);
      this.scene.fog.density = p.fogDensity;

      this.sunLight.color.setHex(p.sunColor);
      this.sunLight.intensity = p.sunIntensity;
      this.ambientLight.color.setHex(p.ambientColor);
      this.ambientLight.intensity = p.ambientIntensity;

      if (this.world && this.world.setWetRoads) {
        this.world.setWetRoads(p.wetRoads);
      }

      if (this.headlightSpot) {
        this.headlightSpot.visible = p.headlightsOn;
      }
      if (this.headlightBeamGroup) {
        this.headlightBeamGroup.visible = p.headlightsOn;
      }

      if (this.rainSystem) {
        this.rainSystem.visible = !!p.rain;
      }

      this.updateEnvironmentReflectionMap(p);

      const btnW = document.getElementById('btn-setting-weather');
      if (btnW) btnW.textContent = `WEATHER: ${p.name} [T]`;
    }

    /* ----------------------------------------------------------------------
       SPAWN / SWITCH PLAYER CAR
       ---------------------------------------------------------------------- */
    spawnPlayerCarMesh() {
      if (this.playerCarBuilt) {
        this.scene.remove(this.playerCarBuilt.root);
      }

      const spec = window.HorizonCars.CAR_ROSTER[this.currentCarIndex];
      const paint = this.customPaintHex !== null ? this.customPaintHex : spec.color;
      this.playerCarBuilt = window.HorizonCars.createCarMesh(spec, paint, true);
      this.scene.add(this.playerCarBuilt.root);

      this.headlightSpot = new THREE.SpotLight(0xf0fcff, 3.2, 125, Math.PI / 3.5, 0.45, 1.1);
      this.headlightSpot.position.set(0, 1.1, 2.2);
      this.headlightSpot.target.position.set(0, 0.1, 36);
      this.playerCarBuilt.root.add(this.headlightSpot);
      this.playerCarBuilt.root.add(this.headlightSpot.target);
      this.headlightSpot.visible = this.weatherPresets[this.weatherIndex].headlightsOn;

      // Volumetric 3D Headlight Light-Beam Cones for Night / Dusk / Storm Driving
      this.headlightBeamGroup = new THREE.Group();
      const coneGeo = new THREE.ConeGeometry(2.6, 18.0, 16, 1, true);
      coneGeo.translate(0, -9.0, 0);
      coneGeo.rotateX(-Math.PI / 2 + 0.05);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.085,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      [-0.72, 0.72].forEach((hx) => {
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set(hx, 0.68, 2.25);
        this.headlightBeamGroup.add(cone);
      });
      this.headlightBeamGroup.visible = this.weatherPresets[this.weatherIndex].headlightsOn;
      this.playerCarBuilt.root.add(this.headlightBeamGroup);

      const nameEl = document.getElementById('hud-car-name');
      if (nameEl) nameEl.textContent = `${spec.brand} ${spec.name}`;

      const miniSpecsEl = document.getElementById('hud-car-specs-mini');
      if (miniSpecsEl) {
        const topStr = this.useKmh ? `${spec.topSpeedKmh} KM/H` : `${spec.topSpeedMph} MPH`;
        miniSpecsEl.textContent = `${spec.hp.toLocaleString()} HP • ${spec.drivetrain} • ${topStr}`;
      }

      if (window.HorizonAudio) {
        window.HorizonAudio.setEngineProfile(spec.engineProfile);
      }
    }

    selectCar(index) {
      if (index < 0 || index >= window.HorizonCars.CAR_ROSTER.length) return;
      this.currentCarIndex = index;
      this.customPaintHex = null;
      this.perfTimer = {
        armed: true,
        running: false,
        startTime: 0,
        t100: null,
        t200: null,
        t300: null,
        vmax: 0
      };
      const el100 = document.getElementById('perf-0-100');
      const el200 = document.getElementById('perf-0-200');
      const el300 = document.getElementById('perf-0-300');
      const elVmax = document.getElementById('perf-vmax');
      if (el100) el100.textContent = '--';
      if (el200) el200.textContent = '--';
      if (el300) el300.textContent = '--';
      if (elVmax) elVmax.textContent = '0 KM/H';

      const spec = window.HorizonCars.CAR_ROSTER[index];
      this.vehicle.setCarSpec(spec);
      this.spawnPlayerCarMesh();
      this.populateGarageModal();
    }

    /* ----------------------------------------------------------------------
       PERSISTENT TIRE SKIDMARKS & TIRE SMOKE
       ---------------------------------------------------------------------- */
    initSkidmarks() {
      this.skidmarks = [];
      const geo = new THREE.PlaneGeometry(0.36, 1.35);
      geo.rotateX(-Math.PI / 2);

      for (let i = 0; i < 180; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0x0a0b0e,
          transparent: true,
          opacity: 0,
          depthWrite: false
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        this.scene.add(mesh);
        this.skidmarks.push({ mesh, life: 0, active: false });
      }
      this.skidCursor = 0;
    }

    spawnSkidmark(x, y, z, heading) {
      const s = this.skidmarks[this.skidCursor];
      this.skidCursor = (this.skidCursor + 1) % this.skidmarks.length;

      s.active = true;
      s.life = 8.0;
      s.mesh.position.set(x, y + 0.12, z);
      s.mesh.rotation.y = heading;
      s.mesh.material.opacity = 0.5;
      s.mesh.visible = true;
    }

    updateSkidmarks(dt) {
      const v = this.vehicle;
      const sinH = Math.sin(v.heading);
      const cosH = Math.cos(v.heading);

      if (
        v.isGrounded &&
        v.surfaceType === 'TARMAC' &&
        v.speedKmh > 18 &&
        (v.slipAngleDeg > 12 || this.input.handbrake || v.wheelspin > 0.35)
      ) {
        [-0.92, 0.92].forEach((wxOff) => {
          const wx = v.x + wxOff * cosH - 1.42 * sinH;
          const wz = v.z - wxOff * sinH - 1.42 * cosH;
          const wy = this.world.getTerrainHeight(wx, wz);
          this.spawnSkidmark(wx, wy, wz, v.heading);
        });
      }

      for (let i = 0; i < this.skidmarks.length; i++) {
        const s = this.skidmarks[i];
        if (!s.active) continue;
        s.life -= dt;
        if (s.life <= 0) {
          s.active = false;
          s.mesh.visible = false;
        } else if (s.life < 2.0) {
          s.mesh.material.opacity = (s.life / 2.0) * 0.5;
        }
      }
    }

    initParticles() {
      this.particles = [];
      const geo = new THREE.SphereGeometry(0.42, 7, 7);

      for (let i = 0; i < 100; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          depthWrite: false
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        this.scene.add(mesh);
        this.particles.push({
          mesh,
          active: false,
          life: 0,
          maxLife: 1,
          vx: 0,
          vy: 0,
          vz: 0,
          scaleRate: 2.2
        });
      }
      this.particleCursor = 0;
    }

    spawnParticle(x, y, z, vx, vy, vz, colorHex, maxLife, scaleRate) {
      const p = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.particles.length;

      p.active = true;
      p.life = 0;
      p.maxLife = maxLife || 0.75;
      p.vx = vx;
      p.vy = vy;
      p.vz = vz;
      p.scaleRate = scaleRate || 2.5;

      p.mesh.position.set(x, y, z);
      p.mesh.scale.setScalar(0.5);
      p.mesh.material.color.setHex(colorHex);
      p.mesh.material.opacity = 0.48;
      p.mesh.visible = true;
    }

    updateParticles(dt) {
      const v = this.vehicle;
      const sinH = Math.sin(v.heading);
      const cosH = Math.cos(v.heading);

      if (v.isGrounded && v.speedKmh > 18) {
        const isOffroad = v.surfaceType !== 'TARMAC';
        const inShallowWater = Math.hypot(v.x - (-1250), v.z - 420) < 330 || v.x > 3150;
        const isWetWeather = this.weatherPresets[this.weatherIndex] && this.weatherPresets[this.weatherIndex].wetRoads;
        const shouldEmit =
          isOffroad ||
          inShallowWater ||
          (isWetWeather && v.speedKmh > 75) ||
          v.slipAngleDeg > 13 ||
          this.input.handbrake ||
          v.wheelspin > 0.4;

        if (shouldEmit) {
          const pColor = inShallowWater
            ? 0xbae6fd
            : isOffroad
            ? 0x5c4d3c
            : isWetWeather && v.slipAngleDeg <= 13
            ? 0xcbd5e1
            : 0xf1f5f9;
          [-0.92, 0.92].forEach((wheelX) => {
            const wx = v.x + wheelX * cosH - 1.48 * sinH;
            const wz = v.z - wheelX * sinH - 1.48 * cosH;
            const wy = v.y + 0.22;
            this.spawnParticle(
              wx + (Math.random() - 0.5) * 0.35,
              wy,
              wz + (Math.random() - 0.5) * 0.35,
              (Math.random() - 0.5) * 2.4,
              inShallowWater ? 1.8 + Math.random() * 2.2 : 1.0 + Math.random() * 1.4,
              (Math.random() - 0.5) * 2.4,
              pColor,
              inShallowWater ? 0.55 : 0.68,
              inShallowWater ? 3.8 : 3.4
            );
          });
        }
      }

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }
        const t = p.life / p.maxLife;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.scale.setScalar(0.5 + t * p.scaleRate);
        p.mesh.material.opacity = (1 - t) * 0.4;
      }
    }

    initRainSystem() {
      const dropCount = 900;
      const positions = new Float32Array(dropCount * 6);
      this.rainDrops = [];
      for (let i = 0; i < dropCount; i++) {
        const rx = (Math.random() - 0.5) * 90;
        const ry = Math.random() * 36;
        const rz = (Math.random() - 0.5) * 90;
        this.rainDrops.push({ x: rx, y: ry, z: rz });
        const base = i * 6;
        positions[base] = rx;
        positions[base + 1] = ry;
        positions[base + 2] = rz;
        positions[base + 3] = rx;
        positions[base + 4] = ry - 1.3;
        positions[base + 5] = rz;
      }
      const rainGeo = new THREE.BufferGeometry();
      rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const rainMat = new THREE.LineBasicMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.45
      });
      this.rainSystem = new THREE.LineSegments(rainGeo, rainMat);
      this.rainSystem.visible = false;
      this.scene.add(this.rainSystem);
    }

    updateRainSystem(dt) {
      if (!this.rainSystem || !this.rainSystem.visible) return;
      const v = this.vehicle;
      this.rainSystem.position.set(v.x, v.y, v.z);
      const posAttr = this.rainSystem.geometry.attributes.position;
      const arr = posAttr.array;
      for (let i = 0; i < this.rainDrops.length; i++) {
        const d = this.rainDrops[i];
        d.y -= 34 * dt;
        if (d.y < 0) {
          d.y = 34 + Math.random() * 4;
          d.x = (Math.random() - 0.5) * 90;
          d.z = (Math.random() - 0.5) * 90;
        }
        const base = i * 6;
        arr[base] = d.x;
        arr[base + 1] = d.y;
        arr[base + 2] = d.z;
        arr[base + 3] = d.x - v.vx * 0.015;
        arr[base + 4] = d.y - 1.35;
        arr[base + 5] = d.z - v.vz * 0.015;
      }
      posAttr.needsUpdate = true;
    }

    /* ----------------------------------------------------------------------
       UPDATE PLAYER CAR MESH & CAMERA
       ---------------------------------------------------------------------- */
    updateCarAndCamera(dt) {
      const v = this.vehicle;
      const built = this.playerCarBuilt;

      built.root.position.set(v.x, v.y, v.z);
      built.root.rotation.order = 'YXZ';
      built.root.rotation.y = v.heading;
      built.root.rotation.x = v.pitch;
      built.root.rotation.z = v.roll;

      built.chassis.rotation.x = v.chassisPitch;
      built.chassis.rotation.z = v.chassisRoll;
      built.chassis.position.y = v.chassisHeave;

      // Animate cockpit steering wheel
      if (built.steeringWheel) {
        built.steeringWheel.rotation.z = -v.steerAngle * 1.45;
      }

      // Animate Active Aerodynamics (Speed Deployment, DRS Boost & Airbrake!)
      if (built.activeWing && built.activeWing.userData) {
        const ud = built.activeWing.userData;
        const speedDeployed = v.speedKmh > 120;
        const airbraking = this.input.brake > 0 && v.speedKmh > 95;
        const targetY = ud.baseY + (speedDeployed || airbraking ? ud.deployLift : 0);
        const targetPitch = airbraking
          ? 0.58 // Steep +33° Airbrake tilt under hard braking!
          : v.isBoosting
          ? 0.01 // Flat low-drag DRS mode during boost!
          : speedDeployed
          ? ud.basePitch
          : 0.04;
        built.activeWing.position.y += (targetY - built.activeWing.position.y) * Math.min(1, dt * 8);
        built.activeWing.rotation.x += (targetPitch - built.activeWing.rotation.x) * Math.min(1, dt * 10);
      }

      // Thermal Glowing Carbon-Ceramic Brake Discs
      const braking = this.input.brake > 0 || this.input.handbrake;
      if (this.input.brake > 0 && v.speedKmh > 65) {
        this.brakeHeat = Math.min(1.0, this.brakeHeat + dt * (v.speedKmh / 240) * 0.95);
      } else {
        const coolRate = 0.22 + (v.speedKmh / 350) * 0.35;
        this.brakeHeat = Math.max(0.0, this.brakeHeat - dt * coolRate);
      }
      if (built.rotorMat) {
        built.rotorMat.emissiveIntensity = Math.pow(this.brakeHeat, 1.4) * 2.2;
      }

      const wheelSpinDelta = (v.forwardSpeed + v.wheelspin * 18) * dt * 2.3;
      for (let i = 0; i < built.wheels.length; i++) {
        const w = built.wheels[i];
        w.spinGroup.rotation.x += wheelSpinDelta;
        if (w.front) {
          w.steerPivot.rotation.y = v.steerAngle * 0.52;
        }
      }

      built.brakelightMat.color.setHex(braking ? 0xff1e42 : 0x880015);
      if (built.brakeLightPoint) {
        built.brakeLightPoint.intensity = braking ? 2.4 : 0.45;
      }

      // Trigger Exhaust Backfire Pop Flash on Upshift or High-RPM Overrun
      if (v.gear !== this.lastGearForFlash) {
        if (typeof v.gear === 'number' && typeof this.lastGearForFlash === 'number' && v.gear > this.lastGearForFlash && v.rpm > 0.55) {
          this.backfireFlashTimer = 0.09;
        }
        this.lastGearForFlash = v.gear;
      }
      if (this.input.throttle < 0.1 && v.rpm > 0.62 && v.speedKmh > 60 && Math.random() < dt * 3.5) {
        this.backfireFlashTimer = 0.055;
      }
      if (this.backfireFlashTimer > 0) {
        this.backfireFlashTimer = Math.max(0, this.backfireFlashTimer - dt);
      }

      const showFlame = v.isBoosting || this.backfireFlashTimer > 0;
      built.exhaustFlames.forEach((flame) => {
        flame.visible = showFlame;
        if (showFlame) {
          flame.material.color.setHex(v.isBoosting ? 0x38bdf8 : 0xff8c1a);
          flame.scale.set(1, 1, 0.7 + Math.random() * 0.85);
        }
      });
      if (built.backfireLight) {
        built.backfireLight.intensity = showFlame ? (1.8 + Math.random() * 1.4) : 0;
      }

      const preset = this.weatherPresets[this.weatherIndex];
      this.sunLight.position.set(
        v.x + preset.sunDir[0] * 320,
        v.y + Math.max(120, preset.sunDir[1] * 320),
        v.z + preset.sunDir[2] * 320
      );
      this.sunLight.target.position.set(v.x, v.y, v.z);
      this.skyDome.position.set(v.x, 0, v.z);
      this.skyDome.material.uniforms.uTime.value = this.elapsedTime;

      const targetFov = 58 + Math.min(20, (v.speedKmh / 420) * 18) + (v.isBoosting ? 4 : 0);
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 6);
      this.camera.updateProjectionMatrix();

      // Auto-return mouse orbit smoothly when not dragging
      if (!this.isMouseOrbiting) {
        this.orbitYaw *= Math.exp(-4.5 * dt);
        this.orbitPitch *= Math.exp(-4.5 * dt);
      }

      let followAngle = v.heading + this.orbitYaw;
      if (!this.isMouseOrbiting && v.speedKmh > 25 && v.forwardSpeed > 0) {
        const velAngle = Math.atan2(v.vx, v.vz);
        let diff = velAngle - v.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        followAngle = v.heading + diff * 0.42 + this.orbitYaw;
      }

      const sinF = Math.sin(followAngle);
      const cosF = Math.cos(followAngle);
      const sinH = Math.sin(v.heading);
      const cosH = Math.cos(v.heading);

      if (this.cameraMode === 2) {
        // COCKPIT DRIVER CAM (Inside Cabin Behind Animated Steering Wheel!)
        const cx = v.x + 0.32 * cosH - 0.14 * sinH;
        const cz = v.z - 0.32 * sinH - 0.14 * cosH;
        const cy = v.y + 1.02 + v.chassisHeave * 0.6;
        this.camera.position.set(cx, cy, cz);
        this.camera.lookAt(
          v.x + sinH * 40,
          v.y + 0.96 - Math.sin(v.pitch + v.chassisPitch) * 35,
          v.z + cosH * 40
        );
      } else if (this.cameraMode === 3) {
        // HOOD CAM
        const hx = v.x + sinH * 0.48;
        const hz = v.z + cosH * 0.48;
        const hy = v.y + 1.24;
        this.camera.position.set(hx, hy, hz);
        this.camera.lookAt(
          v.x + sinH * 45,
          v.y + 1.05 - Math.sin(v.pitch) * 35,
          v.z + cosH * 45
        );
      } else if (this.cameraMode === 4) {
        // LOW BUMPER CAM
        const bx = v.x + sinH * 2.15;
        const bz = v.z + cosH * 2.15;
        const by = v.y + 0.56;
        this.camera.position.set(bx, by, bz);
        this.camera.lookAt(
          v.x + sinH * 55,
          v.y + 0.52 - Math.sin(v.pitch) * 40,
          v.z + cosH * 55
        );
      } else {
        const distBack = this.cameraMode === 0 ? 6.4 : 9.2;
        const heightUp = (this.cameraMode === 0 ? 2.22 : 3.25) + this.orbitPitch * 2.5;

        const desiredX = v.x - sinF * distBack;
        const desiredZ = v.z - cosF * distBack;
        const terrainUnderCam = this.world.getTerrainHeight(desiredX, desiredZ);
        const desiredY = Math.max(terrainUnderCam + 0.85, v.y + heightUp);

        const stiff = this.isMouseOrbiting ? 1.0 : Math.min(1, dt * 13.5);
        this.camPos.x += (desiredX - this.camPos.x) * stiff;
        this.camPos.y += (desiredY - this.camPos.y) * stiff;
        this.camPos.z += (desiredZ - this.camPos.z) * stiff;

        // Hard camera floor clamp so chase camera never dips below off-road hillsides
        const liveCamFloor = this.world.getTerrainHeight(this.camPos.x, this.camPos.z) + 0.95;
        if (this.camPos.y < liveCamFloor) {
          this.camPos.y = liveCamFloor;
        }

        const lookX = v.x + sinF * (this.isMouseOrbiting ? 0.0 : 7.5);
        const lookY = v.y + 1.05;
        const lookZ = v.z + cosF * (this.isMouseOrbiting ? 0.0 : 7.5);
        this.camLook.x += (lookX - this.camLook.x) * Math.min(1, dt * 16);
        this.camLook.y += (lookY - this.camLook.y) * Math.min(1, dt * 16);
        this.camLook.z += (lookZ - this.camLook.z) * Math.min(1, dt * 16);

        this.camera.position.copy(this.camPos);
        this.camera.lookAt(this.camLook);
      }
    }

    /* ----------------------------------------------------------------------
       ROAD RADAR MINIMAP & HUD UPDATER
       ---------------------------------------------------------------------- */
    renderMinimap() {
      const ctx = this.minimapCtx;
      if (!ctx) return;

      const w = this.minimapCanvas.width;
      const h = this.minimapCanvas.height;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const scale = 0.082;

      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.vehicle.heading - Math.PI);

      const vx = this.vehicle.x;
      const vz = this.vehicle.z;

      this.world.roadSplines.forEach((road) => {
        ctx.beginPath();
        for (let i = 0; i < road.pts.length; i += 2) {
          const px = (road.pts[i].x - vx) * scale;
          const pz = (road.pts[i].z - vz) * scale;
          if (i === 0) ctx.moveTo(px, pz);
          else ctx.lineTo(px, pz);
        }
        if (road.closed) ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
        ctx.lineWidth = Math.max(2.2, road.width * scale * 1.15);
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      this.aiManager.drivatars.forEach((ai) => {
        const ax = (ai.x - vx) * scale;
        const az = (ai.z - vz) * scale;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(ax, az, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6.5, 7);
      ctx.lineTo(0, 3.5);
      ctx.lineTo(-6.5, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    updateHUD(dt) {
      const v = this.vehicle;

      const displaySpeed = Math.round(this.useKmh ? v.speedKmh : v.speedMph);
      document.getElementById('hud-speed').textContent = displaySpeed;
      document.getElementById('hud-speed-unit').textContent = this.useKmh ? 'KM/H' : 'MPH';
      document.getElementById('hud-rpm-num').textContent = `${v.currentRpm.toLocaleString()} RPM`;

      const gearEl = document.getElementById('hud-gear');
      gearEl.textContent = v.gear;
      gearEl.classList.toggle('redline', v.rpm > 0.88);

      const rpmArc = document.getElementById('tacho-rpm-arc');
      if (rpmArc) {
        rpmArc.style.strokeDashoffset = 440 - v.rpm * 310;
      }

      const nitroArc = document.getElementById('tacho-nitro-arc');
      if (nitroArc) {
        nitroArc.style.strokeDashoffset = 440 - v.nitro * 310;
      }

      const surfEl = document.getElementById('hud-surface-pill');
      surfEl.textContent = v.surfaceType;
      surfEl.className = `tele-pill surface-${v.surfaceType.toLowerCase()}`;

      document.getElementById('hud-mode-pill').textContent = v.handlingMode;
      document.getElementById('biome-name').textContent = this.world.getZoneName(v.x, v.z);

      // Live G-Force Meter & 0–100 / 0–200 / 0–300 km/h Performance Timer
      const safeDt = Math.max(0.005, dt || 0.016);
      const speedMs = v.speedKmh / 3.6;
      const longG = (speedMs - (this.lastSpeedMs || 0)) / (safeDt * 9.81);
      this.lastSpeedMs = speedMs;
      const latG = (v.yawRate * speedMs) / 9.81;

      this.smoothLongG = this.smoothLongG * 0.82 + longG * 0.18;
      this.smoothLatG = this.smoothLatG * 0.82 + latG * 0.18;
      const totalG = Math.hypot(this.smoothLongG, this.smoothLatG);

      const gDot = document.getElementById('hud-g-dot');
      if (gDot) {
        const pxX = THREE.MathUtils.clamp(-this.smoothLatG * 9, -15, 15);
        const pxY = THREE.MathUtils.clamp(this.smoothLongG * 9, -15, 15);
        gDot.style.transform = `translate(calc(-50% + ${pxX.toFixed(1)}px), calc(-50% + ${pxY.toFixed(1)}px))`;
      }
      const gValEl = document.getElementById('hud-g-val');
      if (gValEl) {
        gValEl.textContent = `${Math.min(3.5, totalG).toFixed(1)}G`;
      }

      // Automatic 0–100, 0–200, 0–300 km/h performance sprint timer
      if (v.speedKmh > this.perfTimer.vmax) {
        this.perfTimer.vmax = Math.round(v.speedKmh);
        const vmaxEl = document.getElementById('perf-vmax');
        if (vmaxEl) vmaxEl.textContent = `${this.perfTimer.vmax} KM/H`;
      }

      if (v.speedKmh < 3.5) {
        this.perfTimer.armed = true;
        this.perfTimer.running = false;
        this.perfTimer.startTime = 0;
      } else if (this.perfTimer.armed && v.speedKmh >= 3.5 && this.input.throttle > 0.2) {
        this.perfTimer.armed = false;
        this.perfTimer.running = true;
        this.perfTimer.startTime = this.elapsedTime;
        this.perfTimer.t100 = null;
        this.perfTimer.t200 = null;
        this.perfTimer.t300 = null;
      }

      if (this.perfTimer.running) {
        const elapsed = this.elapsedTime - this.perfTimer.startTime;
        if (!this.perfTimer.t100 && v.speedKmh >= 100) {
          this.perfTimer.t100 = elapsed;
          const el100 = document.getElementById('perf-0-100');
          if (el100) el100.textContent = `${elapsed.toFixed(2)}s`;
        }
        if (!this.perfTimer.t200 && v.speedKmh >= 200) {
          this.perfTimer.t200 = elapsed;
          const el200 = document.getElementById('perf-0-200');
          if (el200) el200.textContent = `${elapsed.toFixed(2)}s`;
        }
        if (!this.perfTimer.t300 && v.speedKmh >= 300) {
          this.perfTimer.t300 = elapsed;
          const el300 = document.getElementById('perf-0-300');
          if (el300) el300.textContent = `${elapsed.toFixed(2)}s`;
          this.perfTimer.running = false;
        }
      }
    }

    /* ----------------------------------------------------------------------
       UNIFIED GAME MENU MODAL & TABS
       ---------------------------------------------------------------------- */
    populateGarageModal() {
      const grid = document.getElementById('garage-car-grid');
      if (!grid) return;
      grid.innerHTML = '';

      window.HorizonCars.CAR_ROSTER.forEach((car, idx) => {
        const card = document.createElement('div');
        card.className = `car-select-card ${idx === this.currentCarIndex ? 'selected' : ''}`;
        card.innerHTML = `
          <div class="car-card-top">
            <div>
              <div class="car-card-brand">${car.brand}</div>
              <div class="car-card-name">${car.name}</div>
            </div>
            <span class="car-category-tag">${car.category}</span>
          </div>
          <div class="car-specs-grid">
            <div class="spec-cell">
              <span class="spec-label">TOP SPEED</span>
              <span class="spec-val highlight">${car.topSpeedKmh} KM/H (${car.topSpeedMph} MPH)</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">POWER</span>
              <span class="spec-val">${car.hp.toLocaleString()} HP</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">0–100 KM/H</span>
              <span class="spec-val">${car.zeroTo100}</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">WEIGHT</span>
              <span class="spec-val">${car.weightKg.toLocaleString()} KG</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">DRIVETRAIN</span>
              <span class="spec-val">${car.drivetrain} (${car.gears}-SPD)</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">REDLINE</span>
              <span class="spec-val">${car.redlineRpm.toLocaleString()} RPM</span>
            </div>
          </div>
          <div class="car-card-desc">${car.desc}</div>
        `;
        card.addEventListener('click', () => {
          this.selectCar(idx);
          this.toggleMenu(false);
        });
        grid.appendChild(card);
      });
    }

    populateFastTravelModal() {
      const ftGrid = document.getElementById('fast-travel-grid');
      if (!ftGrid) return;
      ftGrid.innerHTML = '';

      this.world.spawnLocations.forEach((spot) => {
        const card = document.createElement('div');
        card.className = 'ft-card';
        card.innerHTML = `
          <h4>${spot.name}</h4>
          <p>${spot.desc}</p>
        `;
        card.addEventListener('click', () => {
          this.vehicle.teleport(spot.x, spot.z, spot.heading);
          this.toggleMenu(false);
        });
        ftGrid.appendChild(card);
      });
    }

    toggleMenu(forceState) {
      const modal = document.getElementById('modal-menu');
      if (!modal) return;
      const shouldOpen = forceState !== undefined ? forceState : !modal.classList.contains('open');
      modal.classList.toggle('open', shouldOpen);
    }

    /* ----------------------------------------------------------------------
       WORKING CALCULATOR DISGUISE LAYER (SECRET PASSCODE: 190311 + =)
       ---------------------------------------------------------------------- */
    initCalculatorLayer() {
      this.calcCurrent = '0';
      this.calcPrev = null;
      this.calcOperator = null;
      this.calcResetNext = false;
      this.calcRawDigits = '';

      const displayEl = document.getElementById('calc-display');
      const historyEl = document.getElementById('calc-history');

      this.updateCalcUI = () => {
        if (displayEl) displayEl.textContent = this.calcCurrent;
        if (historyEl) {
          const opSym =
            this.calcOperator === '*'
              ? '×'
              : this.calcOperator === '/'
              ? '÷'
              : this.calcOperator === '-'
              ? '−'
              : this.calcOperator || '';
          historyEl.textContent = this.calcPrev !== null ? `${this.calcPrev} ${opSym}` : '';
        }
      };

      const computeResult = (a, b, op) => {
        if (op === '+') return a + b;
        if (op === '-') return a - b;
        if (op === '*') return a * b;
        if (op === '/') return b === 0 ? 0 : a / b;
        return b;
      };

      this.handleCalcInput = (token) => {
        if (/^[0-9]$/.test(token)) {
          this.calcRawDigits = (this.calcRawDigits + token).slice(-12);
          if (this.calcCurrent === '0' || this.calcResetNext) {
            this.calcCurrent = token;
            this.calcResetNext = false;
          } else if (this.calcCurrent.length < 14) {
            this.calcCurrent += token;
          }
          this.updateCalcUI();
          return;
        }

        if (token === '.') {
          if (this.calcResetNext) {
            this.calcCurrent = '0.';
            this.calcResetNext = false;
          } else if (!this.calcCurrent.includes('.')) {
            this.calcCurrent += '.';
          }
          this.updateCalcUI();
          return;
        }

        if (token === 'AC') {
          this.calcCurrent = '0';
          this.calcPrev = null;
          this.calcOperator = null;
          this.calcResetNext = false;
          this.calcRawDigits = '';
          this.updateCalcUI();
          return;
        }

        if (token === 'BACK') {
          this.calcRawDigits = this.calcRawDigits.slice(0, -1);
          if (!this.calcResetNext) {
            this.calcCurrent = this.calcCurrent.length > 1 ? this.calcCurrent.slice(0, -1) : '0';
            this.updateCalcUI();
          }
          return;
        }

        if (token === 'SIGN') {
          if (this.calcCurrent !== '0') {
            this.calcCurrent = this.calcCurrent.startsWith('-')
              ? this.calcCurrent.slice(1)
              : '-' + this.calcCurrent;
            this.updateCalcUI();
          }
          return;
        }

        if (token === '%') {
          const val = parseFloat(this.calcCurrent) || 0;
          this.calcCurrent = String(Number((val / 100).toPrecision(10)));
          this.updateCalcUI();
          return;
        }

        if (token === '+' || token === '-' || token === '*' || token === '/') {
          const currVal = parseFloat(this.calcCurrent) || 0;
          if (this.calcPrev !== null && this.calcOperator && !this.calcResetNext) {
            const res = computeResult(this.calcPrev, currVal, this.calcOperator);
            this.calcPrev = Number(res.toPrecision(12));
            this.calcCurrent = String(this.calcPrev);
          } else {
            this.calcPrev = currVal;
          }
          this.calcOperator = token;
          this.calcResetNext = true;
          this.updateCalcUI();
          return;
        }

        if (token === '=') {
          // Check Secret Unlock Passcode: 190311 + =
          if (this.calcCurrent === '190311' || this.calcRawDigits.endsWith('190311')) {
            this.unlockGameFromCalculator();
            return;
          }

          if (this.calcPrev !== null && this.calcOperator) {
            const currVal = parseFloat(this.calcCurrent) || 0;
            const res = computeResult(this.calcPrev, currVal, this.calcOperator);
            const formatted = String(Number(res.toPrecision(12)));
            if (historyEl) {
              const opSym =
                this.calcOperator === '*'
                  ? '×'
                  : this.calcOperator === '/'
                  ? '÷'
                  : this.calcOperator === '-'
                  ? '−'
                  : this.calcOperator;
              historyEl.textContent = `${this.calcPrev} ${opSym} ${currVal} =`;
            }
            this.calcCurrent = formatted;
            this.calcPrev = null;
            this.calcOperator = null;
            this.calcResetNext = true;
            if (displayEl) displayEl.textContent = this.calcCurrent;
          }
        }
      };

      document.querySelectorAll('.calc-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.calc;
          if (action) this.handleCalcInput(action);
        });
      });

      const lockBtn = document.getElementById('btn-lock-calc');
      if (lockBtn) {
        lockBtn.addEventListener('click', () => this.lockToCalculator());
      }
    }

    unlockGameFromCalculator() {
      this.calcLocked = false;
      this.calcCurrent = '0';
      this.calcPrev = null;
      this.calcOperator = null;
      this.calcRawDigits = '';
      if (this.updateCalcUI) this.updateCalcUI();

      const layer = document.getElementById('calculator-layer');
      if (layer) layer.classList.add('hidden');
      document.title = 'OPEN ROAD DRIVING SIMULATOR';
      window.HorizonAudio.init();
    }

    lockToCalculator() {
      this.calcLocked = true;
      this.input.throttle = 0;
      this.input.brake = 0;
      this.input.left = false;
      this.input.right = false;
      this.input.handbrake = false;
      this.input.boost = false;
      this.toggleMenu(false);

      const layer = document.getElementById('calculator-layer');
      if (layer) layer.classList.remove('hidden');
      document.title = 'Calculator';
    }

    /* ----------------------------------------------------------------------
       INPUT & UI EVENT BINDINGS
       ---------------------------------------------------------------------- */
    bindEvents() {
      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });

      window.addEventListener('keydown', (e) => {
        // When Calculator Disguise Layer is active, route keyboard input to the calculator!
        if (this.calcLocked) {
          const key = e.key;
          if (/^[0-9]$/.test(key)) {
            e.preventDefault();
            this.handleCalcInput(key);
          } else if (key === '.') {
            e.preventDefault();
            this.handleCalcInput('.');
          } else if (key === '+' || key === '-' || key === '*' || key === '/') {
            e.preventDefault();
            this.handleCalcInput(key);
          } else if (key === '%') {
            e.preventDefault();
            this.handleCalcInput('%');
          } else if (key === '=' || key === 'Enter') {
            e.preventDefault();
            this.handleCalcInput('=');
          } else if (key === 'Backspace') {
            e.preventDefault();
            this.handleCalcInput('BACK');
          } else if (key === 'Escape' || key === 'c' || key === 'C') {
            e.preventDefault();
            this.handleCalcInput('AC');
          }
          return;
        }

        if (e.code === 'Backquote') {
          e.preventDefault();
          this.lockToCalculator();
          return;
        }

        window.HorizonAudio.init();
        const code = e.code;

        if (code === 'KeyW' || code === 'ArrowUp') this.input.throttle = 1;
        if (code === 'KeyS' || code === 'ArrowDown') this.input.brake = 1;
        if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = true;
        if (code === 'KeyD' || code === 'ArrowRight') this.input.right = true;
        if (code === 'Space') this.input.handbrake = true;
        if (code === 'ShiftLeft' || code === 'ShiftRight') this.input.boost = true;

        // Manual sequential gear shifts [Q] / [E]
        if (code === 'KeyQ') this.vehicle.shiftDown();
        if (code === 'KeyE') this.vehicle.shiftUp();

        // Number keys 1-9 & 0 for instant car selection across all 10 cars
        if (code.startsWith('Digit')) {
          const d = parseInt(code.replace('Digit', ''), 10);
          const idx = d === 0 ? 9 : d - 1;
          this.selectCar(idx);
        }

        if (code === 'KeyF') {
          const mode = this.vehicle.cycleHandlingMode();
          document.getElementById('btn-setting-handling').textContent = `MODE: ${mode} [F]`;
        }

        if (code === 'KeyR') {
          this.vehicle.resetToNearestRoad();
        }

        if (code === 'KeyC') {
          this.cameraMode = (this.cameraMode + 1) % 5;
          document.getElementById('btn-setting-camera').textContent =
            `CAMERA: ${this.cameraNames[this.cameraMode]} [C]`;
        }

        if (code === 'KeyT') {
          this.applyRandomWeather();
        }

        if (code === 'KeyM') {
          const muted = window.HorizonAudio.toggleMute();
          document.getElementById('btn-setting-audio').textContent =
            `AUDIO: ${muted ? 'MUTED' : 'ON'} [M]`;
        }

        if (code === 'Escape' || code === 'Tab' || code === 'KeyG') {
          e.preventDefault();
          this.toggleMenu();
        }
      });

      window.addEventListener('keyup', (e) => {
        const code = e.code;
        if (code === 'KeyW' || code === 'ArrowUp') this.input.throttle = 0;
        if (code === 'KeyS' || code === 'ArrowDown') this.input.brake = 0;
        if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = false;
        if (code === 'KeyD' || code === 'ArrowRight') this.input.right = false;
        if (code === 'Space') this.input.handbrake = false;
        if (code === 'ShiftLeft' || code === 'ShiftRight') this.input.boost = false;
      });

      // Single Top-Left Menu Trigger & Close Button
      document.getElementById('btn-open-menu').addEventListener('click', () => this.toggleMenu(true));
      document.getElementById('btn-close-menu').addEventListener('click', () => this.toggleMenu(false));

      // Menu Tab Switching
      document.querySelectorAll('.menu-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.menu-tab-btn').forEach((b) => b.classList.remove('active'));
          document.querySelectorAll('.menu-tab-pane').forEach((p) => p.classList.remove('active'));
          btn.classList.add('active');
          const pane = document.getElementById(btn.dataset.tab);
          if (pane) pane.classList.add('active');
        });
      });

      // Paint Swatches
      document.querySelectorAll('.paint-swatch').forEach((sw) => {
        sw.addEventListener('click', () => {
          const hex = parseInt(sw.dataset.hex, 16);
          this.customPaintHex = hex;
          if (this.playerCarBuilt) {
            this.playerCarBuilt.bodyMat.color.setHex(hex);
          }
        });
      });

      // Settings Buttons inside Menu
      document.getElementById('btn-setting-handling').addEventListener('click', () => {
        const mode = this.vehicle.cycleHandlingMode();
        document.getElementById('btn-setting-handling').textContent = `MODE: ${mode} [F]`;
      });

      document.getElementById('btn-setting-trans').addEventListener('click', () => {
        const mode = this.vehicle.toggleTransmissionMode();
        document.getElementById('btn-setting-trans').textContent = `GEARBOX: ${mode}`;
      });

      document.getElementById('btn-setting-units').addEventListener('click', () => {
        this.useKmh = !this.useKmh;
        document.getElementById('btn-setting-units').textContent =
          `UNITS: ${this.useKmh ? 'KM/H' : 'MPH'}`;
        this.spawnPlayerCarMesh();
      });

      document.getElementById('btn-setting-camera').addEventListener('click', () => {
        this.cameraMode = (this.cameraMode + 1) % 5;
        document.getElementById('btn-setting-camera').textContent =
          `CAMERA: ${this.cameraNames[this.cameraMode]} [C]`;
      });

      // Mouse-drag 360° Free-Look Orbit around the car
      this.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
          this.isMouseOrbiting = true;
          this.lastMouseX = e.clientX;
          this.lastMouseY = e.clientY;
        }
      });
      window.addEventListener('mousemove', (e) => {
        if (!this.isMouseOrbiting) return;
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.orbitYaw -= dx * 0.007;
        this.orbitPitch = THREE.MathUtils.clamp(this.orbitPitch + dy * 0.005, -0.15, 0.72);
      });
      window.addEventListener('mouseup', () => {
        this.isMouseOrbiting = false;
      });

      document.getElementById('btn-setting-weather').addEventListener('click', () => {
        this.applyRandomWeather();
      });

      document.getElementById('btn-setting-audio').addEventListener('click', () => {
        const muted = window.HorizonAudio.toggleMute();
        document.getElementById('btn-setting-audio').textContent =
          `AUDIO: ${muted ? 'MUTED' : 'ON'} [M]`;
      });

      document.getElementById('btn-setting-reset').addEventListener('click', () => {
        this.vehicle.resetToNearestRoad();
        this.toggleMenu(false);
      });

      document.getElementById('hud-speed-unit').addEventListener('click', () => {
        this.useKmh = !this.useKmh;
        document.getElementById('btn-setting-units').textContent =
          `UNITS: ${this.useKmh ? 'KM/H' : 'MPH'}`;
        this.spawnPlayerCarMesh();
      });
    }

    pollGamepad() {
      if (!navigator.getGamepads) return;
      const pads = navigator.getGamepads();
      const gp = pads && pads[0];
      if (!gp) return;

      const stickX = gp.axes[0] || 0;
      const r2 = gp.buttons[7] ? gp.buttons[7].value : 0;
      const l2 = gp.buttons[6] ? gp.buttons[6].value : 0;

      if (Math.abs(stickX) > 0.15) {
        this.input.left = stickX < -0.15;
        this.input.right = stickX > 0.15;
      }
      if (r2 > 0.1) this.input.throttle = r2;
      if (l2 > 0.1) this.input.brake = l2;
      if (gp.buttons[0] && gp.buttons[0].pressed) this.input.handbrake = true;
      if (gp.buttons[1] && gp.buttons[1].pressed) this.input.boost = true;
    }

    /* ----------------------------------------------------------------------
       MAIN ANIMATION LOOP
       ---------------------------------------------------------------------- */
    animate() {
      requestAnimationFrame(this.animate);

      const rawDt = this.clock.getDelta();
      const dt = Math.min(0.05, Math.max(0.001, rawDt));

      this.elapsedTime += dt;
      this.weatherTimer += dt;
      if (this.weatherTimer > 150) {
        this.weatherTimer = 0;
        this.applyRandomWeather();
      }
      if (!this.calcLocked) {
        this.pollGamepad();
      }

      this.vehicle.update(dt, this.input);
      this.aiManager.update(dt, this.vehicle);
      this.updateParticles(dt);
      this.updateRainSystem(dt);
      this.updateSkidmarks(dt);

      if (window.HorizonAudio && !this.calcLocked) {
        window.HorizonAudio.updateEngine(
          this.vehicle.rpm,
          this.input.throttle,
          this.vehicle.gear,
          this.vehicle.slipNormalized,
          this.vehicle.surfaceType,
          this.vehicle.isBoosting,
          this.vehicle.speedMph
        );
      }

      this.updateHUD(dt);
      this.renderMinimap();
      this.updateCarAndCamera(dt);
      this.renderer.render(this.scene, this.camera);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.horizonGame = new PureDrivingGame();
  });
})();
