/**
 * V1–V3: fix stair-void FF railings properly
 *
 * - BOTH long sides (west @ lift E + east @ outer deck) run the same length:
 *   from the SOUTH end of the lift (y≈230) to the stair arrival (y≈3890)
 * - South end closed with a connecting rail at lift south
 * - North end FULLY open (full void width) for easy walk-on stair access
 *   — no mid-lift choke, no tiny corner stubs blocking the mouth
 */
const fs = require('fs');
const path = require('path');

const NEW = `    /** FF-level guardrails around the external-stair void (deck drop protection) */
    function externalStairVoidRails(bag, baseH) {
      const h = 1.0;
      const inset = 50;
      // Shared extents — both long rails match (do not stop mid-lift)
      const yS = 230 + inset;          // south end of lift shaft
      const yN = 3890 - inset;         // north = stair arrival line
      const xW = VOID_WX + inset;      // west = lift outer east
      const xE = VOID_EX - inset;      // east = outer deck west face

      // Long sides (equal length)
      railing(bag, 'y', xW, yS, yN, baseH, h); // west (along lift)
      railing(bag, 'y', xE, yS, yN, baseH, h); // east (outer deck)

      // South end closed at lift south — connects both long rails
      railing(bag, 'x', yS, xW, xE, baseH, h);

      // North end: fully OPEN across the void (xW → xE) for easy staircase access.
      // No rail across the mouth. Stair arrives into this clear opening.
    }
`;

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  const start = s.indexOf('    /** FF-level guardrails around the external-stair void');
  const end = s.indexOf('    function externalStair(bag, full) {');
  if (start < 0 || end < 0) {
    console.log(v, 'markers missing');
    continue;
  }
  s = s.slice(0, start) + NEW + s.slice(end);

  // Arrival spine between flights: keep, but sit slightly south of the open mouth
  // so it doesn't read as closing the opening (move from y=3890 to y=3860)
  s = s.replace(
    "railing(bag, 'x', 3890, 15380, 15470, L.f1, 0.95); // Closes the gap between flight-1 spine and flight-2 east rail at deck level",
    "railing(bag, 'x', 3860, 15380, 15470, L.f1, 0.95); // short spine between flights (south of open mouth)"
  );
  s = s.replace(
    "railing(bag, 'x', 3890, 15380, 15470, L.f1, 0.95);",
    "railing(bag, 'x', 3860, 15380, 15470, L.f1, 0.95); // short spine between flights (south of open mouth)"
  );

  fs.writeFileSync(f, s);
  try {
    require('vm').runInNewContext('var window={};' + s, { console });
    console.log(v, 'OK');
  } catch (e) {
    console.log(v, 'PARSE FAIL', e.message);
  }
}

// Show resulting function
const t = fs.readFileSync('elevations/version-one/houseScene.js', 'utf8');
const a = t.indexOf('function externalStairVoidRails');
const b = t.indexOf('function externalStair');
console.log(t.slice(a, b));
