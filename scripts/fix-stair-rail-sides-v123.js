/**
 * V1–V3: fix stair walk-rails + void rails
 *
 * Mistakes fixed:
 * 1) Flight-1 east "rail" was an MS screen OUTSIDE the stair (x≈16380–16420),
 *    past the treads (treads end ~16370). That reads as exterior.
 *    → Proper handrail on the EAST EDGE of the flight (x≈16350), interior to the tower.
 *
 * 2) Void east rail was run south to y=230 like the west rail, but south of y=1040
 *    there is continuous mid-landing deck — a fence at VOID_EX there sits in the
 *    middle of the deck (exterior of the stair well). East void rail only where the
 *    void actually is (y 1040–3890). West rail still full length along the lift
 *    (y 230–3890). South closer only across the real void south edge (y=1040).
 *
 * 3) North mouth stays fully open for easy stair access.
 */
const fs = require('fs');
const path = require('path');

const NEW_VOID = `    /** FF-level guardrails around the external-stair void (deck drop protection) */
    function externalStairVoidRails(bag, baseH) {
      const h = 1.0;
      const inset = 50;
      const xW = VOID_WX + inset; // west = lift outer east
      const xE = VOID_EX - inset; // east = true void east edge (not past outer deck)

      // West: full run along lift — south end of lift → stair arrival
      railing(bag, 'y', xW, 230 + inset, 3890 - inset, baseH, h);

      // East: ONLY along the open void (y 1040–3890). Do NOT continue south onto
      // the solid mid-landing deck (that made the rail look "outside" the stair).
      railing(bag, 'y', xE, 1040 + inset, 3890 - inset, baseH, h);

      // South of void (north face of mid-landing) — closes void only
      railing(bag, 'x', 1040 + inset, xW, xE, baseH, h);

      // North of void: fully OPEN for walk-on stair access (no choke / no stubs)
    }
`;

const NEW_STAIR = `    function externalStair(bag, full) {
      // South tower wall (white — matches building)
      pb(bag, 'white', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);

      if (full) {
        // ——— Climbing handrails: sit ON the stair edges (interior), not outside ———
        // Flight 1 (east strip x 15470–16370): west spine + east tread edge
        stairRailing(bag, 'y', 15470, 3890, -1, 237.5, 12, L.porticoFl, RISE_E, 0.95, RAIL_OUT);
        // East walk-rail ON the flight (was wrongly an exterior screen at ~16380+)
        stairRailing(bag, 'y', 16350, 3890, -1, 237.5, 12, L.porticoFl, RISE_E, 0.95, RAIL_OUT);

        // Flight 2 (west strip x 14500–15400): both open sides on the flight
        stairRailing(bag, 'y', 14520, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);
        // East side of flight 2 = void side, just inside the flight (not out on outer deck)
        stairRailing(bag, 'y', 15360, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);

        // ——— Mid landing (LAND_E) ———
        railing(bag, 'x', 1040, 14500, 15470, LAND_E, 0.95); // north (to void)
        railing(bag, 'x', 180, 14500, 16300, LAND_E, 0.95);  // south
        railing(bag, 'y', 14500, 180, 1040, LAND_E, 0.95);   // west open edge
        // East landing edge: against flight-1 east rail / wall — no extra exterior rail

        // FF arrival: short spine between the two flights only (south of open mouth)
        railing(bag, 'x', 3860, 15360, 15470, L.f1, 0.95);

        stairWalls(bag, 12);

        // Light MS infill under flight-1 east handrail (on the flight edge, NOT outside)
        // Posts follow treads; top rail already from stairRailing at x=16350
        const n = 12;
        for (let i = 0; i <= n; i++) {
          const sy = 3890 - i * 237.5;
          const botH = L.porticoFl + i * RISE_E;
          if (sy < 230) continue;
          pb(bag, 'ms', 16340, 16360, sy - 15, sy + 15, botH, botH + 0.90);
        }
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
  const stairStart = s.indexOf('    function externalStair(bag, full) {');
  const liftStart = s.indexOf('    function liftTower(bag, topH, doors, botH) {');
  if (voidStart < 0 || stairStart < 0 || liftStart < 0) {
    console.log(v, 'markers missing', { voidStart, stairStart, liftStart });
    continue;
  }

  s = s.slice(0, voidStart) + NEW_VOID + NEW_STAIR + s.slice(liftStart);
  fs.writeFileSync(f, s);
  try {
    require('vm').runInNewContext('var window={};' + s, { console });
    console.log(v, 'OK');
  } catch (e) {
    console.log(v, 'PARSE FAIL', e.message);
  }
}
