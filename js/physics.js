/* ==========================================================================
   REALISTIC VEHICLE DYNAMICS ENGINE:
   - Exact Real-World Top Speeds (e.g., Jesko 531 km/h, Chiron 490 km/h, GT3 RS 296 km/h)
   - Dynamic Axle Weight Transfer (Trail-Braking Rotation & Squat/Dive)
   - Pacejka-Style Tire Friction Circle & RWD vs. AWD Traction
   - Aerodynamic Downforce & Drag Equilibrium
   - 6-to-9 Speed Gearbox (Auto + Manual Paddle Shift [Q]/[E])
   - 2nd-Order Spring-Damper Suspension Physics
   ========================================================================== */

(function () {
  class HorizonPhysicsVehicle {
    constructor(world, carSpec) {
      this.world = world;
      this.spec = carSpec;

      // Spawn on Main Highway at (0, 0) facing North (-Z)
      this.x = 0;
      this.z = 0;
      this.y = this.world.getTerrainHeight(0, 0);
      this.heading = Math.PI;

      // World & local velocities (m/s)
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;
      this.forwardSpeed = 0;
      this.lateralSpeed = 0;
      this.yawRate = 0;
      this.steerAngle = 0;

      // Speed readouts
      this.speedMps = 0;
      this.speedKmh = 0;
      this.speedMph = 0;

      // Tire slip & G-forces
      this.slipAngleDeg = 0;
      this.slipNormalized = 0;
      this.wheelspin = 0;
      this.longG = 0;
      this.latG = 0;

      // 2nd-order spring-damper suspension state
      this.pitch = 0;
      this.roll = 0;
      this.chassisPitch = 0;
      this.chassisPitchVel = 0;
      this.chassisRoll = 0;
      this.chassisRollVel = 0;
      this.chassisHeave = 0;
      this.chassisHeaveVel = 0;

      // Powertrain & Gearbox
      this.transmissionMode = 'AUTO'; // 'AUTO' or 'MANUAL'
      this.gear = 1;
      this.shiftTimer = 0;
      this.rpm = 0.15; // Normalized 0.0 -> 1.0
      this.currentRpm = 1100;

      // Driving Assists / Handling Preset: 'SIM_GRIP', 'SPORT', 'DRIFT'
      this.handlingMode = 'SIM_GRIP';
      this.tcsEnabled = true;

      // Surface & Airborne state
      this.isGrounded = true;
      this.surfaceType = 'TARMAC';

      // Boost / ERS Overtake
      this.nitro = 1.0;
      this.isBoosting = false;
    }

    setCarSpec(newSpec) {
      this.spec = newSpec;
      if (typeof this.gear === 'number' && this.gear > newSpec.gears) {
        this.gear = newSpec.gears;
      }
    }

    cycleHandlingMode() {
      const modes = ['SIM_GRIP', 'SPORT', 'DRIFT'];
      const idx = (modes.indexOf(this.handlingMode) + 1) % modes.length;
      this.handlingMode = modes[idx];
      this.tcsEnabled = this.handlingMode === 'SIM_GRIP';
      return this.handlingMode;
    }

    toggleTransmissionMode() {
      this.transmissionMode = this.transmissionMode === 'AUTO' ? 'MANUAL' : 'AUTO';
      return this.transmissionMode;
    }

    shiftUp() {
      if (this.gear === 'R') {
        this.gear = 1;
        this.shiftTimer = 0.08;
        return;
      }
      if (this.gear === 'N') {
        this.gear = 1;
        this.shiftTimer = 0.08;
        return;
      }
      if (typeof this.gear === 'number' && this.gear < this.spec.gears) {
        this.gear += 1;
        this.shiftTimer = 0.085;
      }
    }

    shiftDown() {
      if (typeof this.gear === 'number' && this.gear > 1) {
        this.gear -= 1;
        this.shiftTimer = 0.075;
        // Downshift rev-match blip
        this.chassisPitchVel -= 0.18;
      } else if (this.gear === 1 && this.speedKmh < 8) {
        this.gear = 'R';
      }
    }

    teleport(x, z, heading) {
      this.x = x;
      this.z = z;
      this.y = this.world.getTerrainHeight(x, z);
      if (heading !== undefined) this.heading = heading;
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;
      this.yawRate = 0;
      this.forwardSpeed = 0;
      this.lateralSpeed = 0;
      this.gear = 1;
      this.isGrounded = true;
    }

    resetToNearestRoad() {
      const { sample } = this.world.getNearestRoadSample(this.x, this.z, true);
      if (sample) {
        const heading = Math.atan2(sample.tangent.x, sample.tangent.z);
        this.teleport(sample.x, sample.z, heading);
      } else {
        this.teleport(0, 0, Math.PI);
      }
    }

    /* ----------------------------------------------------------------------
       COMPUTE GEAR SPEED CEILINGS FOR N-SPEED TRANSMISSION
       ---------------------------------------------------------------------- */
    getGearTopSpeedMps(gearNum) {
      const totalGears = this.spec.gears || 7;
      const maxSpeedMps = this.spec.topSpeedKmh / 3.6;
      // Progressive geometric gear spacing from 1st gear (~21% of vmax) to top gear (100% of vmax)
      const minFraction = 0.20;
      const t = (gearNum - 1) / Math.max(1, totalGears - 1);
      const fraction = minFraction + (1.0 - minFraction) * Math.pow(t, 0.86);
      return maxSpeedMps * fraction;
    }

    update(dt, input) {
      const spec = this.spec;
      const phys = spec.physics;
      const mass = spec.weightKg || 1550;
      const gravity = 9.81;

      const sinH = Math.sin(this.heading);
      const cosH = Math.cos(this.heading);

      // 1. Decompose world velocity into car-local Forward (vx_local) and Lateral (vy_local)
      const prevForwardSpeed = this.forwardSpeed;
      this.forwardSpeed = this.vx * sinH + this.vz * cosH;
      this.lateralSpeed = this.vx * cosH - this.vz * sinH;

      this.speedMps = Math.hypot(this.vx, this.vz);
      this.speedKmh = this.speedMps * 3.6;
      this.speedMph = this.speedMps * 2.23694;

      // 2. Terrain height, surface type & smooth road slope tracking (zero road jumping!)
      const surfInfo = this.world.getSurfaceInfo(this.x, this.z);
      const groundY = this.world.getTerrainHeight(this.x, this.z);

      const sampleDist = 3.2;
      const hFront = this.world.getTerrainHeight(this.x + sinH * sampleDist, this.z + cosH * sampleDist);
      const hBack = this.world.getTerrainHeight(this.x - sinH * sampleDist, this.z - cosH * sampleDist);
      const hRight = this.world.getTerrainHeight(this.x + cosH * sampleDist, this.z - sinH * sampleDist);
      const hLeft = this.world.getTerrainHeight(this.x - cosH * sampleDist, this.z + sinH * sampleDist);

      const terrainPitch = Math.max(-0.40, Math.min(0.40, Math.atan2(hFront - hBack, sampleDist * 2)));
      const terrainRoll = Math.max(-0.36, Math.min(0.36, Math.atan2(hRight - hLeft, sampleDist * 2)));

      // Keep car planted on tarmac and normal terrain slopes; NEVER allow this.y < groundY (zero sinking!)
      const onTarmac = surfInfo.surface === 'TARMAC';
      const wheelbaseGroundY = Math.max(groundY, (hFront + hBack) * 0.5, (hRight + hLeft) * 0.5);
      if (onTarmac || (this.y <= wheelbaseGroundY + 2.2 && this.vy <= 4.5)) {
        this.isGrounded = true;
        this.y = wheelbaseGroundY;
        this.vy = 0;
        this.surfaceType = surfInfo.surface;
      } else {
        this.isGrounded = false;
        this.vy -= 24.0 * dt;
        this.y += this.vy * dt;
        if (this.y <= wheelbaseGroundY) {
          this.y = wheelbaseGroundY;
          this.vy = 0;
          this.isGrounded = true;
          this.chassisHeaveVel = -0.35;
        }
        this.surfaceType = 'AIR';
      }

      this.pitch += (-terrainPitch - this.pitch) * Math.min(1, dt * 18.0);
      this.roll += (terrainRoll - this.roll) * Math.min(1, dt * 18.0);

      // 3. Speed-Sensitive Steering + Self-Aligning Counter-Steer Torque
      const rawSteer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      // High-speed steering ratio reduction so 400+ km/h is rock-solid stable
      const speedSensitivity = 1 / (1 + Math.pow(this.speedKmh / 190, 1.35) * 0.85);
      let targetSteer = rawSteer * speedSensitivity;

      // Natural front-wheel self-aligning torque (helps counter-steer into slides like a real steering rack)
      if (this.isGrounded && this.speedKmh > 25 && Math.abs(this.lateralSpeed) > 1.2) {
        const slipRatio = Math.atan2(-this.lateralSpeed, Math.abs(this.forwardSpeed) + 1.0);
        const assistStrength = this.handlingMode === 'DRIFT' ? 0.55 : 0.28;
        targetSteer += slipRatio * assistStrength * (rawSteer === 0 ? 1.0 : 0.45);
      }
      targetSteer = Math.max(-1.0, Math.min(1.0, targetSteer));
      const steerRate = rawSteer !== 0 ? 9.5 : 12.5;
      this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1, dt * steerRate);

      // 4. ERS / Turbo Overboost Management
      if (input.boost && this.nitro > 0.02 && input.throttle > 0) {
        this.isBoosting = true;
        this.nitro = Math.max(0, this.nitro - dt * 0.20);
      } else {
        this.isBoosting = false;
        this.nitro = Math.min(1.0, this.nitro + dt * 0.10);
      }

      // 5. Gearbox & Engine Torque Curve Calculation
      if (this.shiftTimer > 0) {
        this.shiftTimer = Math.max(0, this.shiftTimer - dt);
      }
      this.updateTransmissionAndRPM(input.throttle, input.brake);

      // 6. Aerodynamic Downforce, Real 0-100 km/h Launch & Exact Real-World Top Speed Calibration
      const vMaxMps = (spec.topSpeedKmh / 3.6) * (this.isBoosting ? 1.06 : 1.0);
      // Aerodynamic downforce increases tire normal load with speed^2
      const aeroDownforceAccel = phys.downforceCoeff * Math.pow(Math.min(this.speedMps, 160) / 45, 2) * 4.5;

      // Exact 0-100 km/h launch acceleration calibrated from spec.zeroTo100 (e.g. 2.3s -> 12.1 m/s^2, 3.6s -> 7.7 m/s^2)
      const targetZeroTo100Sec = parseFloat(spec.zeroTo100) || 2.8;
      const launchTargetAccel = (27.778 / targetZeroTo100Sec) * 1.06 * (this.isBoosting ? 1.16 : 1.0);

      // Power-to-weight upper-gear acceleration calibrated from real HP and weightKg
      const hpToWeightRatio = spec.hp / mass; // e.g., Jesko = 1.15 HP/kg, GT3 RS = 0.357 HP/kg
      const highSpeedPullAccel = (8.2 + hpToWeightRatio * 9.5) * (this.isBoosting ? 1.16 : 1.0);

      // Torque curve across RPM band (strong midrange + high-RPM power plateau up to redline)
      const torqueCurve = 0.88 + 0.14 * Math.sin(Math.min(1, Math.max(0, (this.rpm - 0.10) / 0.90)) * Math.PI * 0.70);
      const gearNum = typeof this.gear === 'number' ? this.gear : 1;
      const gearProgress = (gearNum - 1) / Math.max(1, spec.gears - 1);
      const rawEngineAccel = (launchTargetAccel * (1 - gearProgress * 0.32) + highSpeedPullAccel * gearProgress * 0.45) * torqueCurve;

      const isOffroad = this.surfaceType !== 'TARMAC';
      const surfaceGripMult = isOffroad ? 0.85 : 1.0;

      // RWD vs. AWD Tire Traction Limit (limits launch acceleration in 1st/2nd gear; downforce locks tires at speed)
      const isRWD = spec.drivetrain === 'RWD';
      const maxTractionAccel = launchTargetAccel * surfaceGripMult + Math.pow(this.speedMps / 28, 1.5) * 4.5 + aeroDownforceAccel;

      // 7. Longitudinal Acceleration, Braking & Axle Weight Transfer
      let driveAccel = 0;
      const shiftCut = this.shiftTimer > 0 ? 0.55 : 1.0;
      const currentGearCeilingMps = this.getGearTopSpeedMps(gearNum) * (this.isBoosting ? 1.06 : 1.0);
      const slopeGravity = gravity * Math.sin(-this.pitch) * 0.52;

      if (this.isGrounded) {
        if (input.throttle > 0) {
          if (this.forwardSpeed < -1.2) {
            // Braking while rolling backward
            driveAccel = phys.brakeG * gravity * 1.15;
          } else if (this.transmissionMode === 'MANUAL' && this.forwardSpeed >= currentGearCeilingMps) {
            // Rev-limiter fuel cut in Manual mode until player upshifts with [E]
            driveAccel = 0;
          } else {
            driveAccel = rawEngineAccel * input.throttle * shiftCut;

            if (driveAccel > maxTractionAccel) {
              this.wheelspin = Math.min(1.0, (driveAccel - maxTractionAccel) / 6.0 + (isRWD && gearNum <= 2 ? 0.35 : 0.12));
              if (this.tcsEnabled && this.handlingMode === 'SIM_GRIP') {
                driveAccel = maxTractionAccel;
                this.wheelspin *= 0.25;
              } else {
                driveAccel = maxTractionAccel * 0.95;
              }
            } else {
              this.wheelspin = Math.max(0, this.wheelspin - dt * 5);
            }
            // Low-speed hill-climb torque assist so cars never get stuck on steep off-road slopes
            if (this.speedKmh < 85 && slopeGravity > 0) {
              driveAccel += slopeGravity * 1.15;
            }
          }
        } else if (input.brake > 0) {
          this.wheelspin = 0;
          if (this.forwardSpeed > 1.2) {
            // High-performance carbon-ceramic braking + aerodynamic drag assistance
            driveAccel = -(phys.brakeG * gravity * surfaceGripMult + aeroDownforceAccel * 0.35) * input.brake;
          } else {
            // Strong reverse gear acceleration (climbs any embankment or slope in reverse!)
            driveAccel = -14.5 * input.brake + Math.min(0, slopeGravity * 1.15);
          }
        } else {
          this.wheelspin = 0;
          // Engine compression braking when coasting off-throttle (with auto hill-hold near 0 km/h)
          if (Math.abs(this.forwardSpeed) < 0.8) {
            this.forwardSpeed = 0;
            driveAccel = slopeGravity;
          } else {
            driveAccel = -Math.sign(this.forwardSpeed) * (1.2 + this.rpm * 1.8);
          }
        }

        if (input.handbrake) {
          driveAccel -= Math.sign(this.forwardSpeed) * 7.5;
        }
      }

      // High-speed aerodynamic drag curve calibrated so car pulls strongly all the way to exact vMaxMps (spec.topSpeedKmh)
      const speedRatio = Math.min(1.25, Math.abs(this.forwardSpeed) / Math.max(10, vMaxMps));
      const topGearDriveAtVmax = (launchTargetAccel * 0.68 + highSpeedPullAccel * 0.45) * 0.82;
      const offroadDragMult = isOffroad ? 1.18 : 1.0;
      const dragAccel =
        Math.sign(this.forwardSpeed) * topGearDriveAtVmax * Math.pow(speedRatio, 3.2) * offroadDragMult +
        slopeGravity;

      const netLongAccel = driveAccel - dragAccel;
      this.forwardSpeed += netLongAccel * dt;

      // Exact aerodynamic top speed ceiling on flat ground
      if (!this.isBoosting && this.forwardSpeed > vMaxMps && input.throttle > 0 && Math.abs(this.pitch) < 0.02) {
        this.forwardSpeed = vMaxMps;
      }

      // Clamp reverse top speed to 65 km/h
      if (this.forwardSpeed < -18) this.forwardSpeed = -18;

      // 8. Dynamic Axle Weight Transfer & Pacejka Cornering / Oversteer Physics
      this.longG = (this.forwardSpeed - prevForwardSpeed) / (dt * gravity);
      // Forward weight shift under braking (< 0 longG increases front grip & lightens rear!)
      const frontWeightBias = Math.max(0.30, Math.min(0.72, 0.46 - this.longG * 0.14));
      const rearWeightBias = 1.0 - frontWeightBias;

      if (this.isGrounded && Math.abs(this.forwardSpeed) > 0.5) {
        const dirSign = this.forwardSpeed >= 0 ? 1 : -1;
        // Front axle bite increases under trail-braking
        const frontBite = 0.85 + frontWeightBias * 0.45;
        const handbrakeYawBoost = input.handbrake ? 1.48 : 1.0;
        const targetYawRate = this.steerAngle * phys.turnResponse * frontBite * handbrakeYawBoost * dirSign;

        this.yawRate += (targetYawRate - this.yawRate) * Math.min(1, dt * 11.5);
        this.heading += this.yawRate * dt;

        // Centrifugal lateral acceleration into slide
        const isDriftMode = this.handlingMode === 'DRIFT';
        const isSportMode = this.handlingMode === 'SPORT';

        // Rear tire grip drops when: (a) handbrake pulled, (b) RWD wheelspin under power, or (c) rear unloaded under heavy trail-braking
        const rwdPowerOversteer = (spec.drivetrain === 'RWD' ? this.wheelspin * 0.48 : this.wheelspin * 0.15);
        const trailBrakeRotation = Math.max(0, (0.50 - rearWeightBias) * 0.85);
        const modeSlipScale = isDriftMode ? 0.42 : isSportMode ? 0.22 : 0.12;

        const effectiveSlipFactor = input.handbrake
          ? 0.58
          : Math.min(0.62, modeSlipScale + rwdPowerOversteer + trailBrakeRotation);

        const centrifugalImpulse = -this.yawRate * this.forwardSpeed * effectiveSlipFactor;
        this.lateralSpeed += centrifugalImpulse * dt;

        // Lateral tire cornering stiffness + aerodynamic downforce grip
        const totalGrip = (phys.gripBase * surfaceGripMult) + (aeroDownforceAccel / gravity) * 0.25;
        const lateralCorneringStiffness = input.handbrake
          ? 1.9
          : isDriftMode
          ? 3.1 * totalGrip
          : isSportMode
          ? 6.2 * totalGrip
          : 9.2 * totalGrip;

        this.lateralSpeed *= Math.exp(-lateralCorneringStiffness * dt);
      } else {
        this.yawRate *= Math.exp(-3.5 * dt);
      }

      this.latG = (this.yawRate * this.forwardSpeed) / gravity;

      // 9. Reconstruct World Velocity & Integrate Position
      const newSinH = Math.sin(this.heading);
      const newCosH = Math.cos(this.heading);
      this.vx = this.forwardSpeed * newSinH + this.lateralSpeed * newCosH;
      this.vz = this.forwardSpeed * newCosH - this.lateralSpeed * newSinH;

      this.x += this.vx * dt;
      this.z += this.vz * dt;

      const bound = this.world.worldSize * 0.46;
      if (Math.abs(this.x) > bound) {
        this.x = Math.sign(this.x) * bound;
        this.vx *= -0.5;
      }
      if (Math.abs(this.z) > bound) {
        this.z = Math.sign(this.z) * bound;
        this.vz *= -0.5;
      }

      // Post-integration ground lock at the new (x, z) so the car NEVER lags below
      // rising off-road hills or embankments at any speed!
      const postCenterY = this.world.getTerrainHeight(this.x, this.z);
      const postFrontY = this.world.getTerrainHeight(this.x + newSinH * 2.4, this.z + newCosH * 2.4);
      const postBackY = this.world.getTerrainHeight(this.x - newSinH * 2.4, this.z - newCosH * 2.4);
      const postRightY = this.world.getTerrainHeight(this.x + newCosH * 1.1, this.z - newSinH * 1.1);
      const postLeftY = this.world.getTerrainHeight(this.x - newCosH * 1.1, this.z + newSinH * 1.1);
      const minSafeY = Math.max(postCenterY, (postFrontY + postBackY) * 0.5, (postRightY + postLeftY) * 0.5);
      if (this.isGrounded || this.y < minSafeY) {
        this.y = minSafeY;
      }

      // Compute slip angle for tire smoke, skidmarks & tire squeal audio
      if (this.speedKmh > 12) {
        const angleRad = Math.atan2(Math.abs(this.lateralSpeed), Math.abs(this.forwardSpeed) + 0.1);
        this.slipAngleDeg = angleRad * (180 / Math.PI) + this.wheelspin * 18;
        this.slipNormalized = Math.min(1, this.slipAngleDeg / 36);
      } else {
        this.slipAngleDeg = this.wheelspin * 22;
        this.slipNormalized = Math.min(1, this.wheelspin * 0.7);
      }

      // 10. 2nd-Order Spring-Damper Suspension Simulation (Squat, Dive, Body Roll & Heave)
      const targetBodyPitch = Math.max(-0.075, Math.min(0.075, this.longG * 0.042));
      const targetBodyRoll = Math.max(-0.09, Math.min(0.09, -this.latG * 0.038));

      const springK = 85.0;
      const damperC = 14.5;

      const pitchAccel = -springK * (this.chassisPitch - targetBodyPitch) - damperC * this.chassisPitchVel;
      this.chassisPitchVel += pitchAccel * dt;
      this.chassisPitch += this.chassisPitchVel * dt;

      const rollAccel = -springK * (this.chassisRoll - targetBodyRoll) - damperC * this.chassisRollVel;
      this.chassisRollVel += rollAccel * dt;
      this.chassisRoll += this.chassisRollVel * dt;

      const heaveAccel = -110.0 * this.chassisHeave - 16.0 * this.chassisHeaveVel;
      this.chassisHeaveVel += heaveAccel * dt;
      this.chassisHeave += this.chassisHeaveVel * dt;
    }

    /* ----------------------------------------------------------------------
       GEARBOX & RPM SIMULATION (AUTOMATIC & SEQUENTIAL MANUAL)
       ---------------------------------------------------------------------- */
    updateTransmissionAndRPM(throttle, brake) {
      const totalGears = this.spec.gears || 7;
      const redline = this.spec.redlineRpm || 8000;
      const idleRpm = 1000;

      if (this.forwardSpeed < -1.0) {
        this.gear = 'R';
        this.rpm = Math.min(0.95, 0.20 + (Math.abs(this.forwardSpeed) / 18) * 0.75);
        this.currentRpm = Math.round(idleRpm + this.rpm * (redline - idleRpm));
        return;
      }

      if (this.speedKmh < 2.0 && throttle <= 0 && brake <= 0) {
        if (this.transmissionMode === 'AUTO') {
          this.gear = 1;
        }
        this.rpm = 0.14;
        this.currentRpm = idleRpm;
        return;
      }

      if (this.gear === 'R' || this.gear === 'N') {
        this.gear = 1;
      }

      if (this.transmissionMode === 'AUTO') {
        let bestGear = 1;
        for (let g = 1; g <= totalGears; g++) {
          const ceilingMps = this.getGearTopSpeedMps(g);
          if (this.speedMps <= ceilingMps * 0.96 || g === totalGears) {
            bestGear = g;
            break;
          }
        }
        if (bestGear !== this.gear && this.shiftTimer <= 0) {
          this.gear = bestGear;
          this.shiftTimer = 0.075;
          // Subtle pitch kick on full-throttle upshift
          if (throttle > 0.5) {
            this.chassisPitchVel += 0.14;
          }
        }
      } else if (this.speedKmh < 22 && typeof this.gear === 'number' && this.gear > 1) {
        // Automatic anti-stall downshift to 1st gear at low speed in Manual mode
        this.gear = 1;
      }

      const gNum = typeof this.gear === 'number' ? this.gear : 1;
      const prevCeiling = gNum === 1 ? 0 : this.getGearTopSpeedMps(gNum - 1) * 0.62;
      const currCeiling = this.getGearTopSpeedMps(gNum);
      const span = Math.max(4, currCeiling - prevCeiling);

      let rawRpm = 0.22 + ((this.speedMps - prevCeiling) / span) * 0.76;
      // Add wheelspin flare in lower gears
      rawRpm += this.wheelspin * 0.18;

      // Rev limiter bounce at redline in Manual mode
      if (rawRpm >= 0.995) {
        rawRpm = 0.96 + (Math.sin(Date.now() * 0.08) * 0.03);
      }

      this.rpm = Math.max(0.14, Math.min(1.0, rawRpm));
      this.currentRpm = Math.round(idleRpm + this.rpm * (redline - idleRpm));
    }
  }

  window.HorizonPhysicsVehicle = HorizonPhysicsVehicle;
})();
