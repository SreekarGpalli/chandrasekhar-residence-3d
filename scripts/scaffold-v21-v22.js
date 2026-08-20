/**
 * Scaffold Version Twenty-One and Twenty-Two from Version Nineteen's
 * photoreal renderer. Geometry starts as a V19 copy; the photoreal
 * page is the default viewer. Does not overwrite V19 or V20.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ELEV = path.join(ROOT, 'elevations');
const SRC = path.join(ELEV, 'version-nineteen');

const VERS = [
  {
    dir: 'version-twenty-one',
    label: 'Version Twenty-One',
    short: 'V21',
    stamp: 'V21_PHOTO_20260814a',
    word: 'TWENTY-ONE',
    numeral: 'Twenty-One'
  },
  {
    dir: 'version-twenty-two',
    label: 'Version Twenty-Two',
    short: 'V22',
    stamp: 'V22_PHOTO_20260814a',
    word: 'TWENTY-TWO',
    numeral: 'Twenty-Two'
  }
];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    const a = path.join(from, name);
    const b = path.join(to, name);
    if (fs.statSync(a).isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

function write(file, text) {
  fs.writeFileSync(file, text);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function photorealNav(active) {
  const v21on = active === 'version-twenty-one' ? ' class="on"' : '';
  const v22on = active === 'version-twenty-two' ? ' class="on"' : '';
  return [
    '  <a href="../version-nineteen/">V19 · STUDY</a>',
    '  <a href="../version-nineteen/real.html">V19 · PHOTOREAL</a>',
    '  <a href="../version-twenty/">V20</a>',
    `  <a href="../version-twenty-one/"${v21on}>V21</a>`,
    `  <a href="../version-twenty-two/"${v22on}>V22</a>`,
    '  <a href="study.html">' + (active === 'version-twenty-one' ? 'V21' : 'V22') + ' · STUDY</a>',
    '  <a href="../">All versions</a>'
  ].join('\n');
}

function studyNav(active) {
  const v21on = active === 'version-twenty-one' ? ' class="on"' : '';
  const v22on = active === 'version-twenty-two' ? ' class="on"' : '';
  return [
    '  <a href="../version-seventeen/">V17</a>',
    '  <a href="../version-eighteen/">V18</a>',
    '  <a href="../version-nineteen/">V19</a>',
    '  <a href="../version-nineteen/real.html">V19 · PHOTO</a>',
    '  <a href="../version-twenty/">V20</a>',
    `  <a href="../version-twenty-one/"${v21on}>V21</a>`,
    `  <a href="../version-twenty-two/"${v22on}>V22</a>`,
    '  <a href="./">Photoreal</a>',
    '  <a href="../../index.html">Main house</a>'
  ].join('\n');
}

function patchHouseScene(dest, v) {
  const file = path.join(dest, 'houseScene.js');
  let src = read(file);
  src = src.replace(
    /elevations \/ version-nineteen — EXTERIOR ONLY \(Version Nineteen\)\r?\n   Copy of Version Eighteen\. East stair: plaster wall \+ one recessed\r?\n   glass ribbon \(three fixed lights\)\. V18 full wall kept as option\./,
    `elevations / ${v.dir} — EXTERIOR ONLY (${v.label})\n   Photoreal canvas. Geometry starts as a copy of Version Nineteen.\n   Open for a new facade direction — design is free to change.`
  );
  src = src.replace(
    "window.__HOUSE3D_STAIR_RAIL__ = 'V19_TREES_20260814d'",
    `window.__HOUSE3D_STAIR_RAIL__ = '${v.stamp}'`
  );
  src = src.replace(/\/elevations\/version-nineteen\/assets\//g, `/elevations/${v.dir}/assets/`);
  write(file, src);
}

function patchPhotoreal(dest, v) {
  const srcFile = path.join(dest, 'real.html');
  const outFile = path.join(dest, 'index.html');
  let html = read(srcFile);

  html = html.replace(
    'Elevation · Version Nineteen · Photoreal · Chandrasekhar Residence',
    `Elevation · ${v.label} · Photoreal · Chandrasekhar Residence`
  );
  html = html.replace(
    'Photoreal exterior render of Version Nineteen — fully textured, screen-space GI, reflections, temporal accumulation.',
    `Photoreal exterior render of ${v.label} — V19 pipeline (SSGI, SSR, temporal, filmic). Open canvas.`
  );
  html = html.replace('VERSION NINETEEN · EXTERIOR ONLY', `${v.label.toUpperCase()} · EXTERIOR ONLY`);
  html = html.replace('VERSION NINETEEN · PHOTOREAL', `${v.label.toUpperCase()} · PHOTOREAL`);
  html = html.replace(/var STAMP = 'V19REAL_20260814a';/, `var STAMP = '${v.stamp}';`);
  html = html.replace(
    "'/elevations/version-nineteen/houseScene.js?v=' + STAMP]",
    `'/elevations/${v.dir}/houseScene.js?v=' + STAMP]`
  );
  html = html.replace(
    'The geometry is Version Nineteen, untouched — everything here is the render.',
    `The geometry starts as Version Nineteen, copied into ${v.label}. The renderer is the V19 photoreal pipeline.`
  );
  html = html.replace(
    /<nav id="nav" aria-label="Elevation versions">[\s\S]*?<\/nav>/,
    `<nav id="nav" aria-label="Elevation versions">\n${photorealNav(v.dir)}\n</nav>`
  );

  write(outFile, html);
  fs.unlinkSync(srcFile);
}

function patchStudy(dest, v) {
  const file = path.join(dest, 'study.html');
  fs.renameSync(path.join(dest, 'index.html'), file);
  let html = read(file);

  html = html.replace(
    'Elevation · Version Nineteen · Chandrasekhar Residence',
    `Elevation · ${v.label} · Study · Chandrasekhar Residence`
  );
  html = html.replace(
    'Exterior elevation study — Version Nineteen. Exterior only, no interiors.',
    `Exterior elevation study — ${v.label}. Photoreal is the default; this is the raw study viewer.`
  );
  html = html.replace(/VERSION NINETEEN/g, `VERSION ${v.word}`);
  html = html.replace(/V19_TREES_20260814d/g, v.stamp);
  html = html.replace("var ver = 'version-nineteen';", `var ver = '${v.dir}';`);
  html = html.replace(/window\.__v19 = \{/, `window.__${v.short.toLowerCase()} = {`);
  html = html.replace(
    /<nav id="nav" aria-label="Elevation versions">[\s\S]*?<\/nav>/,
    `<nav id="nav" aria-label="Elevation versions">\n${studyNav(v.dir)}\n</nav>`
  );

  write(file, html);
}

function insertAfterV20(html) {
  if (html.includes('version-twenty-one')) return html;
  return html.replace(
    /(<a href="\.\.\/version-twenty\/"(?: class="on")?>V20<\/a>\n)/,
    '$1  <a href="../version-twenty-one/">V21</a>\n  <a href="../version-twenty-two/">V22</a>\n'
  );
}

function patchExistingNavs() {
  const dirs = fs.readdirSync(ELEV).filter((d) => {
    const p = path.join(ELEV, d);
    return fs.statSync(p).isDirectory() && d.startsWith('version-');
  });

  for (const d of dirs) {
    if (d === 'version-twenty-one' || d === 'version-twenty-two') continue;
    for (const name of ['index.html', 'real.html', 'study.html']) {
      const file = path.join(ELEV, d, name);
      if (!fs.existsSync(file)) continue;
      const before = read(file);
      const after = insertAfterV20(before);
      if (after !== before) write(file, after);
    }
  }

  const v19real = path.join(ELEV, 'version-nineteen', 'real.html');
  if (fs.existsSync(v19real)) {
    let html = read(v19real);
    if (!html.includes('version-twenty-one')) {
      html = html.replace(
        '  <a href="../version-nineteen/real.html" class="on">V19 · PHOTOREAL</a>\n  <a href="../">All versions</a>',
        '  <a href="../version-nineteen/real.html" class="on">V19 · PHOTOREAL</a>\n  <a href="../version-twenty-one/">V21</a>\n  <a href="../version-twenty-two/">V22</a>\n  <a href="../">All versions</a>'
      );
      write(v19real, html);
    }
  }
}

function patchHub() {
  const file = path.join(ELEV, 'index.html');
  let html = read(file);
  html = html.replace(
    'V1–V3 and V6–V20 are open canvases',
    'V1–V3 and V6–V20 are study canvases; V21 and V22 are photoreal canvases'
  );
  if (!html.includes('version-twenty-one')) {
    html = html.replace(
      '    <a class="card" href="version-seventeen-real/"><strong>V17 · PHOTOREAL</strong>',
      `    <a class="card" href="version-nineteen/real.html"><strong>V19 · PHOTOREAL</strong><span>Version Nineteen geometry through the photoreal pipeline — SSGI, SSR, temporal, filmic.</span><em>RENDER</em></a>
    <a class="card" href="version-twenty-one/"><strong>VERSION TWENTY-ONE</strong><span>Photoreal canvas from V19 — open for a new facade direction.</span><em>PHOTOREAL · OPEN</em></a>
    <a class="card" href="version-twenty-two/"><strong>VERSION TWENTY-TWO</strong><span>Photoreal canvas from V19 — second independent experiment.</span><em>PHOTOREAL · OPEN</em></a>
    <a class="card" href="version-seventeen-real/"><strong>V17 · PHOTOREAL</strong>`
    );
  }
  write(file, html);
}

function patchReadme() {
  const file = path.join(ELEV, 'README.md');
  let md = read(file);
  if (!md.includes('version-twenty-one')) {
    md = md.replace(
      '| `version-seventeen-real/` | **Render** | Version Seventeen geometry, photoreal render — see below |',
      `| \`version-twenty-one/\` | **Photoreal** | V19 photoreal pipeline + V19 geometry — open canvas |
| \`version-twenty-two/\` | **Photoreal** | Independent copy of V21 — open canvas |
| \`version-seventeen-real/\` | **Render** | Version Seventeen geometry, photoreal render — see below |`
    );
  }
  if (!md.includes('## Version Twenty-One / Twenty-Two')) {
    const insertAt = md.indexOf('## Version Nineteen · defect pass');
    if (insertAt !== -1) {
      const section = `## Version Twenty-One / Twenty-Two · photoreal canvases

Copied from Version Nineteen's photoreal page (\`real.html\`) plus its
\`houseScene.js\` and garden assets. Photoreal is the default viewer
(\`index.html\`); the raw study viewer is kept as \`study.html\`.

Geometry starts identical to V19. These folders exist so a new facade
direction can be tried without touching V19 or V20.

`;
      md = md.slice(0, insertAt) + section + md.slice(insertAt);
    }
  }
  write(file, md);
}

for (const v of VERS) {
  const dest = path.join(ELEV, v.dir);
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyDir(SRC, dest);
  // study.html first (renames the copied study index.html out of the way)
  patchStudy(dest, v);
  patchPhotoreal(dest, v);
  patchHouseScene(dest, v);
  console.log('scaffolded', v.dir);
}

patchExistingNavs();
patchHub();
patchReadme();
console.log('hub, readme, and existing navs updated');
