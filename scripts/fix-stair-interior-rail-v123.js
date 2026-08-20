/**
 * V1–V3: stair walk-rails + void opening rails
 *
 * Mistakes:
 * 1) Flight-1 "east railing" was an MS bar screen at x 16380–16420 — OUTSIDE the
 *    stair tower / past the treads (treads end 16370). Reads as exterior facade.
 *    → Interior handrail on the walk side of the east stair wall (~x 16290),
 *      westwards toward the first-floor void / main deck.
 *
 * 2) Void east rail was run south to y≈230 like the west rail, but FF slab is
 *    SOLID for y 230–1040 at that X (over mid-landing). A fence there sits in
 *    the middle of deck, not on an opening edge.
 *    → East void rail only along the real void (y 1040–3890 @ VOID_EX).
 *    → West void rail only north of the lift (y LIFT_NY–3890 @ VOID_WX).
 *    → South closer only across the true void mouth at y=1040.
 *    → North mouth fully open for stair arrival (x ~14500–15400).
 *
 * 3) Flight-2 rails stay on the flight (interior); west/east of flight 2 OK.
 */
const fs = require('fs');
const path = require('path');

const NEW_VOID = `    /** FF-level guardrails around the external-stair void (deck drop protection) */
    function externalStairVoidRails(bag, baseH) {
      const h = 1.0;
      const inset = 50;
      // True open void in FF slab:
      //   x VOID_WX(14270)–VOID_EX(15400), y 1040–3890
      //   west edge only walkable north of lift (LIFT_NY); south of that = lift shaft
      const xW = VOID_WX + inset;
      const xE = VOID_EX - inset; // outer-deck west face — not past it into exterior

      // West long side — house/main FF edge along lift outer east (north of lift only)
      railing(bag, 'y', xW, LIFT_NY + inset, 3890 - inset, baseH, h);

      // East long side — outer deck edge of void ONLY (do not run onto solid y<1040 deck)
      railing(bag, 'y', xE, 1040 + inset, 3890 - inset, baseH, h);

      // South of void — north face of solid mid-landing overhead (closes the hole)
      railing(bag, 'x', 1040 + inset, xW, xE, baseH, h);

      // North of void: fully OPEN across stair mouth (flight 2 arrives here)
      // Optional short return west of mouth so west rail meets north deck cleanly
      railing(bag, 'x', 3890 - inset, xW, 14500 - inset, baseH, h);
    }
`;

const NEW_STAIR = `    function externalStair(bag, full) {
      // South tower wall (white — matches building)
      pb(bag, 'white', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);

      if (full) {
        // ——— Climbing handrails: ON the stair (interior), never outside the tower ———
        // Flight 1 (east strip x 15470–16370, GF→landing southbound)
        // West spine (toward void / first-floor main)
        stairRailing(bag, 'y', 15470, 3890, -1, 237.5, 12, L.porticoFl, RISE_E, 0.95, RAIL_OUT);
        // East walk-rail INTERIOR — on the walk face of the stair wall (~16290),
        // west of the old exterior MS screen (was 16380+ outside the treads)
        stairRailing(bag, 'y', 16290, 3890, -1, 237.5, 12, L.porticoFl, RISE_E, 0.95, RAIL_OUT);

        // Flight 2 (west strip x 14500–15400, landing→FF northbound)
        stairRailing(bag, 'y', 14520, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);
        // East of flight 2 = void side, just inside the flight (void deck rail sits at VOID_EX)
        stairRailing(bag, 'y', 15360, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);

        // ——— Mid landing (LAND_E) — 3 open sides; east against stair wall ———
        railing(bag, 'x', 1040, 14500, 15470, LAND_E, 0.95); // north (to void / flight 2)
        railing(bag, 'x', 180, 14500, 16300, LAND_E, 0.95);  // south
        railing(bag, 'y', 14500, 180, 1040, LAND_E, 0.95);   // west open edge
        // East landing = against stair wall — no exterior rail

        // FF arrival: short spine between the two flights only (south of open mouth)
        railing(bag, 'x', 3860, 15360, 15470, L.f1, 0.95);

        stairWalls(bag, 12);
        // NO exterior MS screen at x≈16380 — that was the "railing outside" bug
      }
      // flight 1 (east strip, ascends south)
      flight(bag, 'concrete', 'y', 15470, 16370, 3890, -1, 237.5, 12, L.porticoFl, RISE_E);
      pb(bag, 'concrete', 14500, 16370, 140, 1040, LAND_E - 0.32, LAND_E);
      pb(bag, 'balcTile', 14540, 16330, 180, 1000, LAND_E, LAND_E + 0.012);
      // flight 2 (west strip, ascends north)
      flight(bag, 'concrete', 'y', 14500, 15400, 1040, 1, 237.5, 12, LAND_E, RISE_E);
      pb(bag, 'balcTile', 15490, 16350, 1040, 1277, LAND_E - 0.004, LAND_E - 0.001);
      pb(bag, 'balcTile', 14520, 15380, 3652, 3890, L.f1 - 0.008, L.f1 - 0.002);
    }
`;

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');

  const voidStart = s.indexOf('    /** FF-level guardrails around the external-stair void');
  const voidStart2 = s.indexOf('    /** FF-level rails around the external-stair void');
  const vs = voidStart >= 0 ? voidStart : voidStart2;
  const stairStart = s.indexOf('    function externalStair(bag, full) {');
  const liftStart = s.indexOf('    function liftTower(bag, topH, doors, botH) {');
  if (vs < 0 || stairStart < 0 || liftStart < 0) {
    console.log(v, 'markers missing', { vs, stairStart, liftStart });
    continue;
  }

  s = s.slice(0, vs) + NEW_VOID + NEW_STAIR + s.slice(liftStart);
  fs.writeFileSync(f, s);
  try {
    require('vm').runInNewContext('var window={};' + s, { console });
    console.log(v, 'OK');
  } catch (e) {
    console.log(v, 'PARSE FAIL', e.message);
  }
}

// Verify no exterior MS screen left, and interior rail present
const t = fs.readFileSync('elevations/version-one/houseScene.js', 'utf8');
const a = t.indexOf('function externalStairVoidRails');
const b = t.indexOf('function liftTower');
console.log('--- resulting stair + void ---');
console.log(t.slice(a, b));
console.log('has 16380 exterior?', /16380/.test(t.slice(a, b)));
console.log('has interior 16290?', /16290/.test(t.slice(a, b)));
