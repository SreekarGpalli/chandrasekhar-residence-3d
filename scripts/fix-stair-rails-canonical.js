/**
 * Canonical external U-stair + void rails (edge-only).
 *
 * PLAN mm  (X → east, Y → north)
 * ═══════════════════════════════════════════════════════════════════
 *
 *   X:  14270      14500      15400  15470      16370  16600    17362
 *       VOID_WX    F2 west    F2 east F1 west   F1 east wall    EX1
 *                  │←─ F2 ─→│ │←── F1 ──→│
 *                  │ 900 mm  │ │  900 mm   │
 *
 *   Y=3890 ── FF arrival mouth open x 14500–15400 ─────────────────
 *            │ void west │  FLIGHT 2 ↑     │spine│ F1 below deck │
 *            │ rail      │  climb N        │     │               │
 *            │ @14320    │  rails @14520   │     │ spine @15470  │
 *            │           │       & @15380  │     │               │
 *   Y=1040 ──┼───────────┴─────────────────┴─────┴───────────────┤
 *            │              MID LANDING 14500–16370               │
 *            │   rails: N@1040, S@180, W@14500  (E = stair wall)  │
 *   Y=140  ──┴────────────────────────────────────────────────────┘
 *
 *   Flight 1: x 15470–16370, y 3890 → 1040 (south, GF→landing)
 *   Flight 2: x 14500–15400, y 1040 → 3890 (north, landing→FF)
 *   Void hole FF: x 14270–15400, y 1040–3890 (west of lift only N of LIFT_NY)
 *   Outer deck: x ≥ 15400
 *
 * RAIL RULES
 * ──────────
 * 1. Climbing handrails sit ON flight edges only (never mid-tread, never
 *    past the outer face of the stair tower).
 * 2. FF void rails sit ON the deck edges of the hole only.
 * 3. No full-height MS screen at x≈16380 (that was outside the treads).
 * 4. North mouth x 14500–15400 stays open for arrival.
 *
 * EDGE INSETS (mm into the walking surface from the structural edge)
 *   F2 west  14500 + 20 = 14520
 *   F2 east  15400 − 20 = 15380   (clear of void deck rail at VOID_EX−50)
 *   F1 west  15470 +  0 = 15470   (spine / well side)
 *   F1 east  — none (east wall 16300–16600 is the barrier; no exterior bars)
 *   Void W   VOID_WX + 50 = 14320 (main-deck side of hole)
 *   Void E   VOID_EX − 50 = 15350 (outer-deck side of hole)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const STAMP = 'STAIR_RAIL_FIX_20260812f';

const NEW_VOID = `    /**
     * FF void guardrails — deck edges of the stair hole only.
     * STAMP: ${STAMP}
     *
     *   xW = VOID_WX+50 (~14320)  main-deck edge
     *   xE = VOID_EX-50 (~15350)  outer-deck edge
     *   y  = 1040..3890           open hole (east); west only N of lift
     */
    function externalStairVoidRails(bag, baseH) {
      const h = 1.0;
      const inset = 50;
      const xW = VOID_WX + inset;
      const xE = VOID_EX - inset;

      // West long — first-floor main side, north of lift only
      railing(bag, 'y', xW, LIFT_NY + inset, 3890 - inset, baseH, h);
      // East long — outer-deck edge of hole (not mid-landing solid y<1040)
      railing(bag, 'y', xE, 1040 + inset, 3890 - inset, baseH, h);
      // South closer — north face of mid-landing overhead
      railing(bag, 'x', 1040 + inset, xW, xE, baseH, h);
      // North — mouth open for flight-2 arrival; return only west of mouth
      railing(bag, 'x', 3890 - inset, xW, 14500 - inset, baseH, h);
    }
`;

function makeStair(southMat) {
  return `    /**
     * External U-stair — climbing rails ON flight edges only.
     * STAMP: ${STAMP}
     *
     *   F1 x 15470–16370  south 3890→1040   rail west @15470 (spine)
     *   F2 x 14500–15400  north 1040→3890   rails @14520 and @15380
     *   No mid-flight rails. No exterior MS @16380.
     */
    function externalStair(bag, full) {
      pb(bag, '${southMat}', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);

      if (full) {
        // ——— Flight 1 (east strip): rail on WEST spine only ———
        // East side = stair wall (16300–16600). Do not put metal outside the treads.
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
        // no exterior MS / bronze screen at x≈16380
      }

      // Structure
      flight(bag, 'concrete', 'y', 15470, 16370, 3890, -1, 237.5, 12, L.porticoFl, RISE_E);
      pb(bag, 'concrete', 14500, 16370, 140, 1040, LAND_E - 0.32, LAND_E);
      pb(bag, 'balcTile', 14540, 16330, 180, 1000, LAND_E, LAND_E + 0.012);
      flight(bag, 'concrete', 'y', 14500, 15400, 1040, 1, 237.5, 12, LAND_E, RISE_E);
      pb(bag, 'balcTile', 15490, 16350, 1040, 1277, LAND_E - 0.004, LAND_E - 0.001);
      pb(bag, 'balcTile', 14520, 15380, 3652, 3890, L.f1 - 0.008, L.f1 - 0.002);
    }
`;
}

const targets = [
  { file: 'houseScene.js', south: 'charDark' },
  { file: 'elevations/version-one/houseScene.js', south: 'white' },
  { file: 'elevations/version-two/houseScene.js', south: 'white' },
  { file: 'elevations/version-three/houseScene.js', south: 'white' },
  { file: 'elevations/version-four/houseScene.js', south: 'basalt' },
  { file: 'elevations/version-five/houseScene.js', south: 'white' }
];

function stamp(s) {
  s = s.replace(/\n\s*\/\/ STAIR_RAIL_FIX_\w+\n/g, '\n');
  s = s.replace(
    /\n\s*if \(typeof window !== 'undefined'\) window\.__HOUSE3D_STAIR_RAIL__ = '[^']+';\n/g,
    '\n'
  );
  return s.replace(
    'window.HouseScene = (function () {',
    `window.HouseScene = (function () {\n  // ${STAMP}\n  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = '${STAMP}';`
  );
}

for (const t of targets) {
  if (!fs.existsSync(t.file)) continue;
  let s = stamp(fs.readFileSync(t.file, 'utf8'));
  const vs =
    s.indexOf('    /** FF-level guardrails around the external-stair void') >= 0
      ? s.indexOf('    /** FF-level guardrails around the external-stair void')
      : s.indexOf('    /** FF-level rails around the external-stair void');
  // also match our newer comment form
  const vs2 = s.indexOf('    /**\n     * FF void guardrails');
  const voidStart = vs >= 0 ? vs : vs2;
  const stairStart = s.indexOf('    function externalStair(bag, full) {');
  // match either style of externalStair leading comment
  const stairComment = s.indexOf('    /**\n     * External U-stair');
  const es = stairComment >= 0 && stairComment < stairStart ? stairComment : stairStart;
  const liftStart = s.indexOf('    function liftTower(bag, topH, doors, botH) {');

  // Find void function start more reliably
  let voidAt = s.indexOf('function externalStairVoidRails');
  if (voidAt < 0) {
    console.log(t.file, 'no void fn');
    continue;
  }
  // back up to preceding comment block
  let voidBlock = s.lastIndexOf('    /**', voidAt);
  if (voidBlock < 0 || voidAt - voidBlock > 400) voidBlock = voidAt - '    '.length;

  const stairAt = s.indexOf('function externalStair(bag, full)');
  if (stairAt < 0 || liftStart < 0) {
    console.log(t.file, 'markers missing');
    continue;
  }
  let stairBlock = s.lastIndexOf('    /**', stairAt);
  if (stairBlock < 0 || stairAt - stairBlock > 500) stairBlock = s.indexOf('    function externalStair(bag, full)');

  // Replace from void comment through end of externalStair (before liftTower)
  const replaceFrom = Math.min(voidBlock, stairBlock);
  // Actually void comes first, then stair, then lift
  const voidFnStart = s.lastIndexOf('\n', s.indexOf('function externalStairVoidRails')) + 1;
  // include leading spaces line with comment
  let from = s.lastIndexOf('    /**', s.indexOf('function externalStairVoidRails'));
  if (from < 0) from = voidFnStart;
  s = s.slice(0, from) + NEW_VOID + makeStair(t.south) + s.slice(liftStart);

  fs.writeFileSync(t.file, s);
  try {
    vm.runInNewContext('var window={};' + s, { console });
    const mid = /stairRailing\(bag, 'y', 14900/.test(s);
    const ext = /pb\(bag,\s*'(ms|bronze)',\s*1638/.test(s);
    const f2e = /stairRailing\(bag, 'y', 15380/.test(s);
    const f2w = /stairRailing\(bag, 'y', 14520/.test(s);
    console.log(t.file, 'OK', { midBad: mid, extMS: ext, f2e, f2w, stamp: s.includes(STAMP) });
  } catch (e) {
    console.log(t.file, 'PARSE FAIL', e.message);
  }
}

for (const v of ['version-one', 'version-two', 'version-three', 'version-four', 'version-five']) {
  const f = path.join('elevations', v, 'index.html');
  if (!fs.existsSync(f)) continue;
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace(/STAIR_RAIL_FIX_20260812[a-z]/g, STAMP);
  fs.writeFileSync(f, h);
}
if (fs.existsSync('index.html')) {
  let h = fs.readFileSync('index.html', 'utf8');
  h = h.replace(/houseScene\.js\?v=[^"']+/g, 'houseScene.js?v=' + STAMP);
  fs.writeFileSync('index.html', h);
}
console.log('UI stamp', STAMP);
