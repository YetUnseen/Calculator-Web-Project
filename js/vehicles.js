/* ==========================================================================
   HIGHWAY VEHICLES — 23 SCULPTED 3D VEHICLE ARCHETYPES & LIGHT CONTROLLERS
   - All meshes face -Z (forward), +X (right), +Y (up), grounded at y = 0
   - Angled windshields, rear glass, wheel arches, spoilers, big rigs & beacons
   - Independent brake lights, L/R blinkers, hazard flashers & high-beam flashers
   - Shared geometry & core material caches for crisp 60 FPS on integrated GPUs
   ========================================================================== */

(function (root) {
  'use strict';

  const ARCHETYPES = {
    player_gt: {
      id: 'player_gt',
      label: 'Apex GT Sedan',
      length: 4.58,
      width: 1.88,
      height: 1.36,
      wheelRadius: 0.34,
      wheelWidth: 0.24,
      clearance: 0.15,
      hoodFrac: 0.31,
      cabinFrac: 0.43,
      cabinHeightFrac: 0.50,
      minSpeedKmh: 0,
      maxSpeedKmh: 280
    },
    rally_hatch: {
      id: 'rally_hatch',
      label: 'Stratos WRC Hatch',
      length: 4.18,
      width: 1.88,
      height: 1.46,
      wheelRadius: 0.33,
      wheelWidth: 0.25,
      clearance: 0.17,
      hoodFrac: 0.25,
      cabinFrac: 0.55,
      cabinHeightFrac: 0.53,
      minSpeedKmh: 0,
      maxSpeedKmh: 285
    },
    sport_pickup: {
      id: 'sport_pickup',
      label: 'Raptor SVT Street',
      length: 5.42,
      width: 2.06,
      height: 1.78,
      wheelRadius: 0.41,
      wheelWidth: 0.29,
      clearance: 0.23,
      hoodFrac: 0.28,
      cabinFrac: 0.35,
      cabinHeightFrac: 0.47,
      minSpeedKmh: 0,
      maxSpeedKmh: 310
    },
    sport_suv: {
      id: 'sport_suv',
      label: 'Kodiak Trackhawk SUV',
      length: 4.90,
      width: 2.02,
      height: 1.66,
      wheelRadius: 0.39,
      wheelWidth: 0.28,
      clearance: 0.20,
      hoodFrac: 0.27,
      cabinFrac: 0.54,
      cabinHeightFrac: 0.49,
      minSpeedKmh: 0,
      maxSpeedKmh: 330
    },
    gt_v8: {
      id: 'gt_v8',
      label: 'Valkyrie GT V8',
      length: 4.72,
      width: 1.96,
      height: 1.32,
      wheelRadius: 0.35,
      wheelWidth: 0.27,
      clearance: 0.14,
      hoodFrac: 0.35,
      cabinFrac: 0.39,
      cabinHeightFrac: 0.49,
      minSpeedKmh: 0,
      maxSpeedKmh: 330
    },
    supercar: {
      id: 'supercar',
      label: 'Hyperion Stradale',
      length: 4.56,
      width: 2.00,
      height: 1.18,
      wheelRadius: 0.35,
      wheelWidth: 0.28,
      clearance: 0.12,
      hoodFrac: 0.28,
      cabinFrac: 0.38,
      cabinHeightFrac: 0.46,
      minSpeedKmh: 0,
      maxSpeedKmh: 370
    },
    gt3: {
      id: 'gt3',
      label: 'Corsa GT3 RS',
      length: 4.58,
      width: 2.02,
      height: 1.24,
      wheelRadius: 0.35,
      wheelWidth: 0.29,
      clearance: 0.12,
      hoodFrac: 0.30,
      cabinFrac: 0.41,
      cabinHeightFrac: 0.47,
      minSpeedKmh: 0,
      maxSpeedKmh: 440
    },
    jdm_coupe: {
      id: 'jdm_coupe',
      label: 'Skyline R-Spec',
      length: 4.62,
      width: 1.88,
      height: 1.35,
      wheelRadius: 0.34,
      wheelWidth: 0.25,
      clearance: 0.14,
      hoodFrac: 0.32,
      cabinFrac: 0.42,
      cabinHeightFrac: 0.49,
      minSpeedKmh: 0,
      maxSpeedKmh: 340
    },
    muscle: {
      id: 'muscle',
      label: 'Titan V8 Muscle',
      length: 4.80,
      width: 1.96,
      height: 1.38,
      wheelRadius: 0.35,
      wheelWidth: 0.26,
      clearance: 0.15,
      hoodFrac: 0.35,
      cabinFrac: 0.40,
      cabinHeightFrac: 0.49,
      minSpeedKmh: 0,
      maxSpeedKmh: 360
    },
    hypercar: {
      id: 'hypercar',
      label: 'Aether RS Hyper',
      length: 4.68,
      width: 2.04,
      height: 1.15,
      wheelRadius: 0.36,
      wheelWidth: 0.29,
      clearance: 0.11,
      hoodFrac: 0.27,
      cabinFrac: 0.38,
      cabinHeightFrac: 0.45,
      minSpeedKmh: 0,
      maxSpeedKmh: 480
    },
    prototype: {
      id: 'prototype',
      label: 'Valkyrie AMR-Pro',
      length: 4.78,
      width: 2.08,
      height: 1.08,
      wheelRadius: 0.36,
      wheelWidth: 0.31,
      clearance: 0.10,
      hoodFrac: 0.26,
      cabinFrac: 0.38,
      cabinHeightFrac: 0.44,
      minSpeedKmh: 0,
      maxSpeedKmh: 460
    },
    big_rig: {
      id: 'big_rig',
      label: 'Colossus 18-Wheeler',
      length: 13.80,
      width: 2.68,
      height: 3.85,
      wheelRadius: 0.54,
      wheelWidth: 0.34,
      clearance: 0.42,
      hoodFrac: 0.14,
      cabinFrac: 0.15,
      cabinHeightFrac: 0.58,
      minSpeedKmh: 0,
      maxSpeedKmh: 310
    },
    hatchback: {
      id: 'hatchback',
      label: 'Compact Hatchback',
      length: 4.10,
      width: 1.78,
      height: 1.46,
      wheelRadius: 0.31,
      wheelWidth: 0.21,
      clearance: 0.16,
      hoodFrac: 0.25,
      cabinFrac: 0.56,
      cabinHeightFrac: 0.54,
      minSpeedKmh: 82,
      maxSpeedKmh: 118
    },
    sedan: {
      id: 'sedan',
      label: 'Midsize Sedan',
      length: 4.65,
      width: 1.84,
      height: 1.44,
      wheelRadius: 0.33,
      wheelWidth: 0.22,
      clearance: 0.16,
      hoodFrac: 0.29,
      cabinFrac: 0.45,
      cabinHeightFrac: 0.50,
      minSpeedKmh: 88,
      maxSpeedKmh: 132
    },
    wagon: {
      id: 'wagon',
      label: 'Touring Wagon',
      length: 4.78,
      width: 1.86,
      height: 1.48,
      wheelRadius: 0.34,
      wheelWidth: 0.23,
      clearance: 0.17,
      hoodFrac: 0.28,
      cabinFrac: 0.56,
      cabinHeightFrac: 0.51,
      minSpeedKmh: 90,
      maxSpeedKmh: 134
    },
    suv: {
      id: 'suv',
      label: 'Crossover SUV',
      length: 4.82,
      width: 1.94,
      height: 1.72,
      wheelRadius: 0.38,
      wheelWidth: 0.25,
      clearance: 0.22,
      hoodFrac: 0.26,
      cabinFrac: 0.55,
      cabinHeightFrac: 0.50,
      minSpeedKmh: 86,
      maxSpeedKmh: 128
    },
    coupe: {
      id: 'coupe',
      label: 'Sport Coupe',
      length: 4.55,
      width: 1.88,
      height: 1.34,
      wheelRadius: 0.33,
      wheelWidth: 0.24,
      clearance: 0.14,
      hoodFrac: 0.32,
      cabinFrac: 0.42,
      cabinHeightFrac: 0.49,
      minSpeedKmh: 102,
      maxSpeedKmh: 142
    },
    pickup: {
      id: 'pickup',
      label: 'Pickup Truck',
      length: 5.38,
      width: 2.00,
      height: 1.82,
      wheelRadius: 0.40,
      wheelWidth: 0.26,
      clearance: 0.25,
      hoodFrac: 0.27,
      cabinFrac: 0.34,
      cabinHeightFrac: 0.48,
      minSpeedKmh: 78,
      maxSpeedKmh: 112
    },
    van: {
      id: 'van',
      label: 'Delivery Van',
      length: 6.35,
      width: 2.16,
      height: 2.52,
      wheelRadius: 0.41,
      wheelWidth: 0.27,
      clearance: 0.25,
      hoodFrac: 0.14,
      cabinFrac: 0.22,
      cabinHeightFrac: 0.58,
      minSpeedKmh: 74,
      maxSpeedKmh: 98
    },
    taxi: {
      id: 'taxi',
      label: 'City Cab',
      length: 4.66,
      width: 1.84,
      height: 1.46,
      wheelRadius: 0.33,
      wheelWidth: 0.22,
      clearance: 0.16,
      hoodFrac: 0.29,
      cabinFrac: 0.45,
      cabinHeightFrac: 0.50,
      minSpeedKmh: 86,
      maxSpeedKmh: 122
    },
    semi: {
      id: 'semi',
      label: 'Freight Semi-Truck',
      length: 12.20,
      width: 2.42,
      height: 3.45,
      wheelRadius: 0.50,
      wheelWidth: 0.30,
      clearance: 0.36,
      hoodFrac: 0.12,
      cabinFrac: 0.14,
      cabinHeightFrac: 0.60,
      minSpeedKmh: 68,
      maxSpeedKmh: 90
    },
    bus: {
      id: 'bus',
      label: 'Highway Coach',
      length: 11.40,
      width: 2.45,
      height: 3.30,
      wheelRadius: 0.48,
      wheelWidth: 0.30,
      clearance: 0.34,
      hoodFrac: 0.05,
      cabinFrac: 0.90,
      cabinHeightFrac: 0.55,
      minSpeedKmh: 72,
      maxSpeedKmh: 94
    },
    police: {
      id: 'police',
      label: 'Highway Patrol',
      length: 4.74,
      width: 1.88,
      height: 1.48,
      wheelRadius: 0.34,
      wheelWidth: 0.24,
      clearance: 0.16,
      hoodFrac: 0.29,
      cabinFrac: 0.45,
      cabinHeightFrac: 0.50,
      minSpeedKmh: 98,
      maxSpeedKmh: 132
    }
  };

  const EVERYDAY_PALETTE = [
    0xf1f5f9,
    0xcbd5e1,
    0x64748b,
    0x334155,
    0x1e293b,
    0x1d4ed8,
    0x1e3a5f,
    0x991b1b,
    0x14532d,
    0x78350f,
    0x0f766e,
    0x475569
  ];

  const VAN_PALETTE = [0xf8fafc, 0xe2e8f0, 0xfef3c7, 0xdbeafe, 0x475569];
  const TRAILER_PALETTE = [0xf8fafc, 0xe2e8f0, 0xdbeafe, 0xcbd5e1, 0xf1f5f9];
  const BUS_PALETTE = [0xf8fafc, 0x1e3a8a, 0x0f766e, 0x475569, 0x7c2d12];

  let _shared = null;

  function makeContactShadowTexture() {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 14, 64, 64, 62);
    grad.addColorStop(0.0, 'rgba(6, 8, 12, 0.72)');
    grad.addColorStop(0.55, 'rgba(6, 8, 12, 0.40)');
    grad.addColorStop(1.0, 'rgba(6, 8, 12, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function makeGlowTexture(rgbStr) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0.0, 'rgba(' + rgbStr + ', 0.95)');
    grad.addColorStop(0.4, 'rgba(' + rgbStr + ', 0.45)');
    grad.addColorStop(1.0, 'rgba(' + rgbStr + ', 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function makeBeamTexture() {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    // Draw tapered volumetric beam cone: narrow & bright at bottom (uv.y=0, headlight), wide & soft at top (uv.y=1, far ahead)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(52, 128);
    ctx.lineTo(76, 128);
    ctx.lineTo(126, 0);
    ctx.lineTo(2, 0);
    ctx.closePath();
    ctx.clip();

    const vGrad = ctx.createLinearGradient(0, 128, 0, 0);
    vGrad.addColorStop(0.0, 'rgba(235, 248, 255, 0.92)');
    vGrad.addColorStop(0.28, 'rgba(220, 244, 255, 0.56)');
    vGrad.addColorStop(0.68, 'rgba(195, 232, 255, 0.18)');
    vGrad.addColorStop(1.0, 'rgba(180, 224, 255, 0.0)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, 128, 128);

    const hGrad = ctx.createLinearGradient(0, 0, 128, 0);
    hGrad.addColorStop(0.0, 'rgba(0, 0, 0, 1)');
    hGrad.addColorStop(0.18, 'rgba(0, 0, 0, 0)');
    hGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0)');
    hGrad.addColorStop(1.0, 'rgba(0, 0, 0, 1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, 128, 128);
    ctx.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function getShared() {
    if (_shared) return _shared;
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 14);
    cylGeo.rotateZ(Math.PI / 2);
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    planeGeo.rotateX(-Math.PI / 2);
    const spriteGeo = new THREE.PlaneGeometry(1, 1);

    const shadowTex = makeContactShadowTexture();
    const amberGlowTex = makeGlowTexture('255, 175, 25');
    const redGlowTex = makeGlowTexture('255, 45, 45');
    const headlightGlowTex = makeGlowTexture('255, 248, 225');
    const beamTex = makeBeamTexture();

    _shared = {
      boxGeo,
      cylGeo,
      planeGeo,
      spriteGeo,
      tireMat: new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.88, metalness: 0.05 }),
      rimMat: new THREE.MeshStandardMaterial({ color: 0xd0d7e2, roughness: 0.32, metalness: 0.72 }),
      darkTrimMat: new THREE.MeshStandardMaterial({ color: 0x1d2129, roughness: 0.72, metalness: 0.16 }),
      glassMat: new THREE.MeshStandardMaterial({ color: 0x132030, roughness: 0.12, metalness: 0.62 }),
      grilleMat: new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.65, metalness: 0.35 }),
      chromeMat: new THREE.MeshStandardMaterial({ color: 0xdce4ef, roughness: 0.24, metalness: 0.84 }),
      whiteTrimMat: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45, metalness: 0.10 }),
      plateMat: new THREE.MeshBasicMaterial({ color: 0xe8edf3 }),
      cargoBedMat: new THREE.MeshStandardMaterial({ color: 0x1e232b, roughness: 0.9, metalness: 0.05 }),
      shadowMat: new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.82
      }),
      amberGlowTex,
      redGlowTex,
      headlightGlowTex,
      beamTex
    };
    return _shared;
  }

  function pickColor(archetypeId, rng) {
    const r = rng || Math.random;
    if (archetypeId === 'taxi') return 0xf5b800;
    if (archetypeId === 'police') return 0x111827;
    if (archetypeId === 'van') return VAN_PALETTE[Math.floor(r() * VAN_PALETTE.length)];
    if (archetypeId === 'semi') return EVERYDAY_PALETTE[Math.floor(r() * EVERYDAY_PALETTE.length)];
    if (archetypeId === 'bus') return BUS_PALETTE[Math.floor(r() * BUS_PALETTE.length)];
    return EVERYDAY_PALETTE[Math.floor(r() * EVERYDAY_PALETTE.length)];
  }

  const RIM_HEX = {
    silver: 0xd0d7e2,
    black: 0x161920,
    bronze: 0xa17449,
    gunmetal: 0x475569,
    white: 0xf1f5f9
  };

  const TINT_SPECS = {
    light: { hex: 0x1e293b, roughness: 0.12 },
    smoke: { hex: 0x090d14, roughness: 0.08 },
    limo: { hex: 0x04060a, roughness: 0.06 },
    cobalt: { hex: 0x0f2547, roughness: 0.10 }
  };

  const STRIPE_HEX = {
    white: 0xf8fafc,
    black: 0x14171f,
    red: 0xdc2626
  };

  const UNDERGLOW_RGB = {
    cyan: '34, 211, 238',
    red: '239, 68, 68',
    green: '34, 197, 94',
    violet: '168, 85, 247',
    amber: '245, 158, 11'
  };

  const _underglowMatCache = {};
  function getUnderglowMat(styleId) {
    const rgb = UNDERGLOW_RGB[styleId];
    if (!rgb) return null;
    if (!_underglowMatCache[styleId]) {
      _underglowMatCache[styleId] = new THREE.MeshBasicMaterial({
        map: makeGlowTexture(rgb),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.68
      });
    }
    return _underglowMatCache[styleId];
  }

  function createVehicleMesh(options) {
    const opts = options || {};
    const typeKey = opts.archetype && ARCHETYPES[opts.archetype] ? opts.archetype : 'sedan';
    const spec = ARCHETYPES[typeKey];
    const shared = getShared();
    const PLAYER_ARCHETYPES = [
      'player_gt',
      'rally_hatch',
      'sport_pickup',
      'sport_suv',
      'gt_v8',
      'supercar',
      'gt3',
      'jdm_coupe',
      'muscle',
      'hypercar',
      'prototype',
      'big_rig'
    ];
    const isPlayer = !!opts.isPlayer || PLAYER_ARCHETYPES.indexOf(typeKey) !== -1;
    const castShadow = opts.castShadow !== false;
    const custom = opts.custom || {};

    const activeRimMat =
      custom.rim && RIM_HEX[custom.rim] !== undefined && (isPlayer || custom.rim !== 'silver')
        ? new THREE.MeshStandardMaterial({
            color: RIM_HEX[custom.rim],
            roughness: 0.30,
            metalness: 0.72
          })
        : shared.rimMat;

    const tintCfg = custom.tint && TINT_SPECS[custom.tint];
    const activeGlassMat =
      tintCfg && (isPlayer || custom.tint !== 'light')
        ? new THREE.MeshStandardMaterial({
            color: tintCfg.hex,
            roughness: tintCfg.roughness,
            metalness: 0.65
          })
        : shared.glassMat;

    const L = spec.length;
    const W = spec.width;
    const H = spec.height;
    const rW = spec.wheelRadius;
    const wW = spec.wheelWidth;
    const clear = spec.clearance;

    const rootGroup = new THREE.Group();
    rootGroup.rotation.order = 'YXZ';

    const bodyTiltGroup = new THREE.Group();
    rootGroup.add(bodyTiltGroup);
    const exteriorCabinGroup = new THREE.Group();
    bodyTiltGroup.add(exteriorCabinGroup);

    const paintColor = opts.color !== undefined ? opts.color : pickColor(typeKey);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: paintColor,
      roughness: isPlayer ? 0.26 : 0.38,
      metalness: isPlayer ? 0.42 : 0.24
    });

    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef9e7 });
    const brakeMat = new THREE.MeshBasicMaterial({ color: 0x5c0d12 });
    const tailRunningMat = new THREE.MeshBasicMaterial({ color: 0x8f141b });
    const leftSignalMat = new THREE.MeshBasicMaterial({ color: 0x452b08 });
    const rightSignalMat = new THREE.MeshBasicMaterial({ color: 0x452b08 });

    // Optional special beacon materials (police red/blue bar, taxi roof dome)
    let policeRedMat = null;
    let policeBlueMat = null;
    let taxiDomeMat = null;

    // Contact shadow plane directly under vehicle
    const shadowPlane = new THREE.Mesh(shared.planeGeo, shared.shadowMat);
    shadowPlane.scale.set(W * 1.24, L * 1.08, 1);
    shadowPlane.position.y = 0.025;
    rootGroup.add(shadowPlane);

    function addBox(parent, sx, sy, sz, px, py, pz, mat, shadow, rotX) {
      const m = new THREE.Mesh(shared.boxGeo, mat);
      m.scale.set(sx, sy, sz);
      m.position.set(px, py, pz);
      if (rotX) m.rotation.x = rotX;
      if (shadow) m.castShadow = true;
      parent.add(m);
      return m;
    }

    const bodyLowerH = (H - clear) * (typeKey === 'van' ? 0.42 : typeKey === 'bus' ? 0.45 : 0.48);
    const bodyBaseY = clear + bodyLowerH * 0.5;
    const wheelZPositions = [];
    const frontZAxles = [];

    if (typeKey === 'big_rig') {
      // Colossus 18-Wheeler: massive long-nose tractor + twin stacks + armored freight trailer (5 axles)
      const tractorHoodLen = 1.95;
      const cabLen = 2.20;
      const trailerLen = 9.15;
      const hoodZ = -L * 0.5 + tractorHoodLen * 0.5;
      const cabZ = -L * 0.5 + tractorHoodLen + cabLen * 0.5;
      const trailerZ = L * 0.5 - trailerLen * 0.5;

      // Heavy steel chassis rail & front chrome cowcatcher bullbar
      addBox(bodyTiltGroup, W * 0.88, 0.48, L * 0.94, 0, clear + 0.24, 0.15, shared.darkTrimMat, castShadow);
      addBox(bodyTiltGroup, W * 0.94, 0.52, 0.18, 0, clear + 0.36, -L * 0.5 - 0.10, shared.chromeMat, castShadow);
      addBox(bodyTiltGroup, W * 0.86, 0.64, 0.08, 0, clear + 0.72, -L * 0.5 - 0.12, shared.chromeMat, false);

      // Long-nose muscular hood & huge slatted chrome radiator grille (stays visible in Interior view!)
      addBox(bodyTiltGroup, W * 0.86, 1.32, tractorHoodLen, 0, clear + 1.02, hoodZ, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.56, 1.12, 0.10, 0, clear + 1.00, -L * 0.5 + 0.02, shared.chromeMat, false);
      addBox(bodyTiltGroup, W * 0.46, 0.92, 0.11, 0, clear + 1.00, -L * 0.5 + 0.015, shared.grilleMat, false);

      // Cylindrical-profile chrome side fuel tanks & twin towering exhaust stacks behind cab
      addBox(bodyTiltGroup, 0.38, 0.44, 1.75, -W * 0.44, clear + 0.36, cabZ + 0.25, shared.chromeMat, false);
      addBox(bodyTiltGroup, 0.38, 0.44, 1.75, W * 0.44, clear + 0.36, cabZ + 0.25, shared.chromeMat, false);
      addBox(bodyTiltGroup, 0.14, 2.95, 0.14, -W * 0.47, clear + 2.15, cabZ + cabLen * 0.5 + 0.08, shared.chromeMat, castShadow);
      addBox(bodyTiltGroup, 0.14, 2.95, 0.14, W * 0.47, clear + 2.15, cabZ + cabLen * 0.5 + 0.08, shared.chromeMat, castShadow);

      // Exterior sleeper cab shell, glass, fairing, side mirrors & amber clearance lights (hidden in Interior view)
      addBox(exteriorCabinGroup, W * 0.94, 2.48, cabLen, 0, clear + 1.76, cabZ, bodyMat, castShadow);
      addBox(exteriorCabinGroup, W * 0.86, 0.74, 0.09, 0, clear + 2.34, cabZ - cabLen * 0.48, activeGlassMat, false, 0.10);
      addBox(exteriorCabinGroup, W * 0.955, 0.68, cabLen * 0.58, 0, clear + 2.34, cabZ - 0.15, activeGlassMat, false);
      addBox(exteriorCabinGroup, W * 0.88, 0.46, cabLen * 0.82, 0, clear + 3.16, cabZ + 0.12, bodyMat, false);
      // Big rig exterior side mirrors
      addBox(exteriorCabinGroup, 0.12, 0.38, 0.14, -W * 0.53, clear + 2.15, cabZ - cabLen * 0.35, shared.chromeMat, false);
      addBox(exteriorCabinGroup, 0.12, 0.38, 0.14, W * 0.53, clear + 2.15, cabZ - cabLen * 0.35, shared.chromeMat, false);
      // 5 amber cab roof clearance lights
      const clearanceMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      [-0.58, -0.29, 0, 0.29, 0.58].forEach((cx) => {
        addBox(exteriorCabinGroup, 0.09, 0.055, 0.08, cx, clear + 3.40, cabZ - cabLen * 0.32, clearanceMat, false);
      });

      // Massive armored freight trailer with body-colored side stripe + amber clearance strips
      const trailerMat = new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.46, metalness: 0.22 });
      const trailerH = H - clear - 0.68;
      const trailerMidY = clear + 0.68 + trailerH * 0.5;
      addBox(bodyTiltGroup, W, trailerH, trailerLen, 0, trailerMidY, trailerZ, trailerMat, castShadow);
      addBox(bodyTiltGroup, W * 1.006, 0.34, trailerLen * 0.96, 0, trailerMidY - 0.15, trailerZ, bodyMat, false);
      addBox(bodyTiltGroup, W * 1.01, 0.06, trailerLen * 0.92, 0, clear + 0.74, trailerZ, clearanceMat, false);
      // Trailer rear door frame & heavy chrome underride bumper
      addBox(bodyTiltGroup, W * 0.92, trailerH * 0.88, 0.06, 0, trailerMidY, L * 0.5 - 0.01, shared.darkTrimMat, false);
      addBox(bodyTiltGroup, W * 0.84, trailerH * 0.82, 0.05, 0, trailerMidY, L * 0.5 + 0.004, trailerMat, false);
      addBox(bodyTiltGroup, W * 0.96, 0.22, 0.16, 0, clear + 0.24, L * 0.5 - 0.04, shared.chromeMat, false);

      // 5 Axles (10 giant wheels): Front steer + 2 tractor drive axles + 2 trailer axles
      wheelZPositions.push(
        -L * 0.5 + 1.05,
        cabZ + cabLen * 0.5 + 0.55,
        cabZ + cabLen * 0.5 + 1.75,
        trailerZ + trailerLen * 0.28,
        trailerZ + trailerLen * 0.41
      );
      frontZAxles.push(-L * 0.5 + 1.05);
    } else if (typeKey === 'semi') {
      // Articulated Semi-Truck: tractor cab in front + long freight box trailer behind
      const tractorLen = 3.65;
      const trailerLen = 8.20;
      const tractorZ = -L * 0.5 + tractorLen * 0.5;
      const trailerZ = L * 0.5 - trailerLen * 0.5;

      // Tractor chassis & hood + tall sleeper cab
      addBox(bodyTiltGroup, W * 0.90, 0.46, tractorLen + 1.2, 0, clear + 0.23, tractorZ + 0.5, shared.darkTrimMat, castShadow);
      addBox(bodyTiltGroup, W * 0.88, 1.05, 1.45, 0, clear + 0.95, -L * 0.5 + 0.72, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.94, 2.25, 2.05, 0, clear + 1.55, tractorZ + 0.65, bodyMat, castShadow);
      // Tractor windshield & side glass
      addBox(bodyTiltGroup, W * 0.86, 0.72, 0.09, 0, clear + 2.02, tractorZ - 0.36, shared.glassMat, false, 0.14);
      addBox(bodyTiltGroup, W * 0.95, 0.64, 1.10, 0, clear + 2.02, tractorZ + 0.52, shared.glassMat, false);
      // Chrome grille & twin vertical exhaust stacks
      addBox(bodyTiltGroup, W * 0.52, 0.88, 0.08, 0, clear + 0.92, -L * 0.5 + 0.02, shared.chromeMat, false);
      addBox(bodyTiltGroup, 0.11, 2.5, 0.11, -W * 0.46, clear + 1.85, tractorZ + 1.55, shared.chromeMat, false);
      addBox(bodyTiltGroup, 0.11, 2.5, 0.11, W * 0.46, clear + 1.85, tractorZ + 1.55, shared.chromeMat, false);

      // Freight trailer box
      const trailerColor = TRAILER_PALETTE[Math.floor(paintColor % TRAILER_PALETTE.length)];
      const trailerMat = new THREE.MeshStandardMaterial({ color: trailerColor, roughness: 0.55, metalness: 0.08 });
      const trailerH = H - clear - 0.65;
      addBox(bodyTiltGroup, W, trailerH, trailerLen, 0, clear + 0.65 + trailerH * 0.5, trailerZ, trailerMat, castShadow);
      // Trailer rear door frame & red/steel underride bar
      addBox(bodyTiltGroup, W * 0.92, trailerH * 0.88, 0.06, 0, clear + 0.65 + trailerH * 0.5, L * 0.5 - 0.01, shared.darkTrimMat, false);
      addBox(bodyTiltGroup, W * 0.86, trailerH * 0.82, 0.05, 0, clear + 0.65 + trailerH * 0.5, L * 0.5 + 0.004, trailerMat, false);
      addBox(bodyTiltGroup, W * 0.94, 0.16, 0.14, 0, clear + 0.25, L * 0.5 - 0.04, shared.chromeMat, false);

      // Tractor front + drive axle + 2 trailer axles
      wheelZPositions.push(-L * 0.5 + 0.95, tractorZ + 1.25, trailerZ + trailerLen * 0.28, trailerZ + trailerLen * 0.40);
      frontZAxles.push(-L * 0.5 + 0.95);
    } else if (typeKey === 'bus') {
      // Highway Coach Bus: full-length body, panoramic tinted glass band, roof AC pods
      const bodyH = H - clear;
      addBox(bodyTiltGroup, W, bodyH * 0.48, L * 0.98, 0, clear + bodyH * 0.24, 0, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.98, bodyH * 0.50, L * 0.96, 0, clear + bodyH * 0.72, 0.05, bodyMat, castShadow);
      // Window wrap beltline
      addBox(bodyTiltGroup, W * 0.995, bodyH * 0.34, L * 0.86, 0, clear + bodyH * 0.72, 0.10, shared.glassMat, false);
      // Panoramic front windshield
      addBox(bodyTiltGroup, W * 0.92, bodyH * 0.42, 0.08, 0, clear + bodyH * 0.68, -L * 0.485, shared.glassMat, false, 0.10);
      // Roof AC pods
      addBox(bodyTiltGroup, W * 0.56, 0.22, 1.75, 0, H + 0.08, -1.6, shared.whiteTrimMat, false);
      addBox(bodyTiltGroup, W * 0.56, 0.22, 1.75, 0, H + 0.08, 2.2, shared.whiteTrimMat, false);
      // Bumpers
      addBox(bodyTiltGroup, W * 0.99, 0.26, 0.16, 0, clear + 0.13, -L * 0.49, shared.darkTrimMat, false);
      addBox(bodyTiltGroup, W * 0.99, 0.26, 0.16, 0, clear + 0.13, L * 0.49, shared.darkTrimMat, false);

      wheelZPositions.push(-L * 0.34, L * 0.24, L * 0.37);
      frontZAxles.push(-L * 0.34);
    } else if (typeKey === 'van') {
      // Delivery Box Van
      const cabLen = L * 0.28;
      const boxLen = L * 0.70;
      const cabZ = -L * 0.5 + cabLen * 0.5;
      const boxZ = L * 0.5 - boxLen * 0.5;

      addBox(bodyTiltGroup, W * 0.96, H * 0.46, cabLen, 0, clear + H * 0.23, cabZ, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.90, H * 0.34, cabLen * 0.86, 0, clear + H * 0.61, cabZ + 0.08, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.84, H * 0.26, 0.08, 0, clear + H * 0.61, cabZ - cabLen * 0.41, shared.glassMat, false, 0.26);
      addBox(bodyTiltGroup, W * 0.92, H * 0.22, cabLen * 0.55, 0, clear + H * 0.62, cabZ + 0.08, shared.glassMat, false);

      const cargoH = H - clear;
      const cargoMat = new THREE.MeshStandardMaterial({ color: paintColor, roughness: 0.55, metalness: 0.08 });
      addBox(bodyTiltGroup, W, cargoH, boxLen, 0, clear + cargoH * 0.5, boxZ, cargoMat, castShadow);
      addBox(bodyTiltGroup, W * 0.84, cargoH * 0.82, 0.05, 0, clear + cargoH * 0.52, L * 0.5 - 0.01, shared.darkTrimMat, false);
      addBox(bodyTiltGroup, W * 0.80, cargoH * 0.76, 0.04, 0, clear + cargoH * 0.52, L * 0.5 + 0.005, cargoMat, false);
      addBox(bodyTiltGroup, W * 0.98, 0.20, 0.16, 0, clear + 0.09, -L * 0.5 + 0.02, shared.darkTrimMat, false);
      addBox(bodyTiltGroup, W * 1.01, 0.22, 0.16, 0, clear + 0.10, L * 0.5 - 0.02, shared.darkTrimMat, false);

      wheelZPositions.push(-L * 0.30, L * 0.30);
      frontZAxles.push(-L * 0.30);
    } else if (typeKey === 'pickup' || typeKey === 'sport_pickup') {
      const hoodLen = L * spec.hoodFrac;
      const cabLen = L * spec.cabinFrac;
      const bedLen = L * (1 - spec.hoodFrac - spec.cabinFrac - 0.02);
      const hoodZ = -L * 0.5 + hoodLen * 0.5;
      const cabZ = hoodZ + hoodLen * 0.5 + cabLen * 0.5;
      const bedZ = L * 0.5 - bedLen * 0.5;

      addBox(bodyTiltGroup, W * 0.96, bodyLowerH, hoodLen, 0, bodyBaseY, hoodZ, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.98, bodyLowerH, cabLen, 0, bodyBaseY, cabZ, bodyMat, castShadow);
      const cabinH = (H - clear) * spec.cabinHeightFrac;
      const cabinY = clear + bodyLowerH + cabinH * 0.5 - 0.04;
      addBox(exteriorCabinGroup, W * 0.86, cabinH, cabLen * 0.90, 0, cabinY, cabZ + 0.04, bodyMat, castShadow);
      addBox(exteriorCabinGroup, W * 0.80, cabinH * 0.78, 0.08, 0, cabinY, cabZ - cabLen * 0.45, activeGlassMat, false, 0.38);
      addBox(exteriorCabinGroup, W * 0.82, cabinH * 0.72, cabLen * 0.94, 0, cabinY - 0.02, cabZ + 0.04, activeGlassMat, false);
      addBox(exteriorCabinGroup, W * 0.88, cabinH * 0.68, cabLen * 0.70, 0, cabinY - 0.02, cabZ + 0.04, activeGlassMat, false);

      const bedSideW = 0.14;
      const bedH = bodyLowerH * 0.96;
      const bedY = clear + bedH * 0.5;
      addBox(bodyTiltGroup, W * 0.96, bedH * 0.45, bedLen, 0, clear + bedH * 0.22, bedZ, shared.cargoBedMat, castShadow);
      addBox(bodyTiltGroup, bedSideW, bedH, bedLen, -W * 0.48 + bedSideW * 0.5, bedY, bedZ, bodyMat, castShadow);
      addBox(bodyTiltGroup, bedSideW, bedH, bedLen, W * 0.48 - bedSideW * 0.5, bedY, bedZ, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.96, bedH, 0.12, 0, bedY, L * 0.5 - 0.06, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.99, 0.20, 0.14, 0, clear + 0.10, -L * 0.5 + 0.03, shared.darkTrimMat, false);
      addBox(bodyTiltGroup, W * 0.99, 0.20, 0.14, 0, clear + 0.10, L * 0.5 - 0.03, shared.darkTrimMat, false);

      if (typeKey === 'sport_pickup') {
        // Hood power-bulge scoop, chin splitter, bed sport rollbar & twin chrome exhausts
        addBox(bodyTiltGroup, W * 0.36, 0.08, hoodLen * 0.52, 0, clear + bodyLowerH + 0.03, hoodZ + 0.08, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, W * 0.98, 0.10, 0.16, 0, clear + 0.06, -L * 0.5 + 0.04, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.09, cabinH * 0.85, 0.10, -W * 0.41, clear + bodyLowerH + cabinH * 0.40, cabZ + cabLen * 0.52, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.09, cabinH * 0.85, 0.10, W * 0.41, clear + bodyLowerH + cabinH * 0.40, cabZ + cabLen * 0.52, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, W * 0.88, 0.09, 0.10, 0, clear + bodyLowerH + cabinH * 0.80, cabZ + cabLen * 0.52, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.12, 0.08, 0.16, -W * 0.32, clear + 0.12, L * 0.50, shared.chromeMat, false);
        addBox(bodyTiltGroup, 0.12, 0.08, 0.16, W * 0.32, clear + 0.12, L * 0.50, shared.chromeMat, false);
        // Optional racing stripes on hood + cab roof
        if (custom.stripe && STRIPE_HEX[custom.stripe] !== undefined) {
          const stripeMat = new THREE.MeshStandardMaterial({
            color: STRIPE_HEX[custom.stripe],
            roughness: 0.32,
            metalness: 0.15
          });
          [-0.12, 0.12].forEach((sx) => {
            addBox(bodyTiltGroup, 0.14, 0.012, hoodLen * 0.90, sx, clear + bodyLowerH + 0.008, hoodZ, stripeMat, false);
            addBox(exteriorCabinGroup, 0.14, 0.012, cabLen * 0.82, sx, cabinY + cabinH * 0.505, cabZ + 0.04, stripeMat, false);
          });
        }
      }

      wheelZPositions.push(-L * 0.30, L * 0.30);
      frontZAxles.push(-L * 0.30);
    } else {
      // Sculpted Passenger Cars: Hatchback, Sedan, Wagon, SUV, Coupe, Taxi, Police, Player GT, GT V8, Supercar
      // Lower body chassis + slight shoulder tuck
      addBox(bodyTiltGroup, W * 0.99, bodyLowerH * 0.65, L * 0.96, 0, clear + bodyLowerH * 0.32, 0, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.95, bodyLowerH * 0.42, L * 0.93, 0, clear + bodyLowerH * 0.80, 0.02, bodyMat, castShadow);
      // Rocker skirt
      addBox(bodyTiltGroup, W * 0.995, 0.10, L * 0.88, 0, clear + 0.05, 0, shared.darkTrimMat, false);
      // Front splitter & low rear diffuser valence
      addBox(bodyTiltGroup, W * 0.94, bodyLowerH * 0.26, 0.14, 0, clear + bodyLowerH * 0.13, -L * 0.48, shared.darkTrimMat, false);
      addBox(bodyTiltGroup, W * 0.90, bodyLowerH * 0.22, 0.12, 0, clear + bodyLowerH * 0.11, L * 0.475, shared.darkTrimMat, false);

      // Cabin greenhouse with sculpted sloped front windshield & rear glass
      const cabinLen = L * spec.cabinFrac;
      const hoodLen = L * spec.hoodFrac;
      const cabinCenterZ = -L * 0.5 + hoodLen + cabinLen * 0.5;
      const cabinH = (H - clear) * spec.cabinHeightFrac;
      const cabinY = clear + bodyLowerH + cabinH * 0.5 - 0.05;
      const cabinW =
        W *
        (typeKey === 'supercar' ||
        typeKey === 'hypercar' ||
        typeKey === 'gt3' ||
        typeKey === 'prototype' ||
        typeKey === 'gt_v8' ||
        typeKey === 'coupe' ||
        typeKey === 'player_gt'
          ? 0.77
          : 0.82);

      // Roof & core cabin
      addBox(exteriorCabinGroup, cabinW, cabinH * 0.94, cabinLen * 0.74, 0, cabinY, cabinCenterZ, bodyMat, castShadow);
      // Side greenhouse glass
      addBox(exteriorCabinGroup, cabinW * 1.01, cabinH * 0.68, cabinLen * 0.70, 0, cabinY - 0.02, cabinCenterZ, activeGlassMat, false);

      // Sloped Front Windshield (tilts backward at top: +rotX)
      const wsLen = Math.hypot(cabinH * 0.95, cabinLen * 0.20);
      addBox(
        exteriorCabinGroup,
        cabinW * 0.92,
        wsLen,
        0.07,
        0,
        cabinY - 0.02,
        cabinCenterZ - cabinLen * 0.39,
        activeGlassMat,
        false,
        typeKey === 'supercar' || typeKey === 'hypercar' || typeKey === 'prototype'
          ? 0.68
          : typeKey === 'gt3'
          ? 0.60
          : 0.54
      );

      // Sloped Rear Glass (tilts forward at top: -rotX)
      const rearSlopeAngle =
        typeKey === 'hatchback' ||
        typeKey === 'rally_hatch' ||
        typeKey === 'suv' ||
        typeKey === 'sport_suv' ||
        typeKey === 'wagon'
          ? -0.26
          : typeKey === 'supercar' ||
            typeKey === 'hypercar' ||
            typeKey === 'gt3' ||
            typeKey === 'prototype' ||
            typeKey === 'coupe' ||
            typeKey === 'gt_v8' ||
            typeKey === 'jdm_coupe' ||
            typeKey === 'muscle'
          ? -0.66
          : -0.50;
      const rgLen = Math.hypot(cabinH * 0.95, cabinLen * 0.20);
      addBox(
        exteriorCabinGroup,
        cabinW * 0.90,
        rgLen,
        0.07,
        0,
        cabinY - 0.02,
        cabinCenterZ + cabinLen * 0.39,
        activeGlassMat,
        false,
        rearSlopeAngle
      );

      // Side mirrors
      const mirrorZ = cabinCenterZ - cabinLen * 0.30;
      const mirrorY = clear + bodyLowerH + 0.07;
      addBox(exteriorCabinGroup, 0.14, 0.08, 0.11, -W * 0.51, mirrorY, mirrorZ, bodyMat, false);
      addBox(exteriorCabinGroup, 0.14, 0.08, 0.11, W * 0.51, mirrorY, mirrorZ, bodyMat, false);

      if (typeKey === 'suv' || typeKey === 'wagon' || typeKey === 'sport_suv') {
        addBox(exteriorCabinGroup, 0.055, 0.055, cabinLen * 0.72, -cabinW * 0.42, cabinY + cabinH * 0.50, cabinCenterZ, shared.darkTrimMat, false);
        addBox(exteriorCabinGroup, 0.055, 0.055, cabinLen * 0.72, cabinW * 0.42, cabinY + cabinH * 0.50, cabinCenterZ, shared.darkTrimMat, false);
      }

      if (typeKey === 'taxi') {
        taxiDomeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        addBox(bodyTiltGroup, 0.46, 0.14, 0.22, 0, cabinY + cabinH * 0.52, cabinCenterZ - 0.1, taxiDomeMat, false);
        addBox(bodyTiltGroup, W * 1.002, 0.09, L * 0.54, 0, clear + bodyLowerH * 0.52, 0, shared.darkTrimMat, false);
      }

      if (typeKey === 'police') {
        // White patrol doors & roof cap + pushbar + red/blue lightbar (roof cap/bar in exteriorCabinGroup so Interior view is unobstructed)
        addBox(bodyTiltGroup, W * 0.996, bodyLowerH * 0.78, L * 0.38, 0, clear + bodyLowerH * 0.48, 0.05, shared.whiteTrimMat, false);
        addBox(exteriorCabinGroup, cabinW * 0.98, 0.06, cabinLen * 0.68, 0, cabinY + cabinH * 0.48, cabinCenterZ, shared.whiteTrimMat, false);
        addBox(bodyTiltGroup, W * 0.48, 0.26, 0.10, 0, clear + 0.28, -L * 0.51, shared.darkTrimMat, false);

        policeRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        policeBlueMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
        addBox(exteriorCabinGroup, 0.48, 0.09, 0.18, -0.26, cabinY + cabinH * 0.53, cabinCenterZ - 0.05, policeRedMat, false);
        addBox(exteriorCabinGroup, 0.48, 0.09, 0.18, 0.26, cabinY + cabinH * 0.53, cabinCenterZ - 0.05, policeBlueMat, false);
      }

      if (typeKey === 'player_gt') {
        addBox(bodyTiltGroup, 0.11, 0.07, 0.14, -W * 0.31, clear + 0.08, L * 0.49, shared.chromeMat, false);
        addBox(bodyTiltGroup, 0.11, 0.07, 0.14, W * 0.31, clear + 0.08, L * 0.49, shared.chromeMat, false);
      }

      if (typeKey === 'gt_v8') {
        [-0.36, -0.24, 0.24, 0.36].forEach((ex) => {
          addBox(bodyTiltGroup, 0.085, 0.065, 0.14, W * ex, clear + 0.08, L * 0.49, shared.chromeMat, false);
        });
      }

      if (typeKey === 'supercar') {
        addBox(bodyTiltGroup, W * 1.02, bodyLowerH * 0.42, 0.58, 0, clear + bodyLowerH * 0.48, 0.48, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.12, 0.07, 0.14, -0.14, clear + 0.10, L * 0.49, shared.chromeMat, false);
        addBox(bodyTiltGroup, 0.12, 0.07, 0.14, 0.14, clear + 0.10, L * 0.49, shared.chromeMat, false);
      }

      if (typeKey === 'jdm_coupe') {
        // Front intercooler & twin chrome cannon exhausts
        addBox(bodyTiltGroup, W * 0.42, 0.16, 0.08, 0, clear + 0.18, -L * 0.485, shared.chromeMat, false);
        addBox(bodyTiltGroup, 0.12, 0.10, 0.15, -W * 0.32, clear + 0.10, L * 0.49, shared.chromeMat, false);
        addBox(bodyTiltGroup, 0.12, 0.10, 0.15, W * 0.32, clear + 0.10, L * 0.49, shared.chromeMat, false);
      }

      if (typeKey === 'muscle') {
        // Raised supercharger hood bulge + quad exhausts
        const scoopZ = -L * 0.5 + hoodLen * 0.56;
        addBox(bodyTiltGroup, W * 0.34, 0.08, hoodLen * 0.56, 0, clear + bodyLowerH + 0.03, scoopZ, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, W * 0.24, 0.05, 0.08, 0, clear + bodyLowerH + 0.05, scoopZ - hoodLen * 0.25, shared.chromeMat, false);
        [-0.36, -0.25, 0.25, 0.36].forEach((ex) => {
          addBox(bodyTiltGroup, 0.08, 0.07, 0.14, W * ex, clear + 0.09, L * 0.49, shared.chromeMat, false);
        });
      }

      if (typeKey === 'hypercar') {
        // Roof air scoop + rear dorsal aero fin + side carbon intakes + large twin exit exhaust
        addBox(exteriorCabinGroup, 0.26, 0.10, 0.58, 0, cabinY + cabinH * 0.50, cabinCenterZ + 0.10, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.04, 0.20, 0.55, 0, clear + bodyLowerH + 0.10, cabinCenterZ + cabinLen * 0.42, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, W * 1.03, bodyLowerH * 0.45, 0.65, 0, clear + bodyLowerH * 0.46, 0.42, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.22, 0.09, 0.16, 0, clear + 0.14, L * 0.49, shared.chromeMat, false);
      }

      if (typeKey === 'rally_hatch') {
        // Quad rally bumper fog lamps + roof scoop + wide fender arches + twin exhausts
        [-0.24, -0.09, 0.09, 0.24].forEach((fx) => {
          addBox(bodyTiltGroup, 0.09, 0.09, 0.06, fx, clear + bodyLowerH * 0.36, -L * 0.5 + 0.01, headlightMat, false);
        });
        addBox(exteriorCabinGroup, 0.22, 0.08, 0.34, 0, cabinY + cabinH * 0.49, cabinCenterZ - 0.10, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, W * 1.04, bodyLowerH * 0.40, 0.76, 0, clear + bodyLowerH * 0.35, -L * 0.30, bodyMat, false);
        addBox(bodyTiltGroup, W * 1.04, bodyLowerH * 0.40, 0.76, 0, clear + bodyLowerH * 0.35, L * 0.30, bodyMat, false);
        addBox(bodyTiltGroup, 0.10, 0.08, 0.14, -W * 0.28, clear + 0.11, L * 0.49, shared.chromeMat, false);
        addBox(bodyTiltGroup, 0.10, 0.08, 0.14, W * 0.28, clear + 0.11, L * 0.49, shared.chromeMat, false);
      }

      if (typeKey === 'sport_suv') {
        // Hood twin vents + deep aggressive front splitter + quad chrome exhausts
        const hoodZ = -L * 0.5 + hoodLen * 0.55;
        addBox(bodyTiltGroup, 0.18, 0.03, hoodLen * 0.36, -W * 0.18, clear + bodyLowerH + 0.015, hoodZ, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.18, 0.03, hoodLen * 0.36, W * 0.18, clear + bodyLowerH + 0.015, hoodZ, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, W * 0.99, 0.10, 0.16, 0, clear + 0.06, -L * 0.49, shared.darkTrimMat, false);
        [-0.36, -0.26, 0.26, 0.36].forEach((ex) => {
          addBox(bodyTiltGroup, 0.08, 0.065, 0.14, W * ex, clear + 0.10, L * 0.49, shared.chromeMat, false);
        });
      }

      if (typeKey === 'gt3') {
        // Front dive-plane canards + wide vented splitter + rear diffuser fins + twin center exhausts
        addBox(bodyTiltGroup, W * 1.04, 0.05, 0.20, 0, clear + 0.05, -L * 0.49, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.11, 0.035, 0.24, -W * 0.50, clear + bodyLowerH * 0.42, -L * 0.44, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.11, 0.035, 0.24, W * 0.50, clear + bodyLowerH * 0.42, -L * 0.44, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.09, 0.07, 0.15, -0.09, clear + 0.09, L * 0.49, shared.chromeMat, false);
        addBox(bodyTiltGroup, 0.09, 0.07, 0.15, 0.09, clear + 0.09, L * 0.49, shared.chromeMat, false);
      }

      if (typeKey === 'prototype') {
        // Le Mans sculpted wheel pontoons + dorsal shark fin + roof intake + center titanium exhaust
        addBox(bodyTiltGroup, W * 1.04, bodyLowerH * 0.72, 1.05, 0, clear + bodyLowerH * 0.44, -L * 0.31, bodyMat, castShadow);
        addBox(bodyTiltGroup, W * 1.04, bodyLowerH * 0.72, 1.05, 0, clear + bodyLowerH * 0.44, L * 0.31, bodyMat, castShadow);
        addBox(exteriorCabinGroup, 0.28, 0.11, 0.62, 0, cabinY + cabinH * 0.50, cabinCenterZ + 0.08, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.04, 0.26, 0.95, 0, clear + bodyLowerH + 0.13, cabinCenterZ + cabinLen * 0.52, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.24, 0.09, 0.18, 0, clear + 0.14, L * 0.49, shared.chromeMat, false);
      }

      // Spoiler System (per customization override or archetype default)
      const spoilerStyle =
        custom.spoiler && custom.spoiler !== 'stock'
          ? custom.spoiler
          : typeKey === 'supercar' ||
            typeKey === 'hypercar' ||
            typeKey === 'jdm_coupe' ||
            typeKey === 'gt3' ||
            typeKey === 'prototype' ||
            typeKey === 'rally_hatch'
          ? 'gt'
          : typeKey === 'player_gt' || typeKey === 'gt_v8' || typeKey === 'muscle' || typeKey === 'sport_suv'
          ? 'lip'
          : 'none';

      const deckY = clear + bodyLowerH;
      if (spoilerStyle === 'lip') {
        addBox(bodyTiltGroup, W * 0.84, 0.05, 0.14, 0, deckY + 0.02, L * 0.45, shared.darkTrimMat, false);
      } else if (spoilerStyle === 'street') {
        addBox(bodyTiltGroup, W * 0.88, 0.04, 0.20, 0, deckY + 0.13, L * 0.43, shared.darkTrimMat, castShadow);
        addBox(bodyTiltGroup, 0.045, 0.12, 0.12, -W * 0.26, deckY + 0.06, L * 0.43, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.045, 0.12, 0.12, W * 0.26, deckY + 0.06, L * 0.43, shared.darkTrimMat, false);
      } else if (spoilerStyle === 'gt') {
        addBox(bodyTiltGroup, W * 0.94, 0.045, 0.26, 0, deckY + 0.21, L * 0.42, shared.darkTrimMat, castShadow);
        addBox(bodyTiltGroup, 0.05, 0.20, 0.14, -W * 0.30, deckY + 0.10, L * 0.42, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.05, 0.20, 0.14, W * 0.30, deckY + 0.10, L * 0.42, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.025, 0.11, 0.28, -W * 0.47, deckY + 0.21, L * 0.42, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.025, 0.11, 0.28, W * 0.47, deckY + 0.21, L * 0.42, shared.darkTrimMat, false);
      }

      // Racing Stripes (twin center stripes over hood, roof, and rear deck)
      if (custom.stripe && STRIPE_HEX[custom.stripe] !== undefined) {
        const stripeMat = new THREE.MeshStandardMaterial({
          color: STRIPE_HEX[custom.stripe],
          roughness: 0.32,
          metalness: 0.15
        });
        const stripeW = 0.14;
        const stripeSep = 0.11;
        const hoodStripeZ = -L * 0.5 + hoodLen * 0.5;
        const deckLen = L * Math.max(0.12, 1 - spec.hoodFrac - spec.cabinFrac);
        const deckStripeZ = L * 0.5 - deckLen * 0.5;
        [-stripeSep, stripeSep].forEach((sx) => {
          addBox(bodyTiltGroup, stripeW, 0.012, hoodLen * 0.92, sx, deckY + 0.008, hoodStripeZ, stripeMat, false);
          addBox(exteriorCabinGroup, stripeW, 0.012, cabinLen * 0.72, sx, cabinY + cabinH * 0.47, cabinCenterZ, stripeMat, false);
          addBox(bodyTiltGroup, stripeW, 0.012, deckLen * 0.88, sx, deckY + 0.008, deckStripeZ, stripeMat, false);
        });
      }

      wheelZPositions.push(-L * 0.30, L * 0.30);
      frontZAxles.push(-L * 0.30);
    }

    // Chassis Underglow Neon (optional customization)
    if (custom.underglow && custom.underglow !== 'none') {
      const glowMat = getUnderglowMat(custom.underglow);
      if (glowMat) {
        const neonPlane = new THREE.Mesh(shared.planeGeo, glowMat);
        neonPlane.scale.set(W * 1.42, L * 1.14, 1);
        neonPlane.position.y = 0.036;
        rootGroup.add(neonPlane);
      }
    }

    // Front grille & rear license plate
    if (typeKey !== 'semi' && typeKey !== 'bus' && typeKey !== 'big_rig') {
      const grilleY = clear + bodyLowerH * 0.46;
      addBox(bodyTiltGroup, W * 0.46, bodyLowerH * 0.32, 0.06, 0, grilleY, -L * 0.5 + 0.01, shared.grilleMat, false);
    }
    const plateY = typeKey === 'semi' || typeKey === 'big_rig' ? clear + 0.45 : clear + bodyLowerH * 0.42;
    addBox(bodyTiltGroup, 0.48, 0.12, 0.03, 0, plateY, L * 0.485 + 0.01, shared.plateMat, false);

    // Lighting positions
    const lightY =
      typeKey === 'van'
        ? clear + H * 0.24
        : typeKey === 'semi'
        ? clear + 0.65
        : typeKey === 'big_rig'
        ? clear + 0.78
        : typeKey === 'bus'
        ? clear + 0.55
        : clear + bodyLowerH * 0.64;
    const rearLightY =
      typeKey === 'van'
        ? clear + H * 0.26
        : typeKey === 'semi'
        ? clear + 0.56
        : typeKey === 'big_rig'
        ? clear + 0.62
        : typeKey === 'bus'
        ? clear + 0.68
        : clear + bodyLowerH * 0.70;
    const lightX = W * 0.38;
    const signalX = W * 0.45;
    const frontZ = -L * 0.5 + 0.01;
    const rearZ = L * 0.5 + 0.01;

    // Front headlights
    addBox(bodyTiltGroup, W * 0.18, 0.12, 0.05, -lightX, lightY, frontZ, headlightMat, false);
    addBox(bodyTiltGroup, W * 0.18, 0.12, 0.05, lightX, lightY, frontZ, headlightMat, false);

    const headlightGlowMat = new THREE.MeshBasicMaterial({
      map: shared.headlightGlowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.0
    });
    const hlGlowL = new THREE.Mesh(shared.spriteGeo, headlightGlowMat);
    hlGlowL.scale.set(0.65, 0.65, 1);
    hlGlowL.position.set(-lightX, lightY, frontZ - 0.04);
    bodyTiltGroup.add(hlGlowL);
    const hlGlowR = new THREE.Mesh(shared.spriteGeo, headlightGlowMat);
    hlGlowR.scale.set(0.65, 0.65, 1);
    hlGlowR.position.set(lightX, lightY, frontZ - 0.04);
    bodyTiltGroup.add(hlGlowR);

    // Rear taillights & brake clusters
    addBox(bodyTiltGroup, W * 0.20, 0.11, 0.05, -lightX, rearLightY, rearZ, tailRunningMat, false);
    addBox(bodyTiltGroup, W * 0.20, 0.11, 0.05, lightX, rearLightY, rearZ, tailRunningMat, false);
    addBox(bodyTiltGroup, W * 0.16, 0.11, 0.06, -lightX + 0.02, rearLightY, rearZ + 0.005, brakeMat, false);
    addBox(bodyTiltGroup, W * 0.16, 0.11, 0.06, lightX - 0.02, rearLightY, rearZ + 0.005, brakeMat, false);

    if (
      typeKey === 'gt_v8' ||
      typeKey === 'supercar' ||
      typeKey === 'hypercar' ||
      typeKey === 'gt3' ||
      typeKey === 'prototype'
    ) {
      // Sleek full-width rear LED light bar
      addBox(bodyTiltGroup, W * 0.72, 0.035, 0.045, 0, rearLightY, rearZ + 0.003, tailRunningMat, false);
    }

    const highBrakeY =
      typeKey === 'van' || typeKey === 'semi' || typeKey === 'bus' || typeKey === 'big_rig'
        ? H - 0.22
        : typeKey === 'pickup' || typeKey === 'sport_pickup'
        ? clear + bodyLowerH * 0.92
        : clear + bodyLowerH + 0.04;
    const highBrakeZ =
      typeKey === 'van' ||
      typeKey === 'semi' ||
      typeKey === 'bus' ||
      typeKey === 'big_rig' ||
      typeKey === 'pickup' ||
      typeKey === 'sport_pickup'
        ? L * 0.5 + 0.01
        : L * 0.44;
    addBox(bodyTiltGroup, W * 0.24, 0.045, 0.05, 0, highBrakeY, highBrakeZ, brakeMat, false);

    const brakeGlowMat = new THREE.MeshBasicMaterial({
      map: shared.redGlowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.0
    });
    const bGlowL = new THREE.Mesh(shared.spriteGeo, brakeGlowMat);
    bGlowL.scale.set(0.75, 0.75, 1);
    bGlowL.position.set(-lightX, rearLightY, rearZ + 0.05);
    bodyTiltGroup.add(bGlowL);
    const bGlowR = new THREE.Mesh(shared.spriteGeo, brakeGlowMat);
    bGlowR.scale.set(0.75, 0.75, 1);
    bGlowR.position.set(lightX, rearLightY, rearZ + 0.05);
    bodyTiltGroup.add(bGlowR);

    // Left & Right Turn Signals (also support hazard mode dir === 2)
    addBox(bodyTiltGroup, 0.11, 0.09, 0.06, -signalX, lightY - 0.03, frontZ, leftSignalMat, false);
    addBox(bodyTiltGroup, 0.11, 0.09, 0.06, -signalX, rearLightY - 0.01, rearZ + 0.006, leftSignalMat, false);
    addBox(bodyTiltGroup, 0.11, 0.09, 0.06, signalX, lightY - 0.03, frontZ, rightSignalMat, false);
    addBox(bodyTiltGroup, 0.11, 0.09, 0.06, signalX, rearLightY - 0.01, rearZ + 0.006, rightSignalMat, false);

    const leftGlowMat = new THREE.MeshBasicMaterial({
      map: shared.amberGlowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.0
    });
    const rightGlowMat = new THREE.MeshBasicMaterial({
      map: shared.amberGlowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.0
    });
    const lGlowRear = new THREE.Mesh(shared.spriteGeo, leftGlowMat);
    lGlowRear.scale.set(0.65, 0.65, 1);
    lGlowRear.position.set(-signalX, rearLightY - 0.01, rearZ + 0.06);
    bodyTiltGroup.add(lGlowRear);
    const lGlowFront = new THREE.Mesh(shared.spriteGeo, leftGlowMat);
    lGlowFront.scale.set(0.55, 0.55, 1);
    lGlowFront.position.set(-signalX, lightY - 0.03, frontZ - 0.05);
    bodyTiltGroup.add(lGlowFront);

    const rGlowRear = new THREE.Mesh(shared.spriteGeo, rightGlowMat);
    rGlowRear.scale.set(0.65, 0.65, 1);
    rGlowRear.position.set(signalX, rearLightY - 0.01, rearZ + 0.06);
    bodyTiltGroup.add(rGlowRear);
    const rGlowFront = new THREE.Mesh(shared.spriteGeo, rightGlowMat);
    rGlowFront.scale.set(0.55, 0.55, 1);
    rGlowFront.position.set(signalX, lightY - 0.03, frontZ - 0.05);
    bodyTiltGroup.add(rGlowFront);

    // Wheels
    const trackX = W * 0.46;
    const wheelSpinMeshes = [];
    const frontSteerPivots = [];

    function makeWheel(x, z, isFront) {
      const pivot = new THREE.Group();
      pivot.position.set(x, rW, z);

      const spinGroup = new THREE.Group();
      const tire = new THREE.Mesh(shared.cylGeo, shared.tireMat);
      tire.scale.set(wW, rW, rW);
      if (castShadow) tire.castShadow = true;
      spinGroup.add(tire);

      const hub = new THREE.Mesh(shared.cylGeo, activeRimMat);
      hub.scale.set(wW * 1.03, rW * 0.60, rW * 0.60);
      spinGroup.add(hub);

      pivot.add(spinGroup);
      rootGroup.add(pivot);
      wheelSpinMeshes.push(spinGroup);
      if (isFront) frontSteerPivots.push(pivot);
    }

    for (let i = 0; i < wheelZPositions.length; i++) {
      const wz = wheelZPositions[i];
      const isFront = frontZAxles.includes(wz);
      makeWheel(-trackX, wz, isFront);
      makeWheel(trackX, wz, isFront);
    }

    // Two-mode headlights: Short (low beam) & Long (high beam) + SpotLight (player vehicles)
    let shortBeamGroup = null;
    let longBeamGroup = null;
    let highBeamSpot = null;
    if (isPlayer && shared.beamTex) {
      shortBeamGroup = new THREE.Group();
      shortBeamGroup.visible = false;

      const shortBeamMat = new THREE.MeshBasicMaterial({
        map: shared.beamTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        opacity: 0.28
      });

      const shortPoolMat = new THREE.MeshBasicMaterial({
        map: shared.beamTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.30
      });

      [-lightX, lightX].forEach((bx) => {
        const sBeam = new THREE.Mesh(shared.planeGeo, shortBeamMat);
        sBeam.scale.set(2.0, 18, 1);
        sBeam.position.set(bx, lightY - 0.16, frontZ - 9);
        sBeam.rotation.x = 0.036;
        shortBeamGroup.add(sBeam);
      });

      const shortPool = new THREE.Mesh(shared.planeGeo, shortPoolMat);
      shortPool.scale.set(5.4, 24, 1);
      shortPool.position.set(0, 0.08, frontZ - 12);
      shortBeamGroup.add(shortPool);
      bodyTiltGroup.add(shortBeamGroup);

      longBeamGroup = new THREE.Group();
      longBeamGroup.visible = false;

      const longBeamMat = new THREE.MeshBasicMaterial({
        map: shared.beamTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        opacity: 0.58
      });

      const longPoolMat = new THREE.MeshBasicMaterial({
        map: shared.beamTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.54
      });

      [-lightX, lightX].forEach((bx) => {
        const horizBeam = new THREE.Mesh(shared.planeGeo, longBeamMat);
        horizBeam.scale.set(3.8, 42, 1);
        horizBeam.position.set(bx, lightY - 0.12, frontZ - 21);
        horizBeam.rotation.x = 0.015;
        longBeamGroup.add(horizBeam);

        const vertBeam = new THREE.Mesh(shared.planeGeo, longBeamMat);
        vertBeam.scale.set(2.5, 42, 1);
        vertBeam.position.set(bx, lightY - 0.06, frontZ - 21);
        vertBeam.rotation.z = Math.PI / 2;
        longBeamGroup.add(vertBeam);
      });

      const longPool = new THREE.Mesh(shared.planeGeo, longPoolMat);
      longPool.scale.set(7.6, 52, 1);
      longPool.position.set(0, 0.09, frontZ - 26);
      longBeamGroup.add(longPool);
      bodyTiltGroup.add(longBeamGroup);

      if (typeof THREE.SpotLight === 'function') {
        highBeamSpot = new THREE.SpotLight(0xeef7ff, 0, 175, Math.PI / 4.2, 0.48, 1.02);
        highBeamSpot.castShadow = false;
        highBeamSpot.position.set(0, lightY + 0.25, frontZ);
        highBeamSpot.target.position.set(0, 0.2, frontZ - 48);
        bodyTiltGroup.add(highBeamSpot);
        bodyTiltGroup.add(highBeamSpot.target);
      }
    }

    let lastBraking = null;
    let lastSignalState = null;
    let lastHeadlightBoost = null;
    let currentBeamMode = 'off';
    let currentBaseStrength = 0.1;

    function setBraking(on) {
      const b = !!on;
      if (b === lastBraking) return;
      lastBraking = b;
      brakeMat.color.setHex(b ? 0xff2424 : 0x5c0d12);
      brakeGlowMat.opacity = b ? 0.75 : 0.0;
    }

    function setBlinker(dir, blinkOn) {
      // dir: -1 left, +1 right, 2 both (hazards), 0 off
      const state = dir === 0 || !blinkOn ? 0 : dir === 2 ? 2 : dir < 0 ? -1 : 1;
      if (state === lastSignalState) return;
      lastSignalState = state;
      const leftActive = state === -1 || state === 2;
      const rightActive = state === 1 || state === 2;
      leftSignalMat.color.setHex(leftActive ? 0xffae19 : 0x452b08);
      rightSignalMat.color.setHex(rightActive ? 0xffae19 : 0x452b08);
      leftGlowMat.opacity = leftActive ? 0.85 : 0.0;
      rightGlowMat.opacity = rightActive ? 0.85 : 0.0;
    }

    function setHeadlights(intensity) {
      currentBaseStrength = intensity;
      if (currentBeamMode !== 'off') return;
      const q = Math.round(intensity * 10);
      if (q === lastHeadlightBoost) return;
      lastHeadlightBoost = q;
      if (intensity > 0.3) {
        headlightMat.color.setHex(0xffffff);
        headlightGlowMat.opacity = intensity * 0.65;
        tailRunningMat.color.setHex(0xdc2626);
      } else {
        headlightMat.color.setHex(0xf1f5f9);
        headlightGlowMat.opacity = 0.08;
        tailRunningMat.color.setHex(0x8f141b);
      }
    }

    function setBeamMode(mode, baseStrength) {
      if (baseStrength !== undefined) {
        currentBaseStrength = baseStrength;
      }
      const next = mode === 'long' ? 'long' : mode === 'short' ? 'short' : 'off';
      if (highBeamSpot) {
        if (next === 'long') {
          highBeamSpot.intensity = 6.2;
          highBeamSpot.distance = 175;
          highBeamSpot.angle = Math.PI / 4.2;
          highBeamSpot.target.position.set(0, 0.25, frontZ - 55);
        } else if (next === 'short') {
          highBeamSpot.intensity = currentBaseStrength > 0.7 ? 2.6 : 1.1;
          highBeamSpot.distance = 82;
          highBeamSpot.angle = Math.PI / 5.4;
          highBeamSpot.target.position.set(0, 0.1, frontZ - 24);
        } else {
          highBeamSpot.intensity = 0.0;
        }
      }
      if (next === currentBeamMode) return;
      currentBeamMode = next;
      if (shortBeamGroup) shortBeamGroup.visible = next === 'short';
      if (longBeamGroup) longBeamGroup.visible = next === 'long';

      if (next === 'long') {
        headlightMat.color.setHex(0xffffff);
        hlGlowL.scale.set(1.38, 1.38, 1);
        hlGlowR.scale.set(1.38, 1.38, 1);
        headlightGlowMat.opacity = 1.0;
        tailRunningMat.color.setHex(0xdc2626);
      } else if (next === 'short') {
        headlightMat.color.setHex(0xfef9e7);
        hlGlowL.scale.set(0.88, 0.88, 1);
        hlGlowR.scale.set(0.88, 0.88, 1);
        headlightGlowMat.opacity = 0.62;
        tailRunningMat.color.setHex(0xdc2626);
      } else {
        hlGlowL.scale.set(0.65, 0.65, 1);
        hlGlowR.scale.set(0.65, 0.65, 1);
        lastHeadlightBoost = null;
        setHeadlights(currentBaseStrength);
      }
    }

    function setHighBeam(active, baseStrength) {
      const base = baseStrength !== undefined ? baseStrength : currentBaseStrength;
      setBeamMode(active ? 'long' : base > 0.5 ? 'short' : 'off', base);
    }

    function updateSpecialLights(timeSec) {
      if (policeRedMat && policeBlueMat) {
        const phase = Math.floor(timeSec * 5.0) % 2 === 0;
        policeRedMat.color.setHex(phase ? 0xff2a2a : 0x450a0a);
        policeBlueMat.color.setHex(phase ? 0x172554 : 0x3b82f6);
      }
      if (taxiDomeMat) {
        taxiDomeMat.color.setHex(0xfef08a);
      }
    }

    function updateWheels(speedMs, dt, steerAngleRad) {
      const dRot = (speedMs * dt) / Math.max(rW, 0.25);
      for (let i = 0; i < wheelSpinMeshes.length; i++) {
        wheelSpinMeshes[i].rotation.x -= dRot;
      }
      if (steerAngleRad !== undefined) {
        for (let i = 0; i < frontSteerPivots.length; i++) {
          frontSteerPivots[i].rotation.y = -steerAngleRad;
        }
      }
    }

    function setBodyTilt(pitchRad, rollRad) {
      bodyTiltGroup.rotation.x = pitchRad || 0;
      bodyTiltGroup.rotation.z = rollRad || 0;
    }

    function setPaintColor(hex) {
      bodyMat.color.setHex(hex);
    }

    function setInteriorViewMode(enabled) {
      exteriorCabinGroup.visible = !enabled;
    }

    setBraking(false);
    setBlinker(0, false);
    setHeadlights(0.1);

    return {
      group: rootGroup,
      bodyTiltGroup,
      bodyMat,
      spec,
      setBraking,
      setBlinker,
      setHeadlights,
      setBeamMode,
      setHighBeam,
      updateSpecialLights,
      updateWheels,
      setBodyTilt,
      setPaintColor,
      setInteriorViewMode
    };
  }

  /**
   * Build detailed LHD 3D Cockpit Interior Rig with live Digital/Analog dash,
   * lowered ergonomic driver eye framing gauges cleanly through the wheel,
   * live mirrors, animated steering wheel + paddles & wipers.
   */
  function createInteriorRig(options) {
    const opts = options || {};
    const spec = opts.spec || ARCHETYPES.player_gt;
    const bodyMat = opts.bodyMat || getShared().darkTrimMat;
    const carName = opts.carName || spec.label || 'Grand Tourer';
    const shared = getShared();

    const L = spec.length;
    const W = spec.width;
    const H = spec.height;
    const clear = spec.clearance;
    const isBigRig = spec.id === 'big_rig';
    const bodyLowerH = (H - clear) * 0.48;
    const hoodTopY = isBigRig ? clear + 1.68 : clear + bodyLowerH;
    const hoodLen = L * spec.hoodFrac;
    const cowlZ = isBigRig ? -L * 0.5 + 1.95 : -L * 0.5 + hoodLen;

    const driverX = isBigRig ? -W * 0.24 : -W * 0.20;
    const eyeY = hoodTopY + 0.278;
    const eyeZ = cowlZ + 0.90;

    const interiorGroup = new THREE.Group();
    interiorGroup.visible = false;

    const dashMat = new THREE.MeshStandardMaterial({ color: 0x151820, roughness: 0.78, metalness: 0.12 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x101319, roughness: 0.65, metalness: 0.08 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.68 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1a1e26, roughness: 0.85, metalness: 0.05 });

    function addPart(parent, geo, mat, px, py, pz, sx, sy, sz, rx, ry, rz) {
      const m = new THREE.Mesh(geo, mat);
      if (sx !== undefined) m.scale.set(sx, sy, sz);
      m.position.set(px, py, pz);
      if (rx) m.rotation.x = rx;
      if (ry) m.rotation.y = ry;
      if (rz) m.rotation.z = rz;
      parent.add(m);
      return m;
    }

    // 1. Dashboard shelf, satin trim strip, and raised instrument binnacle
    const dashW = W * 0.86;
    const dashY = hoodTopY + 0.015;
    const dashZ = cowlZ + 0.14;
    addPart(interiorGroup, shared.boxGeo, dashMat, 0, dashY - 0.06, dashZ, dashW, 0.16, 0.36);
    addPart(interiorGroup, shared.boxGeo, trimMat, 0, dashY + 0.015, dashZ + 0.18, dashW * 0.96, 0.020, 0.025);

    // Instrument binnacle hood framing the 3D gauge cluster without clipping its top edge
    addPart(interiorGroup, shared.boxGeo, leatherMat, driverX, hoodTopY + 0.222, cowlZ + 0.23, 0.44, 0.024, 0.14, 0.04);
    addPart(interiorGroup, shared.boxGeo, leatherMat, driverX - 0.215, hoodTopY + 0.132, cowlZ + 0.23, 0.026, 0.17, 0.14);
    addPart(interiorGroup, shared.boxGeo, leatherMat, driverX + 0.215, hoodTopY + 0.132, cowlZ + 0.23, 0.026, 0.17, 0.14);

    // Center console divider & armrest
    addPart(interiorGroup, shared.boxGeo, dashMat, 0, hoodTopY - 0.18, cowlZ + 0.56, 0.26, 0.36, 0.86);
    addPart(interiorGroup, shared.boxGeo, trimMat, 0, hoodTopY + 0.005, cowlZ + 0.58, 0.12, 0.015, 0.38);

    // Door sill armrests (left & right peripheral framing)
    addPart(interiorGroup, shared.boxGeo, leatherMat, -W * 0.43, hoodTopY + 0.02, cowlZ + 0.46, 0.09, 0.12, 0.92);
    addPart(interiorGroup, shared.boxGeo, leatherMat, W * 0.43, hoodTopY + 0.02, cowlZ + 0.46, 0.09, 0.12, 0.92);

    // 2. Slim A-Pillars, Roof Header & Rearview Mirror
    const pillarLen = Math.hypot(eyeY + 0.28 - (dashY + 0.03), 0.44);
    const pillarPitch = Math.atan2(0.44, eyeY + 0.28 - (dashY + 0.03));
    const pillarGeo = new THREE.BoxGeometry(0.044, pillarLen, 0.055);
    const pillarMidY = (dashY + 0.03 + eyeY + 0.28) * 0.5;
    const pillarMidZ = cowlZ + 0.24;
    addPart(interiorGroup, pillarGeo, pillarMat, -W * 0.39, pillarMidY, pillarMidZ, 1, 1, 1, pillarPitch, 0, -0.14);
    addPart(interiorGroup, pillarGeo, pillarMat, W * 0.39, pillarMidY, pillarMidZ, 1, 1, 1, pillarPitch, 0, 0.14);

    // Upper roof header & interior rearview + left/right side mirrors (live textures supported!)
    const mirrorTex = opts.mirrorTextures || {};
    function makeMirroredPlane(w, h) {
      const g = new THREE.PlaneGeometry(w, h);
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        uv.setX(i, 1 - uv.getX(i));
      }
      uv.needsUpdate = true;
      return g;
    }

    const mirrorGlassCanvas = document.createElement('canvas');
    mirrorGlassCanvas.width = 128;
    mirrorGlassCanvas.height = 48;
    const mgCtx = mirrorGlassCanvas.getContext('2d');
    const mgGrad = mgCtx.createLinearGradient(0, 0, 0, 48);
    mgGrad.addColorStop(0, '#476b99');
    mgGrad.addColorStop(0.55, '#9ab5d1');
    mgGrad.addColorStop(0.56, '#2d333d');
    mgGrad.addColorStop(1, '#1e242c');
    mgCtx.fillStyle = mgGrad;
    mgCtx.fillRect(0, 0, 128, 48);
    const mirrorFallbackTex = new THREE.CanvasTexture(mirrorGlassCanvas);

    const rearMirrorMat = mirrorTex.rear
      ? new THREE.MeshBasicMaterial({ map: mirrorTex.rear })
      : new THREE.MeshBasicMaterial({ map: mirrorFallbackTex });
    const leftMirrorMat = mirrorTex.left
      ? new THREE.MeshBasicMaterial({ map: mirrorTex.left })
      : new THREE.MeshBasicMaterial({ map: mirrorFallbackTex });
    const rightMirrorMat = mirrorTex.right
      ? new THREE.MeshBasicMaterial({ map: mirrorTex.right })
      : new THREE.MeshBasicMaterial({ map: mirrorFallbackTex });

    addPart(interiorGroup, shared.boxGeo, pillarMat, 0, eyeY + 0.29, cowlZ + 0.46, W * 0.78, 0.06, 0.14);
    addPart(interiorGroup, shared.boxGeo, leatherMat, 0, eyeY + 0.19, cowlZ + 0.36, 0.26, 0.068, 0.032);
    addPart(interiorGroup, shared.boxGeo, shared.darkTrimMat, 0, eyeY + 0.24, cowlZ + 0.39, 0.02, 0.08, 0.025);
    addPart(interiorGroup, makeMirroredPlane(0.24, 0.054), rearMirrorMat, 0, eyeY + 0.19, cowlZ + 0.378);

    // Blind-spot amber/red warning triangles in outer upper corners of 3D wing mirrors
    const bsmCanvas = document.createElement('canvas');
    bsmCanvas.width = 64;
    bsmCanvas.height = 64;
    const bsmCtx = bsmCanvas.getContext('2d');
    const bsmGrad = bsmCtx.createRadialGradient(32, 34, 2, 32, 34, 26);
    bsmGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
    bsmGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.35)');
    bsmGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    bsmCtx.fillStyle = bsmGrad;
    bsmCtx.fillRect(0, 0, 64, 64);
    bsmCtx.fillStyle = '#ffffff';
    bsmCtx.beginPath();
    bsmCtx.moveTo(32, 12);
    bsmCtx.lineTo(52, 48);
    bsmCtx.lineTo(12, 48);
    bsmCtx.closePath();
    bsmCtx.fill();
    const bsmTex = new THREE.CanvasTexture(bsmCanvas);
    if (THREE.sRGBEncoding !== undefined) bsmTex.encoding = THREE.sRGBEncoding;

    const leftBsmMat = new THREE.MeshBasicMaterial({
      map: bsmTex,
      color: 0xf59e0b,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const rightBsmMat = leftBsmMat.clone();
    const bsmGeo = new THREE.PlaneGeometry(0.026, 0.024);

    // Driver Left Side Mirror angled inward toward driver + visible A-pillar BSM indicator
    const leftMirrorGroup = new THREE.Group();
    leftMirrorGroup.position.set(-W * 0.49, dashY + 0.085, cowlZ + 0.19);
    leftMirrorGroup.rotation.y = 0.14;
    interiorGroup.add(leftMirrorGroup);
    addPart(leftMirrorGroup, shared.boxGeo, bodyMat, 0, 0, 0, 0.16, 0.092, 0.10);
    addPart(leftMirrorGroup, makeMirroredPlane(0.135, 0.072), leftMirrorMat, 0, 0, 0.055);
    addPart(leftMirrorGroup, bsmGeo, leftBsmMat, -0.044, 0.019, 0.057);
    addPart(interiorGroup, bsmGeo, leftBsmMat, -W * 0.365, dashY + 0.135, cowlZ + 0.19, 1, 1, 1, 0, 0.18, 0);

    // Passenger Right Side Mirror angled inward toward driver + visible A-pillar BSM indicator
    const rightMirrorGroup = new THREE.Group();
    rightMirrorGroup.position.set(W * 0.49, dashY + 0.085, cowlZ + 0.19);
    rightMirrorGroup.rotation.y = -0.14;
    interiorGroup.add(rightMirrorGroup);
    addPart(rightMirrorGroup, shared.boxGeo, bodyMat, 0, 0, 0, 0.16, 0.092, 0.10);
    addPart(rightMirrorGroup, makeMirroredPlane(0.135, 0.072), rightMirrorMat, 0, 0, 0.055);
    addPart(rightMirrorGroup, bsmGeo, rightBsmMat, 0.044, 0.019, 0.057);
    addPart(interiorGroup, bsmGeo, rightBsmMat, W * 0.365, dashY + 0.135, cowlZ + 0.19, 1, 1, 1, 0, -0.35, 0);

    // Subtle interior windshield weather layer (raindrops & snow flecks cleared by wipers)
    const glassCanvas = document.createElement('canvas');
    glassCanvas.width = 384;
    glassCanvas.height = 192;
    const glassCtx = glassCanvas.getContext('2d');
    const glassTex = new THREE.CanvasTexture(glassCanvas);
    const glassMat = new THREE.MeshBasicMaterial({
      map: glassTex,
      transparent: true,
      opacity: 1,
      depthWrite: false
    });
    const glassMesh = addPart(
      interiorGroup,
      new THREE.PlaneGeometry(W * 0.78, pillarLen * 0.92),
      glassMat,
      0,
      pillarMidY,
      pillarMidZ - 0.015,
      1,
      1,
      1,
      pillarPitch
    );
    glassMesh.visible = false;

    // 3. Center Infotainment Screen (shifted right of steering rim for clear view)
    const infoCanvas = document.createElement('canvas');
    infoCanvas.width = 256;
    infoCanvas.height = 128;
    const infoCtx = infoCanvas.getContext('2d');
    const infoTex = new THREE.CanvasTexture(infoCanvas);
    if (THREE.sRGBEncoding !== undefined) infoTex.encoding = THREE.sRGBEncoding;
    const infoMat = new THREE.MeshBasicMaterial({ map: infoTex });
    const infoX = isBigRig ? 0.08 : 0.06;
    addPart(interiorGroup, shared.boxGeo, leatherMat, infoX, dashY + 0.105, dashZ + 0.17, 0.23, 0.12, 0.025, 0, 0.20, 0);
    addPart(interiorGroup, new THREE.PlaneGeometry(0.21, 0.10), infoMat, infoX + 0.002, dashY + 0.105, dashZ + 0.185, 1, 1, 1, 0, 0.20, 0);

    function drawInfotainment(weatherName, wiperMode) {
      infoCtx.fillStyle = '#0c1220';
      infoCtx.fillRect(0, 0, 256, 128);
      infoCtx.strokeStyle = '#1e293b';
      infoCtx.lineWidth = 3;
      infoCtx.strokeRect(2, 2, 252, 124);
      infoCtx.fillStyle = '#1e293b';
      infoCtx.beginPath();
      infoCtx.moveTo(95, 118);
      infoCtx.lineTo(122, 42);
      infoCtx.lineTo(138, 42);
      infoCtx.lineTo(165, 118);
      infoCtx.closePath();
      infoCtx.fill();
      infoCtx.strokeStyle = '#38bdf8';
      infoCtx.lineWidth = 2;
      infoCtx.beginPath();
      infoCtx.moveTo(130, 115);
      infoCtx.lineTo(130, 46);
      infoCtx.stroke();
      infoCtx.fillStyle = '#f8fafc';
      infoCtx.font = 'bold 16px sans-serif';
      infoCtx.fillText(carName, 14, 26);
      infoCtx.fillStyle = '#38bdf8';
      infoCtx.font = 'bold 13px sans-serif';
      infoCtx.fillText(weatherName || 'Afternoon', 14, 48);
      if (wiperMode && wiperMode !== 'AUTO') {
        infoCtx.fillStyle = '#94a3b8';
        infoCtx.font = 'bold 11px sans-serif';
        infoCtx.fillText(`WIPER: ${wiperMode}`, 14, 112);
      }
      infoTex.needsUpdate = true;
    }
    drawInfotainment('Afternoon', 'AUTO');

    // 4. High-Res Live 3D In-Dash Instrument Cluster (Digital OR Analog, crisp through wheel!)
    const clusterCanvas = document.createElement('canvas');
    clusterCanvas.width = 640;
    clusterCanvas.height = 280;
    const cCtx = clusterCanvas.getContext('2d');
    const clusterTex = new THREE.CanvasTexture(clusterCanvas);
    if (THREE.sRGBEncoding !== undefined) clusterTex.encoding = THREE.sRGBEncoding;
    const clusterMat = new THREE.MeshBasicMaterial({ map: clusterTex });
    addPart(interiorGroup, new THREE.PlaneGeometry(0.38, 0.155), clusterMat, driverX, hoodTopY + 0.120, cowlZ + 0.26, 1, 1, 1, -0.14);

    // 5. Animated 3D Steering Wheel + Column + Shift Paddles (framed wide so gauges & top indicator strip are completely clear)
    const wheelMount = new THREE.Group();
    wheelMount.position.set(driverX, hoodTopY + 0.042, cowlZ + 0.54);
    wheelMount.rotation.x = -0.22;
    interiorGroup.add(wheelMount);

    addPart(wheelMount, new THREE.CylinderGeometry(0.024, 0.028, 0.22, 10), leatherMat, 0, -0.022, -0.11, 1, 1, 1, Math.PI / 2);

    const wheelSpinGroup = new THREE.Group();
    wheelMount.add(wheelSpinGroup);

    const rimGeo = new THREE.TorusGeometry(0.212, 0.013, 10, 32);
    const rimMesh = new THREE.Mesh(rimGeo, leatherMat);
    wheelSpinGroup.add(rimMesh);

    // 12 o'clock centering stripe
    addPart(wheelSpinGroup, shared.boxGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), 0, 0.212, 0, 0.020, 0.024, 0.028);
    // Angled 3 Spokes + Hub (keeps upper window wide open for gauges)
    addPart(wheelSpinGroup, shared.boxGeo, trimMat, -0.118, -0.024, 0, 0.146, 0.022, 0.014, 0, 0, 0.22);
    addPart(wheelSpinGroup, shared.boxGeo, trimMat, 0.118, -0.024, 0, 0.146, 0.022, 0.014, 0, 0, -0.22);
    addPart(wheelSpinGroup, shared.boxGeo, trimMat, 0, -0.118, 0, 0.024, 0.146, 0.014);
    addPart(wheelSpinGroup, new THREE.CylinderGeometry(0.040, 0.040, 0.026, 16), leatherMat, 0, 0, 0.005, 1, 1, 1, Math.PI / 2);
    addPart(wheelSpinGroup, new THREE.CylinderGeometry(0.013, 0.013, 0.030, 12), trimMat, 0, 0, 0.007, 1, 1, 1, Math.PI / 2);

    // Left (-) & Right (+) Paddle Shifters
    const leftPaddlePivot = new THREE.Group();
    leftPaddlePivot.position.set(-0.105, -0.01, -0.025);
    addPart(leftPaddlePivot, shared.boxGeo, trimMat, -0.020, 0.014, 0, 0.026, 0.075, 0.008);
    wheelSpinGroup.add(leftPaddlePivot);

    const rightPaddlePivot = new THREE.Group();
    rightPaddlePivot.position.set(0.105, -0.01, -0.025);
    addPart(rightPaddlePivot, shared.boxGeo, trimMat, 0.020, 0.014, 0, 0.026, 0.075, 0.008);
    wheelSpinGroup.add(rightPaddlePivot);

    // 6. Dual Animated Windshield Wipers
    const wiperTiltGroup = new THREE.Group();
    wiperTiltGroup.position.set(0, dashY + 0.04, cowlZ + 0.03);
    wiperTiltGroup.rotation.x = 0.54;
    interiorGroup.add(wiperTiltGroup);

    const wiperBladeGeo = new THREE.BoxGeometry(0.56, 0.018, 0.014);
    wiperBladeGeo.translate(0.27, 0, 0);
    const wiperMat = new THREE.MeshStandardMaterial({ color: 0x0f1218, roughness: 0.7 });

    const wiperLeftPivot = new THREE.Group();
    wiperLeftPivot.position.set(driverX - 0.16, 0, 0);
    wiperLeftPivot.add(new THREE.Mesh(wiperBladeGeo, wiperMat));
    wiperTiltGroup.add(wiperLeftPivot);

    const wiperRightPivot = new THREE.Group();
    wiperRightPivot.position.set(0.08, 0, 0);
    wiperRightPivot.add(new THREE.Mesh(wiperBladeGeo, wiperMat));
    wiperTiltGroup.add(wiperRightPivot);

    let wiperPhase = 0;
    let wiperPrevAng = 0.06;
    let glassAccum = 0;
    let glassWasVisible = false;
    const glassDrops = [];
    let redrawAccum = 0;
    let lastWeatherDrawn = '';
    let lastWiperDrawn = 'AUTO';

    function drawAnalogDial(ctx, cx, cy, r, frac, needleColor, title, valueText, redZoneStart) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#0b101b';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.stroke();

      const startAng = Math.PI * 0.75;
      const sweepAng = Math.PI * 1.5;

      if (redZoneStart !== undefined) {
        ctx.beginPath();
        ctx.arc(cx, cy, r - 9, startAng + sweepAng * redZoneStart, startAng + sweepAng);
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();
      }

      for (let i = 0; i <= 10; i++) {
        const ang = startAng + (i / 10) * sweepAng;
        const inner = i % 2 === 0 ? r - 20 : r - 13;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
        ctx.lineTo(cx + Math.cos(ang) * (r - 5), cy + Math.sin(ang) * (r - 5));
        ctx.lineWidth = i % 2 === 0 ? 3 : 1.5;
        ctx.strokeStyle = redZoneStart !== undefined && i / 10 >= redZoneStart ? '#f87171' : '#cbd5e1';
        ctx.stroke();
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, cx, cy - 26);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(valueText, cx, cy + 48);

      const nAng = startAng + clampFrac(frac) * sweepAng;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(nAng) * 12, cy - Math.sin(nAng) * 12);
      ctx.lineTo(cx + Math.cos(nAng) * (r - 14), cy + Math.sin(nAng) * (r - 14));
      ctx.lineWidth = 4;
      ctx.strokeStyle = needleColor;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.restore();
    }

    function clampFrac(v) {
      return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    function drawTurnArrow(ctx, x, y, dir, active, activeColor) {
      ctx.save();
      ctx.beginPath();
      if (dir < 0) {
        ctx.moveTo(x - 13, y);
        ctx.lineTo(x - 1, y - 9);
        ctx.lineTo(x - 1, y - 4);
        ctx.lineTo(x + 12, y - 4);
        ctx.lineTo(x + 12, y + 4);
        ctx.lineTo(x - 1, y + 4);
        ctx.lineTo(x - 1, y + 9);
      } else {
        ctx.moveTo(x + 13, y);
        ctx.lineTo(x + 1, y - 9);
        ctx.lineTo(x + 1, y - 4);
        ctx.lineTo(x - 12, y - 4);
        ctx.lineTo(x - 12, y + 4);
        ctx.lineTo(x + 1, y + 4);
        ctx.lineTo(x + 1, y + 9);
      }
      ctx.closePath();
      if (active) {
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = activeColor;
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.42)';
      }
      ctx.fill();
      ctx.restore();
    }

    function drawHeadlightIcon(ctx, x, y, isLong, active) {
      const color = isLong ? '#38bdf8' : '#22c55e';
      ctx.save();
      if (active) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }
      ctx.strokeStyle = active ? color : 'rgba(148, 163, 184, 0.44)';
      ctx.fillStyle = active ? color : 'rgba(148, 163, 184, 0.40)';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';

      // Lamp housing dome on right
      ctx.beginPath();
      ctx.arc(x + 3, y, 7.5, -Math.PI * 0.5, Math.PI * 0.5, false);
      ctx.closePath();
      ctx.fill();

      // 3 rays shooting left (straight for blue long beam, angled down for green short beam)
      const dy = isLong ? 0 : 4.2;
      [-5, 0, 5].forEach((oy) => {
        ctx.beginPath();
        ctx.moveTo(x - 2, y + oy);
        ctx.lineTo(x - 14, y + oy + dy);
        ctx.stroke();
      });
      ctx.restore();
    }

    function drawHazardIcon(ctx, x, y, active) {
      ctx.save();
      if (active) {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
      }
      ctx.strokeStyle = active ? '#fbbf24' : 'rgba(148, 163, 184, 0.44)';
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y - 9);
      ctx.lineTo(x + 10, y + 8);
      ctx.lineTo(x - 10, y + 8);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x + 5, y + 5);
      ctx.lineTo(x - 5, y + 5);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    function drawSpeedLimitBadge(ctx, x, y, r, limitDisp, speeding) {
      ctx.save();
      if (speeding) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = speeding ? 4.2 : 3.4;
      ctx.strokeStyle = speeding ? '#ff2424' : '#dc2626';
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${r >= 15 ? 12 : 10}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(limitDisp), x, y + 1);
      ctx.restore();
    }

    function drawIndicatorStrip(state, x0, yCenter, width) {
      const h = 34;
      cCtx.save();
      cCtx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      cCtx.fillRect(x0, yCenter - h * 0.5, width, h);
      cCtx.strokeStyle = state.radarSpeeding
        ? 'rgba(239, 68, 68, 0.75)'
        : 'rgba(148, 163, 184, 0.25)';
      cCtx.lineWidth = 1.5;
      cCtx.strokeRect(x0, yCenter - h * 0.5, width, h);
      cCtx.restore();

      const sig = state.signalMode || 0;
      const blinkActive = !!state.blinkOn && sig !== 0;
      const leftOn = blinkActive && (sig === -1 || sig === 2);
      const rightOn = blinkActive && (sig === 1 || sig === 2);
      const hazOn = blinkActive && sig === 2;
      const beam = state.beamMode || (state.highBeams ? 'long' : 'off');
      const limitRaw = state.speedLimitKmh || 110;
      const limitDisp = state.useKmh ? limitRaw : Math.round(limitRaw * 0.621371);

      drawTurnArrow(cCtx, x0 + width * 0.10, yCenter, -1, leftOn, sig === 2 ? '#fbbf24' : '#22c55e');
      drawHeadlightIcon(cCtx, x0 + width * 0.27, yCenter, false, beam === 'short');
      drawHeadlightIcon(cCtx, x0 + width * 0.43, yCenter, true, beam === 'long');
      drawHazardIcon(cCtx, x0 + width * 0.58, yCenter, hazOn);
      drawSpeedLimitBadge(cCtx, x0 + width * 0.74, yCenter, 14, limitDisp, !!state.radarSpeeding);
      drawTurnArrow(cCtx, x0 + width * 0.90, yCenter, 1, rightOn, sig === 2 ? '#fbbf24' : '#22c55e');
    }

    function redrawClusterAndHud(state) {
      const dispSpeed = state.useKmh ? Math.round(state.speedKmh) : Math.round(state.speedMph);
      const unitTxt = state.useKmh ? 'KM/H' : 'MPH';
      const gearTxt = state.gearDisplay || 'D1';
      const rpmFrac = clampFrac(state.rpmNorm || 0.14);
      const maxDialSpeed = state.useKmh
        ? Math.max(280, Math.ceil(((state.maxSpeedKmh || 240) * 1.08) / 40) * 40)
        : Math.max(175, Math.ceil(((state.maxSpeedKmh || 240) * 0.621371 * 1.08) / 25) * 25);
      const spdFrac = clampFrac(dispSpeed / maxDialSpeed);

      cCtx.fillStyle = '#070b14';
      cCtx.fillRect(0, 0, 640, 280);

      if (state.gaugeStyle === 'analog') {
        // Indicator strip centered cleanly inside steering wheel arch
        drawIndicatorStrip(state, 190, 44, 260);

        drawAnalogDial(cCtx, 158, 174, 86, rpmFrac, '#f43f5e', 'RPM', (state.rpm / 1000).toFixed(1), 0.85);
        drawAnalogDial(cCtx, 482, 174, 86, spdFrac, '#38bdf8', unitTxt, String(dispSpeed));

        // Center Gear Badge & Telemetry
        cCtx.fillStyle = state.clutchPressed ? '#78350f' : rpmFrac > 0.9 ? '#991b1b' : '#0f172a';
        cCtx.fillRect(292, 90, 56, 52);
        cCtx.strokeStyle = state.clutchPressed ? '#fbbf24' : rpmFrac > 0.9 ? '#ef4444' : '#38bdf8';
        cCtx.lineWidth = 2;
        cCtx.strokeRect(292, 90, 56, 52);
        cCtx.fillStyle = '#ffffff';
        cCtx.font = 'bold 26px sans-serif';
        cCtx.textAlign = 'center';
        cCtx.fillText(gearTxt, 320, 126);

        cCtx.fillStyle = state.clutchPressed ? '#fbbf24' : '#94a3b8';
        cCtx.font = 'bold 13px sans-serif';
        cCtx.fillText(
          state.clutchPressed
            ? 'CLUTCH'
            : state.shiftPrompt === 1
            ? 'SHIFT ▲'
            : `${(state.distanceKm || 0).toFixed(1)} km`,
          320,
          164
        );

        const bankLabel = state.bankText || `$${Math.floor(state.bank || 0).toLocaleString('en-US')}`;
        cCtx.fillStyle = '#4ade80';
        cCtx.font = 'bold 15px sans-serif';
        cCtx.fillText(bankLabel, 320, 188);

        if (state.radarFineText) {
          cCtx.fillStyle = '#ef4444';
          cCtx.font = 'bold 14px sans-serif';
          cCtx.fillText(`FINE ${state.radarFineText}`, 320, 216);
        } else if (state.radarNearby) {
          cCtx.fillStyle = state.radarSpeeding ? '#f87171' : '#fbbf24';
          cCtx.font = 'bold 13px sans-serif';
          cCtx.fillText(
            state.radarSpeeding ? `⚠ SLOW ${state.radarDistM || 0}m` : `RADAR ${state.radarDistM || 0}m`,
            320,
            216
          );
        }

        if (state.hornActive) {
          cCtx.fillStyle = '#fde68a';
          cCtx.font = 'bold 12px sans-serif';
          cCtx.fillText('HORN', 320, 242);
        } else if ((state.damage || 0) > 0) {
          const cond = Math.max(0, Math.round(100 - state.damage));
          cCtx.fillStyle = cond > 60 ? '#22c55e' : cond > 30 ? '#f59e0b' : '#ef4444';
          cCtx.font = 'bold 12px sans-serif';
          cCtx.fillText(`COND ${cond}%`, 320, 242);
        }
      } else {
        // Crisp Digital Dash with Unobstructed Centered Indicator Panel
        cCtx.strokeStyle = 'rgba(56, 189, 248, 0.36)';
        cCtx.lineWidth = 2;
        cCtx.strokeRect(10, 10, 620, 260);

        // Centered segmented RPM bar (120..520, clear inside wheel upper window)
        const segs = 20;
        for (let i = 0; i < segs; i++) {
          const lit = i / segs < rpmFrac;
          cCtx.fillStyle = !lit
            ? 'rgba(255,255,255,0.10)'
            : i >= 17
            ? '#ef4444'
            : i >= 13
            ? '#f59e0b'
            : '#38bdf8';
          cCtx.fillRect(123 + i * 20, 16, 14, 12);
        }

        // Centered Indicator Panel (Left | Short Green | Long Blue | Hazard | Speed Limit | Right)
        drawIndicatorStrip(state, 190, 52, 260);

        // Centered radar warning / fine pill directly under indicator strip
        if (state.radarFineText) {
          cCtx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          cCtx.fillRect(235, 76, 170, 24);
          cCtx.strokeStyle = '#ef4444';
          cCtx.strokeRect(235, 76, 170, 24);
          cCtx.fillStyle = '#fecaca';
          cCtx.font = 'bold 13px sans-serif';
          cCtx.textAlign = 'center';
          cCtx.fillText(`FINE ${state.radarFineText}`, 320, 92);
        } else if (state.radarNearby) {
          cCtx.fillStyle = state.radarSpeeding ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.18)';
          cCtx.fillRect(235, 76, 170, 24);
          cCtx.strokeStyle = state.radarSpeeding ? '#ef4444' : '#f59e0b';
          cCtx.strokeRect(235, 76, 170, 24);
          cCtx.fillStyle = state.radarSpeeding ? '#fca5a5' : '#fde68a';
          cCtx.font = 'bold 12px sans-serif';
          cCtx.textAlign = 'center';
          cCtx.fillText(
            state.radarSpeeding ? `⚠ SLOW ${state.radarDistM || 0}m` : `RADAR ${state.radarDistM || 0}m`,
            320,
            92
          );
        }

        // Gear badge left
        cCtx.fillStyle = state.clutchPressed
          ? 'rgba(245,158,11,0.28)'
          : rpmFrac > 0.9
          ? 'rgba(239,68,68,0.28)'
          : 'rgba(56,189,248,0.16)';
        cCtx.fillRect(40, 100, 110, 96);
        cCtx.strokeStyle = state.clutchPressed ? '#fbbf24' : rpmFrac > 0.9 ? '#ef4444' : '#38bdf8';
        cCtx.strokeRect(40, 100, 110, 96);
        cCtx.fillStyle = '#e0f2fe';
        cCtx.font = 'bold 46px sans-serif';
        cCtx.textAlign = 'center';
        cCtx.fillText(gearTxt, 95, 162);

        if (state.clutchPressed) {
          cCtx.fillStyle = '#fbbf24';
          cCtx.font = 'bold 14px sans-serif';
          cCtx.fillText('CLUTCH', 95, 218);
        } else if (state.shiftPrompt === 1) {
          cCtx.fillStyle = '#fbbf24';
          cCtx.font = 'bold 14px sans-serif';
          cCtx.fillText('SHIFT ▲', 95, 218);
        } else if (state.shiftPrompt === -1) {
          cCtx.fillStyle = '#fbbf24';
          cCtx.font = 'bold 14px sans-serif';
          cCtx.fillText('DOWN ▼', 95, 218);
        }

        if (state.hornActive) {
          cCtx.fillStyle = 'rgba(245, 158, 11, 0.24)';
          cCtx.fillRect(42, 232, 106, 24);
          cCtx.strokeStyle = '#fbbf24';
          cCtx.strokeRect(42, 232, 106, 24);
          cCtx.fillStyle = '#fde68a';
          cCtx.font = 'bold 12px sans-serif';
          cCtx.textAlign = 'center';
          cCtx.fillText('HORN', 95, 249);
        }

        // Big digital speed center
        cCtx.fillStyle = state.radarSpeeding ? '#fca5a5' : '#ffffff';
        cCtx.font = 'bold 90px sans-serif';
        cCtx.textAlign = 'center';
        cCtx.fillText(String(dispSpeed), 336, 192);
        cCtx.fillStyle = '#38bdf8';
        cCtx.font = 'bold 20px sans-serif';
        cCtx.fillText(unitTxt, 336, 220);

        // Turbo boost gauge bar at bottom center
        const boostFrac = clampFrac(state.turboBoost || 0);
        if (boostFrac > 0.04) {
          cCtx.fillStyle = 'rgba(255,255,255,0.08)';
          cCtx.fillRect(256, 236, 160, 7);
          cCtx.fillStyle = boostFrac > 0.78 ? '#f59e0b' : '#38bdf8';
          cCtx.fillRect(256, 236, 160 * boostFrac, 7);
        }

        // Distance, streak, condition & bank right
        cCtx.textAlign = 'right';
        cCtx.fillStyle = '#94a3b8';
        cCtx.font = 'bold 17px sans-serif';
        cCtx.fillText(state.transmissionMode || 'AUTO', 598, 122);
        cCtx.fillStyle = '#f8fafc';
        cCtx.font = 'bold 28px sans-serif';
        cCtx.fillText(`${(state.distanceKm || 0).toFixed(2)} km`, 598, 160);
        cCtx.fillStyle = '#4ade80';
        cCtx.font = 'bold 20px sans-serif';
        const bankLabel = state.bankText || `$${Math.floor(state.bank || 0).toLocaleString('en-US')}`;
        cCtx.fillText(bankLabel, 598, 194);

        if ((state.streakMult || 1.0) > 1.04) {
          cCtx.fillStyle = '#fde047';
          cCtx.font = 'bold 16px sans-serif';
          cCtx.fillText(`${state.streakMult.toFixed(1)}x STREAK`, 598, 224);
        }

        if ((state.damage || 0) > 0) {
          const cond = Math.max(0, Math.round(100 - state.damage));
          cCtx.fillStyle = 'rgba(255,255,255,0.12)';
          cCtx.fillRect(468, 240, 130, 8);
          cCtx.fillStyle = cond > 60 ? '#22c55e' : cond > 30 ? '#f59e0b' : '#ef4444';
          cCtx.fillRect(468, 240, (130 * cond) / 100, 8);
        }
      }

      const assistVal =
        state.speedAssistMode && state.speedAssistMode !== 'off'
          ? state.useKmh
            ? Math.round(state.speedAssistTargetKmh || 110)
            : Math.round((state.speedAssistTargetKmh || 110) * 0.621371)
          : 0;
      const assistText =
        state.speedAssistMode === 'limit'
          ? `LIM ${assistVal}`
          : state.speedAssistMode === 'cruise'
          ? `CRU ${assistVal}`
          : '';
      if (assistText) {
        cCtx.fillStyle = state.speedAssistMode === 'limit' ? '#fbbf24' : '#2dd4bf';
        if (state.gaugeStyle === 'analog') {
          cCtx.textAlign = 'center';
          cCtx.font = 'bold 12px sans-serif';
          cCtx.fillText(assistText, 320, 264);
        } else {
          cCtx.textAlign = 'right';
          cCtx.font = 'bold 15px sans-serif';
          cCtx.fillText(assistText, 598, 94);
        }
      }

      clusterTex.needsUpdate = true;

      const curWiper = state.wiperMode || 'AUTO';
      if (state.weatherName !== lastWeatherDrawn || curWiper !== lastWiperDrawn) {
        lastWeatherDrawn = state.weatherName || 'Afternoon';
        lastWiperDrawn = curWiper;
        drawInfotainment(lastWeatherDrawn, curWiper);
      }
    }

    function updateWindshieldGlass(dt, precip, speedKmh, curAng, prevAng, sweepingNow) {
      const aMin = Math.min(prevAng, curAng) - 0.10;
      const aMax = Math.max(prevAng, curAng) + 0.10;
      const activelyWiping = sweepingNow && Math.abs(curAng - prevAng) > 0.008;

      if (precip === 'rain' || precip === 'snow') {
        const spawnCount = precip === 'rain' ? 2 : 1;
        for (let i = 0; i < spawnCount; i++) {
          if (glassDrops.length < 44 && Math.random() < (precip === 'rain' ? 0.65 : 0.45)) {
            glassDrops.push({
              kind: precip,
              x: 18 + Math.random() * 348,
              y: 12 + Math.random() * 156,
              r: precip === 'rain' ? 1.5 + Math.random() * 1.4 : 1.7 + Math.random() * 1.5,
              len: precip === 'rain' ? 2.5 + Math.random() * 4.5 : 0,
              alpha: (precip === 'rain' ? 0.18 : 0.22) + Math.random() * 0.14,
              vx: (Math.random() - 0.5) * 8,
              vy: precip === 'rain' ? -(3 + (speedKmh || 0) * 0.16) : 14 + Math.random() * 12,
              age: 0,
              maxAge: precip === 'rain' ? 2.4 + Math.random() * 1.6 : 1.9 + Math.random() * 1.3
            });
          }
        }
      }

      for (let i = glassDrops.length - 1; i >= 0; i--) {
        const d = glassDrops[i];
        d.age += dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.age >= d.maxAge || d.y < 2 || d.y > 190 || d.x < 4 || d.x > 380) {
          glassDrops.splice(i, 1);
          continue;
        }
        if (activelyWiping) {
          const dx1 = d.x - 92;
          const dy1 = 188 - d.y;
          const dist1 = Math.hypot(dx1, dy1);
          const ang1 = Math.atan2(dy1, dx1);
          const hit1 = dist1 >= 16 && dist1 <= 158 && ang1 >= aMin && ang1 <= aMax;

          const dx2 = d.x - 238;
          const dy2 = 188 - d.y;
          const dist2 = Math.hypot(dx2, dy2);
          const ang2 = Math.atan2(dy2, dx2);
          const hit2 = dist2 >= 16 && dist2 <= 158 && ang2 >= aMin && ang2 <= aMax;

          if (hit1 || hit2) {
            glassDrops.splice(i, 1);
          }
        }
      }

      const shouldShow = precip === 'rain' || precip === 'snow' || glassDrops.length > 0;
      glassMesh.visible = shouldShow;
      if (!shouldShow && !glassWasVisible) return;
      glassWasVisible = shouldShow;

      glassCtx.clearRect(0, 0, 384, 192);
      if (activelyWiping) {
        glassCtx.strokeStyle = 'rgba(220, 238, 255, 0.05)';
        glassCtx.lineWidth = 3;
        glassCtx.beginPath();
        glassCtx.moveTo(92, 188);
        glassCtx.lineTo(92 + Math.cos(curAng) * 150, 188 - Math.sin(curAng) * 150);
        glassCtx.moveTo(238, 188);
        glassCtx.lineTo(238 + Math.cos(curAng) * 150, 188 - Math.sin(curAng) * 150);
        glassCtx.stroke();
      }
      for (let i = 0; i < glassDrops.length; i++) {
        const d = glassDrops[i];
        const fade = Math.max(0, 1 - d.age / d.maxAge);
        const a = d.alpha * (0.4 + 0.6 * fade);
        if (d.kind === 'rain') {
          glassCtx.strokeStyle = `rgba(210, 232, 255, ${a.toFixed(3)})`;
          glassCtx.fillStyle = `rgba(225, 242, 255, ${a.toFixed(3)})`;
          glassCtx.lineWidth = Math.max(1.1, d.r * 0.65);
          glassCtx.beginPath();
          glassCtx.moveTo(d.x, d.y);
          glassCtx.lineTo(d.x + d.vx * 0.03, d.y + d.len);
          glassCtx.stroke();
          glassCtx.beginPath();
          glassCtx.arc(d.x, d.y, d.r * 0.72, 0, Math.PI * 2);
          glassCtx.fill();
        } else {
          glassCtx.fillStyle = `rgba(242, 248, 255, ${a.toFixed(3)})`;
          glassCtx.beginPath();
          glassCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          glassCtx.fill();
        }
      }
      glassTex.needsUpdate = true;
    }

    function updateInterior(state, dt) {
      // Steering wheel rotation + subtle high-speed vibration
      const vibe = state.speedKmh > 40 ? Math.sin((state.elapsed || 0) * 38) * 0.004 : 0;
      wheelSpinGroup.rotation.z = -(state.steer || 0) * 1.95 + vibe;

      // Paddle shifter pull animation
      const pTimer = state.paddleAnimTimer || 0;
      const pDir = state.paddleAnimDir || 0;
      leftPaddlePivot.rotation.y = pTimer > 0 && pDir < 0 ? 0.28 : 0;
      rightPaddlePivot.rotation.y = pTimer > 0 && pDir > 0 ? -0.28 : 0;

      // Blind-spot mirror triangles (subtle amber when occupied, red flash if signaling toward car)
      const sig = state.signalMode || 0;
      const elapsed = state.elapsed || 0;
      const updateBsmMat = (mat, active, signalingInto) => {
        if (active) {
          mat.color.setHex(signalingInto ? 0xef4444 : 0xf59e0b);
          const targetOp = signalingInto
            ? 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * 28))
            : 0.82;
          mat.opacity += (targetOp - mat.opacity) * Math.min(1, 18 * dt);
        } else if (mat.opacity > 0.005) {
          mat.opacity = Math.max(0, mat.opacity - 7 * dt);
        } else {
          mat.opacity = 0;
        }
      };
      updateBsmMat(leftBsmMat, !!state.blindSpotLeft, sig === -1);
      updateBsmMat(rightBsmMat, !!state.blindSpotRight, sig === 1);

      // Windshield wipers with AUTO / LOW / HIGH / OFF speed stages
      const wiperMode = state.wiperMode || 'AUTO';
      const precip = state.precip || 'none';
      let wipersActive = false;
      let wiperRate = 4.3;
      let wiperPause = 0.32;
      if (wiperMode === 'LOW') {
        wipersActive = true;
        wiperRate = 2.7;
        wiperPause = 1.35;
      } else if (wiperMode === 'HIGH') {
        wipersActive = true;
        wiperRate = 5.4;
        wiperPause = 0.14;
      } else if (wiperMode === 'AUTO') {
        if (precip === 'rain') {
          wipersActive = true;
          wiperRate = 4.3;
          wiperPause = 0.32;
        } else if (precip === 'snow') {
          wipersActive = true;
          wiperRate = 2.7;
          wiperPause = 0.90;
        }
      }

      let curAng = wiperLeftPivot.rotation.z;
      let sweepingNow = false;
      if (wipersActive) {
        const cycleLen = Math.PI * 2 + wiperPause * wiperRate;
        wiperPhase = (wiperPhase + dt * wiperRate) % cycleLen;
        sweepingNow = wiperPhase < Math.PI * 2;
        const sweep = sweepingNow ? 0.5 * (1 - Math.cos(wiperPhase)) : 0;
        curAng = 0.08 + sweep * 1.18;
        wiperLeftPivot.rotation.z = curAng;
        wiperRightPivot.rotation.z = curAng;
      } else {
        curAng += (0.06 - curAng) * Math.min(1, 8 * dt);
        wiperLeftPivot.rotation.z = curAng;
        wiperRightPivot.rotation.z = curAng;
      }

      glassAccum += dt;
      if (glassAccum >= 0.045) {
        const stepGlassDt = glassAccum;
        glassAccum = 0;
        updateWindshieldGlass(stepGlassDt, precip, state.speedKmh || 0, curAng, wiperPrevAng, sweepingNow);
        wiperPrevAng = curAng;
      }

      redrawAccum += dt;
      if (redrawAccum >= 0.04) {
        redrawAccum = 0;
        redrawClusterAndHud(state);
      }
    }

    function getDriverEyeLocal() {
      return {
        x: driverX,
        y: eyeY,
        z: eyeZ,
        lookY: eyeY - 2.38,
        lookZ: -38
      };
    }

    return {
      group: interiorGroup,
      updateInterior,
      redrawClusterAndHud,
      getDriverEyeLocal
    };
  }

  const api = {
    ARCHETYPES,
    EVERYDAY_PALETTE,
    VAN_PALETTE,
    TRAILER_PALETTE,
    BUS_PALETTE,
    pickColor,
    createVehicleMesh,
    createInteriorRig
  };

  if (typeof window !== 'undefined') {
    window.HighwayVehicles = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root && (typeof window === 'undefined' || root !== window)) {
    root.HighwayVehicles = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
