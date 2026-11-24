/* ==========================================================================
   ENDLESS HIGHWAY — MAIN ENGINE, SHOP/GARAGE, TRANSMISSIONS, WEATHER & HUD
   ========================================================================== */

(function () {
  'use strict';

  const TRANS_DESCRIPTIONS = {
    AUTO: 'Automatic: smooth self-shifting gears that adapt automatically to highway throttle.',
    SEMI: 'Semi-Automatic: snappy paddle shifting with [E] Gear Up and [Q] Gear Down.',
    MANUAL: 'Manual + Clutch: hold [Left Shift] for clutch, then press [E] Gear Up or [Q] Gear Down.'
  };

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  class HighwayGame {
    constructor() {
      this.canvas = document.getElementById('game-canvas');

      this.profiler = window.HardwareProfiler ? new window.HardwareProfiler() : null;
      this.gfx = this.profiler
        ? this.profiler.profile
        : {
            tier: 'HIGH',
            pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
            shadowMapSize: 1024,
            shadowsEnabled: true,
            foliageMult: 0.78,
            anisotropy: 4,
            antialias: true,
            maxDrawDist: 1050
          };

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: this.gfx.antialias !== false,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(this.gfx.pixelRatio || 1);
      this.renderer.shadowMap.enabled = !!this.gfx.shadowsEnabled;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (THREE.ACESFilmicToneMapping !== undefined) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.06;
      }
      if (THREE.sRGBEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        58,
        window.innerWidth / window.innerHeight,
        0.12,
        this.gfx.maxDrawDist || 1050
      );

      // Camera state
      this.cameraMode = 0; // 0 = Chase, 1 = Far Chase, 2 = Interior, 3 = Hood
      this.cameraNames = ['Chase', 'Far Chase', 'Interior', 'Hood'];
      this.camPos = new THREE.Vector3(1.85, 2.8, 7.5);
      this.camLook = new THREE.Vector3(1.85, 1.1, -35);
      this.camLookTarget = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
      this.camPosProj = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
      this.playerProj = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
      this.eyeWorldVec = new THREE.Vector3();
      this.lookWorldVec = new THREE.Vector3();
      this.lastFov = 58;
      this.shakeMag = 0;

      // Economy & Progression
      this.economy = new window.HighwayEconomy.HighwayEconomy();
      const activeSpecs = this.economy.getActiveCarSpecs();

      // Core simulation modules
      this.env = new window.HighwayEnv.HighwayEnvironment(this.scene, this.gfx);
      this.traffic = new window.HighwayTraffic.HighwayTraffic(this.scene, this.env, {
        targetCount: 20,
        castShadow: !!this.gfx.shadowsEnabled
      });
      this.player = new window.HighwayPlayer.HighwayPlayer({
        getCurvature: window.HighwayEnv.getCurvature,
        transmissionMode: this.economy.getTransmission(),
        specs: activeSpecs
      });

      this.playerMesh = null;
      this.interiorRig = null;
      this.cameraMode = 0;
      this.hudMirrorEnabled = true;
      this.mirrorFrameCounter = 1;
      this.mirrorCamPos = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
      this.mirrorLookPos = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };

      this.initMirrorSystem();
      this.rebuildPlayerMesh();

      if (window.HighwayAudio) {
        window.HighwayAudio.setEngineProfile(activeSpecs.engineTone);
      }

      this.traffic.reset(this.player.s, this.player.getLaneIndex());

      // UI & State
      this.useKmh = true;
      this.calcLocked = true;
      this.paused = false;
      this.garageOpen = false;
      this.setupDrawerOpen = false;
      this.garageFilter = 'all';
      this.cleanStreakResetDone = false;
      this.hasUnlockedOnce = false;
      this.toastTimer = 0;
      this.bonusTimer = 0;
      this.saveTimer = 0;

      // Turn signals, hazards, beams, radar & horn state
      this.signalMode = 0; // -1 = Left, 0 = Off, +1 = Right, 2 = Hazards
      this.signalTimer = 0;
      this.signalStartD = 0;
      this.signalMovedEnough = false;
      this.lastBlinkOn = false;
      this.hornActive = false;
      this.headlightFlashHeld = false;
      this.headlightFlashPulse = 0;
      this.highBeamsActive = false;
      this.nightBeamMode = 'short'; // 'short' (low) or 'long' (high) at night
      this.beamMode = 'off';

      this.lastCheckedRadarSlot = -1;
      this.radarBeepTimer = 0;
      this.radarFlashTimer = 0;
      this.lastFineText = '';
      this.lastFineBannerTimer = 0;

      // Driving aids: Cruise Control [U], Electronic Speed Limiter [Y], Wipers [F] & Blind-Spot
      this.speedAssistMode = 'off'; // 'off' | 'cruise' | 'limit'
      this.speedAssistTargetKmh = 110;
      this.speedAssistAutoZone = false;
      this.wiperMode = 'AUTO'; // 'AUTO' | 'LOW' | 'HIGH' | 'OFF'
      this.blindSpot = { left: false, right: false, leftClose: false, rightClose: false };
      this.blindSpotChirpCooldown = 0;

      this.rightShiftHeld = false;
      this.input = {
        throttle: 0,
        brake: 0,
        left: false,
        right: false,
        clutch: false
      };

      // Cached DOM handles
      this.dom = {
        bank: document.getElementById('hud-bank'),
        statusSummary: document.getElementById('hud-status-summary'),
        btnDriveSetup: document.getElementById('btn-drive-setup'),
        setupDrawer: document.getElementById('drive-setup-drawer'),
        btnSetupGauge: document.getElementById('btn-setup-gauge'),
        btnSetupUnit: document.getElementById('btn-setup-unit'),
        btnSetupMirror: document.getElementById('btn-setup-mirror'),
        btnSetupAudio: document.getElementById('btn-setup-audio'),
        btnSetupQuality: document.getElementById('btn-setup-quality'),

        bottomRight: document.getElementById('hud-bottom-right'),
        clutchPill: document.getElementById('hud-clutch-pill'),
        rearMirrorBox: document.getElementById('hud-rear-mirror'),
        fxRadarFlash: document.getElementById('fx-radar-flash'),
        radarPill: document.getElementById('hud-radar-pill'),
        radarLimitNum: document.getElementById('hud-limit-num'),
        radarDist: document.getElementById('hud-radar-dist'),
        sigLeft: document.getElementById('sig-left'),
        sigHazard: document.getElementById('sig-hazard'),
        sigRight: document.getElementById('sig-right'),
        sigLowBeam: document.getElementById('sig-lowbeam'),
        sigHighBeam: document.getElementById('sig-highbeam'),
        assistControls: document.getElementById('hud-assist-controls'),
        btnAssistMode: document.getElementById('btn-assist-mode'),
        sigAssist: document.getElementById('sig-assist'),
        sigHorn: document.getElementById('sig-horn'),
        digitalCluster: document.getElementById('hud-digital-cluster'),
        analogCluster: document.getElementById('hud-analog-cluster'),
        speed: document.getElementById('hud-speed'),
        unit: document.getElementById('hud-unit'),
        gear: document.getElementById('hud-gear'),
        shiftHint: document.getElementById('hud-shift-hint'),
        rpmBar: document.getElementById('hud-rpm-bar'),
        distance: document.getElementById('hud-distance'),
        carName: document.getElementById('hud-car-name'),
        streak: document.getElementById('hud-streak'),

        analogRpmTicks: document.getElementById('analog-rpm-ticks'),
        analogSpeedTicks: document.getElementById('analog-speed-ticks'),
        analogRpmNeedle: document.getElementById('analog-rpm-needle'),
        analogSpeedNeedle: document.getElementById('analog-speed-needle'),
        analogGear: document.getElementById('analog-gear'),
        analogShiftHint: document.getElementById('analog-shift-hint'),
        analogSpeedNum: document.getElementById('analog-speed-num'),
        analogUnit: document.getElementById('analog-unit'),
        analogDistance: document.getElementById('analog-distance'),

        bonusPill: document.getElementById('hud-bonus-pill'),
        damageCard: document.getElementById('hud-damage-card'),
        conditionPct: document.getElementById('hud-condition-pct'),
        conditionFill: document.getElementById('hud-condition-fill'),
        toast: document.getElementById('hud-toast'),
        hint: document.getElementById('controls-hint'),

        garageModal: document.getElementById('modal-garage'),
        garageBank: document.getElementById('garage-bank'),
        garageActiveCar: document.getElementById('garage-active-car'),
        garageCarFilters: document.getElementById('garage-car-filters'),
        garageCarsGrid: document.getElementById('garage-cars-grid'),
        garageUpgradesGrid: document.getElementById('garage-upgrades-grid'),
        garagePaintsRow: document.getElementById('garage-paints-row'),
        garageRimsRow: document.getElementById('garage-rims-row'),
        garageSpoilersRow: document.getElementById('garage-spoilers-row'),
        garageTintsRow: document.getElementById('garage-tints-row'),
        garageStripesRow: document.getElementById('garage-stripes-row'),
        garageUnderglowRow: document.getElementById('garage-underglow-row'),

        pauseModal: document.getElementById('modal-pause'),
        pauseStats: document.getElementById('pause-stats-line'),
        pauseStatDist: document.getElementById('pause-stat-dist'),
        pauseStatBank: document.getElementById('pause-stat-bank'),
        pauseStatPasses: document.getElementById('pause-stat-passes'),
        pauseStatStreak: document.getElementById('pause-stat-streak'),
        btnPauseGauge: document.getElementById('btn-pause-gauge'),
        btnPauseUnit: document.getElementById('btn-pause-unit'),
        btnPauseMirror: document.getElementById('btn-pause-mirror'),
        btnPauseAudio: document.getElementById('btn-pause-audio'),
        pauseQualityBtn: document.getElementById('btn-pause-quality'),

        crashModal: document.getElementById('modal-crash'),
        crashReason: document.getElementById('crash-reason'),
        crashStreakBanner: document.getElementById('crash-streak-banner'),
        crashDistance: document.getElementById('crash-distance'),
        crashTopSpeed: document.getElementById('crash-top-speed'),
        crashEarned: document.getElementById('crash-earned'),
        btnCrashDriveTruck: document.getElementById('btn-crash-drive-truck')
      };

      if (this.profiler) {
        this.profiler.onChange((profile) => this.applyHardwareProfile(profile));
        this.updateQualityLabel();
      }

      this.initCalculatorLayer();
      this.initAnalogDials();
      this.bindEvents();
      this.syncActiveCarUI();
      this.syncGaugeStyleUI();
      this.syncSettingsUI();
      this.syncPlayerAndCamera(0.016, true);
      this.updateHUD();

      this.lastTimestamp = performance.now();
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    initMirrorSystem() {
      try {
        const rtOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
        this.rearMirrorRT = new THREE.WebGLRenderTarget(320, 144, rtOpts);
        this.leftMirrorRT = new THREE.WebGLRenderTarget(144, 112, rtOpts);
        this.rightMirrorRT = new THREE.WebGLRenderTarget(144, 112, rtOpts);
        this.mirrorCamera = new THREE.PerspectiveCamera(48, 320 / 144, 0.3, 420);

        const quadGeo = new THREE.PlaneGeometry(2, 2);
        const uv = quadGeo.attributes.uv;
        for (let i = 0; i < uv.count; i++) {
          uv.setX(i, 1 - uv.getX(i));
        }
        uv.needsUpdate = true;

        this.mirrorHudMat = new THREE.MeshBasicMaterial({
          map: this.rearMirrorRT.texture,
          depthTest: false,
          depthWrite: false
        });
        this.mirrorHudScene = new THREE.Scene();
        const mirrorQuad = new THREE.Mesh(quadGeo, this.mirrorHudMat);
        mirrorQuad.position.z = -0.5;
        this.mirrorHudScene.add(mirrorQuad);
        this.mirrorHudCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2);
      } catch (e) {
        this.rearMirrorRT = null;
      }
    }

    rebuildPlayerMesh() {
      if (this.playerMesh) {
        this.scene.remove(this.playerMesh.group);
      }
      const specs = this.economy.getActiveCarSpecs();
      this.playerMesh = window.HighwayVehicles.createVehicleMesh({
        archetype: specs.archetype,
        color: specs.color,
        custom: specs.custom,
        isPlayer: true,
        castShadow: !!this.gfx.shadowsEnabled
      });
      if (window.HighwayVehicles.createInteriorRig) {
        this.interiorRig = window.HighwayVehicles.createInteriorRig({
          spec: this.playerMesh.spec,
          bodyMat: this.playerMesh.bodyMat,
          carName: specs.name,
          mirrorTextures: this.rearMirrorRT
            ? {
                rear: this.rearMirrorRT.texture,
                left: this.leftMirrorRT.texture,
                right: this.rightMirrorRT.texture
              }
            : null
        });
        this.playerMesh.bodyTiltGroup.add(this.interiorRig.group);
      }
      this.scene.add(this.playerMesh.group);
      this.player.applyCarSpecs(specs);
      if (this.dom && this.dom.analogSpeedTicks) {
        this.rebuildSpeedDialTicks();
      }
      if (window.HighwayAudio) {
        window.HighwayAudio.setEngineProfile(specs.engineTone);
      }
    }

    initAnalogDials() {
      const svgNS = 'http://www.w3.org/2000/svg';
      if (this.dom.analogRpmTicks) {
        this.dom.analogRpmTicks.innerHTML = '';
        for (let i = 0; i <= 14; i++) {
          const frac = i / 14;
          const deg = -135 + frac * 270;
          const rad = (deg * Math.PI) / 180;
          const isMajor = i % 2 === 0;
          const isRed = i >= 12;
          const rOut = 58;
          const rIn = isMajor ? 48 : 53;
          const line = document.createElementNS(svgNS, 'line');
          line.setAttribute('x1', (70 + Math.sin(rad) * rIn).toFixed(1));
          line.setAttribute('y1', (70 - Math.cos(rad) * rIn).toFixed(1));
          line.setAttribute('x2', (70 + Math.sin(rad) * rOut).toFixed(1));
          line.setAttribute('y2', (70 - Math.cos(rad) * rOut).toFixed(1));
          line.setAttribute('class', isRed ? 'dial-tick-red' : isMajor ? 'dial-tick-major' : 'dial-tick-minor');
          this.dom.analogRpmTicks.appendChild(line);

          if (isMajor) {
            const lbl = document.createElementNS(svgNS, 'text');
            lbl.setAttribute('x', (70 + Math.sin(rad) * 39).toFixed(1));
            lbl.setAttribute('y', (70 - Math.cos(rad) * 39).toFixed(1));
            lbl.setAttribute('class', isRed ? 'dial-tick-label dial-tick-label-red' : 'dial-tick-label');
            lbl.textContent = String(i / 2);
            this.dom.analogRpmTicks.appendChild(lbl);
          }
        }
      }
      this.rebuildSpeedDialTicks();
    }

    getMaxAnalogSpeed() {
      const topKmh = this.player ? this.player.maxSpeedMs * 3.6 : 240;
      if (this.useKmh) {
        return Math.max(280, Math.ceil((topKmh * 1.08) / 40) * 40);
      }
      return Math.max(175, Math.ceil((topKmh * 0.621371 * 1.08) / 25) * 25);
    }

    rebuildSpeedDialTicks() {
      if (!this.dom.analogSpeedTicks) return;
      const svgNS = 'http://www.w3.org/2000/svg';
      this.dom.analogSpeedTicks.innerHTML = '';
      const maxVal = this.getMaxAnalogSpeed();
      const step = this.useKmh ? (maxVal >= 400 ? 60 : 40) : maxVal >= 250 ? 40 : 25;
      const majorCount = Math.max(4, Math.round(maxVal / step));

      for (let i = 0; i <= majorCount * 2; i++) {
        const frac = i / (majorCount * 2);
        const deg = -135 + frac * 270;
        const rad = (deg * Math.PI) / 180;
        const isMajor = i % 2 === 0;
        const rOut = 66;
        const rIn = isMajor ? 55 : 60;
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', (78 + Math.sin(rad) * rIn).toFixed(1));
        line.setAttribute('y1', (78 - Math.cos(rad) * rIn).toFixed(1));
        line.setAttribute('x2', (78 + Math.sin(rad) * rOut).toFixed(1));
        line.setAttribute('y2', (78 - Math.cos(rad) * rOut).toFixed(1));
        line.setAttribute('class', isMajor ? 'dial-tick-major' : 'dial-tick-minor');
        this.dom.analogSpeedTicks.appendChild(line);

        if (isMajor) {
          const val = (i / 2) * step;
          const lbl = document.createElementNS(svgNS, 'text');
          lbl.setAttribute('x', (78 + Math.sin(rad) * 44).toFixed(1));
          lbl.setAttribute('y', (78 - Math.cos(rad) * 44).toFixed(1));
          lbl.setAttribute('class', 'dial-tick-label');
          lbl.textContent = String(val);
          this.dom.analogSpeedTicks.appendChild(lbl);
        }
      }
    }

    syncGaugeStyleUI() {
      const style = this.economy.getGaugeStyle();
      const isAnalog = style === 'analog';
      if (this.dom.digitalCluster) this.dom.digitalCluster.classList.toggle('hidden', isAnalog);
      if (this.dom.analogCluster) this.dom.analogCluster.classList.toggle('hidden', !isAnalog);
      this.syncSettingsUI();
    }

    toggleGaugeStyle() {
      const next = this.economy.toggleGaugeStyle();
      this.syncGaugeStyleUI();
      this.updateHUD();
      this.showToast(`Gauges: ${next === 'analog' ? 'Analog' : 'Digital'}`, 1.3);
    }

    syncActiveCarUI() {
      const specs = this.economy.getActiveCarSpecs();
      if (this.dom.carName) this.dom.carName.textContent = specs.name;
      this.syncSettingsUI();
    }

    applyHardwareProfile(profile) {
      this.gfx = profile;
      this.renderer.setPixelRatio(profile.pixelRatio || 1);
      this.renderer.shadowMap.enabled = !!profile.shadowsEnabled;
      this.env.sunLight.castShadow = !!profile.shadowsEnabled;
      this.camera.far = profile.maxDrawDist || 1050;
      this.camera.updateProjectionMatrix();
      this.updateQualityLabel();
    }

    updateQualityLabel() {
      if (!this.profiler) return;
      const mode = this.profiler.mode;
      const tier = this.profiler.activeTier;
      const label = mode === 'AUTO' ? `Graphics: Auto (${tier})` : `Graphics: ${tier}`;
      if (this.dom.pauseQualityBtn) this.dom.pauseQualityBtn.textContent = label;
      if (this.dom.btnSetupQuality) this.dom.btnSetupQuality.textContent = label;
    }

    syncSettingsUI() {
      const preset = this.env.getCurrentLightingPreset();
      const weatherIdx = this.env.lightingIndex || 0;
      const trans = this.player ? this.player.transmissionMode : this.economy.getTransmission();
      const isAnalog = this.economy.getGaugeStyle() === 'analog';
      const muted = !!(window.HighwayAudio && window.HighwayAudio.muted);

      if (this.dom.statusSummary) {
        this.dom.statusSummary.textContent = `${this.cameraNames[this.cameraMode]} · ${trans} · ${preset.name}`;
      }

      document.querySelectorAll('[data-set-camera]').forEach((btn) => {
        const idx = parseInt(btn.getAttribute('data-set-camera'), 10);
        btn.classList.toggle('active', idx === this.cameraMode);
      });
      document.querySelectorAll('[data-set-trans]').forEach((btn) => {
        const m = btn.getAttribute('data-set-trans');
        btn.classList.toggle('active', m === trans);
      });
      document.querySelectorAll('[data-set-weather]').forEach((btn) => {
        const idx = parseInt(btn.getAttribute('data-set-weather'), 10);
        btn.classList.toggle('active', idx === weatherIdx);
      });

      const gaugeText = `Gauges: ${isAnalog ? 'Analog' : 'Digital'} [B]`;
      const unitText = `Units: ${this.useKmh ? 'KM/H' : 'MPH'}`;
      const mirrorText = `Mirror: ${this.hudMirrorEnabled ? 'On' : 'Off'} [N]`;
      const audioText = `Audio: ${muted ? 'Muted' : 'On'} [K]`;

      if (this.dom.btnSetupGauge) this.dom.btnSetupGauge.textContent = gaugeText;
      if (this.dom.btnPauseGauge) this.dom.btnPauseGauge.textContent = gaugeText;
      if (this.dom.btnSetupUnit) this.dom.btnSetupUnit.textContent = unitText;
      if (this.dom.btnPauseUnit) this.dom.btnPauseUnit.textContent = unitText;
      if (this.dom.btnSetupMirror) this.dom.btnSetupMirror.textContent = mirrorText;
      if (this.dom.btnPauseMirror) this.dom.btnPauseMirror.textContent = mirrorText;
      if (this.dom.btnSetupAudio) this.dom.btnSetupAudio.textContent = audioText;
      if (this.dom.btnPauseAudio) this.dom.btnPauseAudio.textContent = audioText;

      document.querySelectorAll('[data-set-assist]').forEach((btn) => {
        const mode = btn.getAttribute('data-set-assist');
        btn.classList.toggle('active', mode === this.speedAssistMode);
      });
      const assistTargetTxt = this.formatSpeedToastVal(this.speedAssistTargetKmh);
      document.querySelectorAll('[data-assist-readout]').forEach((el) => {
        el.textContent = assistTargetTxt;
      });

      this.updateQualityLabel();
    }

    getBeamState(preset) {
      if (this.player && this.player.crashed) {
        return { mode: 'off', highBeams: false };
      }
      const isNight = !!(preset && preset.isNight);
      if (isNight) {
        const mode = this.nightBeamMode === 'long' ? 'long' : 'short';
        return { mode, highBeams: mode === 'long' };
      }
      const flashOn = !!(this.headlightFlashHeld || this.headlightFlashPulse > 0);
      return { mode: flashOn ? 'long' : 'off', highBeams: flashOn };
    }

    toggleSetupDrawer(forceState) {
      if (this.calcLocked || this.garageOpen || this.paused || this.player.crashed) {
        if (forceState !== false) return;
      }
      this.setupDrawerOpen = forceState !== undefined ? !!forceState : !this.setupDrawerOpen;
      if (this.dom.setupDrawer) {
        this.dom.setupDrawer.classList.toggle('open', this.setupDrawerOpen);
        this.dom.setupDrawer.setAttribute('aria-hidden', this.setupDrawerOpen ? 'false' : 'true');
      }
      if (this.dom.btnDriveSetup) {
        this.dom.btnDriveSetup.classList.toggle('active', this.setupDrawerOpen);
      }
      if (this.setupDrawerOpen) {
        this.syncSettingsUI();
      }
    }

    showToast(msg, durationSec) {
      if (!this.dom.toast) return;
      this.dom.toast.textContent = msg;
      this.dom.toast.classList.remove('hidden');
      this.toastTimer = durationSec || 1.7;
    }

    showBonusToast(msg, isFine) {
      if (!this.dom.bonusPill) return;
      this.dom.bonusPill.textContent = msg;
      this.dom.bonusPill.classList.toggle('fine', !!isFine);
      this.dom.bonusPill.classList.remove('hidden');
      this.bonusTimer = isFine ? 2.4 : 1.6;
    }

    clearInputs() {
      this.input.throttle = 0;
      this.input.brake = 0;
      this.input.left = false;
      this.input.right = false;
      this.input.clutch = false;
      this.rightShiftHeld = false;
      this.headlightFlashHeld = false;
      this.headlightFlashPulse = 0;
      const preset = this.env ? this.env.getCurrentLightingPreset() : null;
      const beam = this.getBeamState(preset);
      this.beamMode = beam.mode;
      this.highBeamsActive = beam.highBeams;
      this.setHornActive(false);
    }

    formatMoney(n) {
      return '$' + Math.floor(n || 0).toLocaleString('en-US');
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

      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      const layer = document.getElementById('calculator-layer');
      if (layer) layer.classList.add('hidden');
      document.title = 'Highway Drive';

      if (window.HighwayAudio) {
        window.HighwayAudio.init();
      }

      this.updateHUD();
      this.lastTimestamp = performance.now();

      if (!this.hasUnlockedOnce) {
        this.hasUnlockedOnce = true;
        setTimeout(() => {
          if (this.dom.hint) {
            this.dom.hint.classList.add('faded');
          }
        }, 7000);
      }
    }

    lockToCalculator() {
      this.calcLocked = true;
      this.toggleSetupDrawer(false);
      this.clearInputs();
      this.closeGarage(true);
      this.setPaused(false);
      if (this.dom.crashModal) this.dom.crashModal.classList.remove('open');
      this.economy.save();

      if (window.HighwayAudio) {
        window.HighwayAudio.suspend();
      }

      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      const layer = document.getElementById('calculator-layer');
      if (layer) {
        layer.classList.remove('hidden');
        if (typeof layer.focus === 'function') layer.focus({ preventScroll: true });
      }
      document.title = 'Calculator';
    }

    /* ----------------------------------------------------------------------
       GARAGE & SHOP MODAL RENDERING
       ---------------------------------------------------------------------- */
    openGarage() {
      if (this.calcLocked) return;
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      this.toggleSetupDrawer(false);
      this.garageOpen = true;
      this.clearInputs();
      if (this.dom.pauseModal) this.dom.pauseModal.classList.remove('open');
      if (this.dom.crashModal) this.dom.crashModal.classList.remove('open');
      if (window.HighwayAudio) window.HighwayAudio.suspend();
      this.renderGarage();
      if (this.dom.garageModal) this.dom.garageModal.classList.add('open');
    }

    closeGarage(silent) {
      if (!this.garageOpen) return;
      this.garageOpen = false;
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      if (this.dom.garageModal) this.dom.garageModal.classList.remove('open');
      if (!silent && !this.paused && !this.calcLocked && !this.player.crashed && window.HighwayAudio) {
        window.HighwayAudio.resume();
      }
      if (this.player.crashed && !silent && this.dom.crashModal) {
        this.dom.crashModal.classList.add('open');
      }
      this.lastTimestamp = performance.now();
    }

    renderGarage() {
      const bank = this.economy.getBank();
      const specs = this.economy.getActiveCarSpecs();
      if (this.dom.garageBank) this.dom.garageBank.textContent = this.formatMoney(bank);
      if (this.dom.garageActiveCar) {
        this.dom.garageActiveCar.textContent = `Active: ${specs.name} • ${Math.round(specs.topSpeedKmh)} km/h`;
      }
      this.renderGarageVehicles(bank);
      this.renderGarageUpgrades(bank);
      this.renderGaragePaints();
      this.renderGarageCustomization();
    }

    renderGarageVehicles(bank) {
      if (!this.dom.garageCarsGrid) return;
      const allCars = window.HighwayEconomy.PLAYER_CARS;
      const activeId = this.economy.state.activeCarId;
      const streak = this.economy.getCrashStreak();
      const target = window.HighwayEconomy.CRASH_UNLOCK_TARGET || 3;

      if (this.dom.garageCarFilters) {
        this.dom.garageCarFilters.querySelectorAll('[data-car-filter]').forEach((btn) => {
          btn.classList.toggle('active', btn.getAttribute('data-car-filter') === this.garageFilter);
        });
      }

      const cars =
        this.garageFilter === 'all'
          ? allCars
          : allCars.filter((c) => c.group === this.garageFilter);

      this.dom.garageCarsGrid.innerHTML = cars
        .map((c) => {
          const owned = this.economy.isOwned(c.id);
          const isActive = c.id === activeId;
          const isSecret = !!c.secretUnlock;
          const merged = this.economy.getCarSpecs(c.id);

          const speedPct = clamp(((merged.topSpeedKmh - 170) / 285) * 100, 12, 100);
          const accelPct = clamp(((merged.accelPower - 4.5) / 14.5) * 100, 14, 100);
          const gripPct = clamp(((merged.weatherGripMult - 0.9) / 0.7) * 100, 18, 100);

          let btnHtml = '';
          let secretBadgeHtml = '';
          if (isActive) {
            btnHtml = `<button class="hw-btn hw-btn-primary" disabled>Active Vehicle</button>`;
          } else if (owned) {
            btnHtml = `<button class="hw-btn ${isSecret ? 'hw-btn-gold' : ''}" data-select-car="${c.id}">Select Vehicle</button>`;
          } else if (isSecret) {
            secretBadgeHtml = `<div class="secret-unlock-chip">🔒 Crash 3 times in a row (${streak}/${target})</div>`;
            btnHtml = `<button class="hw-btn" disabled>Locked · Crash 3x in a Row</button>`;
          } else {
            const canBuy = bank >= c.price;
            btnHtml = `<button class="hw-btn ${canBuy ? 'hw-btn-primary' : ''}" data-buy-car="${c.id}" ${
              canBuy ? '' : 'disabled'
            }>Buy for ${this.formatMoney(c.price)}</button>`;
          }

          const cardClass = [
            'car-shop-card',
            isActive ? 'active-car' : '',
            isSecret ? 'secret-card' : '',
            isSecret && !owned ? 'secret-locked' : ''
          ]
            .filter(Boolean)
            .join(' ');
          const priceBadge = owned ? (isSecret ? 'UNLOCKED' : 'OWNED') : isSecret ? 'SECRET' : this.formatMoney(c.price);

          return `
            <div class="${cardClass}">
              <div class="car-shop-top">
                <div>
                  <div class="car-shop-cat">${c.category}</div>
                  <div class="car-shop-name">${c.name}</div>
                </div>
                <span class="car-shop-price">${priceBadge}</span>
              </div>
              <p class="car-shop-desc">${c.desc}</p>
              ${secretBadgeHtml}
              <div class="car-bars">
                <div class="car-bar-row"><span>Top Speed</span><div class="car-bar-track"><div class="car-bar-fill" style="width:${speedPct.toFixed(0)}%"></div></div></div>
                <div class="car-bar-row"><span>Accel</span><div class="car-bar-track"><div class="car-bar-fill" style="width:${accelPct.toFixed(0)}%"></div></div></div>
                <div class="car-bar-row"><span>All-Weather</span><div class="car-bar-track"><div class="car-bar-fill" style="width:${gripPct.toFixed(0)}%"></div></div></div>
              </div>
              ${btnHtml}
            </div>`;
        })
        .join('');

      this.dom.garageCarsGrid.querySelectorAll('[data-select-car]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-select-car');
          if (this.economy.selectCar(id)) {
            this.rebuildPlayerMesh();
            this.syncActiveCarUI();
            this.renderGarage();
            this.updateHUD();
            this.showToast(`Selected ${this.economy.getCarDef(id).name}`, 1.5);
          }
        });
      });

      this.dom.garageCarsGrid.querySelectorAll('[data-buy-car]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-buy-car');
          const res = this.economy.buyCar(id);
          if (res.ok) {
            this.rebuildPlayerMesh();
            this.syncActiveCarUI();
            this.renderGarage();
            this.updateHUD();
            this.showToast(`Purchased ${this.economy.getCarDef(id).name}!`, 1.8);
          }
        });
      });
    }

    renderGarageUpgrades(bank) {
      if (!this.dom.garageUpgradesGrid) return;
      const defs = window.HighwayEconomy.UPGRADE_DEFS;
      const maxLvl = window.HighwayEconomy.MAX_UPGRADE_LEVEL;
      const activeId = this.economy.state.activeCarId;
      const upg = this.economy.getUpgrades(activeId);

      this.dom.garageUpgradesGrid.innerHTML = Object.keys(defs)
        .map((key) => {
          const d = defs[key];
          const lvl = upg[key] || 0;
          const cost = this.economy.getUpgradeCost(activeId, key);
          const pips = Array.from({ length: maxLvl }, (_, idx) =>
            `<span class="upgrade-pip ${idx < lvl ? 'filled' : ''}"></span>`
          ).join('');

          const btnHtml =
            cost === null
              ? `<button class="hw-btn" disabled>MAX LEVEL</button>`
              : `<button class="hw-btn ${bank >= cost ? 'hw-btn-primary' : ''}" data-buy-upgrade="${key}" ${
                  bank >= cost ? '' : 'disabled'
                }>Upgrade (${this.formatMoney(cost)})</button>`;

          return `
            <div class="upgrade-card">
              <div class="upgrade-top">
                <div>
                  <strong>${d.label}</strong>
                  <span class="upgrade-cat-tag">${d.category || 'Upgrade'}</span>
                </div>
                <span class="upgrade-lvl">LVL ${lvl}/${maxLvl}</span>
              </div>
              <div class="upgrade-pips">${pips}</div>
              <div class="upgrade-effect">${d.effectText}</div>
              ${btnHtml}
            </div>`;
        })
        .join('');

      this.dom.garageUpgradesGrid.querySelectorAll('[data-buy-upgrade]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-buy-upgrade');
          const res = this.economy.buyUpgrade(activeId, key);
          if (res.ok) {
            const specs = this.economy.getActiveCarSpecs();
            this.player.applyCarSpecs(specs);
            if (key === 'engine' || key === 'turbo' || key === 'exhaust') this.rebuildSpeedDialTicks();
            this.renderGarage();
            this.updateHUD();
            this.showToast(`${defs[key].label} Lv ${res.level}`, 1.4);
          }
        });
      });
    }

    renderGaragePaints() {
      if (!this.dom.garagePaintsRow) return;
      const activeId = this.economy.state.activeCarId;
      const currHex = this.economy.getPaint(activeId);

      this.dom.garagePaintsRow.innerHTML = window.HighwayEconomy.PAINT_SWATCHES.map((s) => {
        const cssHex = '#' + s.hex.toString(16).padStart(6, '0');
        const active = s.hex === currHex ? 'active' : '';
        return `<button class="paint-dot ${active}" data-paint="${s.hex}" title="${s.name}" style="background:${cssHex}"></button>`;
      }).join('');

      this.dom.garagePaintsRow.querySelectorAll('[data-paint]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const hex = parseInt(btn.getAttribute('data-paint'), 10);
          if (this.economy.setPaint(activeId, hex)) {
            this.playerMesh.setPaintColor(hex);
            this.renderGaragePaints();
          }
        });
      });
    }

    renderCustomOptionRow(rowEl, field, items, activeCustom) {
      if (!rowEl || !items) return;
      const activeId = this.economy.state.activeCarId;
      const currVal = activeCustom[field];
      rowEl.innerHTML = items
        .map((it) => `<button class="trans-pill-btn ${it.id === currVal ? 'active' : ''}" data-custom-${field}="${it.id}">${it.label}</button>`)
        .join('');
      rowEl.querySelectorAll(`[data-custom-${field}]`).forEach((btn) => {
        btn.addEventListener('click', () => {
          const val = btn.getAttribute(`data-custom-${field}`);
          if (this.economy.setCustomization(activeId, field, val)) {
            this.rebuildPlayerMesh();
            this.renderGarageCustomization();
            this.showToast(`Applied ${val}`, 1.1);
          }
        });
      });
    }

    renderGarageCustomization() {
      const econ = window.HighwayEconomy;
      const custom = this.economy.getCustomization(this.economy.state.activeCarId);
      this.renderCustomOptionRow(this.dom.garageRimsRow, 'rim', econ.RIM_STYLES, custom);
      this.renderCustomOptionRow(this.dom.garageSpoilersRow, 'spoiler', econ.SPOILER_STYLES, custom);
      this.renderCustomOptionRow(this.dom.garageTintsRow, 'tint', econ.TINT_STYLES, custom);
      this.renderCustomOptionRow(this.dom.garageStripesRow, 'stripe', econ.STRIPE_STYLES, custom);
      this.renderCustomOptionRow(this.dom.garageUnderglowRow, 'underglow', econ.UNDERGLOW_STYLES, custom);
    }

    /* ----------------------------------------------------------------------
       PAUSE, RESTART, TRANSMISSIONS & QUICK TOGGLES
       ---------------------------------------------------------------------- */
    setPaused(nextPaused) {
      if (this.player.crashed && nextPaused) return;
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      this.paused = !!nextPaused;
      if (this.paused) {
        this.toggleSetupDrawer(false);
        this.clearInputs();
        if (window.HighwayAudio) window.HighwayAudio.suspend();
        const distKm = (this.player.distanceMeters / 1000).toFixed(2);
        const bankStr = this.formatMoney(this.economy.getBank());
        const truckOwned = this.economy.isOwned(window.HighwayEconomy.SECRET_TRUCK_ID);
        const streak = this.economy.getCrashStreak();
        const target = window.HighwayEconomy.CRASH_UNLOCK_TARGET || 3;

        if (this.dom.pauseStats) {
          this.dom.pauseStats.textContent = `${distKm} km • ${bankStr}`;
        }
        if (this.dom.pauseStatDist) this.dom.pauseStatDist.textContent = `${distKm} km`;
        if (this.dom.pauseStatBank) this.dom.pauseStatBank.textContent = bankStr;
        if (this.dom.pauseStatPasses) {
          this.dom.pauseStatPasses.textContent = String(this.economy.cleanPasses || 0);
        }
        if (this.dom.pauseStatStreak) {
          this.dom.pauseStatStreak.textContent = truckOwned ? 'Unlocked' : `${streak} / ${target}`;
        }
        this.syncSettingsUI();
        if (this.dom.pauseModal) this.dom.pauseModal.classList.add('open');
      } else {
        if (this.dom.pauseModal) this.dom.pauseModal.classList.remove('open');
        if (!this.calcLocked && !this.garageOpen && window.HighwayAudio) {
          window.HighwayAudio.resume();
        }
        this.lastTimestamp = performance.now();
      }
    }

    restartDrive() {
      const wasCrashed = !!this.player.crashed;
      this.clearInputs();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      this.paused = false;
      this.toggleSetupDrawer(false);
      this.closeGarage(true);
      this.shakeMag = 0;
      if (this.dom.pauseModal) this.dom.pauseModal.classList.remove('open');
      if (this.dom.crashModal) this.dom.crashModal.classList.remove('open');

      if (!wasCrashed) {
        this.economy.resetCrashStreak();
      }
      this.cleanStreakResetDone = false;

      this.player.reset();
      this.player.applyCarSpecs(this.economy.getActiveCarSpecs());
      this.signalMode = 0;
      this.lastBlinkOn = false;
      this.nightBeamMode = 'short';
      this.headlightFlashHeld = false;
      this.headlightFlashPulse = 0;
      this.lastCheckedRadarSlot = -1;
      this.radarBeepTimer = 0;
      this.radarFlashTimer = 0;
      this.lastFineText = '';
      this.lastFineBannerTimer = 0;
      this.speedAssistMode = 'off';
      this.speedAssistAutoZone = false;
      this.blindSpot = { left: false, right: false, leftClose: false, rightClose: false };
      this.blindSpotChirpCooldown = 0;
      if (this.dom.fxRadarFlash) this.dom.fxRadarFlash.classList.remove('active');
      this.setHornActive(false);
      this.economy.resetSession();
      this.traffic.reset(this.player.s, this.player.getLaneIndex());
      this.env.update(this.player.s, 0, 0);
      this.syncPlayerAndCamera(0.016, true);
      this.syncSettingsUI();
      this.updateHUD();

      if (!this.calcLocked && window.HighwayAudio) {
        window.HighwayAudio.resume();
      }
      this.lastTimestamp = performance.now();
      this.showToast('Highway Drive Restarted', 1.4);
    }

    setTransmissionMode(mode) {
      if (!this.economy.setTransmission(mode)) return;
      this.player.setTransmissionMode(mode);
      this.syncSettingsUI();
      this.updateHUD();
      this.showToast(`Transmission: ${mode}`, 1.4);
    }

    cycleTransmission() {
      const next = this.economy.cycleTransmission();
      this.player.setTransmissionMode(next);
      this.syncSettingsUI();
      this.updateHUD();
      this.showToast(`Transmission: ${next}`, 1.4);
    }

    setCameraMode(modeIdx) {
      const next = clamp(Math.floor(modeIdx || 0), 0, this.cameraNames.length - 1);
      this.cameraMode = next;
      this.syncPlayerAndCamera(0.016, true);
      this.syncSettingsUI();
      this.updateHUD();
      this.showToast(`Camera: ${this.cameraNames[this.cameraMode]}`, 1.3);
    }

    cycleCamera() {
      this.setCameraMode((this.cameraMode + 1) % this.cameraNames.length);
    }

    setLightingPreset(index) {
      this.env.applyLightingPreset(index);
      const preset = this.env.getCurrentLightingPreset();
      this.nightBeamMode = 'short';
      this.syncPlayerAndCamera(0.016, false);
      this.syncSettingsUI();
      this.updateHUD();
      this.showToast(`Weather: ${preset.name}`, 1.4);
    }

    cycleLighting() {
      const preset = this.env.cycleLightingPreset();
      this.nightBeamMode = 'short';
      this.syncPlayerAndCamera(0.016, false);
      this.syncSettingsUI();
      this.updateHUD();
      this.showToast(`Weather: ${preset.name}`, 1.4);
    }

    toggleAudio() {
      if (!window.HighwayAudio) return;
      window.HighwayAudio.init();
      const muted = window.HighwayAudio.toggleMute();
      this.syncSettingsUI();
      this.showToast(muted ? 'Audio Muted' : 'Audio Enabled', 1.2);
    }

    toggleTurnSignal(mode) {
      if (this.signalMode === mode) {
        this.signalMode = 0;
      } else {
        this.signalMode = mode;
        this.signalTimer = 0;
        this.signalStartD = this.player.d;
        this.signalMovedEnough = false;
        this.lastBlinkOn = true;
        if (window.HighwayAudio) window.HighwayAudio.playBlinkerTick(true);
      }
      this.updateHUD();
    }

    setHornActive(active) {
      const next = !!active && !this.calcLocked && !this.paused && !this.garageOpen && !this.player.crashed;
      if (next !== this.hornActive) {
        this.hornActive = next;
        if (window.HighwayAudio) {
          const hornMode = this.player ? this.player.hornType : 'standard';
          window.HighwayAudio.setHorn(next, hornMode);
        }
        this.updateHUD();
      }
    }

    toggleHudMirror() {
      this.hudMirrorEnabled = !this.hudMirrorEnabled;
      this.syncSettingsUI();
      this.updateHUD();
      this.showToast(this.hudMirrorEnabled ? 'Rearview Mirror: On' : 'Rearview Mirror: Off', 1.2);
    }

    formatSpeedToastVal(kmh) {
      return this.useKmh ? `${Math.round(kmh)} km/h` : `${Math.round(kmh * 0.621371)} mph`;
    }

    setSpeedAssistMode(mode, targetOverrideKmh) {
      if (this.player.crashed) return;
      const next = mode === 'cruise' || mode === 'limit' ? mode : 'off';
      if (next === 'off') {
        this.speedAssistMode = 'off';
        this.speedAssistAutoZone = false;
        if (window.HighwayAudio) window.HighwayAudio.playSwitchClick(false);
        this.syncSettingsUI();
        this.updateHUD();
        this.showToast('Cruise / Limiter: Off', 1.1);
        return;
      }
      const maxKmh = Math.max(80, Math.round(this.player.maxSpeedMs * 3.6));
      if (next === 'cruise') {
        if (targetOverrideKmh !== undefined) {
          this.speedAssistTargetKmh = clamp(targetOverrideKmh, 40, maxKmh);
        } else if (this.speedAssistMode === 'off') {
          const base =
            this.player.speedKmh >= 30
              ? this.player.speedKmh
              : this.env.getRadarInfo(this.player.s).limitKmh;
          this.speedAssistTargetKmh = clamp(Math.round(base / 5) * 5, 40, maxKmh);
        }
        this.speedAssistMode = 'cruise';
        this.speedAssistAutoZone = false;
        if (window.HighwayAudio) window.HighwayAudio.playSwitchClick(true);
        this.syncSettingsUI();
        this.updateHUD();
        this.showToast(`Cruise Control: ${this.formatSpeedToastVal(this.speedAssistTargetKmh)}`, 1.3);
        return;
      }
      const zoneLimit = this.env.getRadarInfo(this.player.s).limitKmh;
      this.speedAssistTargetKmh = clamp(
        targetOverrideKmh !== undefined ? targetOverrideKmh : zoneLimit,
        40,
        maxKmh
      );
      this.speedAssistMode = 'limit';
      this.speedAssistAutoZone = targetOverrideKmh === undefined;
      if (window.HighwayAudio) window.HighwayAudio.playSwitchClick(true);
      this.syncSettingsUI();
      this.updateHUD();
      this.showToast(
        `Speed Limiter: ${this.formatSpeedToastVal(this.speedAssistTargetKmh)}${
          this.speedAssistAutoZone ? ' (Auto Zone)' : ''
        }`,
        1.4
      );
    }

    toggleCruiseControl() {
      if (this.player.crashed) return;
      if (this.speedAssistMode === 'cruise') {
        this.setSpeedAssistMode('off');
        return;
      }
      if (this.player.speedKmh < 30) {
        this.showToast('Reach 30 km/h to set Cruise Control', 1.2);
        return;
      }
      this.setSpeedAssistMode('cruise', Math.round(this.player.speedKmh / 5) * 5);
    }

    toggleSpeedLimiter() {
      if (this.player.crashed) return;
      if (this.speedAssistMode === 'limit') {
        this.setSpeedAssistMode('off');
        return;
      }
      this.setSpeedAssistMode('limit');
    }

    adjustSpeedAssist(deltaKmh) {
      if (this.player.crashed) return;
      const maxKmh = Math.max(80, Math.round(this.player.maxSpeedMs * 3.6));
      if (this.speedAssistMode === 'off') {
        const base =
          this.player.speedKmh >= 30
            ? this.player.speedKmh
            : this.env.getRadarInfo(this.player.s).limitKmh;
        this.speedAssistMode = 'cruise';
        this.speedAssistTargetKmh = clamp(Math.round(base / 5) * 5 + deltaKmh, 40, maxKmh);
      } else {
        this.speedAssistTargetKmh = clamp(this.speedAssistTargetKmh + deltaKmh, 40, maxKmh);
      }
      this.speedAssistAutoZone = false;
      if (window.HighwayAudio) window.HighwayAudio.playSwitchClick(deltaKmh > 0);
      this.syncSettingsUI();
      this.updateHUD();
      const label = this.speedAssistMode === 'cruise' ? 'Cruise' : 'Speed Limiter';
      this.showToast(`${label}: ${this.formatSpeedToastVal(this.speedAssistTargetKmh)}`, 1.1);
    }

    cycleWiperMode() {
      const modes = ['AUTO', 'LOW', 'HIGH', 'OFF'];
      const next = modes[(modes.indexOf(this.wiperMode) + 1) % modes.length];
      this.wiperMode = next;
      if (window.HighwayAudio) window.HighwayAudio.playSwitchClick(next !== 'OFF');
      this.syncPlayerAndCamera(0.016, false);
      this.showToast(`Wipers: ${next}`, 1.1);
    }

    toggleSpeedUnits() {
      this.useKmh = !this.useKmh;
      if (this.dom.unit) {
        this.dom.unit.textContent = this.useKmh ? 'KM/H' : 'MPH';
      }
      if (this.dom.analogUnit) {
        this.dom.analogUnit.textContent = this.useKmh ? 'KM/H' : 'MPH';
      }
      this.rebuildSpeedDialTicks();
      this.syncSettingsUI();
      this.updateHUD();
    }

    openCrashModal(crashRes) {
      if (!this.dom.crashModal) return;
      this.toggleSetupDrawer(false);
      this.economy.save();
      const distKm = (this.player.distanceMeters / 1000).toFixed(2);
      const topDisp = this.useKmh
        ? `${Math.round(this.player.topSpeedKmh)} km/h`
        : `${Math.round(this.player.topSpeedKmh * 0.621371)} mph`;

      if (this.dom.crashReason) {
        this.dom.crashReason.textContent =
          this.player.lastCrashReason || 'Vehicle disabled in traffic collision';
      }
      if (this.dom.crashDistance) this.dom.crashDistance.textContent = `${distKm} km`;
      if (this.dom.crashTopSpeed) this.dom.crashTopSpeed.textContent = topDisp;
      if (this.dom.crashEarned) {
        this.dom.crashEarned.textContent = this.formatMoney(this.economy.sessionEarned);
      }

      const target = window.HighwayEconomy.CRASH_UNLOCK_TARGET || 3;
      const truckId = window.HighwayEconomy.SECRET_TRUCK_ID;
      const streak = crashRes ? crashRes.crashStreak : this.economy.getCrashStreak();
      const unlocked = !!(crashRes && crashRes.unlockedCar);

      if (this.dom.crashStreakBanner) {
        if (unlocked) {
          this.dom.crashStreakBanner.textContent =
            '🏆 SECRET UNLOCKED: COLOSSUS 18-WHEELER! Ready to drive now or from Garage.';
          this.dom.crashStreakBanner.classList.remove('hidden');
          this.dom.crashStreakBanner.classList.add('unlocked');
        } else if (!this.economy.isOwned(truckId)) {
          this.dom.crashStreakBanner.textContent = `Wreck Streak: ${streak}/${target} — Crash ${target} times in a row to unlock the Colossus 18-Wheeler`;
          this.dom.crashStreakBanner.classList.remove('hidden', 'unlocked');
        } else {
          this.dom.crashStreakBanner.classList.add('hidden');
          this.dom.crashStreakBanner.classList.remove('unlocked');
        }
      }

      if (this.dom.btnCrashDriveTruck) {
        this.dom.btnCrashDriveTruck.classList.toggle('hidden', !unlocked);
      }

      this.dom.crashModal.classList.add('open');
    }

    /* ----------------------------------------------------------------------
       EVENT LISTENERS
       ---------------------------------------------------------------------- */
    bindEvents() {
      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });

      window.addEventListener('blur', () => this.clearInputs());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.clearInputs();
      });

      window.addEventListener('keydown', (e) => {
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

        if (e.code === 'KeyG') {
          e.preventDefault();
          if (this.garageOpen) this.closeGarage();
          else this.openGarage();
          return;
        }

        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          if (this.garageOpen) {
            this.closeGarage();
          } else if (this.setupDrawerOpen) {
            this.toggleSetupDrawer(false);
          } else if (!this.player.crashed) {
            this.setPaused(!this.paused);
          }
          return;
        }

        if (this.garageOpen) return;

        if (e.code === 'KeyR' || (this.player.crashed && e.code === 'Enter')) {
          e.preventDefault();
          this.restartDrive();
          return;
        }

        if (this.paused) return;

        if (window.HighwayAudio) window.HighwayAudio.init();

        const code = e.code;
        const keyLower = (e.key || '').toLowerCase();
        if (code === 'ShiftRight') {
          this.rightShiftHeld = true;
        }
        if (e.shiftKey && !this.rightShiftHeld) {
          this.input.clutch = true;
        }

        if (code === 'KeyW' || code === 'ArrowUp') {
          e.preventDefault();
          this.input.throttle = 1;
        } else if (code === 'KeyS' || code === 'ArrowDown') {
          e.preventDefault();
          this.input.brake = 1;
          if (!e.repeat && this.speedAssistMode === 'cruise') {
            this.speedAssistMode = 'off';
            this.speedAssistAutoZone = false;
            if (window.HighwayAudio) window.HighwayAudio.playSwitchClick(false);
            this.syncSettingsUI();
            this.updateHUD();
            this.showToast('Cruise Control: Off', 1.0);
          }
        } else if (code === 'KeyA' || code === 'ArrowLeft') {
          e.preventDefault();
          this.input.left = true;
        } else if (code === 'KeyD' || code === 'ArrowRight') {
          e.preventDefault();
          this.input.right = true;
        } else if (code === 'ShiftLeft') {
          e.preventDefault();
          this.input.clutch = true;
        } else if (code === 'KeyE' || keyLower === 'e') {
          e.preventDefault();
          if (!e.repeat) {
            if (this.player.transmissionMode === 'AUTO') {
              this.showToast('Auto mode — press [M] for SEMI or MANUAL', 1.6);
            } else {
              this.player.shiftUp(this.input.clutch || (e.shiftKey && !this.rightShiftHeld));
              this.updateHUD();
            }
          }
        } else if (code === 'KeyQ' || keyLower === 'q') {
          e.preventDefault();
          if (!e.repeat) {
            if (this.player.transmissionMode === 'AUTO') {
              this.showToast('Auto mode — press [M] for SEMI or MANUAL', 1.6);
            } else {
              this.player.shiftDown(this.input.clutch || (e.shiftKey && !this.rightShiftHeld));
              this.updateHUD();
            }
          }
        } else if (code === 'KeyM') {
          if (!e.repeat) this.cycleTransmission();
        } else if (code === 'KeyZ') {
          if (!e.repeat) this.toggleTurnSignal(-1);
        } else if (code === 'KeyX') {
          if (!e.repeat) this.toggleTurnSignal(2);
        } else if (code === 'KeyC') {
          if (!e.repeat) this.toggleTurnSignal(1);
        } else if (code === 'KeyL') {
          if (!e.repeat) {
            const preset = this.env.getCurrentLightingPreset();
            if (preset && preset.isNight) {
              this.nightBeamMode = this.nightBeamMode === 'short' ? 'long' : 'short';
              const isLong = this.nightBeamMode === 'long';
              this.beamMode = this.nightBeamMode;
              this.highBeamsActive = isLong;
              if (window.HighwayAudio) window.HighwayAudio.playHeadlightFlash(isLong);
              this.showToast(isLong ? 'Headlights: Long Beam' : 'Headlights: Short Beam', 1.1);
            } else {
              this.headlightFlashHeld = true;
              this.headlightFlashPulse = 0.40;
              this.beamMode = 'long';
              this.highBeamsActive = true;
              if (window.HighwayAudio) window.HighwayAudio.playHeadlightFlash(true);
            }
            this.updateHUD();
          }
        } else if (code === 'KeyV') {
          if (!e.repeat) this.cycleCamera();
        } else if (code === 'KeyB') {
          if (!e.repeat) this.toggleGaugeStyle();
        } else if (code === 'KeyK') {
          if (!e.repeat) this.toggleAudio();
        } else if (code === 'KeyT') {
          if (!e.repeat) this.cycleLighting();
        } else if (code === 'KeyN') {
          if (!e.repeat) this.toggleHudMirror();
        } else if (code === 'KeyU') {
          if (!e.repeat) this.toggleCruiseControl();
        } else if (code === 'KeyY') {
          if (!e.repeat) this.toggleSpeedLimiter();
        } else if (
          code === 'Digit5' ||
          code === 'Numpad5' ||
          code === 'Equal' ||
          code === 'NumpadAdd' ||
          code === 'BracketRight'
        ) {
          e.preventDefault();
          this.adjustSpeedAssist(5);
        } else if (code === 'Minus' || code === 'NumpadSubtract' || code === 'BracketLeft') {
          e.preventDefault();
          this.adjustSpeedAssist(-5);
        } else if (code === 'KeyF') {
          if (!e.repeat) this.cycleWiperMode();
        } else if (code === 'Tab') {
          e.preventDefault();
          if (!e.repeat) this.toggleSetupDrawer();
        } else if (code === 'KeyH' || code === 'Space') {
          e.preventDefault();
          this.setHornActive(true);
        }
      });

      window.addEventListener('keyup', (e) => {
        const code = e.code;
        if (code === 'KeyW' || code === 'ArrowUp') this.input.throttle = 0;
        if (code === 'KeyS' || code === 'ArrowDown') this.input.brake = 0;
        if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = false;
        if (code === 'KeyD' || code === 'ArrowRight') this.input.right = false;
        if (code === 'KeyL') this.headlightFlashHeld = false;
        if (code === 'KeyH' || code === 'Space') this.setHornActive(false);
        if (code === 'ShiftLeft') this.input.clutch = false;
        if (code === 'ShiftRight') this.rightShiftHeld = false;
        if (!e.shiftKey) {
          this.input.clutch = false;
          this.rightShiftHeld = false;
        }
      });

      // Shop Tabs
      document.querySelectorAll('.shop-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.blur();
          document.querySelectorAll('.shop-tab-btn').forEach((b) => b.classList.remove('active'));
          document.querySelectorAll('.shop-pane').forEach((p) => p.classList.remove('active'));
          btn.classList.add('active');
          const tgt = document.getElementById(btn.getAttribute('data-shop-tab'));
          if (tgt) tgt.classList.add('active');
        });
      });

      // Garage Vehicle Category Filters
      if (this.dom.garageCarFilters) {
        this.dom.garageCarFilters.querySelectorAll('[data-car-filter]').forEach((btn) => {
          btn.addEventListener('click', () => {
            btn.blur();
            this.garageFilter = btn.getAttribute('data-car-filter') || 'all';
            this.renderGarageVehicles(this.economy.getBank());
          });
        });
      }

      // Pause Menu Tabs
      document.querySelectorAll('.pause-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.blur();
          document.querySelectorAll('.pause-tab-btn').forEach((b) => b.classList.remove('active'));
          document.querySelectorAll('.pause-pane').forEach((p) => p.classList.remove('active'));
          btn.classList.add('active');
          const tgt = document.getElementById(btn.getAttribute('data-pause-tab'));
          if (tgt) tgt.classList.add('active');
        });
      });

      // Direct Camera / Transmission / Weather buttons in Drive Setup Drawer & Pause Settings
      document.querySelectorAll('[data-set-camera]').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.blur();
          this.setCameraMode(parseInt(btn.getAttribute('data-set-camera'), 10));
        });
      });
      document.querySelectorAll('[data-set-trans]').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.blur();
          this.setTransmissionMode(btn.getAttribute('data-set-trans'));
        });
      });
      document.querySelectorAll('[data-set-weather]').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.blur();
          this.setLightingPreset(parseInt(btn.getAttribute('data-set-weather'), 10));
        });
      });
      document.querySelectorAll('[data-set-assist]').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.blur();
          this.setSpeedAssistMode(btn.getAttribute('data-set-assist'));
        });
      });
      document.querySelectorAll('[data-assist-step]').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.blur();
          this.adjustSpeedAssist(parseInt(btn.getAttribute('data-assist-step'), 10) || 0);
        });
      });

      const bindClick = (id, fn) => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('click', (ev) => {
            el.blur();
            fn(ev);
          });
        }
      };

      bindClick('btn-pause', () => this.setPaused(!this.paused));
      bindClick('btn-open-garage', () => this.openGarage());
      bindClick('btn-close-garage', () => this.closeGarage());
      bindClick('btn-restart', () => this.restartDrive());
      bindClick('btn-drive-setup', () => this.toggleSetupDrawer());
      bindClick('btn-close-setup', () => this.toggleSetupDrawer(false));
      bindClick('btn-assist-dec', () => this.adjustSpeedAssist(-5));
      bindClick('btn-assist-inc', () => this.adjustSpeedAssist(5));
      bindClick('btn-assist-mode', () =>
        this.setSpeedAssistMode(this.speedAssistMode === 'cruise' ? 'limit' : 'cruise')
      );
      bindClick('btn-assist-off', () => this.setSpeedAssistMode('off'));

      bindClick('btn-setup-gauge', () => this.toggleGaugeStyle());
      bindClick('btn-setup-unit', () => this.toggleSpeedUnits());
      bindClick('btn-setup-mirror', () => this.toggleHudMirror());
      bindClick('btn-setup-audio', () => this.toggleAudio());
      bindClick('btn-setup-quality', () => {
        if (this.profiler) this.profiler.cyclePreset();
      });

      bindClick('hud-unit', () => this.toggleSpeedUnits());
      bindClick('analog-unit', () => this.toggleSpeedUnits());

      bindClick('btn-resume', () => this.setPaused(false));
      bindClick('btn-pause-garage', () => this.openGarage());
      bindClick('btn-pause-restart', () => this.restartDrive());
      bindClick('btn-pause-calc', () => this.lockToCalculator());
      bindClick('btn-pause-gauge', () => this.toggleGaugeStyle());
      bindClick('btn-pause-unit', () => this.toggleSpeedUnits());
      bindClick('btn-pause-mirror', () => this.toggleHudMirror());
      bindClick('btn-pause-audio', () => this.toggleAudio());
      bindClick('btn-pause-quality', () => {
        if (this.profiler) {
          this.profiler.cyclePreset();
        }
      });

      bindClick('btn-crash-drive-truck', () => {
        const truckId = window.HighwayEconomy.SECRET_TRUCK_ID;
        if (this.economy.selectCar(truckId)) {
          this.rebuildPlayerMesh();
          this.syncActiveCarUI();
          this.restartDrive();
          this.showToast('Driving Colossus 18-Wheeler!', 2.0);
        }
      });
      bindClick('btn-crash-restart', () => this.restartDrive());
      bindClick('btn-crash-garage', () => this.openGarage());
      bindClick('btn-crash-calc', () => this.lockToCalculator());
    }

    /* ----------------------------------------------------------------------
       3D VEHICLE & CAMERA SYNCHRONIZATION
       ---------------------------------------------------------------------- */
    syncPlayerAndCamera(dt, snap) {
      const p = this.env.project(this.player.s, this.player.d, this.playerProj, 0);
      const preset = this.env.getCurrentLightingPreset();
      const spec = this.playerMesh.spec;
      const isInterior = this.cameraMode === 2;
      const isHood = this.cameraMode === 3;

      this.playerMesh.group.position.set(p.x, p.y, p.z);
      this.playerMesh.group.rotation.set(p.pitch, -(p.yaw + this.player.yawRel), 0);
      this.playerMesh.setBodyTilt(this.player.pitch, this.player.roll);
      this.playerMesh.updateWheels(this.player.speed, dt, this.player.steer * 0.25);
      this.playerMesh.setBraking(this.player.braking);
      const baseHl = Math.max(0.12, preset.headlightStrength);
      this.playerMesh.setHeadlights(baseHl);
      const beamState = this.getBeamState(preset);
      this.beamMode = beamState.mode;
      this.highBeamsActive = beamState.highBeams;
      if (this.playerMesh.setBeamMode) {
        this.playerMesh.setBeamMode(this.beamMode, baseHl);
      } else if (this.playerMesh.setHighBeam) {
        this.playerMesh.setHighBeam(this.highBeamsActive, baseHl);
      }
      const blinkOn = this.signalMode !== 0 && Math.floor(this.signalTimer * 2.7) % 2 === 0;
      this.playerMesh.setBlinker(this.signalMode, blinkOn);
      if (this.playerMesh.updateSpecialLights) {
        this.playerMesh.updateSpecialLights(this.player.elapsedSeconds);
      }
      if (this.playerMesh.setInteriorViewMode) {
        this.playerMesh.setInteriorViewMode(isInterior);
      }
      if (this.interiorRig) {
        this.interiorRig.group.visible = isInterior;
        if (isInterior) {
          const radarInfo = this.env.getRadarInfo(this.player.s);
          const radarSpeeding = radarInfo.nearby && this.player.speedKmh > radarInfo.limitKmh + 5;
          this.interiorRig.updateInterior(
            {
              steer: this.player.steer,
              speedKmh: this.player.speedKmh,
              speedMph: this.player.speedMph,
              useKmh: this.useKmh,
              maxSpeedKmh: this.player.maxSpeedMs * 3.6,
              rpm: this.player.rpm,
              rpmNorm: this.player.rpmNorm,
              gearDisplay: this.player.getGearDisplay(),
              shiftPrompt: this.player.shiftPrompt,
              transmissionMode: this.player.transmissionMode,
              gaugeStyle: this.economy.getGaugeStyle(),
              distanceKm: this.player.distanceMeters / 1000,
              bank: this.economy.getBank(),
              bankText: this.formatMoney(this.economy.getBank()),
              signalMode: this.signalMode,
              blinkOn,
              highBeams: this.highBeamsActive,
              beamMode: this.beamMode,
              speedLimitKmh: radarInfo.limitKmh,
              radarNearby: radarInfo.nearby,
              radarDistM: Math.max(0, Math.round(radarInfo.distToRadar)),
              radarSpeeding,
              radarFineText: this.lastFineText,
              blindSpotLeft: !!(this.blindSpot && this.blindSpot.left),
              blindSpotRight: !!(this.blindSpot && this.blindSpot.right),
              wiperMode: this.wiperMode,
              speedAssistMode: this.speedAssistMode,
              speedAssistTargetKmh: this.speedAssistTargetKmh,
              hornActive: this.hornActive,
              damage: this.player.damage,
              streakMult: this.economy.streakMult,
              weatherName: preset.name,
              precip: preset.precip,
              paddleAnimTimer: this.player.paddleAnimTimer,
              paddleAnimDir: this.player.paddleAnimDir,
              clutchPressed: this.player.clutchPressed,
              turboBoost: this.player.turboBoost,
              elapsed: this.player.elapsedSeconds
            },
            dt
          );
        }
      }
      this.playerMesh.group.visible = true;

      const speedFrac = clamp(this.player.speed / Math.max(40, this.player.maxSpeedMs), 0, 1);
      const targetFov = isInterior ? 70 + speedFrac * 6 : isHood ? 62 + speedFrac * 9 : 58 + speedFrac * 10;
      if (Math.abs(targetFov - this.lastFov) > 0.05) {
        this.lastFov += (targetFov - this.lastFov) * (snap ? 1 : Math.min(1, 6 * dt));
        this.camera.fov = this.lastFov;
        this.camera.updateProjectionMatrix();
      }

      if (isInterior && this.interiorRig) {
        this.playerMesh.group.updateMatrixWorld(true);
        const eye = this.interiorRig.getDriverEyeLocal();
        this.eyeWorldVec.set(
          eye.x - this.player.roll * 0.25,
          eye.y - this.player.pitch * 0.14,
          eye.z + this.player.camSurgeZ * 0.22
        );
        this.lookWorldVec.set(
          eye.x,
          eye.lookY + this.player.pitch * 0.35,
          eye.lookZ
        );
        this.playerMesh.group.localToWorld(this.eyeWorldVec);
        this.playerMesh.group.localToWorld(this.lookWorldVec);
        this.camPos.copy(this.eyeWorldVec);
        this.camLook.copy(this.lookWorldVec);
      } else if (isHood) {
        const isBigRig = spec && spec.id === 'big_rig';
        const hoodS = this.player.s + (isBigRig ? spec.length * 0.5 - 1.55 : 0.65);
        const hoodH = isBigRig
          ? spec.clearance + 1.95
          : Math.max(1.08, spec.clearance + (spec.height - spec.clearance) * 0.48 + 0.25);
        this.env.project(hoodS, this.player.d, this.camPosProj, hoodH);
        this.env.project(
          this.player.s + 54,
          this.player.d + Math.sin(this.player.yawRel) * 35,
          this.camLookTarget,
          isBigRig ? 1.55 : 1.02
        );
        this.camPos.set(this.camPosProj.x, this.camPosProj.y, this.camPosProj.z);
        this.camLook.set(this.camLookTarget.x, this.camLookTarget.y, this.camLookTarget.z);
      } else {
        const extraLen = Math.max(0, ((spec && spec.length) || 4.6) - 4.8);
        const extraH = Math.max(0, ((spec && spec.height) || 1.4) - 1.5);
        const backDist =
          (this.cameraMode === 1 ? 10.2 + extraLen * 0.80 : 7.0 + extraLen * 0.68) +
          this.player.camSurgeZ * 1.15;
        const height =
          this.cameraMode === 1 ? 3.55 + extraH * 1.12 : 2.55 + extraH * 1.05;
        const camD = this.player.d * 0.92;

        this.env.project(this.player.s - backDist, camD, this.camPosProj, height);
        this.env.project(this.player.s + 38, this.player.d * 0.65, this.camLookTarget, 1.15 + extraH * 0.45);

        const damp = snap ? 1 : Math.min(1, 10 * dt);
        this.camPos.x += (this.camPosProj.x - this.camPos.x) * damp;
        this.camPos.y += (this.camPosProj.y - this.camPos.y) * damp;
        this.camPos.z += (this.camPosProj.z - this.camPos.z) * damp;

        this.camLook.x += (this.camLookTarget.x - this.camLook.x) * damp;
        this.camLook.y += (this.camLookTarget.y - this.camLook.y) * damp;
        this.camLook.z += (this.camLookTarget.z - this.camLook.z) * damp;
      }

      let shakeX = 0;
      let shakeY = 0;
      if (this.shakeMag > 0.002) {
        shakeX = (Math.random() - 0.5) * this.shakeMag;
        shakeY = (Math.random() - 0.5) * this.shakeMag * 0.7;
        this.shakeMag *= Math.max(0, 1 - 6.5 * dt);
      }

      this.camera.position.set(this.camPos.x + shakeX, this.camPos.y + shakeY, this.camPos.z);
      this.camera.lookAt(this.camLook.x, this.camLook.y, this.camLook.z);
    }

    updateHUD() {
      const isInterior = this.cameraMode === 2;
      if (this.dom.bank) {
        this.dom.bank.textContent = this.formatMoney(this.economy.getBank());
      }
      if (this.dom.statusSummary) {
        const preset = this.env.getCurrentLightingPreset();
        this.dom.statusSummary.textContent = `${this.cameraNames[this.cameraMode]} · ${this.player.transmissionMode} · ${preset.name}`;
      }

      if (this.dom.rearMirrorBox) {
        const showHudMirror = !isInterior && this.hudMirrorEnabled && !this.garageOpen;
        this.dom.rearMirrorBox.classList.toggle('hidden', !showHudMirror);
      }

      if (this.dom.bottomRight) {
        this.dom.bottomRight.classList.toggle('hidden', isInterior);
      }
      if (this.dom.assistControls) {
        const showAssistBar =
          !this.player.crashed && !this.garageOpen && this.speedAssistMode !== 'off';
        this.dom.assistControls.classList.toggle('hidden', !showAssistBar);
        if (showAssistBar && this.dom.btnAssistMode) {
          const isLim = this.speedAssistMode === 'limit';
          this.dom.btnAssistMode.classList.toggle('limit', isLim);
          const dispVal = this.useKmh
            ? Math.round(this.speedAssistTargetKmh)
            : Math.round(this.speedAssistTargetKmh * 0.621371);
          this.dom.btnAssistMode.textContent = `${isLim ? 'LIM' : 'CRU'} ${dispVal}`;
        }
      }
      if (isInterior) {
        return;
      }

      const blinkOn = this.signalMode !== 0 && Math.floor(this.signalTimer * 2.7) % 2 === 0;
      if (this.dom.sigLeft) {
        this.dom.sigLeft.classList.toggle('on', blinkOn && (this.signalMode === -1 || this.signalMode === 2));
      }
      if (this.dom.sigHazard) {
        this.dom.sigHazard.classList.toggle('on', blinkOn && this.signalMode === 2);
      }
      if (this.dom.sigRight) {
        this.dom.sigRight.classList.toggle('on', blinkOn && (this.signalMode === 1 || this.signalMode === 2));
      }
      const preset = this.env.getCurrentLightingPreset();
      const beamState = this.getBeamState(preset);
      this.beamMode = beamState.mode;
      this.highBeamsActive = beamState.highBeams;
      if (this.dom.sigLowBeam) {
        this.dom.sigLowBeam.classList.toggle('on', beamState.mode === 'short');
      }
      if (this.dom.sigHighBeam) {
        this.dom.sigHighBeam.classList.toggle('on', beamState.mode === 'long');
      }
      if (this.dom.sigAssist) {
        const showAssist = !this.player.crashed && this.speedAssistMode !== 'off';
        this.dom.sigAssist.classList.toggle('hidden', !showAssist);
        if (showAssist) {
          const isLim = this.speedAssistMode === 'limit';
          this.dom.sigAssist.classList.toggle('limit', isLim);
          const dispVal = this.useKmh
            ? Math.round(this.speedAssistTargetKmh)
            : Math.round(this.speedAssistTargetKmh * 0.621371);
          this.dom.sigAssist.textContent = `${isLim ? 'LIM' : 'CRU'} ${dispVal}`;
        }
      }
      if (this.dom.sigHorn) {
        this.dom.sigHorn.classList.toggle('hidden', !this.hornActive);
      }

      const radarInfo = this.env.getRadarInfo(this.player.s);
      const speeding = this.player.speedKmh > radarInfo.limitKmh + 5;
      const limitDisp = this.useKmh ? radarInfo.limitKmh : Math.round(radarInfo.limitKmh * 0.621371);
      if (this.dom.radarLimitNum) {
        this.dom.radarLimitNum.textContent = String(limitDisp);
      }
      if (this.dom.radarDist) {
        const distM = Math.max(0, Math.round(radarInfo.distToRadar));
        if (radarInfo.nearby) {
          this.dom.radarDist.textContent = speeding ? `SLOW! RADAR ${distM}m` : `RADAR ${distM}m`;
        } else {
          this.dom.radarDist.textContent = speeding ? 'OVER LIMIT' : `LIMIT ${limitDisp}`;
        }
      }
      if (this.dom.radarPill) {
        this.dom.radarPill.classList.toggle('speeding', speeding && radarInfo.nearby);
        this.dom.radarPill.classList.toggle('warning', (speeding && !radarInfo.nearby) || (!speeding && radarInfo.nearby));
      }

      if (!this.dom.speed) return;
      const dispSpeed = this.useKmh
        ? Math.round(this.player.speedKmh)
        : Math.round(this.player.speedMph);
      this.dom.speed.textContent = String(dispSpeed);

      const gearTxt = this.player.getGearDisplay();
      const isRedline = this.player.rpmNorm > 0.90;

      if (this.dom.gear) {
        this.dom.gear.textContent = gearTxt;
        this.dom.gear.classList.toggle('redline', isRedline);
      }

      if (this.dom.shiftHint) {
        if (this.player.shiftPrompt === 1) {
          this.dom.shiftHint.textContent = '▲';
          this.dom.shiftHint.classList.remove('hidden');
        } else if (this.player.shiftPrompt === -1) {
          this.dom.shiftHint.textContent = '▼';
          this.dom.shiftHint.classList.remove('hidden');
        } else {
          this.dom.shiftHint.classList.add('hidden');
        }
      }

      if (this.dom.rpmBar) {
        const rpmPct = clamp(this.player.rpmNorm * 100, 12, 100);
        this.dom.rpmBar.style.width = `${rpmPct.toFixed(1)}%`;
        this.dom.rpmBar.style.backgroundColor =
          isRedline ? '#ef4444' : this.player.rpmNorm > 0.72 ? '#f59e0b' : '#38bdf8';
      }

      const km = this.player.distanceMeters / 1000;
      const distTxt = km < 10 ? `${km.toFixed(2)} km` : `${km.toFixed(1)} km`;
      if (this.dom.distance) {
        this.dom.distance.textContent = distTxt;
      }

      // Sync Analog HUD Cluster
      if (this.dom.analogRpmNeedle) {
        const rpmFrac = clamp((this.player.rpm - 0) / 7000, 0, 1.03);
        const rpmDeg = -135 + rpmFrac * 270;
        this.dom.analogRpmNeedle.style.transform = `rotate(${rpmDeg.toFixed(1)}deg)`;
      }
      if (this.dom.analogSpeedNeedle) {
        const maxDialSpeed = this.getMaxAnalogSpeed();
        const spdFrac = clamp(dispSpeed / maxDialSpeed, 0, 1);
        const spdDeg = -135 + spdFrac * 270;
        this.dom.analogSpeedNeedle.style.transform = `rotate(${spdDeg.toFixed(1)}deg)`;
      }
      if (this.dom.clutchPill) {
        const isManual = this.player.transmissionMode === 'MANUAL';
        this.dom.clutchPill.classList.toggle('hidden', !isManual);
        if (isManual) {
          this.dom.clutchPill.classList.toggle('engaged', !!this.player.clutchPressed);
          this.dom.clutchPill.textContent = this.player.clutchPressed
            ? 'CLUTCH ENGAGED'
            : 'CLUTCH · L-SHIFT';
        }
      }
      if (this.dom.analogGear) {
        this.dom.analogGear.textContent = gearTxt;
        this.dom.analogGear.classList.toggle('redline', isRedline);
      }
      if (this.dom.analogShiftHint) {
        if (this.player.shiftPrompt === 1) {
          this.dom.analogShiftHint.textContent = '▲';
          this.dom.analogShiftHint.classList.remove('hidden');
        } else if (this.player.shiftPrompt === -1) {
          this.dom.analogShiftHint.textContent = '▼';
          this.dom.analogShiftHint.classList.remove('hidden');
        } else {
          this.dom.analogShiftHint.classList.add('hidden');
        }
      }
      if (this.dom.analogSpeedNum) this.dom.analogSpeedNum.textContent = String(dispSpeed);
      if (this.dom.analogDistance) this.dom.analogDistance.textContent = distTxt;

      if (this.dom.streak) {
        if (this.economy.streakMult > 1.04) {
          this.dom.streak.textContent = `${this.economy.streakMult.toFixed(1)}x`;
          this.dom.streak.classList.remove('hidden');
        } else {
          this.dom.streak.classList.add('hidden');
        }
      }

      if (this.dom.damageCard) {
        if (this.player.damage > 0) {
          this.dom.damageCard.classList.remove('hidden');
          const cond = Math.max(0, Math.round(100 - this.player.damage));
          if (this.dom.conditionPct) this.dom.conditionPct.textContent = `${cond}%`;
          if (this.dom.conditionFill) {
            this.dom.conditionFill.style.width = `${cond}%`;
            this.dom.conditionFill.style.backgroundColor =
              cond > 60 ? '#22c55e' : cond > 30 ? '#f59e0b' : '#ef4444';
          }
        } else {
          this.dom.damageCard.classList.add('hidden');
        }
      }
    }

    renderMirrors() {
      if (!this.rearMirrorRT || !this.mirrorCamera) return;
      const isInterior = this.cameraMode === 2;
      if (!isInterior && !this.hudMirrorEnabled) return;

      this.mirrorFrameCounter = (this.mirrorFrameCounter + 1) % 2;
      if (this.mirrorFrameCounter !== 0) return;

      const prevAutoShadow = this.renderer.shadowMap.autoUpdate;
      this.renderer.shadowMap.autoUpdate = false;
      this.playerMesh.group.visible = false;

      const spec = this.playerMesh.spec;
      const isBigRig = spec && spec.id === 'big_rig';
      const rearS = isBigRig ? this.player.s + 3.5 : this.player.s + 0.5;
      const rearH = isBigRig ? 2.55 : 1.38;
      const sideS = isBigRig ? this.player.s + 4.0 : this.player.s + 0.1;
      const sideW = isBigRig ? 1.48 : 1.15;
      const sideH = isBigRig ? 2.25 : 1.12;

      // Center Rearview Mirror Camera
      this.env.project(rearS, this.player.d, this.mirrorCamPos, rearH);
      this.env.project(
        this.player.s - 65,
        this.player.d + Math.sin(this.player.yawRel) * 18,
        this.mirrorLookPos,
        isBigRig ? 1.45 : 1.05
      );
      this.mirrorCamera.fov = 48;
      this.mirrorCamera.aspect = 320 / 144;
      this.mirrorCamera.updateProjectionMatrix();
      this.mirrorCamera.position.set(this.mirrorCamPos.x, this.mirrorCamPos.y, this.mirrorCamPos.z);
      this.mirrorCamera.lookAt(this.mirrorLookPos.x, this.mirrorLookPos.y, this.mirrorLookPos.z);
      this.renderer.setRenderTarget(this.rearMirrorRT);
      this.renderer.clear();
      this.renderer.render(this.scene, this.mirrorCamera);

      // Left & Right Wing Mirrors when inside Interior cockpit
      if (isInterior) {
        this.mirrorCamera.fov = 44;
        this.mirrorCamera.aspect = 144 / 112;
        this.mirrorCamera.updateProjectionMatrix();

        this.env.project(sideS, this.player.d - sideW, this.mirrorCamPos, sideH);
        this.env.project(this.player.s - 45, this.player.d - (sideW + 3.1), this.mirrorLookPos, isBigRig ? 1.35 : 0.95);
        this.mirrorCamera.position.set(this.mirrorCamPos.x, this.mirrorCamPos.y, this.mirrorCamPos.z);
        this.mirrorCamera.lookAt(this.mirrorLookPos.x, this.mirrorLookPos.y, this.mirrorLookPos.z);
        this.renderer.setRenderTarget(this.leftMirrorRT);
        this.renderer.clear();
        this.renderer.render(this.scene, this.mirrorCamera);

        this.env.project(sideS, this.player.d + sideW, this.mirrorCamPos, sideH);
        this.env.project(this.player.s - 45, this.player.d + (sideW + 3.1), this.mirrorLookPos, isBigRig ? 1.35 : 0.95);
        this.mirrorCamera.position.set(this.mirrorCamPos.x, this.mirrorCamPos.y, this.mirrorCamPos.z);
        this.mirrorCamera.lookAt(this.mirrorLookPos.x, this.mirrorLookPos.y, this.mirrorLookPos.z);
        this.renderer.setRenderTarget(this.rightMirrorRT);
        this.renderer.clear();
        this.renderer.render(this.scene, this.mirrorCamera);
      }

      this.renderer.setRenderTarget(null);
      this.playerMesh.group.visible = true;
      this.renderer.shadowMap.autoUpdate = prevAutoShadow;
    }

    compositeHudMirror() {
      if (
        !this.rearMirrorRT ||
        !this.mirrorHudScene ||
        this.cameraMode === 2 ||
        !this.hudMirrorEnabled ||
        this.garageOpen ||
        this.paused ||
        !this.dom.rearMirrorBox
      ) {
        return;
      }
      const rect = this.dom.rearMirrorBox.getBoundingClientRect();
      if (rect.width < 16 || rect.height < 12) return;
      const x = Math.round(rect.left + 3);
      const y = Math.round(window.innerHeight - rect.bottom + 3);
      const w = Math.max(8, Math.round(rect.width - 6));
      const h = Math.max(8, Math.round(rect.height - 6));

      this.renderer.setScissorTest(true);
      this.renderer.setViewport(x, y, w, h);
      this.renderer.setScissor(x, y, w, h);
      this.renderer.render(this.mirrorHudScene, this.mirrorHudCamera);
      this.renderer.setScissorTest(false);
      this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    }

    updateRadarEnforcement(dt, prevS) {
      let checkSlot = this.lastCheckedRadarSlot + 1;
      while (checkSlot < 100000) {
        const r = this.env.getRadarBySlot(checkSlot);
        if (!r || this.player.s < r.radarS) break;
        this.lastCheckedRadarSlot = checkSlot;
        if (prevS < r.radarS) {
          const speedKmh = this.player.speedKmh;
          const speedDisp = Math.round(this.useKmh ? speedKmh : this.player.speedMph);
          const limitDisp = this.useKmh ? r.limitKmh : Math.round(r.limitKmh * 0.621371);
          const unitLabel = this.useKmh ? 'km/h' : 'mph';
          if (speedKmh > r.limitKmh + 5) {
            const overKmh = Math.round(speedKmh - r.limitKmh);
            const fineAmount = Math.min(2500, 120 + Math.round(overKmh / 10) * 65);
            const res = this.economy.applyFine(fineAmount);
            this.env.triggerRadarFlash(r.slot);
            if (this.dom.fxRadarFlash) {
              this.dom.fxRadarFlash.classList.add('active');
            }
            this.radarFlashTimer = 0.085;
            this.lastFineText = `-${this.formatMoney(res.ticket)}`;
            this.lastFineBannerTimer = 3.2;
            this.shakeMag = Math.max(this.shakeMag, 0.14);
            if (window.HighwayAudio) {
              window.HighwayAudio.playRadarFlash();
            }
            this.showBonusToast(
              `RADAR ${speedDisp}/${limitDisp} ${unitLabel} · FINE -${this.formatMoney(res.ticket)}`,
              true
            );
          } else {
            if (window.HighwayAudio) {
              window.HighwayAudio.playRadarPass();
            }
            this.showBonusToast(`Radar OK · ${speedDisp}/${limitDisp} ${unitLabel}`, false);
          }
        }
        checkSlot++;
      }

      const info = this.env.getRadarInfo(this.player.s);
      if (this.radarBeepTimer > 0) {
        this.radarBeepTimer = Math.max(0, this.radarBeepTimer - dt);
      }
      if (info.nearby && this.player.speedKmh > info.limitKmh + 5) {
        const proximity = 1 - clamp(info.distToRadar / 380, 0, 1);
        if (this.radarBeepTimer <= 0) {
          if (window.HighwayAudio) {
            window.HighwayAudio.playRadarBeep(proximity);
          }
          this.radarBeepTimer = 0.62 - proximity * 0.42;
        }
      }
    }

    animate(now) {
      requestAnimationFrame(this.animate);

      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = clamp(isFinite(rawDt) ? rawDt : 0.016, 0.001, 0.05);

      if (this.calcLocked) {
        return;
      }

      if (this.toastTimer > 0) {
        this.toastTimer -= dt;
        if (this.toastTimer <= 0 && this.dom.toast) {
          this.dom.toast.classList.add('hidden');
        }
      }

      if (this.bonusTimer > 0) {
        this.bonusTimer -= dt;
        if (this.bonusTimer <= 0 && this.dom.bonusPill) {
          this.dom.bonusPill.classList.add('hidden');
        }
      }

      if (this.radarFlashTimer > 0) {
        this.radarFlashTimer -= dt;
        if (this.radarFlashTimer <= 0 && this.dom.fxRadarFlash) {
          this.dom.fxRadarFlash.classList.remove('active');
        }
      }

      if (this.lastFineBannerTimer > 0) {
        this.lastFineBannerTimer -= dt;
        if (this.lastFineBannerTimer <= 0) {
          this.lastFineText = '';
        }
      }

      if (!this.paused && !this.garageOpen) {
        if (this.profiler) {
          this.profiler.updateFPS(dt);
        }

        const preset = this.env.getCurrentLightingPreset();
        if (this.headlightFlashPulse > 0) {
          this.headlightFlashPulse = Math.max(0, this.headlightFlashPulse - dt);
        }
        const beamState = this.getBeamState(preset);
        this.beamMode = beamState.mode;
        this.highBeamsActive = beamState.highBeams;

        if (!this.cleanStreakResetDone && this.player.distanceMeters >= 3000) {
          this.economy.resetCrashStreak();
          this.cleanStreakResetDone = true;
        }

        // Turn signal timer, audio relay tick & lane-change auto-cancel
        if (this.signalMode !== 0) {
          this.signalTimer += dt;
          if (this.signalMode === -1 || this.signalMode === 1) {
            if (Math.abs(this.player.d - this.signalStartD) > 1.85) {
              this.signalMovedEnough = true;
            }
            if (
              this.signalMovedEnough &&
              Math.abs(this.player.steer) < 0.12 &&
              Math.abs(this.player.yawRel) < 0.025
            ) {
              this.signalMode = 0;
            }
          }
          const blinkOn = this.signalMode !== 0 && Math.floor(this.signalTimer * 2.7) % 2 === 0;
          if (blinkOn !== this.lastBlinkOn) {
            if (this.signalMode !== 0 && window.HighwayAudio) {
              window.HighwayAudio.playBlinkerTick(blinkOn);
            }
            this.lastBlinkOn = blinkOn;
          }
        } else {
          this.lastBlinkOn = false;
        }

        if (this.speedAssistMode === 'limit' && this.speedAssistAutoZone) {
          this.speedAssistTargetKmh = this.env.getRadarInfo(this.player.s).limitKmh;
        }
        const stepInput = {
          throttle: this.input.throttle,
          brake: this.input.brake,
          left: this.input.left,
          right: this.input.right,
          clutch: this.input.clutch,
          cruiseTargetMs: this.speedAssistMode === 'cruise' ? this.speedAssistTargetKmh / 3.6 : 0,
          limiterTargetMs: this.speedAssistMode === 'limit' ? this.speedAssistTargetKmh / 3.6 : 0
        };

        const substeps = dt > 0.025 ? 2 : 1;
        const subDt = dt / substeps;
        const prevDist = this.player.distanceMeters;
        const prevS = this.player.s;

        for (let s = 0; s < substeps; s++) {
          const events = this.player.step(subDt, stepInput, this.traffic, preset.grip);
          this.traffic.step(
            subDt,
            this.player,
            preset.headlightStrength,
            preset,
            this.hornActive,
            this.highBeamsActive
          );

          for (let e = 0; e < events.length; e++) {
            const ev = events[e];
            if (ev.type === 'shift') {
              if (window.HighwayAudio) window.HighwayAudio.playShift(ev.mode, ev.dir);
            } else if (ev.type === 'turbo_bov') {
              if (window.HighwayAudio) window.HighwayAudio.playTurboBOV(ev.boost);
            } else if (ev.type === 'shift_grind') {
              if (window.HighwayAudio) window.HighwayAudio.playGearGrind();
              this.showToast('Hold Left Shift (Clutch) to shift!', 1.2);
            } else if (ev.type === 'clean_pass') {
              const earned = this.economy.awardCleanPass(
                ev.relSpeedKmh,
                ev.isClose,
                preset.weatherMult
              );
              this.showBonusToast(`+${this.formatMoney(earned)} ${ev.isClose ? 'Close Pass' : 'Clean Pass'}`);
            } else {
              this.shakeMag = Math.max(
                this.shakeMag,
                ev.intensity * (ev.type === 'crash' ? 0.55 : 0.25)
              );
              if (window.HighwayAudio) {
                window.HighwayAudio.playCollision(ev.type);
              }
              if (ev.type === 'minor') {
                this.economy.onCollision();
                this.showToast('Traffic Contact', 1.2);
              } else if (ev.type === 'crash') {
                this.speedAssistMode = 'off';
                this.speedAssistAutoZone = false;
                const crashRes = this.economy.recordCrash();
                this.clearInputs();
                this.openCrashModal(crashRes);
              }
            }
          }
        }

        const deltaMeters = this.player.distanceMeters - prevDist;
        if (deltaMeters > 0) {
          this.economy.awardDistance(deltaMeters, this.player.speedKmh, preset.weatherMult);
        }

        if (this.blindSpotChirpCooldown > 0) {
          this.blindSpotChirpCooldown = Math.max(0, this.blindSpotChirpCooldown - dt);
        }
        if (!this.player.crashed) {
          this.updateRadarEnforcement(dt, prevS);
          this.blindSpot = this.traffic.getBlindSpotState(this.player);
          const conflictSide =
            (this.signalMode === -1 && this.blindSpot.left) ||
            (this.signalMode === 1 && this.blindSpot.right);
          if (conflictSide && this.blindSpotChirpCooldown <= 0) {
            if (window.HighwayAudio) window.HighwayAudio.playBlindSpotChirp();
            this.blindSpotChirpCooldown = 0.95;
          }
        } else {
          this.blindSpot = { left: false, right: false, leftClose: false, rightClose: false };
        }

        this.saveTimer += dt;
        if (this.saveTimer >= 5.0) {
          this.saveTimer = 0;
          this.economy.save();
        }

        this.env.update(this.player.s, dt, this.player.speed, this.beamMode);
        this.syncPlayerAndCamera(dt, false);
        this.updateHUD();
        this.renderMirrors();

        if (window.HighwayAudio) {
          window.HighwayAudio.update({
            speedMs: this.player.speed,
            rpm: this.player.rpm,
            throttle: this.speedAssistMode === 'cruise' ? Math.max(this.input.throttle, 0.25) : this.input.throttle,
            turboBoost: this.player.turboBoost,
            turboLevel: this.player.turboLevel,
            exhaustLevel: this.player.exhaustLevel,
            onShoulder: this.player.onShoulder,
            precip: preset.precip,
            hitRevLimiter: this.player.hitRevLimiter
          });
        }
      }

      this.renderer.render(this.scene, this.camera);
      this.compositeHudMirror();
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.__HIGHWAY_GAME__ = new HighwayGame();
  });
})();
