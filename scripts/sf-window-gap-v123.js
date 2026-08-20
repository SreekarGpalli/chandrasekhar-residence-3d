/**
 * SF east window: french door is wider (1650) than GF door (1200), so the same
 * c=6400 leaves almost no gap. Move window south so solid wall between matches
 * GF (~250mm): french south edge 7175 → window north edge ~6950 → c=6200.
 */
const fs = require('fs');
const path = require('path');

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  const before = s;
  s = s.replace(
    "{ c: 6400, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // window next to french door (matches GF)",
    "{ c: 6200, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // window next to french door (GF-like gap)"
  );
  // also match if already slightly different comment
  s = s.replace(
    /\{ c: 6400, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 \}, \/\/ window next to french door[^\n]*/,
    "{ c: 6200, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // window next to french door (GF-like gap)"
  );
  if (s === before) console.log(v, 'NO CHANGE');
  else {
    fs.writeFileSync(f, s);
    console.log(v, 'OK');
  }
}

console.log('GF gap (door 7400 - win 7150) =', 7400 - 7150, 'mm');
console.log('SF gap (french 7175 - win 6950) =', 7175 - 6950, 'mm');
