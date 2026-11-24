/* ==========================================================================
   HIGHWAY ECONOMY — CURRENCY, GARAGE CATALOG, UPGRADES & PERSISTENCE
   - Earn $ from distance driven, speed, clean passes, weather & clean streak
   - 15 Purchasable Vehicles + 1 Secret 3-Crash-Streak 18-Wheeler
   - 10 Upgrade Categories (Levels 0-4) + Visual Customization + Paints
   - Persisted cleanly via localStorage (safe no-op in headless Node tests)
   ========================================================================== */

(function (root) {
  'use strict';

  const STORAGE_KEY = 'highway_drive_save_v1';
  const TRANSMISSION_MODES = ['AUTO', 'SEMI', 'MANUAL'];
  const GAUGE_STYLES = ['digital', 'analog'];
  const CRASH_UNLOCK_TARGET = 3;
  const SECRET_TRUCK_ID = 'colossus_truck';

  const PLAYER_CARS = [
    {
      id: 'starter_hatch',
      name: 'Civic Touring',
      category: 'Compact',
      group: 'street',
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
      group: 'street',
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
      id: 'rally_hatch',
      name: 'Stratos WRC Hatch',
      category: 'Rally Spec',
      group: 'street',
      price: 5200,
      archetype: 'rally_hatch',
      baseTopSpeedKmh: 222,
      baseAccel: 7.1,
      baseBrake: 16.4,
      baseGrip: 1.16,
      weatherGrip: 1.30,
      durability: 1.15,
      engineTone: 't5',
      turboLevel: 0.96,
      defaultColor: 0x1d4ed8,
      desc: 'Widebody rally-homologation hatch with quad fog lamps and unstoppable wet/snow AWD grip.'
    },
    {
      id: 'awd_wagon',
      name: 'Nordic Touring RS',
      category: 'All-Weather AWD',
      group: 'street',
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
      id: 'jdm_coupe',
      name: 'Skyline R-Spec',
      category: 'Turbo Tuner',
      group: 'sport',
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
      id: 'street_pickup',
      name: 'Raptor SVT Street',
      category: 'Sport Truck',
      group: 'special',
      price: 12000,
      archetype: 'sport_pickup',
      baseTopSpeedKmh: 242,
      baseAccel: 8.2,
      baseBrake: 17.0,
      baseGrip: 1.10,
      weatherGrip: 1.22,
      durability: 1.38,
      engineTone: 'v8',
      turboLevel: 0.85,
      defaultColor: 0xb91c1c,
      desc: 'Supercharged V8 performance pickup with heavy-duty frame and towering highway sightlines.'
    },
    {
      id: 'm_coupe',
      name: 'Bavaria Sport Coupe',
      category: 'Performance Coupe',
      group: 'sport',
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
      id: 'sport_suv',
      name: 'Kodiak Trackhawk SUV',
      category: 'Performance SUV',
      group: 'special',
      price: 16500,
      archetype: 'sport_suv',
      baseTopSpeedKmh: 262,
      baseAccel: 8.9,
      baseBrake: 18.0,
      baseGrip: 1.14,
      weatherGrip: 1.26,
      durability: 1.32,
      engineTone: 'v8',
      turboLevel: 0.90,
      defaultColor: 0x181c24,
      desc: 'Twin-turbo V8 AWD sport utility rocket with commanding grip in any storm.'
    },
    {
      id: 'muscle_v8',
      name: 'Titan V8 Muscle',
      category: 'Muscle V8',
      group: 'sport',
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
      id: 'gt_v8',
      name: 'Valkyrie GT V8',
      category: 'Grand Tourer',
      group: 'sport',
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
      id: 'patrol_v8',
      name: 'Interceptor Patrol',
      category: 'Pursuit Unit',
      group: 'special',
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
      id: 'hyper_gt',
      name: 'Hyperion Stradale',
      category: 'Supercar',
      group: 'super',
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
      id: 'track_gt3',
      name: 'Corsa GT3 RS',
      category: 'Track Special',
      group: 'super',
      price: 64000,
      archetype: 'gt3',
      baseTopSpeedKmh: 326,
      baseAccel: 11.7,
      baseBrake: 21.8,
      baseGrip: 1.32,
      weatherGrip: 1.12,
      durability: 1.08,
      engineTone: 'v10',
      turboLevel: 0.86,
      defaultColor: 0x15803d,
      maxCapKmh: 440,
      desc: 'Homologated swan-neck wing track special built for surgical high-speed lane darts.'
    },
    {
      id: 'aether_hyper',
      name: 'Aether RS Hyper',
      category: 'Hypercar',
      group: 'super',
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
    },
    {
      id: 'apex_prototype',
      name: 'Valkyrie AMR-Pro',
      category: 'Hyper Prototype',
      group: 'super',
      price: 125000,
      archetype: 'prototype',
      baseTopSpeedKmh: 360,
      baseAccel: 13.0,
      baseBrake: 23.0,
      baseGrip: 1.36,
      weatherGrip: 1.14,
      durability: 1.15,
      engineTone: 'v12',
      turboLevel: 1.12,
      defaultColor: 0x06b6d4,
      maxCapKmh: 455,
      desc: 'Screaming V12 Le Mans hyper-prototype with dorsal aero fin and unmatched downforce.'
    },
    {
      id: 'colossus_truck',
      name: 'Colossus 18-Wheeler',
      category: 'Secret Heavy Rig',
      group: 'special',
      price: 0,
      secretUnlock: 'crash_streak_3',
      unlockHint: 'Crash 3 times in a row to unlock',
      archetype: 'big_rig',
      baseTopSpeedKmh: 215,
      baseAccel: 6.4,
      baseBrake: 13.8,
      baseGrip: 1.05,
      weatherGrip: 1.32,
      durability: 3.20,
      engineTone: 'diesel_v8',
      hornType: 'airhorn',
      turboLevel: 1.05,
      defaultColor: 0xb91c1c,
      maxCapKmh: 310,
      desc: '13.8-meter armored freight juggernaut with twin smoke stacks and thunderous air horn. Earned only by surviving 3 straight crashes.'
    }
  ];

  const UPGRADE_DEFS = {
    engine: {
      key: 'engine',
      label: 'Engine Tune',
      category: 'Powertrain',
      costs: [0, 650, 1600, 3400, 6800],
      effectText: '+6% Accel & +4.5% Top Speed per level'
    },
    turbo: {
      key: 'turbo',
      label: 'Twin-Turbo Kit',
      category: 'Powertrain',
      costs: [0, 750, 1800, 3800, 7500],
      effectText: '+4% Accel, +2% Top Speed & faster spool'
    },
    exhaust: {
      key: 'exhaust',
      label: 'Titanium Exhaust',
      category: 'Powertrain',
      costs: [0, 550, 1350, 2800, 5600],
      effectText: '+3% Top Speed, +3% High-RPM pull & richer note'
    },
    transmission: {
      key: 'transmission',
      label: 'Drivetrain & Gearbox',
      category: 'Powertrain',
      costs: [0, 600, 1500, 3100, 6200],
      effectText: 'Faster shifts & 7/8-speed close ratios'
    },
    brakes: {
      key: 'brakes',
      label: 'Carbon Brakes',
      category: 'Handling',
      costs: [0, 500, 1250, 2600, 5200],
      effectText: '+8% Braking & wet/snow stop control'
    },
    tires: {
      key: 'tires',
      label: 'All-Season Tires',
      category: 'Handling',
      costs: [0, 550, 1400, 2900, 5800],
      effectText: '+6% Grip & +9% Rain/Snow traction'
    },
    aero: {
      key: 'aero',
      label: 'Aero & Suspension',
      category: 'Handling',
      costs: [0, 550, 1450, 3100, 6200],
      effectText: '+5% High-speed grip & reduced body roll'
    },
    weight: {
      key: 'weight',
      label: 'Weight Reduction',
      category: 'Handling',
      costs: [0, 600, 1500, 3200, 6500],
      effectText: '+4.5% Accel, +4% Brakes & +5% Steering response'
    },
    chassis: {
      key: 'chassis',
      label: 'Reinforced Chassis',
      category: 'Chassis & Tech',
      costs: [0, 450, 1150, 2400, 4800],
      effectText: '-11% Impact damage & scrape speed loss'
    },
    ecu: {
      key: 'ecu',
      label: 'Pro ECU & Telemetry',
      category: 'Chassis & Tech',
      costs: [0, 700, 1750, 3600, 7200],
      effectText: '+12% Cash earnings, +15% Faster streak & +2.5% Accel'
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
  const DEFAULT_SEAT_CONFIG = { y: 0, z: 0, pitchDeg: 0, fov: 68 };

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function sanitizeSeatConfig(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const y = typeof src.y === 'number' && isFinite(src.y) ? Math.round(clamp(src.y, -0.12, 0.18) * 1000) / 1000 : DEFAULT_SEAT_CONFIG.y;
    const z = typeof src.z === 'number' && isFinite(src.z) ? Math.round(clamp(src.z, -0.20, 0.22) * 1000) / 1000 : DEFAULT_SEAT_CONFIG.z;
    const pitchDeg =
      typeof src.pitchDeg === 'number' && isFinite(src.pitchDeg)
        ? Math.round(clamp(src.pitchDeg, -8, 10) * 2) / 2
        : DEFAULT_SEAT_CONFIG.pitchDeg;
    const fov = typeof src.fov === 'number' && isFinite(src.fov) ? Math.round(clamp(src.fov, 55, 85)) : DEFAULT_SEAT_CONFIG.fov;
    return { y, z, pitchDeg, fov };
  }

  function makeDefaultUpgrades() {
    return {
      engine: 0,
      turbo: 0,
      exhaust: 0,
      transmission: 0,
      brakes: 0,
      tires: 0,
      aero: 0,
      weight: 0,
      chassis: 0,
      ecu: 0
    };
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
      this.sessionFines = 0;
      this.sessionFineCount = 0;
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
        seatConfig: Object.assign({}, DEFAULT_SEAT_CONFIG),
        totalDistanceKm: 0,
        crashStreak: 0
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
              exhaust: clamp(Math.floor(u.exhaust || 0), 0, MAX_UPGRADE_LEVEL),
              transmission: clamp(Math.floor(u.transmission || 0), 0, MAX_UPGRADE_LEVEL),
              brakes: clamp(Math.floor(u.brakes || 0), 0, MAX_UPGRADE_LEVEL),
              tires: clamp(Math.floor(u.tires || 0), 0, MAX_UPGRADE_LEVEL),
              aero: clamp(Math.floor(u.aero || 0), 0, MAX_UPGRADE_LEVEL),
              weight: clamp(Math.floor(u.weight || 0), 0, MAX_UPGRADE_LEVEL),
              chassis: clamp(Math.floor(u.chassis || 0), 0, MAX_UPGRADE_LEVEL),
              ecu: clamp(Math.floor(u.ecu || 0), 0, MAX_UPGRADE_LEVEL)
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

        if (typeof parsed.crashStreak === 'number' && isFinite(parsed.crashStreak)) {
          this.state.crashStreak = Math.max(0, Math.floor(parsed.crashStreak));
        }

        if (parsed.seatConfig && typeof parsed.seatConfig === 'object') {
          this.state.seatConfig = sanitizeSeatConfig(parsed.seatConfig);
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
      this.sessionFines = 0;
      this.sessionFineCount = 0;
      this.streakMult = 1.0;
      this.cleanMeters = 0;
      this.cleanPasses = 0;
    }

    getBank() {
      return Math.floor(this.state.bank);
    }

    getCrashStreak() {
      return Math.max(0, Math.floor(this.state.crashStreak || 0));
    }

    resetCrashStreak() {
      if ((this.state.crashStreak || 0) !== 0) {
        this.state.crashStreak = 0;
        this.save();
      }
    }

    recordCrash() {
      this.onCollision();
      this.state.crashStreak = Math.max(0, Math.floor(this.state.crashStreak || 0)) + 1;
      let unlockedCar = null;
      if (this.state.crashStreak >= CRASH_UNLOCK_TARGET && !this.isOwned(SECRET_TRUCK_ID)) {
        const def = this.getCarDef(SECRET_TRUCK_ID);
        if (def && def.id === SECRET_TRUCK_ID) {
          this.state.ownedCars.push(SECRET_TRUCK_ID);
          this.state.carUpgrades[SECRET_TRUCK_ID] = makeDefaultUpgrades();
          this.state.carPaints[SECRET_TRUCK_ID] = def.defaultColor;
          this.state.carCustom[SECRET_TRUCK_ID] = makeDefaultCustom();
          unlockedCar = def;
        }
      }
      this.save();
      return { crashStreak: this.state.crashStreak, unlockedCar };
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

    getSeatConfig() {
      this.state.seatConfig = sanitizeSeatConfig(this.state.seatConfig);
      return Object.assign({}, this.state.seatConfig);
    }

    setSeatConfig(partial) {
      const merged = Object.assign({}, this.getSeatConfig(), partial && typeof partial === 'object' ? partial : {});
      this.state.seatConfig = sanitizeSeatConfig(merged);
      this.save();
      return Object.assign({}, this.state.seatConfig);
    }

    resetSeatConfig() {
      this.state.seatConfig = Object.assign({}, DEFAULT_SEAT_CONFIG);
      this.save();
      return Object.assign({}, this.state.seatConfig);
    }

    /**
     * Compute merged vehicle physics specs for a car (defaults to active car).
     */
    getCarSpecs(carId) {
      const carDef = this.getCarDef(carId || this.state.activeCarId);
      const upg = this.getUpgrades(carDef.id);
      const speedCap = carDef.maxCapKmh || 430;

      const topSpeedKmh = Math.min(
        speedCap,
        Math.round(
          carDef.baseTopSpeedKmh *
            (1 + (upg.engine || 0) * 0.045 + (upg.turbo || 0) * 0.02 + (upg.exhaust || 0) * 0.03)
        )
      );
      const accelPower =
        carDef.baseAccel *
        (1 +
          (upg.engine || 0) * 0.06 +
          (upg.turbo || 0) * 0.04 +
          (upg.transmission || 0) * 0.03 +
          (upg.weight || 0) * 0.045 +
          (upg.ecu || 0) * 0.025);
      const brakePower = carDef.baseBrake * (1 + (upg.brakes || 0) * 0.08 + (upg.weight || 0) * 0.04);
      const brakeWeatherBonus = 1 + (upg.brakes || 0) * 0.05;
      const gripMult = carDef.baseGrip * (1 + (upg.tires || 0) * 0.06 + (upg.aero || 0) * 0.05);
      const weatherGripMult = carDef.weatherGrip * (1 + (upg.tires || 0) * 0.09);
      const gearCount = (upg.transmission || 0) >= 4 ? 8 : (upg.transmission || 0) >= 2 ? 7 : 6;
      const shiftTimeMult = Math.max(0.35, 1 - (upg.transmission || 0) * 0.15);
      const damageResist = Math.max(0.22, (1 / carDef.durability) * (1 - (upg.chassis || 0) * 0.11));
      const turboLevel = clamp(
        (carDef.turboLevel || 0.7) + (upg.engine || 0) * 0.06 + (upg.turbo || 0) * 0.09,
        0.4,
        1.15
      );
      const turboSpoolMult = 1 + (upg.turbo || 0) * 0.16;
      const rollStiffness = 1 + (upg.aero || 0) * 0.14;
      const steerResponseMult = 1 + (upg.weight || 0) * 0.05;
      const highRpmBoost = 1 + (upg.exhaust || 0) * 0.03;
      const exhaustLevel = upg.exhaust || 0;
      const earningsMult = 1 + (upg.ecu || 0) * 0.12;
      const streakRateMult = 1 + (upg.ecu || 0) * 0.15;
      const hornType = carDef.hornType || (carDef.archetype === 'police' ? 'police' : 'standard');

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
        steerResponseMult,
        highRpmBoost,
        exhaustLevel,
        earningsMult,
        streakRateMult,
        hornType,
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
      const upg = this.getUpgrades();
      const ecuLvl = upg.ecu || 0;
      const earningsMult = 1 + ecuLvl * 0.12;
      const streakRateMult = 1 + ecuLvl * 0.15;

      const km = deltaMeters / 1000;
      this.state.totalDistanceKm += km;
      this.cleanMeters += deltaMeters;

      // Streak gradually rises every 500m of clean driving up to 2.0x
      if (this.cleanMeters >= 500) {
        const steps = Math.floor(this.cleanMeters / 500);
        this.cleanMeters -= steps * 500;
        this.streakMult = clamp(
          Math.round((this.streakMult + steps * 0.1 * streakRateMult) * 100) / 100,
          1.0,
          2.0
        );
      }

      const speedBonus = clamp(0.95 + Math.max(0, speedKmh - 50) / 150, 1.0, 2.25);
      const wMult = weatherMult || 1.0;
      const earned = km * 120 * speedBonus * wMult * this.streakMult * earningsMult;

      this.state.bank += earned;
      this.sessionEarned += earned;
      return earned;
    }

    /**
     * Award discrete clean overtake bonus.
     */
    awardCleanPass(relSpeedKmh, isClose, weatherMult) {
      const upg = this.getUpgrades();
      const ecuLvl = upg.ecu || 0;
      const earningsMult = 1 + ecuLvl * 0.12;
      const streakRateMult = 1 + ecuLvl * 0.15;

      this.cleanPasses += 1;
      const base = isClose ? 70 : 45;
      const speedExtra = clamp((relSpeedKmh - 15) * 0.4, 0, 35);
      const wMult = weatherMult || 1.0;
      const earned = Math.round((base + speedExtra) * wMult * this.streakMult * earningsMult);

      this.streakMult = clamp(
        Math.round((this.streakMult + 0.08 * streakRateMult) * 100) / 100,
        1.0,
        2.0
      );
      this.state.bank += earned;
      this.sessionEarned += earned;
      this.save();
      return earned;
    }

    onCollision() {
      this.streakMult = 1.0;
      this.cleanMeters = 0;
    }

    applyFine(amount) {
      const ticket = Math.max(0, Math.round(amount || 0));
      const deducted = Math.min(Math.floor(this.state.bank), ticket);
      this.state.bank = Math.max(0, this.state.bank - ticket);
      this.sessionFines += ticket;
      this.sessionFineCount += 1;
      this.onCollision();
      this.save();
      return { ticket, deducted, bank: this.getBank() };
    }

    buyCar(carId) {
      const def = PLAYER_CARS.find((c) => c.id === carId);
      if (!def) return { ok: false, reason: 'Unknown vehicle' };
      if (this.isOwned(carId)) {
        this.selectCar(carId);
        return { ok: true, owned: true };
      }
      if (def.secretUnlock) {
        return { ok: false, reason: def.unlockHint || 'Secret unlock only' };
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
    MAX_UPGRADE_LEVEL,
    DEFAULT_SEAT_CONFIG,
    CRASH_UNLOCK_TARGET,
    SECRET_TRUCK_ID
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
