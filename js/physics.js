/* ==========================================================================
   HIGHWAY PLAYER PHYSICS — 3 TRANSMISSIONS, CLUTCH, TURBO & PLANTED STEERING
   - Curvilinear (s, d) motion relative to highway centerline
   - 3 Transmission Systems: AUTO, SEMI (Q Up / E Down), MANUAL (L-Shift Clutch + Q/E)
   - Turbocharger boost spool & blow-off valve events
   - Weather grip physics: Dry, Rain (wet), and Snow stopping/steering feel
   - Fair AABB traffic collisions + Clean Pass detection
   ========================================================================== */

(function (root) {
  'use strict';

  const VehiclesMod =
    typeof window !== 'undefined' && window.HighwayVehicles
      ? window.HighwayVehicles
      : typeof require === 'function'
      ? require('./vehicles.js')
      : null;

  const TRANSMISSION_MODES = ['AUTO', 'SEMI', 'MANUAL'];
  const IDLE_RPM_NORM = 820 / 7000;
  const MAX_REVERSE_MS = 22 / 3.6;
  const BARRIER_MIN_D = -8.55;
  const BARRIER_MAX_D = 9.55;
  const SHOULDER_LEFT_D = -7.40;
  const SHOULDER_RIGHT_D = 7.40;

  const GEAR_RATIOS_BY_COUNT = {
    6: [0.22, 0.37, 0.54, 0.72, 0.88, 1.04],
    7: [0.19, 0.32, 0.46, 0.61, 0.75, 0.89, 1.04],
    8: [0.17, 0.28, 0.40, 0.53, 0.66, 0.78, 0.90, 1.04]
  };

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  class HighwayPlayer {
    constructor(options) {
      const opts = options || {};
      this.getCurvature = opts.getCurvature || (() => 0);
      this.transmissionMode = opts.transmissionMode || 'AUTO';

      // Default specs (Civic Touring baseline; overridden cleanly by applyCarSpecs)
      this.carId = 'starter_hatch';
      this.archetype = 'hatchback';
      this.length = 4.10;
      this.width = 1.78;
      this.maxSpeedMs = 235 / 3.6;
      this.accelPower = 6.1;
      this.brakePower = 15.2;
      this.brakeWeatherBonus = 1.0;
      this.gripMult = 1.0;
      this.weatherGripMult = 1.0;
      this.gearCount = 6;
      this.shiftTimeMult = 1.0;
      this.damageResist = 1.0;
      this.engineTone = 'i4';
      this.turboLevel = 0.55;

      if (opts.specs) {
        this.applyCarSpecs(opts.specs);
      }

      this.reset();
    }

    applyCarSpecs(specs) {
      if (!specs) return;
      this.carId = specs.carId || this.carId;
      this.archetype = specs.archetype || this.archetype;
      const arch = VehiclesMod && VehiclesMod.ARCHETYPES && VehiclesMod.ARCHETYPES[this.archetype];
      this.length = arch ? arch.length : specs.length || 4.58;
      this.width = arch ? arch.width : specs.width || 1.88;

      this.maxSpeedMs = specs.maxSpeedMs || (specs.topSpeedKmh ? specs.topSpeedKmh / 3.6 : 235 / 3.6);
      this.accelPower = specs.accelPower || 6.1;
      this.brakePower = specs.brakePower || 15.2;
      this.brakeWeatherBonus = specs.brakeWeatherBonus || 1.0;
      this.gripMult = specs.gripMult || 1.0;
      this.weatherGripMult = specs.weatherGripMult || 1.0;
      this.gearCount = specs.gearCount || 6;
      this.shiftTimeMult = specs.shiftTimeMult || 1.0;
      this.damageResist = specs.damageResist || 1.0;
      this.engineTone = specs.engineTone || 'i4';
      this.turboLevel = specs.turboLevel || 0.7;

      if (this.gear > this.gearCount) {
        this.gear = this.gearCount;
      }
    }

    setTransmissionMode(mode) {
      if (!TRANSMISSION_MODES.includes(mode)) return false;
      this.transmissionMode = mode;
      this.shiftTimer = 0;
      this.shiftCutTimer = 0;
      this.shiftKickTimer = 0;
      this.pendingSitBack = false;
      this.pendingClutchBite = false;
      this.clutchPressed = false;
      this._prevClutch = false;
      if ((mode === 'MANUAL' || mode === 'SEMI') && this.gear <= 0 && this.speed >= -0.2) {
        this.gear = 1;
      }
      return true;
    }

    reset() {
      this.s = 0;
      this.d = 1.85; // Start centered in Lane 2
      this.speed = 0;
      this.accel = 0;
      this.steer = 0;
      this.yawRel = 0;
      this.pitch = 0;
      this.roll = 0;

      this.gear = 1; // -1 = R, 0 = N, 1..gearCount
      this.rpm = 820;
      this.rpmNorm = IDLE_RPM_NORM;
      this.shiftTimer = 0;
      this.shiftCutTimer = 0;
      this.shiftKickTimer = 0;
      this.shiftKickMag = 0;
      this.shiftDir = 0;
      this.pendingSitBack = false;
      this.pendingClutchBite = false;
      this.clutchPressed = false;
      this._prevClutch = false;
      this.rpmBlipTimer = 0;
      this.paddleAnimTimer = 0;
      this.paddleAnimDir = 0;
      this.shiftPitchSpring = 0;
      this.shiftPitchVel = 0;
      this.camSurgeZ = 0;

      this.turboBoost = 0;
      this._prevThrottle = 0;
      this.bovCooldown = 0;
      this._pendingShiftEvent = null;

      this.hitRevLimiter = false;
      this.shiftPrompt = 0; // -1 downshift, 0 none, +1 upshift

      this.braking = false;
      this.onShoulder = false;

      this.distanceMeters = 0;
      this.elapsedSeconds = 0;
      this.topSpeedKmh = 0;
      this.damage = 0;
      this.collisionCount = 0;
      this.crashed = false;
      this.barrierCooldown = 0;
      this.lastCrashReason = '';
    }

    get speedKmh() {
      return Math.abs(this.speed) * 3.6;
    }

    get speedMph() {
      return Math.abs(this.speed) * 2.23694;
    }

    getLaneIndex() {
      if (this.d < -3.7) return 0;
      if (this.d < 0.0) return 1;
      if (this.d < 3.7) return 2;
      return 3;
    }

    getGearTopSpeedMs(gear) {
      const table = GEAR_RATIOS_BY_COUNT[this.gearCount] || GEAR_RATIOS_BY_COUNT[6];
      const idx = clamp((gear || 1) - 1, 0, table.length - 1);
      return this.maxSpeedMs * table[idx];
    }

    getGearDisplay() {
      if (this.gear === -1) return 'R';
      if (this.gear === 0) return 'N';
      if (this.transmissionMode === 'SEMI') return `S${this.gear}`;
      if (this.transmissionMode === 'MANUAL') return `M${this.gear}`;
      return `D${this.gear}`;
    }

    triggerShift(fromGear, toGear, throttle, withClutch) {
      const dir = toGear > fromGear ? 1 : -1;
      const mode = this.transmissionMode;
      const cutDur =
        mode === 'SEMI'
          ? 0.065 * this.shiftTimeMult
          : mode === 'MANUAL'
          ? 0.125 * this.shiftTimeMult
          : 0.15 * this.shiftTimeMult;

      this.shiftTimer = cutDur;
      this.shiftCutTimer = cutDur;
      this.shiftDir = dir;
      this.paddleAnimTimer = 0.18;
      this.paddleAnimDir = dir;

      if (dir > 0) {
        if (mode === 'MANUAL' && withClutch) {
          this.pendingClutchBite = toGear >= 1;
          this.pendingSitBack = false;
        } else {
          this.pendingSitBack = (throttle || 0) > 0.25 && toGear >= 1;
          this.pendingClutchBite = false;
        }
        this.shiftKickTimer = 0;
      } else {
        this.pendingSitBack = false;
        this.pendingClutchBite = false;
        this.rpmBlipTimer = 0.16;
        this.shiftPitchVel -= 0.15;
      }

      return { type: 'shift', fromGear, toGear, mode, dir };
    }

    shiftUp(clutchHeld) {
      if (this.crashed) return false;
      if (this.transmissionMode !== 'SEMI' && this.transmissionMode !== 'MANUAL') return false;
      const hasClutch = clutchHeld !== undefined ? !!clutchHeld : this.clutchPressed;
      if (this.transmissionMode === 'MANUAL' && !hasClutch) {
        this._pendingShiftEvent = { type: 'shift_grind' };
        return false;
      }
      if (this.gear >= this.gearCount) return false;

      const from = this.gear;
      if (this.gear === -1) {
        if (this.speed > -0.5) this.gear = this.transmissionMode === 'MANUAL' ? 0 : 1;
        else return false;
      } else {
        this.gear += 1;
      }
      this._pendingShiftEvent = this.triggerShift(
        from,
        this.gear,
        this._lastThrottle || 0,
        hasClutch
      );
      return true;
    }

    shiftDown(clutchHeld) {
      if (this.crashed) return false;
      if (this.transmissionMode !== 'SEMI' && this.transmissionMode !== 'MANUAL') return false;
      const hasClutch = clutchHeld !== undefined ? !!clutchHeld : this.clutchPressed;
      if (this.transmissionMode === 'MANUAL' && !hasClutch) {
        this._pendingShiftEvent = { type: 'shift_grind' };
        return false;
      }

      const from = this.gear;
      if (this.gear > 1) {
        this.gear -= 1;
      } else if (this.gear === 1 && this.speed < 2.2) {
        this.gear = 0;
      } else if (this.gear === 0 && this.speed < 0.8) {
        this.gear = -1;
      } else {
        return false;
      }
      this._pendingShiftEvent = this.triggerShift(
        from,
        this.gear,
        this._lastThrottle || 0,
        hasClutch
      );
      return true;
    }

    /**
     * Update transmission state, clutch engagement, 3-phase shift feel, turbo boost & RPM.
     */
    updateTransmission(throttle, brake, clutch, dt, events) {
      this._lastThrottle = throttle;
      this.bovCooldown = Math.max(0, this.bovCooldown - dt);

      let upshiftedThisTick = false;
      if (this._pendingShiftEvent) {
        if (this._pendingShiftEvent.type === 'shift' && this._pendingShiftEvent.dir > 0) {
          upshiftedThisTick = true;
        }
        events.push(this._pendingShiftEvent);
        this._pendingShiftEvent = null;
      }

      const mode = this.transmissionMode;
      const clutchNow = mode === 'MANUAL' && !!clutch;
      const clutchJustPressed = clutchNow && !this._prevClutch;
      const clutchJustReleased = !clutchNow && this._prevClutch;
      this.clutchPressed = clutchNow;

      if (this.paddleAnimTimer > 0) {
        this.paddleAnimTimer = Math.max(0, this.paddleAnimTimer - dt);
      }
      if (this.rpmBlipTimer > 0) {
        this.rpmBlipTimer = Math.max(0, this.rpmBlipTimer - dt);
      }

      if (this.shiftCutTimer > 0) {
        this.shiftCutTimer = Math.max(0, this.shiftCutTimer - dt);
        this.shiftTimer = this.shiftCutTimer;
        if (this.shiftCutTimer === 0 && this.pendingSitBack) {
          this.pendingSitBack = false;
          if (throttle > 0.25 && !clutchNow) {
            const modeScale = mode === 'SEMI' ? 1.08 : 0.78;
            this.shiftKickTimer = 0.34;
            this.shiftKickMag = modeScale * clamp(throttle, 0.4, 1.0);
            this.shiftPitchVel += 0.58 * this.shiftKickMag;
          }
        }
      } else {
        this.shiftTimer = 0;
      }

      if (clutchJustReleased) {
        if (this.gear >= 1 && this.pendingClutchBite && throttle > 0.22) {
          this.shiftKickTimer = 0.36;
          this.shiftKickMag = 1.24 * clamp(throttle, 0.45, 1.0);
          this.shiftPitchVel += 0.65 * this.shiftKickMag;
        }
        this.pendingClutchBite = false;
      } else if (!clutchNow && this.pendingClutchBite && this.shiftCutTimer === 0) {
        if (this.gear >= 1 && throttle > 0.22) {
          this.shiftKickTimer = 0.36;
          this.shiftKickMag = 1.24 * clamp(throttle, 0.45, 1.0);
          this.shiftPitchVel += 0.65 * this.shiftKickMag;
        }
        this.pendingClutchBite = false;
      }

      if (this.shiftKickTimer > 0) {
        this.shiftKickTimer = Math.max(0, this.shiftKickTimer - dt);
      }

      this.hitRevLimiter = false;
      this.shiftPrompt = 0;

      let torqueMult = 1.0;

      if (this.gear === -1 && !clutchNow) {
        const revFrac = clamp(Math.abs(this.speed) / MAX_REVERSE_MS, 0, 1);
        const targetNorm = clamp(IDLE_RPM_NORM + revFrac * 0.65, IDLE_RPM_NORM, 0.85);
        this.rpmNorm += (targetNorm - this.rpmNorm) * Math.min(1, 10 * dt);
        this.rpm = clamp(this.rpmNorm, IDLE_RPM_NORM, 1.03) * 7000;
        this.turboBoost = Math.max(0, this.turboBoost - 4.6 * dt);
        this._prevClutch = clutchNow;
        this._prevThrottle = throttle;
        return 1.0;
      }

      if (this.gear === 0 || clutchNow) {
        // Disconnected drivetrain (Neutral or Clutch depressed): engine free-revs cleanly
        const targetNorm = clamp(IDLE_RPM_NORM + throttle * (0.96 - IDLE_RPM_NORM), IDLE_RPM_NORM, 0.96);
        this.rpmNorm += (targetNorm - this.rpmNorm) * Math.min(1, 9.0 * dt);
        this.rpm = clamp(this.rpmNorm, IDLE_RPM_NORM, 1.03) * 7000;
        torqueMult = 0;
      } else {
        const vPos = Math.max(0, this.speed);
        const gTop = this.getGearTopSpeedMs(this.gear);
        let rawNorm = clamp(IDLE_RPM_NORM + (vPos / Math.max(4, gTop)) * (1.0 - IDLE_RPM_NORM), IDLE_RPM_NORM, 1.04);

        if (mode === 'AUTO' && this.shiftCutTimer <= 0) {
          const upThresh = 0.66 + throttle * 0.25;
          const downThresh = brake > 0.1 ? 0.46 : 0.35;

          if (rawNorm > upThresh && this.gear < this.gearCount && throttle > 0.05) {
            const from = this.gear;
            this.gear += 1;
            events.push(this.triggerShift(from, this.gear, throttle, false));
            upshiftedThisTick = true;
            rawNorm = clamp(
              IDLE_RPM_NORM + (vPos / Math.max(4, this.getGearTopSpeedMs(this.gear))) * (1.0 - IDLE_RPM_NORM),
              IDLE_RPM_NORM,
              1.0
            );
          } else if (rawNorm < downThresh && this.gear > 1) {
            const prevTop = this.getGearTopSpeedMs(this.gear - 1);
            const projected = IDLE_RPM_NORM + (vPos / Math.max(4, prevTop)) * (1.0 - IDLE_RPM_NORM);
            if (projected < 0.88) {
              const from = this.gear;
              this.gear -= 1;
              events.push(this.triggerShift(from, this.gear, throttle, false));
              rawNorm = projected;
            }
          }
        }

        if (this.rpmBlipTimer > 0) {
          rawNorm = Math.min(0.95, rawNorm + 0.14 * (this.rpmBlipTimer / 0.16));
        }

        const rpmSmoothRate = this.shiftCutTimer > 0 ? 11.5 : 15.0;
        this.rpmNorm += (rawNorm - this.rpmNorm) * Math.min(1, rpmSmoothRate * dt);

        if (mode === 'SEMI' || mode === 'MANUAL') {
          if (rawNorm > 0.90 && this.gear < this.gearCount) this.shiftPrompt = 1;
          else if (rawNorm < 0.28 && this.gear > 1 && vPos > 6) this.shiftPrompt = -1;

          if (rawNorm >= 0.985 && throttle > 0.1) {
            this.hitRevLimiter = true;
            this.rpmNorm = clamp(0.97 + Math.sin(this.elapsedSeconds * 58) * 0.025, 0.92, 1.02);
          }
        }

        this.rpm = clamp(this.rpmNorm, IDLE_RPM_NORM, 1.03) * 7000;

        if (this.hitRevLimiter) {
          torqueMult = 0.02;
        } else if (this.shiftCutTimer > 0) {
          torqueMult = mode === 'SEMI' ? 0.22 : 0.06;
        } else {
          const kickBoost =
            this.shiftKickTimer > 0
              ? 1 + 0.18 * (this.shiftKickTimer / 0.34) * this.shiftKickMag
              : 1.0;

          const gearMult = 1.15 - ((this.gear - 1) / Math.max(1, this.gearCount - 1)) * 0.22;
          let bandMult = 1.0;
          if (rawNorm < 0.28) {
            bandMult = 0.72 + (rawNorm / 0.28) * 0.28;
          } else if (rawNorm <= 0.88) {
            bandMult = 1.0 + Math.sin(((rawNorm - 0.28) / 0.60) * Math.PI) * 0.16;
          } else {
            bandMult = 1.0 - (rawNorm - 0.88) * 1.1;
          }
          torqueMult = gearMult * bandMult * kickBoost;
        }
      }

      // Turbocharger spool & blow-off valve vents
      const sharpLift = this._prevThrottle > 0.42 && throttle < 0.12 && this.turboBoost > 0.32;
      const clutchVent = clutchJustPressed && this.turboBoost > 0.34;
      const upshiftVent = upshiftedThisTick && this.turboBoost > 0.34;

      if ((sharpLift || clutchVent || upshiftVent) && this.bovCooldown <= 0) {
        events.push({ type: 'turbo_bov', boost: this.turboBoost });
        this.turboBoost *= 0.22;
        this.bovCooldown = 0.28;
      } else if (!clutchNow && this.gear > 0 && throttle > 0.25 && this.rpm > 2000 && !this.hitRevLimiter && this.shiftCutTimer <= 0) {
        const targetBoost = clamp(((this.rpm - 1850) / 3700) * throttle, 0, 1);
        const spoolRate = targetBoost > this.turboBoost ? 2.6 : 4.2;
        this.turboBoost += (targetBoost - this.turboBoost) * Math.min(1, spoolRate * dt);
      } else if (clutchNow && throttle > 0.25 && this.rpm > 2000) {
        const freeBoost = clamp(((this.rpm - 1900) / 4200) * throttle * 0.45, 0, 0.45);
        this.turboBoost += (freeBoost - this.turboBoost) * Math.min(1, 2.2 * dt);
      } else {
        this.turboBoost = Math.max(0, this.turboBoost - 4.6 * dt);
      }

      this._prevClutch = clutchNow;
      this._prevThrottle = throttle;
      return torqueMult;
    }

    step(dt, input, traffic, weatherGrip) {
      const events = [];
      if (!dt || dt <= 0) return events;
      const clampedDt = Math.min(dt, 0.05);

      if (this.barrierCooldown > 0) {
        this.barrierCooldown = Math.max(0, this.barrierCooldown - clampedDt);
      }

      if (this.crashed) {
        this.speed *= Math.max(0, 1 - 5.5 * clampedDt);
        if (Math.abs(this.speed) < 0.05) this.speed = 0;
        this.braking = true;
        this.steer *= Math.max(0, 1 - 6 * clampedDt);
        this.pitch *= Math.max(0, 1 - 7 * clampedDt);
        this.roll *= Math.max(0, 1 - 7 * clampedDt);
        this.s += this.speed * Math.cos(this.yawRel) * clampedDt;
        this.updateTransmission(0, 1, false, clampedDt, events);
        return events;
      }

      this.elapsedSeconds += clampedDt;

      const inp = input || {};
      const throttle = clamp(inp.throttle || 0, 0, 1);
      const brake = clamp(inp.brake || 0, 0, 1);
      const clutch = !!inp.clutch;
      const steerDir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);

      // Effective surface grip combining weather + car all-weather rating + tire upgrades
      const baseWeatherGrip = weatherGrip !== undefined ? weatherGrip : 1.0;
      const effectiveGrip = clamp(baseWeatherGrip * this.weatherGripMult, 0.48, 1.05);

      // Handle Auto R <-> 1 transitions cleanly when stopped
      if (this.transmissionMode === 'AUTO') {
        if (brake > 0.05 && this.speed <= 0.35) {
          this.gear = -1;
        } else if (throttle > 0.05 && this.gear === -1 && this.speed >= -0.4) {
          this.gear = 1;
        }
      }

      const torqueMult = this.updateTransmission(throttle, brake, clutch, clampedDt, events);

      // 1. Longitudinal Acceleration / Braking / Aero Drag
      const v = this.speed;
      let targetAccel = 0;
      this.braking = false;

      const effAero = Math.max(0.00018, (this.accelPower * 0.36 - 0.18) / (this.maxSpeedMs * this.maxSpeedMs));

      if (brake > 0.05) {
        if (v > 0.45) {
          const brakeGripScale = (0.54 + 0.46 * effectiveGrip) * this.brakeWeatherBonus;
          targetAccel = -this.brakePower * clamp(brakeGripScale, 0.55, 1.15) * brake;
          this.braking = true;
        } else if (this.clutchPressed || this.gear === 0) {
          targetAccel = -(10.0 * brake);
          this.braking = true;
        } else if (this.gear === -1 || this.transmissionMode === 'AUTO') {
          const revFrac = clamp(1 - Math.abs(v) / MAX_REVERSE_MS, 0, 1);
          targetAccel = -4.6 * brake * revFrac;
        } else {
          targetAccel = -(10.0 * brake);
          this.braking = true;
        }
      } else if (this.gear === 0 || this.clutchPressed) {
        if (v > 0.05) {
          targetAccel = -(0.35 + effAero * v * v);
        } else if (v < -0.05) {
          targetAccel = 1.8;
        } else {
          targetAccel = 0;
        }
      } else if (throttle > 0.05) {
        if (this.gear === -1) {
          targetAccel = v < -0.1 ? 12.0 * throttle : 0;
        } else if (v < 0) {
          targetAccel = 14.0 * throttle;
        } else {
          const speedFrac = clamp(v / this.maxSpeedMs, 0, 1);
          const driveCurve = this.accelPower * (1 - 0.48 * Math.pow(speedFrac, 1.35)) * torqueMult;
          const tractionCap = clamp(0.66 + 0.34 * effectiveGrip, 0.72, 1.0);
          const drag = effAero * v * v + 0.22;
          targetAccel = driveCurve * tractionCap * throttle - drag;
        }
      } else {
        if (v > 0.05) {
          targetAccel = -(0.42 + effAero * v * v);
        } else if (v < -0.05) {
          targetAccel = 1.8;
        } else {
          targetAccel = 0;
          this.speed = 0;
        }
      }

      this.accel = targetAccel;
      const forwardCap =
        (this.transmissionMode === 'MANUAL' || this.transmissionMode === 'SEMI') && this.gear > 0
          ? Math.min(this.maxSpeedMs, this.getGearTopSpeedMs(this.gear))
          : this.maxSpeedMs;
      this.speed = clamp(this.speed + targetAccel * clampedDt, -MAX_REVERSE_MS, forwardCap);
      if (Math.abs(this.speed) < 0.04 && throttle === 0 && brake === 0) {
        this.speed = 0;
      }

      // 2. Planted Speed-Adaptive Steering (lateral-velocity capped with progressive turn-in)
      const absV = Math.abs(this.speed);
      const speedNorm = clamp(absV / this.maxSpeedMs, 0, 1);
      const isReversingSteer = steerDir !== 0 && steerDir * this.steer < 0;
      const turnInRate = lerp(6.2, 4.0, speedNorm);
      const counterRate = lerp(13.5, 10.5, speedNorm);
      const centerRate = lerp(11.0, 9.0, speedNorm);
      const steerRamp = steerDir === 0 ? centerRate : isReversingSteer ? counterRate : turnInRate;
      this.steer += (steerDir - this.steer) * Math.min(1, steerRamp * clampedDt);
      if (steerDir === 0 && Math.abs(this.steer) < 0.005) this.steer = 0;

      const shapedSteer = Math.sign(this.steer) * Math.pow(Math.abs(this.steer), 1.32);
      const latGripScale = clamp(effectiveGrip * this.gripMult, 0.50, 1.25);
      const maxLatSpeed =
        lerp(5.4, 7.2, clamp((absV - 18) / 72, 0, 1)) *
        clamp(0.78 + 0.22 * latGripScale, 0.76, 1.14);
      const maxYawForSpeed = Math.min(
        0.30,
        Math.asin(clamp(maxLatSpeed / Math.max(absV, 8.0), 0, 0.30))
      );
      const revSign = this.speed >= -0.05 ? 1 : -1;
      const targetYaw = shapedSteer * maxYawForSpeed * revSign;

      const authority = clamp(absV / 3.5, 0, 1);
      const gripResponse = clamp(0.58 + 0.42 * effectiveGrip, 0.65, 1.08);
      const yawRate = (steerDir !== 0 ? 7.2 : 11.2) * gripResponse;
      this.yawRel += (targetYaw - this.yawRel) * Math.min(1, yawRate * authority * clampedDt);
      if (steerDir === 0 && Math.abs(this.yawRel) < 0.001) this.yawRel = 0;

      // 3. Advance Curvilinear Position
      const ds = this.speed * Math.cos(this.yawRel) * clampedDt;
      const dd = this.speed * Math.sin(this.yawRel) * clampedDt;
      this.s += ds;
      this.d += dd;

      if (ds > 0) this.distanceMeters += ds;
      if (this.speedKmh > this.topSpeedKmh) this.topSpeedKmh = this.speedKmh;
      this.onShoulder = this.d < SHOULDER_LEFT_D || this.d > SHOULDER_RIGHT_D;

      // 4. Visual Pitch, 3-Phase Shift Squat & Longitudinal Surge Inertia
      const shiftCutUnload = this.shiftCutTimer > 0 && this.shiftDir > 0 ? -0.014 : 0;
      const springAccel = -88 * this.shiftPitchSpring - 12 * this.shiftPitchVel;
      this.shiftPitchVel += springAccel * clampedDt;
      this.shiftPitchSpring = clamp(this.shiftPitchSpring + this.shiftPitchVel * clampedDt, -0.045, 0.058);

      const kickFrac = this.shiftKickTimer > 0 ? this.shiftKickTimer / 0.34 : 0;
      const targetSurge =
        this.shiftCutTimer > 0 && this.shiftDir > 0
          ? -0.06
          : kickFrac > 0
          ? 0.26 * Math.pow(kickFrac, 0.7) * this.shiftKickMag + this.accel * 0.018
          : clamp(this.accel * 0.018, -0.14, 0.16);
      this.camSurgeZ += (targetSurge - this.camSurgeZ) * Math.min(1, 14 * clampedDt);

      const basePitch = clamp(this.accel * 0.0044 + shiftCutUnload, -0.048, 0.038);
      const targetPitch = clamp(basePitch + this.shiftPitchSpring, -0.055, 0.065);
      const roadCurv = this.getCurvature(this.s);
      const curveLatForce = roadCurv * this.speed * this.speed * 0.0025;
      const steerLatForce = shapedSteer * clamp(absV / 22, 0, 1.25) * 0.025;
      const targetRoll = clamp(steerLatForce + curveLatForce, -0.045, 0.045);

      this.pitch += (targetPitch - this.pitch) * Math.min(1, 13 * clampedDt);
      this.roll += (targetRoll - this.roll) * Math.min(1, 10 * clampedDt);

      // 5. Highway Median & Guardrail Collision Clamping
      const scrapeSpeedKeep = lerp(0.91, 0.95, clamp(1 - this.damageResist, 0, 1));
      if (this.d < BARRIER_MIN_D) {
        this.d = BARRIER_MIN_D;
        if (this.yawRel < 0) this.yawRel *= 0.15;
        if (this.barrierCooldown <= 0 && this.speed > 4) {
          this.speed *= scrapeSpeedKeep;
          this.barrierCooldown = 0.35;
          this.damage = Math.min(95, this.damage + Math.max(2, Math.round(6 * this.damageResist)));
          events.push({ type: 'barrier', intensity: clamp(this.speed / 30, 0.2, 1.0) });
        }
      } else if (this.d > BARRIER_MAX_D) {
        this.d = BARRIER_MAX_D;
        if (this.yawRel > 0) this.yawRel *= 0.15;
        if (this.barrierCooldown <= 0 && this.speed > 4) {
          this.speed *= scrapeSpeedKeep;
          this.barrierCooldown = 0.35;
          this.damage = Math.min(95, this.damage + Math.max(2, Math.round(6 * this.damageResist)));
          events.push({ type: 'barrier', intensity: clamp(this.speed / 30, 0.2, 1.0) });
        }
      }

      // 6. Traffic Collisions & Clean Overtake Pass Detection
      if (traffic && traffic.vehicles) {
        const vehicles = traffic.vehicles;
        for (let i = 0; i < vehicles.length; i++) {
          const npc = vehicles[i];

          // Clean pass check when flying smoothly past an NPC in an adjacent lane
          const dsPass = this.s - npc.s;
          const ddPass = Math.abs(this.d - npc.d);
          if (
            !npc.passedByPlayer &&
            this.speed > 24 &&
            this.speed > npc.v + 4.5 &&
            Math.abs(dsPass) < 3.2 &&
            ddPass >= 1.85 &&
            ddPass <= 4.35
          ) {
            npc.passedByPlayer = true;
            events.push({
              type: 'clean_pass',
              relSpeedKmh: (this.speed - npc.v) * 3.6,
              isClose: ddPass < 3.0,
              npc
            });
          }

          if (npc.hitCooldown > 0) continue;

          const hlSum = (this.length + npc.length) * 0.5 - 0.14;
          const hwSum = (this.width + npc.width) * 0.5 - 0.12;
          const dsGap = this.s - npc.s;
          const ddGap = this.d - npc.d;

          if (Math.abs(dsGap) < hlSum && Math.abs(ddGap) < hwSum) {
            const penS = hlSum - Math.abs(dsGap);
            const penD = hwSum - Math.abs(ddGap);
            const normPenS = penS / Math.max(0.5, hlSum);
            const normPenD = penD / Math.max(0.5, hwSum);
            const relLong = Math.abs(this.speed - npc.v);
            this.collisionCount++;
            npc.passedByPlayer = true;

            if (normPenS <= normPenD) {
              const pushSign = dsGap >= 0 ? 1 : -1;
              this.s = npc.s + pushSign * (hlSum + 0.08);
              const impactMs = pushSign < 0 ? Math.max(0, this.speed - npc.v) : relLong;
              const dmgAdd = Math.round((12 + impactMs * 1.8) * this.damageResist);

              if (impactMs >= 13.5 / Math.sqrt(this.damageResist) || this.damage + dmgAdd >= 100) {
                this.damage = 100;
                this.crashed = true;
                this.lastCrashReason = 'Collision with highway traffic';
                this.speed = Math.min(this.speed * 0.22, npc.v * 0.45);
                traffic.onPlayerCollision(npc, impactMs, 0);
                events.push({ type: 'crash', intensity: 1.0, impactMs, npc });
                break;
              } else {
                this.damage = Math.min(99, this.damage + Math.max(6, dmgAdd));
                this.speed = clamp(
                  pushSign < 0 ? Math.min(this.speed, npc.v * 0.84) : Math.max(this.speed, npc.v * 1.05),
                  0,
                  this.maxSpeedMs
                );
                traffic.onPlayerCollision(npc, impactMs, 0);
                events.push({
                  type: 'minor',
                  intensity: clamp(impactMs / 11, 0.25, 0.9),
                  impactMs,
                  npc
                });
              }
            } else {
              const sideSign = ddGap >= 0 ? 1 : -1;
              this.d = clamp(npc.d + sideSign * (hwSum + 0.08), BARRIER_MIN_D, BARRIER_MAX_D);
              if (sideSign > 0 && this.yawRel < 0) this.yawRel *= 0.2;
              if (sideSign < 0 && this.yawRel > 0) this.yawRel *= 0.2;

              const latSpeed = Math.abs(this.speed * Math.sin(this.yawRel));
              const impactMs = Math.max(latSpeed, relLong * 0.45);
              this.speed *= 0.88;
              const dmgAdd = Math.round((10 + impactMs * 1.4) * this.damageResist);

              if (this.damage + dmgAdd >= 100 || impactMs >= 14.5 / Math.sqrt(this.damageResist)) {
                this.damage = 100;
                this.crashed = true;
                this.lastCrashReason = 'High-speed sideswipe collision';
                traffic.onPlayerCollision(npc, impactMs, -sideSign * 0.35);
                events.push({ type: 'crash', intensity: 1.0, impactMs, npc });
                break;
              } else {
                this.damage = Math.min(99, this.damage + Math.max(5, dmgAdd));
                traffic.onPlayerCollision(npc, impactMs, -sideSign * 0.25);
                events.push({
                  type: 'minor',
                  intensity: clamp(impactMs / 10, 0.22, 0.85),
                  impactMs,
                  npc
                });
              }
            }
          }
        }
      }

      return events;
    }
  }

  const api = {
    HighwayPlayer,
    TRANSMISSION_MODES,
    MAX_REVERSE_MS,
    BARRIER_MIN_D,
    BARRIER_MAX_D
  };

  if (typeof window !== 'undefined') {
    window.HighwayPlayer = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root && (typeof window === 'undefined' || root !== window)) {
    root.HighwayPlayer = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
