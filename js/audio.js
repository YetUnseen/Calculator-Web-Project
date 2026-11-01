/* ==========================================================================
   AUTHENTIC MULTI-CYLINDER ENGINE, EXHAUST RESONATOR, TURBO & TIRE AUDIO
   - Real Cylinder Firing Frequencies & Harmonic Orders (V8 Flat-Plane,
     Cross-Plane V8, Quad-Turbo W16, 9500-RPM NA V12, 9000-RPM Flat-6 GT3,
     and 2JZ/RB26 Big-Turbo Inline-6)
   - Convolver Exhaust Pipe Impulse Resonance + Asymmetric Tube Saturation
   - Real Turbocharger Compressor Whistle + Flutter ("Stututu") & Wastegate
   - Exhaust Overrun Pops & Crackles (Decel Burble) + DCT Shift Ignition Cut
   - Straight-Cut Motorsport Gearbox Whine + Dual-Band Tire Scrub & Wind Rush
   ========================================================================== */

(function () {
  class PureDrivingAudio {
    constructor() {
      this.ctx = null;
      this.initialized = false;
      this.muted = false;

      this.masterGain = null;
      this.engineBus = null;
      this.exhaustSaturation = null;
      this.exhaustConvolver = null;
      this.bodyFormant = null;
      this.throatFormant = null;
      this.intakeFilter = null;
      this.lowShelf = null;

      // 4 Harmonic Cylinder Firing Oscillators + Combustion Roughness Noise
      this.oscFund = null;
      this.oscSub = null;
      this.oscOrder2 = null;
      this.oscOrder3 = null;
      this.gainFund = null;
      this.gainSub = null;
      this.gainOrder2 = null;
      this.gainOrder3 = null;
      this.combustionNoiseGain = null;
      this.combustionNoiseFilter = null;

      // Turbocharger Spool Whistle & Air Rush
      this.turboWhistleOsc = null;
      this.turboWhistleGain = null;
      this.turboAirGain = null;
      this.turboAirFilter = null;
      this.turboBoostPressure = 0;

      // Straight-Cut Gearbox Whine
      this.gearWhineOsc = null;
      this.gearWhineGain = null;

      // Tire Scrub / Squeal, Road/Gravel Rumble & High-Speed Wind Rush
      this.screechGain = null;
      this.screechFilter = null;
      this.tireScrubGain = null;
      this.tireScrubFilter = null;
      this.rumbleGain = null;
      this.windGain = null;
      this.windFilter = null;

      this.noiseBuffer = null;
      this.profile = 'v8_flatplane_tt';
      this.lastGear = 1;
      this.lastThrottle = 0;
      this.lastPopTime = 0;
      this.shiftCutEndTime = 0;
    }

    /* ----------------------------------------------------------------------
       GENERATE NON-LINEAR EXHAUST SATURATION CURVE (WARM TUBE HARMONICS)
       ---------------------------------------------------------------------- */
    createExhaustDistortionCurve(amount) {
      const k = typeof amount === 'number' ? amount : 28;
      const nSamples = 8192;
      const curve = new Float32Array(nSamples);
      for (let i = 0; i < nSamples; i++) {
        const x = (i * 2) / nSamples - 1;
        // Asymmetric compression: models sharp exhaust valve opening pulse & round expansion
        if (x >= 0) {
          curve[i] = Math.tanh(x * (1.4 + k * 0.06));
        } else {
          curve[i] = Math.tanh(x * (1.1 + k * 0.04)) * 0.92;
        }
      }
      return curve;
    }

    /* ----------------------------------------------------------------------
       GENERATE METALLIC EXHAUST MUFFLER & TAILPIPE IMPULSE RESPONSE (55ms)
       ---------------------------------------------------------------------- */
    createExhaustImpulseResponse() {
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.055);
      const impulse = this.ctx.createBuffer(2, length, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 68);
          // Early tailpipe reflections + hollow muffler chamber modes
          const pipeRes =
            Math.sin(2 * Math.PI * 185 * t) * 0.45 +
            Math.sin(2 * Math.PI * 410 * t + 0.6) * 0.30 +
            Math.sin(2 * Math.PI * 920 * t + 1.2) * 0.18 +
            (Math.random() * 2 - 1) * 0.28;
          data[i] = pipeRes * env;
        }
      }
      return impulse;
    }

    /* ----------------------------------------------------------------------
       GENERATE CUSTOM PERIODIC WAVEFORMS FOR COMBUSTION PULSES
       ---------------------------------------------------------------------- */
    createCombustionPeriodicWave(type) {
      const n = 32;
      const real = new Float32Array(n);
      const imag = new Float32Array(n);
      real[0] = 0;
      imag[0] = 0;

      for (let k = 1; k < n; k++) {
        if (type === 'crisp_pulse') {
          // Rich harmonic decay like a sharp exhaust valve pulse
          imag[k] = (1 / Math.pow(k, 0.82)) * (k % 2 === 1 ? 1 : 0.72);
          real[k] = (0.3 / k) * Math.cos(k * 0.45);
        } else if (type === 'deep_thump') {
          // Heavy low-order energy for cross-plane V8 / W16 sub-pulses
          imag[k] = 1 / Math.pow(k, 1.35);
          real[k] = (0.25 / Math.pow(k, 1.2)) * (k % 2 === 0 ? -1 : 1);
        } else {
          // Screaming high-order metallic harmonics (V12 / Flat-6 / I6)
          imag[k] = (1 / Math.pow(k, 0.75)) * (k % 3 === 0 ? 1.25 : 0.8);
          real[k] = 0.2 / k;
        }
      }
      return this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();

        // Master output bus with gentle limiter compression
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -10;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.004;
        compressor.release.value = 0.09;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.62;
        this.masterGain.connect(compressor);
        compressor.connect(this.ctx.destination);

        // Shared 2-second white/pink noise buffer
        const bufferSize = this.ctx.sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + white * 0.029;
          b1 = 0.985 * b1 + white * 0.032;
          b2 = 0.950 * b2 + white * 0.048;
          output[i] = (white * 0.55 + (b0 + b1 + b2) * 0.45);
        }

        // Custom combustion waveforms
        this.waveCrisp = this.createCombustionPeriodicWave('crisp_pulse');
        this.waveDeep = this.createCombustionPeriodicWave('deep_thump');
        this.waveMetallic = this.createCombustionPeriodicWave('metallic_scream');

        // Exhaust Acoustic Chain:
        // Oscillators + Combustion Turbulence -> WaveShaper Saturation -> Parallel Muffler Convolver & Formants -> Low-Pass Intake/Load Filter -> Engine Bus
        this.exhaustSaturation = this.ctx.createWaveShaper();
        this.exhaustSaturation.curve = this.createExhaustDistortionCurve(32);
        this.exhaustSaturation.oversample = '2x';

        this.exhaustConvolver = this.ctx.createConvolver();
        this.exhaustConvolver.buffer = this.createExhaustImpulseResponse();

        const dryExhaustGain = this.ctx.createGain();
        dryExhaustGain.gain.value = 0.65;
        const wetExhaustGain = this.ctx.createGain();
        wetExhaustGain.gain.value = 0.55;

        // Muffler body resonance (deep chest thump at 160-240 Hz)
        this.bodyFormant = this.ctx.createBiquadFilter();
        this.bodyFormant.type = 'peaking';
        this.bodyFormant.frequency.value = 190;
        this.bodyFormant.Q.value = 2.2;
        this.bodyFormant.gain.value = 6.5;

        // Tailpipe metallic bark formant (750-1500 Hz)
        this.throatFormant = this.ctx.createBiquadFilter();
        this.throatFormant.type = 'peaking';
        this.throatFormant.frequency.value = 980;
        this.throatFormant.Q.value = 2.5;
        this.throatFormant.gain.value = 5.0;

        // Sub-bass warmth shelf
        this.lowShelf = this.ctx.createBiquadFilter();
        this.lowShelf.type = 'lowshelf';
        this.lowShelf.frequency.value = 120;
        this.lowShelf.gain.value = 5.5;

        // Dynamic throttle/RPM induction lowpass filter
        this.intakeFilter = this.ctx.createBiquadFilter();
        this.intakeFilter.type = 'lowpass';
        this.intakeFilter.frequency.value = 950;
        this.intakeFilter.Q.value = 1.6;

        this.engineBus = this.ctx.createGain();
        this.engineBus.gain.value = 0.28;

        this.exhaustSaturation.connect(dryExhaustGain);
        this.exhaustSaturation.connect(this.exhaustConvolver);
        this.exhaustConvolver.connect(wetExhaustGain);

        dryExhaustGain.connect(this.bodyFormant);
        wetExhaustGain.connect(this.bodyFormant);
        this.bodyFormant.connect(this.throatFormant);
        this.throatFormant.connect(this.lowShelf);
        this.lowShelf.connect(this.intakeFilter);
        this.intakeFilter.connect(this.engineBus);
        this.engineBus.connect(this.masterGain);

        // 4 Harmonic Cylinder Firing Oscillators
        this.oscFund = this.ctx.createOscillator();
        this.oscSub = this.ctx.createOscillator();
        this.oscOrder2 = this.ctx.createOscillator();
        this.oscOrder3 = this.ctx.createOscillator();

        this.oscFund.setPeriodicWave(this.waveCrisp);
        this.oscSub.setPeriodicWave(this.waveDeep);
        this.oscOrder2.setPeriodicWave(this.waveCrisp);
        this.oscOrder3.setPeriodicWave(this.waveMetallic);

        this.gainFund = this.ctx.createGain();
        this.gainSub = this.ctx.createGain();
        this.gainOrder2 = this.ctx.createGain();
        this.gainOrder3 = this.ctx.createGain();

        this.gainFund.gain.value = 0.50;
        this.gainSub.gain.value = 0.42;
        this.gainOrder2.gain.value = 0.32;
        this.gainOrder3.gain.value = 0.20;

        this.oscFund.connect(this.gainFund);
        this.oscSub.connect(this.gainSub);
        this.oscOrder2.connect(this.gainOrder2);
        this.oscOrder3.connect(this.gainOrder3);

        this.gainFund.connect(this.exhaustSaturation);
        this.gainSub.connect(this.exhaustSaturation);
        this.gainOrder2.connect(this.exhaustSaturation);
        this.gainOrder3.connect(this.exhaustSaturation);

        this.oscFund.start();
        this.oscSub.start();
        this.oscOrder2.start();
        this.oscOrder3.start();

        // Combustion gas turbulence & mechanical valvetrain grit (critical for non-synthy realism!)
        const combNoise = this.ctx.createBufferSource();
        combNoise.buffer = this.noiseBuffer;
        combNoise.loop = true;

        this.combustionNoiseFilter = this.ctx.createBiquadFilter();
        this.combustionNoiseFilter.type = 'bandpass';
        this.combustionNoiseFilter.frequency.value = 320;
        this.combustionNoiseFilter.Q.value = 1.8;

        this.combustionNoiseGain = this.ctx.createGain();
        this.combustionNoiseGain.gain.value = 0.14;

        combNoise.connect(this.combustionNoiseFilter);
        this.combustionNoiseFilter.connect(this.combustionNoiseGain);
        this.combustionNoiseGain.connect(this.exhaustSaturation);
        combNoise.start();

        // Turbocharger Compressor Spool Whistle + Air Induction Whoosh
        this.turboWhistleOsc = this.ctx.createOscillator();
        this.turboWhistleOsc.type = 'sine';
        this.turboWhistleOsc.frequency.value = 2400;
        this.turboWhistleGain = this.ctx.createGain();
        this.turboWhistleGain.gain.value = 0;
        this.turboWhistleOsc.connect(this.turboWhistleGain);
        this.turboWhistleGain.connect(this.masterGain);
        this.turboWhistleOsc.start();

        const turboAirSrc = this.ctx.createBufferSource();
        turboAirSrc.buffer = this.noiseBuffer;
        turboAirSrc.loop = true;
        this.turboAirFilter = this.ctx.createBiquadFilter();
        this.turboAirFilter.type = 'bandpass';
        this.turboAirFilter.frequency.value = 1800;
        this.turboAirFilter.Q.value = 3.2;
        this.turboAirGain = this.ctx.createGain();
        this.turboAirGain.gain.value = 0;
        turboAirSrc.connect(this.turboAirFilter);
        this.turboAirFilter.connect(this.turboAirGain);
        this.turboAirGain.connect(this.masterGain);
        turboAirSrc.start();

        // Straight-Cut Motorsport Gearbox Whine
        this.gearWhineOsc = this.ctx.createOscillator();
        this.gearWhineOsc.type = 'triangle';
        this.gearWhineOsc.frequency.value = 480;
        const whineFilter = this.ctx.createBiquadFilter();
        whineFilter.type = 'bandpass';
        whineFilter.frequency.value = 1100;
        whineFilter.Q.value = 4.0;
        this.gearWhineGain = this.ctx.createGain();
        this.gearWhineGain.gain.value = 0;
        this.gearWhineOsc.connect(whineFilter);
        whineFilter.connect(this.gearWhineGain);
        this.gearWhineGain.connect(this.masterGain);
        this.gearWhineOsc.start();

        // Dual-Band Tire Scrub (Low-frequency rubber groan + high-frequency slip squeal)
        const tireSrc1 = this.ctx.createBufferSource();
        tireSrc1.buffer = this.noiseBuffer;
        tireSrc1.loop = true;

        this.screechFilter = this.ctx.createBiquadFilter();
        this.screechFilter.type = 'bandpass';
        this.screechFilter.frequency.value = 1350;
        this.screechFilter.Q.value = 7.5;
        this.screechGain = this.ctx.createGain();
        this.screechGain.gain.value = 0;

        this.tireScrubFilter = this.ctx.createBiquadFilter();
        this.tireScrubFilter.type = 'bandpass';
        this.tireScrubFilter.frequency.value = 420;
        this.tireScrubFilter.Q.value = 2.8;
        this.tireScrubGain = this.ctx.createGain();
        this.tireScrubGain.gain.value = 0;

        tireSrc1.connect(this.screechFilter);
        this.screechFilter.connect(this.screechGain);
        this.screechGain.connect(this.masterGain);

        tireSrc1.connect(this.tireScrubFilter);
        this.tireScrubFilter.connect(this.tireScrubGain);
        this.tireScrubGain.connect(this.masterGain);
        tireSrc1.start();

        // Off-road Gravel & Dirt Chassis Rumble
        const rumbleSource = this.ctx.createBufferSource();
        rumbleSource.buffer = this.noiseBuffer;
        rumbleSource.loop = true;
        const rumbleFilter = this.ctx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 165;
        this.rumbleGain = this.ctx.createGain();
        this.rumbleGain.gain.value = 0;
        rumbleSource.connect(rumbleFilter);
        rumbleFilter.connect(this.rumbleGain);
        this.rumbleGain.connect(this.masterGain);
        rumbleSource.start();

        // High-Speed Aerodynamic Wind & Road Tire Rolling Rush
        const windSource = this.ctx.createBufferSource();
        windSource.buffer = this.noiseBuffer;
        windSource.loop = true;
        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'bandpass';
        this.windFilter.frequency.value = 280;
        this.windFilter.Q.value = 0.9;
        this.windGain = this.ctx.createGain();
        this.windGain.gain.value = 0;
        windSource.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.masterGain);
        windSource.start();

        this.setEngineProfile(this.profile);
        this.initialized = true;
      } catch (e) {
        console.warn('WebAudio init skipped:', e);
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }

    setEngineProfile(profile) {
      this.profile = profile || 'v8_flatplane_tt';
      if (!this.initialized || !this.ctx) return;

      // Configure harmonic weights and formant resonances for each authentic engine architecture
      if (this.profile === 'w16_quadturbo' || this.profile === 'v8_rumble') {
        // Bugatti W16 / Cross-plane V8: Massive sub-bass burble, deep chest resonance
        this.oscFund.setPeriodicWave(this.waveDeep);
        this.oscOrder2.setPeriodicWave(this.waveCrisp);
        this.gainFund.gain.value = 0.56;
        this.gainSub.gain.value = 0.58;
        this.gainOrder2.gain.value = 0.30;
        this.gainOrder3.gain.value = 0.16;
        this.bodyFormant.frequency.value = 145;
        this.throatFormant.frequency.value = 720;
      } else if (this.profile === 'v8_crossplane_fury') {
        // Hennessey Venom F5 6.6L Pushrod V8: Aggressive uneven V8 chop
        this.oscFund.setPeriodicWave(this.waveCrisp);
        this.oscOrder2.setPeriodicWave(this.waveDeep);
        this.gainFund.gain.value = 0.55;
        this.gainSub.gain.value = 0.54;
        this.gainOrder2.gain.value = 0.38;
        this.gainOrder3.gain.value = 0.24;
        this.bodyFormant.frequency.value = 165;
        this.throatFormant.frequency.value = 880;
      } else if (this.profile === 'v12_na_screamer') {
        // Lamborghini Revuelto 6.5L NA V12: High-pitched 12-cylinder metallic symphony
        this.oscFund.setPeriodicWave(this.waveMetallic);
        this.oscOrder2.setPeriodicWave(this.waveCrisp);
        this.gainFund.gain.value = 0.44;
        this.gainSub.gain.value = 0.22;
        this.gainOrder2.gain.value = 0.48;
        this.gainOrder3.gain.value = 0.42;
        this.bodyFormant.frequency.value = 240;
        this.throatFormant.frequency.value = 1380;
      } else if (this.profile === 'flat6_gt3_na' || this.profile === 'f1_hybrid') {
        // Porsche 911 GT3 RS 9000 RPM Flat-6 / AMG ONE 11000 RPM F1 V6: Raspy mechanical boxer/F1 howl
        this.oscFund.setPeriodicWave(this.waveCrisp);
        this.oscOrder2.setPeriodicWave(this.waveMetallic);
        this.gainFund.gain.value = 0.48;
        this.gainSub.gain.value = 0.26;
        this.gainOrder2.gain.value = 0.42;
        this.gainOrder3.gain.value = 0.38;
        this.bodyFormant.frequency.value = 225;
        this.throatFormant.frequency.value = 1220;
      } else if (this.profile === 'i6_big_turbo' || this.profile === '2jz_turbo') {
        // Supra 2JZ / Skyline RB26 / M4 S58 Inline-6: Smooth 6-cylinder howl + loud big-turbo whistle
        this.oscFund.setPeriodicWave(this.waveCrisp);
        this.oscOrder2.setPeriodicWave(this.waveMetallic);
        this.gainFund.gain.value = 0.50;
        this.gainSub.gain.value = 0.34;
        this.gainOrder2.gain.value = 0.42;
        this.gainOrder3.gain.value = 0.32;
        this.bodyFormant.frequency.value = 195;
        this.throatFormant.frequency.value = 1040;
      } else {
        // Jesko Absolut / SF90 Flat-Plane Twin-Turbo V8: Crisp Exotic V8 Bark
        this.oscFund.setPeriodicWave(this.waveCrisp);
        this.oscOrder2.setPeriodicWave(this.waveCrisp);
        this.gainFund.gain.value = 0.52;
        this.gainSub.gain.value = 0.36;
        this.gainOrder2.gain.value = 0.44;
        this.gainOrder3.gain.value = 0.28;
        this.bodyFormant.frequency.value = 205;
        this.throatFormant.frequency.value = 1120;
      }
    }

    updateEngine(rpmNormalized, throttle, gear, slipAmount, surfaceType, isBoosting, speedMph) {
      if (!this.initialized || !this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const clampedRpm = Math.max(0.10, Math.min(1.04, rpmNormalized));

      // Define authentic firing frequency curve & harmonic multipliers per engine family
      let idleFreq = 46;
      let spanFreq = 220;
      let subRatio = 0.5;
      let order2Ratio = 2.0;
      let order3Ratio = 3.0;
      let hasTurbo = true;
      let turboIntensity = 1.0;
      let gearWhineIntensity = 0.25;

      if (this.profile === 'w16_quadturbo' || this.profile === 'v8_rumble') {
        idleFreq = 38;
        spanFreq = 185;
        subRatio = 0.5;
        order2Ratio = 1.5;
        order3Ratio = 2.5;
        hasTurbo = true;
        turboIntensity = 1.15;
        gearWhineIntensity = 0.15;
      } else if (this.profile === 'v8_crossplane_fury') {
        idleFreq = 40;
        spanFreq = 205;
        subRatio = 0.5;
        order2Ratio = 1.25; // Cross-plane uneven 90-degree firing interval!
        order3Ratio = 2.25;
        hasTurbo = true;
        turboIntensity = 1.1;
        gearWhineIntensity = 0.25;
      } else if (this.profile === 'v12_na_screamer') {
        idleFreq = 62;
        spanFreq = 340;
        subRatio = 0.5;
        order2Ratio = 1.5;
        order3Ratio = 3.0;
        hasTurbo = false;
        turboIntensity = 0.0;
        gearWhineIntensity = 0.35;
      } else if (this.profile === 'flat6_gt3_na' || this.profile === 'f1_hybrid') {
        idleFreq = 56;
        spanFreq = 315;
        subRatio = 0.5;
        order2Ratio = 1.5;
        order3Ratio = 2.5;
        hasTurbo = this.profile === 'f1_hybrid';
        turboIntensity = 0.55;
        gearWhineIntensity = 0.65; // Prominent straight-cut GT3 RS / F1 gearbox whine!
      } else if (this.profile === 'i6_big_turbo' || this.profile === '2jz_turbo') {
        idleFreq = 48;
        spanFreq = 235;
        subRatio = 0.5;
        order2Ratio = 1.5;
        order3Ratio = 3.0;
        hasTurbo = true;
        turboIntensity = 1.55; // Iconic loud 2JZ/RB26 big single turbo spool!
        gearWhineIntensity = 0.30;
      } else {
        // v8_flatplane_tt / v8_scream (Jesko Absolut / SF90)
        idleFreq = 54;
        spanFreq = 265;
        subRatio = 0.5;
        order2Ratio = 2.0;
        order3Ratio = 3.5;
        hasTurbo = true;
        turboIntensity = 1.25;
        gearWhineIntensity = 0.45;
      }

      // Add organic combustion cylinder-to-cylinder micro-jitter (+ cam lope at idle!)
      const idleLope = clampedRpm < 0.22
        ? Math.sin(now * 26) * (0.22 - clampedRpm) * 14
        : 0;
      const combustionJitter = (Math.random() - 0.5) * (1.2 + clampedRpm * 3.5);
      const fundFreq = idleFreq + Math.pow(clampedRpm, 1.08) * spanFreq + idleLope + combustionJitter;

      this.oscFund.frequency.setTargetAtTime(fundFreq, now, 0.018);
      this.oscSub.frequency.setTargetAtTime(fundFreq * subRatio, now, 0.022);
      this.oscOrder2.frequency.setTargetAtTime(fundFreq * order2Ratio, now, 0.018);
      this.oscOrder3.frequency.setTargetAtTime(fundFreq * order3Ratio, now, 0.018);

      // Combustion turbulence tracks firing frequency
      this.combustionNoiseFilter.frequency.setTargetAtTime(fundFreq * 2.2 + throttle * 450, now, 0.03);
      this.combustionNoiseGain.gain.setTargetAtTime(0.10 + throttle * 0.16 + clampedRpm * 0.10, now, 0.03);

      // Dynamic intake/exhaust filter opens dramatically under load & high RPM
      const filterCutoff = 380 + Math.pow(clampedRpm, 1.3) * 2800 + throttle * 1650 + (isBoosting ? 900 : 0);
      this.intakeFilter.frequency.setTargetAtTime(filterCutoff, now, 0.025);
      this.throatFormant.frequency.setTargetAtTime(750 + clampedRpm * 950, now, 0.03);

      // Gear change detection -> DCT ignition cut + Turbo Blow-Off / Flutter + Exhaust Pop
      if (gear !== this.lastGear) {
        if (typeof gear === 'number' && typeof this.lastGear === 'number') {
          if (gear > this.lastGear && clampedRpm > 0.45) {
            // Crisp upshift ignition cut (65ms torque/sound cut + exhaust bark)
            this.shiftCutEndTime = now + 0.065;
            if (hasTurbo && this.turboBoostPressure > 0.25) {
              this.playTurboFlutterAndBOV(this.turboBoostPressure * turboIntensity);
            }
            this.playExhaustPop(0.85);
          } else if (gear < this.lastGear && speedMph > 25) {
            // Downshift rev-match bark & overrun crackle
            this.playExhaustPop(0.65);
          }
        }
        this.lastGear = gear;
      }

      // Trigger Turbo Flutter ("Stututu") when lifting off full throttle at high boost!
      if (hasTurbo && this.lastThrottle > 0.65 && throttle < 0.15 && this.turboBoostPressure > 0.45) {
        this.playTurboFlutterAndBOV(this.turboBoostPressure * turboIntensity * 1.15);
        this.turboBoostPressure *= 0.3;
      }

      // Trigger Exhaust Overrun Pops & Bangs (Decel Burble) when coasting down from high RPM
      if (throttle < 0.12 && clampedRpm > 0.52 && speedMph > 35) {
        if (now - this.lastPopTime > 0.09 + Math.random() * 0.16) {
          this.playExhaustPop(0.35 + Math.random() * 0.45);
          this.lastPopTime = now;
        }
      }
      this.lastThrottle = throttle;

      // Engine volume with brief DCT shift cut dip
      const inShiftCut = now < this.shiftCutEndTime;
      const baseEngineVol = this.muted
        ? 0
        : inShiftCut
        ? 0.04
        : (0.18 + throttle * 0.16 + clampedRpm * 0.12);
      this.engineBus.gain.setTargetAtTime(baseEngineVol, now, inShiftCut ? 0.008 : 0.028);

      // Update Turbocharger Boost Pressure & Compressor Whistle
      if (hasTurbo && !this.muted) {
        const targetBoost = (throttle > 0.25 && clampedRpm > 0.32)
          ? Math.min(1.0, (clampedRpm - 0.25) * 1.35 * throttle + (isBoosting ? 0.35 : 0))
          : 0;
        const spoolRate = targetBoost > this.turboBoostPressure ? 0.08 : 0.04;
        this.turboBoostPressure += (targetBoost - this.turboBoostPressure) * spoolRate;

        const whistleFreq = 2100 + this.turboBoostPressure * 3400 + (isBoosting ? 650 : 0);
        const whistleGain = this.turboBoostPressure * 0.032 * turboIntensity;
        const airGain = this.turboBoostPressure * 0.065 * turboIntensity;

        this.turboWhistleOsc.frequency.setTargetAtTime(whistleFreq, now, 0.03);
        this.turboWhistleGain.gain.setTargetAtTime(whistleGain, now, 0.03);
        this.turboAirFilter.frequency.setTargetAtTime(1400 + this.turboBoostPressure * 1800, now, 0.04);
        this.turboAirGain.gain.setTargetAtTime(airGain, now, 0.04);
      } else {
        this.turboBoostPressure = 0;
        this.turboWhistleGain.gain.setTargetAtTime(0, now, 0.03);
        this.turboAirGain.gain.setTargetAtTime(0, now, 0.03);
      }

      // Update Straight-Cut Gearbox Whine (scales with road speed & load)
      if (!this.muted && speedMph > 8) {
        const whineFreq = 320 + speedMph * 5.8 + clampedRpm * 240;
        const whineVol = Math.min(0.045, (speedMph / 220) * 0.035 * gearWhineIntensity * (0.5 + throttle * 0.5));
        this.gearWhineOsc.frequency.setTargetAtTime(whineFreq, now, 0.03);
        this.gearWhineGain.gain.setTargetAtTime(whineVol, now, 0.04);
      } else {
        this.gearWhineGain.gain.setTargetAtTime(0, now, 0.04);
      }

      // Dual-Band Tire Scrub & High-Slip Tire Squeal
      const isTarmac = surfaceType === 'TARMAC';
      if (!this.muted && speedMph > 10 && slipAmount > 0.10) {
        const scrubLevel = Math.min(0.18, (slipAmount - 0.10) * (isTarmac ? 0.28 : 0.14));
        const screechLevel = slipAmount > 0.24
          ? Math.min(0.16, (slipAmount - 0.24) * (isTarmac ? 0.26 : 0.08))
          : 0;
        this.tireScrubGain.gain.setTargetAtTime(scrubLevel, now, 0.04);
        this.tireScrubFilter.frequency.setTargetAtTime(340 + Math.min(300, speedMph * 1.8), now, 0.04);
        this.screechGain.gain.setTargetAtTime(screechLevel, now, 0.04);
        this.screechFilter.frequency.setTargetAtTime(1150 + Math.min(650, speedMph * 3.2), now, 0.04);
      } else {
        this.tireScrubGain.gain.setTargetAtTime(0, now, 0.05);
        this.screechGain.gain.setTargetAtTime(0, now, 0.05);
      }

      // Off-road Gravel & Dirt Chassis Rumble
      const isOffroad = surfaceType !== 'TARMAC' && surfaceType !== 'AIR';
      const rumbleLevel = (!this.muted && isOffroad && speedMph > 4)
        ? Math.min(0.24, (speedMph / 110) * 0.22)
        : 0;
      this.rumbleGain.gain.setTargetAtTime(rumbleLevel, now, 0.05);

      // High-Speed Aerodynamic Wind & Tire Rolling Rush
      const windLevel = (!this.muted && speedMph > 20)
        ? Math.min(0.16, Math.pow(speedMph / 260, 1.5) * 0.15)
        : 0;
      this.windFilter.frequency.setTargetAtTime(220 + Math.min(750, speedMph * 2.4), now, 0.05);
      this.windGain.gain.setTargetAtTime(windLevel, now, 0.05);
    }

    /* ----------------------------------------------------------------------
       REALISTIC TURBO WASTEGATE & COMPRESSOR SURGE FLUTTER ("STUTUTU" / "PSSSHH")
       (Uses resonant band-passed noise envelope instead of a fake sine wave!)
       ---------------------------------------------------------------------- */
    playTurboFlutterAndBOV(intensity) {
      if (!this.initialized || this.muted || !this.noiseBuffer) return;
      const now = this.ctx.currentTime;
      const dur = 0.28;

      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;
      noiseSrc.loop = true;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2600, now);
      bp.frequency.exponentialRampToValueAtTime(1100, now + dur);
      bp.Q.value = 5.5;

      const gain = this.ctx.createGain();
      const peak = Math.min(0.18, 0.08 * intensity);

      // If Inline-6 Big Turbo (`i6_big_turbo` / `2jz_turbo`), create rapid compressor surge flutter ("stututu")!
      if (this.profile === 'i6_big_turbo' || this.profile === '2jz_turbo') {
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.02);
        gain.gain.linearRampToValueAtTime(peak * 0.25, now + 0.065);
        gain.gain.linearRampToValueAtTime(peak * 0.80, now + 0.10);
        gain.gain.linearRampToValueAtTime(peak * 0.20, now + 0.145);
        gain.gain.linearRampToValueAtTime(peak * 0.55, now + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + dur + 0.06);
      } else {
        // Pneumatic wastegate blow-off ("pssshh")
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      }

      noiseSrc.connect(bp);
      bp.connect(gain);
      gain.connect(this.masterGain);

      noiseSrc.start(now);
      noiseSrc.stop(now + dur + 0.08);
    }

    /* ----------------------------------------------------------------------
       EXHAUST OVERRUN POP / BACKFIRE CRACKLE THROUGH MUFFLER RESONATOR
       ---------------------------------------------------------------------- */
    playExhaustPop(intensity) {
      if (!this.initialized || this.muted || !this.noiseBuffer) return;
      const now = this.ctx.currentTime;
      const dur = 0.065;

      // 1. High-pressure exhaust crackle burst
      const popSrc = this.ctx.createBufferSource();
      popSrc.buffer = this.noiseBuffer;

      const popFilter = this.ctx.createBiquadFilter();
      popFilter.type = 'bandpass';
      popFilter.frequency.value = 260 + Math.random() * 280;
      popFilter.Q.value = 1.6;

      const popGain = this.ctx.createGain();
      const vol = Math.min(0.26, 0.14 * intensity);
      popGain.gain.setValueAtTime(vol, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      popSrc.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(this.exhaustSaturation);

      popSrc.start(now);
      popSrc.stop(now + dur + 0.01);
    }
  }

  window.HorizonAudio = new PureDrivingAudio();
})();
