/* ==========================================================================
   HIGHWAY ECONOMY — CURRENCY, GARAGE CATALOG, UPGRADES & PERSISTENCE
   - Earn $ from distance driven, speed, clean passes, weather & clean streak
   - 6 Purchasable Player Cars + 5 Upgrade Categories (Levels 0-4) + Paints
   - Persisted cleanly via localStorage (safe no-op in headless Node tests)
   ========================================================================== */

(function (root) {
  'use strict';

  const STORAGE_KEY = 'highway_drive_save_v1';
  const TRANSMISSION_MODES = ['AUTO', 'SEMI', 'MANUAL'];
  const GAUGE_STYLES = ['digital', 'analog'];

  const PLAYER_CARS = [
    {
      id: 'starter_hatch',
      name: 'Civic Touring',
      category: 'Compact',
      price: 0,
      archetype: 'hatchback',
      baseTopSpeedKmh: 192,
      baseAccel: 5.5,
      baseBrake: 14.5,
      baseGrip: 1.00,
      weatherGrip: 1.00,
      durability: 1.00,
      engineTone: 'i4',
      turboLevel: 0.55,
      defaultColor: 0xcbd5e1,
      desc: 'Dependable daily compact hatchback. Light, nimble, and easy to place in traffic.'
    },
    {
      id: 'sport_sedan',
      name: 'Apex GT Sedan',
      category: 'Sport Sedan',
      price: 3500,
      archetype: 'player_gt',
      baseTopSpeedKmh: 215,
      baseAccel: 6.5,
      baseBrake: 15.8,
      baseGrip: 1.06,
      weatherGrip: 1.02,
      durability: 1.05,
      engineTone: 'i6',
      turboLevel: 0.78,
      defaultColor: 0x2563eb,
      desc: 'Balanced twin-scroll inline-6 grand tourer with crisp highway poise.'
    },
    {
      id: 'awd_wagon',
      name: 'Nordic Touring RS',
      category: 'All-Weather AWD',
      price: 7500,
      archetype: 'wagon',
      baseTopSpeedKmh: 230,
      baseAccel: 7.3,
      baseBrake: 16.5,
      baseGrip: 1.12,
      weatherGrip: 1.24,
      durability: 1.18,
      engineTone: 't5',
      turboLevel: 0.92,
      defaultColor: 0x0f766e,
      desc: 'Turbo 5-cylinder AWD estate built to stay planted in heavy rain and snow.'
    },
    {
      id: 'm_coupe',
      name: 'Bavaria Sport Coupe',
      category: 'Performance Coupe',
      price: 14000,
      archetype: 'coupe',
      baseTopSpeedKmh: 258,
      baseAccel: 8.6,
      baseBrake: 17.8,
      baseGrip: 1.15,
      weatherGrip: 1.04,
      durability: 1.05,
      engineTone: 'i6_high',
      turboLevel: 0.80,
      defaultColor: 0xb91c1c,
      desc: 'High-revving straight-six coupe with razor-sharp lane-change authority.'
    },
    {
      id: 'gt_v8',
      name: 'Valkyrie GT V8',
      category: 'Grand Tourer',
      price: 26000,
      archetype: 'gt_v8',
      baseTopSpeedKmh: 282,
      baseAccel: 9.8,
      baseBrake: 19.0,
      baseGrip: 1.18,
      weatherGrip: 1.06,
      durability: 1.12,
      engineTone: 'v8',
      turboLevel: 0.95,
      defaultColor: 0x334155,
      desc: 'Muscular twin-turbo V8 long-distance cruiser with effortless overtaking punch.'
    },
    {
      id: 'hyper_gt',
      name: 'Hyperion Stradale',
      category: 'Supercar',
      price: 48000,
      archetype: 'supercar',
      baseTopSpeedKmh: 315,
      baseAccel: 11.2,
      baseBrake: 20.6,
      baseGrip: 1.24,
      weatherGrip: 1.08,
      durability: 1.10,
      engineTone: 'v10',
      turboLevel: 0.88,
      defaultColor: 0xf59e0b,
      desc: 'Mid-engine V10 flagship with carbon aero stability and relentless top-end pull.'
    },
    {
      id: 'jdm_coupe',
      name: 'Skyline R-Spec',
      category: 'Turbo Tuner',
      price: 10500,
      archetype: 'jdm_coupe',
      baseTopSpeedKmh: 245,
      baseAccel: 8.1,
      baseBrake: 17.2,
      baseGrip: 1.15,
      weatherGrip: 1.12,
      durability: 1.10,
      engineTone: 'i6_high',
      turboLevel: 1.02,
      defaultColor: 0x1d4ed8,
      desc: 'Twin-turbo inline-6 AWD icon with fierce boost response and sharp lane precision.'
    },
    {
      id: 'muscle_v8',
      name: 'Titan V8 Muscle',
      category: 'Muscle V8',
      price: 19500,
      archetype: 'muscle',
      baseTopSpeedKmh: 268,
      baseAccel: 9.2,
      baseBrake: 18.2,
      baseGrip: 1.13,
      weatherGrip: 1.02,
      durability: 1.20,
      engineTone: 'v8',
      turboLevel: 0.72,
      defaultColor: 0xea580c,
      desc: 'Supercharged V8 fastback with brutal low-end torque and heavy highway presence.'
    },
    {
      id: 'patrol_v8',
      name: 'Interceptor Patrol',
      category: 'Pursuit Unit',
      price: 32000,
      archetype: 'police',
      baseTopSpeedKmh: 290,
      baseAccel: 10.1,
      baseBrake: 19.4,
      baseGrip: 1.19,
      weatherGrip: 1.16,
      durability: 1.28,
      engineTone: 'v8',
      turboLevel: 0.88,
      defaultColor: 0x111827,
      desc: 'Pursuit-spec highway interceptor with reinforced chassis and live emergency lightbar.'
    },
    {
      id: 'aether_hyper',
      name: 'Aether RS Hyper',
      category: 'Hypercar',
      price: 85000,
      archetype: 'hypercar',
      baseTopSpeedKmh: 341,
      baseAccel: 12.2,
      baseBrake: 22.0,
      baseGrip: 1.28,
      weatherGrip: 1.10,
      durability: 1.12,
      engineTone: 'v10',
      turboLevel: 1.10,
      defaultColor: 0xf8fafc,
      desc: 'Extreme twin-turbo V10 hypercar capable of 430 km/h with full factory upgrades.'
    }
  ];

  const UPGRADE_DEFS = {
    engine: {
      key: 'engine',
      label: 'Engine Tune',
      costs: [0, 650, 1600, 3400, 6800],
      effectText: '+6% Accel & +4.5% Top Speed per level'
    },
    turbo: {
      key: 'turbo',
      label: 'Twin-Turbo Kit',
      costs: [0, 750, 1800, 3800, 7500],
      effectText: '+4% Accel, +2% Top Speed & faster spool'
    },
    brakes: {
      key: 'brakes',
      label: 'Carbon Brakes',
      costs: [0, 500, 1250, 2600, 5200],
      effectText: '+8% Braking & wet/snow stop control'
    },
    tires: {
      key: 'tires',
      label: 'All-Season Tires',
      costs: [0, 550, 1400, 2900, 5800],
      effectText: '+6% Grip & +9% Rain/Snow traction'
    },
    aero: {
      key: 'aero',
      label: 'Aero & Suspension',
      costs: [0, 550, 1450, 3100, 6200],
      effectText: '+5% High-speed grip & reduced body roll'
    },
    transmission: {
      key: 'transmission',
      label: 'Drivetrain & Gearbox',
      costs: [0, 600, 1500, 3100, 6200],
      effectText: 'Faster shifts & 7/8-speed close ratios'
    },
    chassis: {
      key: 'chassis',
      label: 'Reinforced Chassis',
      costs: [0, 450, 1150, 2400, 4800],
      effectText: '-11% Impact damage & scrape speed loss'
    }
  };

  const PAINT_SWATCHES = [
    { name: 'Glacier White', hex: 0xf1f5f9 },
    { name: 'Liquid Silver', hex: 0xcbd5e1 },
    { name: 'Cobalt Blue', hex: 0x2563eb },
    { name: 'Electric Cyan', hex: 0x06b6d4 },
    { name: 'Crimson Red', hex: 0xb91c1c },
    { name: 'Solar Orange', hex: 0xea580c },
    { name: 'Sunset Amber', hex: 0xf59e0b },
    { name: 'Emerald Sage', hex: 0x0f766e },
    { name: 'Racing Green', hex: 0x15803d },
    { name: 'Royal Violet', hex: 0x7c3aed },
    { name: 'Gunmetal Gray', hex: 0x334155 },
    { name: 'Midnight Black', hex: 0x181c24 }
  ];

  const RIM_STYLES = [
    { id: 'silver', label: 'Alloy Silver', hex: 0xd0d7e2 },
    { id: 'black', label: 'Gloss Black', hex: 0x161920 },
    { id: 'bronze', label: 'Satin Bronze', hex: 0xa17449 },
    { id: 'gunmetal', label: 'Gunmetal', hex: 0x475569 },
    { id: 'white', label: 'Rally White', hex: 0xf1f5f9 }
  ];

  const SPOILER_STYLES = [
    { id: 'stock', label: 'Factory' },
    { id: 'lip', label: 'Carbon Lip' },
    { id: 'street', label: 'Street Wing' },
    { id: 'gt', label: 'GT Carbon Wing' }
  ];

  const TINT_STYLES = [
    { id: 'light', label: 'Factory Glass', hex: 0x1e293b, roughness: 0.12 },
    { id: 'smoke', label: 'Dark Smoke', hex: 0x090d14, roughness: 0.08 },
    { id: 'limo', label: 'Limo Black', hex: 0x04060a, roughness: 0.06 },
    { id: 'cobalt', label: 'Cobalt Tint', hex: 0x0f2547, roughness: 0.10 }
  ];

  const STRIPE_STYLES = [
    { id: 'none', label: 'Clean', hex: null },
    { id: 'white', label: 'White Racing', hex: 0xf8fafc },
    { id: 'black', label: 'Stealth Black', hex: 0x14171f },
    { id: 'red', label: 'Track Red', hex: 0xdc2626 }
  ];

  const UNDERGLOW_STYLES = [
    { id: 'none', label: 'Off', hex: null },
    { id: 'cyan', label: 'Electric Cyan', hex: 0x22d3ee },
    { id: 'red', label: 'Crimson', hex: 0xef4444 },
    { id: 'green', label: 'Toxic Green', hex: 0x22c55e },
    { id: 'violet', label: 'Neon Violet', hex: 0xa855f7 },
    { id: 'amber', label: 'Gold Amber', hex: 0xf59e0b }
  ];

  const CUSTOM_VALIDATORS = {
    rim: RIM_STYLES,
    spoiler: SPOILER_STYLES,
    tint: TINT_STYLES,
    stripe: STRIPE_STYLES,
    underglow: UNDERGLOW_STYLES
  };

  const MAX_UPGRADE_LEVEL = 4;

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function makeDefaultUpgrades() {
    return { engine: 0, turbo: 0, brakes: 0, tires: 0, aero: 0, transmission: 0, chassis: 0 };
  }

  function makeDefaultCustom() {
    return { rim: 'silver', spoiler: 'stock', tint: 'light', stripe: 'none', underglow: 'none' };
  }

  function sanitizeCustom(raw) {
    const def = makeDefaultCustom();
    if (!raw || typeof raw !== 'object') return def;
    const out = {};
    for (const key of Object.keys(def)) {
      const list = CUSTOM_VALIDATORS[key];
      const val = raw[key];
      out[key] = list && list.some((item) => item.id === val) ? val : def[key];
    }
    return out;
  }

  class HighwayEconomy {
    constructor(options) {
      const opts = options || {};
      this.disableStorage = !!opts.disableStorage;
      this.state = this.createDefaultState();
      if (!this.disableStorage) {
        this.load();
      }
      this.sessionEarned = 0;
      this.streakMult = 1.0;
      this.cleanMeters = 0;
      this.cleanPasses = 0;
    }

    createDefaultState() {
      const starter = PLAYER_CARS[0];
      return {
        bank: 0,
        activeCarId: starter.id,
        ownedCars: [starter.id],
        carUpgrades: {
          [starter.id]: makeDefaultUpgrades()
        },
        carPaints: {
          [starter.id]: starter.defaultColor
        },
        carCustom: {
          [starter.id]: makeDefaultCustom()
        },
        transmissionMode: 'AUTO',
        gaugeStyle: 'digital',
        totalDistanceKm: 0
      };
    }

    load() {
      if (this.disableStorage || typeof localStorage === 'undefined') return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;

        const def = this.createDefaultState();
        this.state.bank = typeof parsed.bank === 'number' && isFinite(parsed.bank) && parsed.bank >= 0
          ? parsed.bank
          : def.bank;

        if (Array.isArray(parsed.ownedCars) && parsed.ownedCars.length > 0) {
          const validIds = new Set(PLAYER_CARS.map((c) => c.id));
          const filtered = parsed.ownedCars.filter((id) => validIds.has(id));
          if (!filtered.includes(PLAYER_CARS[0].id)) filtered.unshift(PLAYER_CARS[0].id);
          this.state.ownedCars = Array.from(new Set(filtered));
        }

        if (this.state.ownedCars.includes(parsed.activeCarId)) {
          this.state.activeCarId = parsed.activeCarId;
        }

        if (parsed.carUpgrades && typeof parsed.carUpgrades === 'object') {
          for (const carId of this.state.ownedCars) {
            const u = parsed.carUpgrades[carId] || {};
            this.state.carUpgrades[carId] = {
              engine: clamp(Math.floor(u.engine || 0), 0, MAX_UPGRADE_LEVEL),
              turbo: clamp(Math.floor(u.turbo || 0), 0, MAX_UPGRADE_LEVEL),
              brakes: clamp(Math.floor(u.brakes || 0), 0, MAX_UPGRADE_LEVEL),
              tires: clamp(Math.floor(u.tires || 0), 0, MAX_UPGRADE_LEVEL),
              aero: clamp(Math.floor(u.aero || 0), 0, MAX_UPGRADE_LEVEL),
              transmission: clamp(Math.floor(u.transmission || 0), 0, MAX_UPGRADE_LEVEL),
              chassis: clamp(Math.floor(u.chassis || 0), 0, MAX_UPGRADE_LEVEL)
            };
          }
        }

        if (parsed.carPaints && typeof parsed.carPaints === 'object') {
          for (const carId of this.state.ownedCars) {
            const cDef = this.getCarDef(carId);
            const p = parsed.carPaints[carId];
            this.state.carPaints[carId] = typeof p === 'number' ? p : cDef.defaultColor;
          }
        }

        if (parsed.carCustom && typeof parsed.carCustom === 'object') {
          for (const carId of this.state.ownedCars) {
            this.state.carCustom[carId] = sanitizeCustom(parsed.carCustom[carId]);
          }
        }

        let loadedTrans = parsed.transmissionMode;
        if (loadedTrans === 'DCT') loadedTrans = 'SEMI';
        if (loadedTrans === 'CVT') loadedTrans = 'AUTO';
        if (TRANSMISSION_MODES.includes(loadedTrans)) {
          this.state.transmissionMode = loadedTrans;
        }

        if (GAUGE_STYLES.includes(parsed.gaugeStyle)) {
          this.state.gaugeStyle = parsed.gaugeStyle;
        }

        if (typeof parsed.totalDistanceKm === 'number' && isFinite(parsed.totalDistanceKm)) {
          this.state.totalDistanceKm = Math.max(0, parsed.totalDistanceKm);
        }
      } catch (e) {
        // Ignore malformed localStorage
      }
    }

    save() {
      if (this.disableStorage || typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        // Ignore storage quota / privacy mode errors
      }
    }

    resetSession() {
      this.sessionEarned = 0;
      this.streakMult = 1.0;
      this.cleanMeters = 0;
      this.cleanPasses = 0;
    }

    getBank() {
      return Math.floor(this.state.bank);
    }

    getCarDef(carId) {
      return PLAYER_CARS.find((c) => c.id === carId) || PLAYER_CARS[0];
    }

    isOwned(carId) {
      return this.state.ownedCars.includes(carId);
    }

    getUpgrades(carId) {
      const id = carId || this.state.activeCarId;
      if (!this.state.carUpgrades[id]) {
        this.state.carUpgrades[id] = makeDefaultUpgrades();
      }
      return this.state.carUpgrades[id];
    }

    getPaint(carId) {
      const id = carId || this.state.activeCarId;
      if (this.state.carPaints[id] === undefined) {
        this.state.carPaints[id] = this.getCarDef(id).defaultColor;
      }
      return this.state.carPaints[id];
    }

    getCustomization(carId) {
      const id = carId || this.state.activeCarId;
      if (!this.state.carCustom[id]) {
        this.state.carCustom[id] = makeDefaultCustom();
      } else {
        this.state.carCustom[id] = sanitizeCustom(this.state.carCustom[id]);
      }
      return this.state.carCustom[id];
    }

    setCustomization(carId, field, value) {
      const id = carId || this.state.activeCarId;
      if (!this.isOwned(id)) return false;
      const list = CUSTOM_VALIDATORS[field];
      if (!list || !list.some((item) => item.id === value)) return false;
      const custom = this.getCustomization(id);
      custom[field] = value;
      this.save();
      return true;
    }

    getTransmission() {
      return this.state.transmissionMode || 'AUTO';
    }

    setTransmission(mode) {
      if (!TRANSMISSION_MODES.includes(mode)) return false;
      this.state.transmissionMode = mode;
      this.save();
      return true;
    }

    cycleTransmission() {
      const idx = TRANSMISSION_MODES.indexOf(this.getTransmission());
      const next = TRANSMISSION_MODES[(idx + 1) % TRANSMISSION_MODES.length];
      this.setTransmission(next);
      return next;
    }

    getGaugeStyle() {
      return this.state.gaugeStyle || 'digital';
    }

    setGaugeStyle(style) {
      if (!GAUGE_STYLES.includes(style)) return false;
      this.state.gaugeStyle = style;
      this.save();
      return true;
    }

    toggleGaugeStyle() {
      const next = this.getGaugeStyle() === 'digital' ? 'analog' : 'digital';
      this.setGaugeStyle(next);
      return next;
    }

    /**
     * Compute merged vehicle physics specs for a car (defaults to active car).
     */
    getCarSpecs(carId) {
      const carDef = this.getCarDef(carId || this.state.activeCarId);
      const upg = this.getUpgrades(carDef.id);

      const topSpeedKmh = Math.min(
        430,
        Math.round(carDef.baseTopSpeedKmh * (1 + upg.engine * 0.045 + (upg.turbo || 0) * 0.02))
      );
      const accelPower =
        carDef.baseAccel * (1 + upg.engine * 0.06 + (upg.turbo || 0) * 0.04 + upg.transmission * 0.03);
      const brakePower = carDef.baseBrake * (1 + upg.brakes * 0.08);
      const brakeWeatherBonus = 1 + upg.brakes * 0.05;
      const gripMult = carDef.baseGrip * (1 + upg.tires * 0.06 + (upg.aero || 0) * 0.05);
      const weatherGripMult = carDef.weatherGrip * (1 + upg.tires * 0.09);
      const gearCount = upg.transmission >= 4 ? 8 : upg.transmission >= 2 ? 7 : 6;
      const shiftTimeMult = Math.max(0.35, 1 - upg.transmission * 0.15);
      const damageResist = Math.max(0.45, (1 / carDef.durability) * (1 - upg.chassis * 0.11));
      const turboLevel = clamp((carDef.turboLevel || 0.7) + upg.engine * 0.06 + (upg.turbo || 0) * 0.09, 0.4, 1.15);
      const turboSpoolMult = 1 + (upg.turbo || 0) * 0.16;
      const rollStiffness = 1 + (upg.aero || 0) * 0.14;

      return {
        carId: carDef.id,
        name: carDef.name,
        archetype: carDef.archetype,
        color: this.getPaint(carDef.id),
        custom: Object.assign({}, this.getCustomization(carDef.id)),
        engineTone: carDef.engineTone,
        turboLevel,
        turboSpoolMult,
        rollStiffness,
        topSpeedKmh,
        maxSpeedMs: topSpeedKmh / 3.6,
        accelPower,
        brakePower,
        brakeWeatherBonus,
        gripMult,
        weatherGripMult,
        gearCount,
        shiftTimeMult,
        damageResist,
        carDef,
        upgrades: Object.assign({}, upg)
      };
    }

    getActiveCarSpecs() {
      return this.getCarSpecs(this.state.activeCarId);
    }

    /**
     * Award continuous distance earnings while driving.
     */
    awardDistance(deltaMeters, speedKmh, weatherMult) {
      if (!deltaMeters || deltaMeters <= 0 || speedKmh < 10) return 0;
      const km = deltaMeters / 1000;
      this.state.totalDistanceKm += km;
      this.cleanMeters += deltaMeters;

      // Streak gradually rises every 500m of clean driving up to 2.0x
      if (this.cleanMeters >= 500) {
        const steps = Math.floor(this.cleanMeters / 500);
        this.cleanMeters -= steps * 500;
        this.streakMult = clamp(Math.round((this.streakMult + steps * 0.1) * 10) / 10, 1.0, 2.0);
      }

      const speedBonus = clamp(0.95 + Math.max(0, speedKmh - 50) / 150, 1.0, 2.25);
      const wMult = weatherMult || 1.0;
      const earned = km * 120 * speedBonus * wMult * this.streakMult;

      this.state.bank += earned;
      this.sessionEarned += earned;
      return earned;
    }

    /**
     * Award discrete clean overtake bonus.
     */
    awardCleanPass(relSpeedKmh, isClose, weatherMult) {
      this.cleanPasses += 1;
      const base = isClose ? 70 : 45;
      const speedExtra = clamp((relSpeedKmh - 15) * 0.4, 0, 35);
      const wMult = weatherMult || 1.0;
      const earned = Math.round((base + speedExtra) * wMult * this.streakMult);

      this.streakMult = clamp(Math.round((this.streakMult + 0.08) * 100) / 100, 1.0, 2.0);
      this.state.bank += earned;
      this.sessionEarned += earned;
      this.save();
      return earned;
    }

    onCollision() {
      this.streakMult = 1.0;
      this.cleanMeters = 0;
    }

    buyCar(carId) {
      const def = PLAYER_CARS.find((c) => c.id === carId);
      if (!def) return { ok: false, reason: 'Unknown vehicle' };
      if (this.isOwned(carId)) {
        this.selectCar(carId);
        return { ok: true, owned: true };
      }
      if (this.getBank() < def.price) {
        return { ok: false, reason: 'Insufficient funds' };
      }
      this.state.bank -= def.price;
      this.state.ownedCars.push(carId);
      this.state.carUpgrades[carId] = makeDefaultUpgrades();
      this.state.carPaints[carId] = def.defaultColor;
      this.state.carCustom[carId] = makeDefaultCustom();
      this.state.activeCarId = carId;
      this.save();
      return { ok: true, purchased: true };
    }

    selectCar(carId) {
      if (!this.isOwned(carId)) return false;
      this.state.activeCarId = carId;
      this.save();
      return true;
    }

    getUpgradeCost(carId, upgradeKey) {
      const def = UPGRADE_DEFS[upgradeKey];
      if (!def) return null;
      const upg = this.getUpgrades(carId);
      const lvl = upg[upgradeKey] || 0;
      if (lvl >= MAX_UPGRADE_LEVEL) return null;
      return def.costs[lvl + 1];
    }

    buyUpgrade(carId, upgradeKey) {
      const id = carId || this.state.activeCarId;
      if (!this.isOwned(id)) return { ok: false, reason: 'Vehicle not owned' };
      const def = UPGRADE_DEFS[upgradeKey];
      if (!def) return { ok: false, reason: 'Unknown upgrade' };

      const upg = this.getUpgrades(id);
      const currLvl = upg[upgradeKey] || 0;
      if (currLvl >= MAX_UPGRADE_LEVEL) return { ok: false, reason: 'Already max level' };

      const cost = def.costs[currLvl + 1];
      if (this.getBank() < cost) return { ok: false, reason: 'Insufficient funds' };

      this.state.bank -= cost;
      upg[upgradeKey] = currLvl + 1;
      this.save();
      return { ok: true, level: upg[upgradeKey], cost };
    }

    setPaint(carId, hex) {
      const id = carId || this.state.activeCarId;
      if (!this.isOwned(id)) return false;
      this.state.carPaints[id] = hex;
      this.save();
      return true;
    }
  }

  const api = {
    HighwayEconomy,
    PLAYER_CARS,
    UPGRADE_DEFS,
    PAINT_SWATCHES,
    RIM_STYLES,
    SPOILER_STYLES,
    TINT_STYLES,
    STRIPE_STYLES,
    UNDERGLOW_STYLES,
    TRANSMISSION_MODES,
    GAUGE_STYLES,
    MAX_UPGRADE_LEVEL
  };

  if (typeof window !== 'undefined') {
    window.HighwayEconomy = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root && (typeof window === 'undefined' || root !== window)) {
    root.HighwayEconomy = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
