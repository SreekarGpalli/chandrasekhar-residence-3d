/**
 * Snapshot current Version Twenty-One into Version Twenty-Three,
 * then add V23 to the eight-version nav / hub.
 */
const fs = require('fs');
const path = require('path');

const ELEV = path.resolve(__dirname, '..', 'elevations');
const SRC = path.join(ELEV, 'version-twenty-one');
const DEST = path.join(ELEV, 'version-twenty-three');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    const a = path.join(from, name);
    const b = path.join(to, name);
    if (fs.statSync(a).isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

function navHtml(active) {
  const keep = [
    ['version-one', 'V1'],
    ['version-six', 'V6'],
    ['version-fourteen', 'V14'],
    ['version-sixteen', 'V16'],
    ['version-seventeen', 'V17'],
    ['version-nineteen', 'V19'],
    ['version-twenty-one', 'V21'],
    ['version-twenty-two', 'V22'],
    ['version-twenty-three', 'V23']
  ];
  return (
    keep
      .map(([dir, lab]) => {
        const on = dir === active ? ' class="on"' : '';
        return `  <a href="../${dir}/"${on}>${lab}</a>`;
      })
      .join('\n') + '\n  <a href="../">All</a>'
  );
}

if (fs.existsSync(DEST)) fs.rmSync(DEST, { recursive: true, force: true });
copyDir(SRC, DEST);

let scene = fs.readFileSync(path.join(DEST, 'houseScene.js'), 'utf8');
scene = scene.replace(
  /elevations \/ version-twenty-one — EXTERIOR ONLY \(Version Twenty-One\)\r?\n   Photoreal canvas from V19\. East fin cage: slim white RCC, interior\r?\n   splay only, locked to fascia \/ deck \/ screen-end\./,
  'elevations / version-twenty-three — EXTERIOR ONLY (Version Twenty-Three)\n   Snapshot of V21 after the slim-align pass. Frozen canvas.'
);
scene = scene.replace(
  "window.__HOUSE3D_STAIR_RAIL__ = 'V21_RCC_BOX_20260814d'",
  "window.__HOUSE3D_STAIR_RAIL__ = 'V23_SNAP_20260814a'"
);
scene = scene.replace(/\/elevations\/version-twenty-one\/assets\//g, '/elevations/version-twenty-three/assets/');
fs.writeFileSync(path.join(DEST, 'houseScene.js'), scene);

let html = fs.readFileSync(path.join(DEST, 'index.html'), 'utf8');
html = html
  .replace(/Version Twenty-One/g, 'Version Twenty-Three')
  .replace(/VERSION TWENTY-ONE/g, 'VERSION TWENTY-THREE')
  .replace(/V21_RCC_BOX_20260814d/g, 'V23_SNAP_20260814a')
  .replace(/version-twenty-one/g, 'version-twenty-three');
html = html.replace(
  /<nav id="nav"[^>]*>[\s\S]*?<\/nav>/,
  `<nav id="nav" aria-label="Elevation versions">\n${navHtml('version-twenty-three')}\n</nav>`
);
fs.writeFileSync(path.join(DEST, 'index.html'), html);
console.log('scaffolded version-twenty-three');

const live = [
  'version-one',
  'version-six',
  'version-fourteen',
  'version-sixteen',
  'version-seventeen',
  'version-nineteen',
  'version-twenty-one',
  'version-twenty-two'
];
for (const dir of live) {
  const file = path.join(ELEV, dir, 'index.html');
  let page = fs.readFileSync(file, 'utf8');
  if (page.includes('version-twenty-three')) continue;
  page = page.replace(
    /<nav id="nav"[^>]*>[\s\S]*?<\/nav>/,
    `<nav id="nav" aria-label="Elevation versions">\n${navHtml(dir)}\n</nav>`
  );
  fs.writeFileSync(file, page);
  console.log('nav', dir);
}
