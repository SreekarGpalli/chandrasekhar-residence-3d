/**
 * V1–V3: rewrite external stair + FF void railings for practical safety.
 *
 * Geometry (plan mm):
 *   Lift: x 12650–14270, y 0–2035 (outer E = VOID_WX)
 *   Stair void: x VOID_WX(14270)–VOID_EX(15400), y 1040–3890
 *   Flight 1 (GF→landing): x 15470–16370, y 3890 → 1040 (southbound)
 *   Landing: x 14500–16370, y 140–1040 @ LAND_E
 *   Flight 2 (landing→FF): x 14500–15400, y 1040 → 3890 (northbound)
 *   Stair mouth onto FF deck: y≈3890, x 14500–15400 (leave open)
 */
const fs = require('fs');
const path = require('path');

const NEW_VOID_RAILS = `    /** FF-level guardrails around the external-stair void (deck drop protection) */
    function externalStairVoidRails(bag, baseH) {
      const h = 1.0;
      const inset = 50; // keep posts just inside slab edge
      // West void edge = lift outer east — only where FF deck sits west of the void
      // (north of lift). South of LIFT_NY the lift wall itself is the barrier.
      railing(bag, 'y', VOID_WX + inset, LIFT_NY + inset, 3890 - inset, baseH, h);
      // East void edge = outer deck west face (full void run)
      railing(bag, 'y', VOID_EX - inset, 1040 + inset, 3890 - inset, baseH, h);
      // South void edge = north face of mid-landing deck (lift E → void E)
      railing(bag, 'x', 1040 + inset, VOID_WX + inset, VOID_EX - inset, baseH, h);
      // North void edge — leave stair mouth open (x 14500..15400) for arrival
      railing(bag, 'x', 3890 - inset, VOID_WX + inset, 14500 - inset, baseH, h);
      // Short return at NE void corner so outer deck edge is closed to the mouth
      railing(bag, 'x', 3890 - inset, VOID_EX - 200, VOID_EX - inset, baseH, h);
    }
`;

const NEW_EXTERNAL_STAIR = `    function externalStair(bag, full) {
      // South tower wall (white — matches building)
      pb(bag, 'white', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);

      if (full) {
        // ——— Climbing handrails (follow treads; one rail per open side) ———
        // Flight 1 west edge (spine) — east side uses continuous MS screen below
        stairRailing(bag, 'y', 15470, 3890, -1, 237.5, 12, L.porticoFl, RISE_E, 0.95, RAIL_OUT);
        // Flight 2 west edge (outer open side of inner flight)
        stairRailing(bag, 'y', 14500, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);
        // Flight 2 east edge (void side) — climb with steps; FF deck rail is separate at VOID_EX
        stairRailing(bag, 'y', 15380, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);

        // ——— Mid landing (LAND_E) perimeter — practical 3-sided guard ———
        // North edge of landing (toward flight 2 / void)
        railing(bag, 'x', 1040, 14500, 15470, LAND_E, 0.95);
        // South edge of landing (toward tower south wall) — leave east against wall
        railing(bag, 'x', 180, 14500, 16300, LAND_E, 0.95);
        // West edge of landing (open drop)
        railing(bag, 'y', 14500, 180, 1040, LAND_E, 0.95);
        // East landing edge is against stair wall / MS screen — no extra rail

        // ——— FF arrival: only a short spine between the two flights (not a long fence) ———
        // Closes the gap between flight-1 spine and flight-2 east rail at deck level
        railing(bag, 'x', 3890, 15380, 15470, L.f1, 0.95);

        stairWalls(bag, 12);

        // East MS bar screen along flight 1 (outer face) — safety screen, not a second handrail
        pb(bag, 'ms', 16380, 16420, 230, towY[1], L.f1 - 0.02, L.f1 + 0.04); // top rail
        const n = Math.round((towY[1] - 380) / 152);
        for (let i = 0; i <= n; i++) {
          const sy = 300 + ((towY[1] - 80 - 300) * i) / n;
          let botH = L.porticoFl;
          if (sy <= 1040) {
            botH = LAND_E;
          } else if (sy < 3890) {
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
`;

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');

  const voidStart = s.indexOf('    /** FF-level rails around the external-stair void');
  // also match if already rewritten
  const voidStart2 = s.indexOf('    /** FF-level guardrails around the external-stair void');
  const vs = voidStart >= 0 ? voidStart : voidStart2;
  const stairStart = s.indexOf('    function externalStair(bag, full) {');
  if (vs < 0 || stairStart < 0) {
    console.log(v, 'markers missing', { vs, stairStart });
    continue;
  }

  // Replace void rails function (from its comment/start through just before externalStair)
  s = s.slice(0, vs) + NEW_VOID_RAILS + s.slice(stairStart);

  // Re-find externalStair after edit
  const es = s.indexOf('    function externalStair(bag, full) {');
  const liftStart = s.indexOf('    function liftTower(bag, topH, doors, botH) {');
  if (es < 0 || liftStart < 0) {
    console.log(v, 'stair/lift markers missing after void replace');
    continue;
  }
  s = s.slice(0, es) + NEW_EXTERNAL_STAIR + s.slice(liftStart);

  fs.writeFileSync(f, s);
  try {
    require('vm').runInNewContext('var window={};' + s, { console });
    console.log(v, 'OK parse');
  } catch (e) {
    console.log(v, 'PARSE FAIL', e.message);
  }
}
