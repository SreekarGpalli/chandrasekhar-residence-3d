/**
 * V1–V3: reverse heavy metal newels/base plates (looked ugly).
 * Restore slim balcony railings, keep terrace rails, support long runs
 * with small plaster pillars (not chunky MS plates).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const STAMP = 'RAIL_PILLARS_20260812a';

const NEW_RAILING_BLOCK = `  /* Refined balcony railing: dark MS uprights + stainless handrail + mid rail.
     dir 'x' along x at y=fc, dir 'y' along y at x=fc */
  function railing(bag, dir, fc, a0, a1, base, h) {
    h = h || 1.0;
    const len = a1 - a0; if (len < 80) return;
    const n = Math.max(2, Math.round(len / 118));
    for (let i = 0; i <= n; i++) {
      const a = a0 + (len * i) / n;
      if (dir === 'x') pb(bag, 'ms', a - 9, a + 9, fc - 9, fc + 9, base, base + h - 0.04);
      else pb(bag, 'ms', fc - 9, fc + 9, a - 9, a + 9, base, base + h - 0.04);
    }
    if (dir === 'x') {
      // stainless top rail + chrome cap + mid rail
      pb(bag, 'steel', a0 - 14, a1 + 14, fc - 22, fc + 22, base + h - 0.04, base + h);
      pb(bag, 'chrome', a0 - 8, a1 + 8, fc - 12, fc + 12, base + h - 0.01, base + h + 0.012);
      pb(bag, 'steel', a0 - 10, a1 + 10, fc - 15, fc + 15, base + 0.09, base + 0.125);
    } else {
      pb(bag, 'steel', fc - 22, fc + 22, a0 - 14, a1 + 14, base + h - 0.04, base + h);
      pb(bag, 'chrome', fc - 12, fc + 12, a0 - 8, a1 + 8, base + h - 0.01, base + h + 0.012);
      pb(bag, 'steel', fc - 15, fc + 15, a0 - 10, a1 + 10, base + 0.09, base + 0.125);
    }
  }

  /** Small plaster pillar that supports a railing run (not metal base-plates).
   *  ~180 mm square, white shaft, dark plinth, light coping — matches facade. */
  function railPillar(bag, x, y, base, h) {
    h = h || 1.05;
    const half = 90; // 180 mm square
    const plinth = 110;
    // plinth
    pb(bag, 'charDark', x - plinth, x + plinth, y - plinth, y + plinth, base, base + 0.06);
    // shaft
    pb(bag, 'white', x - half, x + half, y - half, y + half, base + 0.06, base + h - 0.04);
    // coping cap
    pb(bag, 'copingLight', x - half - 12, x + half + 12, y - half - 12, y + half + 12,
      base + h - 0.04, base + h + 0.02);
  }

  /** Place pillars along a railing line: both ends + every ~2.4 m (corners share ends). */
  function railPillarsAlong(bag, dir, fc, a0, a1, base, h) {
    const len = a1 - a0; if (len < 80) return;
    const pitch = 2400;
    const n = Math.max(1, Math.round(len / pitch));
    for (let i = 0; i <= n; i++) {
      const a = a0 + (len * i) / n;
      if (dir === 'x') railPillar(bag, a, fc, base, h);
      else railPillar(bag, fc, a, base, h);
    }
  }
`;

const NEW_TERRACE = `
      // ——— Terrace railings (same slim metal rails as FF/SF) + small pillars ———
      (function terracePerimeterRails() {
        const rt = L.roof;
        const rh = 1.0;
        const yS = -612 + 90;
        const yN = 9720 - 90;
        const xW = 150 + 90;
        const xE = eastX[1] - 150 - 90;
        railing(eBag, 'x', yS, xW, xE, rt, rh);
        railing(eBag, 'x', yN, xW, xE, rt, rh);
        railing(eBag, 'y', xW, yS, yN, rt, rh);
        railing(eBag, 'y', xE, yS, yN, rt, rh);
        // small plaster pillars at corners + mid-span (not metal base plates)
        railPillarsAlong(eBag, 'x', yS, xW, xE, rt, 1.08);
        railPillarsAlong(eBag, 'x', yN, xW, xE, rt, 1.08);
        railPillarsAlong(eBag, 'y', xW, yS, yN, rt, 1.08);
        railPillarsAlong(eBag, 'y', xE, yS, yN, rt, 1.08);
      })();
`;

function patch(file) {
  let s = fs.readFileSync(file, 'utf8');

  // stamp
  s = s.replace(/\n\s*\/\/ (STAIR_RAIL_FIX_|TERRACE_RAILS_|RAIL_PILLARS_)\w+\n/g, '\n');
  s = s.replace(
    /\n\s*if \(typeof window !== 'undefined'\) window\.__HOUSE3D_STAIR_RAIL__ = '[^']+';\n/g,
    '\n'
  );
  s = s.replace(
    'window.HouseScene = (function () {',
    `window.HouseScene = (function () {\n  // ${STAMP}\n  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = '${STAMP}';`
  );

  // Replace railing block (from balcony comment or structural supports comment through flight)
  const markers = [
    '  /* Balcony / terrace metal railing with structural supports.',
    '  /* Refined balcony railing: dark MS uprights + stainless handrail + mid rail.'
  ];
  let from = -1;
  for (const m of markers) {
    const i = s.indexOf(m);
    if (i >= 0) { from = i; break; }
  }
  if (from < 0) from = s.indexOf('  function railing(bag, dir, fc, a0, a1, base, h) {');
  const to = s.indexOf('  /* stair flight:', from);
  if (from < 0 || to < 0) {
    console.log(file, 'railing block missing', { from, to });
    return;
  }
  s = s.slice(0, from) + NEW_RAILING_BLOCK + '\n' + s.slice(to);

  // Replace terrace block if present
  if (s.includes('terracePerimeterRails')) {
    const t0 = s.indexOf('      // ——— Terrace metal railings');
    const t0b = s.indexOf('      // ——— Terrace railings');
    const tStart = t0 >= 0 ? t0 : t0b;
    const tEnd = s.indexOf('      // terrace floor with cutouts', tStart);
    if (tStart >= 0 && tEnd >= 0) {
      s = s.slice(0, tStart) + NEW_TERRACE + '\n' + s.slice(tEnd);
    }
  }

  // Add plaster pillars to FF outdoor rails
  if (!s.includes('railPillarsAlong(o1')) {
    const ffRails = `      railing(o1, 'x', -762, 0, 4805, f1, 1.0);
      railing(o1, 'y', 0, -762, 0, f1, 1.0);
      railing(o1, 'x', -762, EX0, EX1, f1, 1.0);
      railing(o1, 'y', EX1 - 80, -762, NBY1 - 80, f1, 1.0);
      externalStairVoidRails(o1, f1);
      railing(o1, 'x', NBY1 - 80, EX0, EX1 - 80, f1, 1.0);
      railing(o1, 'x', NBY1 - 80, 80, EX0, f1, 1.0);
      railing(o1, 'y', 80, Y1n, NBY1 - 80, f1, 1.0);`;

    const ffWithPillars = `      railing(o1, 'x', -762, 0, 4805, f1, 1.0);
      railing(o1, 'y', 0, -762, 0, f1, 1.0);
      railing(o1, 'x', -762, EX0, EX1, f1, 1.0);
      railing(o1, 'y', EX1 - 80, -762, NBY1 - 80, f1, 1.0);
      externalStairVoidRails(o1, f1);
      railing(o1, 'x', NBY1 - 80, EX0, EX1 - 80, f1, 1.0);
      railing(o1, 'x', NBY1 - 80, 80, EX0, f1, 1.0);
      railing(o1, 'y', 80, Y1n, NBY1 - 80, f1, 1.0);
      // Small plaster pillars under long outdoor rails (not metal base plates)
      railPillarsAlong(o1, 'x', -762, EX0, EX1, f1, 1.08);
      railPillarsAlong(o1, 'y', EX1 - 80, -762, NBY1 - 80, f1, 1.08);
      railPillarsAlong(o1, 'x', NBY1 - 80, 80, EX1 - 80, f1, 1.08);`;

    if (s.includes(ffRails)) {
      s = s.replace(ffRails, ffWithPillars);
    } else {
      console.log(file, 'WARN: FF rail block not exact match');
    }
  }

  // Add plaster pillars to SF outdoor rails
  if (!s.includes('railPillarsAlong(o2')) {
    const sfRails = `      railing(o2, 'x', -762, 0, EX1, f2, 1.0);
      railing(o2, 'y', EX1 - 80, -762, NBY1 - 80, f2, 1.0);
      railing(o2, 'x', NBY1 - 80, 80, EX1 - 80, f2, 1.0);
      railing(o2, 'y', 80, Y1n, NBY1 - 80, f2, 1.0);`;

    const sfWithPillars = `      railing(o2, 'x', -762, 0, EX1, f2, 1.0);
      railing(o2, 'y', EX1 - 80, -762, NBY1 - 80, f2, 1.0);
      railing(o2, 'x', NBY1 - 80, 80, EX1 - 80, f2, 1.0);
      railing(o2, 'y', 80, Y1n, NBY1 - 80, f2, 1.0);
      railPillarsAlong(o2, 'x', -762, 0, EX1, f2, 1.08);
      railPillarsAlong(o2, 'y', EX1 - 80, -762, NBY1 - 80, f2, 1.08);
      railPillarsAlong(o2, 'x', NBY1 - 80, 80, EX1 - 80, f2, 1.08);`;

    if (s.includes(sfRails)) {
      s = s.replace(sfRails, sfWithPillars);
    } else {
      console.log(file, 'WARN: SF rail block not exact match');
    }
  }

  fs.writeFileSync(file, s);
  try {
    vm.runInNewContext('var window={};' + s, { console });
    console.log(file, 'OK', {
      simpleRail: s.includes('Refined balcony railing'),
      noPlate: !s.includes('base plate fixed to deck'),
      pillars: s.includes('function railPillar'),
      ffPillars: s.includes('railPillarsAlong(o1'),
      sfPillars: s.includes('railPillarsAlong(o2'),
      terrace: s.includes('terracePerimeterRails')
    });
  } catch (e) {
    console.log(file, 'PARSE FAIL', e.message);
  }
}

for (const v of ['version-one', 'version-two', 'version-three']) {
  patch(path.join('elevations', v, 'houseScene.js'));
  const html = path.join('elevations', v, 'index.html');
  if (fs.existsSync(html)) {
    let h = fs.readFileSync(html, 'utf8');
    h = h.replace(/TERRACE_RAILS_SUPPORTS_\w+/g, STAMP);
    h = h.replace(/RAIL_PILLARS_\w+/g, STAMP);
    h = h.replace(/STAIR_RAIL_FIX_20260812[a-z]/g, STAMP);
    h = h.replace(
      /id="railfix"[^>]*>[^<]*/,
      `id="railfix" style="margin-top:6px;font-size:9px;letter-spacing:.12em;color:#7dcea0">${STAMP}`
    );
    h = h.replace(/houseScene\.js\?v=[^'"]+/g, 'houseScene.js?v=' + STAMP);
    fs.writeFileSync(html, h);
    console.log(html, 'UI', STAMP);
  }
}
