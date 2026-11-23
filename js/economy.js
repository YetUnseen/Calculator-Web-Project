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
      baseTopSpeedKmh: 235,
      baseAccel: 6.1,
      baseBrake: 15.2,
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
      baseTopSpeedKmh: 270,
      baseAccel: 7.4,
      baseBrake: 16.5,
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
      baseTopSpeedKmh: 295,
      baseAccel: 8.3,
      baseBrake: 17.2,
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
      baseTopSpeedKmh: 322,
      baseAccel: 9.3,
      baseBrake: 18.2,
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
      baseTopSpeedKmh: 355,
      baseAccel: 10.5,
      baseBrake: 19.4,
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
      baseTopSpeedKmh: 402,
      baseAccel: 12.1,
      baseBrake: 21.2,
      baseGrip: 1.24,
      weatherGrip: 1.08,
      durability: 1.10,
      engineTone: 'v10',
      turboLevel: 0.88,
      defaultColor: 0xf59e0b,
      desc: 'Mid-engine V10 flagship with carbon aero stability and relentless top-end pull.'
    }
  ];

  const UPGRADE_DEFS = {
    engine: {
      key: 'engine',
      label: 'Engine Tune',
      costs: [0, 650, 1600, 3400, 6800],
      effectText: '+7% Accel & +6% Top Speed per level'
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
    { name: 'Crimson Red', hex: 0xb91c1c },
    { name: 'Gunmetal Gray', hex: 0x334155 },
    { name: 'Emerald Sage', hex: 0x0f766e },
    { name: 'Sunset Amber', hex: 0xf59e0b },
    { name: 'Midnight Black', hex: 0x181c24 }
  ];

  const MAX_UPGRADE_LEVEL = 4;

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function makeDefaultUpgrades() {
    return { engine: 0, brakes: 0, tires: 0, transmission: 0, chassis: 0 };
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
              brakes: clamp(Math.floor(u.brakes || 0), 0, MAX_UPGRADE_LEVEL),
              tires: clamp(Math.floor(u.tires || 0), 0, MAX_UPGRADE_LEVEL),
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

      const topSpeedKmh = carDef.baseTopSpeedKmh * (1 + upg.engine * 0.06);
      const accelPower = carDef.baseAccel * (1 + upg.engine * 0.07 + upg.transmission * 0.035);
      const brakePower = carDef.baseBrake * (1 + upg.brakes * 0.08);
      const brakeWeatherBonus = 1 + upg.brakes * 0.05;
      const gripMult = carDef.baseGrip * (1 + upg.tires * 0.06);
      const weatherGripMult = carDef.weatherGrip * (1 + upg.tires * 0.09);
      const gearCount = upg.transmission >= 4 ? 8 : upg.transmission >= 2 ? 7 : 6;
      const shiftTimeMult = Math.max(0.35, 1 - upg.transmission * 0.15);
      const damageResist = Math.max(0.45, (1 / carDef.durability) * (1 - upg.chassis * 0.11));
      const turboLevel = clamp((carDef.turboLevel || 0.7) + upg.engine * 0.08, 0.4, 1.15);

      return {
        carId: carDef.id,
        name: carDef.name,
        archetype: carDef.archetype,
        color: this.getPaint(carDef.id),
        engineTone: carDef.engineTone,
        turboLevel,
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
