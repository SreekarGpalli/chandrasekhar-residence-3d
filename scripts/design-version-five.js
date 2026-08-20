/**
 * Version Five elevation design: "Lime · Laterite · Shade"
 * Climate-first Indian contemporary for Anantapur (hot-dry).
 *
 * Design principles (cost-effective, minimal, architecturally composed):
 *  1. Soft lime plaster body + dark stone plinth
 *  2. Terracotta laterite used sparingly (chajjas, portals, accents)
 *  3. Slim slab datums — not heavy horizontal bars
 *  4. MS jaali screens on blank wall zones (shade + pattern)
 *  5. Deeper entry canopies for solar control
 *  6. Ordered portico columns (base / shaft / capital)
 *  7. Continuous refined parapet skyline
 *
 * Materials stay buildable: plaster, paint, RCC chajja, MS jaali, limited stone.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'elevations', 'version-five', 'houseScene.js');
let src = fs.readFileSync(FILE, 'utf8');

function mustReplace(label, from, to) {
  if (!src.includes(from)) {
    // try flexible: if already applied, skip
    if (src.includes(to.slice(0, Math.min(80, to.length)))) {
      console.log('skip (already)', label);
      return;
    }
    throw new Error('Could not find marker for: ' + label);
  }
  src = src.replace(from, to);
  console.log('ok', label);
}

function replaceBetween(label, startMark, endMark, replacement) {
  const i0 = src.indexOf(startMark);
  if (i0 < 0) throw new Error('start not found: ' + label + ' :: ' + startMark);
  const i1 = src.indexOf(endMark, i0 + startMark.length);
  if (i1 < 0) throw new Error('end not found: ' + label + ' :: ' + endMark);
  // Replace [startMark … endMark) — endMark is preserved after the insert
  src = src.slice(0, i0) + replacement + src.slice(i1);
  console.log('ok block', label);
}

/* ---------- header ---------- */
mustReplace(
  'header',
  `/* ============================================================
   elevations / version-five — EXTERIOR ONLY (Version Five)
   Copied from project houseScene.js and stripped of all interior
   geometry (rooms, partitions, furniture kit, dollhouse floors,
   curtains, skirting). Outdoor amenity + shell + site remain so
   elevation studies stay fast and easy to edit.
   ============================================================ */`,
  `/* ============================================================
   elevations / version-five — EXTERIOR ONLY (Version Five)
   DESIGN: "Lime · Laterite · Shade" — Indian contemporary
   for hot-dry Anantapur. Minimal, climate-first, cost-aware.

   Body: soft lime plaster. Base: dark local stone plinth.
   Accents: terracotta laterite (chajja soffits, portals, thin
   markers). Shade: deep RCC chajjas + MS jaali on blank zones.
   Composition: slim slab datums, ordered portico columns,
   continuous parapet — quiet luxury without excess material.

   Buildable with plaster, paint, RCC, mild-steel, limited stone.
   ============================================================ */`
);

/* ---------- palette: climate Indian contemporary ---------- */
mustReplace(
  'palette comment + keys',
  `  /* ---------------- palette ----------------
     One theme: warm modern minimal — ivory plaster, warm charcoal
     massing, soft limestone floors, brass + stainless accents. */
  const C = {
    white:   0xd6c9ae,  // warm ivory plaster
    white2:  0xded2b8,  // near-white interior partitions / ceilings
    charcoal:0x3a3733,  // warm charcoal massing
    charDark:0x2b2825,  // deep charcoal fascia / caps
    plinth:  0x3a3733,  // matches charcoal for a clean base
    frame:   0x2f3236,  // dark bronze window/door frames
    glass:   0x7a90a0,  // clear blue-grey glazing
    walnut:  0x5c4836,  // warm walnut entry doors
    ms:      0x343230,  // painted mild steel (rail bars)
    brass:   0xc9a15e,  // soft antique brass
    steel:   0xb8bdc2,  // brushed stainless`,
  `  /* ---------------- palette ----------------
     V5 "Lime · Laterite · Shade" — soft lime body, dark stone base,
     terracotta accents, cool glazing for Anantapur heat. */
  const C = {
    white:   0xd6c9ae,  // soft lime plaster (sun-softened white)
    white2:  0xded2b8,  // lighter lime / ceilings
    charcoal:0x3c3834,  // warm charcoal massing / fins
    charDark:0x282521,  // deep charcoal fascia / drip edges
    plinth:  0x4a4540,  // dark stone plinth (Kadapa / granite reading)
    frame:   0x2a2d31,  // dark bronze window/door frames
    glass:   0x6d8494,  // cooler blue-grey glazing (heat glare control)
    walnut:  0x5a4634,  // warm walnut entry doors
    ms:      0x363330,  // painted mild steel (jaali + rails)
    brass:   0xc4a36a,  // soft antique brass (sparse hardware only)
    steel:   0xb5babf,  // brushed stainless`
);

mustReplace(
  'accent + coping',
  `    accentWarm: 0x9a7d5c, copingLight: 0xd4cdc0,`,
  `    // terracotta laterite (earth accent — cost-effective clay tone)
    accentWarm: 0xb07848,
    // limestone / pale stone coping
    copingLight: 0xddd6c8,
    // light stone band (optional secondary accent)
    stoneBand: 0x8a847a,`
);

/* material tuning for new surfaces */
mustReplace(
  'material surface tuning',
  `    M.white.roughness = 0.88; M.white2.roughness = 0.86;
    M.charcoal.roughness = 0.82; M.charDark.roughness = 0.8;
    M.plinth.roughness = 0.9; M.concrete.roughness = 0.92;
    M.ms.roughness = 0.5; M.ms.metalness = 0.22;
    M.steel.roughness = 0.32; M.steel.metalness = 0.78;
    M.brass.roughness = 0.36; M.brass.metalness = 0.7;
    M.frame.roughness = 0.38; M.frame.metalness = 0.55;
    M.accentWarm.roughness = 0.72; M.copingLight.roughness = 0.65;`,
  `    M.white.roughness = 0.90; M.white2.roughness = 0.88; // lime plaster reads matte
    M.charcoal.roughness = 0.84; M.charDark.roughness = 0.82;
    M.plinth.roughness = 0.78; M.concrete.roughness = 0.92; // stone plinth slightly smoother
    M.ms.roughness = 0.48; M.ms.metalness = 0.28;
    M.steel.roughness = 0.32; M.steel.metalness = 0.78;
    M.brass.roughness = 0.38; M.brass.metalness = 0.68;
    M.frame.roughness = 0.36; M.frame.metalness = 0.58;
    M.accentWarm.roughness = 0.78; M.copingLight.roughness = 0.62;
    if (M.stoneBand) { M.stoneBand.roughness = 0.74; M.stoneBand.metalness = 0.02; }`
);

/* deeper climate chajjas */
mustReplace(
  'chajja depth',
  `    if (spec.chajja) {
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
    }`,
  `    if (spec.chajja) {
      // V5 climate chajja: deeper projection (650mm) + terracotta soffit
      // — essential shade for Anantapur south/west heat without heavy mass.
      const proj = 650;
      const cb = outSign > 0 ? [bb1, bb1 + proj] : [bb0 - proj, bb0];
      put('charDark', a0 - 160, a1 + 160, cb[0], cb[1], t + 0.04, t + 0.12);
      const inner = outSign > 0
        ? [bb1 + 18, bb1 + proj - 22]
        : [bb0 - (proj - 22), bb0 - 18];
      put('accentWarm', a0 - 130, a1 + 130, inner[0], inner[1], t + 0.015, t + 0.04);
      const drip = outSign > 0
        ? [bb1 + proj - 18, bb1 + proj + 8]
        : [bb0 - proj - 8, bb0 - proj + 18];
      put('charDark', a0 - 165, a1 + 165, drip[0], drip[1], t + 0.01, t + 0.13);
    }`
);

/* refined portico columns */
mustReplace(
  'columnsEast',
  `    function columnsEast(bag, topH, botH) {
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
    }`,
  `    function columnsEast(bag, topH, botH) {
      // V5 ordered portico: stone base · lime shaft · stone capital.
      // Clean classical proportion without mid-bands or excess trim.
      if (botH === undefined || botH === null) botH = 0;
      const baseH = 0.42;   // taller stone base reads as plinth continuity
      const capH = 0.18;
      const shaftBot = botH + baseH;
      const shaftTop = Math.max(shaftBot + 0.05, topH - capH);
      for (const cy of [8720, 4290, 150]) {
        // stone base (slightly wider)
        pb(bag, 'plinth', 16285, 16615, cy - 165, cy + 165, botH, shaftBot);
        pb(bag, 'copingLight', 16280, 16620, cy - 170, cy + 170, shaftBot - 0.04, shaftBot);
        // lime plaster shaft (recessed)
        pb(bag, 'white', 16320, 16580, cy - 130, cy + 130, shaftBot, shaftTop);
        // stone capital + thin terracotta edge
        pb(bag, 'plinth', 16290, 16610, cy - 160, cy + 160, shaftTop, topH);
        pb(bag, 'accentWarm', 16295, 16605, cy - 155, cy + 155, topH - 0.035, topH);
      }
    }`
);

/* ---------- full facade treatment rewrite ---------- */
const facadeBlock = `      // ===== EAST FACADE — V5 Lime · Laterite · Shade =====
      (function eastFacade() {
        const EF = 12650; // east wall outer face x (mm)
        const ey0 = 0, ey1 = 8870;

        // Slim horizontal slab datums (120mm project) — quiet floor lines, not heavy bars.
        function slimBand(h0, h1, cap0, cap1) {
          pb(eBag, 'charDark', EF - 15, EF + 120, ey0 - 30, ey1 + 30, h0, h1);
          pb(eBag, 'copingLight', EF - 18, EF + 128, ey0 - 35, ey1 + 35, cap0, cap1);
        }
        slimBand(L.f0 - 0.01, L.f0 + 0.10, L.f0 + 0.10, L.f0 + 0.13);
        slimBand(L.f1 - 0.12, L.f1 - 0.01, L.f1 - 0.01, L.f1 + 0.02);
        slimBand(L.f2 - 0.12, L.f2 - 0.01, L.f2 - 0.01, L.f2 + 0.02);
        slimBand(L.roof - 0.12, L.roof - 0.01, L.roof - 0.01, L.roof + 0.02);

        // Thin terracotta plinth nose on east (material transition stone→lime)
        pb(eBag, 'accentWarm', EF - 8, EF + 55, ey0 - 20, ey1 + 20, L.f0 + 0.13, L.f0 + 0.16);

        // Refined opening surround: charcoal outer + terracotta inner lip (not thick picture frames)
        function accentSurround(c, w, sill, h, floorY) {
          const ya = c - w / 2, yb = c + w / 2;
          const hBot = floorY + sill / 1000;
          const hTop = hBot + h / 1000;
          const sw = 70; // slimmer than baseline
          const swM = sw / 1000;
          const sx0 = EF - 12, sx1 = EF + 72;
          // charcoal outer frame
          pb(eBag, 'charDark', sx0, sx1, ya - sw, yb + sw, hTop + 0.008, hTop + swM + 0.008);
          if (sill > 100) {
            pb(eBag, 'charDark', sx0, sx1, ya - sw, yb + sw, hBot - swM - 0.008, hBot - 0.008);
            // terracotta sill nose
            pb(eBag, 'accentWarm', sx0 + 5, sx1 + 8, ya - 40, yb + 40, hBot - 0.02, hBot + 0.01);
          }
          pb(eBag, 'charDark', sx0, sx1, ya - sw, ya - 6, hBot - (sill > 100 ? swM + 0.008 : 0), hTop + swM + 0.008);
          pb(eBag, 'charDark', sx0, sx1, yb + 6, yb + sw, hBot - (sill > 100 ? swM + 0.008 : 0), hTop + swM + 0.008);
          // terracotta inner lip (header only — quiet warmth)
          pb(eBag, 'accentWarm', sx1 - 18, sx1 + 6, ya - 30, yb + 30, hTop - 0.02, hTop + 0.035);
        }
        for (const o of OPEN.f0.E) accentSurround(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.E) accentSurround(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.E) accentSurround(o.c, o.w, o.sill || 0, o.h, L.f2);

        // MS jaali screens on blank wall zones (cost-effective shade + Indian pattern)
        // Grid of vertical bars + two horizontals — reads as lattice, not solid cladding.
        function jaaliPanel(y0, y1, z0, z1) {
          const depth0 = EF - 5, depth1 = EF + 48;
          // back plate (slightly proud lime-dark charcoal field)
          pb(eBag, 'charcoal', depth0, depth1 - 20, y0, y1, z0, z1);
          // vertical MS bars every ~140mm
          const span = y1 - y0;
          const n = Math.max(3, Math.round(span / 140));
          for (let i = 0; i <= n; i++) {
            const y = y0 + (span * i) / n;
            pb(eBag, 'ms', depth1 - 22, depth1, y - 12, y + 12, z0 + 0.04, z1 - 0.04);
          }
          // horizontal rails (thirds)
          for (const t of [0.12, 0.5, 0.88]) {
            const zh = z0 + (z1 - z0) * t;
            pb(eBag, 'ms', depth1 - 22, depth1, y0 + 20, y1 - 20, zh - 0.012, zh + 0.012);
          }
          // terracotta edge trim top
          pb(eBag, 'accentWarm', depth0, depth1 + 4, y0 - 8, y1 + 8, z1 - 0.03, z1 + 0.01);
        }
        // GF blank between kitchen window and office door
        jaaliPanel(3550, 5200, L.f0 + 0.35, L.f0 + 2.55);
        // FF blank south of duplex entry
        jaaliPanel(4000, 5200, L.f1 + 0.35, L.f1 + 2.55);
        // SF blank south of french door
        jaaliPanel(4000, 5200, L.f2 + 0.35, L.f2 + 2.55);

        // Single compositional vertical marker (not three heavy fins) — terracotta-capped
        pb(eBag, 'charcoal', EF - 8, EF + 160, 8480, 8620, L.f0 + 0.20, L.roof - 0.18);
        pb(eBag, 'accentWarm', EF - 8, EF + 165, 8475, 8625, L.roof - 0.18, L.roof - 0.12);
        pb(eBag, 'accentWarm', EF - 8, EF + 165, 8475, 8625, L.f0 + 0.16, L.f0 + 0.20);

        // Entry canopies — deeper (900mm) for real shade + terracotta soffit
        function entryCanopy(y0, y1, floorY) {
          pb(eBag, 'charDark', EF - 20, EF + 900, y0, y1, floorY + 2.48, floorY + 2.58);
          pb(eBag, 'accentWarm', EF + 40, EF + 880, y0 + 25, y1 - 25, floorY + 2.38, floorY + 2.48);
          pb(eBag, 'lamp', EF + 90, EF + 820, y0 + 80, y1 - 80, floorY + 2.365, floorY + 2.38);
          pb(eBag, 'charDark', EF + 885, EF + 920, y0 - 10, y1 + 10, floorY + 2.36, floorY + 2.60);
          // thin side cheeks (shade walls)
          pb(eBag, 'charDark', EF + 40, EF + 160, y0 - 40, y0 + 15, floorY + 2.10, floorY + 2.58);
          pb(eBag, 'charDark', EF + 40, EF + 160, y1 - 15, y1 + 40, floorY + 2.10, floorY + 2.58);
        }
        // GF office door
        entryCanopy(5280, 7080, L.f0);
        // FF duplex entry (door + sidelite)
        entryCanopy(5280, 7470, L.f1);
        // SF french door — lighter canopy
        entryCanopy(5480, 7340, L.f2);

        // Portico column accents handled in columnsEast (stone base/capital)
      })();

      // ===== N / S / W facade datum bands — slim continuous language =====
      (function perimeterBands() {
        const datums = [
          [L.f0 - 0.01, L.f0 + 0.09, L.f0 + 0.09, L.f0 + 0.12],
          [L.f1 - 0.11, L.f1 - 0.01, L.f1 - 0.01, L.f1 + 0.015],
          [L.f2 - 0.11, L.f2 - 0.01, L.f2 - 0.01, L.f2 + 0.015],
          [L.roof - 0.11, L.roof - 0.01, L.roof - 0.01, L.roof + 0.015]
        ];
        const serviceWallBot = L.f1 - 0.05;
        const serviceWallTop = L.f2 + 0.05;
        for (const [bh0, bh1, ch0, ch1] of datums) {
          // North
          pb(eBag, 'charDark', 200, 12420, Y1n - 15, Y1n + 100, bh0, bh1);
          pb(eBag, 'copingLight', 190, 12430, Y1n - 18, Y1n + 108, ch0, ch1);
          // South bedroom stretch
          pb(eBag, 'charDark', 200, 4800, -15, 100, bh0, bh1);
          pb(eBag, 'copingLight', 190, 4810, -18, 108, ch0, ch1);
          // South service band only where wall exists
          if (bh0 >= serviceWallBot && bh1 <= serviceWallTop) {
            pb(eBag, 'charDark', 4920, 12420, -762 - 15, -762 + 100, bh0, bh1);
            pb(eBag, 'copingLight', 4910, 12430, -762 - 18, -762 + 108, ch0, ch1);
          }
          // West
          pb(eBag, 'charDark', -15, 100, 200, 8640, bh0, bh1);
          pb(eBag, 'copingLight', -18, 108, 190, 8650, ch0, ch1);
        }
        // Terracotta plinth nose on N/S/W (matches east)
        pb(eBag, 'accentWarm', 180, 12440, Y1n + 90, Y1n + 125, L.f0 + 0.12, L.f0 + 0.15);
        pb(eBag, 'accentWarm', 180, 4820, -20, 15, L.f0 + 0.12, L.f0 + 0.15);
        pb(eBag, 'accentWarm', -20, 15, 180, 8660, L.f0 + 0.12, L.f0 + 0.15);
      })();

      // ===== NORTH FACADE — main entry as composed portal =====
      (function northFacade() {
        const NF = Y1n; // 8870
        function nSurround(c, w, sill, h, floorY) {
          const xa = c - w / 2, xb = c + w / 2;
          const hBot = floorY + sill / 1000;
          const hTop = hBot + h / 1000;
          const sw = 65, swM = sw / 1000;
          const sy0 = NF - 12, sy1 = NF + 70;
          pb(eBag, 'charDark', xa - sw, xb + sw, sy0, sy1, hTop + 0.008, hTop + swM + 0.008);
          if (sill > 100) {
            pb(eBag, 'charDark', xa - sw, xb + sw, sy0, sy1, hBot - swM - 0.008, hBot - 0.008);
            pb(eBag, 'accentWarm', xa - 35, xb + 35, sy1 - 10, sy1 + 12, hBot - 0.018, hBot + 0.01);
          }
          pb(eBag, 'charDark', xa - sw, xa - 6, sy0, sy1,
             hBot - (sill > 100 ? swM + 0.008 : 0), hTop + swM + 0.008);
          pb(eBag, 'charDark', xb + 6, xb + sw, sy0, sy1,
             hBot - (sill > 100 ? swM + 0.008 : 0), hTop + swM + 0.008);
        }
        for (const o of OPEN.f0.N) nSurround(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.N) nSurround(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.N) nSurround(o.c, o.w, o.sill || 0, o.h, L.f2);

        // Main door portal: deep charcoal recess + terracotta reveal + floating canopy
        // Door c=8650 w=1200 → leaf 8050..9250
        pb(eBag, 'charDark', 7920, 9380, NF - 20, NF + 80, L.f0, L.f0 + 2.55); // recess face
        pb(eBag, 'accentWarm', 7980, 9320, NF + 70, NF + 95, L.f0 + 0.08, L.f0 + 2.48); // terracotta reveal
        // Floating canopy 900mm north over stoop
        pb(eBag, 'charDark', 7850, 9450, NF - 20, NF + 900, L.f0 + 2.50, L.f0 + 2.60);
        pb(eBag, 'accentWarm', 7900, 9400, NF + 40, NF + 870, L.f0 + 2.39, L.f0 + 2.50);
        pb(eBag, 'lamp', 8120, 9180, NF + 90, NF + 780, L.f0 + 2.375, L.f0 + 2.39);
        pb(eBag, 'charDark', 7830, 9470, NF + 880, NF + 915, L.f0 + 2.36, L.f0 + 2.62);
        // Canopy support blades (minimal)
        pb(eBag, 'charDark', 7920, 7980, NF + 40, NF + 160, L.f0 + 2.20, L.f0 + 2.60);
        pb(eBag, 'charDark', 9320, 9380, NF + 40, NF + 160, L.f0 + 2.20, L.f0 + 2.60);

        // One vertical marker east of main door (solid wall 9400–10100 clear)
        pb(eBag, 'charcoal', 9680, 9820, NF - 8, NF + 140, L.f0 + 0.20, L.roof - 0.18);
        pb(eBag, 'accentWarm', 9675, 9825, NF - 8, NF + 145, L.roof - 0.18, L.roof - 0.12);
        pb(eBag, 'accentWarm', 9675, 9825, NF - 8, NF + 145, L.f0 + 0.16, L.f0 + 0.20);

        // Jaali screen west of main entry blank (between hall window and door) — if clear
        // Hall win ends ~7700; door starts 8050 — tight. Use far west solid: 3800-4900.
        (function northJaali() {
          const y0 = NF - 5, y1 = NF + 45;
          const x0 = 4000, x1 = 4700;
          const z0 = L.f0 + 0.40, z1 = L.f0 + 2.50;
          pb(eBag, 'charcoal', x0, x1, y0, y1 - 15, z0, z1);
          const n = 6;
          for (let i = 0; i <= n; i++) {
            const x = x0 + ((x1 - x0) * i) / n;
            pb(eBag, 'ms', x - 10, x + 10, y1 - 20, y1, z0 + 0.05, z1 - 0.05);
          }
          for (const t of [0.15, 0.5, 0.85]) {
            const zh = z0 + (z1 - z0) * t;
            pb(eBag, 'ms', x0 + 15, x1 - 15, y1 - 20, y1, zh - 0.01, zh + 0.01);
          }
          pb(eBag, 'accentWarm', x0 - 5, x1 + 5, y0, y1 + 4, z1 - 0.025, z1 + 0.01);
        })();
      })();

      // ===== PORTICO AMBIENT — soft column uplights =====
      (function porticoLights() {
        const t0 = L.porticoFl + 0.016;
        for (const cy of [8720, 4290, 150]) {
          pb(eBag, 'steel', 16240, 16285, cy - 32, cy + 32, t0, t0 + 0.045);
          pb(eBag, 'lamp', 16248, 16278, cy - 24, cy + 24, t0 + 0.035, t0 + 0.07);
          pb(eBag, 'steel', 16615, 16660, cy - 32, cy + 32, t0, t0 + 0.045);
          pb(eBag, 'lamp', 16622, 16652, cy - 24, cy + 24, t0 + 0.035, t0 + 0.07);
        }
        for (const fl of [L.porticoFl, L.f1, L.f2]) {
          for (const [x0, x1] of [[12720, 12800], [13890, 13970]]) {
            pb(eBag, 'charDark', x0, x1, 2035, 2105, fl + 1.55, fl + 1.90);
            pb(eBag, 'steel', x0 + 10, x1 - 10, 2040, 2095, fl + 1.58, fl + 1.87);
            pb(eBag, 'lamp', x0 + 15, x1 - 15, 2105, 2135, fl + 1.62, fl + 1.82);
          }
        }
      })();

      // ===== SOUTH FACADE — deep chajjas already on openings; slim surrounds =====
      (function southFacade() {
        const SF = 0;
        function sSurround(c, w, sill, h, floorY) {
          const xa = c - w / 2, xb = c + w / 2;
          const hBot = floorY + sill / 1000;
          const hTop = hBot + h / 1000;
          const sw = 60, swM = sw / 1000;
          const sy0 = SF - 70, sy1 = SF + 12;
          pb(eBag, 'charDark', xa - sw, xb + sw, sy0, sy1, hTop + 0.008, hTop + swM + 0.008);
          if (sill > 100) {
            pb(eBag, 'charDark', xa - sw, xb + sw, sy0, sy1, hBot - swM - 0.008, hBot - 0.008);
            pb(eBag, 'accentWarm', xa - 30, xb + 30, sy0 - 8, sy0 + 15, hBot - 0.018, hBot + 0.008);
          }
          pb(eBag, 'charDark', xa - sw, xa - 6, sy0, sy1,
             hBot - (sill > 100 ? swM + 0.008 : 0), hTop + swM + 0.008);
          pb(eBag, 'charDark', xb + 6, xb + sw, sy0, sy1,
             hBot - (sill > 100 ? swM + 0.008 : 0), hTop + swM + 0.008);
        }
        for (const o of OPEN.f0.S) if (o.c < 7000) sSurround(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.S) sSurround(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.S) if (o.c < 7000 || o.type === 'win') sSurround(o.c, o.w, o.sill || 0, o.h, L.f2);

        // Horizontal terracotta string course mid GF bedroom wall (south heat shield cue)
        pb(eBag, 'accentWarm', 400, 4600, -55, 8, L.f0 + 1.55, L.f0 + 1.62);
      })();

      // ===== WEST FACADE — shade-critical; deeper fins + jaali =====
      (function westFacade() {
        const WF = 0;
        function wSurround(c, w, sill, h, floorY) {
          const ya = c - w / 2, yb = c + w / 2;
          const hBot = floorY + sill / 1000;
          const hTop = hBot + h / 1000;
          const sw = 60, swM = sw / 1000;
          const sx0 = WF - 70, sx1 = WF + 12;
          pb(eBag, 'charDark', sx0, sx1, ya - sw, yb + sw, hTop + 0.008, hTop + swM + 0.008);
          if (sill > 100) {
            pb(eBag, 'charDark', sx0, sx1, ya - sw, yb + sw, hBot - swM - 0.008, hBot - 0.008);
            pb(eBag, 'accentWarm', sx0 - 8, sx0 + 15, ya - 30, yb + 30, hBot - 0.018, hBot + 0.008);
          }
          pb(eBag, 'charDark', sx0, sx1, ya - sw, ya - 6,
             hBot - (sill > 100 ? swM + 0.008 : 0), hTop + swM + 0.008);
          pb(eBag, 'charDark', sx0, sx1, yb + 6, yb + sw,
             hBot - (sill > 100 ? swM + 0.008 : 0), hTop + swM + 0.008);
        }
        for (const o of OPEN.f0.W) wSurround(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.W) wSurround(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.W) wSurround(o.c, o.w, o.sill || 0, o.h, L.f2);

        // Two shade fins (west sun) — clear of openings (clear ~900-2000, ~5900-6300)
        for (const fy of [1200, 6100]) {
          pb(eBag, 'charcoal', WF - 200, WF + 8, fy - 70, fy + 70, L.f0 + 0.20, L.roof - 0.18);
          pb(eBag, 'accentWarm', WF - 205, WF + 10, fy - 75, fy + 75, L.roof - 0.18, L.roof - 0.12);
          pb(eBag, 'accentWarm', WF - 205, WF + 10, fy - 75, fy + 75, L.f0 + 0.16, L.f0 + 0.20);
        }
        // West jaali between fins on blank GF zone (~4900-5800 careful of openings)
        // Openings: GF 2360-3560, 4260-4860, 6400-7600. Clear 5000-6300 partially hits FF.
        // Use 2000-2300 strip above lower openings.
        (function westJaali() {
          const x0 = WF - 50, x1 = WF + 5;
          const y0 = 2000, y1 = 2300;
          const z0 = L.f0 + 0.45, z1 = L.f0 + 2.45;
          pb(eBag, 'charcoal', x0, x1 - 10, y0, y1, z0, z1);
          for (let i = 0; i <= 4; i++) {
            const y = y0 + ((y1 - y0) * i) / 4;
            pb(eBag, 'ms', x0 - 5, x0 + 8, y - 10, y + 10, z0 + 0.04, z1 - 0.04);
          }
          pb(eBag, 'accentWarm', x0 - 6, x1, y0 - 5, y1 + 5, z1 - 0.025, z1 + 0.01);
        })();
      })();

      // ===== PARAPET / SKYLINE — continuous refined coping + terracotta edge =====
      (function parapetSkyline() {
        // Thin terracotta edge on existing parapet top (reads as clay coping course)
        const pt = L.parapetTop;
        pb(eBag, 'accentWarm', X0 - 25, eastX[1] + 25, -790, -580, pt + 0.07, pt + 0.095);
        pb(eBag, 'accentWarm', X0 - 25, eastX[1] + 25, 9690, 9900, pt + 0.07, pt + 0.095);
        pb(eBag, 'accentWarm', X0 - 25, 185, -790, 9750, pt + 0.07, pt + 0.095);
        pb(eBag, 'accentWarm', eastX[1] - 185, eastX[1] + 25, -790, 9750, pt + 0.07, pt + 0.095);
      })();

`;

replaceBetween(
  'facade suite',
  '      // ===== EAST FACADE TREATMENT — Modern Minimal Elevation =====',
  '    })();\n    const exterior = eBag.build(THREE, materials); exterior.name = \'exterior\'; root.add(exterior);',
  facadeBlock
);

/* stoneBand is in palette - ensure mk loop picks it up (it does via Object.keys(C)) */

/* Optional: slightly richer glass opacity for heat feel — skip to keep simple */

/* Plinth expression — taller visual stone base band on main block */
mustReplace(
  'plinth base',
  `      // plinth + GF base
      pb(eBag, 'plinth', X0 - 35, X1 + 35, Y0n - 35, Y1n + 35, 0, L.f0);`,
  `      // plinth + GF base — V5 dark stone mass reads as grounded local plinth
      pb(eBag, 'plinth', X0 - 40, X1 + 40, Y0n - 40, Y1n + 40, 0, L.f0);
      // slight stone projection (rustication) for shadow line at grade
      pb(eBag, 'plinth', X0 - 55, X1 + 55, Y0n - 55, Y1n + 55, 0, 0.12);
      pb(eBag, 'charDark', X0 - 58, X1 + 58, Y0n - 58, Y1n + 58, 0.10, 0.14);`
);

fs.writeFileSync(FILE, src);
console.log('\nVersion Five design written →', FILE);
console.log('lines', src.split('\n').length);
