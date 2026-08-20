/**
 * V1–V3: exterior stair tower south wall was charDark (gray/black).
 * Paint white to match main building walls. Keep rails/screens as metal.
 */
const fs = require('fs');
const path = require('path');

const from =
  "pb(bag, 'charDark', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);     // south";
const to =
  "pb(bag, 'white', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);     // south (match building)";

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  if (!s.includes(from)) {
    // looser match
    const re =
      /pb\(bag, 'charDark', towX\[0\], towX\[1\], 0, 230, 0, full \? L\.f1 : L\.cut \+ L\.porticoFl\);[^\n]*/;
    if (!re.test(s)) {
      console.log(v, 'NO MATCH');
      continue;
    }
    s = s.replace(
      re,
      "pb(bag, 'white', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);     // south (match building)"
    );
  } else {
    s = s.replace(from, to);
  }
  fs.writeFileSync(f, s);
  console.log(v, 'OK', s.includes("pb(bag, 'white', towX[0], towX[1], 0, 230"));
}
