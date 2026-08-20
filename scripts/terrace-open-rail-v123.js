/**
 * V1–V3: replace solid terrace parapet walls with open metal railings
 * matching first / second floor outdoor balconies (slim MS + steel, sparse pillars).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const STAMP = 'TERRACE_OPEN_RAIL_20260812a';

const NEW_BLOCK = `      // Terrace edge: NO solid parapet wall — open metal railings like FF/SF balconies.
      // Thin slab fascia (same language as outdoor decks) + railing @ L.roof.
      (function terraceOpenRails() {
        const rt = L.roof;
        const rh = 1.0;
        // Outer extents (match former parapet outer faces / terrace slab edge)
        const yS = -762;
        const yN = 9870;
        const xW = 80;
        const xE = eastX[1] - 80;
        // Edge fascia under deck lip (not a full-height wall)
        pb(eBag, 'charDark', eastX[1] - 90, eastX[1] + 10, yS, yN, rt - 0.45, rt + 0.012);
        pb(eBag, 'charDark', 0, eastX[1] + 10, yN - 90, yN + 10, rt - 0.45, rt + 0.012);
        pb(eBag, 'charDark', 0, eastX[1] + 10, yS - 90, yS + 10, rt - 0.45, rt + 0.012);
        pb(eBag, 'charDark', 0, 100, yS, yN, rt - 0.45, rt + 0.012);
        // Same railing system as FF / SF outdoor
        railing(eBag, 'x', yS, 0, eastX[1], rt, rh);           // south
        railing(eBag, 'y', xE, yS, yN, rt, rh);                 // east
        railing(eBag, 'x', yN - 80, xW, xE, rt, rh);            // north
        railing(eBag, 'y', xW, yS, yN - 80, rt, rh);            // west
        // Sparse plaster pillars (ends + rare mid on long faces)
        railPillarsAlong(eBag, 'x', yS, 0, eastX[1], rt, 1.08);
        railPillarsAlong(eBag, 'y', xE, yS, yN, rt, 1.08);
        railPillarsAlong(eBag, 'x', yN - 80, xW, xE, rt, 1.08);
        railPillarsAlong(eBag, 'y', xW, yS, yN - 80, rt, 1.08);
      })();
`;

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');

  s = s.replace(/\n\s*\/\/ (RAIL_PILLARS_|TERRACE_OPEN_RAIL_|TERRACE_RAILS_)\w+\n/g, '\n');
  s = s.replace(
    /\n\s*if \(typeof window !== 'undefined'\) window\.__HOUSE3D_STAIR_RAIL__ = '[^']+';\n/g,
    '\n'
  );
  s = s.replace(
    'window.HouseScene = (function () {',
    `window.HouseScene = (function () {\n  // ${STAMP}\n  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = '${STAMP}';`
  );

  // Replace solid parapet + old terrace rails through just before terrace floor
  const markers = [
    '      // parapet (terrace) — continuous closed loop, no gaps',
    '      // Terrace edge: NO solid parapet wall'
  ];
  let from = -1;
  for (const m of markers) {
    const i = s.indexOf(m);
    if (i >= 0) { from = i; break; }
  }
  // also match if only terracePerimeterRails remains after partial edits
  if (from < 0) {
    const i = s.indexOf('      // ——— Terrace');
    if (i >= 0) from = i;
  }
  const to = s.indexOf('      // terrace floor with cutouts for stairwell and lift shaft');
  if (from < 0 || to < 0) {
    console.log(v, 'markers missing', { from, to });
    continue;
  }
  s = s.slice(0, from) + NEW_BLOCK + '\n' + s.slice(to);

  // comment fix
  s = s.replace(
    'south terrace floor extension to parapet',
    'south terrace floor extension to edge'
  );

  fs.writeFileSync(f, s);
  try {
    vm.runInNewContext('var window={};' + s, { console });
    const solid = /parapet \(terrace\).*continuous closed loop/.test(s) &&
      s.includes("pb(eBag, 'charcoal', X0, eastX[1], -762, -612, L.roof, L.parapetTop)");
    console.log(v, 'OK', {
      openRails: s.includes('terraceOpenRails'),
      noSolidSouth: !s.includes("pb(eBag, 'charcoal', X0, eastX[1], -762, -612, L.roof, L.parapetTop)"),
      stamp: s.includes(STAMP)
    });
  } catch (e) {
    console.log(v, 'PARSE FAIL', e.message);
  }

  const html = path.join('elevations', v, 'index.html');
  if (fs.existsSync(html)) {
    let h = fs.readFileSync(html, 'utf8');
    h = h.replace(/RAIL_PILLARS_\w+/g, STAMP);
    h = h.replace(/TERRACE_OPEN_RAIL_\w+/g, STAMP);
    h = h.replace(
      /id="railfix"[^>]*>[^<]*/,
      `id="railfix" style="margin-top:6px;font-size:9px;letter-spacing:.12em;color:#7dcea0">${STAMP}`
    );
    h = h.replace(/houseScene\.js\?v=[^'"]+/g, 'houseScene.js?v=' + STAMP);
    fs.writeFileSync(html, h);
  }
}
