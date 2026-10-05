/* ============================================================
   elevations / version-forty-nine — EXTERIOR ONLY (V49 = V43 + SF east wall and roof edge pulled 1220 mm inside)
   V31 with the SE rod screen turned into a solid plaster wall
   from the first-floor slab to the second-floor rail height.

     · SE screen — south leg is a solid plaster wall; east
       leg keeps the vertical rods.
     · FF east box — projecting sit-out to the north end, 265 mm
       proud of the screen plane and 275 into the slab, with the
       opening splayed on all four sides and an MS rail on the
       same east line as the second-floor living bay.
     · FF south balcony — plaster wall on the SW bay (same run
       as the SF wall). No timber cladding.

   Ground and second floor otherwise stay as V29. Terrace slab on
   the east stops at the lift shaft. The pergola is only the
   south-east half of that outer strip.
   ============================================================ */
window.HouseScene = (function () {
  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = 'V33_OFFW_20260816b';
  'use strict';

  /* ---------------- levels (metres) ---------------- */
  const L = {
    ground: 0,
    f0: 0.75, f1: 4.103, f2: 7.456,
    roof: 10.809, parapetTop: 11.709,
    f2f: 3.353, slabT: 0.15, cut: 1.5,
    porticoFl: 0.15, pathFl: 0.05,
    liftTop: 10.809
  };

  /* ---------------- palette ----------------
     V6 colour discipline on the V15/V17 lime house.

     three.js r128 has no ColorManagement: material hexes are shaded as LINEAR.
     Palettes written as sRGB paint therefore render a stop too bright and every
     dark becomes putty. buildMaterials() converts sRGB → linear so these
     swatches read as authored.

     Value range sits HIGH, like V6. Contrast comes from shadow, a quiet
     sand-float on east walls, and small dark frames — not from colour patches.
       BODY   lime-white plaster
       EAST   same ivory, sand-float / sponge-float grit
       LINE   thin brass / stone coping
       PUNCT  soft charcoal frames + light glass */
  const C = {
    white:   0xece7db,  // BODY — inspiration off-white (Upparapalli house)
    white2:  0xf3efe6,  // BODY — same off-white, slightly lighter soffits / reveals
    fin:     0xd6c9ae,  // east verticals only — V6 lime, not chalk
    fin2:    0xded2b8,  // east vertical mullions — V6 near-white
    sand:    0xd2cdc4,  // SOFT — cool greige east shell
    stone:   0xd0cbc3,  // SOFT — pale stone
    charcoal:0x9c9b98,  // SOFT — cool gray (not brown, not ink)
    charDark:0x8f8e8b,  // SOFT — slightly deeper cool gray, fascias / soffits
    plinth:  0xb7ae9d,  // SOFT — plinth course
    frame:   0x585349,  // PUNCT — soft charcoal openings
    glass:   0x8ea3af,  // light blue-grey glazing
    walnut:  0x9c7748,  // warm timber doors
    ms:      0x8a8986,  // railing bars — cool grey line
    brass:   0xc0a06a,  // LINE
    steel:   0xd2d6da,  // brushed stainless
    paver:   0x878178,  // driveway — V6
    paver2:  0x777168,
    concrete:0x706d68,  // stair / yard — V6 warm concrete
    terraceF:0x706d68,  // terrace — V6 limestone
    balcTile:0x706d68,  // FF/SF decks — V6 pale stone
    solar:   0x2a3038,  // recedes
    solarFrm:0x3a3530,
    tank:    0xece7db,
    green:   0x4c6838,
    green2:  0x607d45,
    boug:    0xc44f86,
    ixora:   0xe16b39,
    grass:   0x55703f,
    leafDark:0x2d4a28,
    leafLight:0x6b8c3e,
    bark:    0x3d2e1f,
    barkLight:0x6e5a42,
    flowerPink:0xe0749a,
    // Site ground was near-black (0x2a2824 / 0x32302c) — that reads fine against
    // the old black studio backdrop, but under a daylight sky it becomes a void
    // the plot floats in. Dry Anantapur earth instead.
    ground:  0x9a9078,
    plotPad: 0xa2977f,
    // floor tints — warm living / cool wet rooms
    tLiving: 0xd8d2c4, tBed: 0xddd6c8, tBath: 0xc8c6c2,
    tKitch:  0xd4cec0, tUtil: 0xc8c4bc, tOut:   0x706d68,
    tCirc:   0xd4cec0, tOffice: 0xd4cec0, tPooja: 0xe2d8c4,
    tWalk:   0xd8d2c4,
    // furniture
    fabric:  0xc4bbae, fabric2: 0x8a847a, woodF: 0x5c4030,
    woodD:   0x3e2c20, mattress:0xeee8dc, pillow: 0xf4efe6,
    bedding: 0xcfc9bc, whiteG: 0xf4efe6, dark: 0x2a2723,
    tv:      0x0b0c0d, rug: 0xb6a98d, carBody: 0x83888d,
    carDark: 0x1c1e20, lamp: 0xffd9a0, liftDoor:0xc8ccd1,
    counter: 0xeee8dc, counterTop: 0x4a4540,
    tharRed: 0xb51a22, chrome: 0xd8d2c4,
    accentWarm: 0xc39a66, // warm brass line
    copingLight: 0xe6dfd1,
    liftSteel: 0xb8bdc2,
    liftChrome: 0xf0f2f4,
    // realism pass (unique hexes for walkthrough colour lookup)
    skirt:   0x5f594f,
    curtain: 0xd4cec0,
    curtain2:0xc4bbae,
    downlight:0xf4ead2,
    road:    0x3f4043,
    roadLine:0xd8d5c8,
    pave:    0x8a867e,
    nbr1:    0xd9d2c4,
    nbr2:    0xc7bfb3,
    nbr3:    0xb8b3a8,
    nbrWin:  0x20272e,
    soil:    0x4a3b2d,
    murtiGold: 0xd4ad55,
    murtiDark: 0x2c2e32,
    murtiBlue: 0x4568a8,
    saffron:   0xe08a30,
    vermilion: 0xd44532,
    lotusPink: 0xe08aaa,
    peetaRed:  0x9a3530
  };

  /* materials: key -> spec; emissive optional
     sRGB swatches → linear so the viewer does not wash them to putty. */
  function buildMaterials(THREE) {
    const M = {};
    const srgb = (hex) => new THREE.Color(hex).convertSRGBToLinear();
    const mk = (key, color, o) => {
      const m = new THREE.MeshStandardMaterial(Object.assign({
        color: srgb(color), roughness: 0.93, metalness: 0.0
      }, o || {}));
      M[key] = m; return m;
    };
    for (const k of Object.keys(C)) {
      if (k === 'glass' || k === 'carGlass' || k === 'lamp') continue;
      mk(k, C[k]);
    }
    mk('glass', C.glass, { roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.42, depthWrite: false });
    mk('carGlass', 0x1d2429, { roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 });
    mk('lamp', C.lamp, { emissive: srgb(C.lamp), emissiveIntensity: 2.4, roughness: 0.55 });
    M.white.roughness = 0.94; M.white2.roughness = 0.92;
    if (M.fin) M.fin.roughness = 0.94;
    if (M.fin2) M.fin2.roughness = 0.92;
    if (M.sand) M.sand.roughness = 0.93;
    // Quiet lime grain — same hue, faint sand-float. Whole plaster body.
    (function limeGrain() {
      function map(hex, amp) {
        const cnv = document.createElement('canvas');
        cnv.width = cnv.height = 256;
        const ctx = cnv.getContext('2d');
        const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        ctx.fillRect(0, 0, 256, 256);
        const img = ctx.getImageData(0, 0, 256, 256), d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const x = (i / 4) % 256, y = (i / 4 / 256) | 0;
          const n = (Math.sin(x * 0.41 + y * 0.07) + Math.sin(x * 0.09 - y * 0.33)) * amp;
          const k = n + (Math.random() - 0.5) * amp * 1.4;
          d[i] = Math.max(0, Math.min(255, d[i] + k));
          d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + k * 0.95));
          d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + k * 0.98));
        }
        ctx.putImageData(img, 0, 0);
        const tex = new THREE.CanvasTexture(cnv);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(3.2, 2.4);
        if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
        return tex;
      }
      if (typeof document !== 'undefined') {
        M.white.map = map(C.white, 5.5);
        M.white2.map = map(C.white2, 4.5);
        M.white.needsUpdate = true;
        M.white2.needsUpdate = true;
      }
    })();
    // East walls — one sand-float (sponge-float) plaster. Same ivory as the
    // body; grit + faint trowel only. Last putty coat floated with fine sand
    // or a damp sponge, then the same emulsion. No two-tone, no rustication.
    mk('eastPlaster', C.white);
    M.eastPlaster.roughness = 0.96;
    (function sandFloat() {
      if (typeof document === 'undefined') return;
      const SIZE = 512;
      const cell = 8;
      const gw = SIZE / cell, gh = SIZE / cell;
      const grid = new Float32Array(gw * gh);
      for (let i = 0; i < grid.length; i++) grid[i] = Math.random();
      function g(ix, iy) {
        ix = ((ix % gw) + gw) % gw;
        iy = ((iy % gh) + gh) % gh;
        return grid[iy * gw + ix];
      }
      function smooth(x, y) {
        const x0 = Math.floor(x), y0 = Math.floor(y);
        const tx = x - x0, ty = y - y0;
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const a = g(x0, y0), b = g(x0 + 1, y0), c = g(x0, y0 + 1), d = g(x0 + 1, y0 + 1);
        return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
      }
      const field = new Float32Array(SIZE * SIZE);
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const n1 = smooth(x / cell, y / cell);
          const n2 = smooth(x / (cell * 2), y / (cell * 2));
          const n3 = smooth(x / 4, y / 4);
          const trowel = Math.sin((y / SIZE) * Math.PI * 2 * 7 + n2 * 1.4) * 0.18
                       + Math.sin((y / SIZE) * Math.PI * 2 * 18 + x * 0.012) * 0.08;
          field[y * SIZE + x] = n1 * 0.45 + n2 * 0.25 + n3 * 0.15 + 0.5 + trowel;
        }
      }
      function texFrom(amp, grey) {
        const cnv = document.createElement('canvas');
        cnv.width = cnv.height = SIZE;
        const ctx = cnv.getContext('2d');
        const img = ctx.createImageData(SIZE, SIZE), d = img.data;
        const hex = C.white;
        const r = (hex >> 16) & 255, gv = (hex >> 8) & 255, b = hex & 255;
        for (let i = 0; i < field.length; i++) {
          const k = (field[i] - 0.5) * amp;
          const o = i * 4;
          if (grey) {
            const v = Math.max(0, Math.min(255, 128 + k));
            d[o] = d[o + 1] = d[o + 2] = v;
          } else {
            d[o]     = Math.max(0, Math.min(255, r + k));
            d[o + 1] = Math.max(0, Math.min(255, gv + k * 0.98));
            d[o + 2] = Math.max(0, Math.min(255, b + k * 0.97));
          }
          d[o + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        const tex = new THREE.CanvasTexture(cnv);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
        if (!grey && THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
        return tex;
      }
      M.eastPlaster.map = texFrom(28, false);
      M.eastPlaster.bumpMap = texFrom(40, true);
      M.eastPlaster.bumpScale = 0.032;
      M.eastPlaster.needsUpdate = true;
    })();
    M.charcoal.roughness = 0.93; M.charDark.roughness = 0.86; M.charDark.metalness = 0.0;
    M.plinth.roughness = 0.82; M.concrete.roughness = 0.92;
    M.ms.roughness = 0.45; M.ms.metalness = 0.45;
    M.steel.roughness = 0.3; M.steel.metalness = 0.8;
    M.brass.roughness = 0.34; M.brass.metalness = 0.72;
    M.frame.roughness = 0.5; M.frame.metalness = 0.35;
    M.accentWarm.roughness = 0.72; M.accentWarm.metalness = 0.2;
    M.copingLight.roughness = 0.75;
    M.balcTile.roughness = 0.5; M.terraceF.roughness = 0.5;
    M.walnut.roughness = 0.48; M.walnut.metalness = 0.03;
    M.woodF.roughness = 0.5; M.woodD.roughness = 0.52;
    M.skirt.roughness = 0.55;
    if (M.paver) M.paver.roughness = 0.86;
    if (M.paver2) M.paver2.roughness = 0.88;
    if (M.murtiGold) { M.murtiGold.roughness = 0.32; M.murtiGold.metalness = 0.8; }
    if (M.murtiDark) { M.murtiDark.roughness = 0.55; M.murtiDark.metalness = 0.12; }
    if (M.murtiBlue) { M.murtiBlue.roughness = 0.48; M.murtiBlue.metalness = 0.15; }
    M.liftDoor.roughness = 0.26; M.liftDoor.metalness = 0.78;
    if (M.liftSteel) { M.liftSteel.roughness = 0.32; M.liftSteel.metalness = 0.78; }
    if (M.liftChrome) { M.liftChrome.roughness = 0.1; M.liftChrome.metalness = 0.95; }
    M.solar.roughness = 0.42; M.solar.metalness = 0.12;
    M.tv.roughness = 0.28;
    M.chrome.roughness = 0.58; M.chrome.metalness = 0.1;
    M.tharRed.roughness = 0.2; M.tharRed.metalness = 0.2;
    M.downlight.roughness = 0.3;
    M.nbrWin.roughness = 0.35; M.nbrWin.metalness = 0.25;
    // warm vitrified floors — slightly polished
    for (const k of ['tLiving', 'tBed', 'tBath', 'tKitch', 'tUtil', 'tCirc', 'tOffice', 'tPooja', 'tWalk', 'tOut']) {
      if (M[k]) { M[k].roughness = 0.35; M[k].metalness = 0.02; }
    }
    return M;
  }

  /* Materials that must not cast shadows (foliage speckles, ground planes,
     transparent glass). Keeping these out of the shadow map is a large
     first-frame win and avoids muddy noisy shadows. */
  const NO_SHADOW_CAST = {
    glass: 1, carGlass: 1, ground: 1, plotPad: 1, grass: 1, soil: 1,
    green: 1, green2: 1, leafDark: 1, leafLight: 1, boug: 1, ixora: 1,
    flowerPink: 1, road: 1, roadLine: 1, roadLine2: 1
  };

  /* Walk / collision — materials the player should NOT collide with.
     Walls, floors, ground, plot pad, grass, road stay solid. Portals and
     dense furniture stay walk-through so freefly→walk never traps you. */
  const NON_COLLIDE_MATERIALS = {
    // openings / portals (doors use walnut; cabinets share wood*)
    glass: 1, carGlass: 1, walnut: 1, liftDoor: 1, frame: 1,
    brass: 1, chrome: 1, curtain: 1, curtain2: 1,
    woodD: 1, woodF: 1,
    // furniture / soft goods / appliances (avoid wedge-stuck in rooms)
    fabric: 1, fabric2: 1, mattress: 1, bedding: 1, pillow: 1,
    rug: 1, counter: 1, counterTop: 1, steel: 1, dark: 1, tv: 1,
    skirt: 1, whiteG: 1, accentWarm: 1,
    // emissive fixtures (tiny, not walkable surfaces)
    lamp: 1, downlight: 1,
    // dense foliage blobs — ground/plotPad under them still catches the player
    green: 1, green2: 1, leafDark: 1, leafLight: 1,
    boug: 1, ixora: 1, flowerPink: 1, soil: 1, bark: 1, barkLight: 1,
    // paint lines only
    roadLine: 1,
    // pooja murtis / offerings (decor — walk through peeta aisle)
    murtiGold: 1, murtiDark: 1, murtiBlue: 1, saffron: 1,
    vermilion: 1, lotusPink: 1, peetaRed: 1
  };

  /* Building footprint in plan-mm (main block + upper-floor south service). */
  const FOOTPRINT = {
    x0: 0, x1: 16600, y0: 0, y1: 8870,
    upperY0: -762, northBalcY1: 9900
  };

  /* ---------------- geometry bag (merged per material) ---------------- */
  function makeBag(THREE) {
    const buckets = {};
    const tmp = { v: new THREE.Vector3(), n: new THREE.Vector3(), nm: new THREE.Matrix3() };
    const boxG = new THREE.BoxGeometry(1, 1, 1);
    const cylG = new THREE.CylinderGeometry(1, 1, 1, 14);
    const trunkG = new THREE.CylinderGeometry(0.52, 1, 1, 10);
    const sphG = new THREE.IcosahedronGeometry(1, 1);
    const sph0G = new THREE.IcosahedronGeometry(1, 0); // low-poly blob for foliage
    const coneG = new THREE.ConeGeometry(1, 1, 10);
    const canopyG = new THREE.LatheGeometry([
      new THREE.Vector2(0.05, -0.50),
      new THREE.Vector2(0.46, -0.38),
      new THREE.Vector2(0.88, -0.10),
      new THREE.Vector2(0.98, 0.12),
      new THREE.Vector2(0.76, 0.36),
      new THREE.Vector2(0.34, 0.52),
      new THREE.Vector2(0.00, 0.56)
    ], 18);
    const unitGeoms = [boxG, cylG, trunkG, sphG, sph0G, coneG, canopyG];

    function bucket(mat) {
      return buckets[mat] || (buckets[mat] = { pos: [], nor: [], uv: [], idx: [], vc: 0 });
    }
    function add(mat, geom, matrix) {
      const b = bucket(mat);
      const p = geom.attributes.position, n = geom.attributes.normal;
      tmp.nm.getNormalMatrix(matrix);
      const base = b.vc;
      // grow typed chunks less often: push numbers is still simplest for
      // unknown final size, but we avoid per-vertex object allocation.
      // World-metre UVs so a plaster map continues across window cuts.
      for (let i = 0; i < p.count; i++) {
        tmp.v.fromBufferAttribute(p, i).applyMatrix4(matrix);
        b.pos.push(tmp.v.x, tmp.v.y, tmp.v.z);
        tmp.n.fromBufferAttribute(n, i).applyMatrix3(tmp.nm).normalize();
        b.nor.push(tmp.n.x, tmp.n.y, tmp.n.z);
        b.uv.push(tmp.v.x + tmp.v.z, tmp.v.y);
      }
      if (geom.index) {
        const ix = geom.index;
        for (let i = 0; i < ix.count; i++) b.idx.push(ix.getX(i) + base);
      } else {
        for (let i = 0; i < p.count; i++) b.idx.push(i + base);
      }
      b.vc = base + p.count;
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
          sc = new THREE.Vector3(), ps = new THREE.Vector3();
    function place(mat, geom, cx, cy, cz, sx, sy, sz, rx, ry, rz) {
      e.set(rx || 0, ry || 0, rz || 0); q.setFromEuler(e);
      sc.set(sx, sy, sz); ps.set(cx, cy, cz);
      m4.compose(ps, q, sc); add(mat, geom, m4);
    }
    return {
      box: (mat, cx, cy, cz, sx, sy, sz, rx, ry, rz) => place(mat, boxG, cx, cy, cz, sx, sy, sz, rx, ry, rz),
      cyl: (mat, cx, cy, cz, r, h, rx, ry, rz) => place(mat, cylG, cx, cy, cz, r, h, r, rx, ry, rz),
      trunk: (mat, cx, cy, cz, rBot, h) => place(mat, trunkG, cx, cy, cz, rBot, h, rBot),
      sph: (mat, cx, cy, cz, r, sy) => place(mat, sphG, cx, cy, cz, r, sy || r, r),
      // irregular foliage blob: independent xyz scale + yaw; low=true uses
      // the 20-face icosahedron (cheap, for specks and distant canopies)
      blob: (mat, cx, cy, cz, sx, sy, sz, ry, low) =>
        place(mat, low ? sph0G : sphG, cx, cy, cz, sx, sy, sz, 0, ry || 0, 0),
      canopy: (mat, cx, cy, cz, rx, ry, rz, yaw) =>
        place(mat, canopyG, cx, cy, cz, rx, ry, rz, 0, yaw || 0, 0),
      cone: (mat, cx, cy, cz, r, h) => place(mat, coneG, cx, cy, cz, r, h, r),
      build: (THREE2, materials) => {
        const g = new THREE2.Group();
        for (const key of Object.keys(buckets)) {
          const b = buckets[key];
          if (!b.vc) continue;
          const geo = new THREE2.BufferGeometry();
          geo.setAttribute('position', new THREE2.Float32BufferAttribute(b.pos, 3));
          geo.setAttribute('normal', new THREE2.Float32BufferAttribute(b.nor, 3));
          geo.setAttribute('uv', new THREE2.Float32BufferAttribute(b.uv, 2));
          // Prefer compact index type when possible
          const use32 = b.vc > 65535;
          const IndexArray = use32 ? Uint32Array : Uint16Array;
          geo.setIndex(new THREE2.BufferAttribute(new IndexArray(b.idx), 1));
          // free intermediate number arrays promptly
          b.pos = null; b.nor = null; b.uv = null; b.idx = null;
          geo.computeBoundingSphere();
          geo.computeBoundingBox();
          const mesh = new THREE2.Mesh(geo, materials[key] || materials.white);
          mesh.userData.matKey = key;
          mesh.castShadow = !NO_SHADOW_CAST[key];
          mesh.receiveShadow = !(key === 'glass' || key === 'carGlass');
          if (key === 'glass' || key === 'carGlass') {
            mesh.castShadow = false;
            mesh.renderOrder = 2 + (key === 'carGlass' ? 1 : 0);
          }
          g.add(mesh);
        }
        // dispose shared unit prototypes once this bag is finished
        for (let i = 0; i < unitGeoms.length; i++) unitGeoms[i].dispose();
        return g;
      }
    };
  }

  /* plan-mm box: x,y in mm, heights in metres */
  function pb(bag, mat, x0, x1, y0, y1, h0, h1, rx, ry, rz) {
    if (x1 - x0 < 0.5 || y1 - y0 < 0.5 || h1 - h0 < 0.0005) return;
    bag.box(mat, (x0 + x1) / 2000, (h0 + h1) / 2, -(y0 + y1) / 2000,
            (x1 - x0) / 1000, h1 - h0, (y1 - y0) / 1000, rx, ry, rz);
  }

  /* wall run with openings.
     dir 'x': runs along x, b0..b1 = y thickness band
     dir 'y': runs along y, b0..b1 = x thickness band
     openings: [{c,w,sill,h}] in mm; sill/h measured above floorY (m). */
  function wallRun(bag, mat, dir, a0, a1, b0, b1, h0, h1, floorY, openings, capMat) {
    const ops = (openings || []).slice().sort((p, q) => p.c - q.c);
    const segs = []; let cur = a0;
    for (const o of ops) {
      const w0 = Math.max(a0, o.c - o.w / 2), w1 = Math.min(a1, o.c + o.w / 2);
      if (w1 <= cur + 1) continue;
      if (w0 > cur + 1) segs.push([cur, w0, h0, h1, true]);
      const bot = floorY + (o.sill || 0) / 1000;
      const top = Math.min(h1, bot + o.h / 1000);
      if (bot > h0 + 0.004) segs.push([Math.max(cur, w0), w1, h0, bot, false]);
      if (top < h1 - 0.004) segs.push([Math.max(cur, w0), w1, top, h1, true]);
      cur = Math.max(cur, w1);
    }
    if (cur < a1 - 1) segs.push([cur, a1, h0, h1, true]);
    for (const s of segs) {
      const [s0, s1, hh0, hh1, reach] = s;
      if (dir === 'x') pb(bag, mat, s0, s1, b0, b1, hh0, hh1);
      else pb(bag, mat, b0, b1, s0, s1, hh0, hh1);
      if (capMat && reach && Math.abs(hh1 - h1) < 0.003) {
        if (dir === 'x') pb(bag, capMat, s0 - 6, s1 + 6, b0 - 6, b1 + 6, h1, h1 + 0.024);
        else pb(bag, capMat, b0 - 6, b1 + 6, s0 - 6, s1 + 6, h1, h1 + 0.024);
      }
    }
  }

  /* ---------------- glazing / doors (exterior shell) ---------------- */
  /* face: 'E','W','N','S'; band=[b0,b1] wall thickness in mm */
  function glazing(bag, spec) {
    const fY = spec.floorY, b = fY + (spec.sill || 0) / 1000, t = b + spec.h / 1000;
    const a0 = spec.c - spec.w / 2, a1 = spec.c + spec.w / 2;
    const [bb0, bb1] = spec.band, mid = (bb0 + bb1) / 2;
    const horiz = (spec.face === 'N' || spec.face === 'S'); // run along x
    const outSign = (spec.face === 'E' || spec.face === 'N') ? 1 : -1;
    const put = (mat, aa0, aa1, d0, d1, hh0, hh1) => {
      if (horiz) pb(bag, mat, aa0, aa1, d0, d1, hh0, hh1);
      else pb(bag, mat, d0, d1, aa0, aa1, hh0, hh1);
    };
    const F = 62, gd0 = mid - 26, gd1 = mid - 10; // glass band
    const fd0 = mid - 52, fd1 = mid + 38;          // frame band

    if (spec.type === 'door') { // walnut pivot door
      put('frame', a0, a0 + 55, fd0, fd1, b, t);
      put('frame', a1 - 55, a1, fd0, fd1, b, t);
      put('frame', a0, a1, fd0, fd1, t - 0.055, t);
      put('walnut', a0 + 60, a1 - 60, mid - 32, mid + 28, b + 0.006, t - 0.06);
      // recessed-look panel reveals: darker strips ~10mm proud of each slab
      // face, framing two stacked rectangles (strips buried 2mm into slab)
      const rl0 = b + 0.10, rl1 = b + 1.02, ru0 = b + 1.14, ru1 = t - 0.16;
      for (const fo of [[mid - 44, mid - 30], [mid + 26, mid + 40]]) {
        for (const rr of [[rl0, rl1], [ru0, ru1]]) {
          put('woodD', a0 + 130, a0 + 170, fo[0], fo[1], rr[0], rr[1]);
          put('woodD', a1 - 170, a1 - 130, fo[0], fo[1], rr[0], rr[1]);
          put('woodD', a0 + 130, a1 - 130, fo[0], fo[1], rr[0], rr[0] + 0.04);
          put('woodD', a0 + 130, a1 - 130, fo[0], fo[1], rr[1] - 0.04, rr[1]);
        }
      }
      // brass pull bar on outer face
      const hb = outSign > 0 ? [bb1 + 8, bb1 + 48] : [bb0 - 48, bb0 - 8];
      const hx = a0 + (a1 - a0) * 0.78;
      put('brass', hx - 18, hx + 18, hb[0], hb[1], b + 0.85, b + 1.95);
      // interior-side lever handle (outer face already has the pull bar)
      const iv = outSign > 0 ? [mid - 62, mid - 31] : [mid + 31, mid + 62];
      const ia = outSign > 0 ? [mid - 62, mid - 50] : [mid + 50, mid + 62];
      put('steel', hx - 25, hx + 25, iv[0], iv[1], b + 1.02, b + 1.10);   // rosette plate
      put('steel', hx - 110, hx + 15, ia[0], ia[1], b + 1.045, b + 1.075); // lever arm
    } else if (spec.type === 'frenchdoor') { // floor-to-head glazed French door
      const nLeaf = spec.panes || 2;
      put('frame', a0, a0 + 52, fd0, fd1, b, t);
      put('frame', a1 - 52, a1, fd0, fd1, b, t);
      put('frame', a0, a1, fd0, fd1, t - 0.052, t);
      put('frame', a0, a1, fd0, fd1, b, b + 0.052);
      // Stone threshold proud of the outer face
      const th = outSign > 0 ? [bb1 - 8, bb1 + 70] : [bb0 - 70, bb0 + 8];
      put('charDark', a0 - 20, a1 + 20, th[0], th[1], b, b + 0.028);
      put('copingLight', a0 - 8, a1 + 8, th[0], th[1], b + 0.028, b + 0.040);
      const inner0 = a0 + 52, inner1 = a1 - 52;
      const leafW = (inner1 - inner0) / nLeaf;
      const lockZ = b + 1.02;
      for (let i = 1; i < nLeaf; i++) {
        const mx = inner0 + i * leafW;
        put('frame', mx - 26, mx + 26, fd0 + 2, fd1 - 2, b + 0.052, t - 0.052);
      }
      for (let i = 0; i < nLeaf; i++) {
        const l0 = inner0 + i * leafW + (i === 0 ? 0 : 26);
        const l1 = inner0 + (i + 1) * leafW - (i === nLeaf - 1 ? 0 : 26);
        put('frame', l0, l1, mid - 10, mid + 10, lockZ - 0.016, lockZ + 0.016);
        put('glass', l0 + 6, l1 - 6, gd0, gd1, b + 0.055, lockZ - 0.018);
        put('glass', l0 + 6, l1 - 6, gd0, gd1, lockZ + 0.018, t - 0.055);
      }
      const hb = outSign > 0 ? [bb1 + 8, bb1 + 40] : [bb0 - 40, bb0 - 8];
      // Operable pair is the north two leaves on a 3-leaf; else the centre meeting.
      const meet = nLeaf >= 3 ? inner0 + (nLeaf - 1) * leafW : (a0 + a1) / 2;
      put('brass', meet - 48, meet - 16, hb[0], hb[1], b + 0.92, b + 1.18);
      put('brass', meet + 16, meet + 48, hb[0], hb[1], b + 0.92, b + 1.18);
    } else if (spec.type === 'panel') { // walnut blind panel (mumty etc.)
      put('walnut', a0, a1, mid - 32, mid + 28, b, t);
    } else if (spec.type === 'grill' || spec.type === 'railing') {
      if (spec.door) {
        // Proper mild-steel security grille door: framed leaf with stiles,
        // rails, a solid kick panel, a bar grid and a lever/lock set
        const fD0 = mid - 30, fD1 = mid + 30;   // frame depth band (mm)
        const gD0 = mid - 12, gD1 = mid + 12;   // grille-bar depth band (mm)
        const i0 = a0 + 55, i1 = a1 - 55;       // leaf clear span
        // Perimeter leaf frame: hinge stile, lock stile, head + sill rails
        put('steel', a0, a0 + 55, fD0, fD1, b, t);
        put('steel', a1 - 55, a1, fD0, fD1, b, t);
        put('steel', a0, a1, fD0, fD1, t - 0.055, t);
        put('steel', a0, a1, fD0, fD1, b, b + 0.055);
        // Mid (lock) rail
        const mR = b + 1.05;
        put('steel', i0, i1, fD0, fD1, mR - 0.045, mR + 0.045);
        // Solid MS kick panel at the base
        put('ms', i0, i1, gD0 + 3, gD1 - 3, b + 0.055, b + 0.35);
        // Vertical grille bars over the glazed portion
        const ulen = i1 - i0;
        const nv = Math.max(3, Math.round(ulen / 110));
        for (let i = 1; i < nv; i++) {
          const a = i0 + (ulen * i) / nv;
          put('ms', a - 8, a + 8, gD0, gD1, b + 0.35, t - 0.055);
        }
        // Horizontal grille bars, split around the lock rail
        for (const seg of [[b + 0.35, mR - 0.045], [mR + 0.045, t - 0.055]]) {
          const hs = seg[1] - seg[0];
          const nh = Math.max(1, Math.round(hs / 0.32));
          for (let i = 1; i < nh; i++) {
            const hh = seg[0] + (hs * i) / nh;
            put('ms', i0, i1, gD0, gD1, hh - 0.008, hh + 0.008);
          }
        }
        // Butt hinges on the hinge stile
        for (const hz of [b + 0.25, b + 1.20, t - 0.25]) {
          put('steel', a0 + 8, a0 + 46, fD1, fD1 + 22, hz - 0.06, hz + 0.06);
        }
        // Lock housing + lever pulls on both faces of the lock stile
        const hx0 = i1 - 62, hx1 = i1 - 42;
        put('steel', hx0 - 40, hx1, fD0 - 6, fD1 + 6, mR - 0.085, mR + 0.085);
        put('chrome', hx0, hx1, fD1, fD1 + 45, b + 0.88, b + 1.22);
        put('chrome', hx0, hx1, fD0 - 45, fD0, b + 0.88, b + 1.22);
        put('steel', hx0, hx1, fD1, fD1 + 45, b + 0.90, b + 0.94);
        put('steel', hx0, hx1, fD1, fD1 + 45, b + 1.16, b + 1.20);
        put('steel', hx0, hx1, fD0 - 45, fD0, b + 0.90, b + 0.94);
        put('steel', hx0, hx1, fD0 - 45, fD0, b + 1.16, b + 1.20);
      } else {
        // Top rail (mild steel)
        put('ms', a0, a1, mid - 15, mid + 15, t - 0.045, t);
        // Bottom rail (mild steel)
        put('ms', a0, a1, mid - 15, mid + 15, b, b + 0.045);
        // Vertical bars (mild steel)
        const len = a1 - a0;
        const n = Math.max(2, Math.round(len / 120));
        for (let i = 0; i <= n; i++) {
          const a = a0 + (len * i) / n;
          put('ms', a - 10, a + 10, mid - 10, mid + 10, b + 0.045, t - 0.045);
        }
      }
    } else if (spec.type === 'slider') { // Sliding glass door system
      // Outer frame
      put('frame', a0, a0 + 55, fd0, fd1, b, t);
      put('frame', a1 - 55, a1, fd0, fd1, b, t);
      put('frame', a0, a1, fd0, fd1, t - 0.055, t);
      put('frame', a0, a1, fd0, fd1, b, b + 0.055);

      const panes = spec.panes || 3;
      const pW = (a1 - a0) / panes; // panel width
      
      const drawPanel = (xStart, xEnd, trackZ, hasHandle, handleSide) => {
        // Panel frame
        put('frame', xStart, xStart + 45, trackZ - 12, trackZ + 12, b + 0.02, t - 0.02);
        put('frame', xEnd - 45, xEnd, trackZ - 12, trackZ + 12, b + 0.02, t - 0.02);
        put('frame', xStart, xEnd, trackZ - 12, trackZ + 12, t - 0.065, t - 0.02);
        put('frame', xStart, xEnd, trackZ - 12, trackZ + 12, b + 0.02, b + 0.065);
        // Glass pane
        put('glass', xStart + 40, xEnd - 40, trackZ - 4, trackZ + 4, b + 0.06, t - 0.06);
        // Brass pull handle on both sides
        if (hasHandle) {
          const hX = handleSide === 'left' ? xStart + 60 : xEnd - 75;
          // Inner handle (dining room side)
          put('brass', hX, hX + 15, trackZ + 14, trackZ + 26, b + 0.95, b + 1.25);
          // Outer handle (balcony side)
          put('brass', hX, hX + 15, trackZ - 26, trackZ - 14, b + 0.95, b + 1.25);
          // Connector through glass/panel
          put('brass', hX + 4, hX + 11, trackZ - 14, trackZ + 14, b + 1.08, b + 1.12);
        }
      };

      if (panes === 3) {
        // Panel 1 (left fixed): inner track (mid - 20)
        drawPanel(a0 + 15, a0 + pW + 20, mid - 20, false);
        // Panel 2 (middle slider): outer track (mid + 20)
        drawPanel(a0 + pW - 10, a0 + 2 * pW + 10, mid + 20, true, 'left');
        // Panel 3 (right fixed): inner track (mid - 20)
        drawPanel(a0 + 2 * pW - 20, a1 - 15, mid - 20, false);
      } else if (panes === 2) {
        // Panel 1: left slider (inner track)
        drawPanel(a0 + 15, a0 + pW + 15, mid - 20, true, 'right');
        // Panel 2: right fixed (outer track)
        drawPanel(a0 + pW - 15, a1 - 15, mid + 20, false);
      } else if (panes === 4) {
        // Panel 1: left fixed (inner track)
        drawPanel(a0 + 15, a0 + pW + 20, mid - 20, false);
        // Panel 2: left-center slider (outer track)
        drawPanel(a0 + pW - 10, a0 + 2 * pW + 15, mid + 20, true, 'left');
        // Panel 3: right-center slider (outer track)
        drawPanel(a0 + 2 * pW - 15, a0 + 3 * pW + 10, mid + 20, true, 'right');
        // Panel 4: right fixed (inner track)
        drawPanel(a0 + 3 * pW - 20, a1 - 15, mid - 20, false);
      }
    } else { // window / glassdoor / fixed
      put('frame', a0, a0 + F, fd0, fd1, b, t);
      put('frame', a1 - F, a1, fd0, fd1, b, t);
      put('frame', a0, a1, fd0, fd1, t - F / 1000, t);
      put('frame', a0, a1, fd0, fd1, b, b + F / 1000);
      const panes = spec.panes != null ? spec.panes : (spec.w >= 1050 ? 2 : 1);
      if (panes === 2) put('frame', spec.c - 22, spec.c + 22, fd0 + 4, fd1 - 4, b + F / 1000, t - F / 1000);
      if (panes === 3) {
        put('frame', a0 + (a1 - a0) / 3 - 20, a0 + (a1 - a0) / 3 + 20, fd0 + 4, fd1 - 4, b + 0.06, t - 0.06);
        put('frame', a1 - (a1 - a0) / 3 - 20, a1 - (a1 - a0) / 3 + 20, fd0 + 4, fd1 - 4, b + 0.06, t - 0.06);
      }
      put('glass', a0 + 30, a1 - 30, gd0, gd1, b + 0.03, t - 0.03);
      if ((spec.sill || 0) > 250 && spec.type !== 'fixed') { // sill ledge + warm nose
        const sb = outSign > 0 ? [bb1, bb1 + 55] : [bb0 - 55, bb0];
        put('charDark', a0 - 30, a1 + 30, sb[0], sb[1], b - 0.045, b);
        put('copingLight', a0 - 20, a1 + 20, sb[0], sb[1], b - 0.01, b + 0.008);
      }
    }
    if (spec.chajja) {
      // Plain charcoal chajja (no warm surround)
      const cb = outSign > 0 ? [bb1, bb1 + 500] : [bb0 - 500, bb0];
      put('charDark', a0 - 150, a1 + 150, cb[0], cb[1], t + 0.05, t + 0.13);
      const drip = outSign > 0 ? [bb1 + 485, bb1 + 505] : [bb0 - 505, bb0 - 485];
      put('charDark', a0 - 155, a1 + 155, drip[0], drip[1], t + 0.02, t + 0.14);
    }
  }

  /* Refined balcony railing: steel uprights + stainless handrail + mid rail.
     dir 'x' along x at y=fc, dir 'y' along y at x=fc */
  function railing(bag, dir, fc, a0, a1, base, h) {
    h = h || 1.0;
    const sit = base + 0.012;
    const len = a1 - a0; if (len < 80) return;
    const n = Math.max(2, Math.round(len / 118));
    for (let i = 0; i <= n; i++) {
      const a = a0 + (len * i) / n;
      if (dir === 'x') pb(bag, 'steel', a - 9, a + 9, fc - 9, fc + 9, sit, sit + h - 0.04);
      else pb(bag, 'steel', fc - 9, fc + 9, a - 9, a + 9, sit, sit + h - 0.04);
    }
    if (dir === 'x') {
      pb(bag, 'steel', a0 - 14, a1 + 14, fc - 22, fc + 22, sit + h - 0.04, sit + h);
      pb(bag, 'chrome', a0 - 8, a1 + 8, fc - 12, fc + 12, sit + h - 0.01, sit + h + 0.012);
      pb(bag, 'steel', a0 - 10, a1 + 10, fc - 15, fc + 15, sit + 0.09, sit + 0.125);
    } else {
      pb(bag, 'steel', fc - 22, fc + 22, a0 - 14, a1 + 14, sit + h - 0.04, sit + h);
      pb(bag, 'chrome', fc - 12, fc + 12, a0 - 8, a1 + 8, sit + h - 0.01, sit + h + 0.012);
      pb(bag, 'steel', fc - 15, fc + 15, a0 - 10, a1 + 10, sit + 0.09, sit + 0.125);
    }
  }

  /** Small plaster pillar that supports a railing run (not metal base-plates).
   *  ~180 mm square, white shaft, dark plinth, light coping — matches facade. */
  function railPillar(bag, x, y, base, h) {
    h = h || 1.05;
    const sit = base + 0.012;
    const half = 90;
    pb(bag, 'white2', x - half, x + half, y - half + 16, y + half - 16, sit, sit + h - 0.04);
    pb(bag, 'white2', x - half + 16, x + half - 16, y - half, y + half, sit, sit + h - 0.04);
    pb(bag, 'charDark', x - half - 12, x + half + 12, y - half - 12, y + half + 12,
      sit + h - 0.04, sit + h + 0.02);
  }

  /** 1 m lime parapet used as a guard instead of MS rail.
   *  dir 'x' along x at y=fc, dir 'y' along y at x=fc. */
  function edgeWall(bag, dir, fc, a0, a1, base, h, opts) {
    h = h || 1.08;
    opts = opts || {};
    const sit = base + 0.012;
    const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
    if (hi - lo < 80) return;
    const half = 75;
    // Balcony walls: white cap, flush — no second gray border. Terrace
    // parapets keep the projecting charcoal coping.
    const cap = opts.plain ? 'white' : 'charDark';
    const out = opts.plain ? 0 : 14;
    if (dir === 'x') {
      pb(bag, 'white', lo, hi, fc - half, fc + half, sit, sit + h - 0.04);
      pb(bag, cap, lo - (opts.plain ? 0 : 8), hi + (opts.plain ? 0 : 8),
        fc - half - out, fc + half + out, sit + h - 0.04, sit + h + 0.02);
    } else {
      pb(bag, 'white', fc - half, fc + half, lo, hi, sit, sit + h - 0.04);
      pb(bag, cap, fc - half - out, fc + half + out,
        lo - (opts.plain ? 0 : 8), hi + (opts.plain ? 0 : 8),
        sit + h - 0.04, sit + h + 0.02);
    }
  }

  function lastBayStart(a0, a1) {
    const len = a1 - a0;
    if (len < 80) return a0;
    const nSeg = len >= 14000 ? 3 : len >= 7000 ? 2 : 1;
    return a0 + len * (nSeg - 1) / nSeg;
  }

  /** Continuous perforated MS railing — square-hole S-wave from the
   *  railing idea. dir 'x' along x at y=fc, dir 'y' along y at x=fc.
   *  opts.noEnds: skip end stiles (when plaster pillars already frame the bay). */
  function patternedRail(bag, dir, fc, a0, a1, base, h, opts) {
    h = h || 1.0;
    opts = opts || {};
    const len = a1 - a0; if (len < 80) return;
    const alongX = dir === 'x';
    const MOD = [
      '############',
      '###.....###.',
      '###.....###.',
      '#####.......',
      '#####....###',
      '..###....###',
      '..###..###..',
      '#####..###..',
      '#####.......',
      '.......#####',
      '.......#####'
    ];
    const nR = MOD.length, nC = MOD[0].length;
    const nCol = Math.max(nC, Math.round(len / 64));
    const p = len / nCol;
    const holeA = p * 0.5;
    const webA = p - holeA;
    const sit = base + 0.012;
    const top = 0.038, bot = 0.026;
    const pat0 = sit + bot, pat1 = sit + h - top;
    const pV = ((pat1 - pat0) * 1000) / nR;
    const holeV = pV * 0.5;
    const webV = pV - holeV;

    function strip(mat, aa0, aa1, z0, z1, half) {
      if (alongX) pb(bag, mat, aa0, aa1, fc - half, fc + half, z0, z1);
      else pb(bag, mat, fc - half, fc + half, aa0, aa1, z0, z1);
    }

    strip('charDark', a0 - 10, a1 + 10, sit + h - top, sit + h, 22);
    strip('ms', a0 - 4, a1 + 4, sit, pat0, 16);
    if (!opts.noEnds) {
      strip('charDark', a0 - 16, a0 + 12, sit, sit + h, 16);
      strip('charDark', a1 - 12, a1 + 16, sit, sit + h, 16);
    }

    function holeBand(r) {
      const z0 = pat0 + (r * pV + webV / 2) / 1000;
      return [z0, z0 + holeV / 1000];
    }
    for (let r = 0; r <= nR; r++) {
      const z0 = r === 0 ? pat0 : holeBand(r - 1)[1];
      const z1 = r === nR ? pat1 : holeBand(r)[0];
      if (z1 - z0 > 0.001) strip('ms', a0, a1, z0, z1, 9);
    }
    for (let r = 0; r < nR; r++) {
      const hz = holeBand(r), z0 = hz[0], z1 = hz[1];
      for (let c = 0; c <= nCol; c++) {
        const mid = a0 + c * p;
        let s0 = mid - webA / 2, s1 = mid + webA / 2;
        if (c === 0) s0 = a0;
        if (c === nCol) s1 = a1;
        if (s1 > s0 + 0.5) strip('ms', s0, s1, z0, z1, 9);
      }
      for (let c = 0; c < nCol; c++) {
        if (MOD[r][c % nC] !== '.') continue;
        const s0 = a0 + c * p + webA / 2;
        strip('ms', s0, s0 + holeA, z0, z1, 9);
      }
    }
  }

  /** Reference-house balustrade: clear panes standing on discrete black
   *  spigots, a slim dark post at every panel joint and one continuous
   *  dark cap. The old version ran a solid charcoal shoe the whole way,
   *  which reads as a dark plinth with glass on top — the reference detail
   *  is the opposite, a floating pane with the deck edge visible under it.
   *  dir 'x' along x at y=fc, dir 'y' along y at x=fc. */
  function glassRail(bag, dir, fc, a0, a1, base, h) {
    h = h || 1.05;
    const sit = base + 0.012;
    const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
    const len = hi - lo;
    if (len < 200) return;
    function strip(mat, aa0, aa1, z0, z1, half) {
      if (dir === 'x') pb(bag, mat, aa0, aa1, fc - half, fc + half, z0, z1);
      else pb(bag, mat, fc - half, fc + half, aa0, aa1, z0, z1);
    }
    const POST = 38, PH = 19;
    const gz0 = sit + 0.085;          // pane floats clear of the deck
    const gz1 = sit + h - 0.046;      // pane head, under the cap
    const nP = Math.max(1, Math.round(len / 1400));
    const pw = len / nP;

    // One continuous cap — the single dark line the elevation reads.
    strip('frame', lo - 12, hi + 12, gz1, sit + h, 26);

    for (let i = 0; i <= nP; i++) {
      const a = lo + pw * i;
      let s0 = a - PH, s1 = a + PH;
      if (i === 0) { s0 = lo; s1 = lo + POST; }
      if (i === nP) { s0 = hi - POST; s1 = hi; }
      strip('frame', s0, s1, sit, gz1 + 0.004, 22);
    }
    for (let i = 0; i < nP; i++) {
      const p0 = lo + pw * i + (i === 0 ? POST : PH);
      const p1 = lo + pw * (i + 1) - (i === nP - 1 ? POST : PH);
      if (p1 - p0 < 60) continue;
      strip('glass', p0 + 4, p1 - 4, gz0, gz1, 8);
      for (let k = 1; k <= 2; k++) {
        const c = p0 + ((p1 - p0) * k) / 3;
        strip('frame', c - 62, c + 62, sit, sit + 0.195, 26);
      }
    }
  }


  /** East terrace parapet as a wall with one long slit — ventilation,
   *  not a pattern. Coping stays charcoal. */
  function patternedParapet(bag, xIn, xOut, y0, y1, base, h) {
    const sit = base + 0.012;
    const back = xOut - 48;
    const face = xOut + 2;
    const inset = 280;
    const sl0 = base + 0.36, sl1 = base + 0.62;
    pb(bag, 'white', xIn, back, y0, y1, sit, base + h);
    pb(bag, 'charDark', xIn - 18, xOut + 18, y0 - 14, y1 + 14,
      base + h - 0.04, base + h + 0.03);
    pb(bag, 'white', back, face, y0, y0 + inset, sit, base + h);
    pb(bag, 'white', back, face, y1 - inset, y1, sit, base + h);
    pb(bag, 'white', back, face, y0 + inset, y1 - inset, sit, sl0);
    pb(bag, 'white', back, face, y0 + inset, y1 - inset, sl1, base + h);
    pb(bag, 'charDark', face - 2, face + 4, y0 + inset - 10, y1 - inset + 10,
      sl0 - 0.008, sl0);
    pb(bag, 'charDark', face - 2, face + 4, y0 + inset - 10, y1 - inset + 10,
      sl1, sl1 + 0.008);
  }

  /** Place pillars along a railing line — sparse (AP residential).
   *  Ends always; one mid if span ≳ 7 m; two mids only if ≳ 14 m.
   *  omit: { start, mid, end } skips a0 / intermediates / a1. */
  function railPillarsAlong(bag, dir, fc, a0, a1, base, h, omit) {
    const len = a1 - a0; if (len < 80) return;
    let nSeg = 1; // ends only → 2 pillars
    if (len >= 14000) nSeg = 3;      // ends + 2 mids
    else if (len >= 7000) nSeg = 2;  // ends + 1 mid
    omit = omit || {};
    for (let i = 0; i <= nSeg; i++) {
      if (i === 0 && omit.start) continue;
      if (i === nSeg && omit.end) continue;
      if (i > 0 && i < nSeg && omit.mid) continue;
      const a = a0 + (len * i) / nSeg;
      if (dir === 'x') railPillar(bag, a, fc, base, h);
      else railPillar(bag, fc, a, base, h);
    }
  }

  /* stair flight: n step boxes; dir 'x'|'y'; sign +1/-1 run direction.
     Optional finish = { tread, riser } for wood/paint cladding over structure. */
  function flight(bag, mat, dir, f0, f1, startA, sign, tread, n, baseH, rise, finish) {
    const treadT = finish ? 0.042 : 0;
    const treadMat = finish && finish.tread ? finish.tread : mat;
    const riserMat = finish && finish.riser ? finish.riser : mat;
    for (let i = 1; i <= n; i++) {
      const top = baseH + i * rise;
      const aA = startA + sign * (i - 1) * tread, aB = aA + sign * tread;
      const lo = Math.min(aA, aB), hi = Math.max(aA, aB);
      const bot = top - 0.32;
      if (dir === 'y') {
        pb(bag, mat, f0, f1, lo, hi, bot, top - treadT);
        if (finish) {
          // wood tread with slight nosing past the riser
          const nLo = sign > 0 ? lo : lo - 14;
          const nHi = sign > 0 ? hi + 14 : hi;
          pb(bag, treadMat, f0 + 8, f1 - 8, nLo, nHi, top - treadT, top);
          // painted riser face
          if (sign > 0) pb(bag, riserMat, f0 + 12, f1 - 12, lo, lo + 12, top - rise, top - treadT);
          else pb(bag, riserMat, f0 + 12, f1 - 12, hi - 12, hi, top - rise, top - treadT);
        }
      } else {
        pb(bag, mat, lo, hi, f0, f1, bot, top - treadT);
        if (finish) {
          const nLo = sign > 0 ? lo : lo - 14;
          const nHi = sign > 0 ? hi + 14 : hi;
          pb(bag, treadMat, nLo, nHi, f0 + 8, f1 - 8, top - treadT, top);
          if (sign > 0) pb(bag, riserMat, lo, lo + 12, f0 + 12, f1 - 12, top - rise, top - treadT);
          else pb(bag, riserMat, hi - 12, hi, f0 + 12, f1 - 12, top - rise, top - treadT);
        }
      }
    }
  }

  /* Landing slab with optional wood floor finish on top */
  function stairLanding(bag, x0, x1, y0, y1, top, finish) {
    const treadT = finish ? 0.04 : 0;
    pb(bag, 'concrete', x0, x1, y0, y1, top - 0.32, top - treadT);
    if (finish) pb(bag, finish, x0 + 10, x1 - 10, y0 + 10, y1 - 10, top - treadT, top);
  }

  /* slab plate with optional rectangular hole */
  function plate(bag, mat, X0, X1, Y0, Y1, hole, h0, h1) {
    if (!hole) { pb(bag, mat, X0, X1, Y0, Y1, h0, h1); return; }
    const [hx0, hx1, hy0, hy1] = hole;
    if (hy0 > Y0) pb(bag, mat, X0, X1, Y0, hy0, h0, h1);
    if (hy1 < Y1) pb(bag, mat, X0, X1, hy1, Y1, h0, h1);
    if (hx0 > X0) pb(bag, mat, X0, hx0, Math.max(Y0, hy0), Math.min(Y1, hy1), h0, h1);
    if (hx1 < X1) pb(bag, mat, hx1, X1, Math.max(Y0, hy0), Math.min(Y1, hy1), h0, h1);
  }

  /* ---------------- deterministic tiny PRNG (stable rebuilds) ---------------- */
  function rng(seed) {
    let s = (Math.abs(Math.round(seed)) % 2147483646) + 1;
    return () => { s = (s * 48271) % 2147483647; return (s & 0xffff) / 0x10000; };
  }

  /* Fallback shrub / tree — used only if photoreal sprites fail to load.
     Shrub: low mound, no trunk. Tree: tapered trunk + umbrella canopy, no sticks.
     x,y plan-mm. Shrub r = mound radius (m). Tree height = total metres. */
  function plantShrub(bag, x, y, r, col, base) {
    const rnd = rng(x * 3 + y * 17 + r * 997);
    const cx = x / 1000, cz = -y / 1000;
    base = base === undefined ? 0.04 : base;
    const flowering = (col === 'boug' || col === 'ixora');
    bag.cyl('soil', cx, base + 0.01, cz, r * 0.90, 0.03);
    const greens = ['leafDark', 'green', 'green2'];
    const nB = 4 + Math.round(rnd() * 2);
    for (let i = 0; i < nB; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = rnd() * r * 0.38;
      const s = r * (0.48 + rnd() * 0.28);
      bag.blob(greens[i % 3],
        cx + Math.cos(a) * rad, base + s * 0.40 + rnd() * r * 0.08, cz + Math.sin(a) * rad,
        s * (0.95 + rnd() * 0.25), s * 0.52, s * (0.95 + rnd() * 0.25), rnd() * Math.PI, true);
    }
    if (flowering) {
      const fm = col === 'boug' ? ['boug', 'flowerPink'] : ['ixora', 'flowerPink'];
      const nF = 8 + Math.round(rnd() * 6);
      for (let i = 0; i < nF; i++) {
        const a = rnd() * Math.PI * 2;
        const fr = 0.028 + rnd() * 0.014;
        bag.blob(fm[i % 2],
          cx + Math.cos(a) * r * 0.55, base + r * 0.38 + rnd() * r * 0.28, cz + Math.sin(a) * r * 0.55,
          fr, 0.026, fr, rnd() * Math.PI, true);
      }
    }
  }

  function plantTree(bag, x, y, height, opts) {
    opts = opts || {};
    const low = !!opts.low;
    const rnd = rng(x * 7 + y * 13 + height * 1013);
    const cx = x / 1000, cz = -y / 1000;
    const base = opts.base === undefined ? 0.04 : opts.base;
    const H = height || 3.6;
    const tH = H * 0.34;
    const crownR = H * 0.40;
    const crownH = H * 0.72;
    const yaw = rnd() * Math.PI * 2;
    bag.trunk('bark', cx, base + tH * 0.48, cz, H * 0.034, tH);
    bag.cyl('bark', cx, base + tH * 0.92, cz, H * 0.020, tH * 0.28);
    const cyC = base + tH + crownH * 0.18;
    bag.canopy('leafDark', cx, cyC, cz, crownR, crownH, crownR * 0.92, yaw);
    bag.canopy('green', cx + crownR * 0.10, cyC + crownH * 0.06, cz - crownR * 0.08,
      crownR * 0.72, crownH * 0.62, crownR * 0.68, yaw + 0.7);
    if (!low) {
      bag.canopy('leafLight', cx - crownR * 0.06, cyC + crownH * 0.16, cz + crownR * 0.05,
        crownR * 0.48, crownH * 0.42, crownR * 0.46, yaw + 1.4);
    }
    if (opts.flowering) {
      const nF = 6 + Math.round(rnd() * 4);
      for (let i = 0; i < nF; i++) {
        const a = rnd() * Math.PI * 2;
        const fm = ['boug', 'flowerPink', 'ixora'][Math.round(rnd() * 2)];
        bag.blob(fm,
          cx + Math.cos(a) * crownR * 0.62, cyC + (rnd() - 0.2) * crownH * 0.35, cz + Math.sin(a) * crownR * 0.62,
          0.05, 0.04, 0.05, a, true);
      }
    }
  }

  /* Backdrop neighbour house: simple plaster mass with parapet, slab bands.
     NOTHING CALLS THIS ANY MORE — the owner asked for the neighbouring
     buildings to come off, so contextBits() no longer places any. It is kept
     (along with the nbr1/nbr2/nbr3 palette keys) because putting the site
     context back is then three lines rather than a rewrite.
     and recessed-look dark windows. cx,cy plan-mm; w,d footprint mm;
     yaw radians (slight orientation variety). face: 'W'|'S'|'N' = which
     local side carries the openings (toward the plot). */
  function nbrHouse(bag, cxmm, cymm, wmm, dmm, storeys, wallMat, yaw, face) {
    const CX = cxmm / 1000, CZ = -cymm / 1000, W = wmm / 1000, D = dmm / 1000;
    const cosT = Math.cos(yaw), sinT = Math.sin(yaw);
    // local (lx,lz) metres -> world, rotated about the house centre
    const part = (mat, lx, lz, sx, sz, y0, y1) => {
      const wx = CX + lx * cosT + lz * sinT;
      const wz = CZ - lx * sinT + lz * cosT;
      bag.box(mat, wx, (y0 + y1) / 2, wz, sx, y1 - y0, sz, 0, yaw, 0);
    };
    const H = 0.45 + storeys * 3.05;
    part(wallMat, 0, 0, W, D, 0, H);                                    // main mass
    // parapet lip, 60mm proud of each face
    part(wallMat, 0, -D / 2, W + 0.12, 0.12, H, H + 0.75);
    part(wallMat, 0,  D / 2, W + 0.12, 0.12, H, H + 0.75);
    part(wallMat, -W / 2, 0, 0.12, D + 0.12, H, H + 0.75);
    part(wallMat,  W / 2, 0, 0.12, D + 0.12, H, H + 0.75);
    // slab bands at each floor line (60mm proud all round)
    for (let s = 1; s < storeys; s++) {
      const fy = 0.45 + s * 3.05;
      part('concrete', 0, 0, W + 0.12, D + 0.12, fy - 0.14, fy);
    }
    part('concrete', 0, 0, W + 0.10, D + 0.10, H - 0.02, H + 0.02);     // roof band
    // openings on the plot-facing side: dark panes 8mm proud of the wall,
    // framed by 45mm-proud surrounds -> panes read ~37mm recessed
    const alongX = (face === 'S' || face === 'N');                       // face normal along z
    const sideSign = face === 'W' ? -1 : (face === 'S' ? 1 : -1);        // -x | +z | -z
    const span = alongX ? W : D;
    const put = (mat, u0, u1, off0, off1, y0, y1) => {
      const uC = (u0 + u1) / 2, uS = u1 - u0, oC = sideSign * ((alongX ? D : W) / 2 + (off0 + off1) / 2), oS = off1 - off0;
      if (alongX) part(mat, uC, oC, uS, oS, y0, y1);
      else part(mat, oC, uC, oS, uS, y0, y1);
    };
    const winAt = (u, fy, ww, wh) => {
      const fT = 0.10;
      put('nbrWin', u - ww / 2, u + ww / 2, 0.0, 0.008, fy + 0.9, fy + 0.9 + wh);
      put('concrete', u - ww / 2 - fT, u - ww / 2, 0, 0.045, fy + 0.9 - fT, fy + 0.9 + wh + fT);
      put('concrete', u + ww / 2, u + ww / 2 + fT, 0, 0.045, fy + 0.9 - fT, fy + 0.9 + wh + fT);
      put('concrete', u - ww / 2, u + ww / 2, 0, 0.045, fy + 0.9 + wh, fy + 0.9 + wh + fT);
      put('concrete', u - ww / 2, u + ww / 2, 0, 0.045, fy + 0.9 - fT, fy + 0.9);
    };
    const nW = span > 9 ? 3 : 2;
    for (let s = 0; s < storeys; s++) {
      const fy = 0.45 + s * 3.05;
      for (let i = 0; i < nW; i++) {
        const u = -span / 2 + ((i + 0.5) * span) / nW;
        if (s === 0 && i === nW - 1) {                                   // ground: last bay = door
          put('nbrWin', u - 0.5, u + 0.5, 0.0, 0.008, 0.45, 2.55);
          put('concrete', u - 0.6, u - 0.5, 0, 0.045, 0.45, 2.65);
          put('concrete', u + 0.5, u + 0.6, 0, 0.045, 0.45, 2.65);
          put('concrete', u - 0.6, u + 0.6, 0, 0.045, 2.55, 2.65);
        } else {
          winAt(u, fy, Math.min(1.5, span / nW - 0.9), 1.2);
        }
      }
    }
  }

  /* ============ outdoor furniture only (elevation studies) ============ */
  const Fur = {
    table(bag, x0, x1, y0, y1, fY, h, mat) {
      h = h || 0.72;
      const topMat = mat || 'woodF';
      const coffee = h < 0.55;
      // Top plate with slight overhang + edge band
      pb(bag, topMat, x0 - 8, x1 + 8, y0 - 8, y1 + 8, fY + h - 0.028, fY + h);
      pb(bag, 'woodD', x0 - 10, x1 + 10, y0 - 10, y1 + 10, fY + h - 0.04, fY + h - 0.028);
      // Apron
      pb(bag, 'woodD', x0 + 45, x1 - 45, y0 + 45, y1 - 45, fY + h - 0.10, fY + h - 0.04);

      const lh = h - 0.10;
      const r = coffee ? 0.022 : 0.032;
      const legMat = coffee ? 'steel' : 'woodD';
      const inset = coffee ? 70 : 100;
      const legs = [
        [x0 + inset, y0 + inset],
        [x1 - inset, y0 + inset],
        [x0 + inset, y1 - inset],
        [x1 - inset, y1 - inset]
      ];
      for (const [lx, ly] of legs) {
        bag.cyl(legMat, lx / 1000, fY + lh / 2, -ly / 1000, r, lh);
        if (coffee) bag.cyl('chrome', lx / 1000, fY + 0.012, -ly / 1000, r + 0.008, 0.02);
      }
      // Coffee tables get a subtle centre tray / glass feel
      if (coffee) {
        pb(bag, 'glass', x0 + 80, x1 - 80, y0 + 80, y1 - 80, fY + h - 0.006, fY + h + 0.002);
      }
    },
    planter(bag, cx, cy, fY, s) {
      s = s || 1;
      const z = fY + 0.012;
      bag.cyl('charDark', cx / 1000, z + 0.20 * s, -cy / 1000, 0.16 * s, 0.40 * s);
      bag.cyl('charcoal', cx / 1000, z + 0.06 * s, -cy / 1000, 0.13 * s, 0.05 * s);
      bag.cyl('charcoal', cx / 1000, z + 0.41 * s, -cy / 1000, 0.18 * s, 0.03 * s);
      bag.cyl('bark', cx / 1000, z + 0.40 * s, -cy / 1000, 0.14 * s, 0.02 * s);
      bag.sph('leafDark', cx / 1000, z + 0.64 * s, -cy / 1000, 0.18 * s, 0.14 * s);
      bag.sph('green', (cx + 36 * s) / 1000, z + 0.72 * s, -(cy - 18 * s) / 1000, 0.13 * s, 0.11 * s);
      bag.sph('green2', (cx - 32 * s) / 1000, z + 0.70 * s, -(cy + 26 * s) / 1000, 0.12 * s, 0.10 * s);
    },
    lounger(bag, x0, x1, y0, y1, fY) {
      // Premium outdoor chaise: wood frame, steel legs, cushioned seat + reclined back
      const W = x1 - x0;
      for (const [lx, ly] of [[x0 + 40, y0 + 40], [x1 - 40, y0 + 40], [x0 + 40, y1 - 40], [x1 - 40, y1 - 40]]) {
        bag.cyl('steel', lx / 1000, fY + 0.09, -ly / 1000, 0.018, 0.18);
      }
      pb(bag, 'woodF', x0 + 15, x1 - 15, y0 + 15, y1 - 15, fY + 0.16, fY + 0.28);
      pb(bag, 'woodD', x0 + 10, x1 - 10, y0 + 10, y1 - 10, fY + 0.28, fY + 0.32);
      // Seat cushion
      pb(bag, 'fabric', x0 + 30, x0 + W * 0.58, y0 + 30, y1 - 30, fY + 0.32, fY + 0.42);
      // Reclined backrest cushion
      pb(bag, 'fabric2', x0 + W * 0.55, x1 - 25, y0 + 30, y1 - 30, fY + 0.35, fY + 0.78, 0, 0, -0.35);
      // Head pillow
      pb(bag, 'curtain', x0 + W * 0.72, x1 - 40, y0 + 50, y1 - 50, fY + 0.70, fY + 0.82);
      // Side arm rails
      pb(bag, 'woodF', x0 + 20, x1 - 20, y0 + 8, y0 + 28, fY + 0.32, fY + 0.48);
      pb(bag, 'woodF', x0 + 20, x1 - 20, y1 - 28, y1 - 8, fY + 0.32, fY + 0.48);
    },
    car(bag, cx, cy, fY) {
      // 1. Wheels & Rims (Mahindra Thar large off-road wheels with spokes & central hub cap)
      const wheelR = 360, wheelW = 250, wheelH = fY + 0.36;
      for (const wx of [cx - 1100, cx + 1100]) {
        for (const wy of [cy - 950, cy + 950]) {
          // Black outer tires
          bag.cyl('carDark', wx / 1000, wheelH, -wy / 1000, wheelR / 1000, wheelW / 1000, Math.PI / 2, 0, 0);
          // Steel/Chrome styling rims
          bag.cyl('steel', wx / 1000, wheelH, -(wy + (wy > cy ? 5 : -5)) / 1000, 220 / 1000, 260 / 1000, Math.PI / 2, 0, 0);
          // Central chrome hubcap
          bag.cyl('chrome', wx / 1000, wheelH, -(wy + (wy > cy ? 132 : -132)) / 1000, 60 / 1000, 30 / 1000, Math.PI / 2, 0, 0);
          
          // 5-spoke alloy design
          const angles = [0, 72, 144, 216, 288];
          for (const angle of angles) {
            bag.cyl('steel', wx / 1000, wheelH, -wy / 1000, 0.015, 0.38, Math.PI / 2, 0, angle * Math.PI / 180);
          }
        }
      }

      // 2. Chassis underbody
      pb(bag, 'dark', cx - 1800, cx + 1800, cy - 800, cy + 800, fY + 0.32, fY + 0.48);

      // 3. Exposed Off-road Bumpers, skid plates & tow hooks
      pb(bag, 'dark', cx + 1950, cx + 2100, cy - 920, cy + 920, fY + 0.25, fY + 0.55); // Front bumper base
      pb(bag, 'steel', cx + 1940, cx + 2080, cy - 500, cy + 500, fY + 0.20, fY + 0.25); // Front silver skid plate
      // Round fog lamps in front bumper
      bag.cyl('lamp', (cx + 2085) / 1000, fY + 0.40, -(cy - 650) / 1000, 0.04, 0.02, 0, Math.PI / 2, 0);
      bag.cyl('lamp', (cx + 2085) / 1000, fY + 0.40, -(cy + 650) / 1000, 0.04, 0.02, 0, Math.PI / 2, 0);
      bag.cyl('chrome', (cx + 2082) / 1000, fY + 0.40, -(cy - 650) / 1000, 0.046, 0.015, 0, Math.PI / 2, 0);
      bag.cyl('chrome', (cx + 2082) / 1000, fY + 0.40, -(cy + 650) / 1000, 0.046, 0.015, 0, Math.PI / 2, 0);
      // Front bumper red tow hooks
      pb(bag, 'tharRed', cx + 2090, cx + 2130, cy - 350, cy - 310, fY + 0.32, fY + 0.36);
      pb(bag, 'tharRed', cx + 2090, cx + 2130, cy + 310, cy + 350, fY + 0.32, fY + 0.36);
      
      pb(bag, 'dark', cx - 2100, cx - 2000, cy - 920, cy + 920, fY + 0.28, fY + 0.52); // Rear bumper

      // 4. Exposed Napoli Black Wheel Fenders/Arches
      for (const wx of [[cx + 700, cx + 1500], [cx - 1500, cx - 700]]) {
        pb(bag, 'dark', wx[0], wx[1], cy - 980, cy - 820, fY + 0.36, fY + 0.85); // Left
        pb(bag, 'dark', wx[0], wx[1], cy + 820, cy + 980, fY + 0.36, fY + 0.85); // Right
      }

      // 5. Side Steps (Running Boards)
      pb(bag, 'dark', cx - 700, cx + 700, cy - 960, cy - 840, fY + 0.25, fY + 0.32);
      pb(bag, 'dark', cx - 700, cx + 700, cy + 840, cy + 960, fY + 0.25, fY + 0.32);

      // 6. Body Tub & Bonnet (Rage Red)
      pb(bag, 'tharRed', cx - 1980, cx + 1950, cy - 880, cy + 880, fY + 0.48, fY + 1.05); // Body tub
      pb(bag, 'tharRed', cx + 800, cx + 1920, cy - 800, cy + 800, fY + 1.05, fY + 1.22); // Bonnet/Hood
      // Raised center bulge decal on Bonnet
      pb(bag, 'dark', cx + 1000, cx + 1750, cy - 350, cy + 350, fY + 1.22, fY + 1.24);
      // 7-Slot Grille
      pb(bag, 'dark', cx + 1920, cx + 1950, cy - 800, cy + 800, fY + 0.55, fY + 1.05);   // Grille base
      const grilleY = [-750, -530, -310, -90, 90, 310, 530, 750];
      grilleY.forEach(gy => {
        pb(bag, 'tharRed', cx + 1948, cx + 1952, cy + gy - 20, cy + gy + 20, fY + 0.55, fY + 1.05);
      });

      // 7. Projector Headlights & Turn Indicators
      bag.cyl('lamp', (cx + 1948) / 1000, fY + 0.88, -(cy - 500) / 1000, 0.07, 0.01, 0, Math.PI / 2, 0);
      bag.cyl('lamp', (cx + 1948) / 1000, fY + 0.88, -(cy + 500) / 1000, 0.07, 0.01, 0, Math.PI / 2, 0);
      bag.cyl('chrome', (cx + 1945) / 1000, fY + 0.88, -(cy - 500) / 1000, 0.082, 0.012, 0, Math.PI / 2, 0);
      bag.cyl('chrome', (cx + 1945) / 1000, fY + 0.88, -(cy + 500) / 1000, 0.082, 0.012, 0, Math.PI / 2, 0);
      bag.cyl('dark', (cx + 1949) / 1000, fY + 0.88, -(cy - 500) / 1000, 0.024, 0.015, 0, Math.PI / 2, 0);
      bag.cyl('dark', (cx + 1949) / 1000, fY + 0.88, -(cy + 500) / 1000, 0.024, 0.015, 0, Math.PI / 2, 0);

      pb(bag, 'lamp', cx + 1800, cx + 1920, cy - 890, cy - 870, fY + 1.06, fY + 1.12); // Fender DRL left
      pb(bag, 'lamp', cx + 1800, cx + 1920, cy + 870, cy + 890, fY + 1.06, fY + 1.12); // Fender DRL right

      // 8. Hollow Black Cabin Structure (Roof + Pillars)
      // Roof slab
      pb(bag, 'dark', cx - 1950, cx + 800, cy - 850, cy + 850, fY + 1.78, fY + 1.82);
      // Left A-pillar
      pb(bag, 'dark', cx + 700, cx + 800, cy - 850, cy - 800, fY + 1.05, fY + 1.78);
      // Right A-pillar
      pb(bag, 'dark', cx + 700, cx + 800, cy + 800, cy + 850, fY + 1.05, fY + 1.78);
      // Left B-pillar (middle B-post)
      pb(bag, 'dark', cx, cx + 100, cy - 860, cy - 830, fY + 1.05, fY + 1.78);
      // Right B-pillar (middle B-post)
      pb(bag, 'dark', cx, cx + 100, cy + 830, cy + 860, fY + 1.05, fY + 1.78);
      // Left C-pillar (rear corner)
      pb(bag, 'dark', cx - 1980, cx - 1880, cy - 860, cy - 800, fY + 1.05, fY + 1.78);
      // Right C-pillar (rear corner)
      pb(bag, 'dark', cx - 1980, cx - 1880, cy + 800, cy + 860, fY + 1.05, fY + 1.78);

      // 9. Detailed Interior (visible through windows)
      // Dashboard
      pb(bag, 'charcoal', cx + 600, cx + 800, cy - 780, cy + 780, fY + 1.05, fY + 1.25);
      // Steering Wheel
      bag.cyl('dark', (cx + 580) / 1000, fY + 1.28, -(cy - 350) / 1000, 0.16, 0.02, Math.PI / 6, 0, 0);
      bag.cyl('steel', (cx + 640) / 1000, fY + 1.20, -(cy - 350) / 1000, 0.02, 0.15, Math.PI / 6, 0, 0);
      // Front Seats (Left & Right bucket seats)
      pb(bag, 'dark', cx - 100, cx + 300, cy - 650, cy - 150, fY + 0.60, fY + 0.85); // Left bottom
      pb(bag, 'dark', cx - 100, cx, cy - 630, cy - 170, fY + 0.85, fY + 1.45);        // Left backrest
      pb(bag, 'dark', cx - 80, cx - 20, cy - 480, cy - 320, fY + 1.45, fY + 1.62);    // Left headrest
      
      pb(bag, 'dark', cx - 100, cx + 300, cy + 150, cy + 650, fY + 0.60, fY + 0.85); // Right bottom
      pb(bag, 'dark', cx - 100, cx, cy + 170, cy + 630, fY + 0.85, fY + 1.45);        // Right backrest
      pb(bag, 'dark', cx - 80, cx - 20, cy + 320, cy + 480, fY + 1.45, fY + 1.62);    // Right headrest
      // Rear Bench Seat
      pb(bag, 'dark', cx - 1300, cx - 800, cy - 650, cy + 650, fY + 0.60, fY + 0.85); // Rear bottom
      pb(bag, 'dark', cx - 1300, cx - 1200, cy - 630, cy + 630, fY + 0.85, fY + 1.45); // Rear backrest
      pb(bag, 'dark', cx - 1280, cx - 1220, cy - 450, cy - 300, fY + 1.45, fY + 1.60); // Rear headrest Left
      pb(bag, 'dark', cx - 1280, cx - 1220, cy + 300, cy + 450, fY + 1.45, fY + 1.60); // Rear headrest Right

      // 10. Cabin Windshield & Side Windows (transparent glass mesh)
      pb(bag, 'carGlass', cx + 720, cx + 740, cy - 780, cy + 780, fY + 1.25, fY + 1.76); // Front windshield
      pb(bag, 'carGlass', cx + 0, cx + 600, cy - 865, cy - 855, fY + 1.25, fY + 1.72);   // Left door window
      pb(bag, 'carGlass', cx - 1600, cx - 100, cy - 865, cy - 855, fY + 1.25, fY + 1.72); // Left rear window
      pb(bag, 'carGlass', cx + 0, cx + 600, cy + 855, cy + 865, fY + 1.25, fY + 1.72);   // Right door window
      pb(bag, 'carGlass', cx - 1600, cx - 100, cy + 855, cy + 865, fY + 1.25, fY + 1.72); // Right rear window
      pb(bag, 'carGlass', cx - 1985, cx - 1975, cy - 650, cy + 650, fY + 1.25, fY + 1.70); // Rear windshield

      // 11. Windshield Wipers
      pb(bag, 'charcoal', cx + 740, cx + 1150, cy - 500, cy - 480, fY + 1.10, fY + 1.12, 0, 0, -Math.PI / 12);
      pb(bag, 'charcoal', cx + 740, cx + 1150, cy + 100, cy + 120, fY + 1.10, fY + 1.12, 0, 0, -Math.PI / 12);

      // 12. Tailgate-mounted Spare Wheel with Mount Bracket
      pb(bag, 'dark', cx - 2040, cx - 1980, cy - 300, cy + 300, fY + 0.90, fY + 1.20); // Mount bracket
      bag.cyl('carDark', (cx - 2120) / 1000, fY + 1.05, -cy / 1000, wheelR / 1000, 220 / 1000, 0, 0, Math.PI / 2);
      bag.cyl('steel', (cx - 2130) / 1000, fY + 1.05, -cy / 1000, 220 / 1000, 230 / 1000, 0, 0, Math.PI / 2);
      bag.cyl('chrome', (cx - 2133) / 1000, fY + 1.05, -cy / 1000, 60 / 1000, 30 / 1000, Math.PI / 2, 0, 0); // hubcap
      for (const angle of [0, 72, 144, 216, 288]) {
        bag.cyl('steel', (cx - 2120) / 1000, fY + 1.05, -cy / 1000, 0.015, 0.38, Math.PI / 2, 0, angle * Math.PI / 180);
      }

      // 13. Exterior Detailing (Side Mirrors, Door Panel lines, Handles, Fuel Lid, Hinges)
      // ORVMs (Side Mirrors) with reflective face
      pb(bag, 'dark', cx + 750, cx + 870, cy - 1050, cy - 850, fY + 1.25, fY + 1.40); // Left housing
      pb(bag, 'chrome', cx + 760, cx + 770, cy - 1030, cy - 870, fY + 1.27, fY + 1.38); // Left glass reflective face
      pb(bag, 'dark', cx + 750, cx + 870, cy + 850, cy + 1050, fY + 1.25, fY + 1.40); // Right housing
      pb(bag, 'chrome', cx + 760, cx + 770, cy + 870, cy + 1030, fY + 1.27, fY + 1.38); // Right glass reflective face
      // Door vertical panel lines (left & right)
      pb(bag, 'dark', cx + 600, cx + 604, cy - 882, cy - 878, fY + 0.48, fY + 1.05);
      pb(bag, 'dark', cx - 200, cx - 196, cy - 882, cy - 878, fY + 0.48, fY + 1.05);
      pb(bag, 'dark', cx + 600, cx + 604, cy + 878, cy + 882, fY + 0.48, fY + 1.05);
      pb(bag, 'dark', cx - 200, cx - 196, cy + 878, cy + 882, fY + 0.48, fY + 1.05);
      // Hood line gap
      pb(bag, 'dark', cx + 796, cx + 804, cy - 800, cy + 800, fY + 1.05, fY + 1.07);
      // Chrome door handles
      pb(bag, 'chrome', cx + 200, cx + 350, cy - 892, cy - 874, fY + 0.96, fY + 1.00);
      pb(bag, 'chrome', cx + 200, cx + 350, cy + 874, cy + 892, fY + 0.96, fY + 1.00);
      // Fuel cap cover
      pb(bag, 'dark', cx - 1200, cx - 1050, cy - 882, cy - 878, fY + 0.85, fY + 0.97);
      // Rugged hinges
      pb(bag, 'dark', cx + 580, cx + 620, cy - 884, cy - 872, fY + 0.58, fY + 0.64); // Front hinge left
      pb(bag, 'dark', cx - 180, cx - 140, cy - 884, cy - 872, fY + 0.58, fY + 0.64); // Rear hinge left
      pb(bag, 'dark', cx + 580, cx + 620, cy + 872, cy + 884, fY + 0.58, fY + 0.64); // Front hinge right
      pb(bag, 'dark', cx - 180, cx - 140, cy + 872, cy + 884, fY + 0.58, fY + 0.64); // Rear hinge right

      // 14. 3-Element LED Tail Lights
      // Left tail light base and elements
      pb(bag, 'dark', cx - 1990, cx - 1970, cy - 830, cy - 710, fY + 0.84, fY + 1.06);
      pb(bag, 'boug', cx - 1992, cx - 1972, cy - 820, cy - 790, fY + 0.86, fY + 1.04);     // red tail
      pb(bag, 'ixora', cx - 1992, cx - 1972, cy - 785, cy - 755, fY + 0.86, fY + 1.04);    // amber turn
      pb(bag, 'whiteG', cx - 1992, cx - 1972, cy - 750, cy - 720, fY + 0.86, fY + 1.04);   // white reverse
      // Right tail light base and elements
      pb(bag, 'dark', cx - 1990, cx - 1970, cy + 710, cy + 830, fY + 0.84, fY + 1.06);
      pb(bag, 'boug', cx - 1992, cx - 1972, cy + 790, cy + 820, fY + 0.86, fY + 1.04);     // red tail
      pb(bag, 'ixora', cx - 1992, cx - 1972, cy + 755, cy + 785, fY + 0.86, fY + 1.04);    // amber turn
      pb(bag, 'whiteG', cx - 1992, cx - 1972, cy + 720, cy + 750, fY + 0.86, fY + 1.04);   // white reverse
    }
  };

  /* ============ exterior opening schedules ============ */
  /* east band x: [12420,12650]; north y: [8640,8870]; south y: [0,230]; west x: [0,230] */
  const EB = [12420, 12650], NB = [8640, 8870], SB = [0, 230], WB = [0, 230];
  const OPEN = {
    // floor 0
    f0: {
      E: [
        { c: 2700, w: 1200, sill: 1100, h: 900, type: 'win' },                    // kitchen sink (south)
        { c: 6150, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // office window (slightly left of door)
        { c: 8000, w: 1200, sill: 0, h: 2400, type: 'door' }                   // office door (near north)
      ],
      N: [
        { c: 4300, w: 900, sill: 900, h: 1400, type: 'win' },                    // bed02
        { c: 6800, w: 1800, sill: 900, h: 1400, type: 'win' },                   // hall
        { c: 8650, w: 1200, sill: 0, h: 2400, type: 'door' },                    // main door
        { c: 11000, w: 1500, sill: 900, h: 1400, type: 'win' }                    // office
      ],
      S: [
        { c: 4300, w: 900, sill: 900, h: 1400, type: 'win', chajja: true },
        { c: 5800, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },
        { c: 8120, w: 1800, sill: 900, h: 1400, type: 'grill', chajja: true }, // utility south security grill
        { c: 11000, w: 1200, sill: 1100, h: 900, type: 'win', chajja: true }
      ],
      W: [
        { c: 3200, w: 1200, sill: 1100, h: 1200, type: 'win', chajja: true },
        { c: 5000, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },
        { c: 7200, w: 1200, sill: 1100, h: 1200, type: 'win', chajja: true }
      ]
    },
    f1: {
      E: [
        { c: -300, w: 600, sill: 0, h: 2400, type: 'grill', door: true },         // SE service grill (south)
        { c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' },                   // kitchen (south)
        { c: 6150, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // square fixed (slightly left, aligned)
        { c: 7100, w: 450, sill: 0, h: 2400, type: 'fixed', panes: 1 },     // sidelite (south of door)
        { c: 8000, w: 1200, sill: 0, h: 2400, type: 'door' }                // duplex entry (near north)
      ],
      N: [
        { c: 5500, w: 1000, sill: 900, h: 1400, type: 'win' },                   // left of void
        { c: 8760, w: 1000, sill: 900, h: 1400, type: 'win' },                   // right of void
      ],
      S: [
        // shell wall runs x 230..4805 only on FF (bedroom stretch): east of it the
        // service bands absorb the old 2.5ft strip (their wall sits at y -762..-646)
        // No chajja: this window is inside the covered balcony, so the hood
        // shaded nothing and drove a 500 mm charcoal slab through the timber.
        { c: 2500, w: 1500, sill: 900, h: 1400, type: 'win' }
      ],
      W: [
        { c: 3200, w: 1200, sill: 1100, h: 1200, type: 'win', chajja: true },
        { c: 5000, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },
        { c: 7200, w: 1200, sill: 2080, h: 1100, type: 'win', chajja: true } // stair landing
      ]
    },
    f2: {
      E: [
        { c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' },                   // bedroom window (south)
        { c: 7060, w: 3180, sill: 0, h: 2700, type: 'frenchdoor', panes: 3 } // living: window+door as one glass wall
      ],
      N: [
        { c: 5500, w: 1000, sill: 900, h: 1400, type: 'win' },                   // left of void
        { c: 8760, w: 1000, sill: 900, h: 1400, type: 'win' }                    // right of void
      ],
      S: [
        { c: 2500, w: 1500, sill: 900, h: 1400, type: 'win', chajja: true },
        { c: 6200, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },
        { c: 10000, w: 1500, sill: 900, h: 1400, type: 'win', chajja: true } // east bedroom south window
      ],
      W: [
        { c: 3200, w: 1200, sill: 1100, h: 1200, type: 'win', chajja: true },
        { c: 5000, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },
        { c: 7200, w: 1200, sill: 1100, h: 1200, type: 'win', chajja: true }
      ]
    }
  };

  /* ============ build ============ */
  function build(THREE) {
    const materials = buildMaterials(THREE);
    const root = new THREE.Group(); root.name = 'residence';

    /* -------- real car (GLB) with procedural fallback --------
       Drop a real SUV model at models/car.glb and it replaces the
       blocky placeholder automatically. Missing file -> fallback.
       Tune CAR_* below to fit whatever GLB you provide. */
    function placeCar() {
      const CAR_MODEL_URL = '../../models/car.glb';
      const CAR_POS = { x: 16.1, y: L.porticoFl, z: -6.42 }; // plan (15200,6420) mm, shifted ~0.9m east
      const CAR_YAW = Math.PI / 2; // radians; car length runs E–W, front faces east
      const CAR_TARGET_LEN = 4.3; // metres — overall length to fit into the portico

      const carGroup = new THREE.Group();
      carGroup.name = 'car';
      if (!carGroup.userData) carGroup.userData = {};
      root.add(carGroup);

      const isFile = (typeof location !== 'undefined' && location.protocol === 'file:');
      function carNotice(msg) {
        if (typeof document === 'undefined') return;
        let d = document.getElementById('carNotice');
        if (!d) {
          d = document.createElement('div');
          d.id = 'carNotice';
          d.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99;' +
            'background:rgba(20,22,24,.92);color:#e8e6e1;border:1px solid rgba(255,255,255,.12);' +
            'padding:8px 13px;border-radius:8px;font:12px Inter,system-ui,sans-serif;max-width:92vw;' +
            'text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.4)';
          document.body.appendChild(d);
        }
        d.textContent = msg;
      }
      function clearCarNotice() { const d = document.getElementById('carNotice'); if (d) d.remove(); }

      function fallback(reason) {
        if (isFile) carNotice('Showing placeholder car — browsers block loading models/car.glb from file://. ' +
          'Run "node serve.js" and open http://localhost:8080 to see the real model.');
        else if (reason) carNotice('models/car.glb not found — showing placeholder car.');
        const fb = makeBag(THREE);
        Fur.car(fb, 15200, 6420, L.porticoFl);
        carGroup.add(fb.build(THREE, materials));
        if (!carGroup.userData) carGroup.userData = {};
        carGroup.userData.colliderBox = {
          minX: CAR_POS.x - CAR_TARGET_LEN * 0.48,
          maxX: CAR_POS.x + CAR_TARGET_LEN * 0.48,
          minZ: CAR_POS.z - 0.95,
          maxZ: CAR_POS.z + 0.95,
          minY: CAR_POS.y,
          maxY: CAR_POS.y + 1.85
        };
      }

      function notifyCarReady(source) {
        // Let viewers re-bake the static shadow map + register colliders.
        try {
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('houseCarReady', {
              detail: { group: carGroup, source: source || 'unknown' }
            }));
          }
        } catch (_) { /* SSR / non-DOM */ }
      }

      function fitAndPlace(model) {
        model.traverse(o => {
          if (!o.isMesh) return;
          o.castShadow = true;
          o.receiveShadow = true;
          o.userData.matKey = o.userData.matKey || 'carBody';
          // glTF colour maps should be sRGB on r128
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            for (let i = 0; i < mats.length; i++) {
              const m = mats[i];
              if (m.map) {
                if ('colorSpace' in m.map) m.map.colorSpace = THREE.SRGBColorSpace || m.map.colorSpace;
                else if ('encoding' in m.map && THREE.sRGBEncoding != null) m.map.encoding = THREE.sRGBEncoding;
              }
            }
          }
        });
        const holder = new THREE.Group();
        holder.add(model);
        holder.rotation.y = CAR_YAW;
        carGroup.add(holder);
        let box = new THREE.Box3().setFromObject(holder);
        const size = box.getSize(new THREE.Vector3());
        const horiz = Math.max(size.x, size.z || size.x) || 1;
        holder.scale.setScalar(CAR_TARGET_LEN / horiz);
        box = new THREE.Box3().setFromObject(holder);
        const center = box.getCenter(new THREE.Vector3());
        holder.position.x += CAR_POS.x - center.x;
        holder.position.z += CAR_POS.z - center.z;
        holder.position.y += CAR_POS.y - box.min.y;
        // Approximate AABB collider for walkthrough (AABB in world space)
        if (!carGroup.userData) carGroup.userData = {};
        carGroup.userData.colliderBox = {
          minX: CAR_POS.x - CAR_TARGET_LEN * 0.48,
          maxX: CAR_POS.x + CAR_TARGET_LEN * 0.48,
          minZ: CAR_POS.z - 0.95,
          maxZ: CAR_POS.z + 0.95,
          minY: CAR_POS.y,
          maxY: CAR_POS.y + 1.85
        };
        notifyCarReady('glb');
      }

      if (THREE.GLTFLoader) {
        const loader = new THREE.GLTFLoader();
        if (THREE.DRACOLoader) {
          const draco = new THREE.DRACOLoader();
          // Prefer self-hosted decoders; fall back to Google CDN
          draco.setDecoderPath('../../lib/draco/');
          // If local path 404s, GLTFLoader error handler uses procedural car.
          // Also set CDN as secondary by retrying once below.
          loader.setDRACOLoader(draco);
        }
        let triedCdn = false;
        const onErr = (err) => {
          if (!triedCdn && THREE.DRACOLoader) {
            triedCdn = true;
            try {
              const draco2 = new THREE.DRACOLoader();
              draco2.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
              loader.setDRACOLoader(draco2);
              loader.load(CAR_MODEL_URL,
                gltf => { clearCarNotice(); fitAndPlace(gltf.scene); },
                undefined,
                e2 => {
                  console.warn('[car] models/car.glb not found — using procedural fallback.', e2 || err);
                  fallback('load-error');
                  notifyCarReady('fallback');
                });
              return;
            } catch (_) { /* fall through */ }
          }
          console.warn('[car] models/car.glb not found — using procedural fallback.', err);
          fallback('load-error');
          notifyCarReady('fallback');
        };
        loader.load(CAR_MODEL_URL,
          gltf => { clearCarNotice(); fitAndPlace(gltf.scene); },
          undefined,
          onErr
        );
      } else {
        console.warn('[car] GLTFLoader unavailable — using procedural fallback.');
        fallback();
        notifyCarReady('fallback');
      }
    }

    /* Photoreal garden sprites (crossed billboards). Magenta/cyan keyed
       at load. Procedural umbrella trees are the fallback. */
    function placeGarden() {
      const g = new THREE.Group();
      g.name = 'garden';
      root.add(g);

      function notifyGarden() {
        try {
          if (typeof window !== 'undefined') {
            window.__HOUSE3D_GARDEN__ = 'sprites';
            if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('houseGardenReady'));
          }
        } catch (_) { /* non-DOM */ }
      }

      function plantFallback() {
        const bag = makeBag(THREE);
        plantTree(bag, 3600, 15800, 3.4);
        plantTree(bag, 10800, 16600, 3.0);
        plantTree(bag, 16800, 15000, 3.7);
        plantTree(bag, 19800, 16400, 3.5);
        plantShrub(bag, 18800, 12850, 0.70, 'boug');
        plantShrub(bag, 20200, 13400, 0.58, 'boug');
        plantShrub(bag, 19400, 14100, 0.54, 'ixora');
        plantShrub(bag, 1600, 13000, 0.64, 'boug');
        plantShrub(bag, 2600, 13800, 0.52, 'ixora');
        plantShrub(bag, 5400, 12550, 0.50, 'boug');
        plantShrub(bag, 11800, 12680, 0.50, 'ixora');
        for (let hx = 900; hx < 21000; hx += 720) {
          plantShrub(bag, hx, 17940, 0.34 + ((hx / 720) % 3) * 0.03, 'green2');
        }
        g.add(bag.build(THREE, materials));
        notifyGarden();
      }

      function loadImage(urls) {
        return new Promise(function (resolve, reject) {
          let i = 0;
          function next() {
            if (i >= urls.length) { reject(new Error('no image')); return; }
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () { resolve(img); };
            img.onerror = function () { i += 1; next(); };
            img.src = urls[i];
            i += 1;
          }
          next();
        });
      }

      function keyAndTrim(img) {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const id = ctx.getImageData(0, 0, c.width, c.height);
        const p = id.data;
        function sample(x, y) {
          const i = (y * c.width + x) * 4;
          return [p[i], p[i + 1], p[i + 2]];
        }
        const corners = [
          sample(2, 2), sample(c.width - 3, 2),
          sample(2, c.height - 3), sample(c.width - 3, c.height - 3)
        ];
        const bg = [
          (corners[0][0] + corners[1][0] + corners[2][0] + corners[3][0]) / 4,
          (corners[0][1] + corners[1][1] + corners[2][1] + corners[3][1]) / 4,
          (corners[0][2] + corners[1][2] + corners[2][2] + corners[3][2]) / 4
        ];
        const bgIsMagenta = bg[0] > 170 && bg[2] > 140 && bg[1] < 150;
        const bgIsCyan = bg[2] > 150 && bg[1] > 130 && bg[0] < 110;
        let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            const i = (y * c.width + x) * 4;
            const r = p[i], gv = p[i + 1], b = p[i + 2];
            const dr = r - bg[0], dg = gv - bg[1], db = b - bg[2];
            const dist = Math.sqrt(dr * dr + dg * dg + db * db);
            const magentaPx = r > 165 && b > 135 && gv < 145 && Math.abs(r - b) < 110 && (r + b) > gv * 2.6;
            const cyanPx = b > 155 && gv > 125 && r < 115 && (gv + b) > r * 3.0;
            let a = p[i + 3];
            if (dist < 68) a = 0;
            else if (bgIsMagenta && magentaPx) a = 0;
            else if (bgIsCyan && cyanPx) a = 0;
            else if (dist < 102) a = Math.round(a * (dist - 68) / 34);
            p[i + 3] = a;
            if (a > 18) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        ctx.putImageData(id, 0, 0);
        if (maxX <= minX || maxY <= minY) return c;
        minX = Math.max(0, minX - 2);
        minY = Math.max(0, minY - 2);
        maxX = Math.min(c.width - 1, maxX + 2);
        maxY = Math.min(c.height - 1, maxY + 2);
        const w = maxX - minX + 1, h = maxY - minY + 1;
        const out = document.createElement('canvas');
        out.width = w;
        out.height = h;
        out.getContext('2d').drawImage(c, minX, minY, w, h, 0, 0, w, h);
        return out;
      }

      function texFromCanvas(cv) {
        const t = new THREE.CanvasTexture(cv);
        t.needsUpdate = true;
        if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
        // Mipmaps matter here: the backdrop trees are 45 m out and only a few
        // hundred pixels tall on screen. Point-sampling a 1000 px leaf photo at
        // that size crawls and sparkles on every camera move. The canvases are
        // clamped and non-power-of-two, which WebGL2 mips happily.
        t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.generateMipmaps = true;
        t.anisotropy = 8;
        return t;
      }

      /* ================= REAL 3D PLANTS =================

         A whole-tree photo on a quad is a cut-out: it has no thickness, it
         shows its own edge from the side, and from overhead there is nothing
         there at all. Crossing two of them helps the silhouette and fixes
         nothing else — it is still two flat pictures.

         So the photos are used as a SOURCE OF LEAVES rather than as trees. A
         patch is cropped out of the middle of each canopy, given a ragged
         alpha, and becomes a leaf-cluster card. A tree is then built the way a
         real one is: a tapered trunk, a few branches, and a few hundred of
         those clusters scattered through a canopy VOLUME — not on a plane.

         That buys everything a billboard cannot: real parallax as you orbit, a
         correct silhouette from every angle including straight down, sky
         visible through the gaps, and a dappled shadow instead of a flat
         cut-out shadow. Leaves go into one InstancedMesh per species, so a few
         thousand cards cost one draw call each.                              */

      const rnd3 = rng(20260814);

      // Crop a square of pure foliage from the middle of a plant photo and
      // fade it to nothing at the rim, so cards never show a straight edge.
      /* Find the densest patch of a given colour in an image, on a coarse grid.
         Used so the bougainvillea samples its FLOWERS rather than whatever
         happens to sit at a hard-coded fraction of the frame — picking blind
         gave a green card and the shrubs came out as dark blobs. */
      function findPatch(img, score) {
        const G = 10, c = document.createElement('canvas');
        c.width = c.height = 64;
        const x = c.getContext('2d');
        let best = { s: -1, cx: 0.5, cy: 0.5 };
        for (let gy = 1; gy < G - 1; gy++) {
          for (let gx = 1; gx < G - 1; gx++) {
            const cx = (gx + 0.5) / G, cy = (gy + 0.5) / G;
            const src = Math.round(Math.min(img.width, img.height) * 0.18);
            x.clearRect(0, 0, 64, 64);
            x.drawImage(img, Math.round(img.width * cx - src / 2), Math.round(img.height * cy - src / 2),
                        src, src, 0, 0, 64, 64);
            const d = x.getImageData(0, 0, 64, 64).data;
            let s = 0;
            for (let i = 0; i < d.length; i += 4) s += score(d[i], d[i + 1], d[i + 2]);
            if (s > best.s) best = { s: s, cx: cx, cy: cy };
          }
        }
        return best;
      }

      function foliageCard(img, cxF, cyF, sizeF, boost) {
        const S = 128;
        const src = Math.round(Math.min(img.width, img.height) * sizeF);
        const sx = Math.round(img.width * cxF - src / 2);
        const sy = Math.round(img.height * cyF - src / 2);
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const x = c.getContext('2d');
        x.drawImage(img, Math.max(0, sx), Math.max(0, sy), src, src, 0, 0, S, S);
        // ragged, roughly circular alpha so a card reads as a leaf clump
        const id = x.getImageData(0, 0, S, S), p = id.data;
        for (let py = 0; py < S; py++) {
          for (let px = 0; px < S; px++) {
            const i = (py * S + px) * 4;
            const dx = (px - S / 2) / (S / 2), dy = (py - S / 2) / (S / 2);
            const d = Math.sqrt(dx * dx + dy * dy);
            const wob = 0.76 + 0.24 * Math.sin(Math.atan2(dy, dx) * 5 + px * 0.06 + py * 0.05);
            let a = d < wob ? 255 : 0;
            if (a && d > wob - 0.22) a = Math.round(255 * (wob - d) / 0.22);
            // drop anything too grey/bright to be foliage (sky showing through)
            const lum = (p[i] + p[i + 1] + p[i + 2]) / 3;
            if (p[i + 1] < p[i] * 0.92 && lum > 150 && p[i] < p[i + 1] * 1.2) a = 0;
            // and drop anything blue-dominant. Nothing on a plant is cyan; those
            // pixels are sky caught between the leaves of the source photo, and
            // left in they speckle the flowers with little blue flecks.
            if (p[i + 2] > p[i] * 1.06 && p[i + 2] > p[i + 1] * 1.06) a = 0;
            // Photographs of a canopy are exposed for the sky, so the leaves in
            // them sit far darker than leaves lit by our own sun. Lift them, or
            // every plant reads as a black mass on a bright lawn.
            const k = boost || 1.5;
            p[i]     = Math.min(255, p[i] * k);
            p[i + 1] = Math.min(255, p[i + 1] * k);
            p[i + 2] = Math.min(255, p[i + 2] * k);
            p[i + 3] = a;
          }
        }
        x.putImageData(id, 0, 0);
        const t = new THREE.CanvasTexture(c);
        if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
        t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.generateMipmaps = true;
        t.anisotropy = 8;
        return t;
      }

      function leafMaterial(tex) {
        return new THREE.MeshStandardMaterial({
          map: tex, transparent: false, alphaTest: 0.42,
          roughness: 0.92, metalness: 0, side: THREE.DoubleSide
        });
      }

      // Collected leaf-card transforms, one bucket per species → one InstancedMesh each.
      const leafSets = {};
      function leafBucket(name, tex, shadow) {
        return leafSets[name] || (leafSets[name] = { tex: tex, shadow: shadow !== false, m: [] });
      }
      const CARD = new THREE.PlaneGeometry(1, 1);
      const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(),
            _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();

      function addCard(bucket, px, py, pz, size, tilt) {
        _e.set((rnd3() - 0.5) * tilt, rnd3() * Math.PI * 2, (rnd3() - 0.5) * tilt);
        _q.setFromEuler(_e);
        _v.set(px, py, pz);
        _s.set(size * (0.8 + rnd3() * 0.45), size * (0.7 + rnd3() * 0.4), size);
        bucket.m.push(_m4.compose(_v, _q, _s).clone());
      }

      /* Canopy as a VOLUME: cards are scattered through an ellipsoid, weighted
         toward the outside so the interior stays open and light gets in, but
         never only on the surface — a hollow shell reads as a balloon. */
      function canopyVolume(bucket, cx, cy, cz, rx, ry, n, cardSize) {
        for (let i = 0; i < n; i++) {
          const u = rnd3() * Math.PI * 2;
          const v = Math.acos(2 * rnd3() - 1);
          const r = Math.pow(0.35 + rnd3() * 0.65, 0.55);      // bias outward
          addCard(bucket,
            cx + Math.sin(v) * Math.cos(u) * rx * r,
            cy + Math.cos(v) * ry * r,
            cz + Math.sin(v) * Math.sin(u) * rx * r,
            cardSize * (0.75 + rnd3() * 0.5), 1.5);
        }
      }

      const woodBag = makeBag(THREE);

      function makeTree(species, xmm, ymm, height, opts) {
        opts = opts || {};
        const cx = xmm / 1000, cz = -ymm / 1000;
        const base = opts.base === undefined ? 0.02 : opts.base;
        const trunkH = height * 0.42;
        const rTrunk = height * 0.030;
        woodBag.trunk('bark', cx, base + trunkH * 0.5, cz, rTrunk, trunkH);
        // three branches lifting into the crown
        const nB = 3;
        for (let i = 0; i < nB; i++) {
          const a = (i / nB) * Math.PI * 2 + rnd3() * 0.8;
          const bl = height * (0.20 + rnd3() * 0.10);
          woodBag.cyl('barkLight',
            cx + Math.cos(a) * bl * 0.30, base + trunkH + bl * 0.22, cz + Math.sin(a) * bl * 0.30,
            rTrunk * 0.42, bl, Math.sin(a) * 0.7, 0, Math.cos(a) * 0.7);
        }
        const cyC = base + trunkH + height * 0.26;
        const rx = height * (opts.spread || 0.34);
        const bucket = leafBucket(species, null, opts.shadow);
        canopyVolume(bucket, cx, cyC, cz, rx, height * 0.24,
                     opts.cards || 190, height * 0.115);
      }

      /* A flowering shrub is mostly LEAF with flower clusters riding on it.
         Building it out of flower cards alone gives a solid magenta lump —
         which is what the bougainvillea band looked like. So the body is green
         and the flowers are a minority layer sitting toward the outside, where
         they actually grow. */
      function makeShrub(species, xmm, ymm, height, opts) {
        opts = opts || {};
        const cx = xmm / 1000, cz = -ymm / 1000;
        const base = opts.base === undefined ? 0.02 : opts.base;
        const n = opts.cards || 80;
        const flowerFrac = opts.flowers === undefined ? 0 : opts.flowers;
        const leafSp = opts.leaf || species;
        canopyVolume(leafBucket(leafSp, null, opts.shadow),
                     cx, base + height * 0.52, cz,
                     height * 0.62, height * 0.46,
                     Math.round(n * (1 - flowerFrac)), height * 0.34);
        if (flowerFrac > 0) {
          const fb = leafBucket(species, null, opts.shadow);
          const nf = Math.round(n * flowerFrac);
          for (let i = 0; i < nf; i++) {
            const u = rnd3() * Math.PI * 2, v = Math.acos(2 * rnd3() - 1);
            const r = 0.80 + rnd3() * 0.22;          // flowers ride the surface
            addCard(fb,
              cx + Math.sin(v) * Math.cos(u) * height * 0.62 * r,
              base + height * 0.52 + Math.cos(v) * height * 0.46 * r,
              cz + Math.sin(v) * Math.sin(u) * height * 0.62 * r,
              height * 0.26, 1.7);
          }
        }
      }

      /* A clipped hedge really is a solid box, so it gets one: a plain green
         core with leaf cards packed over its faces. That way it reads as a
         hedge from the side AND from directly above, and it can be checked
         against the wall as a fixed box. */
      function makeHedge(species, x0mm, x1mm, ymm, height, depth) {
        const cy = -ymm / 1000, h = height, d = depth;
        const x0 = x0mm / 1000, x1 = x1mm / 1000;
        woodBag.box('leafDark', (x0 + x1) / 2, 0.02 + h * 0.46, cy,
                    (x1 - x0) - 0.10, h * 0.88, d - 0.10);
        const bucket = leafBucket(species, null, true);
        const n = Math.round((x1 - x0) * h * 26);
        for (let i = 0; i < n; i++) {
          const t = rnd3();
          const px = x0 + t * (x1 - x0);
          // scallop the top a little so it isn't a machined block
          const top = h * (0.92 + 0.08 * Math.sin(t * (x1 - x0) * 2.4));
          const face = rnd3();
          let py, pz;
          if (face < 0.34) { py = 0.02 + top; pz = cy + (rnd3() - 0.5) * d; }
          else if (face < 0.67) { py = 0.02 + rnd3() * top; pz = cy + d * 0.5; }
          else { py = 0.02 + rnd3() * top; pz = cy - d * 0.5; }
          addCard(bucket, px, py, pz, h * 0.34, 1.9);
        }
      }

      function makeHedgeNS(species, xmm, y0mm, y1mm, height, depth) {
        const cx = xmm / 1000, h = height, d = depth;
        const zA = -y0mm / 1000, zB = -y1mm / 1000;
        const z0 = Math.min(zA, zB), z1 = Math.max(zA, zB);
        woodBag.box('leafDark', cx, 0.02 + h * 0.46, (z0 + z1) / 2,
                    d - 0.10, h * 0.88, (z1 - z0) - 0.10);
        const bucket = leafBucket(species, null, true);
        const n = Math.round((z1 - z0) * h * 26);
        for (let i = 0; i < n; i++) {
          const t = rnd3();
          const pz = z0 + t * (z1 - z0);
          const top = h * (0.92 + 0.08 * Math.sin(t * (z1 - z0) * 2.4));
          const face = rnd3();
          let py, px;
          if (face < 0.34) { py = 0.02 + top; px = cx + (rnd3() - 0.5) * d; }
          else if (face < 0.67) { py = 0.02 + rnd3() * top; px = cx + d * 0.5; }
          else { py = 0.02 + rnd3() * top; px = cx - d * 0.5; }
          addCard(bucket, px, py, pz, h * 0.34, 1.9);
        }
      }

      if (typeof document === 'undefined' || typeof Image === 'undefined') {
        plantFallback();
        return;
      }

      const ASSETS = {
        mango: ['assets/tree-mango.jpg', '/elevations/version-forty-nine/assets/tree-mango.jpg'],
        neem:  ['assets/tree-neem.jpg',  '/elevations/version-forty-nine/assets/tree-neem.jpg'],
        boug:  ['assets/shrub-boug.jpg', '/elevations/version-forty-nine/assets/shrub-boug.jpg'],
        hedge: ['assets/hedge.jpg',      '/elevations/version-forty-nine/assets/hedge.jpg']
      };

      Promise.all([
        loadImage(ASSETS.mango),
        loadImage(ASSETS.neem),
        loadImage(ASSETS.boug),
        loadImage(ASSETS.hedge)
      ]).then(function (imgs) {
        // Leaf sources cropped out of the same four photos. Trees and hedge take
        // their greenest patch; the bougainvillea takes its pinkest, or it comes
        // out as another green shrub.
        const greenest = function (r, gg, b) { return gg > r * 1.05 && gg > b * 1.15 ? gg : 0; };
        const pinkest  = function (r, gg, b) { return r > gg * 1.25 && b > gg * 1.02 ? r : 0; };
        const pm = findPatch(imgs[0], greenest), pn = findPatch(imgs[1], greenest);
        const pb_ = findPatch(imgs[2], pinkest), ph = findPatch(imgs[3], greenest);
        const T_MANGO = foliageCard(imgs[0], pm.cx, pm.cy, 0.17, 1.55);
        const T_NEEM  = foliageCard(imgs[1], pn.cx, pn.cy, 0.15, 1.55);
        const T_BOUG  = foliageCard(imgs[2], pb_.cx, pb_.cy, 0.20, 1.30);
        const T_HEDGE = foliageCard(imgs[3], ph.cx, ph.cy, 0.22, 1.45);
        leafBucket('mango', T_MANGO); leafBucket('neem', T_NEEM);
        leafBucket('boug', T_BOUG);   leafBucket('hedge', T_HEDGE);
        /* North lawn — compact garden trees, not forest giants.
           The lawn is 22.85 × 7.35 m (x −750…22100, y 11270…18620); five plants
           on 168 m² read as a mown field with objects on it. Filled out to
           eleven: a canopy at each third of the run, and flowering shrubs
           carried along the front edge so the lawn has a foreground as well as
           a skyline. Every footprint below is checked against the compound —
           half-width = height × aspect × wide ÷ 2, and the widest here (mango
           at 3.75 m → 1.754 m) still clears the west wall by 2.3 m. */
        /* A composed garden, not a scatter.

           Eleven plants dotted at unrelated spacings read as clutter, which is
           at odds with how the house itself is designed. The lawn is a long
           thin strip (22.85 × 7.35 m), so it wants an ORDER along its length,
           not objects sprinkled across it:

             · three canopy trees on one line at y 15600, evenly at quarter
               points of the run — a row you read as intentional
             · one clipped flowering band along the front edge at y 12700,
               continuous rather than five separate blobs
             · the boundary hedge behind, at y 17900
             · the middle of the lawn left OPEN, which is what makes a small
               garden feel larger and lets the house sit in it

           Three depths, three straight lines, open grass between. Same
           restraint as the facade. */
        // A real north lawn: open grass in the middle, trees staggered
        // (not a parade), flowering shrubs in beds, hedge on three sides.
        makeTree('neem',  3600, 15800, 3.40, { spread: 0.31 });
        makeTree('neem',  10800, 16600, 2.95, { spread: 0.28 });
        makeTree('mango', 16800, 15000, 3.70, { spread: 0.36 });
        makeTree('mango', 19800, 16400, 3.50, { spread: 0.34 });
        makeShrub('boug', 18800, 12850, 0.92, { cards: 78, flowers: 0.32, leaf: 'hedge' });
        makeShrub('boug', 20200, 13400, 0.80, { cards: 68, flowers: 0.36, leaf: 'hedge' });
        makeShrub('boug', 19400, 14100, 0.74, { cards: 62, flowers: 0.28, leaf: 'hedge' });
        makeShrub('boug', 15600, 13200, 0.78, { cards: 66, flowers: 0.30, leaf: 'hedge' });
        makeShrub('boug',  1600, 13000, 0.88, { cards: 72, flowers: 0.30, leaf: 'hedge' });
        makeShrub('boug',  2600, 13800, 0.76, { cards: 60, flowers: 0.28, leaf: 'hedge' });
        makeShrub('boug',  2200, 15200, 0.64, { cards: 52, flowers: 0.18, leaf: 'hedge' });
        makeShrub('boug', 18400, 17000, 0.70, { cards: 56, flowers: 0.26, leaf: 'hedge' });
        makeShrub('boug',  5400, 12550, 0.70, { cards: 58, flowers: 0.30, leaf: 'hedge' });
        makeShrub('boug', 11800, 12680, 0.68, { cards: 56, flowers: 0.28, leaf: 'hedge' });
        makeShrub('hedge', 5000, 17200, 0.55, { cards: 44, flowers: 0 });
        makeShrub('hedge', 14000, 17300, 0.52, { cards: 42, flowers: 0 });
        makeShrub('hedge', 19000, 17150, 0.56, { cards: 44, flowers: 0 });
        makeHedge('hedge', 700, 21200, 17900, 1.05, 0.90);
        makeHedgeNS('hedge', 900, 12600, 17400, 0.88, 0.52);
        makeHedgeNS('hedge', 20900, 12600, 17400, 0.88, 0.52);

        /* Real grass. The lawn was one flat green box — a colour, not a
           surface. Now it gets a painted turf texture on the slab itself
           (world-projected, because the merged geometry's UVs are planar and
           smear on anything horizontal) plus ~7000 instanced blade tufts, which
           is what actually catches the light and gives the lawn a nap. Tufts
           thin out under the canopies where grass really is sparser. */
        (function realGrass() {
          const GX0 = -0.75, GX1 = 22.10, GY0 = -18.620, GY1 = -11.270;  // world x, z
          const TOP = 0.045;
          // --- turf texture on the slab
          const s = 512, c = document.createElement('canvas');
          c.width = c.height = s;
          const x = c.getContext('2d');
          x.fillStyle = '#5c7a3c'; x.fillRect(0, 0, s, s);
          for (let i = 0; i < 42000; i++) {
            const g = 0.62 + rnd3() * 0.42, dry = rnd3() < 0.07;
            x.fillStyle = dry
              ? 'rgba(' + ((150 * g) | 0) + ',' + ((140 * g) | 0) + ',' + ((74 * g) | 0) + ',0.8)'
              : 'rgba(' + ((84 * g) | 0) + ',' + ((124 * g) | 0) + ',' + ((56 * g) | 0) + ',0.8)';
            x.fillRect(rnd3() * s, rnd3() * s, 1.5, 3 + rnd3() * 4);
          }
          const turf = new THREE.CanvasTexture(c);
          if (THREE.sRGBEncoding !== undefined) turf.encoding = THREE.sRGBEncoding;
          turf.wrapS = turf.wrapT = THREE.RepeatWrapping;
          turf.minFilter = THREE.LinearMipmapLinearFilter;
          turf.anisotropy = 8;
          const site = root.getObjectByName('site');
          if (site) site.traverse(function (o) {
            if (!o.isMesh || o.userData.matKey !== 'grass') return;
            const p = o.geometry.attributes.position, nn = o.geometry.attributes.normal;
            const uv = new Float32Array(p.count * 2);
            for (let i = 0; i < p.count; i++) {
              const ax = Math.abs(nn.getX(i)), ay = Math.abs(nn.getY(i)), az = Math.abs(nn.getZ(i));
              let u, v;
              if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); }
              else if (ax >= az) { u = p.getZ(i); v = p.getY(i); }
              else { u = p.getX(i); v = p.getY(i); }
              uv[2 * i] = u / 1.6; uv[2 * i + 1] = v / 1.6;
            }
            o.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
            o.material.map = turf;
            o.material.color.setRGB(1, 1, 1);
            o.material.needsUpdate = true;
          });
          // --- blade tufts
          const bs = 64, bc = document.createElement('canvas');
          bc.width = bc.height = bs;
          const bx = bc.getContext('2d');
          for (let i = 0; i < 34; i++) {
            const g = 0.5 + rnd3() * 0.5;
            bx.strokeStyle = 'rgba(' + ((80 * g) | 0) + ',' + ((126 * g) | 0) + ',' + ((50 * g) | 0) + ',1)';
            bx.lineWidth = 1.6 + rnd3() * 1.6;
            const x0 = 8 + rnd3() * (bs - 16);
            bx.beginPath(); bx.moveTo(x0, bs);
            bx.quadraticCurveTo(x0 + (rnd3() - 0.5) * 18, bs * 0.45, x0 + (rnd3() - 0.5) * 26, 4 + rnd3() * 14);
            bx.stroke();
          }
          const blade = new THREE.CanvasTexture(bc);
          if (THREE.sRGBEncoding !== undefined) blade.encoding = THREE.sRGBEncoding;
          blade.minFilter = THREE.LinearMipmapLinearFilter;
          blade.generateMipmaps = true;
          const bmat = new THREE.MeshStandardMaterial({
            map: blade, transparent: false, alphaTest: 0.45,
            roughness: 0.95, metalness: 0, side: THREE.DoubleSide
          });
          const N = 7000;
          const inst = new THREE.InstancedMesh(CARD, bmat, N * 2);
          inst.castShadow = false; inst.receiveShadow = true; inst.frustumCulled = false;
          let k = 0;
          for (let i = 0; i < N; i++) {
            const px = GX0 + rnd3() * (GX1 - GX0);
            const pz = GY0 + rnd3() * (GY1 - GY0);
            const hh = 0.075 + rnd3() * 0.075;
            const yaw = rnd3() * Math.PI;
            for (let q = 0; q < 2; q++) {          // crossed, so a tuft has volume
              _e.set(0, yaw + q * Math.PI / 2, (rnd3() - 0.5) * 0.30);
              _q.setFromEuler(_e);
              _v.set(px, TOP + hh * 0.48, pz);
              _s.set(hh * 1.5, hh, hh);
              inst.setMatrixAt(k++, _m4.compose(_v, _q, _s));
            }
          }
          inst.count = k;
          inst.instanceMatrix.needsUpdate = true;
          g.add(inst);
        })();

        // --- one InstancedMesh per leaf species
        Object.keys(leafSets).forEach(function (name) {
          const set = leafSets[name];
          if (!set.tex || !set.m.length) return;
          const im = new THREE.InstancedMesh(CARD, leafMaterial(set.tex), set.m.length);
          set.m.forEach(function (mm, i) { im.setMatrixAt(i, mm); });
          im.instanceMatrix.needsUpdate = true;
          im.castShadow = set.shadow; im.receiveShadow = true;
          im.frustumCulled = false;
          g.add(im);
        });
        g.add(woodBag.build(THREE, materials));
        notifyGarden();
      }).catch(function (err) {
        console.warn('[garden] leaf source load failed — using procedural trees', err);
        plantFallback();
      });
    }

    const X0 = 0, X1 = 12650, Y0n = 0, Y1n = 8870; // main block
    const liftIX = [12650, 14040], liftIY = [230, 1805];
    const liftOX = [12650, 14270], liftOY = [0, 2035];
    const towX = [14270, 16600], towY = [0, 4140];
    const portY = [-762, 8870], eastX = [12650, 17362];
    // West edge of the SE pergola void — the lift's east face.
    const SHELTER_X = liftOX[1];
    // SF east wall pulled 5 ft (1525 mm) inside. The lift keeps its own
    // west wall on the old house line, and the roof terrace now ends on
    // that line too: one straight east parapet sitting on the lift's west
    // wall, lift roof outside it. Two columns carry the roof edge at SF.
    const SF_PULL = 1525;
    const SF_EB = [EB[0] - SF_PULL, EB[1] - SF_PULL];   // 10895 .. 11125
    const ROOF_EX = EB[1];                               // 12650
    const ROOF_COLS = [8720, 4290];                      // y centres, same grid as the portico columns

    // East rail run (FF/SF): y −762 → 9790. South 40% is a vertical fin screen.
    const EAST_RAIL_YS = -762;
    const EAST_RAIL_YN = Y1n + 1000 - 80;
    const EAST_RAFTER_LEN = Math.round(0.40 * (EAST_RAIL_YN - EAST_RAIL_YS));
    const EAST_RAFTER_YE = EAST_RAIL_YS + EAST_RAFTER_LEN; // −762 + 4221 = 3459
    const EAST_RAIL_RESUME = EAST_RAFTER_YE + 20;
    const EAST_RAFTER_XOUT = eastX[1] + 40;
    const EAST_RAFTER_XIN = EAST_RAFTER_XOUT - 230; // terrace parapet depth
    const EAST_SCREEN_XIN = EAST_RAFTER_XOUT - 100; // east-face screen inner
    // South return, west end. It used to die at 16238 — 40 mm past the SE
    // portico column's west coping — which left a 1399 mm face against a
    // 6981 mm tall box: 1:5, a sliver, and it read as an offcut rather than
    // a return. It now lands on towX[0] = 14270 — the stair tower's west
    // face, i.e. an existing grid line rather than an arbitrary offset — so
    // the south face reads 3367 mm, about 0.75 of the east leg, which is the
    // proportion a return wants. It still masks the portico column
    // (16300–16600) on the oblique, with room to spare. Like the east leg
    // the frame hangs off the FF edge beam; nothing bears under it.
    const EAST_SOUTH_RET_XW = towX[0];   // 14270

    // External U-stair: 12 risers + mid landing + 12 risers → flush at L.f1
    const RISE_E = (L.f1 - L.porticoFl) / 24;
    const LAND_E = L.porticoFl + 12 * RISE_E; // mid-landing top (= end of flight 1)
    // Stair-void edges at FF. Hole is the FULL U-stair (both flights + landing).
    // Was 15400 — only the west flight — so the east flight sat under the FF
    // slab and anyone on those treads hit their head. East edge is the
    // outer face of the stair wall (16600).
    const VOID_WX = 14270, VOID_EX = 16600, LIFT_NY = 2035;
    // Internal U-stair: 10 risers + mid landing + 10 risers → next floor (flush)
    const RISE_I = L.f2f / 20;
    const landI = (base) => base + 10 * RISE_I;

    const lights = [];

    /* -------- site (always visible) -------- */
    const sBag = makeBag(THREE);
    (function site() {
      // South compound wall shifted 1 ft (305 mm) further south from the
      // original y=-900 outer / y=-750 inner. West/east walls grow with it.
      const S_OUT = -1205; // outer face of south wall (plan-mm, more negative = south)
      const S_IN  = -1055; // inner face (150 mm thick)
      // ground plane
      sBag.box('ground', 10.5, -0.09, -9.0, 230, 0.18, 230);
      // plot pad: compound interior (south edge just inside S_IN)
      pb(sBag, 'plotPad', -880, 22100, S_IN + 25, 18750, -0.002, 0.012);
      // Compound: cool-gray plaster + one coping — same triad as the house
      // (ivory piers, gray wall, steel gate). No brass, spikes, or plaques.
      const WH = 1.524;
      // Car leaf centred on the drive (y 6400). Pedestrian leaf to the north.
      const CAR_S = 4300, CAR_N = 8500;   // 4.2 m — car in/out
      const PED_S = 8760, PED_N = 9860;   // 1.1 m — walk / bike
      const PIER = 260;
      const cw = (x0, x1, y0, y1) => {
        pb(sBag, 'white2', x0, x1, y0, y1, 0.10, WH);
        pb(sBag, 'charDark', x0 - 6, x1 + 6, y0 - 6, y1 + 6, 0, 0.10);
        pb(sBag, 'charDark', x0 - 8, x1 + 8, y0 - 8, y1 + 8, WH - 0.026, WH);
        pb(sBag, 'charcoal', x0 - 18, x1 + 18, y0 - 18, y1 + 18, WH, WH + 0.040);
      };
      cw(-900, -750, S_OUT, 18770);
      cw(-900, 22250, S_OUT, S_IN);
      cw(-900, 22250, 18620, 18770);
      cw(22100, 22250, S_OUT, CAR_S);
      cw(22100, 22250, PED_N, 18770);
      function cornerPier(x0, x1, y0, y1) {
        pb(sBag, 'white2', x0 - 16, x1 + 16, y0 - 16, y1 + 16, 0, WH + 0.16);
        pb(sBag, 'charcoal', x0 - 24, x1 + 24, y0 - 24, y1 + 24, WH + 0.16, WH + 0.20);
      }
      cornerPier(-900, -750, S_OUT, S_IN);
      cornerPier(22100, 22250, S_OUT, S_IN);
      cornerPier(-900, -750, 18620, 18770);
      cornerPier(22100, 22250, 18620, 18770);
      function pier(y0, y1, lamp) {
        const mid = (y0 + y1) / 2;
        pb(sBag, 'white2', 22082, 22268, y0, y1, 0, WH + 0.20);
        pb(sBag, 'white2', 22098, 22252, y0 - 14, y1 + 14, 0.05, WH + 0.16);
        pb(sBag, 'charcoal', 22070, 22280, y0 - 18, y1 + 18, WH + 0.20, WH + 0.24);
        if (lamp) {
          pb(sBag, 'steel', 22258, 22274, mid - 32, mid + 32, 1.12, 1.38);
          pb(sBag, 'lamp', 22268, 22286, mid - 22, mid + 22, 1.16, 1.34);
        }
      }
      pier(CAR_S - PIER, CAR_S, true);
      pier(CAR_N, PED_S, true);
      pier(PED_N, PED_N + PIER, true);
      // Middle post between the two leaves — carry the gate rails across
      // the street face so the bars do not die on a blank pier.
      pb(sBag, 'steel', 22258, 22282, CAR_N - 4, PED_S + 4, 1.42, 1.51);
      pb(sBag, 'steel', 22258, 22282, CAR_N - 4, PED_S + 4, 0.76, 0.81);
      pb(sBag, 'steel', 22258, 22282, CAR_N - 4, PED_S + 4, 0.08, 0.13);
      function leaf(y0, y1) {
        pb(sBag, 'steel', 22118, 22232, y0, y1, 0.08, 0.13);
        pb(sBag, 'steel', 22110, 22240, y0, y1, 1.42, 1.50);
        pb(sBag, 'chrome', 22116, 22234, y0, y1, 1.48, 1.51);
        pb(sBag, 'steel', 22116, 22234, y0, y1, 0.76, 0.81);
        const n = Math.max(2, Math.round((y1 - y0) / 120));
        for (let i = 0; i <= n; i++) {
          const gy = y0 + ((y1 - y0) * i) / n;
          pb(sBag, 'ms', 22126, 22224, gy - 8, gy + 8, 0.13, 1.42);
        }
        pb(sBag, 'charDark', 22096, 22254, y0, y1, 0, 0.028);
      }
      leaf(CAR_S, CAR_N);
      leaf(PED_S, PED_N);
      // Ground Flooring:
      // 1) East Front Courtyard & Car Driveway: Subtle Indian exterior parking tiles
      //    Spans full East side from compound gate/wall (22100) to the building line (12650),
      //    and wraps north to the Main Entrance and Office stoops (7800..12650, 10070..11270),
      //    under the car, before the car, and across the driveway.
      pb(sBag, 'paver', 12650, 22100, S_IN + 25, 11270, 0, 0.045);
      pb(sBag, 'paver', 7800, 12650, 10070, 11270, 0, 0.045);

      // 2) West, South, and North Setbacks: Clean smooth concrete
      pb(sBag, 'concrete', -750, 0, S_IN + 25, 11270, 0, 0.045);           // West setback
      pb(sBag, 'concrete', 0, 12650, S_IN + 25, 0, 0, 0.045);              // South setback
      pb(sBag, 'concrete', 0, 7800, 10070, 11270, 0, 0.045);               // North-West setback around plinth

      // Subtle dividing kerb separating parking tiles from concrete setbacks
      pb(sBag, 'charDark', 12610, 12650, S_IN + 25, 0, 0, 0.052);
      pb(sBag, 'copingLight', 12620, 12645, S_IN + 25, 0, 0.045, 0.054);
      pb(sBag, 'charDark', 7800, 12650, 10040, 10070, 0, 0.052);
      pb(sBag, 'copingLight', 7800, 12650, 10045, 10065, 0.045, 0.054);

      // 3) North lawn: grass garden north of steps (y = 11270..18620)
      // Trees / hedge / flowering shrubs are photoreal sprites in placeGarden().
      pb(sBag, 'grass', -750, 22100, 11270, 18620, 0.012, 0.045);

    })();
    const site = sBag.build(THREE, materials); site.name = 'site'; root.add(site);
    placeCar();
    placeGarden();

    /* -------- exterior context (own group so viewers can hide it) --------
       Outside compound: x -900..22250, y S_OUT(-1205)..18770 mm. */
    const cBag = makeBag(THREE);
    (function contextBits() {
      // South wall outer face (must match site S_OUT) — south frontage shifts with it
      const S_OUT = -1205;
      // ─── East road: divided 4-lane carriageway with central median ───
      // near footpath (compound side) + kerb — south extent follows S_OUT
      pb(cBag, 'pave', 22280, 23820, S_OUT - 30, 24000, 0.006, 0.055);
      pb(cBag, 'pave', 23820, 23950, S_OUT - 30, 24000, 0.004, 0.062); // kerb
      // near carriageway (2 lanes) between kerb and median
      pb(cBag, 'road', 23950, 29950, -20000, 38000, 0.004, 0.012);
      // central median / divider (raised concrete with curbs + greenery)
      pb(cBag, 'concrete', 29950, 32450, -20000, 38000, 0.004, 0.020);   // median deck
      pb(cBag, 'copingLight', 29932, 29950, -20000, 38000, 0.020, 0.20); // west curb
      pb(cBag, 'copingLight', 32450, 32468, -20000, 38000, 0.020, 0.20); // east curb
      // far carriageway (2 lanes) between median and far kerb
      pb(cBag, 'road', 32450, 38450, -20000, 38000, 0.004, 0.012);
      // far kerb + footpath
      pb(cBag, 'pave', 38450, 38580, -20000, 38000, 0.004, 0.062);       // far kerb
      pb(cBag, 'pave', 38580, 40120, -20000, 38000, 0.006, 0.055);       // far footpath
      // lane markings: dashed lane dividers + solid median/edge lines
      for (let ly = -19000; ly < 37000; ly += 3200) {
        pb(cBag, 'roadLine', 26890, 26910, ly, ly + 1800, 0.011, 0.018); // near lane divider
        pb(cBag, 'roadLine', 35390, 35410, ly, ly + 1800, 0.011, 0.018); // far lane divider
      }
      for (let ly = -19800; ly < 37800; ly += 600)
        pb(cBag, 'roadLine', 29965, 29985, ly, ly + 300, 0.011, 0.018);   // median W edge (solid)
      for (let ly = -19800; ly < 37800; ly += 600)
        pb(cBag, 'roadLine', 32415, 32435, ly, ly + 300, 0.011, 0.018);   // median E edge (solid)
      /* No streetlights. The owner asked for the street furniture to come off:
         the poles stood directly in front of the east elevation and read as
         clutter from every presentation angle. The kerbs, footpaths and
         carriageways they stood on are all still here. */
      // median greenery: low shrubs softening the divider
      for (let my = -18000; my < 36000; my += 6000)
        plantShrub(cBag, 31200, my, 0.4, (my % 12000 < 6000) ? 'green' : 'ixora', 0.02);
      // ─── South road (corner-plot frontage) — shifted 1 ft with south wall ───
      // Was: footpath -2470..-930, kerb -2600..-2470, road N-edge -2600.
      // Delta −305 mm (1 ft south).
      const FP_N = S_OUT - 30;       // -1235: footpath north edge (just outside wall)
      const FP_S = FP_N - 1540;      // -2775: footpath south edge (same width as before)
      const KB_N = FP_S;             // kerb north = footpath south
      const KB_S = KB_N - 130;       // -2905: kerb south
      const RD_N = KB_S;             // road north edge
      const RD_S = -9905;            // road south (was -9600, +1 ft)
      pb(cBag, 'pave', -6000, 24000, FP_S, FP_N, 0.006, 0.055);
      pb(cBag, 'pave', -6000, 24000, KB_S, KB_N, 0.004, 0.062); // kerb
      pb(cBag, 'road', -20000, 29950, RD_S, RD_N, 0.004, 0.012);
      // dashed centre line on south road
      const midY = (RD_S + RD_N) / 2;
      for (let lx = -19000; lx < 30000; lx += 3200)
        pb(cBag, 'roadLine', lx, lx + 1800, midY - 90, midY + 90, 0.010, 0.017);
      /* No neighbour houses either. The three generic plaster masses to the
         north and south were backdrop filler, and beside a plan-faithful model
         they read as exactly that. nbrHouse() is deliberately left defined
         (with the nbr1/nbr2/nbr3 palette keys) so the site context can be put
         back in three lines if it is ever wanted again. */
    })();
    const context = cBag.build(THREE, materials); context.name = 'context'; root.add(context);

    /* style: optional { post, spindle, rail } material keys — interior uses wood/brass */
    function stairRailing(bag, dir, fc, startA, sign, tread, n, baseH, rise, h, style) {
      h = h || 0.95;
      const postM = (style && style.post) || 'ms';
      const spinM = (style && style.spindle) || 'ms';
      const railM = (style && style.rail) || 'ms';
      const posts = [];
      for (let i = 0; i <= n; i++) {
        const stepH = baseH + i * rise;
        const a = startA + sign * i * tread;
        posts.push({ a, y: stepH });
        const collarM = (style && style.rail) || 'steel';
        if (dir === 'x') {
          pb(bag, postM, a - 12, a + 12, fc - 12, fc + 12, stepH, stepH + h);
          if (style) pb(bag, collarM, a - 14, a + 14, fc - 14, fc + 14, stepH + h - 0.03, stepH + h);
        } else {
          pb(bag, postM, fc - 12, fc + 12, a - 12, a + 12, stepH, stepH + h);
          if (style) pb(bag, collarM, fc - 14, fc + 14, a - 14, a + 14, stepH + h - 0.03, stepH + h);
        }
      }
      const k = tread > 300 ? 3 : 2;
      for (let i = 1; i <= n; i++) {
        const a_prev = startA + sign * (i - 1) * tread;
        const treadH = baseH + i * rise;
        for (let j = 1; j < k; j++) {
          const a = a_prev + (sign * j * tread) / k;
          const spindleBase = treadH;
          const spindleTop = baseH + (i - 1) * rise + (j / k) * rise + h;
          if (dir === 'x') {
            pb(bag, spinM, a - 5, a + 5, fc - 5, fc + 5, spindleBase, spindleTop);
          } else {
            pb(bag, spinM, fc - 5, fc + 5, a - 5, a + 5, spindleBase, spindleTop);
          }
        }
      }
      const hSize = style ? 42 : 35;
      const thickness = style ? 28 : 24;
      for (let i = 0; i < posts.length - 1; i++) {
        const p1 = posts[i], p2 = posts[i + 1];
        const midA = (p1.a + p2.a) / 2;
        const midY = (p1.y + p2.y) / 2 + h;
        const len = Math.abs(p2.a - p1.a) / 1000;
        const riseAmt = p2.y - p1.y;
        const dist = Math.sqrt(len * len + riseAmt * riseAmt);
        if (dir === 'x') {
          const angle = Math.atan2(riseAmt, sign * len);
          bag.box(railM, midA / 1000, midY, -fc / 1000, dist, hSize / 1000, thickness / 1000, 0, 0, angle);
        } else {
          const angle = -Math.atan2(riseAmt, -sign * len);
          bag.box(railM, fc / 1000, midY, -midA / 1000, thickness / 1000, hSize / 1000, dist, angle, 0, 0);
        }
      }
    }

    // Interior stair finish kit (wood treads, soft risers, brass rail)
    const STAIR_IN = { tread: 'woodF', riser: 'white2' };
    const RAIL_IN = { post: 'charDark', spindle: 'steel', rail: 'brass' };
    // Exterior stair handrail — dark posts, stainless rail (matches balcony rails)
    const RAIL_OUT = { post: 'ms', spindle: 'ms', rail: 'steel' };

    /* helpers reused by exterior + floors */
    /** East wall + middle wall stair geometry under flight 1 */
    function stairWalls(bag, numSteps) {
      // East: plaster to FF. Ribbon sits just above the landing — three
      // equal ~1.05 m lights, 55 mm frames (same family as the windows),
      // 300 mm plaster cheeks, thin stone sill.
      const y0 = 230, y1 = towY[1];
      const inset = 300, jamb = 55, mull = 36;
      const z0 = LAND_E + 0.08, z1 = LAND_E + 0.64;
      const a0 = y0 + inset, a1 = y1 - inset;
      pb(bag, 'white', 16300, 16600, y0, y1, 0, z0);
      pb(bag, 'white', 16300, 16600, y0, y1, z1, L.f1);
      pb(bag, 'white', 16300, 16600, y0, a0, z0, z1);
      pb(bag, 'white', 16300, 16600, a1, y1, z0, z1);
      // Top at LAND_E + 0.006, not + 0.012. The landing tile below
      // (balcTile, x 14540–16330, y 180–1000) also tops out at LAND_E + 0.012,
      // and the two overlap 38 mm in x by 778 mm in y. Coplanar up-facing
      // faces in two different merged meshes and two very different tones
      // (0xf0ece4 vs 0x706d68) — it flickered hard on the landing. Dropping
      // this band 6 mm lets the tile win the overlap outright.
      pb(bag, 'white', 16292, 16608, y0 - 8, y1 + 8, LAND_E - 0.018, LAND_E + 0.006);
      const f0 = a0 - jamb, f1 = a1 + jamb;
      const hz0 = z0 - 0.045, hz1 = z1 + 0.045;
      pb(bag, 'frame', 16515, 16610, f0, a0, hz0, hz1);
      pb(bag, 'frame', 16515, 16610, a1, f1, hz0, hz1);
      pb(bag, 'frame', 16515, 16610, f0, f1, hz0, z0);
      pb(bag, 'frame', 16515, 16610, f0, f1, z1, hz1);
      const inner = a1 - a0;
      for (let k = 1; k <= 2; k++) {
        const c = a0 + (inner * k) / 3;
        pb(bag, 'frame', 16522, 16602, c - mull / 2, c + mull / 2, z0, z1);
      }
      pb(bag, 'glass', 16335, 16582, a0, a1, z0, z1);
      pb(bag, 'stone', 16505, 16628, f0 - 8, f1 + 8, hz0 - 0.028, hz0);
      // Middle wall to close the gap between flights (still follows treads)
      for (let i = 1; i <= numSteps; i++) {
        const stepH = L.porticoFl + i * RISE_E;
        const yA = 3890 - (i - 1) * 237.5, yB = 3890 - i * 237.5;
        const lo = Math.min(yA, yB), hi = Math.max(yA, yB);
        pb(bag, 'white', 15400, 15470, lo, hi, 0, stepH);
      }
    }

    /**
     * FF void guardrails — deck edges of the stair hole only.
     * STAMP: STAIR_RAIL_FIX_20260812f
     *
     *   xW = VOID_WX+50 (~14320)  main-deck edge
     *   xE = VOID_EX-50 (~15350)  outer-deck edge
     *   y  = 1040..3890           open hole (east); west only N of lift
     */
    function externalStairVoidRails(bag, baseH) {
      // Full-width hole: both flights + landing. Guard every deck edge.
      const h = 1.0;
      const inset = 50;
      const xW = VOID_WX + inset;
      const xE = VOID_EX - inset;
      const yS = 230 + inset;
      const yN = 3890 - inset;
      const mouth0 = 14500, mouth1 = 15400;
      railing(bag, 'y', xW, yS, 1040 - inset, baseH, h);
      railing(bag, 'y', xW, LIFT_NY + inset, yN, baseH, h);
      railing(bag, 'y', xE, yS, yN, baseH, h);
      railing(bag, 'x', yS, xW, xE, baseH, h);
      railing(bag, 'x', yN, xW, mouth0 - inset, baseH, h);
      railing(bag, 'x', yN, mouth1 + inset, xE, baseH, h);
      railPillar(bag, xW, yS, baseH, 1.08);
      railPillar(bag, xE, yS, baseH, 1.08);
      railPillar(bag, xW, yN, baseH, 1.08);
      railPillar(bag, xE, yN, baseH, 1.08);
      railPillar(bag, mouth0 - inset, yN, baseH, 1.08);
      railPillar(bag, mouth1 + inset, yN, baseH, 1.08);
    }
    /**
     * External U-stair — climbing rails ON flight edges only.
     * STAMP: STAIR_RAIL_FIX_20260812f
     *
     *   F1 x 15470–16370  south 3890→1040   rail west @15470 (spine)
     *   F2 x 14500–15400  north 1040→3890   rails @14520 and @15380
     *   East exterior: MS bar screen @16380 (from root house).
     */
    function externalStair(bag, full) {
      pb(bag, 'white', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);

      if (full) {
        // ——— Flight 1 (east strip): rail on WEST spine only ———
        // East exterior is the MS bar screen (V4/V5 style), not a second walk-rail.
        stairRailing(bag, 'y', 15470, 3890, -1, 237.5, 12, L.porticoFl, RISE_E, 0.95, RAIL_OUT);

        // ——— Flight 2 (void strip): both open edges ———
        // West edge (toward main / lift) — on flight
        stairRailing(bag, 'y', 14520, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);
        // East edge (toward void E / outer deck) — on flight, 20 mm inside x=15400
        // Void deck rail sits separately at VOID_EX-50 ≈ 15350
        stairRailing(bag, 'y', 15380, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);

        // ——— Mid landing (LAND_E): three open sides; east against wall ———
        railing(bag, 'x', 1040, 14500, 15470, LAND_E, 0.95); // north
        railing(bag, 'x', 180, 14500, 16300, LAND_E, 0.95);  // south
        railing(bag, 'y', 14500, 180, 1040, LAND_E, 0.95);   // west

        // ——— FF arrival: short spine between F2-east and F1-spine ———
        railing(bag, 'x', 3860, 15380, 15470, L.f1, 0.95);

        stairWalls(bag, 12);
      }

      // Structure
      flight(bag, 'concrete', 'y', 15470, 16370, 3890, -1, 237.5, 12, L.porticoFl, RISE_E);
      pb(bag, 'concrete', 14500, 16370, 140, 1040, LAND_E - 0.32, LAND_E);
      pb(bag, 'balcTile', 14540, 16330, 180, 1000, LAND_E, LAND_E + 0.012);
      flight(bag, 'concrete', 'y', 14500, 15400, 1040, 1, 237.5, 12, LAND_E, RISE_E);
      pb(bag, 'balcTile', 15490, 16350, 1040, 1277, LAND_E - 0.004, LAND_E - 0.001);
      pb(bag, 'balcTile', 14520, 15380, 3652, 3890, L.f1 - 0.008, L.f1 - 0.002);
    }
    function liftTower(bag, topH, doors, botH) {
      // Shaft shell (white plaster — matches main building). botH defaults to 0 (full tower for exterior).
      // Dollhouse floors pass the floor datum so only that storey band is drawn.
      if (botH === undefined || botH === null) botH = 0;
      // Entrances are bright stainless portals so they read clearly on every landing.
      pb(bag, 'white', liftOX[0], liftOX[1], liftOY[0], liftOY[0] + 230, botH, topH); // south
      pb(bag, 'eastPlaster', 14040, 14270, 230, liftOY[1], botH, topH);               // east

      const nY0 = 1805, nY1 = 2035;                 // north wall thickness band
      const midX = 13345;
      const clearW = 980;
      const dx0 = midX - clearW / 2, dx1 = midX + clearW / 2; // 12855 .. 13835
      const doorH = 2.10;                           // clear leaf height
      const portalH = 2.30;                         // incl. head frame

      // North wall flanks — door bays are cut in per landing
      pb(bag, 'white', liftOX[0], dx0, nY0, nY1, botH, topH);
      pb(bag, 'white', dx1, liftOX[1], nY0, nY1, botH, topH);

      let cur = botH;
      for (const dl of doors) {
        // Skip portals outside this height band (multi-door full tower uses all)
        if (dl + portalH < botH - 0.01 || dl > topH + 0.01) continue;
        // spandrel below this landing's sill (matches shaft)
        if (dl > cur + 0.001) pb(bag, 'white', dx0, dx1, nY0, nY1, cur, dl);

        // --- Stainless portal (identical on every floor) ---
        // Outer face is nY1; steel surround sits proud so doors read clearly.
        const faceOut = nY1 + 30;   // portal face proud of charcoal
        const faceIn  = nY1 - 50;   // door leaf rear
        const backY0  = nY0 + 15;   // solid backer blocks black shaft void

        // Jambs + head (steel surround)
        pb(bag, 'liftSteel', dx0 - 55, dx0 + 18, nY1 - 10, faceOut, dl, dl + portalH);
        pb(bag, 'liftSteel', dx1 - 18, dx1 + 55, nY1 - 10, faceOut, dl, dl + portalH);
        pb(bag, 'liftSteel', dx0 - 55, dx1 + 55, nY1 - 10, faceOut, dl + doorH, dl + portalH);
        // Threshold / sill plate
        pb(bag, 'liftSteel', dx0 - 30, dx1 + 30, nY1 - 90, faceOut + 15, dl, dl + 0.045);
        // Landing floor plate in the doorway band
        pb(bag, 'liftSteel', dx0 + 5, dx1 - 5, nY0, nY1, dl, dl + 0.02);

        // Solid door leaves — bright metal, nearly flush with outer face
        const seam = 6;
        pb(bag, 'liftDoor', dx0 + 22, midX - seam, faceIn, nY1 + 8, dl + 0.045, dl + doorH - 0.01);
        pb(bag, 'liftDoor', midX + seam, dx1 - 22, faceIn, nY1 + 8, dl + 0.045, dl + doorH - 0.01);
        // Center meeting stile
        pb(bag, 'liftChrome', midX - seam, midX + seam, faceIn + 5, nY1 + 12, dl + 0.045, dl + doorH - 0.01);

        // Horizontal door rails (readable paneling, not a flat dark slab)
        for (const hy of [0.22, 1.00, 1.78]) {
          pb(bag, 'liftSteel', dx0 + 40, midX - seam - 8, nY1 + 2, nY1 + 14, dl + hy, dl + hy + 0.035);
          pb(bag, 'liftSteel', midX + seam + 8, dx1 - 40, nY1 + 2, nY1 + 14, dl + hy, dl + hy + 0.035);
        }
        // Vertical edge stiles on each leaf
        pb(bag, 'liftSteel', dx0 + 22, dx0 + 40, nY1 + 2, nY1 + 14, dl + 0.045, dl + doorH - 0.01);
        pb(bag, 'liftSteel', midX - seam - 22, midX - seam - 6, nY1 + 2, nY1 + 14, dl + 0.045, dl + doorH - 0.01);
        pb(bag, 'liftSteel', midX + seam + 6, midX + seam + 22, nY1 + 2, nY1 + 14, dl + 0.045, dl + doorH - 0.01);
        pb(bag, 'liftSteel', dx1 - 40, dx1 - 22, nY1 + 2, nY1 + 14, dl + 0.045, dl + doorH - 0.01);

        // Pull handles (chrome vertical bars near center)
        pb(bag, 'liftChrome', midX - 58, midX - 42, nY1 + 6, faceOut + 8, dl + 0.88, dl + 1.38);
        pb(bag, 'liftChrome', midX + 42, midX + 58, nY1 + 6, faceOut + 8, dl + 0.88, dl + 1.38);

        // Opaque backer behind leaves — no black shaft void shows through
        pb(bag, 'liftSteel', dx0 + 12, dx1 - 12, backY0, faceIn - 4, dl + 0.02, dl + doorH);

        // Call-button plate on right outer jamb (same on every landing)
        pb(bag, 'liftSteel', dx1 + 58, dx1 + 105, nY1, faceOut + 5, dl + 0.95, dl + 1.40);
        pb(bag, 'liftChrome', dx1 + 70, dx1 + 93, faceOut + 5, faceOut + 14, dl + 1.08, dl + 1.16);
        pb(bag, 'liftChrome', dx1 + 70, dx1 + 93, faceOut + 5, faceOut + 14, dl + 1.22, dl + 1.30);

        cur = dl + portalH;
      }
      // spandrel above the top portal
      if (topH > cur + 0.001) pb(bag, 'white', dx0, dx1, nY0, nY1, cur, topH);
    }

    function columnsEast(bag, topH, botH) {
      // Two-colour plus: gray east–west arm, ivory north–south wings.
      // From the east elevation the column reads gray-in-the-middle,
      // white on both sides — both paints, one piece of geometry.
      // Gray stone base, steel storey collars, light coping.
      if (botH === undefined || botH === null) botH = 0;
      const gap = 0.018;
      const baseH = 0.42;
      const capH = 0.18;
      const shaftBot = botH + gap + baseH;
      const collars = [L.f1, L.f2];
      for (const cy of [8720, 4290, 150]) {
        // All three east columns stop under the SF deck. The SE terrace
        // is cut for the pergola; nothing stands through that sit-out.
        const colTop = Math.min(topH, L.f2 - L.slabT);
        const shaftTop = Math.max(shaftBot + 0.08, colTop - capH);
        pb(bag, 'charDark', 16315, 16585, cy - 135, cy + 135, botH, botH + gap);
        pb(bag, 'charcoal', 16300, 16600, cy - 150, cy + 150, botH + gap, shaftBot - 0.018);
        pb(bag, 'charDark', 16288, 16612, cy - 162, cy + 162, shaftBot - 0.018, shaftBot);
        // gray E–W arm — the street face (slimmer ribbon)
        pb(bag, 'charcoal', 16320, 16580, cy - 44, cy + 44, shaftBot, shaftTop);
        // ivory N–S wings — set 12 mm behind so they read as plus arms
        pb(bag, 'white2', 16332, 16568, cy - 168, cy + 168, shaftBot, shaftTop);
        for (const z of collars) {
          if (z <= shaftBot + 0.05 || z >= shaftTop - 0.05) continue;
          pb(bag, 'charDark', 16310, 16590, cy - 162, cy + 162, z - 0.030, z + 0.008);
          pb(bag, 'steel', 16304, 16596, cy - 166, cy + 166, z + 0.008, z + 0.020);
        }
        pb(bag, 'charDark', 16288, 16612, cy - 162, cy + 162, shaftTop, shaftTop + 0.018);
        pb(bag, 'charcoal', 16300, 16600, cy - 150, cy + 150, shaftTop + 0.018, colTop - 0.022);
        pb(bag, 'copingLight', 16278, 16622, cy - 172, cy + 172, colTop - 0.022, colTop);
      }
    }

    function drawSFSlab(bag, h0, h1) {
      // Y = -762 to 230
      pb(bag, 'white', 0, 17362, -762, 230, h0, h1);
      // Y = 230 to 1805 (lift cutout at X = 12650..14040)
      pb(bag, 'white', 0, 12650, 230, 1805, h0, h1);
      pb(bag, 'white', 14040, 17362, 230, 1805, h0, h1);
      // Y = 1805 to 6000
      pb(bag, 'white', 0, 17362, 1805, 6000, h0, h1);
      // Y = 6000 to 6496 (duplex cutout X = 6020..8241, staircase is solid here)
      pb(bag, 'white', 0, 6020, 6000, 6496, h0, h1);
      pb(bag, 'white', 8241, 17362, 6000, 6496, h0, h1);
      // Y = 6496 to 8641 (staircase cutout X = 230..4630, duplex cutout X = 6020..8241)
      pb(bag, 'white', 0, 230, 6496, 8641, h0, h1);
      pb(bag, 'white', 4630, 6020, 6496, 8641, h0, h1);
      pb(bag, 'white', 8241, 17362, 6496, 8641, h0, h1);
      // Y = 8641 to Y1n
      pb(bag, 'white', 0, 17362, 8641, Y1n, h0, h1);
    }

    function drawSFTiles(bag, mat, h0, h1) {
      // Y = -732 to 230
      pb(bag, mat, 30, 17332, -732, 230, h0, h1);
      // Y = 230 to 1805
      pb(bag, mat, 30, 12650, 230, 1805, h0, h1);
      pb(bag, mat, 14040, 17332, 230, 1805, h0, h1);
      // Y = 1805 to 6000
      pb(bag, mat, 30, 17332, 1805, 6000, h0, h1);
      // Y = 6000 to 6496 (duplex cutout X = 6020..8241, staircase is solid here)
      pb(bag, mat, 30, 6020, 6000, 6496, h0, h1);
      pb(bag, mat, 8241, 17332, 6000, 6496, h0, h1);
      // Y = 6496 to 8641 (staircase cutout X = 230..4630, duplex cutout X = 6020..8241)
      pb(bag, mat, 30, 230, 6496, 8641, h0, h1);
      pb(bag, mat, 4630, 6020, 6496, 8641, h0, h1);
      pb(bag, mat, 8241, 17332, 6496, 8641, h0, h1);
      // Y = 8641 to Y1n - 30
      pb(bag, mat, 30, 17332, 8641, Y1n - 30, h0, h1);
    }

    function drawSFSoffit(bag, h0, h1) {
      // Y = -702 to 230
      pb(bag, 'charDark', 60, 17302, -702, 230, h0, h1);
      // Y = 230 to 1805
      pb(bag, 'charDark', 60, 12650, 230, 1805, h0, h1);
      pb(bag, 'charDark', 14040, 17302, 230, 1805, h0, h1);
      // Y = 1805 to 6000
      pb(bag, 'charDark', 60, 17302, 1805, 6000, h0, h1);
      // Y = 6000 to 6496 (duplex cutout X = 6020..8241, staircase is solid here)
      pb(bag, 'charDark', 60, 6020, 6000, 6496, h0, h1);
      pb(bag, 'charDark', 8241, 17302, 6000, 6496, h0, h1);
      // Y = 6496 to 8641 (staircase cutout X = 230..4630, duplex cutout X = 6020..8241)
      pb(bag, 'charDark', 60, 230, 6496, 8641, h0, h1);
      pb(bag, 'charDark', 4630, 6020, 6496, 8641, h0, h1);
      pb(bag, 'charDark', 8241, 17302, 6496, 8641, h0, h1);
      // Y = 8641 to Y1n - 60
      pb(bag, 'charDark', 60, 17302, 8641, Y1n - 60, h0, h1);
    }

    function drawFFSlab(bag, h0, h1) {
      // Y = -762 to 230 — full south / portico-top
      pb(bag, 'white', 0, 17362, -762, 230, h0, h1);
      // Y = 230 to 1040 — lift roof; void over landing + east flight; east strip
      pb(bag, 'white', 0, 12650, 230, 1040, h0, h1);
      pb(bag, 'white', 14040, VOID_WX, 230, 1040, h0, h1);
      pb(bag, 'white', VOID_EX, 17362, 230, 1040, h0, h1);
      // Y = 1040 to LIFT_NY — lift cutout + stair void to VOID_EX; outer deck from VOID_EX
      pb(bag, 'white', 0, 12650, 1040, LIFT_NY, h0, h1);
      pb(bag, 'white', VOID_EX, 17362, 1040, LIFT_NY, h0, h1);
      // Y = LIFT_NY to 3890 — balcony to void west (lift tower ends); void; outer deck
      pb(bag, 'white', 0, VOID_WX, LIFT_NY, 3890, h0, h1);
      pb(bag, 'white', VOID_EX, 17362, LIFT_NY, 3890, h0, h1);
      // Y = 3890 to Y1n — continuous deck (stair arrival opens onto this)
      pb(bag, 'white', 0, 17362, 3890, Y1n, h0, h1);
    }

    function drawFFTiles(bag, mat, h0, h1) {
      // South balcony (west of service bands)
      pb(bag, mat, 30, 4805, -732, 0, h0, h1);
      // South/East portico-top (Y = -732 to 230)
      pb(bag, mat, 12650, 17332, -732, 230, h0, h1);
      // Lift roof + east strip (landing / east flight are void)
      pb(bag, mat, 14040, VOID_WX - 20, 230, 1040, h0, h1);
      pb(bag, mat, VOID_EX + 20, 17332, 230, 1040, h0, h1);
      // Outer east deck beside stair void (Y = 1040 to 3890)
      pb(bag, mat, VOID_EX + 20, 17332, 1040, 3890, h0, h1);
      // East balcony corridor north of lift (Y = LIFT_NY to 3890), house face → void west
      pb(bag, mat, 12680, VOID_WX - 20, LIFT_NY, 3890, h0, h1);
      // North deck (Y = 3890 to Y1n - 30), continuous including stair head
      pb(bag, mat, 30, 17332, 3890, Y1n - 30, h0, h1);
    }

    /* ======== EXTERIOR group ======== */
    const eBag = makeBag(THREE);
    (function exterior() {
      // Kadapa sock — the lime box stands on stone, not pale plaster.
      pb(eBag, 'charDark', X0 - 45, X1 + 45, Y0n - 45, Y1n + 45, 0, L.f0);
      pb(eBag, 'concrete', X0 - 52, X1 + 52, Y0n - 52, Y1n + 52, L.f0, L.f0 + 0.022);
      // exterior shell walls per floor
      const floors = [
        { fY: L.f0, h1: L.f1, sch: OPEN.f0 },
        { fY: L.f1, h1: L.f2, sch: OPEN.f1 },
        { fY: L.f2, h1: L.roof, sch: OPEN.f2 }
      ];
      for (const fl of floors) {
        const door = o => ({ c: o.c, w: o.w, sill: o.sill, h: o.h });
        const Eops = fl.sch.E.map(door), Nops = fl.sch.N.map(door),
              Sops = fl.sch.S.map(door), Wops = fl.sch.W.map(door);
        // FF only: south shell stops at the utility west wall (x>4805 is the
        // service band, walled at y -762..-646) and the east shell starts above
        // the wet-kitchen band (its SE corner wall y -762..1411 is drawn separately)
        const ff = fl.sch === OPEN.f1;
        const sf = fl.sch === OPEN.f2;
        const EBf = sf ? SF_EB : EB;
        const nX1 = sf ? SF_EB[0] : X1 - 230;
        const sX1 = ff ? 4805 : nX1, eY0 = ff ? 1411 : Y0n;
        wallRun(eBag, 'eastPlaster', 'y', eY0, Y1n, EBf[0], EBf[1], fl.fY, fl.h1, fl.fY, Eops);
        wallRun(eBag, 'white', 'x', X0 + 230, nX1, NB[0], NB[1], fl.fY, fl.h1, fl.fY, Nops);
        wallRun(eBag, 'white', 'x', X0 + 230, sX1, SB[0], SB[1], fl.fY, fl.h1, fl.fY, Sops);
        wallRun(eBag, 'white', 'y', Y0n, Y1n, WB[0], WB[1], fl.fY, fl.h1, fl.fY, Wops);
        for (const o of fl.sch.E) glazing(eBag, Object.assign({ face: 'E', band: EBf, floorY: fl.fY }, o));
        for (const o of fl.sch.N) glazing(eBag, Object.assign({ face: 'N', band: NB, floorY: fl.fY }, o));
        for (const o of fl.sch.S) glazing(eBag, Object.assign({ face: 'S', band: SB, floorY: fl.fY }, o));
        for (const o of fl.sch.W) glazing(eBag, Object.assign({ face: 'W', band: WB, floorY: fl.fY }, o));
      }
      // SF: the lift shaft's west wall stays on the old house line.
      pb(eBag, 'eastPlaster', EB[0], EB[1], liftOY[0], liftOY[1], L.f2, L.roof);
      // FF south service bands (utility x 4920..8135 + common bath x 8250..9370
      // + wet kitchen x 9486..12420): dining slider back wall, west cheek,
      // cbath walls, divider, SE east wall with grill door, weather-secured
      // outer wall at y -762..-646 (utility grill, cbath vent, wet-kitchen grill)
      wallRun(eBag, 'white', 'x', 6595, 9370, 1377, 1526, L.f1, L.f2, L.f1,
              [{ c: 7350, w: 1200, sill: 0, h: 2400 }]);
      glazing(eBag, { face: 'S', band: [1377, 1526], floorY: L.f1, c: 7350, w: 1200, sill: 0, h: 2400, type: 'slider', panes: 2 });
      wallRun(eBag, 'white', 'y', -646, 232, 4805, 4920, L.f1, L.f2, L.f1,
              [{ c: -207, w: 800, sill: 0, h: 2400 }]); // utility west wall + SW grill door to the balcony
      glazing(eBag, { face: 'W', band: [4805, 4920], floorY: L.f1, c: -207, w: 800, sill: 0, h: 2400, type: 'grill', door: true });
      wallRun(eBag, 'white', 'y', -646, 1377, 8135, 8250, L.f1, L.f2, L.f1,
              [{ c: 1000, w: 700, sill: 0, h: 2100 }]); // utility | cbath wall + door
      pb(eBag, 'white', 9370, 9486, -646, 1411, L.f1, L.f2); // cbath | wet kitchen divider
      wallRun(eBag, 'eastPlaster', 'y', -762, 1411, EB[0], EB[1], L.f1, L.f2, L.f1,
              [{ c: -300, w: 600, sill: 0, h: 2400 }]); // SE corner east wall (grill door leaf from OPEN.f1.E)
      wallRun(eBag, 'white', 'x', 4805, 12420, -762, -646, L.f1, L.f2, L.f1,
              [{ c: 6527, w: 3215, sill: 900, h: 1400 }, { c: 8810, w: 600, sill: 1700, h: 600 }, { c: 11205, w: 2430, sill: 900, h: 1400 }]);
      glazing(eBag, { face: 'S', band: [-762, -646], floorY: L.f1, c: 6527, w: 3215, sill: 900, h: 1400, type: 'grill' });
      glazing(eBag, { face: 'S', band: [-762, -646], floorY: L.f1, c: 8810, w: 600, sill: 1700, h: 600, type: 'win', panes: 1 });
      glazing(eBag, { face: 'S', band: [-762, -646], floorY: L.f1, c: 11205, w: 2430, sill: 900, h: 1400, type: 'grill' });
      // Service-band floor tiles live on outdoor1 (dollhouse floor amenity group)
      // Terrace edge: NO solid parapet wall — open metal railings like FF/SF balconies.
      // Thin slab fascia (same language as outdoor decks) + railing @ L.roof.
      (function terraceOpenRails() {
        const rt = L.roof;
        const rh = 1.0;
        // Outer extents (match former parapet outer faces / terrace slab edge)
        const yS = -762;
        const yN = 9870;
        const xW = 80;
        const xE = eastX[1] - 80;
        // Edge fascia. Every terrace lip stops at the lift east face.
        // East of SHELTER_X is pergola, not slab.
        pb(eBag, 'white', 0, ROOF_EX + 10, yN - 90, yN + 10, rt - 0.45, rt + 0.012);
        pb(eBag, 'white', 0, ROOF_EX + 10, yS - 10, yS + 90, rt - 0.45, rt + 0.012);
        pb(eBag, 'white', 0, 100, yS, yN, rt - 0.45, rt + 0.012);
        pb(eBag, 'white', ROOF_EX - 90, ROOF_EX + 10, yS - 10, yN, rt - 0.45, rt + 0.012);
        pb(eBag, 'charDark', 0, ROOF_EX + 12, yN - 96, yN + 14, rt - 0.24, rt - 0.18);
        pb(eBag, 'charDark', 0, ROOF_EX + 12, yS - 14, yS + 96, rt - 0.24, rt - 0.18);
        pb(eBag, 'charDark', -6, 106, yS, yN, rt - 0.24, rt - 0.18);
        pb(eBag, 'charDark', ROOF_EX - 96, ROOF_EX + 14, yS - 14, yN, rt - 0.24, rt - 0.18);
        // Terrace parapet sits ON the deck — same L as V25.
        // Everything below the terrace was flushed to the fascia lip (east
        // 17372, south -772), but the parapet kept the old projecting lines:
        // patternedParapet's face landed on 17404 and edgeWall's on -837, so
        // the parapet overhung the wall plane by 32 mm east and 65 mm south
        // with a raw soffit under it — and because the two overhangs are
        // different depths, the SE corner stepped instead of turning. Both
        // runs now sit on the flushed plane and the patterned bay reaches
        // the south face, so the corner closes. Copings and plinths keep
        // their own designed projection; that is the drip, not a mismatch.
        const PARA_XOUT = eastX[1] + 8;     // 17370 → faceSlab lands on 17372
        const PARA_XIN = PARA_XOUT - 230;   // 17140
        const PARA_SFC = yS + 65;           // -697 → 150 wall face lands on -772
        const PARA_YS = yS - 10;            //  -772 flushed south plane
        const CUT_X = SHELTER_X;
        edgeWall(eBag, 'x', PARA_SFC, 0, ROOF_EX - 80, rt, 1.08);     // south
        edgeWall(eBag, 'y', ROOF_EX - 80, PARA_YS, yN - 80, rt, 1.08); // east, straight, on the lift's west wall
        edgeWall(eBag, 'x', yN - 80, xW, ROOF_EX - 80, rt, 1.08);       // north
        edgeWall(eBag, 'y', xW, PARA_YS, yN - 80, rt, 1.08);          // west
        railPillar(eBag, xW, PARA_SFC, rt, 1.08);
        railPillar(eBag, xW, yN - 80, rt, 1.08);
        // East parapet stays one flat run end to end — no pillars on it.
      })();

      // terrace floor with cutouts for stairwell and lift shaft
      /* Terrace finish sits 5 mm PROUD of the structural roof slab, whose top
         is also at L.roof. Flush, the two planes are coincident and the winner
         is decided by draw order, which flips as the camera orbits — the deck
         swapped between limestone and white plaster mid-turn. Matches the fix in
         the root houseScene.js; see the longer note there. */
      pb(eBag, 'terraceF', 150, ROOF_EX, 150, 230, L.roof - 0.055, L.roof + 0.005);
      pb(eBag, 'terraceF', 150, ROOF_EX, 230, 1805, L.roof - 0.055, L.roof + 0.005);
      pb(eBag, 'terraceF', 150, ROOF_EX, 1805, EAST_RAFTER_YE, L.roof - 0.055, L.roof + 0.005);
      pb(eBag, 'terraceF', 150, ROOF_EX, EAST_RAFTER_YE, 6496, L.roof - 0.055, L.roof + 0.005);
      pb(eBag, 'terraceF', 150, 230, 6496, 8641, L.roof - 0.055, L.roof + 0.005);
      pb(eBag, 'terraceF', 5600, ROOF_EX, 6496, 8641, L.roof - 0.055, L.roof + 0.005);
      pb(eBag, 'terraceF', 150, ROOF_EX, 8641, Y1n, L.roof - 0.055, L.roof + 0.005);
      pb(eBag, 'terraceF', 150, ROOF_EX, Y1n, 9720, L.roof - 0.055, L.roof + 0.005);
      pb(eBag, 'terraceF', 150, ROOF_EX, -612, 150, L.roof - 0.055, L.roof + 0.005);
      // mumty (stair head, expanded to x=5600 and aligned with walls below)
      const mx = [230, 5600], my = [6496, 8641];
      wallRun(eBag, 'white', 'x', mx[0] - 230, mx[1] + 115, my[0] - 115, my[0], L.roof, L.roof + 2.55, L.roof, []);
      wallRun(eBag, 'white', 'x', mx[0] - 230, mx[1] + 115, my[1], my[1] + 229, L.roof, L.roof + 2.55, L.roof,
              [{ c: 3500, w: 700, sill: 1300, h: 700 }]);
      glazing(eBag, { face: 'N', band: [my[1], my[1] + 229], floorY: L.roof, c: 3500, w: 700, sill: 1300, h: 700, type: 'win', panes: 1 });
      wallRun(eBag, 'white', 'y', my[0] - 115, my[1] + 229, mx[0] - 230, mx[0], L.roof, L.roof + 2.55, L.roof, []);
      wallRun(eBag, 'eastPlaster', 'y', my[0] - 115, my[1] + 229, mx[1], mx[1] + 115, L.roof, L.roof + 2.55, L.roof,
              [{ c: 7560, w: 900, sill: 0, h: 2150 }]);
      glazing(eBag, { face: 'E', band: [mx[1], mx[1] + 115], floorY: L.roof, c: 7560, w: 900, sill: 0, h: 2150, type: 'door' });
      // Mumty architectural glass roof system (industry standard laminated safety glass + structural steel grid):
      const zMTop = L.roof + 2.55;
      const mX0 = mx[0] - 230, mX1 = mx[1] + 115; // 0 .. 5715
      const mY0 = my[0] - 115, mY1 = my[1] + 229; // 6381 .. 8870

      // 1. Reinforced concrete parapet upstand curb (90 mm curb height above wall top)
      pb(eBag, 'white', mX0, mX1, mY0, my[0], zMTop, zMTop + 0.09);
      pb(eBag, 'white', mX0, mX1, my[1], mY1, zMTop, zMTop + 0.09);
      pb(eBag, 'white', mX0, mx[0], my[0], my[1], zMTop, zMTop + 0.09);
      pb(eBag, 'white', mx[1], mX1, my[0], my[1], zMTop, zMTop + 0.09);

      // 2. Weatherproof dark metal coping & drip flashing on concrete curb
      pb(eBag, 'charDark', mX0 - 24, mX1 + 24, mY0 - 24, my[0] + 12, zMTop + 0.088, zMTop + 0.118);
      pb(eBag, 'charDark', mX0 - 24, mX1 + 24, my[1] - 12, mY1 + 24, zMTop + 0.088, zMTop + 0.118);
      pb(eBag, 'charDark', mX0 - 24, mx[0] + 12, my[0], my[1], zMTop + 0.088, zMTop + 0.118);
      pb(eBag, 'charDark', mx[1] - 12, mX1 + 24, my[0], my[1], zMTop + 0.088, zMTop + 0.118);

      // 3. Structural steel sub-frame: 4 transverse I/box rafters + longitudinal center purlin
      for (const rx of [1250, 2350, 3450, 4550]) {
        pb(eBag, 'frame', rx - 35, rx + 35, mY0 + 10, mY1 - 10, zMTop + 0.06, zMTop + 0.155);
        pb(eBag, 'steel', rx - 18, rx + 18, mY0 - 15, mY1 + 15, zMTop + 0.155, zMTop + 0.180); // top pressure plate
      }
      pb(eBag, 'frame', mX0 + 10, mX1 - 10, 7568 - 30, 7568 + 30, zMTop + 0.06, zMTop + 0.145);
      pb(eBag, 'steel', mX0 - 15, mX1 + 15, 7568 - 16, 7568 + 16, zMTop + 0.155, zMTop + 0.180);

      // 4. Laminated architectural safety glass panels (double glazed / UV tempered)
      pb(eBag, 'glass', mX0 + 10, mX1 - 10, mY0 + 10, mY1 - 10, zMTop + 0.152, zMTop + 0.174);

      // 5. Perimeter glazing clamp profile & weather seal trim
      pb(eBag, 'steel', mX0 - 18, mX1 + 18, mY0 - 18, mY0 + 35, zMTop + 0.155, zMTop + 0.185);
      pb(eBag, 'steel', mX0 - 18, mX1 + 18, mY1 - 35, mY1 + 28, zMTop + 0.155, zMTop + 0.185);
      pb(eBag, 'steel', mX0 - 18, mX0 + 35, mY0, mY1, zMTop + 0.155, zMTop + 0.185);
      pb(eBag, 'steel', mX1 - 35, mX1 + 18, mY0, mY1, zMTop + 0.155, zMTop + 0.185);
      // Mumty interior: floor ONLY on arrival pad (stair void x < 4630 stays open)
      pb(eBag, 'terraceF', 4630, mx[1] - 20, my[0] + 20, my[1] - 20, L.roof, L.roof + 0.02);
      pb(eBag, 'skirt', 4630, mx[1] - 10, my[0] + 10, my[0] + 28, L.roof + 0.02, L.roof + 0.10);
      pb(eBag, 'skirt', 4630, mx[1] - 10, my[1] - 28, my[1] - 10, L.roof + 0.02, L.roof + 0.10);
      pb(eBag, 'skirt', mx[1] - 28, mx[1] - 10, my[0] + 10, my[1] - 10, L.roof + 0.02, L.roof + 0.10);
      // Guard at arrival edge (x=4630) facing the void — does not cross the stair mouth
      railing(eBag, 'y', 4630, 6550, 8600, L.roof, 0.95);
      railing(eBag, 'x', 6550, 250, 4630, L.roof, 0.95);
      railing(eBag, 'x', 8600, 250, 4630, L.roof, 0.95);
      // Wall lamp + switchboard near east door
      pb(eBag, 'charDark', 5480, 5560, 7400, 7520, L.roof + 1.55, L.roof + 1.95);
      pb(eBag, 'steel', 5490, 5550, 7410, 7510, L.roof + 1.60, L.roof + 1.90);
      pb(eBag, 'lamp', 5555, 5585, 7420, 7500, L.roof + 1.65, L.roof + 1.85);
      pb(eBag, 'white2', 5400, 5480, 7600, 7900, L.roof + 1.20, L.roof + 1.55);
      pb(eBag, 'charDark', 5410, 5470, 7620, 7880, L.roof + 1.25, L.roof + 1.50);
      // Storage shelf on south mumty wall
      pb(eBag, 'woodD', 800, 2800, 6550, 6620, L.roof + 1.40, L.roof + 1.48);
      pb(eBag, 'woodF', 820, 2780, 6540, 6555, L.roof + 1.42, L.roof + 1.46);
      // Ceiling downlight ring
      eBag.cyl('steel', 2.9, L.roof + 2.48, -7.55, 0.06, 0.02);
      eBag.cyl('downlight', 2.9, L.roof + 2.46, -7.55, 0.04, 0.03);
      // two water tanks on stands (SW)
      const tanks = [
        { x: 1850, y: 1700 },
        { x: 1850, y: 4100 }
      ];
      for (const tk of tanks) {
        for (const lx of [-1, 1]) for (const ly of [-1, 1])
          pb(eBag, 'charDark', tk.x + lx * 850 - 80, tk.x + lx * 850 + 80, tk.y + ly * 850 - 80, tk.y + ly * 850 + 80, L.roof, L.roof + 0.9);
        pb(eBag, 'charcoal', tk.x - 1080, tk.x + 1080, tk.y - 1080, tk.y + 1080, L.roof + 0.9, L.roof + 1.02);
        eBag.cyl('tank', tk.x / 1000, L.roof + 1.02 + 0.72, -tk.y / 1000, 0.92, 1.44);
        eBag.cyl('tank', tk.x / 1000, L.roof + 1.02 + 1.44 + 0.05, -tk.y / 1000, 0.5, 0.12);
        eBag.cyl('charDark', (tk.x + 600) / 1000, L.roof + 0.55, -(tk.y) / 1000, 0.05, 1.1);
      }

      // solar water heater (South-Central / near SW tanks, Agni zone & scientific flow)
      const shx = 5200, shy = 1850;
      const shTilt = 20 * Math.PI / 180; // 20 degree tilt facing South
      // 1. Tilted solar collector panel
      eBag.box('solarFrm', shx / 1000, L.roof + 0.5, -shy / 1000, 1.62, 0.06, 1.32, shTilt, 0, 0);
      eBag.box('solar', shx / 1000, L.roof + 0.535, -shy / 1000, 1.58, 0.022, 1.28, shTilt, 0, 0);
      // 2. Horizontal hot water storage tank at the top (North end)
      eBag.cyl('tank', shx / 1000, L.roof + 0.96, -2.5, 0.24, 1.8, 0, 0, Math.PI / 2);
      // 3. Supporting frame (mild steel legs)
      // South legs: height from L.roof to lower edge of collector (L.roof + 0.28)
      pb(eBag, 'ms', shx - 780, shx - 700, 1200, 1280, L.roof, L.roof + 0.28);
      pb(eBag, 'ms', shx + 700, shx + 780, 1200, 1280, L.roof, L.roof + 0.28);
      // North legs: height from L.roof to center of tank (L.roof + 0.96)
      pb(eBag, 'ms', shx - 780, shx - 700, 2400, 2480, L.roof, L.roof + 0.96);
      pb(eBag, 'ms', shx + 700, shx + 780, 2400, 2480, L.roof, L.roof + 0.96);

      // solar array, south-east half (Agni zone), 15° tilt facing south, 2 rows x 3 (6 panels)
      const tilt = 15 * Math.PI / 180;
      for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) {
        const px = 8000 + i * 1520, py = 950 + r * 1750;
        eBag.box('solarFrm', px / 1000, L.roof + 0.34, -py / 1000, 1.42, 0.05, 1.02, tilt, 0, 0);
        eBag.box('solar', px / 1000, L.roof + 0.375, -py / 1000, 1.38, 0.022, 0.98, tilt, 0, 0);
        pb(eBag, 'charDark', px - 600, px - 520, py - 380, py + 420, L.roof, L.roof + 0.30);
        pb(eBag, 'charDark', px + 520, px + 600, py - 380, py + 420, L.roof, L.roof + 0.30);
      }

      // Roof terrace: no furniture (open deck only — tanks, solar, mumty remain)

      // East outdoor structure that stays on the exterior shell (full-height,
      // needed for Exterior view + walkthrough silhouette). Portico / balcony
      // *decks* live in separate outdoor0/1/2 groups so floor cutaways can show
      // them without revealing the whole multi-storey shell.
      liftTower(eBag, L.liftTop, [L.porticoFl, L.f1, L.f2]);
      externalStair(eBag, true);
      columnsEast(eBag, L.roof - L.slabT);

      // Terrace slab stops at the lift east face on every bay.
      // East of SHELTER_X is pergola only — no plate.
      pb(eBag, 'white', 0, ROOF_EX, -762, EAST_RAFTER_YE, L.roof - L.slabT, L.roof);
      pb(eBag, 'charDark', 60, ROOF_EX - 60, -702, EAST_RAFTER_YE - 60, L.roof - L.slabT - 0.008, L.roof - L.slabT);
      // Lift roof — its own slab outside the terrace parapet, thin coping lip.
      pb(eBag, 'white', ROOF_EX, liftOX[1], liftOY[0], liftOY[1], L.liftTop - L.slabT, L.liftTop);
      pb(eBag, 'white', ROOF_EX + 230, liftOX[1] - 230, liftOY[0] + 230, liftOY[1] - 230, L.liftTop, L.liftTop + 0.03);
      // SF rain cover for the lift door: the lift roof runs 1200 mm further
      // north as a canopy over the landing, and the lift's east wall follows
      // it down to the SF deck. Stops 44 mm short of the pergola's NW post.
      const LIFT_CANOPY_YN = liftOY[1] + 1200;   // 3235
      pb(eBag, 'white', ROOF_EX, liftOX[1], liftOY[1], LIFT_CANOPY_YN, L.liftTop - L.slabT, L.liftTop);
      pb(eBag, 'charDark', ROOF_EX + 40, liftOX[0] + 1390, liftOY[1] + 20, LIFT_CANOPY_YN - 40, L.liftTop - L.slabT - 0.008, L.liftTop - L.slabT);
      pb(eBag, 'eastPlaster', 14040, liftOX[1], liftOY[1], LIFT_CANOPY_YN, L.f2 + 0.012, L.liftTop - L.slabT);
      pb(eBag, 'charDark', ROOF_EX, liftOX[1] + 14, liftOY[0] - 14, LIFT_CANOPY_YN + 14, L.liftTop - 0.24, L.liftTop - 0.18);
      pb(eBag, 'white', 0, ROOF_EX, EAST_RAFTER_YE, Y1n, L.roof - L.slabT, L.roof);
      pb(eBag, 'charDark', 60, ROOF_EX - 60, EAST_RAFTER_YE, Y1n - 60, L.roof - L.slabT - 0.008, L.roof - L.slabT);
      pb(eBag, 'white', 0, ROOF_EX, Y1n, Y1n + 1000, L.roof - L.slabT, L.roof);
      pb(eBag, 'charDark', 60, ROOF_EX - 60, Y1n, Y1n + 1000 - 60, L.roof - L.slabT - 0.008, L.roof - L.slabT);
      // Wall lamps — dark body + steel bezel + warm lens.
      // Flank centers sit OUTSIDE the opening leaf + accent surround (~130 mm),
      // never on the glass / door leaf itself.
      function flankCenters(c, w, margin) {
        margin = margin === undefined ? 180 : margin; // clear of frame + surround
        const half = w / 2 + margin;
        return [c - half, c + half];
      }
      function northWallLamp(cx, fl) {
        pb(eBag, 'charDark', cx - 50, cx + 50, NB[0] - 70, NB[0], fl + 1.7, fl + 2.05);
        pb(eBag, 'steel', cx - 40, cx + 40, NB[0] - 78, NB[0] - 4, fl + 1.74, fl + 2.01);
        pb(eBag, 'lamp', cx - 35, cx + 35, NB[0] - 100, NB[0] - 72, fl + 1.78, fl + 1.97);
      }
      // North: GF main door (8650×1200) + each major north window, lamps outside frames
      (function northFacadeLamps() {
        // GF windows — bed02, hall, office
        for (const o of [{ c: 4300, w: 900 }, { c: 6800, w: 1800 }, { c: 11000, w: 1500 }]) {
          for (const cx of flankCenters(o.c, o.w, 160)) northWallLamp(cx, L.f0);
        }
        // FF / SF north windows (no door on upper north)
        for (const fl of [L.f1, L.f2]) {
          for (const o of [{ c: 5500, w: 1000 }, { c: 8760, w: 1000 }]) {
            for (const cx of flankCenters(o.c, o.w, 160)) northWallLamp(cx, fl);
          }
        }
      })();

      // ===== EAST FACADE — quiet lime, more layers, no shout =====
      (function eastFacade() {
        const EF = 12650;
        const ey0 = 0, ey1 = 8870;

        // Thin storey datums — 70 mm proud, lime-capped, not 250 mm charcoal bars.
        const datums = [L.f0, L.f1, L.f2];
        for (const z of datums) {
          pb(eBag, 'charDark', EF - 6, EF + 72, ey0, ey1, z - 0.055, z - 0.008);
          pb(eBag, 'copingLight', EF - 8, EF + 78, ey0 - 8, ey1 + 8, z - 0.008, z + 0.012);
        }

        // Door portal cheeks — per storey, only in the solid strip beside each door.
        // GF office window ends y 6900; door starts 7400.
        // FF has a sidelite on the south jamb — no south cheek.
        // SF living is now one 3180 mm French glass — no pier, no extra canopy
        // (the pergola is the shade).
        // North: GF/FF doors end 8600; wall ends 8870.
        function cheek(y0, y1, z0, z1, innerSouth) {
          pb(eBag, 'eastPlaster', EF - 4, EF + 88, y0, y1, z0, z1);
          if (innerSouth) pb(eBag, 'charDark', EF + 4, EF + 84, y1 - 16, y1, z0, z1);
          else pb(eBag, 'charDark', EF + 4, EF + 84, y0, y0 + 16, z0, z1);
        }
        cheek(6920, 7380, L.f0, L.f1, true);                 // GF south of door
        cheek(8620, 8870, L.f0, L.f1, false);                // GF north of door
        cheek(8620, 8870, L.f1, L.f2, false);                // FF north of door
        pb(eBag, 'charDark', EF - 4, EF + 40, 7400, 8600, L.f0, L.f0 + 0.04);

        // Lime canopies with a thin stone drip (not dark slabs).
        // SF has no canopy — the pergola is the roof over that bay.
        const canopies = [
          [L.f0 + 2.50, 7280, 8720],
          [L.f1 + 2.50, 6760, 8720]
        ];
        for (const [z, y0, y1] of canopies) {
          pb(eBag, 'white2', EF - 8, EF + 620, y0, y1, z, z + 0.08);
          pb(eBag, 'charDark', EF + 608, EF + 632, y0 - 8, y1 + 8, z - 0.02, z + 0.09);
        }

        // Flank lamps on the SF glass wall — centred on each jamb pier.
        function eastWallLamp(cy, fl) {
          pb(eBag, 'charDark', EF, EF + 68, cy - 48, cy + 48, fl + 1.70, fl + 2.04);
          pb(eBag, 'steel', EF + 4, EF + 76, cy - 38, cy + 38, fl + 1.74, fl + 2.00);
          pb(eBag, 'lamp', EF + 72, EF + 98, cy - 32, cy + 32, fl + 1.78, fl + 1.96);
        }
        // SF lamps sit on the pulled-in wall face.
        for (const cy of [5360, 8760]) {
          pb(eBag, 'charDark', SF_EB[1], SF_EB[1] + 68, cy - 48, cy + 48, L.f2 + 1.70, L.f2 + 2.04);
          pb(eBag, 'steel', SF_EB[1] + 4, SF_EB[1] + 76, cy - 38, cy + 38, L.f2 + 1.74, L.f2 + 2.00);
          pb(eBag, 'lamp', SF_EB[1] + 72, SF_EB[1] + 98, cy - 32, cy + 32, L.f2 + 1.78, L.f2 + 1.96);
        }
      })();

      // ===== N / S / W facade datum bands (same language as east elevation) =====
      (function perimeterBands() {
        const datums = [
          [L.f0 - 0.02, L.f0 + 0.14, L.f0 + 0.14, L.f0 + 0.18],
          [L.f1 - 0.18, L.f1 - 0.02, L.f1 - 0.02, L.f1 + 0.02],
          [L.f2 - 0.18, L.f2 - 0.02, L.f2 - 0.02, L.f2 + 0.02],
          [L.roof - 0.18, L.roof - 0.02, L.roof - 0.02, L.roof + 0.02]
        ];
        // FF south service outer wall (y≈-762) only exists L.f1 → L.f2.
        // Drawing GF/roof ribbons there left floating bars in the south yard
        // between the compound wall and the house.
        const serviceWallBot = L.f1 - 0.05;
        const serviceWallTop = L.f2 + 0.05;
        for (const [bh0, bh1, ch0, ch1] of datums) {
          // North face (main block)
          pb(eBag, 'charDark', 200, 12420, Y1n - 20, Y1n + 160, bh0, bh1);
          pb(eBag, 'accentWarm', 190, 12430, Y1n - 25, Y1n + 170, ch0, ch1);
          // South face — bedroom stretch at y≈0 (wall exists all floors)
          pb(eBag, 'charDark', 200, 4800, -20, 160, bh0, bh1);
          pb(eBag, 'accentWarm', 190, 4810, -25, 170, ch0, ch1);
          // South service wall exists L.f1 → L.f2. The L.f2 ribbon would
          // sit under the SF south railing wall as a second gray border.
          if (bh0 >= serviceWallBot && bh1 < L.f2 - 0.05) {
            pb(eBag, 'charDark', 4920, 12420, -762 - 20, -762 + 160, bh0, bh1);
            pb(eBag, 'accentWarm', 4910, 12430, -762 - 25, -762 + 170, ch0, ch1);
          }
          // West storey lines are drawn once below, on the slab.
        }
      })();
      (function westSlabBands() {
        // Same language as the east elevation: a thin charcoal + light
        // coping ON each slab, not a 160 mm gray ribbon at a different
        // height every floor.
        for (const z of [L.f0, L.f1, L.f2, L.roof]) {
          pb(eBag, 'charDark', -6, 72, 0, Y1n, z - 0.055, z - 0.008);
          pb(eBag, 'copingLight', -8, 78, -8, Y1n + 8, z - 0.008, z + 0.012);
        }
      })();

      // ===== NORTH FACADE TREATMENT — main entry + window surrounds =====
      (function northFacade() {
        const NF = Y1n; // outer north face y (8870)

        // Main door canopy (c=8650, w=1200 → leaf 8050..9250) — projects north over stoop
        pb(eBag, 'charDark', 7900, 9400, NF - 25, NF + 720, L.f0 + 2.50, L.f0 + 2.60);
        pb(eBag, 'charDark', 7880, 9420, NF + 700, NF + 730, L.f0 + 2.38, L.f0 + 2.62);
        // Upper-level wall lamps are drawn in northFacadeLamps() above (aligned to frames).
      })();

      // ===== PORTICO AMBIENT — column uplights =====
      (function porticoLights() {
        // Uplights sit ON the portico tile (was buried under L.porticoFl = 0.15).
        const t0 = L.porticoFl + 0.016;
        for (const cy of [8720, 4290, 150]) {
          // Inboard and outboard of each column shaft (16300..16600)
          pb(eBag, 'steel', 16255, 16295, cy - 35, cy + 35, t0, t0 + 0.05);
          pb(eBag, 'lamp', 16260, 16290, cy - 28, cy + 28, t0 + 0.04, t0 + 0.08);
          pb(eBag, 'steel', 16605, 16645, cy - 35, cy + 35, t0, t0 + 0.05);
          pb(eBag, 'lamp', 16610, 16640, cy - 28, cy + 28, t0 + 0.04, t0 + 0.08);
        }
      })();

      // ===== SE ROD BOX — one frame wrapped round the corner =====
      // V22's move is that the screen turns the SE corner and runs a short
      // way west to mask the portico column. It used to be built as a grid
      // of posts and rails with fins infilling each compartment, which read
      // as eight separate panels rather than one wrapped box, and every
      // fin died on a rail instead of running through.
      //
      // Now it is a single 275 mm-square section — 275 wide on the face,
      // 275 deep — for every member of both legs. That makes the corner a
      // plain 275 × 275 RCC column that both frames simply butt into, and
      // every border on both elevations the same width. Each leg carries
      // one field of identical rods running sill to head, unbroken.
      //
      // Border reads 120 mm flat off the arris, then 155 mm of splay
      // falling 110 mm back into the opening (~55°). Because the splay
      // runs INWARD, the frame is the union of the sloped half-spaces, so
      // full-length planks mitre themselves at the free ends; at the corner
      // they simply die on the column face. Nothing is coplanar with
      // anything: outer faces clear the deck and terrace fascia bands by
      // 6–17 mm, and every plank end is buried in the ring behind it.
      (function seRodBox() {
        const SEC = 275;                       // one section, both legs
        const xFace = eastX[1] + 10;           // 17372 — flush with east fascia
        const xBack = xFace - SEC;             // 17097 — body sits in the slab
        const yFace = EAST_RAIL_YS - 10;       //  -772 — flush with south fascia
        const yBack = yFace + SEC;             //  -497 — body sits in the slab
        const yN1 = EAST_RAFTER_YE;            //  3459 east leg, north end
        const xW0 = EAST_SOUTH_RET_XW;         // 16238 south leg, west end

        const zIn0 = L.f1 + 0.018;             //  4.121 opening bottom (FF tile + 6)
        const zOut0 = zIn0 - SEC / 1000;       //  3.846
        const zOut1 = L.f2;                    // rods die on the SF slab
        const zIn1 = zOut1 - SEC / 1000;       //  7.181

        const zCap0 = L.f1 - 0.45;             // 3.653 m bottom sill (ground floor upper beam soffit)
        const zRod0 = zCap0 + 0.012;           // 3.665 m rods extend down to bottom sill
        const zCap1 = L.f2 + 0.012 + 1.08;     // 8.543 m top head (SF railing cap)
        const zRod1 = zCap1 - 0.012;           // 8.531 m rods extend up to top head

        // South leg: solid plaster wall, FF lower beam soffit to SF rail cap.
        // East leg: continuous unbroken vertical rods from bottom beam soffit to SF rail cap.
        const FL = 46, PIT = 70, STILE = 80;
        const RB = 60;
        const yNt0 = yN1 - STILE;

        // South wall with three smaller vertical slit windows:
        // Spanned evenly across the solid wall (xW0 to xBack, total width = 2827 mm).
        // Each vertical window has its own perimeter charcoal frame, glass, and stone sill ledge.
        const zWs = L.f1 + 0.90, zWh = L.f1 + 2.70;
        const totalSpan = xBack - xW0; // 2827 mm
        const NUM_WINS = 3;
        const WIN_W = 460; // 460 mm wide vertical window
        const totalWinW = NUM_WINS * WIN_W; // 1380 mm
        const totalPierW = totalSpan - totalWinW; // 1447 mm
        const pierW = totalPierW / (NUM_WINS + 1); // ~361.75 mm pier width between & flanking windows

        // Base wall below windows and top wall above windows
        pb(eBag, 'white', xW0, xBack, yFace, yBack, zCap0, zWs);
        pb(eBag, 'white', xW0, xBack, yFace, yBack, zWh, zCap1);
        pb(eBag, 'white', xW0, xBack, yFace, yBack, L.f2, L.f2 + 0.012);

        // Compute the 3 window intervals and plaster piers
        const wins = [];
        let currX = xW0;
        for (let i = 0; i < NUM_WINS; i++) {
          const pierStart = currX;
          const pierEnd = currX + pierW;
          // Plaster pier before this window
          pb(eBag, 'white', pierStart, pierEnd, yFace, yBack, zWs, zWh);
          const winStart = pierEnd;
          const winEnd = winStart + WIN_W;
          wins.push({ x0: winStart, x1: winEnd });
          currX = winEnd;
        }
        // Final plaster pier to the right (east end)
        pb(eBag, 'white', currX, xBack, yFace, yBack, zWs, zWh);

        // Frame and glazing for each of the three vertical windows
        const WIN_J = 40; // 40 mm frame profile
        const yFf = yFace - 18, yFb = yFace + 42;
        const zHf0 = zWs - 0.040, zHf1 = zWh + 0.040;

        for (let i = 0; i < wins.length; i++) {
          const w = wins[i];
          const xf0 = w.x0, xf1 = w.x1;
          // Perimeter frame (left jamb, right jamb, sill, head)
          pb(eBag, 'frame', xf0, xf0 + WIN_J, yFf, yFb, zHf0, zHf1);
          pb(eBag, 'frame', xf1 - WIN_J, xf1, yFf, yFb, zHf0, zHf1);
          pb(eBag, 'frame', xf0, xf1, yFf, yFb, zHf0, zWs);
          pb(eBag, 'frame', xf0, xf1, yFf, yFb, zWh, zHf1);
          // Glazing
          pb(eBag, 'glass', xf0 + WIN_J, xf1 - WIN_J, yFace - 6, yFace + 24, zWs, zWh);
          // Projecting stone sill ledge
          pb(eBag, 'stone', xf0 - 8, xf1 + 8, yFace - 30, yFace + 52, zHf0 - 0.028, zHf0);
        }

        // Corner column: solid white column from ground ceiling soffit up to SF rail cap
        pb(eBag, 'white', xBack, xFace, yFace, yBack, zCap0, zCap1);

        // Second-floor north end terminal post (L.f2 to zCap1 at yN1)
        pb(eBag, 'white', xFace - 6 - RB, xFace + 28, yN1 - 24, yN1, L.f2, zCap1);

        // Ultra-thin micro mounting channels at top (8 mm) and bottom (6 mm)
        const zBottomCap0 = zCap0;
        const zBottomCap1 = zCap0 + 0.006;
        const zTopCap0 = zCap1 - 0.008;
        const zTopCap1 = zCap1;
        
        const zRodBottom = zBottomCap1;
        const zRodTop = zTopCap0;

        // Bottom micro-shoe running full span (yBack to yN1)
        pb(eBag, 'white', xFace - 6 - RB, xFace + 28, yBack, yN1, zBottomCap0, zBottomCap1);
        // Top micro-channel running full span (yBack to yN1)
        pb(eBag, 'white', xFace - 6 - RB, xFace + 28, yBack, yN1, zTopCap0, zTopCap1);

        // Mathematically uniform vertical rods (56 rods, exactly 28.14 mm gap across all 57 intervals)
        const NUM_RODS = 56;
        const ROD_W = 42;
        const totalSpanY = yN1 - yBack; // 3956 mm
        const gapY = (totalSpanY - NUM_RODS * ROD_W) / (NUM_RODS + 1); // 28.14 mm exact equal spacing

        for (let i = 0; i < NUM_RODS; i++) {
          const ry0 = yBack + (i + 1) * gapY + i * ROD_W;
          const ry1 = ry0 + ROD_W;
          pb(eBag, 'fin2', xFace - 6 - RB, xFace + 28, ry0, ry1, zRodBottom, zRodTop);
        }

        // Slabs recessed cleanly behind the continuous vertical rods
        pb(eBag, 'white', xBack, xFace - 6 - RB - 10, yBack, yN1, L.f1 - 0.45, L.f1 + 0.012);
        pb(eBag, 'white', xBack, xFace - 6 - RB - 10, yBack, yN1, L.f2, L.f2 + 0.012);
      })();

    })();
    const exterior = eBag.build(THREE, materials); exterior.name = 'exterior'; root.add(exterior);

    /* ======== Per-level outdoor amenity (portico / east-north balconies) ========
       CRITICAL: only true outdoor decks — never the main-block floor plate.
       Using full-floor drawFFSlab/drawSFSlab here stacked a solid white slab
       over the whole house in exterior + walkthrough (z-fight / “everything
       overlapped”). Decks live east of X1=12650, south strip, and north balcony. */
    const outdoors = [];
    (function buildOutdoorAmenity() {
      const EX0 = 12650, EX1 = 17362; // east outdoor band
      const NBY0 = Y1n, NBY1 = Y1n + 1000; // north balcony
      // Shared lips so FF and SF stop on the same lines.
      // South wall centres so the 150 mm face lands on the flushed -772 fascia.
      // East pillars sit inboard of EX1 so the 180 mm shaft + coping
      // never past the 17372 fascia.
      const SOUTH_FC = EAST_RAIL_YS + 65;     // -697
      const EAST_RAIL_X = EX1 - 80;
      const EAST_PIL_X = EX1 - 110;
      const NORTH_FC = NBY1 - 80;
      const NORTH_PIL_Y = NBY1 - 100;
      const DECK_SE = EAST_RAIL_YS - 10 + 275; // -497, inside the L-box
      const BOX_X = eastX[1] + 10 - 275;       // 17097, inner face of the box

      /** Structural deck + tile + thin soffit for an outdoor rectangle */
      function outdoorDeck(bag, x0, x1, y0, y1, fY, tileMat) {
        const h0 = fY - L.slabT, h1 = fY;
        const t0 = fY, t1 = fY + 0.012;
        const s0 = h0 - 0.008, s1 = h0;
        if (x1 - x0 < 40 || y1 - y0 < 40) return;
        pb(bag, 'white', x0, x1, y0, y1, h0, h1);
        pb(bag, 'charDark', x0 + 40, x1 - 40, y0 + 40, y1 - 40, s0, s1);
        pb(bag, tileMat || 'balcTile', x0, x1, y0, y1, t0, t1);
      }

      // --- outdoor0: GF portico + stoops (Subtle Indian Parking Tiles) ---
      const o0 = makeBag(THREE);
      pb(o0, 'concrete', EX0, EX1, portY[0], portY[1], 0, L.porticoFl);
      pb(o0, 'paver', EX0 + 30, EX1 - 30, portY[0] + 30, portY[1] - 30, L.porticoFl, L.porticoFl + 0.014);
      // Clean granite perimeter coping
      pb(o0, 'charDark', EX0 - 20, EX1 + 20, portY[0] - 20, portY[0] + 35, 0, L.porticoFl + 0.035);
      pb(o0, 'charDark', EX0 - 20, EX1 + 20, portY[1] - 35, portY[1] + 20, 0, L.porticoFl + 0.035);
      pb(o0, 'charDark', EX1 - 35, EX1 + 20, portY[0], portY[1], 0, L.porticoFl + 0.035);
      pb(o0, 'copingLight', EX0 - 25, EX1 + 25, portY[0] - 25, portY[0] + 40, L.porticoFl + 0.035, L.porticoFl + 0.05);
      pb(o0, 'copingLight', EX0 - 25, EX1 + 25, portY[1] - 40, portY[1] + 25, L.porticoFl + 0.035, L.porticoFl + 0.05);
      pb(o0, 'copingLight', EX1 - 40, EX1 + 25, portY[0], portY[1], L.porticoFl + 0.035, L.porticoFl + 0.05);
      // North main-door stoop
      pb(o0, 'plinth', 7800, 9500, Y1n, 10070, 0, L.f0);
      pb(o0, 'copingLight', 7820, 9480, Y1n + 20, 10050, L.f0, L.f0 + 0.02);
      let st = 0.60;
      for (let i = 0; i < 4; i++) {
        pb(o0, 'plinth', 7800, 9500, 10070 + i * 300, 10070 + (i + 1) * 300, 0, st);
        pb(o0, 'copingLight', 7820, 9480, 10080 + i * 300, 10070 + (i + 1) * 300 - 10, st, st + 0.018);
        st -= 0.15;
      }
      // Office stoop on portico (door c=8000, leaf 7400..8600)
      st = 0.60;
      for (let i = 0; i < 3; i++) {
        pb(o0, 'plinth', 12650 + i * 300, 12950 + i * 300, 7400, 8600, L.porticoFl, st);
        pb(o0, 'copingLight', 12660 + i * 300, 12940 + i * 300, 7420, 8580, st, st + 0.018);
        st -= 0.15;
      }
      const g0 = o0.build(THREE, materials); g0.name = 'outdoor0'; root.add(g0); outdoors.push(g0);

      // --- outdoor1: FF outdoor decks ONLY (no interior floor plate) ---
      const o1 = makeBag(THREE);
      const f1 = L.f1;
      // South bedroom balcony — deck meets the south fascia and the west rail
      outdoorDeck(o1, 0, 4805, -762, 0, f1);
      pb(o1, 'white', -10, 90, -762, 0, f1 - 0.45, f1 + 0.012);
      pb(o1, 'charDark', -10, 90, -762, 0, f1 - 0.24, f1 - 0.18);
      // Portico-top / south-east deck
      outdoorDeck(o1, EX0, eastX[1] + 10 - 275, EAST_RAIL_YS - 10 + 275, 230, f1);
      // Lift roof only — not over the landing (headroom)
      outdoorDeck(o1, 14040, VOID_WX, 230, 1040, f1);
      // Outer east strip beside the full-width stair void
      outdoorDeck(o1, VOID_EX, eastX[1] + 10 - 275, 230, 1040, f1);
      outdoorDeck(o1, VOID_EX + 20, eastX[1] + 10 - 275, 1040, EAST_RAFTER_YE, f1);
      outdoorDeck(o1, VOID_EX + 20, EX1, EAST_RAFTER_YE, 3890, f1);
      pb(o1, 'white', VOID_EX - 12, VOID_EX + 14, 230, 3890, f1 - 0.45, f1 + 0.012);
      pb(o1, 'charDark', VOID_EX - 16, VOID_EX + 18, 230, 3890, f1 - 0.24, f1 - 0.18);
      // East corridor (house face → void west), north of lift
      outdoorDeck(o1, EX0 + 30, VOID_WX - 20, LIFT_NY, 3890, f1);
      // East deck north of stair arrival → building NE
      outdoorDeck(o1, EX0, EX1, 3890, Y1n, f1);
      // North balcony (outside main north wall)
      outdoorDeck(o1, 0, EX1, NBY0, NBY1 - 30, f1);
      // Service-band floors (south of main block, FF only)
      outdoorDeck(o1, 4965, 8085, -596, 1360, f1);
      outdoorDeck(o1, 8300, 9320, -596, 1360, f1);
      outdoorDeck(o1, 9536, 12370, -596, 1360, f1);
      // South hang through the service-band gap (outside the y=-762 wall)
      outdoorDeck(o1, 4805, EX0, -732, -650, f1);
      // Edge fascia — north lip stops on the east box, which carries its own
      // 275 mm frame round the corner. Running the lip through to 18052 was
      // the old bay's outer face and left a coplanar white-on-white seam.
      pb(o1, 'white', 0, BOX_X, NBY1 - 90, NBY1 + 10, f1 - 0.45, f1 + 0.012);
      pb(o1, 'white', -10, 90, Y1n, NBY1 + 10, f1 - 0.45, f1 + 0.012);
      // South fascia: 10 mm out / 90 mm in, matching the east lip. Stops at
      // the L-box so it does not stand in front of the south screen.
      pb(o1, 'white', 0, EAST_SOUTH_RET_XW, -762 - 10, -762 + 90, f1 - 0.45, f1 + 0.012);
      pb(o1, 'charDark', 0, BOX_X, NBY1 - 96, NBY1 + 14, f1 - 0.24, f1 - 0.18);
      pb(o1, 'charDark', -10, 90, Y1n, NBY1 + 14, f1 - 0.24, f1 - 0.18);
      pb(o1, 'charDark', 0, EAST_SOUTH_RET_XW, -762 - 16, -762 + 96, f1 - 0.24, f1 - 0.18);
      // Metal on east + NE/SE bays. Long north/south runs and west returns are walls.
      // South bedroom balcony: plaster wall, same run as the SF wall above.
      edgeWall(o1, 'y', 80, SOUTH_FC, 0, f1, 1.08, { plain: true });
      edgeWall(o1, 'x', SOUTH_FC, 0, 4805, f1, 1.08, { plain: true });
      railPillar(o1, 80, SOUTH_FC, f1, 1.08);
      railing(o1, 'x', SOUTH_FC, EX0, EAST_SOUTH_RET_XW, f1, 1.0);
      externalStairVoidRails(o1, f1);
      (function ffNorthGuard() {
        const nX0 = 80, nX1 = BOX_X;
        const bay0 = lastBayStart(nX0, nX1);
        edgeWall(o1, 'x', NORTH_FC, nX0, bay0, f1, 1.08, { plain: true });
        railing(o1, 'x', NORTH_FC, bay0, nX1, f1, 1.0);
        railPillar(o1, nX0, NORTH_PIL_Y, f1, 1.08);
        railPillar(o1, bay0, NORTH_PIL_Y, f1, 1.08);
      })();
      edgeWall(o1, 'y', 80, Y1n, NORTH_FC, f1, 1.08, { plain: true });
      (function ffEastBox() {
        // North bay of the first-floor east face: a projecting box with the
        // opening splayed on all four sides.
        //
        // It still throws east, just less — 265 mm past the L-box plane
        // instead of 680 — and it now reaches 275 mm back INTO the slab, so
        // the frame is 540 mm deep and the reveal has something to happen in.
        //
        // The splay is built as four sloped planks, NOT as a stepped ring.
        // Because the opening narrows going in, the four sloped half-spaces
        // are a union, so the corners mitre themselves and the frame closes
        // on the ring behind it — the trick the earlier attempt missed. Two
        // rules make it hold, and both were broken before:
        //   · thickness T ≥ SR·cos(ANG), or the plank stops short of the
        //     ring and daylight shows through the head;
        //   · each plank overruns into a SQUARE band at both ends (120 mm at
        //     the face, 120 mm at the back), so the rotated end corners are
        //     buried in solid instead of floating in the opening.
        const xBack = BOX_X;                   // 17097 — 275 into the slab
        const xIn = xBack + 120;               // 17217 — back band ends
        const xSl = xIn + 300;                 // 17517 — splay ends
        const xOut = xSl + 120;                // 17637 — box face, 265 proud
        const y0 = EAST_RAFTER_YE;             //  3459 — butts the L-box
        // 10 mm proud of the SF north lip at 9880 — same plane on both would
        // put two north-facing white faces on top of each other and shimmer
        const y1 = NBY1 + 20;                  //  9890 — north balcony end
        const zOut0 = f1 - 0.45;               //  3.653 box soffit
        const zOut1 = L.f2;                    //  7.456 box top

        const SP = xSl - xIn, SR = 160;        // splay run / rise per side
        // Face opening. The sill lands ON the deck at the back of the splay,
        // so the balcony floor stays flat and the slope lives in the fascia.
        const zF0 = f1 + 0.012 - SR / 1000;    //  3.955
        const zF1 = zOut1 - 0.30;              //  7.156
        const yF0 = y0 + 300, yF1 = y1 - 300;  //  3759 / 9580
        const zB0 = zF0 + SR / 1000, zB1 = zF1 - SR / 1000;
        const yB0 = yF0 + SR, yB1 = yF1 - SR;  //  3919 / 9420

        // face band + splay zone — square ring on the FACE opening, so the
        // planks only ever add material and never need anything subtracted
        pb(o1, 'white', xIn, xOut, y0, y1, zOut0, zF0);
        pb(o1, 'white', xIn, xOut, y0, y1, zF1, zOut1);
        pb(o1, 'white', xIn, xOut, y0, yF0, zF0, zF1);
        pb(o1, 'white', xIn, xOut, yF1, y1, zF0, zF1);
        // back band — square ring on the BACK opening; also what the plank
        // ends bury themselves in. white2 is the palette's reveal white:
        // cooler and less grimy, so the reveal lifts away from the face
        // instead of going tan under the ochre ground bounce.
        pb(o1, 'white2', xBack, xIn, y0, y1, zOut0, zB0);
        pb(o1, 'white2', xBack, xIn, y0, y1, zB1, zOut1);
        pb(o1, 'white2', xBack, xIn, y0, yB0, zB0, zB1);
        pb(o1, 'white2', xBack, xIn, yB1, y1, zB0, zB1);

        const SPm = SP / 1000, SRm = SR / 1000;
        const ANG = Math.atan2(SRm, SPm);
        const HYP = Math.hypot(SPm, SRm);
        const SA = Math.sin(ANG), CA = Math.cos(ANG);
        const T = SRm * CA + 0.02;             // closes on the ring behind
        // Overrun: zero at the back so the plank's low corner lands exactly
        // on xIn and its sloped face runs continuously into the back band's
        // soffit; 110 east so the high corner buries in the face band.
        const EW = 0.0, EE = 0.11;
        const PL = HYP + EW + EE;
        const SH = (EE - EW) / 2;              // centre shift toward the face
        const xMid = (xIn + xSl) / 2000 - SA * T / 2 + SH * CA;
        const yMid = -(y0 + y1) / 2000, ySpan = (y1 - y0) / 1000;
        const zMid = (zOut0 + zOut1) / 2, zSpan = zOut1 - zOut0;

        // head — material above the slope
        o1.box('white2', xMid, zF1 - SRm / 2 + CA * T / 2 + SH * SA, yMid,
          PL, T, ySpan, 0, 0, ANG);
        // sill — material below it
        o1.box('white2', xMid, zF0 + SRm / 2 - CA * T / 2 - SH * SA, yMid,
          PL, T, ySpan, 0, 0, -ANG);
        // south jamb — material south of the slope
        o1.box('white2', xMid, zMid, -(yF0 + SR / 2) / 1000 + CA * T / 2 + SH * SA,
          PL, zSpan, T, 0, -ANG, 0);
        // north jamb — material north of it
        o1.box('white2', xMid, zMid, -(yF1 - SR / 2) / 1000 - CA * T / 2 - SH * SA,
          PL, zSpan, T, 0, ANG, 0);

        // MS rail on the same east line as the SF living bay, inside
        // the splay so the frame still reads. Same 1.0 m height.
        railing(o1, 'y', EAST_RAIL_X, yB0 + 20, yB1 - 20, f1, 1.0);
      })();
      const g1 = o1.build(THREE, materials); g1.name = 'outdoor1'; root.add(g1); outdoors.push(g1);

      // --- outdoor2: SF outdoor decks ONLY ---
      const o2 = makeBag(THREE);
      const f2 = L.f2;
      // South outdoor strip (portico-top + south balcony)
      // SW bedroom balcony — same south/west lips as FF, then the SE strip
      outdoorDeck(o2, 0, 4805, -762, 230, f2);
      outdoorDeck(o2, 4805, BOX_X, DECK_SE, 230, f2);
      pb(o2, 'white', -10, 90, -762, 0, f2 - 0.45, f2 + 0.012);
      pb(o2, 'charDark', -10, 90, -762, 0, f2 - 0.24, f2 - 0.18);
      // East of lift shaft only (lift cutout 12650..14040 × 230..1805)
      outdoorDeck(o2, 14040, BOX_X, 230, 1805, f2);
      // East sit-out north of lift — stops at the L-box, same as FF
      outdoorDeck(o2, EX0, BOX_X, 1805, EAST_RAFTER_YE, f2);
      // Strip freed by the SF wall pullback (new wall face -> old house line)
      outdoorDeck(o2, SF_EB[1], EX0, 230, Y1n, f2);
      // Exposed columns carrying the roof edge, on the portico column grid
      // (y 8720 just short of the house's NE corner, y 4290). Same section
      // and finish as columnsEast, outer face flush with the roof edge.
      (function sfRoofColumns() {
        const dx = (ROOF_EX - 150) - 16450;   // shift columnsEast's x centre to 12500
        const X = (x) => x + dx;
        const botH = f2 + 0.012, topH = L.roof - L.slabT;
        const gap = 0.018, baseH = 0.42, capH = 0.18;
        const shaftBot = botH + gap + baseH;
        const shaftTop = topH - capH;
        for (const cy of ROOF_COLS) {
          pb(o2, 'charDark', X(16315), X(16585), cy - 135, cy + 135, botH, botH + gap);
          pb(o2, 'charcoal', X(16300), X(16600), cy - 150, cy + 150, botH + gap, shaftBot - 0.018);
          pb(o2, 'charDark', X(16288), X(16612), cy - 162, cy + 162, shaftBot - 0.018, shaftBot);
          pb(o2, 'charcoal', X(16320), X(16580), cy - 44, cy + 44, shaftBot, shaftTop);
          pb(o2, 'white2', X(16332), X(16568), cy - 168, cy + 168, shaftBot, shaftTop);
          pb(o2, 'charDark', X(16288), X(16612), cy - 162, cy + 162, shaftTop, shaftTop + 0.018);
          pb(o2, 'charcoal', X(16300), X(16600), cy - 150, cy + 150, shaftTop + 0.018, topH - 0.022);
          pb(o2, 'copingLight', X(16278), X(16622), cy - 172, cy + 172, topH - 0.022, topH);
        }
      })();
      // SF living deck — full east lip, under the terrace slab
      outdoorDeck(o2, EX0, EX1, EAST_RAFTER_YE, Y1n, f2);
      outdoorDeck(o2, 0, EX1, NBY0, NBY1 - 30, f2);
      // No east slab fascia over the FF box bay: the box head IS the east
      // edge here, and a 450 mm fascia at 17272..17362 hung 40 mm below the
      // splayed soffit — a ledge across the top of the opening.
      pb(o2, 'white', 0, EX1 + 10, NBY1 - 90, NBY1 + 10, f2 - 0.45, f2 + 0.012);
      pb(o2, 'white', -10, 90, Y1n, NBY1 + 10, f2 - 0.45, f2 + 0.012);
      pb(o2, 'white', 0, EAST_SOUTH_RET_XW, -762 - 10, -762 + 90, f2 - 0.45, f2 + 0.012);
      pb(o2, 'charDark', 0, EX1 + 12, NBY1 - 96, NBY1 + 14, f2 - 0.24, f2 - 0.18);
      pb(o2, 'charDark', -10, 90, Y1n, NBY1 + 14, f2 - 0.24, f2 - 0.18);
      pb(o2, 'charDark', 0, EAST_SOUTH_RET_XW, -762 - 16, -762 + 96, f2 - 0.24, f2 - 0.18);
      // South — same runs as FF: plaster 0–4805, metal EX0–lift,
      // then plaster under the pergola. Same line, same height, same ends.
      (function sfSouthSERail() {
        edgeWall(o2, 'x', SOUTH_FC, 0, 4805, f2, 1.08, { plain: true });
        edgeWall(o2, 'x', SOUTH_FC, 4805, EX0, f2, 1.08, { plain: true });
        railing(o2, 'x', SOUTH_FC, EX0, EAST_SOUTH_RET_XW, f2, 1.0);
        // x 14270→17097 has no guard here: the L-box ribs run past the slab
        // and are the guard (see seRodBox). The plaster parapet that used to
        // sit on this run is what made the SE corner read as two objects.
        railPillar(o2, 80, SOUTH_FC, f2, 1.08);
        railPillar(o2, 4805, SOUTH_FC, f2, 1.08);
        railPillar(o2, EX0, SOUTH_FC, f2, 1.08);
      })();
      edgeWall(o2, 'y', 80, SOUTH_FC, 0, f2, 1.08, { plain: true }); // SW corner
      (function sfEastGuard() {
        // Pergola bay: no guard drawn here either — the L-box ribs carry up
        // past the slab and guard it, one screen from the FF sill to the cap.
        // Living bay: metal rail on the same run as FF, pillars inset.
        railing(o2, 'y', EAST_RAIL_X, EAST_RAIL_RESUME, NORTH_FC, f2, 1.0);
      })();
      (function sfPortico() {
        // Four-post steel pergola over the SE sit-out. West edge is a
        // ledger on the terrace face so the white slab stripe is gone.
        const y0 = EAST_RAIL_YS;
        const y1 = EAST_RAFTER_YE;
        const xW = SHELTER_X, xE = EX1;
        const POST = 110, BEAM = 100;
        const SLAT = 50, GAP = 130;
        const OVER = 180;
        const zB0 = L.roof - 0.05, zB1 = zB0 + 0.15;
        const zS0 = zB1 - 0.018, zS1 = zS0 + 0.052;

        function post(x, y) {
          pb(o2, 'dark', x - 28, x + POST + 28, y - 28, y + POST + 28, f2, f2 + 0.018);
          pb(o2, 'dark', x, x + POST, y, y + POST, f2 + 0.018, zB0);
          pb(o2, 'dark', x - 16, x + POST + 16, y - 16, y + POST + 16, zB0 - 0.018, zB0);
        }
        const xPW = xW + 36;
        const xPE = xE - POST - 90;
        const yPS = y0 + 70;
        const yPN = y1 - POST - 70;
        post(xPW, yPS);
        post(xPW, yPN);
        post(xPE, yPS);
        post(xPE, yPN);

        pb(o2, 'dark', xW - 14, xW + 36, y0 - 8, y1 + 8, L.roof - 0.46, L.roof + 0.014);
        pb(o2, 'dark', xW - 8, xW + BEAM, y0, y1, zB0, zB1);
        pb(o2, 'dark', xW, xE + OVER, y0, y0 + BEAM, zB0, zB1);
        pb(o2, 'dark', xW, xE + OVER, y1 - BEAM, y1, zB0, zB1);
        pb(o2, 'dark', xE - 70, xE + 24, y0, y1, zB0, zB1);

        const nRaf = 4;
        for (let i = 1; i <= nRaf; i++) {
          const y = y0 + BEAM + ((y1 - y0 - 2 * BEAM) * i) / (nRaf + 1);
          pb(o2, 'dark', xW + 20, xE + 8, y - 36, y + 36, zB0, zB1);
        }

        const slatY0 = y0 + BEAM + 12;
        const slatY1 = y1 - BEAM - 12;
        const nSlat = Math.max(4, Math.round((slatY1 - slatY0 - SLAT) / (SLAT + GAP)));
        for (let i = 0; i <= nSlat; i++) {
          const y = slatY0 + ((slatY1 - slatY0 - SLAT) * i) / nSlat;
          pb(o2, 'dark', xW + 28, xE + OVER, y, y + SLAT, zS0, zS1);
        }
      })();
      (function sfNorthNERail() {
        const nX0 = 80, nX1 = EX1 - 80;
        const bay0 = lastBayStart(nX0, nX1);
        edgeWall(o2, 'x', NORTH_FC, nX0, bay0, f2, 1.08, { plain: true });
        railing(o2, 'x', NORTH_FC, bay0, nX1, f2, 1.0);
        railPillar(o2, nX0, NORTH_PIL_Y, f2, 1.08);
        railPillar(o2, bay0, NORTH_PIL_Y, f2, 1.08);
      })();
      edgeWall(o2, 'y', 80, Y1n, NORTH_FC, f2, 1.08, { plain: true });
      Fur.lounger(o2, 14800, 16200, 600, 1400, f2);
      Fur.lounger(o2, 14800, 16200, 1900, 2700, f2);
      Fur.table(o2, 15050, 15850, 1480, 1820, f2, 0.40);
      const g2 = o2.build(THREE, materials); g2.name = 'outdoor2'; root.add(g2); outdoors.push(g2);
    })();

    /* ======== DOLLHOUSE floors — OMITTED (elevation exterior-only study) ======== */
    const floorsOut = [];

    /* ---------------- view presets ---------------- */
    const views = {
      exterior: { pos: [31.5, 11.2, 1.2], target: [7.5, 3.3, -7.0], autoRotate: true },
      east:     { pos: [38.0, 9.5, -4.4], target: [12.6, 5.5, -4.4], autoRotate: false },
      north:    { pos: [8.3, 9.5, -28.0], target: [8.3, 5.5, -4.4], autoRotate: false },
      south:    { pos: [8.3, 9.5, 18.0],  target: [8.3, 5.5, -4.4], autoRotate: false },
      west:     { pos: [-18.0, 9.5, -4.4], target: [6.0, 5.5, -4.4], autoRotate: false }
    };

    // warm accent at Telugu pooja kuthu-vilakku flames (FF)

    /* ---- warm fixtures for walkthrough light pool ----
       Plan mm → world: X = mm/1000, Z = -mm/1000.
       Keep this list sparse and co-located with real lamp geometry so the
       small point-light pool picks intentional accents (not random lawn blobs). */
    function warmFix(xmm, ymm, yM, floor) {
      lights.push({ x: xmm / 1000, y: yM, z: -ymm / 1000, floor: floor, warm: true });
    }
    // North facade — canopy + lamps outside real frames (match geometry above)
    // GF hall / office window flanks (sample)
    warmFix(5900, 8870, L.f0 + 1.88, 0);
    warmFix(7700, 8870, L.f0 + 1.88, 0);
    warmFix(10190, 8870, L.f0 + 1.88, 0);
    warmFix(11810, 8870, L.f0 + 1.88, 0);
    // FF / SF north window flanks (5500±660, 8760±660)
    for (const fl of [1, 2]) {
      const yL = fl === 1 ? L.f1 + 1.88 : L.f2 + 1.88;
      warmFix(4840, 8920, yL, fl);
      warmFix(6160, 8920, yL, fl);
      warmFix(8100, 8920, yL, fl);
      warmFix(9420, 8920, yL, fl);
    }
    // Site / compound / portico outdoor fixtures use floor:-1 so the light pool
    // always considers them (not only when the player is tagged as GF).
    for (const cy of [8720, 4290, 150]) {
      warmFix(16275, cy, L.porticoFl + 0.28, -1);
      warmFix(16625, cy, L.porticoFl + 0.28, -1);
    }
    for (const ly of [1200, 3000, 9800, 14000]) warmFix(22030, ly, 1.25, -1);
    warmFix(22160, 4422, 2.18, -1);
    warmFix(22160, 8422, 2.18, -1);
    // SF east French glass flanks
    warmFix(SF_EB[1] + 70, 5360, L.f2 + 1.88, 2);
    warmFix(SF_EB[1] + 70, 8760, L.f2 + 1.88, 2);
    // Mumty
    warmFix(5520, 7460, L.roof + 1.75, 2);
    // FF pooja mandir glow
    // GF office desk lamp
    // Bedroom nightstands (GF master + bed02, FF master)

    return {
      root, site, exterior, outdoors, floors: floorsOut, views, lights,
      LEVELS: L, COLORS: C,
      bounds: { minX: -3, maxX: 24.5, minZ: -21, maxZ: 3, minY: 0, maxY: 14 },
      nonCollideMaterials: NON_COLLIDE_MATERIALS,
      footprint: FOOTPRINT,
      /* plan-mm helper: is (px,py) outside the main building mass.
         Portico / east balcony (x>12650) count as semi-exterior for HUD
         but stay "inside" footprint for geometry visibility. */
      isOutsideFootprint: function (px, py, floorIndex) {
        const fp = FOOTPRINT;
        const yMin = floorIndex >= 1 ? fp.upperY0 : fp.y0;
        // north balcony still part of the building
        if (floorIndex >= 1 && px >= fp.x0 && px <= fp.x1 && py > fp.y1 && py <= fp.northBalcY1) return false;
        if (px < fp.x0 || px > fp.x1 || py < yMin || py > fp.y1) return true;
        return false;
      }
    };
  }

  return {
    build, LEVELS: L, COLORS: C,
    NON_COLLIDE_MATERIALS: NON_COLLIDE_MATERIALS,
    FOOTPRINT: FOOTPRINT,
    NO_SHADOW_CAST: NO_SHADOW_CAST
  };
})();
