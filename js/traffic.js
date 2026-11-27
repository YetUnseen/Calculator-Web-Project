/* ==========================================================================
   HIGHWAY TRAFFIC SIMULATION — 11 VEHICLE TYPES, PERSONALITIES & WEATHER AI
   - Pure curvilinear (s, d) simulation; runs headless in Node.js or in 3D
   - IDM car-following + MOBIL lane-changing with fast-lane courtesy yielding
   - 11 realistic vehicle types (hatch, sedan, wagon, suv, coupe, pickup,
     van, taxi, semi-truck, coach bus, rare patrol cruiser)
   - Weather-aware spacing & speeds in Rain & Snow
   - Pre-maneuver amber blinkers, hazard flashers & smooth quintic glides
   ========================================================================== */

(function (root) {
  'use strict';

  const VehiclesMod =
    typeof window !== 'undefined' && window.HighwayVehicles
      ? window.HighwayVehicles
      : typeof require === 'function'
      ? require('./vehicles.js')
      : null;

  const ARCHETYPES = VehiclesMod
    ? VehiclesMod.ARCHETYPES
    : {
        hatchback: { id: 'hatchback', length: 4.10, width: 1.78, minSpeedKmh: 82, maxSpeedKmh: 118 },
        sedan: { id: 'sedan', length: 4.65, width: 1.84, minSpeedKmh: 88, maxSpeedKmh: 132 },
        wagon: { id: 'wagon', length: 4.78, width: 1.86, minSpeedKmh: 90, maxSpeedKmh: 134 },
        suv: { id: 'suv', length: 4.82, width: 1.94, minSpeedKmh: 86, maxSpeedKmh: 128 },
        coupe: { id: 'coupe', length: 4.55, width: 1.88, minSpeedKmh: 102, maxSpeedKmh: 142 },
        pickup: { id: 'pickup', length: 5.38, width: 2.00, minSpeedKmh: 78, maxSpeedKmh: 112 },
        van: { id: 'van', length: 6.35, width: 2.16, minSpeedKmh: 74, maxSpeedKmh: 98 },
        taxi: { id: 'taxi', length: 4.66, width: 1.84, minSpeedKmh: 86, maxSpeedKmh: 122 },
        semi: { id: 'semi', length: 12.20, width: 2.42, minSpeedKmh: 68, maxSpeedKmh: 90 },
        bus: { id: 'bus', length: 11.40, width: 2.45, minSpeedKmh: 72, maxSpeedKmh: 94 },
        police: { id: 'police', length: 4.74, width: 1.88, minSpeedKmh: 98, maxSpeedKmh: 132 }
      };

  const LANE_CENTERS = [-5.55, -1.85, 1.85, 5.55];
  const LANE_SPEED_BANDS_KMH = [
    [118, 138], // Lane 0: fast passing lane
    [104, 122], // Lane 1: brisk cruise
    [88, 108],  // Lane 2: moderate cruise
    [72, 92]    // Lane 3: heavy trucks, buses & slower cruisers
  ];

  const PERSONALITIES = {
    calm: { speedBiasKmh: -4, headway: 1.75, minGap: 7.8, accelScale: 0.88, decel: 2.3, politeness: 0.56, lcThreshold: 0.58 },
    commuter: { speedBiasKmh: 0, headway: 1.50, minGap: 6.8, accelScale: 1.00, decel: 2.7, politeness: 0.44, lcThreshold: 0.48 },
    brisk: { speedBiasKmh: 6, headway: 1.32, minGap: 6.0, accelScale: 1.15, decel: 3.1, politeness: 0.34, lcThreshold: 0.42 },
    spirited: { speedBiasKmh: 11, headway: 1.18, minGap: 5.4, accelScale: 1.28, decel: 3.4, politeness: 0.24, lcThreshold: 0.32 },
    heavy: { speedBiasKmh: -2, headway: 2.05, minGap: 9.5, accelScale: 0.68, decel: 2.1, politeness: 0.65, lcThreshold: 0.66 }
  };

  const KMH_TO_MS = 1 / 3.6;

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function createRng(seed) {
    let state = (seed >>> 0) || 190311;
    return function next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function getWeatherModifiers(weather) {
    if (!weather) {
      return { speedScale: 1.0, headwayScale: 1.0, accelScale: 1.0, decelScale: 1.0, lcScale: 1.0 };
    }
    if (weather.precip === 'snow') {
      return { speedScale: 0.76, headwayScale: 1.42, accelScale: 0.70, decelScale: 0.72, lcScale: 1.38 };
    }
    if (weather.precip === 'rain') {
      return { speedScale: 0.88, headwayScale: 1.22, accelScale: 0.85, decelScale: 0.85, lcScale: 1.15 };
    }
    return { speedScale: 1.0, headwayScale: 1.0, accelScale: 1.0, decelScale: 1.0, lcScale: 1.0 };
  }

  class HighwayTraffic {
    constructor(scene, env, options) {
      this.scene = scene || null;
      this.env = env || null;
      const opts = options || {};

      this.targetCount = opts.targetCount !== undefined ? opts.targetCount : 20;
      this.rng = opts.seed !== undefined ? createRng(opts.seed) : Math.random;
      this.castShadow = !!opts.castShadow;

      this.vehicles = [];
      this.nextId = 1;
      this.simTime = 0;

      this.laneBuckets = [[], [], [], []];

      this.stats = {
        spawned: 0,
        despawned: 0,
        laneChangesStarted: 0,
        laneChangesCompleted: 0,
        laneChangesAborted: 0,
        npcCollisions: 0,
        hornYields: 0
      };
    }

    pickArchetypeForLane(lane) {
      const r = this.rng();
      if (lane === 3) {
        if (r < 0.18) return 'semi';
        if (r < 0.26) return 'bus';
        if (r < 0.40) return 'van';
        if (r < 0.56) return 'pickup';
        if (r < 0.74) return 'hatchback';
        if (r < 0.84) return 'wagon';
        if (r < 0.92) return 'taxi';
        return 'suv';
      }
      if (lane === 2) {
        if (r < 0.05) return 'semi';
        if (r < 0.09) return 'bus';
        if (r < 0.15) return 'van';
        if (r < 0.25) return 'pickup';
        if (r < 0.42) return 'hatchback';
        if (r < 0.66) return 'sedan';
        if (r < 0.78) return 'wagon';
        if (r < 0.90) return 'suv';
        return 'taxi';
      }
      if (lane === 1) {
        if (r < 0.03) return 'police';
        if (r < 0.09) return 'pickup';
        if (r < 0.21) return 'hatchback';
        if (r < 0.50) return 'sedan';
        if (r < 0.65) return 'wagon';
        if (r < 0.82) return 'suv';
        if (r < 0.88) return 'taxi';
        return 'coupe';
      }
      // Lane 0 (fast passing lane)
      if (r < 0.04) return 'police';
      if (r < 0.36) return 'coupe';
      if (r < 0.72) return 'sedan';
      if (r < 0.86) return 'wagon';
      return 'suv';
    }

    pickPersonality(typeKey) {
      if (typeKey === 'semi' || typeKey === 'bus' || typeKey === 'van') return 'heavy';
      if (typeKey === 'coupe' || typeKey === 'police') {
        const r = this.rng();
        if (r < 0.32) return 'spirited';
        return r < 0.78 ? 'brisk' : 'commuter';
      }
      const r = this.rng();
      if (r < 0.24) return 'calm';
      if (r < 0.66) return 'commuter';
      if (r < 0.88) return 'brisk';
      return typeKey === 'sedan' || typeKey === 'suv' || typeKey === 'wagon' ? 'spirited' : 'brisk';
    }

    createNPC(s, lane, initialSpeedMs, forcedTypeKey) {
      const typeKey = forcedTypeKey || this.pickArchetypeForLane(lane);
      const spec = ARCHETYPES[typeKey] || ARCHETYPES.sedan;
      const personalityName = this.pickPersonality(typeKey);
      const pProfile = PERSONALITIES[personalityName];
      const band = LANE_SPEED_BANDS_KMH[lane];

      const randBandKmh = band[0] + this.rng() * (band[1] - band[0]);
      const clampedKmh = clamp(
        randBandKmh + pProfile.speedBiasKmh + (this.rng() - 0.5) * 5,
        spec.minSpeedKmh,
        spec.maxSpeedKmh
      );
      const desiredSpeed = clampedKmh * KMH_TO_MS;
      const laneOffsetBias = (this.rng() - 0.5) * 0.20;

      let preferredLane = lane;
      if (typeKey === 'semi' || typeKey === 'bus') {
        preferredLane = 3;
      } else if (typeKey === 'van' || typeKey === 'pickup') {
        preferredLane = this.rng() < 0.78 ? 3 : 2;
      } else if (typeKey === 'coupe' || typeKey === 'police') {
        preferredLane = this.rng() < 0.55 ? 1 : 2;
      } else {
        preferredLane = clamp(lane + (this.rng() < 0.38 ? 1 : 0), 1, 3);
      }

      let meshObj = null;
      if (this.scene && VehiclesMod && VehiclesMod.createVehicleMesh) {
        meshObj = VehiclesMod.createVehicleMesh({
          archetype: typeKey,
          color: VehiclesMod.pickColor(typeKey, this.rng),
          castShadow: this.castShadow
        });
        this.scene.add(meshObj.group);
      }

      const baseAccel = typeKey === 'coupe' ? 2.15 : typeKey === 'semi' ? 0.92 : typeKey === 'bus' ? 1.05 : typeKey === 'van' ? 1.25 : 1.55;

      const npc = {
        id: this.nextId++,
        isPlayer: false,
        typeKey,
        personality: personalityName,
        isHeavy: typeKey === 'semi' || typeKey === 'bus' || typeKey === 'van',
        length: spec.length,
        width: spec.width,
        s,
        d: LANE_CENTERS[lane] + laneOffsetBias,
        lane,
        preferredLane,
        laneOffsetBias,

        // Longitudinal IDM dynamics
        v: initialSpeedMs !== undefined ? initialSpeedMs : desiredSpeed,
        accel: 0,
        desiredSpeed,
        timeHeadway: pProfile.headway + (this.rng() - 0.5) * 0.25,
        minGap: pProfile.minGap + (this.rng() - 0.5) * 1.4,
        maxAccel: baseAccel * pProfile.accelScale + this.rng() * 0.25,
        comfortDecel: pProfile.decel + (this.rng() - 0.5) * 0.4,

        // MOBIL lane-changing traits
        politeness: pProfile.politeness + (this.rng() - 0.5) * 0.10,
        lcThreshold: pProfile.lcThreshold + (this.rng() - 0.5) * 0.10,
        decisionTimer: 0.25 + this.rng() * 0.85,
        laneChangeCooldown:
          personalityName === 'spirited' ? 3.5 + this.rng() * 5.5 : 5.0 + this.rng() * 10.0,
        passingBoostTimer: 0,

        // Lane-change state machine
        laneState: 'KEEP',
        targetLane: lane,
        signalTimer: 0,
        blinkerDir: 0,
        startD: LANE_CENTERS[lane] + laneOffsetBias,
        targetD: LANE_CENTERS[lane] + laneOffsetBias,
        changeElapsed: 0,
        changeDuration: 2.8,

        // Visuals & interaction
        yaw: 0,
        roll: 0,
        steerAngle: 0,
        bumpLatVel: 0,
        braking: false,
        collisionTimer: 0,
        hitCooldown: 0,
        hornUrgencyTimer: 0,
        hornYielding: false,
        glareAccum: 0,
        glareFlashTimer: 0,
        glareCooldown: 0,
        passedByPlayer: false,
        meshObj
      };

      this.vehicles.push(npc);
      this.stats.spawned++;
      return npc;
    }

    removeNPCAt(index) {
      const npc = this.vehicles[index];
      if (npc.meshObj && this.scene) {
        this.scene.remove(npc.meshObj.group);
      }
      this.vehicles.splice(index, 1);
      this.stats.despawned++;
    }

    reset(playerS, playerLane, weather) {
      for (let i = this.vehicles.length - 1; i >= 0; i--) {
        if (this.vehicles[i].meshObj && this.scene) {
          this.scene.remove(this.vehicles[i].meshObj.group);
        }
      }
      this.vehicles.length = 0;
      this.simTime = 0;
      this.stats = {
        spawned: 0,
        despawned: 0,
        laneChangesStarted: 0,
        laneChangesCompleted: 0,
        laneChangesAborted: 0,
        npcCollisions: 0,
        hornYields: 0
      };

      const pS = playerS || 0;
      const pLane = playerLane !== undefined ? playerLane : 2;
      const speedScale = getWeatherModifiers(weather).speedScale;

      const initialTarget = Math.min(this.targetCount, 17);
      let attempts = 0;
      while (this.vehicles.length < initialTarget && attempts < 160) {
        attempts++;
        const lane = Math.floor(this.rng() * 4);
        const minAhead = lane === pLane ? 115 : 48;
        const s = pS + minAhead + this.rng() * 425;
        this.trySpawnAt(s, lane, pS, true, speedScale);
      }
    }

    trySpawnAt(s, lane, playerS, ignoreSpeedMatch, weatherSpeedScale) {
      const typeKey = this.pickArchetypeForLane(lane);
      const spec = ARCHETYPES[typeKey] || ARCHETYPES.sedan;
      const halfNewL = spec.length * 0.5;
      const wScale = weatherSpeedScale !== undefined ? weatherSpeedScale : 1.0;

      let lanesOccupiedInSlice = 0;
      const laneOccupiedMask = [false, false, false, false];
      let nearestAhead = null;
      let nearestAheadDist = Infinity;

      for (let i = 0; i < this.vehicles.length; i++) {
        const other = this.vehicles[i];
        const absDs = Math.abs(other.s - s);
        const halfSum = other.length * 0.5 + halfNewL;

        if (absDs < halfSum + 22) {
          if (!laneOccupiedMask[other.lane]) {
            laneOccupiedMask[other.lane] = true;
            lanesOccupiedInSlice++;
          }
          if (other.laneState !== 'KEEP' && !laneOccupiedMask[other.targetLane]) {
            laneOccupiedMask[other.targetLane] = true;
            lanesOccupiedInSlice++;
          }
        }

        const inSameLane =
          other.lane === lane || (other.laneState !== 'KEEP' && other.targetLane === lane);
        if (inSameLane) {
          if (absDs < halfSum + 38) return null;
          if (other.s > s && other.s - s < nearestAheadDist) {
            nearestAheadDist = other.s - s;
            nearestAhead = other;
          }
        }
      }

      if (lanesOccupiedInSlice >= 3 && !laneOccupiedMask[lane]) {
        return null;
      }

      if (Math.abs(s - playerS) < halfNewL + 52) return null;

      const npc = this.createNPC(s, lane, undefined, typeKey);
      npc.v = npc.desiredSpeed * wScale;
      if (nearestAhead && nearestAheadDist < (ignoreSpeedMatch ? 85 : 95)) {
        npc.v = Math.min(npc.v, nearestAhead.v);
      }
      return npc;
    }

    computeIDMAccel(v, desiredSpeed, timeHeadway, minGap, maxAccel, comfortDecel, gap, leaderV) {
      const vRatio = Math.pow(Math.max(0, v) / Math.max(desiredSpeed, 1), 4);
      if (gap === null || gap > 220) {
        return maxAccel * (1 - vRatio);
      }
      const effGap = Math.max(0.35, gap);
      const dv = v - leaderV;
      const sStar =
        minGap +
        Math.max(0, v * timeHeadway + (v * dv) / (2 * Math.sqrt(maxAccel * comfortDecel)));
      const ratio = sStar / effGap;
      return clamp(maxAccel * (1 - vRatio - ratio * ratio), -8.8, maxAccel * 1.15);
    }

    rebuildLaneBuckets(player) {
      for (let l = 0; l < 4; l++) {
        this.laneBuckets[l].length = 0;
      }

      for (let i = 0; i < this.vehicles.length; i++) {
        const v = this.vehicles[i];
        this.laneBuckets[v.lane].push(v);
        if (v.laneState !== 'KEEP' && v.targetLane !== v.lane) {
          this.laneBuckets[v.targetLane].push(v);
        }
      }

      if (player) {
        const pWrap = {
          id: -1,
          isPlayer: true,
          s: player.s,
          d: player.d,
          v: Math.max(0, player.speed || 0),
          length: player.length || 4.58,
          width: player.width || 1.88
        };
        for (let l = 0; l < 4; l++) {
          if (Math.abs(player.d - LANE_CENTERS[l]) < 2.38) {
            this.laneBuckets[l].push(pWrap);
          }
        }
      }

      for (let l = 0; l < 4; l++) {
        this.laneBuckets[l].sort((a, b) => a.s - b.s);
      }
    }

    findNeighborsInLane(lane, s, length, selfId) {
      const list = this.laneBuckets[lane];
      let leader = null;
      let follower = null;

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item.id === selfId) continue;
        if (item.s >= s) {
          leader = item;
          break;
        }
        follower = item;
      }

      const halfSelf = length * 0.5;
      const gapAhead = leader ? leader.s - leader.length * 0.5 - (s + halfSelf) : null;
      const gapBehind = follower ? s - halfSelf - (follower.s + follower.length * 0.5) : null;

      return { leader, follower, gapAhead, gapBehind };
    }

    hasReservationConflict(targetLane, s, selfLength, selfId) {
      const halfL = (selfLength || 5.0) * 0.5;
      for (let i = 0; i < this.vehicles.length; i++) {
        const other = this.vehicles[i];
        if (other.id === selfId) continue;
        if (other.laneState !== 'KEEP' && other.targetLane === targetLane) {
          if (Math.abs(other.s - s) < halfL + other.length * 0.5 + 22) return true;
        }
      }
      return false;
    }

    evaluateLaneChange(npc, targetLane, aSelfCurr, weatherMod) {
      if (targetLane < 0 || targetLane > 3) return null;
      if (this.hasReservationConflict(targetLane, npc.s, npc.length, npc.id)) return null;

      // Heavy vehicles (semi, bus, van) stay out of the leftmost fast passing lane
      if (npc.isHeavy && targetLane === 0) return null;
      if ((npc.typeKey === 'semi' || npc.typeKey === 'bus') && targetLane === 1) return null;

      const { leader, follower, gapAhead, gapBehind } = this.findNeighborsInLane(
        targetLane,
        npc.s,
        npc.length,
        npc.id
      );

      const minFrontGap = Math.max(12.5, npc.v * 0.95 * weatherMod.headwayScale);
      if (gapAhead !== null && gapAhead < minFrontGap) return null;

      if (follower) {
        const minRearGap = Math.max(14.0, follower.v * 0.95 * weatherMod.headwayScale);
        if (gapBehind < minRearGap) return null;
        if (follower.v > npc.v) {
          const closingExtra = (follower.v - npc.v) * 3.1 + 12.0;
          if (gapBehind < closingExtra) return null;
        }
      }

      const effV0 = npc.desiredSpeed * weatherMod.speedScale;
      const effT = npc.timeHeadway * weatherMod.headwayScale;
      const effA = npc.maxAccel * weatherMod.accelScale;
      const effB = npc.comfortDecel * weatherMod.decelScale;

      const aSelfNew = this.computeIDMAccel(
        npc.v,
        effV0,
        effT,
        npc.minGap,
        effA,
        effB,
        gapAhead,
        leader ? leader.v : 0
      );

      let followerDecelPenalty = 0;
      if (follower) {
        const { leader: fCurrLeader, gapAhead: fOldGap } = this.findNeighborsInLane(
          targetLane,
          follower.s,
          follower.length,
          follower.id
        );
        const fT = (follower.timeHeadway || 1.4) * weatherMod.headwayScale;
        const fS0 = follower.minGap || 7.0;
        const fA = (follower.maxAccel || 1.8) * weatherMod.accelScale;
        const fB = (follower.comfortDecel || 2.6) * weatherMod.decelScale;
        const fV0 = (follower.desiredSpeed || Math.max(follower.v, 30)) * weatherMod.speedScale;

        const aFold = this.computeIDMAccel(
          follower.v,
          fV0,
          fT,
          fS0,
          fA,
          fB,
          fOldGap,
          fCurrLeader ? fCurrLeader.v : 0
        );
        const aFnew = this.computeIDMAccel(
          follower.v,
          fV0,
          fT,
          fS0,
          fA,
          fB,
          gapBehind,
          npc.v
        );

        if (aFnew < -2.0) return null;
        followerDecelPenalty = Math.max(0, aFold - aFnew);
      }

      const effThreshold = npc.lcThreshold * weatherMod.lcScale;
      const movingRight = targetLane > npc.lane;

      if (movingRight) {
        // Fast-lane courtesy yield if faster vehicle approaches behind in Lane 0 or 1
        let courtesyBonus = 0;
        if (npc.lane === 0 || npc.lane === 1) {
          const { follower: rearInCurr, gapBehind: rearGapCurr } = this.findNeighborsInLane(
            npc.lane,
            npc.s,
            npc.length,
            npc.id
          );
          if (rearInCurr && rearInCurr.v > npc.v + 4.0) {
            const dynRange = Math.min(130, 48 + Math.max(0, rearInCurr.v - npc.v) * 2.5);
            if (rearGapCurr < dynRange) {
              courtesyBonus = npc.lane === 0 ? 0.54 : 0.34;
            }
          }
        }

        const minRightAhead = courtesyBonus > 0 ? Math.max(24, npc.v * 1.15) : Math.max(52, npc.v * 2.3);
        if (gapAhead !== null && gapAhead < minRightAhead) return null;

        const rightBias = targetLane <= npc.preferredLane ? 0.34 : 0.16;
        const incentive =
          aSelfNew - aSelfCurr - npc.politeness * followerDecelPenalty + rightBias + courtesyBonus;
        if (incentive > effThreshold && aSelfNew > -0.25) {
          return incentive;
        }
        return null;
      } else {
        const { leader: currLeader, gapAhead: currGap } = this.findNeighborsInLane(
          npc.lane,
          npc.s,
          npc.length,
          npc.id
        );
        if (!currLeader || currGap > 95) return null;
        const impeded = currLeader.v < effV0 * 0.93 || currLeader.v < 12;
        if (!impeded) return null;

        const incentive = aSelfNew - aSelfCurr - npc.politeness * followerDecelPenalty;
        const threshold = currLeader.v < 8 && currGap < 55 ? 0.24 : effThreshold;
        if (incentive > threshold) {
          return incentive;
        }
        return null;
      }
    }

    isTargetLaneSafeToEnter(npc, weatherMod) {
      if (this.hasReservationConflict(npc.targetLane, npc.s, npc.length, npc.id)) return false;
      const { follower, gapAhead, gapBehind } = this.findNeighborsInLane(
        npc.targetLane,
        npc.s,
        npc.length,
        npc.id
      );
      if (gapAhead !== null && gapAhead < Math.max(10.5, npc.v * 0.85 * weatherMod.headwayScale)) {
        return false;
      }
      if (follower) {
        if (gapBehind < Math.max(12.0, follower.v * 0.85 * weatherMod.headwayScale)) return false;
        if (follower.v > npc.v && gapBehind < (follower.v - npc.v) * 2.6 + 10.0) return false;
      }
      return true;
    }

    isYieldLaneSafe(npc, targetLane, weatherMod) {
      if (targetLane < 0 || targetLane > 3) return false;
      if (this.hasReservationConflict(targetLane, npc.s, npc.length, npc.id)) return false;
      const { follower, gapAhead, gapBehind } = this.findNeighborsInLane(
        targetLane,
        npc.s,
        npc.length,
        npc.id
      );
      if (gapAhead !== null && gapAhead < Math.max(8.5, npc.v * 0.65 * weatherMod.headwayScale)) {
        return false;
      }
      if (follower) {
        if (gapBehind < Math.max(9.0, follower.v * 0.65 * weatherMod.headwayScale)) return false;
        if (follower.v > npc.v + 1 && gapBehind < (follower.v - npc.v) * 1.9 + 8.0) return false;
      }
      return true;
    }

    triggerHornYield(player, maxRange) {
      if (!player) return null;
      let closest = null;
      let minDs = Infinity;
      const range = maxRange || 95;
      const playerS = player.s || 0;
      const playerD = player.d || 0;
      for (let i = 0; i < this.vehicles.length; i++) {
        const npc = this.vehicles[i];
        const ds = npc.s - playerS;
        const dd = Math.abs(npc.d - playerD);
        if (dd < 2.25 && ds >= 4 && ds <= range && ds < minDs) {
          minDs = ds;
          closest = npc;
        }
      }
      if (closest) {
        closest.hornUrgencyTimer = 3.5;
      }
      return closest;
    }

    getBlindSpotState(player) {
      if (!player) return { left: false, right: false, leftClose: false, rightClose: false };
      let left = false;
      let right = false;
      let leftClose = false;
      let rightClose = false;
      const ps = player.s || 0;
      const pd = player.d || 0;
      for (let i = 0; i < this.vehicles.length; i++) {
        const npc = this.vehicles[i];
        const ds = npc.s - ps;
        const halfL = (npc.length || 4.6) * 0.5;
        if (ds > -(halfL + 8.5) && ds < halfL + 3.2) {
          const dd = npc.d - pd;
          if (dd < -2.1 && dd > -5.4) {
            left = true;
            if (Math.abs(ds) < 4.5) leftClose = true;
          } else if (dd > 2.1 && dd < 5.4) {
            right = true;
            if (Math.abs(ds) < 4.5) rightClose = true;
          }
        }
      }
      return { left, right, leftClose, rightClose };
    }

    onPlayerCollision(npc, impactSpeedMs, pushLateral) {
      npc.collisionTimer = 0.95;
      npc.hitCooldown = 0.5;
      npc.hornYielding = false;
      npc.hornUrgencyTimer = 0;
      npc.v = Math.max(4, npc.v - Math.min(10, impactSpeedMs * 0.35));
      npc.accel = -3.0;
      if (pushLateral) {
        npc.bumpLatVel = clamp(pushLateral * 3.0, -1.8, 1.8);
      }
      if (npc.laneState === 'SIGNALING' || npc.laneState === 'CHANGING') {
        if (npc.laneState === 'CHANGING') {
          const approxD = npc.d + (pushLateral || 0);
          let bestLane = npc.lane;
          let bestDist = Infinity;
          for (let l = 0; l < LANE_CENTERS.length; l++) {
            const dist = Math.abs(approxD - LANE_CENTERS[l]);
            if (dist < bestDist) {
              bestDist = dist;
              bestLane = l;
            }
          }
          npc.lane = bestLane;
          npc.targetLane = bestLane;
        }
        npc.laneState = 'KEEP';
        npc.blinkerDir = 0;
        npc.yaw = 0;
        npc.roll = 0;
        npc.laneChangeCooldown = 5.0;
      }
    }

    step(dt, player, headlightStrength, weather, hornActive, highBeamsActive) {
      if (!dt || dt <= 0) return;
      const clampedDt = Math.min(dt, 0.05);
      this.simTime += clampedDt;

      const weatherMod = getWeatherModifiers(weather);
      const playerS = player ? player.s : 0;
      const playerV = player ? Math.max(0, player.speed || 0) : 0;

      // 1. Despawn out-of-range NPCs cleanly beyond fog/behind camera
      for (let i = this.vehicles.length - 1; i >= 0; i--) {
        const ds = this.vehicles[i].s - playerS;
        if (ds < -145 || ds > 590) {
          this.removeNPCAt(i);
        }
      }

      // 2. Top up traffic ahead (or behind when driving slowly/stopped)
      let spawnTries = 0;
      while (this.vehicles.length < this.targetCount && spawnTries < 12) {
        spawnTries++;
        const lane = Math.floor(this.rng() * 4);
        const spawnBehind = playerV < 22 && this.rng() < 0.25;
        const s = spawnBehind
          ? playerS - 115 - this.rng() * 28
          : playerS + 445 + this.rng() * 105;
        this.trySpawnAt(s, lane, playerS, false, weatherMod.speedScale);
      }

      // 3. Build sorted lane neighbor tables
      this.rebuildLaneBuckets(player);

      // Break up 4-lane rolling roadblocks ahead of player so there's always an overtake pocket
      if (player) {
        let minClusterS = Infinity;
        let maxClusterS = -Infinity;
        let lane0Front = null;
        let allLanesBlocked = true;
        for (let l = 0; l < 4; l++) {
          const list = this.laneBuckets[l];
          let firstAhead = null;
          for (let j = 0; j < list.length; j++) {
            const item = list[j];
            if (!item.isPlayer && item.s - playerS > 18 && item.s - playerS < 210) {
              firstAhead = item;
              break;
            }
          }
          if (!firstAhead) {
            allLanesBlocked = false;
            break;
          }
          if (firstAhead.s < minClusterS) minClusterS = firstAhead.s;
          if (firstAhead.s > maxClusterS) maxClusterS = firstAhead.s;
          if (l === 0) lane0Front = firstAhead;
        }
        if (allLanesBlocked && lane0Front && maxClusterS - minClusterS < 20) {
          lane0Front.passingBoostTimer = 3.0;
        }
      }

      if ((hornActive || highBeamsActive) && player) {
        this.triggerHornYield(player, highBeamsActive ? 130 : 95);
      }

      // 4. Longitudinal IDM + Lateral MOBIL update per NPC
      const blinkOn = Math.floor(this.simTime * 2.7) % 2 === 0;
      const hlStrength = headlightStrength !== undefined ? headlightStrength : 0.1;

      for (let i = 0; i < this.vehicles.length; i++) {
        const npc = this.vehicles[i];
        if (npc.hitCooldown > 0) npc.hitCooldown = Math.max(0, npc.hitCooldown - clampedDt);
        if (npc.collisionTimer > 0) npc.collisionTimer = Math.max(0, npc.collisionTimer - clampedDt);
        if (npc.hornUrgencyTimer > 0) npc.hornUrgencyTimer = Math.max(0, npc.hornUrgencyTimer - clampedDt);
        if (npc.glareFlashTimer > 0) npc.glareFlashTimer = Math.max(0, npc.glareFlashTimer - clampedDt);
        if (npc.glareCooldown > 0) npc.glareCooldown = Math.max(0, npc.glareCooldown - clampedDt);
        if (npc.passingBoostTimer > 0) npc.passingBoostTimer = Math.max(0, npc.passingBoostTimer - clampedDt);
        if (npc.laneChangeCooldown > 0) {
          npc.laneChangeCooldown = Math.max(0, npc.laneChangeCooldown - clampedDt);
        }

        const dsPlayer = npc.s - playerS;
        const ddPlayer = player ? Math.abs(npc.d - player.d) : 99;
        const isNightWeather = !!(weather && weather.isNight);
        if (highBeamsActive && player && ddPlayer < 2.25 && dsPlayer >= 7 && dsPlayer <= 65) {
          npc.glareAccum = (npc.glareAccum || 0) + clampedDt * (isNightWeather ? 1.25 : 0.75);
          if (npc.glareAccum >= 1.05 && (npc.glareCooldown || 0) <= 0) {
            npc.glareFlashTimer = 0.78;
            npc.glareCooldown = 6.5;
            npc.glareAccum = 0;
          }
        } else if (npc.glareAccum > 0) {
          npc.glareAccum = Math.max(0, npc.glareAccum - clampedDt * 1.4);
        }

        const boostV = npc.passingBoostTimer > 0 ? 1.18 : 1.0;
        const boostA = npc.passingBoostTimer > 0 ? 1.35 : 1.0;
        const effV0 = npc.desiredSpeed * weatherMod.speedScale * boostV;
        const effT = npc.timeHeadway * weatherMod.headwayScale;
        const effA = npc.maxAccel * weatherMod.accelScale * boostA;
        const effB = npc.comfortDecel * weatherMod.decelScale;

        const { leader: l1, gapAhead: g1 } = this.findNeighborsInLane(
          npc.lane,
          npc.s,
          npc.length,
          npc.id
        );
        let targetAccel = this.computeIDMAccel(
          npc.v,
          effV0,
          effT,
          npc.minGap,
          effA,
          effB,
          g1,
          l1 ? l1.v : 0
        );

        let effectiveLeader = l1;
        let effectiveGap = g1;

        if (npc.laneState !== 'KEEP' && npc.targetLane !== npc.lane) {
          const { leader: l2, gapAhead: g2 } = this.findNeighborsInLane(
            npc.targetLane,
            npc.s,
            npc.length,
            npc.id
          );
          const a2 = this.computeIDMAccel(
            npc.v,
            effV0,
            effT,
            npc.minGap,
            effA,
            effB,
            g2,
            l2 ? l2.v : 0
          );
          if (a2 < targetAccel) targetAccel = a2;
          if (g2 !== null && (effectiveGap === null || g2 < effectiveGap)) {
            effectiveGap = g2;
            effectiveLeader = l2;
          }
        }

        // Jerk limiting
        const urgentClosing =
          effectiveGap !== null &&
          effectiveGap < Math.max(7.0, npc.v * 0.5) &&
          effectiveLeader &&
          npc.v > effectiveLeader.v + 1.5;
        const maxJerkUp = 3.2 * weatherMod.accelScale;
        const maxJerkDown = urgentClosing ? 14.0 : 4.4;

        const dAccel = targetAccel - npc.accel;
        if (dAccel > 0) {
          npc.accel += Math.min(dAccel, maxJerkUp * clampedDt);
        } else {
          npc.accel += Math.max(dAccel, -maxJerkDown * clampedDt);
        }

        if (npc.collisionTimer > 0) {
          npc.accel = Math.min(npc.accel, -1.5);
        }

        npc.v = Math.max(0, npc.v + npc.accel * clampedDt);
        npc.s += npc.v * clampedDt;

        // Safety separation floor against NPC leaders
        if (effectiveLeader && !effectiveLeader.isPlayer && effectiveGap !== null) {
          const minPhysicalS =
            effectiveLeader.s - (effectiveLeader.length + npc.length) * 0.5 - 0.8;
          if (npc.s > minPhysicalS) {
            npc.s = minPhysicalS;
            npc.v = Math.min(npc.v, effectiveLeader.v * 0.96);
            npc.accel = Math.min(npc.accel, -3.5);
            this.stats.npcCollisions++;
          }
        }

        // Brake light hysteresis
        if (npc.accel < -1.15) {
          npc.braking = true;
        } else if (npc.accel > -0.55) {
          npc.braking = false;
        }

        // MOBIL Lane-change state machine
        const dsFromPlayer = npc.s - playerS;
        if (npc.laneState === 'KEEP') {
          npc.decisionTimer -= clampedDt;
          npc.yaw *= Math.max(0, 1 - 8 * clampedDt);
          npc.roll *= Math.max(0, 1 - 8 * clampedDt);
          npc.steerAngle *= Math.max(0, 1 - 8 * clampedDt);

          if (Math.abs(npc.bumpLatVel) > 0.01) {
            npc.d = clamp(npc.d + npc.bumpLatVel * clampedDt, -6.8, 6.8);
            npc.bumpLatVel *= Math.max(0, 1 - 5.5 * clampedDt);
          } else {
            const desiredD = LANE_CENTERS[npc.lane] + npc.laneOffsetBias;
            npc.d += (desiredD - npc.d) * Math.min(1, 2.4 * clampedDt);
          }

          if (npc.hornUrgencyTimer > 0 && npc.v > 5) {
            const minLane =
              npc.typeKey === 'semi' || npc.typeKey === 'bus' ? 2 : npc.isHeavy ? 1 : 0;
            const candidates = [npc.lane + 1, npc.lane - 1].filter(
              (l) => l >= minLane && l <= 3
            );
            let yieldLane = -1;
            for (let c = 0; c < candidates.length; c++) {
              if (this.isYieldLaneSafe(npc, candidates[c], weatherMod)) {
                yieldLane = candidates[c];
                break;
              }
            }
            if (yieldLane !== -1) {
              npc.laneState = 'SIGNALING';
              npc.targetLane = yieldLane;
              npc.signalTimer = 0.28;
              npc.blinkerDir = yieldLane < npc.lane ? -1 : 1;
              npc.hornYielding = true;
              npc.hornUrgencyTimer = 0;
              npc.laneChangeCooldown = 0;
              this.stats.laneChangesStarted++;
              this.stats.hornYields++;
            }
          }

          if (
            npc.laneState === 'KEEP' &&
            npc.decisionTimer <= 0 &&
            npc.laneChangeCooldown <= 0 &&
            npc.v > 9 &&
            dsFromPlayer > -70 &&
            dsFromPlayer < 430
          ) {
            npc.decisionTimer = 0.45 + this.rng() * 0.45;
            const leftScore = this.evaluateLaneChange(npc, npc.lane - 1, targetAccel, weatherMod);
            const rightScore =
              leftScore === null
                ? this.evaluateLaneChange(npc, npc.lane + 1, targetAccel, weatherMod)
                : null;

            const chosenLane =
              leftScore !== null ? npc.lane - 1 : rightScore !== null ? npc.lane + 1 : -1;

            if (chosenLane !== -1) {
              npc.laneState = 'SIGNALING';
              npc.targetLane = chosenLane;
              npc.signalTimer = 0.72 + this.rng() * 0.25;
              npc.blinkerDir = chosenLane < npc.lane ? -1 : 1;
              this.stats.laneChangesStarted++;
            }
          }
        } else if (npc.laneState === 'SIGNALING') {
          npc.signalTimer -= clampedDt;
          const safeToEnter = npc.hornYielding
            ? this.isYieldLaneSafe(npc, npc.targetLane, weatherMod)
            : this.isTargetLaneSafeToEnter(npc, weatherMod);
          if (!safeToEnter) {
            npc.laneState = 'KEEP';
            npc.targetLane = npc.lane;
            npc.blinkerDir = 0;
            npc.hornYielding = false;
            npc.decisionTimer = 1.1;
            npc.laneChangeCooldown = 2.0;
            this.stats.laneChangesAborted++;
          } else if (npc.signalTimer <= 0) {
            npc.laneState = 'CHANGING';
            npc.startD = npc.d;
            npc.targetD = LANE_CENTERS[npc.targetLane] + npc.laneOffsetBias;
            npc.changeElapsed = 0;
            npc.changeDuration = npc.hornYielding
              ? npc.isHeavy
                ? 2.4
                : 1.75
              : npc.isHeavy
              ? 3.5 + this.rng() * 0.8
              : 2.55 + this.rng() * 0.75;
          }
        } else if (npc.laneState === 'CHANGING') {
          npc.changeElapsed += clampedDt;
          const u = clamp(npc.changeElapsed / npc.changeDuration, 0, 1);
          const q = u * u * u * (10 + u * (-15 + 6 * u));
          const dq = 30 * u * u * (1 - u) * (1 - u);

          npc.d = npc.startD + (npc.targetD - npc.startD) * q;
          const vd = ((npc.targetD - npc.startD) / npc.changeDuration) * dq;
          npc.yaw = Math.atan2(vd, Math.max(npc.v, 6));
          npc.steerAngle = clamp(npc.yaw * 1.4, -0.18, 0.18);
          npc.roll = clamp(vd * 0.014, -0.024, 0.024);

          if (u > 0.85) {
            npc.blinkerDir = 0;
          }
          if (u >= 1.0) {
            npc.lane = npc.targetLane;
            npc.d = npc.targetD;
            npc.laneState = 'KEEP';
            npc.yaw = 0;
            npc.steerAngle = 0;
            npc.roll = 0;
            npc.blinkerDir = 0;
            npc.hornYielding = false;
            npc.laneChangeCooldown = 9.5 + this.rng() * 9.0;
            npc.decisionTimer = 0.7;
            this.stats.laneChangesCompleted++;
          }
        }

        // Update 3D mesh transform, blinkers, hazards & special patrol lights
        if (npc.meshObj && this.env) {
          const p = this.env.project(npc.s, npc.d, null, 0);
          const group = npc.meshObj.group;
          const visible = dsFromPlayer > -135 && dsFromPlayer < 575;
          group.visible = visible;
          if (visible) {
            group.position.set(p.x, p.y, p.z);
            group.rotation.set(p.pitch, -(p.yaw + npc.yaw), 0);
            npc.meshObj.setBodyTilt(clamp(npc.accel * 0.009, -0.032, 0.026), npc.roll);
            npc.meshObj.updateWheels(npc.v, clampedDt, npc.steerAngle);
            const glareTapBrake = npc.glareFlashTimer > 0.58;
            npc.meshObj.setBraking(npc.braking || glareTapBrake);

            const glareBlink = Math.floor(this.simTime * 5.2) % 2 === 0;
            const hazard =
              npc.laneState === 'KEEP' &&
              (npc.collisionTimer > 0 || npc.accel < -4.5 || npc.glareFlashTimer > 0);
            npc.meshObj.setBlinker(
              hazard ? 2 : npc.blinkerDir,
              npc.glareFlashTimer > 0 ? glareBlink : blinkOn
            );
            npc.meshObj.setHeadlights(hlStrength);
            if (npc.meshObj.updateSpecialLights) {
              npc.meshObj.updateSpecialLights(this.simTime);
            }
          }
        }
      }
    }

    getTelemetry() {
      const perLaneCounts = [0, 0, 0, 0];
      const perLaneSpeedSum = [0, 0, 0, 0];
      const typeCounts = {};
      let minSameLaneGap = Infinity;

      this.rebuildLaneBuckets(null);
      for (let l = 0; l < 4; l++) {
        const list = this.laneBuckets[l];
        for (let i = 0; i < list.length; i++) {
          const v = list[i];
          if (v.lane === l) {
            perLaneCounts[l]++;
            perLaneSpeedSum[l] += v.v * 3.6;
            typeCounts[v.typeKey] = (typeCounts[v.typeKey] || 0) + 1;
          }
          if (i > 0) {
            const prev = list[i - 1];
            const gap = v.s - v.length * 0.5 - (prev.s + prev.length * 0.5);
            if (gap < minSameLaneGap) minSameLaneGap = gap;
          }
        }
      }

      const avgSpeedByLaneKmh = perLaneCounts.map((c, idx) =>
        c > 0 ? Math.round((perLaneSpeedSum[idx] / c) * 10) / 10 : null
      );

      return {
        activeCount: this.vehicles.length,
        avgSpeedByLaneKmh,
        typeCounts,
        minSameLaneGap: minSameLaneGap === Infinity ? null : Math.round(minSameLaneGap * 100) / 100,
        stats: Object.assign({}, this.stats)
      };
    }
  }

  const api = {
    HighwayTraffic,
    LANE_CENTERS,
    LANE_SPEED_BANDS_KMH,
    PERSONALITIES
  };

  if (typeof window !== 'undefined') {
    window.HighwayTraffic = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root && (typeof window === 'undefined' || root !== window)) {
    root.HighwayTraffic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
