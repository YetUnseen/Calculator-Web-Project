/* ==========================================================================
   HIGHWAY AUDIO — WARM ENGINE SYNTH, TURBO SPOOL/BOV & PARASITE-FREE HIGH SPEED
   - 6 Distinct Car Engine Tones (I4, I6, T5, High-Rev I6, V8, V10)
   - Independent 4s seamless brown/pink noise buffers + DynamicsCompressorNode
   - Turbocharger compressor spool whine & crisp blow-off valve flutter
   - Mechanical shift snick, missed-clutch gear grind, rain & rumble strips
   - Suspends completely when paused or disguised as Calculator
   ========================================================================== */

(function () {
  'use strict';

  const ENGINE_TONES = {
    i4: { baseScale: 0.95, harmRatio: 2.0, subWeight: 0.45, filterBoost: 0.96 },
    i6: { baseScale: 1.12, harmRatio: 1.5, subWeight: 0.50, filterBoost: 1.02 },
    t5: { baseScale: 1.06, harmRatio: 1.67, subWeight: 0.52, filterBoost: 1.00 },
    i6_high: { baseScale: 1.24, harmRatio: 2.0, subWeight: 0.42, filterBoost: 1.08 },
    v8: { baseScale: 0.88, harmRatio: 1.98, subWeight: 0.65, filterBoost: 1.04 },
    v10: { baseScale: 1.38, harmRatio: 2.02, subWeight: 0.48, filterBoost: 1.12 },
    v12: { baseScale: 1.48, harmRatio: 1.5, subWeight: 0.44, filterBoost: 1.18 },
    diesel_v8: { baseScale: 0.62, harmRatio: 2.0, subWeight: 0.85, filterBoost: 0.82 }
  };

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  class HighwayAudio {
    constructor() {
      this.ctx = null;
      this.initialized = false;
      this.muted = false;
      this.suspended = false;
      this.engineTone = 'i4';

      this.masterGain = null;
      this.compressor = null;
      this.engineGain = null;
      this.engineFilter = null;
      this.engineWarmFilter = null;
      this.oscPrimary = null;
      this.oscHarmonic = null;
      this.oscSub = null;
      this.subGainNode = null;

      this.turboOsc = null;
      this.turboWhistleGain = null;
      this.turboAirFilter = null;
      this.turboAirGain = null;

      this.roadGain = null;
      this.roadFilter = null;
      this.windGain = null;
      this.windFilter = null;
      this.rainGain = null;
      this.rumbleGain = null;

      this.hornOsc1 = null;
      this.hornOsc2 = null;
      this.hornFilter = null;
      this.hornGain = null;
      this.hornIsOn = false;
      this.customBuffers = {};

      this.roadNoiseBuffer = null;
      this.windNoiseBuffer = null;
      this.rainNoiseBuffer = null;
      this.fxNoiseBuffer = null;
    }

    _createFilteredNoiseBuffer(seconds, mode) {
      const sr = this.ctx.sampleRate;
      const len = Math.max(1024, Math.floor(sr * seconds));
      const buf = this.ctx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);

      if (mode === 'brown') {
        let lastOut = 0;
        for (let i = 0; i < len; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.028 * white) / 1.028;
          data[i] = clamp(lastOut * 3.1, -0.95, 0.95);
        }
      } else {
        // Paul Kellet 7-stage pink noise
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < len; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          b6 = white * 0.115926;
          data[i] = clamp(pink * 0.11, -0.95, 0.95);
        }
      }

      // Crossfade edges for seamless glitch-free looping
      const fadeSamples = Math.min(Math.floor(sr * 0.15), Math.floor(len * 0.12));
      for (let i = 0; i < fadeSamples; i++) {
        const t = i / fadeSamples;
        const startSample = data[i];
        const endIdx = len - fadeSamples + i;
        data[i] = startSample * t + data[endIdx] * (1 - t);
      }

      return buf;
    }

    init() {
      if (this.initialized) {
        this.resume();
        return;
      }
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.42;

        if (typeof this.ctx.createDynamicsCompressor === 'function') {
          this.compressor = this.ctx.createDynamicsCompressor();
          this.compressor.threshold.value = -14;
          this.compressor.knee.value = 18;
          this.compressor.ratio.value = 4;
          this.compressor.attack.value = 0.008;
          this.compressor.release.value = 0.14;
          this.masterGain.connect(this.compressor);
          this.compressor.connect(this.ctx.destination);
        } else {
          this.masterGain.connect(this.ctx.destination);
        }

        // Independent noise buffers to prevent comb-filtering / periodic static
        this.roadNoiseBuffer = this._createFilteredNoiseBuffer(4, 'brown');
        this.windNoiseBuffer = this._createFilteredNoiseBuffer(4, 'pink');
        this.rainNoiseBuffer = this._createFilteredNoiseBuffer(4, 'pink');
        this.fxNoiseBuffer = this._createFilteredNoiseBuffer(1.5, 'pink');

        // Engine synthesizer (warm multi-oscillator bus with dual lowpass smoothing)
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 320;
        this.engineFilter.Q.value = 0.95;

        this.engineWarmFilter = this.ctx.createBiquadFilter();
        this.engineWarmFilter.type = 'lowpass';
        this.engineWarmFilter.frequency.value = 1400;
        this.engineWarmFilter.Q.value = 0.55;

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.value = 0.08;
        this.engineFilter.connect(this.engineWarmFilter);
        this.engineWarmFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        this.oscPrimary = this.ctx.createOscillator();
        this.oscPrimary.type = 'sawtooth';
        this.oscPrimary.frequency.value = 48;
        const priGain = this.ctx.createGain();
        priGain.gain.value = 0.24;
        this.oscPrimary.connect(priGain);
        priGain.connect(this.engineFilter);

        this.oscHarmonic = this.ctx.createOscillator();
        this.oscHarmonic.type = 'triangle';
        this.oscHarmonic.frequency.value = 96;
        const harmGain = this.ctx.createGain();
        harmGain.gain.value = 0.28;
        this.oscHarmonic.connect(harmGain);
        harmGain.connect(this.engineFilter);

        this.oscSub = this.ctx.createOscillator();
        this.oscSub.type = 'sine';
        this.oscSub.frequency.value = 24;
        this.subGainNode = this.ctx.createGain();
        this.subGainNode.gain.value = 0.30;
        this.oscSub.connect(this.subGainNode);
        this.subGainNode.connect(this.engineFilter);

        this.oscPrimary.start();
        this.oscHarmonic.start();
        this.oscSub.start();

        // Turbocharger spool whistle + filtered intake air
        this.turboOsc = this.ctx.createOscillator();
        this.turboOsc.type = 'sine';
        this.turboOsc.frequency.value = 1750;
        this.turboWhistleGain = this.ctx.createGain();
        this.turboWhistleGain.gain.value = 0;
        this.turboOsc.connect(this.turboWhistleGain);
        this.turboWhistleGain.connect(this.masterGain);
        this.turboOsc.start();

        const turboAirSrc = this.ctx.createBufferSource();
        turboAirSrc.buffer = this.windNoiseBuffer;
        turboAirSrc.loop = true;
        this.turboAirFilter = this.ctx.createBiquadFilter();
        this.turboAirFilter.type = 'bandpass';
        this.turboAirFilter.frequency.value = 2200;
        this.turboAirFilter.Q.value = 3.2;
        this.turboAirGain = this.ctx.createGain();
        this.turboAirGain.gain.value = 0;
        turboAirSrc.connect(this.turboAirFilter);
        this.turboAirFilter.connect(this.turboAirGain);
        this.turboAirGain.connect(this.masterGain);
        turboAirSrc.start(0, 1.37);

        // Road & Tire Noise (warm lowpassed brown noise)
        const roadSrc = this.ctx.createBufferSource();
        roadSrc.buffer = this.roadNoiseBuffer;
        roadSrc.loop = true;
        this.roadFilter = this.ctx.createBiquadFilter();
        this.roadFilter.type = 'lowpass';
        this.roadFilter.frequency.value = 150;
        this.roadFilter.Q.value = 0.6;
        this.roadGain = this.ctx.createGain();
        this.roadGain.gain.value = 0;
        roadSrc.connect(this.roadFilter);
        this.roadFilter.connect(this.roadGain);
        this.roadGain.connect(this.masterGain);
        roadSrc.start();

        // Aerodynamic Wind Rush (smooth lowpassed pink noise, zero harsh hiss)
        const windSrc = this.ctx.createBufferSource();
        windSrc.buffer = this.windNoiseBuffer;
        windSrc.loop = true;
        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'lowpass';
        this.windFilter.frequency.value = 280;
        this.windFilter.Q.value = 0.5;
        this.windGain = this.ctx.createGain();
        this.windGain.gain.value = 0;
        windSrc.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.masterGain);
        windSrc.start();

        // Rain Patter Ambiance (independent pink noise)
        const rainSrc = this.ctx.createBufferSource();
        rainSrc.buffer = this.rainNoiseBuffer;
        rainSrc.loop = true;
        const rainFilter = this.ctx.createBiquadFilter();
        rainFilter.type = 'bandpass';
        rainFilter.frequency.value = 1350;
        rainFilter.Q.value = 0.5;
        this.rainGain = this.ctx.createGain();
        this.rainGain.gain.value = 0;
        rainSrc.connect(rainFilter);
        rainFilter.connect(this.rainGain);
        this.rainGain.connect(this.masterGain);
        rainSrc.start();

        // Shoulder Rumble Strip Hum
        const rumbleOsc = this.ctx.createOscillator();
        rumbleOsc.type = 'triangle';
        rumbleOsc.frequency.value = 54;
        this.rumbleGain = this.ctx.createGain();
        this.rumbleGain.gain.value = 0;
        rumbleOsc.connect(this.rumbleGain);
        this.rumbleGain.connect(this.masterGain);
        rumbleOsc.start();

        // Dual-Tone Car Horn Bus
        this.hornFilter = this.ctx.createBiquadFilter();
        this.hornFilter.type = 'lowpass';
        this.hornFilter.frequency.value = 1650;
        this.hornFilter.Q.value = 0.8;
        this.hornGain = this.ctx.createGain();
        this.hornGain.gain.value = 0;

        this.hornOsc1 = this.ctx.createOscillator();
        this.hornOsc1.type = 'sawtooth';
        this.hornOsc1.frequency.value = 405;
        this.hornOsc2 = this.ctx.createOscillator();
        this.hornOsc2.type = 'sawtooth';
        this.hornOsc2.frequency.value = 505;
        const hG1 = this.ctx.createGain();
        const hG2 = this.ctx.createGain();
        hG1.gain.value = 0.5;
        hG2.gain.value = 0.5;
        this.hornOsc1.connect(hG1);
        this.hornOsc2.connect(hG2);
        hG1.connect(this.hornFilter);
        hG2.connect(this.hornFilter);
        this.hornFilter.connect(this.hornGain);
        this.hornGain.connect(this.masterGain);
        this.hornOsc1.start();
        this.hornOsc2.start();

        this.initialized = true;
        this.setEngineProfile(this.engineTone);
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      } catch (e) {}
    }

    setEngineProfile(toneKey) {
      this.engineTone = ENGINE_TONES[toneKey] ? toneKey : 'i4';
      if (this.initialized && this.subGainNode && this.ctx) {
        const cfg = ENGINE_TONES[this.engineTone];
        this.subGainNode.gain.setTargetAtTime(cfg.subWeight * 0.62, this.ctx.currentTime, 0.05);
      }
    }

    update(tele) {
      if (!this.initialized || !this.ctx || this.suspended) return;
      const now = this.ctx.currentTime;
      const cfg = ENGINE_TONES[this.engineTone] || ENGINE_TONES.i4;

      const speedMs = Math.max(0, Math.abs(tele.speedMs || 0));
      const speedFrac = Math.min(1, speedMs / 108);
      const rpm = clamp(tele.rpm || 820, 750, 7600);
      const throttle = clamp(tele.throttle || 0, 0, 1);
      const boost = clamp(tele.turboBoost || 0, 0, 1);
      const turboLevel = clamp(tele.turboLevel || 0.75, 0.35, 1.15);

      const baseFreq = (25 + (rpm / 7000) * 102) * cfg.baseScale;
      this.oscPrimary.frequency.setTargetAtTime(baseFreq, now, 0.04);
      this.oscHarmonic.frequency.setTargetAtTime(baseFreq * cfg.harmRatio, now, 0.04);
      this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);

      const exhaustLvl = clamp(tele.exhaustLevel || 0, 0, 4);
      const rawCutoff = (220 + (rpm / 7000) * 680 + throttle * 220) * cfg.filterBoost + exhaustLvl * 45;
      const filterCutoff = Math.min(1220, rawCutoff);
      this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.05);

      let engVol = 0.045 + throttle * 0.052 + speedFrac * 0.022 + exhaustLvl * 0.004;
      if (tele.hitRevLimiter) {
        engVol *= Math.sin(now * 88) > 0 ? 1.12 : 0.35;
      }
      this.engineGain.gain.setTargetAtTime(engVol, now, 0.03);

      // Turbo spool whistle & intake air
      if (this.turboOsc && this.turboWhistleGain && this.turboAirFilter && this.turboAirGain) {
        const whistleFreq = 1700 + boost * 2400;
        const whistleVol = boost > 0.08 ? boost * 0.015 * turboLevel : 0;
        this.turboOsc.frequency.setTargetAtTime(whistleFreq, now, 0.05);
        this.turboWhistleGain.gain.setTargetAtTime(whistleVol, now, 0.05);

        this.turboAirFilter.frequency.setTargetAtTime(2000 + boost * 1500, now, 0.05);
        const airVol = boost > 0.10 ? boost * 0.011 * turboLevel : 0;
        this.turboAirGain.gain.setTargetAtTime(airVol, now, 0.05);
      }

      // Warm tire road roar (brown noise, strictly capped)
      const roadVol = tele.precip === 'rain' ? speedFrac * 0.088 : speedFrac * 0.068;
      this.roadFilter.frequency.setTargetAtTime(130 + speedFrac * 180, now, 0.06);
      this.roadGain.gain.setTargetAtTime(roadVol, now, 0.06);

      // Clean cabin wind rush (lowpassed pink noise <= 600Hz, no static parasite)
      this.windFilter.frequency.setTargetAtTime(260 + speedFrac * 340, now, 0.06);
      this.windGain.gain.setTargetAtTime(Math.pow(speedFrac, 1.8) * 0.055, now, 0.06);

      if (this.rainGain) {
        const targetRain = tele.precip === 'rain' ? 0.045 + speedFrac * 0.025 : 0;
        this.rainGain.gain.setTargetAtTime(targetRain, now, 0.12);
      }

      const rumbleVol = tele.onShoulder && speedMs > 6 ? 0.052 : 0.0;
      this.rumbleGain.gain.setTargetAtTime(rumbleVol, now, 0.04);
    }

    playTurboBOV(boost) {
      if (!this.initialized || !this.ctx || this.muted || this.suspended || !this.fxNoiseBuffer) return;
      try {
        const now = this.ctx.currentTime;
        const b = clamp(boost || 0.55, 0.3, 1.0);
        const dur = 0.24 + b * 0.07;

        const src = this.ctx.createBufferSource();
        src.buffer = this.fxNoiseBuffer;
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 2.4;
        bp.frequency.setValueAtTime(2700 + b * 500, now);
        bp.frequency.exponentialRampToValueAtTime(850, now + dur);

        const g = this.ctx.createGain();
        const peak = b * 0.095;
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(peak, now + 0.015);
        g.gain.linearRampToValueAtTime(peak * 0.45, now + 0.055);
        g.gain.linearRampToValueAtTime(peak * 0.72, now + 0.09);
        g.gain.linearRampToValueAtTime(peak * 0.25, now + 0.13);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);

        src.connect(bp);
        bp.connect(g);
        g.connect(this.masterGain);
        src.start(now, Math.random() * 0.35);
        src.stop(now + dur + 0.02);
      } catch (e) {}
    }

    playGearGrind() {
      if (!this.initialized || !this.ctx || this.muted || this.suspended) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(165, now);
        osc.frequency.setValueAtTime(125, now + 0.035);
        osc.frequency.setValueAtTime(155, now + 0.07);
        osc.frequency.setValueAtTime(110, now + 0.10);

        const og = this.ctx.createGain();
        og.gain.setValueAtTime(0.055, now);
        og.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(og);
        og.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.145);

        if (this.fxNoiseBuffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.fxNoiseBuffer;
          const bp = this.ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 520;
          bp.Q.value = 1.6;
          const ng = this.ctx.createGain();
          ng.gain.setValueAtTime(0.065, now);
          ng.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          src.connect(bp);
          bp.connect(ng);
          ng.connect(this.masterGain);
          src.start(now, 0.1);
          src.stop(now + 0.13);
        }
      } catch (e) {}
    }

    playShift(mode, dir) {
      if (!this.initialized || !this.ctx || this.muted || this.suspended) return;
      try {
        const now = this.ctx.currentTime;
        const isSemi = mode === 'SEMI';
        const isManual = mode === 'MANUAL';
        const isDown = dir !== undefined && dir < 0;

        const osc = this.ctx.createOscillator();
        osc.type = isSemi && !isDown ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(isSemi ? (isDown ? 250 : 205) : isManual ? 185 : 140, now);
        osc.frequency.exponentialRampToValueAtTime(isDown ? 145 : 62, now + (isSemi ? 0.055 : 0.08));

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(isSemi ? 0.068 : isManual ? 0.055 : 0.035, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + (isSemi ? 0.06 : 0.085));
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.09);

        if (isSemi && !isDown && this.fxNoiseBuffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.fxNoiseBuffer;
          const bp = this.ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 340;
          bp.Q.value = 1.3;
          const ng = this.ctx.createGain();
          ng.gain.setValueAtTime(0.065, now);
          ng.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          src.connect(bp);
          bp.connect(ng);
          ng.connect(this.masterGain);
          src.start(now, 0.2);
          src.stop(now + 0.065);
        }
      } catch (e) {}
    }

    playCollision(severity) {
      if (!this.initialized || !this.ctx || this.muted || this.suspended) return;
      try {
        const now = this.ctx.currentTime;
        const isCrash = severity === 'crash';
        const isBarrier = severity === 'barrier';
        const amp = isCrash ? 0.42 : isBarrier ? 0.16 : 0.25;
        const dur = isCrash ? 0.48 : 0.22;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isCrash ? 115 : 95, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + dur);

        const thudGain = this.ctx.createGain();
        thudGain.gain.setValueAtTime(amp, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(thudGain);
        thudGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + dur + 0.02);

        if (this.fxNoiseBuffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.fxNoiseBuffer;
          const bp = this.ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = isBarrier ? 1100 : 680;
          bp.Q.value = 1.2;

          const nGain = this.ctx.createGain();
          nGain.gain.setValueAtTime(amp * 0.65, now);
          nGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.85);
          src.connect(bp);
          bp.connect(nGain);
          nGain.connect(this.masterGain);
          src.start(now);
          src.stop(now + dur);
        }
      } catch (e) {}
    }

    setHorn(active, hornMode) {
      if (!this.initialized || !this.ctx || !this.hornGain) return;
      const on = !!active && !this.muted && !this.suspended;
      const now = this.ctx.currentTime;
      const mode = hornMode === true ? 'police' : hornMode || 'standard';
      if (this.hornOsc1 && this.hornOsc2) {
        const f1 = mode === 'airhorn' ? 185 : mode === 'police' ? 370 : 405;
        const f2 = mode === 'airhorn' ? 233 : mode === 'police' ? 466 : 505;
        this.hornOsc1.frequency.setTargetAtTime(f1, now, 0.01);
        this.hornOsc2.frequency.setTargetAtTime(f2, now, 0.01);
      }
      if (this.hornFilter) {
        this.hornFilter.frequency.setTargetAtTime(mode === 'airhorn' ? 1150 : 1650, now, 0.02);
      }
      if (on && !this.hornIsOn && this.customBuffers.horn) {
        this._playCustomBuffer(this.customBuffers.horn, 0.35);
      }
      this.hornIsOn = on;
      const peakGain = mode === 'airhorn' ? 0.17 : 0.13;
      const targetVol = on && !this.customBuffers.horn ? peakGain : 0;
      this.hornGain.gain.setTargetAtTime(targetVol, now, on ? 0.015 : 0.02);
    }

    playHeadlightFlash(on) {
      if (!this.initialized || !this.ctx || this.muted || this.suspended) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(on ? 1450 : 1120, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.018);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.035, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.024);
      } catch (e) {}
    }

    playBlinkerTick(isOn) {
      if (!this.initialized || !this.ctx || this.muted || this.suspended) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isOn ? 920 : 740, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.018);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.04, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.025);
      } catch (e) {}
    }

    _playCustomBuffer(buf, gainVal) {
      if (!buf || !this.ctx || !this.masterGain) return;
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.value = gainVal || 0.35;
        src.connect(g);
        g.connect(this.masterGain);
        src.start();
      } catch (e) {}
    }

    async loadCustomSamples(manifest) {
      if (!manifest || typeof manifest !== 'object') return;
      if (!this.initialized) this.init();
      if (!this.ctx || typeof fetch !== 'function') return;
      const entries = Object.entries(manifest);
      for (let i = 0; i < entries.length; i++) {
        const [key, url] = entries[i];
        if (!url) continue;
        try {
          const resp = await fetch(url);
          if (!resp.ok) continue;
          const arr = await resp.arrayBuffer();
          this.customBuffers[key] = await this.ctx.decodeAudioData(arr);
        } catch (e) {}
      }
    }

    setMuted(muted) {
      this.muted = !!muted;
      if (this.muted) this.setHorn(false);
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(
          this.muted || this.suspended ? 0 : 0.42,
          this.ctx.currentTime,
          0.03
        );
      }
      return this.muted;
    }

    toggleMute() {
      return this.setMuted(!this.muted);
    }

    suspend() {
      this.suspended = true;
      this.setHorn(false);
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
      }
    }

    resume() {
      this.suspended = false;
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.42, this.ctx.currentTime, 0.04);
      }
    }
  }

  window.HighwayAudio = new HighwayAudio();
})();
