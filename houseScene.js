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

  /* ---------------- palette ---------------- */
  const C = {
    white:   0xe9e4da,  // off-white plaster
    white2:  0xded8cd,
    charcoal:0x34373b,
    charDark:0x282b2e,
    plinth:  0x2d3033,
    frame:   0x3a3e42,
    glass:   0x6c7d8a,
    walnut:  0x5a4634,
    ms:      0x2e3134,
    brass:   0xc9a36a,
    steel:   0x9a9fa4,
    paver:   0x55585c,
    paver2:  0x4b4e52,
    concrete:0x787b7e,
    terraceF:0xcdc7bb,
    balcTile:0x6f7375,
    solar:   0x16243f,
    solarFrm:0x3c4248,
    tank:    0xd9d6cf,
    green:   0x46613a,
    green2:  0x547043,
    boug:    0xc2447e,
    ixora:   0xd0603a,
    grass:   0x3a4f33,
    leafDark:0x2d4a28,
    leafLight:0x6b8c3e,
    bark:    0x3d2e1f,
    barkLight:0x6e5a42,
    flowerPink:0xe0749a,
    ground:  0x191b1d,
    plotPad: 0x202325,
    // floor tints
    tLiving: 0xd6d7d8, tBed: 0xd9d7d3, tBath: 0xaeb3b6,
    tKitch:  0xcfd1cf, tUtil: 0xc4c7c6, tOut: 0x6f7376,
    tCirc:   0xcdccc8, tOffice: 0xd3d4d6, tPooja: 0xe3ddcf,
    tWalk:   0xd2cfc9,
    // furniture
    fabric:  0x8a847b, fabric2: 0x6f6a63, woodF: 0x6b5947,
    woodD:   0x4e4136, mattress:0xddd8cf, pillow: 0xeae6de,
    bedding: 0x7c8894, whiteG: 0xe2e3e4, dark: 0x232527,
    tv:      0x0f1112, rug: 0xb9b2a6, carBody: 0x83888d,
    carDark: 0x1c1e20, lamp: 0xffd9a0, liftDoor:0x84898e,
    counter: 0xd8d9da, counterTop:0x3e4246,
    tharRed: 0xb51a22, chrome: 0xe0e0e0,
    accentWarm: 0x8a7058, copingLight: 0xccc5b8,
    // realism pass additions (every hex unique across the palette —
    // the walkthrough re-skins materials by colour lookup)
    skirt:   0x4a3f33,  // dark warm grey-brown skirting boards
    curtain: 0x9b8e7e,  // muted warm taupe fabric
    curtain2:0x77828e,  // muted blue-grey fabric
    downlight:0xf4ead2, // recessed downlight lens (emissive in walkthrough)
    road:    0x3b3d40,  // asphalt
    roadLine:0xd8d3c4,  // worn white line paint
    pave:    0x8d8a82,  // concrete footpath
    nbr1:    0xcfc4ae,  // neighbour plaster: warm sand
    nbr2:    0xb9aa9b,  // neighbour plaster: dusty mocha
    nbr3:    0xa8b0a4,  // neighbour plaster: grey sage
    nbrWin:  0x20272e,  // neighbour dark glazing
    soil:    0x2a221a   // planting bed earth
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
    mk('glass', C.glass, { roughness: 0.25, metalness: 0.25, transparent: true, opacity: 0.5, depthWrite: false });
    mk('carGlass', 0x1d2429, { roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 });
    mk('lamp', 0x553a14, { emissive: new THREE.Color(C.lamp), emissiveIntensity: 1.6, roughness: 0.6 });
    M.ms.roughness = 0.55; M.ms.metalness = 0.35;
    M.steel.roughness = 0.4; M.steel.metalness = 0.55;
    M.brass.roughness = 0.42; M.brass.metalness = 0.6;
    M.liftDoor.roughness = 0.4; M.liftDoor.metalness = 0.5;
    M.solar.roughness = 0.32; M.solar.metalness = 0.35;
    M.tv.roughness = 0.35;
    M.chrome.roughness = 0.15; M.chrome.metalness = 0.9;
    M.tharRed.roughness = 0.2; M.tharRed.metalness = 0.2;
    M.downlight.roughness = 0.35;
    M.nbrWin.roughness = 0.4; M.nbrWin.metalness = 0.2;
    return M;
  }

  /* ---------------- geometry bag (merged per material) ---------------- */
  function makeBag(THREE) {
    const buckets = {};
    const tmp = { v: new THREE.Vector3(), n: new THREE.Vector3(), nm: new THREE.Matrix3() };
    const boxG = new THREE.BoxGeometry(1, 1, 1);
    const cylG = new THREE.CylinderGeometry(1, 1, 1, 14);
    const sphG = new THREE.IcosahedronGeometry(1, 1);
    const sph0G = new THREE.IcosahedronGeometry(1, 0); // low-poly blob for foliage
    const coneG = new THREE.ConeGeometry(1, 1, 10);

    function bucket(mat) {
      return buckets[mat] || (buckets[mat] = { pos: [], nor: [], idx: [], vc: 0 });
    }
    function add(mat, geom, matrix) {
      const b = bucket(mat);
      const p = geom.attributes.position, n = geom.attributes.normal;
      tmp.nm.getNormalMatrix(matrix);
      for (let i = 0; i < p.count; i++) {
        tmp.v.fromBufferAttribute(p, i).applyMatrix4(matrix);
        b.pos.push(tmp.v.x, tmp.v.y, tmp.v.z);
        tmp.n.fromBufferAttribute(n, i).applyMatrix3(tmp.nm).normalize();
        b.nor.push(tmp.n.x, tmp.n.y, tmp.n.z);
      }
      if (geom.index) {
        const ix = geom.index;
        for (let i = 0; i < ix.count; i++) b.idx.push(ix.getX(i) + b.vc);
      } else {
        for (let i = 0; i < p.count; i++) b.idx.push(i + b.vc);
      }
      b.vc += p.count;
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
          const geo = new THREE2.BufferGeometry();
          geo.setAttribute('position', new THREE2.Float32BufferAttribute(b.pos, 3));
          geo.setAttribute('normal', new THREE2.Float32BufferAttribute(b.nor, 3));
          geo.setIndex(b.idx);
          const mesh = new THREE2.Mesh(geo, materials[key] || materials.white);
          mesh.castShadow = true; mesh.receiveShadow = true;
          if (key === 'glass' || key === 'carGlass') { mesh.castShadow = false; mesh.renderOrder = 2; }
          if (key === 'ground') { mesh.castShadow = false; }
          g.add(mesh);
        }
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
      if ((spec.sill || 0) > 250 && spec.type !== 'fixed') { // sill ledge
        const sb = outSign > 0 ? [bb1, bb1 + 55] : [bb0 - 55, bb0];
        put('charDark', a0 - 30, a1 + 30, sb[0], sb[1], b - 0.045, b);
      }
    }
    if (spec.chajja) {
      const cb = outSign > 0 ? [bb1, bb1 + 500] : [bb0 - 500, bb0];
      put('charDark', a0 - 150, a1 + 150, cb[0], cb[1], t + 0.045, t + 0.12);
    }
  }

  /* vertical-bar railing; dir 'x' along x at y=fc, dir 'y' along y at x=fc */
  function railing(bag, dir, fc, a0, a1, base, h) {
    h = h || 1.0;
    const len = a1 - a0; if (len < 80) return;
    const n = Math.max(2, Math.round(len / 124));
    for (let i = 0; i <= n; i++) {
      const a = a0 + (len * i) / n;
      if (dir === 'x') pb(bag, 'ms', a - 11, a + 11, fc - 11, fc + 11, base, base + h - 0.045);
      else pb(bag, 'ms', fc - 11, fc + 11, a - 11, a + 11, base, base + h - 0.045);
    }
    if (dir === 'x') {
      pb(bag, 'ms', a0 - 12, a1 + 12, fc - 24, fc + 24, base + h - 0.045, base + h);
      pb(bag, 'ms', a0 - 12, a1 + 12, fc - 18, fc + 18, base + 0.07, base + 0.105);
    } else {
      pb(bag, 'ms', fc - 24, fc + 24, a0 - 12, a1 + 12, base + h - 0.045, base + h);
      pb(bag, 'ms', fc - 18, fc + 18, a0 - 12, a1 + 12, base + 0.07, base + 0.105);
    }
  }

  /* stair flight: n step boxes; dir 'x'|'y'; sign +1/-1 run direction */
  function flight(bag, mat, dir, f0, f1, startA, sign, tread, n, baseH, rise) {
    for (let i = 1; i <= n; i++) {
      const top = baseH + i * rise;
      const aA = startA + sign * (i - 1) * tread, aB = aA + sign * tread;
      const lo = Math.min(aA, aB), hi = Math.max(aA, aB);
      if (dir === 'y') pb(bag, mat, f0, f1, lo, hi, top - 0.32, top);
      else pb(bag, mat, lo, hi, f0, f1, top - 0.32, top);
    }
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

      // 3. Panelled headboard
      // A primary wood backplate
      addPart('woodD', 0, W, 0, 80, fY + 0.12, fY + 1.15);
      // Modern premium split upholstered panels on the headboard
      if (W >= 1300) {
        addPart('fabric2', 60, W / 2 - 20, 60, 95, fY + 0.36, fY + 1.10);  // Left Panel
        addPart('fabric2', W / 2 + 20, W - 60, 60, 95, fY + 0.36, fY + 1.10); // Right Panel
      } else {
        addPart('fabric2', 60, W - 60, 60, 95, fY + 0.36, fY + 1.10); // Single Panel
      }

      // 4. Mattress
      // Mattress sits inside the frame (thickness = 250mm, from fY + 0.24 to fY + 0.49)
      addPart('mattress', 50, W - 50, 50, L - 50, fY + 0.24, fY + 0.49);

      // 5. Pillows (Sleeping + Accent pillows)
      // Standard pillows are propped up at 12 degrees (0.21 rad).
      const pillowTilt = 0.21;
      const accentTilt = 0.35; // propped up more (20 degrees)

      if (W >= 1300) {
        // Double Sleeping Pillows
        addPart('pillow', 120, W / 2 - 60, 120, 500, fY + 0.47, fY + 0.59, pillowTilt);
        addPart('pillow', W / 2 + 60, W - 120, 120, 500, fY + 0.47, fY + 0.59, pillowTilt);

        // Double Accent Pillows in front
        addPart('fabric', 200, W / 2 - 100, 420, 680, fY + 0.47, fY + 0.57, accentTilt);
        addPart('fabric', W / 2 + 100, W - 200, 420, 680, fY + 0.47, fY + 0.57, accentTilt);
      } else {
        // Single Sleeping Pillow
        addPart('pillow', 120, W - 120, 120, 500, fY + 0.47, fY + 0.59, pillowTilt);
        // Single Accent Pillow in front
        addPart('fabric', 180, W - 180, 420, 680, fY + 0.47, fY + 0.57, accentTilt);
      }

      // 6. Styled Bedding / Quilt (bedding) with drape and folded sheet (whiteG)
      // Main Duvet covers most of the mattress and hangs down the sides
      // It starts below the pillows (v = 460) and goes to the foot of the bed (L - 30)
      addPart('bedding', 30, W - 30, 460, L - 30, fY + 0.40, fY + 0.51);

      // Side Drapes (flaps hanging down to cover the wooden frame sides)
      addPart('bedding', 30, 50, 460, L - 50, fY + 0.32, fY + 0.51); // Left Drape
      addPart('bedding', W - 50, W - 30, 460, L - 50, fY + 0.32, fY + 0.51); // Right Drape
      addPart('bedding', 50, W - 50, L - 50, L - 30, fY + 0.32, fY + 0.51); // Foot Drape

      // Folded back sheet (whiteG) at the duvet edge for high-end styling
      addPart('whiteG', 30, W - 30, 430, 560, fY + 0.495, fY + 0.515);
    },
    side(bag, x0, x1, y0, y1, fY) {
      // Main nightstand cabinet
      pb(bag, 'woodF', x0, x1, y0, y1 - 20, fY, fY + 0.44);
      // Tabletop overhang
      pb(bag, 'woodD', x0 - 10, x1 + 10, y0 - 10, y1, fY + 0.44, fY + 0.47);
      // Drawer front on the North side (y1)
      pb(bag, 'woodF', x0 + 15, x1 - 15, y1 - 22, y1 - 18, fY + 0.15, fY + 0.35);
      // Drawer line recess
      pb(bag, 'dark', x0 + 10, x1 - 10, y1 - 18, y1 - 17, fY + 0.10, fY + 0.40);
      // Brass handle knob facing North
      pb(bag, 'brass', (x0 + x1) / 2 - 15, (x0 + x1) / 2 + 15, y1 - 17, y1 - 5, fY + 0.23, fY + 0.27);
    },
    wardrobe(bag, x0, x1, y0, y1, fY) {
      pb(bag, 'woodD', x0, x1, y0, y1, fY, fY + 2.36);
      pb(bag, 'woodF', x0 + 20, x1 - 20, y0 + 20, y1 - 20, fY + 2.36, fY + 2.40);
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

      // 6. Cozy corner throw pillows for double/triple seaters
      if (W >= 900) {
        if (!omitArmStart) {
          addPart('brass', 150, 370, 200, 260, fY + 0.36, fY + 0.56, 0.1); // Left pillow
        }
        if (!omitArmEnd) {
          addPart('brass', W - 370, W - 150, 200, 260, fY + 0.36, fY + 0.56, 0.1); // Right pillow
        }
      }
    },
    table(bag, x0, x1, y0, y1, fY, h, mat) {
      h = h || 0.72;
      const topMat = mat || 'woodF';
      // 1. Table top plate
      pb(bag, topMat, x0, x1, y0, y1, fY + h - 0.03, fY + h);
      // 2. Supporting apron/underframe (inset by 50mm)
      pb(bag, 'woodD', x0 + 50, x1 - 50, y0 + 50, y1 - 50, fY + h - 0.09, fY + h - 0.03);

      // 3. Four round cylindrical legs
      const lh = h - 0.09;
      const r = 0.035; // 70mm diameter
      const legs = [
        [x0 + 100, y0 + 100],
        [x1 - 100, y0 + 100],
        [x0 + 100, y1 - 100],
        [x1 - 100, y1 - 100]
      ];
      for (const [lx, ly] of legs) {
        bag.cyl('woodD', lx / 1000, fY + lh / 2, -ly / 1000, r, lh);
      }
    },
    chair(bag, cx, cy, fY, facing) {
      // 1. Four cylindrical legs
      const r = 0.018; // 36mm diameter legs
      const lh = 0.40;
      const legOffset = 180;
      const legs = [
        [cx - legOffset, cy - legOffset],
        [cx + legOffset, cy - legOffset],
        [cx - legOffset, cy + legOffset],
        [cx + legOffset, cy + legOffset]
      ];
      for (const [lx, ly] of legs) {
        bag.cyl('woodD', lx / 1000, fY + lh / 2, -ly / 1000, r, lh);
      }

      // 2. Slim wooden seat support frame
      pb(bag, 'woodD', cx - 180, cx + 180, cy - 180, cy + 180, fY + 0.35, fY + 0.40);

      // 3. Upholstered contoured seat cushion
      pb(bag, 'fabric2', cx - 220, cx + 220, cy - 220, cy + 220, fY + 0.40, fY + 0.47);

      // 4. Contoured Backrest with vertical support posts (2 vertical tubes + padded back panel)
      const t = 50; // thickness
      const postR = 0.014;
      const backH = 0.88;
      if (facing === 'N') {
        bag.cyl('woodD', (cx - 150) / 1000, fY + 0.60, -(cy - 200) / 1000, postR, 0.40);
        bag.cyl('woodD', (cx + 150) / 1000, fY + 0.60, -(cy - 200) / 1000, postR, 0.40);
        pb(bag, 'fabric2', cx - 200, cx + 200, cy - 220, cy - 220 + t, fY + 0.56, fY + backH);
      } else if (facing === 'S') {
        bag.cyl('woodD', (cx - 150) / 1000, fY + 0.60, -(cy + 200) / 1000, postR, 0.40);
        bag.cyl('woodD', (cx + 150) / 1000, fY + 0.60, -(cy + 200) / 1000, postR, 0.40);
        pb(bag, 'fabric2', cx - 200, cx + 200, cy + 220 - t, cy + 220, fY + 0.56, fY + backH);
      } else if (facing === 'E') {
        bag.cyl('woodD', (cx - 200) / 1000, fY + 0.60, -(cy - 150) / 1000, postR, 0.40);
        bag.cyl('woodD', (cx - 200) / 1000, fY + 0.60, -(cy + 150) / 1000, postR, 0.40);
        pb(bag, 'fabric2', cx - 220, cx - 220 + t, cy - 200, cy + 200, fY + 0.56, fY + backH);
      } else { // W
        bag.cyl('woodD', (cx + 200) / 1000, fY + 0.60, -(cy - 150) / 1000, postR, 0.40);
        bag.cyl('woodD', (cx + 200) / 1000, fY + 0.60, -(cy + 150) / 1000, postR, 0.40);
        pb(bag, 'fabric2', cx + 220 - t, cx + 220, cy - 200, cy + 200, fY + 0.56, fY + backH);
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
    tv(bag, face, fixed, a0, a1, fY) {
      const W = a1 - a0;
      
      // Local coordinate system helper:
      // u runs from a0 to a1 (along the TV width)
      // v runs from the screen face (0) to the wall (positive v towards wall)
      // h runs from fY + height (vertical coordinate)
      function addTVPart(mat, u0, u1, v0, v1, h0, h1) {
        let lx0, lx1, ly0, ly1;
        if (face === 'x') {
          // TV runs along X. Room is to the South (smaller Y), wall is to the North (larger Y)
          // Therefore, front face is at (fixed - 25)
          lx0 = a0 + u0;
          lx1 = a0 + u1;
          ly0 = fixed - 25 + v0;
          ly1 = fixed - 25 + v1;
        } else {
          // TV runs along Y. Room is to the West (smaller X), wall is to the East (larger X)
          // Therefore, front face is at (fixed - 25)
          ly0 = a0 + u0;
          ly1 = a0 + u1;
          lx0 = fixed - 25 + v0;
          lx1 = fixed - 25 + v1;
        }
        pb(bag, mat, lx0, lx1, ly0, ly1, h0, h1);
      }

      // 1. Sleek metallic bezel/outer border (12mm proud, covers edges)
      addTVPart('charDark', -10, W + 10, 5, 20, fY + 0.93, fY + 1.52);
      
      // 2. Glossy black screen panel (proud of the bezel back, inset front)
      addTVPart('tv', 0, W, 0, 5, fY + 0.94, fY + 1.51);

      // 3. Back enclosure housing (recessed, 30mm thick)
      addTVPart('dark', 60, W - 60, 20, 50, fY + 0.97, fY + 1.48);

      // 4. Wall mount bracket (connects housing to the wall)
      addTVPart('steel', W/2 - 150, W/2 + 150, 50, 82, fY + 1.10, fY + 1.30);

      // 5. Soundbar (under the TV screen)
      addTVPart('charcoal', W/2 - 380, W/2 + 380, 10, 60, fY + 0.83, fY + 0.89);
      // Soundbar details: metallic side caps
      addTVPart('steel', W/2 - 388, W/2 - 380, 8, 62, fY + 0.828, fY + 0.892);
      addTVPart('steel', W/2 + 380, W/2 + 388, 8, 62, fY + 0.828, fY + 0.892);

      // 6. Premium details: brass logo badge & green status light
      // Brass logo on bottom bezel center
      addTVPart('brass', W/2 - 25, W/2 + 25, 0, 6, fY + 0.93, fY + 0.94);
      // Status light in bottom right corner
      addTVPart('green2', W - 60, W - 55, 0, 6, fY + 0.932, fY + 0.938);
    },
    console(bag, x0, x1, y0, y1, fY) {
      const W = x1 - x0;
      const D = y1 - y0;
      
      // 1. Floating Plinth Base (recessed, height fY to fY + 0.08)
      pb(bag, 'dark', x0 + 80, x1 - 80, y0 + 60, y1 - 20, fY, fY + 0.08);
      
      // 2. Main Console Body Back and Sides
      // Back panel
      pb(bag, 'woodD', x0 + 15, x1 - 15, y1 - 20, y1, fY + 0.08, fY + 0.40);
      // Left and right side panels
      pb(bag, 'woodD', x0, x0 + 18, y0, y1 - 20, fY + 0.08, fY + 0.40);
      pb(bag, 'woodD', x1 - 18, x1, y0, y1 - 20, fY + 0.08, fY + 0.40);
      // Bottom board
      pb(bag, 'woodD', x0 + 18, x1 - 18, y0 + 15, y1 - 20, fY + 0.08, fY + 0.11);
      
      // 3. Top Countertop Slab (slightly proud, 30mm thick)
      pb(bag, 'woodF', x0 - 10, x1 + 10, y0 - 10, y1, fY + 0.40, fY + 0.43);
      
      // 4. Cabinet Divisions (3 equal bays)
      const bayW = (W - 36) / 3;
      const u0 = x0 + 18;
      
      // Bay 1: Left Cabinet (Drawer)
      const b1x0 = u0;
      const b1x1 = u0 + bayW;
      // Background recess
      pb(bag, 'dark', b1x0, b1x1, y0 + 10, y0 + 15, fY + 0.11, fY + 0.40);
      // Drawer Front
      pb(bag, 'woodF', b1x0 + 4, b1x1 - 4, y0, y0 + 12, fY + 0.12, fY + 0.39);
      // Brass handle
      const b1cx = (b1x0 + b1x1) / 2;
      pb(bag, 'brass', b1cx - 50, b1cx + 50, y0 - 6, y0, fY + 0.24, fY + 0.26);
      
      // Bay 2: Middle Open Media Section
      const b2x0 = u0 + bayW;
      const b2x1 = u0 + 2 * bayW;
      // Vertical divider panels (left and right of bay 2)
      pb(bag, 'woodD', b2x0 - 9, b2x0 + 9, y0 + 15, y1 - 20, fY + 0.11, fY + 0.40);
      pb(bag, 'woodD', b2x1 - 9, b2x1 + 9, y0 + 15, y1 - 20, fY + 0.11, fY + 0.40);
      // Open section back wall
      pb(bag, 'dark', b2x0 + 9, b2x1 - 9, y1 - 22, y1 - 20, fY + 0.11, fY + 0.40);
      // Middle horizontal glass shelf
      pb(bag, 'glass', b2x0 + 9, b2x1 - 9, y0 + 20, y1 - 25, fY + 0.24, fY + 0.26);
      
      // Media Device (bottom shelf): Router/Console box
      const b2cx = (b2x0 + b2x1) / 2;
      pb(bag, 'charDark', b2cx - 100, b2cx + 100, y0 + 80, y0 + 260, fY + 0.11, fY + 0.18);
      // Media Device (top shelf): Sleek player/decoder
      pb(bag, 'dark', b2cx - 120, b2cx + 120, y0 + 100, y0 + 250, fY + 0.26, fY + 0.31);
      // Tiny power LED on top device
      pb(bag, 'green2', b2cx + 90, b2cx + 94, y0 + 96, y0 + 100, fY + 0.28, fY + 0.29);
      
      // Bay 3: Right Cabinet (Drawer)
      const b3x0 = u0 + 2 * bayW;
      const b3x1 = x1 - 18;
      // Background recess
      pb(bag, 'dark', b3x0, b3x1, y0 + 10, y0 + 15, fY + 0.11, fY + 0.40);
      // Drawer Front
      pb(bag, 'woodF', b3x0 + 4, b3x1 - 4, y0, y0 + 12, fY + 0.12, fY + 0.39);
      // Brass handle
      const b3cx = (b3x0 + b3x1) / 2;
      pb(bag, 'brass', b3cx - 50, b3cx + 50, y0 - 6, y0, fY + 0.24, fY + 0.26);
    },
    tvFeatureWall(bag, x0, x1, y0, y1, fY, H, isLower) {
      // Background board for slats (10mm thick)
      pb(bag, 'charcoal', x0, x1, y0 + 10, y1, fY, fY + H);
      
      // Symmetrical wood slats
      const slatW = 30;
      const slatG = 30;
      // Left side: x0 (6020) to 6430
      for (let x = x0 + 15; x < 6430 - 20; x += (slatW + slatG)) {
        pb(bag, 'woodD', x, x + slatW, y0 + 5, y0 + 10, fY, fY + H);
      }
      // Right side: 7830 to x1 (8241)
      for (let x = 7830 + 20; x < x1 - 15; x += (slatW + slatG)) {
        pb(bag, 'woodD', x, x + slatW, y0 + 5, y0 + 10, fY, fY + H);
      }

      // Central stone panel
      pb(bag, 'tPooja', 6430, 7830, y0, y0 + 10, fY, fY + H);

      // Vertical LED backlights
      pb(bag, 'lamp', 6422, 6430, y0 + 8, y0 + 10, fY, fY + H);
      pb(bag, 'lamp', 7830, 7838, y0 + 8, y0 + 10, fY, fY + H);

      // Brass inlay grid
      pb(bag, 'brass', 7128, 7132, y0 - 1, y0, fY, fY + H);
      for (let h = 1.10; h < H; h += 1.10) {
        pb(bag, 'brass', 6430, 7830, y0 - 1, y0, fY + h - 0.005, fY + h + 0.005);
      }

      if (isLower) {
        // Wooden frame backing behind the TV
        pb(bag, 'woodF', 6500, 7760, y0 - 12, y0 - 2, fY + 0.70, fY + 1.80);
        // Brass trim around this backing frame
        pb(bag, 'brass', 6496, 6500, y0 - 13, y0 - 1, fY + 0.70, fY + 1.80);
        pb(bag, 'brass', 7760, 7764, y0 - 13, y0 - 1, fY + 0.70, fY + 1.80);
        pb(bag, 'brass', 6496, 7764, y0 - 13, y0 - 1, fY + 0.696, fY + 0.704);
        pb(bag, 'brass', 6496, 7764, y0 - 13, y0 - 1, fY + 1.796, fY + 1.804);
      } else {
        // Floating display shelves on the wood slats
        // Left shelf
        pb(bag, 'brass', 6050, 6400, y0 - 120, y0, fY + 1.20, fY + 1.22);
        pb(bag, 'fabric2', 6100, 6170, y0 - 80, y0 - 20, fY + 1.22, fY + 1.35); // books
        pb(bag, 'charcoal', 6240, 6300, y0 - 80, y0 - 30, fY + 1.22, fY + 1.30); // small vase
        // mini potted plant cluster
        bag.cyl('bark', 6270 / 1000, fY + 1.32, -(y0 - 55) / 1000, 0.008, 0.04);
        bag.sph('green2', 6270 / 1000, fY + 1.37, -(y0 - 55) / 1000, 0.045, 0.05);
        bag.sph('leafLight', 6255 / 1000, fY + 1.39, -(y0 - 45) / 1000, 0.032, 0.035);
        bag.sph('leafDark', 6285 / 1000, fY + 1.38, -(y0 - 65) / 1000, 0.028, 0.03);
        
        // Right shelf
        pb(bag, 'brass', 7860, 8210, y0 - 120, y0, fY + 1.60, fY + 1.62);
        pb(bag, 'fabric2', 7910, 7980, y0 - 80, y0 - 20, fY + 1.62, fY + 1.75); // books
        pb(bag, 'charcoal', 8050, 8110, y0 - 80, y0 - 30, fY + 1.62, fY + 1.70); // vase
        // mini potted plant cluster
        bag.cyl('bark', 8080 / 1000, fY + 1.72, -(y0 - 55) / 1000, 0.008, 0.04);
        bag.sph('green2', 8080 / 1000, fY + 1.77, -(y0 - 55) / 1000, 0.045, 0.05);
        bag.sph('leafLight', 8065 / 1000, fY + 1.79, -(y0 - 45) / 1000, 0.032, 0.035);
        bag.sph('leafDark', 8095 / 1000, fY + 1.78, -(y0 - 65) / 1000, 0.028, 0.03);
      }
    },
    counterX(bag, x0, x1, y0, y1, fY) {
      pb(bag, 'counter', x0, x1, y0, y1, fY + 0.06, fY + 0.82);
      pb(bag, 'counterTop', x0 - 12, x1 + 12, y0 - 12, y1 + 12, fY + 0.82, fY + 0.86);
    },
    fridge(bag, x0, x1, y0, y1, fY) { pb(bag, 'steel', x0, x1, y0, y1, fY, fY + 1.5); },
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
    sink(bag, cx, cy, fY, back) {
      back = back || 'E';
      const ct = fY + 0.86, ox = 215, oy = 165, H = 0.085, w = 12;

      // 1. Anthracite / Stainless Steel main sink bowl deck
      pb(bag, 'steel', cx - ox - 15, cx + ox + 15, cy - oy - 15, cy + oy + 15, ct, ct + 0.015); // rim deck
      pb(bag, 'dark', cx - ox + w, cx + ox - w, cy - oy + w, cy + oy - w, ct, ct + 0.01); // dark composite granite floor

      // 2. Bowl walls
      pb(bag, 'steel', cx - ox, cx + ox, cy + oy - w, cy + oy, ct, ct + H);
      pb(bag, 'steel', cx - ox, cx + ox, cy - oy, cy - oy + w, ct, ct + H);
      pb(bag, 'steel', cx + ox - w, cx + ox, cy - oy, cy + oy, ct, ct + H);
      pb(bag, 'steel', cx - ox, cx - ox + w, cy - oy, cy + oy, ct, ct + H);

      // 3. High-fidelity strainer / drain center
      bag.cyl('chrome', cx / 1000, ct + 0.005, -cy / 1000, 0.045, 0.008); // outer chrome collar
      bag.cyl('dark', cx / 1000, ct + 0.008, -cy / 1000, 0.03, 0.012);   // inner strainer cup
      bag.cyl('chrome', cx / 1000, ct + 0.015, -cy / 1000, 0.008, 0.02); // center pop-up pin

      // 4. Premium Integrated Accessories
      // Removable wood cutting board on the right side
      pb(bag, 'woodF', cx + 60, cx + 195, cy - 145, cy + 145, ct + 0.085, ct + 0.097);
      // Stainless steel drying colander basket on the left side
      pb(bag, 'steel', cx - 195, cx - 110, cy - 140, cy + 140, ct + 0.012, ct + 0.085);
      pb(bag, 'dark', cx - 190, cx - 115, cy - 135, cy + 135, ct + 0.015, ct + 0.08);

      // 5. Designer Matte Black / Chrome Pull-Out Gooseneck Faucet
      let fx = cx, fz = cy;
      if (back === 'E') fx = cx + ox + 35; 
      else if (back === 'W') fx = cx - ox - 35;
      else if (back === 'N') fz = cy + oy + 35; 
      else fz = cy - oy - 35;

      // Faucet body & base
      bag.cyl('chrome', fx / 1000, ct + 0.015, -fz / 1000, 0.024, 0.03); // base deck ring
      bag.cyl('charcoal', fx / 1000, ct + 0.045, -fz / 1000, 0.018, 0.09); // lower body
      
      // Gooseneck tube and pull-out head
      bag.cyl('chrome', fx / 1000, ct + 0.22, -fz / 1000, 0.012, 0.35); // main neck column
      
      // Horizontal reach and nozzle bend
      if (back === 'E' || back === 'W') {
        const sign = (fx > cx) ? -1 : 1;
        // horizontal extension
        bag.cyl('chrome', (fx + sign * 120) / 1000, ct + 0.38, -cy / 1000, 0.011, 0.12, 0, 0, Math.PI / 2);
        // bent nozzle pointing down
        bag.cyl('charcoal', (fx + sign * 240) / 1000, ct + 0.35, -cy / 1000, 0.016, 0.06);
      } else {
        const sign = (fz > cy) ? -1 : 1;
        // horizontal extension
        bag.cyl('chrome', cx / 1000, ct + 0.38, -(fz + sign * 120) / 1000, 0.011, 0.12, Math.PI / 2, 0, 0);
        // bent nozzle pointing down
        bag.cyl('charcoal', cx / 1000, ct + 0.35, -(fz + sign * 240) / 1000, 0.016, 0.06);
      }

      // Single lever handle (slanted control pin)
      if (back === 'E' || back === 'W') {
        pb(bag, 'chrome', fx - 5, fx + 5, fz - 30, fz - 5, ct + 0.09, ct + 0.10);
        bag.cyl('chrome', fx / 1000, ct + 0.13, -(fz - 20) / 1000, 0.005, 0.07, 0, 0.2, 0.5);
      } else {
        pb(bag, 'chrome', fx - 30, fx - 5, fz - 5, fz + 5, ct + 0.09, ct + 0.10);
        bag.cyl('chrome', (fx - 20) / 1000, ct + 0.13, -fz / 1000, 0.005, 0.07, 0.5, 0.2, 0);
      }
    },
    wc(bag, cx, cy, fY, facing) {
      facing = facing || 'S';
      pb(bag, 'whiteG', cx - 130, cx + 130, cy - 140, cy + 140, fY + 0.02, fY + 0.30); // pedestal
      bag.cyl('whiteG', cx / 1000, fY + 0.36, -cy / 1000, 0.205, 0.17);                // bowl body
      bag.cyl('whiteG', cx / 1000, fY + 0.44, -cy / 1000, 0.215, 0.035);               // seat ring
      bag.cyl('dark', cx / 1000, fY + 0.448, -cy / 1000, 0.15, 0.014);                 // bowl opening
      // cistern on the facing wall side
      if (facing === 'S') pb(bag, 'whiteG', cx - 200, cx + 200, cy + 170, cy + 285, fY + 0.42, fY + 0.84);
      if (facing === 'N') pb(bag, 'whiteG', cx - 200, cx + 200, cy - 285, cy - 170, fY + 0.42, fY + 0.84);
      if (facing === 'E') pb(bag, 'whiteG', cx - 285, cx - 170, cy - 200, cy + 200, fY + 0.42, fY + 0.84);
      if (facing === 'W') pb(bag, 'whiteG', cx + 170, cx + 285, cy - 200, cy + 200, fY + 0.42, fY + 0.84);
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
    shower(bag, x0, x1, y0, y1, fY) { pb(bag, 'glass', x0, x1, y0, y1, fY + 0.02, fY + 1.35); },
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
      pb(bag, 'woodF', x0, x1, y0, y1, fY + 0.18, fY + 0.3);
      pb(bag, 'fabric', x0 + 20, x0 + (x1 - x0) * 0.62, y0 + 20, y1 - 20, fY + 0.3, fY + 0.37);
      pb(bag, 'fabric', x0 + (x1 - x0) * 0.62, x1 - 20, y0 + 20, y1 - 20, fY + 0.3, fY + 0.62, 0, 0, 0);
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
    wallCabinet(bag, x0, x1, y0, y1, fY) {
      pb(bag, 'woodD', x0, x1, y0, y1, fY + 1.40, fY + 2.20);
      pb(bag, 'woodF', x0 + 12, x1 - 12, y0 + 12, y1 - 12, fY + 2.20, fY + 2.24);
    },
    rangeHood(bag, cx, cy, fY) {
      // canopy (wider base)
      pb(bag, 'steel', cx - 300, cx + 300, cy - 260, cy + 260, fY + 1.40, fY + 1.50);
      // chimney duct (narrower tower up to ceiling area)
      pb(bag, 'steel', cx - 150, cx + 150, cy - 130, cy + 130, fY + 1.50, fY + 2.60);
    },
    mirror(bag, x0, x1, y0, y1, fY) {
      // reflective glass panel
      pb(bag, 'glass', x0, x1, y0, y1, fY + 0.90, fY + 1.70);
      // thin frame border
      pb(bag, 'steel', x0 - 5, x1 + 5, y0 - 5, y1 + 5, fY + 0.895, fY + 0.90);
      pb(bag, 'steel', x0 - 5, x1 + 5, y0 - 5, y1 + 5, fY + 1.70, fY + 1.705);
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
      { dir: 'y', b: [10780, 10893], a: [7300, 8642], ops: [{ c: 8050, w: 900 }] },    // hall|pooja
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
      }

      function fitAndPlace(model) {
        model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
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
      }

      if (THREE.GLTFLoader) {
        const draco = new THREE.DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        const loader = new THREE.GLTFLoader();
        loader.setDRACOLoader(draco);
        loader.load(CAR_MODEL_URL,
          gltf => { clearCarNotice(); fitAndPlace(gltf.scene); },
          undefined,
          err => { console.warn('[car] models/car.glb not found — using procedural fallback.', err); fallback('load-error'); }
        );
      } else {
        console.warn('[car] GLTFLoader unavailable — using procedural fallback.');
        fallback();
      }
    }

    const X0 = 0, X1 = 12650, Y0n = 0, Y1n = 8870; // main block
    const liftIX = [12650, 14040], liftIY = [230, 1805];
    const liftOX = [12650, 14270], liftOY = [0, 2035];
    const towX = [14270, 16600], towY = [0, 4140];
    const portY = [-762, 8870], eastX = [12650, 17362];

    const RISE_E = 3.953 / 26;      // external stair (portico 0.15 -> 4.103)
    const RISE_I = L.f2f / 22;      // internal stair

    /* -------- lighting contract: recessed downlights + warm accents -------- */
    const lights = [];
    function downlight(bag, xmm, ymm, ceilY, floor) {
      const wx = xmm / 1000, wz = -ymm / 1000;
      // trim ring: face 6mm below the ceiling (4mm behind the lens face)
      bag.cyl('frame', wx, ceilY - 0.002, wz, 0.058, 0.008);
      // lens: 15mm deep, visible face 10mm proud below the ceiling plane
      bag.cyl('downlight', wx, ceilY - 0.0025, wz, 0.045, 0.015);
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
      // gate piers + sliding gate (closed)
      for (const py of [[4222, 4622], [8222, 8622]]) {
        pb(sBag, 'charDark', 21930, 22420, py[0], py[1], 0, 1.84);
        pb(sBag, 'charcoal', 21905, 22445, py[0] - 18, py[1] + 18, 1.84, 1.93);
        pb(sBag, 'lamp', 22120, 22230, (py[0] + py[1]) / 2 - 110, (py[0] + py[1]) / 2 + 110, 1.93, 2.02);
      }
      pb(sBag, 'ms', 22130, 22190, 4622, 8222, 0.10, 0.18);
      pb(sBag, 'ms', 22130, 22190, 4622, 8222, 1.40, 1.50);
      const nbars = Math.round(3600 / 138);
      for (let i = 0; i <= nbars; i++) {
        const gy = 4622 + (3600 * i) / nbars;
        pb(sBag, 'ms', 22136, 22184, gy - 14, gy + 14, 0.18, 1.40);
      }
      // driveway pavers (striped)
      pb(sBag, 'paver', 16600, 22100, 4700, 8150, 0, 0.055);
      for (let x = 16900; x < 22100; x += 1200)
        pb(sBag, 'paver2', x, x + 600, 4710, 8140, 0.055, 0.062);
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
      // grass strips along south inside wall and old north strip
      pb(sBag, 'grass', -700, 7800, 8980, 9560, 0.012, 0.045);
      pb(sBag, 'grass', -700, 21100, -700, -150, 0.012, 0.045);
      for (let x = 1200; x < 20500; x += 2600) shrub(x, -430, 0.3, (x % 5200 < 2600) ? 'green' : 'green2');

      // new expanded landscape lawn on the North side - split to avoid the new stoop/path
      pb(sBag, 'grass', -700, 9500, 9560, 18620, 0.012, 0.045); // West lawn
      pb(sBag, 'grass', 17500, 21950, 9560, 18620, 0.012, 0.045); // East lawn
      pb(sBag, 'grass', 9500, 17500, 11270, 18620, 0.012, 0.045); // North lawn
      pb(sBag, 'grass', 9500, 16600, 8980, 10370, 0.012, 0.045); // South lawn strip

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
      // wall lights (east wall inner face)
      for (const ly of [1500, 3300, 9000]) {
        pb(sBag, 'charDark', 22040, 22110, ly - 90, ly + 90, 1.05, 1.42);
        pb(sBag, 'lamp', 22020, 22045, ly - 60, ly + 60, 1.12, 1.35);
      }
      // car in portico — real GLB model (models/car.glb) with procedural fallback
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
      // neighbour houses: across the road (east) and beyond side walls (N/S),
      // 12-45m from the compound, varied heights/tones/orientation
      nbrHouse(cBag, 45000, 2500, 9000, 8000, 2, 'nbr1', 0.06, 'W');
      nbrHouse(cBag, 46000, 12500, 10000, 9000, 3, 'nbr2', -0.05, 'W');
      nbrHouse(cBag, 45000, 21500, 8500, 7500, 1, 'nbr3', 0.09, 'W');
      nbrHouse(cBag, 7000, 35500, 11000, 8500, 2, 'nbr2', -0.07, 'S');
      nbrHouse(cBag, 17500, 34500, 8000, 7000, 1, 'nbr1', 0.12, 'S');
      nbrHouse(cBag, 4000, -17000, 9500, 8000, 2, 'nbr3', -0.04, 'N');
      // loose tree line 30-60m out to the east/north to soften the horizon
      const tl = [
        [46000, -8000], [52000, 2000], [49000, 12000], [55000, 20000], [50000, 30000],
        [8000, 46000], [20000, 50000], [32000, 44000], [44000, 48000]
      ];
      tl.forEach(([tx, ty], ti) =>
        plantTree(cBag, tx, ty, 2.2 + (ti % 3) * 0.5, { low: true, base: 0.02 }));
    })();
    const context = cBag.build(THREE, materials); context.name = 'context'; root.add(context);

    function stairRailing(bag, dir, fc, startA, sign, tread, n, baseH, rise, h) {
      h = h || 0.95;
      const posts = [];
      for (let i = 0; i <= n; i++) {
        const stepH = baseH + i * rise;
        const a = startA + sign * i * tread;
        posts.push({ a, y: stepH });
        if (dir === 'x') {
          pb(bag, 'ms', a - 11, a + 11, fc - 11, fc + 11, stepH, stepH + h);
        } else {
          pb(bag, 'ms', fc - 11, fc + 11, a - 11, a + 11, stepH, stepH + h);
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
            pb(bag, 'ms', a - 5, a + 5, fc - 5, fc + 5, spindleBase, spindleTop);
          } else {
            pb(bag, 'ms', fc - 5, fc + 5, a - 5, a + 5, spindleBase, spindleTop);
          }
        }
      }
      const hSize = 35; // handrail height/thickness
      const thickness = 24;
      for (let i = 0; i < posts.length - 1; i++) {
        const p1 = posts[i], p2 = posts[i + 1];
        const midA = (p1.a + p2.a) / 2;
        const midY = (p1.y + p2.y) / 2 + h;
        const len = Math.abs(p2.a - p1.a) / 1000;
        const riseAmt = p2.y - p1.y;
        const dist = Math.sqrt(len * len + riseAmt * riseAmt);
        if (dir === 'x') {
          const angle = Math.atan2(riseAmt, sign * len);
          bag.box('ms', midA / 1000, midY, -fc / 1000, dist, hSize / 1000, thickness / 1000, 0, 0, angle);
        } else {
          const angle = -Math.atan2(riseAmt, -sign * len);
          bag.box('ms', fc / 1000, midY, -midA / 1000, thickness / 1000, hSize / 1000, dist, angle, 0, 0);
        }
      }
    }

    /* helpers reused by exterior + floors */
    /** East wall + middle wall stair geometry under flight 1 */
    function stairWalls(bag, numSteps) {
      // East wall: solid white wall underneath landing & flight 1
      pb(bag, 'white', 16300, 16600, 230, 1040, 0, L.porticoFl + 13 * RISE_E);
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

    function externalStair(bag, full) {
      // tower walls
      pb(bag, 'charDark', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);     // south
      // spine between flights (replaced with metal railings)
      if (full) {
        stairRailing(bag, 'y', 15470, 3890, -1, 237.5, 12, L.porticoFl, RISE_E);
        railing(bag, 'x', 1040, 15400, 15470, L.porticoFl + 13 * RISE_E, 0.95);
        stairRailing(bag, 'y', 15400, 1040, 1, 237.5, 12, L.porticoFl + 13 * RISE_E, RISE_E);
        railing(bag, 'x', 3890, 15400, 15470, L.f1, 0.95);

        // west railings (safety protection since west wall is removed)
        railing(bag, 'y', 14500, 140, 1040, L.porticoFl + 13 * RISE_E, 0.95);
        stairRailing(bag, 'y', 14500, 1040, 1, 237.5, 12, L.porticoFl + 13 * RISE_E, RISE_E);
        railing(bag, 'y', 14500, 3890, 4140, L.f1, 0.95);
      }
      if (full) {
        stairWalls(bag, 12);

        // East MS bar screen: starts on top of the solid wall/steps and goes to FF
        pb(bag, 'ms', 16380, 16420, 230, towY[1], 3.98, 4.075); // top rail
        const n = Math.round((towY[1] - 380) / 152);
        for (let i = 0; i <= n; i++) {
          const sy = 300 + ((towY[1] - 80 - 300) * i) / n;
          
          let botH = 0.16;
          if (sy <= 1040) {
            botH = L.porticoFl + 13 * RISE_E;
          } else if (sy < 3890) {
            botH = L.porticoFl + ((3890 - sy) / 2850) * (13 * RISE_E);
          }
          pb(bag, 'ms', 16378, 16422, sy - 20, sy + 20, botH, 4.075);
        }
      }
      // flight 1 (east strip, ascends south), 12 steps + landing
      flight(bag, 'concrete', 'y', 15470, 16370, 3890, -1, 237.5, 12, L.porticoFl, RISE_E);
      pb(bag, 'concrete', 14500, 16370, 140, 1040, L.porticoFl + 13 * RISE_E - 0.32, L.porticoFl + 13 * RISE_E); // landing
      // flight 2 (west strip, ascends north)
      flight(bag, 'concrete', 'y', 14500, 15400, 1040, 1, 237.5, 12, L.porticoFl + 13 * RISE_E, RISE_E);
      pb(bag, 'concrete', 14500, 15400, 3890, 4140, L.f1 - 0.32, L.f1); // arrival platform
    }

    function liftTower(bag, topH, doors) {
      const dOps = [{ c: 13345, w: 980, sill: 0, h: 2.18 }];
      pb(bag, 'charcoal', liftOX[0], liftOX[1], liftOY[0], liftOY[0] + 230, 0, topH); // south
      pb(bag, 'charcoal', 14040, 14270, 230, liftOY[1], 0, topH);                     // east
      // north wall with door openings at given levels
      const segs = [];
      let prev = 0;
      for (const dl of doors) { segs.push([prev, dl]); segs.push(null); prev = dl + 2.18; }
      // build: full wall minus door rectangles
      const dx0 = 13345 - 490, dx1 = 13345 + 490;
      pb(bag, 'charcoal', liftOX[0], dx0, 1805, 2035, 0, topH);
      pb(bag, 'charcoal', dx1, liftOX[1], 1805, 2035, 0, topH);
      let cur = 0;
      for (const dl of doors) {
        if (dl > cur) pb(bag, 'charcoal', dx0, dx1, 1805, 2035, cur, dl);
        // door leaves
        pb(bag, 'liftDoor', dx0 + 25, 13345 - 8, 1880, 1955, dl + 0.01, dl + 2.12);
        pb(bag, 'liftDoor', 13345 + 8, dx1 - 25, 1880, 1955, dl + 0.01, dl + 2.12);
        pb(bag, 'frame', dx0 - 45, dx0, 1830, 2035, dl, dl + 2.18);
        pb(bag, 'frame', dx1, dx1 + 45, 1830, 2035, dl, dl + 2.18);
        pb(bag, 'frame', dx0 - 45, dx1 + 45, 1830, 2035, dl + 2.18, dl + 2.30);
        cur = dl + 2.30;
      }
      if (topH > cur) pb(bag, 'charcoal', dx0, dx1, 1805, 2035, cur, topH);
    }

    function columnsEast(bag, topH) {
      for (const cy of [8720, 4290, 150])
        pb(bag, 'charDark', 16300, 16600, cy - 150, cy + 150, 0, topH);
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
      // Y = -762 to 230
      pb(bag, 'white', 0, 17362, -762, 230, h0, h1);
      // Y = 230 to 1040 (lift cutout at X = 12650..14040)
      pb(bag, 'white', 0, 12650, 230, 1040, h0, h1);
      pb(bag, 'white', 14040, 17362, 230, 1040, h0, h1);
      // Y = 1040 to 1805 (lift cutout at X = 12650..14040)
      pb(bag, 'white', 0, 12650, 1040, 1805, h0, h1);
      pb(bag, 'white', 14040, 14240, 1040, 1805, h0, h1);
      // Y = 1805 to 3890
      pb(bag, 'white', 0, 14240, 1805, 3890, h0, h1);
      // Flight 1 overhead slab
      pb(bag, 'white', 15400, 17362, 1040, 3890, h0, h1);
      // Y = 3890 to Y1n
      pb(bag, 'white', 0, 17362, 3890, Y1n, h0, h1);
    }

    function drawFFTiles(bag, mat, h0, h1) {
      // South balcony (west of service bands)
      pb(bag, mat, 30, 4805, -732, 0, h0, h1);
      // South/East portico-top (Y = -732 to 230)
      pb(bag, mat, 12650, 17332, -732, 230, h0, h1);
      // East of Lift (Y = 230 to 1040)
      pb(bag, mat, 14040, 17332, 230, 1040, h0, h1);
      // East of Lift (Y = 1040 to 1805)
      pb(bag, mat, 14040, 14240, 1040, 1805, h0, h1);
      // East balcony (Y = 1805 to 3890)
      pb(bag, mat, 12680, 14240, 1805, 3890, h0, h1);
      // Flight 2 East balcony (Y = 1040 to 3890)
      pb(bag, mat, 15400, 17332, 1040, 3890, h0, h1);
      // North balcony (Y = 3890 to Y1n - 30)
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
      // band floor tiles (inset from walls)
      pb(eBag, 'balcTile', 4965, 8085, -596, 1360, L.f1, L.f1 + 0.012);   // utility
      pb(eBag, 'balcTile', 8300, 9320, -596, 1360, L.f1, L.f1 + 0.012);   // common bath
      pb(eBag, 'balcTile', 9536, 12370, -596, 1360, L.f1, L.f1 + 0.012);  // wet kitchen
      // parapet (terrace) — continuous closed loop, no gaps
      pb(eBag, 'charcoal', X0, eastX[1], -762, -612, L.roof, L.parapetTop);                                  // south wall (flush with slab edge)
      pb(eBag, 'charcoal', X0, eastX[1], 9720, 9870, L.roof, L.parapetTop);                                  // north wall
      pb(eBag, 'charcoal', X0, 150, -612, 9720, L.roof, L.parapetTop);                                        // west wall
      pb(eBag, 'charcoal', eastX[1] - 150, eastX[1], -612, 9720, L.roof, L.parapetTop);                       // east wall
      // parapet coping — continuous cap, no gaps
      pb(eBag, 'charDark', X0 - 20, eastX[1] + 20, -782, -592, L.parapetTop, L.parapetTop + 0.05);          // south cap
      pb(eBag, 'charDark', X0 - 20, eastX[1] + 20, 9700, 9890, L.parapetTop, L.parapetTop + 0.05);          // north cap
      pb(eBag, 'charDark', X0 - 20, 170, -782, 9740, L.parapetTop, L.parapetTop + 0.05);                     // west cap
      pb(eBag, 'charDark', eastX[1] - 170, eastX[1] + 20, -782, 9740, L.parapetTop, L.parapetTop + 0.05);   // east cap
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
      pb(eBag, 'charDark', mx[0] - 230 - 120, mx[1] + 115 + 120, my[0] - 115 - 120, my[1] + 229 + 120, L.roof + 2.55, L.roof + 2.70);
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
      // east outdoor structure
      liftTower(eBag, L.liftTop, [0.10, L.f1, L.f2]);
      pb(eBag, 'charDark', liftOX[0] - 40, liftOX[1] + 40, liftOY[0] - 40, liftOY[1] + 40, L.liftTop, L.liftTop + 0.05);
      externalStair(eBag, true);
      columnsEast(eBag, L.roof - L.slabT);
      // portico floor + curb
      pb(eBag, 'concrete', eastX[0], eastX[1], portY[0], portY[1], 0, L.porticoFl);
      pb(eBag, 'balcTile', eastX[0] + 40, eastX[1] - 40, portY[0] + 40, portY[1] - 40, L.porticoFl, L.porticoFl + 0.012);

      // FF East & South Balcony Slabs (with lift shaft cutout)
      drawFFSlab(eBag, L.f1 - L.slabT, L.f1);

      // Soffits
      pb(eBag, 'charDark', 0, 17362, -762, 0, L.f1 - L.slabT - 0.008, L.f1 - L.slabT);
      pb(eBag, 'charDark', 12650 + 60, 17362 - 60, 4200, Y1n - 60, L.f1 - L.slabT - 0.008, L.f1 - L.slabT);
      pb(eBag, 'charDark', 14330, 17302, 60, 2095, L.f1 - L.slabT - 0.008, L.f1 - L.slabT);

      // Balcony tile finishes (with lift shaft cutout)
      drawFFTiles(eBag, 'balcTile', L.f1, L.f1 + 0.012);

      // FF fascia 450 on edges
      pb(eBag, 'charDark', eastX[1] - 90, eastX[1] + 10, -762, 9880, L.f1 - 0.45, L.f1 + 0.012); // east edge
      pb(eBag, 'charDark', 0, eastX[1] + 10, 9780, 9880, L.f1 - 0.45, L.f1 + 0.012); // north edge
      pb(eBag, 'charDark', -10, 90, -762, 9880, L.f1 - 0.45, L.f1 + 0.012); // west edge
      pb(eBag, 'charDark', 0, 17362 + 10, -762 - 90, -762 + 10, L.f1 - 0.45, L.f1 + 0.012); // continuous south edge fascia

      // FF railings (open entry at top of Flight 2: y=3890, x=14500..15400)
      railing(eBag, 'x', -762, 0, 4805, L.f1, 1.0); // south balcony railing (west of service bands)
      railing(eBag, 'y', 0, -762, 0, L.f1, 1.0); // south balcony west end cap
      railing(eBag, 'x', -762, 12650, 17362, L.f1, 1.0); // portico-top south edge railing
      railing(eBag, 'y', 17282, -762, 9790, L.f1, 1.0); // continuous outer east edge
      railing(eBag, 'y', 14240, 1040, 3890, L.f1, 1.0); // Flight 2 west safety railing
      railing(eBag, 'y', 15400, 1040, 3890, L.f1, 1.0); // Flight 2 east safety railing
      railing(eBag, 'x', 1040, 14240, 15400, L.f1, 1.0); // Flight 2 south safety railing
      railing(eBag, 'x', 9790, 80, 17282, L.f1, 1.0); // north balcony railing
      railing(eBag, 'y', 80, 8870, 9790, L.f1, 1.0); // north balcony west railing

      // SF East & South Balcony Slabs (with cutout voids for Stairs, Duplex, and Lift)
      drawSFSlab(eBag, L.f2 - L.slabT, L.f2);
      drawSFSoffit(eBag, L.f2 - L.slabT - 0.008, L.f2 - L.slabT);
      drawSFTiles(eBag, 'balcTile', L.f2, L.f2 + 0.012);

      // SF fascia 450 on edges
      pb(eBag, 'charDark', eastX[1] - 90, eastX[1] + 10, -762, 9880, L.f2 - 0.45, L.f2 + 0.012); // east edge
      pb(eBag, 'charDark', 0, eastX[1] + 10, 9780, 9880, L.f2 - 0.45, L.f2 + 0.012); // north edge
      pb(eBag, 'charDark', -10, 90, -762, 9880, L.f2 - 0.45, L.f2 + 0.012); // west edge
      pb(eBag, 'charDark', 0, 17362 + 10, -762 - 90, -762 + 10, L.f2 - 0.45, L.f2 + 0.012); // south edge fascia

      // SF railings (outer perimeter only, no unnecessary inner stair railings on SF)
      railing(eBag, 'x', -762, 0, 17362, L.f2, 1.0); // full south balcony railing
      railing(eBag, 'y', 0, -762, 0, L.f2, 1.0); // south balcony west end cap
      railing(eBag, 'y', 17282, -762, 9790, L.f2, 1.0); // continuous outer east edge extended
      railing(eBag, 'x', 9790, 80, 17282, L.f2, 1.0); // north balcony railing
      railing(eBag, 'y', 80, 8870, 9790, L.f2, 1.0); // north balcony west railing

      // SF balcony planters & loungers
      Fur.planter(eBag, 16280, 8430, L.f2, 1.1);
      Fur.planter(eBag, 16280, 2450, L.f2, 1.1);
      Fur.planter(eBag, 12950, 8430, L.f2, 0.95);
      Fur.lounger(eBag, 15050, 16350, 5500, 6280, L.f2);
      Fur.lounger(eBag, 15050, 16350, 6600, 7380, L.f2);

      // Terrace slab extensions and soffits over second-floor balconies
      pb(eBag, 'white', 0, 17362, -762, Y1n, L.roof - L.slabT, L.roof);
      pb(eBag, 'charDark', 60, 17302, -702, Y1n - 60, L.roof - L.slabT - 0.008, L.roof - L.slabT);
      // FF North Balcony Slabs, Soffits & Tiling
      pb(eBag, 'white', 0, 17362, Y1n, Y1n + 1000, L.f1 - L.slabT, L.f1);
      pb(eBag, 'charDark', 60, 17302, Y1n, Y1n + 1000 - 60, L.f1 - L.slabT - 0.008, L.f1 - L.slabT);
      pb(eBag, 'balcTile', 30, 17332, Y1n, Y1n + 1000 - 30, L.f1, L.f1 + 0.012);
      // SF North Balcony Slabs, Soffits & Tiling
      pb(eBag, 'white', 0, 17362, Y1n, Y1n + 1000, L.f2 - L.slabT, L.f2);
      pb(eBag, 'charDark', 60, 17302, Y1n, Y1n + 1000 - 60, L.f2 - L.slabT - 0.008, L.f2 - L.slabT);
      pb(eBag, 'balcTile', 30, 17332, Y1n, Y1n + 1000 - 30, L.f2, L.f2 + 0.012);
      // Terrace North Balcony Slabs & Soffits
      pb(eBag, 'white', 0, 17362, Y1n, Y1n + 1000, L.roof - L.slabT, L.roof);
      pb(eBag, 'charDark', 60, 17302, Y1n, Y1n + 1000 - 60, L.roof - L.slabT - 0.008, L.roof - L.slabT);
      // GF north stoop (main door) - now facing north properly
      pb(eBag, 'plinth', 7800, 9500, Y1n, 10070, 0, L.f0);
      let st = 0.60;
      for (let i = 0; i < 4; i++) {
        pb(eBag, 'plinth', 7800, 9500, 10070 + i * 300, 10070 + (i + 1) * 300, 0, st);
        st -= 0.15;
      }
      // office stoop in portico
      st = 0.60;
      for (let i = 0; i < 3; i++) { pb(eBag, 'concrete', 12650 + i * 300, 12950 + i * 300, 5580, 6780, L.porticoFl, st); st -= 0.15; }
      // wall lamps beside doors
      pb(eBag, 'charDark', 9320, 9420, NB[0] - 70, NB[0], L.f0 + 1.7, L.f0 + 2.0);
      pb(eBag, 'lamp', 9335, 9405, NB[0] - 95, NB[0] - 70, L.f0 + 1.75, L.f0 + 1.95);
      pb(eBag, 'charDark', EB[1], EB[1] + 70, 5380, 5480, L.f1 + 1.7, L.f1 + 2.0);
      pb(eBag, 'lamp', EB[1] + 70, EB[1] + 95, 5395, 5465, L.f1 + 1.75, L.f1 + 1.95);

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
        pb(eBag, 'charDark', EF + 740, EF + 770, 5270, 7090,
           L.f0 + 2.38, L.f0 + 2.62);          // drip edge

        // FF duplex entry (c=6180 door + c=7010 sidelite) — wider canopy
        pb(eBag, 'charDark', EF - 25, EF + 750, 5280, 7470,
           L.f1 + 2.50, L.f1 + 2.60);
        pb(eBag, 'accentWarm', EF + 30, EF + 740, 5300, 7450,
           L.f1 + 2.40, L.f1 + 2.50);
        pb(eBag, 'charDark', EF + 740, EF + 770, 5270, 7480,
           L.f1 + 2.38, L.f1 + 2.62);

        // --- 5. Slab-Edge Fascia Warm Accent Strips ---
        // Bold warm accent line (80mm tall) at bottom of existing charDark fascia
        // FF fascia
        pb(eBag, 'accentWarm', eastX[1] - 100, eastX[1] + 20, -10, 9890,
           L.f1 - 0.53, L.f1 - 0.45); // east edge
        pb(eBag, 'accentWarm', -20, eastX[1] + 20, 9770, 9890,
           L.f1 - 0.53, L.f1 - 0.45); // north edge
        // SF fascia
        pb(eBag, 'accentWarm', eastX[1] - 100, eastX[1] + 20, -10, 9890,
           L.f2 - 0.53, L.f2 - 0.45);
        pb(eBag, 'accentWarm', -20, eastX[1] + 20, 9770, 9890,
           L.f2 - 0.53, L.f2 - 0.45);

        // --- 6. Portico Column Accent Bands ---
        const colTopH = L.roof - L.slabT;
        for (const cy of [8720, 4290, 150]) {
          // Base accent band (120mm tall, extends 20mm beyond column each side)
          pb(eBag, 'accentWarm', 16280, 16620, cy - 170, cy + 170, 0, 0.12);
          // Capital accent band (120mm)
          pb(eBag, 'accentWarm', 16280, 16620, cy - 170, cy + 170,
             colTopH - 0.12, colTopH);
          // Mid-height accent band (60mm)
          const midH = colTopH * 0.5;
          pb(eBag, 'copingLight', 16285, 16615, cy - 165, cy + 165,
             midH - 0.03, midH + 0.03);
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

    })();
    const exterior = eBag.build(THREE, materials); exterior.name = 'exterior'; root.add(exterior);

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
      wallRun(bag, 'white', 'y', eY0d, Y1n, EB[0], EB[1], fY, cut, fY, Eo, 'charDark');
      wallRun(bag, 'white', 'x', X0 + 230, X1 - 230, NB[0], NB[1], fY, cut, fY, No, 'charDark');
      wallRun(bag, 'white', 'x', X0 + 230, sX1d, SB[0], SB[1], fY, cut, fY, So, 'charDark');
      wallRun(bag, 'white', 'y', Y0n, Y1n, WB[0], WB[1], fY, cut, fY, Wo, 'charDark');
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
        wallRun(bag, 'white2', w.dir, w.a[0], w.a[1], w.b[0], w.b[1], fY, cut, fY, ops, 'charDark');
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
        // portico context
        pb(bag, 'concrete', eastX[0], eastX[1], portY[0], portY[1], 0, L.porticoFl);
        pb(bag, 'tOut', eastX[0] + 60, eastX[1] - 60, portY[0] + 60, portY[1] - 60, L.porticoFl + 0.004, L.porticoFl + 0.012);
        pb(bag, 'paver', 12650, 14270, 2035, 3975, 0, L.pathFl);
        liftTower(bag, cut, [0.10]);
        // stair tower context (lower)
        pb(bag, 'charDark', towX[0], towX[1], 0, 230, 0, cut);
        stairRailing(bag, 'y', 15470, 3890, -1, 237.5, 9, L.porticoFl, RISE_E);
        flight(bag, 'concrete', 'y', 15470, 16370, 3890, -1, 237.5, 9, L.porticoFl, RISE_E);
        columnsEast(bag, cut);

        stairWalls(bag, 12);
        let st = 0.60;
        for (let i = 0; i < 3; i++) { pb(bag, 'concrete', 12650 + i * 300, 12950 + i * 300, 5580, 6780, L.porticoFl, st); st -= 0.15; }
        // furniture
        // master bed (head South, cupboards along entire West wall, window integrated)
        Fur.bed(bag, 2000, 3800, 230, 2230, fY, 'S');
        Fur.side(bag, 1500, 1900, 230, 730, fY); Fur.side(bag, 3900, 4300, 230, 730, fY);
        Fur.vastuWardrobe(bag, 230, 830, 230, 3663, fY, 2960, 1200, 1.10);
        // bed02 (head South, cupboards along entire West wall, window integrated)
        Fur.bed(bag, 1400, 3200, 5460, 7460, fY, 'S');
        Fur.side(bag, 900, 1300, 5460, 5960, fY); Fur.side(bag, 3300, 3700, 5460, 5960, fY);
        Fur.vastuWardrobe(bag, 230, 830, 5460, 8640, fY, 7000, 1200, 1.10);
        // Hall (Living room) furniture layout
        Fur.sofa(bag, 4920, 5620, 6200, 8640, fY, 'W', false, true);             // L-sofa long side on West wall
        Fur.sofa(bag, 5620, 7420, 7940, 8640, fY, 'N', true, false);             // L-sofa short side on North wall
        Fur.chair(bag, 6000, 5800, fY, 'N');                        // side sofa chair 1 on South facing North
        Fur.chair(bag, 7000, 5800, fY, 'N');                        // side sofa chair 2 on South facing North
        Fur.table(bag, 5900, 7100, 6600, 7400, fY, 0.42);           // centered coffee table
        Fur.tv(bag, 'y', 9320, 6300, 7700, fY);                     // re-centered TV
        // Crockery Unit on the Dining West Wall (2350..3650)
        pb(bag, 'woodD', 4920, 5320, 2350, 3650, fY, fY + 0.85);
        pb(bag, 'woodF', 4910, 5330, 2340, 3660, fY + 0.85, fY + 0.89);
        pb(bag, 'woodD', 4920, 5240, 2350, 3650, fY + 1.40, fY + 2.10);
        pb(bag, 'glass', 5242, 5260, 2350, 3650, fY + 1.40, fY + 2.10); // pane held proud of body (avoid coplanar z-fight)
        pb(bag, 'woodF', 4930, 5230, 2360, 3640, fY + 1.63, fY + 1.65);
        pb(bag, 'woodF', 4930, 5230, 2360, 3640, fY + 1.86, fY + 1.88);
        Fur.table(bag, 6500, 7700, 3300, 4100, fY, 0.74);           // dining (small 4-seater table)
        Fur.chair(bag, 6700, 3050, fY, 'N'); Fur.chair(bag, 7500, 3050, fY, 'N'); // south chairs
        Fur.chair(bag, 6700, 4350, fY, 'S'); Fur.chair(bag, 7500, 4350, fY, 'S'); // north chairs
        // Pooja unit (cupboard in NE corner raised to match other full-height cupboards)
        pb(bag, 'woodD', 11620, 12420, 3427, 4027, fY, fY + 2.36);
        pb(bag, 'woodF', 11600, 12440, 3407, 4047, fY + 2.36, fY + 2.40);
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
        // Office Furniture (oriented North, aligned with the South wall)
        Fur.table(bag, 10150, 11750, 5200, 6100, fY, 0.74, 'counterTop'); // desk oriented East-West
        Fur.executiveChair(bag, 10950, 4700, fY, 'N');                     // executive chair facing North
        Fur.chair(bag, 10450, 6700, fY, 'S'); Fur.chair(bag, 11450, 6700, fY, 'S'); // client chairs facing South
        Fur.shelves(bag, 9487, 9887, 4500, 6500, fY);                     // shelves along West wall close to desk

        Fur.basin(bag, 4920, 5820, 1716, 2216, fY); Fur.mirror(bag, 4920, 5820, 2204, 2216, fY); Fur.wc(bag, 5370, 515, fY, 'N');
        Fur.shower(bag, 5820, 5850, 230, 1130, fY); Fur.showerHead(bag, 6301, 230, fY, 'N');
        Fur.wc(bag, 1600, 5060, fY, 'S'); Fur.shower(bag, 1130, 1160, 4445, 5345, fY); Fur.showerHead(bag, 680, 5345, fY, 'S');
        Fur.basin(bag, 2400, 3100, 4945, 5345, fY, 'N'); Fur.mirror(bag, 2400, 3100, 5333, 5345, fY);                 // handwash counter
      }

      if (fi === 1) {
        // FF East & South Balcony Slabs (with lift shaft cutout)
        drawFFSlab(bag, fY - L.slabT, fY);

        // Balcony tile finishes (with lift shaft cutout)
        drawFFTiles(bag, 'tOut', fY + 0.004, fY + 0.012);

        // service band openings in the outer south wall (y -762..-646):
        // utility grill, common-bath ventilator, wet-kitchen grill
        glazing(bag, { face: 'S', band: [-762, -646], floorY: fY, c: 6527, w: 3215, sill: 900, h: 1400, type: 'grill' });
        glazing(bag, { face: 'S', band: [-762, -646], floorY: fY, c: 8810, w: 600, sill: 1700, h: 600, type: 'win', panes: 1 });
        glazing(bag, { face: 'S', band: [-762, -646], floorY: fY, c: 11205, w: 2430, sill: 900, h: 1400, type: 'grill' });
        // utility SW grill door onto the bedroom south balcony
        glazing(bag, { face: 'W', band: [4805, 4920], floorY: fY, c: -207, w: 800, sill: 0, h: 2400, type: 'grill', door: true });

        // North Balcony Slabs & Floor Finishes
        pb(bag, 'white', 0, 17362, Y1n, Y1n + 1000, fY - L.slabT, fY);
        pb(bag, 'tOut', 60, 17302, Y1n, Y1n + 1000 - 60, fY + 0.004, fY + 0.012);
        liftTower(bag, cut, [fY]);
        columnsEast(bag, cut);
        railing(bag, 'x', -762, 0, 4805, fY, 1.0); // south balcony railing (west of service bands)
        railing(bag, 'y', 0, -762, 0, fY, 1.0); // south balcony west end cap
        railing(bag, 'x', -762, 12650, 17362, fY, 1.0); // portico-top south edge railing
        railing(bag, 'y', 17282, -762, 9790, fY, 1.0); // continuous outer east edge
        railing(bag, 'y', 14240, 1040, 3890, fY, 1.0); // Flight 2 west safety railing
        railing(bag, 'y', 15400, 1040, 3890, fY, 1.0); // Flight 2 east safety railing
        railing(bag, 'x', 1040, 14240, 15400, fY, 1.0); // Flight 2 south safety railing
        railing(bag, 'x', 9790, 80, 17282, fY, 1.0); // north balcony railing
        railing(bag, 'y', 80, 8870, 9790, fY, 1.0); // north balcony west railing
        railing(bag, 'y', 14240, 2035, 3890, fY, 1.0); // stair void west
        railing(bag, 'y', 15400, 2035, 3890, fY, 1.0); // stair void east
        // Safety railings
        stairRailing(bag, 'y', 14500, 1040 + 8 * 237.5, 1, 237.5, 4, L.porticoFl + (13 + 8) * RISE_E, RISE_E);
        railing(bag, 'y', 14500, 3890, 4140, fY, 0.95);
        railing(bag, 'x', 3890, 14240, 14500, fY, 0.95); // entrance safety cross-rail
        railing(bag, 'x', 2035, 14240, 15400, fY, 1.0); // stair void south
        // internal stair: flight A + landing + flight B (partial)
        stairRailing(bag, 'x', 7496, 4630, -1, 330, 10, fY, RISE_I);
        railing(bag, 'y', 1330, 7496, 7641, fY + 11 * RISE_I, 0.95);
        stairRailing(bag, 'x', 7641, 1330, 1, 330, 4, fY + 11 * RISE_I, RISE_I);
        flight(bag, 'concrete', 'x', 6496, 7496, 4630, -1, 330, 10, fY, RISE_I);
        pb(bag, 'concrete', 230, 1330, 6496, 8641, fY + 11 * RISE_I - 0.32, fY + 11 * RISE_I);
        flight(bag, 'concrete', 'x', 7641, 8641, 1330, 1, 330, 4, fY + 11 * RISE_I, RISE_I);
        // furniture
        // --- Master Bedroom 01 (head South, vastuWardrobe on West wall) ---
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
        // --- Hall (TV on North wall, L-sofa against West wall, compact seating shifted further West) ---
        Fur.tvFeatureWall(bag, 6020, 8241, 8622, 8642, fY, 3.353, true);
        Fur.console(bag, 6430, 7830, 8222, 8642, fY);               // TV console centered on solid North wall
        Fur.tv(bag, 'x', 8580, 6530, 7730, fY);                     // TV facing south
        Fur.sofa(bag, 4920, 5620, 4800, 6400, fY, 'W', true, false);             // L-sofa long side against West wall
        Fur.sofa(bag, 5620, 7220, 4800, 5500, fY, 'S', true, false);             // L-sofa short side against South boundary
        Fur.sofa(bag, 7900, 8700, 5400, 6200, fY, 'E');             // South sofa chair facing west
        Fur.sofa(bag, 7900, 8700, 6600, 7400, fY, 'E');             // North sofa chair facing west
        // Round Coffee Table (pedestal base + glass top)
        bag.cyl('woodD', 6600 / 1000, fY + 0.20, -6200 / 1000, 0.08, 0.40);
        bag.cyl('glass', 6600 / 1000, fY + 0.415, -6200 / 1000, 0.45, 0.03);
        // --- Dining (8-seater) ---
        Fur.table(bag, 6200, 8000, 2400, 3450, fY, 0.74);           // 6-seater dining table
        for (const dx of [6650, 7550]) { Fur.chair(bag, dx, 1950, fY, 'N'); Fur.chair(bag, dx, 3900, fY, 'S'); }
        Fur.chair(bag, 5750, 2925, fY, 'E'); Fur.chair(bag, 8450, 2925, fY, 'W');
        // Crockery unit against the west wall (freed up by moving bedroom door)
        Fur.crockeryUnit(bag, 4920, 5370, 1530, 3300, fY);
        // --- Kitchen (redesign: only the EAST WALL-MOUNTED cabinets are
        //     removed; the base counter, hob, sink and extractor stay on the
        //     east wall in their original place. Pantry moved to the south-west
        //     corner; more cupboards added on the south wall; breakfast bar
        //     relocated to clear the pantry) ---
        Fur.counterX(bag, 11262, 11800, 1539, 2139, fY);            // south counter run (east of the entrance)
        Fur.counterX(bag, 11800, 12408, 1539, 4933, fY);            // east counter run (original place, kept)

        // East counter base cabinet doors/drawers (facing West, proud at X = 11790..11800)
        pb(bag, 'woodD', 11790, 11800, 1550, 2090, fY + 0.04, fY + 0.80); // Door 1
        bag.cyl('brass', 11785 / 1000, fY + 0.46, -2050 / 1000, 0.006, 0.08); // Handle 1
        // Pot drawers under the hob (Y = 2150..2650)
        pb(bag, 'woodD', 11790, 11800, 2150, 2650, fY + 0.04, fY + 0.40); // Lower drawer
        pb(bag, 'brass', 11785, 11790, 2350, 2450, fY + 0.20, fY + 0.23); // Lower handle
        pb(bag, 'woodD', 11790, 11800, 2150, 2650, fY + 0.44, fY + 0.80); // Upper drawer
        pb(bag, 'brass', 11785, 11790, 2350, 2450, fY + 0.60, fY + 0.63); // Upper handle
        // Door 2 (between stove and sink)
        pb(bag, 'woodD', 11790, 11800, 2710, 3290, fY + 0.04, fY + 0.80);
        bag.cyl('brass', 11785 / 1000, fY + 0.46, -2750 / 1000, 0.006, 0.08);
        // Door 3 (below sink)
        pb(bag, 'woodD', 11790, 11800, 3360, 3840, fY + 0.04, fY + 0.80);
        bag.cyl('brass', 11785 / 1000, fY + 0.46, -3400 / 1000, 0.006, 0.08);
        // Door 4
        pb(bag, 'woodD', 11790, 11800, 3910, 4440, fY + 0.04, fY + 0.80);
        bag.cyl('brass', 11785 / 1000, fY + 0.46, -3950 / 1000, 0.006, 0.08);
        // Door 5
        pb(bag, 'woodD', 11790, 11800, 4460, 4890, fY + 0.04, fY + 0.80);
        bag.cyl('brass', 11785 / 1000, fY + 0.46, -4500 / 1000, 0.006, 0.08);

        // Hob + sink + extractor stay on the east wall (original place)
        Fur.hob(bag, 12110, 2400, fY);                               // hob on east counter
        Fur.sink(bag, 12110, 3600, fY);                               // sink on east counter
        Fur.rangeHood(bag, 12110, 2400, fY);                         // extractor/chimney above the hob

        // East wall: the TOP (wall-mounted) cabinets are intentionally omitted
        // per request; only the base counter/cabinets remain on this wall.

        // Base cabinet doors on the South Counter (facing North, proud at Y = 2139..2149)
        pb(bag, 'woodD', 11280, 11460, 2139, 2149, fY + 0.04, fY + 0.80); // Left door
        bag.cyl('brass', 11440 / 1000, fY + 0.46, -2153 / 1000, 0.006, 0.08);
        pb(bag, 'woodD', 11480, 11660, 2139, 2149, fY + 0.04, fY + 0.80); // Mid door
        bag.cyl('brass', 11640 / 1000, fY + 0.46, -2153 / 1000, 0.006, 0.08);
        pb(bag, 'woodD', 11680, 11780, 2139, 2149, fY + 0.04, fY + 0.80); // Right door
        bag.cyl('brass', 11760 / 1000, fY + 0.46, -2153 / 1000, 0.006, 0.08);
        // Upper wall cabinets above the South Counter (facing North) — extra
        // storage requested along the south wall.
        pb(bag, 'woodD', 11262, 12000, 1539, 2139, fY + 1.40, fY + 2.36); // cabinet body
        pb(bag, 'woodF', 11274, 11988, 1551, 2127, fY + 2.36, fY + 2.40); // cabinet crown
        pb(bag, 'woodD', 11272, 11620, 2149, 2159, fY + 1.44, fY + 2.32); // Door 1 (faces North)
        pb(bag, 'woodD', 11640, 11990, 2149, 2159, fY + 1.44, fY + 2.32); // Door 2 (faces North)
        bag.cyl('brass', 11605 / 1000, fY + 1.60, -2154 / 1000, 0.006, 0.08);
        bag.cyl('brass', 11975 / 1000, fY + 1.60, -2154 / 1000, 0.006, 0.08);

        // Refrigerator in the North-West corner facing South
        Fur.fridge(bag, 9486, 10350, 4245, 4945, fY);
        pb(bag, 'chrome', 10100, 10130, 4230, 4245, fY + 0.50, fY + 1.20);            // fridge handle (opening faces south)

        // Pantry unit in the SOUTH-WEST corner (against the west wall, facing
        // East into the room). Moved here from beside the fridge.
        pb(bag, 'woodD', 9370, 10070, 1527, 2297, fY, fY + 2.36);                     // pantry main body
        pb(bag, 'woodF', 9360, 10082, 1517, 2307, fY + 2.36, fY + 2.40);              // pantry top crown
        // Pantry double vertical doors (facing East, proud at X = 10070..10082)
        pb(bag, 'woodD', 10070, 10082, 1540, 1900, fY + 0.04, fY + 2.32); // Left pantry door
        pb(bag, 'woodD', 10070, 10082, 1920, 2280, fY + 0.04, fY + 2.32); // Right pantry door
        pb(bag, 'brass', 10084, 10092, 1720, 1730, fY + 0.90, fY + 1.20); // Left pull handle
        pb(bag, 'brass', 10084, 10092, 2100, 2110, fY + 0.90, fY + 1.20); // Right pull handle

        Fur.counterX(bag, 10350, 11800, 4345, 4945, fY);                               // north base counter (extended to the fridge)
        // Base cabinet doors on the North Counter (facing South, proud at Y = 4335..4345)
        pb(bag, 'woodD', 10370, 10760, 4335, 4345, fY + 0.04, fY + 0.80); // Door 1
        bag.cyl('brass', 10740 / 1000, fY + 0.46, -4330 / 1000, 0.006, 0.08);
        pb(bag, 'woodD', 10780, 11170, 4335, 4345, fY + 0.04, fY + 0.80); // Door 2
        bag.cyl('brass', 11150 / 1000, fY + 0.46, -4330 / 1000, 0.006, 0.08);
        pb(bag, 'woodD', 11190, 11580, 4335, 4345, fY + 0.04, fY + 0.80); // Door 3
        bag.cyl('brass', 11560 / 1000, fY + 0.46, -4330 / 1000, 0.006, 0.08);
        pb(bag, 'woodD', 11600, 11780, 4335, 4345, fY + 0.04, fY + 0.80); // Door 4
        bag.cyl('brass', 11760 / 1000, fY + 0.46, -4330 / 1000, 0.006, 0.08);

        // Upper wall cabinets above the North Counter (facing South)
        pb(bag, 'woodD', 10350, 12000, 4595, 4945, fY + 1.40, fY + 2.36); // cabinet body
        pb(bag, 'woodF', 10362, 11988, 4607, 4933, fY + 2.36, fY + 2.40); // cabinet crown
        pb(bag, 'woodD', 10360, 10715, 4585, 4595, fY + 1.44, fY + 2.32); // Door 1
        pb(bag, 'woodD', 10735, 11090, 4585, 4595, fY + 1.44, fY + 2.32); // Door 2
        pb(bag, 'woodD', 11110, 11465, 4585, 4595, fY + 1.44, fY + 2.32); // Door 3
        pb(bag, 'woodD', 11485, 11840, 4585, 4595, fY + 1.44, fY + 2.32); // Door 4
        pb(bag, 'woodD', 11860, 11990, 4585, 4595, fY + 1.44, fY + 2.32); // Door 5
        bag.cyl('brass', 10700 / 1000, fY + 1.60, -4580 / 1000, 0.006, 0.08);
        bag.cyl('brass', 11075 / 1000, fY + 1.60, -4580 / 1000, 0.006, 0.08);
        bag.cyl('brass', 11450 / 1000, fY + 1.60, -4580 / 1000, 0.006, 0.08);
        bag.cyl('brass', 11825 / 1000, fY + 1.60, -4580 / 1000, 0.006, 0.08);
        bag.cyl('brass', 11975 / 1000, fY + 1.60, -4580 / 1000, 0.006, 0.08);
        // --- Breakfast Counter (west-wall cantilever, relocated north of the
        //     SW-corner pantry so both fit; it originally sat in this corner) ---
        pb(bag, 'counterTop', 9071, 9686, 2300, 2800, fY + 0.86, fY + 0.90);
        pb(bag, 'woodD', 9350, 9400, 2300, 2800, fY, fY + 0.86);                      // supporting wall base
        // --- Foyer ---
        Fur.console(bag, 11000, 12300, 5160, 5560, fY);             // foyer console table
        // --- Pooja ---
        // 1. Traditional Wood Mandir Cabinet (centered on East wall)
        // Base drawer cabinet (height 0.45m)
        pb(bag, 'woodD', 11968, 12418, 7530, 8530, fY, fY + 0.45);
        // Double drawer fronts facing West (room entrance side)
        pb(bag, 'woodD', 11960, 11968, 7540, 8010, fY + 0.08, fY + 0.38);
        pb(bag, 'woodD', 11960, 11968, 8050, 8520, fY + 0.08, fY + 0.38);
        // Brass knobs
        bag.cyl('brass', 11955 / 1000, fY + 0.23, -7775 / 1000, 0.008, 0.012, 0, 0, Math.PI/2);
        bag.cyl('brass', 11955 / 1000, fY + 0.23, -8285 / 1000, 0.008, 0.012, 0, 0, Math.PI/2);

        // Countertop plate with wooden molding profile
        pb(bag, 'woodF', 11950, 12418, 7510, 8550, fY + 0.45, fY + 0.49);

        // Back wooden wall with glowing backlit panel effect
        pb(bag, 'woodD', 12390, 12418, 7530, 8530, fY + 0.49, fY + 1.55);
        pb(bag, 'accentWarm', 12380, 12390, 7560, 8500, fY + 0.52, fY + 1.52);

        // Corner brass support pillars supporting the canopy
        bag.cyl('brass', 12000 / 1000, fY + 1.02, -7570 / 1000, 0.02, 1.06); // SW pillar
        bag.cyl('brass', 12000 / 1000, fY + 1.02, -8490 / 1000, 0.02, 1.06); // NW pillar

        // Side Jali Screens (thin horizontal brass bars)
        for (let h = 0.65; h <= 1.45; h += 0.20) {
          pb(bag, 'brass', 12000, 12380, 7530 - 10, 7530 + 10, fY + h, fY + h + 0.015); // South side bars
          pb(bag, 'brass', 12000, 12380, 8530 - 10, 8530 + 10, fY + h, fY + h + 0.015); // North side bars
        }

        // Stepped Gopuram / Shikhara Dome (Temple top canopy)
        pb(bag, 'woodD', 11950, 12418, 7510, 8550, fY + 1.55, fY + 1.62); // canopy roof
        pb(bag, 'woodF', 12020, 12418, 7600, 8460, fY + 1.62, fY + 1.70); // stepped base
        pb(bag, 'woodD', 12100, 12418, 7700, 8360, fY + 1.70, fY + 1.76); // stepped top
        // Brass Kalasam Spire
        bag.cyl('brass', 12225 / 1000, fY + 1.83, -8030 / 1000, 0.035, 0.14);
        bag.sph('brass', 12225 / 1000, fY + 1.92, -8030 / 1000, 0.025);

        // 2. Altar Setup & Detailed Deity
        // Brass Deity Statue (Ganesha / Lakshmi posture)
        pb(bag, 'brass', 12160, 12290, 7930, 8130, fY + 0.49, fY + 0.54); // double pedestal
        pb(bag, 'brass', 12190, 12260, 7960, 8100, fY + 0.54, fY + 0.60); // seated base
        bag.cyl('brass', 12225 / 1000, fY + 0.68, -8030 / 1000, 0.045, 0.16); // body/torso
        bag.sph('brass', 12225 / 1000, fY + 0.81, -8030 / 1000, 0.035);      // head
        bag.cyl('brass', 12225 / 1000, fY + 0.88, -8030 / 1000, 0.02, 0.10);  // crown (Mukut)
        pb(bag, 'brass', 12250, 12260, 7910, 8150, fY + 0.58, fY + 0.90);    // Prabhavali back halo

        // Flanking oil lamps (diyas) with glowing warm light
        bag.cyl('brass', 12150 / 1000, fY + 0.59, -7780 / 1000, 0.025, 0.20); // Left stand
        bag.cyl('lamp', 12150 / 1000, fY + 0.70, -7780 / 1000, 0.015, 0.03);  // Left flame
        bag.cyl('brass', 12150 / 1000, fY + 0.59, -8280 / 1000, 0.025, 0.20); // Right stand
        bag.cyl('lamp', 12150 / 1000, fY + 0.70, -8280 / 1000, 0.015, 0.03);  // Right flame

        // Brass offering plate with colorful flower spheres
        pb(bag, 'brass', 12040, 12120, 7950, 8110, fY + 0.49, fY + 0.50); // plate
        bag.sph('boug', 12060 / 1000, fY + 0.51, -7990 / 1000, 0.012);      // pink flower
        bag.sph('ixora', 12100 / 1000, fY + 0.51, -8070 / 1000, 0.012);     // yellow/orange flower
        bag.sph('whiteG', 12080 / 1000, fY + 0.51, -8030 / 1000, 0.012);    // white flower

        // 3. Hanging Ceiling Bell (traditional suspended bell)
        bag.cyl('brass', 11650 / 1000, fY + 2.65, -8030 / 1000, 0.006, 1.10); // chain from ceiling (3.20m to 2.10m)
        bag.cyl('brass', 11650 / 1000, fY + 2.05, -8030 / 1000, 0.05, 0.10);  // bell body
        bag.cyl('brass', 11650 / 1000, fY + 1.97, -8030 / 1000, 0.012, 0.06); // bell clapper
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
        // East & South Balcony Slabs & Floor Finishes (with cutout voids for Stairs, Duplex, and Lift)
        drawSFSlab(bag, fY - L.slabT, fY);
        drawSFTiles(bag, 'tOut', fY + 0.004, fY + 0.012);

        // North Balcony Slabs & Floor Finishes
        pb(bag, 'white', 0, 17362, Y1n, Y1n + 1000, fY - L.slabT, fY);
        pb(bag, 'tOut', 60, 17302, Y1n, Y1n + 1000 - 60, fY + 0.004, fY + 0.012);
        liftTower(bag, cut, [fY]);
        columnsEast(bag, cut);
        railing(bag, 'x', -762, 0, 17362, fY, 1.0); // full south balcony railing
        railing(bag, 'y', 0, -762, 0, fY, 1.0); // south balcony west end cap
        railing(bag, 'y', 17282, -762, 9790, fY, 1.0); // continuous outer east edge extended
        railing(bag, 'x', 9790, 80, 17282, fY, 1.0); // north balcony railing
        railing(bag, 'y', 80, 8870, 9790, fY, 1.0); // north balcony west railing
        // Duplex void safety railings overlooking the first floor hall
        railing(bag, 'y', 6020, 6000, 8641, fY, 1.0); // West edge (West gallery)
        railing(bag, 'x', 6000, 6020, 8241, fY, 1.0); // South edge (corridor)
        railing(bag, 'y', 8241, 6000, 8641, fY, 1.0); // East edge (Family Room border)
        Fur.tvFeatureWall(bag, 6020, 8241, 8622, 8642, fY, 3.353, false);
        Fur.planter(bag, 16280, 8430, fY, 1.1);
        Fur.planter(bag, 16280, 2450, fY, 1.1);
        Fur.lounger(bag, 15050, 16350, 5500, 6280, fY);
        Fur.lounger(bag, 15050, 16350, 6600, 7380, fY);
        // stairwell: flight B (from below) visible in void, arrival, flight A' up to landing, landing, flight B' up to roof, safety railings
        stairRailing(bag, 'x', 7641, 1330, 1, 330, 10, L.f1 + 11 * RISE_I, RISE_I);
        railing(bag, 'y', 1330, 7496, 7641, L.f1 + 11 * RISE_I, 0.95);
        flight(bag, 'concrete', 'x', 7641, 8641, 1330, 1, 330, 10, L.f1 + 11 * RISE_I, RISE_I);
        pb(bag, 'concrete', 230, 1330, 6496, 8641, L.f1 + 11 * RISE_I - 0.32, L.f1 + 11 * RISE_I);

        // flight A' going up from second floor to landing
        flight(bag, 'concrete', 'x', 6496, 7496, 4630, -1, 330, 10, fY, RISE_I);
        stairRailing(bag, 'x', 7496, 4630, -1, 330, 10, fY, RISE_I);

        // landing between second floor and roof
        pb(bag, 'concrete', 230, 1330, 6496, 8641, fY + 11 * RISE_I - 0.32, fY + 11 * RISE_I);
        railing(bag, 'y', 1330, 7496, 7641, fY + 11 * RISE_I, 0.95);

        // flight B' going up from landing to roof
        flight(bag, 'concrete', 'x', 7641, 8641, 1330, 1, 330, 10, fY + 11 * RISE_I, RISE_I);
        stairRailing(bag, 'x', 7641, 1330, 1, 330, 10, fY + 11 * RISE_I, RISE_I);

        railing(bag, 'y', 4630, 7496, 7641, fY, 0.95);

        // arrival platform at roof level inside the mumty
        pb(bag, 'concrete', 4630, 5600, 6496, 8641, L.roof - L.slabT, L.roof);
        // --- Master Bedroom 02 (head South, vastuWardrobe on West wall) ---
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
        Fur.bed(bag, 9100, 11000, 232, 1832, fY, 'S');              // bed03
        Fur.side(bag, 8600, 9020, 232, 652, fY); Fur.side(bag, 11100, 11520, 232, 652, fY);
        Fur.vastuWardrobe(bag, 11820, 12420, 232, 4432, fY, 3200, 1200, 1.10); // East wall wardrobe wrapping around window
        Fur.shelves(bag, 5000, 7540, 2850, 3100, fY);                // walk-in 03
        Fur.shelves(bag, 5000, 5300, 1950, 2850, fY);
        Fur.shower(bag, 5820, 5850, 230, 1130, fY); Fur.showerHead(bag, 5370, 230, fY, 'N');                  // West: shower partition
        Fur.wc(bag, 6295, 515, fY, 'N');                              // Middle: WC facing North
        Fur.basin(bag, 6770, 7620, 230, 780, fY, 'S'); Fur.mirror(bag, 6770, 7620, 230, 242, fY);                    // East: vanity counter
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

    // warm accent entries at the two pooja diya flames (FF pooja room);
    // flagged `warm: true` — they sit at flame height, not ceiling height
    lights.push({ x: 12.150, y: L.f1 + 0.72, z: -7.780, floor: 1, warm: true });
    lights.push({ x: 12.150, y: L.f1 + 0.72, z: -8.280, floor: 1, warm: true });

    return {
      root, site, exterior, floors: floorsOut, views, lights,
      LEVELS: L, COLORS: C,
      bounds: { minX: -3, maxX: 24.5, minZ: -21, maxZ: 3, minY: 0, maxY: 14 }
    };
  }

  return { build, LEVELS: L, COLORS: C };
})();
