/**
 * V1–V3:
 *  1) Industry-standard supports on all metal railings
 *     - Main newel posts (~56 mm SHS) every ~1.25 m + both ends
 *     - Base plates under each newel (fixing to deck)
 *     - Intermediate balusters between newels
 *     - Top handrail + mid rail + bottom stiffener rail
 *  2) Same balcony-style railings on the terrace (L.roof) as FF/SF,
 *     just inside the parapet loop.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const STAMP = 'TERRACE_RAILS_SUPPORTS_20260812a';

const NEW_RAILING = `  /* Balcony / terrace metal railing with structural supports.
     dir 'x' = run along x at y=fc; dir 'y' = run along y at x=fc.
     Industry-typical: newel posts ~1.2–1.5 m c/c + base plates,
     intermediate balusters, top / mid / bottom rails. */
  function railing(bag, dir, fc, a0, a1, base, h) {
    h = h || 1.0;
    const len = a1 - a0; if (len < 80) return;

    // —— Main newel posts (structural) ——
    // ~56 mm square MS, centres ~1250 mm, always include both ends
    const mainPitch = 1250;
    const nMain = Math.max(1, Math.round(len / mainPitch));
    const postH = 28;    // half of 56 mm
    const plateH = 55;   // half of ~110 mm base plate
    const plateT = 0.014;

    for (let i = 0; i <= nMain; i++) {
      const a = a0 + (len * i) / nMain;
      if (dir === 'x') {
        // base plate fixed to deck
        pb(bag, 'ms', a - plateH, a + plateH, fc - plateH, fc + plateH, base, base + plateT);
        // newel post
        pb(bag, 'ms', a - postH, a + postH, fc - postH, fc + postH, base + plateT, base + h - 0.03);
        // steel cap under handrail
        pb(bag, 'steel', a - postH - 5, a + postH + 5, fc - postH - 5, fc + postH + 5,
          base + h - 0.06, base + h - 0.015);
      } else {
        pb(bag, 'ms', fc - plateH, fc + plateH, a - plateH, a + plateH, base, base + plateT);
        pb(bag, 'ms', fc - postH, fc + postH, a - postH, a + postH, base + plateT, base + h - 0.03);
        pb(bag, 'steel', fc - postH - 5, fc + postH + 5, a - postH - 5, a + postH + 5,
          base + h - 0.06, base + h - 0.015);
      }
    }

    // —— Intermediate balusters (~115 mm pitch, skip near newels) ——
    const n = Math.max(2, Math.round(len / 115));
    for (let i = 0; i <= n; i++) {
      const a = a0 + (len * i) / n;
      let near = false;
      for (let j = 0; j <= nMain; j++) {
        if (Math.abs(a - (a0 + (len * j) / nMain)) < 45) { near = true; break; }
      }
      if (near) continue;
      if (dir === 'x') pb(bag, 'ms', a - 7, a + 7, fc - 7, fc + 7, base + plateT, base + h - 0.04);
      else pb(bag, 'ms', fc - 7, fc + 7, a - 7, a + 7, base + plateT, base + h - 0.04);
    }

    // —— Continuous rails: top handrail, chrome cap, mid, bottom stiffener ——
    if (dir === 'x') {
      pb(bag, 'steel', a0 - 14, a1 + 14, fc - 22, fc + 22, base + h - 0.04, base + h);
      pb(bag, 'chrome', a0 - 8, a1 + 8, fc - 12, fc + 12, base + h - 0.01, base + h + 0.012);
      pb(bag, 'steel', a0 - 10, a1 + 10, fc - 15, fc + 15, base + 0.48, base + 0.52);
      pb(bag, 'steel', a0 - 10, a1 + 10, fc - 15, fc + 15, base + 0.08, base + 0.12);
    } else {
      pb(bag, 'steel', fc - 22, fc + 22, a0 - 14, a1 + 14, base + h - 0.04, base + h);
      pb(bag, 'chrome', fc - 12, fc + 12, a0 - 8, a1 + 8, base + h - 0.01, base + h + 0.012);
      pb(bag, 'steel', fc - 15, fc + 15, a0 - 10, a1 + 10, base + 0.48, base + 0.52);
      pb(bag, 'steel', fc - 15, fc + 15, a0 - 10, a1 + 10, base + 0.08, base + 0.12);
    }
  }
`;

// Terrace rails matching FF/SF metal balcony style (just inside parapet)
const TERRACE_RAILS = `
      // ——— Terrace metal railings (same system as FF/SF balconies) ———
      // Sit just inside the parapet loop at deck level so long runs have
      // newel posts + base plates on the terrace slab (industry practice).
      (function terracePerimeterRails() {
        const rt = L.roof;
        const rh = 1.0;
        // Parapet inner faces (see parapet walls above):
        //   south y=-612, north y=9720, west x=150, east x=eastX[1]-150
        const yS = -612 + 90;
        const yN = 9720 - 90;
        const xW = 150 + 90;
        const xE = eastX[1] - 150 - 90;
        // Outer loop (same visual language as SF outdoor rails)
        railing(eBag, 'x', yS, xW, xE, rt, rh); // south
        railing(eBag, 'x', yN, xW, xE, rt, rh); // north
        railing(eBag, 'y', xW, yS, yN, rt, rh); // west
        railing(eBag, 'y', xE, yS, yN, rt, rh); // east
      })();
`;

function patchFile(file) {
  let s = fs.readFileSync(file, 'utf8');

  // stamp
  s = s.replace(/\n\s*\/\/ (STAIR_RAIL_FIX_|TERRACE_RAILS_)\w+\n/g, '\n');
  s = s.replace(
    /\n\s*if \(typeof window !== 'undefined'\) window\.__HOUSE3D_STAIR_RAIL__ = '[^']+';\n/g,
    '\n'
  );
  if (s.includes('window.HouseScene = (function () {')) {
    s = s.replace(
      'window.HouseScene = (function () {',
      `window.HouseScene = (function () {\n  // ${STAMP}\n  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = '${STAMP}';`
    );
  }

  // Replace railing() function
  const rStart = s.indexOf('  /* Refined balcony railing:');
  const rStart2 = s.indexOf('  /* Balcony / terrace metal railing with structural supports.');
  const rStart3 = s.indexOf('  function railing(bag, dir, fc, a0, a1, base, h) {');
  let from = rStart >= 0 ? rStart : (rStart2 >= 0 ? rStart2 : rStart3);
  if (from < 0) {
    console.log(file, 'railing fn not found');
    return;
  }
  const flightMark = s.indexOf('  /* stair flight:', from);
  const flightMark2 = s.indexOf('  function flight(bag, mat, dir, f0, f1, startA, sign, tread, n, baseH, rise, finish)', from);
  const to = flightMark >= 0 ? flightMark : flightMark2;
  if (to < 0) {
    console.log(file, 'flight mark not found');
    return;
  }
  s = s.slice(0, from) + NEW_RAILING + '\n' + s.slice(to);

  // Insert terrace rails once — after parapet coping / before mumty, or after existing mumty rails
  if (!s.includes('terracePerimeterRails')) {
    // Prefer right after parapet coping block (before terrace floor)
    const parapetEnd = s.indexOf('// terrace floor with cutouts for stairwell and lift shaft');
    if (parapetEnd >= 0) {
      s = s.slice(0, parapetEnd) + TERRACE_RAILS + '\n      ' + s.slice(parapetEnd);
    } else {
      // fallback: after mumty void rails
      const mumtyRails = s.indexOf("railing(eBag, 'x', 8600, 250, 4630, L.roof, 0.95);");
      if (mumtyRails >= 0) {
        const insertAt = s.indexOf('\n', mumtyRails) + 1;
        s = s.slice(0, insertAt) + TERRACE_RAILS + s.slice(insertAt);
      } else {
        console.log(file, 'WARN: no insert point for terrace rails');
      }
    }
  }

  fs.writeFileSync(file, s);
  try {
    vm.runInNewContext('var window={};' + s, { console });
    console.log(
      file,
      'OK',
      'supports',
      s.includes('Main newel posts'),
      'terrace',
      s.includes('terracePerimeterRails'),
      'stamp',
      s.includes(STAMP)
    );
  } catch (e) {
    console.log(file, 'PARSE FAIL', e.message);
  }
}

for (const v of ['version-one', 'version-two', 'version-three']) {
  patchFile(path.join('elevations', v, 'houseScene.js'));
  const html = path.join('elevations', v, 'index.html');
  if (fs.existsSync(html)) {
    let h = fs.readFileSync(html, 'utf8');
    h = h.replace(/STAIR_RAIL_FIX_20260812[a-z]/g, STAMP);
    h = h.replace(/TERRACE_RAILS_SUPPORTS_\w+/g, STAMP);
    // also replace railfix badge content
    h = h.replace(
      /id="railfix"[^>]*>[^<]*/,
      `id="railfix" style="margin-top:6px;font-size:9px;letter-spacing:.12em;color:#7dcea0">${STAMP}`
    );
    // cache bust houseScene
    h = h.replace(/houseScene\.js\?v=[^'"]+/g, 'houseScene.js?v=' + STAMP);
    fs.writeFileSync(html, h);
    console.log(html, 'UI', STAMP);
  }
}
