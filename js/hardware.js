/* ==========================================================================
   HARDWARE & GPU AUTO-DETECTION PROFILER (js/hardware.js)
   - Inspects WebGL GPU renderer/vendor, MAX_TEXTURE_SIZE, anisotropy,
     CPU cores, device memory, and pixel ratio.
   - Automatically classifies device into ULTRA, HIGH, MEDIUM, or LOW preset.
   - Includes rolling FPS monitor for adaptive dynamic scaling in AUTO mode.
   ========================================================================== */

(function () {
  const PRESETS = {
    ULTRA: {
      tier: 'ULTRA',
      pixelRatio: 2.0,
      shadowMapSize: 2048,
      shadowsEnabled: true,
      foliageMult: 1.0,
      particleCount: 180,
      anisotropy: 8,
      envMapSize: 256,
      antialias: true,
      maxDrawDist: 9500,
      rainCount: 1800
    },
    HIGH: {
      tier: 'HIGH',
      pixelRatio: 1.5,
      shadowMapSize: 1024,
      shadowsEnabled: true,
      foliageMult: 0.75,
      particleCount: 130,
      anisotropy: 4,
      envMapSize: 256,
      antialias: true,
      maxDrawDist: 7500,
      rainCount: 1200
    },
    MEDIUM: {
      tier: 'MEDIUM',
      pixelRatio: 1.25,
      shadowMapSize: 1024,
      shadowsEnabled: false,
      foliageMult: 0.5,
      particleCount: 90,
      anisotropy: 2,
      envMapSize: 128,
      antialias: true,
      maxDrawDist: 5500,
      rainCount: 700
    },
    LOW: {
      tier: 'LOW',
      pixelRatio: 1.0,
      shadowMapSize: 512,
      shadowsEnabled: false,
      foliageMult: 0.3,
      particleCount: 50,
      anisotropy: 1,
      envMapSize: 128,
      antialias: false,
      maxDrawDist: 4000,
      rainCount: 350
    },
    I5_FAST: {
      tier: 'I5_FAST',
      pixelRatio: 0.85,
      shadowMapSize: 512,
      shadowsEnabled: false,
      foliageMult: 0.18,
      particleCount: 32,
      anisotropy: 1,
      envMapSize: 64,
      antialias: false,
      maxDrawDist: 3200,
      rainCount: 200
    }
  };

  const TIER_ORDER = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'I5_FAST'];

  class HardwareProfiler {
    constructor() {
      this.mode = 'AUTO'; // 'AUTO' | 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW'
      this.info = this.detectDeviceCapabilities();
      this.detectedTier = this.classifyTier(this.info);
      this.activeTier = this.detectedTier;
      this.profile = this.buildProfile(this.activeTier);

      // Rolling FPS telemetry for adaptive auto-downgrade
      this.fps = 60;
      this._frameAcc = 0;
      this._timeAcc = 0;
      this._lowFpsDuration = 0;
      this._onProfileChange = null;
    }

    detectDeviceCapabilities() {
      const nav = typeof navigator !== 'undefined' ? navigator : {};
      const win = typeof window !== 'undefined' ? window : {};
      const cores = nav.hardwareConcurrency || 4;
      const memoryGb = nav.deviceMemory || 8;
      const dpr = win.devicePixelRatio || 1;
      const ua = nav.userAgent || '';
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

      let gpuVendor = 'Standard GPU';
      let gpuRenderer = 'WebGL Acceleration';
      let maxTexSize = 4096;
      let maxAnisotropy = 4;
      let isWebGL2 = false;

      try {
        if (typeof document !== 'undefined' && document.createElement) {
          const probeCanvas = document.createElement('canvas');
          const gl =
            (probeCanvas.getContext &&
              (probeCanvas.getContext('webgl2') ||
                probeCanvas.getContext('webgl') ||
                probeCanvas.getContext('experimental-webgl'))) ||
            null;

          if (gl && typeof gl.getParameter === 'function') {
            isWebGL2 =
              typeof WebGL2RenderingContext !== 'undefined' &&
              gl instanceof WebGL2RenderingContext;
            maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
            gpuVendor = gl.getParameter(gl.VENDOR) || gpuVendor;
            gpuRenderer = gl.getParameter(gl.RENDERER) || gpuRenderer;

            const debugExt = gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
            if (debugExt) {
              const unmaskedVendor = gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL);
              const unmaskedRenderer = gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL);
              if (unmaskedVendor) gpuVendor = unmaskedVendor;
              if (unmaskedRenderer) gpuRenderer = unmaskedRenderer;
            }

            const anisoExt =
              gl.getExtension &&
              (gl.getExtension('EXT_texture_filter_anisotropic') ||
                gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
                gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic'));
            if (anisoExt && gl.MAX_TEXTURE_MAX_ANISOTROPY_EXT !== undefined) {
              maxAnisotropy = gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 8;
            }
          }
        }
      } catch (e) {
        // Ignore probe failures in restricted WebGL contexts
      }

      return {
        gpuVendor: String(gpuVendor),
        gpuRenderer: String(gpuRenderer),
        maxTexSize,
        maxAnisotropy,
        cores,
        memoryGb,
        dpr,
        isMobile,
        isWebGL2
      };
    }

    classifyTier(info) {
      const r = info.gpuRenderer.toLowerCase();

      // Explicit software / very weak renderers
      if (
        r.includes('swiftshader') ||
        r.includes('llvmpipe') ||
        r.includes('software') ||
        info.cores <= 2 ||
        info.memoryGb <= 2
      ) {
        return 'I5_FAST';
      }

      // 3rd-gen Intel Core i5 (Ivy Bridge HD 2500/4000) & legacy Intel integrated GPUs
      if (
        /hd\s*graphics\s*(2000|2500|3000|4000|4200|4400|4600)|ivy\s*bridge|sandy\s*bridge/i.test(r) ||
        (info.cores <= 4 && /intel/i.test(r))
      ) {
        return 'I5_FAST';
      }

      // Dedicated desktop / Apple Silicon M-series GPUs
      const isAppleSilicon = /apple\s*m[1-9]|apple gpu/i.test(r) && !info.isMobile;
      const isDiscreteHighEnd =
        /rtx|gtx\s*1[06-9]|gtx\s*[2-4]|radeon\s*rx\s*[5-9]|radeon\s*pro|arc\s*a[57]/i.test(r);

      if ((isAppleSilicon || isDiscreteHighEnd || info.cores >= 8) && !info.isMobile && info.maxTexSize >= 8192) {
        return 'ULTRA';
      }

      if (info.isMobile) {
        return info.cores >= 6 && info.memoryGb >= 6 ? 'MEDIUM' : 'LOW';
      }

      if (info.cores >= 6 && info.memoryGb >= 8) {
        return 'HIGH';
      }

      return 'MEDIUM';
    }

    buildProfile(tierKey) {
      const base = PRESETS[tierKey] || PRESETS.HIGH;
      const dpr = this.info.dpr || 1;
      const maxAniso = this.info.maxAnisotropy || 8;

      let effectivePixelRatio = base.pixelRatio;
      if (tierKey === 'ULTRA') {
        effectivePixelRatio = Math.min(dpr, 2.0);
      } else if (tierKey === 'HIGH') {
        effectivePixelRatio = Math.min(dpr, 1.5);
      }

      return Object.assign({}, base, {
        pixelRatio: effectivePixelRatio,
        anisotropy: Math.min(base.anisotropy, maxAniso)
      });
    }

    setMode(newMode) {
      this.mode = newMode;
      const targetTier = newMode === 'AUTO' ? this.detectedTier : newMode;
      this.applyTier(targetTier);
    }

    cyclePreset() {
      const cycle = ['AUTO', 'ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'I5_FAST'];
      const idx = (cycle.indexOf(this.mode) + 1) % cycle.length;
      this.setMode(cycle[idx]);
      return { mode: this.mode, tier: this.activeTier, profile: this.profile };
    }

    setCustomOption(key, value) {
      const allowed = ['pixelRatio', 'foliageMult', 'shadowsEnabled', 'maxDrawDist', 'particleCount'];
      if (allowed.indexOf(key) === -1) return this.profile;
      this.mode = 'CUSTOM';
      this.profile = Object.assign({}, this.profile, { [key]: value, tier: 'CUSTOM' });
      this._lowFpsDuration = 0;
      if (typeof this._onProfileChange === 'function') {
        this._onProfileChange(this.profile, this.mode);
      }
      return this.profile;
    }

    applyTier(tierKey) {
      if (!PRESETS[tierKey]) return;
      this.activeTier = tierKey;
      this.profile = this.buildProfile(tierKey);
      this._lowFpsDuration = 0;
      if (typeof this._onProfileChange === 'function') {
        this._onProfileChange(this.profile, this.mode);
      }
    }

    onChange(cb) {
      this._onProfileChange = cb;
    }

    /**
     * Rolling FPS tracker; automatically steps down 1 tier if sustained < 32 FPS for > 4s in AUTO mode.
     */
    updateFPS(dt) {
      if (!dt || dt <= 0) return this.fps;
      this._frameAcc += 1;
      this._timeAcc += dt;

      if (this._timeAcc >= 0.5) {
        this.fps = Math.round(this._frameAcc / this._timeAcc);
        this._frameAcc = 0;
        this._timeAcc = 0;

        if (this.mode === 'AUTO') {
          if (this.fps < 32) {
            this._lowFpsDuration += 0.5;
            if (this._lowFpsDuration >= 4.0) {
              const curIdx = TIER_ORDER.indexOf(this.activeTier);
              if (curIdx !== -1 && curIdx < TIER_ORDER.length - 1) {
                this.applyTier(TIER_ORDER[curIdx + 1]);
              } else {
                this._lowFpsDuration = 0;
              }
            }
          } else {
            this._lowFpsDuration = Math.max(0, this._lowFpsDuration - 0.5);
          }
        }
      }
      return this.fps;
    }

    getSummary() {
      return {
        mode: this.mode,
        tier: this.activeTier,
        detectedTier: this.detectedTier,
        fps: this.fps,
        gpuRenderer: this.info.gpuRenderer,
        gpuVendor: this.info.gpuVendor,
        cores: this.info.cores,
        memoryGb: this.info.memoryGb,
        pixelRatio: this.profile.pixelRatio,
        shadowMapSize: this.profile.shadowMapSize,
        shadowsEnabled: this.profile.shadowsEnabled,
        foliageMult: this.profile.foliageMult,
        particleCount: this.profile.particleCount
      };
    }
  }

  window.HardwareProfiler = HardwareProfiler;
})();
