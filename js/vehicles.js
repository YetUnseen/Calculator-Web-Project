/* ==========================================================================
   HIGHWAY VEHICLES — 14 SCULPTED 3D VEHICLE ARCHETYPES & LIGHT CONTROLLERS
   - All meshes face -Z (forward), +X (right), +Y (up), grounded at y = 0
   - Angled windshields, rear glass, wheel arches, spoilers, trailers & beacons
   - Independent brake lights, L/R blinkers, hazard flashers & patrol lights
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
      headlightGlowTex
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

  function createVehicleMesh(options) {
    const opts = options || {};
    const typeKey = opts.archetype && ARCHETYPES[opts.archetype] ? opts.archetype : 'sedan';
    const spec = ARCHETYPES[typeKey];
    const shared = getShared();
    const isPlayer =
      !!opts.isPlayer || typeKey === 'player_gt' || typeKey === 'gt_v8' || typeKey === 'supercar';
    const castShadow = opts.castShadow !== false;

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

    if (typeKey === 'semi') {
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
    } else if (typeKey === 'pickup') {
      const hoodLen = L * 0.27;
      const cabLen = L * 0.34;
      const bedLen = L * 0.37;
      const hoodZ = -L * 0.5 + hoodLen * 0.5;
      const cabZ = hoodZ + hoodLen * 0.5 + cabLen * 0.5;
      const bedZ = L * 0.5 - bedLen * 0.5;

      addBox(bodyTiltGroup, W * 0.96, bodyLowerH, hoodLen, 0, bodyBaseY, hoodZ, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.98, bodyLowerH, cabLen, 0, bodyBaseY, cabZ, bodyMat, castShadow);
      const cabinH = (H - clear) * 0.46;
      const cabinY = clear + bodyLowerH + cabinH * 0.5 - 0.04;
      addBox(bodyTiltGroup, W * 0.86, cabinH, cabLen * 0.90, 0, cabinY, cabZ + 0.04, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.80, cabinH * 0.78, 0.08, 0, cabinY, cabZ - cabLen * 0.45, shared.glassMat, false, 0.38);
      addBox(bodyTiltGroup, W * 0.82, cabinH * 0.72, cabLen * 0.94, 0, cabinY - 0.02, cabZ + 0.04, shared.glassMat, false);
      addBox(bodyTiltGroup, W * 0.88, cabinH * 0.68, cabLen * 0.70, 0, cabinY - 0.02, cabZ + 0.04, shared.glassMat, false);

      const bedSideW = 0.14;
      const bedH = bodyLowerH * 0.96;
      const bedY = clear + bedH * 0.5;
      addBox(bodyTiltGroup, W * 0.96, bedH * 0.45, bedLen, 0, clear + bedH * 0.22, bedZ, shared.cargoBedMat, castShadow);
      addBox(bodyTiltGroup, bedSideW, bedH, bedLen, -W * 0.48 + bedSideW * 0.5, bedY, bedZ, bodyMat, castShadow);
      addBox(bodyTiltGroup, bedSideW, bedH, bedLen, W * 0.48 - bedSideW * 0.5, bedY, bedZ, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.96, bedH, 0.12, 0, bedY, L * 0.5 - 0.06, bodyMat, castShadow);
      addBox(bodyTiltGroup, W * 0.99, 0.20, 0.14, 0, clear + 0.10, -L * 0.5 + 0.03, shared.darkTrimMat, false);
      addBox(bodyTiltGroup, W * 0.99, 0.20, 0.14, 0, clear + 0.10, L * 0.5 - 0.03, shared.darkTrimMat, false);

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
      const cabinW = W * (typeKey === 'supercar' || typeKey === 'gt_v8' || typeKey === 'coupe' || typeKey === 'player_gt' ? 0.77 : 0.82);

      // Roof & core cabin
      addBox(exteriorCabinGroup, cabinW, cabinH * 0.94, cabinLen * 0.74, 0, cabinY, cabinCenterZ, bodyMat, castShadow);
      // Side greenhouse glass
      addBox(exteriorCabinGroup, cabinW * 1.01, cabinH * 0.68, cabinLen * 0.70, 0, cabinY - 0.02, cabinCenterZ, shared.glassMat, false);

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
        shared.glassMat,
        false,
        typeKey === 'supercar' ? 0.68 : 0.54
      );

      // Sloped Rear Glass (tilts forward at top: -rotX)
      const rearSlopeAngle =
        typeKey === 'hatchback' || typeKey === 'suv' || typeKey === 'wagon'
          ? -0.26
          : typeKey === 'supercar' || typeKey === 'coupe' || typeKey === 'gt_v8'
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
        shared.glassMat,
        false,
        rearSlopeAngle
      );

      // Side mirrors
      const mirrorZ = cabinCenterZ - cabinLen * 0.30;
      const mirrorY = clear + bodyLowerH + 0.07;
      addBox(exteriorCabinGroup, 0.14, 0.08, 0.11, -W * 0.51, mirrorY, mirrorZ, bodyMat, false);
      addBox(exteriorCabinGroup, 0.14, 0.08, 0.11, W * 0.51, mirrorY, mirrorZ, bodyMat, false);

      if (typeKey === 'suv' || typeKey === 'wagon') {
        addBox(exteriorCabinGroup, 0.055, 0.055, cabinLen * 0.72, -cabinW * 0.42, cabinY + cabinH * 0.50, cabinCenterZ, shared.darkTrimMat, false);
        addBox(exteriorCabinGroup, 0.055, 0.055, cabinLen * 0.72, cabinW * 0.42, cabinY + cabinH * 0.50, cabinCenterZ, shared.darkTrimMat, false);
      }

      if (typeKey === 'taxi') {
        taxiDomeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        addBox(bodyTiltGroup, 0.46, 0.14, 0.22, 0, cabinY + cabinH * 0.52, cabinCenterZ - 0.1, taxiDomeMat, false);
        addBox(bodyTiltGroup, W * 1.002, 0.09, L * 0.54, 0, clear + bodyLowerH * 0.52, 0, shared.darkTrimMat, false);
      }

      if (typeKey === 'police') {
        // White patrol doors & roof cap + pushbar + red/blue lightbar
        addBox(bodyTiltGroup, W * 0.996, bodyLowerH * 0.78, L * 0.38, 0, clear + bodyLowerH * 0.48, 0.05, shared.whiteTrimMat, false);
        addBox(bodyTiltGroup, cabinW * 0.98, 0.06, cabinLen * 0.68, 0, cabinY + cabinH * 0.48, cabinCenterZ, shared.whiteTrimMat, false);
        addBox(bodyTiltGroup, W * 0.48, 0.26, 0.10, 0, clear + 0.28, -L * 0.51, shared.darkTrimMat, false);

        policeRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        policeBlueMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
        addBox(bodyTiltGroup, 0.48, 0.09, 0.18, -0.26, cabinY + cabinH * 0.53, cabinCenterZ - 0.05, policeRedMat, false);
        addBox(bodyTiltGroup, 0.48, 0.09, 0.18, 0.26, cabinY + cabinH * 0.53, cabinCenterZ - 0.05, policeBlueMat, false);
      }

      if (typeKey === 'player_gt') {
        addBox(bodyTiltGroup, W * 0.82, 0.045, 0.14, 0, clear + bodyLowerH + 0.02, L * 0.45, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.11, 0.07, 0.14, -W * 0.31, clear + 0.08, L * 0.49, shared.chromeMat, false);
        addBox(bodyTiltGroup, 0.11, 0.07, 0.14, W * 0.31, clear + 0.08, L * 0.49, shared.chromeMat, false);
      }

      if (typeKey === 'gt_v8') {
        // Quad exhausts + sleek trunk spoiler
        addBox(bodyTiltGroup, W * 0.86, 0.055, 0.16, 0, clear + bodyLowerH + 0.02, L * 0.45, shared.darkTrimMat, false);
        [-0.36, -0.24, 0.24, 0.36].forEach((ex) => {
          addBox(bodyTiltGroup, 0.085, 0.065, 0.14, W * ex, clear + 0.08, L * 0.49, shared.chromeMat, false);
        });
      }

      if (typeKey === 'supercar') {
        // Side intake scoops + carbon rear GT wing + quad center exhausts
        addBox(bodyTiltGroup, W * 1.02, bodyLowerH * 0.42, 0.58, 0, clear + bodyLowerH * 0.48, 0.48, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, W * 0.90, 0.045, 0.24, 0, clear + bodyLowerH + 0.20, L * 0.42, shared.darkTrimMat, castShadow);
        addBox(bodyTiltGroup, 0.05, 0.18, 0.14, -W * 0.28, clear + bodyLowerH + 0.10, L * 0.42, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.05, 0.18, 0.14, W * 0.28, clear + bodyLowerH + 0.10, L * 0.42, shared.darkTrimMat, false);
        addBox(bodyTiltGroup, 0.12, 0.07, 0.14, -0.14, clear + 0.10, L * 0.49, shared.chromeMat, false);
        addBox(bodyTiltGroup, 0.12, 0.07, 0.14, 0.14, clear + 0.10, L * 0.49, shared.chromeMat, false);
      }

      wheelZPositions.push(-L * 0.30, L * 0.30);
      frontZAxles.push(-L * 0.30);
    }

    // Front grille & rear license plate
    if (typeKey !== 'semi' && typeKey !== 'bus') {
      const grilleY = clear + bodyLowerH * 0.46;
      addBox(bodyTiltGroup, W * 0.46, bodyLowerH * 0.32, 0.06, 0, grilleY, -L * 0.5 + 0.01, shared.grilleMat, false);
    }
    const plateY = typeKey === 'semi' ? clear + 0.45 : clear + bodyLowerH * 0.42;
    addBox(bodyTiltGroup, 0.48, 0.12, 0.03, 0, plateY, L * 0.485 + 0.01, shared.plateMat, false);

    // Lighting positions
    const lightY =
      typeKey === 'van'
        ? clear + H * 0.24
        : typeKey === 'semi'
        ? clear + 0.65
        : typeKey === 'bus'
        ? clear + 0.55
        : clear + bodyLowerH * 0.64;
    const rearLightY =
      typeKey === 'van'
        ? clear + H * 0.26
        : typeKey === 'semi'
        ? clear + 0.56
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

    if (typeKey === 'gt_v8' || typeKey === 'supercar') {
      // Sleek full-width rear LED light bar
      addBox(bodyTiltGroup, W * 0.72, 0.035, 0.045, 0, rearLightY, rearZ + 0.003, tailRunningMat, false);
    }

    const highBrakeY =
      typeKey === 'van' || typeKey === 'semi' || typeKey === 'bus'
        ? H - 0.22
        : typeKey === 'pickup'
        ? clear + bodyLowerH * 0.92
        : clear + bodyLowerH + 0.04;
    const highBrakeZ =
      typeKey === 'van' || typeKey === 'semi' || typeKey === 'bus' || typeKey === 'pickup'
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

      const hub = new THREE.Mesh(shared.cylGeo, shared.rimMat);
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

    let lastBraking = null;
    let lastSignalState = null;
    let lastHeadlightBoost = null;

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
      updateSpecialLights,
      updateWheels,
      setBodyTilt,
      setPaintColor,
      setInteriorViewMode
    };
  }

  /**
   * Build detailed LHD 3D Cockpit Interior Rig with live Digital/Analog dash,
   * translucent windshield HUD, animated steering wheel + paddles & wipers.
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
    const bodyLowerH = (H - clear) * 0.48;
    const hoodTopY = clear + bodyLowerH;
    const hoodLen = L * spec.hoodFrac;
    const cowlZ = -L * 0.5 + hoodLen;

    const driverX = -W * 0.20;
    const eyeY = hoodTopY + 0.37;
    const eyeZ = cowlZ + 0.82;

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

    // 1. Dashboard shelf, satin trim strip, and driver instrument cowl
    const dashW = W * 0.86;
    const dashY = hoodTopY + 0.03;
    const dashZ = cowlZ + 0.14;
    addPart(interiorGroup, shared.boxGeo, dashMat, 0, dashY - 0.05, dashZ, dashW, 0.18, 0.36);
    addPart(interiorGroup, shared.boxGeo, trimMat, 0, dashY + 0.025, dashZ + 0.18, dashW * 0.96, 0.022, 0.025);

    // Instrument binnacle hood over gauges
    addPart(interiorGroup, shared.boxGeo, leatherMat, driverX, dashY + 0.13, dashZ + 0.08, 0.42, 0.03, 0.19, 0.08);
    addPart(interiorGroup, shared.boxGeo, leatherMat, driverX - 0.195, dashY + 0.08, dashZ + 0.08, 0.028, 0.13, 0.18);
    addPart(interiorGroup, shared.boxGeo, leatherMat, driverX + 0.195, dashY + 0.08, dashZ + 0.08, 0.028, 0.13, 0.18);

    // Center console divider & armrest
    addPart(interiorGroup, shared.boxGeo, dashMat, 0, clear + 0.36, cowlZ + 0.56, 0.26, 0.38, 0.86);
    addPart(interiorGroup, shared.boxGeo, trimMat, 0, clear + 0.555, cowlZ + 0.58, 0.12, 0.015, 0.38);

    // Door sill armrests (left & right peripheral framing)
    addPart(interiorGroup, shared.boxGeo, leatherMat, -W * 0.43, hoodTopY + 0.02, cowlZ + 0.46, 0.09, 0.12, 0.92);
    addPart(interiorGroup, shared.boxGeo, leatherMat, W * 0.43, hoodTopY + 0.02, cowlZ + 0.46, 0.09, 0.12, 0.92);

    // 2. Slim A-Pillars, Roof Header & Rearview Mirror
    const pillarLen = Math.hypot(eyeY + 0.26 - (dashY + 0.04), 0.44);
    const pillarPitch = Math.atan2(0.44, eyeY + 0.26 - (dashY + 0.04));
    const pillarGeo = new THREE.BoxGeometry(0.044, pillarLen, 0.055);
    const pillarMidY = (dashY + 0.04 + eyeY + 0.26) * 0.5;
    const pillarMidZ = cowlZ + 0.24;
    addPart(interiorGroup, pillarGeo, pillarMat, -W * 0.39, pillarMidY, pillarMidZ, 1, 1, 1, pillarPitch, 0, -0.14);
    addPart(interiorGroup, pillarGeo, pillarMat, W * 0.39, pillarMidY, pillarMidZ, 1, 1, 1, pillarPitch, 0, 0.14);

    // Upper roof header & interior rearview mirror
    addPart(interiorGroup, shared.boxGeo, pillarMat, 0, eyeY + 0.28, cowlZ + 0.46, W * 0.78, 0.06, 0.14);
    addPart(interiorGroup, shared.boxGeo, leatherMat, 0, eyeY + 0.17, cowlZ + 0.36, 0.21, 0.055, 0.032);
    addPart(interiorGroup, shared.boxGeo, shared.darkTrimMat, 0, eyeY + 0.22, cowlZ + 0.39, 0.02, 0.08, 0.025);
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
    const mirrorGlassTex = new THREE.CanvasTexture(mirrorGlassCanvas);
    const mirrorGlassMat = new THREE.MeshBasicMaterial({ map: mirrorGlassTex });
    addPart(interiorGroup, new THREE.PlaneGeometry(0.19, 0.042), mirrorGlassMat, 0, eyeY + 0.17, cowlZ + 0.378);

    // Driver Side Mirror visible just outside left A-pillar
    addPart(interiorGroup, shared.boxGeo, bodyMat, -W * 0.50, dashY + 0.08, cowlZ + 0.17, 0.15, 0.085, 0.10);
    addPart(interiorGroup, new THREE.PlaneGeometry(0.12, 0.065), mirrorGlassMat, -W * 0.50, dashY + 0.08, cowlZ + 0.225);

    // 3. Center Infotainment Screen (positioned cleanly left of bottom-right HUD dials)
    const infoCanvas = document.createElement('canvas');
    infoCanvas.width = 256;
    infoCanvas.height = 128;
    const infoCtx = infoCanvas.getContext('2d');
    const infoTex = new THREE.CanvasTexture(infoCanvas);
    if (THREE.sRGBEncoding !== undefined) infoTex.encoding = THREE.sRGBEncoding;
    const infoMat = new THREE.MeshBasicMaterial({ map: infoTex });
    addPart(interiorGroup, shared.boxGeo, leatherMat, -0.02, dashY + 0.11, dashZ + 0.16, 0.23, 0.12, 0.025, 0, 0.20, 0);
    addPart(interiorGroup, new THREE.PlaneGeometry(0.21, 0.10), infoMat, -0.018, dashY + 0.11, dashZ + 0.175, 1, 1, 1, 0, 0.20, 0);

    function drawInfotainment(weatherName) {
      infoCtx.fillStyle = '#0c1220';
      infoCtx.fillRect(0, 0, 256, 128);
      infoCtx.strokeStyle = '#1e293b';
      infoCtx.lineWidth = 3;
      infoCtx.strokeRect(2, 2, 252, 124);
      // Mini stylized road ribbon graphic
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
      infoTex.needsUpdate = true;
    }
    drawInfotainment('Afternoon');

    // 4. Live 3D In-Dash Instrument Cluster (Digital OR Analog!)
    const clusterCanvas = document.createElement('canvas');
    clusterCanvas.width = 512;
    clusterCanvas.height = 224;
    const cCtx = clusterCanvas.getContext('2d');
    const clusterTex = new THREE.CanvasTexture(clusterCanvas);
    if (THREE.sRGBEncoding !== undefined) clusterTex.encoding = THREE.sRGBEncoding;
    const clusterMat = new THREE.MeshBasicMaterial({ map: clusterTex });
    addPart(interiorGroup, new THREE.PlaneGeometry(0.35, 0.15), clusterMat, driverX, dashY + 0.088, dashZ + 0.16, 1, 1, 1, -0.10);

    // 5. Subtle Translucent Windshield HUD Projection
    const hudCanvas = document.createElement('canvas');
    hudCanvas.width = 256;
    hudCanvas.height = 128;
    const hCtx = hudCanvas.getContext('2d');
    const hudTex = new THREE.CanvasTexture(hudCanvas);
    const hudMat = new THREE.MeshBasicMaterial({
      map: hudTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.78
    });
    addPart(interiorGroup, new THREE.PlaneGeometry(0.28, 0.13), hudMat, driverX, dashY + 0.22, cowlZ + 0.11, 1, 1, 1, -0.35);

    // 6. Animated 3D Steering Wheel + Column + Shift Paddles
    const wheelMount = new THREE.Group();
    wheelMount.position.set(driverX, dashY + 0.015, cowlZ + 0.44);
    wheelMount.rotation.x = -0.32;
    interiorGroup.add(wheelMount);

    addPart(wheelMount, new THREE.CylinderGeometry(0.036, 0.044, 0.22, 10), leatherMat, 0, 0, -0.11, 1, 1, 1, Math.PI / 2);

    const wheelSpinGroup = new THREE.Group();
    wheelMount.add(wheelSpinGroup);

    const rimGeo = new THREE.TorusGeometry(0.138, 0.016, 10, 28);
    const rimMesh = new THREE.Mesh(rimGeo, leatherMat);
    wheelSpinGroup.add(rimMesh);

    // 12 o'clock centering stripe
    addPart(wheelSpinGroup, shared.boxGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), 0, 0.138, 0, 0.020, 0.036, 0.036);
    // 3 Spokes + Hub
    addPart(wheelSpinGroup, shared.boxGeo, trimMat, -0.068, 0, 0, 0.125, 0.024, 0.015);
    addPart(wheelSpinGroup, shared.boxGeo, trimMat, 0.068, 0, 0, 0.125, 0.024, 0.015);
    addPart(wheelSpinGroup, shared.boxGeo, trimMat, 0, -0.068, 0, 0.026, 0.125, 0.015);
    addPart(wheelSpinGroup, new THREE.CylinderGeometry(0.048, 0.048, 0.030, 16), leatherMat, 0, 0, 0.005, 1, 1, 1, Math.PI / 2);
    addPart(wheelSpinGroup, new THREE.CylinderGeometry(0.015, 0.015, 0.034, 12), trimMat, 0, 0, 0.007, 1, 1, 1, Math.PI / 2);

    // Left (-) & Right (+) Paddle Shifters
    const leftPaddlePivot = new THREE.Group();
    leftPaddlePivot.position.set(-0.080, 0.018, -0.025);
    addPart(leftPaddlePivot, shared.boxGeo, trimMat, -0.020, 0.014, 0, 0.026, 0.075, 0.008);
    wheelSpinGroup.add(leftPaddlePivot);

    const rightPaddlePivot = new THREE.Group();
    rightPaddlePivot.position.set(0.080, 0.018, -0.025);
    addPart(rightPaddlePivot, shared.boxGeo, trimMat, 0.020, 0.014, 0, 0.026, 0.075, 0.008);
    wheelSpinGroup.add(rightPaddlePivot);

    // 7. Dual Animated Windshield Wipers
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
    let redrawAccum = 0;
    let lastWeatherDrawn = '';

    function drawAnalogDial(ctx, cx, cy, r, frac, needleColor, title, valueText, redZoneStart) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#0b101b';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.stroke();

      const startAng = Math.PI * 0.75;
      const sweepAng = Math.PI * 1.5;

      // Redline arc if applicable
      if (redZoneStart !== undefined) {
        ctx.beginPath();
        ctx.arc(cx, cy, r - 8, startAng + sweepAng * redZoneStart, startAng + sweepAng);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();
      }

      // Tick marks
      for (let i = 0; i <= 10; i++) {
        const ang = startAng + (i / 10) * sweepAng;
        const inner = i % 2 === 0 ? r - 18 : r - 12;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
        ctx.lineTo(cx + Math.cos(ang) * (r - 5), cy + Math.sin(ang) * (r - 5));
        ctx.lineWidth = i % 2 === 0 ? 2.5 : 1.5;
        ctx.strokeStyle = redZoneStart !== undefined && i / 10 >= redZoneStart ? '#f87171' : '#cbd5e1';
        ctx.stroke();
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, cx, cy - 22);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(valueText, cx, cy + 40);

      // Sweeping needle
      const nAng = startAng + clampFrac(frac) * sweepAng;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(nAng) * 10, cy - Math.sin(nAng) * 10);
      ctx.lineTo(cx + Math.cos(nAng) * (r - 12), cy + Math.sin(nAng) * (r - 12));
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = needleColor;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.restore();
    }

    function clampFrac(v) {
      return v < 0 ? 0 : v > 1 ? 1 : v;
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

      // Draw 3D Dash Cluster
      cCtx.fillStyle = '#070b14';
      cCtx.fillRect(0, 0, 512, 224);

      if (state.gaugeStyle === 'analog') {
        drawAnalogDial(cCtx, 130, 114, 86, rpmFrac, '#f43f5e', 'RPM', (state.rpm / 1000).toFixed(1), 0.85);
        drawAnalogDial(cCtx, 382, 114, 86, spdFrac, '#38bdf8', unitTxt, String(dispSpeed));

        // Center Gear Badge
        cCtx.fillStyle = state.clutchPressed ? '#78350f' : rpmFrac > 0.9 ? '#991b1b' : '#0f172a';
        cCtx.fillRect(226, 76, 60, 56);
        cCtx.strokeStyle = state.clutchPressed ? '#fbbf24' : rpmFrac > 0.9 ? '#ef4444' : '#38bdf8';
        cCtx.lineWidth = 2;
        cCtx.strokeRect(226, 76, 60, 56);
        cCtx.fillStyle = '#ffffff';
        cCtx.font = 'bold 26px sans-serif';
        cCtx.textAlign = 'center';
        cCtx.fillText(gearTxt, 256, 113);

        cCtx.fillStyle = state.clutchPressed ? '#fbbf24' : '#94a3b8';
        cCtx.font = 'bold 13px sans-serif';
        cCtx.fillText(
          state.clutchPressed ? 'CLUTCH' : `${(state.distanceKm || 0).toFixed(1)} km`,
          256,
          165
        );
      } else {
        // Digital Dash
        cCtx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        cCtx.lineWidth = 2;
        cCtx.strokeRect(10, 10, 492, 204);

        // Segmented RPM bar across top
        const segs = 24;
        for (let i = 0; i < segs; i++) {
          const lit = i / segs < rpmFrac;
          cCtx.fillStyle = !lit
            ? 'rgba(255,255,255,0.08)'
            : i >= 20
            ? '#ef4444'
            : i >= 16
            ? '#f59e0b'
            : '#38bdf8';
          cCtx.fillRect(28 + i * 19, 26, 14, 22);
        }

        // Gear badge left
        cCtx.fillStyle = state.clutchPressed
          ? 'rgba(245,158,11,0.28)'
          : rpmFrac > 0.9
          ? 'rgba(239,68,68,0.28)'
          : 'rgba(56,189,248,0.16)';
        cCtx.fillRect(36, 84, 96, 84);
        cCtx.strokeStyle = state.clutchPressed ? '#fbbf24' : rpmFrac > 0.9 ? '#ef4444' : '#38bdf8';
        cCtx.strokeRect(36, 84, 96, 84);
        cCtx.fillStyle = '#e0f2fe';
        cCtx.font = 'bold 40px sans-serif';
        cCtx.textAlign = 'center';
        cCtx.fillText(gearTxt, 84, 140);

        if (state.clutchPressed) {
          cCtx.fillStyle = '#fbbf24';
          cCtx.font = 'bold 12px sans-serif';
          cCtx.fillText('CLUTCH', 84, 186);
        }

        // Big digital speed center
        cCtx.fillStyle = '#ffffff';
        cCtx.font = 'bold 84px sans-serif';
        cCtx.textAlign = 'center';
        cCtx.fillText(String(dispSpeed), 278, 150);
        cCtx.fillStyle = '#38bdf8';
        cCtx.font = 'bold 18px sans-serif';
        cCtx.fillText(unitTxt, 278, 178);

        // Subtle turbo boost gauge bar at bottom of dash
        const boostFrac = clampFrac(state.turboBoost || 0);
        if (boostFrac > 0.04) {
          cCtx.fillStyle = 'rgba(255,255,255,0.08)';
          cCtx.fillRect(216, 191, 124, 6);
          cCtx.fillStyle = boostFrac > 0.78 ? '#f59e0b' : '#38bdf8';
          cCtx.fillRect(216, 191, 124 * boostFrac, 6);
        }

        // Distance & trans mode right
        cCtx.textAlign = 'right';
        cCtx.fillStyle = '#94a3b8';
        cCtx.font = 'bold 16px sans-serif';
        cCtx.fillText(state.transmissionMode || 'AUTO', 476, 98);
        cCtx.fillStyle = '#f8fafc';
        cCtx.font = 'bold 24px sans-serif';
        cCtx.fillText(`${(state.distanceKm || 0).toFixed(2)} km`, 476, 134);
        cCtx.fillStyle = '#4ade80';
        cCtx.font = 'bold 18px sans-serif';
        cCtx.fillText(`$${Math.floor(state.bank || 0).toLocaleString('en-US')}`, 476, 168);
      }
      clusterTex.needsUpdate = true;

      // Draw Subtle Translucent Windshield HUD
      hCtx.clearRect(0, 0, 256, 128);
      hCtx.fillStyle = 'rgba(186, 230, 253, 0.92)';
      hCtx.font = 'bold 54px sans-serif';
      hCtx.textAlign = 'left';
      hCtx.fillText(String(dispSpeed), 18, 76);

      hCtx.font = 'bold 18px sans-serif';
      hCtx.fillStyle = 'rgba(125, 211, 252, 0.85)';
      hCtx.fillText(unitTxt, 20, 102);

      hCtx.textAlign = 'right';
      hCtx.font = 'bold 34px sans-serif';
      hCtx.fillStyle = state.clutchPressed
        ? 'rgba(251, 191, 36, 0.95)'
        : rpmFrac > 0.9
        ? 'rgba(248, 113, 113, 0.95)'
        : 'rgba(125, 211, 252, 0.95)';
      hCtx.fillText(gearTxt, 238, 70);

      if (state.clutchPressed) {
        hCtx.fillStyle = '#fbbf24';
        hCtx.font = 'bold 16px sans-serif';
        hCtx.fillText('CLUTCH', 238, 102);
      } else if (state.shiftPrompt === 1) {
        hCtx.fillStyle = '#fbbf24';
        hCtx.font = 'bold 18px sans-serif';
        hCtx.fillText('SHIFT ▲', 238, 102);
      }
      hudTex.needsUpdate = true;

      if (state.weatherName !== lastWeatherDrawn) {
        lastWeatherDrawn = state.weatherName || 'Afternoon';
        drawInfotainment(lastWeatherDrawn);
      }
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

      // Windshield wipers active in Rain, Night Rain & Snow
      const wipersActive = state.precip === 'rain' || state.precip === 'snow';
      if (wipersActive) {
        const rate = state.precip === 'rain' ? 4.4 : 2.9;
        wiperPhase = (wiperPhase + dt * rate) % (Math.PI * 2.35);
        const sweep = wiperPhase < Math.PI * 2 ? 0.5 * (1 - Math.cos(wiperPhase)) : 0;
        const ang = 0.08 + sweep * 1.18;
        wiperLeftPivot.rotation.z = ang;
        wiperRightPivot.rotation.z = ang;
      } else {
        wiperLeftPivot.rotation.z += (0.06 - wiperLeftPivot.rotation.z) * Math.min(1, 8 * dt);
        wiperRightPivot.rotation.z += (0.06 - wiperRightPivot.rotation.z) * Math.min(1, 8 * dt);
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
        lookY: eyeY - 0.22,
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
