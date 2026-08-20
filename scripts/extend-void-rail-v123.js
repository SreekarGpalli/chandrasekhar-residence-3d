/**
 * V1–V3: extend FF stair-void west rail to the south end of the lift shaft,
 * and open the full north edge of the void for easy stair access
 * (no short fence mid-lift / tight mouth at 14500).
 */
const fs = require('fs');
const path = require('path');

const NEW = `    /** FF-level guardrails around the external-stair void (deck drop protection) */
    function externalStairVoidRails(bag, baseH) {
      const h = 1.0;
      const inset = 50; // keep posts just inside slab edge
      // West void edge = lift outer east face.
      // Run full length from the SOUTH end of the lift (y≈230) up to the stair
      // arrival (y≈3890) so the rail is not cut short mid-shaft.
      railing(bag, 'y', VOID_WX + inset, 230 + inset, 3890 - inset, baseH, h);
      // East void edge = outer deck west face (full void run)
      railing(bag, 'y', VOID_EX - inset, 1040 + inset, 3890 - inset, baseH, h);
      // South void edge = north face of mid-landing deck (lift E → void E)
      railing(bag, 'x', 1040 + inset, VOID_WX + inset, VOID_EX - inset, baseH, h);
      // North void edge: leave FULLY OPEN from lift E to outer deck for easy
      // walk-on access to the staircase (no mid-lift choke point).
      // Corner posts only at NW / NE so the edge still reads, without blocking.
      // NW post cluster (lift NE corner)
      railing(bag, 'x', 3890 - inset, VOID_WX + inset, VOID_WX + inset + 120, baseH, h);
      // NE post cluster (outer deck corner)
      railing(bag, 'x', 3890 - inset, VOID_EX - inset - 120, VOID_EX - inset, baseH, h);
    }
`;

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  const start = s.indexOf('    /** FF-level guardrails around the external-stair void');
  const end = s.indexOf('    function externalStair(bag, full) {');
  if (start < 0 || end < 0) {
    console.log(v, 'markers missing', start, end);
    continue;
  }
  s = s.slice(0, start) + NEW + s.slice(end);
  fs.writeFileSync(f, s);
  try {
    require('vm').runInNewContext('var window={};' + s, { console });
    console.log(v, 'OK');
  } catch (e) {
    console.log(v, 'PARSE FAIL', e.message);
  }
}
