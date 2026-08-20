/**
 * V1–V3: strip decorative facade trim for plain planning base.
 * - Dark gray vertical fins (E/N/W)
 * - Golden/warm accent boxes around doors & windows
 * - Related golden accent panels / fin caps
 */
const fs = require('fs');
const path = require('path');

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  const before = s;

  // East: accent surrounds
  s = s.replace(
    /\n\s*\/\/ --- 2\. Window \/ Door Accent Surrounds[\s\S]*?for \(const o of OPEN\.f2\.E\) accentSurround\(o\.c, o\.w, o\.sill \|\| 0, o\.h, L\.f2\);\n/,
    '\n'
  );

  // East: vertical fins
  s = s.replace(
    /\n\s*\/\/ --- 3\. Vertical Accent Fins ---[\s\S]*?L\.f0 \+ 0\.16, L\.f0 \+ 0\.22\);\s*\n\s*\}\n/,
    '\n'
  );

  // East: accent panel zones
  s = s.replace(
    /\n\s*\/\/ --- 7\. Accent Panel Zones[\s\S]*?L\.f2 \+ 0\.60, L\.f2 \+ 0\.65\);\n/,
    '\n'
  );

  // East: golden canopy soffits
  s = s.replace(
    /\n\s*pb\(eBag, 'accentWarm', EF \+ 30, EF \+ 740, [0-9]+, [0-9]+,\s*\n\s*L\.f[012] \+ 2\.40, L\.f[012] \+ 2\.50\);/g,
    ''
  );

  // East: column golden accent bands
  s = s.replace(
    /\n\s*\/\/ --- 6\. Portico Column Accent Bands[\s\S]*?midH - 0\.025, midH \+ 0\.025\);\s*\n\s*\}\n/,
    '\n'
  );

  // North: warm surrounds
  s = s.replace(
    /\n\s*\/\/ Warm surrounds for every north opening[\s\S]*?for \(const o of OPEN\.f2\.N\) nSurround\(o\.c, o\.w, o\.sill \|\| 0, o\.h, L\.f2\);\n/,
    '\n'
  );

  // North: canopy gold soffit
  s = s.replace(
    /\n\s*pb\(eBag, 'accentWarm', 7930, 9370, NF \+ 30, NF \+ 700, L\.f0 \+ 2\.40, L\.f0 \+ 2\.50\);/,
    ''
  );

  // North: vertical fins
  s = s.replace(
    /\n\s*\/\/ Vertical fins on solid wall only[\s\S]*?L\.f0 \+ 0\.16, L\.f0 \+ 0\.22\);\s*\n\s*\}\n/,
    '\n'
  );

  // South facade treatment (surrounds only)
  s = s.replace(
    /\n\s*\/\/ ===== SOUTH FACADE — window surrounds on bedroom stretch \(matches N\/E\) =====\n\s*\(function southFacade\(\) \{[\s\S]*?\}\)\(\);\n/,
    '\n'
  );

  // West facade treatment (surrounds + fins)
  s = s.replace(
    /\n\s*\/\/ ===== WEST FACADE — surrounds on all west openings \(matches N\/E\/S\) =====\n\s*\(function westFacade\(\) \{[\s\S]*?\}\)\(\);\n/,
    '\n'
  );

  // Mumty golden surrounds
  s = s.replace(
    /\n\s*\/\/ Mumty exterior accent surround on east door \+ north window\n\s*pb\(eBag, 'accentWarm', mx\[1\] \+ 100, mx\[1\] \+ 210, 7000, 8120, L\.roof \+ 2\.15, L\.roof \+ 2\.28\);\n\s*pb\(eBag, 'accentWarm', mx\[1\] \+ 100, mx\[1\] \+ 210, 7000, 7120, L\.roof, L\.roof \+ 2\.28\);\n\s*pb\(eBag, 'accentWarm', mx\[1\] \+ 100, mx\[1\] \+ 210, 8000, 8120, L\.roof, L\.roof \+ 2\.28\);/,
    ''
  );

  // Chajja: drop golden soffit, keep plain charcoal
  s = s.replace(
    /if \(spec\.chajja\) \{\s*\n\s*\/\/ Charcoal chajja with warm soffit accent strip \(matches east canopy language\)\s*\n\s*const cb = outSign > 0 \? \[bb1, bb1 \+ 500\] : \[bb0 - 500, bb0\];\s*\n\s*put\('charDark', a0 - 150, a1 \+ 150, cb\[0\], cb\[1\], t \+ 0\.05, t \+ 0\.13\);\s*\n\s*const inner = outSign > 0\s*\n\s*\? \[bb1 \+ 20, bb1 \+ 480\]\s*\n\s*: \[bb0 - 480, bb0 - 20\];\s*\n\s*put\('accentWarm', a0 - 120, a1 \+ 120, inner\[0\], inner\[1\], t \+ 0\.02, t \+ 0\.05\);\s*\n\s*\/\/ thin drip edge\s*\n\s*const drip = outSign > 0 \? \[bb1 \+ 485, bb1 \+ 505\] : \[bb0 - 505, bb0 - 485\];\s*\n\s*put\('charDark', a0 - 155, a1 \+ 155, drip\[0\], drip\[1\], t \+ 0\.02, t \+ 0\.14\);\s*\n\s*\}/,
    `if (spec.chajja) {
      // Plain charcoal chajja (no warm surround)
      const cb = outSign > 0 ? [bb1, bb1 + 500] : [bb0 - 500, bb0];
      put('charDark', a0 - 150, a1 + 150, cb[0], cb[1], t + 0.05, t + 0.13);
      const drip = outSign > 0 ? [bb1 + 485, bb1 + 505] : [bb0 - 505, bb0 - 485];
      put('charDark', a0 - 155, a1 + 155, drip[0], drip[1], t + 0.02, t + 0.14);
    }`
  );

  // Outdoor deck gold edge accents
  s = s.replace(
    /\n\s*pb\(o1, 'accentWarm', EX1 - 100, EX1 \+ 18, -770, NBY1 \+ 10, f1 - 0\.53, f1 - 0\.45\);/,
    ''
  );
  s = s.replace(
    /\n\s*pb\(o2, 'accentWarm', EX1 - 100, EX1 \+ 18, -770, NBY1 \+ 10, f2 - 0\.53, f2 - 0\.45\);/,
    ''
  );

  if (s === before) {
    console.log(v, 'NO CHANGE');
    continue;
  }

  fs.writeFileSync(f, s);

  const leftover = {
    accentSurround: /function accentSurround/.test(s),
    nSurround: /function nSurround/.test(s),
    sSurround: /function sSurround/.test(s),
    wSurround: /function wSurround/.test(s),
    eastFins: /Vertical Accent Fins/.test(s),
    northFins: /Vertical fins on solid wall only/.test(s),
    westFacade: /WEST FACADE — surrounds/.test(s),
    southFacade: /SOUTH FACADE — window surrounds/.test(s),
    accentPanels: /Accent Panel Zones/.test(s),
    chajjaGold: /put\('accentWarm'.*chajja|chajja[\s\S]{0,200}accentWarm/.test(s)
  };
  console.log(v, 'OK leftovers', leftover);
}
