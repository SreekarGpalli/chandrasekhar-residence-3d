/**
 * V1–V3: fewer rail pillars — AP residential density, not every 2.4 m.
 * Typical Andhra balcony/terrace: posts at corners/ends; one mid only on
 * long runs (~7 m+); two mids only on very long faces (~14 m+).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const STAMP = 'RAIL_PILLARS_20260812b';

const NEW_ALONG = `  /** Place pillars along a railing line — sparse (AP residential).
   *  Ends always; one mid if span ≳ 7 m; two mids only if ≳ 14 m. */
  function railPillarsAlong(bag, dir, fc, a0, a1, base, h) {
    const len = a1 - a0; if (len < 80) return;
    let nSeg = 1; // ends only → 2 pillars
    if (len >= 14000) nSeg = 3;      // ends + 2 mids
    else if (len >= 7000) nSeg = 2;  // ends + 1 mid
    for (let i = 0; i <= nSeg; i++) {
      const a = a0 + (len * i) / nSeg;
      if (dir === 'x') railPillar(bag, a, fc, base, h);
      else railPillar(bag, fc, a, base, h);
    }
  }
`;

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');

  // stamp
  s = s.replace(/\n\s*\/\/ RAIL_PILLARS_\w+\n/g, '\n');
  s = s.replace(
    /\n\s*if \(typeof window !== 'undefined'\) window\.__HOUSE3D_STAIR_RAIL__ = '[^']+';\n/g,
    '\n'
  );
  s = s.replace(
    'window.HouseScene = (function () {',
    `window.HouseScene = (function () {\n  // ${STAMP}\n  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = '${STAMP}';`
  );

  const start = s.indexOf('  /** Place pillars along a railing line');
  const start2 = s.indexOf('  function railPillarsAlong(bag, dir, fc, a0, a1, base, h) {');
  const from = start >= 0 ? start : start2;
  if (from < 0) {
    console.log(v, 'railPillarsAlong missing');
    continue;
  }
  const end = s.indexOf('\n  /* stair flight:', from);
  const end2 = s.indexOf('\n  function flight(', from);
  const to = end >= 0 ? end : end2;
  if (to < 0) {
    // function is followed by something else — find closing of railPillarsAlong
    const fn = s.indexOf('function railPillarsAlong', from);
    let brace = s.indexOf('{', fn);
    let depth = 0;
    let i = brace;
    for (; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    s = s.slice(0, from) + NEW_ALONG + s.slice(i);
  } else {
    s = s.slice(0, from) + NEW_ALONG + s.slice(to);
  }

  // Drop the short west-balcony stub pillar line on SF if present (redundant)
  // Keep only the three main long runs on FF/SF — already the case.

  // On terrace: corners are enough for short sides; long E/W/N/S use sparse helper.
  // Optionally only pillar the two long faces + corners via 4 edges is fine with new spacing.

  fs.writeFileSync(f, s);
  try {
    vm.runInNewContext('var window={};' + s, { console });
    const ok = s.includes('len >= 7000') && s.includes(STAMP);
    console.log(v, ok ? 'OK' : 'CHECK', 'sparse', s.includes('len >= 7000'));
  } catch (e) {
    console.log(v, 'PARSE FAIL', e.message);
  }

  const html = path.join('elevations', v, 'index.html');
  if (fs.existsSync(html)) {
    let h = fs.readFileSync(html, 'utf8');
    h = h.replace(/RAIL_PILLARS_\w+/g, STAMP);
    h = h.replace(
      /id="railfix"[^>]*>[^<]*/,
      `id="railfix" style="margin-top:6px;font-size:9px;letter-spacing:.12em;color:#7dcea0">${STAMP}`
    );
    h = h.replace(/houseScene\.js\?v=[^'"]+/g, 'houseScene.js?v=' + STAMP);
    fs.writeFileSync(html, h);
  }
}
