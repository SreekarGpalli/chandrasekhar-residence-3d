/**
 * Real fix for east stair walk-rail (V1–V5 + root).
 *
 * Mesh dump after 20260812d showed MS@16380 already gone. The rail the user
 * still sees as "east / exterior" is the dense cluster at X≈15350–15360:
 *   void-east deck rail + flight-2 east climbing rail stacked together.
 * That X barely moved from the original (~15380 / VOID_EX) — so the scene
 * still looks the same to them.
 *
 * Fix:
 *   - Flight-2 WEST climb rail stays @ 14520 (toward first-floor main) — correct
 *   - Flight-2 EAST climb rail moves 15360 → 14900 (westward on the flight,
 *     toward main / interior — the walk rail they hold)
 *   - Void-east deck rail stays at VOID_EX-50 for outer-deck fall protection
 *     (no longer stacked on the climbing rail)
 *   - West void rail unchanged
 *   - Flight-1 spine only, no exterior MS
 *   - Mouth open
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const STAMP = 'STAIR_RAIL_FIX_20260812e';

const NEW_VOID = `    /** FF-level guardrails around the external-stair void
     *  STAMP: ${STAMP}
     */
    function externalStairVoidRails(bag, baseH) {
      const h = 1.0;
      const inset = 50;
      const xW = VOID_WX + inset; // first-floor main side (~14320)
      const xE = VOID_EX - inset; // outer-deck edge of hole (~15350)

      // West — main FF (correct side)
      railing(bag, 'y', xW, LIFT_NY + inset, 3890 - inset, baseH, h);
      // East — deck edge of void only (not stacked on climbing handrail)
      railing(bag, 'y', xE, 1040 + inset, 3890 - inset, baseH, h);
      // South closer
      railing(bag, 'x', 1040 + inset, xW, xE, baseH, h);
      // North mouth open; short return west of mouth
      railing(bag, 'x', 3890 - inset, xW, 14500 - inset, baseH, h);
    }
`;

function makeStair(southMat) {
  return `    function externalStair(bag, full) {
      pb(bag, '${southMat}', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);

      if (full) {
        // Flight 1: west spine only (toward void / main). No exterior MS @ 16380.
        stairRailing(bag, 'y', 15470, 3890, -1, 237.5, 12, L.porticoFl, RISE_E, 0.95, RAIL_OUT);

        // Flight 2 west — toward first-floor main (correct)
        stairRailing(bag, 'y', 14520, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);

        // Flight 2 east walk-rail — moved WEST onto the interior of the flight.
        // Was ~15360 (stacked on void edge → exterior fence). Now 14900.
        stairRailing(bag, 'y', 14900, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);

        // Mid landing
        railing(bag, 'x', 1040, 14500, 15470, LAND_E, 0.95);
        railing(bag, 'x', 180, 14500, 16300, LAND_E, 0.95);
        railing(bag, 'y', 14500, 180, 1040, LAND_E, 0.95);

        // Arrival spine between flights
        railing(bag, 'x', 3860, 14900, 15470, L.f1, 0.95);

        stairWalls(bag, 12);
      }
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

function addStamp(s) {
  s = s.replace(/\n\s*\/\/ STAIR_RAIL_FIX_\w+\n/g, '\n');
  s = s.replace(
    /\n\s*if \(typeof window !== 'undefined'\) window\.__HOUSE3D_STAIR_RAIL__ = '[^']+';\n/g,
    '\n'
  );
  if (s.includes('window.HouseScene = (function () {')) {
    s = s.replace(
      'window.HouseScene = (function () {',
      `window.HouseScene = (function () {\n  // ${STAMP}\n  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = '${STAMP}';`
    );
  }
  return s;
}

for (const t of targets) {
  if (!fs.existsSync(t.file)) continue;
  let s = fs.readFileSync(t.file, 'utf8');
  s = addStamp(s);
  const voidStart =
    s.indexOf('    /** FF-level guardrails around the external-stair void') >= 0
      ? s.indexOf('    /** FF-level guardrails around the external-stair void')
      : s.indexOf('    /** FF-level rails around the external-stair void');
  const stairStart = s.indexOf('    function externalStair(bag, full) {');
  const liftStart = s.indexOf('    function liftTower(bag, topH, doors, botH) {');
  if (voidStart < 0 || stairStart < 0 || liftStart < 0) {
    console.log(t.file, 'MARKERS MISSING');
    continue;
  }
  s = s.slice(0, voidStart) + NEW_VOID + makeStair(t.south) + s.slice(liftStart);
  fs.writeFileSync(t.file, s);
  try {
    vm.runInNewContext('var window={};' + s, { console });
    console.log(
      t.file,
      'OK',
      'f2east14900',
      /stairRailing\(bag, 'y', 14900/.test(s),
      'old15360',
      /stairRailing\(bag, 'y', 15360/.test(s)
    );
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
  console.log(f, '->', STAMP);
}

if (fs.existsSync('index.html')) {
  let h = fs.readFileSync('index.html', 'utf8');
  h = h.replace(/houseScene\.js\?v=[^"']+/g, 'houseScene.js?v=' + STAMP);
  fs.writeFileSync('index.html', h);
  console.log('index.html ->', STAMP);
}
