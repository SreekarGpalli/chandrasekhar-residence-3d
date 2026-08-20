/**
 * V1–V3: paint lift shaft shell white to match the main building.
 * Keep lift doors, steel portal frames, chrome handles/buttons as-is.
 */
const fs = require('fs');
const path = require('path');

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  const start = s.indexOf('    function liftTower(bag, topH, doors, botH) {');
  const end = s.indexOf('    function columnsEast(bag, topH, botH) {');
  if (start < 0 || end < 0) {
    console.log(v, 'markers missing');
    continue;
  }
  let block = s.slice(start, end);

  block = block.replace(
    '// Shaft shell (charcoal). botH defaults to 0 (full tower for exterior).',
    '// Shaft shell (white plaster — matches main building). botH defaults to 0 (full tower for exterior).'
  );
  block = block.replace(
    "pb(bag, 'charcoal', liftOX[0], liftOX[1], liftOY[0], liftOY[0] + 230, botH, topH); // south",
    "pb(bag, 'white', liftOX[0], liftOX[1], liftOY[0], liftOY[0] + 230, botH, topH); // south"
  );
  block = block.replace(
    "pb(bag, 'charcoal', 14040, 14270, 230, liftOY[1], botH, topH);                     // east",
    "pb(bag, 'white', 14040, 14270, 230, liftOY[1], botH, topH);                     // east"
  );
  block = block.replace(
    "pb(bag, 'charcoal', liftOX[0], dx0, nY0, nY1, botH, topH);",
    "pb(bag, 'white', liftOX[0], dx0, nY0, nY1, botH, topH);"
  );
  block = block.replace(
    "pb(bag, 'charcoal', dx1, liftOX[1], nY0, nY1, botH, topH);",
    "pb(bag, 'white', dx1, liftOX[1], nY0, nY1, botH, topH);"
  );
  block = block.replace(
    "// charcoal spandrel below this landing's sill\n        if (dl > cur + 0.001) pb(bag, 'charcoal', dx0, dx1, nY0, nY1, cur, dl);",
    "// spandrel below this landing's sill (matches shaft)\n        if (dl > cur + 0.001) pb(bag, 'white', dx0, dx1, nY0, nY1, cur, dl);"
  );
  block = block.replace(
    "// charcoal spandrel above the top portal\n      if (topH > cur + 0.001) pb(bag, 'charcoal', dx0, dx1, nY0, nY1, cur, topH);",
    "// spandrel above the top portal\n      if (topH > cur + 0.001) pb(bag, 'white', dx0, dx1, nY0, nY1, cur, topH);"
  );
  block = block.replace(
    '// Outer face is nY1; surround sits proud so it catches light.',
    '// Outer face is nY1; steel surround sits proud so doors read clearly.'
  );

  s = s.slice(0, start) + block + s.slice(end);

  // Lift roof cap: white body + light coping (not dark charcoal box)
  s = s.replace(
    "liftTower(eBag, L.liftTop, [L.porticoFl, L.f1, L.f2]);\n      pb(eBag, 'charDark', liftOX[0] - 40, liftOX[1] + 40, liftOY[0] - 40, liftOY[1] + 40, L.liftTop, L.liftTop + 0.05);",
    "liftTower(eBag, L.liftTop, [L.porticoFl, L.f1, L.f2]);\n      pb(eBag, 'white', liftOX[0] - 20, liftOX[1] + 20, liftOY[0] - 20, liftOY[1] + 20, L.liftTop, L.liftTop + 0.03);\n      pb(eBag, 'copingLight', liftOX[0] - 28, liftOX[1] + 28, liftOY[0] - 28, liftOY[1] + 28, L.liftTop + 0.03, L.liftTop + 0.06);"
  );

  fs.writeFileSync(f, s);

  const lt = s.slice(s.indexOf('function liftTower'), s.indexOf('function columnsEast'));
  console.log(
    v,
    'charcoal left in liftTower:',
    (lt.match(/'charcoal'/g) || []).length,
    'white shafts:',
    (lt.match(/'white'/g) || []).length,
    'doors kept:',
    /liftDoor/.test(lt),
    'steel kept:',
    /'steel'/.test(lt)
  );
}
