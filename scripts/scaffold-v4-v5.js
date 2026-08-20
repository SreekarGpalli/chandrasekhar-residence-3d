/**
 * Scaffold version-four (blank canvas for other agents) and version-five
 * (then design-version-five.js applies the elevation language).
 * Does NOT overwrite version-one / two / three houseScene.js.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ELEV = path.join(ROOT, 'elevations');
const SRC = path.join(ELEV, 'version-one');

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
  const vers = [
    ['version-one', 'V1'],
    ['version-two', 'V2'],
    ['version-three', 'V3'],
    ['version-four', 'V4'],
    ['version-five', 'V5'],
    ['version-six', 'V6'],
    ['version-seven', 'V7'],
    ['version-eight', 'V8'],
    ['version-nine', 'V9'],
    ['version-ten', 'V10'],
    ['version-eleven', 'V11'],
    ['version-twelve', 'V12'],
    ['version-thirteen', 'V13'],
    ['version-fourteen', 'V14'],
    ['version-fifteen', 'V15'],
    ['version-sixteen', 'V16']
  ];
  return vers
    .map(([dir, lab]) => {
      const on = dir === active ? ' class="on"' : '';
      return `  <a href="/elevations/${dir}/"${on}>${lab}</a>`;
    })
    .join('\n') + '\n  <a href="/">Main house</a>';
}

function patchViewer(dir, label) {
  const file = path.join(ELEV, dir, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  // Title / labels
  html = html.replace(/Elevation · Version \w+/g, `Elevation · ${label}`);
  html = html.replace(/Elevation · Version One/g, `Elevation · ${label}`);
  html = html.replace(/VERSION ONE|VERSION TWO|VERSION THREE|VERSION FOUR|VERSION FIVE/g, label.toUpperCase());
  html = html.replace(/Version One|Version Two|Version Three|Version Four|Version Five/g, label);
  // Script path for houseScene
  html = html.replace(
    /src="\/elevations\/version-\w+\/houseScene\.js"/,
    `src="/elevations/${dir}/houseScene.js"`
  );
  // Replace entire nav block
  html = html.replace(
    /<nav id="nav"[^>]*>[\s\S]*?<\/nav>/,
    `<nav id="nav" aria-label="Elevation versions">\n${navHtml(dir)}\n</nav>`
  );
  fs.writeFileSync(file, html);
}

// Copy baselines
for (const [dir, label] of [
  ['version-four', 'Version Four'],
  ['version-five', 'Version Five']
]) {
  const dest = path.join(ELEV, dir);
  copyDir(SRC, dest);
  // Stamp houseScene header
  let scene = fs.readFileSync(path.join(dest, 'houseScene.js'), 'utf8');
  scene = scene.replace(
    /elevations \/ version-\w+ — EXTERIOR ONLY \(Version \w+\)/,
    `elevations / ${dir} — EXTERIOR ONLY (${label})`
  );
  fs.writeFileSync(path.join(dest, 'houseScene.js'), scene);
  patchViewer(dir, label);
  console.log('scaffolded', dir);
}

// Patch existing V1–V3 viewers (nav only, leave houseScene alone)
for (const [dir, label] of [
  ['version-one', 'Version One'],
  ['version-two', 'Version Two'],
  ['version-three', 'Version Three']
]) {
  if (fs.existsSync(path.join(ELEV, dir, 'index.html'))) {
    patchViewer(dir, label);
    console.log('nav updated', dir);
  }
}

// Hub + README
const hub = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Elevation Studies · Chandrasekhar Residence</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{--bg:#101214;--ink:#e8e6e1;--dim:#9a9890;--brass:#c9a36a;--panel:#1a1c1f;--line:rgba(255,255,255,.08)}
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,sans-serif;
    display:flex;flex-direction:column;align-items:center;padding:48px 20px 64px}
  h1{font-family:Archivo,sans-serif;letter-spacing:.32em;font-size:18px;font-weight:700}
  p{margin-top:10px;color:var(--dim);font-size:13px;letter-spacing:.08em;max-width:480px;text-align:center;line-height:1.55}
  .rule{width:46px;height:2px;background:var(--brass);margin:18px 0 28px}
  .grid{display:grid;gap:14px;width:min(920px,100%);grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
  a.card{display:block;padding:22px 20px;border-radius:12px;border:1px solid var(--line);
    background:var(--panel);text-decoration:none;color:inherit;transition:border-color .2s,transform .2s}
  a.card:hover{border-color:rgba(201,163,106,.45);transform:translateY(-2px)}
  a.card strong{font-family:Archivo,sans-serif;letter-spacing:.2em;font-size:13px;display:block}
  a.card span{display:block;margin-top:8px;font-size:12px;color:var(--dim);letter-spacing:.04em;line-height:1.45}
  a.card em{display:block;margin-top:10px;font-style:normal;font-size:10px;letter-spacing:.16em;color:var(--brass)}
  .back{margin-top:36px;font-size:12px;letter-spacing:.14em;color:var(--dim);text-decoration:none}
  .back:hover{color:var(--brass)}
</style>
</head>
<body>
  <h1>ELEVATION STUDIES</h1>
  <p>Exterior-only building shells for facade exploration. Interiors stripped. V1–V3 for manual work; V4 for agent experiments; V5 is a designed proposal.</p>
  <div class="rule"></div>
  <div class="grid">
    <a class="card" href="/elevations/version-one/"><strong>VERSION ONE</strong><span>Baseline shell — your canvas.</span><em>MANUAL</em></a>
    <a class="card" href="/elevations/version-two/"><strong>VERSION TWO</strong><span>Independent copy — your canvas.</span><em>MANUAL</em></a>
    <a class="card" href="/elevations/version-three/"><strong>VERSION THREE</strong><span>Independent copy — your canvas.</span><em>MANUAL</em></a>
    <a class="card" href="/elevations/version-four/"><strong>VERSION FOUR</strong><span>Baseline for AI agent elevation experiments.</span><em>AGENT CANVAS</em></a>
    <a class="card" href="/elevations/version-five/"><strong>VERSION FIVE</strong><span>Lime · laterite · shade — designed Indian contemporary.</span><em>DESIGNED</em></a>
  </div>
  <a class="back" href="/">← Full house (with interiors)</a>
</body>
</html>
`;
fs.writeFileSync(path.join(ELEV, 'index.html'), hub);

const readme = `# Elevation Studies

Exterior-only variants of the Chandrasekhar Residence (G+2, Anantapur).
**No interiors** — partitions, furniture, and dollhouse floors removed.

## Versions

| Folder | Role | Notes |
|--------|------|--------|
| \`version-one/\` | Manual | Baseline shell — edit freely |
| \`version-two/\` | Manual | Baseline shell — edit freely |
| \`version-three/\` | Manual | Baseline shell — edit freely |
| \`version-four/\` | Agent canvas | Baseline for AI agents to redesign |
| \`version-five/\` | Designed | **Lime · Laterite · Shade** — climate-first Indian contemporary |

## Version Five concept

Hot-dry Anantapur residential language:

- Soft lime-white plaster body
- Dark stone plinth (local granite / Kadapa reading)
- Terracotta laterite accents (chajja soffits, portal frames, limited fins)
- Slim slab-edge datums instead of heavy bands
- MS jaali screens on blank wall zones (shade + pattern, cost-effective)
- Deeper entry canopies for sun control
- Ordered portico columns (stone base · plaster shaft · stone capital)

Cost drivers kept low: plaster + paint, RCC chajjas, mild-steel jaali, limited stone cladding bands — not full-stone or glass curtain wall.

## Run

\`\`\`bash
node serve.js
# http://localhost:8080/elevations/
# http://localhost:8080/elevations/version-five/
\`\`\`

## Editing

1. Work only inside the version folder (\`houseScene.js\`).
2. Facade language: search \`EAST FACADE\`, \`NORTH FACADE\`, etc.
3. Openings: \`OPEN.f0\` / \`OPEN.f1\` / \`OPEN.f2\`.
4. Palette: \`C\` + \`buildMaterials\`.

## Rebuild baseline exteriors

\`\`\`bash
node scripts/build-elevation-exteriors.js   # regenerates all listed versions from main house
node scripts/scaffold-v4-v5.js             # ensure V4/V5 folders + hub nav exist
node scripts/design-version-five.js        # re-apply V5 design language
\`\`\`

**Warning:** \`build-elevation-exteriors.js\` overwrites version houseScene files listed in its config.
`;
fs.writeFileSync(path.join(ELEV, 'README.md'), readme);

console.log('hub + README updated');
