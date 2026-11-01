/* ==========================================================================
   REAL-WORLD CAR ROSTER (10 ACCURATE CARS) & SHOWROOM-GRADE 3D CAR BUILDER
   - Unmistakable Car-by-Car Silhouettes, Liveries, Grilles, Lights & Wings
   - Detailed Cockpit Interior with Animated Steering Wheel & Digital Dash
   - Working Active Aerodynamics (Speed Wing Deployment, DRS & Airbrake Tilt!)
   - Glowing Molten-Orange Carbon-Ceramic Brake Rotors Under Heavy Braking
   - Exhaust Overrun Backfire Flames & Point-Light Flash on Shifts/Decel
   - 14 Two-Way AI Highway Traffic Cars with Collision Detection
   ========================================================================== */

(function () {
  const CAR_ROSTER = [
    {
      id: 'jesko_absolut',
      brand: 'KOENIGSEGG',
      name: '2023 JESKO ABSOLUT',
      category: 'HYPERCAR',
      drivetrain: 'RWD',
      hp: 1600,
      weightKg: 1390,
      topSpeedKmh: 531,
      topSpeedMph: 330,
      zeroTo100: '2.5s',
      redlineRpm: 8500,
      gears: 9,
      color: 0xf1f5f9,
      accentColor: 0x10b981,
      engineProfile: 'v8_flatplane_tt',
      desc: '5.0L Twin-Turbo Flat-Plane V8 (1,600 HP on E85) with wrap-around jet canopy and twin rear dorsal fins.',
      shapeProfile: {
        archType: 'mid_hyper',
        width: 2.04,
        length: 4.82,
        hoodHeight: 0.60,
        cabinHeight: 1.12,
        rearHeight: 0.74,
        wheelRadius: 0.39
      },
      physics: {
        gripBase: 1.32,
        downforceCoeff: 0.42,
        brakeG: 1.45,
        turnResponse: 2.65
      }
    },
    {
      id: 'chiron_ss',
      brand: 'BUGATTI',
      name: '2021 CHIRON SUPER SPORT 300+',
      category: 'HYPERCAR',
      drivetrain: 'AWD',
      hp: 1578,
      weightKg: 1978,
      topSpeedKmh: 490,
      topSpeedMph: 304,
      zeroTo100: '2.3s',
      redlineRpm: 7100,
      gears: 7,
      color: 0x11151c,
      accentColor: 0xf97316,
      engineProfile: 'w16_quadturbo',
      desc: '8.0L Quad-Turbo W16 (1,578 HP) longtail hypercar with Jet Orange twin stripes, horseshoe grille & active airbrake.',
      shapeProfile: {
        archType: 'mid_hyper',
        width: 2.06,
        length: 4.88,
        hoodHeight: 0.68,
        cabinHeight: 1.16,
        rearHeight: 0.78,
        wheelRadius: 0.40
      },
      physics: {
        gripBase: 1.38,
        downforceCoeff: 0.48,
        brakeG: 1.42,
        turnResponse: 2.45
      }
    },
    {
      id: 'venom_f5',
      brand: 'HENNESSEY',
      name: '2022 VENOM F5',
      category: 'HYPERCAR',
      drivetrain: 'RWD',
      hp: 1817,
      weightKg: 1385,
      topSpeedKmh: 485,
      topSpeedMph: 301,
      zeroTo100: '2.6s',
      redlineRpm: 8200,
      gears: 7,
      color: 0xfbbf24,
      accentColor: 0x18181b,
      engineProfile: 'v8_crossplane_fury',
      desc: '6.6L "Fury" Twin-Turbo V8 producing 1,817 HP with roof snorkel intake and high-mount quad exhaust.',
      shapeProfile: {
        archType: 'mid_hyper',
        width: 2.02,
        length: 4.68,
        hoodHeight: 0.62,
        cabinHeight: 1.12,
        rearHeight: 0.76,
        wheelRadius: 0.39
      },
      physics: {
        gripBase: 1.28,
        downforceCoeff: 0.38,
        brakeG: 1.40,
        turnResponse: 2.60
      }
    },
    {
      id: 'amg_one',
      brand: 'MERCEDES-AMG',
      name: '2023 AMG ONE',
      category: 'TRACK HYPERCAR',
      drivetrain: 'AWD',
      hp: 1049,
      weightKg: 1695,
      topSpeedKmh: 352,
      topSpeedMph: 219,
      zeroTo100: '2.9s',
      redlineRpm: 11000,
      gears: 7,
      color: 0xd8dee9,
      accentColor: 0x00d2be,
      engineProfile: 'f1_hybrid',
      desc: '1.6L Formula 1 E-Turbo V6 Hybrid revving to 11,000 RPM with F1 roof airbox, LMP shark fin & active DRS wing.',
      shapeProfile: {
        archType: 'mid_hyper',
        width: 2.02,
        length: 4.76,
        hoodHeight: 0.60,
        cabinHeight: 1.13,
        rearHeight: 0.78,
        wheelRadius: 0.39
      },
      physics: {
        gripBase: 1.52,
        downforceCoeff: 0.82,
        brakeG: 1.62,
        turnResponse: 2.95
      }
    },
    {
      id: 'revuelto',
      brand: 'LAMBORGHINI',
      name: '2024 REVUELTO LP1015-4',
      category: 'SUPERCAR',
      drivetrain: 'AWD',
      hp: 1001,
      weightKg: 1772,
      topSpeedKmh: 350,
      topSpeedMph: 217,
      zeroTo100: '2.5s',
      redlineRpm: 9500,
      gears: 8,
      color: 0xf97316,
      accentColor: 0x18181b,
      engineProfile: 'v12_na_screamer',
      desc: '6.5L Naturally Aspirated V12 screaming to 9,500 RPM with Y-lights, exposed V12 bay & high hex exhausts.',
      shapeProfile: {
        archType: 'wedge_super',
        width: 2.06,
        length: 4.76,
        hoodHeight: 0.56,
        cabinHeight: 1.10,
        rearHeight: 0.78,
        wheelRadius: 0.40
      },
      physics: {
        gripBase: 1.44,
        downforceCoeff: 0.58,
        brakeG: 1.50,
        turnResponse: 2.82
      }
    },
    {
      id: 'sf90',
      brand: 'FERRARI',
      name: '2022 SF90 STRADALE',
      category: 'SUPERCAR',
      drivetrain: 'AWD',
      hp: 986,
      weightKg: 1570,
      topSpeedKmh: 340,
      topSpeedMph: 211,
      zeroTo100: '2.5s',
      redlineRpm: 8000,
      gears: 8,
      color: 0xd90429,
      accentColor: 0x18181b,
      engineProfile: 'v8_flatplane_tt',
      desc: '4.0L Twin-Turbo V8 PHEV producing 986 HP with black two-tone cabin, flying buttresses & quad rings.',
      shapeProfile: {
        archType: 'wedge_super',
        width: 1.98,
        length: 4.70,
        hoodHeight: 0.60,
        cabinHeight: 1.13,
        rearHeight: 0.76,
        wheelRadius: 0.39
      },
      physics: {
        gripBase: 1.46,
        downforceCoeff: 0.62,
        brakeG: 1.54,
        turnResponse: 2.88
      }
    },
    {
      id: 'gt3_rs',
      brand: 'PORSCHE',
      name: '2023 911 GT3 RS (992)',
      category: 'TRACK WEAPON',
      drivetrain: 'RWD',
      hp: 518,
      weightKg: 1450,
      topSpeedKmh: 296,
      topSpeedMph: 184,
      zeroTo100: '3.2s',
      redlineRpm: 9000,
      gears: 7,
      color: 0x10b981,
      accentColor: 0x111318,
      engineProfile: 'flat6_gt3_na',
      desc: '4.0L Flat-6 Naturally Aspirated (9,000 RPM) with carbon hood nostrils, frog-eye lamps & towering DRS swan-neck wing.',
      shapeProfile: {
        archType: 'porsche_911',
        width: 1.98,
        length: 4.58,
        hoodHeight: 0.68,
        cabinHeight: 1.24,
        rearHeight: 0.82,
        wheelRadius: 0.39
      },
      physics: {
        gripBase: 1.58,
        downforceCoeff: 0.96,
        brakeG: 1.68,
        turnResponse: 3.15
      }
    },
    {
      id: 'r34_gtr',
      brand: 'NISSAN',
      name: '2002 SKYLINE GT-R R34 V-SPEC II',
      category: 'JDM LEGEND',
      drivetrain: 'AWD',
      hp: 650,
      weightKg: 1540,
      topSpeedKmh: 315,
      topSpeedMph: 196,
      zeroTo100: '3.3s',
      redlineRpm: 8200,
      gears: 6,
      color: 0x2563eb,
      accentColor: 0xe2e8f0,
      engineProfile: 'i6_big_turbo',
      desc: '2.6L RB26DETT Twin-Turbo Inline-6 boxy JDM icon with front intercooler & 4 round afterburner taillights.',
      shapeProfile: {
        archType: 'jdm_box_coupe',
        width: 1.88,
        length: 4.60,
        hoodHeight: 0.78,
        cabinHeight: 1.30,
        rearHeight: 0.84,
        wheelRadius: 0.38
      },
      physics: {
        gripBase: 1.36,
        downforceCoeff: 0.44,
        brakeG: 1.38,
        turnResponse: 2.72
      }
    },
    {
      id: 'supra_rz',
      brand: 'TOYOTA',
      name: '1998 SUPRA RZ (A80) 620HP',
      category: 'JDM TOUGE / DRIFT',
      drivetrain: 'RWD',
      hp: 620,
      weightKg: 1490,
      topSpeedKmh: 308,
      topSpeedMph: 191,
      zeroTo100: '3.6s',
      redlineRpm: 7800,
      gears: 6,
      color: 0xf8fafc,
      accentColor: 0x18181b,
      engineProfile: 'i6_big_turbo',
      desc: '3.0L 2JZ-GTE single-turbo legend with iconic tall rounded hoop wing & 4-pod Supra tail lamps.',
      shapeProfile: {
        archType: 'gt_fastback',
        width: 1.90,
        length: 4.54,
        hoodHeight: 0.74,
        cabinHeight: 1.25,
        rearHeight: 0.84,
        wheelRadius: 0.38
      },
      physics: {
        gripBase: 1.26,
        downforceCoeff: 0.38,
        brakeG: 1.35,
        turnResponse: 2.85
      }
    },
    {
      id: 'm4_csl',
      brand: 'BMW',
      name: '2023 M4 CSL (G82)',
      category: 'SPORTS COUPE',
      drivetrain: 'RWD',
      hp: 543,
      weightKg: 1625,
      topSpeedKmh: 307,
      topSpeedMph: 191,
      zeroTo100: '3.7s',
      redlineRpm: 7200,
      gears: 8,
      color: 0x64748b,
      accentColor: 0xd90429,
      engineProfile: 'i6_big_turbo',
      desc: '3.0L S58 Twin-Turbo Inline-6 coupe with red-outlined vertical kidney grilles, carbon roof & CSL ducktail.',
      shapeProfile: {
        archType: 'jdm_box_coupe',
        width: 1.92,
        length: 4.78,
        hoodHeight: 0.76,
        cabinHeight: 1.29,
        rearHeight: 0.86,
        wheelRadius: 0.39
      },
      physics: {
        gripBase: 1.34,
        downforceCoeff: 0.40,
        brakeG: 1.42,
        turnResponse: 2.78
      }
    }
  ];

  let sharedCarbonTex = null;
  let sharedShadowTex = null;
  let sharedGrilleTex = null;

  function getSharedCarTextures() {
    if (!sharedCarbonTex) {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#14171f';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#252a36';
      for (let y = 0; y < 64; y += 8) {
        for (let x = 0; x < 64; x += 8) {
          ctx.fillRect(x + ((y / 8) % 2) * 4, y, 4, 4);
        }
      }
      sharedCarbonTex = new THREE.CanvasTexture(c);
      sharedCarbonTex.wrapS = THREE.RepeatWrapping;
      sharedCarbonTex.wrapT = THREE.RepeatWrapping;
      sharedCarbonTex.repeat.set(8, 8);
    }

    if (!sharedShadowTex) {
      const sc = document.createElement('canvas');
      sc.width = 128;
      sc.height = 256;
      const sctx = sc.getContext('2d');
      const grad = sctx.createRadialGradient(64, 128, 18, 64, 128, 62);
      grad.addColorStop(0, 'rgba(0,0,0,0.92)');
      grad.addColorStop(0.68, 'rgba(0,0,0,0.58)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 128, 256);
      sharedShadowTex = new THREE.CanvasTexture(sc);
    }

    if (!sharedGrilleTex) {
      const gc = document.createElement('canvas');
      gc.width = 64;
      gc.height = 64;
      const gctx = gc.getContext('2d');
      gctx.fillStyle = '#07090d';
      gctx.fillRect(0, 0, 64, 64);
      gctx.strokeStyle = '#28303d';
      gctx.lineWidth = 2;
      for (let y = 0; y < 64; y += 8) {
        gctx.beginPath();
        gctx.moveTo(0, y);
        gctx.lineTo(64, y);
        gctx.stroke();
      }
      sharedGrilleTex = new THREE.CanvasTexture(gc);
    }

    return { carbonTex: sharedCarbonTex, shadowTex: sharedShadowTex, grilleTex: sharedGrilleTex };
  }

  /* ------------------------------------------------------------------------
     SCULPTED MULTI-STATION BEVELED CHASSIS BUILDER
     ------------------------------------------------------------------------ */
  function buildProfiledHullGeo(stations) {
    const positions = [];
    const indices = [];

    for (let s = 0; s < stations.length; s++) {
      const st = stations[s];
      const bW = st.bottomHalfW !== undefined ? st.bottomHalfW : st.halfW * 0.90;
      const mW = st.halfW;
      const tW = st.topHalfW !== undefined ? st.topHalfW : st.halfW * 0.80;
      const bY = st.bottomY;
      const mY = st.beltY;
      const tY = st.topY;

      const ringPts = [
        [0, bY],
        [bW * 0.65, bY],
        [bW, bY + (mY - bY) * 0.22],
        [mW, mY * 0.72 + bY * 0.28],
        [mW * 0.98, mY],
        [tW, tY - (tY - mY) * 0.15],
        [tW * 0.55, tY],
        [0, tY + 0.015],
        [-tW * 0.55, tY],
        [-tW, tY - (tY - mY) * 0.15],
        [-mW * 0.98, mY],
        [-mW, mY * 0.72 + bY * 0.28],
        [-bW, bY + (mY - bY) * 0.22],
        [-bW * 0.65, bY],
        [0, bY]
      ];

      for (let r = 0; r < ringPts.length; r++) {
        positions.push(ringPts[r][0], ringPts[r][1], st.z);
      }
    }

    const stride = 15;
    for (let s = 0; s < stations.length - 1; s++) {
      for (let r = 0; r < stride - 1; r++) {
        const a = s * stride + r;
        const b = (s + 1) * stride + r;
        const c = (s + 1) * stride + (r + 1);
        const d = s * stride + (r + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  function addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, x, y, z, radius, isHex) {
    const segs = isHex ? 6 : 16;
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.26, segs),
      chromeMat
    );
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, y, z);
    chassis.add(pipe);

    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, 0.27, segs),
      new THREE.MeshBasicMaterial({ color: 0x090b10 })
    );
    inner.rotation.x = Math.PI / 2;
    inner.position.set(x, y, z - 0.01);
    chassis.add(inner);

    const flameGeo = new THREE.ConeGeometry(radius * 1.55, 1.05, 10);
    flameGeo.rotateX(-Math.PI / 2);
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y, z - 0.56);
    flame.visible = false;
    chassis.add(flame);
    exhaustFlames.push(flame);
  }

  function createCarMesh(spec, customColor, isPlayerCar) {
    const { carbonTex, shadowTex, grilleTex } = getSharedCarTextures();
    const root = new THREE.Group();
    const chassis = new THREE.Group();
    root.add(chassis);

    const sp = spec.shapeProfile;
    const halfL = sp.length * 0.5;
    const halfW = sp.width * 0.5;
    const bodyPaintHex = customColor !== undefined && customColor !== null ? customColor : spec.color;

    const MatClass = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
    const bodyMat = new MatClass({
      color: bodyPaintHex,
      roughness: 0.14,
      metalness: 0.70,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.95,
      side: THREE.DoubleSide
    });

    const accentMat = new MatClass({
      color: spec.accentColor,
      roughness: 0.20,
      metalness: 0.55,
      clearcoat: 0.9,
      envMapIntensity: 1.5
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x161920,
      map: carbonTex,
      roughness: 0.34,
      metalness: 0.42,
      envMapIntensity: 1.2
    });

    const darkGrilleMat = new THREE.MeshStandardMaterial({
      color: 0x0d1017,
      map: grilleTex,
      roughness: 0.65,
      metalness: 0.35
    });

    const glassMat = new MatClass({
      color: 0x070b14,
      roughness: 0.04,
      metalness: 0.88,
      transparent: true,
      opacity: 0.84,
      clearcoat: 1.0,
      envMapIntensity: 2.3,
      side: THREE.DoubleSide
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.10,
      metalness: 0.95,
      envMapIntensity: 2.0
    });

    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const drlYellowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const brakelightMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });

    // Soft Ambient Contact Shadow underneath
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(sp.width * 1.44, sp.length * 1.26),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.90
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.03;
    root.add(shadowPlane);

    // ----------------------------------------------------------------------
    // 1. BUILD DISTINCT LOWER BODY & CABIN SILHOUETTE BY ARCHITECTURE TYPE
    // ----------------------------------------------------------------------
    const arch = sp.archType;
    let bodyStations;
    let cabinStations;

    if (arch === 'jdm_box_coupe') {
      bodyStations = [
        { z: -halfL * 0.98, bottomY: 0.24, beltY: 0.68, topY: 0.82, halfW: halfW * 0.88, topHalfW: halfW * 0.80 },
        { z: -halfL * 0.82, bottomY: 0.20, beltY: 0.74, topY: 0.86, halfW: halfW * 0.96, topHalfW: halfW * 0.84 },
        { z: -halfL * 0.56, bottomY: 0.18, beltY: 0.78, topY: 0.86, halfW: halfW * 1.04, topHalfW: halfW * 0.88 },
        { z: -halfL * 0.25, bottomY: 0.17, beltY: 0.76, topY: 0.84, halfW: halfW * 0.96, topHalfW: halfW * 0.85 },
        { z: halfL * 0.22, bottomY: 0.17, beltY: 0.74, topY: 0.81, halfW: halfW * 0.96, topHalfW: halfW * 0.85 },
        { z: halfL * 0.58, bottomY: 0.18, beltY: 0.75, topY: 0.80, halfW: halfW * 1.04, topHalfW: halfW * 0.86 },
        { z: halfL * 0.88, bottomY: 0.19, beltY: 0.66, topY: 0.73, halfW: halfW * 0.94, topHalfW: halfW * 0.82 },
        { z: halfL * 0.99, bottomY: 0.20, beltY: 0.52, topY: 0.64, halfW: halfW * 0.86, topHalfW: halfW * 0.76 }
      ];
      cabinStations = [
        { z: -halfL * 0.60, bottomY: 0.80, beltY: 0.85, topY: 0.86, halfW: halfW * 0.76, topHalfW: halfW * 0.70 },
        { z: -halfL * 0.32, bottomY: 0.80, beltY: 1.08, topY: sp.cabinHeight, halfW: halfW * 0.76, topHalfW: halfW * 0.64 },
        { z: halfL * 0.08, bottomY: 0.79, beltY: 1.08, topY: sp.cabinHeight, halfW: halfW * 0.76, topHalfW: halfW * 0.64 },
        { z: halfL * 0.34, bottomY: 0.77, beltY: 0.82, topY: 0.83, halfW: halfW * 0.76, topHalfW: halfW * 0.70 }
      ];
    } else if (arch === 'porsche_911') {
      bodyStations = [
        { z: -halfL * 0.98, bottomY: 0.24, beltY: 0.64, topY: 0.76, halfW: halfW * 0.86, topHalfW: halfW * 0.74 },
        { z: -halfL * 0.62, bottomY: 0.18, beltY: 0.76, topY: 0.85, halfW: halfW * 1.06, topHalfW: halfW * 0.88 },
        { z: -halfL * 0.15, bottomY: 0.16, beltY: 0.72, topY: 0.80, halfW: halfW * 0.95, topHalfW: halfW * 0.82 },
        { z: halfL * 0.28, bottomY: 0.16, beltY: 0.70, topY: 0.76, halfW: halfW * 0.95, topHalfW: halfW * 0.82 },
        { z: halfL * 0.60, bottomY: 0.17, beltY: 0.72, topY: 0.76, halfW: halfW * 1.02, topHalfW: halfW * 0.84 },
        { z: halfL * 0.90, bottomY: 0.18, beltY: 0.48, topY: 0.56, halfW: halfW * 0.88, topHalfW: halfW * 0.74 },
        { z: halfL * 0.99, bottomY: 0.20, beltY: 0.36, topY: 0.44, halfW: halfW * 0.76, topHalfW: halfW * 0.62 }
      ];
      cabinStations = [
        { z: -halfL * 0.82, bottomY: 0.74, beltY: 0.78, topY: 0.80, halfW: halfW * 0.68, topHalfW: halfW * 0.56 },
        { z: -halfL * 0.42, bottomY: 0.78, beltY: 1.04, topY: sp.cabinHeight * 0.95, halfW: halfW * 0.74, topHalfW: halfW * 0.58 },
        { z: halfL * 0.02, bottomY: 0.76, beltY: 1.08, topY: sp.cabinHeight, halfW: halfW * 0.75, topHalfW: halfW * 0.60 },
        { z: halfL * 0.34, bottomY: 0.72, beltY: 0.76, topY: 0.78, halfW: halfW * 0.74, topHalfW: halfW * 0.66 }
      ];
    } else if (arch === 'gt_fastback') {
      bodyStations = [
        { z: -halfL * 0.98, bottomY: 0.23, beltY: 0.68, topY: 0.82, halfW: halfW * 0.88, topHalfW: halfW * 0.78 },
        { z: -halfL * 0.60, bottomY: 0.18, beltY: 0.78, topY: 0.86, halfW: halfW * 1.05, topHalfW: halfW * 0.88 },
        { z: -halfL * 0.15, bottomY: 0.17, beltY: 0.74, topY: 0.82, halfW: halfW * 0.95, topHalfW: halfW * 0.82 },
        { z: halfL * 0.25, bottomY: 0.17, beltY: 0.72, topY: 0.78, halfW: halfW * 0.95, topHalfW: halfW * 0.82 },
        { z: halfL * 0.60, bottomY: 0.18, beltY: 0.72, topY: 0.76, halfW: halfW * 1.02, topHalfW: halfW * 0.84 },
        { z: halfL * 0.90, bottomY: 0.19, beltY: 0.54, topY: 0.62, halfW: halfW * 0.90, topHalfW: halfW * 0.76 },
        { z: halfL * 0.99, bottomY: 0.20, beltY: 0.42, topY: 0.50, halfW: halfW * 0.78, topHalfW: halfW * 0.66 }
      ];
      cabinStations = [
        { z: -halfL * 0.74, bottomY: 0.78, beltY: 0.82, topY: 0.84, halfW: halfW * 0.70, topHalfW: halfW * 0.58 },
        { z: -halfL * 0.35, bottomY: 0.78, beltY: 1.06, topY: sp.cabinHeight, halfW: halfW * 0.74, topHalfW: halfW * 0.60 },
        { z: halfL * 0.02, bottomY: 0.76, beltY: 1.06, topY: sp.cabinHeight, halfW: halfW * 0.74, topHalfW: halfW * 0.60 },
        { z: halfL * 0.26, bottomY: 0.74, beltY: 0.78, topY: 0.80, halfW: halfW * 0.74, topHalfW: halfW * 0.66 }
      ];
    } else if (arch === 'wedge_super') {
      bodyStations = [
        { z: -halfL * 0.98, bottomY: 0.26, beltY: 0.66, topY: 0.78, halfW: halfW * 0.92, topHalfW: halfW * 0.82 },
        { z: -halfL * 0.58, bottomY: 0.17, beltY: 0.74, topY: 0.82, halfW: halfW * 1.06, topHalfW: halfW * 0.88 },
        { z: -halfL * 0.08, bottomY: 0.15, beltY: 0.66, topY: 0.74, halfW: halfW * 0.94, topHalfW: halfW * 0.80 },
        { z: halfL * 0.42, bottomY: 0.15, beltY: 0.62, topY: 0.68, halfW: halfW * 0.98, topHalfW: halfW * 0.82 },
        { z: halfL * 0.64, bottomY: 0.16, beltY: 0.60, topY: 0.64, halfW: halfW * 1.02, topHalfW: halfW * 0.84 },
        { z: halfL * 0.92, bottomY: 0.17, beltY: 0.36, topY: 0.42, halfW: halfW * 0.88, topHalfW: halfW * 0.74 },
        { z: halfL * 1.00, bottomY: 0.18, beltY: 0.26, topY: 0.32, halfW: halfW * 0.72, topHalfW: halfW * 0.58 }
      ];
      cabinStations = [
        { z: -halfL * 0.58, bottomY: 0.72, beltY: 0.76, topY: 0.78, halfW: halfW * 0.64, topHalfW: halfW * 0.50 },
        { z: -halfL * 0.12, bottomY: 0.70, beltY: 0.98, topY: sp.cabinHeight, halfW: halfW * 0.72, topHalfW: halfW * 0.56 },
        { z: halfL * 0.24, bottomY: 0.66, beltY: 0.96, topY: sp.cabinHeight * 0.97, halfW: halfW * 0.72, topHalfW: halfW * 0.56 },
        { z: halfL * 0.58, bottomY: 0.58, beltY: 0.62, topY: 0.64, halfW: halfW * 0.70, topHalfW: halfW * 0.62 }
      ];
    } else {
      bodyStations = [
        { z: -halfL * 0.99, bottomY: 0.25, beltY: 0.62, topY: 0.74, halfW: halfW * 0.88, topHalfW: halfW * 0.78 },
        { z: -halfL * 0.60, bottomY: 0.17, beltY: 0.72, topY: 0.80, halfW: halfW * 1.05, topHalfW: halfW * 0.88 },
        { z: -halfL * 0.10, bottomY: 0.15, beltY: 0.66, topY: 0.74, halfW: halfW * 0.93, topHalfW: halfW * 0.78 },
        { z: halfL * 0.38, bottomY: 0.15, beltY: 0.64, topY: 0.70, halfW: halfW * 0.96, topHalfW: halfW * 0.80 },
        { z: halfL * 0.62, bottomY: 0.16, beltY: 0.64, topY: 0.68, halfW: halfW * 1.03, topHalfW: halfW * 0.84 },
        { z: halfL * 0.90, bottomY: 0.17, beltY: 0.40, topY: 0.46, halfW: halfW * 0.88, topHalfW: halfW * 0.74 },
        { z: halfL * 0.99, bottomY: 0.18, beltY: 0.30, topY: 0.36, halfW: halfW * 0.76, topHalfW: halfW * 0.62 }
      ];
      cabinStations = [
        { z: -halfL * 0.64, bottomY: 0.70, beltY: 0.74, topY: 0.76, halfW: halfW * 0.56, topHalfW: halfW * 0.42 },
        { z: -halfL * 0.16, bottomY: 0.70, beltY: 0.98, topY: sp.cabinHeight, halfW: halfW * 0.68, topHalfW: halfW * 0.52 },
        { z: halfL * 0.22, bottomY: 0.66, beltY: 0.96, topY: sp.cabinHeight * 0.98, halfW: halfW * 0.68, topHalfW: halfW * 0.52 },
        { z: halfL * 0.52, bottomY: 0.60, beltY: 0.64, topY: 0.66, halfW: halfW * 0.64, topHalfW: halfW * 0.54 }
      ];
    }

    const bodyHullMesh = new THREE.Mesh(buildProfiledHullGeo(bodyStations), bodyMat);
    bodyHullMesh.castShadow = true;
    bodyHullMesh.receiveShadow = true;
    chassis.add(bodyHullMesh);

    const cabinMesh = new THREE.Mesh(buildProfiledHullGeo(cabinStations), glassMat);
    cabinMesh.castShadow = true;
    chassis.add(cabinMesh);

    // ----------------------------------------------------------------------
    // 1B. DETAILED COCKPIT INTERIOR (RACING BUCKET SEATS, DASH & STEERING WHEEL)
    // ----------------------------------------------------------------------
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0x12151c, roughness: 0.75 });
    const dashGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Dashboard binnacle & digital cluster
    const dashBinnacle = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.64, 0.16, 0.38), interiorMat);
    dashBinnacle.position.set(0, 0.74, halfL * 0.20);
    chassis.add(dashBinnacle);

    const digitalCluster = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.02), dashGlowMat);
    digitalCluster.position.set(0.32, 0.83, halfL * 0.12);
    chassis.add(digitalCluster);

    // Driver & Passenger Carbon Racing Bucket Seats
    [-0.32, 0.32].forEach((seatX) => {
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 0.10), interiorMat);
      seatBack.position.set(seatX, 0.78, -0.22);
      seatBack.rotation.x = -0.18;
      chassis.add(seatBack);

      const headrestTrim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.11), accentMat);
      headrestTrim.position.set(seatX, 0.96, -0.25);
      chassis.add(headrestTrim);
    });

    // Animated Driver Steering Wheel (turns in real time with vehicle steering!)
    const steeringWheel = new THREE.Group();
    steeringWheel.position.set(0.32, 0.81, halfL * 0.04);
    const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.022, 8, 20), interiorMat);
    const topCenterMarker = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.03), accentMat);
    topCenterMarker.position.set(0, 0.145, 0);
    const wheelHub = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.045, 0.025), chromeMat);
    steeringWheel.add(wheelRing, topCenterMarker, wheelHub);
    chassis.add(steeringWheel);

    // Painted Roof Cap on top of the glass cabin
    const hasCarbonOrBlackRoof = spec.id === 'gt3_rs' || spec.id === 'm4_csl' || spec.id === 'sf90';
    const roofZLen = (cabinStations[2].z - cabinStations[1].z) * 0.95;
    const roofZMid = (cabinStations[1].z + cabinStations[2].z) * 0.5;
    const roofCap = new THREE.Mesh(
      new THREE.BoxGeometry(halfW * 1.12, 0.045, roofZLen),
      hasCarbonOrBlackRoof ? carbonMat : bodyMat
    );
    roofCap.position.set(0, sp.cabinHeight - 0.01, roofZMid);
    chassis.add(roofCap);

    // Front Carbon Splitter & Side Skirts + Rear Carbon Diffuser
    const frontSplitter = new THREE.Mesh(
      new THREE.BoxGeometry(sp.width * 0.94, 0.055, 0.36),
      carbonMat
    );
    frontSplitter.position.set(0, 0.17, halfL * 0.92);
    chassis.add(frontSplitter);

    [-halfW * 0.96, halfW * 0.96].forEach((sx) => {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, sp.length * 0.52), carbonMat);
      skirt.position.set(sx, 0.18, 0);
      chassis.add(skirt);

      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.10, 0.16), bodyMat);
      mirror.position.set(sx * 1.02, sp.hoodHeight + 0.16, halfL * 0.24);
      chassis.add(mirror);
    });

    const rearDiffuser = new THREE.Mesh(
      new THREE.BoxGeometry(sp.width * 0.86, 0.22, 0.38),
      carbonMat
    );
    rearDiffuser.position.set(0, 0.24, -halfL * 0.93);
    chassis.add(rearDiffuser);

    [-0.56, -0.20, 0.20, 0.56].forEach((fx) => {
      const strake = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.42), accentMat);
      strake.position.set(fx, 0.22, -halfL * 0.95);
      chassis.add(strake);
    });

    const exhaustFlames = [];
    let activeWing = null;

    // ----------------------------------------------------------------------
    // 2. BESPOKE, UNMISTAKABLE CAR-BY-CAR STYLING & ACTIVE AERODYNAMICS
    // ----------------------------------------------------------------------
    if (spec.id === 'jesko_absolut') {
      const noseStripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, halfL * 0.65), accentMat);
      noseStripe.position.set(0, 0.56, halfL * 0.62);
      noseStripe.rotation.x = 0.28;
      chassis.add(noseStripe);

      const dorsalSpine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, halfL * 0.75), carbonMat);
      dorsalSpine.position.set(0, 0.86, -halfL * 0.55);
      chassis.add(dorsalSpine);

      [-0.38, 0.38].forEach((fx) => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 1.05), accentMat);
        fin.position.set(fx, 0.92, -halfL * 0.68);
        fin.rotation.x = -0.14;
        chassis.add(fin);
      });

      [-halfW * 0.68, halfW * 0.68].forEach((sx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.36), headlightMat);
        hl.position.set(sx, 0.48, halfL * 0.84);
        hl.rotation.y = sx > 0 ? -0.3 : 0.3;
        chassis.add(hl);

        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.08), brakelightMat);
        tl.position.set(sx * 0.95, 0.68, -halfL * 0.98);
        chassis.add(tl);
      });

      addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, 0, 0.54, -halfL * 0.99, 0.11, false);

    } else if (spec.id === 'chiron_ss') {
      [-0.17, 0.17].forEach((stX) => {
        const frontStripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, halfL * 0.85), accentMat);
        frontStripe.position.set(stX, 0.58, halfL * 0.52);
        frontStripe.rotation.x = 0.25;
        chassis.add(frontStripe);

        const roofStripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, roofZLen * 1.02), accentMat);
        roofStripe.position.set(stX, sp.cabinHeight + 0.015, roofZMid);
        chassis.add(roofStripe);

        const rearStripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, halfL * 0.72), accentMat);
        rearStripe.position.set(stX, 0.80, -halfL * 0.60);
        chassis.add(rearStripe);
      });

      const horseshoe = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.035, 10, 20, Math.PI),
        accentMat
      );
      horseshoe.position.set(0, 0.28, halfL * 0.99);
      chassis.add(horseshoe);

      [-1, 1].forEach((side) => {
        for (let e = 0; e < 4; e++) {
          const eye = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.055, 0.08), headlightMat);
          eye.position.set(side * (0.48 + e * 0.09), 0.46, halfL * 0.92);
          chassis.add(eye);
        }

        const cArch = new THREE.Mesh(
          new THREE.TorusGeometry(0.46, 0.035, 8, 20, Math.PI),
          accentMat
        );
        cArch.rotation.y = Math.PI / 2;
        cArch.rotation.z = -Math.PI / 2;
        cArch.position.set(side * halfW * 0.97, 0.64, 0.05);
        chassis.add(cArch);
      });

      // Active Deployable Bugatti Rear Airbrake Wing!
      activeWing = new THREE.Group();
      activeWing.position.set(0, 0.78, -halfL * 0.86);
      const airbrakeBlade = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.84, 0.04, 0.32), carbonMat);
      const airbrakeTrim = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.84, 0.045, 0.04), accentMat);
      airbrakeTrim.position.z = -0.15;
      activeWing.add(airbrakeBlade, airbrakeTrim);
      activeWing.userData = { baseY: 0.78, deployLift: 0.20, basePitch: 0.08 };
      chassis.add(activeWing);

      const bugattiLightBar = new THREE.Mesh(
        new THREE.BoxGeometry(sp.width * 0.88, 0.065, 0.08),
        brakelightMat
      );
      bugattiLightBar.position.set(0, 0.68, -halfL * 0.98);
      chassis.add(bugattiLightBar);

      [-0.62, 0.62].forEach((exX) => {
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, exX, 0.34, -halfL * 0.98, 0.065, false);
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, exX, 0.22, -halfL * 0.98, 0.065, false);
      });

    } else if (spec.id === 'venom_f5') {
      const roofScoop = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.65), carbonMat);
      roofScoop.position.set(0, sp.cabinHeight + 0.05, -0.15);
      chassis.add(roofScoop);

      const rearLouvers = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 1.15), carbonMat);
      rearLouvers.position.set(0, 0.80, -halfL * 0.56);
      chassis.add(rearLouvers);

      const ducktail = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.86, 0.12, 0.16), carbonMat);
      ducktail.position.set(0, 0.80, -halfL * 0.94);
      ducktail.rotation.x = 0.35;
      chassis.add(ducktail);

      [-halfW * 0.68, halfW * 0.68].forEach((sx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.42), headlightMat);
        hl.position.set(sx, 0.46, halfL * 0.86);
        chassis.add(hl);

        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.065, 0.08), brakelightMat);
        tl.position.set(sx * 0.95, 0.66, -halfL * 0.98);
        chassis.add(tl);
      });

      [-0.18, -0.06, 0.06, 0.18].forEach((exX) => {
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, exX, 0.58, -halfL * 0.98, 0.052, false);
      });

    } else if (spec.id === 'amg_one') {
      const f1Scoop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.75), carbonMat);
      f1Scoop.position.set(0, sp.cabinHeight + 0.07, -0.05);
      chassis.add(f1Scoop);

      const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 1.45), carbonMat);
      sharkFin.position.set(0, sp.cabinHeight - 0.04, -halfL * 0.48);
      chassis.add(sharkFin);

      const sharkFinTrim = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 1.45), accentMat);
      sharkFinTrim.position.set(0, sp.cabinHeight + 0.12, -halfL * 0.48);
      chassis.add(sharkFinTrim);

      // Active Deployable AMG ONE DRS Rear Wing
      activeWing = new THREE.Group();
      activeWing.position.set(0, 0.92, -halfL * 0.88);
      const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.92, 0.05, 0.30), carbonMat);
      activeWing.add(wingBlade);
      [-halfW * 0.92, halfW * 0.92].forEach((wx) => {
        const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.38), accentMat);
        endplate.position.set(wx, -0.02, 0);
        activeWing.add(endplate);
      });
      activeWing.userData = { baseY: 0.92, deployLift: 0.14, basePitch: 0.16 };
      chassis.add(activeWing);

      [-halfW * 0.92, halfW * 0.92].forEach((wx) => {
        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.45), carbonMat);
        louver.position.set(wx * 0.82, 0.69, halfL * 0.58);
        chassis.add(louver);

        const tealSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, sp.length * 0.50), accentMat);
        tealSkirt.position.set(wx * 1.04, 0.21, 0);
        chassis.add(tealSkirt);

        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.065, 0.28), headlightMat);
        hl.position.set(wx * 0.75, 0.48, halfL * 0.86);
        chassis.add(hl);

        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.08), brakelightMat);
        tl.position.set(wx * 0.72, 0.68, -halfL * 0.98);
        chassis.add(tl);
      });

      addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, 0, 0.52, -halfL * 0.98, 0.11, false);
      addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, 0, 0.36, -halfL * 0.98, 0.055, false);

    } else if (spec.id === 'revuelto') {
      const v12Bay = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 1.18), carbonMat);
      v12Bay.position.set(0, 0.78, -halfL * 0.52);
      chassis.add(v12Bay);

      [-0.48, 0.48].forEach((bx) => {
        const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 1.25), bodyMat);
        buttress.position.set(bx, 0.92, -halfL * 0.48);
        buttress.rotation.x = -0.18;
        chassis.add(buttress);
      });

      [-halfW * 0.92, halfW * 0.92].forEach((ix) => {
        const intake = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.55), carbonMat);
        intake.position.set(ix, 0.52, -halfL * 0.22);
        chassis.add(intake);
      });

      // Active Lamborghini Rear Wing
      activeWing = new THREE.Group();
      activeWing.position.set(0, 0.80, -halfL * 0.90);
      const lamboWing = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.86, 0.04, 0.24), carbonMat);
      activeWing.add(lamboWing);
      activeWing.userData = { baseY: 0.80, deployLift: 0.12, basePitch: 0.12 };
      chassis.add(activeWing);

      [-halfW * 0.68, halfW * 0.68].forEach((sx) => {
        const yFront1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.045, 0.08), headlightMat);
        yFront1.position.set(sx, 0.40, halfL * 0.92);
        yFront1.rotation.z = sx > 0 ? 0.35 : -0.35;
        chassis.add(yFront1);

        const yRear1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.055, 0.08), brakelightMat);
        yRear1.position.set(sx * 0.95, 0.72, -halfL * 0.98);
        yRear1.rotation.z = sx > 0 ? -0.25 : 0.25;
        chassis.add(yRear1);

        const yRear2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.08), brakelightMat);
        yRear2.position.set(sx * 0.95, 0.64, -halfL * 0.98);
        yRear2.rotation.z = sx > 0 ? 0.35 : -0.35;
        chassis.add(yRear2);
      });

      [-0.22, 0.22].forEach((exX) => {
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, exX, 0.68, -halfL * 0.98, 0.095, true);
      });

    } else if (spec.id === 'sf90') {
      const engineGlass = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.98), glassMat);
      engineGlass.position.set(0, 0.80, -halfL * 0.50);
      chassis.add(engineGlass);

      [-0.46, 0.46].forEach((bx) => {
        const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 1.15), bodyMat);
        buttress.position.set(bx, 0.90, -halfL * 0.46);
        buttress.rotation.x = -0.20;
        chassis.add(buttress);
      });

      [-halfW * 0.68, halfW * 0.68].forEach((sx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.055, 0.24), headlightMat);
        hl.position.set(sx, 0.44, halfL * 0.88);
        chassis.add(hl);
      });

      [-0.68, -0.46, 0.46, 0.68].forEach((tx) => {
        const ring = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.11, 0.08), brakelightMat);
        ring.position.set(tx, 0.68, -halfL * 0.98);
        chassis.add(ring);
      });

      [-0.24, 0.24].forEach((exX) => {
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, exX, 0.48, -halfL * 0.98, 0.08, false);
      });

    } else if (spec.id === 'gt3_rs') {
      const carbonHood = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.58, 0.03, halfL * 0.58), carbonMat);
      carbonHood.position.set(0, 0.66, halfL * 0.62);
      carbonHood.rotation.x = 0.22;
      chassis.add(carbonHood);

      [-halfW * 0.68, halfW * 0.68].forEach((fx) => {
        const fenderHump = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.85, 14), bodyMat);
        fenderHump.rotation.x = Math.PI / 2;
        fenderHump.scale.set(1.0, 0.65, 1.0);
        fenderHump.position.set(fx, 0.64, halfL * 0.64);
        chassis.add(fenderHump);

        const frogLight = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), headlightMat);
        frogLight.scale.set(0.95, 0.65, 1.15);
        frogLight.position.set(fx, 0.66, halfL * 0.86);
        frogLight.rotation.x = 0.35;
        chassis.add(frogLight);

        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.38), carbonMat);
        louver.position.set(fx, 0.77, halfL * 0.56);
        chassis.add(louver);
      });

      // Towering Swan-Neck GT3 RS DRS Rear Wing (Active DRS + Airbrake Flap!)
      const wingY = sp.cabinHeight + 0.14;
      activeWing = new THREE.Group();
      activeWing.position.set(0, wingY, -halfL * 0.88);
      const mainWing = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.98, 0.05, 0.36), carbonMat);
      mainWing.castShadow = true;
      activeWing.add(mainWing);
      activeWing.userData = { baseY: wingY, deployLift: 0.0, basePitch: 0.18 };
      chassis.add(activeWing);

      [-halfW * 0.98, halfW * 0.98].forEach((epX) => {
        const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.38, 0.48), carbonMat);
        endplate.position.set(epX, wingY - 0.04, -halfL * 0.88);
        chassis.add(endplate);
      });

      [-0.36, 0.36].forEach((pylonX) => {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.58, 0.22), carbonMat);
        pylon.position.set(pylonX, wingY - 0.26, -halfL * 0.82);
        pylon.rotation.x = -0.15;
        chassis.add(pylon);
      });

      const porscheLightStrip = new THREE.Mesh(
        new THREE.BoxGeometry(sp.width * 0.86, 0.055, 0.08),
        brakelightMat
      );
      porscheLightStrip.position.set(0, 0.68, -halfL * 0.98);
      chassis.add(porscheLightStrip);

      [-0.12, 0.12].forEach((exX) => {
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, exX, 0.28, -halfL * 0.98, 0.075, false);
      });

    } else if (spec.id === 'r34_gtr') {
      const intercooler = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.24, 0.08), chromeMat);
      intercooler.position.set(0, 0.32, halfL * 0.99);
      chassis.add(intercooler);

      const upperGrille = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.11, 0.08), darkGrilleMat);
      upperGrille.position.set(0, 0.56, halfL * 0.99);
      chassis.add(upperGrille);

      [-halfW * 0.64, halfW * 0.64].forEach((hx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.13, 0.14), headlightMat);
        hl.position.set(hx, 0.58, halfL * 0.96);
        chassis.add(hl);
      });

      [-1, 1].forEach((side) => {
        const outerRing = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 20), brakelightMat);
        outerRing.rotation.x = Math.PI / 2;
        outerRing.position.set(side * 0.64, 0.68, -halfL * 0.98);
        chassis.add(outerRing);

        const innerRing = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.08, 20), brakelightMat);
        innerRing.rotation.x = Math.PI / 2;
        innerRing.position.set(side * 0.42, 0.66, -halfL * 0.98);
        chassis.add(innerRing);
      });

      const r34Wing = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.88, 0.045, 0.28), bodyMat);
      r34Wing.position.set(0, 1.06, -halfL * 0.88);
      chassis.add(r34Wing);

      [-0.64, 0.64].forEach((sx) => {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.26), bodyMat);
        strut.position.set(sx, 0.94, -halfL * 0.88);
        chassis.add(strut);
      });

      addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, -0.52, 0.28, -halfL * 0.99, 0.115, false);

    } else if (spec.id === 'supra_rz') {
      const intercooler = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.22, 0.08), chromeMat);
      intercooler.position.set(0, 0.30, halfL * 0.99);
      chassis.add(intercooler);

      [-halfW * 0.62, halfW * 0.62].forEach((hx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.11, 0.22), headlightMat);
        hl.position.set(hx, 0.54, halfL * 0.92);
        chassis.add(hl);

        const tailHousing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.07), carbonMat);
        tailHousing.position.set(hx * 0.88, 0.66, -halfL * 0.98);
        chassis.add(tailHousing);
      });

      [-0.68, -0.52, -0.36, 0.36, 0.52, 0.68].forEach((tx) => {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.09, 14), brakelightMat);
        pod.rotation.x = Math.PI / 2;
        pod.position.set(tx, 0.66, -halfL * 0.98);
        chassis.add(pod);
      });

      const hoopArch = new THREE.Mesh(
        new THREE.TorusGeometry(sp.width * 0.43, 0.05, 12, 28, Math.PI),
        bodyMat
      );
      hoopArch.scale.set(1.0, 0.46, 1.35);
      hoopArch.position.set(0, 0.80, -halfL * 0.88);
      chassis.add(hoopArch);

      addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, -0.50, 0.28, -halfL * 0.99, 0.115, false);

    } else if (spec.id === 'm4_csl') {
      [-0.16, 0.16].forEach((kx) => {
        const kidneyFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.08), accentMat);
        kidneyFrame.position.set(kx, 0.44, halfL * 0.99);
        chassis.add(kidneyFrame);

        const kidneyInner = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.33, 0.09), darkGrilleMat);
        kidneyInner.position.set(kx, 0.44, halfL * 0.99);
        chassis.add(kidneyInner);

        const hoodStripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, halfL * 0.52), carbonMat);
        hoodStripe.position.set(kx * 1.15, 0.77, halfL * 0.62);
        hoodStripe.rotation.x = 0.08;
        chassis.add(hoodStripe);
      });

      [-halfW * 0.65, halfW * 0.65].forEach((sx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.10, 0.16), drlYellowMat);
        hl.position.set(sx, 0.56, halfL * 0.95);
        chassis.add(hl);

        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.08), brakelightMat);
        tl.position.set(sx * 0.92, 0.68, -halfL * 0.98);
        chassis.add(tl);
      });

      const cslDucktail = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.84, 0.13, 0.18), bodyMat);
      cslDucktail.position.set(0, 0.88, -halfL * 0.94);
      cslDucktail.rotation.x = 0.38;
      chassis.add(cslDucktail);

      [-0.44, -0.30, 0.30, 0.44].forEach((exX) => {
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, exX, 0.27, -halfL * 0.99, 0.058, false);
      });
    }

    let brakeLightPoint = null;
    let backfireLight = null;
    if (isPlayerCar) {
      brakeLightPoint = new THREE.PointLight(0xff0033, 0.45, 9.5);
      brakeLightPoint.position.set(0, 0.65, -halfL * 1.08);
      chassis.add(brakeLightPoint);

      backfireLight = new THREE.PointLight(0xff7b00, 0.0, 11.0);
      backfireLight.position.set(0, 0.42, -halfL * 1.25);
      chassis.add(backfireLight);
    }

    // ----------------------------------------------------------------------
    // 3. 4 HIGH-DETAIL ROUNDED WHEEL ASSEMBLIES WITH GLOWING BRAKE ROTORS
    // ----------------------------------------------------------------------
    const wheelRadius = sp.wheelRadius || 0.39;
    const wheelWidth = 0.32;
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x121418,
      roughness: 0.78,
      metalness: 0.1
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.14,
      metalness: 0.92,
      envMapIntensity: 1.85
    });
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.35,
      metalness: 0.85,
      emissive: new THREE.Color(0xff3b00),
      emissiveIntensity: 0.0
    });
    const caliperMat = new THREE.MeshStandardMaterial({
      color: spec.accentColor,
      roughness: 0.25,
      metalness: 0.5
    });

    const wheelOffsets = [
      { x: -halfW * 0.95, y: wheelRadius, z: halfL * 0.58, front: true },
      { x: halfW * 0.95, y: wheelRadius, z: halfL * 0.58, front: true },
      { x: -halfW * 0.96, y: wheelRadius, z: -halfL * 0.58, front: false },
      { x: halfW * 0.96, y: wheelRadius, z: -halfL * 0.58, front: false }
    ];

    const wheels = [];
    wheelOffsets.forEach((wo) => {
      const steerPivot = new THREE.Group();
      steerPivot.position.set(wo.x, wo.y, wo.z);

      const caliper = new THREE.Mesh(new THREE.BoxGeometry(wheelWidth * 0.75, 0.2, 0.13), caliperMat);
      caliper.position.set(0, 0.06, 0.17);
      steerPivot.add(caliper);

      const spinGroup = new THREE.Group();

      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth * 0.82, 28);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      spinGroup.add(tire);

      [-wheelWidth * 0.36, wheelWidth * 0.36].forEach((sideOffset) => {
        const sidewall = new THREE.Mesh(
          new THREE.TorusGeometry(wheelRadius * 0.84, wheelRadius * 0.16, 10, 24),
          tireMat
        );
        sidewall.rotation.y = Math.PI / 2;
        sidewall.position.x = sideOffset;
        spinGroup.add(sidewall);
      });

      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.68, wheelRadius * 0.68, wheelWidth * 0.86, 20);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      spinGroup.add(rim);

      const rotorGeo = new THREE.CylinderGeometry(wheelRadius * 0.52, wheelRadius * 0.52, wheelWidth * 0.5, 16);
      rotorGeo.rotateZ(Math.PI / 2);
      const rotor = new THREE.Mesh(rotorGeo, rotorMat);
      spinGroup.add(rotor);

      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(
          new THREE.BoxGeometry(wheelWidth * 0.88, wheelRadius * 1.28, 0.042),
          rimMat
        );
        spoke.rotation.x = (s / 5) * Math.PI;
        spinGroup.add(spoke);
      }

      steerPivot.add(spinGroup);
      root.add(steerPivot);
      wheels.push({ steerPivot, spinGroup, baseY: wo.y, front: wo.front });
    });

    return {
      root,
      chassis,
      bodyMat,
      brakelightMat,
      brakeLightPoint,
      backfireLight,
      exhaustFlames,
      steeringWheel,
      activeWing,
      rotorMat,
      wheels
    };
  }

  /* ------------------------------------------------------------------------
     14 TWO-WAY HIGHWAY TRAFFIC CARS WITH COLLISION DETECTION
     ------------------------------------------------------------------------ */
  class AIDrivatarManager {
    constructor(scene, world) {
      this.scene = scene;
      this.world = world;
      this.drivatars = [];

      const mainRoad = this.world.roadSplines[0];

      for (let i = 0; i < 14; i++) {
        const spec = CAR_ROSTER[(i + 1) % CAR_ROSTER.length];
        const road = this.world.roadSplines[i % this.world.roadSplines.length] || mainRoad;
        const built = createCarMesh(spec, spec.color, false);
        this.scene.add(built.root);

        const dir = i % 2 === 0 ? 1 : -1;
        this.drivatars.push({
          id: i,
          spec: spec,
          built: built,
          road: road,
          dir: dir,
          t: ((i + 1) / 15) % 1,
          speed: 30 + (i % 5) * 6,
          laneOffset: dir * (road.width * 0.24),
          x: 0,
          y: 0,
          z: 0,
          heading: 0
        });
      }
    }

    update(dt, playerVehicle) {
      for (let i = 0; i < this.drivatars.length; i++) {
        const d = this.drivatars[i];
        const curveLength = d.road.length || 14000;
        d.t += (d.dir * d.speed / curveLength) * dt;
        if (d.t > 1) d.t -= 1;
        if (d.t < 0) d.t += 1;

        const pt = d.road.curve.getPointAt(d.t);
        const tan = d.road.curve.getTangentAt(d.t).normalize();
        const leftX = tan.z;
        const leftZ = -tan.x;

        d.x = pt.x + leftX * d.laneOffset;
        d.z = pt.z + leftZ * d.laneOffset;
        d.y = this.world.getTerrainHeight(d.x, d.z);
        d.heading = Math.atan2(tan.x * d.dir, tan.z * d.dir);

        d.built.root.position.set(d.x, d.y, d.z);
        d.built.root.rotation.y = d.heading;

        for (let w = 0; w < d.built.wheels.length; w++) {
          d.built.wheels[w].spinGroup.rotation.x += d.speed * dt * 2.2;
        }

        // Check car-to-car collision with player vehicle
        if (playerVehicle) {
          const dx = playerVehicle.x - d.x;
          const dz = playerVehicle.z - d.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 3.4 && dist > 0.01) {
            const nx = dx / dist;
            const nz = dz / dist;
            const overlap = 3.4 - dist;
            playerVehicle.x += nx * overlap * 0.85;
            playerVehicle.z += nz * overlap * 0.85;
            playerVehicle.vx = nx * 12 + d.speed * Math.sin(d.heading) * 0.4;
            playerVehicle.vz = nz * 12 + d.speed * Math.cos(d.heading) * 0.4;
            playerVehicle.forwardSpeed *= 0.65;
          }
        }
      }
    }
  }

  window.HorizonCars = {
    CAR_ROSTER,
    createCarMesh,
    AIDrivatarManager
  };
})();
