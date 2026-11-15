/* ==========================================================================
   BACKSEAT RALLY — 10 ICONIC RALLY & HILLCLIMB CARS + 3D RALLY BUILDER
   - Backseat Rally Legends (RAIJIN GS, FRECCIA HF, KAZE RS, FALKE E3,
     OCELOT R1, ORSO 4, KUMO R1, SAFARI RS, CHIRON SS, APEX R1)
   - Authentic 3D Rally Equipment: Hood Quad Light Pods, Roof Air Scoops,
     Mudflaps, Door Number Plates, Liveries & Rally OZ/Gold Wheels
   - Detailed Cockpit Interior with Animated Steering Wheel & Digital Dash
   - Working Active Aerodynamics, Glowing Brake Rotors & Exhaust Backfire
   ========================================================================== */

(function () {
  const CAR_ROSTER = [
    {
      id: 'raijin_gs',
      codeName: 'RAIJIN GS',
      numberPlate: '05',
      brand: 'SUBARU',
      name: 'IMPREZA WRC98 (RAIJIN GS)',
      category: 'WRC RALLY',
      drivetrain: 'AWD',
      isRallySpec: true,
      hp: 380,
      weightKg: 1230,
      topSpeedKmh: 268,
      topSpeedMph: 167,
      zeroTo100: '3.2s',
      redlineRpm: 8000,
      gears: 6,
      color: 0x1d4ed8,
      accentColor: 0xfacc15,
      rimColor: 0xfbbf24,
      mudflapColor: 0x1d4ed8,
      engineProfile: 'flat6_gt3_na',
      basePriceCr: 0,
      desc: 'Flat-4 Boxer Turbo AWD rally icon in World Rally Blue & Gold wheels. Signature hood scoop, quad light pod & tall box wing.',
      shapeProfile: {
        archType: 'jdm_box_coupe',
        width: 1.84,
        length: 4.38,
        hoodHeight: 0.78,
        cabinHeight: 1.38,
        rearHeight: 0.86,
        wheelRadius: 0.37
      },
      physics: {
        gripBase: 1.30,
        downforceCoeff: 0.24,
        brakeG: 1.38,
        turnResponse: 2.95,
        gravelBoost: 1.18
      }
    },
    {
      id: 'kaze_rs',
      codeName: 'KAZE RS',
      numberPlate: '01',
      brand: 'MITSUBISHI',
      name: 'LANCER EVO VI (KAZE RS)',
      category: 'GROUP A',
      drivetrain: 'AWD',
      isRallySpec: true,
      hp: 395,
      weightKg: 1260,
      topSpeedKmh: 272,
      topSpeedMph: 169,
      zeroTo100: '3.1s',
      redlineRpm: 8200,
      gears: 6,
      color: 0xdc2626,
      accentColor: 0xf8fafc,
      rimColor: 0xf8fafc,
      mudflapColor: 0xef4444,
      engineProfile: 'i6_big_turbo',
      basePriceCr: 4500,
      desc: 'Active Yaw Control AWD tarmac & gravel weapon with razor-sharp Scandinavian-flick turn-in and ferocious anti-lag.',
      shapeProfile: {
        archType: 'jdm_box_coupe',
        width: 1.85,
        length: 4.36,
        hoodHeight: 0.78,
        cabinHeight: 1.39,
        rearHeight: 0.88,
        wheelRadius: 0.37
      },
      physics: {
        gripBase: 1.34,
        downforceCoeff: 0.25,
        brakeG: 1.40,
        turnResponse: 3.05,
        gravelBoost: 1.20
      }
    },
    {
      id: 'freccia_hf',
      codeName: 'FRECCIA HF',
      numberPlate: '04',
      brand: 'LANCIA',
      name: 'DELTA HF INTEGRALE (FRECCIA HF)',
      category: 'GROUP A',
      drivetrain: 'AWD',
      isRallySpec: true,
      hp: 365,
      weightKg: 1120,
      topSpeedKmh: 262,
      topSpeedMph: 163,
      zeroTo100: '3.3s',
      redlineRpm: 7800,
      gears: 6,
      color: 0xf1f5f9,
      accentColor: 0xe11d48,
      rimColor: 0xf8fafc,
      mudflapColor: 0x1e293b,
      engineProfile: 'v8_flatplane_tt',
      basePriceCr: 6000,
      desc: '6-time World Rally Champion boxy widebody Italian hatch with twin round lamps, tricolor stripes & roof spoiler.',
      shapeProfile: {
        archType: 'jdm_box_coupe',
        width: 1.82,
        length: 4.02,
        hoodHeight: 0.77,
        cabinHeight: 1.38,
        rearHeight: 0.88,
        wheelRadius: 0.36
      },
      physics: {
        gripBase: 1.32,
        downforceCoeff: 0.22,
        brakeG: 1.36,
        turnResponse: 3.00,
        gravelBoost: 1.19
      }
    },
    {
      id: 'falke_e3',
      codeName: 'FALKE E3',
      numberPlate: '02',
      brand: 'AUDI',
      name: 'SPORT QUATTRO S1 E2 (FALKE E3)',
      category: 'GROUP B',
      drivetrain: 'AWD',
      isRallySpec: true,
      hp: 591,
      weightKg: 1090,
      topSpeedKmh: 285,
      topSpeedMph: 177,
      zeroTo100: '2.5s',
      redlineRpm: 8800,
      gears: 6,
      color: 0xf8fafc,
      accentColor: 0xfacc15,
      rimColor: 0xf1f5f9,
      mudflapColor: 0xeab308,
      engineProfile: 'i6_big_turbo',
      basePriceCr: 9500,
      desc: 'Unleashed Group B 5-cylinder turbo monster featuring massive snowplow front aero, box arches & giant bi-plane wing.',
      shapeProfile: {
        archType: 'jdm_box_coupe',
        width: 1.92,
        length: 4.24,
        hoodHeight: 0.76,
        cabinHeight: 1.35,
        rearHeight: 0.88,
        wheelRadius: 0.37
      },
      physics: {
        gripBase: 1.28,
        downforceCoeff: 0.32,
        brakeG: 1.38,
        turnResponse: 2.86,
        gravelBoost: 1.24
      }
    },
    {
      id: 'ocelot_r1',
      codeName: 'OCELOT R1',
      numberPlate: '03',
      brand: 'PEUGEOT',
      name: '205 T16 EVO 2 (OCELOT R1)',
      category: 'GROUP B',
      drivetrain: 'AWD',
      isRallySpec: true,
      hp: 540,
      weightKg: 910,
      topSpeedKmh: 278,
      topSpeedMph: 173,
      zeroTo100: '2.4s',
      redlineRpm: 8500,
      gears: 5,
      color: 0xf1f5f9,
      accentColor: 0x2563eb,
      rimColor: 0xf1f5f9,
      mudflapColor: 0x2563eb,
      engineProfile: 'f1_hybrid',
      basePriceCr: 11000,
      desc: '910 kg featherweight mid-engine AWD Group B champion with towering rear wing & agile hairpin rotation.',
      shapeProfile: {
        archType: 'jdm_box_coupe',
        width: 1.88,
        length: 3.92,
        hoodHeight: 0.74,
        cabinHeight: 1.34,
        rearHeight: 0.86,
        wheelRadius: 0.36
      },
      physics: {
        gripBase: 1.31,
        downforceCoeff: 0.30,
        brakeG: 1.40,
        turnResponse: 3.15,
        gravelBoost: 1.22
      }
    },
    {
      id: 'orso_4',
      codeName: 'ORSO 4',
      numberPlate: '07',
      brand: 'LANCIA',
      name: '037 RALLY EVO (ORSO 4)',
      category: 'GROUP B RWD',
      drivetrain: 'RWD',
      isRallySpec: true,
      hp: 380,
      weightKg: 960,
      topSpeedKmh: 265,
      topSpeedMph: 165,
      zeroTo100: '3.2s',
      redlineRpm: 8400,
      gears: 5,
      color: 0xf8fafc,
      accentColor: 0x0ea5e9,
      rimColor: 0xe2e8f0,
      mudflapColor: 0x0ea5e9,
      engineProfile: 'v8_flatplane_tt',
      basePriceCr: 8000,
      desc: 'The last RWD WRC champion. Featherweight supercharged mid-engine wedge built for thrilling opposite-lock slides.',
      shapeProfile: {
        archType: 'wedge_super',
        width: 1.88,
        length: 4.10,
        hoodHeight: 0.62,
        cabinHeight: 1.18,
        rearHeight: 0.78,
        wheelRadius: 0.37
      },
      physics: {
        gripBase: 1.22,
        downforceCoeff: 0.28,
        brakeG: 1.38,
        turnResponse: 3.12,
        gravelBoost: 1.12
      }
    },
    {
      id: 'kumo_r1',
      codeName: 'KUMO R1',
      numberPlate: '08',
      brand: 'TOYOTA',
      name: 'CELICA GT-FOUR ST205 (KUMO R1)',
      category: 'GROUP A',
      drivetrain: 'AWD',
      isRallySpec: true,
      hp: 410,
      weightKg: 1240,
      topSpeedKmh: 274,
      topSpeedMph: 170,
      zeroTo100: '3.0s',
      redlineRpm: 8100,
      gears: 6,
      color: 0xf8fafc,
      accentColor: 0x16a34a,
      rimColor: 0xf8fafc,
      mudflapColor: 0xdc2626,
      engineProfile: 'i6_big_turbo',
      basePriceCr: 7500,
      desc: 'Safari-proven AWD fastback featuring signature quad round lamps, Castrol stripes & high-mount ST205 riser wing.',
      shapeProfile: {
        archType: 'gt_fastback',
        width: 1.86,
        length: 4.44,
        hoodHeight: 0.74,
        cabinHeight: 1.30,
        rearHeight: 0.84,
        wheelRadius: 0.37
      },
      physics: {
        gripBase: 1.33,
        downforceCoeff: 0.26,
        brakeG: 1.38,
        turnResponse: 2.90,
        gravelBoost: 1.20
      }
    },
    {
      id: 'safari_rs',
      codeName: 'SAFARI RS',
      numberPlate: '11',
      brand: 'PORSCHE',
      name: '911 DAKAR RALLY (SAFARI RS)',
      category: 'RALLY RAID',
      drivetrain: 'AWD',
      isRallySpec: true,
      hp: 480,
      weightKg: 1480,
      topSpeedKmh: 296,
      topSpeedMph: 184,
      zeroTo100: '2.9s',
      redlineRpm: 8400,
      gears: 8,
      color: 0xf8fafc,
      accentColor: 0x1e40af,
      rimColor: 0xf8fafc,
      mudflapColor: 0xdc2626,
      engineProfile: 'flat6_gt3_na',
      basePriceCr: 14000,
      desc: 'Long-travel AWD 911 Dakar Raid racer with roof equipment rack, quad frog lamps & singing 8,400 RPM Flat-6.',
      shapeProfile: {
        archType: 'porsche_911',
        width: 1.94,
        length: 4.52,
        hoodHeight: 0.68,
        cabinHeight: 1.32,
        rearHeight: 0.84,
        wheelRadius: 0.40
      },
      physics: {
        gripBase: 1.36,
        downforceCoeff: 0.30,
        brakeG: 1.44,
        turnResponse: 2.94,
        gravelBoost: 1.22
      }
    },
    {
      id: 'chiron_ss',
      codeName: 'BLITZ S1',
      numberPlate: '01',
      brand: 'AUDI',
      name: 'SPORT QUATTRO S1 E2 (BLITZ S1)',
      category: 'GROUP B',
      drivetrain: 'AWD',
      isRallySpec: true,
      hp: 598,
      weightKg: 1090,
      topSpeedKmh: 288,
      topSpeedMph: 179,
      zeroTo100: '2.4s',
      redlineRpm: 8500,
      gears: 6,
      color: 0xf8fafc,
      accentColor: 0xfacc15,
      rimColor: 0xf8fafc,
      mudflapColor: 0xdc2626,
      engineProfile: 'i6_big_turbo',
      basePriceCr: 22000,
      desc: '5-Cylinder Big-Turbo Group B legend with massive snowplow aero apron, box fenders & colossal dual-plane rear wing.',
      shapeProfile: {
        archType: 'boxy_sedan',
        width: 1.92,
        length: 4.32,
        hoodHeight: 0.76,
        cabinHeight: 1.38,
        rearHeight: 0.88,
        wheelRadius: 0.37
      },
      physics: {
        gripBase: 1.38,
        downforceCoeff: 0.42,
        brakeG: 1.44,
        turnResponse: 2.95,
        gravelBoost: 1.26
      }
    },
    {
      id: 'jesko_absolut',
      codeName: 'FUJI PP',
      numberPlate: '99',
      brand: 'SUZUKI',
      name: 'ESCUDO PIKES PEAK (FUJI PP)',
      category: 'UNLIMITED RALLY',
      drivetrain: 'AWD',
      isRallySpec: true,
      hp: 985,
      weightKg: 800,
      topSpeedKmh: 315,
      topSpeedMph: 196,
      zeroTo100: '2.1s',
      redlineRpm: 9000,
      gears: 6,
      color: 0xdc2626,
      accentColor: 0xf8fafc,
      rimColor: 0xf8fafc,
      mudflapColor: 0x11151c,
      engineProfile: 'v8_flatplane_tt',
      basePriceCr: 25000,
      desc: '985 HP / 800 kg Twin-Turbo Unlimited Hillclimb monster built to destroy alpine switchbacks & dirt hairpins.',
      shapeProfile: {
        archType: 'gt_fastback',
        width: 1.96,
        length: 4.38,
        hoodHeight: 0.70,
        cabinHeight: 1.30,
        rearHeight: 0.86,
        wheelRadius: 0.39
      },
      physics: {
        gripBase: 1.44,
        downforceCoeff: 0.56,
        brakeG: 1.50,
        turnResponse: 3.10,
        gravelBoost: 1.30
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

    const flameGeo = new THREE.ConeGeometry(radius * 1.65, 1.10, 10);
    flameGeo.rotateX(-Math.PI / 2);
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y, z - 0.56);
    flame.visible = false;
    chassis.add(flame);
    exhaustFlames.push(flame);
  }

  function addQuadRallyLightPod(chassis, carbonMat, headlightMat, y, z) {
    const podBar = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.14, 0.16), carbonMat);
    podBar.position.set(0, y, z);
    chassis.add(podBar);

    [-0.34, -0.115, 0.115, 0.34].forEach((lx) => {
      const lampHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.088, 0.095, 0.12, 16),
        carbonMat
      );
      lampHousing.rotation.x = Math.PI / 2;
      lampHousing.position.set(lx, y + 0.02, z + 0.04);
      chassis.add(lampHousing);

      const lampLens = new THREE.Mesh(
        new THREE.CircleGeometry(0.075, 14),
        headlightMat
      );
      lampLens.position.set(lx, y + 0.02, z + 0.105);
      chassis.add(lampLens);
    });
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
      metalness: 0.65,
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
    const brakelightMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });

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

    // 1. Sculpted Body Hull & Cabin
    const arch = sp.archType;
    let bodyStations;
    let cabinStations;

    if (arch === 'jdm_box_coupe') {
      bodyStations = [
        { z: -halfL * 0.98, bottomY: 0.24, beltY: 0.68, topY: 0.84, halfW: halfW * 0.88, topHalfW: halfW * 0.80 },
        { z: -halfL * 0.82, bottomY: 0.20, beltY: 0.74, topY: 0.86, halfW: halfW * 0.98, topHalfW: halfW * 0.84 },
        { z: -halfL * 0.56, bottomY: 0.19, beltY: 0.78, topY: 0.86, halfW: halfW * 1.06, topHalfW: halfW * 0.88 },
        { z: -halfL * 0.25, bottomY: 0.18, beltY: 0.76, topY: 0.84, halfW: halfW * 0.96, topHalfW: halfW * 0.85 },
        { z: halfL * 0.22, bottomY: 0.18, beltY: 0.74, topY: 0.81, halfW: halfW * 0.96, topHalfW: halfW * 0.85 },
        { z: halfL * 0.58, bottomY: 0.19, beltY: 0.75, topY: 0.80, halfW: halfW * 1.06, topHalfW: halfW * 0.86 },
        { z: halfL * 0.88, bottomY: 0.20, beltY: 0.66, topY: 0.73, halfW: halfW * 0.95, topHalfW: halfW * 0.82 },
        { z: halfL * 0.99, bottomY: 0.21, beltY: 0.52, topY: 0.64, halfW: halfW * 0.88, topHalfW: halfW * 0.76 }
      ];
      cabinStations = [
        { z: -halfL * 0.60, bottomY: 0.80, beltY: 0.85, topY: 0.86, halfW: halfW * 0.76, topHalfW: halfW * 0.70 },
        { z: -halfL * 0.32, bottomY: 0.80, beltY: 1.08, topY: sp.cabinHeight, halfW: halfW * 0.76, topHalfW: halfW * 0.64 },
        { z: halfL * 0.08, bottomY: 0.79, beltY: 1.08, topY: sp.cabinHeight, halfW: halfW * 0.76, topHalfW: halfW * 0.64 },
        { z: halfL * 0.34, bottomY: 0.77, beltY: 0.82, topY: 0.83, halfW: halfW * 0.76, topHalfW: halfW * 0.70 }
      ];
    } else if (arch === 'porsche_911') {
      bodyStations = [
        { z: -halfL * 0.98, bottomY: 0.26, beltY: 0.64, topY: 0.76, halfW: halfW * 0.86, topHalfW: halfW * 0.74 },
        { z: -halfL * 0.62, bottomY: 0.20, beltY: 0.76, topY: 0.85, halfW: halfW * 1.06, topHalfW: halfW * 0.88 },
        { z: -halfL * 0.15, bottomY: 0.19, beltY: 0.72, topY: 0.80, halfW: halfW * 0.95, topHalfW: halfW * 0.82 },
        { z: halfL * 0.28, bottomY: 0.19, beltY: 0.70, topY: 0.76, halfW: halfW * 0.95, topHalfW: halfW * 0.82 },
        { z: halfL * 0.60, bottomY: 0.20, beltY: 0.72, topY: 0.76, halfW: halfW * 1.02, topHalfW: halfW * 0.84 },
        { z: halfL * 0.90, bottomY: 0.21, beltY: 0.48, topY: 0.56, halfW: halfW * 0.88, topHalfW: halfW * 0.74 },
        { z: halfL * 0.99, bottomY: 0.22, beltY: 0.36, topY: 0.44, halfW: halfW * 0.76, topHalfW: halfW * 0.62 }
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
        { z: -halfL * 0.60, bottomY: 0.19, beltY: 0.78, topY: 0.86, halfW: halfW * 1.05, topHalfW: halfW * 0.88 },
        { z: -halfL * 0.15, bottomY: 0.18, beltY: 0.74, topY: 0.82, halfW: halfW * 0.95, topHalfW: halfW * 0.82 },
        { z: halfL * 0.25, bottomY: 0.18, beltY: 0.72, topY: 0.78, halfW: halfW * 0.95, topHalfW: halfW * 0.82 },
        { z: halfL * 0.60, bottomY: 0.19, beltY: 0.72, topY: 0.76, halfW: halfW * 1.02, topHalfW: halfW * 0.84 },
        { z: halfL * 0.90, bottomY: 0.20, beltY: 0.54, topY: 0.62, halfW: halfW * 0.90, topHalfW: halfW * 0.76 },
        { z: halfL * 0.99, bottomY: 0.21, beltY: 0.42, topY: 0.50, halfW: halfW * 0.78, topHalfW: halfW * 0.66 }
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
        { z: -halfL * 0.58, bottomY: 0.18, beltY: 0.74, topY: 0.82, halfW: halfW * 1.06, topHalfW: halfW * 0.88 },
        { z: -halfL * 0.08, bottomY: 0.17, beltY: 0.66, topY: 0.74, halfW: halfW * 0.94, topHalfW: halfW * 0.80 },
        { z: halfL * 0.42, bottomY: 0.17, beltY: 0.62, topY: 0.68, halfW: halfW * 0.98, topHalfW: halfW * 0.82 },
        { z: halfL * 0.64, bottomY: 0.18, beltY: 0.60, topY: 0.64, halfW: halfW * 1.02, topHalfW: halfW * 0.84 },
        { z: halfL * 0.92, bottomY: 0.18, beltY: 0.38, topY: 0.46, halfW: halfW * 0.88, topHalfW: halfW * 0.74 },
        { z: halfL * 1.00, bottomY: 0.19, beltY: 0.30, topY: 0.36, halfW: halfW * 0.74, topHalfW: halfW * 0.60 }
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

    // 2. Detailed Cockpit Interior & Animated Rally Steering Wheel
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0x12151c, roughness: 0.75 });
    const dashGlowMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    const dashBinnacle = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.64, 0.16, 0.38), interiorMat);
    dashBinnacle.position.set(0, 0.74, halfL * 0.20);
    chassis.add(dashBinnacle);

    const digitalCluster = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.02), dashGlowMat);
    digitalCluster.position.set(0.32, 0.83, halfL * 0.12);
    chassis.add(digitalCluster);

    // Driver & Co-Driver Bucket Seats + 3D Helmeted Crew (Backseat Rally!)
    const suitMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });

    [-0.32, 0.32].forEach((seatX) => {
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 0.10), interiorMat);
      seatBack.position.set(seatX, 0.78, -0.22);
      seatBack.rotation.x = -0.18;
      chassis.add(seatBack);

      const headrestTrim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.11), accentMat);
      headrestTrim.position.set(seatX, 0.96, -0.25);
      chassis.add(headrestTrim);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.30, 0.16), suitMat);
      torso.position.set(seatX, 0.80, -0.14);
      torso.rotation.x = -0.14;
      chassis.add(torso);
    });

    // Driver Helmet (turns into apexes)
    const driverHelmet = new THREE.Group();
    driverHelmet.position.set(0.32, 1.04, -0.16);
    const dShell = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), helmetMat);
    const dStripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.23, 0.22), accentMat);
    const dVisor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.08), visorMat);
    dVisor.position.set(0, 0.01, 0.09);
    driverHelmet.add(dShell, dStripe, dVisor);
    chassis.add(driverHelmet);

    // Co-Driver Helmet + Pacenote Notebook & Intercom Boom Mic
    const coDriverHelmet = new THREE.Group();
    coDriverHelmet.position.set(-0.32, 1.03, -0.16);
    const cShell = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 10), accentMat);
    const cVisor = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.055, 0.08), visorMat);
    cVisor.position.set(0, 0.01, 0.085);
    coDriverHelmet.add(cShell, cVisor);
    chassis.add(coDriverHelmet);

    const pacenoteBook = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.02, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xfef9c3 })
    );
    pacenoteBook.position.set(-0.32, 0.85, 0.02);
    pacenoteBook.rotation.x = 0.45;
    chassis.add(pacenoteBook);

    const steeringWheel = new THREE.Group();
    steeringWheel.position.set(0.32, 0.81, halfL * 0.04);
    const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.022, 8, 20), interiorMat);
    const topCenterMarker = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.03), accentMat);
    topCenterMarker.position.set(0, 0.145, 0);
    const wheelHub = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.045, 0.025), chromeMat);
    steeringWheel.add(wheelRing, topCenterMarker, wheelHub);
    chassis.add(steeringWheel);

    // Painted Roof Cap
    const roofZLen = (cabinStations[2].z - cabinStations[1].z) * 0.95;
    const roofZMid = (cabinStations[1].z + cabinStations[2].z) * 0.5;
    const roofCap = new THREE.Mesh(
      new THREE.BoxGeometry(halfW * 1.12, 0.045, roofZLen),
      spec.id === 'safari_rs' ? carbonMat : bodyMat
    );
    roofCap.position.set(0, sp.cabinHeight - 0.01, roofZMid);
    chassis.add(roofCap);

    // Front Splitter, Side Skirts & Rear Diffuser
    const frontSplitter = new THREE.Mesh(
      new THREE.BoxGeometry(sp.width * 0.96, 0.055, 0.36),
      carbonMat
    );
    frontSplitter.position.set(0, 0.18, halfL * 0.92);
    chassis.add(frontSplitter);

    [-halfW * 0.96, halfW * 0.96].forEach((sx) => {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, sp.length * 0.52), carbonMat);
      skirt.position.set(sx, 0.19, 0);
      chassis.add(skirt);

      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.10, 0.16), bodyMat);
      mirror.position.set(sx * 1.02, sp.hoodHeight + 0.16, halfL * 0.24);
      chassis.add(mirror);
    });

    const rearDiffuser = new THREE.Mesh(
      new THREE.BoxGeometry(sp.width * 0.86, 0.22, 0.36),
      carbonMat
    );
    rearDiffuser.position.set(0, 0.24, -halfL * 0.93);
    chassis.add(rearDiffuser);

    // Rally Equipment Package for all WRC/Group A/Group B/Raid cars
    if (spec.isRallySpec) {
      // Hood-mounted Quad Rally Light Pod
      addQuadRallyLightPod(chassis, carbonMat, headlightMat, 0.68, halfL * 0.88);

      // Rally Roof Air Intake Scoop
      const rallyRoofScoop = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.10, 0.36), carbonMat);
      rallyRoofScoop.position.set(0, sp.cabinHeight + 0.05, roofZMid + 0.18);
      chassis.add(rallyRoofScoop);

      // Door Rally Number Plate Squares
      [-halfW * 0.98, halfW * 0.98].forEach((sideX) => {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.30, 0.42), headlightMat);
        plate.position.set(sideX, 0.56, 0.04);
        chassis.add(plate);

        const trim = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.06, 0.42), accentMat);
        trim.position.set(sideX, 0.69, 0.04);
        chassis.add(trim);
      });

      // Flexible Rally Mudflaps behind all 4 wheel arches
      const mudflaps = [];
      const mudflapMat = new THREE.MeshStandardMaterial({
        color: spec.mudflapColor || spec.accentColor,
        roughness: 0.72,
        side: THREE.DoubleSide
      });
      [
        { x: -halfW * 0.94, z: halfL * 0.42 },
        { x: halfW * 0.94, z: halfL * 0.42 },
        { x: -halfW * 0.95, z: -halfL * 0.76 },
        { x: halfW * 0.95, z: -halfL * 0.76 }
      ].forEach((mf) => {
        const flap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.025), mudflapMat);
        flap.position.set(mf.x, 0.18, mf.z);
        flap.rotation.x = 0.18;
        flap.userData = { baseRotX: 0.18 };
        chassis.add(flap);
        mudflaps.push(flap);
      });
      chassis.userData.mudflaps = mudflaps;
    }

    const exhaustFlames = [];
    let activeWing = null;

    // 3. Bespoke Car-by-Car Aero, Grilles, Headlights & Wings
    if (spec.id === 'raijin_gs') {
      const hoodScoop = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.11, 0.42), bodyMat);
      hoodScoop.position.set(0, 0.78, halfL * 0.52);
      chassis.add(hoodScoop);

      const scoopOpening = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.06), darkGrilleMat);
      scoopOpening.position.set(0, 0.79, halfL * 0.72);
      chassis.add(scoopOpening);

      [-halfW * 0.52, halfW * 0.52].forEach((sx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.12, 0.14), headlightMat);
        hl.position.set(sx, 0.56, halfL * 0.96);
        chassis.add(hl);

        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.11, 0.08), brakelightMat);
        tl.position.set(sx * 1.15, 0.68, -halfL * 0.98);
        chassis.add(tl);
      });

      const subaruWing = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.90, 0.05, 0.28), bodyMat);
      subaruWing.position.set(0, 1.12, -halfL * 0.88);
      chassis.add(subaruWing);
      [-halfW * 0.72, halfW * 0.72].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.26), bodyMat);
        post.position.set(px, 0.98, -halfL * 0.88);
        chassis.add(post);
      });

      addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, -0.50, 0.24, -halfL * 0.99, 0.105, false);

    } else if (spec.id === 'kaze_rs') {
      const evoVent = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 0.36), carbonMat);
      evoVent.position.set(0, 0.76, halfL * 0.56);
      chassis.add(evoVent);

      const intercooler = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.22, 0.08), chromeMat);
      intercooler.position.set(0, 0.30, halfL * 0.99);
      chassis.add(intercooler);

      [-halfW * 0.62, halfW * 0.62].forEach((sx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.11, 0.14), headlightMat);
        hl.position.set(sx, 0.56, halfL * 0.96);
        chassis.add(hl);

        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.11, 0.08), brakelightMat);
        tl.position.set(sx * 0.95, 0.68, -halfL * 0.98);
        chassis.add(tl);
      });

      // Signature Evo VI Bi-Plane Rear Wing
      const wTop = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.90, 0.045, 0.26), bodyMat);
      wTop.position.set(0, 1.16, -halfL * 0.88);
      const wMid = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.86, 0.035, 0.20), carbonMat);
      wMid.position.set(0, 1.02, -halfL * 0.86);
      chassis.add(wTop, wMid);
      [-halfW * 0.80, halfW * 0.80].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.28), bodyMat);
        post.position.set(px, 1.00, -halfL * 0.88);
        chassis.add(post);
      });

      addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, -0.52, 0.24, -halfL * 0.99, 0.105, false);

    } else if (spec.id === 'freccia_hf' || spec.id === 'ocelot_r1') {
      // Racing Martini / PTS Center Stripes
      [-0.12, 0.12].forEach((stX) => {
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.02, sp.length * 0.92), accentMat);
        st.position.set(stX, 0.84, 0);
        chassis.add(st);
      });

      const grille = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.08), darkGrilleMat);
      grille.position.set(0, 0.54, halfL * 0.99);
      chassis.add(grille);

      [-0.62, -0.42, 0.42, 0.62].forEach((hx) => {
        const roundLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.10, 16), headlightMat);
        roundLamp.rotation.x = Math.PI / 2;
        roundLamp.position.set(hx, 0.54, halfL * 0.96);
        chassis.add(roundLamp);
      });

      [-halfW * 0.62, halfW * 0.62].forEach((tx) => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.08), brakelightMat);
        tl.position.set(tx, 0.62, -halfL * 0.98);
        chassis.add(tl);
      });

      const hatchWing = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.84, 0.05, 0.28), spec.id === 'ocelot_r1' ? carbonMat : accentMat);
      hatchWing.position.set(0, sp.cabinHeight + 0.06, -halfL * 0.82);
      hatchWing.rotation.x = 0.22;
      chassis.add(hatchWing);

      addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, -0.44, 0.25, -halfL * 0.99, 0.095, false);

    } else if (spec.id === 'falke_e3') {
      // Massive Pikes Peak Snowplow Front Aero & Giant Bi-Plane Wing
      const snowplow = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 1.04, 0.18, 0.48), bodyMat);
      snowplow.position.set(0, 0.26, halfL * 0.96);
      chassis.add(snowplow);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.98, 0.10, sp.length * 0.72), accentMat);
      stripe.position.set(0, 0.46, 0);
      chassis.add(stripe);

      [-halfW * 0.62, halfW * 0.62].forEach((hx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.12), headlightMat);
        hl.position.set(sxOrVal(hx), 0.58, halfL * 0.96);
        chassis.add(hl);
      });

      function sxOrVal(v) { return v; }

      const tailBar = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.86, 0.12, 0.08), brakelightMat);
      tailBar.position.set(0, 0.68, -halfL * 0.98);
      chassis.add(tailBar);

      const s1Wing = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 1.06, 0.06, 0.42), accentMat);
      s1Wing.position.set(0, 1.32, -halfL * 0.90);
      s1Wing.rotation.x = 0.18;
      chassis.add(s1Wing);
      [-halfW * 0.95, halfW * 0.95].forEach((epX) => {
        const ep = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 0.48), bodyMat);
        ep.position.set(epX, 1.08, -halfL * 0.90);
        chassis.add(ep);
      });

      addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, -0.54, 0.24, -halfL * 0.99, 0.12, false);

    } else if (spec.id === 'orso_4') {
      const louvers = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.05, 0.95), carbonMat);
      louvers.position.set(0, 0.80, -halfL * 0.52);
      chassis.add(louvers);

      [-0.64, -0.44, 0.44, 0.64].forEach((hx) => {
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.12, 16), headlightMat);
        lamp.rotation.x = Math.PI / 2;
        lamp.position.set(hx, 0.48, halfL * 0.94);
        chassis.add(lamp);
      });

      [-halfW * 0.62, halfW * 0.62].forEach((tx) => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.10, 0.08), brakelightMat);
        tl.position.set(tx, 0.66, -halfL * 0.98);
        chassis.add(tl);
      });

      const wing037 = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.90, 0.045, 0.28), bodyMat);
      wing037.position.set(0, 0.98, -halfL * 0.88);
      chassis.add(wing037);

      [-0.45, 0.45].forEach((ex) => {
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, ex, 0.30, -halfL * 0.98, 0.085, false);
      });

    } else if (spec.id === 'kumo_r1') {
      [-halfW * 0.55, halfW * 0.55].forEach((sx) => {
        const innerLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16), headlightMat);
        innerLamp.rotation.x = Math.PI / 2;
        innerLamp.position.set(sx * 0.65, 0.54, halfL * 0.94);
        const outerLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.14, 16), headlightMat);
        outerLamp.rotation.x = Math.PI / 2;
        outerLamp.position.set(sx * 1.05, 0.54, halfL * 0.92);
        chassis.add(innerLamp, outerLamp);

        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.11, 0.08), brakelightMat);
        tl.position.set(sx * 1.05, 0.68, -halfL * 0.98);
        chassis.add(tl);
      });

      const st205Wing = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.88, 0.05, 0.26), accentMat);
      st205Wing.position.set(0, 1.08, -halfL * 0.88);
      chassis.add(st205Wing);
      [-0.58, 0.58].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.24), bodyMat);
        post.position.set(px, 0.94, -halfL * 0.88);
        chassis.add(post);
      });

      addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, -0.50, 0.25, -halfL * 0.99, 0.11, false);

    } else if (spec.id === 'safari_rs') {
      // Roof Rally Raid Spare Basket & Quad LED Bar
      const roofBasket = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.10, 1.08), carbonMat);
      roofBasket.position.set(0, sp.cabinHeight + 0.05, roofZMid - 0.1);
      chassis.add(roofBasket);

      const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.07, 0.08), headlightMat);
      ledBar.position.set(0, sp.cabinHeight + 0.08, roofZMid + 0.45);
      chassis.add(ledBar);

      [-halfW * 0.68, halfW * 0.68].forEach((fx) => {
        const fenderHump = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.85, 14), bodyMat);
        fenderHump.rotation.x = Math.PI / 2;
        fenderHump.scale.set(1.0, 0.65, 1.0);
        fenderHump.position.set(fx, 0.66, halfL * 0.64);
        chassis.add(fenderHump);

        const frogLight = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), headlightMat);
        frogLight.scale.set(0.95, 0.65, 1.15);
        frogLight.position.set(fx, 0.68, halfL * 0.86);
        frogLight.rotation.x = 0.35;
        chassis.add(frogLight);
      });

      activeWing = new THREE.Group();
      activeWing.position.set(0, sp.cabinHeight + 0.04, -halfL * 0.86);
      const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.90, 0.05, 0.30), carbonMat);
      activeWing.add(wingBlade);
      activeWing.userData = { baseY: sp.cabinHeight + 0.04, deployLift: 0.0, basePitch: 0.16 };
      chassis.add(activeWing);

      const porscheLightStrip = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.86, 0.055, 0.08), brakelightMat);
      porscheLightStrip.position.set(0, 0.68, -halfL * 0.98);
      chassis.add(porscheLightStrip);

      [-0.22, 0.22].forEach((exX) => {
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, exX, 0.28, -halfL * 0.98, 0.08, false);
      });

    } else if (spec.id === 'chiron_ss') {
      // AUDI SPORT QUATTRO S1 E2 GROUP B (BLITZ S1)
      const snowplowApron = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 1.04, 0.22, 0.44), bodyMat);
      snowplowApron.position.set(0, 0.24, halfL * 0.94);
      chassis.add(snowplowApron);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.98, 0.06, sp.length * 0.76), accentMat);
      stripe.position.set(0, 0.62, 0);
      chassis.add(stripe);

      [-halfW * 0.72, halfW * 0.72].forEach((fx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.12), headlightMat);
        hl.position.set(fx, 0.56, halfL * 0.98);
        chassis.add(hl);
      });

      activeWing = new THREE.Group();
      activeWing.position.set(0, 1.24, -halfL * 0.88);
      const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.98, 0.05, 0.44), bodyMat);
      const lowerDeck = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.94, 0.04, 0.30), carbonMat);
      lowerDeck.position.set(0, -0.18, -0.02);
      activeWing.add(upperDeck, lowerDeck);
      [-halfW * 0.82, halfW * 0.82].forEach((px) => {
        const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.46, 0.50), accentMat);
        endPlate.position.set(px, -0.16, 0);
        activeWing.add(endPlate);
      });
      activeWing.userData = { baseY: 1.24, deployLift: 0.0, basePitch: 0.18 };
      chassis.add(activeWing);

      const tailBar = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.86, 0.09, 0.08), brakelightMat);
      tailBar.position.set(0, 0.68, -halfL * 0.98);
      chassis.add(tailBar);

      [-0.48, -0.34].forEach((exX) => {
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, exX, 0.28, -halfL * 0.98, 0.07, false);
      });

    } else {
      // SUZUKI ESCUDO TWIN-TURBO PIKES PEAK (FUJI PP)
      const hillclimbSplitter = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 1.10, 0.07, 0.62), carbonMat);
      hillclimbSplitter.position.set(0, 0.16, halfL * 0.98);
      chassis.add(hillclimbSplitter);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 0.42, 0.03, sp.length * 0.72), accentMat);
      stripe.position.set(0, 0.75, 0.06);
      chassis.add(stripe);

      activeWing = new THREE.Group();
      activeWing.position.set(0, 1.48, -halfL * 0.86);
      const biplaneTop = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 1.12, 0.05, 0.56), accentMat);
      const biplaneLow = new THREE.Mesh(new THREE.BoxGeometry(sp.width * 1.06, 0.04, 0.36), carbonMat);
      biplaneLow.position.set(0, -0.26, 0);
      activeWing.add(biplaneTop, biplaneLow);
      [-halfW * 0.96, halfW * 0.96].forEach((px) => {
        const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.76, 0.64), bodyMat);
        endPlate.position.set(px, -0.28, 0);
        activeWing.add(endPlate);
      });
      activeWing.userData = { baseY: 1.48, deployLift: 0.04, basePitch: 0.22 };
      chassis.add(activeWing);

      [-halfW * 0.68, halfW * 0.68].forEach((sx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.10, 0.22), headlightMat);
        hl.position.set(sx, 0.52, halfL * 0.88);
        chassis.add(hl);
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.08, 0.08), brakelightMat);
        tl.position.set(sx * 0.92, 0.68, -halfL * 0.98);
        chassis.add(tl);
      });
      [-0.36, 0.36].forEach((exX) => {
        addExhaustPipeWithFlame(chassis, exhaustFlames, chromeMat, flameMat, exX, 0.32, -halfL * 0.99, 0.09, false);
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

    // 4. 4 Rally/Sport Wheels with Glowing Brake Rotors
    const wheelRadius = sp.wheelRadius || 0.38;
    const wheelWidth = 0.32;
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x121418,
      roughness: 0.78,
      metalness: 0.1
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: spec.rimColor || 0xe2e8f0,
      roughness: 0.16,
      metalness: 0.85,
      envMapIntensity: 1.8
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

      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth * 0.82, 26);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      spinGroup.add(tire);

      [-wheelWidth * 0.36, wheelWidth * 0.36].forEach((sideOffset) => {
        const sidewall = new THREE.Mesh(
          new THREE.TorusGeometry(wheelRadius * 0.84, wheelRadius * 0.16, 10, 22),
          tireMat
        );
        sidewall.rotation.y = Math.PI / 2;
        sidewall.position.x = sideOffset;
        spinGroup.add(sidewall);
      });

      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.68, wheelRadius * 0.68, wheelWidth * 0.86, 18);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      spinGroup.add(rim);

      const rotorGeo = new THREE.CylinderGeometry(wheelRadius * 0.52, wheelRadius * 0.52, wheelWidth * 0.5, 16);
      rotorGeo.rotateZ(Math.PI / 2);
      const rotor = new THREE.Mesh(rotorGeo, rotorMat);
      spinGroup.add(rotor);

      for (let s = 0; s < 6; s++) {
        const spoke = new THREE.Mesh(
          new THREE.BoxGeometry(wheelWidth * 0.88, wheelRadius * 1.28, 0.038),
          rimMat
        );
        spoke.rotation.x = (s / 6) * Math.PI;
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
      wheels,
      mudflaps: chassis.userData.mudflaps || [],
      driverHelmet,
      coDriverHelmet
    };
  }

  /* ------------------------------------------------------------------------
     6 ONE-WAY STAGE RALLY RIVALS WITH COLLISION RESPONSE
     ------------------------------------------------------------------------ */
  class AIDrivatarManager {
    constructor(scene, world) {
      this.scene = scene;
      this.world = world;
      this.drivatars = [];

      const mainRoad = this.world.roadSplines[0];

      for (let i = 0; i < 6; i++) {
        const spec = CAR_ROSTER[(i + 1) % CAR_ROSTER.length];
        const road = this.world.roadSplines[i % this.world.roadSplines.length] || mainRoad;
        const built = createCarMesh(spec, spec.color, false);
        this.scene.add(built.root);

        const dir = 1;
        this.drivatars.push({
          id: i,
          spec: spec,
          built: built,
          road: road,
          dir: dir,
          t: (0.14 + (i / 6) * 0.78) % 1,
          speed: 30 + (i % 4) * 5,
          laneOffset: (i % 2 === 0 ? -1 : 1) * (road.width * 0.16),
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
