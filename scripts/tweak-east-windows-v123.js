/**
 * V1–V3 east face tweaks:
 * - FF small fixed window: a bit further from sidelite/door (6550 → 6000)
 * - SF: add mid window next to french door, matching GF office window (c=6400, w=1500)
 */
const fs = require('fs');
const path = require('path');

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  const before = s;

  s = s.replace(
    /\{ c: 6550, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 \},[^\n]*/,
    "{ c: 6000, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // pooja slit (near entry, slight gap)"
  );

  s = s.replace(
    /E: \[\s*\n\s*\{ c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' \},[^\n]*\n\s*\{ c: 8000, w: 1650, sill: 0, h: 2400, type: 'frenchdoor' \}[^\n]*\n\s*\],/,
    `E: [
        { c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' },                   // bedroom window (south)
        { c: 6400, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // window next to french door (matches GF)
        { c: 8000, w: 1650, sill: 0, h: 2400, type: 'frenchdoor' }        // family french door (near north)
      ],`
  );

  if (s === before) console.log(v, 'NO CHANGE');
  else {
    fs.writeFileSync(f, s);
    console.log(v, 'OK');
  }
}

const t = fs.readFileSync('elevations/version-one/houseScene.js', 'utf8');
for (const fl of ['f0', 'f1', 'f2']) {
  const m = t.match(new RegExp(fl + ': \\{\\s*E: \\[([\\s\\S]*?)\\],\\s*N:'));
  console.log(fl, m ? m[1].replace(/\s+/g, ' ').trim() : 'missing');
}
