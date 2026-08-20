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
  // STAIR_RAIL_FIX_20260812f
  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = 'STAIR_RAIL_FIX_20260812f';

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
     V33 colour discipline, carried in from elevations/version-thirty-three.

     three.js r128 has no ColorManagement: material hexes are shaded as LINEAR.
     Palettes written as sRGB paint therefore render a stop too bright and every
     dark becomes putty. buildMaterials() converts sRGB → linear so these
     swatches read as authored.

     Value range sits HIGH. Contrast comes from shadow, a quiet sand-float on
     east walls, and small dark frames — not from colour patches.
       BODY   lime-white plaster
       EAST   same ivory, sand-float / sponge-float grit
       LINE   thin brass / stone coping
       PUNCT  soft charcoal frames + light glass

     HEXES MUST STAY UNIQUE. walkthrough.html reverse-maps each material's
     colour back to a palette name (hex2name, first key per hex wins), so a
     shared hex silently drops the later key's re-skin treatment. V33's own
     palette had twelve such collisions; each is nudged by one LSB below and
     marked `dedupe` — the shift is invisible, the lookup is not. */
  const C = {
    white:   0xece7db,  // BODY — inspiration off-white (Upparapalli house)
    white2:  0xf3efe6,  // BODY — same off-white, slightly lighter soffits / reveals
    fin:     0xd6c9ae,  // east verticals only — lime, not chalk
    fin2:    0xded2b8,  // east vertical mullions — near-white
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
    paver:   0x878178,  // driveway
    paver2:  0x777168,
    concrete:0x706d68,  // stair / yard — warm concrete
    terraceF:0x706d69,  // terrace limestone            (dedupe vs concrete)
    balcTile:0x706d67,  // FF/SF decks — pale stone     (dedupe vs concrete)
    solar:   0x2a3038,  // recedes
    solarFrm:0x3a3530,
    tank:    0xece7dc,  //                              (dedupe vs white)
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
    tKitch:  0xd4cec0, tUtil: 0xc8c4bc, tOut:   0x706d6a, // tOut dedupe vs concrete
    tCirc:   0xd4cec1, tOffice: 0xd4cebf, tPooja: 0xe2d8c4, // tCirc/tOffice dedupe vs tKitch
    tWalk:   0xd8d2c5,                                      // dedupe vs tLiving
    // furniture
    fabric:  0xc4bbae, fabric2: 0x8a847a, woodF: 0x5c4030,
    woodD:   0x3e2c20, mattress:0xeee8dc, pillow: 0xf4efe6,
    bedding: 0xcfc9bc, whiteG: 0xf4efe7, dark: 0x2a2723,   // whiteG dedupe vs pillow
    tv:      0x0b0c0d, rug: 0xb6a98d, carBody: 0x83888d,
    carDark: 0x1c1e20, lamp: 0xffd9a0, liftDoor:0xc8ccd1,
    counter: 0xeee8dd, counterTop: 0x4a4540,               // counter dedupe vs mattress
    tharRed: 0xb51a22, chrome: 0xd8d2c3,                   // chrome dedupe vs tLiving
    accentWarm: 0xc39a66, copingLight: 0xe6dfd1,
    liftSteel: 0xb8bdc2,
    liftChrome: 0xf0f2f4,
    // realism pass (unique hexes for walkthrough colour lookup)
    skirt:   0x5f594f,
    curtain: 0xd4cec2,   // dedupe vs tKitch
    curtain2:0xc4bbaf,   // dedupe vs fabric
    downlight:0xf4ead2,
    coveLED: 0xffe3b4,   // concealed indirect strip — never seen direct
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

  /* materials: key -> spec; emissive optional */
  function buildMaterials(THREE) {
    const M = {};
    // r128 shades material colours as LINEAR. The palette above is authored as
    // sRGB paint, so convert or every value renders a stop bright.
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
    // Color = C.lamp so walkthrough hex→name resolves 'lamp' for night boost
    mk('lamp', C.lamp, { emissive: srgb(C.lamp), emissiveIntensity: 2.4, roughness: 0.55 });
    // Concealed cove / valance strip. Low emissive on purpose: the strip sits
    // behind a lip and is read via the light it throws on the ceiling, never
    // head-on. Driving this hot is what turns a cove into a glare bar.
    mk('coveLED', C.coveLED, { emissive: srgb(C.coveLED), emissiveIntensity: 1.05, roughness: 0.6 });
    // Surface family tuning — one coherent material language
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
    // V33 made `chrome` matte (0.58/0.1) because in an exterior-only model it
    // only ever appeared on car and lift trim, where a matte value recedes.
    // Here it is a plumbing/fixture finish on 89 surfaces — taps, mixers,
    // handles, rail caps — so it keeps a real metallic response in V33's value
    // range. Lift trim uses liftChrome instead.
    M.chrome.roughness = 0.18; M.chrome.metalness = 0.85;
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
        // V33 used a flat (x+z, y) projection. That is fine on an exterior-only
        // model where the only mapped materials are vertical plaster, but here
        // `white` is also every floor slab and soffit, and on a horizontal face
        // (x+z, y) collapses v to a constant — the grain smears into streaks.
        // Dominant-normal box projection instead, the same one walkthrough.html
        // computes for itself. Metre units; material repeat does the tiling.
        const nx = Math.abs(tmp.n.x), ny = Math.abs(tmp.n.y), nz = Math.abs(tmp.n.z);
        if (ny >= nx && ny >= nz) b.uv.push(tmp.v.x, tmp.v.z);
        else if (nx >= nz) b.uv.push(tmp.v.z, tmp.v.y);
        else b.uv.push(tmp.v.x, tmp.v.y);
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
      cone: (mat, cx, cy, cz, r, h) => place(mat, coneG, cx, cy, cz, r, h, r),
      branch: (mat, x0, y0, z0, x1, y1, z1, r0, r1) => {
        const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (len < 0.0005) return;
        ps.set((x0 + x1) * 0.5, (y0 + y1) * 0.5, (z0 + z1) * 0.5);
        tmp.v.set(dx / len, dy / len, dz / len);
        q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tmp.v);
        const r = (r0 + (r1 || r0)) * 0.5;
        sc.set(r, len, r);
        m4.compose(ps, q, sc);
        add(mat, cylG, m4);
      },
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
        // Solid MS kick panel at the base (450 mm — harder to pry)
        put('ms', i0, i1, gD0 + 3, gD1 - 3, b + 0.055, b + 0.45);
        // Vertical grille bars over the glazed portion (100 mm pitch — thief-proof)
        const ulen = i1 - i0;
        const nv = Math.max(3, Math.round(ulen / 100));
        for (let i = 1; i < nv; i++) {
          const a = i0 + (ulen * i) / nv;
          put('ms', a - 8, a + 8, gD0, gD1, b + 0.45, t - 0.055);
        }
        // Horizontal grille bars, split around the lock rail
        for (const seg of [[b + 0.45, mR - 0.045], [mR + 0.045, t - 0.055]]) {
          const hs = seg[1] - seg[0];
          const nh = Math.max(1, Math.round(hs / 0.32));
          for (let i = 1; i < nh; i++) {
            const hh = seg[0] + (hs * i) / nh;
            put('ms', i0, i1, gD0, gD1, hh - 0.008, hh + 0.008);
          }
        }
        // Lock guard plate — solid MS sheet across the lock zone; blocks any
        // hand from reaching through the grille to operate the lever or deadbolt
        put('ms', i0, i1, fD0, fD1, b + 0.75, b + 1.55);
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
        // Deadbolt above the lever lock — second locking point
        put('steel', hx0 - 40, hx1, fD0 - 6, fD1 + 6, b + 1.35, b + 1.50);
        // Tower bolt at the door head (rod + slide bracket)
        put('ms', (i0 + i1) / 2 - 6, (i0 + i1) / 2 + 6, gD0, gD1, t - 0.20, t - 0.06);
        put('steel', (i0 + i1) / 2 - 16, (i0 + i1) / 2 + 16, fD0 - 2, fD1 + 2, t - 0.12, t - 0.06);
        // Foot bolt at the threshold (rod into the floor)
        put('ms', (i0 + i1) / 2 - 6, (i0 + i1) / 2 + 6, gD0, gD1, b + 0.06, b + 0.16);
        put('steel', (i0 + i1) / 2 - 16, (i0 + i1) / 2 + 16, fD0 - 2, fD1 + 2, b + 0.06, b + 0.11);
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

  /* Refined balcony railing: dark MS uprights + stainless handrail + mid rail.
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
  function railPillar(bag, x, y, base, h) {
    h = h || 1.05;
    const sit = base + 0.012;
    const half = 90;
    pb(bag, 'white2', x - half, x + half, y - half + 16, y + half - 16, sit, sit + h - 0.04);
    pb(bag, 'white2', x - half + 16, x + half - 16, y - half, y + half, sit, sit + h - 0.04);
    pb(bag, 'charDark', x - half - 12, x + half + 12, y - half - 12, y + half + 12,
      sit + h - 0.04, sit + h + 0.02);
  }
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

  /* ---- traditional RCC waist-slab flight (plain sloping soffit) ----
     flight() above builds each step as a deep block, so the underside comes out
     as a sawtooth — the open-tread look of a steel stair, not a cast one. A real
     Indian RCC stair is a single inclined slab (the waist) with the steps cast on
     top of it, so from below it reads as ONE clean slope and the steps only exist
     on the walking surface.

     dir 'y' runs along plan-y (slope in the world Y–Z plane, waist rotated about
     world X); dir 'x' runs along plan-x (slope in world X–Y, rotated about world
     Z). b0/b1 are the cross-band — the x-band for a 'y' flight, the y-band for an
     'x' one. Everything is plan-mm except the heights, which are metres like L. */
  function plainFlight(bag, mat, dir, b0, b1, aBot, zBot, aTop, zTop, n, waist, opts) {
    opts = opts || {};
    const run = Math.abs(aTop - aBot) / 1000;          // m, horizontal going
    const rise = zTop - zBot;                           // m, total climb
    if (run < 0.05 || Math.abs(rise) < 0.01) return;
    const len = Math.hypot(run, rise);
    const cosT = run / len, sinT = rise / len;
    const sign = aTop > aBot ? 1 : -1;                  // plan direction of climb
    const stepRise = rise / n, stepGo = (aTop - aBot) / n;
    const alongY = dir !== 'x';

    // --- the waist: one inclined slab, top face on the pitch line ---
    // Offsetting the centre straight DOWN by t/(2·cosθ) is the standard
    // construction that leaves the top face exactly on that line.
    const cyW = (zBot + zTop) / 2 - waist / (2 * cosT);
    if (alongY) {
      // world Z = −planY/1000, so climbing toward +Z needs a NEGATIVE rx
      const wBot = -aBot / 1000, wTop = -aTop / 1000;
      const rx = (wTop > wBot ? -1 : 1) * Math.atan2(rise, run);
      bag.box(mat, (b0 + b1) / 2000, cyW, (wBot + wTop) / 2,
              (b1 - b0) / 1000, waist, len, rx, 0, 0);
    } else {
      // world X = +planX/1000; local +X → (cos rz, sin rz, 0)
      const rz = Math.atan2(sinT, sign * cosT);
      bag.box(mat, (aBot + aTop) / 2000, cyW, -(b0 + b1) / 2000,
              len, waist, (b1 - b0) / 1000, 0, 0, rz);
    }

    // --- steps cast on top of it, then FINISHED ---
    // Each block only has to bridge from the pitch line to its own tread, so it
    // is one riser deep plus a little, not 320 mm. Anything it buries in the
    // waist is the same material and never seen.
    // opts.tread lays the tile course a finished building actually gets: bare
    // structural concrete is what this looks like on the day the shuttering
    // comes off, not on the day anyone moves in.
    const tt = opts.tread ? 0.012 : 0;
    // one box call for either axis: `a` is the running span, `b` the cross-band
    const slab = (m, aLo, aHi, h0, h1, inset) => {
      const i0 = inset || 0;
      if (alongY) pb(bag, m, b0 + i0, b1 - i0, aLo, aHi, h0, h1);
      else pb(bag, m, aLo, aHi, b0 + i0, b1 - i0, h0, h1);
    };
    for (let i = 1; i <= n; i++) {
      const top = zBot + i * stepRise;
      const aA = aBot + (i - 1) * stepGo, aB = aBot + i * stepGo;
      const lo = Math.min(aA, aB), hi = Math.max(aA, aB);
      slab(mat, lo, hi, top - stepRise - 0.045, top - tt);
      if (opts.tread) {
        // tile/timber going with a 12 mm nosing over the riser below
        const nLo = sign > 0 ? lo : lo - 12, nHi = sign > 0 ? hi + 12 : hi;
        slab(opts.tread, nLo, nHi, top - tt, top, 6);
        // skirting up the wall side of each step
        if (opts.skirt) {
          if (alongY) pb(bag, opts.tread, b1 - 6, b1, lo, hi, top, top + 0.09);
          else pb(bag, opts.tread, lo, hi, b1 - 6, b1, top, top + 0.09);
        }
      }
    }

    /* --- taper at the foot ---
       Where the waist meets the floor it would otherwise stop dead in a blunt
       150 mm end grain. Cast stairs are haunched here: the slab thickens into
       the floor and the arris dies out. Two short wedges read as that taper. */
    if (opts.foot !== false) {
      const aF = aBot - sign * 60;
      for (const [reach, dTop, dBot] of [[300, 0.35, 0.95], [620, 0.10, 0.55]]) {
        const e = aBot + sign * reach;
        slab(mat, Math.min(aF, e), Math.max(aF, e),
             zBot - waist * dBot, zBot + stepRise * dTop);
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
    const rTrunk = H * 0.038;
    const trunkH = H * 0.38;
    const pFork = { x: cx + (rnd() - 0.5) * 0.1, y: base + trunkH, z: cz + (rnd() - 0.5) * 0.1 };

    // 1. Root flare
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + rnd() * 0.5;
      const rx = Math.cos(a) * rTrunk * 2.2, rz = Math.sin(a) * rTrunk * 2.2;
      bag.branch('bark', cx + rx, base - 0.02, cz + rz, cx, base + trunkH * 0.30, cz, rTrunk * 0.35, rTrunk * 0.6);
    }
    // Main trunk
    bag.branch('bark', cx, base, cz, pFork.x, pFork.y, pFork.z, rTrunk * 1.1, rTrunk * 0.85);

    // 2. Primary boughs & foliage sub-canopies
    const nB = 4;
    for (let i = 0; i < nB; i++) {
      const a = (i / nB) * Math.PI * 2 + (rnd() - 0.5) * 0.6;
      const bReach = H * (0.28 + rnd() * 0.12);
      const bRise = H * (0.24 + rnd() * 0.10);
      const pBough = {
        x: pFork.x + Math.cos(a) * bReach,
        y: pFork.y + bRise,
        z: pFork.z + Math.sin(a) * bReach
      };
      bag.branch('bark', pFork.x, pFork.y, pFork.z, pBough.x, pBough.y, pBough.z, rTrunk * 0.65, rTrunk * 0.40);

      // Secondary branches
      const nSub = 2;
      for (let j = 0; j < nSub; j++) {
        const subA = a + (j === 0 ? -0.55 : 0.55) + (rnd() - 0.5) * 0.3;
        const subReach = H * (0.18 + rnd() * 0.08);
        const subRise = H * (0.16 + rnd() * 0.08);
        const pSub = {
          x: pBough.x + Math.cos(subA) * subReach,
          y: pBough.y + subRise,
          z: pBough.z + Math.sin(subA) * subReach
        };
        bag.branch('barkLight', pBough.x, pBough.y, pBough.z, pSub.x, pSub.y, pSub.z, rTrunk * 0.35, rTrunk * 0.18);

        // Foliage cluster anchored directly at this branch termination
        const fR = H * (0.22 + rnd() * 0.06);
        const fH = fR * 0.85;
        bag.blob('leafDark', pSub.x, pSub.y + fH * 0.2, pSub.z, fR, fH, fR * 0.95, subA, low);
        bag.blob('green', pSub.x + Math.cos(subA) * fR * 0.2, pSub.y + fH * 0.4, pSub.z + Math.sin(subA) * fR * 0.2, fR * 0.8, fH * 0.75, fR * 0.75, subA + 0.8, low);
        if (!low) {
          bag.blob('leafLight', pSub.x, pSub.y + fH * 0.6, pSub.z, fR * 0.55, fH * 0.5, fR * 0.5, subA + 1.6, true);
        }
      }
    }
    if (opts.flowering) {
      const nF = 6 + Math.round(rnd() * 4);
      for (let i = 0; i < nF; i++) {
        const a = rnd() * Math.PI * 2;
        const fm = ['boug', 'flowerPink', 'ixora'][Math.round(rnd() * 2)];
        bag.blob(fm,
          cx + Math.cos(a) * H * 0.32, base + trunkH + H * 0.35 + (rnd() - 0.2) * H * 0.25, cz + Math.sin(a) * H * 0.32,
          0.05, 0.04, 0.05, a, true);
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
    // Architectural Full-Slab Height Built-in Wardrobe / Almirah (floor to slab soffit)
    fullHeightWardrobe(bag, x0, x1, y0, y1, fY, slabH) {
      if (slabH === undefined) slabH = fY + 3.203;
      const isX = (x1 - x0 > y1 - y0);
      const W = isX ? (x1 - x0) : (y1 - y0);
      const D = isX ? (y1 - y0) : (x1 - x0);
      const faceWest = (!isX && x0 < 1000);
      const faceEast = (!isX && x0 > 7000);
      const faceNorth = (isX && y0 < 4000);

      function part(mat, u0, u1, v0, v1, z0, z1) {
        let lx0, lx1, ly0, ly1;
        if (isX) {
          lx0 = x0 + u0; lx1 = x0 + u1;
          if (faceNorth) {
            ly0 = y0 + v0; ly1 = y0 + v1;
          } else {
            ly0 = y1 - v1; ly1 = y1 - v0;
          }
        } else {
          ly0 = y0 + u0; ly1 = y0 + u1;
          if (faceWest) {
            lx0 = x0 + v0; lx1 = x0 + v1;
          } else {
            lx0 = x1 - v1; lx1 = x1 - v0;
          }
        }
        pb(bag, mat, lx0, lx1, ly0, ly1, z0, z1);
      }

      const hLoftSplit = fY + 2.30;
      const hTop = slabH;

      // 1. Carcass (rear face pushed 25mm into masonry wall to prevent coplanar z-fighting)
      part('woodD', 0, W, -25, D - 15, fY, hTop);
      
      // 2. Base plinth (80mm height)
      part('charDark', 0, W, 0, D - 8, fY, fY + 0.08);

      // 3. Doors & Lofts
      const numDoors = Math.max(2, Math.round(W / 520));
      const dw = W / numDoors;

      for (let i = 0; i < numDoors; i++) {
        const u0 = i * dw;
        const u1 = (i + 1) * dw;

        // Main lower shutter (proud 14mm)
        part('woodF', u0 + 6, u1 - 6, D - 15, D, fY + 0.08, hLoftSplit - 0.01);
        
        // Brass vertical bar handle (300mm length)
        const isLeftHandle = (i % 2 === 0);
        const handleU = isLeftHandle ? u1 - 24 : u0 + 24;
        part('brass', handleU - 6, handleU + 6, D, D + 12, fY + 0.95, fY + 1.25);

        // Top loft overhead storage shutter (running flush to slab soffit!)
        part('woodF', u0 + 6, u1 - 6, D - 15, D, hLoftSplit + 0.01, hTop - 0.02);
        
        // Loft brass square pull
        part('brass', handleU - 6, handleU + 6, D, D + 10, hLoftSplit + 0.15, hLoftSplit + 0.22);
      }

      // 4. Architectural top shadow gap trim meeting concrete slab soffit
      part('charDark', 0, W, 0, D + 2, hTop - 0.02, hTop);
    },
    wardrobe(bag, x0, x1, y0, y1, fY, slabH = fY + 3.203) {
      this.fullHeightWardrobe(bag, x0, x1, y0, y1, fY, slabH);
    },
    vastuWardrobe(bag, x0, x1, y0, y1, fY, winCenter, winWidth, sillH) {
      this.fullHeightWardrobe(bag, x0, x1, y0, y1, fY, fY + 3.203);
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

      const slabH = fY + 3.203;
      // Draw the open shelving wardrobe (full floor-to-slab height!)
      // 1. Back panel (thin, 15mm)
      addPart('woodF', 0, W, 0, 15, fY, slabH);
      
      // 2. End panels (left and right, depth D)
      addPart('woodF', 0, 18, 15, D, fY, slabH);
      addPart('woodF', W - 18, W, 15, D, fY, slabH);

      // 3. Intermediate vertical dividers (every ~600-800mm)
      const numBays = Math.max(1, Math.round(W / 700));
      const bayW = W / numBays;
      
      for (let i = 1; i < numBays; i++) {
        const uDivider = i * bayW;
        addPart('woodF', uDivider - 9, uDivider + 9, 15, D - 20, fY, slabH);
      }

      // Top ceiling crown / shadow trim at slab soffit
      addPart('charDark', 0, W, 0, D + 4, slabH - 0.02, slabH);

      // 4. Populate each bay with shelves, drawers, hanging rods, and top lofts!
      for (let i = 0; i < numBays; i++) {
        const u0 = i * bayW + (i === 0 ? 18 : 9);
        const u1 = (i + 1) * bayW - (i === numBays - 1 ? 18 : 9);
        
        // High-level Overhead Loft Shelves (luggage / quilts storage up to slab)
        addPart('woodF', u0, u1, 15, D - 15, fY + 2.30, fY + 2.33);
        addPart('woodF', u0, u1, 15, D - 15, fY + 2.75, fY + 2.78);
        // Suitcases / luggage boxes in loft
        addPart('fabric2', u0 + 40, u1 - 40, 30, D - 40, fY + 2.33, fY + 2.68);
        addPart('fabric', u0 + 50, u1 - 50, 30, D - 40, fY + 2.78, fY + 3.12);

        // Lower zone (under 2.30m)
        if (i % 2 === 0) {
          // Bay Type A: Lower drawer unit + Hanging space
          addPart('woodD', u0, u1, 15, D - 10, fY, fY + 0.82);
          addPart('woodF', u0 - 4, u1 + 4, 10, D, fY + 0.82, fY + 0.85); // top slab
          
          const numDrawers = 3;
          const dh = 0.82 / numDrawers;
          for (let j = 0; j < numDrawers; j++) {
            const hBottom = fY + j * dh + 0.02;
            const hTop = fY + (j + 1) * dh - 0.02;
            addPart('woodF', u0 + 10, u1 - 10, D - 12, D - 8, hBottom, hTop);
            const cx_local = (u0 + u1) / 2;
            addPart('brass', cx_local - 15, cx_local + 15, D - 8, D, hBottom + dh / 2 - 0.02, hBottom + dh / 2 + 0.02);
          }
          
          // Upper shelf
          addPart('woodF', u0, u1, 15, D - 15, fY + 1.85, fY + 1.88);
          
          // Steel hanging rod (horizontal cylinder)
          const rx_val = isX ? 0 : Math.PI / 2;
          const ry_val = 0;
          const rz_val = isX ? Math.PI / 2 : 0;
          
          const cx_global = isX ? (x0 + (u0 + u1) / 2) : (backWall === 'W' ? (x0 + D / 2) : (x1 - D / 2));
          const cy_global = fY + 1.70;
          const cz_global = isX ? (backWall === 'N' ? -(y1 - D / 2) : -(y0 + D / 2)) : -(y0 + (u0 + u1) / 2);
          
          const rodLength = (u1 - u0) / 1000;
          bag.cyl('steel', cx_global / 1000, cy_global, cz_global / 1000, 0.010, rodLength, rx_val, ry_val, rz_val);

          const numHangers = Math.max(1, Math.round((u1 - u0) / 100));
          const hw = (u1 - u0) / numHangers;
          for (let k = 0; k < numHangers - 1; k++) {
            const hu = u0 + (k + 1) * hw;
            addPart('fabric', hu - 12, hu + 12, 40, D - 60, fY + 0.90, fY + 1.65);
          }
        } else {
          // Bay Type B: Full-height shelves
          const numShelves = 5;
          const sh = 2.20 / numShelves;
          for (let j = 0; j <= numShelves; j++) {
            const hShelf = fY + j * sh;
            addPart('woodF', u0, u1, 15, D - 15, hShelf, hShelf + 0.03);
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
    },
    // ================= INDIAN RESIDENTIAL ELECTRICAL & HVAC KIT =================
    // 1. High-Wall Indoor Split AC Unit (Daikin / Voltas / Blue Star 1.5-2 Ton style)
    splitAC(bag, dir, fixed, a0, a1, fY, face) {
      const H = 0.28; // height in m
      const D = 210;  // depth in mm
      const mountY = fY + 2.45; // mounted high on wall near ceiling
      let x0, x1, y0, y1;
      if (dir === 'x') {
        x0 = Math.min(a0, a1); x1 = Math.max(a0, a1);
        if (face === 'N') { y0 = fixed; y1 = fixed + D; }
        else { y0 = fixed - D; y1 = fixed; }
      } else {
        y0 = Math.min(a0, a1); y1 = Math.max(a0, a1);
        if (face === 'E') { x0 = fixed; x1 = fixed + D; }
        else { x0 = fixed - D; x1 = fixed; }
      }
      // Main indoor casing (crisp white body)
      pb(bag, 'whiteG', x0, x1, y0, y1, mountY, mountY + H);
      // Top air intake grille trim
      pb(bag, 'charDark', x0 + 20, x1 - 20, y0 + 10, y1 - 10, mountY + H - 0.02, mountY + H);
      // Horizontal silver trim line across front face + discharge louver + LED temp display
      if (dir === 'x') {
        const fy = (face === 'N') ? y1 - 4 : y0;
        pb(bag, 'chrome', x0 + 15, x1 - 15, fy, fy + 4, mountY + 0.12, mountY + 0.13);
        const ly = (face === 'N') ? y1 - 22 : y0;
        pb(bag, 'charDark', x0 + 40, x1 - 40, ly, ly + 22, mountY + 0.01, mountY + 0.045);
        const dispX = (face === 'N') ? x1 - 140 : x0 + 100;
        pb(bag, 'lamp', dispX, dispX + 40, fy, fy + 3, mountY + 0.18, mountY + 0.22);
      } else {
        const fx = (face === 'E') ? x1 - 4 : x0;
        pb(bag, 'chrome', fx, fx + 4, y0 + 15, y1 - 15, mountY + 0.12, mountY + 0.13);
        const lx = (face === 'E') ? x1 - 22 : x0;
        pb(bag, 'charDark', lx, lx + 22, y0 + 40, y1 - 40, mountY + 0.01, mountY + 0.045);
        const dispY = (face === 'E') ? y1 - 140 : y0 + 100;
        pb(bag, 'lamp', fx, fx + 3, dispY, dispY + 40, mountY + 0.18, mountY + 0.22);
      }
    },

    // 2. Standard Indian 3-Blade Ceiling Fan (1200mm / 48" sweep, Havells / Orient style)
    ceilingFan(bag, cx, cy, fY, ceilY) {
      const wx = cx / 1000, wz = -cy / 1000;
      const cY = ceilY || (fY + 3.203); // exact underside of solid RCC slab
      const fanH = fY + 2.45; // aerodynamic motor level (comfortable head clearance)
      const rodTop = cY; // canopy sits completely flush against ceiling soffit
      // Ceiling canopy cup (flush to slab soffit)
      bag.cyl('white2', wx, rodTop - 0.030, wz, 0.075, 0.060);
      bag.cyl('brass', wx, rodTop - 0.055, wz, 0.078, 0.010);
      // Downrod pipe connecting seamlessly from canopy to motor
      const rodH = (rodTop - 0.060) - (fanH + 0.050);
      const rodMidY = (rodTop - 0.060 + fanH + 0.050) / 2;
      bag.cyl('white2', wx, rodMidY, wz, 0.013, rodH);
      // Motor housing (upper and lower aero cowlings)
      bag.cyl('white2', wx, fanH + 0.025, wz, 0.120, 0.050);
      bag.cyl('brass', wx, fanH, wz, 0.125, 0.015); // central brass trim ring
      bag.cyl('white2', wx, fanH - 0.025, wz, 0.095, 0.040);
      bag.cyl('brass', wx, fanH - 0.045, wz, 0.040, 0.010); // bottom cup
      // 3 Aerodynamic Blades at 120 degree angles
      const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      for (const theta of angles) {
        const cosT = Math.cos(theta), sinT = Math.sin(theta);
        // Shank / blade bracket
        const sx = wx + cosT * 0.13, sz = wz - sinT * 0.13;
        bag.box('brass', sx, fanH + 0.005, sz, 0.04, 0.008, 0.025, 0, theta, 0);

        // Blade span (length 440mm, width 120mm, aerodynamic pitch 0.08)
        const bx = wx + cosT * 0.35, bz = wz - sinT * 0.35;
        bag.box('white2', bx, fanH + 0.008, bz, 0.44, 0.004, 0.12, 0.08, theta, 0);

        // Blade tip gold/brass accent pinstripe
        const tx = wx + cosT * 0.54, tz = wz - sinT * 0.54;
        bag.box('brass', tx, fanH + 0.009, tz, 0.03, 0.006, 0.11, 0.08, theta, 0);
      }
    },

    // 3. Modern Surface-Mounted Canister Downlight (Philips / Syska 15W Surface COB)
    surfaceDownlight(bag, cx, cy, mountY, mat = 'white2') {
      const wx = cx / 1000, wz = -cy / 1000;
      const topY = mountY;
      const H = 0.075; // 75mm canister height
      bag.cyl(mat, wx, topY - H / 2, wz, 0.065, H); // flush against ceiling slab soffit
      bag.cyl('brass', wx, topY - H + 0.010, wz, 0.055, 0.010); // inner anti-glare baffle ring
      bag.cyl('lamp', wx, topY - H + 0.005, wz, 0.048, 0.008); // frosted warm LED COB lens
    },

    // 4. Modern Surface-Mounted Slim LED Panel (Square / Round)
    surfacePanel(bag, cx, cy, mountY, size = 220) {
      const wx = cx / 1000, wz = -cy / 1000;
      const topY = mountY;
      const s = size / 1000, H = 0.035;
      bag.box('white2', wx, topY - H / 2, wz, s, H, s); // square slim surface frame flush to slab
      bag.box('lamp', wx, topY - H + 0.005, wz, s - 0.03, 0.008, s - 0.03); // edge-lit diffuser plate
    },

    // 5. Modern Surface-Mounted Aluminium Profile Linear Corner / Perimeter Light
    profileLight(bag, dir, a0, a1, at, mountY, face) {
      const topY = mountY;
      const W = 28; // 28mm slim aluminium extrusion width
      const H = 0.030; // 30mm profile height
      let x0, x1, y0, y1;
      if (dir === 'x') {
        x0 = Math.min(a0, a1); x1 = Math.max(a0, a1);
        if (face === 'N') { y0 = at; y1 = at + W; }
        else { y0 = at - W; y1 = at; }
      } else {
        y0 = Math.min(a0, a1); y1 = Math.max(a0, a1);
        if (face === 'E') { x0 = at; x1 = at + W; }
        else { x0 = at - W; x1 = at; }
      }
      // Aluminium channel extrusion flush to slab
      pb(bag, 'charDark', x0, x1, y0, y1, topY - H, topY);
      // Frosted opal polycarbonate diffuser strip
      if (dir === 'x') {
        pb(bag, 'lamp', x0 + 10, x1 - 10, (y0 + y1) / 2 - 8, (y0 + y1) / 2 + 8, topY - H - 0.004, topY - 0.004);
      } else {
        pb(bag, 'lamp', (x0 + x1) / 2 - 8, (x0 + x1) / 2 + 8, y0 + 10, y1 - 10, topY - H - 0.004, topY - 0.004);
      }
    },

    // 6. Indian Decorative Wall Bracket Light (Tulip / Frosted Glass Shade + Brass Arm)
    wallBracket(bag, x, y, mountH, dir, face) {
      const bY = mountH;
      let bx = x, by = y;
      if (dir === 'x') by = (face === 'N') ? y + 12 : y - 12;
      else bx = (face === 'E') ? x + 12 : x - 12;
      bag.cyl('brass', bx / 1000, bY, -by / 1000, 0.045, 0.015, (dir === 'x') ? Math.PI / 2 : 0, 0, (dir === 'y') ? Math.PI / 2 : 0);
      let ax = x, ay = y;
      if (dir === 'x') ay = (face === 'N') ? y + 75 : y - 75;
      else ax = (face === 'E') ? x + 75 : x - 75;
      bag.cyl('brass', ax / 1000, bY, -ay / 1000, 0.009, 0.08);
      bag.cyl('curtain2', ax / 1000, bY + 0.06, -ay / 1000, 0.065, 0.12);
      bag.cyl('lamp', ax / 1000, bY + 0.05, -ay / 1000, 0.035, 0.08);
    },

    // 7. Architectural Up/Down Wall Wash Sconce
    wallSconce(bag, x, y, mountH, dir, face) {
      const W = 45, H = 0.09, D = 55;
      let x0, x1, y0, y1;
      if (dir === 'x') {
        x0 = x - W; x1 = x + W;
        if (face === 'N') { y0 = y; y1 = y + D; }
        else { y0 = y - D; y1 = y; }
      } else {
        y0 = y - W; y1 = y + W;
        if (face === 'E') { x0 = x; x1 = x + D; }
        else { x0 = x - D; x1 = x; }
      }
      pb(bag, 'charDark', x0, x1, y0, y1, mountH - H, mountH + H);
      pb(bag, 'brass', x0 + 4, x1 - 4, y0 + 4, y1 - 4, mountH - H + 0.01, mountH + H - 0.01);
      // Top upward diffuser
      pb(bag, 'lamp', x0 + 6, x1 - 6, y0 + 4, y1 - 4, mountH + H - 0.005, mountH + H + 0.035);
      // Bottom downward diffuser
      pb(bag, 'lamp', x0 + 6, x1 - 6, y0 + 4, y1 - 4, mountH - H - 0.035, mountH - H + 0.005);
      // Front glowing accent reveal
      if (dir === 'x') {
        const fy = face === 'N' ? y1 - 4 : y0;
        pb(bag, 'lamp', x - 15, x + 15, fy, fy + 4, mountH - 0.04, mountH + 0.04);
      } else {
        const fx = face === 'E' ? x1 - 4 : x0;
        pb(bag, 'lamp', fx, fx + 4, y - 15, y + 15, mountH - 0.04, mountH + 0.04);
      }
    },
    // Bedside Reading Light
    bedsideSconce(bag, x, y, mountH) {
      const wx = x / 1000, wz = -y / 1000;
      bag.cyl('charDark', wx, mountH, wz, 0.038, 0.015);
      bag.cyl('brass', wx, mountH, wz, 0.012, 0.045);
      bag.cyl('lamp', wx, mountH - 0.015, wz, 0.022, 0.025);
    },
    // Contemporary Architectural Floor Standing Lamp
    floorLamp(bag, cx, cy, fY, h = 1.55) {
      const wx = cx / 1000, wz = -cy / 1000;
      bag.cyl('charDark', wx, fY + 0.02, wz, 0.16, 0.035); // heavy marble base
      bag.cyl('brass', wx, fY + 0.04, wz, 0.12, 0.015); // brass trim collar
      bag.cyl('brass', wx, fY + h / 2, wz, 0.012, h); // slender brass column
      bag.cyl('brass', wx, fY + h - 0.12, wz, 0.06, 0.02); // shade spider
      bag.cyl('curtain2', wx, fY + h, wz, 0.18, 0.32); // translucent warm linen shade
      bag.cyl('lamp', wx, fY + h, wz, 0.10, 0.22); // warm LED core
    },

    /* ===================== SECOND-LAYER / LOW-GLARE KIT =====================
       This house has NO false ceiling, so every luminaire below is either
       surface-fixed to the slab soffit, suspended from it, or carried on a
       wall. Nothing here needs a plenum. The point of the kit is to get the
       light off a single ceiling plane without ever putting a bare source in
       the eyeline. ====================================================== */

    /* Concealed cove ledge — a plaster valance shelf on the WALL (not a
       dropped ceiling), with an up-facing LED strip tucked behind a raised
       outer lip. You see the wash on the slab, never the diode. This is the
       indirect layer, and it is the single biggest anti-glare move available
       when there is no false ceiling to hide a trough in.
         dir  'x' run along x (wall faces N/S) | 'y' run along y (faces E/W)
         a0,a1 extent in mm along the run;  at = wall face in mm
         face  side the ledge projects TOWARD ('N','S','E','W')            */
    coveLedge(bag, dir, a0, a1, at, ceilY, face) {
      const D = 150;                 // projection from the wall (mm)
      const top = ceilY - 0.30;      // ledge top — 300mm of wall left to graze
      const T = 0.030;               // ledge slab thickness
      const LIP = 0.055;             // outer upstand that hides the strip
      let x0, x1, y0, y1, sA, sB, lA, lB;
      if (dir === 'x') {
        x0 = a0; x1 = a1;
        if (face === 'N') { y0 = at; y1 = at + D; sA = at + 18; sB = at + 60; lA = at + D - 32; lB = at + D; }
        else              { y0 = at - D; y1 = at; sA = at - 60; sB = at - 18; lA = at - D; lB = at - D + 32; }
        pb(bag, 'white', x0, x1, y0, y1, top - T, top);            // the ledge
        pb(bag, 'coveLED', x0 + 40, x1 - 40, sA, sB, top, top + 0.014); // strip
        pb(bag, 'white', x0, x1, lA, lB, top, top + LIP);          // shielding lip
      } else {
        y0 = a0; y1 = a1;
        if (face === 'E') { x0 = at; x1 = at + D; sA = at + 18; sB = at + 60; lA = at + D - 32; lB = at + D; }
        else              { x0 = at - D; x1 = at; sA = at - 60; sB = at - 18; lA = at - D; lB = at - D + 32; }
        pb(bag, 'white', x0, x1, y0, y1, top - T, top);
        pb(bag, 'coveLED', sA, sB, y0 + 40, y1 - 40, top, top + 0.014);
        pb(bag, 'white', lA, lB, y0, y1, top, top + LIP);
      }
    },

    /* Suspended pendant with the lamp recessed UP inside the shade, so the
       source is cut off above about 45 degrees and you never catch the diode
       walking under it. `r` is the shade mouth radius. */
    pendant(bag, x, y, ceilY, drop = 0.9, r = 0.13, shade = 'charDark') {
      const wx = x / 1000, wz = -y / 1000;
      const bY = ceilY - drop;
      bag.cyl('charDark', wx, ceilY - 0.014, wz, 0.048, 0.028);   // ceiling rose
      bag.cyl('steel', wx, ceilY - drop / 2, wz, 0.0035, drop);   // suspension
      bag.cyl(shade, wx, bY + 0.02, wz, r, 0.155);                // outer shade
      bag.cyl('brass', wx, bY - 0.055, wz, r - 0.012, 0.010);     // inner reflector rim
      // Diffuser sits IN the shade mouth: visible as a lit disc from below,
      // cut off above ~45 deg so you never catch the source across the room.
      bag.cyl('lamp', wx, bY - 0.062, wz, r * 0.78, 0.014);
    },

    /* Feature cluster for a double-height void: staggered pendant drops so the
       volume reads as lit from both the level below and the gallery above. */
    voidCluster(bag, x, y, ceilY, drops) {
      const wx = x / 1000, wz = -y / 1000;
      bag.cyl('charDark', wx, ceilY - 0.020, wz, 0.20, 0.040);    // canopy plate
      bag.cyl('brass', wx, ceilY - 0.044, wz, 0.185, 0.012);
      for (const d of drops) {
        const px = x + d.dx, py = y + d.dy;
        const pwx = px / 1000, pwz = -py / 1000;
        const bY = ceilY - d.drop;
        bag.cyl('steel', pwx, ceilY - d.drop / 2, pwz, 0.003, d.drop);
        bag.cyl('brass', pwx, bY + 0.055, pwz, 0.055, 0.012);
        bag.cyl('curtain2', pwx, bY, pwz, 0.105, 0.145);          // linen drum
        // Lit disc closing the drum mouth. Buried inside the drum it read as a
        // dead grey cylinder hanging in the void.
        bag.cyl('lamp', pwx, bY - 0.078, pwz, 0.092, 0.016);
      }
    },

    /* Mirror vanity bar — diffused, mounted ABOVE the mirror head and washing
       down the face. Bathroom glare is nearly always a bare bulb at eye level;
       this keeps the source over the brow line. */
    vanityBar(bag, dir, a0, a1, at, mountY, face) {
      const P = 62;   // projection from wall
      let x0, x1, y0, y1;
      if (dir === 'x') { x0 = a0; x1 = a1; if (face === 'N') { y0 = at; y1 = at + P; } else { y0 = at - P; y1 = at; } }
      else             { y0 = a0; y1 = a1; if (face === 'E') { x0 = at; x1 = at + P; } else { x0 = at - P; x1 = at; } }
      pb(bag, 'charDark', x0, x1, y0, y1, mountY, mountY + 0.052);        // housing
      pb(bag, 'brass', x0 + 5, x1 - 5, y0 + 4, y1 - 4, mountY + 0.048, mountY + 0.054);
      pb(bag, 'lamp', x0 + 8, x1 - 8, y0 + 6, y1 - 6, mountY - 0.012, mountY + 0.004); // downward lens
    },

    /* Concealed task strip under a wall unit / shelf (kitchen, wardrobe).
       Face-down, set back from the front edge so it is shielded in view. */
    taskStrip(bag, x0, x1, y0, y1, atY) {
      pb(bag, 'charDark', x0, x1, y0, y1, atY, atY + 0.016);
      pb(bag, 'lamp', x0 + 25, x1 - 25, y0 + 8, y1 - 8, atY - 0.010, atY + 0.001);
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
      // V33 puts the duplex entry at the NORTH end of the east face (c 8000),
      // so the entrance and the pooja swap cells: entrance takes the north bay,
      // pooja drops south against the kitchen wall. The dividing wall sits at
      // y 6700..6815 — south of the entry sidelite (c 7100 → y 6875..7325), so
      // door and sidelite both read as one composition inside the entrance.
      R('FOYER', '1528 × 1827', 10893, 12421, 6815, 8642, 'circ'),
      R('POOJA', '1525 × 1640', 10893, 12418, 5060, 6700, 'pooja'),
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
        { c: 2700, w: 1200, sill: 1100, h: 900, type: 'win' },                   // kitchen sink window
        { c: 6150, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 },         // office window
        { c: 8000, w: 1200, sill: 0, h: 2400, type: 'door' }                     // office door (near north, stacks with FF entry)
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
        { c: 3100, w: 1000, sill: 1100, h: 1200, type: 'win', chajja: true },    // master bedroom north-edge window
        { c: 5000, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },      // common bath vent
        { c: 8000, w: 1000, sill: 1100, h: 1200, type: 'win', chajja: true }     // children bedroom north-edge window
      ]
    },
    f1: {
      E: [
        { c: -300, w: 600, sill: 0, h: 2400, type: 'grill', door: true },        // southeast corner east-facing secure grill door
        { c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' },                   // kitchen
        { c: 5880, w: 1000, sill: 2150, h: 550, type: 'fixed', panes: 2 },       // pooja clerestory light (centered on pooja/mandir axis)
        { c: 7100, w: 450, sill: 0, h: 2400, type: 'fixed', panes: 1 },          // entry sidelite
        { c: 8000, w: 1200, sill: 0, h: 2400, type: 'door' }                     // duplex entry pivot (north end)
      ],
      N: [
        { c: 5500, w: 1000, sill: 900, h: 1400, type: 'win' },                   // left of void
        { c: 8760, w: 1000, sill: 900, h: 1400, type: 'win' }                    // right of void
      ],
      S: [
        { c: 2500, w: 1500, sill: 900, h: 1400, type: 'win' }                    // master bedroom south window
      ],
      W: [
        { c: 3800, w: 1000, sill: 1100, h: 1200, type: 'win', chajja: true },    // master bedroom north-edge window
        { c: 5000, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },      // master bath vent
        { c: 7200, w: 1200, sill: 2080, h: 1100, type: 'win', chajja: true }     // staircase landing
      ]
    },
    f2: {
      E: [
        { c: 3800, w: 1000, sill: 1100, h: 1200, type: 'win', chajja: true },    // Bedroom 03 north-edge window
        // Family room glass wall
        { c: 7050, w: 3160, sill: 0, h: 2700, type: 'frenchdoor', panes: 3 }
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
        { c: 3800, w: 1000, sill: 1100, h: 1200, type: 'win', chajja: true },    // bedroom 02 north-edge window
        { c: 5000, w: 600, sill: 1700, h: 600, type: 'win', chajja: true },      // bath vent
        { c: 7200, w: 1200, sill: 2080, h: 1100, type: 'win', chajja: true }     // staircase landing
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
      // This one is not really an interior wall — it is the east SHELL in the
      // service band, and the exterior draws the same run in eastPlaster. It
      // needs `mat` so both representations agree; as white2 it z-fought the
      // exterior over the whole SE corner (120 hits on a four-face sweep).
      { dir: 'y', b: [12420, 12650], a: [-762, 1411], mat: 'eastPlaster', ops: [{ c: -300, w: 600, sill: 0, h: 2400 }] }, // southeast east wall with secure grill door
      { dir: 'x', b: [-762, -646], a: [4805, 12420], ops: [{ c: 6527, w: 3215, sill: 900, h: 1400 }, { c: 8810, w: 600, sill: 1700, h: 600 }, { c: 11205, w: 2430, sill: 900, h: 1400 }] }, // weather-secured south wall: utility grill, cbath ventilator, wet-kitchen grill
      { dir: 'y', b: [4805, 4920], a: [-646, 232], ops: [{ c: -207, w: 800, sill: 0, h: 2400 }] }, // utility west wall + SW grill door onto the bedroom south balcony
      { dir: 'x', b: [1413, 1526], a: [4920, 6595], ops: [] },                           // dining | utility north wall
      { dir: 'y', b: [8135, 8250], a: [-646, 1377], ops: [{ c: 1000, w: 700 }] },       // utility | common bath wall + door
      { dir: 'x', b: [1377, 1526], a: [6595, 9370], ops: [{ c: 7350, w: 1200, sill: 0, h: 2400 }] }, // dining | utility slider wall (slider clear of the cbath)
      { dir: 'x', b: [1411, 1527], a: [9370, 12421], ops: [{ c: 10750, w: 900, sill: 0, h: 2400 }] }, // wide opening into kitchen (narrowed to clear the SW pantry + south breakfast bar)
      { dir: 'y', b: [9371, 9486], a: [1527, 4945], ops: [{ c: 2163.5, w: 1273, sill: 900, h: 1200 }, { c: 3523, w: 1446 }] },     // kitchen|dining
      { dir: 'y', b: [10780, 10893], a: [4945, 6700], ops: [{ c: 5880, w: 1000 }] },   // hall|pooja (open view to the mandir, centred on the room)
      { dir: 'y', b: [10780, 10893], a: [6815, 8642], ops: [{ c: 7730, w: 1500 }] },   // hall|entrance
      { dir: 'x', b: [6700, 6815], a: [10893, 12421], ops: [] },                        // pooja|entrance
      { dir: 'x', b: [4945, 5060], a: [9370, 12421], ops: [] }                         // kitchen | pooja (the common wall the pooja now sits against)
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
        const tl = [
          [8000, 46000], [20000, 50000], [32000, 44000], [44000, 48000],
          [52000, 28000], [55000, 35000]
        ];
        tl.forEach(([tx, ty], ti) =>
          plantTree(bag, tx, ty, 6.2 + (ti % 3) * 0.6, { low: true, base: 0.02 }));
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
        const base = opts.base === undefined ? 0.045 : opts.base;
        const bucket = leafBucket(species, null, opts.shadow);
        const cardCount = opts.cards || 260;
        const rTrunk = height * 0.038;
        const trunkH = height * (species === 'mango' ? 0.34 : 0.42);
        const pFork = {
          x: cx + (rnd3() - 0.5) * 0.06,
          y: base + trunkH,
          z: cz + (rnd3() - 0.5) * 0.06
        };

        // 1. Root flare into the soil
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + rnd3() * 0.4;
          const rx = Math.cos(a) * rTrunk * 2.0, rz = Math.sin(a) * rTrunk * 2.0;
          woodBag.branch('bark', cx + rx, base - 0.02, cz + rz, cx, base + trunkH * 0.28, cz, rTrunk * 0.4, rTrunk * 0.7);
        }
        // Main structural trunk
        woodBag.branch('bark', cx, base, cz, pFork.x, pFork.y, pFork.z, rTrunk * 1.15, rTrunk * 0.85);

        // 2. Multi-tier boughs and branches
        const nB = species === 'mango' ? 5 : 4;
        const subPerBough = 3;
        const totalNodes = nB * subPerBough;
        const cardsPerNode = Math.round(cardCount / totalNodes);

        for (let i = 0; i < nB; i++) {
          const bAngle = (i / nB) * Math.PI * 2 + (rnd3() - 0.5) * 0.45;
          const bSpread = height * (species === 'mango' ? (0.32 + rnd3() * 0.10) : (0.25 + rnd3() * 0.08));
          const bRise = height * (species === 'mango' ? (0.18 + rnd3() * 0.08) : (0.24 + rnd3() * 0.08));
          const pBough = {
            x: pFork.x + Math.cos(bAngle) * bSpread,
            y: pFork.y + bRise,
            z: pFork.z + Math.sin(bAngle) * bSpread
          };
          woodBag.branch('bark', pFork.x, pFork.y, pFork.z, pBough.x, pBough.y, pBough.z, rTrunk * 0.65, rTrunk * 0.40);

          // Intermediate leaf cards at the bough fork
          canopyVolume(bucket, pBough.x * 0.65 + pFork.x * 0.35, pBough.y * 0.65 + pFork.y * 0.35 + 0.1, pBough.z * 0.65 + pFork.z * 0.35,
                       height * 0.14, height * 0.10, Math.round(cardsPerNode * 0.4), height * 0.11);

          // Secondary branches
          for (let j = 0; j < subPerBough; j++) {
            const subAngle = bAngle + ((j - 1) * 0.65) + (rnd3() - 0.5) * 0.25;
            const subSpread = height * (0.16 + rnd3() * 0.08);
            const subRise = height * (0.15 + rnd3() * 0.08);
            const pSub = {
              x: pBough.x + Math.cos(subAngle) * subSpread,
              y: pBough.y + subRise,
              z: pBough.z + Math.sin(subAngle) * subSpread
            };
            woodBag.branch('barkLight', pBough.x, pBough.y, pBough.z, pSub.x, pSub.y, pSub.z, rTrunk * 0.35, rTrunk * 0.16);

            // Foliage sub-canopy cloud anchored directly at this branch tip
            const cloudR = height * (species === 'mango' ? 0.20 : 0.17);
            const cloudH = cloudR * 0.85;
            canopyVolume(bucket, pSub.x, pSub.y + cloudH * 0.15, pSub.z,
                         cloudR, cloudH, cardsPerNode, height * 0.115);
          }
        }
      }

      /* A flowering shrub is mostly LEAF with flower clusters riding on it.
         Building it out of flower cards alone gives a solid magenta lump —
         which is what the bougainvillea band looked like. So the body is green
         and the flowers are a minority layer sitting toward the outside, where
         they actually grow. */
      function makeShrub(species, xmm, ymm, height, opts) {
        opts = opts || {};
        const cx = xmm / 1000, cz = -ymm / 1000;
        const base = opts.base === undefined ? 0.045 : opts.base;
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
        woodBag.box('leafDark', (x0 + x1) / 2, 0.045 + h * 0.46, cy,
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
          if (face < 0.34) { py = 0.045 + top; pz = cy + (rnd3() - 0.5) * d; }
          else if (face < 0.67) { py = 0.045 + rnd3() * top; pz = cy + d * 0.5; }
          else { py = 0.045 + rnd3() * top; pz = cy - d * 0.5; }
          addCard(bucket, px, py, pz, h * 0.34, 1.9);
        }
      }

      function makeHedgeNS(species, xmm, y0mm, y1mm, height, depth) {
        const cx = xmm / 1000, h = height, d = depth;
        const zA = -y0mm / 1000, zB = -y1mm / 1000;
        const z0 = Math.min(zA, zB), z1 = Math.max(zA, zB);
        woodBag.box('leafDark', cx, 0.045 + h * 0.46, (z0 + z1) / 2,
                    d - 0.10, h * 0.88, (z1 - z0) - 0.10);
        const bucket = leafBucket(species, null, true);
        const n = Math.round((z1 - z0) * h * 26);
        for (let i = 0; i < n; i++) {
          const t = rnd3();
          const pz = z0 + t * (z1 - z0);
          const top = h * (0.92 + 0.08 * Math.sin(t * (z1 - z0) * 2.4));
          const face = rnd3();
          let py, px;
          if (face < 0.34) { py = 0.045 + top; px = cx + (rnd3() - 0.5) * d; }
          else if (face < 0.67) { py = 0.045 + rnd3() * top; px = cx + d * 0.5; }
          else { py = 0.045 + rnd3() * top; px = cx - d * 0.5; }
          addCard(bucket, px, py, pz, h * 0.34, 1.9);
        }
      }

      if (typeof document === 'undefined' || typeof Image === 'undefined') {
        plantFallback();
        return;
      }

      const ASSETS = {
        mango: ['assets/tree-mango.jpg', '/assets/tree-mango.jpg'],
        neem:  ['assets/tree-neem.jpg',  '/assets/tree-neem.jpg'],
        boug:  ['assets/shrub-boug.jpg', '/assets/shrub-boug.jpg'],
        hedge: ['assets/hedge.jpg',      '/assets/hedge.jpg']
      };

      Promise.all([
        loadImage(ASSETS.mango),
        loadImage(ASSETS.neem),
        loadImage(ASSETS.boug),
        loadImage(ASSETS.hedge)
      ]).then(function (imgs) {
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

        // ================= PROFESSIONAL LANDSCAPE ARCHITECTURE =================

        // 1) Crisp Granite Lawn Perimeter Kerbing
        pb(woodBag, 'charDark', -750, 22100, 11250, 11310, 0.015, 0.075);
        pb(woodBag, 'copingLight', -750, 22100, 11260, 11300, 0.070, 0.082);
        pb(woodBag, 'charDark', 22050, 22100, 11270, 18620, 0.015, 0.075);
        pb(woodBag, 'charDark', -750, -700, 11270, 18620, 0.015, 0.075);

        // 2) Mulched Garden Beds along Compound Walls
        pb(woodBag, 'soil', 500, 21500, 17200, 18550, 0.035, 0.048);
        pb(woodBag, 'soil', -650, 1800, 12200, 17200, 0.035, 0.048);

        // 3) Flagstone / Flamed Granite Stepping Stone Walkway
        const pavers = [
          [21400, 9800, 0.90, 0.55],
          [20500, 10800, 0.90, 0.55],
          [19300, 11550, 0.95, 0.60],
          [17800, 11800, 0.95, 0.60],
          [16200, 11950, 0.95, 0.60],
          [14600, 11950, 0.95, 0.60],
          [13000, 11900, 0.95, 0.60],
          [11400, 11750, 0.95, 0.60],
          [9800, 11500, 0.95, 0.60],
          [8650, 11270, 1.10, 0.65]
        ];
        for (const [px, py, pw, pd] of pavers) {
          const x0 = px - (pw * 1000) / 2, x1 = px + (pw * 1000) / 2;
          const y0 = py - (pd * 1000) / 2, y1 = py + (pd * 1000) / 2;
          pb(woodBag, 'charDark', x0 - 15, x1 + 15, y0 - 15, y1 + 15, 0.038, 0.048);
          pb(woodBag, 'copingLight', x0, x1, y0, y1, 0.046, 0.054);
        }

        // 4) Stone-Edged Tree Rings (Alavala) with Dark Mulch
        const treeRings = [
          [3600, 15800, 850],
          [10800, 16600, 800],
          [16800, 15000, 950],
          [19800, 16400, 900]
        ];
        for (const [tx, ty, tr] of treeRings) {
          const tcx = tx / 1000, tcz = -ty / 1000, trM = tr / 1000;
          woodBag.cyl('charDark', tcx, 0.048, tcz, trM + 0.06, 0.035);
          woodBag.cyl('copingLight', tcx, 0.066, tcz, trM + 0.06, 0.012);
          woodBag.cyl('soil', tcx, 0.046, tcz, trM - 0.02, 0.025);
        }

        // 5) Specimen Botanical Trees (Connected Multi-Tier Branching + Anchored Foliage)
        makeTree('neem',  3600, 15800, 3.80, { spread: 0.30, cards: 320 });
        makeTree('neem',  10800, 16600, 3.30, { spread: 0.28, cards: 280 });
        makeTree('mango', 16800, 15000, 4.10, { spread: 0.38, cards: 360 });
        makeTree('mango', 19800, 16400, 3.60, { spread: 0.34, cards: 300 });

        // 6) Layered Shrubs & Perimeter Hedges
        makeShrub('boug', 18800, 12850, 0.92, { cards: 88, flowers: 0.32, leaf: 'hedge' });
        makeShrub('boug', 20200, 13400, 0.80, { cards: 78, flowers: 0.36, leaf: 'hedge' });
        makeShrub('boug', 19400, 14100, 0.74, { cards: 72, flowers: 0.28, leaf: 'hedge' });
        makeShrub('boug', 15600, 13200, 0.78, { cards: 76, flowers: 0.30, leaf: 'hedge' });
        makeShrub('boug',  1600, 13000, 0.88, { cards: 82, flowers: 0.30, leaf: 'hedge' });
        makeShrub('boug',  2600, 13800, 0.76, { cards: 70, flowers: 0.28, leaf: 'hedge' });
        makeShrub('boug',  2200, 15200, 0.64, { cards: 62, flowers: 0.18, leaf: 'hedge' });
        makeShrub('boug', 18400, 17000, 0.70, { cards: 66, flowers: 0.26, leaf: 'hedge' });
        makeShrub('boug',  5400, 12550, 0.70, { cards: 68, flowers: 0.30, leaf: 'hedge' });
        makeShrub('boug', 11800, 12680, 0.68, { cards: 66, flowers: 0.28, leaf: 'hedge' });

        makeShrub('hedge', 5000, 17400, 0.60, { cards: 52, flowers: 0 });
        makeShrub('hedge', 14000, 17400, 0.58, { cards: 50, flowers: 0 });
        makeShrub('hedge', 19000, 17350, 0.62, { cards: 52, flowers: 0 });

        makeHedge('hedge', 700, 21200, 17900, 1.10, 0.90);
        makeHedgeNS('hedge', 900, 12600, 17400, 0.92, 0.55);
        makeHedgeNS('hedge', 20900, 12600, 17400, 0.92, 0.55);

        // 7) Distant backdrop trees (N / NE)
        const tl = [
          [8000, 46000, 6.4], [20000, 50000, 7.0], [32000, 44000, 6.2],
          [44000, 48000, 6.8], [52000, 28000, 6.0], [55000, 35000, 6.6]
        ];
        tl.forEach(function (row, i) {
          makeTree(i % 2 ? 'neem' : 'mango', row[0], row[1], row[2],
                   { base: -0.05, shadow: false, cards: 140, spread: 0.32 });
        });
        /* base −0.05: plants inside the plot stand on the grass slab (top
           0.045), but these six are north of the plot edge (y 18750) on the raw
           ground box whose top is exactly 0.000. Fewer cards each — they are
           40 m out — and no shadow casting, since they sit well outside the
           sun's ±35 m shadow box and would buy nothing. */
        tl.forEach(function (row, i) {
          makeTree(i % 2 ? 'neem' : 'mango', row[0], row[1], row[2],
                   { base: -0.05, shadow: false, cards: 90, spread: 0.32 });
        });

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

    /* -------- lighting contract --------
       Every interior luminaire is placed through `makeLum`, which draws the
       fixture AND registers its light source in the same call. These used to
       be two hand-maintained lists (a `Fur.*` call and a matching `warmFix`),
       and they had drifted: fixtures sat 353 mm below the slab soffit while
       their lights sat somewhere else again. Coupling them here means a lamp
       and its light physically cannot disagree.

       `i` is a relative intensity weight, not a physical unit. It is what
       makes the scheme read as LAYERED rather than flat: ambient carries the
       room, everything else sits deliberately under it. Glare control lives
       here too — sources are set well below the lens so the slab around a
       fixture is not blown out, and indirect coves are weakest of all. */
    const lights = [];
    const LUM_I = {
      downlight: 0.85, panel: 0.90, profile: 0.65, bracket: 0.65, fan: 0.35, cove: 0.50, oyster: 0.90, can: 0.65,
      pendant: 0.80, cluster: 1.15, sconce: 0.55, vanity: 0.60, task: 0.45, bedside: 0.35, flame: 0.55
    };
    /* How far BELOW the slab a ceiling fitting's source sits. */
    const CEIL_SRC = 0.45;
    function makeLum(bag, fi, fY, ceilY) {
      const put = (xmm, ymm, yM, kind) =>
        lights.push({ x: xmm / 1000, y: yM, z: -ymm / 1000, floor: fi, warm: true, i: LUM_I[kind] || 1, kind });
      return {
        /* --- Modern Surface-Mounted Canister Downlight on RCC ceiling --- */
        downlight(cx, cy, mountY, mat) {
          const mY = mountY || ceilY;
          Fur.surfaceDownlight(bag, cx, cy, mY, mat || 'white2');
          put(cx, cy, mY - 0.10, 'downlight');
          return this;
        },
        /* --- Modern Surface-Mounted Slim LED Panel on RCC ceiling --- */
        panel(cx, cy, mountY, size) {
          const mY = mountY || ceilY;
          Fur.surfacePanel(bag, cx, cy, mY, size || 240);
          put(cx, cy, mY - 0.10, 'panel');
          return this;
        },
        /* --- Modern Aluminium Profile Surface Linear Corner/Perimeter Light --- */
        profile(dir, a0, a1, at, mountY, face) {
          const mY = mountY || ceilY;
          Fur.profileLight(bag, dir, a0, a1, at, mY, face);
          const midA = (a0 + a1) / 2;
          const off = face === 'N' ? 50 : face === 'S' ? -50 : 0;
          const offx = face === 'E' ? 50 : face === 'W' ? -50 : 0;
          if (dir === 'x') put(midA, at + off, mY - 0.08, 'profile');
          else put(at + offx, midA, mY - 0.08, 'profile');
          return this;
        },
        /* --- Standard 3-Blade Ceiling Fan (1200mm / 48" sweep) --- */
        fan(cx, cy) {
          Fur.ceilingFan(bag, cx, cy, fY, ceilY);
          put(cx, cy, fY + 2.50, 'fan');
          return this;
        },
        /* --- High-Wall Standalone Split AC Indoor Unit --- */
        ac(dir, fixed, a0, a1, face) {
          Fur.splitAC(bag, dir, fixed, a0, a1, fY, face);
          return this;
        },
        /* --- Decorative Wall Bracket Light --- */
        wallBracket(x, y, h, dir, face) {
          Fur.wallBracket(bag, x, y, fY + h, dir, face);
          put(x, y, fY + h, 'bracket');
          return this;
        },
        /* --- wall sconce: mounted flush on solid wall --- */
        sconce(x, y, h, dir, face) {
          Fur.wallSconce(bag, x, y, fY + h, dir, face);
          put(x, y, fY + h, 'sconce');
          return this;
        },
        bedside(x, y, h) {
          Fur.bedsideSconce(bag, x, y, fY + (h == null ? 1.15 : h));
          put(x, y, fY + (h == null ? 1.15 : h), 'bedside');
          return this;
        },
        /* --- vanity bar: mounted on bathroom wall above mirror --- */
        vanity(dir, a0, a1, at, h, face) {
          const mY = fY + (h == null ? 1.95 : h);
          Fur.vanityBar(bag, dir, a0, a1, at, mY, face);
          const c = (a0 + a1) / 2;
          if (dir === 'x') put(c, at + (face === 'N' ? 40 : -40), mY - 0.06, 'vanity');
          else put(at + (face === 'E' ? 40 : -40), c, mY - 0.06, 'vanity');
          return this;
        },
        /* --- under-cabinet task strip --- */
        task(x0, x1, y0, y1, h) {
          const aY = fY + h;
          Fur.taskStrip(bag, x0, x1, y0, y1, aY);
          put((x0 + x1) / 2, (y0 + y1) / 2, aY - 0.04, 'task');
          return this;
        },
        cluster(x, y, topY, drops) {
          Fur.voidCluster(bag, x, y, topY, drops);
          for (const d of drops) put(x + d.dx, y + d.dy, topY - d.drop - 0.03, 'cluster');
          return this;
        },
        floorLamp(x, y, h) {
          Fur.floorLamp(bag, x, y, fY, h == null ? 1.55 : h);
          put(x, y, fY + (h == null ? 1.55 : h), 'sconce');
          return this;
        },
        /* raw source with no model of its own (diyas, vilakku) */
        raw(x, y, yAbs, kind) { put(x, y, yAbs, kind || 'flame'); return this; }
      };
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

    /* curtain schedule: living / bed / office windows */
    const CURT = [
      [ { f: 'E', c: 6150, w: 1500, sill: 900, h: 1500, m: 'curtain' },   // GF office E
        { f: 'N', c: 2400, w: 1500, sill: 900, h: 1400, m: 'curtain2' },  // GF bed02
        { f: 'N', c: 6800, w: 1800, sill: 900, h: 1400, m: 'curtain' },   // GF hall
        { f: 'N', c: 11000, w: 1500, sill: 900, h: 1400, m: 'curtain' },  // GF office N
        { f: 'S', c: 2500, w: 1500, sill: 900, h: 1400, m: 'curtain2' },  // GF master S
        { f: 'W', c: 3100, w: 1000, sill: 1100, h: 1200, m: 'curtain' },  // GF master W corner
        { f: 'W', c: 8000, w: 1000, sill: 1100, h: 1200, m: 'curtain2' } ],// GF bed02 W corner
      [ { f: 'N', c: 5500, w: 1000, sill: 900, h: 1400, m: 'curtain' },   // FF hall W of void
        { f: 'N', c: 8760, w: 1000, sill: 900, h: 1400, m: 'curtain' },   // FF hall E of void
        { f: 'S', c: 2500, w: 1500, sill: 900, h: 1400, m: 'curtain2' },  // FF master S
        { f: 'W', c: 3800, w: 1000, sill: 1100, h: 1200, m: 'curtain' } ],// FF master W corner
      [ { f: 'N', c: 8760, w: 1000, sill: 900, h: 1400, m: 'curtain' },   // SF family room
        { f: 'E', c: 7050, w: 3160, sill: 0, h: 2700, m: 'curtain' },     // SF family room glass wall — floor-length
        { f: 'E', c: 3800, w: 1000, sill: 1100, h: 1200, m: 'curtain' },  // SF bed03 E corner
        { f: 'S', c: 2500, w: 1500, sill: 900, h: 1400, m: 'curtain2' },  // SF master02 S
        { f: 'S', c: 10000, w: 1500, sill: 900, h: 1400, m: 'curtain' },  // SF bed03 S
        { f: 'W', c: 3800, w: 1000, sill: 1100, h: 1200, m: 'curtain2' } ]// SF master02 W corner
    ];

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

      /* ---- site light fixtures ----
         The exterior-only fork drops these, but this model keeps a `lights`
         pool that walkthrough.html teleports PointLights into, and every one
         of the warmFix entries below the build corresponds to a fixture here.
         Without them the compound has light sources and nothing emitting.
         Coordinates re-fitted to V33's site: the gate opening moved from
         y 4622..8222 to a car leaf at 4300..8500 plus a pedestrian leaf at
         8760..9860, and the lawn trees moved to placeGarden()'s positions. */
      // East compound wall sconces (inner face), clear of both gate leaves
      for (const ly of [1200, 3000, 11000, 14000]) {
        pb(sBag, 'charDark', 22040, 22110, ly - 80, ly + 80, 1.05, 1.42);
        pb(sBag, 'steel', 22030, 22050, ly - 60, ly + 60, 1.10, 1.38);
        pb(sBag, 'lamp', 22015, 22035, ly - 48, ly + 48, 1.14, 1.34);
      }
      const sCyl = (mat, x, y, hMid, r, h) => sBag.cyl(mat, x / 1000, hMid, -y / 1000, r, h);
      const pathBollard = (x, y) => {
        pb(sBag, 'charDark', x - 40, x + 40, y - 40, y + 40, 0, 0.05);
        sCyl('steel', x, y, 0.34, 0.038, 0.62);
        sCyl('chrome', x, y, 0.70, 0.048, 0.045);
        sCyl('lamp', x, y, 0.64, 0.032, 0.06);
      };
      // Just inside the compound, on the two piers that flank the car leaf
      pathBollard(21750, 4170);
      pathBollard(21750, 8630);
      // Mushroom lights at the bases of placeGarden()'s four lawn trees
      for (const [gx, gy] of [[3600, 15800], [10800, 16600], [16800, 15000], [19800, 16400]]) {
        sCyl('charDark', gx, gy - 900, 0.10, 0.055, 0.18);
        sCyl('steel', gx, gy - 900, 0.26, 0.022, 0.18);
        sCyl('lamp', gx, gy - 900, 0.38, 0.075, 0.055);
        sCyl('copingLight', gx, gy - 900, 0.42, 0.095, 0.025);
      }
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
      // streetlights on south kerb (plan y ≈ mid kerb → world Z = -y/1000)
      const kerbMid = (KB_S + KB_N) / 2;
      const armY = kerbMid - 800; // arm over road
      const lampY = kerbMid - 1580;
      for (const sx of [1500, 15000]) {
        cBag.cyl('ms', sx / 1000, 3.0, -kerbMid / 1000, 0.07, 6.0);
        cBag.cyl('ms', sx / 1000, 5.88, -armY / 1000, 0.035, 1.7, Math.PI / 2, 0, 0);
        cBag.box('lamp', sx / 1000, 5.83, -lampY / 1000, 0.18, 0.10, 0.42);
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
        plantTree(cBag, tx, ty, 6.2 + (ti % 3) * 0.8, { low: true, base: 0.02 }));
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
      // Drip edge below the stone sill — keeps water off the soffit
      pb(bag, 'charDark', 16510, 16622, f0 - 4, f1 + 4, hz0 - 0.038, hz0 - 0.028);
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
     *   No mid-flight rails. No exterior MS @16380.
     */
    function externalStair(bag, full) {
      pb(bag, 'white', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);

      if (full) {
        /* ——— Flight 1 (lower): no separate balustrade ———————————
           The well screen below IS the balustrade on this side, so a second
           post-and-spindle rail in the same plane would be duplicated steel.
           What the screen cannot give you is something to hold: a hand closing
           on a rail needs clear air behind it, and the rods run right up the
           face. So the handrail sits 90 mm CLEAR of the rod plane, on the
           walking side, carried on short brackets welded off the rods — the
           usual detail, and it means the grip is over the tread where the hand
           actually falls rather than over the well. */
        (function lowerFlightHandrail() {
          const xRod = 15435;
          const xRail = xRod + 90;                 // 15525 — over the flight
          const H = 0.90;                          // grip height above the pitch line
          const T = 237.5, yBot = 3890, yTop = 1040;
          const pitch = (y) => L.porticoFl + ((yBot - y) / T) * RISE_E;
          // Raking grab rail, 40 × 40, following the pitch line
          const run = (yBot - yTop) / 1000, rise = pitch(yTop) - pitch(yBot);
          const len = Math.hypot(run, rise);
          /* NEGATIVE. This flight climbs toward +worldZ (plan-y 3890 → 1040 is
             world Z −3.89 → −1.04), and a box rotated by rx sends its local +Z
             to (0, −sin rx, cos rx) — so a POSITIVE rx tilts the far end DOWN.
             With +atan2 the handrail fell as the stair rose: it raked against
             the slope, crossing the flight instead of following it. */
          bag.box('steel', xRail / 1000, (pitch(yBot) + pitch(yTop)) / 2 + H,
                  -((yBot + yTop) / 2) / 1000, 0.040, 0.040, len,
                  -Math.atan2(rise, run), 0, 0);
          // Brackets back to the rods, and a stub post at each end
          for (let y = yTop + 120; y <= yBot - 120; y += 570) {
            pb(bag, 'steel', xRod, xRail + 20, y - 14, y + 14,
               pitch(y) + H - 0.022, pitch(y) + H + 0.018);
          }
          for (const y of [yTop + 40, yBot - 40]) {
            pb(bag, 'steel', xRail - 20, xRail + 20, y - 20, y + 20, pitch(y), pitch(y) + H + 0.02);
          }
          // Return into the landing U-turn at yTop (1040)
          pb(bag, 'steel', xRail - 20, xRail + 20, 1000, yTop + 20,
             LAND_E + H - 0.02, LAND_E + H + 0.02);
        })();

        /* ——— Stair-well screen ———————————————————————————————
           The well between the two flights is the reason this stair cannot be
           locked: a gate at the foot is pointless while anyone can step over the
           lower flight's handrail into the well and up onto the flight above.

           So the well is filled. Vertical MS rods stand on the lower flight and
           die on the underside of the upper one. Their length is not constant —
           the flights run in opposite directions, so the gap between them is zero
           where they meet at the landing and a full storey (3.95 m) at the foot,
           and each rod is cut to its own y. Above the lower flight's handrail the
           rods continue as a screen; below it they ARE the balusters, which is why
           the handrail moved into the same plane. */
        (function wellScreen() {
          const xC = 15435;                 // rod plane = lower flight's new west strip
          const R = 6;                      // 12 mm square MS — infill, not structure
          const PITCH = 112;                // 100 mm clear — a child cannot pass
          const yLo = 1040, yHi = 3890;
          const WAIST = 0.15;
          /* Nothing in this screen may be derived from the tread grid any more.
             Both flights are waist slabs, so every surface the screen touches is
             a continuous inclined PLANE — the soffit above and the nosing line
             below. The stepped helpers that used to live here (a per-tread
             lowTop(), and a soffit of tread-top − 0.32) are gone precisely so
             they cannot creep back in: they were what left the rods dying into a
             staircase-shaped member under a flat slab.

             Soffit sits one waist-thickness, measured VERTICALLY as t/cosθ,
             below the pitch line. */
          const runU = 2.85, riseU = L.f1 - LAND_E;
          const cosU = runU / Math.hypot(runU, riseU);
          const pitchU = (y) => LAND_E + ((y - 1040) / 2850) * riseU;
          const upSoffit = (y) => pitchU(y) - WAIST / cosU;
          // and the LOWER flight's own pitch line, for the channel the rods stand on
          const pitchL = (y) => L.porticoFl + ((3890 - y) / 2850) * (LAND_E - L.porticoFl);

          /* One continuous inclined member, top face lying on the line
             (yA,zA)→(yB,zB). Same construction as the waist slab: offset the
             centre down by t/(2·cosθ) and rotate about world X. */
          const CH = 0.045;
          const rake = (mat, x0, x1, yA, zA, yB, zB, thick) => {
            const run = Math.abs(yB - yA) / 1000, rise = zB - zA;
            const len = Math.hypot(run, rise), cosT = run / len;
            const wA = -yA / 1000, wB = -yB / 1000;
            const rx = (wB > wA ? -1 : 1) * Math.atan2(rise, run);
            bag.box(mat, (x0 + x1) / 2000, (zA + zB) / 2 - thick / (2 * cosT),
                    (wA + wB) / 2, (x1 - x0) / 1000, thick, len, rx, 0, 0);
          };
          // Head channel — bolted flat to the upper flight's SLOPING soffit.
          rake('ms', 15400, xC + 20, yLo, upSoffit(yLo), yHi, upSoffit(yHi), CH);
          // Foot channel — sits on the lower flight's nosing line.
          rake('ms', 15400, xC + 20, yHi, pitchL(yHi), yLo, pitchL(yLo), CH);

          /* Rods span channel to channel, so both ends land on a flat seating
             that rakes with the slab. They used to run tread-top to soffit while
             the channels were 12 flat segments stepping with the OLD treads —
             a stepped member under a plane soffit, which left every rod head
             either short of its seating or driven through it. */
          for (let y = yLo + 60; y <= yHi - 40; y += PITCH) {
            const b = pitchL(y), t = upSoffit(y) - CH;
            if (t - b < 0.10) continue;     // nothing to fill where the flights meet
            pb(bag, 'ms', xC - R, xC + R, y - R, y + R, b, t);
          }
          // Cleat plates bolting the head channel back onto the flight's east face
          for (let i = 0; i < 6; i++) {
            const y = 1040 + 240 + i * 475;
            const zU = upSoffit(y);
            pb(bag, 'ms', 15400, 15414, y - 45, y + 45, zU - 0.20, zU);
          }
          // Tie the head of the screen into the upper flight's east rail (fc 15380)
          pb(bag, 'steel', 15380, xC + 22, yHi - 60, yHi, L.f1 + 0.90, L.f1 + 0.95);
        })();

        // ——— Flight 2 (upper flight): climbing rails on both open edges ———
        // West edge (outer rail climbing to FF)
        stairRailing(bag, 'y', 14520, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);
        // East edge (inner well rail climbing to FF)
        stairRailing(bag, 'y', 15380, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);

        /* ——— Mid landing (LAND_E) continuous U-turn railings ——— */
        // 1. Inner spine U-turn connecting Flight 1 handrail to Flight 2 East rail:
        (function innerLandingUTurn() {
          const rH = LAND_E + 0.95;
          const xF1 = 15525;  // Flight 1 handrail line
          const xF2 = 15380;  // Flight 2 East rail line
          const yTurn = 820;  // U-turn apex on the landing
          const yMouth = 1040; // Flight arrival / departure line

          // Post helper matching RAIL_OUT
          const uPost = (x, y) => {
            pb(bag, 'ms', x - 12, x + 12, y - 12, y + 12, LAND_E, rH);
            pb(bag, 'steel', x - 14, x + 14, y - 14, y + 14, rH - 0.03, rH);
          };
          // Spindle helper
          const uSpin = (x, y) => {
            pb(bag, 'ms', x - 5, x + 5, y - 5, y + 5, LAND_E + 0.10, rH - 0.02);
          };

          // --- East leg (Flight 1 side: y 820..1040 at x=xF1) ---
          pb(bag, 'steel', xF1 - 20, xF1 + 20, yTurn - 20, yMouth + 20, rH - 0.02, rH + 0.02);
          pb(bag, 'chrome', xF1 - 10, xF1 + 10, yTurn - 10, yMouth + 10, rH + 0.01, rH + 0.025);
          pb(bag, 'steel', xF1 - 10, xF1 + 10, yTurn, yMouth, LAND_E + 0.08, LAND_E + 0.11);
          uPost(xF1, yMouth);
          uPost(xF1, yTurn);
          uSpin(xF1, (yTurn + yMouth) / 2);

          // --- U-turn cross rail (x xF2..xF1 at y=yTurn) ---
          pb(bag, 'steel', xF2 - 20, xF1 + 20, yTurn - 20, yTurn + 20, rH - 0.02, rH + 0.02);
          pb(bag, 'chrome', xF2 - 10, xF1 + 10, yTurn - 10, yTurn + 10, rH + 0.01, rH + 0.025);
          pb(bag, 'steel', xF2, xF1, yTurn - 10, yTurn + 10, LAND_E + 0.08, LAND_E + 0.11);
          uSpin((xF1 + xF2) / 2, yTurn);

          // --- West leg (Flight 2 side: y 820..1040 at x=xF2) ---
          pb(bag, 'steel', xF2 - 20, xF2 + 20, yTurn - 20, yMouth + 20, rH - 0.02, rH + 0.02);
          pb(bag, 'chrome', xF2 - 10, xF2 + 10, yTurn - 10, yMouth + 10, rH + 0.01, rH + 0.025);
          pb(bag, 'steel', xF2 - 10, xF2 + 10, yTurn, yMouth, LAND_E + 0.08, LAND_E + 0.11);
          uPost(xF2, yTurn);
          uPost(xF2, yMouth);
          uSpin(xF2, (yTurn + yMouth) / 2);
        })();

        // 2. Outer landing perimeter railings:
        // South edge: x 14520..16300 at y=180
        railing(bag, 'x', 180, 14520, 16300, LAND_E, 0.95);
        // West edge: y 180..1040 at x=14520 (collinear with Flight 2 West rail)
        railing(bag, 'y', 14520, 180, 1040, LAND_E, 0.95);

        // Outer corner posts (matching RAIL_OUT)
        pb(bag, 'ms', 16300 - 14, 16300 + 14, 180 - 14, 180 + 14, LAND_E, LAND_E + 0.95);
        pb(bag, 'steel', 16300 - 16, 16300 + 16, 180 - 16, 180 + 16, LAND_E + 0.92, LAND_E + 0.95);
        pb(bag, 'ms', 14520 - 14, 14520 + 14, 180 - 14, 180 + 14, LAND_E, LAND_E + 0.95);
        pb(bag, 'steel', 14520 - 16, 14520 + 16, 180 - 16, 180 + 16, LAND_E + 0.92, LAND_E + 0.95);
        pb(bag, 'ms', 14520 - 14, 14520 + 14, 1040 - 14, 1040 + 14, LAND_E, LAND_E + 0.95);
        pb(bag, 'steel', 14520 - 16, 14520 + 16, 1040 - 16, 1040 + 16, LAND_E + 0.92, LAND_E + 0.95);


        /* ——— Lockable gate at the stair foot ———————————————————
           ONE 900 mm opening, the width of the first flight only: x 15400..16300,
           west jamb on the screen plane, east jamb the stair wall's inner face.

           It does NOT run the full width of the tower. The bay west of 15400 is
           the dead space under the upper flight — nothing starts there, and the
           only way out of it onto the flight is through the well, which the rod
           screen already closes. A fixed panel across it was steel bought to
           duplicate a barrier that exists, and it made the gate read as a cage
           across the whole portico rather than a door to a stair.

           Section is graded rather than uniform, which is where the rest of the
           saving is. Below 2.15 m it is a real gate: closer bars, three rails,
           lock. Above 2.15 m nobody is reaching anything, so it becomes a light
           fixed fanlight at nearly double the bar spacing — enough that the head
           cannot be climbed through, without glazing-bar density where it earns
           nothing. Bars are 12 mm square, not 16. */
        (function stairGate() {
          const yF = 3952, yB = 3992;              // 40 mm frame depth
          const yM = (yF + yB) / 2;                // gate mid-plane
          const xW = 15400, xE = 16300;            // first-flight width only
          const z0 = L.porticoFl;
          const zLeaf = z0 + 2.15;                 // gate head (swing leaf top)
          const z1 = L.f1 - L.slabT;               // fanlight head = soffit

          // ——— Perimeter frame: charcoal MS angle-iron surround ———
          const FW = 40;                            // frame width (mm)
          pb(bag, 'frame', xW - FW, xW, yF - 4, yB + 4, z0, z1 + 0.05);   // west jamb
          pb(bag, 'frame', xE, xE + FW, yF - 4, yB + 4, z0, z1 + 0.05);   // east jamb
          pb(bag, 'frame', xW - FW, xE + FW, yF - 4, yB + 4, z1, z1 + 0.05);   // head
          pb(bag, 'frame', xW - FW, xE + FW, yF - 4, yB + 4, zLeaf, zLeaf + 0.05);  // transom
          pb(bag, 'frame', xW - FW, xE + FW, yF - 4, yB + 4, z0, z0 + 0.05);  // threshold

          // ——— Fanlight above transom ———————————————————————————
          // Contemporary grid: vertical flat bars + one horizontal mid-bar,
          // forming a clean rectangular grid. Flat bars read as louvers —
          // slim face-on, visible depth from the side.
          const fZ0 = zLeaf + 0.05, fZ1 = z1;
          const fH = fZ1 - fZ0;
          const fMid = fZ0 + fH / 2;
          // Horizontal mid-bar across the fanlight
          pb(bag, 'ms', xW + 10, xE - 10, yF + 4, yB - 4, fMid - 0.010, fMid + 0.010);
          // Vertical flat bars (25 mm wide × 6 mm deep, ~120 mm pitch)
          const fSpan = (xE - 10) - (xW + 10);
          const nFan = Math.max(3, Math.round(fSpan / 120));
          for (let i = 1; i < nFan; i++) {
            const fx = (xW + 10) + (fSpan * i) / nFan;
            pb(bag, 'ms', fx - 12, fx + 12, yM - 3, yM + 3, fZ0, fZ1);
          }

          // ——— Swing leaf ————————————————————————————————————————
          const lW = xW + 8, lE = xE - 8;          // leaf clear zone
          const leafSpan = lE - lW;

          // Stiles (hinge + lock) — 32 mm flat bar
          pb(bag, 'steel', lW, lW + 32, yF + 4, yB - 4, z0 + 0.05, zLeaf - 0.01);
          pb(bag, 'steel', lE - 32, lE, yF + 4, yB - 4, z0 + 0.05, zLeaf - 0.01);

          // Solid kick panel at the base — 250 mm, prevents foot-prying
          const kickTop = z0 + 0.30;
          pb(bag, 'ms', lW, lE, yF + 4, yB - 4, z0 + 0.05, kickTop);

          // Three evenly-spaced horizontal rails dividing the glazed zone
          const barZone0 = kickTop;
          const barZone1 = zLeaf - 0.01;
          const railCount = 3;
          for (let i = 0; i <= railCount; i++) {
            const rz = barZone0 + (barZone1 - barZone0) * i / railCount;
            // Top and bottom rails are thicker (structural), inner ones thinner
            const rh = (i === 0 || i === railCount) ? 0.035 : 0.025;
            pb(bag, 'ms', lW + 32, lE - 32, yF + 4, yB - 4, rz - rh / 2, rz + rh / 2);
          }

          // Vertical flat bars — 25 × 6 mm at 90 mm pitch (78 mm clear, child-safe)
          const innerW = lW + 32, innerE = lE - 32;
          const barSpan = innerE - innerW;
          const nBars = Math.max(4, Math.round(barSpan / 90));
          for (let i = 1; i < nBars; i++) {
            const bx = innerW + (barSpan * i) / nBars;
            pb(bag, 'ms', bx - 12, bx + 12, yM - 3, yM + 3, barZone0, barZone1);
          }

          // ——— Lock guard strip —————————————————————————————————
          // NOT a full-width plate — a 250 mm wide formed steel strip on the
          // lock stile only, covering both sides of the gate so nobody can
          // reach through to the lock or deadbolt from outside. Sits proud
          // of the bar plane with visible bolt-heads.
          const guardW = 250;                       // mm wide
          const guardX0 = lE - guardW, guardX1 = lE;
          const guardZ0 = z0 + 0.35, guardZ1 = z0 + 1.55;  // covers deadbolt (0.35) to above lever (1.22)
          // Main plate — slightly proud of the bars on both faces
          pb(bag, 'steel', guardX0, guardX1, yF - 2, yB + 2, guardZ0, guardZ1);
          // Bolt-head studs at four corners (tamper-resistant fixings)
          for (const gx of [guardX0 + 30, guardX1 - 30]) {
            for (const gz of [guardZ0 + 0.06, guardZ1 - 0.06]) {
              pb(bag, 'chrome', gx - 8, gx + 8, yB + 1, yB + 6, gz - 0.008, gz + 0.008);
              pb(bag, 'chrome', gx - 8, gx + 8, yF - 6, yF - 1, gz - 0.008, gz + 0.008);
            }
          }

          // ——— Lock hardware ————————————————————————————————————
          // Mortise lock body (inside the lock stile, behind the guard)
          pb(bag, 'steel', lE - 54, lE - 6, yF - 14, yB + 14, z0 + 0.98, z0 + 1.16);
          // D-pull handles on both faces — a proper pull, not just a lever nub
          // Outside (yB face): tubular D-pull
          pb(bag, 'chrome', lE - 100, lE - 50, yB + 2, yB + 12, z0 + 0.88, z0 + 0.92);  // top mount
          pb(bag, 'chrome', lE - 100, lE - 50, yB + 2, yB + 12, z0 + 1.16, z0 + 1.20);  // bottom mount
          pb(bag, 'chrome', lE - 80, lE - 70, yB + 10, yB + 40, z0 + 0.90, z0 + 1.18);  // grip bar
          // Inside (yF face): matching D-pull
          pb(bag, 'chrome', lE - 100, lE - 50, yF - 12, yF - 2, z0 + 0.88, z0 + 0.92);
          pb(bag, 'chrome', lE - 100, lE - 50, yF - 12, yF - 2, z0 + 1.16, z0 + 1.20);
          pb(bag, 'chrome', lE - 80, lE - 70, yF - 40, yF - 10, z0 + 0.90, z0 + 1.18);
          // Key cylinder on outside face (visible escutcheon)
          pb(bag, 'chrome', lE - 30, lE - 14, yB + 2, yB + 16, z0 + 1.03, z0 + 1.09);
          // Keeper plate in the east jamb frame
          pb(bag, 'steel', xE, xE + 12, yF - 4, yB + 4, z0 + 1.00, z0 + 1.14);

          // Deadbolt — separate from the mortise, at shin level
          pb(bag, 'steel', lE - 54, lE - 6, yF - 14, yB + 14, z0 + 0.38, z0 + 0.50);
          pb(bag, 'steel', xE, xE + 12, yF - 4, yB + 4, z0 + 0.40, z0 + 0.48);   // keeper

          // ——— Three heavy-duty hinges on the west jamb ————————
          for (const zh of [z0 + 0.22, z0 + 1.10, zLeaf - 0.28]) {
            pb(bag, 'steel', xW - 2, xW + 22, yF - 10, yB + 10, zh, zh + 0.12);
          }
          // Anti-lift pins on hinge stile (engage frame when gate is closed)
          for (const zp of [z0 + 0.60, z0 + 1.60]) {
            pb(bag, 'steel', xW + 4, xW + 24, yF + 4, yB - 4, zp - 0.025, zp + 0.025);
          }
        })();

        stairWalls(bag, 12);
      }

      // Structure — cast RCC, plain sloping soffit, then FINISHED like the rest
      // of the house: plastered and painted underneath, tiled on the going.
      // Raw shuttered concrete is what this looks like mid-construction; nobody
      // hands over a house with the service stair left grey.
      // Lower flight runs x 15400..16370, not 15470..16370. The extra 70 mm on
      // the west carries it to exactly the plane of the UPPER flight's east face
      // (15400), so the two flights meet in plan even though they are a storey
      // apart. That strip is what the well screen stands on: without it the rods
      // would rise off a slab 70 mm east of the flight above and die in open air
      // with nothing to fix to. Same concrete, so the shared 15400 plane between
      // lower-flight west face and upper-flight east face is not a visible seam.
      plainFlight(bag, 'white', 'y', 15400, 16370, 3890, L.porticoFl, 1040, LAND_E, 12, 0.15,
                  { tread: 'balcTile', skirt: true });
      pb(bag, 'white', 14500, 16370, 140, 1040, LAND_E - 0.20, LAND_E - 0.012);
      pb(bag, 'balcTile', 14500, 16370, 128, 1040, LAND_E - 0.012, LAND_E);
      // Upper flight springs off the landing, so no haunch at its foot.
      plainFlight(bag, 'white', 'y', 14500, 15400, 1040, LAND_E, 3890, L.f1, 12, 0.15,
                  { foot: false, tread: 'balcTile' });
      pb(bag, 'balcTile', 14520, 15380, 3652, 3890, L.f1 - 0.012, L.f1);
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

      // North wall flanks — door bays are cut in per landing.
      // The east flank stops at 14040, the east wall's INNER face, not at
      // liftOX[1] = 14270. Running it to 14270 buries it inside the east wall
      // over their shared 230 mm of y and puts two faces on the x = 14270
      // plane — the same defect V29's notes record, back again in V33 and now
      // visible because the two walls no longer share a material.
      pb(bag, 'white', liftOX[0], dx0, nY0, nY1, botH, topH);
      pb(bag, 'white', dx1, 14040, nY0, nY1, botH, topH);

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
        const sX1 = ff ? 4805 : X1 - 230, eY0 = ff ? 1411 : Y0n;
        wallRun(eBag, 'eastPlaster', 'y', eY0, Y1n, EB[0], EB[1], fl.fY, fl.h1, fl.fY, Eops);
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
        pb(eBag, 'white', 0, SHELTER_X + 10, yN - 90, yN + 10, rt - 0.45, rt + 0.012);
        pb(eBag, 'white', 0, SHELTER_X, yS - 10, yS + 90, rt - 0.45, rt + 0.012);
        pb(eBag, 'white', 0, 100, yS, yN, rt - 0.45, rt + 0.012);
        pb(eBag, 'white', SHELTER_X - 90, SHELTER_X + 10, EAST_RAFTER_YE, yN, rt - 0.45, rt + 0.012);
        pb(eBag, 'charDark', 0, SHELTER_X + 12, yN - 96, yN + 14, rt - 0.24, rt - 0.18);
        pb(eBag, 'charDark', 0, SHELTER_X, yS - 14, yS + 96, rt - 0.24, rt - 0.18);
        pb(eBag, 'charDark', -6, 106, yS, yN, rt - 0.24, rt - 0.18);
        pb(eBag, 'charDark', SHELTER_X - 96, SHELTER_X + 14, EAST_RAFTER_YE, yN, rt - 0.24, rt - 0.18);
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
        edgeWall(eBag, 'x', PARA_SFC, 0, CUT_X - 80, rt, 1.08);       // south
        edgeWall(eBag, 'y', CUT_X - 80, PARA_YS, yN - 80, rt, 1.08);  // east lip = lift face
        edgeWall(eBag, 'x', yN - 80, xW, CUT_X - 80, rt, 1.08);       // north, only on remaining slab
        edgeWall(eBag, 'y', xW, PARA_YS, yN - 80, rt, 1.08);          // west
        railPillarsAlong(eBag, 'y', CUT_X - 80, PARA_YS, yN - 80, rt, 1.08, { start: true, end: true });
        railPillar(eBag, xW, PARA_SFC, rt, 1.08);
        railPillar(eBag, xW, yN - 80, rt, 1.08);
        railPillar(eBag, CUT_X - 80, PARA_SFC, rt, 1.08);
        railPillar(eBag, CUT_X - 80, yN - 80, rt, 1.08);
        railPillar(eBag, CUT_X - 80, (PARA_YS + yN) / 2, rt, 1.08);
      })();

      // terrace floor with cutouts for stairwell and lift shaft
      pb(eBag, 'terraceF', 150, SHELTER_X, 150, 230, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, 12650, 230, 1805, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 14040, SHELTER_X, 230, 1805, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, SHELTER_X, 1805, EAST_RAFTER_YE, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, SHELTER_X, EAST_RAFTER_YE, 6496, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, 230, 6496, 8641, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 5600, SHELTER_X, 6496, 8641, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, SHELTER_X, 8641, Y1n, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, SHELTER_X, Y1n, 9720, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 150, SHELTER_X, -612, 150, L.roof - 0.06, L.roof);
      pb(eBag, 'terraceF', 12650, 14040, 230, 1805, L.roof - 0.06, L.roof);
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
      /* Guard at the arrival edge (x = 4630) — and ONLY where there is a void.
         The comment used to claim it did not cross the stair mouth; it ran
         y 6550..8600 and crossed it completely. Flight B' arrives at roof level
         across y 7641..8641, so that stretch is the last three treads of the
         climb, not an edge: the rail stood square across the top of the stair
         and you met it head-on stepping off the flight. It now stops at 7641.

         The two runs that used to close the north and south sides are gone. The
         mumty is a walled box — its south wall is y 6381..6496 and its north
         wall y 8641..8870 — so rails at y 6550 and y 8600 sat 40–55 mm off solid
         plaster, guarding nothing, over a void nobody can stand in anyway. */
      railing(eBag, 'y', 4630, 6550, 7641, L.roof, 0.95);
      /* Wall lamp + switchboard, BESIDE the terrace door rather than in it.
         Both used to sit at y 7400..7900 — but the door opening is c 7560 w 900,
         i.e. y 7110..8010, so they were fixed to a piece of wall that has a hole
         in it. They hung unsupported in the doorway, and opening the terrace door
         you looked straight at a lamp body and a switch plate floating in the
         opening. The east wall is solid y 6496..7110 and y 8010..8641; these now
         land in those two panels, on the inner face at x 5600.
         The lamp was also inside out — its lens was the part nearest the wall.
         Body plates to the wall, lens projecting into the room. */
      pb(eBag, 'charDark', 5556, 5600, 8140, 8300, L.roof + 1.55, L.roof + 1.95);
      pb(eBag, 'steel', 5562, 5596, 8150, 8290, L.roof + 1.60, L.roof + 1.90);
      pb(eBag, 'lamp', 5536, 5562, 8158, 8282, L.roof + 1.65, L.roof + 1.85);
      pb(eBag, 'white2', 5578, 5600, 6760, 7060, L.roof + 1.20, L.roof + 1.55);
      pb(eBag, 'charDark', 5584, 5598, 6785, 7035, L.roof + 1.25, L.roof + 1.50);
      /* Storage shelf — on the ARRIVAL PAD, not over the stairwell.
         It ran x 800..2800, which at roof level is the open well: a two-metre
         shelf hung over a hole, unreachable and unsupported. The pad is
         x 4630..5600, so it goes on the south wall there, where someone standing
         on the landing can actually use it. */
      pb(eBag, 'woodD', 4700, 5520, 6496, 6566, L.roof + 1.40, L.roof + 1.48);
      pb(eBag, 'woodF', 4720, 5500, 6496, 6510, L.roof + 1.42, L.roof + 1.46);
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
      pb(eBag, 'white', liftOX[0] - 20, liftOX[1] + 20, liftOY[0] - 20, liftOY[1] + 20, L.liftTop, L.liftTop + 0.03);
      pb(eBag, 'copingLight', liftOX[0] - 28, liftOX[1] + 28, liftOY[0] - 28, liftOY[1] + 28, L.liftTop + 0.03, L.liftTop + 0.06);
      externalStair(eBag, true);
      columnsEast(eBag, L.roof - L.slabT);

      // Terrace slab stops at the lift east face on every bay.
      // East of SHELTER_X is pergola only — no plate.
      pb(eBag, 'white', 0, SHELTER_X, -762, EAST_RAFTER_YE, L.roof - L.slabT, L.roof);
      pb(eBag, 'charDark', 60, SHELTER_X - 60, -702, EAST_RAFTER_YE - 60, L.roof - L.slabT - 0.008, L.roof - L.slabT);
      /* THE STAIRWELL MUST GO THROUGH THIS BAY.
         This plate covers x 0..14270, y 3459..8870, and the internal stair comes
         up inside x 230..4630, y 6496..8641 — entirely within it. Drawn solid,
         the terrace slab capped the stair: the flight climbed into the underside
         of the roof and the mumty door opened onto a floor with no way down. The
         terraceF finish above already left this rectangle out, which is what hid
         the problem — the hole existed in the tiling and not in the structure.
         plate() takes the opening; it simply was never used here. */
      const STAIRWELL = [230, 4630, 6496, 8641];
      plate(eBag, 'white', 0, SHELTER_X, EAST_RAFTER_YE, Y1n, STAIRWELL, L.roof - L.slabT, L.roof);
      plate(eBag, 'charDark', 60, SHELTER_X - 60, EAST_RAFTER_YE, Y1n - 60, STAIRWELL,
            L.roof - L.slabT - 0.008, L.roof - L.slabT);
      pb(eBag, 'white', 0, SHELTER_X, Y1n, Y1n + 1000, L.roof - L.slabT, L.roof);
      pb(eBag, 'charDark', 60, SHELTER_X - 60, Y1n, Y1n + 1000 - 60, L.roof - L.slabT - 0.008, L.roof - L.slabT);
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
        // register the source on the lamp itself (see the lighting contract)
        lights.push({
          x: cx / 1000, y: fl + 1.875, z: -(NB[0] - 86) / 1000,
          floor: fl === L.f0 ? 0 : fl === L.f1 ? 1 : 2,
          warm: true, i: LUM_I.sconce, kind: 'sconce'
        });
      }
      // North: GF main door (8650×1200) + each major north window, lamps outside frames
      (function northFacadeLamps() {
        // GF windows — bed02, hall, office
        for (const o of [{ c: 2400, w: 1500 }, { c: 6800, w: 1800 }, { c: 11000, w: 1500 }]) {
          for (const cx of flankCenters(o.c, o.w, 160)) northWallLamp(cx, L.f0);
        }
        // FF / SF north windows (no door on upper north)
        for (const fl of [L.f1, L.f2]) {
          for (const o of [{ c: 5500, w: 1000 }, { c: 8760, w: 1000 }]) {
            for (const cx of flankCenters(o.c, o.w, 160)) {
              // On the FIRST floor the north wall between these two windows is
              // the TV feature wall (x 6020..8241). The inner flanks at 6160 and
              // 8100 land inside its joinery — lamp body, lens and all — so they
              // are skipped there. The media wall gets its own wash sconces.
              if (fl === L.f1 && cx > 6020 && cx < 8241) continue;
              northWallLamp(cx, fl);
            }
          }
        }
      })();

      // ===== EAST FACADE — quiet lime, more layers, no shout =====
      (function eastFacade() {
        const EF = 12650;
        const ey0 = 0, ey1 = 8870;

        // Thin storey datums — 70 mm proud, lime-capped, not 250 mm charcoal bars.
        const datums = [L.f0, L.f1, L.f2, L.roof];
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
        eastWallLamp(5360, L.f2);
        eastWallLamp(8760, L.f2);
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
        const zCap1 = L.f2 + 0.012 + 1.08;     // 8.543 m top head (SF railing cap)

        // South leg: solid plaster wall, FF lower beam soffit to SF rail cap.
        // East leg: continuous unbroken vertical rods from bottom beam soffit to SF rail cap.
        const RB = 60;

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
      outdoorDeck(o1, 30, EX1, NBY0, NBY1 - 30, f1);
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
      // South fascia: 10 mm out / 90 mm in, matching the east lip. Stops at
      // the L-box so it does not stand in front of the south screen.
      pb(o1, 'white', 0, EAST_SOUTH_RET_XW, -762 - 10, -762 + 90, f1 - 0.45, f1 + 0.012);
      pb(o1, 'charDark', 0, BOX_X, NBY1 - 96, NBY1 + 14, f1 - 0.24, f1 - 0.18);
      // The south reveal band used the SAME -10/+90 offsets as the white lip
      // in front of it, so two coplanar faces fought over y=-772 and the
      // shadow line rendered as a dashed speckle. 6 mm proud, like the north.
      pb(o1, 'charDark', 0, EAST_SOUTH_RET_XW, -762 - 16, -762 + 96, f1 - 0.24, f1 - 0.18);
      // Metal on east + NE/SE bays. Long north/south runs and west returns are walls.
      // South bedroom balcony: plaster wall, same run as the SF wall above.
      edgeWall(o1, 'y', 80, SOUTH_FC, 0, f1, 1.08, { plain: true });
      edgeWall(o1, 'x', SOUTH_FC, 0, 4805, f1, 1.08, { plain: true });
      railPillar(o1, 80, SOUTH_FC, f1, 1.08);
      railPillar(o1, 4805, SOUTH_FC, f1, 1.08);
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
      railPillar(o1, EX0, SOUTH_FC, f1, 1.08);
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
      // SF living deck — full east lip, under the terrace slab
      outdoorDeck(o2, EX0, EX1, EAST_RAFTER_YE, Y1n, f2);
      outdoorDeck(o2, 30, EX1, NBY0, NBY1 - 30, f2);
      // No east slab fascia over the FF box bay: the box head IS the east
      // edge here, and a 450 mm fascia at 17272..17362 hung 40 mm below the
      // splayed soffit — a ledge across the top of the opening.
      pb(o2, 'white', 0, EX1 + 10, NBY1 - 90, NBY1 + 10, f2 - 0.45, f2 + 0.012);
      pb(o2, 'white', 0, EAST_SOUTH_RET_XW, -762 - 10, -762 + 90, f2 - 0.45, f2 + 0.012);
      pb(o2, 'charDark', 0, EX1 + 12, NBY1 - 96, NBY1 + 14, f2 - 0.24, f2 - 0.18);
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
      // Loungers sit under the pergola on the SE sit-out — V33 moved them there
      // from the old (15050..16350 × 5500..7380) spot when that bay became the
      // pergola void, so these coordinates are the new deck's, not the old one's.
      Fur.lounger(o2, 14800, 16200, 600, 1400, f2);
      Fur.lounger(o2, 14800, 16200, 1900, 2700, f2);
      Fur.table(o2, 15050, 15850, 1480, 1820, f2, 0.40);
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
        /* Continuous solid slab (ground-floor ceiling / first-floor floor).
           SOLID is correct: the internal stair STARTS at this level and climbs,
           so nothing comes up through it. I briefly cut a stairwell opening here
           to clear a ground-floor flight that should never have existed — the
           hole belongs in the SF and roof plates, which the stair does pass
           through, and not in this one. */
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
      // eastPlaster, not white — the exterior shell draws this same wall in the
      // sand-float plaster, and the two representations are coincident by design
      // (polygonOffset separates them). Leaving this one `white` put two
      // different materials on one plane and the whole east facade z-fought:
      // 1386 coincident hits on a four-face sweep, against 0 before the port.
      wallRun(bag, 'eastPlaster', 'y', eY0d, Y1n, EB[0], EB[1], fY, cut, fY, Eo, 'copingLight');
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
        wallRun(bag, w.mat || 'white2', w.dir, w.a[0], w.a[1], w.b[0], w.b[1], fY, cut, fY, ops, 'copingLight');
        skirtRun(bag, w.dir, w.a[0], w.a[1], w.b[0], w.b[1], fY, ops, ['lo', 'hi']);
      }

      // room tints
      for (const r of ROOMS[fi]) {
        if (r.name === 'LIFT' || r.name === 'PORTICO' || r.name.includes('TERRACE') || r.name.includes('BALCONY')) continue;
        const inset = 45;
        if (fi === 2 && r.name === 'STAIRCASE') {
          // Second floor only: there the stairwell IS a void from x 230 to 4630
          // (the FF→SF flight rises through it), so just the walkway strip
          // x 4630..4920 gets a tint. On the first floor the slab is solid — the
          // stair starts there — so that room tints in full, as normal.
          pb(bag, TYPE[r.type], 4630 + inset, r.x1 - inset, r.y0 + inset, r.y1 - inset, fY + 0.004, fY + 0.012);
        } else {
          pb(bag, TYPE[r.type], r.x0 + inset, r.x1 - inset, r.y0 + inset, r.y1 - inset, fY + 0.004, fY + 0.012);
        }
      }

      /* ================= ROOM-BY-ROOM ARCHITECTURAL LIGHTING PLAN =================
         No false ceiling: surface-mounted architectural luminaires, wall sconces,
         pendant drops, under-cabinet task LEDs, and vanity lights.
         Carefully arranged by spatial function, furniture alignment, and task zones. */
      const ceilY = fY + L.f2f - L.slabT;     // TRUE underside of the slab above
      const Lum = makeLum(bag, fi, fY, ceilY);
      const VOID_TOP = L.f2 + L.f2f - L.slabT; // soffit over the double-height hall

      if (fi === 0) {
        /* --- HALL / formal living (4920..9371, 5345..8640) --- */
        Lum.fan(7150, 7000);                          // 3-blade ceiling fan centered over sofa & coffee table
        Lum.downlight(5800, 6200);                    // 4-canister symmetrical architectural ceiling grid
        Lum.downlight(5800, 7800);
        Lum.downlight(8500, 6200);
        Lum.downlight(8500, 7800);
        Lum.profile('y', 5600, 8400, 9371, null, 'W');// aluminium profile accent light on TV media wall
        Lum.sconce(4920, 6250, 1.85, 'y', 'E');       // up/down architectural wall sconces on solid west wall
        Lum.sconce(4920, 7850, 1.85, 'y', 'E');

        /* --- DINING (4920..9371, 2331..5345) --- */
        Lum.fan(7150, 3800);                          // ceiling fan centered over 6-seater dining table
        Lum.downlight(6200, 3800);                    // pair of surface canister downlights flanking fan
        Lum.downlight(8100, 3800);
        Lum.sconce(4920, 4400, 1.85, 'y', 'E');       // wall sconce on west dining wall

        /* --- KITCHEN (9487..12420, 230..4027) --- */
        Lum.downlight(11000, 1400);                   // surface canister downlights over work aisle
        Lum.downlight(11000, 2800);
        Lum.task(11800, 12400, 240, 800, 1.38);      // under-cabinet east counter LED
        Lum.task(11800, 12400, 1400, 2050, 1.38);
        Lum.task(9499, 9837, 240, 2230, 1.38);       // under-cabinet west counter LED
        Lum.raw(12110, 1100, fY + 1.34, 'task');     // hood lamp

        /* --- OFFICE (9487..12420, 4142..8640) --- */
        Lum.fan(10950, 6400);                         // ceiling fan centered in office
        Lum.ac('y', 12420, 4350, 5300, 'W');          // high-wall split AC on East EXTERIOR wall (compressor in portico)
        Lum.downlight(10950, 5400);                   // surface ceiling downlights over desk & book area
        Lum.downlight(10950, 7400);
        Lum.wallBracket(9487, 7200, 1.85, 'y', 'E');  // reading bracket light near desk

        /* --- MASTER BEDROOM (230..4805, 230..3663) --- */
        Lum.fan(2500, 1950);                          // ceiling fan centered over master bed
        Lum.ac('y', 230, 1300, 2250, 'E');            // high-wall split AC on West EXTERIOR wall (compressor on west bracket)
        Lum.downlight(2000, 2800);                    // surface ceiling downlight over wardrobe aisle
        Lum.downlight(3800, 2800);                    // surface ceiling downlight over dressing zone
        Lum.profile('x', 1400, 3600, 3663, null, 'S');// aluminium perimeter profile light on north wall
        Lum.raw(1700, 480, fY + 0.86, 'bedside');    // side table lamp West
        Lum.raw(4100, 480, fY + 0.86, 'bedside');    // side table lamp East

        /* --- CHILDREN BEDROOM (230..4805, 5460..8640) --- */
        Lum.fan(2500, 7050);                          // ceiling fan centered over children bed
        Lum.ac('y', 230, 6000, 6950, 'E');            // high-wall split AC on West EXTERIOR wall (compressor on west bracket)
        Lum.downlight(2000, 6300);                    // surface ceiling downlight
        Lum.downlight(3600, 6300);
        Lum.downlight(3800, 7800);                    // study desk ceiling downlight
        Lum.raw(1100, 5710, fY + 0.86, 'bedside');
        Lum.raw(3500, 5710, fY + 0.86, 'bedside');

        /* --- MASTER BATH (4920..6752, 230..2216) --- */
        Lum.downlight(5800, 1200);                    // ceiling downlight
        Lum.vanity('x', 4960, 5790, 2204, 1.95, 'S'); // mirror vanity on north wall

        /* --- COMMON BATH (230..2030, 3776..5345) --- */
        Lum.downlight(1200, 4500);
        Lum.wallBracket(2030, 5050, 1.80, 'y', 'W');  // solid partition wall

        /* --- HANDWASH (2145..4920, 3776..5345) --- */
        Lum.downlight(3500, 4500);
        Lum.vanity('x', 2420, 3080, 5333, 1.95, 'S'); // mirror vanity on north wall

        /* --- UTILITY (6870..9371, 230..2332) --- */
        Lum.downlight(8100, 1200);
      }

      if (fi === 1) {
        /* --- HALL / family lounge (4920..10780, 4507..8642) --- */
        Lum.fan(9500, 6800);                          // ceiling fan in east family lounge
        Lum.ac('x', 8642, 9400, 10350, 'S');          // high-wall split AC on North EXTERIOR wall (compressor on north balcony)
        Lum.downlight(8800, 5800);                    // 4-canister symmetrical downlights in lounge
        Lum.downlight(8800, 7600);
        Lum.downlight(10200, 5800);
        Lum.downlight(10200, 7600);
        Lum.sconce(5500, 8642, 1.85, 'x', 'S');       // solid north media wall (west wing)
        Lum.sconce(9500, 8642, 1.85, 'x', 'S');       // solid north media wall (east wing)
        Lum.cluster(7125, 7325, VOID_TOP, [
          { dx: -430, dy: -360, drop: 3.95 },
          { dx: 470, dy: -140, drop: 3.30 },
          { dx: -150, dy: 430, drop: 2.85 },
          { dx: 400, dy: 380, drop: 3.60 }
        ]);

        /* --- DINING (4921..9371, 1526..4506) --- */
        Lum.fan(7150, 3000);                          // ceiling fan centered over dining zone
        Lum.downlight(6200, 3000);                    // pair of surface downlights flanking fan
        Lum.downlight(8100, 3000);
        Lum.sconce(4921, 3600, 1.85, 'y', 'E');       // wall sconce on west dining wall

        /* --- KITCHEN & WET KITCHEN --- */
        Lum.downlight(11000, 3200);
        Lum.downlight(11000, 600);
        Lum.task(11262, 12000, 1539, 1850, 1.38);
        Lum.task(10350, 11780, 4650, 4945, 1.38);
        Lum.task(11900, 12380, 700, 1350, 1.38);

        /* --- POOJA (10893..12418, 5060..6700) --- */
        Lum.raw(11650, 5560, fY + 0.52, 'flame');     // south kuthu-vilakku
        Lum.raw(11650, 6200, fY + 0.52, 'flame');     // north kuthu-vilakku
        Lum.raw(12248, 5880, fY + 0.95, 'flame');     // prabhavali backlight
        Lum.raw(12372, 5530, fY + 1.52, 'flame');     // hanging brass lamps
        Lum.raw(12372, 6230, fY + 1.52, 'flame');
        Lum.wallBracket(10893, 5880, 1.85, 'y', 'E');

        /* --- MASTER BEDROOM (230..4805, 232..4432) --- */
        Lum.fan(2500, 2332);                          // ceiling fan centered in master bedroom
        Lum.ac('y', 230, 1500, 2450, 'E');            // high-wall split AC on West EXTERIOR wall (compressor on south balcony/west bracket)
        Lum.downlight(2000, 3200);                    // surface ceiling downlights
        Lum.downlight(3800, 3200);
        Lum.profile('x', 1400, 3600, 4432, null, 'S');// aluminium profile light on north wall
        Lum.raw(1300, 482, fY + 0.86, 'bedside');
        Lum.raw(3700, 482, fY + 0.86, 'bedside');

        /* --- WALK-IN (2816..4805, 4432..6382) --- */
        Lum.downlight(3800, 5400);
        Lum.task(2900, 4700, 6110, 6350, 1.90);       // over the north shelf run

        /* --- MASTER BATH (230..2705, 4546..6381) --- */
        Lum.downlight(1400, 5300);
        Lum.vanity('x', 2130, 2680, 6369, 1.95, 'S'); // mirror vanity on north wall

        /* --- SOUTH SERVICE BAND --- */
        Lum.downlight(6500, 600);
        Lum.wallBracket(9370, 400, 1.80, 'y', 'W');   // solid common bath wall

        /* --- STAIRCASE --- */
        Lum.wallBracket(230, 7568, 1.85, 'y', 'E');   // solid west masonry wall at landing
      }

      if (fi === 2) {
        /* --- WEST BEDROOM (230..4805, 232..4432) --- */
        Lum.fan(2500, 2332);                          // ceiling fan centered in west bedroom
        Lum.ac('y', 230, 1500, 2450, 'E');            // high-wall split AC on West EXTERIOR wall (compressor on south balcony/west bracket)
        Lum.downlight(2000, 3200);                    // surface ceiling downlights
        Lum.downlight(3800, 3200);
        Lum.profile('x', 1400, 3600, 4432, null, 'S');
        Lum.raw(1300, 482, fY + 0.86, 'bedside');
        Lum.raw(3700, 482, fY + 0.86, 'bedside');

        /* --- WEST WALK-IN (2816..4805, 4432..6382) --- */
        Lum.downlight(3800, 5400);
        Lum.task(2900, 4700, 6110, 6350, 1.90);

        /* --- WEST BATH (230..2705, 4546..6381) --- */
        Lum.downlight(1400, 5300);
        Lum.vanity('x', 2130, 2680, 6369, 1.95, 'S'); // mirror vanity on north wall

        /* --- EAST BEDROOM (7736..12421, 232..4432) --- */
        Lum.fan(10000, 2332);                         // ceiling fan centered in east bedroom
        Lum.ac('y', 12421, 1500, 2450, 'W');          // high-wall split AC on East EXTERIOR wall (compressor on east balcony)
        Lum.downlight(9200, 3200);                    // surface ceiling downlights
        Lum.downlight(11200, 3200);
        Lum.sconce(12421, 2300, 1.85, 'y', 'W');      // solid east wall sconce
        Lum.raw(8810, 442, fY + 0.86, 'bedside');
        Lum.raw(11310, 442, fY + 0.86, 'bedside');

        /* --- EAST WALK-IN (4920..7620, 1871..3151) --- */
        Lum.downlight(6270, 2500);
        Lum.task(5050, 7400, 2880, 3080, 1.90);

        /* --- EAST BATH (4920..7620, 233..1758) --- */
        Lum.downlight(5800, 1000);
        Lum.vanity('x', 6800, 7590, 242, 1.95, 'N');  // mirror vanity on south wall

        /* --- FAMILY ROOM (8241..12421, 4546..8641) --- */
        Lum.fan(10300, 6600);                         // ceiling fan centered in family room
        Lum.ac('x', 8641, 9400, 10350, 'S');          // high-wall split AC on North EXTERIOR wall (compressor on north balcony)
        Lum.downlight(9200, 5800);                    // 4-canister surface downlights
        Lum.downlight(9200, 7400);
        Lum.downlight(11400, 5800);
        Lum.downlight(11400, 7400);
        Lum.sconce(10800, 8641, 1.85, 'x', 'S');      // solid north wall
        Lum.floorLamp(9300, 5200, 1.55);              // freestanding floor lamp

        /* --- STAIRCASE --- */
        Lum.wallBracket(230, 7568, 1.85, 'y', 'E');   // solid west masonry wall at landing
      }

      /* ---- curtains on living / bed / office windows ---- */
      for (const cs of CURT[fi]) curtains(bag, cs.f, cs.c, cs.w, cs.sill, cs.h, fY, cs.m);

      /* ---- per-floor specials & furniture ---- */
      if (fi === 0) {
        // This storey only (0 → cut). Full multi-storey tower lives on exterior.
        liftTower(bag, cut, [L.porticoFl], 0);
        columnsEast(bag, cut, 0);
        // master bed (head South, full-height almirah along West wall up to North window)
        pb(bag, 'rug', 1400, 4400, 200, 2600, fY + 0.012, fY + 0.018); // master bedroom rug
        Fur.bed(bag, 2000, 3800, 230, 2230, fY, 'S');
        Fur.side(bag, 1500, 1900, 230, 730, fY); Fur.side(bag, 3900, 4300, 230, 730, fY);
        Fur.fullHeightWardrobe(bag, 230, 830, 230, 2550, fY, fY + 3.203);
        // bed02 (head South, full-height almirah along West wall up to North window)
        pb(bag, 'rug', 900, 3700, 5400, 7800, fY + 0.012, fY + 0.018);
        Fur.bed(bag, 1400, 3200, 5460, 7460, fY, 'S');
        Fur.side(bag, 900, 1300, 5460, 5960, fY); Fur.side(bag, 3300, 3700, 5460, 5960, fY);
        Fur.fullHeightWardrobe(bag, 230, 830, 5460, 7450, fY, fY + 3.203);
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
        // Entry wall sconce pair inside
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
        // ================= GROUND FLOOR EXECUTIVE OFFICE SUITE =================
        // Room: x 9487–12420, y 4142–8640. Main entrance from East door (y 7400–8600).
        // East window (y 5400–6900), North window (x 10250–11750).
        // Ultra-clean, clutter-free: SW and SE corners 100% open with generous circulation.
        (function groundFloorOffice() {
          // 1) Executive Rug defining the office suite zone
          pb(bag, 'rug', 10100, 12250, 4550, 7150, fY + 0.012, fY + 0.018);

          // 2) North-West Wall Built-in Executive Display Cabinet (x 9487–9850, y 7100–8400)
          // Sleek built-in cabinet in the NW foyer area, completely clear of the SW/S walls.
          pb(bag, 'dark', 9487, 9850, 7100, 8400, fY, fY + 0.78);
          pb(bag, 'woodD', 9475, 9865, 7090, 8410, fY + 0.78, fY + 0.82); // top plate
          // Cupboard doors + brass handles facing East into the main entrance foyer
          const nDoors = 2, dSpan = (8400 - 7100) / nDoors;
          for (let i = 0; i < nDoors; i++) {
            const dy0 = 7100 + i * dSpan + 8, dy1 = 7100 + (i + 1) * dSpan - 8;
            pb(bag, 'dark', 9850, 9864, dy0, dy1, fY + 0.05, fY + 0.75);
            pb(bag, 'brass', 9864, 9874, (dy0 + dy1) / 2 - 25, (dy0 + dy1) / 2 + 25, fY + 0.55, fY + 0.57);
          }
          // Upper open library shelving (h: 0.82..2.25m)
          pb(bag, 'dark', 9487, 9510, 7100, 8400, fY + 0.82, fY + 2.25); // backboard
          pb(bag, 'dark', 9487, 9830, 7090, 7110, fY + 0.82, fY + 2.25); // south end
          pb(bag, 'dark', 9487, 9830, 8390, 8410, fY + 0.82, fY + 2.25); // north end
          pb(bag, 'dark', 9487, 9830, 7740, 7760, fY + 0.82, fY + 2.25); // center divider
          pb(bag, 'woodD', 9475, 9840, 7090, 8410, fY + 2.25, fY + 2.29); // crown molding
          // 3 Shelf tiers with books & decorative objects
          const nwShelves = [fY + 1.20, fY + 1.58, fY + 1.95];
          for (const sh of nwShelves) {
            pb(bag, 'woodD', 9495, 9825, 7110, 8390, sh, sh + 0.024);
            pb(bag, 'lamp', 9515, 9545, 7120, 8380, sh - 0.015, sh);
          }
          const bookColors = ['peetaRed', 'charDark', 'accentWarm', 'curtain2', 'dark', 'brass'];
          for (let bay = 0; bay < 2; bay++) {
            const by0 = 7115 + bay * 640, by1 = 7115 + (bay + 1) * 640 - 20;
            let curY = by0;
            while (curY < by1 - 30) {
              const bThick = 25 + ((curY * 17) % 30);
              const bHeight = 0.20 + ((curY * 13) % 8) * 0.01;
              const bMat = bookColors[Math.abs(Math.round(curY * 5)) % bookColors.length];
              pb(bag, bMat, 9520, 9740, curY, curY + bThick, fY + 0.82, fY + 0.82 + bHeight);
              curY += bThick + 4;
            }
            bag.cyl('brass', 9.65, fY + 1.62, -(by0 + 280) / 1000, 0.038, 0.04);
            bag.sph('murtiGold', 9.65, fY + 1.72, -(by0 + 280) / 1000, 0.028);
          }

          // 3) Luxury Nature-Black & Dark Walnut Executive Desk (x 10480–12050, y 5250–6050, h = 0.75m)
          // Generous 1.1m clear open space to South wall behind chair, 600mm to West aisle.
          pb(bag, 'dark', 10465, 12065, 5235, 6065, fY + 0.71, fY + 0.75); // matte black beveled top
          pb(bag, 'woodD', 10475, 12055, 5245, 6055, fY + 0.68, fY + 0.71); // walnut sub-frame
          // Inlaid leather writing blotter (centered in executive working zone)
          pb(bag, 'charDark', 10750, 11750, 5350, 5800, fY + 0.75, fY + 0.756);
          // Modesty panel facing North
          pb(bag, 'dark', 10880, 11650, 5990, 6020, fY + 0.15, fY + 0.68);

          // Left pedestal drawers (West side)
          pb(bag, 'dark', 10500, 10880, 5280, 6000, fY + 0.04, fY + 0.68);
          // Right pedestal drawers (East side)
          pb(bag, 'dark', 11650, 12030, 5280, 6000, fY + 0.04, fY + 0.68);
          // Pedestal drawer fronts & brass handles (facing South with 1.1m pull clearance)
          for (const px of [10500, 11650]) {
            for (let k = 0; k < 3; k++) {
              const dh0 = fY + 0.06 + k * 0.20, dh1 = fY + 0.06 + (k + 1) * 0.20 - 0.02;
              pb(bag, 'woodD', px + 10, px + 370, 5268, 5280, dh0, dh1);
              pb(bag, 'brass', px + 150, px + 230, 5258, 5268, (dh0 + dh1) / 2 - 0.008, (dh0 + dh1) / 2 + 0.008);
            }
          }

          // 4) Executive Workstation Display & Accessories
          // Sculpted Aluminum Monitor Stand (under and behind screen on executive side)
          pb(bag, 'steel', 11180, 11320, 5780, 5840, fY + 0.752, fY + 0.762); // base plate
          pb(bag, 'steel', 11238, 11262, 5828, 5845, fY + 0.762, fY + 1.04); // neck
          // Ultra-Slim Display Panel (screen facing South toward executive chair)
          pb(bag, 'steel', 10850, 11650, 5835, 5850, fY + 0.94, fY + 1.34); // rear chassis
          pb(bag, 'dark', 10845, 11655, 5828, 5835, fY + 0.935, fY + 1.345); // front slim bezel
          pb(bag, 'tv', 10855, 11645, 5825, 5828, fY + 0.95, fY + 1.33); // screen face
          pb(bag, 'lamp', 11235, 11265, 5822, 5825, fY + 0.942, fY + 0.948); // power LED

          // Slim Keyboard & Mouse on Blotter
          pb(bag, 'dark', 11050, 11450, 5480, 5600, fY + 0.756, fY + 0.766);
          pb(bag, 'steel', 11520, 11600, 5500, 5580, fY + 0.756, fY + 0.768);

          // Sleek Minimalist Architectural Task Lamp (100% vector-connected)
          const lx = 10.62, ly = fY + 0.75, lz = -5.72;
          bag.cyl('brass', lx, ly + 0.005, lz, 0.038, 0.010); // flat brass base
          bag.branch('brass', lx, ly + 0.010, lz, lx, ly + 0.36, lz, 0.005, 0.005); // vertical stem
          bag.sph('brass', lx, ly + 0.36, lz, 0.008); // knuckle joint
          const hx = lx + 0.18, hy = ly + 0.32, hz = lz + 0.10;
          bag.branch('brass', lx, ly + 0.36, lz, hx, hy, hz, 0.0045, 0.0045); // reach arm
          bag.cyl('brass', hx, hy - 0.008, hz, 0.012, 0.14, 0, 0, Math.PI / 2); // lamp head
          pb(bag, 'lamp', Math.round((hx - 0.06) * 1000), Math.round((hx + 0.06) * 1000),
             Math.round((-hz - 0.010) * 1000), Math.round((-hz + 0.010) * 1000),
             hy - 0.024, hy - 0.012); // recessed diffuser

          // 5) Executive High-Back Chair (facing North toward desk)
          Fur.executiveChair(bag, 11250, 4750, fY, 'N');

          // 6) Client / Visitor Consultation Armchairs (North Zone, facing South)
          Fur.chair(bag, 10800, 6750, fY, 'S');
          Fur.chair(bag, 11700, 6750, fY, 'S');
          // Low black wood side table between guest chairs
          Fur.table(bag, 11100, 11400, 6650, 6900, fY, 0.40, 'dark');

          // 7) Architectural Indoor Plant in Brushed-Brass Pot (Northeast corner near door)
          bag.cyl('brass', 12.05, fY + 0.20, -7.10, 0.16, 0.40);
          bag.cyl('soil', 12.05, fY + 0.38, -7.10, 0.15, 0.04);
          bag.cyl('bark', 12.05, fY + 0.65, -7.10, 0.022, 0.55);
          bag.sph('green2', 12.05, fY + 0.85, -7.10, 0.24, 0.35);
          bag.sph('leafLight', 12.08, fY + 1.05, -7.08, 0.18, 0.28);
          bag.sph('green', 12.02, fY + 0.95, -7.14, 0.20, 0.30);
        })();

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

        /* NO ground-floor flight here. The internal stair serves the FF–SF duplex
           and the terrace only; the ground floor is reached from outside and has
           no connection to it. Nothing in ROOMS[0] is a STAIRCASE either — that
           bay on the ground floor is the CHILDREN BEDROOM (x 230..4805,
           y 5460..8640), so a flight landing there would have run through it. */

        // First floor → its own half-landing (flight B of this pair is drawn by SF)
        stairRailing(bag, 'x', 7496, 4630, -1, 330, 10, fY, RISE_I, 0.95, RAIL_IN);
        plainFlight(bag, 'white2', 'x', 6496, 7496, 4630, fY, 1330, fY + 10 * RISE_I, 10, 0.14,
                    { tread: 'woodF' });
        stairLanding(bag, 230, 1330, 6496, 8641, landI(fY), 'woodF');
        railing(bag, 'y', 1330, 7496, 7641, landI(fY), 0.95);
        // furniture
        // --- Master Bedroom 01 (head South, full-height almirah along West wall up to North window) ---
        pb(bag, 'rug', 1100, 4000, 200, 2500, fY + 0.012, fY + 0.018);
        Fur.bed(bag, 1600, 3400, 232, 2132, fY, 'S');               // king bed, headboard against South wall
        Fur.side(bag, 1100, 1500, 232, 732, fY);                     // west side table (flanking bed)
        Fur.side(bag, 3500, 3900, 232, 732, fY);                     // east side table (flanking bed)
        Fur.fullHeightWardrobe(bag, 230, 830, 232, 3250, fY, fY + 3.203); // west wall full-height wardrobe up to window
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
        // --- Entrance (north bay: duplex entry door c 8000 + sidelite c 7100) ---
        // The east wall here is door and glass end to end, and the west wall
        // carries the 1500 opening to the hall, so the north wall is the only
        // free face — console and mirror go there rather than under the
        // sidelite.
        pb(bag, 'rug', 10950, 12350, 7450, 8550, fY + 0.012, fY + 0.018);
        Fur.console(bag, 11000, 12300, 8215, 8615, fY);             // entrance console, 25 mm off the north wall
        Fur.mirror(bag, 11200, 12100, 8615, 8640, fY);              // flush on the north wall above it
        // --- Telugu Hindu pooja (FF) — sacred sanctum facing east ---
        // Room x 10893–12418, y 5060–6700. Mandir on EAST wall facing WEST.
        // Deities: Ganesha (S), Venkateswara (centre), Lakshmi (N).
        // High clerestory light above mandir crown at c: 5880 (sill 2150).
        (function teluguPooja() {
          const midY = 5880;
          const mx0 = 12090, mx1 = 12410;
          const my0 = 5410, my1 = 6350;
          const peetaTop = fY + 0.255;

          // Sacred floor: warm pooja tile + deep red carpet aisle to mandir
          pb(bag, 'tPooja', 10940, 12370, 5103, 6658, fY + 0.004, fY + 0.014);
          pb(bag, 'peetaRed', 11020, 12040, 5730, 6030, fY + 0.014, fY + 0.022);

          // 1) Auspicious Brass-Clad Threshold (Telugu Gadapa / Padi) with Kumkum & Turmeric
          const dwY0 = midY - 500, dwY1 = midY + 500;
          pb(bag, 'brass', 10885, 10915, dwY0, dwY1, fY, fY + 0.035);
          pb(bag, 'saffron', 10888, 10912, dwY0 + 20, dwY1 - 20, fY + 0.035, fY + 0.040);
          for (let dy = dwY0 + 60; dy <= dwY1 - 60; dy += 110) {
            bag.sph('vermilion', 10900 / 1000, fY + 0.044, -dy / 1000, 0.008);
          }

          // Ornate Teakwood Doorway Frame with Brass Accents & Makara-Torana
          pb(bag, 'woodD', 10875, 10915, dwY0 - 35, dwY0, fY, fY + 2.20);
          pb(bag, 'woodD', 10875, 10915, dwY1, dwY1 + 35, fY, fY + 2.20);
          pb(bag, 'woodD', 10875, 10915, dwY0 - 35, dwY1 + 35, fY + 2.15, fY + 2.25);
          // Brass corner plates on door frame
          for (const yf of [dwY0 - 15, dwY1 + 15]) {
            pb(bag, 'brass', 10872, 10918, yf - 18, yf + 18, fY + 0.05, fY + 0.20);
            pb(bag, 'brass', 10872, 10918, yf - 18, yf + 18, fY + 2.05, fY + 2.20);
          }
          // Carved Torana band with mango leaves over entrance
          pb(bag, 'woodF', 10870, 10918, dwY0 - 20, dwY1 + 20, fY + 2.22, fY + 2.30);
          for (let gy = dwY0 + 40; gy < dwY1 - 40; gy += 60) {
            bag.sph('green2', 10875 / 1000, fY + 2.20, -gy / 1000, 0.022);
            bag.sph('leafLight', 10872 / 1000, fY + 2.17, -(gy + 20) / 1000, 0.016);
            if (gy % 120 < 60) bag.sph('lotusPink', 10870 / 1000, fY + 2.19, -gy / 1000, 0.012);
          }

          // Traditional Kolam / Rangoli ring at threshold
          bag.cyl('lotusPink', 11080 / 1000, fY + 0.018, -midY / 1000, 0.22, 0.008);
          bag.cyl('saffron', 11080 / 1000, fY + 0.02, -midY / 1000, 0.14, 0.006);
          bag.cyl('vermilion', 11080 / 1000, fY + 0.022, -midY / 1000, 0.06, 0.005);

          // 2) Silk Pooja Asanam (Floor Prayer Mats) for sitting devotees
          pb(bag, 'peetaRed', 11320, 11720, midY - 380, midY - 80, fY + 0.015, fY + 0.030);
          pb(bag, 'brass', 11310, 11730, midY - 390, midY - 70, fY + 0.012, fY + 0.018); // gold zari border
          pb(bag, 'peetaRed', 11320, 11720, midY + 80, midY + 380, fY + 0.015, fY + 0.030);
          pb(bag, 'brass', 11310, 11730, midY + 70, midY + 390, fY + 0.012, fY + 0.018);

          // 3) Wooden Peeta (two tiers) + Silk Fabric + Storage Drawers
          pb(bag, 'woodD', mx0 - 20, mx1, my0 - 10, my1 + 10, fY, fY + 0.12);
          pb(bag, 'woodF', mx0 - 5, mx1, my0 + 5, my1 - 5, fY + 0.12, fY + 0.24);
          pb(bag, 'brass', mx0 - 8, mx1 - 10, my0 + 15, my1 - 15, fY + 0.235, fY + 0.255);
          pb(bag, 'peetaRed', mx0 + 10, mx1 - 20, my0 + 40, my1 - 40, fY + 0.252, fY + 0.26);
          pb(bag, 'brass', mx0 + 15, mx1 - 25, my0 + 45, my0 + 55, fY + 0.258, fY + 0.265);
          pb(bag, 'brass', mx0 + 15, mx1 - 25, my1 - 55, my1 - 45, fY + 0.258, fY + 0.265);
          // Samagri storage drawer fronts + brass handles
          pb(bag, 'woodD', mx0 - 2, mx0 + 12, my0 + 40, midY - 30, fY + 0.02, fY + 0.22);
          pb(bag, 'woodD', mx0 - 2, mx0 + 12, midY + 30, my1 - 40, fY + 0.02, fY + 0.22);
          pb(bag, 'brass', mx0 - 5, mx0 - 2, midY - 70, midY - 40, fY + 0.10, fY + 0.12);
          pb(bag, 'brass', mx0 - 5, mx0 - 2, midY + 40, midY + 70, fY + 0.10, fY + 0.12);

          // 4) Mandir Backboard with Prabhavali Halo & Warm Divine Backlighting
          pb(bag, 'woodD', mx1 - 28, mx1, my0 + 10, my1 - 10, fY + 0.24, fY + 1.95);
          pb(bag, 'accentWarm', mx1 - 36, mx1 - 26, my0 + 50, my1 - 50, fY + 0.45, fY + 1.70);
          pb(bag, 'lamp', mx1 - 42, mx1 - 34, my0 + 120, my1 - 120, fY + 0.65, fY + 1.55);
          // Prabhavali (Divine Arch) behind Lord Venkateswara
          bag.cyl('brass', 12365 / 1000, fY + 0.90, -midY / 1000, 0.22, 0.012, 0, 0, Math.PI / 2);
          bag.cyl('lamp', 12360 / 1000, fY + 0.90, -midY / 1000, 0.20, 0.008, 0, 0, Math.PI / 2);
          // Side pillars & Mandir sides
          pb(bag, 'woodD', mx0 + 20, mx1 - 28, my0 + 8, my0 + 38, fY + 0.24, fY + 1.85);
          pb(bag, 'woodD', mx0 + 20, mx1 - 28, my1 - 38, my1 - 8, fY + 0.24, fY + 1.85);
          bag.cyl('brass', (mx0 + 45) / 1000, fY + 1.05, -(my0 + 50) / 1000, 0.018, 1.35);
          bag.cyl('brass', (mx0 + 45) / 1000, fY + 1.05, -(my1 - 50) / 1000, 0.018, 1.35);
          pb(bag, 'woodF', mx0 + 15, mx1 - 10, my0 + 20, my1 - 20, fY + 1.72, fY + 1.82);

          // Stepped Gopuram Crown + Sacred Kalasha Top
          pb(bag, 'woodD', mx0 + 30, mx1, my0 + 30, my1 - 30, fY + 1.82, fY + 1.92);
          pb(bag, 'woodF', mx0 + 80, mx1 - 20, my0 + 80, my1 - 80, fY + 1.92, fY + 2.00);
          pb(bag, 'brass', mx0 + 100, mx1 - 40, my0 + 100, my1 - 100, fY + 1.98, fY + 2.02);
          bag.cyl('brass', 12250 / 1000, fY + 2.08, -midY / 1000, 0.035, 0.07);
          bag.sph('brass', 12250 / 1000, fY + 2.14, -midY / 1000, 0.028);
          bag.cone('brass', 12250 / 1000, fY + 2.22, -midY / 1000, 0.018, 0.06);

          // 5) Sacred Hindu Murtis on Peeta (facing West)
          Fur.murtiGanesha(bag, 12270, midY - 250, peetaTop, 0.92);
          Fur.murtiVenkateswara(bag, 12280, midY, peetaTop, 1.05);
          Fur.murtiLakshmi(bag, 12270, midY + 250, peetaTop, 0.92);

          // 6) Traditional Twin Kuthu Vilakku (Standing Brass Lamps) & Diya Row
          Fur.kuthuVilakku(bag, 12130, midY - 280, peetaTop, 0.95);
          Fur.kuthuVilakku(bag, 12130, midY + 280, peetaTop, 0.95);
          Fur.kuthuVilakku(bag, 11650, midY - 320, fY, 0.75);
          Fur.kuthuVilakku(bag, 11650, midY + 320, fY, 0.75);
          for (let i = -2; i <= 2; i++) {
            bag.cyl('brass', 12100 / 1000, peetaTop + 0.015, -(midY + i * 70) / 1000, 0.018, 0.012);
            bag.cone('lamp', 12100 / 1000, peetaTop + 0.04, -(midY + i * 70) / 1000, 0.008, 0.022);
          }

          // 7) Authentic Pooja Articles on Peeta
          // Main Offering Thali + Second Thali
          Fur.poojaThali(bag, 12140, midY, peetaTop + 0.01, 1.0);
          Fur.poojaThali(bag, 12020, midY - 180, peetaTop + 0.01, 0.75);

          // Panchapatra & Uddharani (Holy water vessel + spoon)
          bag.cyl('brass', 12050 / 1000, peetaTop + 0.035, -(midY + 70) / 1000, 0.022, 0.05);
          bag.cyl('brass', 12050 / 1000, peetaTop + 0.058, -(midY + 70) / 1000, 0.025, 0.008); // rim
          bag.cyl('brass', 12055 / 1000, peetaTop + 0.055, -(midY + 65) / 1000, 0.003, 0.07, 0.3, 0, 0.2); // spoon

          // Hand Aarti Bell (Pooja Ghanta) on Peeta
          bag.cone('brass', 12060 / 1000, peetaTop + 0.025, -(midY - 70) / 1000, 0.024, 0.035);
          bag.cyl('brass', 12060 / 1000, peetaTop + 0.055, -(midY - 70) / 1000, 0.005, 0.04);
          bag.sph('brass', 12060 / 1000, peetaTop + 0.078, -(midY - 70) / 1000, 0.008);

          // Sacred Kalasham with Mango Leaves + Coconut (beside Ganesha)
          bag.cyl('brass', 12200 / 1000, peetaTop + 0.04, -(midY - 120) / 1000, 0.028, 0.06);
          bag.sph('brass', 12200 / 1000, peetaTop + 0.08, -(midY - 120) / 1000, 0.030);
          bag.sph('bark', 12200 / 1000, peetaTop + 0.12, -(midY - 120) / 1000, 0.018);
          bag.sph('green2', 12195 / 1000, peetaTop + 0.14, -(midY - 125) / 1000, 0.012);
          bag.sph('green', 12205 / 1000, peetaTop + 0.145, -(midY - 115) / 1000, 0.011);

          // Incense Stand & Sambrani / Dhoop Burner
          bag.cyl('brass', 12150 / 1000, peetaTop + 0.03, -(midY + 120) / 1000, 0.015, 0.04);
          bag.cyl('bark', 12150 / 1000, peetaTop + 0.12, -(midY + 120) / 1000, 0.003, 0.14);
          bag.cyl('bark', 12155 / 1000, peetaTop + 0.12, -(midY + 125) / 1000, 0.003, 0.14);
          // Sambrani cup
          bag.cyl('brass', 12180 / 1000, peetaTop + 0.02, -(midY + 180) / 1000, 0.022, 0.012);
          bag.cone('lamp', 12180 / 1000, peetaTop + 0.045, -(midY + 180) / 1000, 0.01, 0.025);

          // Akshata & Gandham (Sandalwood) Bowls
          bag.cyl('brass', 12020 / 1000, peetaTop + 0.012, -(midY - 120) / 1000, 0.016, 0.014);
          bag.sph('saffron', 12020 / 1000, peetaTop + 0.020, -(midY - 120) / 1000, 0.012);
          bag.cyl('brass', 12020 / 1000, peetaTop + 0.012, -(midY + 120) / 1000, 0.016, 0.014);
          bag.sph('vermilion', 12020 / 1000, peetaTop + 0.020, -(midY + 120) / 1000, 0.012);

          // 8) Framed Deity Photos on South Wall Shelf (wall face y 5060)
          pb(bag, 'woodF', 11180, 11800, 5083, 5131, fY + 1.32, fY + 1.38);
          pb(bag, 'brass', 11170, 11810, 5078, 5135, fY + 1.30, fY + 1.325);
          Fur.poojaPhotoFrame(bag, 11200, 11350, 5091, 5123, fY + 1.40, fY + 1.68);
          Fur.poojaPhotoFrame(bag, 11380, 11530, 5091, 5123, fY + 1.40, fY + 1.68);
          Fur.poojaPhotoFrame(bag, 11560, 11740, 5091, 5123, fY + 1.40, fY + 1.68);

          // 9) Hanging Temple Ghanta (Brass Bell with Chain) in Front of Mandir
          bag.cyl('brass', 11820 / 1000, fY + 2.55, -midY / 1000, 0.005, 0.50); // hanging chain
          bag.cone('brass', 11820 / 1000, fY + 2.22, -midY / 1000, 0.055, 0.10); // bell body
          bag.cyl('brass', 11820 / 1000, fY + 2.28, -midY / 1000, 0.018, 0.04);
          bag.sph('brass', 11820 / 1000, fY + 2.14, -midY / 1000, 0.018); // clapper
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
        // No columnsEast here. V33's portico columns stop under the SF deck
        // (colTop = L.f2 − slabT) because the SE terrace is cut away for the
        // pergola. Called with botH = L.f2 the function's own top is already
        // below its bottom: pb() drops the inverted runs, but the base collar,
        // the plus arms and the coping still land as loose slabs floating over
        // the deck. There is nothing to draw on this storey.
        // Duplex void safety railings overlooking the first floor hall
        railing(bag, 'y', 6020, 6000, 8641, fY, 1.0);
        railing(bag, 'x', 6000, 6020, 8241, fY, 1.0);
        railing(bag, 'y', 8241, 6000, 8641, fY, 1.0);

        // Internal stair: flight B FF→SF (from mid landing) + full SF→roof U-stair
        const midFF = landI(L.f1);
        stairLanding(bag, 230, 1330, 6496, 8641, midFF, 'woodF');
        railing(bag, 'y', 1330, 7496, 7641, midFF, 0.95);
        stairRailing(bag, 'x', 7641, 1330, 1, 330, 10, midFF, RISE_I, 0.95, RAIL_IN);
        plainFlight(bag, 'white2', 'x', 7641, 8641, 1330, midFF, 4630, midFF + 10 * RISE_I, 10, 0.14,
                    { tread: 'woodF', foot: false });
        // tops at L.f1 + 20*RISE_I = L.f2

        // flight A' SF → mid landing toward roof
        plainFlight(bag, 'white2', 'x', 6496, 7496, 4630, fY, 1330, fY + 10 * RISE_I, 10, 0.14,
                    { tread: 'woodF' });
        stairRailing(bag, 'x', 7496, 4630, -1, 330, 10, fY, RISE_I, 0.95, RAIL_IN);
        stairLanding(bag, 230, 1330, 6496, 8641, landI(fY), 'woodF');
        railing(bag, 'y', 1330, 7496, 7641, landI(fY), 0.95);
        // flight B' mid → roof (flush at L.roof)
        plainFlight(bag, 'white2', 'x', 7641, 8641, 1330, landI(fY), 4630, landI(fY) + 10 * RISE_I, 10, 0.14,
                    { tread: 'woodF', foot: false });
        stairRailing(bag, 'x', 7641, 1330, 1, 330, 10, landI(fY), RISE_I, 0.95, RAIL_IN);
        railing(bag, 'y', 4630, 7496, 7641, fY, 0.95);

        /* Mumty arrival pad (void stays open for the climb). */
        stairLanding(bag, 4630, 5600, 6496, 8641, L.roof);
        pb(bag, 'terraceF', 4630, 5580, 6516, 8621, L.roof, L.roof + 0.02);
        // --- Master Bedroom 02 (head South, full-height almirah along West wall up to North window) ---
        pb(bag, 'rug', 1100, 4000, 200, 2500, fY + 0.012, fY + 0.018);
        Fur.bed(bag, 1600, 3400, 232, 2132, fY, 'S');               // king bed, headboard against South wall
        Fur.side(bag, 1100, 1500, 232, 732, fY);                     // west side table (flanking bed)
        Fur.side(bag, 3500, 3900, 232, 732, fY);                     // east side table (flanking bed)
        Fur.fullHeightWardrobe(bag, 230, 830, 232, 3250, fY, fY + 3.203); // west wall full-height wardrobe up to window
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
        Fur.fullHeightWardrobe(bag, 11820, 12420, 232, 3250, fY, fY + 3.203); // East wall full-height wardrobe up to window
        Fur.shelves(bag, 5000, 7540, 2850, 3100, fY);                // walk-in 03
        Fur.shelves(bag, 5000, 5300, 1950, 2850, fY);
        Fur.shower(bag, 5820, 5850, 230, 1130, fY); Fur.showerHead(bag, 5370, 230, fY, 'N');                  // West: shower partition
        Fur.wc(bag, 6295, 515, fY, 'N');                              // Middle: WC facing North
        Fur.basin(bag, 6770, 7620, 230, 780, fY, 'S'); Fur.mirror(bag, 6770, 7620, 230, 242, fY);                    // East: vanity counter
        // --- Second Floor Family Room & Entertainment Lounge ---
        pb(bag, 'rug', 9600, 12200, 5000, 8200, fY + 0.012, fY + 0.018); // family lounge rug
        Fur.sofa(bag, 9900, 12300, 7980, 8580, fY, 'N');             // North sofa facing South
        Fur.sofa(bag, 9900, 12300, 4600, 5200, fY, 'S');             // South sofa facing North
        Fur.sofa(bag, 9100, 9700, 6800, 7500, fY, 'W');              // NW single/double-seater facing East
        Fur.sofa(bag, 9100, 9700, 5700, 6400, fY, 'W');              // SW single/double-seater facing East
        Fur.table(bag, 10300, 11900, 6190, 6990, fY, 0.42);          // Centered coffee table
        Fur.floorLamp(bag, 9300, 5200, fY, 1.55);                    // SW lounge floor lamp
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

    /* The two old "pooja kuthu-vilakku" accents that used to live here sat at
       plan y 7750 / 8310 — a metre and a half out into the FOYER, nowhere near
       the shrine (y 5060..6700) and with no lamp model within 1.6 m. They are
       now placed on the shrine's own geometry in the fi===1 lighting block. */

    /* ---- warm fixtures for walkthrough light pool ----
       Plan mm → world: X = mm/1000, Z = -mm/1000.
       Keep this list sparse and co-located with real lamp geometry so the
       small point-light pool picks intentional accents (not random lawn blobs). */
    function warmFix(xmm, ymm, yM, floor) {
      lights.push({ x: xmm / 1000, y: yM, z: -ymm / 1000, floor: floor, warm: true });
    }
    // North-facade flank lamps are registered by northWallLamp() itself now.
    warmFix(8650, 9200, L.f0 + 2.42, 0);   // entrance canopy under-glow (exterior)
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
    // Gate bollards — moved with V33's gate (car leaf y 4300..8500)
    warmFix(21750, 4170, 0.64, -1);
    warmFix(21750, 8630, 0.64, -1);
    for (let x = 10500; x <= 15500; x += 2500) warmFix(x, 10820, 0.64, -1);
    warmFix(17050, 9200, 0.64, -1);
    warmFix(17050, 10900, 0.64, -1);
    warmFix(13460, 2500, 0.64, -1);
    warmFix(13460, 3400, 0.64, -1);
    // Mushroom lights at placeGarden()'s four lawn trees
    for (const [gx, gy] of [[3600, 14900], [10800, 15700], [16800, 14100], [19800, 15500]]) {
      warmFix(gx, gy, 0.40, -1);
    }
    for (const ly of [1200, 3000, 11000, 14000]) warmFix(22030, ly, 1.25, -1);
    warmFix(22160, 4422, 2.18, -1);
    warmFix(22160, 8422, 2.18, -1);
    /* Interior room lighting is NOT listed here any more. It is emitted by
       `makeLum` at the point each fixture is drawn (see the per-floor lighting
       plan), so a source and its luminaire cannot drift apart. This list keeps
       only exterior / site fixtures. */

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
