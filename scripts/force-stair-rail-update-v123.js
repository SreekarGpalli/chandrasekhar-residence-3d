/**
 * Force a clearly-correct stair + void rail layout on V1–V3, and stamp
 * a version marker so we can confirm the browser loaded the new file.
 *
 * Geometry (plan mm, X east+, Y north+):
 *   Lift outer E = VOID_WX = 14270
 *   Void open     = x 14270–15400, y 1040–3890 (FF slab hole)
 *   Flight 1      = x 15470–16370, y 3890→1040 (GF → mid landing)
 *   Flight 2      = x 14500–15400, y 1040→3890 (mid landing → FF)
 *   Outer deck    = x ≥ 15420 (east of void)
 *
 * Mistakes being fixed:
 * A) Full-height MS screen at x≈16380 rose to FF through the OUTER DECK —
 *    that is an exterior fence, not a stair walk-rail. REMOVE completely.
 * B) Walk rail on flight 1 belongs on the WEST spine (x=15470) toward the
 *    first-floor main / void — NOT on the east outer face.
 * C) Void rails only on real opening edges (not across solid mid-landing deck).
 */
const fs = require('fs');
const path = require('path');

const STAMP = 'STAIR_RAIL_FIX_20260812c';

const NEW_VOID = `    /** FF-level guardrails around the external-stair void (deck drop protection)
     *  STAMP: ${STAMP}
     */
    function externalStairVoidRails(bag, baseH) {
      const h = 1.0;
      const inset = 50;
      // Real FF hole: x VOID_WX–VOID_EX, y 1040–3890
      // West walkable edge only north of lift; east edge only where outer deck meets void.
      const xW = VOID_WX + inset;       // toward first-floor main
      const xE = VOID_EX - inset;       // outer-deck / void edge (NOT out on EX1)

      // West long — first-floor main side (north of lift only)
      railing(bag, 'y', xW, LIFT_NY + inset, 3890 - inset, baseH, h);

      // East long — only along true void (do not fence solid y 230–1040 deck)
      railing(bag, 'y', xE, 1040 + inset, 3890 - inset, baseH, h);

      // South closer — north face of mid-landing overhead deck
      railing(bag, 'x', 1040 + inset, xW, xE, baseH, h);

      // North: open stair mouth (flight 2 arrival). Short return west of mouth only.
      railing(bag, 'x', 3890 - inset, xW, 14500 - inset, baseH, h);
    }
`;

const NEW_STAIR = `    function externalStair(bag, full) {
      // South tower wall (white — matches building)
      pb(bag, 'white', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);

      if (full) {
        // ——— Climbing handrails ON the flights (interior) ———
        // Flight 1: ONLY the west spine walk-rail (toward first-floor main / void).
        // East side is the stair wall — do NOT put a metal rail on the outer/east face.
        stairRailing(bag, 'y', 15470, 3890, -1, 237.5, 12, L.porticoFl, RISE_E, 0.95, RAIL_OUT);

        // Flight 2: both open sides, posts sit on the flight (interior of void)
        stairRailing(bag, 'y', 14520, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);
        // East of flight 2 stays just inside treads — clear of void deck rail at VOID_EX
        stairRailing(bag, 'y', 15360, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);

        // Mid landing — 3 open sides; east against stair wall
        railing(bag, 'x', 1040, 14500, 15470, LAND_E, 0.95);
        railing(bag, 'x', 180, 14500, 16300, LAND_E, 0.95);
        railing(bag, 'y', 14500, 180, 1040, LAND_E, 0.95);

        // FF arrival spine between flights only (mouth stays open)
        railing(bag, 'x', 3860, 15360, 15470, L.f1, 0.95);

        stairWalls(bag, 12);
        // CRITICAL: no full-height MS screen at x≈16380 (that was exterior on the outer deck)
      }
      flight(bag, 'concrete', 'y', 15470, 16370, 3890, -1, 237.5, 12, L.porticoFl, RISE_E);
      pb(bag, 'concrete', 14500, 16370, 140, 1040, LAND_E - 0.32, LAND_E);
      pb(bag, 'balcTile', 14540, 16330, 180, 1000, LAND_E, LAND_E + 0.012);
      flight(bag, 'concrete', 'y', 14500, 15400, 1040, 1, 237.5, 12, LAND_E, RISE_E);
      pb(bag, 'balcTile', 15490, 16350, 1040, 1277, LAND_E - 0.004, LAND_E - 0.001);
      pb(bag, 'balcTile', 14520, 15380, 3652, 3890, L.f1 - 0.008, L.f1 - 0.002);
    }
`;

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');

  // Stamp near top of IIFE so we can grep / console-check
  if (!s.includes(STAMP)) {
    s = s.replace(
      'window.HouseScene = (function () {',
      `window.HouseScene = (function () {\n  // ${STAMP}\n  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = '${STAMP}';`
    );
    // some files may use different pattern
    if (!s.includes(STAMP)) {
      s = s.replace(
        '(function () {',
        `(function () {\n  // ${STAMP}\n  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = '${STAMP}';`
      );
    }
  }

  const voidStart = s.indexOf('    /** FF-level guardrails around the external-stair void');
  const voidStart2 = s.indexOf('    /** FF-level rails around the external-stair void');
  const vs = voidStart >= 0 ? voidStart : voidStart2;
  const stairStart = s.indexOf('    function externalStair(bag, full) {');
  const liftStart = s.indexOf('    function liftTower(bag, topH, doors, botH) {');
  if (vs < 0 || stairStart < 0 || liftStart < 0) {
    console.log(v, 'MARKERS MISSING', { vs, stairStart, liftStart });
    continue;
  }

  s = s.slice(0, vs) + NEW_VOID + NEW_STAIR + s.slice(liftStart);

  // Hard-delete any leftover exterior MS screen geometry if still present
  s = s.replace(
    /\/\/ East MS bar screen[\s\S]*?for \(let i = 0; i <= n; i\+\+\) \{[\s\S]*?pb\(bag, 'ms', 16378, 16422,[\s\S]*?\n        \}\n/,
    ''
  );
  s = s.replace(/pb\(bag, 'ms', 16380, 16420,[\s\S]*?;\s*\/\/ top rail\n/g, '');

  fs.writeFileSync(f, s);
  const ok = s.includes(STAMP) && !/pb\(bag,\s*'ms',\s*16380/.test(s);
  try {
    require('vm').runInNewContext('var window={};' + s, { console });
    console.log(v, ok ? 'OK' : 'WARN-check', 'stamp', s.includes(STAMP), 'noExtMS', !/pb\(bag,\s*'ms',\s*16380/.test(s));
  } catch (e) {
    console.log(v, 'PARSE FAIL', e.message);
  }
}
