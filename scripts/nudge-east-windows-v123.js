/**
 * V1–V3: nudge east windows closer to the north entry doors.
 *
 * GF: office window left of door (was c=4950) → c=6400
 *     leaf 5650..7150; door starts 7400 → ~250mm wall between
 * FF: pooja slit left of sidelite+door (was c=5200) → c=6550
 *     leaf 6325..6775; sidelite starts 6875 → ~100mm wall between
 */
const fs = require('fs');
const path = require('path');

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  const before = s;

  s = s.replace(
    "{ c: 4950, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // office window (moved south of door)",
    "{ c: 6400, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // office window (closer to door)"
  );
  // allow already-renamed comment variants
  s = s.replace(
    /\{ c: 4950, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 \},[^\n]*/,
    "{ c: 6400, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // office window (closer to door)"
  );

  s = s.replace(
    "{ c: 5200, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // pooja slit (moved south of entry)",
    "{ c: 6550, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // pooja slit (closer to entry)"
  );
  s = s.replace(
    /\{ c: 5200, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 \},[^\n]*/,
    "{ c: 6550, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // pooja slit (closer to entry)"
  );

  if (s === before) console.log(v, 'NO CHANGE');
  else {
    fs.writeFileSync(f, s);
    console.log(v, 'OK');
  }
}

const t = fs.readFileSync('elevations/version-one/houseScene.js', 'utf8');
const g = t.match(/f0: \{\s*E: \[([\s\S]*?)\],\s*N:/);
const f1 = t.match(/f1: \{\s*E: \[([\s\S]*?)\],\s*N:/);
console.log('GF E', g[1].replace(/\s+/g, ' ').trim());
console.log('FF E', f1[1].replace(/\s+/g, ' ').trim());
