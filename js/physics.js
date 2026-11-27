/* ==========================================================================
   HIGHWAY PLAYER PHYSICS — 3 TRANSMISSIONS, CLUTCH, TURBO & PLANTED STEERING
   - Curvilinear (s, d) motion relative to highway centerline
   - 3 Transmission Systems: AUTO, SEMI (E Up / Q Down), MANUAL (L-Shift Clutch + E/Q)
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
  const SHOULDER_LEFT_D = -7.25;
  const SHOULDER_RIGHT_D = 7.25;

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
      this.getSlope = opts.getSlope || (() => 0);
      this.getRadarInfo = opts.getRadarInfo || null;
      this.getShoulderHazardInfo = opts.getShoulderHazardInfo || null;
      this.transmissionMode = opts.transmissionMode || 'AUTO';

      // Default specs (Civic Touring baseline; overridden cleanly by applyCarSpecs)
      this.carId = 'starter_hatch';
      this.archetype = 'hatchback';
      this.length = 4.10;
      this.width = 1.78;
      this.maxSpeedMs = 192 / 3.6;
      this.accelPower = 5.5;
      this.brakePower = 14.5;
      this.brakeWeatherBonus = 1.0;
      this.gripMult = 1.0;
      this.weatherGripMult = 1.0;
      this.gearCount = 6;
      this.shiftTimeMult = 1.0;
      this.damageResist = 1.0;
      this.engineTone = 'i4';
      this.turboLevel = 0.55;
      this.turboSpoolMult = 1.0;
      this.rollStiffness = 1.0;
      this.steerResponseMult = 1.0;
      this.highRpmBoost = 1.0;
      this.exhaustLevel = 0;
      this.hornType = 'standard';
      this.isBigRig = false;

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

      this.maxSpeedMs = specs.maxSpeedMs || (specs.topSpeedKmh ? specs.topSpeedKmh / 3.6 : 192 / 3.6);
      this.accelPower = specs.accelPower || 5.5;
      this.brakePower = specs.brakePower || 14.5;
      this.brakeWeatherBonus = specs.brakeWeatherBonus || 1.0;
      this.gripMult = specs.gripMult || 1.0;
      this.weatherGripMult = specs.weatherGripMult || 1.0;
      this.gearCount = specs.gearCount || 6;
      this.shiftTimeMult = specs.shiftTimeMult || 1.0;
      this.damageResist = specs.damageResist || 1.0;
      this.engineTone = specs.engineTone || 'i4';
      this.turboLevel = specs.turboLevel || 0.7;
      this.turboSpoolMult = specs.turboSpoolMult || 1.0;
      this.rollStiffness = specs.rollStiffness || 1.0;
      this.steerResponseMult = specs.steerResponseMult || 1.0;
      this.highRpmBoost = specs.highRpmBoost || 1.0;
      this.exhaustLevel = specs.exhaustLevel || 0;
      this.hornType = specs.hornType || (this.archetype === 'police' ? 'police' : 'standard');
      this.isBigRig = this.archetype === 'big_rig';

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
      this.yawRate = 0;
      this.frontWheelAngle = 0;
      this.slipAngle = 0;
      this.lateralSlip = 0;
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
      this.reverseHoldTimer = 0;
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
      this.shoulderTime = 0;

      this.distanceMeters = 0;
      this.elapsedSeconds = 0;
      this.topSpeedKmh = 0;
      this.damage = 0;
      this.collisionCount = 0;
      this.crashed = false;
      this.barrierCooldown = 0;
      this._lastRadarHitSlot = -1;
      this._lastHazardHitSlot = -1;
      this._needleCooldown = 0;
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
        this._pendingShiftEvent = { type: 'shift_grind', reason: 'no_clutch' };
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
        this._pendingShiftEvent = { type: 'shift_grind', reason: 'no_clutch' };
        return false;
      }

      const from = this.gear;
      if (this.gear > 1) {
        const prevTop = this.getGearTopSpeedMs(this.gear - 1);
        const projNorm =
          IDLE_RPM_NORM +
          (Math.max(0, this.speed) / Math.max(4, prevTop)) * (1.0 - IDLE_RPM_NORM);
        if (this.transmissionMode === 'SEMI' && projNorm > 0.96) {
          this._pendingShiftEvent = { type: 'shift_denied', reason: 'overrev' };
          return false;
        }
        if (this.transmissionMode === 'MANUAL' && projNorm > 1.12) {
          this._pendingShiftEvent = { type: 'shift_grind', reason: 'overrev' };
          return false;
        }
        this.gear -= 1;
      } else if (this.gear === 1 && this.speed < 3.0) {
        this.gear = 0;
      } else if (this.gear === 0 && this.speed < 1.2) {
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
        const revPedal = mode === 'AUTO' ? brake : throttle;
        const targetNorm = clamp(
          IDLE_RPM_NORM + Math.max(revFrac * 0.68, (revPedal || 0) * 0.52),
          IDLE_RPM_NORM,
          0.88
        );
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
        let rawNorm = clamp(IDLE_RPM_NORM + (vPos / Math.max(4, gTop)) * (1.0 - IDLE_RPM_NORM), IDLE_RPM_NORM, 1.12);

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
              1.05
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

          if (rawNorm >= 0.985 && throttle > 0.05) {
            this.hitRevLimiter = true;
            this.rpmNorm = clamp(0.97 + Math.sin(this.elapsedSeconds * 58) * 0.025, 0.92, 1.02);
          }
        }

        this.rpm = clamp(this.rpmNorm, IDLE_RPM_NORM, 1.03) * 7000;

        if (this.hitRevLimiter) {
          torqueMult = 0;
        } else if (this.shiftCutTimer > 0) {
          torqueMult = mode === 'SEMI' ? 0.22 : 0.06;
        } else {
          const kickBoost =
            this.shiftKickTimer > 0
              ? 1 + 0.18 * (this.shiftKickTimer / 0.34) * this.shiftKickMag
              : 1.0;

          const gearFrac = (this.gear - 1) / Math.max(1, this.gearCount - 1);
          const gearMult = 1.24 - gearFrac * 0.30;
          let bandMult = 1.0;
          if (rawNorm < 0.28) {
            bandMult = 0.72 + (rawNorm / 0.28) * 0.28;
          } else if (rawNorm <= 0.88) {
            bandMult = 1.0 + Math.sin(((rawNorm - 0.28) / 0.60) * Math.PI) * 0.16;
          } else {
            bandMult = Math.max(0.45, 1.0 - (rawNorm - 0.88) * 0.75);
          }
          if (rawNorm > 0.65) {
            bandMult *= this.highRpmBoost || 1.0;
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
        const spoolRate = targetBoost > this.turboBoost ? 2.6 * (this.turboSpoolMult || 1) : 4.2;
        this.turboBoost += (targetBoost - this.turboBoost) * Math.min(1, spoolRate * dt);
      } else if (clutchNow && throttle > 0.25 && this.rpm > 2000) {
        const freeBoost = clamp(((this.rpm - 1900) / 4200) * throttle * 0.45, 0, 0.45);
        this.turboBoost += (freeBoost - this.turboBoost) * Math.min(1, 2.2 * (this.turboSpoolMult || 1) * dt);
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
        this.lateralSlip = 0;
        this.slipAngle *= Math.max(0, 1 - 8 * clampedDt);
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
      const cruiseTargetMs = inp.cruiseTargetMs > 0 ? inp.cruiseTargetMs : 0;
      const limiterTargetMs = inp.limiterTargetMs > 0 ? inp.limiterTargetMs : 0;

      const v = this.speed;
      let effThrottle = throttle;
      if (cruiseTargetMs > 0 && brake <= 0.05 && this.gear > 0 && !this.clutchPressed) {
        const err = cruiseTargetMs - v;
        if (err > -0.5) {
          const cruiseThrot = clamp(0.14 + err * 0.24, 0, 0.88);
          effThrottle = Math.max(effThrottle, cruiseThrot);
        }
      }
      if (limiterTargetMs > 0 && v > 0 && effThrottle > 0) {
        const capMult = clamp((limiterTargetMs - v) / 2.6, 0, 1);
        effThrottle *= capMult;
      }

      // Effective surface grip combining weather + car all-weather rating + tire upgrades
      const baseWeatherGrip = weatherGrip !== undefined ? weatherGrip : 1.0;
      const effectiveGrip = clamp(baseWeatherGrip * this.weatherGripMult, 0.48, 1.15);

      // Handle Auto R <-> 1 transitions with brief standstill hold so braking doesn't snap into R
      if (this.transmissionMode === 'AUTO') {
        if (brake > 0.05 && this.gear > 0) {
          if (this.speed <= 0.35) {
            this.reverseHoldTimer += clampedDt;
            if (this.reverseHoldTimer >= 0.22) {
              this.gear = -1;
              this.reverseHoldTimer = 0;
            }
          } else {
            this.reverseHoldTimer = 0;
          }
        } else if (effThrottle > 0.05 && this.gear === -1 && this.speed >= -0.35) {
          this.gear = 1;
          this.reverseHoldTimer = 0;
        } else {
          this.reverseHoldTimer = 0;
        }
      }

      const torqueMult = this.updateTransmission(effThrottle, brake, clutch, clampedDt, events);

      // 1. Longitudinal Acceleration (Power-Hyperbola + Tire Launch + Aero Drag + Road Grade)
      let targetAccel = 0;
      this.braking = false;

      const launchG = Math.min(
        this.accelPower * 0.72,
        9.81 * clamp(0.55 + 0.52 * effectiveGrip * this.gripMult, 0.45, 1.18)
      );
      const topGearDriveAtMax = launchG * (1 / 4.10) * 0.85 * (this.highRpmBoost || 1.0);
      const rollResist = 0.16 + (this.onShoulder ? 0.95 : 0);
      const effAero = Math.max(0.00014, (topGearDriveAtMax - 0.16) / (this.maxSpeedMs * this.maxSpeedMs));
      const slope = this.getSlope ? this.getSlope(this.s) : 0;
      const gradeAccel = -9.81 * slope;

      if (brake > 0.05) {
        if (v > 0.45) {
          const brakeGripScale = (0.54 + 0.46 * effectiveGrip) * this.brakeWeatherBonus;
          const steerBrakeScale = 1 - 0.10 * this.steer * this.steer;
          targetAccel = -this.brakePower * clamp(brakeGripScale, 0.55, 1.18) * brake * steerBrakeScale;
          this.braking = true;
        } else if (this.clutchPressed || this.gear === 0) {
          targetAccel = -(10.0 * brake);
          this.braking = true;
        } else if (this.gear === -1) {
          if (this.transmissionMode === 'AUTO') {
            const revFrac = clamp(1 - Math.abs(v) / MAX_REVERSE_MS, 0, 1);
            targetAccel = -4.6 * brake * revFrac;
          } else {
            if (v < -0.05) {
              targetAccel = 12.0 * brake;
            } else {
              targetAccel = 0;
              this.speed = 0;
            }
            this.braking = true;
          }
        } else if (this.transmissionMode === 'AUTO') {
          targetAccel = v > 0.02 ? -(12.0 * brake) : 0;
          if (v <= 0.02) this.speed = 0;
          this.braking = true;
        } else {
          targetAccel = -(10.0 * brake);
          this.braking = true;
        }
      } else if (this.gear === 0 || this.clutchPressed) {
        if (v > 0.05) {
          targetAccel = -(0.28 + (this.onShoulder ? 0.85 : 0) + effAero * v * v) + gradeAccel;
        } else if (v < -0.05) {
          targetAccel = 1.8;
        } else {
          targetAccel = 0;
        }
      } else if (effThrottle > 0.05) {
        if (this.gear === -1) {
          if (this.transmissionMode === 'AUTO') {
            targetAccel = v < -0.1 ? 12.0 * effThrottle : 0;
            if (v < -0.1) this.braking = true;
          } else if (v > 0.25) {
            targetAccel = -10.0 * effThrottle;
          } else {
            const revFrac = clamp(1 - Math.abs(v) / MAX_REVERSE_MS, 0, 1);
            targetAccel = -5.2 * effThrottle * revFrac * clamp(0.7 + 0.3 * effectiveGrip, 0.72, 1.0);
          }
        } else if (v < 0) {
          targetAccel = 14.0 * effThrottle;
        } else {
          const speedFrac = clamp(v / this.maxSpeedMs, 0, 1.05);
          const powerDecay = 1 / (1 + 3.10 * Math.pow(speedFrac, 1.30));
          const driveCurve = launchG * powerDecay * torqueMult;
          const tractionCap = clamp(0.68 + 0.32 * effectiveGrip, 0.65, 1.0);
          const drag = effAero * v * v + rollResist;
          targetAccel = driveCurve * tractionCap * effThrottle - drag + gradeAccel;
        }
      } else {
        if (v > 0.05) {
          targetAccel = -(0.36 + (this.onShoulder ? 0.85 : 0) + effAero * v * v) + gradeAccel;
        } else if (v < -0.05) {
          targetAccel = 1.8;
        } else {
          targetAccel = 0;
          this.speed = 0;
        }
      }

      // Progressive engine braking above current gear top speed (never teleports speed on downshift)
      if (!this.clutchPressed && this.gear > 0 && v > 1.0) {
        const gTop = this.getGearTopSpeedMs(this.gear);
        if (v > gTop * 0.995) {
          const overFrac = (v - gTop * 0.995) / Math.max(6, gTop);
          targetAccel = Math.min(targetAccel, -(1.8 + overFrac * 24.0));
        }
      }

      this.accel = targetAccel;
      this.speed = clamp(this.speed + targetAccel * clampedDt, -MAX_REVERSE_MS, this.maxSpeedMs);
      if (Math.abs(this.speed) < 0.04 && effThrottle === 0 && brake === 0) {
        this.speed = 0;
      }

      // 2. Bicycle-Model Steering & Tire-Grip Cornering (real chassis turn-in + curves)
      const absV = Math.abs(this.speed);
      const speedNorm = clamp(absV / this.maxSpeedMs, 0, 1);
      const steerMult = this.steerResponseMult || 1.0;
      const isReversingSteer = steerDir !== 0 && steerDir * this.steer < 0;
      const turnInRate = lerp(5.4, 3.3, speedNorm) * steerMult;
      const counterRate = lerp(12.2, 9.2, speedNorm) * steerMult;
      const centerRate = lerp(9.8, 7.8, speedNorm) * steerMult;
      const steerRamp = steerDir === 0 ? centerRate : isReversingSteer ? counterRate : turnInRate;
      this.steer += (steerDir - this.steer) * Math.min(1, steerRamp * clampedDt);
      if (steerDir === 0 && Math.abs(this.steer) < 0.005) this.steer = 0;

      const shapedSteer = Math.sign(this.steer) * Math.pow(Math.abs(this.steer), 1.28);
      const latGripScale = clamp(effectiveGrip * this.gripMult, 0.45, 1.85);
      const gripResponse = clamp(0.62 + 0.38 * effectiveGrip, 0.65, 1.15);
      const brakeTurnPenalty = this.braking ? 1 - 0.12 * brake : 1.0;
      const maxLatAccel = 9.81 * clamp(0.74 * latGripScale, 0.40, 1.34) * brakeTurnPenalty;
      const wheelbase = clamp(this.length * 0.60, 2.45, 6.80);
      const maxSteerAngle = lerp(0.42, 0.13, clamp(absV / 75, 0, 1));
      this.frontWheelAngle = shapedSteer * maxSteerAngle;

      const revSign = this.speed >= -0.05 ? 1 : -1;
      const kinematicYawRate =
        (absV / wheelbase) *
        Math.tan(Math.abs(this.frontWheelAngle)) *
        Math.sign(shapedSteer) *
        revSign;
      const gripMaxYawRate = maxLatAccel / Math.max(absV, 5.5);
      const commandedYawRate = clamp(kinematicYawRate, -gripMaxYawRate, gripMaxYawRate);

      const roadCurv = this.getCurvature(this.s);
      const curvYawRate = -roadCurv * this.speed * Math.cos(this.yawRel);
      const steerAuthority = clamp(absV / 2.2, 0, 1);
      const casterGain =
        steerDir === 0 ? lerp(4.4, 5.6, clamp(absV / 35, 0, 1)) * gripResponse : 0.85;
      const alignYawRate = -this.yawRel * casterGain * steerAuthority;

      const netYawRate = commandedYawRate + curvYawRate + alignYawRate;
      this.yawRate += (netYawRate - this.yawRate) * Math.min(1, 14 * clampedDt);
      const maxSafeYaw = clamp(0.14 + 4.4 / Math.max(absV, 9.0), 0.15, 0.42);
      this.yawRel = clamp(this.yawRel + this.yawRate * clampedDt, -maxSafeYaw, maxSafeYaw);
      if (steerDir === 0 && Math.abs(roadCurv) < 0.0002 && Math.abs(this.yawRel) < 0.0008) {
        this.yawRel = 0;
      }

      const latAccelDemand = Math.abs(this.speed * (commandedYawRate + alignYawRate));
      const cornerDemand = Math.abs(roadCurv) * absV * absV;
      const slipRatio = clamp(Math.max(latAccelDemand, cornerDemand * 0.72) / Math.max(3.0, maxLatAccel), 0, 1.25);
      const targetSlipAng =
        Math.sign(this.steer) * clamp((slipRatio - 0.30) * 0.048, 0, 0.045) * revSign;
      this.slipAngle += (targetSlipAng - this.slipAngle) * Math.min(1, 10 * clampedDt);
      this.lateralSlip = clamp(
        slipRatio * 0.82 + (this.braking && absV > 14 ? brake * 0.48 * (1.15 - effectiveGrip * 0.35) : 0),
        0,
        1.25
      );

      // Extra outward centrifugal drift if corner speed exceeds available tire lateral grip
      let overGripSlideVel = 0;
      if (cornerDemand > maxLatAccel && absV > 15) {
        overGripSlideVel = clamp(
          -Math.sign(roadCurv) * (cornerDemand - maxLatAccel) * 0.16,
          -1.8,
          1.8
        );
      }

      // 3. Advance Curvilinear Position
      const prevS = this.s;
      const ds = this.speed * Math.cos(this.yawRel) * clampedDt;
      const dd = (this.speed * Math.sin(this.yawRel) + overGripSlideVel) * clampedDt;
      this.s += ds;
      this.d += dd;

      if (ds > 0) this.distanceMeters += ds;
      if (this.speedKmh > this.topSpeedKmh) this.topSpeedKmh = this.speedKmh;
      this.onShoulder = this.d < SHOULDER_LEFT_D || this.d > SHOULDER_RIGHT_D;
      this.shoulderTime = this.onShoulder && absV > 3 ? this.shoulderTime + clampedDt : 0;

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
      const curveLatForce = roadCurv * this.speed * this.speed * 0.0022;
      const steerLatForce = (latAccelDemand / 9.81) * Math.sign(this.steer || 0) * 0.036;
      const rollDamp = 1 / (this.rollStiffness || 1.0);
      const targetRoll = clamp((steerLatForce + curveLatForce) * rollDamp, -0.052, 0.052);

      this.pitch += (targetPitch - this.pitch) * Math.min(1, 13 * clampedDt);
      this.roll += (targetRoll - this.roll) * Math.min(1, 10 * clampedDt);

      // 5. Highway Median & Guardrail Collision Clamping (angle/speed proportional)
      if (this.d < BARRIER_MIN_D) {
        const latImpact = Math.max(0.8, Math.abs(this.speed * Math.sin(this.yawRel)) + 0.05 * absV);
        const keep = clamp(1 - (0.025 + Math.min(0.11, latImpact * 0.012)) * this.damageResist, 0.84, 0.985);
        this.d = BARRIER_MIN_D + 0.04;
        if (this.yawRel < 0) this.yawRel = 0.012;
        if (this.barrierCooldown <= 0 && this.speed > 4) {
          this.speed *= keep;
          this.barrierCooldown = 0.35;
          this.damage = Math.min(95, this.damage + Math.max(1, Math.round((1.8 + latImpact * 1.05) * this.damageResist)));
          events.push({ type: 'barrier', intensity: clamp(latImpact / 14, 0.18, 1.0) });
        }
      } else if (this.d > BARRIER_MAX_D) {
        const latImpact = Math.max(0.8, Math.abs(this.speed * Math.sin(this.yawRel)) + 0.05 * absV);
        const keep = clamp(1 - (0.025 + Math.min(0.11, latImpact * 0.012)) * this.damageResist, 0.84, 0.985);
        this.d = BARRIER_MAX_D - 0.04;
        if (this.yawRel > 0) this.yawRel = -0.012;
        if (this.barrierCooldown <= 0 && this.speed > 4) {
          this.speed *= keep;
          this.barrierCooldown = 0.35;
          this.damage = Math.min(95, this.damage + Math.max(1, Math.round((1.8 + latImpact * 1.05) * this.damageResist)));
          events.push({ type: 'barrier', intensity: clamp(latImpact / 14, 0.18, 1.0) });
        }
      }

      // 6. Traffic Collisions, Clean Passes & Thread-the-Needle Detection
      if (traffic && traffic.vehicles) {
        const vehicles = traffic.vehicles;
        let leftFlank = false;
        let rightFlank = false;

        for (let i = 0; i < vehicles.length; i++) {
          const npc = vehicles[i];

          const hlSum = (this.length + npc.length) * 0.5 - 0.14;
          const hwSum = (this.width + npc.width) * 0.5 - 0.12;
          const dsGap = this.s - npc.s;
          const ddGap = this.d - npc.d;

          let collidedThisNpc = false;
          if (npc.hitCooldown <= 0 && Math.abs(dsGap) < hlSum && Math.abs(ddGap) < hwSum) {
            collidedThisNpc = true;
            const penS = hlSum - Math.abs(dsGap);
            const penD = hwSum - Math.abs(ddGap);
            const normPenS = penS / Math.max(0.5, hlSum);
            const normPenD = penD / Math.max(0.5, hwSum);
            const relLong = Math.abs(this.speed - npc.v);
            this.collisionCount++;
            npc.passedByPlayer = true;
            npc._passCandidate = false;

            const rigCrashBoost = this.isBigRig ? 1.35 : 1.0;

            if (normPenS <= normPenD) {
              const pushSign = dsGap >= 0 ? 1 : -1;
              this.s = npc.s + pushSign * (hlSum + 0.08);
              const closingLongMs =
                pushSign < 0 ? Math.max(0, this.speed - npc.v) : Math.max(0, npc.v - this.speed);
              const impactMs = Math.max(
                closingLongMs,
                Math.abs(this.speed * Math.sin(this.yawRel)) * 0.65,
                1.2
              );
              const dmgAdd = Math.round((12 + impactMs * 1.8) * this.damageResist);

              if (impactMs >= (13.5 * rigCrashBoost) / Math.sqrt(this.damageResist) || this.damage + dmgAdd >= 100) {
                this.damage = 100;
                this.crashed = true;
                this.lastCrashReason = 'Collision with highway traffic';
                this.speed = Math.min(this.speed * 0.22, npc.v * 0.45);
                traffic.onPlayerCollision(npc, impactMs * (this.isBigRig ? 1.5 : 1.0), 0);
                events.push({ type: 'crash', intensity: 1.0, impactMs, npc });
                break;
              } else {
                this.damage = Math.min(99, this.damage + Math.max(this.isBigRig ? 3 : 6, dmgAdd));
                this.speed = clamp(
                  pushSign < 0
                    ? this.isBigRig
                      ? Math.max(this.speed * 0.90, npc.v * 0.92)
                      : Math.min(this.speed, npc.v * 0.84)
                    : Math.max(this.speed, npc.v + 1.2),
                  0,
                  this.maxSpeedMs
                );
                traffic.onPlayerCollision(npc, impactMs * (this.isBigRig ? 1.5 : 1.0), 0);
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
              this.speed *= this.isBigRig ? 0.95 : 0.88;
              const dmgAdd = Math.round((10 + impactMs * 1.4) * this.damageResist);
              const latPushScale = this.isBigRig ? 1.6 : 1.0;

              if (this.damage + dmgAdd >= 100 || impactMs >= (14.5 * rigCrashBoost) / Math.sqrt(this.damageResist)) {
                this.damage = 100;
                this.crashed = true;
                this.lastCrashReason = 'High-speed sideswipe collision';
                traffic.onPlayerCollision(npc, impactMs * latPushScale, -sideSign * 0.35 * latPushScale);
                events.push({ type: 'crash', intensity: 1.0, impactMs, npc });
                break;
              } else {
                this.damage = Math.min(99, this.damage + Math.max(this.isBigRig ? 3 : 5, dmgAdd));
                traffic.onPlayerCollision(npc, impactMs * latPushScale, -sideSign * (this.isBigRig ? 0.48 : 0.25));
                events.push({
                  type: 'minor',
                  intensity: clamp(impactMs / 10, 0.22, 0.85),
                  impactMs,
                  npc
                });
              }
            }
          }

          if (!collidedThisNpc && !this.crashed && !npc.passedByPlayer) {
            const absDd = Math.abs(ddGap);
            if (
              this.speed > 22 &&
              this.speed > npc.v + 4.0 &&
              Math.abs(dsGap) <= hlSum + 1.0 &&
              absDd >= hwSum + 0.06 &&
              absDd <= 4.75
            ) {
              npc._passCandidate = true;
              npc._minPassDd = Math.min(npc._minPassDd || 99, absDd);
              npc._passRelKmh = Math.max(npc._passRelKmh || 0, (this.speed - npc.v) * 3.6);
              if (ddGap > 0) leftFlank = true;
              else rightFlank = true;
            }

            const clearedNormally = npc._passCandidate && dsGap > hlSum * 0.70 && dsGap < hlSum + 14;
            const crossedSubstep =
              prevS <= npc.s &&
              this.s > npc.s &&
              this.speed > 22 &&
              this.speed > npc.v + 4.0 &&
              absDd >= hwSum + 0.12 &&
              absDd <= 4.75;

            if (clearedNormally || crossedSubstep) {
              npc.passedByPlayer = true;
              const bestDd = npc._minPassDd || absDd;
              events.push({
                type: 'clean_pass',
                relSpeedKmh: npc._passRelKmh || (this.speed - npc.v) * 3.6,
                isClose: bestDd < 3.0,
                npc
              });
            }
          }
        }

        if (!this.crashed && leftFlank && rightFlank && this.speed > 30.5 && this._needleCooldown <= 0) {
          this._needleCooldown = 2.0;
          events.push({ type: 'thread_needle' });
        }
      }

      if (this._needleCooldown > 0) {
        this._needleCooldown = Math.max(0, this._needleCooldown - clampedDt);
      }

      // 7. Parked Emergency Shoulder Obstacles (Undercover Radar Cars + Broken-Down Hazard Cars)
      if (!this.crashed && this.getRadarInfo) {
        const rInfo = this.getRadarInfo(this.s - 10);
        if (rInfo && this._lastRadarHitSlot !== rInfo.slot) {
          if (this._resolveStaticObstacle(rInfo.radarS, 9.15, 4.65, 1.86, 'Collided with parked radar patrol unit', events)) {
            this._lastRadarHitSlot = rInfo.slot;
          }
        }
      }
      if (!this.crashed && this.getShoulderHazardInfo) {
        const hInfo = this.getShoulderHazardInfo(this.s);
        if (hInfo && this._lastHazardHitSlot !== hInfo.slot) {
          if (
            this._resolveStaticObstacle(
              hInfo.hazardS,
              hInfo.d,
              hInfo.length,
              hInfo.width,
              'Collided with broken-down shoulder vehicle',
              events
            )
          ) {
            this._lastHazardHitSlot = hInfo.slot;
          }
        }
      }

      return events;
    }

    _resolveStaticObstacle(obsS, obsD, obsL, obsW, crashReason, events) {
      const hlSum = (this.length + obsL) * 0.5 - 0.14;
      const hwSum = (this.width + obsW) * 0.5 - 0.12;
      const dsGap = this.s - obsS;
      const ddGap = this.d - obsD;
      if (Math.abs(dsGap) >= hlSum || Math.abs(ddGap) >= hwSum) return false;

      const penS = hlSum - Math.abs(dsGap);
      const penD = hwSum - Math.abs(ddGap);
      const normPenS = penS / Math.max(0.5, hlSum);
      const normPenD = penD / Math.max(0.5, hwSum);
      this.collisionCount++;
      const rigCrashBoost = this.isBigRig ? 1.35 : 1.0;

      if (normPenS <= normPenD) {
        const pushSign = dsGap >= 0 ? 1 : -1;
        this.s = obsS + pushSign * (hlSum + 0.08);
        const impactMs = Math.max(pushSign < 0 ? Math.abs(this.speed) : 2.0, 2.0);
        const dmgAdd = Math.round((14 + impactMs * 1.9) * this.damageResist);
        if (impactMs >= (13.5 * rigCrashBoost) / Math.sqrt(this.damageResist) || this.damage + dmgAdd >= 100) {
          this.damage = 100;
          this.crashed = true;
          this.lastCrashReason = crashReason;
          this.speed *= 0.20;
          events.push({ type: 'crash', intensity: 1.0, impactMs });
        } else {
          this.damage = Math.min(99, this.damage + Math.max(6, dmgAdd));
          this.speed *= 0.45;
          events.push({ type: 'minor', intensity: clamp(impactMs / 12, 0.3, 0.9), impactMs });
        }
      } else {
        const sideSign = ddGap >= 0 ? 1 : -1;
        this.d = clamp(obsD + sideSign * (hwSum + 0.08), BARRIER_MIN_D, BARRIER_MAX_D);
        if (sideSign > 0 && this.yawRel < 0) this.yawRel *= 0.2;
        if (sideSign < 0 && this.yawRel > 0) this.yawRel *= 0.2;
        const impactMs = Math.max(Math.abs(this.speed * Math.sin(this.yawRel)), Math.abs(this.speed) * 0.42);
        this.speed *= this.isBigRig ? 0.92 : 0.80;
        const dmgAdd = Math.round((12 + impactMs * 1.5) * this.damageResist);
        if (this.damage + dmgAdd >= 100 || impactMs >= (14.5 * rigCrashBoost) / Math.sqrt(this.damageResist)) {
          this.damage = 100;
          this.crashed = true;
          this.lastCrashReason = crashReason;
          events.push({ type: 'crash', intensity: 1.0, impactMs });
        } else {
          this.damage = Math.min(99, this.damage + Math.max(5, dmgAdd));
          events.push({ type: 'minor', intensity: clamp(impactMs / 10, 0.25, 0.85), impactMs });
        }
      }
      return true;
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
