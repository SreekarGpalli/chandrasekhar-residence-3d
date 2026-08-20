/**
 * Fix exterior stair + void rails EVERYWHERE (root + all elevations).
 *
 * Bug: full-height MS bar screen at x≈16380–16420 on the east face of the
 * stair tower — OUTSIDE the walk path, through the outer deck. That is the
 * "east railing coming exterior" the user sees.
 *
 * Correct:
 * - Flight 1 walk-rail on WEST spine only (x=15470) toward first-floor main
 * - Flight 2 rails on both open sides of the flight (interior)
 * - No exterior MS screen
 * - Void rails only on real FF hole edges; north mouth open
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const STAMP = 'STAIR_RAIL_FIX_20260812d';

const NEW_VOID = `    /** FF-level guardrails around the external-stair void (deck drop protection)
     *  STAMP: ${STAMP}
     */
    function externalStairVoidRails(bag, baseH) {
      const h = 1.0;
      const inset = 50;
      // Real FF hole: x VOID_WX–VOID_EX, y 1040–3890
      const xW = VOID_WX + inset; // first-floor main side (west)
      const xE = VOID_EX - inset; // outer-deck edge of void (east) — not past building EX1

      // West long — main FF edge, north of lift only
      railing(bag, 'y', xW, LIFT_NY + inset, 3890 - inset, baseH, h);
      // East long — only along true void (not solid mid-landing deck y<1040)
      railing(bag, 'y', xE, 1040 + inset, 3890 - inset, baseH, h);
      // South closer
      railing(bag, 'x', 1040 + inset, xW, xE, baseH, h);
      // North mouth open for stair arrival; short return west of mouth only
      railing(bag, 'x', 3890 - inset, xW, 14500 - inset, baseH, h);
    }
`;

function makeStair(southMat) {
  return `    function externalStair(bag, full) {
      // South tower wall
      pb(bag, '${southMat}', towX[0], towX[1], 0, 230, 0, full ? L.f1 : L.cut + L.porticoFl);

      if (full) {
        // Flight 1 (east strip): walk-rail on WEST spine only — toward first-floor main.
        // East face is stair wall. NEVER a full-height MS screen at x≈16380 (exterior).
        stairRailing(bag, 'y', 15470, 3890, -1, 237.5, 12, L.porticoFl, RISE_E, 0.95, RAIL_OUT);

        // Flight 2 (void strip): both open sides ON the flight (interior)
        stairRailing(bag, 'y', 14520, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);
        stairRailing(bag, 'y', 15360, 1040, 1, 237.5, 12, LAND_E, RISE_E, 0.95, RAIL_OUT);

        // Mid landing — 3 open sides; east against stair wall
        railing(bag, 'x', 1040, 14500, 15470, LAND_E, 0.95);
        railing(bag, 'x', 180, 14500, 16300, LAND_E, 0.95);
        railing(bag, 'y', 14500, 180, 1040, LAND_E, 0.95);

        // FF arrival spine between flights (mouth stays open)
        railing(bag, 'x', 3860, 15360, 15470, L.f1, 0.95);

        stairWalls(bag, 12);
        // no exterior MS / bronze screen at 16380
      }
      flight(bag, 'concrete', 'y', 15470, 16370, 3890, -1, 237.5, 12, L.porticoFl, RISE_E);
      pb(bag, 'concrete', 14500, 16370, 140, 1040, LAND_E - 0.32, LAND_E);
      pb(bag, 'balcTile', 14540, 16330, 180, 1000, LAND_E, LAND_E + 0.012);
      flight(bag, 'concrete', 'y', 14500, 15400, 1040, 1, 237.5, 12, LAND_E, RISE_E);
      pb(bag, 'balcTile', 15490, 16350, 1040, 1277, LAND_E - 0.004, LAND_E - 0.001);
      pb(bag, 'balcTile', 14520, 15380, 3652, 3890, L.f1 - 0.008, L.f1 - 0.002);
    }
`;
}

const targets = [
  { file: 'houseScene.js', south: 'charDark' },
  { file: 'elevations/version-one/houseScene.js', south: 'white' },
  { file: 'elevations/version-two/houseScene.js', south: 'white' },
  { file: 'elevations/version-three/houseScene.js', south: 'white' },
  { file: 'elevations/version-four/houseScene.js', south: 'basalt' },
  { file: 'elevations/version-five/houseScene.js', south: 'white' }
];

function stripExteriorScreen(s) {
  // Remove classic MS screen block (various comment styles)
  s = s.replace(
    /\n\s*\/\/ East MS bar screen[\s\S]*?for \(let i = 0; i <= n; i\+\+\) \{[\s\S]*?pb\(bag, 'ms', 16378, 16422,[\s\S]*?\n\s*\}\n/g,
    '\n'
  );
  s = s.replace(
    /\n\s*\/\/ East MS bar screen:[\s\S]*?for \(let i = 0; i <= n; i\+\+\) \{[\s\S]*?pb\(bag, 'ms', 16378, 16422,[\s\S]*?\n\s*\}\n/g,
    '\n'
  );
  s = s.replace(
    /\n\s*\/\/ East screen: bronze[\s\S]*?for \(let i = 0; i <= n; i\+\+\) \{[\s\S]*?pb\(bag, 'bronze', 16376, 16424,[\s\S]*?\n\s*\}\n/g,
    '\n'
  );
  // Lone top-rail lines
  s = s.replace(/\n\s*pb\(bag, 'ms', 16380, 16420,[\s\S]*?\n/g, '\n');
  s = s.replace(/\n\s*pb\(bag, 'bronze', 16372, 16428,[\s\S]*?\n/g, '\n');
  s = s.replace(/\n\s*pb\(bag, 'reveal', 16382, 16418,[\s\S]*?\n/g, '\n');
  return s;
}

function addStamp(s) {
  if (s.includes(STAMP) && s.includes('__HOUSE3D_STAIR_RAIL__')) return s;
  // remove old stamps
  s = s.replace(/\n\s*\/\/ STAIR_RAIL_FIX_\w+\n/g, '\n');
  s = s.replace(/\n\s*if \(typeof window !== 'undefined'\) window\.__HOUSE3D_STAIR_RAIL__ = '[^']+';\n/g, '\n');
  if (s.includes('window.HouseScene = (function () {')) {
    s = s.replace(
      'window.HouseScene = (function () {',
      `window.HouseScene = (function () {\n  // ${STAMP}\n  if (typeof window !== 'undefined') window.__HOUSE3D_STAIR_RAIL__ = '${STAMP}';`
    );
  }
  return s;
}

for (const t of targets) {
  if (!fs.existsSync(t.file)) {
    console.log('SKIP missing', t.file);
    continue;
  }
  let s = fs.readFileSync(t.file, 'utf8');
  s = addStamp(s);

  const voidStart =
    s.indexOf('    /** FF-level guardrails around the external-stair void') >= 0
      ? s.indexOf('    /** FF-level guardrails around the external-stair void')
      : s.indexOf('    /** FF-level rails around the external-stair void');
  const stairStart = s.indexOf('    function externalStair(bag, full) {');
  const liftStart = s.indexOf('    function liftTower(bag, topH, doors, botH) {');

  if (voidStart < 0 || stairStart < 0 || liftStart < 0) {
    console.log(t.file, 'MARKERS MISSING', { voidStart, stairStart, liftStart });
    continue;
  }

  s = s.slice(0, voidStart) + NEW_VOID + makeStair(t.south) + s.slice(liftStart);
  s = stripExteriorScreen(s);

  fs.writeFileSync(t.file, s);

  const hasExt = /pb\(bag,\s*'(ms|bronze)',\s*1638/.test(s);
  try {
    vm.runInNewContext('var window={};' + s, { console });
    console.log(t.file, 'OK', 'extScreen', hasExt, 'stamp', s.includes(STAMP));
  } catch (e) {
    console.log(t.file, 'PARSE FAIL', e.message);
  }
}

// Cache-bust main index.html
const idx = 'index.html';
if (fs.existsSync(idx)) {
  let h = fs.readFileSync(idx, 'utf8');
  const next = h.replace(
    /houseScene\.js\?v=[^"']+/,
    'houseScene.js?v=' + STAMP
  );
  if (next !== h) {
    fs.writeFileSync(idx, next);
    console.log('index.html cache-bust ->', STAMP);
  } else if (h.includes('houseScene.js')) {
    h = h.replace(
      'houseScene.js',
      'houseScene.js?v=' + STAMP
    );
    // only first script src occurrence carefully
    const h2 = fs.readFileSync(idx, 'utf8').replace(
      /src="houseScene\.js"/,
      'src="houseScene.js?v=' + STAMP + '"'
    ).replace(
      /src='houseScene\.js'/,
      "src='houseScene.js?v=" + STAMP + "'"
    ).replace(
      /houseScene\.js\?v=[^"']+/,
      'houseScene.js?v=' + STAMP
    );
    fs.writeFileSync(idx, h2);
    console.log('index.html cache-bust (fallback) ->', STAMP);
  }
}

// Cache-bust + permanent title badge on elevation pages
const bust = STAMP;
for (const v of ['version-one', 'version-two', 'version-three', 'version-four', 'version-five']) {
  const f = path.join('elevations', v, 'index.html');
  if (!fs.existsSync(f)) continue;
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace(
    /\['houseScene\.js(\?v=[^']*)?', '\/elevations\/' \+ ver \+ '\/houseScene\.js(\?v=[^']*)?'\]/,
    `['houseScene.js?v=${bust}', '/elevations/' + ver + '/houseScene.js?v=${bust}']`
  );
  // Permanent small badge under version label
  if (!h.includes('id="railfix"')) {
    h = h.replace(
      /(<div class="ver">[^<]*<\/div>)/,
      `$1\n  <div id="railfix" style="margin-top:6px;font-size:9px;letter-spacing:.12em;color:#7dcea0">${STAMP}</div>`
    );
  } else {
    h = h.replace(
      /id="railfix"[^>]*>[^<]*/,
      `id="railfix" style="margin-top:6px;font-size:9px;letter-spacing:.12em;color:#7dcea0">${STAMP}`
    );
  }
  // loading stamp
  if (!h.includes('__HOUSE3D_STAIR_RAIL__')) {
    h = h.replace(
      "if (!window.HouseScene) { bootFail('FAILED TO LOAD SCENE (HouseScene missing after houseScene.js)'); return; }",
      "if (!window.HouseScene) { bootFail('FAILED TO LOAD SCENE (HouseScene missing after houseScene.js)'); return; }\n" +
        "      var ls0 = document.querySelector('#loading .ls');\n" +
        "      if (ls0) ls0.textContent = window.__HOUSE3D_STAIR_RAIL__\n" +
        "        ? ('SCENE OK · ' + window.__HOUSE3D_STAIR_RAIL__)\n" +
        "        : 'SCENE OK · (old cache — hard refresh)';"
    );
  }
  fs.writeFileSync(f, h);
  console.log(f, 'ui+cache ok');
}
