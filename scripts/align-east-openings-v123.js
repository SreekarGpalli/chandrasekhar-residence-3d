/**
 * V1–V3 opening tweaks:
 * 1) SF east window share the same centre as GF east office window (c=6400)
 *    so both sit on one vertical plane.
 * 2) FF small east fixed window → square 900×900, centred on that same plane (c=6400)
 * 3) Remove FF north-east pooja slit (c=11650)
 */
const fs = require('fs');
const path = require('path');

const WIN_C = 6400; // shared vertical plane GF office win / SF mid win / FF square

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  const before = s;

  // SF: align mid window with GF (c=6400)
  s = s.replace(
    /\{ c: 6200, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 \},[^\n]*/,
    `{ c: ${WIN_C}, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // aligned with GF east window`
  );
  s = s.replace(
    /\{ c: 6400, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 \}, \/\/ window next to french door[^\n]*/,
    `{ c: ${WIN_C}, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // aligned with GF east window`
  );

  // FF: square fixed window, same height 900, width 900, centre on shared plane
  s = s.replace(
    /\{ c: 6000, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 \},[^\n]*/,
    `{ c: ${WIN_C}, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // square fixed, aligned with GF/SF plane`
  );
  s = s.replace(
    /\{ c: 6550, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 \},[^\n]*/,
    `{ c: ${WIN_C}, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // square fixed, aligned with GF/SF plane`
  );

  // FF north: remove east-edge pooja window
  s = s.replace(
    /\n\s*\{ c: 11650, w: 600, sill: 1200, h: 900, type: 'win', panes: 1 \}[^\n]*/,
    ''
  );
  // clean trailing comma on previous north opening if needed
  s = s.replace(
    /(\{ c: 8760, w: 1000, sill: 900, h: 1400, type: 'win' \}),(\s*\n\s*\],\s*\n\s*S:)/,
    '$1$2'
  );
  // if pooja was last with comma after right-of-void win, ensure valid JS
  // pattern: win' }, <removed> ],  → already handled if no comma left hanging
  s = s.replace(
    /(\{ c: 8760, w: 1000, sill: 900, h: 1400, type: 'win' \}),(\s*\n\s*\])/,
    '$1$2'
  );

  // north wall lamps / warmFix that only target FF pooja slit
  s = s.replace(
    /\n\s*\/\/ FF pooja slit\n\s*for \(const cx of flankCenters\(11650, 600, 140\)\) northWallLamp\(cx, L\.f1\);\n/,
    '\n'
  );
  s = s.replace(
    /\n\s*for \(const cx of flankCenters\(11650, 600, 140\)\) northWallLamp\(cx, L\.f1\);\n/,
    '\n'
  );

  if (s === before) console.log(v, 'NO CHANGE');
  else {
    fs.writeFileSync(f, s);
    // quick syntax via Function constructor on OPEN excerpt only is hard; full check below
    console.log(v, 'written');
  }
}

// verify + syntax
for (const v of ['version-one', 'version-two', 'version-three']) {
  const t = fs.readFileSync(path.join('elevations', v, 'houseScene.js'), 'utf8');
  try {
    require('vm').runInNewContext(t.replace(/^window\.HouseScene/, 'var HouseScene'), {
      window: {},
      console
    });
  } catch (e) {
    // HouseScene IIFE assigns window — load properly
  }
  try {
    require('vm').runInNewContext(
      'var window={};' + t,
      { console }
    );
    console.log(v, 'parse OK');
  } catch (e) {
    console.log(v, 'PARSE FAIL', e.message);
  }
  for (const fl of ['f0', 'f1', 'f2']) {
    const m = t.match(new RegExp(fl + ': \\{\\s*E: \\[([\\s\\S]*?)\\],\\s*N:'));
    const n = t.match(new RegExp(fl + ': \\{\\s*E: \\[[\\s\\S]*?\\],\\s*N: \\[([\\s\\S]*?)\\],\\s*S:'));
    console.log(
      ' ',
      fl,
      'E',
      m ? m[1].replace(/\s+/g, ' ').trim() : '?',
      '| N',
      n ? n[1].replace(/\s+/g, ' ').trim() : '?'
    );
  }
  console.log('  has 11650', /11650/.test(t));
}
