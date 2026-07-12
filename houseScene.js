/* ============================================================
   houseScene.js — window.HouseScene, extracted from index.html
   (originally lines 222-1744). The building shell, room layout,
   levels and openings are unchanged from the original; only the
   `Fur` fixture kit has been enriched (hob burners, sink/basin
   bowls + taps, rounded WC, washer door, TV bezel, sofa arms) to
   replace the original blocky placeholders. index.html is untouched.
   ============================================================ */
/* ============================================================
   scene.js — Mr Chandrasekhar Family Residence, Anantapur
   Plan-faithful 3D scene builder (G+2, east-facing).
   All plan coordinates authored in mm (origin = building SW
   outer corner, x→east, y→north). World: X=x/1000, Z=-y/1000,
   Y=up (metres). Works in Node (module.exports) + browser
   (window.HouseScene). Pass THREE into build().
   ============================================================ */
window.HouseScene = (function () {
  'use strict';

  /* ---------------- levels (metres) ---------------- */
  const L = {
    ground: 0,
    f0: 0.75, f1: 4.103, f2: 7.456,
    roof: 10.809, parapetTop: 11.709,
    f2f: 3.353, slabT: 0.15, cut: 1.5,
    porticoFl: 0.15, pathFl: 0.05,
    liftTop: 11.709
  };

  /* ---------------- palette ----------------
     One theme: warm modern minimal — ivory plaster, warm charcoal
     massing, soft limestone floors, brass + stainless accents. */
  const C = {
    white:   0xe9e3d6,  // warm ivory plaster
    white2:  0xefebe2,  // near-white interior partitions / ceilings
    charcoal:0x3a3733,  // warm charcoal massing
    charDark:0x2b2825,  // deep charcoal fascia / caps
    plinth:  0x3a3733,  // matches charcoal for a clean base
    frame:   0x2f3236,  // dark bronze window/door frames
    glass:   0x7a90a0,  // clear blue-grey glazing
    walnut:  0x5c4836,  // warm walnut entry doors
    ms:      0x343230,  // painted mild steel (rail bars)
    brass:   0xc9a15e,  // soft antique brass
    steel:   0xb8bdc2,  // brushed stainless
    paver:   0x6a6762,  // warm grey driveway
    paver2:  0x5c5954,
    concrete:0x8a8680,  // warm concrete
    terraceF:0xd4cec0,  // limestone terrace
    balcTile:0x9a968e,  // warm stone balcony tile
    solar:   0x16243f,
    solarFrm:0x3c4248,
    tank:    0xdedbd3,
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
    ground:  0x2a2824,
    plotPad: 0x32302c,
    // floor tints — warm living / cool wet rooms
    tLiving: 0xcfc5b0, tBed: 0xd6cab2, tBath: 0xbfc6c6,
    tKitch:  0xcdc6b6, tUtil: 0xc3c2ba, tOut: 0x8f9089,
    tCirc:   0xcfc7b5, tOffice: 0xccc6b6, tPooja: 0xe2d5b8,
    tWalk:   0xd3cab8,
    // furniture
    fabric:  0x9c8f7b, fabric2: 0x6f6354, woodF: 0x6b5947,
    woodD:   0x4e4136, mattress:0xddd8cf, pillow: 0xeae6de,
    bedding: 0x7c8894, whiteG: 0xe2e3e4, dark: 0x232527,
    tv:      0x0b0c0d, rug: 0xb6a98d, carBody: 0x83888d,
    carDark: 0x1c1e20, lamp: 0xffd9a0, liftDoor:0xc8ccd1,
    counter: 0xd8d9da, counterTop:0x54565a,
    tharRed: 0xb51a22, chrome: 0xf0f2f4,
    accentWarm: 0x9a7d5c, copingLight: 0xd4cdc0,
    // realism pass (unique hexes for walkthrough colour lookup)
    skirt:   0x54453a,
    curtain: 0xbcab94,
    curtain2:0x8d7c68,
    downlight:0xf4ead2,
    road:    0x3f4043,
    roadLine:0xd8d5c8,
    pave:    0xa8a49b,
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

  /* materials: key -> spec; emissive optional */
  function buildMaterials(THREE) {
    const M = {};
    const mk = (key, color, o) => {
      const m = new THREE.MeshStandardMaterial(Object.assign({
        color, roughness: 0.93, metalness: 0.0
      }, o || {}));
      M[key] = m; return m;
    };
    for (const k of Object.keys(C)) {
      if (k === 'glass' || k === 'carGlass' || k === 'lamp') continue;
      mk(k, C[k]);
    }
    mk('glass', C.glass, { roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.42, depthWrite: false });
    mk('carGlass', 0x1d2429, { roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 });
    // Color = C.lamp so walkthrough hex→name resolves 'lamp' for night boost
    mk('lamp', C.lamp, { emissive: new THREE.Color(C.lamp), emissiveIntensity: 2.4, roughness: 0.55 });
    // Surface family tuning — one coherent material language
    M.white.roughness = 0.88; M.white2.roughness = 0.86;
    M.charcoal.roughness = 0.82; M.charDark.roughness = 0.8;
    M.plinth.roughness = 0.9; M.concrete.roughness = 0.92;
    M.ms.roughness = 0.5; M.ms.metalness = 0.22;
    M.steel.roughness = 0.32; M.steel.metalness = 0.78;
    M.brass.roughness = 0.36; M.brass.metalness = 0.7;
    M.frame.roughness = 0.38; M.frame.metalness = 0.55;
    M.accentWarm.roughness = 0.72; M.copingLight.roughness = 0.65;
    M.balcTile.roughness = 0.55; M.terraceF.roughness = 0.5;
    M.walnut.roughness = 0.55; M.woodF.roughness = 0.52; M.woodD.roughness = 0.55;
    M.skirt.roughness = 0.55;
    if (M.murtiGold) { M.murtiGold.roughness = 0.32; M.murtiGold.metalness = 0.8; }
    if (M.murtiDark) { M.murtiDark.roughness = 0.55; M.murtiDark.metalness = 0.12; }
    if (M.murtiBlue) { M.murtiBlue.roughness = 0.48; M.murtiBlue.metalness = 0.15; }
    M.liftDoor.roughness = 0.26; M.liftDoor.metalness = 0.78;
    M.solar.roughness = 0.28; M.solar.metalness = 0.4;
    M.tv.roughness = 0.28;
    M.chrome.roughness = 0.1; M.chrome.metalness = 0.95;
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
    const sphG = new THREE.IcosahedronGeometry(1, 1);
    const sph0G = new THREE.IcosahedronGeometry(1, 0); // low-poly blob for foliage
    const coneG = new THREE.ConeGeometry(1, 1, 10);
    const unitGeoms = [boxG, cylG, sphG, sph0G, coneG];

    function bucket(mat) {
      return buckets[mat] || (buckets[mat] = { pos: [], nor: [], idx: [], vc: 0 });
    }
    function add(mat, geom, matrix) {
      const b = bucket(mat);
      const p = geom.attributes.position, n = geom.attributes.normal;
      tmp.nm.getNormalMatrix(matrix);
      const base = b.vc;
      // grow typed chunks less often: push numbers is still simplest for
      // unknown final size, but we avoid per-vertex object allocation.
      for (let i = 0; i < p.count; i++) {
        tmp.v.fromBufferAttribute(p, i).applyMatrix4(matrix);
        b.pos.push(tmp.v.x, tmp.v.y, tmp.v.z);
        tmp.n.fromBufferAttribute(n, i).applyMatrix3(tmp.nm).normalize();
        b.nor.push(tmp.n.x, tmp.n.y, tmp.n.z);
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
      sph: (mat, cx, cy, cz, r, sy) => place(mat, sphG, cx, cy, cz, r, sy || r, r),
      // irregular foliage blob: independent xyz scale + yaw; low=true uses
      // the 20-face icosahedron (cheap, for specks and distant canopies)
      blob: (mat, cx, cy, cz, sx, sy, sz, ry, low) =>
        place(mat, low ? sph0G : sphG, cx, cy, cz, sx, sy, sz, 0, ry || 0, 0),
      cone: (mat, cx, cy, cz, r, h) => place(mat, coneG, cx, cy, cz, r, h, r),
      build: (THREE2, materials) => {
        const g = new THREE2.Group();
        for (const key of Object.keys(buckets)) {
          const b = buckets[key];
          if (!b.vc) continue;
          const geo = new THREE2.BufferGeometry();
          geo.setAttribute('position', new THREE2.Float32BufferAttribute(b.pos, 3));
          geo.setAttribute('normal', new THREE2.Float32BufferAttribute(b.nor, 3));
          // Prefer compact index type when possible
          const use32 = b.vc > 65535;
          const IndexArray = use32 ? Uint32Array : Uint16Array;
          geo.setIndex(new THREE2.BufferAttribute(new IndexArray(b.idx), 1));
          // free intermediate number arrays promptly
          b.pos = null; b.nor = null; b.idx = null;
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
    } else if (spec.type === 'frenchdoor') { // French-style glass door
      put('frame', a0, a0 + 60, fd0, fd1, b, t);
      put('frame', a1 - 60, a1, fd0, fd1, b, t);
      put('frame', a0, a1, fd0, fd1, t - 0.060, t);
      put('frame', a0, a1, fd0, fd1, b, b + 0.060);
      const midX = (a0 + a1) / 2;
      put('frame', midX - 30, midX + 30, fd0 + 4, fd1 - 4, b + 0.06, t - 0.06);
      put('glass', a0 + 55, midX - 25, gd0, gd1, b + 0.055, t - 0.055);
      put('glass', midX + 25, a1 - 55, gd0, gd1, b + 0.055, t - 0.055);
      const h0 = b + 0.06, h1 = t - 0.06, h_span = h1 - h0;
      for (let i = 1; i <= 2; i++) {
        const mh = h0 + (h_span * i) / 3;
        put('frame', a0 + 55, midX - 25, mid - 8, mid + 8, mh - 0.012, mh + 0.012);
        put('frame', midX + 25, a1 - 55, mid - 8, mid + 8, mh - 0.012, mh + 0.012);
      }
      const hb = outSign > 0 ? [bb1 + 8, bb1 + 38] : [bb0 - 38, bb0 - 8];
      put('brass', midX - 45, midX - 15, hb[0], hb[1], b + 0.95, b + 1.15);
      put('brass', midX + 15, midX + 45, hb[0], hb[1], b + 0.95, b + 1.15);
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
      // Charcoal chajja with warm soffit accent strip (matches east canopy language)
      const cb = outSign > 0 ? [bb1, bb1 + 500] : [bb0 - 500, bb0];
      put('charDark', a0 - 150, a1 + 150, cb[0], cb[1], t + 0.05, t + 0.13);
      const inner = outSign > 0
        ? [bb1 + 20, bb1 + 480]
        : [bb0 - 480, bb0 - 20];
      put('accentWarm', a0 - 120, a1 + 120, inner[0], inner[1], t + 0.02, t + 0.05);
      // thin drip edge
      const drip = outSign > 0 ? [bb1 + 485, bb1 + 505] : [bb0 - 505, bb0 - 485];
      put('charDark', a0 - 155, a1 + 155, drip[0], drip[1], t + 0.02, t + 0.14);
    }
  }

  /* Refined balcony railing: dark MS uprights + stainless handrail + mid rail.
     dir 'x' along x at y=fc, dir 'y' along y at x=fc */
  function railing(bag, dir, fc, a0, a1, base, h) {
    h = h || 1.0;
    const len = a1 - a0; if (len < 80) return;
    const n = Math.max(2, Math.round(len / 118));
    for (let i = 0; i <= n; i++) {
      const a = a0 + (len * i) / n;
      if (dir === 'x') pb(bag, 'ms', a - 9, a + 9, fc - 9, fc + 9, base, base + h - 0.04);
      else pb(bag, 'ms', fc - 9, fc + 9, a - 9, a + 9, base, base + h - 0.04);
    }
    if (dir === 'x') {
      // stainless top rail + chrome cap + mid rail
      pb(bag, 'steel', a0 - 14, a1 + 14, fc - 22, fc + 22, base + h - 0.04, base + h);
      pb(bag, 'chrome', a0 - 8, a1 + 8, fc - 12, fc + 12, base + h - 0.01, base + h + 0.012);
      pb(bag, 'steel', a0 - 10, a1 + 10, fc - 15, fc + 15, base + 0.09, base + 0.125);
    } else {
      pb(bag, 'steel', fc - 22, fc + 22, a0 - 14, a1 + 14, base + h - 0.04, base + h);
      pb(bag, 'chrome', fc - 12, fc + 12, a0 - 8, a1 + 8, base + h - 0.01, base + h + 0.012);
      pb(bag, 'steel', fc - 15, fc + 15, a0 - 10, a1 + 10, base + 0.09, base + 0.125);
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

  /* ============ vegetation kit (irregular blob canopies) ============
     x,y plan-mm; r overall size (m); base = ground level under plant (m). */
  function plantShrub(bag, x, y, r, col, base) {
    const rnd = rng(x * 3 + y * 17 + r * 997);
    const cx = x / 1000, cz = -y / 1000;
    base = base === undefined ? 0.05 : base;
    const flowering = (col === 'boug' || col === 'ixora');
    // shallow dark planting bed
    bag.cyl('soil', cx, base - 0.009, cz, r * 0.95, 0.042);
    // low mound of 3-5 squashed green blobs
    const greens = ['green', 'green2', 'leafDark'];
    const nB = 3 + Math.round(rnd() * 2);
    for (let i = 0; i < nB; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = rnd() * r * 0.45;
      const s = r * (0.45 + rnd() * 0.3);
      bag.blob(greens[(i + Math.round(rnd() * 2)) % 3],
               cx + Math.cos(a) * rad, base + s * 0.42 + rnd() * r * 0.12, cz + Math.sin(a) * rad,
               s * (0.9 + rnd() * 0.4), s * 0.55, s * (0.9 + rnd() * 0.4), rnd() * Math.PI, true);
    }
    // small flower specks scattered ON the canopy surface (accents, not mass)
    if (flowering) {
      const fm = col === 'boug' ? ['boug', 'flowerPink'] : ['ixora', 'flowerPink'];
      const nF = 15 + Math.round(rnd() * 12);
      for (let i = 0; i < nF; i++) {
        const a = rnd() * Math.PI * 2, e = rnd() * 1.1;
        const rr = r * (0.62 + rnd() * 0.18);
        const fr = 0.032 + rnd() * 0.016;
        bag.blob(fm[i % 2],
                 cx + Math.cos(a) * rr * Math.cos(e), base + r * 0.30 + Math.sin(e) * r * 0.42,
                 cz + Math.sin(a) * rr * Math.cos(e),
                 fr, 0.03, 0.032 + rnd() * 0.016, rnd() * Math.PI, true);
      }
    }
  }

  function plantTree(bag, x, y, r, opts) {
    opts = opts || {};
    const low = !!opts.low;                       // low-detail blobs for far context trees
    const rnd = rng(x * 7 + y * 13 + r * 1013);
    const cx = x / 1000, cz = -y / 1000;
    const base = opts.base === undefined ? 0.05 : opts.base;
    // shallow dark planting bed
    bag.cyl('soil', cx, base + 0.012, cz, r * 0.55, 0.05);
    // tapered trunk: stacked cylinders, thick base to thin top
    const tH = r * 1.35;
    bag.cyl('bark',      cx,             base + tH * 0.19, cz,             r * 0.11,  tH * 0.40);
    bag.cyl('bark',      cx + r * 0.015, base + tH * 0.50, cz - r * 0.012, r * 0.085, tH * 0.34);
    bag.cyl('barkLight', cx - r * 0.010, base + tH * 0.80, cz + r * 0.018, r * 0.060, tH * 0.34);
    // 2-3 short branch cylinders reaching into the canopy
    const nBr = 2 + Math.round(rnd());
    for (let i = 0; i < nBr; i++) {
      const a = rnd() * Math.PI * 2;
      const bl = r * (0.55 + rnd() * 0.30);
      bag.cyl('barkLight', cx + Math.cos(a) * bl * 0.32, base + tH * (0.95 + rnd() * 0.10),
              cz + Math.sin(a) * bl * 0.32, r * 0.035, bl,
              Math.sin(a) * 0.85, 0, Math.cos(a) * 0.85);
    }
    // irregular layered canopy: 8-16 overlapping blobs, wider than tall,
    // darker blobs inside/lower, lighter outside/upper, slight lean
    const nB = low ? (8 + Math.round(rnd() * 2)) : (11 + Math.round(rnd() * 4));
    const cyC = base + tH + r * 0.30;
    const lean = (rnd() - 0.5) * 0.5 * r;
    for (let i = 0; i < nB; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = rnd() * r * 0.62;
      const bx = cx + lean + Math.cos(a) * rad;
      const bz = cz + Math.sin(a) * rad * 0.85;
      const by = cyC + (rnd() - 0.35) * r * 0.5;
      const s = r * (0.30 + rnd() * 0.32);
      const outer = (rad > r * 0.34) || (by > cyC + r * 0.16);
      bag.blob(outer ? 'leafLight' : 'leafDark', bx, by, bz,
               s * (0.85 + rnd() * 0.5), s * (0.60 + rnd() * 0.35), s * (0.85 + rnd() * 0.5),
               rnd() * Math.PI, low);
    }
    // small blossom accents on the canopy surface for flowering trees
    if (opts.flowering) {
      const nF = 10 + Math.round(rnd() * 6);
      for (let i = 0; i < nF; i++) {
        const a = rnd() * Math.PI * 2;
        const fm = ['boug', 'flowerPink', 'ixora'][Math.round(rnd() * 2)];
        bag.blob(fm, cx + lean + Math.cos(a) * r * 0.72, cyC + (rnd() - 0.2) * r * 0.55,
                 cz + Math.sin(a) * r * 0.62, 0.05, 0.04, 0.05, rnd() * Math.PI, true);
      }
    }
  }

  /* skirting board run: 70mm tall, 12mm proud of the wall face, breaks at
     door openings (sill < 100mm) but continues under windows.
     dir/a/b as wallRun. faces: for dir 'x', 'lo' = y<b0 side, 'hi' = y>b1
     side (for dir 'y' read x for y). Board is buried 2mm into the wall and
     5mm into the floor so no face is coplanar with a parent face. */
  function skirtRun(bag, dir, a0, a1, b0, b1, floorY, openings, faces) {
    const ops = (openings || []).filter(o => (o.sill || 0) < 100).slice().sort((p, q) => p.c - q.c);
    const segs = []; let cur = a0;
    for (const o of ops) {
      const w0 = Math.max(a0, o.c - o.w / 2), w1 = Math.min(a1, o.c + o.w / 2);
      if (w1 <= cur + 1) continue;
      if (w0 > cur + 1) segs.push([cur, w0]);
      cur = Math.max(cur, w1);
    }
    if (cur < a1 - 1) segs.push([cur, a1]);
    const h0 = floorY - 0.005, h1 = floorY + 0.07;
    for (const s of segs) {
      for (const f of faces) {
        const [c0, c1] = f === 'lo' ? [b0 - 12, b0 + 2] : [b1 - 2, b1 + 12];
        if (dir === 'x') pb(bag, 'skirt', s[0], s[1], c0, c1, h0, h1);
        else pb(bag, 'skirt', c0, c1, s[0], s[1], h0, h1);
      }
    }
  }

  /* backdrop neighbour house: simple plaster mass with parapet, slab bands
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

  /* ============ furniture kit (all plan-mm + floorY) ============ */
  const Fur = {
    bed(bag, x0, x1, y0, y1, fY, head /* 'N','S','E','W' */) {
      // Determine local width (W) and length (L)
      const isNS = (head === 'N' || head === 'S');
      const W = isNS ? (x1 - x0) : (y1 - y0);
      const L = isNS ? (y1 - y0) : (x1 - x0);

      // Helper to add a part in local coordinates:
      // u = 0 to W (width, left to right from foot looking to head)
      // v = 0 to L (length, 0 is headboard, L is foot)
      // h0, h1 = height bounds in meters
      // tilt = optional angle (in radians) to prop up at the headboard
      function addPart(mat, u0, u1, v0, v1, h0, h1, tilt = 0) {
        let lx0, lx1, ly0, ly1;
        let rx = 0, ry = 0, rz = 0;

        if (head === 'S') {
          lx0 = x0 + u0;
          lx1 = x0 + u1;
          ly0 = y0 + v0;
          ly1 = y0 + v1;
          rx = tilt;
        } else if (head === 'N') {
          lx0 = x0 + u0;
          lx1 = x0 + u1;
          ly0 = y1 - v1;
          ly1 = y1 - v0;
          rx = -tilt;
        } else if (head === 'W') {
          lx0 = x0 + v0;
          lx1 = x0 + v1;
          ly0 = y0 + u0;
          ly1 = y0 + u1;
          rz = -tilt;
        } else { // E
          lx0 = x1 - v1;
          lx1 = x1 - v0;
          ly0 = y0 + u0;
          ly1 = y0 + u1;
          rz = tilt;
        }

        pb(bag, mat, lx0, lx1, ly0, ly1, h0, h1, rx, ry, rz);
      }

      // 1. Four solid corner wooden legs
      addPart('woodF', 40, 120, 40, 120, fY, fY + 0.18);          // Head-Left
      addPart('woodF', W - 120, W - 40, 40, 120, fY, fY + 0.18);  // Head-Right
      addPart('woodF', 40, 120, L - 120, L - 40, fY, fY + 0.18);  // Foot-Left
      addPart('woodF', W - 120, W - 40, L - 120, L - 40, fY, fY + 0.18); // Foot-Right

      // 2. Bed frame side rails and footboard
      addPart('woodF', 0, 50, 0, L, fY + 0.12, fY + 0.36);         // Left Rail
      addPart('woodF', W - 50, W, 0, L, fY + 0.12, fY + 0.36);     // Right Rail
      addPart('woodF', 50, W - 50, L - 50, L, fY + 0.12, fY + 0.36); // Footboard Rail
      addPart('woodF', 50, W - 50, 0, 50, fY + 0.12, fY + 0.36);   // Headboard Base Rail
      addPart('woodF', 50, W - 50, 50, L - 50, fY + 0.12, fY + 0.28); // Slat base

      // 3. Panelled headboard + brass cap rail
      addPart('woodD', 0, W, 0, 80, fY + 0.12, fY + 1.18);
      addPart('brass', 40, W - 40, 20, 55, fY + 1.14, fY + 1.17);
      if (W >= 1300) {
        addPart('fabric2', 60, W / 2 - 20, 55, 95, fY + 0.36, fY + 1.10);
        addPart('fabric2', W / 2 + 20, W - 60, 55, 95, fY + 0.36, fY + 1.10);
        addPart('woodF', W / 2 - 12, W / 2 + 12, 50, 90, fY + 0.36, fY + 1.10); // centre stile
      } else {
        addPart('fabric2', 60, W - 60, 55, 95, fY + 0.36, fY + 1.10);
      }

      // 4. Mattress + thin topper strip
      addPart('mattress', 50, W - 50, 50, L - 50, fY + 0.24, fY + 0.49);
      addPart('whiteG', 70, W - 70, 70, L - 70, fY + 0.485, fY + 0.50);

      // 5. Pillows (sleeping + layered accents)
      const pillowTilt = 0.21;
      const accentTilt = 0.35;
      if (W >= 1300) {
        addPart('pillow', 120, W / 2 - 60, 120, 500, fY + 0.48, fY + 0.60, pillowTilt);
        addPart('pillow', W / 2 + 60, W - 120, 120, 500, fY + 0.48, fY + 0.60, pillowTilt);
        addPart('curtain', 200, W / 2 - 100, 400, 660, fY + 0.48, fY + 0.58, accentTilt);
        addPart('curtain2', W / 2 + 100, W - 200, 400, 660, fY + 0.48, fY + 0.58, accentTilt);
        addPart('fabric', W / 2 - 90, W / 2 + 90, 480, 720, fY + 0.48, fY + 0.56, 0.4); // lumbar
      } else {
        addPart('pillow', 120, W - 120, 120, 500, fY + 0.48, fY + 0.60, pillowTilt);
        addPart('curtain', 180, W - 180, 400, 660, fY + 0.48, fY + 0.58, accentTilt);
      }

      // 6. Duvet + side drapes + folded sheet + foot throw
      addPart('bedding', 30, W - 30, 460, L - 30, fY + 0.40, fY + 0.51);
      addPart('bedding', 30, 50, 460, L - 50, fY + 0.32, fY + 0.51);
      addPart('bedding', W - 50, W - 30, 460, L - 50, fY + 0.32, fY + 0.51);
      addPart('bedding', 50, W - 50, L - 50, L - 30, fY + 0.32, fY + 0.51);
      addPart('whiteG', 30, W - 30, 430, 560, fY + 0.495, fY + 0.515);
      // Folded throw at foot
      addPart('curtain2', 80, W - 80, L - 280, L - 60, fY + 0.50, fY + 0.56);
      addPart('curtain', 100, W - 100, L - 240, L - 90, fY + 0.55, fY + 0.59);
      // Brass leg cups
      for (const [u0, u1, v0, v1] of [[40, 120, 40, 120], [W - 120, W - 40, 40, 120], [40, 120, L - 120, L - 40], [W - 120, W - 40, L - 120, L - 40]]) {
        addPart('brass', u0 + 10, u1 - 10, v0 + 10, v1 - 10, fY, fY + 0.02);
      }
    },
    side(bag, x0, x1, y0, y1, fY) {
      // Nightstand: legs + carcass + drawer + top + lamp
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      for (const [lx, ly] of [[x0 + 30, y0 + 30], [x1 - 30, y0 + 30], [x0 + 30, y1 - 40], [x1 - 30, y1 - 40]]) {
        bag.cyl('woodD', lx / 1000, fY + 0.05, -ly / 1000, 0.018, 0.10);
      }
      pb(bag, 'woodF', x0 + 8, x1 - 8, y0 + 8, y1 - 28, fY + 0.10, fY + 0.44);
      pb(bag, 'woodD', x0 - 8, x1 + 8, y0 - 8, y1 - 8, fY + 0.44, fY + 0.48);
      // Drawer face + brass bar pull
      pb(bag, 'woodD', x0 + 18, x1 - 18, y1 - 30, y1 - 14, fY + 0.16, fY + 0.40);
      pb(bag, 'brass', cx - 40, cx + 40, y1 - 14, y1 - 6, fY + 0.26, fY + 0.28);
      // Book / tray on top
      pb(bag, 'curtain', cx - 60, cx + 40, cy - 40, cy + 30, fY + 0.48, fY + 0.50);
      // Slim brass table lamp + warm shade
      bag.cyl('brass', cx / 1000, fY + 0.50, -cy / 1000, 0.028, 0.04);
      bag.cyl('brass', cx / 1000, fY + 0.68, -cy / 1000, 0.008, 0.32);
      bag.cyl('curtain2', cx / 1000, fY + 0.92, -cy / 1000, 0.095, 0.16);
      bag.cyl('lamp', cx / 1000, fY + 0.88, -cy / 1000, 0.055, 0.05);
    },
    wardrobe(bag, x0, x1, y0, y1, fY) {
      pb(bag, 'woodD', x0, x1, y0, y1, fY, fY + 2.36);
      pb(bag, 'woodF', x0 - 8, x1 + 8, y0 - 8, y1 + 8, fY + 2.36, fY + 2.42);
      const mid = (x0 + x1) / 2;
      pb(bag, 'woodF', x0 + 12, mid - 4, y0 - 14, y0, fY + 0.06, fY + 2.30);
      pb(bag, 'woodF', mid + 4, x1 - 12, y0 - 14, y0, fY + 0.06, fY + 2.30);
      pb(bag, 'brass', mid - 28, mid - 12, y0 - 22, y0 - 14, fY + 1.0, fY + 1.35);
      pb(bag, 'brass', mid + 12, mid + 28, y0 - 22, y0 - 14, fY + 1.0, fY + 1.35);
    },
    vastuWardrobe(bag, x0, x1, y0, y1, fY, winCenter, winWidth, sillH) {
      const w0 = winCenter - winWidth / 2;
      const w1 = winCenter + winWidth / 2;

      function drawSection(ya, yb, isFullHeight) {
        if (yb - ya < 100) return;
        
        const faceWest = (x0 < 1000); // room facing side is x1 if true, x0 if false
        const fx = faceWest ? x1 : x0;
        
        if (isFullHeight) {
          // Carcass — rear face pushed 25mm into the wall so it never sits
          // coplanar with the wall face (which would z-fight).
          pb(bag, 'woodD', faceWest ? x0 - 25 : x0, faceWest ? x1 : x1 + 25, ya, yb, fY, fY + 2.36);
          // Top crown molding (overhangs the proud door faces)
          pb(bag, 'woodF', faceWest ? x0 : x0 - 18, faceWest ? x1 + 18 : x1, ya, yb, fY + 2.36, fY + 2.40);

          const sectW = yb - ya;
          const numDoors = Math.max(1, Math.round(sectW / 500));
          const dw = sectW / numDoors;

          for (let i = 0; i < numDoors; i++) {
            const dya = ya + i * dw;
            const dyb = ya + (i + 1) * dw;

            // Door panel stands 14mm proud of the carcass; the inset gaps
            // reveal the darker carcass behind as recess lines — no coplanar
            // faces, so no z-fighting.
            if (faceWest) {
              pb(bag, 'woodF', x1, x1 + 14, dya + 12, dyb - 12, fY + 0.05, fY + 2.30);
            } else {
              pb(bag, 'woodF', x0 - 14, x0, dya + 12, dyb - 12, fY + 0.05, fY + 2.30);
            }

            // Sleek brass bar handle, proud of the door face
            const handleY = dya + dw / 2;
            if (faceWest) {
              pb(bag, 'brass', x1 + 14, x1 + 24, handleY - 12, handleY + 12, fY + 0.90, fY + 1.20);
            } else {
              pb(bag, 'brass', x0 - 24, x0 - 14, handleY - 12, handleY + 12, fY + 0.90, fY + 1.20);
            }
          }
        } else {
          // Low counter section under the window (carcass buried into wall)
          pb(bag, 'woodD', faceWest ? x0 - 25 : x0, faceWest ? x1 : x1 + 25, ya, yb, fY, fY + sillH - 0.04);
          pb(bag, 'woodF', x0 - 15, x1 + 15, ya - 10, yb + 10, fY + sillH - 0.04, fY + sillH);

          const sectW = yb - ya;
          const numDrawers = Math.max(1, Math.round(sectW / 600));
          const dw = sectW / numDrawers;

          for (let i = 0; i < numDrawers; i++) {
            const dya = ya + i * dw;
            const dyb = ya + (i + 1) * dw;

            // Drawer front proud of the carcass; reveals form the gaps.
            if (faceWest) {
              pb(bag, 'woodF', x1, x1 + 12, dya + 8, dyb - 8, fY + 0.08, fY + sillH - 0.08);
              pb(bag, 'brass', x1 + 12, x1 + 22, dya + dw / 2 - 15, dya + dw / 2 + 15, fY + sillH / 2 - 0.012, fY + sillH / 2 + 0.012);
            } else {
              pb(bag, 'woodF', x0 - 12, x0, dya + 8, dyb - 8, fY + 0.08, fY + sillH - 0.08);
              pb(bag, 'brass', x0 - 22, x0 - 12, dya + dw / 2 - 15, dya + dw / 2 + 15, fY + sillH / 2 - 0.012, fY + sillH / 2 + 0.012);
            }
          }
        }
      }

      drawSection(y0, w0, true);
      drawSection(w0, w1, false);
      drawSection(w1, y1, true);
    },
    sofa(bag, x0, x1, y0, y1, fY, back, omitArmStart = false, omitArmEnd = false) {
      const isNS = (back === 'N' || back === 'S');
      const W = isNS ? (x1 - x0) : (y1 - y0);
      const L = isNS ? (y1 - y0) : (x1 - x0);

      function addPart(mat, u0, u1, v0, v1, h0, h1, tilt = 0) {
        let lx0, lx1, ly0, ly1;
        let rx = 0, ry = 0, rz = 0;

        if (back === 'S') {
          lx0 = x0 + u0; lx1 = x0 + u1; ly0 = y0 + v0; ly1 = y0 + v1; rx = tilt;
        } else if (back === 'N') {
          lx0 = x0 + u0; lx1 = x0 + u1; ly0 = y1 - v1; ly1 = y1 - v0; rx = -tilt;
        } else if (back === 'W') {
          lx0 = x0 + v0; lx1 = x0 + v1; ly0 = y0 + u0; ly1 = y0 + u1; rz = -tilt;
        } else { // E
          lx0 = x1 - v1; lx1 = x1 - v0; ly0 = y0 + u0; ly1 = y0 + u1; rz = tilt;
        }
        pb(bag, mat, lx0, lx1, ly0, ly1, h0, h1, rx, ry, rz);
      }

      // 1. Sleek legs at 4 corners
      addPart('woodF', 20, 70, 20, 70, fY, fY + 0.10);
      addPart('woodF', W - 70, W - 20, 20, 70, fY, fY + 0.10);
      addPart('woodF', 20, 70, L - 70, L - 20, fY, fY + 0.10);
      addPart('woodF', W - 70, W - 20, L - 70, L - 20, fY, fY + 0.10);

      // 2. Base plinth frame
      addPart('fabric2', 0, W, 0, L, fY + 0.10, fY + 0.22);

      // 3. Backrest frame
      addPart('fabric2', 0, W, 0, 150, fY + 0.22, fY + 0.78);

      // 4. Armrests
      if (!omitArmStart) {
        addPart('fabric2', 0, 120, 150, L, fY + 0.22, fY + 0.58);
        addPart('fabric', -10, 130, 160, L - 10, fY + 0.58, fY + 0.62);
      }
      if (!omitArmEnd) {
        addPart('fabric2', W - 120, W, 150, L, fY + 0.22, fY + 0.58);
        addPart('fabric', W - 130, W + 10, 160, L - 10, fY + 0.58, fY + 0.62);
      }

      // 5. Cushion splits
      const startU = omitArmStart ? 0 : 120;
      const endU = omitArmEnd ? W : W - 120;
      const SW = endU - startU; // width between arms
      const n = SW >= 1600 ? 3 : (SW >= 900 ? 2 : 1);
      const cw = SW / n;

      for (let i = 0; i < n; i++) {
        const cu0 = startU + i * cw + 6;
        const cu1 = startU + (i + 1) * cw - 6;
        // Seat cushion
        addPart('fabric', cu0, cu1, 150, L - 15, fY + 0.22, fY + 0.38);
        // Backrest cushion (angled back: tilt = 0.14)
        addPart('fabric', cu0 + 6, cu1 - 6, 120, 220, fY + 0.36, fY + 0.76, 0.14);
      }

      // 6. Cozy corner throw pillows (fabric, not brass blocks)
      if (W >= 900) {
        if (!omitArmStart) {
          addPart('curtain', 150, 360, 190, 270, fY + 0.36, fY + 0.55, 0.12);
          addPart('curtain2', 170, 300, 210, 255, fY + 0.48, fY + 0.58, 0.18);
        }
        if (!omitArmEnd) {
          addPart('curtain2', W - 360, W - 150, 190, 270, fY + 0.36, fY + 0.55, 0.12);
          addPart('curtain', W - 300, W - 170, 210, 255, fY + 0.48, fY + 0.58, 0.18);
        }
      }
      // Slim seat welting along front edge
      addPart('woodF', startU + 10, endU - 10, L - 28, L - 12, fY + 0.36, fY + 0.39);
    },
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
    chair(bag, cx, cy, fY, facing) {
      // Dining chair: tapered wood legs, fabric seat + back, brass studs
      const r = 0.016;
      const lh = 0.40;
      const legOffset = 175;
      const legs = [
        [cx - legOffset, cy - legOffset],
        [cx + legOffset, cy - legOffset],
        [cx - legOffset, cy + legOffset],
        [cx + legOffset, cy + legOffset]
      ];
      for (const [lx, ly] of legs) {
        bag.cyl('woodD', lx / 1000, fY + lh / 2, -ly / 1000, r, lh);
      }

      pb(bag, 'woodD', cx - 190, cx + 190, cy - 190, cy + 190, fY + 0.35, fY + 0.40);
      pb(bag, 'fabric2', cx - 215, cx + 215, cy - 215, cy + 215, fY + 0.40, fY + 0.48);
      pb(bag, 'fabric', cx - 195, cx + 195, cy - 195, cy + 195, fY + 0.475, fY + 0.495); // seat welt

      const t = 48;
      const postR = 0.013;
      const backH = 0.90;
      if (facing === 'N') {
        bag.cyl('woodD', (cx - 145) / 1000, fY + 0.62, -(cy - 200) / 1000, postR, 0.44);
        bag.cyl('woodD', (cx + 145) / 1000, fY + 0.62, -(cy - 200) / 1000, postR, 0.44);
        pb(bag, 'fabric2', cx - 200, cx + 200, cy - 220, cy - 220 + t, fY + 0.56, fY + backH);
        pb(bag, 'brass', cx - 30, cx + 30, cy - 224, cy - 218, fY + 0.72, fY + 0.74);
      } else if (facing === 'S') {
        bag.cyl('woodD', (cx - 145) / 1000, fY + 0.62, -(cy + 200) / 1000, postR, 0.44);
        bag.cyl('woodD', (cx + 145) / 1000, fY + 0.62, -(cy + 200) / 1000, postR, 0.44);
        pb(bag, 'fabric2', cx - 200, cx + 200, cy + 220 - t, cy + 220, fY + 0.56, fY + backH);
        pb(bag, 'brass', cx - 30, cx + 30, cy + 218, cy + 224, fY + 0.72, fY + 0.74);
      } else if (facing === 'E') {
        bag.cyl('woodD', (cx - 200) / 1000, fY + 0.62, -(cy - 145) / 1000, postR, 0.44);
        bag.cyl('woodD', (cx - 200) / 1000, fY + 0.62, -(cy + 145) / 1000, postR, 0.44);
        pb(bag, 'fabric2', cx - 220, cx - 220 + t, cy - 200, cy + 200, fY + 0.56, fY + backH);
        pb(bag, 'brass', cx - 224, cx - 218, cy - 30, cy + 30, fY + 0.72, fY + 0.74);
      } else {
        bag.cyl('woodD', (cx + 200) / 1000, fY + 0.62, -(cy - 145) / 1000, postR, 0.44);
        bag.cyl('woodD', (cx + 200) / 1000, fY + 0.62, -(cy + 145) / 1000, postR, 0.44);
        pb(bag, 'fabric2', cx + 220 - t, cx + 220, cy - 200, cy + 200, fY + 0.56, fY + backH);
        pb(bag, 'brass', cx + 218, cx + 224, cy - 30, cy + 30, fY + 0.72, fY + 0.74);
      }
    },
    executiveChair(bag, cx, cy, fY, facing) {
      // 1. Swivel caster wheels
      const wh = 0.04;
      const casterR = 0.02;
      const offsets = [
        [cx - 220, cy],
        [cx + 220, cy],
        [cx, cy - 220],
        [cx, cy + 220]
      ];
      for (const [wx, wy] of offsets) {
        bag.cyl('dark', wx / 1000, fY + wh / 2, -wy / 1000, casterR, wh);
      }

      // 2. Swivel base cross struts
      pb(bag, 'dark', cx - 240, cx + 240, cy - 30, cy + 30, fY + 0.04, fY + 0.08);
      pb(bag, 'dark', cx - 30, cx + 30, cy - 240, cy + 240, fY + 0.04, fY + 0.08);

      // 3. Central hydraulic support piston
      bag.cyl('steel', cx / 1000, fY + 0.25, -cy / 1000, 0.03, 0.34);
      // Under-seat adjustment box
      pb(bag, 'dark', cx - 100, cx + 100, cy - 100, cy + 100, fY + 0.38, fY + 0.42);

      // 4. Ergonomic contoured leather seat cushion
      pb(bag, 'dark', cx - 240, cx + 240, cy - 240, cy + 240, fY + 0.42, fY + 0.50);

      // 5. Backrest and Armrests based on orientation
      const t = 70; // backrest thickness
      if (facing === 'N') {
        // Rear support spine (steel)
        pb(bag, 'steel', cx - 30, cx + 30, cy - 250, cy - 230, fY + 0.42, fY + 0.90);
        // Segmented Backrest
        pb(bag, 'dark', cx - 230, cx + 230, cy - 240, cy - 240 + t, fY + 0.50, fY + 0.74);
        pb(bag, 'dark', cx - 230, cx + 230, cy - 240, cy - 240 + t, fY + 0.76, fY + 0.98);
        pb(bag, 'fabric2', cx - 160, cx + 160, cy - 240, cy - 240 + t + 10, fY + 1.00, fY + 1.15);
        
        // Steel armrest loop supports
        bag.cyl('steel', (cx - 255) / 1000, fY + 0.60, -(cy - 120) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx - 255) / 1000, fY + 0.60, -(cy + 120) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx + 255) / 1000, fY + 0.60, -(cy - 120) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx + 255) / 1000, fY + 0.60, -(cy + 120) / 1000, 0.012, 0.20);
        // Padded arm covers
        pb(bag, 'fabric2', cx - 275, cx - 235, cy - 180, cy + 180, fY + 0.70, fY + 0.74);
        pb(bag, 'fabric2', cx + 235, cx + 275, cy - 180, cy + 180, fY + 0.70, fY + 0.74);

      } else if (facing === 'S') {
        pb(bag, 'steel', cx - 30, cx + 30, cy + 230, cy + 250, fY + 0.42, fY + 0.90);
        pb(bag, 'dark', cx - 230, cx + 230, cy + 240 - t, cy + 240, fY + 0.50, fY + 0.74);
        pb(bag, 'dark', cx - 230, cx + 230, cy + 240 - t, cy + 240, fY + 0.76, fY + 0.98);
        pb(bag, 'fabric2', cx - 160, cx + 160, cy + 240 - t - 10, cy + 240, fY + 1.00, fY + 1.15);

        bag.cyl('steel', (cx - 255) / 1000, fY + 0.60, -(cy - 120) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx - 255) / 1000, fY + 0.60, -(cy + 120) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx + 255) / 1000, fY + 0.60, -(cy - 120) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx + 255) / 1000, fY + 0.60, -(cy + 120) / 1000, 0.012, 0.20);
        pb(bag, 'fabric2', cx - 275, cx - 235, cy - 180, cy + 180, fY + 0.70, fY + 0.74);
        pb(bag, 'fabric2', cx + 235, cx + 275, cy - 180, cy + 180, fY + 0.70, fY + 0.74);

      } else if (facing === 'E') {
        pb(bag, 'steel', cx - 250, cx - 230, cy - 30, cy + 30, fY + 0.42, fY + 0.90);
        pb(bag, 'dark', cx - 240, cx - 240 + t, cy - 230, cy + 230, fY + 0.50, fY + 0.74);
        pb(bag, 'dark', cx - 240, cx - 240 + t, cy - 230, cy + 230, fY + 0.76, fY + 0.98);
        pb(bag, 'fabric2', cx - 240, cx - 240 + t + 10, cy - 160, cy + 160, fY + 1.00, fY + 1.15);

        bag.cyl('steel', (cx - 120) / 1000, fY + 0.60, -(cy - 255) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx + 120) / 1000, fY + 0.60, -(cy - 255) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx - 120) / 1000, fY + 0.60, -(cy + 255) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx + 120) / 1000, fY + 0.60, -(cy + 255) / 1000, 0.012, 0.20);
        pb(bag, 'fabric2', cx - 180, cx + 180, cy - 275, cy - 235, fY + 0.70, fY + 0.74);
        pb(bag, 'fabric2', cx - 180, cx + 180, cy + 235, cy + 275, fY + 0.70, fY + 0.74);

      } else { // W
        pb(bag, 'steel', cx + 230, cx + 250, cy - 30, cy + 30, fY + 0.42, fY + 0.90);
        pb(bag, 'dark', cx + 240 - t, cx + 240, cy - 230, cy + 230, fY + 0.50, fY + 0.74);
        pb(bag, 'dark', cx + 240 - t, cx + 240, cy - 230, cy + 230, fY + 0.76, fY + 0.98);
        pb(bag, 'fabric2', cx + 240 - t - 10, cx + 240, cy - 160, cy + 160, fY + 1.00, fY + 1.15);

        bag.cyl('steel', (cx - 120) / 1000, fY + 0.60, -(cy - 255) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx + 120) / 1000, fY + 0.60, -(cy - 255) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx - 120) / 1000, fY + 0.60, -(cy + 255) / 1000, 0.012, 0.20);
        bag.cyl('steel', (cx + 120) / 1000, fY + 0.60, -(cy + 255) / 1000, 0.012, 0.20);
        pb(bag, 'fabric2', cx - 180, cx + 180, cy - 275, cy - 235, fY + 0.70, fY + 0.74);
        pb(bag, 'fabric2', cx - 180, cx + 180, cy + 235, cy + 275, fY + 0.70, fY + 0.74);
      }
    },
    /* Slim black TV panel. face 'x' = along X facing south; 'y' = along Y facing west. */
    tv(bag, face, fixed, a0, a1, fY) {
      const W = a1 - a0;
      const mid = W * 0.5;
      const h0 = fY + 0.95, h1 = fY + 1.70;
      function part(mat, u0, u1, v0, v1, z0, z1) {
        let lx0, lx1, ly0, ly1;
        if (face === 'x') {
          lx0 = a0 + u0; lx1 = a0 + u1;
          ly0 = fixed - 16 + v0; ly1 = fixed - 16 + v1;
        } else {
          ly0 = a0 + u0; ly1 = a0 + u1;
          lx0 = fixed - 16 + v0; lx1 = fixed - 16 + v1;
        }
        pb(bag, mat, lx0, lx1, ly0, ly1, z0, z1);
      }
      part('charDark', -6, W + 6, 8, 18, h0 - 0.01, h1 + 0.01);
      part('tv', 0, W, 0, 8, h0, h1);
      part('dark', mid - 160, mid + 160, 18, 42, fY + 1.20, fY + 1.45);
      part('charcoal', mid - 340, mid + 340, 6, 32, fY + 0.82, fY + 0.87);
    },

    /* Floating media / foyer console — thin steel legs, wood body, tray top. */
    console(bag, x0, x1, y0, y1, fY) {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      for (const [lx, ly] of [[x0 + 50, y0 + 40], [x1 - 50, y0 + 40], [x0 + 50, y1 - 40], [x1 - 50, y1 - 40]]) {
        bag.cyl('steel', lx / 1000, fY + 0.14, -ly / 1000, 0.014, 0.28);
      }
      pb(bag, 'woodD', x0, x1, y0, y1, fY + 0.26, fY + 0.42);
      pb(bag, 'woodF', x0 - 8, x1 + 8, y0 - 8, y1 + 8, fY + 0.42, fY + 0.46);
      pb(bag, 'brass', cx - 70, cx + 70, y0 - 6, y0 + 2, fY + 0.33, fY + 0.345);
      // Decorative tray + vase on top
      pb(bag, 'brass', cx - 90, cx + 40, cy - 50, cy + 50, fY + 0.46, fY + 0.48);
      bag.cyl('accentWarm', (cx + 60) / 1000, fY + 0.58, -cy / 1000, 0.035, 0.22);
      bag.sph('green2', (cx + 60) / 1000, fY + 0.78, -cy / 1000, 0.08);
      bag.sph('leafLight', (cx + 50) / 1000, fY + 0.82, -(cy + 30) / 1000, 0.05);
    },

    /* ================================================================
       DOUBLE-HEIGHT TV FEATURE WALL
       Wall span is only ~2.2 m (6020–8241). Niche must be wide enough
       for the TV (previous bug: 1110 mm niche vs 1480 mm TV → invisible).
       Layout: [fluted wing | open niche + TV | fluted wing]
       ================================================================ */
    tvFeatureWall(bag, x0, x1, y0, y1, fY, H, isLower) {
      const wallW = x1 - x0;
      const mid = (x0 + x1) * 0.5;
      const backY = 8640;                 // structural interior of north shell

      // Depths into room (mm, south = smaller y)
      const yWing = backY - 130;          // wing face
      const yMouth = backY - 280;         // niche opening
      const yBack = backY - 25;           // niche back face

      // Niche ~62% of wall so wings still have room for flutes, TV fits inside
      const nicheW = Math.round(Math.min(wallW - 520, Math.max(1500, wallW * 0.62)));
      const n0 = Math.round(mid - nicheW * 0.5);
      const n1 = Math.round(mid + nicheW * 0.5);
      const RET = 30;                     // return thickness
      const open0 = n0 + RET;             // clear opening left
      const open1 = n1 - RET;             // clear opening right
      const openW = open1 - open0;

      const z0 = fY + 0.015;
      const z1 = fY + H - 0.015;

      // ── WINGS ──────────────────────────────────────────────
      pb(bag, 'charcoal', x0, n0, yWing, backY, z0, z1);
      pb(bag, 'charcoal', n1, x1, yWing, backY, z0, z1);
      pb(bag, 'woodD', x0, n0, yWing - 5, yWing, z0, z1);
      pb(bag, 'woodD', n1, x1, yWing - 5, yWing, z0, z1);

      const pitch = 52, rib = 24;
      for (let x = x0 + 18; x + rib <= n0 - 12; x += pitch) {
        pb(bag, 'woodF', x, x + rib, yWing - 18, yWing - 5, z0 + 0.06, z1 - 0.06);
      }
      for (let x = n1 + 12; x + rib <= x1 - 18; x += pitch) {
        pb(bag, 'woodF', x, x + rib, yWing - 18, yWing - 5, z0 + 0.06, z1 - 0.06);
      }
      pb(bag, 'charDark', x0, n0, yWing - 4, backY, fY, z0 + 0.015);
      pb(bag, 'charDark', n1, x1, yWing - 4, backY, fY, z0 + 0.015);

      // ── NICHE BOX ──────────────────────────────────────────
      pb(bag, 'charDark', n0, n1, yBack, backY, z0, z1);
      // side returns
      pb(bag, 'charcoal', n0, open0, yMouth, yBack, z0, z1);
      pb(bag, 'charcoal', open1, n1, yMouth, yBack, z0, z1);
      // wood face on return fronts (room-facing)
      pb(bag, 'woodD', n0 + 2, open0 - 2, yMouth, yMouth + 8, z0, z1);
      pb(bag, 'woodD', open1 + 2, n1 - 2, yMouth, yMouth + 8, z0, z1);
      // niche floor + soffit
      pb(bag, 'charcoal', open0, open1, yMouth, yBack, fY, fY + 0.05);
      pb(bag, 'woodF', open0 + 10, open1 - 10, yMouth + 10, yBack - 10, fY + 0.048, fY + 0.055);
      pb(bag, 'charcoal', open0, open1, yMouth, yBack, z1 - 0.055, z1);
      // LED coves
      pb(bag, 'lamp', open0 + 4, open0 + 12, yMouth + 16, yBack - 16, z0 + 0.18, z1 - 0.18);
      pb(bag, 'lamp', open1 - 12, open1 - 4, yMouth + 16, yBack - 16, z0 + 0.18, z1 - 0.18);
      pb(bag, 'lamp', open0 + 30, open1 - 30, yMouth + 40, yBack - 40, z1 - 0.085, z1 - 0.05);
      // outer edge reveals
      pb(bag, 'charDark', x0 - 8, x0, yWing - 2, backY, z0, z1);
      pb(bag, 'charDark', x1, x1 + 8, yWing - 2, backY, z0, z1);

      if (isLower) {
        // ── TV fits INSIDE clear opening (16:9), centred ──
        // leave ≥80 mm air each side of screen inside open0..open1
        const tvW = Math.min(1320, openW - 160);
        const tvH = tvW * (9 / 16) / 1000;   // metres, true 16:9
        const tvX0 = mid - tvW * 0.5;
        const tvX1 = mid + tvW * 0.5;
        const tvBottom = fY + 1.08;
        const tvTop = tvBottom + tvH;

        // TV sits mid-depth in niche, screen facing south (into room)
        const tvFront = yMouth + 90;         // clear of mouth plane
        const tvThick = 22;
        const tvRear = tvFront + tvThick;

        // Mount plate (behind set, against back field — not covering screen)
        pb(bag, 'charcoal',
          tvX0 - 50, tvX1 + 50,
          tvRear + 10, yBack - 4,
          tvBottom - 0.10, tvTop + 0.10);

        // Outer steel bezel (high-contrast frame)
        const bz = 14;
        pb(bag, 'steel',
          tvX0 - bz, tvX1 + bz,
          tvFront - 4, tvRear + 2,
          tvBottom - bz / 1000, tvTop + bz / 1000);
        // Inner charcoal bezel
        pb(bag, 'charDark',
          tvX0 - 5, tvX1 + 5,
          tvFront - 1, tvRear,
          tvBottom - 0.005, tvTop + 0.005);
        // Screen — front face only (must be the southernmost TV layer)
        pb(bag, 'tv',
          tvX0, tvX1,
          tvFront - 12, tvFront,
          tvBottom, tvTop);
        // Power LED under bezel centre
        pb(bag, 'lamp',
          mid - 28, mid + 28,
          tvFront - 14, tvFront - 10,
          tvBottom + 0.008, tvBottom + 0.016);

        // Soundbar — narrower than TV, under it, same depth band
        const barW = Math.min(tvW * 0.55, 720);
        const barTop = tvBottom - 0.07;
        const barBot = barTop - 0.05;
        pb(bag, 'charDark', mid - barW * 0.5, mid + barW * 0.5, tvFront - 2, tvRear - 2, barBot, barTop);
        pb(bag, 'steel', mid - barW * 0.5 - 6, mid - barW * 0.5, tvFront - 2, tvRear - 2, barBot, barTop);
        pb(bag, 'steel', mid + barW * 0.5, mid + barW * 0.5 + 6, tvFront - 2, tvRear - 2, barBot, barTop);

        // Media bench — width tracks niche, fully outside mouth
        const bX0 = n0 + 40, bX1 = n1 - 40;
        const bY0 = yMouth - 380;
        const bY1 = yMouth - 70;
        const bZ0 = fY + 0.30, bZ1 = fY + 0.42;
        pb(bag, 'dark', bX0 + 60, bX1 - 60, bY0 + 40, bY1 - 25, fY + 0.03, fY + 0.07);
        pb(bag, 'charDark', bX0 + 80, bX0 + 140, bY0 + 50, bY1 - 15, fY + 0.07, bZ0);
        pb(bag, 'charDark', bX1 - 140, bX1 - 80, bY0 + 50, bY1 - 15, fY + 0.07, bZ0);
        pb(bag, 'woodD', bX0, bX1, bY0, bY1, bZ0, bZ1);
        pb(bag, 'woodF', bX0 + 6, bX1 - 6, bY0 + 6, bY1 - 6, bZ1 - 0.008, bZ1);
        pb(bag, 'woodF', bX0, bX1, bY0, bY0 + 6, bZ0, bZ1);
        pb(bag, 'brass', mid - 70, mid + 70, bY0 - 2, bY0 + 2, fY + 0.345, fY + 0.36);
      }
      // Upper floor: empty continuous niche — no decor
    },
    counterX(bag, x0, x1, y0, y1, fY) {
      // Full base carcass + toe-kick recess + granite worktop + steel edge trim
      pb(bag, 'woodD', x0 + 8, x1 - 8, y0 + 8, y1 - 8, fY + 0.02, fY + 0.08);
      pb(bag, 'counter', x0, x1, y0, y1, fY + 0.08, fY + 0.82);
      pb(bag, 'counterTop', x0 - 12, x1 + 12, y0 - 12, y1 + 12, fY + 0.82, fY + 0.88);
      // Thin stainless edge bead on the room-side long edges
      pb(bag, 'steel', x0 - 14, x1 + 14, y0 - 14, y0 - 10, fY + 0.82, fY + 0.885);
      pb(bag, 'steel', x0 - 14, x1 + 14, y1 + 10, y1 + 14, fY + 0.82, fY + 0.885);
      pb(bag, 'steel', x0 - 14, x0 - 10, y0 - 12, y1 + 12, fY + 0.82, fY + 0.885);
      pb(bag, 'steel', x1 + 10, x1 + 14, y0 - 12, y1 + 12, fY + 0.82, fY + 0.885);
    },

    /* Base cupboard doors along one face of a counter run.
       face: which way doors face ('N'|'S'|'E'|'W')
       fixed: the plane of the door front (x or y in mm)
       a0..a1: span along the run
       segs: optional array of widths (mm); otherwise equal doors */
    kitBaseDoors(bag, face, fixed, a0, a1, fY, segs) {
      const T = 18;                      // door thickness
      const gap = 3;
      const h0 = fY + 0.10, h1 = fY + 0.80;
      const span = a1 - a0;
      let widths = segs;
      if (!widths || !widths.length) {
        const n = Math.max(1, Math.round(span / 450));
        const w = (span - gap * (n + 1)) / n;
        widths = [];
        for (let i = 0; i < n; i++) widths.push(w);
      }
      let cursor = a0 + gap;
      for (let i = 0; i < widths.length; i++) {
        const w = widths[i];
        const s = cursor, e = cursor + w;
        cursor = e + gap;
        if (face === 'W') {
          pb(bag, 'woodD', fixed - T, fixed, s, e, h0, h1);
          bag.cyl('brass', (fixed - T - 4) / 1000, fY + 0.48, -((s + e) / 2) / 1000, 0.006, 0.10);
        } else if (face === 'E') {
          pb(bag, 'woodD', fixed, fixed + T, s, e, h0, h1);
          bag.cyl('brass', (fixed + T + 4) / 1000, fY + 0.48, -((s + e) / 2) / 1000, 0.006, 0.10);
        } else if (face === 'N') {
          pb(bag, 'woodD', s, e, fixed, fixed + T, h0, h1);
          bag.cyl('brass', ((s + e) / 2) / 1000, fY + 0.48, -(fixed + T + 4) / 1000, 0.006, 0.10, 0, 0, Math.PI / 2);
        } else { // S
          pb(bag, 'woodD', s, e, fixed - T, fixed, h0, h1);
          bag.cyl('brass', ((s + e) / 2) / 1000, fY + 0.48, -(fixed - T - 4) / 1000, 0.006, 0.10, 0, 0, Math.PI / 2);
        }
      }
    },

    /* Pair of pot drawers (stacked) under a hob zone */
    kitBaseDrawers(bag, face, fixed, a0, a1, fY) {
      const T = 18, mid = (a0 + a1) / 2;
      const lows = [fY + 0.10, fY + 0.44], his = [fY + 0.40, fY + 0.80];
      for (let k = 0; k < 2; k++) {
        if (face === 'W') {
          pb(bag, 'woodD', fixed - T, fixed, a0, a1, lows[k], his[k]);
          pb(bag, 'brass', fixed - T - 3, fixed - T, mid - 50, mid + 50, (lows[k] + his[k]) / 2 - 0.01, (lows[k] + his[k]) / 2 + 0.01);
        } else if (face === 'N') {
          pb(bag, 'woodD', a0, a1, fixed, fixed + T, lows[k], his[k]);
          pb(bag, 'brass', mid - 50, mid + 50, fixed + T, fixed + T + 3, (lows[k] + his[k]) / 2 - 0.01, (lows[k] + his[k]) / 2 + 0.01);
        } else if (face === 'S') {
          pb(bag, 'woodD', a0, a1, fixed - T, fixed, lows[k], his[k]);
          pb(bag, 'brass', mid - 50, mid + 50, fixed - T - 3, fixed - T, (lows[k] + his[k]) / 2 - 0.01, (lows[k] + his[k]) / 2 + 0.01);
        }
      }
    },

    /* Full wall cupboard run: carcass + crown + proper doors (not paper strips).
       face = door direction; box is x0..x1, y0..y1 footprint of the carcass. */
    kitWallRun(bag, x0, x1, y0, y1, fY, face, nDoors) {
      const z0 = fY + 1.40, z1 = fY + 2.36, zc = fY + 2.40;
      // Carcass
      pb(bag, 'woodD', x0, x1, y0, y1, z0, z1);
      // Crown
      pb(bag, 'woodF', x0 - 8, x1 + 8, y0 - 8, y1 + 8, z1, zc);
      // Doors on the open face
      const T = 18, gap = 3;
      const h0 = z0 + 0.04, h1 = z1 - 0.04;
      if (face === 'N' || face === 'S') {
        const a0 = x0 + 8, a1 = x1 - 8;
        const n = nDoors || Math.max(1, Math.round((a1 - a0) / 480));
        const dw = (a1 - a0 - gap * (n + 1)) / n;
        let c = a0 + gap;
        const yD0 = face === 'N' ? y1 : y0 - T;
        const yD1 = face === 'N' ? y1 + T : y0;
        for (let i = 0; i < n; i++) {
          pb(bag, 'woodD', c, c + dw, yD0, yD1, h0, h1);
          const hx = (c + c + dw) / 2;
          const hy = face === 'N' ? y1 + T + 4 : y0 - T - 4;
          bag.cyl('brass', hx / 1000, fY + 1.70, -hy / 1000, 0.006, 0.09, 0, 0, Math.PI / 2);
          c += dw + gap;
        }
      } else {
        const a0 = y0 + 8, a1 = y1 - 8;
        const n = nDoors || Math.max(1, Math.round((a1 - a0) / 480));
        const dw = (a1 - a0 - gap * (n + 1)) / n;
        let c = a0 + gap;
        const xD0 = face === 'E' ? x1 : x0 - T;
        const xD1 = face === 'E' ? x1 + T : x0;
        for (let i = 0; i < n; i++) {
          pb(bag, 'woodD', xD0, xD1, c, c + dw, h0, h1);
          const hy = (c + c + dw) / 2;
          const hx = face === 'E' ? x1 + T + 4 : x0 - T - 4;
          bag.cyl('brass', hx / 1000, fY + 1.70, -hy / 1000, 0.006, 0.09);
          c += dw + gap;
        }
      }
    },

    /* Tall pantry cupboard with full-height double doors */
    kitPantry(bag, x0, x1, y0, y1, fY, face) {
      const z1 = fY + 2.36;
      pb(bag, 'woodD', x0, x1, y0, y1, fY, z1);
      pb(bag, 'woodF', x0 - 8, x1 + 8, y0 - 8, y1 + 8, z1, fY + 2.40);
      const T = 18, gap = 3, mid = face === 'E' || face === 'W' ? (y0 + y1) / 2 : (x0 + x1) / 2;
      const h0 = fY + 0.05, h1 = z1 - 0.04;
      if (face === 'E') {
        const a0 = y0 + 12, a1 = y1 - 12, m = (a0 + a1) / 2;
        pb(bag, 'woodD', x1, x1 + T, a0, m - gap / 2, h0, h1);
        pb(bag, 'woodD', x1, x1 + T, m + gap / 2, a1, h0, h1);
        pb(bag, 'brass', x1 + T, x1 + T + 4, m - 40, m - 20, fY + 1.05, fY + 1.35);
        pb(bag, 'brass', x1 + T, x1 + T + 4, m + 20, m + 40, fY + 1.05, fY + 1.35);
      } else if (face === 'W') {
        const a0 = y0 + 12, a1 = y1 - 12, m = (a0 + a1) / 2;
        pb(bag, 'woodD', x0 - T, x0, a0, m - gap / 2, h0, h1);
        pb(bag, 'woodD', x0 - T, x0, m + gap / 2, a1, h0, h1);
        pb(bag, 'brass', x0 - T - 4, x0 - T, m - 40, m - 20, fY + 1.05, fY + 1.35);
        pb(bag, 'brass', x0 - T - 4, x0 - T, m + 20, m + 40, fY + 1.05, fY + 1.35);
      }
    },
    fridge(bag, x0, x1, y0, y1, fY) {
      // Full-height stainless fridge: body, kick, dual doors, chrome pulls, water panel
      // Doors on the east face (kitchen layouts place the fridge against the west wall)
      const z1 = fY + 1.82;
      const midY = (y0 + y1) / 2;
      pb(bag, 'steel', x0, x1, y0, y1, fY + 0.08, z1);
      pb(bag, 'charDark', x0 + 8, x1 - 8, y0 + 8, y1 - 8, fY, fY + 0.08);
      pb(bag, 'steel', x0 - 6, x1 + 6, y0 - 6, y1 + 6, z1, z1 + 0.03);
      // Vertical door seam on east face
      pb(bag, 'ms', x1 - 4, x1 + 2, midY - 3, midY + 3, fY + 0.12, z1 - 0.06);
      // Chrome pulls on each leaf
      pb(bag, 'chrome', x1 + 2, x1 + 14, midY - 100, midY - 35, fY + 0.85, fY + 1.40);
      pb(bag, 'chrome', x1 + 2, x1 + 14, midY + 35, midY + 100, fY + 0.85, fY + 1.40);
      // Ice/water panel
      pb(bag, 'charDark', x1 - 2, x1 + 4, midY - 55, midY + 55, fY + 1.05, fY + 1.48);
      pb(bag, 'chrome', x1 + 4, x1 + 8, midY - 30, midY + 30, fY + 1.18, fY + 1.26);
    },
    hob(bag, cx, cy, fY, back) {
      back = back || 'E';
      const top = fY + 0.875;
      // glossy black glass cooktop, slightly proud of the counter
      pb(bag, 'tv', cx - 320, cx + 320, cy - 250, cy + 250, fY + 0.858, top);
      pb(bag, 'steel', cx - 320, cx + 320, cy - 250, cy + 250, fY + 0.852, fY + 0.86); // steel edge band
      // 2x2 gas burners: steel grate ring + dark cap + igniter pip
      for (const bx of [cx - 150, cx + 150]) for (const by of [cy - 115, cy + 115]) {
        bag.cyl('ms', bx / 1000, top + 0.012, -by / 1000, 0.092, 0.024);
        bag.cyl('dark', bx / 1000, top + 0.028, -by / 1000, 0.055, 0.034);
        bag.cyl('steel', bx / 1000, top + 0.05, -by / 1000, 0.024, 0.022);
      }
      // low stainless back-guard against the wall side
      if (back === 'E') pb(bag, 'steel', cx + 300, cx + 320, cy - 250, cy + 250, top, top + 0.09);
      else if (back === 'W') pb(bag, 'steel', cx - 320, cx - 300, cy - 250, cy + 250, top, top + 0.09);
      else if (back === 'N') pb(bag, 'steel', cx - 320, cx + 320, cy + 230, cy + 250, top, top + 0.09);
      else pb(bag, 'steel', cx - 320, cx + 320, cy - 250, cy - 230, top, top + 0.09);
    },
    /* Modern stainless drop-in kitchen sink + chrome gooseneck mixer.
       Built entirely on/above the counter so the bowl is visible without CSG
       cutouts in the solid countertop slab.
       back = wall the faucet sits against ('E'|'W'|'N'|'S'). */
    sink(bag, cx, cy, fY, back) {
      back = back || 'E';
      const ct = fY + 0.86;                 // counter top
      // Overall flange half-size (mm) ≈ 560 × 440 drop-in
      const ox = 275, oy = 210;
      const tw = 16;                        // trough wall thickness (mm)
      const floorY = ct + 0.012;            // bowl floor just above counter
      const rimY = ct + 0.155;              // rim height (~14 cm deep bowl)
      const lip = 0.010;                    // flange thickness

      // ---- 1. Stainless flange (hollow frame only — open centre) ----
      // Outer skirt sitting on the counter
      pb(bag, 'steel', cx - ox - 18, cx + ox + 18, cy - oy - 18, cy - oy, ct, ct + lip); // S
      pb(bag, 'steel', cx - ox - 18, cx + ox + 18, cy + oy, cy + oy + 18, ct, ct + lip); // N
      pb(bag, 'steel', cx - ox - 18, cx - ox, cy - oy, cy + oy, ct, ct + lip);             // W
      pb(bag, 'steel', cx + ox, cx + ox + 18, cy - oy, cy + oy, ct, ct + lip);             // E
      // Raised inner rim bead (around the trough opening)
      pb(bag, 'chrome', cx - ox - 2, cx + ox + 2, cy - oy - 2, cy - oy + 5, ct + lip, ct + lip + 0.006);
      pb(bag, 'chrome', cx - ox - 2, cx + ox + 2, cy + oy - 5, cy + oy + 2, ct + lip, ct + lip + 0.006);
      pb(bag, 'chrome', cx - ox - 2, cx - ox + 5, cy - oy, cy + oy, ct + lip, ct + lip + 0.006);
      pb(bag, 'chrome', cx + ox - 5, cx + ox + 2, cy - oy, cy + oy, ct + lip, ct + lip + 0.006);

      // ---- 2. Deep trough walls (outer steel + inner brushed) ----
      // Outer shell
      pb(bag, 'steel', cx - ox, cx + ox, cy + oy - tw, cy + oy, floorY, rimY); // N
      pb(bag, 'steel', cx - ox, cx + ox, cy - oy, cy - oy + tw, floorY, rimY); // S
      pb(bag, 'steel', cx + ox - tw, cx + ox, cy - oy, cy + oy, floorY, rimY); // E
      pb(bag, 'steel', cx - ox, cx - ox + tw, cy - oy, cy + oy, floorY, rimY); // W
      // Inner face (darker so the cavity reads as a real bowl)
      const iw = tw + 4;
      pb(bag, 'ms', cx - ox + tw, cx + ox - tw, cy + oy - iw, cy + oy - tw, floorY + 0.004, rimY - 0.004);
      pb(bag, 'ms', cx - ox + tw, cx + ox - tw, cy - oy + tw, cy - oy + iw, floorY + 0.004, rimY - 0.004);
      pb(bag, 'ms', cx + ox - iw, cx + ox - tw, cy - oy + tw, cy + oy - tw, floorY + 0.004, rimY - 0.004);
      pb(bag, 'ms', cx - ox + tw, cx - ox + iw, cy - oy + tw, cy + oy - tw, floorY + 0.004, rimY - 0.004);
      // Top rim of the trough walls (frame only — centre stays open)
      pb(bag, 'steel', cx - ox - 4, cx + ox + 4, cy - oy - 4, cy - oy + tw + 2, rimY, rimY + 0.008); // S
      pb(bag, 'steel', cx - ox - 4, cx + ox + 4, cy + oy - tw - 2, cy + oy + 4, rimY, rimY + 0.008); // N
      pb(bag, 'steel', cx - ox - 4, cx - ox + tw + 2, cy - oy + tw, cy + oy - tw, rimY, rimY + 0.008); // W
      pb(bag, 'steel', cx + ox - tw - 2, cx + ox + 4, cy - oy + tw, cy + oy - tw, rimY, rimY + 0.008); // E
      // Soft inner ledge on the rim (reads as rolled steel edge)
      pb(bag, 'ms', cx - ox + 2, cx + ox - 2, cy - oy + 2, cy - oy + tw + 4, rimY + 0.002, rimY + 0.007);
      pb(bag, 'ms', cx - ox + 2, cx + ox - 2, cy + oy - tw - 4, cy + oy - 2, rimY + 0.002, rimY + 0.007);
      pb(bag, 'ms', cx - ox + 2, cx - ox + tw + 4, cy - oy + tw, cy + oy - tw, rimY + 0.002, rimY + 0.007);
      pb(bag, 'ms', cx + ox - tw - 4, cx + ox - 2, cy - oy + tw, cy + oy - tw, rimY + 0.002, rimY + 0.007);

      // ---- 3. Bowl floor (wet steel + dark centre well) ----
      pb(bag, 'steel',
        cx - ox + tw, cx + ox - tw,
        cy - oy + tw, cy + oy - tw,
        floorY, floorY + 0.010);
      pb(bag, 'dark',
        cx - ox + tw + 8, cx + ox - tw - 8,
        cy - oy + tw + 8, cy + oy - tw - 8,
        floorY + 0.008, floorY + 0.013);
      // Slight centre depression toward the drain
      pb(bag, 'steel', cx - 60, cx + 60, cy - 60, cy + 60, floorY + 0.003, floorY + 0.010);

      // Drain grooves (4 slots toward centre)
      for (const a of [0, 45, 90, 135]) {
        const rad = a * Math.PI / 180;
        const dx = Math.cos(rad), dy = Math.sin(rad);
        const x0 = cx + dx * 85, y0 = cy + dy * 85;
        const x1 = cx + dx * 28, y1 = cy + dy * 28;
        const t = 3.2;
        pb(bag, 'ms',
          Math.min(x0, x1) - t, Math.max(x0, x1) + t,
          Math.min(y0, y1) - t, Math.max(y0, y1) + t,
          floorY + 0.012, floorY + 0.0145);
      }

      // ---- 4. Basket strainer ----
      bag.cyl('chrome', cx / 1000, floorY + 0.016, -cy / 1000, 0.050, 0.008);
      bag.cyl('steel',  cx / 1000, floorY + 0.020, -cy / 1000, 0.042, 0.010);
      bag.cyl('dark',   cx / 1000, floorY + 0.022, -cy / 1000, 0.033, 0.014);
      pb(bag, 'chrome', cx - 30, cx + 30, cy - 2.2, cy + 2.2, floorY + 0.027, floorY + 0.030);
      pb(bag, 'chrome', cx - 2.2, cx + 2.2, cy - 30, cy + 30, floorY + 0.027, floorY + 0.030);
      bag.cyl('chrome', cx / 1000, floorY + 0.033, -cy / 1000, 0.007, 0.014);

      // ---- 5. Slim drain-board ribs on the flange (side opposite faucet) ----
      if (back === 'E' || back === 'W') {
        const toward = (back === 'E') ? -1 : 1; // ribs toward room side of bowl
        const bx0 = cx + toward * 50;
        const bx1 = cx + toward * 200;
        for (let i = 0; i < 6; i++) {
          const yy = cy - 165 + i * 66;
          pb(bag, 'steel', Math.min(bx0, bx1), Math.max(bx0, bx1), yy - 7, yy + 7, ct + lip, ct + lip + 0.005);
        }
      } else {
        const toward = (back === 'N') ? -1 : 1;
        const by0 = cy + toward * 50;
        const by1 = cy + toward * 200;
        for (let i = 0; i < 6; i++) {
          const xx = cx - 165 + i * 66;
          pb(bag, 'steel', xx - 7, xx + 7, Math.min(by0, by1), Math.max(by0, by1), ct + lip, ct + lip + 0.005);
        }
      }

      // ---- 6. Chrome gooseneck single-lever mixer ----
      let fx = cx, fz = cy;
      if (back === 'E') fx = cx + ox + 32;
      else if (back === 'W') fx = cx - ox - 32;
      else if (back === 'N') fz = cy + oy + 32;
      else fz = cy - oy - 32;

      const fwx = fx / 1000, fwz = -fz / 1000;
      // Deck plate + body
      bag.cyl('chrome', fwx, ct + 0.007, fwz, 0.034, 0.014);
      bag.cyl('ms',     fwx, ct + 0.014, fwz, 0.025, 0.006);
      bag.cyl('chrome', fwx, ct + 0.058, fwz, 0.018, 0.090);
      // Riser + elbow
      bag.cyl('chrome', fwx, ct + 0.185, fwz, 0.0105, 0.230);
      bag.sph('chrome', fwx, ct + 0.308, fwz, 0.015);

      // Spout toward bowl centre + aerator
      if (back === 'E' || back === 'W') {
        const s = (fx > cx) ? -1 : 1;
        bag.cyl('chrome', (fx + s * 90) / 1000, ct + 0.305, -cy / 1000, 0.0095, 0.18, 0, 0, Math.PI / 2);
        bag.cyl('chrome',   (fx + s * 175) / 1000, ct + 0.288, -cy / 1000, 0.016, 0.040);
        bag.cyl('charcoal', (fx + s * 175) / 1000, ct + 0.264, -cy / 1000, 0.018, 0.010);
      } else {
        const s = (fz > cy) ? -1 : 1;
        bag.cyl('chrome', cx / 1000, ct + 0.305, -(fz + s * 90) / 1000, 0.0095, 0.18, Math.PI / 2, 0, 0);
        bag.cyl('chrome',   cx / 1000, ct + 0.288, -(fz + s * 175) / 1000, 0.016, 0.040);
        bag.cyl('charcoal', cx / 1000, ct + 0.264, -(fz + s * 175) / 1000, 0.018, 0.010);
      }

      // Side lever
      if (back === 'E' || back === 'W') {
        const hy = fz - 30;
        bag.cyl('chrome', fwx, ct + 0.075, -hy / 1000, 0.0075, 0.030, Math.PI / 2, 0, 0);
        bag.cyl('chrome', fwx, ct + 0.100, -hy / 1000, 0.0055, 0.058, 0.55, 0, 0);
        bag.sph('chrome', fwx, ct + 0.128, -hy / 1000, 0.009);
      } else {
        const hx = fx - 30;
        bag.cyl('chrome', hx / 1000, ct + 0.075, fwz, 0.0075, 0.030, 0, 0, Math.PI / 2);
        bag.cyl('chrome', hx / 1000, ct + 0.100, fwz, 0.0055, 0.058, 0, 0, 0.55);
        bag.sph('chrome', hx / 1000, ct + 0.128, fwz, 0.009);
      }

      // Matching soap dispenser
      let sx = fx, sz = fz;
      if (back === 'E' || back === 'W') sz = fz + 75;
      else sx = fx + 75;
      bag.cyl('chrome', sx / 1000, ct + 0.006, -sz / 1000, 0.019, 0.010);
      bag.cyl('chrome', sx / 1000, ct + 0.055, -sz / 1000, 0.0115, 0.095);
      bag.cyl('chrome', sx / 1000, ct + 0.110, -sz / 1000, 0.015, 0.022);
      if (back === 'E' || back === 'W') {
        const s = (fx > cx) ? -1 : 1;
        bag.cyl('chrome', (sx + s * 24) / 1000, ct + 0.118, -sz / 1000, 0.005, 0.042, 0, 0, Math.PI / 2);
      } else {
        const s = (fz > cy) ? -1 : 1;
        bag.cyl('chrome', sx / 1000, ct + 0.118, -(sz + s * 24) / 1000, 0.005, 0.042, Math.PI / 2, 0, 0);
      }
    },
    wc(bag, cx, cy, fY, facing) {
      facing = facing || 'S';
      pb(bag, 'whiteG', cx - 130, cx + 130, cy - 140, cy + 140, fY + 0.02, fY + 0.30); // pedestal
      bag.cyl('whiteG', cx / 1000, fY + 0.36, -cy / 1000, 0.205, 0.17);                // bowl body
      bag.cyl('whiteG', cx / 1000, fY + 0.44, -cy / 1000, 0.215, 0.035);               // seat ring
      bag.cyl('dark', cx / 1000, fY + 0.448, -cy / 1000, 0.15, 0.014);                 // bowl opening
      // cistern + chrome dual-flush plate + seat hinge bar
      pb(bag, 'chrome', cx - 70, cx + 70, cy - 8, cy + 8, fY + 0.455, fY + 0.465);
      if (facing === 'S') {
        pb(bag, 'whiteG', cx - 200, cx + 200, cy + 170, cy + 285, fY + 0.42, fY + 0.84);
        pb(bag, 'chrome', cx - 55, cx + 55, cy + 286, cy + 298, fY + 0.70, fY + 0.78);
        pb(bag, 'steel', cx - 35, cx - 8, cy + 298, cy + 304, fY + 0.72, fY + 0.76);
        pb(bag, 'steel', cx + 8, cx + 35, cy + 298, cy + 304, fY + 0.72, fY + 0.76);
      }
      if (facing === 'N') {
        pb(bag, 'whiteG', cx - 200, cx + 200, cy - 285, cy - 170, fY + 0.42, fY + 0.84);
        pb(bag, 'chrome', cx - 55, cx + 55, cy - 298, cy - 286, fY + 0.70, fY + 0.78);
        pb(bag, 'steel', cx - 35, cx - 8, cy - 304, cy - 298, fY + 0.72, fY + 0.76);
        pb(bag, 'steel', cx + 8, cx + 35, cy - 304, cy - 298, fY + 0.72, fY + 0.76);
      }
      if (facing === 'E') {
        pb(bag, 'whiteG', cx - 285, cx - 170, cy - 200, cy + 200, fY + 0.42, fY + 0.84);
        pb(bag, 'chrome', cx - 298, cx - 286, cy - 55, cy + 55, fY + 0.70, fY + 0.78);
      }
      if (facing === 'W') {
        pb(bag, 'whiteG', cx + 170, cx + 285, cy - 200, cy + 200, fY + 0.42, fY + 0.84);
        pb(bag, 'chrome', cx + 286, cx + 298, cy - 55, cy + 55, fY + 0.70, fY + 0.78);
      }
    },
    basin(bag, x0, x1, y0, y1, fY, back) {
      back = back || 'N';
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const cabTop = fY + 0.72, counterTop = fY + 0.76;

      // 1. Premium Wood Vanity Cabinet Body
      pb(bag, 'woodF', x0 + 12, x1 - 12, y0 + 12, y1 - 12, fY + 0.04, cabTop);

      // 2. Open lower storage shelf with towels (visual texture)
      // Bottom panel
      pb(bag, 'woodD', x0 + 24, x1 - 24, y0 + 24, y1 - 24, fY + 0.06, fY + 0.10);
      // Pastel colored rolled towels lying flat
      const tH = fY + 0.15;
      bag.cyl('fabric', (cx - 120) / 1000, tH, -cy / 1000, 0.045, 0.18, 0, 0, Math.PI / 2);
      bag.cyl('whiteG', cx / 1000, tH, -cy / 1000, 0.045, 0.18, 0, 0, Math.PI / 2);
      bag.cyl('accentWarm', (cx + 120) / 1000, tH, -cy / 1000, 0.045, 0.18, 0, 0, Math.PI / 2);

      // 3. Drawer Fronts with Brass Handles (facing front, i.e. opposite to wall)
      const dh = cabTop - 0.28; // drawer height start
      if (back === 'N') { // Front is South (y0)
        pb(bag, 'woodD', x0 + 16, cx - 8, y0 + 8, y0 + 14, dh, cabTop - 0.02);
        pb(bag, 'woodD', cx + 8, x1 - 16, y0 + 8, y0 + 14, dh, cabTop - 0.02);
        pb(bag, 'brass', (x0 + cx)/2 - 50, (x0 + cx)/2 + 50, y0 + 4, y0 + 8, fY + 0.56, fY + 0.58);
        pb(bag, 'brass', (cx + x1)/2 - 50, (cx + x1)/2 + 50, y0 + 4, y0 + 8, fY + 0.56, fY + 0.58);
      } else if (back === 'S') { // Front is North (y1)
        pb(bag, 'woodD', x0 + 16, cx - 8, y1 - 14, y1 - 8, dh, cabTop - 0.02);
        pb(bag, 'woodD', cx + 8, x1 - 16, y1 - 14, y1 - 8, dh, cabTop - 0.02);
        pb(bag, 'brass', (x0 + cx)/2 - 50, (x0 + cx)/2 + 50, y1 - 8, y1 - 4, fY + 0.56, fY + 0.58);
        pb(bag, 'brass', (cx + x1)/2 - 50, (cx + x1)/2 + 50, y1 - 8, y1 - 4, fY + 0.56, fY + 0.58);
      } else if (back === 'E') { // Front is West (x0)
        pb(bag, 'woodD', x0 + 8, x0 + 14, y0 + 16, cy - 8, dh, cabTop - 0.02);
        pb(bag, 'woodD', x0 + 8, x0 + 14, cy + 8, y1 - 16, dh, cabTop - 0.02);
        pb(bag, 'brass', x0 + 4, x0 + 8, (y0 + cy)/2 - 50, (y0 + cy)/2 + 50, fY + 0.56, fY + 0.58);
        pb(bag, 'brass', x0 + 4, x0 + 8, (cy + y1)/2 - 50, (cy + y1)/2 + 50, fY + 0.56, fY + 0.58);
      } else { // Front is East (x1)
        pb(bag, 'woodD', x1 - 14, x1 - 8, y0 + 16, cy - 8, dh, cabTop - 0.02);
        pb(bag, 'woodD', x1 - 14, x1 - 8, cy + 8, y1 - 16, dh, cabTop - 0.02);
        pb(bag, 'brass', x1 - 8, x1 - 4, (y0 + cy)/2 - 50, (y0 + cy)/2 + 50, fY + 0.56, fY + 0.58);
        pb(bag, 'brass', x1 - 8, x1 - 4, (cy + y1)/2 - 50, (cy + y1)/2 + 50, fY + 0.56, fY + 0.58);
      }

      // 4. Premium Solid Stone Countertop Slab
      pb(bag, 'counterTop', x0, x1, y0, y1, cabTop, counterTop);

      // 5. Above-Counter Designer Vessel Basin (White Ceramic + Dark Interior + Chrome Pop-up)
      const vH = 0.11; // Vessel bowl height
      bag.cyl('whiteG', cx / 1000, counterTop + vH/2, -cy / 1000, 0.18, vH); // white ceramic bowl body
      bag.cyl('dark', cx / 1000, counterTop + vH/2 + 0.005, -cy / 1000, 0.165, vH - 0.01); // bowl inner void
      bag.cyl('chrome', cx / 1000, counterTop + 0.012, -cy / 1000, 0.038, 0.024); // pop-up drain stopper

      // 6. Premium Tall Single-Lever Vessel Faucet (Chrome & Matte Black)
      const ho = Math.min(190, (x1 - x0) / 2 - 45), hoy = Math.min(150, (y1 - y0) / 2 - 45);
      const hx0 = cx - ho, hx1 = cx + ho, hy0 = cy - hoy, hy1 = cy + hoy;
      let fx = cx, fz = cy;
      if (back === 'N') fz = hy1 + 30; 
      else if (back === 'S') fz = hy0 - 30;
      else if (back === 'E') fx = hx1 + 30; 
      else fx = hx0 - 30;

      const fBase = counterTop;
      bag.cyl('chrome', fx / 1000, fBase + 0.01, -fz / 1000, 0.016, 0.02);  // chrome collar
      bag.cyl('charcoal', fx / 1000, fBase + 0.09, -fz / 1000, 0.011, 0.18); // tall black stem
      
      // Spout reaching out over the vessel bowl
      if (back === 'N' || back === 'S') {
        const sign = (fz > cy) ? -1 : 1;
        bag.cyl('chrome', fx / 1000, fBase + 0.18, -(fz + sign * 60) / 1000, 0.008, 0.12, Math.PI / 2, 0, 0); // horizontal arm
        bag.cyl('chrome', fx / 1000, fBase + 0.165, -(fz + sign * 120) / 1000, 0.008, 0.03); // down tip
      } else {
        const sign = (fx > cx) ? -1 : 1;
        bag.cyl('chrome', (fx + sign * 60) / 1000, fBase + 0.18, -fz / 1000, 0.008, 0.12, 0, 0, Math.PI / 2); // horizontal arm
        bag.cyl('chrome', (fx + sign * 120) / 1000, fBase + 0.165, -fz / 1000, 0.008, 0.03); // down tip
      }

      // Single lever control handle on top
      bag.cyl('chrome', fx / 1000, fBase + 0.185, -fz / 1000, 0.004, 0.035, 0.3, 0.2, 0.5);
    },
    shower(bag, x0, x1, y0, y1, fY) {
      // Frameless glass screen with slim stainless channel + chrome pull
      pb(bag, 'glass', x0, x1, y0, y1, fY + 0.04, fY + 1.95);
      pb(bag, 'steel', x0 - 8, x1 + 8, y0 - 8, y1 + 8, fY + 0.02, fY + 0.05); // floor channel
      pb(bag, 'steel', x0 - 8, x1 + 8, y0 - 8, y1 + 8, fY + 1.95, fY + 1.99); // head channel
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      if (Math.abs(x1 - x0) < Math.abs(y1 - y0)) {
        // panel runs along y — pull on east/west faces
        pb(bag, 'chrome', x1 + 2, x1 + 12, my - 15, my + 15, fY + 0.95, fY + 1.25);
      } else {
        pb(bag, 'chrome', mx - 15, mx + 15, y0 - 12, y0 - 2, fY + 0.95, fY + 1.25);
      }
    },
    showerHead(bag, cx, cy, fY, facing) {
      facing = facing || 'S';
      if (facing === 'N') {
        pb(bag, 'chrome', cx - 100, cx + 100, cy, cy + 15, fY + 0.95, fY + 1.05);
        bag.cyl('charcoal', cx / 1000, fY + 1.0, -(cy + 30) / 1000, 0.02, 0.18, 0, 0, Math.PI / 2);
        bag.cyl('chrome', (cx - 60) / 1000, fY + 1.0, -(cy + 45) / 1000, 0.012, 0.03, Math.PI / 2, 0, 0);
        bag.cyl('chrome', (cx + 60) / 1000, fY + 1.0, -(cy + 45) / 1000, 0.012, 0.03, Math.PI / 2, 0, 0);
        bag.cyl('chrome', cx / 1000, fY + 1.5, -(cy + 25) / 1000, 0.01, 1.0);
        bag.cyl('chrome', cx / 1000, fY + 2.0, -(cy + 200) / 1000, 0.01, 0.35, Math.PI / 2, 0, 0);
        pb(bag, 'chrome', cx - 100, cx + 100, cy + 300, cy + 500, fY + 1.97, fY + 1.99);
        bag.cyl('chrome', cx / 1000, fY + 2.0, -(cy + 400) / 1000, 0.015, 0.02);
        pb(bag, 'charcoal', cx - 110, cx - 80, cy, cy + 20, fY + 1.33, fY + 1.37);
        bag.cyl('chrome', (cx - 95) / 1000, fY + 1.38, -(cy + 25) / 1000, 0.01, 0.15, -0.2, 0, 0);
        bag.cyl('charcoal', (cx - 70) / 1000, fY + 1.15, -(cy + 30) / 1000, 0.006, 0.35);
      } else {
        pb(bag, 'chrome', cx - 100, cx + 100, cy - 15, cy, fY + 0.95, fY + 1.05);
        bag.cyl('charcoal', cx / 1000, fY + 1.0, -(cy - 30) / 1000, 0.02, 0.18, 0, 0, Math.PI / 2);
        bag.cyl('chrome', (cx - 60) / 1000, fY + 1.0, -(cy - 45) / 1000, 0.012, 0.03, Math.PI / 2, 0, 0);
        bag.cyl('chrome', (cx + 60) / 1000, fY + 1.0, -(cy - 45) / 1000, 0.012, 0.03, Math.PI / 2, 0, 0);
        bag.cyl('chrome', cx / 1000, fY + 1.5, -(cy - 25) / 1000, 0.01, 1.0);
        bag.cyl('chrome', cx / 1000, fY + 2.0, -(cy - 200) / 1000, 0.01, 0.35, Math.PI / 2, 0, 0);
        pb(bag, 'chrome', cx - 100, cx + 100, cy - 500, cy - 300, fY + 1.97, fY + 1.99);
        bag.cyl('chrome', cx / 1000, fY + 2.0, -(cy - 400) / 1000, 0.015, 0.02);
        pb(bag, 'charcoal', cx + 80, cx + 110, cy - 20, cy, fY + 1.33, fY + 1.37);
        bag.cyl('chrome', (cx + 95) / 1000, fY + 1.38, -(cy - 25) / 1000, 0.01, 0.15, 0.2, 0, 0);
        bag.cyl('charcoal', (cx + 70) / 1000, fY + 1.15, -(cy - 30) / 1000, 0.006, 0.35);
      }
    },
    washer(bag, cx, cy, fY, facing) {
      facing = facing || 'S';
      pb(bag, 'whiteG', cx - 300, cx + 300, cy - 300, cy + 300, fY, fY + 0.85); // body
      pb(bag, 'steel', cx - 300, cx + 300, cy - 300, cy + 300, fY + 0.85, fY + 0.88); // top panel
      // round front-load door (steel ring + glass porthole) on the facing side
      const door = (px, pz, ax) => {
        bag.cyl('steel', px / 1000, fY + 0.46, -pz / 1000, 0.205, 0.018, ax ? 0 : Math.PI / 2, 0, ax ? Math.PI / 2 : 0);
        bag.cyl('glass', px / 1000, fY + 0.46, -pz / 1000, 0.16, 0.03, ax ? 0 : Math.PI / 2, 0, ax ? Math.PI / 2 : 0);
      };
      if (facing === 'N') door(cx, cy + 300, false);
      else if (facing === 'S') door(cx, cy - 300, false);
      else if (facing === 'E') door(cx + 300, cy, true);
      else door(cx - 300, cy, true);
    },
    rackX(bag, x0, x1, y0, y1, fY, hN) { // bookshelf along x
      pb(bag, 'woodD', x0, x1, y0, y1, fY, fY + 1.45);
      const n = hN || 4, books = ['boug', 'bedding', 'brass', 'green2', 'ixora', 'fabric'];
      for (let i = 0; i < n; i++) {
        const h0 = fY + 0.18 + i * 0.31;
        pb(bag, 'woodF', x0 + 15, x1 - 15, y0 - 18, y1 - 30, h0 - 0.025, h0);
        let bx = x0 + 60, j = 0;
        while (bx < x1 - 200) {
          const bw = 90 + ((i * 53 + j * 97) % 110);
          pb(bag, books[(i + j) % books.length], bx, bx + bw, y0 + 30, y1 - 60, h0, h0 + 0.2 + ((j * 31) % 40) / 1000);
          bx += bw + 26; j++;
        }
      }
    },
    shelves(bag, x0, x1, y0, y1, fY) {
      const isX = (x1 - x0 > y1 - y0);
      const W = isX ? (x1 - x0) : (y1 - y0);
      const D = isX ? (y1 - y0) : (x1 - x0);
      
      // Determine back wall:
      // default: back is at y1 (for isX) or x0 (for !isX)
      let backWall = isX ? 'N' : 'W';
      
      if (!isX) {
        // Special case: if x1 is 4805, it is against the East wall
        if (Math.abs(x1 - 4805) < 10) {
          backWall = 'E';
        }
      }
      
      // Now, local coordinate system:
      // u = along the width (0 to W)
      // v = 0 (back wall) to D (open front)
      function addPart(mat, u0, u1, v0, v1, h0, h1) {
        let lx0, lx1, ly0, ly1;
        if (isX) {
          lx0 = x0 + u0;
          lx1 = x0 + u1;
          if (backWall === 'N') {
            ly0 = y1 - v1;
            ly1 = y1 - v0;
          } else {
            ly0 = y0 + v0;
            ly1 = y0 + v1;
          }
        } else {
          ly0 = y0 + u0;
          ly1 = y0 + u1;
          if (backWall === 'W') {
            lx0 = x0 + v0;
            lx1 = x0 + v1;
          } else {
            lx0 = x1 - v1;
            lx1 = x1 - v0;
          }
        }
        pb(bag, mat, lx0, lx1, ly0, ly1, h0, h1);
      }

      // Draw the open shelving wardrobe!
      // 1. Back panel (thin, 15mm)
      addPart('woodF', 0, W, 0, 15, fY, fY + 2.30);
      
      // 2. End panels (left and right, depth D)
      addPart('woodF', 0, 18, 15, D, fY, fY + 2.30);
      addPart('woodF', W - 18, W, 15, D, fY, fY + 2.30);

      // 3. Intermediate vertical dividers (every ~600-800mm)
      const numBays = Math.max(1, Math.round(W / 700));
      const bayW = W / numBays;
      
      for (let i = 1; i < numBays; i++) {
        const uDivider = i * bayW;
        addPart('woodF', uDivider - 9, uDivider + 9, 15, D - 20, fY, fY + 2.30);
      }

      // 4. Populate each bay with shelves, drawers, and hanging rods!
      for (let i = 0; i < numBays; i++) {
        const u0 = i * bayW + (i === 0 ? 18 : 9);
        const u1 = (i + 1) * bayW - (i === numBays - 1 ? 18 : 9);
        
        // Alternate designs for bays to look realistic!
        if (i % 2 === 0) {
          // Bay Type A: Lower drawer unit + Hanging space
          // Drawer chest (height 0.85m)
          addPart('woodD', u0, u1, 15, D - 10, fY, fY + 0.82);
          addPart('woodF', u0 - 4, u1 + 4, 10, D, fY + 0.82, fY + 0.85); // top slab
          
          // Drawer splits and handles
          const numDrawers = 3;
          const dh = 0.82 / numDrawers;
          for (let j = 0; j < numDrawers; j++) {
            const hBottom = fY + j * dh + 0.02;
            const hTop = fY + (j + 1) * dh - 0.02;
            
            // Draw drawer fronts
            addPart('woodF', u0 + 10, u1 - 10, D - 12, D - 8, hBottom, hTop);
            
            // Drawer handle (knob)
            const cx_local = (u0 + u1) / 2;
            addPart('brass', cx_local - 15, cx_local + 15, D - 8, D, hBottom + dh / 2 - 0.02, hBottom + dh / 2 + 0.02);
          }
          
          // Upper shelves
          addPart('woodF', u0, u1, 15, D - 15, fY + 1.40, fY + 1.43);
          addPart('woodF', u0, u1, 15, D - 15, fY + 1.85, fY + 1.88);
          addPart('woodF', u0, u1, 15, D - 15, fY + 2.26, fY + 2.30); // top shelf
          
          // Steel hanging rod (horizontal cylinder)
          const rx_val = isX ? 0 : Math.PI / 2;
          const ry_val = 0;
          const rz_val = isX ? Math.PI / 2 : 0;
          
          // Place hanging rod: middle of the bay, height 1.30m
          const cx_global = isX ? (x0 + (u0 + u1) / 2) : (backWall === 'W' ? (x0 + D / 2) : (x1 - D / 2));
          const cy_global = fY + 1.30;
          const cz_global = isX ? (backWall === 'N' ? -(y1 - D / 2) : -(y0 + D / 2)) : -(y0 + (u0 + u1) / 2);
          
          const rodLength = (u1 - u0) / 1000;
          bag.cyl('steel', cx_global / 1000, cy_global, cz_global / 1000, 0.010, rodLength, rx_val, ry_val, rz_val);

          // Add a few colorful clothes hanging blocks!
          const numHangers = Math.max(1, Math.round((u1 - u0) / 100));
          const hw = (u1 - u0) / numHangers;
          for (let k = 0; k < numHangers - 1; k++) {
            const hu = u0 + (k + 1) * hw;
            // Draw a hanging clothes block (a thin vertical box simulating a hanger + shirt)
            addPart('fabric', hu - 12, hu + 12, 40, D - 60, fY + 0.50, fY + 1.25);
          }
        } else {
          // Bay Type B: Full-height shelves
          const numShelves = 5;
          const sh = 2.20 / numShelves;
          for (let j = 0; j <= numShelves; j++) {
            const hShelf = fY + j * sh;
            addPart('woodF', u0, u1, 15, D - 15, hShelf, hShelf + 0.03);
            
            // Add some storage organizer boxes on the shelves!
            if (j < numShelves) {
              addPart('fabric2', u0 + 30, u1 - 30, 30, D - 40, hShelf + 0.03, hShelf + sh - 0.05);
            }
          }
        }
      }
    },
    shrine(bag, cx, cy, fY) {
      pb(bag, 'woodD', cx - 480, cx + 480, cy - 260, cy + 260, fY, fY + 0.55);
      pb(bag, 'brass', cx - 170, cx + 170, cy - 130, cy + 130, fY + 0.55, fY + 1.0);
      pb(bag, 'walnut', cx - 230, cx + 230, cy - 30, cy + 30, fY + 1.0, fY + 1.12);
    },

    /* ---- Hindu murti helpers (stylised brass / painted idols for pooja) ----
       cx,cy plan-mm; baseY = top of peeta in metres; s = overall scale.
       All face WEST (toward the hall door, −X). */
    murtiPedestal(bag, cx, cy, baseY, s) {
      s = s || 1;
      const x = cx / 1000, z = -cy / 1000;
      bag.cyl('brass', x, baseY + 0.012 * s, z, 0.055 * s, 0.018 * s);
      bag.cyl('woodF', x, baseY + 0.028 * s, z, 0.048 * s, 0.014 * s);
      bag.cyl('brass', x, baseY + 0.038 * s, z, 0.042 * s, 0.008 * s);
    },

    /* Lord Ganesha — seated, elephant head, trunk, large ears, crown */
    murtiGanesha(bag, cx, cy, baseY, s) {
      s = s || 1;
      const x = cx / 1000, z = -cy / 1000;
      const b = baseY + 0.04 * s;
      Fur.murtiPedestal(bag, cx, cy, baseY, s * 0.95);
      // dhoti / padmasana lap
      bag.sph('saffron', x, b + 0.035 * s, z, 0.058 * s, 0.028 * s);
      bag.sph('murtiGold', x, b + 0.055 * s, z, 0.052 * s, 0.030 * s);
      // pot belly
      bag.sph('murtiGold', x - 0.005 * s, b + 0.10 * s, z, 0.048 * s, 0.050 * s);
      // upper torso
      bag.cyl('murtiGold', x, b + 0.155 * s, z, 0.032 * s, 0.065 * s);
      // arms (four, simplified as side + raised)
      bag.cyl('murtiGold', x - 0.01 * s, b + 0.16 * s, z - 0.055 * s, 0.011 * s, 0.085 * s, Math.PI / 2.2, 0, 0.2);
      bag.cyl('murtiGold', x - 0.01 * s, b + 0.16 * s, z + 0.055 * s, 0.011 * s, 0.085 * s, Math.PI / 2.2, 0, -0.2);
      bag.cyl('murtiGold', x + 0.01 * s, b + 0.20 * s, z - 0.045 * s, 0.010 * s, 0.07 * s, Math.PI / 2.6, 0, 0.4);
      bag.cyl('murtiGold', x + 0.01 * s, b + 0.20 * s, z + 0.045 * s, 0.010 * s, 0.07 * s, Math.PI / 2.6, 0, -0.4);
      // hands / attributes (modak, axe tip)
      bag.sph('saffron', x - 0.04 * s, b + 0.13 * s, z - 0.09 * s, 0.014 * s);
      bag.sph('brass', x - 0.02 * s, b + 0.24 * s, z + 0.08 * s, 0.010 * s);
      // elephant head
      bag.sph('murtiGold', x, b + 0.24 * s, z, 0.050 * s, 0.048 * s);
      // large ears (N–S)
      bag.blob('murtiGold', x + 0.005 * s, b + 0.24 * s, z - 0.058 * s, 0.014 * s, 0.042 * s, 0.048 * s, 0.3);
      bag.blob('murtiGold', x + 0.005 * s, b + 0.24 * s, z + 0.058 * s, 0.014 * s, 0.042 * s, 0.048 * s, -0.3);
      // trunk curves west then down
      bag.cyl('murtiGold', x - 0.035 * s, b + 0.21 * s, z, 0.014 * s, 0.055 * s, 0, 0, 0.9);
      bag.sph('murtiGold', x - 0.055 * s, b + 0.175 * s, z, 0.016 * s);
      bag.cyl('murtiGold', x - 0.060 * s, b + 0.12 * s, z + 0.01 * s, 0.012 * s, 0.07 * s, 0.15, 0, 0.2);
      bag.sph('murtiGold', x - 0.065 * s, b + 0.08 * s, z + 0.02 * s, 0.013 * s);
      // crown (kirita)
      bag.cone('brass', x, b + 0.31 * s, z, 0.038 * s, 0.055 * s);
      bag.cyl('brass', x, b + 0.285 * s, z, 0.042 * s, 0.012 * s);
      bag.sph('brass', x, b + 0.345 * s, z, 0.014 * s);
      // tilak
      bag.sph('vermilion', x - 0.042 * s, b + 0.255 * s, z, 0.006 * s);
      // neck ornaments
      bag.cyl('brass', x, b + 0.195 * s, z, 0.036 * s, 0.008 * s);
      bag.sph('vermilion', x - 0.035 * s, b + 0.12 * s, z, 0.008 * s); // sacred thread bead
    },

    /* Lord Venkateswara (Balaji) — standing, tall kirita, namam, dark body + gold */
    murtiVenkateswara(bag, cx, cy, baseY, s) {
      s = s || 1;
      const x = cx / 1000, z = -cy / 1000;
      const b = baseY + 0.04 * s;
      Fur.murtiPedestal(bag, cx, cy, baseY, s * 1.05);
      // feet on peeta
      bag.cyl('murtiGold', x - 0.01 * s, b + 0.02 * s, z - 0.018 * s, 0.014 * s, 0.02 * s);
      bag.cyl('murtiGold', x - 0.01 * s, b + 0.02 * s, z + 0.018 * s, 0.014 * s, 0.02 * s);
      // dhoti / lower body (long)
      bag.cyl('saffron', x, b + 0.10 * s, z, 0.038 * s, 0.14 * s);
      bag.cyl('peetaRed', x, b + 0.16 * s, z, 0.040 * s, 0.04 * s); // waist cloth
      // torso (dark stone murti)
      bag.cyl('murtiDark', x, b + 0.26 * s, z, 0.036 * s, 0.14 * s);
      // chest garlands
      bag.cyl('brass', x - 0.01 * s, b + 0.24 * s, z, 0.040 * s, 0.012 * s);
      bag.cyl('lotusPink', x - 0.012 * s, b + 0.22 * s, z, 0.038 * s, 0.008 * s);
      bag.cyl('vermilion', x - 0.014 * s, b + 0.20 * s, z, 0.036 * s, 0.006 * s);
      // four arms
      bag.cyl('murtiDark', x, b + 0.30 * s, z - 0.055 * s, 0.011 * s, 0.09 * s, Math.PI / 2.1, 0, 0.15);
      bag.cyl('murtiDark', x, b + 0.30 * s, z + 0.055 * s, 0.011 * s, 0.09 * s, Math.PI / 2.1, 0, -0.15);
      bag.cyl('murtiGold', x + 0.005 * s, b + 0.34 * s, z - 0.05 * s, 0.010 * s, 0.07 * s, Math.PI / 2.5, 0, 0.5);
      bag.cyl('murtiGold', x + 0.005 * s, b + 0.34 * s, z + 0.05 * s, 0.010 * s, 0.07 * s, Math.PI / 2.5, 0, -0.5);
      // chakra + shanka (discus + conch) as gold discs
      bag.cyl('brass', x - 0.01 * s, b + 0.36 * s, z - 0.09 * s, 0.018 * s, 0.006 * s, Math.PI / 2, 0, 0);
      bag.sph('whiteG', x - 0.02 * s, b + 0.32 * s, z + 0.09 * s, 0.014 * s, 0.018 * s);
      // blessing hand (abhaya) forward west
      bag.sph('murtiGold', x - 0.05 * s, b + 0.28 * s, z - 0.06 * s, 0.012 * s);
      // head
      bag.sph('murtiDark', x, b + 0.38 * s, z, 0.034 * s, 0.038 * s);
      // tall multi-tier Venkateswara kirita (crown)
      bag.cyl('brass', x, b + 0.42 * s, z, 0.038 * s, 0.02 * s);
      bag.cyl('brass', x, b + 0.46 * s, z, 0.032 * s, 0.04 * s);
      bag.cyl('brass', x, b + 0.51 * s, z, 0.024 * s, 0.04 * s);
      bag.cone('brass', x, b + 0.56 * s, z, 0.018 * s, 0.045 * s);
      bag.sph('brass', x, b + 0.59 * s, z, 0.010 * s);
      // U-shaped namam (forehead mark — white with red centre)
      bag.cyl('whiteG', x - 0.030 * s, b + 0.395 * s, z - 0.008 * s, 0.004 * s, 0.028 * s, 0, 0, 0.15);
      bag.cyl('whiteG', x - 0.030 * s, b + 0.395 * s, z + 0.008 * s, 0.004 * s, 0.028 * s, 0, 0, -0.15);
      bag.cyl('vermilion', x - 0.031 * s, b + 0.395 * s, z, 0.003 * s, 0.022 * s);
      // shoulder ornaments
      bag.sph('brass', x, b + 0.33 * s, z - 0.04 * s, 0.016 * s);
      bag.sph('brass', x, b + 0.33 * s, z + 0.04 * s, 0.016 * s);
    },

    /* Goddess Lakshmi — seated on lotus, crown, gold + pink/red saree */
    murtiLakshmi(bag, cx, cy, baseY, s) {
      s = s || 1;
      const x = cx / 1000, z = -cy / 1000;
      const b = baseY + 0.04 * s;
      Fur.murtiPedestal(bag, cx, cy, baseY, s * 0.95);
      // lotus seat
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        bag.blob('lotusPink',
          x + Math.cos(a) * 0.04 * s, b + 0.02 * s, z + Math.sin(a) * 0.04 * s,
          0.022 * s, 0.008 * s, 0.016 * s, a);
      }
      bag.cyl('brass', x, b + 0.025 * s, z, 0.032 * s, 0.01 * s);
      // seated lap + saree
      bag.sph('peetaRed', x, b + 0.05 * s, z, 0.055 * s, 0.028 * s);
      bag.sph('murtiGold', x, b + 0.07 * s, z, 0.045 * s, 0.028 * s);
      // torso
      bag.cyl('murtiGold', x, b + 0.14 * s, z, 0.030 * s, 0.08 * s);
      bag.cyl('peetaRed', x, b + 0.12 * s, z, 0.034 * s, 0.04 * s); // blouse / sash
      // arms
      bag.cyl('murtiGold', x - 0.01 * s, b + 0.15 * s, z - 0.05 * s, 0.010 * s, 0.08 * s, Math.PI / 2.2, 0, 0.2);
      bag.cyl('murtiGold', x - 0.01 * s, b + 0.15 * s, z + 0.05 * s, 0.010 * s, 0.08 * s, Math.PI / 2.2, 0, -0.2);
      // lotus in hand + gold coins gesture
      bag.sph('lotusPink', x - 0.04 * s, b + 0.14 * s, z - 0.08 * s, 0.016 * s);
      bag.sph('brass', x - 0.035 * s, b + 0.12 * s, z + 0.08 * s, 0.010 * s);
      bag.sph('brass', x - 0.04 * s, b + 0.10 * s, z + 0.07 * s, 0.008 * s);
      // head
      bag.sph('murtiGold', x, b + 0.22 * s, z, 0.032 * s, 0.036 * s);
      // long hair
      bag.blob('murtiDark', x + 0.015 * s, b + 0.20 * s, z, 0.018 * s, 0.04 * s, 0.028 * s, 0);
      // crown
      bag.cyl('brass', x, b + 0.255 * s, z, 0.034 * s, 0.016 * s);
      bag.cone('brass', x, b + 0.30 * s, z, 0.026 * s, 0.05 * s);
      bag.sph('brass', x, b + 0.33 * s, z, 0.011 * s);
      // bindi
      bag.sph('vermilion', x - 0.028 * s, b + 0.23 * s, z, 0.005 * s);
      // necklaces
      bag.cyl('brass', x, b + 0.175 * s, z, 0.034 * s, 0.007 * s);
      bag.sph('brass', x - 0.028 * s, b + 0.155 * s, z, 0.008 * s);
    },

    /* Small framed deity photo for wall shelf */
    poojaPhotoFrame(bag, x0, x1, y0, y1, h0, h1) {
      // wood frame
      pb(bag, 'woodD', x0, x1, y0, y1, h0, h1);
      // inner “photo” mat
      const ix = 8, iy = 6, ih = 0.012;
      pb(bag, 'accentWarm', x0 + ix, x1 - ix, y0 + 2, y1 - 2, h0 + ih, h1 - ih);
      // tiny gold murti silhouette on the photo
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      const mh = h0 + (h1 - h0) * 0.35;
      bag.cyl('brass', mx / 1000, mh + 0.04, -my / 1000, 0.012, 0.05);
      bag.sph('brass', mx / 1000, mh + 0.08, -my / 1000, 0.014);
      bag.cone('brass', mx / 1000, mh + 0.11, -my / 1000, 0.010, 0.02);
    },

    /* Traditional kuthu vilakku (standing brass oil lamp) */
    kuthuVilakku(bag, cx, cy, baseY, s) {
      s = s || 1;
      const x = cx / 1000, z = -cy / 1000;
      bag.cyl('brass', x, baseY + 0.02 * s, z, 0.045 * s, 0.03 * s);
      bag.cyl('brass', x, baseY + 0.05 * s, z, 0.028 * s, 0.02 * s);
      bag.cyl('brass', x, baseY + 0.22 * s, z, 0.012 * s, 0.32 * s);
      bag.cyl('brass', x, baseY + 0.40 * s, z, 0.030 * s, 0.02 * s);
      // oil cup
      bag.cyl('brass', x, baseY + 0.46 * s, z, 0.042 * s, 0.028 * s);
      bag.cyl('brass', x, baseY + 0.48 * s, z, 0.048 * s, 0.008 * s); // rim
      // flame
      bag.cone('lamp', x, baseY + 0.54 * s, z, 0.012 * s, 0.04 * s);
      bag.sph('lamp', x, baseY + 0.52 * s, z, 0.010 * s);
    },

    /* Brass offering thali with coconut, flowers, kumkum, rice */
    poojaThali(bag, cx, cy, baseY, s) {
      s = s || 1;
      const x = cx / 1000, z = -cy / 1000;
      bag.cyl('brass', x, baseY + 0.006 * s, z, 0.07 * s, 0.008 * s);
      bag.cyl('brass', x, baseY + 0.012 * s, z, 0.065 * s, 0.006 * s);
      // coconut
      bag.sph('bark', x - 0.02 * s, baseY + 0.035 * s, z - 0.01 * s, 0.022 * s);
      bag.sph('whiteG', x - 0.02 * s, baseY + 0.04 * s, z - 0.01 * s, 0.012 * s);
      // banana bunch (simple)
      bag.cyl('saffron', x + 0.025 * s, baseY + 0.03 * s, z + 0.01 * s, 0.008 * s, 0.04 * s, 0.6, 0, 0.3);
      bag.cyl('saffron', x + 0.03 * s, baseY + 0.028 * s, z - 0.005 * s, 0.007 * s, 0.038 * s, 0.5, 0, 0.2);
      // kumkum / turmeric pots
      bag.cyl('vermilion', x - 0.01 * s, baseY + 0.02 * s, z + 0.035 * s, 0.012 * s, 0.012 * s);
      bag.cyl('saffron', x + 0.015 * s, baseY + 0.02 * s, z + 0.035 * s, 0.012 * s, 0.012 * s);
      // flower petals
      bag.sph('lotusPink', x + 0.01 * s, baseY + 0.02 * s, z - 0.035 * s, 0.010 * s);
      bag.sph('boug', x - 0.025 * s, baseY + 0.018 * s, z + 0.015 * s, 0.009 * s);
      bag.sph('ixora', x + 0.03 * s, baseY + 0.018 * s, z - 0.02 * s, 0.009 * s);
    },

    planter(bag, cx, cy, fY, s) {
      s = s || 1;
      // tapered cylindrical pot with rim
      bag.cyl('charDark', cx / 1000, fY + 0.21 * s, -cy / 1000, 0.18 * s, 0.42 * s);
      bag.cyl('charcoal', cx / 1000, fY + 0.07 * s, -cy / 1000, 0.14 * s, 0.06 * s); // base
      bag.cyl('charcoal', cx / 1000, fY + 0.43 * s, -cy / 1000, 0.20 * s, 0.03 * s); // rim
      // soil disc
      bag.cyl('bark', cx / 1000, fY + 0.42 * s, -cy / 1000, 0.16 * s, 0.02 * s);
      // stems
      bag.cyl('barkLight', cx / 1000, fY + 0.52 * s, -cy / 1000, 0.012 * s, 0.20 * s);
      bag.cyl('barkLight', (cx - 60 * s) / 1000, fY + 0.50 * s, -(cy + 40 * s) / 1000, 0.008 * s, 0.16 * s);
      // irregular blob foliage cluster (dark core, lighter highlights)
      bag.blob('leafDark', cx / 1000, fY + 0.63 * s, -cy / 1000, 0.16 * s, 0.17 * s, 0.15 * s, 0.6, true);
      bag.blob('green2', (cx + 75 * s) / 1000, fY + 0.70 * s, -(cy - 55 * s) / 1000, 0.13 * s, 0.12 * s, 0.11 * s, 1.9, true);
      bag.blob('green', (cx - 85 * s) / 1000, fY + 0.67 * s, -(cy + 65 * s) / 1000, 0.11 * s, 0.12 * s, 0.12 * s, 3.1, true);
      bag.blob('leafLight', (cx + 25 * s) / 1000, fY + 0.76 * s, -(cy + 45 * s) / 1000, 0.10 * s, 0.08 * s, 0.09 * s, 4.2, true);
      bag.blob('leafLight', (cx - 40 * s) / 1000, fY + 0.75 * s, -(cy - 60 * s) / 1000, 0.09 * s, 0.07 * s, 0.10 * s, 0.9, true);
      // trailing foliage below rim
      bag.blob('green2', (cx + 150 * s) / 1000, fY + 0.42 * s, -(cy) / 1000, 0.06 * s, 0.05 * s, 0.055 * s, 2.2, true);
      bag.blob('leafLight', (cx - 130 * s) / 1000, fY + 0.40 * s, -(cy - 80 * s) / 1000, 0.055 * s, 0.045 * s, 0.05 * s, 5.0, true);
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
    },
    crockeryUnit(bag, x0, x1, y0, y1, fY) {
      // base cabinet (woodD, h 0.85m)
      pb(bag, 'woodD', x0, x1, y0, y1, fY, fY + 0.85);
      pb(bag, 'counterTop', x0 - 10, x1 + 10, y0 - 10, y1 + 10, fY + 0.85, fY + 0.89);
      // upper glass display shelves (h 1.30m to 2.20m)
      pb(bag, 'woodD', x0, x1 - 40, y0, y1, fY + 1.30, fY + 2.20);
      pb(bag, 'woodF', x0, x1, y0, y1, fY + 2.20, fY + 2.24); // crown top
      // glass display doors on the front (East face, x1 side) — held 2mm proud
      // of the cabinet body so the pane never sits coplanar with it (z-fight)
      pb(bag, 'glass', x1 - 38, x1 - 30, y0 + 40, y1 - 40, fY + 1.35, fY + 2.15);
      // decorative metal vertical struts
      pb(bag, 'steel', x1 - 45, x1 - 35, y0 + 10, y0 + 35, fY + 1.30, fY + 2.20);
      pb(bag, 'steel', x1 - 45, x1 - 35, y1 - 35, y1 - 10, fY + 1.30, fY + 2.20);
    },

    /* Straight privacy wing-wall for a side door off hall/dining.
       One simple wall, just north of the door, projecting into the room.
       Purpose: stop a direct line of sight from the hall into the bedroom.
       Not an L — a proper short partition / baffle only. */
    privacyScreen(bag, wallX, doorY0, doorY1, fY) {
      // Door leaf is y doorY0..doorY1 on the wall at wallX.
      // Place a single E–W wing immediately north of the frame.
      const y0 = doorY1 + 40;            // clear of door frame
      const y1 = y0 + 150;               // 150 mm thick solid wall
      const x0 = wallX + 10;             // leave the wall face clean
      const x1 = wallX + 1050;           // ~1.05 m into dining — enough to block view
      const z0 = fY;
      const z1 = fY + 2.35;              // full privacy when standing

      // Core mass (collidable)
      pb(bag, 'charcoal', x0, x1, y0, y1, z0, z1);

      // Wood faces — south (door side), north (hall side), east end cap
      pb(bag, 'woodD', x0, x1, y0 - 6, y0, z0, z1);
      pb(bag, 'woodD', x0, x1, y1, y1 + 6, z0, z1);
      pb(bag, 'woodF', x1, x1 + 8, y0 - 6, y1 + 6, z0, z1);

      // Vertical flutes on the hall-facing side (same language as TV wall)
      const pitch = 58, rib = 24;
      for (let x = x0 + 40; x + rib < x1 - 30; x += pitch) {
        pb(bag, 'woodF', x, x + rib, y1 + 6, y1 + 20, z0 + 0.08, z1 - 0.08);
      }

      // Plinth + crown shadow
      pb(bag, 'charDark', x0 - 4, x1 + 10, y0 - 8, y1 + 22, z0, z0 + 0.05);
      pb(bag, 'charDark', x0 - 4, x1 + 10, y0 - 8, y1 + 22, z1 - 0.04, z1);

      // Single brass reveal on the free end (quiet detail)
      pb(bag, 'brass', x1 + 2, x1 + 6, y0 + 20, y1 - 20, fY + 0.9, fY + 0.92);

      // Soft LED wash on the door-side face (guides you to the bedroom)
      pb(bag, 'lamp', x0 + 30, x1 - 40, y0 - 10, y0 - 4, fY + 0.12, fY + 1.0);
    },
    wallCabinet(bag, x0, x1, y0, y1, fY) {
      // Upper carcass + crown + door faces + brass pulls (matches kitWallRun language)
      const z0 = fY + 1.40, z1 = fY + 2.20, zc = fY + 2.26;
      pb(bag, 'woodD', x0, x1, y0, y1, z0, z1);
      pb(bag, 'woodF', x0 - 6, x1 + 6, y0 - 6, y1 + 6, z1, zc);
      const isX = (x1 - x0) >= (y1 - y0);
      if (isX) {
        const n = Math.max(1, Math.round((x1 - x0) / 420));
        const gap = 4, dw = ((x1 - x0) - 16 - gap * (n + 1)) / n;
        let c = x0 + 8 + gap;
        for (let i = 0; i < n; i++) {
          pb(bag, 'woodD', c, c + dw, y0 - 14, y0, z0 + 0.04, z1 - 0.04);
          bag.cyl('brass', (c + dw / 2) / 1000, fY + 1.72, -(y0 - 18) / 1000, 0.005, 0.08, 0, 0, Math.PI / 2);
          c += dw + gap;
        }
      } else {
        const n = Math.max(1, Math.round((y1 - y0) / 420));
        const gap = 4, dw = ((y1 - y0) - 16 - gap * (n + 1)) / n;
        let c = y0 + 8 + gap;
        for (let i = 0; i < n; i++) {
          pb(bag, 'woodD', x0 - 14, x0, c, c + dw, z0 + 0.04, z1 - 0.04);
          bag.cyl('brass', (x0 - 18) / 1000, fY + 1.72, -(c + dw / 2) / 1000, 0.005, 0.08);
          c += dw + gap;
        }
      }
    },
    rangeHood(bag, cx, cy, fY) {
      // Floating stainless canopy + chimney + LED strip + charcoal grease filter face
      pb(bag, 'steel', cx - 320, cx + 320, cy - 270, cy + 270, fY + 1.40, fY + 1.52);
      pb(bag, 'charDark', cx - 280, cx + 280, cy - 230, cy + 230, fY + 1.395, fY + 1.405); // filter face
      pb(bag, 'lamp', cx - 240, cx + 240, cy - 200, cy + 200, fY + 1.388, fY + 1.395); // under-glow
      pb(bag, 'steel', cx - 140, cx + 140, cy - 120, cy + 120, fY + 1.52, fY + 2.55);
      pb(bag, 'chrome', cx - 150, cx + 150, cy - 130, cy + 130, fY + 2.55, fY + 2.58); // chimney cap
    },
    mirror(bag, x0, x1, y0, y1, fY) {
      // Framed vanity mirror + soft LED side glows
      pb(bag, 'steel', x0 - 12, x1 + 12, y0 - 12, y1 + 12, fY + 0.88, fY + 1.78);
      pb(bag, 'chrome', x0 - 6, x1 + 6, y0 - 6, y1 + 6, fY + 0.89, fY + 0.90);
      pb(bag, 'chrome', x0 - 6, x1 + 6, y0 - 6, y1 + 6, fY + 1.76, fY + 1.77);
      pb(bag, 'glass', x0, x1, y0, y1, fY + 0.90, fY + 1.76);
      pb(bag, 'lamp', x0 - 10, x0 - 4, y0 + 20, y1 - 20, fY + 0.95, fY + 1.70);
      pb(bag, 'lamp', x1 + 4, x1 + 10, y0 + 20, y1 - 20, fY + 0.95, fY + 1.70);
    }
  };

  /* ============ rooms data ============ */
  const TYPE = {
    living: 'tLiving', bed: 'tBed', bath: 'tBath', kitchen: 'tKitch',
    utility: 'tUtil', out: 'tOut', circ: 'tCirc', office: 'tOffice',
    pooja: 'tPooja', walk: 'tWalk'
  };
  const R = (name, dims, x0, x1, y0, y1, type) => ({ name, dims, x0, x1, y0, y1, type });

  const ROOMS = [
    [ // GF
      R('MASTER BEDROOM', '4575 × 3430', 230, 4805, 230, 3663, 'bed'),
      R('CHILDREN BEDROOM', '4575 × 3180', 230, 4805, 5460, 8640, 'bed'),
      R('HALL', '4450 × 3295', 4920, 9371, 5345, 8640, 'living'),
      R('DINING', '4450 × 3015', 4920, 9371, 2331, 5345, 'living'),
      R('KITCHEN', '2935 × 3795', 9487, 12420, 230, 4027, 'kitchen'),
      R('OFFICE', '2935 × 4500', 9487, 12420, 4142, 8640, 'office'),
      R('UTILITY', '2500 × 2100', 6870, 9371, 230, 2332, 'utility'),
      R('MASTER BATH', '1835 × 1985', 4920, 6752, 230, 2216, 'bath'),
      R('COMMON BATH', '1800 × 1570', 230, 2030, 3776, 5345, 'bath'),
      R('HANDWASH', '2775 × 1570', 2145, 4920, 3776, 5345, 'circ'),
      R('PORTICO', '3720 × 9632', 12650, 17362, -762, 8870, 'out'),
      R('LIFT', '1390 × 1575', 12650, 14040, 230, 1805, 'circ')
    ],
    [ // FF
      R('HALL', '5860 × 4135', 4920, 10780, 4507, 8642, 'living'),
      R('DINING', '4450 × 2980', 4921, 9371, 1526, 4506, 'living'),
      R('KITCHEN', '3050 × 3420', 9370, 12420, 1527, 4945, 'kitchen'),
      R('MASTER BEDROOM', '4575 × 4200', 230, 4805, 232, 4432, 'bed'),
      R('MASTER BATH', '2475 × 1835', 230, 2705, 4546, 6381, 'bath'),
      R('WALK-IN', '1985 × 1950', 2816, 4805, 4432, 6382, 'walk'),
      R('FOYER', '2020 × 2240', 10893, 12421, 5060, 7300, 'circ'),
      R('POOJA', '1525 × 1225', 10893, 12418, 7417, 8642, 'pooja'),
      R('COMMON BATH', '1120 × 2023', 8250, 9370, -646, 1377, 'bath'),  // relocated into the south band per owner plan
      R('WET KITCHEN', '2934 × 2057', 9486, 12420, -646, 1411, 'utility'),
      R('UTILITY', '3215 × 2059', 4920, 8135, -646, 1413, 'utility'),  // extends west to the dining|bedroom partition line
      R('SOUTH BALCONY', '4805 × 762', 0, 4805, -762, 0, 'out'),
      R('STAIRCASE', '4690 × 2145', 230, 4920, 6496, 8641, 'circ'),
      R('EAST BALCONY', '3720 × 9632', 12650, 17362, -762, 8870, 'out'),
      R('NORTH BALCONY', '17362 × 1000', 0, 17362, 8870, 9870, 'out'),
      R('LIFT', '1390 × 1575', 12650, 14040, 230, 1805, 'circ')
    ],
    [ // SF
      R('BEDROOM', '4575 × 4200', 230, 4805, 232, 4432, 'bed'),
      R('BATH', '2475 × 1835', 230, 2705, 4546, 6381, 'bath'),
      R('WALK-IN', '1985 × 1950', 2816, 4805, 4432, 6382, 'walk'),
      R('BEDROOM', '4685 × 4200', 7736, 12421, 232, 4432, 'bed'),
      R('BATH', '2700 × 1525', 4920, 7620, 233, 1758, 'bath'),
      R('WALK-IN', '2700 × 1280', 4920, 7620, 1871, 3151, 'walk'),
      R('FAMILY ROOM', '4180 × 4095', 8241, 12421, 4546, 8641, 'living'),
      R('EAST BALCONY', '3720 × 9632', 12650, 17362, -762, 8870, 'out'),
      R('SOUTH BALCONY', '17362 × 762', 0, 17362, -762, 0, 'out'),
      R('NORTH BALCONY', '17362 × 1000', 0, 17362, 8870, 9870, 'out'),
      R('STAIRCASE', '4690 × 2145', 230, 4920, 6496, 8641, 'circ'),
      R('LIFT', '1390 × 1575', 12650, 14040, 230, 1805, 'circ')
    ]
  ];

  /* ============ exterior opening schedules ============ */
  /* east band x: [12420,12650]; north y: [8640,8870]; south y: [0,230]; west x: [0,230] */
  const EB = [12420, 12650], NB = [8640, 8870], SB = [0, 230], WB = [0, 230];
  const OPEN = {
    // floor 0
    f0: {
      E: [
        { c: 6180, w: 1200, sill: 0, h: 2400, type: 'door' },                    // office door aligned with FF
        { c: 7710, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 },         // office window
        { c: 2700, w: 1200, sill: 1100, h: 900, type: 'win' }                    // kitchen sink window
      ],
      N: [
        { c: 2400, w: 1500, sill: 900, h: 1400, type: 'win' },                   // bed02
        { c: 6800, w: 1800, sill: 900, h: 1400, type: 'win' },                   // hall
        { c: 8650, w: 1200, sill: 0, h: 2400, type: 'door' },                    // main door
        { c: 11000, w: 1500, sill: 900, h: 1400, type: 'win' }                    // office
      ],
      S: [
        { c: 2500, w: 1500, sill: 900, h: 1400, type: 'win', chajja: true },
        { c: 5800, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },
        { c: 8120, w: 1800, sill: 900, h: 1400, type: 'win', chajja: true }, // enlarged utility window replacing door
        { c: 11000, w: 1200, sill: 1100, h: 900, type: 'win', chajja: true }
      ],
      W: [
        { c: 7000, w: 1200, sill: 1100, h: 1200, type: 'win', chajja: true },
        { c: 4560, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },
        { c: 2960, w: 1200, sill: 1100, h: 1200, type: 'win', chajja: true }
      ]
    },
    f1: {
      E: [
        { c: -300, w: 600, sill: 0, h: 2400, type: 'grill', door: true },         // southeast corner east-facing secure grill door
        { c: 6180, w: 1200, sill: 0, h: 2400, type: 'door' },                    // duplex entry pivot
        { c: 7010, w: 450, sill: 0, h: 2400, type: 'fixed', panes: 1 },          // sidelite
        { c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' },                   // kitchen
        { c: 8030, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 }         // pooja slit
      ],
      N: [
        { c: 5500, w: 1000, sill: 900, h: 1400, type: 'win' },                   // left of void
        { c: 8760, w: 1000, sill: 900, h: 1400, type: 'win' },                   // right of void
        { c: 11650, w: 600, sill: 1200, h: 900, type: 'win', panes: 1 }          // pooja window
      ],
      S: [
        // shell wall runs x 230..4805 only on FF (bedroom stretch): east of it the
        // service bands absorb the old 2.5ft strip (their wall sits at y -762..-646)
        { c: 2500, w: 1500, sill: 900, h: 1400, type: 'win', chajja: true }
      ],
      W: [
        { c: 5460, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },
        { c: 3730, w: 1200, sill: 1100, h: 1200, type: 'win', chajja: true },
        { c: 7570, w: 1200, sill: 2080, h: 1100, type: 'win', chajja: true } // Staircase Landing Window
      ]
    },
    f2: {
      E: [
        { c: 6410, w: 1650, sill: 0, h: 2400, type: 'frenchdoor' }, // Family Balcony French Door
        { c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' } // Bedroom 03 Window
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
        { c: 5460, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },
        { c: 3730, w: 1200, sill: 1100, h: 1200, type: 'win', chajja: true },
        { c: 7570, w: 1200, sill: 2080, h: 1100, type: 'win', chajja: true } // Staircase Landing Window
      ]
    }
  };

  /* interior wall sets (per floor): {dir, a0,a1, b0,b1, openings:[{c,w}], floorRel doors h2.1} */
  const IW = [
    [ // GF
      { dir: 'y', b: [4805, 4920], a: [230, 2216], ops: [{ c: 1200, w: 800 }] },       // master|mbath
      { dir: 'y', b: [4805, 4920], a: [2216, 3663], ops: [] },                         // master|dining (door closed)
      { dir: 'y', b: [4805, 4920], a: [3663, 5345], ops: [{ c: 4520, w: 1100 }] },     // handwash|dining
      { dir: 'y', b: [4805, 4920], a: [5345, 8640], ops: [] },                         // bed02|hall (door closed)
      { dir: 'x', b: [5345, 5460], a: [230, 4805], ops: [{ c: 4300, w: 900 }] },       // bed02 south door
      { dir: 'y', b: [2030, 2145], a: [3776, 5345], ops: [{ c: 4350, w: 750 }] },      // cbath|handwash
      { dir: 'x', b: [3663, 3776], a: [230, 4805], ops: [{ c: 4300, w: 900 }] },       // master north door
      { dir: 'x', b: [2216, 2331], a: [4920, 6752], ops: [] },                          // mbath north
      { dir: 'y', b: [6752, 6870], a: [230, 2332], ops: [] },                           // mbath|utility
      { dir: 'y', b: [9371, 9487], a: [230, 2331], ops: [] },                           // utility|kitchen
      { dir: 'y', b: [9371, 9487], a: [2331, 4027], ops: [{ c: 3514, w: 1026 }] },     // kitchen|dining
      { dir: 'x', b: [4027, 4142], a: [9371, 12420], ops: [] },                         // kitchen|office
      { dir: 'y', b: [9371, 9487], a: [4142, 8640], ops: [] }                           // hall/dining|office
    ],
    [ // FF
      { dir: 'y', b: [4805, 4920], a: [232, 4432], ops: [{ c: 3850, w: 1000 }] },      // master east
      { dir: 'x', b: [4432, 4547], a: [230, 2705], ops: [] },                           // master|mbath
      { dir: 'x', b: [4432, 4547], a: [2816, 4805], ops: [{ c: 3500, w: 900 }] },      // master|walkin
      { dir: 'y', b: [2705, 2816], a: [4432, 6381], ops: [{ c: 5025, w: 850 }] },       // mbath|walkin
      { dir: 'x', b: [6381, 6496], a: [230, 4805], ops: [] },                           // stair south
      { dir: 'y', b: [4805, 4920], a: [4432, 6496], ops: [] },                          // spine filler
      { dir: 'y', b: [9370, 9486], a: [-646, 1411], ops: [] },                           // wet kitchen | cbath divider
      { dir: 'y', b: [12420, 12650], a: [-762, 1411], ops: [{ c: -300, w: 600, sill: 0, h: 2400 }] }, // southeast east wall with secure grill door
      { dir: 'x', b: [-762, -646], a: [4805, 12420], ops: [{ c: 6527, w: 3215, sill: 900, h: 1400 }, { c: 8810, w: 600, sill: 1700, h: 600 }, { c: 11205, w: 2430, sill: 900, h: 1400 }] }, // weather-secured south wall: utility grill, cbath ventilator, wet-kitchen grill
      { dir: 'y', b: [4805, 4920], a: [-646, 232], ops: [{ c: -207, w: 800, sill: 0, h: 2400 }] }, // utility west wall + SW grill door onto the bedroom south balcony
      { dir: 'x', b: [1413, 1526], a: [4920, 6595], ops: [] },                           // dining | utility north wall
      { dir: 'y', b: [8135, 8250], a: [-646, 1377], ops: [{ c: 1000, w: 700 }] },       // utility | common bath wall + door
      { dir: 'x', b: [1377, 1526], a: [6595, 9370], ops: [{ c: 7350, w: 1200, sill: 0, h: 2400 }] }, // dining | utility slider wall (slider clear of the cbath)
      { dir: 'x', b: [1411, 1527], a: [9370, 12421], ops: [{ c: 10750, w: 900, sill: 0, h: 2400 }] }, // wide opening into kitchen (narrowed to clear the SW pantry + south breakfast bar)
      { dir: 'y', b: [9371, 9486], a: [1527, 4945], ops: [{ c: 2163.5, w: 1273, sill: 900, h: 1200 }, { c: 3523, w: 1446 }] },     // kitchen|dining
      { dir: 'y', b: [10780, 10893], a: [4945, 7300], ops: [{ c: 6180, w: 1500 }] },   // hall|foyer
      { dir: 'y', b: [10780, 10893], a: [7300, 8642], ops: [{ c: 8030, w: 1000 }] },   // hall|pooja (wide open view to mandir)
      { dir: 'x', b: [7300, 7417], a: [10893, 12421], ops: [] },                        // foyer|pooja
      { dir: 'x', b: [4945, 5060], a: [9370, 12421], ops: [] }                         // kitchen/foyer south
    ],
    [ // SF
      { dir: 'y', b: [4805, 4920], a: [232, 4432], ops: [{ c: 3800, w: 1000 }] },      // master02 east
      { dir: 'x', b: [4432, 4547], a: [230, 2705], ops: [] },                           // master|mbath
      { dir: 'x', b: [4432, 4547], a: [2816, 4805], ops: [{ c: 3500, w: 900 }] },      // master|walkin
      { dir: 'y', b: [2705, 2816], a: [4432, 6381], ops: [{ c: 5025, w: 850 }] },       // mbath|walkin
      { dir: 'x', b: [6381, 6496], a: [230, 4805], ops: [] },                           // stair south
      { dir: 'y', b: [4805, 4920], a: [4432, 6496], ops: [] },                          // spine filler
      { dir: 'x', b: [1758, 1871], a: [4920, 7620], ops: [{ c: 6900, w: 800 }] },      // bath03|walkin03
      { dir: 'x', b: [3151, 3266], a: [4920, 7620], ops: [] },                          // walkin03 north
      { dir: 'y', b: [7620, 7736], a: [232, 4432], ops: [{ c: 2511, w: 950 }, { c: 3800, w: 1000 }] }, // bed03 west
      { dir: 'x', b: [4432, 4546], a: [7620, 8241], ops: [] },                          // bed03 north (door)
      { dir: 'x', b: [4432, 4546], a: [8241, 12421], ops: [] }                          // bed03|family
    ]
  ];

  /* ============ build ============ */
  function build(THREE) {
    const materials = buildMaterials(THREE);
    const root = new THREE.Group(); root.name = 'residence';

    /* -------- real car (GLB) with procedural fallback --------
       Drop a real SUV model at models/car.glb and it replaces the
       blocky placeholder automatically. Missing file -> fallback.
       Tune CAR_* below to fit whatever GLB you provide. */
    function placeCar() {
      const CAR_MODEL_URL = 'models/car.glb';
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
          draco.setDecoderPath('lib/draco/');
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

    const X0 = 0, X1 = 12650, Y0n = 0, Y1n = 8870; // main block
    const liftIX = [12650, 14040], liftIY = [230, 1805];
    const liftOX = [12650, 14270], liftOY = [0, 2035];
    const towX = [14270, 16600], towY = [0, 4140];
    const portY = [-762, 8870], eastX = [12650, 17362];

    // External U-stair: 12 risers + mid landing + 12 risers → flush at L.f1
    const RISE_E = (L.f1 - L.porticoFl) / 24;
    const LAND_E = L.porticoFl + 12 * RISE_E; // mid-landing top (= end of flight 1)
    // Stair-void edges at FF (lift outer east = 14270; outer deck west = 15400)
    const VOID_WX = 14270, VOID_EX = 15400, LIFT_NY = 2035;
    // Internal U-stair: 10 risers + mid landing + 10 risers → next floor (flush)
    const RISE_I = L.f2f / 20;
    const landI = (base) => base + 10 * RISE_I;

    /* -------- lighting contract: recessed downlights + warm accents -------- */
    const lights = [];
    function downlight(bag, xmm, ymm, ceilY, floor) {
      const wx = xmm / 1000, wz = -ymm / 1000;
      // brushed-steel trim ring + warm lens (coherent with stainless hardware)
      bag.cyl('steel', wx, ceilY - 0.002, wz, 0.06, 0.008);
      bag.cyl('chrome', wx, ceilY - 0.0015, wz, 0.05, 0.004);
      bag.cyl('downlight', wx, ceilY - 0.0025, wz, 0.042, 0.014);
      lights.push({ x: wx, y: ceilY - 0.03, z: wz, floor });
    }

    /* curtain rod + two side panels on an exterior-wall window (interior
       side). Panels: 1/4 window width, 30mm thick, 45-75mm off the wall,
       rod 150mm to top of head; panels stop 150mm above the floor. */
    function curtains(bag, face, c, w, sill, h, fY, mat) {
      const rodY = fY + (sill + h) / 1000 + 0.08;
      const panelW = w / 4;
      const rodLen = (w + 240) / 1000;
      let off0, off1;
      if (face === 'E') { off0 = EB[0] - 75; off1 = EB[0] - 45; }
      else if (face === 'W') { off0 = WB[1] + 45; off1 = WB[1] + 75; }
      else if (face === 'N') { off0 = NB[0] - 75; off1 = NB[0] - 45; }
      else { off0 = SB[1] + 45; off1 = SB[1] + 75; }
      const mid = (off0 + off1) / 2 / 1000;
      if (face === 'E' || face === 'W') {              // wall runs along y (world z)
        bag.cyl('brass', mid, rodY, -c / 1000, 0.015, rodLen, Math.PI / 2, 0, 0);
        pb(bag, mat, off0, off1, c - w / 2 - 90, c - w / 2 - 90 + panelW, fY + 0.15, rodY - 0.015);
        pb(bag, mat, off0, off1, c + w / 2 + 90 - panelW, c + w / 2 + 90, fY + 0.15, rodY - 0.015);
      } else {                                         // wall runs along x
        bag.cyl('brass', c / 1000, rodY, -mid, 0.015, rodLen, 0, 0, Math.PI / 2);
        pb(bag, mat, c - w / 2 - 90, c - w / 2 - 90 + panelW, off0, off1, fY + 0.15, rodY - 0.015);
        pb(bag, mat, c + w / 2 + 90 - panelW, c + w / 2 + 90, off0, off1, fY + 0.15, rodY - 0.015);
      }
    }

    /* curtain schedule: living / bed / office windows only (windows wrapped
       by vastu wardrobes are excluded); fabric tone alternates per room */
    const CURT = [
      [ { f: 'E', c: 7710, w: 1500, sill: 900, h: 1500, m: 'curtain' },   // GF office E
        { f: 'N', c: 2400, w: 1500, sill: 900, h: 1400, m: 'curtain2' },  // GF bed02
        { f: 'N', c: 6800, w: 1800, sill: 900, h: 1400, m: 'curtain' },   // GF hall
        { f: 'N', c: 11000, w: 1500, sill: 900, h: 1400, m: 'curtain' },  // GF office N
        { f: 'S', c: 2500, w: 1500, sill: 900, h: 1400, m: 'curtain2' } ],// GF master
      [ { f: 'N', c: 5500, w: 1000, sill: 900, h: 1400, m: 'curtain' },   // FF hall W of void
        { f: 'N', c: 8760, w: 1000, sill: 900, h: 1400, m: 'curtain' },   // FF hall E of void
        { f: 'S', c: 2500, w: 1500, sill: 900, h: 1400, m: 'curtain2' } ],// FF master
      [ { f: 'N', c: 8760, w: 1000, sill: 900, h: 1400, m: 'curtain' },   // SF family room
        { f: 'S', c: 2500, w: 1500, sill: 900, h: 1400, m: 'curtain2' },  // SF master02
        { f: 'S', c: 10000, w: 1500, sill: 900, h: 1400, m: 'curtain' } ] // SF bed03
    ];

    /* -------- site (always visible) -------- */
    const sBag = makeBag(THREE);
    (function site() {
      // ground plane
      sBag.box('ground', 10.5, -0.09, -9.0, 230, 0.18, 230);
      // plot pad: compound interior (extended North to 18750)
      pb(sBag, 'plotPad', -880, 22100, -880, 18750, -0.002, 0.012);
      // compound wall: x -900..22250, y -900..18770 (150 thick, h 1.524)
      const cw = (x0, x1, y0, y1) => {
        pb(sBag, 'charcoal', x0, x1, y0, y1, 0, 1.524);
        pb(sBag, 'charDark', x0 - 12, x1 + 12, y0 - 12, y1 + 12, 1.524, 1.578);
        // warm stone coping course on top of the compound wall
        pb(sBag, 'copingLight', x0 - 22, x1 + 22, y0 - 22, y1 + 22, 1.578, 1.612);
      };
      cw(-900, -750, -900, 18770);                // west
      cw(-900, 22250, -900, -750);                // south
      cw(-900, 22250, 18620, 18770);              // north (extended North)
      cw(22100, 22250, -900, 4622);               // east (S of gate)
      cw(22100, 22250, 8222, 18770);              // east (N of gate)
      // gate piers + sliding gate (closed) — limestone bands, lamps, name plaque
      for (const py of [[4222, 4622], [8222, 8622]]) {
        const pmid = (py[0] + py[1]) / 2;
        pb(sBag, 'charDark', 21930, 22420, py[0], py[1], 0, 1.84);
        // Warm stone base band + capital
        pb(sBag, 'accentWarm', 21920, 22430, py[0] - 15, py[1] + 15, 0, 0.18);
        pb(sBag, 'copingLight', 21915, 22435, py[0] - 20, py[1] + 20, 0.18, 0.24);
        pb(sBag, 'charcoal', 21905, 22445, py[0] - 18, py[1] + 18, 1.84, 1.93);
        pb(sBag, 'copingLight', 21895, 22455, py[0] - 28, py[1] + 28, 1.93, 2.00);
        // Pier lamp on top
        pb(sBag, 'steel', 22100, 22250, pmid - 70, pmid + 70, 2.00, 2.08);
        pb(sBag, 'lamp', 22115, 22235, pmid - 55, pmid + 55, 2.08, 2.28);
        // Decorative vertical brass strip on pier face (street side)
        pb(sBag, 'brass', 22410, 22425, pmid - 40, pmid + 40, 0.50, 1.60);
      }
      // House name plaque on north pier (street face)
      pb(sBag, 'brass', 22415, 22440, 8280, 8560, 1.05, 1.45);
      pb(sBag, 'charDark', 22418, 22438, 8300, 8540, 1.08, 1.42);
      pb(sBag, 'copingLight', 22420, 22436, 8320, 8520, 1.18, 1.32);
      // Sliding gate leaf: rails + vertical bars + top spikes + lock post
      pb(sBag, 'steel', 22130, 22190, 4622, 8222, 0.10, 0.20);
      pb(sBag, 'steel', 22130, 22190, 4622, 8222, 1.35, 1.48);
      pb(sBag, 'steel', 22130, 22190, 4622, 8222, 0.70, 0.78); // mid rail
      const nbars = Math.round(3600 / 138);
      for (let i = 0; i <= nbars; i++) {
        const gy = 4622 + (3600 * i) / nbars;
        pb(sBag, 'ms', 22136, 22184, gy - 14, gy + 14, 0.20, 1.35);
        // spear-point finials (plan x ≈ 22160 mm → world X = 22.16)
        sBag.cyl('steel', 22.16, 1.55, -gy / 1000, 0.012, 0.12);
        sBag.cyl('chrome', 22.16, 1.64, -gy / 1000, 0.008, 0.06);
      }
      // Centre lock stile
      pb(sBag, 'steel', 22120, 22200, 6320, 6520, 0.10, 1.55);
      pb(sBag, 'brass', 22190, 22215, 6380, 6460, 0.85, 1.05);
      // Threshold plate under gate
      pb(sBag, 'charDark', 22080, 22280, 4622, 8222, 0, 0.04);
      pb(sBag, 'steel', 22090, 22270, 4622, 8222, 0.04, 0.055);
      // driveway pavers (striped)
      pb(sBag, 'paver', 16600, 22100, 4700, 8150, 0, 0.055);
      for (let x = 16900; x < 22100; x += 1200)
        pb(sBag, 'paver2', x, x + 600, 4710, 8140, 0.055, 0.062);
      // Driveway centre dashed guide line
      for (let x = 17000; x < 21800; x += 900)
        pb(sBag, 'roadLine', x, x + 450, 6380, 6480, 0.055, 0.065);
      // path to north stoop
      pb(sBag, 'paver', 16600, 17500, 8150, 11270, 0, 0.05);
      pb(sBag, 'paver', 9500, 16600, 10370, 11270, 0, 0.05);
      // side path north of lift (GF lift access)
      pb(sBag, 'paver', 12650, 14270, 2035, 3975, 0, L.pathFl);
      // green strip + shrubs inside east wall
      pb(sBag, 'grass', 21250, 21950, -700, 4500, 0.012, 0.05);
      pb(sBag, 'grass', 21250, 21950, 8350, 9550, 0.012, 0.05);
      // ─── Shrubs: low mounded blob clusters with flower specks + soil bed ───
      const shrub = (x, y, r, col) => plantShrub(sBag, x, y, r, col);
      for (let y = 0; y < 4300; y += 760) shrub(21600, y - 380, 0.34 + (y % 3) * 0.03, (y % 1520 === 0) ? 'boug' : 'green');
      for (let y = 8550; y < 9500; y += 700) shrub(21600, y, 0.33, (y % 1400 < 700) ? 'ixora' : 'green');
      shrub(18000, 9800, 0.42, 'boug'); shrub(11000, 9250, 0.36, 'green2');
      // Grass: south inside compound wall; north-of-building strip (avoid stoop band)
      pb(sBag, 'grass', -700, 21100, -700, -150, 0.012, 0.045); // south verge
      for (let x = 1200; x < 20500; x += 2600) shrub(x, -430, 0.3, (x % 5200 < 2600) ? 'green' : 'green2');
      // North lawns — split around north-stoop path (y 10370..11270 / x 9500..17500)
      pb(sBag, 'grass', -700, 9500, 8980, 18620, 0.012, 0.045);   // west of path run
      pb(sBag, 'grass', 17500, 21950, 8980, 18620, 0.012, 0.045); // east of path run
      pb(sBag, 'grass', 9500, 17500, 11270, 18620, 0.012, 0.045); // north of path
      pb(sBag, 'grass', 9500, 16600, 8980, 10370, 0.012, 0.045); // south of path (to house)

      // ─── Trees: tapered trunk + branches + irregular layered blob canopy ───
      const tree = (x, y, r, col1, col2, isFlowering) =>
        plantTree(sBag, x, y, r, { flowering: isFlowering });

      // plant 3 trees in the empty plot lawn
      tree(3000, 14000, 1.25, 'green', 'green2', false);      // large green tree NW
      tree(9500, 15500, 1.0, 'green2', 'leafLight', false);   // medium tree N
      tree(16500, 13500, 1.1, 'boug', 'ixora', true);         // flowering bougainvillea/ixora tree NE

      // shrubs line along the new North compound wall
      for (let x = 0; x < 21000; x += 1200) {
        shrub(x, 18350, 0.35 + (x % 3) * 0.05, (x % 2400 === 0) ? 'ixora' : 'green2');
      }
      // East compound wall sconces (inner face) — spaced along solid wall segments
      // (gate gap is y 4622..8222; keep fixtures off the opening).
      for (const ly of [1200, 3000, 9800, 14000]) {
        pb(sBag, 'charDark', 22040, 22110, ly - 80, ly + 80, 1.05, 1.42);
        pb(sBag, 'steel', 22030, 22050, ly - 60, ly + 60, 1.10, 1.38);
        pb(sBag, 'lamp', 22015, 22035, ly - 48, ly + 48, 1.14, 1.34);
      }
      // Path bollards — only ON paved edges, modest spacing (not a forest of posts)
      const sCyl = (mat, x, y, hMid, r, h) => sBag.cyl(mat, x / 1000, hMid, -y / 1000, r, h);
      const pathBollard = (x, y) => {
        pb(sBag, 'charDark', x - 40, x + 40, y - 40, y + 40, 0, 0.05);
        sCyl('steel', x, y, 0.34, 0.038, 0.62);
        sCyl('chrome', x, y, 0.70, 0.048, 0.045);
        sCyl('lamp', x, y, 0.64, 0.032, 0.06);
      };
      // Driveway (pavers x 16600..22100, y 4700..8150) — edge lights every ~3.5 m
      for (let x = 17500; x <= 21000; x += 3500) {
        pathBollard(x, 4850);  // south edge of driveway
        pathBollard(x, 8000);  // north edge of driveway
      }
      // Gate approach (just inside compound, flanking gate opening)
      pathBollard(21750, 5000);
      pathBollard(21750, 7800);
      // North-stoop path: E–W run is paver y 10370..11270 — centreline ~10820
      for (let x = 10500; x <= 15500; x += 2500) pathBollard(x, 10820);
      // N–S leg of path: paver x 16600..17500 — centreline ~17050
      pathBollard(17050, 9200);
      pathBollard(17050, 10050);
      pathBollard(17050, 10900);
      // Lift side path: paver x 12650..14270, y 2035..3975 — centreline x ~13460
      pathBollard(13460, 2500);
      pathBollard(13460, 3400);
      // Garden mushroom lights at tree bases (not random lawn scatter)
      for (const [gx, gy] of [[3000, 14000], [9500, 15500], [16500, 13500]]) {
        sCyl('charDark', gx, gy + 900, 0.10, 0.055, 0.18);
        sCyl('steel', gx, gy + 900, 0.26, 0.022, 0.18);
        sCyl('lamp', gx, gy + 900, 0.38, 0.075, 0.055);
        sCyl('copingLight', gx, gy + 900, 0.42, 0.095, 0.025);
      }
    })();
    const site = sBag.build(THREE, materials); site.name = 'site'; root.add(site);
    placeCar();

    /* -------- exterior context (own group so viewers can hide it) --------
       Everything here sits OUTSIDE the compound wall (plot: x -900..22250,
       y -900..18770 mm). Ground plane top is y=0. */
    const cBag = makeBag(THREE);
    (function contextBits() {
      // ─── East road: divided 4-lane carriageway with central median ───
      // near footpath (compound side) + kerb
      pb(cBag, 'pave', 22280, 23820, -930, 24000, 0.006, 0.055);
      pb(cBag, 'pave', 23820, 23950, -930, 24000, 0.004, 0.062); // kerb: 50mm above road
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
      // streetlight poles on both kerb lines
      for (const sy of [1500, 15000]) {
        cBag.cyl('ms', 23.62, 3.0, -sy / 1000, 0.07, 6.0);
        cBag.cyl('ms', 24.42, 5.88, -sy / 1000, 0.035, 1.7, 0, 0, Math.PI / 2); // arm over near carriageway
        cBag.box('lamp', 25.20, 5.83, -sy / 1000, 0.42, 0.10, 0.18);
        cBag.cyl('ms', 38.70, 3.0, -sy / 1000, 0.07, 6.0);
        cBag.cyl('ms', 37.90, 5.88, -sy / 1000, 0.035, 1.7, 0, 0, Math.PI / 2); // arm over far carriageway
        cBag.box('lamp', 37.12, 5.83, -sy / 1000, 0.42, 0.10, 0.18);
      }
      // median greenery: low shrubs softening the divider
      for (let my = -18000; my < 36000; my += 6000)
        plantShrub(cBag, 31200, my, 0.4, (my % 12000 < 6000) ? 'green' : 'ixora', 0.02);
      // ─── South road (corner-plot frontage, mirrored from the east road) ───
      // concrete footpath + kerb running east-west along the full south frontage
      pb(cBag, 'pave', -6000, 24000, -2470, -930, 0.006, 0.055);
      pb(cBag, 'pave', -6000, 24000, -2600, -2470, 0.004, 0.062); // kerb: 50mm above road
      // asphalt road ~7m wide running east-west along the full south frontage
      pb(cBag, 'road', -20000, 29950, -9600, -2600, 0.004, 0.012);
      // dashed centre line, 5mm above the asphalt
      for (let lx = -19000; lx < 30000; lx += 3200)
        pb(cBag, 'roadLine', lx, lx + 1800, -6190, -6010, 0.010, 0.017);
      // two streetlight poles on the kerb line
      for (const sx of [1500, 15000]) {
        cBag.cyl('ms', sx / 1000, 3.0, 2.35, 0.07, 6.0);
        cBag.cyl('ms', sx / 1000, 5.88, 3.15, 0.035, 1.7, Math.PI / 2, 0, 0); // arm over road
        cBag.box('lamp', sx / 1000, 5.83, 3.93, 0.18, 0.10, 0.42);
      }
      // Neighbour houses: north / south context only.
      // East-side houses (across the main road) removed — they blocked the
      // east elevation / portico view from the exterior camera.
      nbrHouse(cBag, 7000, 35500, 11000, 8500, 2, 'nbr2', -0.07, 'S');
      nbrHouse(cBag, 17500, 34500, 8000, 7000, 1, 'nbr1', 0.12, 'S');
      nbrHouse(cBag, 4000, -17000, 9500, 8000, 2, 'nbr3', -0.04, 'N');
      // Distant tree line (N / NE only — no dense east blockers in front of house)
      const tl = [
        [8000, 46000], [20000, 50000], [32000, 44000], [44000, 48000],
        [52000, 28000], [55000, 35000]
      ];
      tl.forEach(([tx, ty], ti) =>
        plantTree(cBag, tx, ty, 2.2 + (ti % 3) * 0.5, { low: true, base: 0.02 }));
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
        if (dir === 'x') {
          pb(bag, postM, a - 12, a + 12, fc - 12, fc + 12, stepH, stepH + h);
          // small brass collar at post top
          if (style) pb(bag, 'brass', a - 14, a + 14, fc - 14, fc + 14, stepH + h - 0.03, stepH + h);
        } else {
          pb(bag, postM, fc - 12, fc + 12, a - 12, a + 12, stepH, stepH + h);
          if (style) pb(bag, 'brass', fc - 14, fc + 14, a - 14, a + 14, stepH + h - 0.03, stepH + h);
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
      // East wall: solid white wall underneath landing & flight 1
      pb(bag, 'white', 16300, 16600, 230, 1040, 0, LAND_E);
      for (let i = 1; i <= numSteps; i++) {
        const stepH = L.porticoFl + i * RISE_E;
        const yA = 3890 - (i - 1) * 237.5, yB = 3890 - i * 237.5;
        const lo = Math.min(yA, yB), hi = Math.max(yA, yB);
        pb(bag, 'white', 16300, 16600, lo, hi, 0, stepH);
      }
      // Middle wall to close the gap between flights
      for (let i = 1; i <= numSteps; i++) {
        const stepH = L.porticoFl + i * RISE_E;
        const yA = 3890 - (i - 1) * 237.5, yB = 3890 - i * 237.5;
        const lo = Math.min(yA, yB), hi = Math.max(yA, yB);
        pb(bag, 'white', 15400, 15470, lo, hi, 0, stepH);
      }
    }

    /** FF-level rails around the external-stair void (shared by exterior + dollhouse) */
    function externalStairVoidRails(bag, baseH) {
      // West edge of void: only north of the lift tower (avoids punching the lift east wall)
      railing(bag, 'y', VOID_WX, LIFT_NY, 3890, baseH, 1.0);
      // East edge of void = west edge of outer east deck (clear of climbing rail at 15380)
      railing(bag, 'y', VOID_EX, 1040, 3890, baseH, 1.0);
      // South edge of void — full north face of the mid-landing overhead deck
      railing(bag, 'x', 1040, 14040, VOID_EX, baseH, 1.0);
      // Entrance: close gap west of the open stair head; leave x 14500..15400 open for arrival
      railing(bag, 'x', 3890, VOID_WX, 14500, baseH, 0.95);
    }

    function externalStair(bag, full) {
      // tower walls
      pb(bag, 'charDark', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);     // south
      // spine + flight railings
      if (full) {
        // Flight 1: handrail on spine (west of flight); east side uses MS screen
        stairRailing(bag, 'y', 15470, 3890, -1, 237.5, 12, L.porticoFl, RISE_E, 0.95, RAIL_OUT);
        railing(bag, 'x', 1040, 15400, 15470, LAND_E, 0.95); // landing spine rail
        // Flight 2: east climbing rail inset on the flight (deck void rail sits at VOID_EX)
        stairRailing(bag, 'y', 15380, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);
        railing(bag, 'x', 3890, 15380, 15470, L.f1, 0.95); // arrival spine rail

        // West railings (safety — west tower wall removed)
        railing(bag, 'y', 14500, 140, 1040, LAND_E, 0.95); // landing west
        stairRailing(bag, 'y', 14500, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);
        railing(bag, 'y', 14500, 3890, 4140, L.f1, 0.95); // arrival west
      }
      if (full) {
        stairWalls(bag, 12);

        // East MS bar screen: bottoms follow flight-1 step tops, top flush with FF deck
        pb(bag, 'ms', 16380, 16420, 230, towY[1], L.f1 - 0.02, L.f1 + 0.04); // top rail
        const n = Math.round((towY[1] - 380) / 152);
        for (let i = 0; i <= n; i++) {
          const sy = 300 + ((towY[1] - 80 - 300) * i) / n;
          let botH = L.porticoFl;
          if (sy <= 1040) {
            botH = LAND_E;
          } else if (sy < 3890) {
            // Match flight-1 tread tops: i = (3890-sy)/237.5 → height porticoFl + i*RISE
            botH = L.porticoFl + ((3890 - sy) / 2850) * (12 * RISE_E);
          }
          pb(bag, 'ms', 16378, 16422, sy - 20, sy + 20, botH, L.f1 + 0.04);
        }
      }
      // flight 1 (east strip, ascends south), 12 steps + landing flush with last tread
      flight(bag, 'concrete', 'y', 15470, 16370, 3890, -1, 237.5, 12, L.porticoFl, RISE_E);
      pb(bag, 'concrete', 14500, 16370, 140, 1040, LAND_E - 0.32, LAND_E); // landing
      pb(bag, 'balcTile', 14540, 16330, 180, 1000, LAND_E, LAND_E + 0.012); // landing finish
      // flight 2 (west strip, ascends north) — tops out at L.f1
      flight(bag, 'concrete', 'y', 14500, 15400, 1040, 1, 237.5, 12, LAND_E, RISE_E);
      // thin tread finish under last treads only (stay below deck tile top — no z-fight)
      pb(bag, 'balcTile', 15490, 16350, 1040, 1277, LAND_E - 0.004, LAND_E - 0.001);
      pb(bag, 'balcTile', 14520, 15380, 3652, 3890, L.f1 - 0.008, L.f1 - 0.002);
    }

    function liftTower(bag, topH, doors, botH) {
      // Shaft shell (charcoal). botH defaults to 0 (full tower for exterior).
      // Dollhouse floors pass the floor datum so only that storey band is drawn.
      if (botH === undefined || botH === null) botH = 0;
      // Entrances are bright stainless portals so they read clearly on every landing.
      pb(bag, 'charcoal', liftOX[0], liftOX[1], liftOY[0], liftOY[0] + 230, botH, topH); // south
      pb(bag, 'charcoal', 14040, 14270, 230, liftOY[1], botH, topH);                     // east

      const nY0 = 1805, nY1 = 2035;                 // north wall thickness band
      const midX = 13345;
      const clearW = 980;
      const dx0 = midX - clearW / 2, dx1 = midX + clearW / 2; // 12855 .. 13835
      const doorH = 2.10;                           // clear leaf height
      const portalH = 2.30;                         // incl. head frame

      // North wall flanks — door bays are cut in per landing
      pb(bag, 'charcoal', liftOX[0], dx0, nY0, nY1, botH, topH);
      pb(bag, 'charcoal', dx1, liftOX[1], nY0, nY1, botH, topH);

      let cur = botH;
      for (const dl of doors) {
        // Skip portals outside this height band (multi-door full tower uses all)
        if (dl + portalH < botH - 0.01 || dl > topH + 0.01) continue;
        // charcoal spandrel below this landing's sill
        if (dl > cur + 0.001) pb(bag, 'charcoal', dx0, dx1, nY0, nY1, cur, dl);

        // --- Stainless portal (identical on every floor) ---
        // Outer face is nY1; surround sits proud so it catches light.
        const faceOut = nY1 + 30;   // portal face proud of charcoal
        const faceIn  = nY1 - 50;   // door leaf rear
        const backY0  = nY0 + 15;   // solid backer blocks black shaft void

        // Jambs + head (steel surround)
        pb(bag, 'steel', dx0 - 55, dx0 + 18, nY1 - 10, faceOut, dl, dl + portalH);
        pb(bag, 'steel', dx1 - 18, dx1 + 55, nY1 - 10, faceOut, dl, dl + portalH);
        pb(bag, 'steel', dx0 - 55, dx1 + 55, nY1 - 10, faceOut, dl + doorH, dl + portalH);
        // Threshold / sill plate
        pb(bag, 'steel', dx0 - 30, dx1 + 30, nY1 - 90, faceOut + 15, dl, dl + 0.045);
        // Landing floor plate in the doorway band
        pb(bag, 'steel', dx0 + 5, dx1 - 5, nY0, nY1, dl, dl + 0.02);

        // Solid door leaves — bright metal, nearly flush with outer face
        const seam = 6;
        pb(bag, 'liftDoor', dx0 + 22, midX - seam, faceIn, nY1 + 8, dl + 0.045, dl + doorH - 0.01);
        pb(bag, 'liftDoor', midX + seam, dx1 - 22, faceIn, nY1 + 8, dl + 0.045, dl + doorH - 0.01);
        // Center meeting stile
        pb(bag, 'chrome', midX - seam, midX + seam, faceIn + 5, nY1 + 12, dl + 0.045, dl + doorH - 0.01);

        // Horizontal door rails (readable paneling, not a flat dark slab)
        for (const hy of [0.22, 1.00, 1.78]) {
          pb(bag, 'steel', dx0 + 40, midX - seam - 8, nY1 + 2, nY1 + 14, dl + hy, dl + hy + 0.035);
          pb(bag, 'steel', midX + seam + 8, dx1 - 40, nY1 + 2, nY1 + 14, dl + hy, dl + hy + 0.035);
        }
        // Vertical edge stiles on each leaf
        pb(bag, 'steel', dx0 + 22, dx0 + 40, nY1 + 2, nY1 + 14, dl + 0.045, dl + doorH - 0.01);
        pb(bag, 'steel', midX - seam - 22, midX - seam - 6, nY1 + 2, nY1 + 14, dl + 0.045, dl + doorH - 0.01);
        pb(bag, 'steel', midX + seam + 6, midX + seam + 22, nY1 + 2, nY1 + 14, dl + 0.045, dl + doorH - 0.01);
        pb(bag, 'steel', dx1 - 40, dx1 - 22, nY1 + 2, nY1 + 14, dl + 0.045, dl + doorH - 0.01);

        // Pull handles (chrome vertical bars near center)
        pb(bag, 'chrome', midX - 58, midX - 42, nY1 + 6, faceOut + 8, dl + 0.88, dl + 1.38);
        pb(bag, 'chrome', midX + 42, midX + 58, nY1 + 6, faceOut + 8, dl + 0.88, dl + 1.38);

        // Opaque backer behind leaves — no black shaft void shows through
        pb(bag, 'steel', dx0 + 12, dx1 - 12, backY0, faceIn - 4, dl + 0.02, dl + doorH);

        // Call-button plate on right outer jamb (same on every landing)
        pb(bag, 'steel', dx1 + 58, dx1 + 105, nY1, faceOut + 5, dl + 0.95, dl + 1.40);
        pb(bag, 'chrome', dx1 + 70, dx1 + 93, faceOut + 5, faceOut + 14, dl + 1.08, dl + 1.16);
        pb(bag, 'chrome', dx1 + 70, dx1 + 93, faceOut + 5, faceOut + 14, dl + 1.22, dl + 1.30);

        cur = dl + portalH;
      }
      // charcoal spandrel above the top portal
      if (topH > cur + 0.001) pb(bag, 'charcoal', dx0, dx1, nY0, nY1, cur, topH);
    }

    function columnsEast(bag, topH, botH) {
      // Ivory shaft + charcoal base/capital (same language as facade fins).
      // botH defaults to 0 (full height for exterior). Floor cutaways pass the
      // floor datum so only that storey of each portico pillar is drawn.
      if (botH === undefined || botH === null) botH = 0;
      const cap = 0.14;
      const shaftBot = botH + cap;
      const shaftTop = Math.max(shaftBot + 0.05, topH - cap);
      for (const cy of [8720, 4290, 150]) {
        pb(bag, 'charDark', 16300, 16600, cy - 150, cy + 150, botH, shaftBot);       // base / collar
        pb(bag, 'white', 16315, 16585, cy - 135, cy + 135, shaftBot, shaftTop);      // shaft
        pb(bag, 'charDark', 16300, 16600, cy - 150, cy + 150, shaftTop, topH);       // capital
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
      // Y = 230 to 1040 — lift cutout; solid over mid-landing & outer strip
      pb(bag, 'white', 0, 12650, 230, 1040, h0, h1);
      pb(bag, 'white', 14040, 17362, 230, 1040, h0, h1);
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
      // East of lift over mid-landing (Y = 230 to 1040)
      pb(bag, mat, 14040, 17332, 230, 1040, h0, h1);
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
      // plinth + GF base
      pb(eBag, 'plinth', X0 - 35, X1 + 35, Y0n - 35, Y1n + 35, 0, L.f0);
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
        const sX1 = ff ? 4805 : X1 - 230, eY0 = ff ? 1411 : Y0n;
        wallRun(eBag, 'white', 'y', eY0, Y1n, EB[0], EB[1], fl.fY, fl.h1, fl.fY, Eops);
        wallRun(eBag, 'white', 'x', X0 + 230, X1 - 230, NB[0], NB[1], fl.fY, fl.h1, fl.fY, Nops);
        wallRun(eBag, 'white', 'x', X0 + 230, sX1, SB[0], SB[1], fl.fY, fl.h1, fl.fY, Sops);
        wallRun(eBag, 'white', 'y', Y0n, Y1n, WB[0], WB[1], fl.fY, fl.h1, fl.fY, Wops);
        for (const o of fl.sch.E) glazing(eBag, Object.assign({ face: 'E', band: EB, floorY: fl.fY }, o));
        for (const o of fl.sch.N) glazing(eBag, Object.assign({ face: 'N', band: NB, floorY: fl.fY }, o));
        for (const o of fl.sch.S) glazing(eBag, Object.assign({ face: 'S', band: SB, floorY: fl.fY }, o));
        for (const o of fl.sch.W) glazing(eBag, Object.assign({ face: 'W', band: WB, floorY: fl.fY }, o));
      }
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
      wallRun(eBag, 'white', 'y', -762, 1411, EB[0], EB[1], L.f1, L.f2, L.f1,
              [{ c: -300, w: 600, sill: 0, h: 2400 }]); // SE corner east wall (grill door leaf from OPEN.f1.E)
      wallRun(eBag, 'white', 'x', 4805, 12420, -762, -646, L.f1, L.f2, L.f1,
              [{ c: 6527, w: 3215, sill: 900, h: 1400 }, { c: 8810, w: 600, sill: 1700, h: 600 }, { c: 11205, w: 2430, sill: 900, h: 1400 }]);
      glazing(eBag, { face: 'S', band: [-762, -646], floorY: L.f1, c: 6527, w: 3215, sill: 900, h: 1400, type: 'grill' });
      glazing(eBag, { face: 'S', band: [-762, -646], floorY: L.f1, c: 8810, w: 600, sill: 1700, h: 600, type: 'win', panes: 1 });
      glazing(eBag, { face: 'S', band: [-762, -646], floorY: L.f1, c: 11205, w: 2430, sill: 900, h: 1400, type: 'grill' });
      // Service-band floor tiles live on outdoor1 (dollhouse floor amenity group)
      // parapet (terrace) — continuous closed loop, no gaps
      pb(eBag, 'charcoal', X0, eastX[1], -762, -612, L.roof, L.parapetTop);                                  // south wall (flush with slab edge)
      pb(eBag, 'charcoal', X0, eastX[1], 9720, 9870, L.roof, L.parapetTop);                                  // north wall
      pb(eBag, 'charcoal', X0, 150, -612, 9720, L.roof, L.parapetTop);                                        // west wall
      pb(eBag, 'charcoal', eastX[1] - 150, eastX[1], -612, 9720, L.roof, L.parapetTop);                       // east wall
      // parapet coping — charcoal body + limestone top (matches facade copings)
      pb(eBag, 'charDark', X0 - 20, eastX[1] + 20, -782, -592, L.parapetTop, L.parapetTop + 0.04);
      pb(eBag, 'charDark', X0 - 20, eastX[1] + 20, 9700, 9890, L.parapetTop, L.parapetTop + 0.04);
      pb(eBag, 'charDark', X0 - 20, 170, -782, 9740, L.parapetTop, L.parapetTop + 0.04);
      pb(eBag, 'charDark', eastX[1] - 170, eastX[1] + 20, -782, 9740, L.parapetTop, L.parapetTop + 0.04);
      pb(eBag, 'copingLight', X0 - 28, eastX[1] + 28, -790, -584, L.parapetTop + 0.04, L.parapetTop + 0.07);
      pb(eBag, 'copingLight', X0 - 28, eastX[1] + 28, 9692, 9898, L.parapetTop + 0.04, L.parapetTop + 0.07);
      pb(eBag, 'copingLight', X0 - 28, 178, -790, 9748, L.parapetTop + 0.04, L.parapetTop + 0.07);
      pb(eBag, 'copingLight', eastX[1] - 178, eastX[1] + 28, -790, 9748, L.parapetTop + 0.04, L.parapetTop + 0.07);
      // terrace floor with cutouts for stairwell and lift shaft
      pb(eBag, 'terraceF', 150, 17212, 150, 230, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, 12650, 230, 1805, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 14040, 17212, 230, 1805, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, 17212, 1805, 6496, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, 230, 6496, 8641, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 5600, 17212, 6496, 8641, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, 17212, 8641, 9720, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, 17212, -612, 150, L.roof - 0.06, L.roof); // south terrace floor extension to parapet
      pb(eBag, 'terraceF', 12650, 14040, 230, 1805, L.roof - 0.06, L.roof); // fill deck gap (portico-top)
      // mumty (stair head, expanded to x=5600 and aligned with walls below)
      const mx = [230, 5600], my = [6496, 8641];
      wallRun(eBag, 'white', 'x', mx[0] - 230, mx[1] + 115, my[0] - 115, my[0], L.roof, L.roof + 2.55, L.roof, []);
      wallRun(eBag, 'white', 'x', mx[0] - 230, mx[1] + 115, my[1], my[1] + 229, L.roof, L.roof + 2.55, L.roof,
              [{ c: 3500, w: 700, sill: 1300, h: 700 }]);
      glazing(eBag, { face: 'N', band: [my[1], my[1] + 229], floorY: L.roof, c: 3500, w: 700, sill: 1300, h: 700, type: 'win', panes: 1 });
      wallRun(eBag, 'white', 'y', my[0] - 115, my[1] + 229, mx[0] - 230, mx[0], L.roof, L.roof + 2.55, L.roof, []);
      wallRun(eBag, 'white', 'y', my[0] - 115, my[1] + 229, mx[1], mx[1] + 115, L.roof, L.roof + 2.55, L.roof,
              [{ c: 7560, w: 900, sill: 0, h: 2150 }]);
      glazing(eBag, { face: 'E', band: [mx[1], mx[1] + 115], floorY: L.roof, c: 7560, w: 900, sill: 0, h: 2150, type: 'door' });
      // Mumty roof + limestone coping
      pb(eBag, 'charDark', mx[0] - 230 - 120, mx[1] + 115 + 120, my[0] - 115 - 120, my[1] + 229 + 120, L.roof + 2.55, L.roof + 2.65);
      pb(eBag, 'copingLight', mx[0] - 230 - 130, mx[1] + 115 + 130, my[0] - 115 - 130, my[1] + 229 + 130, L.roof + 2.65, L.roof + 2.72);
      // Mumty exterior accent surround on east door + north window
      pb(eBag, 'accentWarm', mx[1] + 100, mx[1] + 210, 7000, 8120, L.roof + 2.15, L.roof + 2.28);
      pb(eBag, 'accentWarm', mx[1] + 100, mx[1] + 210, 7000, 7120, L.roof, L.roof + 2.28);
      pb(eBag, 'accentWarm', mx[1] + 100, mx[1] + 210, 8000, 8120, L.roof, L.roof + 2.28);
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
      pb(eBag, 'charDark', liftOX[0] - 40, liftOX[1] + 40, liftOY[0] - 40, liftOY[1] + 40, L.liftTop, L.liftTop + 0.05);
      externalStair(eBag, true);
      columnsEast(eBag, L.roof - L.slabT);

      // Terrace slab extensions and soffits over second-floor balconies
      pb(eBag, 'white', 0, 17362, -762, Y1n, L.roof - L.slabT, L.roof);
      pb(eBag, 'charDark', 60, 17302, -702, Y1n - 60, L.roof - L.slabT - 0.008, L.roof - L.slabT);
      // Terrace North Balcony Slabs & Soffits
      pb(eBag, 'white', 0, 17362, Y1n, Y1n + 1000, L.roof - L.slabT, L.roof);
      pb(eBag, 'charDark', 60, 17302, Y1n, Y1n + 1000 - 60, L.roof - L.slabT - 0.008, L.roof - L.slabT);
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
        // GF door
        for (const cx of flankCenters(8650, 1200, 190)) northWallLamp(cx, L.f0);
        // GF windows — bed02, hall, office
        for (const o of [{ c: 2400, w: 1500 }, { c: 6800, w: 1800 }, { c: 11000, w: 1500 }]) {
          for (const cx of flankCenters(o.c, o.w, 160)) northWallLamp(cx, L.f0);
        }
        // FF / SF north windows (no door on upper north)
        for (const fl of [L.f1, L.f2]) {
          for (const o of [{ c: 5500, w: 1000 }, { c: 8760, w: 1000 }]) {
            for (const cx of flankCenters(o.c, o.w, 160)) northWallLamp(cx, fl);
          }
        }
        // FF pooja slit
        for (const cx of flankCenters(11650, 600, 140)) northWallLamp(cx, L.f1);
      })();
      // East entry lamps: GF office c=6180; FF duplex c=6180+sidelite; SF french c=6410.
      (function eastEntryLamps() {
        function eastLamp(cy, fl) {
          pb(eBag, 'charDark', EB[1], EB[1] + 70, cy - 50, cy + 50, fl + 1.7, fl + 2.05);
          pb(eBag, 'steel', EB[1] + 4, EB[1] + 62, cy - 40, cy + 40, fl + 1.74, fl + 2.01);
          pb(eBag, 'lamp', EB[1] + 70, EB[1] + 98, cy - 35, cy + 35, fl + 1.78, fl + 1.97);
        }
        for (const cy of flankCenters(6180, 1200, 190)) eastLamp(cy, L.f0);
        // FF door 6180 + sidelite 7010 → combined opening ~5580..7235, c≈6407.5 w≈1655
        for (const cy of flankCenters(6408, 1655, 190)) eastLamp(cy, L.f1);
        for (const cy of flankCenters(6410, 1650, 190)) eastLamp(cy, L.f2);
      })();

      // ===== EAST FACADE TREATMENT — Modern Minimal Elevation =====
      (function eastFacade() {
        const EF = 12650; // east wall outer face x-coordinate (mm)
        const ey0 = 0, ey1 = 8870; // east wall y-range (south to north)

        // --- 1. Horizontal Expression Bands ---
        // Bold charcoal bands with warm-stone coping caps at each floor datum.
        // 250mm projection from wall face, 180mm tall — clearly visible as datum lines.

        // Plinth-top band
        pb(eBag, 'charDark', EF - 20, EF + 250, ey0 - 40, ey1 + 40, L.f0 - 0.02, L.f0 + 0.16);
        pb(eBag, 'copingLight', EF - 25, EF + 260, ey0 - 45, ey1 + 45, L.f0 + 0.16, L.f0 + 0.20);

        // FF slab-line band (below FF slab)
        pb(eBag, 'charDark', EF - 20, EF + 250, ey0 - 40, ey1 + 40, L.f1 - 0.20, L.f1 - 0.02);
        pb(eBag, 'copingLight', EF - 25, EF + 260, ey0 - 45, ey1 + 45, L.f1 - 0.02, L.f1 + 0.02);

        // SF slab-line band (below SF slab)
        pb(eBag, 'charDark', EF - 20, EF + 250, ey0 - 40, ey1 + 40, L.f2 - 0.20, L.f2 - 0.02);
        pb(eBag, 'copingLight', EF - 25, EF + 260, ey0 - 45, ey1 + 45, L.f2 - 0.02, L.f2 + 0.02);

        // Roof slab-line band (below roof)
        pb(eBag, 'charDark', EF - 20, EF + 250, ey0 - 40, ey1 + 40, L.roof - 0.20, L.roof - 0.02);
        pb(eBag, 'copingLight', EF - 25, EF + 260, ey0 - 45, ey1 + 45, L.roof - 0.02, L.roof + 0.02);

        // --- 2. Window / Door Accent Surrounds (warm stone-brown frames) ---
        // Bold picture-frame effect: 120mm-wide strips, 100mm proud of wall.
        function accentSurround(c, w, sill, h, floorY) {
          const ya = c - w / 2, yb = c + w / 2;
          const hBot = floorY + sill / 1000;
          const hTop = hBot + h / 1000;
          const sw = 120; // surround strip width (mm)
          const swM = sw / 1000;
          const sx0 = EF - 15, sx1 = EF + 100; // 115mm depth — clearly proud of wall
          // Top header
          pb(eBag, 'accentWarm', sx0, sx1, ya - sw, yb + sw,
             hTop + 0.01, hTop + swM + 0.01);
          // Bottom sill strip (only for raised-sill windows)
          if (sill > 100) {
            pb(eBag, 'accentWarm', sx0, sx1, ya - sw, yb + sw,
               hBot - swM - 0.01, hBot - 0.01);
          }
          // Left vertical
          pb(eBag, 'accentWarm', sx0, sx1, ya - sw, ya - 8,
             hBot - (sill > 100 ? swM + 0.01 : 0), hTop + swM + 0.01);
          // Right vertical
          pb(eBag, 'accentWarm', sx0, sx1, yb + 8, yb + sw,
             hBot - (sill > 100 ? swM + 0.01 : 0), hTop + swM + 0.01);
        }
        // Apply surrounds to all east-face openings on each floor
        for (const o of OPEN.f0.E) accentSurround(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.E) accentSurround(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.E) accentSurround(o.c, o.w, o.sill || 0, o.h, L.f2);

        // --- 3. Vertical Accent Fins ---
        // 250mm proud of wall, 200mm wide — cast real shadows on the facade.
        // Positions verified clear of all window/door openings across 3 floors.
        for (const fy of [350, 3950, 8550]) {
          pb(eBag, 'charcoal', EF - 10, EF + 250, fy - 100, fy + 100,
             L.f0 + 0.22, L.roof - 0.22);
          // Warm accent cap at top of each fin
          pb(eBag, 'accentWarm', EF - 10, EF + 255, fy - 105, fy + 105,
             L.roof - 0.22, L.roof - 0.16);
          // Warm accent base
          pb(eBag, 'accentWarm', EF - 10, EF + 255, fy - 105, fy + 105,
             L.f0 + 0.16, L.f0 + 0.22);
        }

        // --- 4. Entrance Canopies (wall-attached projecting shades) ---
        // GF office door (c=6180, w=1200) — 750mm projection, 100mm thick
        pb(eBag, 'charDark', EF - 25, EF + 750, 5280, 7080,
           L.f0 + 2.50, L.f0 + 2.60);          // canopy slab
        pb(eBag, 'accentWarm', EF + 30, EF + 740, 5300, 7060,
           L.f0 + 2.40, L.f0 + 2.50);          // warm soffit accent
        pb(eBag, 'lamp', EF + 80, EF + 700, 5450, 6900,
           L.f0 + 2.385, L.f0 + 2.40);         // under-glow strip
        pb(eBag, 'charDark', EF + 740, EF + 770, 5270, 7090,
           L.f0 + 2.38, L.f0 + 2.62);          // drip edge

        // FF duplex entry (c=6180 door + c=7010 sidelite) — wider canopy
        pb(eBag, 'charDark', EF - 25, EF + 750, 5280, 7470,
           L.f1 + 2.50, L.f1 + 2.60);
        pb(eBag, 'accentWarm', EF + 30, EF + 740, 5300, 7450,
           L.f1 + 2.40, L.f1 + 2.50);
        pb(eBag, 'lamp', EF + 80, EF + 700, 5450, 7300,
           L.f1 + 2.385, L.f1 + 2.40);
        pb(eBag, 'charDark', EF + 740, EF + 770, 5270, 7480,
           L.f1 + 2.38, L.f1 + 2.62);

        // --- 5. Slab-edge warm accents are drawn with the full FF/SF fascia loops above ---

        // --- 6. Portico Column Accent Bands (over white shaft + charcoal base/cap) ---
        const colTopH = L.roof - L.slabT;
        for (const cy of [8720, 4290, 150]) {
          pb(eBag, 'accentWarm', 16280, 16620, cy - 170, cy + 170, 0.14, 0.26);
          pb(eBag, 'accentWarm', 16280, 16620, cy - 170, cy + 170,
             colTopH - 0.26, colTopH - 0.14);
          const midH = colTopH * 0.5;
          pb(eBag, 'copingLight', 16290, 16610, cy - 150, cy + 150,
             midH - 0.025, midH + 0.025);
        }

        // --- 7. Accent Panel Zones (visual break on blank wall areas) ---
        // Warm-toned accent panels (50mm proud) in the large blank wall zones
        // GF: blank zone between kitchen windows and office door
        pb(eBag, 'accentWarm', EF - 5, EF + 50, 3500, 5250,
           L.f0 + 0.30, L.f0 + 0.60);
        pb(eBag, 'copingLight', EF - 5, EF + 50, 3500, 5250,
           L.f0 + 0.60, L.f0 + 0.65);
        // FF: blank zone south of entry
        pb(eBag, 'accentWarm', EF - 5, EF + 50, 3950, 5250,
           L.f1 + 0.30, L.f1 + 0.60);
        pb(eBag, 'copingLight', EF - 5, EF + 50, 3950, 5250,
           L.f1 + 0.60, L.f1 + 0.65);
        // SF: blank zone south of french door
        pb(eBag, 'accentWarm', EF - 5, EF + 50, 3950, 5250,
           L.f2 + 0.30, L.f2 + 0.60);
        pb(eBag, 'copingLight', EF - 5, EF + 50, 3950, 5250,
           L.f2 + 0.60, L.f2 + 0.65);
      })();

      // ===== N / S / W facade datum bands (same language as east elevation) =====
      (function perimeterBands() {
        const datums = [
          [L.f0 - 0.02, L.f0 + 0.14, L.f0 + 0.14, L.f0 + 0.18],
          [L.f1 - 0.18, L.f1 - 0.02, L.f1 - 0.02, L.f1 + 0.02],
          [L.f2 - 0.18, L.f2 - 0.02, L.f2 - 0.02, L.f2 + 0.02],
          [L.roof - 0.18, L.roof - 0.02, L.roof - 0.02, L.roof + 0.02]
        ];
        for (const [bh0, bh1, ch0, ch1] of datums) {
          // North face (main block)
          pb(eBag, 'charDark', 200, 12420, Y1n - 20, Y1n + 160, bh0, bh1);
          pb(eBag, 'copingLight', 190, 12430, Y1n - 25, Y1n + 170, ch0, ch1);
          // South face (bedroom stretch + service band outer)
          pb(eBag, 'charDark', 200, 4800, -20, 160, bh0, bh1);
          pb(eBag, 'copingLight', 190, 4810, -25, 170, ch0, ch1);
          pb(eBag, 'charDark', 4920, 12420, -762 - 20, -762 + 160, bh0, bh1);
          pb(eBag, 'copingLight', 4910, 12430, -762 - 25, -762 + 170, ch0, ch1);
          // West face
          pb(eBag, 'charDark', -20, 160, 200, 8640, bh0, bh1);
          pb(eBag, 'copingLight', -25, 170, 190, 8650, ch0, ch1);
        }
      })();

      // ===== NORTH FACADE TREATMENT — main entry + window surrounds =====
      (function northFacade() {
        const NF = Y1n; // outer north face y (8870)
        // Warm surrounds for every north opening (runs along x; proud northward)
        function nSurround(c, w, sill, h, floorY) {
          const xa = c - w / 2, xb = c + w / 2;
          const hBot = floorY + sill / 1000;
          const hTop = hBot + h / 1000;
          const sw = 110, swM = sw / 1000;
          const sy0 = NF - 15, sy1 = NF + 95;
          pb(eBag, 'accentWarm', xa - sw, xb + sw, sy0, sy1, hTop + 0.01, hTop + swM + 0.01);
          if (sill > 100) {
            pb(eBag, 'accentWarm', xa - sw, xb + sw, sy0, sy1, hBot - swM - 0.01, hBot - 0.01);
          }
          pb(eBag, 'accentWarm', xa - sw, xa - 8, sy0, sy1,
             hBot - (sill > 100 ? swM + 0.01 : 0), hTop + swM + 0.01);
          pb(eBag, 'accentWarm', xb + 8, xb + sw, sy0, sy1,
             hBot - (sill > 100 ? swM + 0.01 : 0), hTop + swM + 0.01);
        }
        for (const o of OPEN.f0.N) nSurround(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.N) nSurround(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.N) nSurround(o.c, o.w, o.sill || 0, o.h, L.f2);

        // Main door canopy (c=8650, w=1200 → leaf 8050..9250) — projects north over stoop
        pb(eBag, 'charDark', 7900, 9400, NF - 25, NF + 720, L.f0 + 2.50, L.f0 + 2.60);
        pb(eBag, 'accentWarm', 7930, 9370, NF + 30, NF + 700, L.f0 + 2.40, L.f0 + 2.50);
        pb(eBag, 'charDark', 7880, 9420, NF + 700, NF + 730, L.f0 + 2.38, L.f0 + 2.62);
        // Canopy under-glow (warm lamp strip) — under the canopy only, over the door leaf
        pb(eBag, 'lamp', 8100, 9200, NF + 80, NF + 650, L.f0 + 2.385, L.f0 + 2.40);

        // Vertical fins on solid wall only (must clear every floor's north openings).
        // Blocked x-bands (leaf + ~150): 1650-3150, 5000-6000, 5900-7700,
        // 8050-9260, 10250-11950. Clear: ~3800-4900, ~9400-10100, ~12100-12500.
        for (const fx of [4200, 9750, 12300]) {
          pb(eBag, 'charcoal', fx - 90, fx + 90, NF - 10, NF + 220, L.f0 + 0.22, L.roof - 0.22);
          pb(eBag, 'accentWarm', fx - 95, fx + 95, NF - 10, NF + 225, L.roof - 0.22, L.roof - 0.16);
          pb(eBag, 'accentWarm', fx - 95, fx + 95, NF - 10, NF + 225, L.f0 + 0.16, L.f0 + 0.22);
        }
        // Upper-level wall lamps are drawn in northFacadeLamps() above (aligned to frames).
      })();

      // ===== PORTICO AMBIENT — column uplights + lift approach lamps =====
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
        // Lift approach wall lamps — north face of tower (outer face y=2035)
        for (const fl of [L.porticoFl, L.f1, L.f2]) {
          for (const [x0, x1] of [[12720, 12800], [13890, 13970]]) {
            pb(eBag, 'charDark', x0, x1, 2035, 2105, fl + 1.55, fl + 1.90);
            pb(eBag, 'steel', x0 + 10, x1 - 10, 2040, 2095, fl + 1.58, fl + 1.87);
            pb(eBag, 'lamp', x0 + 15, x1 - 15, 2105, 2135, fl + 1.62, fl + 1.82);
          }
        }
      })();

      // ===== SOUTH FACADE — window surrounds on bedroom stretch (matches N/E) =====
      (function southFacade() {
        const SF = 0; // main south shell outer face
        function sSurround(c, w, sill, h, floorY) {
          const xa = c - w / 2, xb = c + w / 2;
          const hBot = floorY + sill / 1000;
          const hTop = hBot + h / 1000;
          const sw = 100, swM = sw / 1000;
          const sy0 = SF - 95, sy1 = SF + 15; // proud southward
          pb(eBag, 'accentWarm', xa - sw, xb + sw, sy0, sy1, hTop + 0.01, hTop + swM + 0.01);
          if (sill > 100) {
            pb(eBag, 'accentWarm', xa - sw, xb + sw, sy0, sy1, hBot - swM - 0.01, hBot - 0.01);
          }
          pb(eBag, 'accentWarm', xa - sw, xa - 8, sy0, sy1,
             hBot - (sill > 100 ? swM + 0.01 : 0), hTop + swM + 0.01);
          pb(eBag, 'accentWarm', xb + 8, xb + sw, sy0, sy1,
             hBot - (sill > 100 ? swM + 0.01 : 0), hTop + swM + 0.01);
        }
        // Bedroom stretch only (shell x 230..4805 on FF; full on GF/SF)
        for (const o of OPEN.f0.S) if (o.c < 7000) sSurround(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.S) sSurround(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.S) if (o.c < 7000 || o.type === 'win') sSurround(o.c, o.w, o.sill || 0, o.h, L.f2);
      })();

      // ===== WEST FACADE — surrounds on all west openings (matches N/E/S) =====
      (function westFacade() {
        const WF = 0; // outer west face x
        function wSurround(c, w, sill, h, floorY) {
          // openings run along y; surround proud westward
          const ya = c - w / 2, yb = c + w / 2;
          const hBot = floorY + sill / 1000;
          const hTop = hBot + h / 1000;
          const sw = 100, swM = sw / 1000;
          const sx0 = WF - 95, sx1 = WF + 15;
          pb(eBag, 'accentWarm', sx0, sx1, ya - sw, yb + sw, hTop + 0.01, hTop + swM + 0.01);
          if (sill > 100) {
            pb(eBag, 'accentWarm', sx0, sx1, ya - sw, yb + sw, hBot - swM - 0.01, hBot - 0.01);
          }
          pb(eBag, 'accentWarm', sx0, sx1, ya - sw, ya - 8,
             hBot - (sill > 100 ? swM + 0.01 : 0), hTop + swM + 0.01);
          pb(eBag, 'accentWarm', sx0, sx1, yb + 8, yb + sw,
             hBot - (sill > 100 ? swM + 0.01 : 0), hTop + swM + 0.01);
        }
        for (const o of OPEN.f0.W) wSurround(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.W) wSurround(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.W) wSurround(o.c, o.w, o.sill || 0, o.h, L.f2);
        // Vertical fins on solid wall only — full-height, so clear of openings
        // on every floor (west openings use c as plan-y):
        //   GF: 2360-3560, 4260-4860, 6400-7600
        //   FF/SF: 3130-4330, 5160-5760, 6970-8170
        // Old fins at y=7600 cut through the stair-landing window (6970-8170).
        // Clear bands: ~900-2000, ~5900-6300, ~8300-8800.
        for (const fy of [1100, 6080, 8500]) {
          pb(eBag, 'charcoal', WF - 180, WF + 10, fy - 90, fy + 90, L.f0 + 0.22, L.roof - 0.22);
          pb(eBag, 'accentWarm', WF - 185, WF + 12, fy - 95, fy + 95, L.roof - 0.22, L.roof - 0.16);
          pb(eBag, 'accentWarm', WF - 185, WF + 12, fy - 95, fy + 95, L.f0 + 0.16, L.f0 + 0.22);
        }
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

      /** Structural deck + tile + thin soffit for an outdoor rectangle */
      function outdoorDeck(bag, x0, x1, y0, y1, fY, tileMat) {
        const h0 = fY - L.slabT, h1 = fY;
        const t0 = fY, t1 = fY + 0.012;
        const s0 = h0 - 0.008, s1 = h0;
        if (x1 - x0 < 40 || y1 - y0 < 40) return;
        pb(bag, 'white', x0, x1, y0, y1, h0, h1);
        pb(bag, 'charDark', x0 + 40, x1 - 40, y0 + 40, y1 - 40, s0, s1);
        pb(bag, tileMat || 'balcTile', x0 + 25, x1 - 25, y0 + 25, y1 - 25, t0, t1);
      }

      // --- outdoor0: GF portico + stoops only ---
      const o0 = makeBag(THREE);
      pb(o0, 'concrete', EX0, EX1, portY[0], portY[1], 0, L.porticoFl);
      pb(o0, 'balcTile', EX0 + 50, EX1 - 50, portY[0] + 50, portY[1] - 50, L.porticoFl, L.porticoFl + 0.014);
      // Outer curb only (not a second slab)
      pb(o0, 'charDark', EX0 - 20, EX1 + 20, portY[0] - 20, portY[0] + 40, 0, L.porticoFl + 0.04);
      pb(o0, 'charDark', EX0 - 20, EX1 + 20, portY[1] - 40, portY[1] + 20, 0, L.porticoFl + 0.04);
      pb(o0, 'charDark', EX1 - 40, EX1 + 20, portY[0], portY[1], 0, L.porticoFl + 0.04);
      pb(o0, 'copingLight', EX0 - 25, EX1 + 25, portY[0] - 25, portY[0] + 45, L.porticoFl + 0.04, L.porticoFl + 0.06);
      pb(o0, 'copingLight', EX0 - 25, EX1 + 25, portY[1] - 45, portY[1] + 25, L.porticoFl + 0.04, L.porticoFl + 0.06);
      pb(o0, 'copingLight', EX1 - 45, EX1 + 25, portY[0], portY[1], L.porticoFl + 0.04, L.porticoFl + 0.06);
      // Planters at columns — clear of parking bay (14200..16500 × 5200..7600)
      Fur.planter(o0, 16080, 8720, L.porticoFl, 0.85);
      Fur.planter(o0, 16080, 4290, L.porticoFl, 0.85);
      Fur.planter(o0, 16080, 150, L.porticoFl, 0.8);
      Fur.planter(o0, 16920, 8720, L.porticoFl, 0.75);
      Fur.planter(o0, 16920, 150, L.porticoFl, 0.75);
      Fur.planter(o0, 13100, 5300, L.porticoFl, 0.65);
      Fur.planter(o0, 13100, 7100, L.porticoFl, 0.65);
      // Parking bay marks
      (function parkingBay() {
        const bx0 = 14200, bx1 = 16500, by0 = 5200, by1 = 7600;
        pb(o0, 'roadLine', bx0, bx1, by0, by0 + 50, L.porticoFl + 0.014, L.porticoFl + 0.022);
        pb(o0, 'roadLine', bx0, bx1, by1 - 50, by1, L.porticoFl + 0.014, L.porticoFl + 0.022);
        pb(o0, 'roadLine', bx0, bx0 + 50, by0, by1, L.porticoFl + 0.014, L.porticoFl + 0.022);
        pb(o0, 'roadLine', bx1 - 50, bx1, by0, by1, L.porticoFl + 0.014, L.porticoFl + 0.022);
        for (const [cx0, cy0, sx, sy] of [
          [bx0, by0, 1, 1], [bx1, by0, -1, 1], [bx0, by1, 1, -1], [bx1, by1, -1, -1]
        ]) {
          pb(o0, 'roadLine', cx0, cx0 + sx * 350, cy0, cy0 + sy * 45, L.porticoFl + 0.015, L.porticoFl + 0.025);
          pb(o0, 'roadLine', cx0, cx0 + sx * 45, cy0, cy0 + sy * 350, L.porticoFl + 0.015, L.porticoFl + 0.025);
        }
        pb(o0, 'charDark', 14200, 14320, 5400, 7400, L.porticoFl, L.porticoFl + 0.12);
        pb(o0, 'copingLight', 14190, 14330, 5390, 7410, L.porticoFl + 0.12, L.porticoFl + 0.14);
      })();
      // North main-door stoop
      pb(o0, 'plinth', 7800, 9500, Y1n, 10070, 0, L.f0);
      pb(o0, 'copingLight', 7820, 9480, Y1n + 20, 10050, L.f0, L.f0 + 0.02);
      let st = 0.60;
      for (let i = 0; i < 4; i++) {
        pb(o0, 'plinth', 7800, 9500, 10070 + i * 300, 10070 + (i + 1) * 300, 0, st);
        pb(o0, 'copingLight', 7820, 9480, 10080 + i * 300, 10070 + (i + 1) * 300 - 10, st, st + 0.018);
        st -= 0.15;
      }
      // Office stoop on portico (door c=6180)
      st = 0.60;
      for (let i = 0; i < 3; i++) {
        pb(o0, 'plinth', 12650 + i * 300, 12950 + i * 300, 5580, 6780, L.porticoFl, st);
        pb(o0, 'copingLight', 12660 + i * 300, 12940 + i * 300, 5600, 6760, st, st + 0.018);
        st -= 0.15;
      }
      const g0 = o0.build(THREE, materials); g0.name = 'outdoor0'; root.add(g0); outdoors.push(g0);

      // --- outdoor1: FF outdoor decks ONLY (no interior floor plate) ---
      const o1 = makeBag(THREE);
      const f1 = L.f1;
      // South bedroom balcony (west of service band)
      outdoorDeck(o1, 30, 4805, -732, 0, f1);
      // Portico-top / south-east deck
      outdoorDeck(o1, EX0, EX1, -732, 230, f1);
      // Over external-stair mid-landing (east of lift)
      outdoorDeck(o1, 14040, EX1, 230, 1040, f1);
      // Outer east strip beside stair void
      outdoorDeck(o1, VOID_EX + 20, EX1, 1040, 3890, f1);
      // East corridor (house face → void west), north of lift
      outdoorDeck(o1, EX0 + 30, VOID_WX - 20, LIFT_NY, 3890, f1);
      // East deck north of stair arrival → building NE
      outdoorDeck(o1, EX0, EX1, 3890, Y1n, f1);
      // North balcony (outside main north wall)
      outdoorDeck(o1, 30, EX1, NBY0, NBY1 - 30, f1);
      // Service-band floors (south of main block, FF only)
      outdoorDeck(o1, 4965, 8085, -596, 1360, f1);
      outdoorDeck(o1, 8300, 9320, -596, 1360, f1);
      outdoorDeck(o1, 9536, 12370, -596, 1360, f1);
      // Edge fascia — outdoor perimeter only (not a full-building loop)
      pb(o1, 'charDark', EX1 - 90, EX1 + 10, -762, NBY1, f1 - 0.45, f1 + 0.012);
      pb(o1, 'charDark', EX0, EX1 + 10, NBY1 - 90, NBY1 + 10, f1 - 0.45, f1 + 0.012);
      pb(o1, 'charDark', EX0, EX1 + 10, -762 - 90, -762 + 10, f1 - 0.45, f1 + 0.012);
      pb(o1, 'charDark', 0, 4805, -762 - 90, -762 + 10, f1 - 0.45, f1 + 0.012);
      pb(o1, 'accentWarm', EX1 - 100, EX1 + 18, -770, NBY1 + 10, f1 - 0.53, f1 - 0.45);
      // Railings on outdoor edges
      railing(o1, 'x', -762, 0, 4805, f1, 1.0);
      railing(o1, 'y', 0, -762, 0, f1, 1.0);
      railing(o1, 'x', -762, EX0, EX1, f1, 1.0);
      railing(o1, 'y', EX1 - 80, -762, NBY1 - 80, f1, 1.0);
      externalStairVoidRails(o1, f1);
      railing(o1, 'x', NBY1 - 80, EX0, EX1 - 80, f1, 1.0);
      railing(o1, 'x', NBY1 - 80, 80, EX0, f1, 1.0);
      railing(o1, 'y', 80, Y1n, NBY1 - 80, f1, 1.0);
      Fur.planter(o1, 16280, 8430, f1, 0.9);
      Fur.planter(o1, 13350, 8430, f1, 0.8);
      Fur.planter(o1, 16280, 4200, f1, 0.8);
      const g1 = o1.build(THREE, materials); g1.name = 'outdoor1'; root.add(g1); outdoors.push(g1);

      // --- outdoor2: SF outdoor decks ONLY ---
      const o2 = makeBag(THREE);
      const f2 = L.f2;
      // South outdoor strip (portico-top + south balcony)
      outdoorDeck(o2, 30, EX1, -732, 230, f2);
      // East of lift shaft only (lift cutout 12650..14040 × 230..1805)
      outdoorDeck(o2, 14040, EX1, 230, 1805, f2);
      // Continuous east outdoor deck north of lift
      outdoorDeck(o2, EX0, EX1, 1805, Y1n, f2);
      // North balcony
      outdoorDeck(o2, 30, EX1, NBY0, NBY1 - 30, f2);
      // Edge fascia outdoor only
      pb(o2, 'charDark', EX1 - 90, EX1 + 10, -762, NBY1, f2 - 0.45, f2 + 0.012);
      pb(o2, 'charDark', 0, EX1 + 10, NBY1 - 90, NBY1 + 10, f2 - 0.45, f2 + 0.012);
      pb(o2, 'charDark', 0, EX1 + 10, -762 - 90, -762 + 10, f2 - 0.45, f2 + 0.012);
      pb(o2, 'accentWarm', EX1 - 100, EX1 + 18, -770, NBY1 + 10, f2 - 0.53, f2 - 0.45);
      railing(o2, 'x', -762, 0, EX1, f2, 1.0);
      railing(o2, 'y', EX1 - 80, -762, NBY1 - 80, f2, 1.0);
      railing(o2, 'x', NBY1 - 80, 80, EX1 - 80, f2, 1.0);
      railing(o2, 'y', 80, Y1n, NBY1 - 80, f2, 1.0);
      Fur.planter(o2, 16280, 8430, f2, 0.95);
      Fur.planter(o2, 13350, 8430, f2, 0.85);
      Fur.planter(o2, 16280, 4200, f2, 0.9);
      // Loungers on solid east deck (north of y≈3890, east of EX0)
      Fur.lounger(o2, 15050, 16350, 5500, 6280, f2);
      Fur.lounger(o2, 15050, 16350, 6600, 7380, f2);
      Fur.table(o2, 15200, 15800, 6400, 7000, f2, 0.40);
      Fur.planter(o2, 14800, 7800, f2, 0.7);
      const g2 = o2.build(THREE, materials); g2.name = 'outdoor2'; root.add(g2); outdoors.push(g2);
    })();

    /* ======== DOLLHOUSE floors ======== */
    const floorsOut = [];
    const FLOOR_DEFS = [
      { fY: L.f0, sch: OPEN.f0 },
      { fY: L.f1, sch: OPEN.f1 },
      { fY: L.f2, sch: OPEN.f2 }
    ];

    FLOOR_DEFS.forEach((fd, fi) => {
      const bag = makeBag(THREE);
      const fY = fd.fY, cut = fY + L.f2f - L.slabT;

      // base slab
      if (fi === 0) {
        pb(bag, 'plinth', X0 - 35, X1 + 35, Y0n - 35, Y1n + 35, fY - 0.42, fY - 0.03);
        pb(bag, 'tCirc', X0, X1, Y0n, Y1n, fY - 0.03, fY);
      } else if (fi === 1) {
        // Continuous solid slab (Ground Floor ceiling / First Floor floor)
        pb(bag, 'white', X0, X1, Y0n, Y1n, fY - L.slabT, fY);
      } else {
        // Southern solid slab
        pb(bag, 'white', X0, X1, Y0n, 6000, fY - L.slabT, fY);
        // Slab between y = 6000 and 6496 (split around double-height void)
        pb(bag, 'white', X0, 6020, 6000, 6496, fY - L.slabT, fY);
        pb(bag, 'white', 8241, X1, 6000, 6496, fY - L.slabT, fY);
        // Slab between y = 6496 and 8641 (split around stairwell and double-height void)
        pb(bag, 'white', X0, 230, 6496, 8641, fY - L.slabT, fY);
        pb(bag, 'white', 4630, 6020, 6496, 8641, fY - L.slabT, fY); // West gallery walkway
        pb(bag, 'white', 8241, X1, 6496, 8641, fY - L.slabT, fY);
        // Northern solid slab
        pb(bag, 'white', X0, X1, 8641, Y1n, fY - L.slabT, fY);
      }

      // exterior walls (cut) — door openings become gaps; windows leave sill stubs
      const dollOps = sch => sch.map(o => ({ c: o.c, w: o.w, sill: o.sill, h: o.h }));
      const Eo = dollOps(fd.sch.E), No = dollOps(fd.sch.N), So = dollOps(fd.sch.S), Wo = dollOps(fd.sch.W);
      // FF only: south shell stops at the utility west wall; east shell starts
      // above the wet-kitchen band (IW supplies the SE corner wall y -762..1411)
      const sX1d = fi === 1 ? 4805 : X1 - 230, eY0d = fi === 1 ? 1411 : Y0n;
      // ivory walls + soft limestone wall-top cap (unified crown line)
      wallRun(bag, 'white', 'y', eY0d, Y1n, EB[0], EB[1], fY, cut, fY, Eo, 'copingLight');
      wallRun(bag, 'white', 'x', X0 + 230, X1 - 230, NB[0], NB[1], fY, cut, fY, No, 'copingLight');
      wallRun(bag, 'white', 'x', X0 + 230, sX1d, SB[0], SB[1], fY, cut, fY, So, 'copingLight');
      wallRun(bag, 'white', 'y', Y0n, Y1n, WB[0], WB[1], fY, cut, fY, Wo, 'copingLight');
      // skirting boards on the room-side faces of the shell walls
      skirtRun(bag, 'y', eY0d, Y1n, EB[0], EB[1], fY, Eo, ['lo']);
      skirtRun(bag, 'x', X0 + 230, X1 - 230, NB[0], NB[1], fY, No, ['lo']);
      skirtRun(bag, 'x', X0 + 230, sX1d, SB[0], SB[1], fY, So, ['hi']);
      skirtRun(bag, 'y', Y0n, Y1n, WB[0], WB[1], fY, Wo, ['hi']);

      // Render any custom grills or railings in the dollhouse floor group
      for (const face of ['E', 'N', 'S', 'W']) {
        const band = face === 'E' ? EB : face === 'N' ? NB : face === 'S' ? SB : WB;
        for (const o of fd.sch[face]) {
          if (o.type === 'grill' || o.type === 'railing') {
            glazing(bag, Object.assign({ face, band, floorY: fY }, o));
          }
        }
      }

      // interior walls (+ skirting on both faces, broken at door openings)
      for (const w of IW[fi]) {
        const ops = w.ops.map(o => ({ c: o.c, w: o.w, sill: o.sill !== undefined ? o.sill : 0, h: o.h !== undefined ? o.h : (o.glass ? 3000 : 2100) }));
        wallRun(bag, 'white2', w.dir, w.a[0], w.a[1], w.b[0], w.b[1], fY, cut, fY, ops, 'copingLight');
        skirtRun(bag, w.dir, w.a[0], w.a[1], w.b[0], w.b[1], fY, ops, ['lo', 'hi']);
      }

      // room tints
      for (const r of ROOMS[fi]) {
        if (r.name === 'LIFT' || r.name === 'PORTICO' || r.name.includes('TERRACE') || r.name.includes('BALCONY')) continue;
        const inset = 45;
        if (fi === 2 && r.name === 'STAIRCASE') {
          // On the second floor, the stairwell is a void from x = 230 to 4630, so only tint the walkway part (x = 4630 to 4920)
          pb(bag, TYPE[r.type], 4630 + inset, r.x1 - inset, r.y0 + inset, r.y1 - inset, fY + 0.004, fY + 0.012);
        } else {
          pb(bag, TYPE[r.type], r.x0 + inset, r.x1 - inset, r.y0 + inset, r.y1 - inset, fY + 0.004, fY + 0.012);
        }
      }

      /* ---- recessed ceiling downlights (~one per 4-6 m²) ---- */
      const ceilY = (fi === 2) ? L.roof - 0.06 : cut;   // SF ceiling = terrace slab soffit
      for (const r of ROOMS[fi]) {
        // balconies/portico are open air; stairwells have voids above; lift has its own shaft
        if (r.type === 'out' || r.name === 'LIFT' || r.name === 'STAIRCASE') continue;
        const zx0 = r.x0, zx1 = r.x1, zy0 = r.y0;
        let zy1 = r.y1;
        if (fi === 1 && r.name === 'HALL') zy1 = 6000;  // double-height void above y > 6000
        const w = (zx1 - zx0) / 1000, d = (zy1 - zy0) / 1000, area = w * d;
        let nx, ny;
        if (r.type === 'living') { nx = w >= 5 ? 3 : 2; ny = d >= 5 ? 3 : (d >= 2.4 ? 2 : 1); }
        else if (r.type === 'bed' || r.type === 'kitchen' || r.type === 'office') {
          nx = w >= 2.4 ? 2 : 1; ny = d >= 2.4 ? 2 : 1;
        } else if (r.type === 'bath' || r.type === 'walk' || r.type === 'utility') {
          nx = (area > 3.6 && w >= d) ? 2 : 1; ny = (area > 3.6 && d > w) ? 2 : 1;
        } else if (r.type === 'pooja') { nx = 1; ny = 1; }
        else { nx = Math.max(1, Math.round(w / 2.1)); ny = Math.max(1, Math.round(d / 2.1)); } // circ: ~2m grid
        while (nx * ny > 6) { if (nx > ny) nx--; else ny--; }
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
          let lx = zx0 + ((i + 0.5) * (zx1 - zx0)) / nx;
          let ly = zy0 + ((j + 0.5) * (zy1 - zy0)) / ny;
          if (fi === 1 && r.name === 'POOJA') { lx = 11350; ly = 7800; }  // clear of hanging bell
          downlight(bag, lx, ly, ceilY, fi);
        }
      }

      /* ---- curtains on living / bed / office windows ---- */
      for (const cs of CURT[fi]) curtains(bag, cs.f, cs.c, cs.w, cs.sill, cs.h, fY, cs.m);

      /* ---- per-floor specials & furniture ---- */
      if (fi === 0) {
        // This storey only (0 → cut). Full multi-storey tower lives on exterior.
        liftTower(bag, cut, [L.porticoFl], 0);
        columnsEast(bag, cut, 0);
        // furniture
        // master bed (head South, cupboards along entire West wall, window integrated)
        pb(bag, 'rug', 1400, 4400, 200, 2600, fY + 0.012, fY + 0.018); // master bedroom rug
        Fur.bed(bag, 2000, 3800, 230, 2230, fY, 'S');
        Fur.side(bag, 1500, 1900, 230, 730, fY); Fur.side(bag, 3900, 4300, 230, 730, fY);
        Fur.vastuWardrobe(bag, 230, 830, 230, 3663, fY, 2960, 1200, 1.10);
        // bed02 (head South, cupboards along entire West wall, window integrated)
        pb(bag, 'rug', 900, 3700, 5400, 7800, fY + 0.012, fY + 0.018);
        Fur.bed(bag, 1400, 3200, 5460, 7460, fY, 'S');
        Fur.side(bag, 900, 1300, 5460, 5960, fY); Fur.side(bag, 3300, 3700, 5460, 5960, fY);
        Fur.vastuWardrobe(bag, 230, 830, 5460, 8640, fY, 7000, 1200, 1.10);
        // Hall (Living room) furniture layout
        pb(bag, 'rug', 5400, 8800, 5800, 8400, fY + 0.012, fY + 0.018); // living rug under L-sofa set
        Fur.sofa(bag, 4920, 5620, 6200, 8640, fY, 'W', false, true);             // L-sofa long side on West wall
        Fur.sofa(bag, 5620, 7420, 7940, 8640, fY, 'N', true, false);             // L-sofa short side on North wall
        Fur.chair(bag, 6000, 5800, fY, 'N');                        // side sofa chair 1 on South facing North
        Fur.chair(bag, 7000, 5800, fY, 'N');                        // side sofa chair 2 on South facing North
        Fur.table(bag, 5900, 7100, 6600, 7400, fY, 0.42);           // centered coffee table
        Fur.tv(bag, 'y', 9320, 6300, 7700, fY);                     // re-centered TV

        // --- Main entry vignette (north door c=8650) ---
        // Doormat + runner
        pb(bag, 'charDark', 8000, 9300, 8400, 8620, fY + 0.012, fY + 0.02);
        pb(bag, 'rug', 8050, 9250, 8420, 8600, fY + 0.018, fY + 0.024);
        // Console east of door, against north wall
        Fur.console(bag, 9200, 10400, 8200, 8550, fY);
        // Mirror above console
        Fur.mirror(bag, 9400, 10200, 8560, 8585, fY);
        // Shoe cabinet west of door
        pb(bag, 'woodD', 7200, 7900, 8250, 8580, fY, fY + 0.55);
        pb(bag, 'woodF', 7190, 7910, 8240, 8590, fY + 0.55, fY + 0.58);
        pb(bag, 'woodD', 7220, 7880, 8240, 8255, fY + 0.08, fY + 0.50);
        pb(bag, 'brass', 7500, 7600, 8235, 8242, fY + 0.28, fY + 0.30);
        // Entry planter + wall sconce pair inside
        Fur.planter(bag, 7800, 8300, fY, 0.7);
        Fur.planter(bag, 9500, 8300, fY, 0.7);
        pb(bag, 'charDark', 8100, 8200, 8620, 8640, fY + 1.65, fY + 2.00);
        pb(bag, 'steel', 8110, 8190, 8610, 8625, fY + 1.70, fY + 1.95);
        pb(bag, 'lamp', 8115, 8185, 8600, 8615, fY + 1.74, fY + 1.90);
        pb(bag, 'charDark', 9100, 9200, 8620, 8640, fY + 1.65, fY + 2.00);
        pb(bag, 'steel', 9110, 9190, 8610, 8625, fY + 1.70, fY + 1.95);
        pb(bag, 'lamp', 9115, 9185, 8600, 8615, fY + 1.74, fY + 1.90);
        // Crockery Unit on the Dining West Wall (2350..3650)
        pb(bag, 'woodD', 4920, 5320, 2350, 3650, fY, fY + 0.85);
        pb(bag, 'woodF', 4910, 5330, 2340, 3660, fY + 0.85, fY + 0.89);
        pb(bag, 'woodD', 4920, 5240, 2350, 3650, fY + 1.40, fY + 2.10);
        pb(bag, 'glass', 5242, 5260, 2350, 3650, fY + 1.40, fY + 2.10); // pane held proud of body (avoid coplanar z-fight)
        pb(bag, 'woodF', 4930, 5230, 2360, 3640, fY + 1.63, fY + 1.65);
        pb(bag, 'woodF', 4930, 5230, 2360, 3640, fY + 1.86, fY + 1.88);
        pb(bag, 'rug', 6200, 8000, 2900, 4500, fY + 0.012, fY + 0.018); // dining rug
        Fur.table(bag, 6500, 7700, 3300, 4100, fY, 0.74);           // dining (small 4-seater table)
        Fur.chair(bag, 6700, 3050, fY, 'N'); Fur.chair(bag, 7500, 3050, fY, 'N'); // south chairs
        Fur.chair(bag, 6700, 4350, fY, 'S'); Fur.chair(bag, 7500, 4350, fY, 'S'); // north chairs
        // Pooja unit (kitchen NE) — full cupboard + open niche with lamp + small murti shelf
        pb(bag, 'woodD', 11620, 12420, 3427, 4027, fY, fY + 2.36);
        pb(bag, 'woodF', 11610, 12430, 3415, 4035, fY + 2.36, fY + 2.42);
        // Open shrine niche on east face
        pb(bag, 'accentWarm', 12390, 12410, 3550, 3900, fY + 0.90, fY + 1.85);
        pb(bag, 'lamp', 12385, 12395, 3600, 3850, fY + 1.10, fY + 1.65);
        pb(bag, 'woodF', 12350, 12400, 3580, 3880, fY + 0.85, fY + 0.92);
        Fur.murtiGanesha(bag, 12370, 3720, fY + 0.92, 0.55);
        Fur.kuthuVilakku(bag, 12340, 3600, fY + 0.92, 0.45);
        // doors either side of niche
        pb(bag, 'woodD', 11640, 12340, 3435, 3485, fY + 0.08, fY + 2.28);
        pb(bag, 'woodD', 11640, 12340, 3970, 4015, fY + 0.08, fY + 2.28);
        pb(bag, 'brass', 12340, 12350, 3650, 3680, fY + 1.15, fY + 1.45);
        pb(bag, 'brass', 12340, 12350, 3780, 3810, fY + 1.15, fY + 1.45);
        pb(bag, 'brass', 11610, 11620, 3657, 3797, fY + 0.60, fY + 0.80);
        
        // East counter (runs from South wall to Pooja unit with a small gap)
        Fur.counterX(bag, 11820, 12408, 230, 3327, fY);
        Fur.sink(bag, 12114, 2700, fY);
        Fur.hob(bag, 12114, 1100, fY);
        
        // West & South counters (L-shaped, joining with East counter at the South wall)
        Fur.counterX(bag, 9499, 10087, 830, 2230, fY);
        Fur.counterX(bag, 9499, 12408, 242, 830, fY);
        
        // Refrigerator on West wall (facing East)
        Fur.fridge(bag, 9487, 10237, 2250, 3000, fY);
        pb(bag, 'chrome', 10237, 10252, 2600, 2630, fY + 0.50, fY + 1.20);

        // West wall cupboards (extended southwards to the south wall)
        Fur.wallCabinet(bag, 9487, 9837, 230, 2230, fY);                               // upper wall cabinets above west counter

        // Wall cabinets above east counter (avoiding range hood and sink window)
        Fur.wallCabinet(bag, 11820, 12408, 230, 800, fY);
        Fur.wallCabinet(bag, 11820, 12408, 1400, 2050, fY);
        Fur.rangeHood(bag, 12114, 1100, fY);
        // Office — rug, stone desk, client seating, monitor, lamp, shelves
        pb(bag, 'rug', 9900, 12100, 4600, 7200, fY + 0.012, fY + 0.018);
        Fur.table(bag, 10150, 11750, 5200, 6100, fY, 0.74, 'counterTop');
        // Desk pedestal drawers (west & east under desk)
        pb(bag, 'woodD', 10180, 10580, 5240, 6060, fY + 0.05, fY + 0.68);
        pb(bag, 'woodD', 11320, 11720, 5240, 6060, fY + 0.05, fY + 0.68);
        for (const hx of [10380, 11520]) {
          for (const hz of [0.22, 0.42, 0.58]) {
            pb(bag, 'brass', hx - 35, hx + 35, 5235, 5240, fY + hz, fY + hz + 0.015);
          }
        }
        // Monitor + stand on desk
        pb(bag, 'charDark', 10780, 11120, 5750, 5820, fY + 0.74, fY + 0.78);
        pb(bag, 'steel', 10920, 10980, 5760, 5810, fY + 0.78, fY + 0.92);
        pb(bag, 'charDark', 10740, 11160, 5740, 5780, fY + 0.92, fY + 1.28);
        pb(bag, 'tv', 10755, 11145, 5736, 5744, fY + 0.95, fY + 1.25);
        pb(bag, 'chrome', 10930, 10970, 5755, 5805, fY + 0.74, fY + 0.76); // stand base
        // Desk lamp (warm)
        bag.cyl('brass', 11.55, fY + 0.78, -5.35, 0.03, 0.04);
        bag.cyl('brass', 11.55, fY + 0.95, -5.35, 0.008, 0.30);
        bag.cyl('brass', 11.55, fY + 1.12, -5.50, 0.007, 0.28, 0, 0, Math.PI / 2);
        bag.cyl('curtain2', 11.55, fY + 1.08, -5.62, 0.07, 0.10);
        bag.cyl('lamp', 11.55, fY + 1.05, -5.62, 0.04, 0.04);
        // Keyboard tray + notepad
        pb(bag, 'dark', 10750, 11150, 5550, 5720, fY + 0.745, fY + 0.755);
        pb(bag, 'whiteG', 11200, 11500, 5400, 5600, fY + 0.745, fY + 0.752);
        Fur.executiveChair(bag, 10950, 4700, fY, 'N');
        Fur.chair(bag, 10450, 6700, fY, 'S'); Fur.chair(bag, 11450, 6700, fY, 'S');
        Fur.shelves(bag, 9487, 9887, 4500, 6500, fY);
        // Low client coffee table between visitor chairs
        Fur.table(bag, 10600, 11300, 6400, 6800, fY, 0.40);

        Fur.basin(bag, 4920, 5820, 1716, 2216, fY); Fur.mirror(bag, 4920, 5820, 2204, 2216, fY); Fur.wc(bag, 5370, 515, fY, 'N');
        Fur.shower(bag, 5820, 5850, 230, 1130, fY); Fur.showerHead(bag, 6301, 230, fY, 'N');
        Fur.wc(bag, 1600, 5060, fY, 'S'); Fur.shower(bag, 1130, 1160, 4445, 5345, fY); Fur.showerHead(bag, 680, 5345, fY, 'S');
        Fur.basin(bag, 2400, 3100, 4945, 5345, fY, 'N'); Fur.mirror(bag, 2400, 3100, 5333, 5345, fY);                 // handwash counter
      }

      if (fi === 1) {
        // Service-band openings for dollhouse (also on exterior)
        glazing(bag, { face: 'S', band: [-762, -646], floorY: fY, c: 6527, w: 3215, sill: 900, h: 1400, type: 'grill' });
        glazing(bag, { face: 'S', band: [-762, -646], floorY: fY, c: 8810, w: 600, sill: 1700, h: 600, type: 'win', panes: 1 });
        glazing(bag, { face: 'S', band: [-762, -646], floorY: fY, c: 11205, w: 2430, sill: 900, h: 1400, type: 'grill' });
        glazing(bag, { face: 'W', band: [4805, 4920], floorY: fY, c: -207, w: 800, sill: 0, h: 2400, type: 'grill', door: true });
        // This storey only (FF slab → cut). Not the full tower from ground.
        liftTower(bag, cut, [fY], fY);
        columnsEast(bag, cut, fY);

        // Internal stair FF→mid: flight A + landing only (flight B owned by SF)
        stairRailing(bag, 'x', 7496, 4630, -1, 330, 10, fY, RISE_I, 0.95, RAIL_IN);
        flight(bag, 'concrete', 'x', 6496, 7496, 4630, -1, 330, 10, fY, RISE_I, STAIR_IN);
        stairLanding(bag, 230, 1330, 6496, 8641, landI(fY), 'woodF');
        railing(bag, 'y', 1330, 7496, 7641, landI(fY), 0.95);
        // furniture
        // --- Master Bedroom 01 (head South, vastuWardrobe on West wall) ---
        pb(bag, 'rug', 1100, 4000, 200, 2500, fY + 0.012, fY + 0.018);
        Fur.bed(bag, 1600, 3400, 232, 2132, fY, 'S');               // king bed, headboard against South wall
        Fur.side(bag, 1100, 1500, 232, 732, fY);                     // west side table (flanking bed)
        Fur.side(bag, 3500, 3900, 232, 732, fY);                     // east side table (flanking bed)
        Fur.vastuWardrobe(bag, 230, 830, 232, 4432, fY, 3730, 1200, 1.10); // west wall wardrobe around window
        // --- Walk-in ---
        Fur.shelves(bag, 2816, 4805, 6082, 6382, fY);                // north wall shelves
        Fur.shelves(bag, 4501, 4805, 4432, 6082, fY);                // east wall shelves
        // --- Master Bath 01 ---
        Fur.shower(bag, 1130, 1160, 5127, 6381, fY); Fur.showerHead(bag, 680, 6381, fY, 'S');                 // N-S glass partition (shower area west)
        Fur.wc(bag, 1650, 6096, fY, 'S');                            // WC middle, facing south
        Fur.basin(bag, 2100, 2705, 5881, 6381, fY); Fur.mirror(bag, 2100, 2705, 6369, 6381, fY);                  // vanity basin near northeast corner
        // --- Master bedroom door privacy ---
        // Straight wing-wall just north of the door (y 3350–4350 on wall x≈4920).
        // One job: break hall → bedroom sightline. Door still approached from the east.
        Fur.privacyScreen(bag, 4920, 3350, 4350, fY);

        // --- Hall lounge (east of the wing, south of stair / TV) ---
        Fur.tvFeatureWall(bag, 6020, 8241, 8622, 8642, fY, 3.353, true);
        Fur.sofa(bag, 6400, 8200, 4700, 5600, fY, 'S');              // faces TV
        Fur.sofa(bag, 6000, 6800, 5900, 6900, fY, 'W');              // side chair
        Fur.sofa(bag, 8500, 9300, 5900, 6900, fY, 'E');              // side chair
        bag.cyl('woodD', 7450 / 1000, fY + 0.18, -6200 / 1000, 0.07, 0.36);
        bag.cyl('chrome', 7450 / 1000, fY + 0.18, -6200 / 1000, 0.08, 0.04); // tray base ring
        bag.cyl('glass', 7450 / 1000, fY + 0.38, -6200 / 1000, 0.48, 0.028);
        pb(bag, 'rug', 6100, 9100, 4850, 7100, fY + 0.012, fY + 0.018);
        // Soft rug border (darker band) for definition
        pb(bag, 'fabric2', 6100, 9100, 4850, 4920, fY + 0.016, fY + 0.019);
        pb(bag, 'fabric2', 6100, 9100, 7030, 7100, fY + 0.016, fY + 0.019);

        // --- Dining (south of door) ---
        pb(bag, 'rug', 6000, 8600, 1750, 3800, fY + 0.012, fY + 0.018);
        Fur.table(bag, 6400, 8200, 2200, 3300, fY, 0.74);
        for (const dx of [6850, 7750]) { Fur.chair(bag, dx, 1850, fY, 'N'); Fur.chair(bag, dx, 3650, fY, 'S'); }
        Fur.chair(bag, 6000, 2750, fY, 'E'); Fur.chair(bag, 8600, 2750, fY, 'W');
        Fur.crockeryUnit(bag, 4920, 5370, 1530, 3180, fY);
        // --- Kitchen cupboards (full carcasses + real door thickness) ---
        // Layout: L-shape base (south + east) + north run to fridge + SW pantry.
        // East wall-mounted uppers stay omitted (by design); south/north uppers full.

        // Base counters
        Fur.counterX(bag, 11262, 11800, 1539, 2139, fY);   // south run
        Fur.counterX(bag, 11800, 12408, 1539, 4933, fY);   // east run
        Fur.counterX(bag, 10350, 11800, 4345, 4945, fY);   // north run (to fridge)

        // East base doors (face west) — continuous with drawers under hob
        Fur.kitBaseDoors(bag, 'W', 11800, 1550, 2120, fY, null);           // south of hob
        Fur.kitBaseDrawers(bag, 'W', 11800, 2140, 2660, fY);               // under hob
        Fur.kitBaseDoors(bag, 'W', 11800, 2680, 3320, fY, null);           // hob → sink
        Fur.kitBaseDoors(bag, 'W', 11800, 3340, 3860, fY, null);           // under sink
        Fur.kitBaseDoors(bag, 'W', 11800, 3880, 4920, fY, null);           // north of sink

        // South base doors (face north)
        Fur.kitBaseDoors(bag, 'N', 2139, 11280, 11770, fY, null);

        // North base doors (face south)
        Fur.kitBaseDoors(bag, 'S', 4345, 10370, 11770, fY, null);

        // Hob / sink / hood
        Fur.hob(bag, 12110, 2400, fY);
        Fur.sink(bag, 12110, 3600, fY);
        Fur.rangeHood(bag, 12110, 2400, fY);

        // South wall uppers — full carcass on the wall band, doors face into kitchen
        Fur.kitWallRun(bag, 11262, 12000, 1539, 1850, fY, 'N', 3);

        // North wall uppers — above north counter, doors face south into kitchen
        Fur.kitWallRun(bag, 10350, 11780, 4650, 4945, fY, 'S', 4);

        // Fridge (NW) — doors/handles on east face (built into Fur.fridge)
        Fur.fridge(bag, 9486, 10350, 4245, 4945, fY);

        // Tall pantry (SW) — full doors, not paper strips
        Fur.kitPantry(bag, 9370, 10070, 1527, 2297, fY, 'E');
        // --- Breakfast Counter (same as original, extended N–S only) ---
        // Was y 2300–2800; now y 2300–3400. No other changes.
        pb(bag, 'counterTop', 9071, 9686, 2300, 3400, fY + 0.86, fY + 0.90);
        pb(bag, 'woodD', 9350, 9400, 2300, 3400, fY, fY + 0.86);
        // --- Foyer ---
        pb(bag, 'rug', 10950, 12350, 5080, 5650, fY + 0.012, fY + 0.018);
        Fur.console(bag, 11000, 12300, 5160, 5560, fY);             // foyer console table
        Fur.mirror(bag, 11200, 12100, 5540, 5565, fY);
        Fur.planter(bag, 11100, 5300, fY, 0.65);
        Fur.planter(bag, 12200, 5300, fY, 0.65);
        // --- Telugu Hindu pooja (FF) — open from hall door (west) ---
        // Room x 10893–12418, y 7417–8642. Mandir on EAST only; no west wall.
        // Deities: Ganesha (S), Venkateswara (centre), Lakshmi (N) — facing west.
        (function teluguPooja() {
          const midY = 8030;
          const mx0 = 12090, mx1 = 12410;
          const my0 = 7560, my1 = 8500;
          const peetaTop = fY + 0.255;

          // Sacred floor: warm pooja tile + deep red carpet aisle to mandir
          pb(bag, 'tPooja', 10940, 12370, 7460, 8600, fY + 0.004, fY + 0.014);
          pb(bag, 'peetaRed', 11020, 12040, 7880, 8180, fY + 0.014, fY + 0.022);
          // Simple rangoli ring at door threshold (west)
          bag.cyl('lotusPink', 11080 / 1000, fY + 0.018, -midY / 1000, 0.22, 0.008);
          bag.cyl('saffron', 11080 / 1000, fY + 0.02, -midY / 1000, 0.14, 0.006);
          bag.cyl('vermilion', 11080 / 1000, fY + 0.022, -midY / 1000, 0.06, 0.005);

          // 1) Wooden peeta (two steps) + maroon cloth + brass edge
          pb(bag, 'woodD', mx0 - 20, mx1, my0 - 10, my1 + 10, fY, fY + 0.12);
          pb(bag, 'woodF', mx0 - 5, mx1, my0 + 5, my1 - 5, fY + 0.12, fY + 0.24);
          pb(bag, 'brass', mx0 - 8, mx1 - 10, my0 + 15, my1 - 15, fY + 0.235, fY + 0.255);
          pb(bag, 'peetaRed', mx0 + 10, mx1 - 20, my0 + 40, my1 - 40, fY + 0.252, fY + 0.26);
          pb(bag, 'brass', mx0 + 15, mx1 - 25, my0 + 45, my0 + 55, fY + 0.258, fY + 0.265);
          pb(bag, 'brass', mx0 + 15, mx1 - 25, my1 - 55, my1 - 45, fY + 0.258, fY + 0.265);
          // Drawer fronts under peeta
          pb(bag, 'woodD', mx0 - 2, mx0 + 12, my0 + 40, midY - 30, fY + 0.02, fY + 0.22);
          pb(bag, 'woodD', mx0 - 2, mx0 + 12, midY + 30, my1 - 40, fY + 0.02, fY + 0.22);
          pb(bag, 'brass', mx0 - 5, mx0 - 2, midY - 70, midY - 40, fY + 0.10, fY + 0.12);
          pb(bag, 'brass', mx0 - 5, mx0 - 2, midY + 40, midY + 70, fY + 0.10, fY + 0.12);

          // 2) Open wooden mandir — east backboard + thin sides (face open to door)
          pb(bag, 'woodD', mx1 - 28, mx1, my0 + 10, my1 - 10, fY + 0.24, fY + 1.95);
          pb(bag, 'accentWarm', mx1 - 36, mx1 - 26, my0 + 50, my1 - 50, fY + 0.45, fY + 1.70);
          pb(bag, 'lamp', mx1 - 42, mx1 - 34, my0 + 120, my1 - 120, fY + 0.65, fY + 1.55);
          // Soft uplights under peeta shelf
          pb(bag, 'lamp', mx0 + 40, mx1 - 40, my0 + 60, my0 + 90, peetaTop + 0.01, peetaTop + 0.03);
          pb(bag, 'lamp', mx0 + 40, mx1 - 40, my1 - 90, my1 - 60, peetaTop + 0.01, peetaTop + 0.03);
          pb(bag, 'woodD', mx0 + 20, mx1 - 28, my0 + 8, my0 + 38, fY + 0.24, fY + 1.85);
          pb(bag, 'woodD', mx0 + 20, mx1 - 28, my1 - 38, my1 - 8, fY + 0.24, fY + 1.85);
          // Torana pillars + lintel + hanging flower garland
          bag.cyl('brass', (mx0 + 45) / 1000, fY + 1.05, -(my0 + 50) / 1000, 0.018, 1.35);
          bag.cyl('brass', (mx0 + 45) / 1000, fY + 1.05, -(my1 - 50) / 1000, 0.018, 1.35);
          pb(bag, 'woodF', mx0 + 15, mx1 - 10, my0 + 20, my1 - 20, fY + 1.72, fY + 1.82);
          // Mango-leaf torana garland (stylised blobs)
          for (let gy = my0 + 80; gy < my1 - 80; gy += 55) {
            bag.sph('green2', (mx0 + 55) / 1000, fY + 1.68, -gy / 1000, 0.022);
            bag.sph('leafLight', (mx0 + 70) / 1000, fY + 1.64, -(gy + 20) / 1000, 0.016);
            if (gy % 110 < 55) bag.sph('lotusPink', (mx0 + 80) / 1000, fY + 1.66, -gy / 1000, 0.012);
          }
          // Stepped gopuram crown + kalasha
          pb(bag, 'woodD', mx0 + 30, mx1, my0 + 30, my1 - 30, fY + 1.82, fY + 1.92);
          pb(bag, 'woodF', mx0 + 80, mx1 - 20, my0 + 80, my1 - 80, fY + 1.92, fY + 2.00);
          pb(bag, 'brass', mx0 + 100, mx1 - 40, my0 + 100, my1 - 100, fY + 1.98, fY + 2.02);
          bag.cyl('brass', 12250 / 1000, fY + 2.08, -midY / 1000, 0.035, 0.07);
          bag.sph('brass', 12250 / 1000, fY + 2.14, -midY / 1000, 0.028);
          bag.cone('brass', 12250 / 1000, fY + 2.22, -midY / 1000, 0.018, 0.06);

          // 3) Hindu murtis on peeta — face west toward door
          Fur.murtiGanesha(bag, 12270, midY - 250, peetaTop, 0.92);
          Fur.murtiVenkateswara(bag, 12280, midY, peetaTop, 1.05);
          Fur.murtiLakshmi(bag, 12270, midY + 250, peetaTop, 0.92);

          // 4) Pair of kuthu vilakku + floor diyas
          Fur.kuthuVilakku(bag, 12130, midY - 280, peetaTop, 0.95);
          Fur.kuthuVilakku(bag, 12130, midY + 280, peetaTop, 0.95);
          Fur.kuthuVilakku(bag, 11650, midY - 320, fY, 0.75);
          Fur.kuthuVilakku(bag, 11650, midY + 320, fY, 0.75);
          // Small diya row on peeta front
          for (let i = -2; i <= 2; i++) {
            bag.cyl('brass', 12100 / 1000, peetaTop + 0.015, -(midY + i * 70) / 1000, 0.018, 0.012);
            bag.cone('lamp', 12100 / 1000, peetaTop + 0.04, -(midY + i * 70) / 1000, 0.008, 0.022);
          }

          // 5) Offering thali + second thali + camphor plate
          Fur.poojaThali(bag, 12140, midY, peetaTop + 0.01, 1.0);
          Fur.poojaThali(bag, 12020, midY - 180, peetaTop + 0.01, 0.75);

          // Small brass kalasha with mango leaves + coconut (beside Ganesha)
          bag.cyl('brass', 12200 / 1000, peetaTop + 0.04, -(midY - 120) / 1000, 0.028, 0.06);
          bag.sph('brass', 12200 / 1000, peetaTop + 0.08, -(midY - 120) / 1000, 0.030);
          bag.sph('bark', 12200 / 1000, peetaTop + 0.12, -(midY - 120) / 1000, 0.018);
          bag.sph('green2', 12195 / 1000, peetaTop + 0.14, -(midY - 125) / 1000, 0.012);
          bag.sph('green', 12205 / 1000, peetaTop + 0.145, -(midY - 115) / 1000, 0.011);

          // Incense stand + camphor
          bag.cyl('brass', 12150 / 1000, peetaTop + 0.03, -(midY + 100) / 1000, 0.015, 0.04);
          bag.cyl('bark', 12150 / 1000, peetaTop + 0.12, -(midY + 100) / 1000, 0.003, 0.14);
          bag.cyl('bark', 12155 / 1000, peetaTop + 0.12, -(midY + 105) / 1000, 0.003, 0.14);
          bag.cyl('brass', 12180 / 1000, peetaTop + 0.02, -(midY + 180) / 1000, 0.022, 0.012);
          bag.cone('lamp', 12180 / 1000, peetaTop + 0.045, -(midY + 180) / 1000, 0.01, 0.025);

          // 6) Framed deity photos on south wall shelf
          pb(bag, 'woodF', 11180, 11800, 7440, 7488, fY + 1.32, fY + 1.38);
          pb(bag, 'brass', 11170, 11810, 7435, 7492, fY + 1.30, fY + 1.325);
          Fur.poojaPhotoFrame(bag, 11200, 11350, 7448, 7480, fY + 1.40, fY + 1.68);
          Fur.poojaPhotoFrame(bag, 11380, 11530, 7448, 7480, fY + 1.40, fY + 1.68);
          Fur.poojaPhotoFrame(bag, 11560, 11740, 7448, 7480, fY + 1.40, fY + 1.68);

          // 7) Ghanta (bell) cluster at door lintel
          bag.cyl('brass', 11020 / 1000, fY + 2.45, -midY / 1000, 0.004, 0.40);
          bag.cyl('brass', 11020 / 1000, fY + 2.20, -midY / 1000, 0.045, 0.09);
          bag.cyl('brass', 11020 / 1000, fY + 2.12, -midY / 1000, 0.012, 0.05);
          bag.sph('brass', 11020 / 1000, fY + 2.06, -midY / 1000, 0.018);
          bag.cyl('brass', 11020 / 1000, fY + 2.42, -(midY - 80) / 1000, 0.003, 0.28);
          bag.sph('brass', 11020 / 1000, fY + 2.22, -(midY - 80) / 1000, 0.014);
          bag.cyl('brass', 11020 / 1000, fY + 2.42, -(midY + 80) / 1000, 0.003, 0.28);
          bag.sph('brass', 11020 / 1000, fY + 2.22, -(midY + 80) / 1000, 0.014);
        })();
        // --- Wet Kitchen (south band off the kitchen: stove on the East wall
        // beside the SE grill door, sink + dishwasher on the West divider) ---
        // 1. West counter against the divider (full band depth)
        Fur.counterX(bag, 9486, 10086, -520, 1411, fY);
        Fur.sink(bag, 9786, 1020, fY, 'W'); // sink on the North end (window light from the south grill)

        // Dishwasher on the South end below the West counter (facing East)
        pb(bag, 'charDark', 10066, 10086, -440, 100, fY, fY + 0.04); // Dishwasher kickplate (recessed)
        pb(bag, 'steel', 10086, 10094, -440, 100, fY + 0.04, fY + 0.82); // Dishwasher front panel
        pb(bag, 'charDark', 10086, 10094, -440, 100, fY + 0.72, fY + 0.82); // Dishwasher control panel
        pb(bag, 'tv', 10093, 10095, -210, -130, fY + 0.74, fY + 0.80); // Control screen
        pb(bag, 'brass', 10095, 10099, -350, -30, fY + 0.66, fY + 0.69); // Horizontal pull bar handle

        // Sink base cabinet doors below the counter North of the dishwasher
        pb(bag, 'charDark', 10066, 10086, 160, 1400, fY, fY + 0.04); // Cabinet kickplate (recessed)
        pb(bag, 'woodD', 10086, 10094, 170, 770, fY + 0.04, fY + 0.82); // South cabinet door
        pb(bag, 'woodD', 10086, 10094, 790, 1390, fY + 0.04, fY + 0.82); // North cabinet door
        bag.cyl('brass', 10098 / 1000, fY + 0.46, -745 / 1000, 0.006, 0.08); // Handles
        bag.cyl('brass', 10098 / 1000, fY + 0.46, -815 / 1000, 0.006, 0.08);

        // 2. East counter with the stove, North of the SE grill door (door spans y -300..600)
        Fur.counterX(bag, 11820, 12409, 620, 1411, fY);
        Fur.hob(bag, 12114, 1015, fY);

        // East Wall Upper Cupboards (over the stove counter, Y = 620..1411)
        pb(bag, 'woodD', 12071, 12421, 620, 645, fY + 1.40, fY + 2.40); // South vertical panel
        pb(bag, 'woodD', 12071, 12421, 1386, 1411, fY + 1.40, fY + 2.40); // North vertical panel
        pb(bag, 'woodF', 12071, 12421, 620, 1411, fY + 2.36, fY + 2.40); // Top panel
        pb(bag, 'woodF', 12071, 12421, 620, 1411, fY + 1.40, fY + 1.44); // Bottom panel
        pb(bag, 'woodF', 12071, 12390, 645, 1386, fY + 1.88, fY + 1.92); // Shelf
        pb(bag, 'woodD', 12071, 12082, 655, 1010, fY + 1.44, fY + 2.36); // South door
        pb(bag, 'woodD', 12071, 12082, 1030, 1385, fY + 1.44, fY + 2.36); // North door
        bag.cyl('brass', 12067 / 1000, fY + 1.87, -990 / 1000, 0.006, 0.08); // Handles
        bag.cyl('brass', 12067 / 1000, fY + 1.87, -1050 / 1000, 0.006, 0.08);

        // --- Common Bath (relocated into the south band, east of the utility) ---
        Fur.wc(bag, 8810, -361, fY, 'N');                             // WC against the outer south wall, facing north

        // Closed Door (centered at Y = 1000, width = 700, on the West wall X = 8135..8250)
        const dbY0 = 650, dbY1 = 1350;
        const dbX0 = 8135, dbX1 = 8250;
        const dbMidX = (dbX0 + dbX1) / 2;
        // Frame
        pb(bag, 'frame', dbX0 - 5, dbX1 + 5, dbY0, dbY0 + 40, fY, fY + 2.10); // South frame
        pb(bag, 'frame', dbX0 - 5, dbX1 + 5, dbY1 - 40, dbY1, fY, fY + 2.10); // North frame
        pb(bag, 'frame', dbX0 - 5, dbX1 + 5, dbY0, dbY1, fY + 2.06, fY + 2.10); // Top frame
        // Door panel (wood)
        pb(bag, 'walnut', dbMidX - 20, dbMidX + 20, dbY0 + 40, dbY1 - 40, fY + 0.01, fY + 2.06);
        // recessed-look panel reveals on both faces: darker strips ~10mm
        // proud (buried 2mm into the slab) framing two stacked rectangles
        for (const fx of [[dbMidX - 32, dbMidX - 18], [dbMidX + 18, dbMidX + 32]]) {
          for (const rr of [[fY + 0.12, fY + 0.98], [fY + 1.12, fY + 1.94]]) {
            pb(bag, 'woodD', fx[0], fx[1], dbY0 + 100, dbY0 + 140, rr[0], rr[1]);
            pb(bag, 'woodD', fx[0], fx[1], dbY1 - 140, dbY1 - 100, rr[0], rr[1]);
            pb(bag, 'woodD', fx[0], fx[1], dbY0 + 100, dbY1 - 100, rr[0], rr[0] + 0.04);
            pb(bag, 'woodD', fx[0], fx[1], dbY0 + 100, dbY1 - 100, rr[1] - 0.04, rr[1]);
          }
        }
        // Brass handles (hinged on North side, handles on South side at Y = 730)
        bag.cyl('brass', (dbMidX + 25) / 1000, fY + 1.00, -730 / 1000, 0.008, 0.12); // Bathroom side (East)
        bag.cyl('brass', (dbMidX - 25) / 1000, fY + 1.00, -730 / 1000, 0.008, 0.12); // Utility side (West)

        // --- Utility (wash band off the dining slider, extended west to the
        // dining|bedroom partition: W/D stack in the NW corner, wash basin on
        // the South wall, SW grill door onto the bedroom south balcony) ---
        // Stacked washing machine + dryer cupboard against the West wall (X = 4920),
        // pushed into the North-West corner, facing East
        // 1. Bottom Washing Machine (facing East, centered at X = 5220, Y = 1113)
        Fur.washer(bag, 5220, 1113, fY, 'E');

        // 2. Middle Continuous Shelf / Folding Counter (extending to laundry storage section)
        pb(bag, 'woodF', 4920, 5540, 291, 1413, fY + 0.88, fY + 0.92);

        // 3. Top Dryer (facing East)
        Fur.washer(bag, 5220, 1113, fY + 0.92, 'E');

        // 4. Cupboard Carcass & Storage
        // South side vertical wood panel enclosing the entire run (thickness 25mm)
        pb(bag, 'woodD', 4920, 5540, 250, 275, fY, fY + 2.40);
        // Top horizontal panel covering the entire run
        pb(bag, 'woodF', 4920, 5540, 250, 1413, fY + 2.36, fY + 2.40);

        // 5. Laundry Cupboard Doors (Dryer Upper Section)
        // Upper cupboard doors (front face, facing East at X = 5530..5540, thickness 10mm)
        pb(bag, 'woodD', 5530, 5540, 823, 1108, fY + 1.84, fY + 2.34); // South door
        pb(bag, 'woodD', 5530, 5540, 1118, 1403, fY + 1.84, fY + 2.34); // North door
        // Small brass handles for upper cupboard doors
        bag.cyl('brass', 5545 / 1000, fY + 2.05, -1093 / 1000, 0.006, 0.08);
        bag.cyl('brass', 5545 / 1000, fY + 2.05, -1133 / 1000, 0.006, 0.08);

        // 6. Extended Storage Cabinet (South side of washer-dryer)
        // Lower storage doors (facing East at X = 5530..5540)
        pb(bag, 'woodD', 5530, 5540, 301, 541, fY + 0.04, fY + 0.88); // South lower door
        pb(bag, 'woodD', 5530, 5540, 551, 791, fY + 0.04, fY + 0.88); // North lower door
        // Lower cabinet door handles
        bag.cyl('brass', 5545 / 1000, fY + 0.46, -526 / 1000, 0.006, 0.08);
        bag.cyl('brass', 5545 / 1000, fY + 0.46, -566 / 1000, 0.006, 0.08);

        // Upper storage doors (facing East at X = 5530..5540)
        pb(bag, 'woodD', 5530, 5540, 301, 541, fY + 1.40, fY + 2.34); // South upper door
        pb(bag, 'woodD', 5530, 5540, 551, 791, fY + 1.40, fY + 2.34); // North upper door
        // Upper cabinet door handles
        bag.cyl('brass', 5545 / 1000, fY + 1.87, -526 / 1000, 0.006, 0.08);
        bag.cyl('brass', 5545 / 1000, fY + 1.87, -566 / 1000, 0.006, 0.08);
        // Intermediate shelf inside the upper storage cabinet
        pb(bag, 'woodF', 4920, 5520, 291, 813, fY + 1.88, fY + 1.92);

        // Wash basin on the outer South wall, under the grilled window (facing North)
        Fur.basin(bag, 7300, 8100, -646, -146, fY, 'S');
        // utility floor drain
        bag.cyl('dark', 7450 / 1000, fY + 0.01, 350 / 1000, 0.035, 0.02);
      }

      if (fi === 2) {
        // This storey only (SF slab → cut). Not the full tower from ground.
        liftTower(bag, cut, [fY], fY);
        columnsEast(bag, cut, fY);
        // Duplex void safety railings overlooking the first floor hall
        railing(bag, 'y', 6020, 6000, 8641, fY, 1.0);
        railing(bag, 'x', 6000, 6020, 8241, fY, 1.0);
        railing(bag, 'y', 8241, 6000, 8641, fY, 1.0);
        Fur.tvFeatureWall(bag, 6020, 8241, 8622, 8642, fY, 3.353, false);

        // Internal stair: flight B FF→SF (from mid landing) + full SF→roof U-stair
        const midFF = landI(L.f1);
        stairLanding(bag, 230, 1330, 6496, 8641, midFF, 'woodF');
        railing(bag, 'y', 1330, 7496, 7641, midFF, 0.95);
        stairRailing(bag, 'x', 7641, 1330, 1, 330, 10, midFF, RISE_I, 0.95, RAIL_IN);
        flight(bag, 'concrete', 'x', 7641, 8641, 1330, 1, 330, 10, midFF, RISE_I, STAIR_IN);
        // tops at L.f1 + 20*RISE_I = L.f2

        // flight A' SF → mid landing toward roof
        flight(bag, 'concrete', 'x', 6496, 7496, 4630, -1, 330, 10, fY, RISE_I, STAIR_IN);
        stairRailing(bag, 'x', 7496, 4630, -1, 330, 10, fY, RISE_I, 0.95, RAIL_IN);
        stairLanding(bag, 230, 1330, 6496, 8641, landI(fY), 'woodF');
        railing(bag, 'y', 1330, 7496, 7641, landI(fY), 0.95);
        // flight B' mid → roof (flush at L.roof)
        flight(bag, 'concrete', 'x', 7641, 8641, 1330, 1, 330, 10, landI(fY), RISE_I, STAIR_IN);
        stairRailing(bag, 'x', 7641, 1330, 1, 330, 10, landI(fY), RISE_I, 0.95, RAIL_IN);
        railing(bag, 'y', 4630, 7496, 7641, fY, 0.95);

        // Mumty arrival pad only (void stays open for climb)
        stairLanding(bag, 4630, 5600, 6496, 8641, L.roof, 'woodF');
        pb(bag, 'terraceF', 4650, 5550, 6520, 8620, L.roof + 0.004, L.roof + 0.016);
        pb(bag, 'charDark', 4700, 5550, 7400, 8200, L.roof + 0.016, L.roof + 0.024);
        // --- Master Bedroom 02 (head South, vastuWardrobe on West wall) ---
        pb(bag, 'rug', 1100, 4000, 200, 2500, fY + 0.012, fY + 0.018);
        Fur.bed(bag, 1600, 3400, 232, 2132, fY, 'S');               // king bed, headboard against South wall
        Fur.side(bag, 1100, 1500, 232, 732, fY);                     // west side table (flanking bed)
        Fur.side(bag, 3500, 3900, 232, 732, fY);                     // east side table (flanking bed)
        Fur.vastuWardrobe(bag, 230, 830, 232, 4432, fY, 3730, 1200, 1.10); // west wall wardrobe around window
        // --- Walk-in ---
        Fur.shelves(bag, 2816, 4805, 6082, 6382, fY);                // north wall shelves
        Fur.shelves(bag, 4501, 4805, 4432, 6082, fY);                // east wall shelves
        // --- Master Bath 02 ---
        Fur.shower(bag, 1130, 1160, 5127, 6381, fY); Fur.showerHead(bag, 680, 6381, fY, 'S');                 // N-S glass partition (shower area west)
        Fur.wc(bag, 1650, 6096, fY, 'S');                            // WC middle, facing south
        Fur.basin(bag, 2100, 2705, 5881, 6381, fY); Fur.mirror(bag, 2100, 2705, 6369, 6381, fY);                  // vanity basin near northeast corner
        // --- Bedroom 03 ---
        pb(bag, 'rug', 8600, 11600, 200, 2200, fY + 0.012, fY + 0.018);
        Fur.bed(bag, 9100, 11000, 232, 1832, fY, 'S');              // bed03
        Fur.side(bag, 8600, 9020, 232, 652, fY); Fur.side(bag, 11100, 11520, 232, 652, fY);
        Fur.vastuWardrobe(bag, 11820, 12420, 232, 4432, fY, 3200, 1200, 1.10); // East wall wardrobe wrapping around window
        Fur.shelves(bag, 5000, 7540, 2850, 3100, fY);                // walk-in 03
        Fur.shelves(bag, 5000, 5300, 1950, 2850, fY);
        Fur.shower(bag, 5820, 5850, 230, 1130, fY); Fur.showerHead(bag, 5370, 230, fY, 'N');                  // West: shower partition
        Fur.wc(bag, 6295, 515, fY, 'N');                              // Middle: WC facing North
        Fur.basin(bag, 6770, 7620, 230, 780, fY, 'S'); Fur.mirror(bag, 6770, 7620, 230, 242, fY);                    // East: vanity counter
        pb(bag, 'rug', 9600, 12200, 5000, 8200, fY + 0.012, fY + 0.018); // family lounge rug
        Fur.sofa(bag, 9900, 12300, 7980, 8580, fY, 'N');             // North sofa facing South
        Fur.sofa(bag, 9900, 12300, 4600, 5200, fY, 'S');             // South sofa facing North
        Fur.sofa(bag, 9100, 9700, 6800, 7500, fY, 'W');              // NW single/double-seater facing East
        Fur.sofa(bag, 9100, 9700, 5700, 6400, fY, 'W');              // SW single/double-seater facing East
        Fur.table(bag, 10300, 11900, 6190, 6990, fY, 0.42);          // Centered coffee table
      }

      const g = bag.build(THREE, materials);
      g.name = 'floor' + fi;
      root.add(g);
      floorsOut.push({
        group: g, floorY: fY, cut,
        rooms: ROOMS[fi].map(r => Object.assign({}, r))
      });
    });

    /* ---------------- view presets ---------------- */
    const views = {
      exterior: { pos: [31.5, 11.2, 1.2], target: [7.5, 3.3, -7.0], autoRotate: true },
      floor0:   { pos: [18.6, 14.4, 4.4],  target: [7.8, L.f0 + 0.3, -4.4] },
      floor1:   { pos: [18.6, 17.8, 4.4],  target: [7.8, L.f1 + 0.3, -4.4] },
      floor2:   { pos: [18.6, 21.1, 4.4],  target: [7.8, L.f2 + 0.3, -4.4] }
    };

    // warm accent at Telugu pooja kuthu-vilakku flames (FF)
    lights.push({ x: 12.130, y: L.f1 + 0.77, z: -7.750, floor: 1, warm: true });
    lights.push({ x: 12.130, y: L.f1 + 0.77, z: -8.310, floor: 1, warm: true });

    /* ---- warm fixtures for walkthrough light pool ----
       Plan mm → world: X = mm/1000, Z = -mm/1000.
       Keep this list sparse and co-located with real lamp geometry so the
       small point-light pool picks intentional accents (not random lawn blobs). */
    function warmFix(xmm, ymm, yM, floor) {
      lights.push({ x: xmm / 1000, y: yM, z: -ymm / 1000, floor: floor, warm: true });
    }
    // North facade — canopy + lamps outside real frames (match geometry above)
    warmFix(8650, 9200, L.f0 + 2.42, 0);
    // GF door flanks (8650±790)
    warmFix(7860, 8870, L.f0 + 1.88, 0);
    warmFix(9440, 8870, L.f0 + 1.88, 0);
    // GF hall / office window flanks (sample)
    warmFix(5900, 8870, L.f0 + 1.88, 0);
    warmFix(7700, 8870, L.f0 + 1.88, 0);
    warmFix(10190, 8870, L.f0 + 1.88, 0);
    warmFix(11810, 8870, L.f0 + 1.88, 0);
    warmFix(8150, 8610, L.f0 + 1.82, 0); // interior vestibule
    warmFix(9150, 8610, L.f0 + 1.82, 0);
    // FF / SF north window flanks (5500±660, 8760±660)
    for (const fl of [1, 2]) {
      const yL = fl === 1 ? L.f1 + 1.88 : L.f2 + 1.88;
      warmFix(4840, 8920, yL, fl);
      warmFix(6160, 8920, yL, fl);
      warmFix(8100, 8920, yL, fl);
      warmFix(9420, 8920, yL, fl);
    }
    // East entry flanks + canopy under-glow
    warmFix(12700, 5390, L.f0 + 1.88, 0);
    warmFix(12700, 6970, L.f0 + 1.88, 0);
    warmFix(13000, 6180, L.f0 + 2.40, 0);
    warmFix(12700, 5390, L.f1 + 1.88, 1);
    warmFix(12700, 7425, L.f1 + 1.88, 1);
    warmFix(13000, 6408, L.f1 + 2.40, 1);
    warmFix(12700, 5395, L.f2 + 1.88, 2);
    warmFix(12700, 7425, L.f2 + 1.88, 2);
    // Site / compound / portico outdoor fixtures use floor:-1 so the light pool
    // always considers them (not only when the player is tagged as GF).
    for (const cy of [8720, 4290, 150]) {
      warmFix(16275, cy, L.porticoFl + 0.28, -1);
      warmFix(16625, cy, L.porticoFl + 0.28, -1);
    }
    for (const [yM, fi] of [[L.porticoFl + 1.7, -1], [L.f1 + 1.7, 1], [L.f2 + 1.7, 2]]) {
      warmFix(12760, 2120, yM, fi);
      warmFix(13930, 2120, yM, fi);
    }
    for (let x = 17500; x <= 21000; x += 3500) {
      warmFix(x, 4850, 0.64, -1);
      warmFix(x, 8000, 0.64, -1);
    }
    warmFix(21750, 5000, 0.64, -1);
    warmFix(21750, 7800, 0.64, -1);
    for (let x = 10500; x <= 15500; x += 2500) warmFix(x, 10820, 0.64, -1);
    warmFix(17050, 9200, 0.64, -1);
    warmFix(17050, 10900, 0.64, -1);
    warmFix(13460, 2500, 0.64, -1);
    warmFix(13460, 3400, 0.64, -1);
    for (const [gx, gy] of [[3000, 14900], [9500, 16400], [16500, 14400]]) {
      warmFix(gx, gy, 0.40, -1);
    }
    for (const ly of [1200, 3000, 9800, 14000]) warmFix(22030, ly, 1.25, -1);
    warmFix(22160, 4422, 2.18, -1);
    warmFix(22160, 8422, 2.18, -1);
    // Mumty
    warmFix(5520, 7460, L.roof + 1.75, 2);
    // FF pooja mandir glow
    warmFix(12280, 8030, L.f1 + 1.2, 1);
    warmFix(12130, 7750, L.f1 + 0.9, 1);
    warmFix(12130, 8310, L.f1 + 0.9, 1);
    // GF office desk lamp
    warmFix(11550, 5350, L.f0 + 1.05, 0);
    // Bedroom nightstands (GF master + bed02, FF master)
    warmFix(1700, 480, L.f0 + 0.88, 0);
    warmFix(4100, 480, L.f0 + 0.88, 0);
    warmFix(1100, 5710, L.f0 + 0.88, 0);
    warmFix(3500, 5710, L.f0 + 0.88, 0);
    warmFix(1300, 480, L.f1 + 0.88, 1);
    warmFix(3700, 480, L.f1 + 0.88, 1);

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
