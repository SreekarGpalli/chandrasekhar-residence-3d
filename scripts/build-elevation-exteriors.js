/**
 * Builds exterior-only elevation study copies from houseScene.js.
 * Strips interiors (rooms, partitions, furniture kit, dollhouse floors,
 * curtains, skirting) and writes three version folders under elevations/.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const srcPath = path.join(ROOT, 'houseScene.js');
const lines = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/);

function findLine(re, from = 0) {
  for (let i = from; i < lines.length; i++) {
    if (re.test(lines[i])) return i;
  }
  return -1;
}

function extractMethodBrace(name) {
  const start = findLine(new RegExp('^    ' + name + '\\('));
  if (start < 0) throw new Error('method not found: ' + name);
  let braceStart = -1;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].indexOf('{') >= 0) {
      braceStart = i;
      break;
    }
  }
  if (braceStart < 0) throw new Error('no brace for ' + name);
  let depth = 0;
  for (let j = braceStart; j < lines.length; j++) {
    for (const ch of lines[j]) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    if (depth === 0) {
      let chunk = lines.slice(start, j + 1).join('\n');
      if (!chunk.trimEnd().endsWith(',')) {
        chunk = chunk.replace(/\}\s*$/, '},');
      }
      return chunk;
    }
  }
  throw new Error('brace match failed for ' + name);
}

const tableM = extractMethodBrace('table');
const planterM = extractMethodBrace('planter');
const loungerM = extractMethodBrace('lounger');
const carM = extractMethodBrace('car');

const furMinimal = [
  '  /* ============ outdoor furniture only (elevation studies) ============ */',
  '  const Fur = {',
  tableM,
  planterM,
  loungerM,
  carM.replace(/,\s*$/, ''),
  '  };',
  ''
].join('\n');

const furStart = findLine(/^  \/\* ============ furniture kit/);
const roomsStart = findLine(/^  \/\* ============ rooms data/);
const openStart = findLine(/^  \/\* ============ exterior opening schedules/);
const iwStart = findLine(/^  \/\* interior wall sets/);
const buildStart = findLine(/^  \/\* ============ build ============/);
const skirtStart = findLine(/^  \/\* skirting board run/);
const nbrStart = findLine(/^  \/\* backdrop neighbour house/);
const lightingContract = findLine(/lighting contract: recessed downlights/);
const siteStart = findLine(/\/\* -------- site \(always visible\)/);
const dollStart = findLine(/\/\* ======== DOLLHOUSE floors ========/);
const viewsStart = findLine(/\/\* ---------------- view presets ----------------/);

const markers = {
  furStart, roomsStart, openStart, iwStart, buildStart,
  skirtStart, nbrStart, lightingContract, siteStart, dollStart, viewsStart
};
for (const [k, v] of Object.entries(markers)) {
  if (v < 0) {
    console.error('Missing marker:', k, markers);
    process.exit(1);
  }
}

const assembled = [];
// Keep through (but not including) skirting helper
assembled.push(...lines.slice(0, skirtStart));
// Neighbour houses through furniture kit start
assembled.push(...lines.slice(nbrStart, furStart));
// Minimal outdoor Fur
assembled.push(...furMinimal.split('\n'));
// Exterior openings (skip rooms + interior walls)
assembled.push(...lines.slice(openStart, iwStart));
// Build start through lighting contract (exclusive)
assembled.push(...lines.slice(buildStart, lightingContract));
// Site through dollhouse (exclusive) — skips curtains / downlights
assembled.push(...lines.slice(siteStart, dollStart));
// No dollhouse interiors
assembled.push(
  '    /* ======== DOLLHOUSE floors — OMITTED (elevation exterior-only study) ======== */',
  '    const floorsOut = [];',
  ''
);
// Views + return
assembled.push(...lines.slice(viewsStart));

let text = assembled.join('\n');

// Root-absolute asset paths (work from any elevation URL)
text = text.replace(
  "const CAR_MODEL_URL = 'models/car.glb';",
  "const CAR_MODEL_URL = '/models/car.glb';"
);
text = text.replace(
  "draco.setDecoderPath('lib/draco/');",
  "draco.setDecoderPath('/lib/draco/');"
);

// lights[] was declared in the removed downlight/curtain block — restore it
if (!/const lights\s*=/.test(text)) {
  text = text.replace(
    '    /* -------- site (always visible) -------- */',
    "    const lights = [];\n\n    /* -------- site (always visible) -------- */"
  );
}

// Replace dual header with elevation note
text = text.replace(
  /^\/\* =+\n   houseScene\.js[\s\S]*?={3,} \*\/\n\/\* =+\n   scene\.js[\s\S]*?={3,} \*\//,
  `/* ============================================================
   elevations houseScene — EXTERIOR ONLY
   Copied from project houseScene.js and stripped of all interior
   geometry (rooms, partitions, furniture kit, dollhouse floors,
   curtains, skirting). Outdoor amenity + shell + site remain so
   elevation studies stay fast and easy to edit.
   ============================================================ */`
);

// Elevation-friendly camera presets
text = text.replace(
  /const views = \{[\s\S]*?\n    \};/,
  `const views = {
      exterior: { pos: [31.5, 11.2, 1.2], target: [7.5, 3.3, -7.0], autoRotate: true },
      east:     { pos: [38.0, 9.5, -4.4], target: [12.6, 5.5, -4.4], autoRotate: false },
      north:    { pos: [8.3, 9.5, -28.0], target: [8.3, 5.5, -4.4], autoRotate: false },
      south:    { pos: [8.3, 9.5, 18.0],  target: [8.3, 5.5, -4.4], autoRotate: false },
      west:     { pos: [-18.0, 9.5, -4.4], target: [6.0, 5.5, -4.4], autoRotate: false }
    };`
);

// Drop interior-only warm fixture markers
const dropWarm = [
  'warmFix(8150, 8610',
  'warmFix(9150, 8610',
  'warmFix(12280, 8030',
  'warmFix(12130, 7750',
  'warmFix(12130, 8310',
  'warmFix(11550, 5350',
  'warmFix(1700, 480',
  'warmFix(4100, 480',
  'warmFix(1100, 5710',
  'warmFix(3500, 5710',
  'warmFix(1300, 480',
  'warmFix(3700, 480',
  'lights.push({ x: 12.130'
];
text = text
  .split('\n')
  .filter((l) => !dropWarm.some((d) => l.includes(d)))
  .join('\n');

// Ensure trailing newline
if (!text.endsWith('\n')) text += '\n';

// NOTE: regenerating overwrites these houseScene.js files. V1–V3 may be
// user-edited, so check with the author before running.
// V4 ("Stone Order") and V5 ("Lime · Laterite · Shade") are finished designs
// that exist only in their own folders — regenerating them would destroy the
// work. They are deliberately not listed here; add them back only if you
// intend to throw a scheme away and start from the bare shell again.
const versions = [
  { dir: 'version-one', label: 'Version One' },
  { dir: 'version-two', label: 'Version Two' },
  { dir: 'version-three', label: 'Version Three' }
];

const elevRoot = path.join(ROOT, 'elevations');
fs.mkdirSync(elevRoot, { recursive: true });

const viewerHtml = (label, versionDir) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover">
<title>Elevation · ${label} · Chandrasekhar Residence</title>
<meta name="description" content="Exterior elevation study — ${label}. Exterior only, no interiors.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#101214; --panel:rgba(22,24,27,.72); --panel-line:rgba(255,255,255,.08);
    --ink:#e8e6e1; --ink-dim:#9a9890; --brass:#c9a36a; --brass-dim:rgba(201,163,106,.35);
  }
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  html,body{height:100%;overflow:hidden}
  body{
    background:var(--bg); color:var(--ink);
    font-family:Inter,-apple-system,"Segoe UI",Roboto,sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  #c{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}
  #c:active{cursor:grabbing}
  body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:3;
    background:radial-gradient(120% 90% at 50% 42%, transparent 55%, rgba(0,0,0,.42) 100%)}
  #titleblock{position:fixed;top:max(18px, env(safe-area-inset-top));left:22px;z-index:6;user-select:none}
  #titleblock h1{font-family:Archivo,Inter,sans-serif;font-weight:700;font-size:15px;letter-spacing:.28em;line-height:1.35}
  #titleblock p{font-size:10.5px;letter-spacing:.22em;color:var(--ink-dim);margin-top:4px}
  #titleblock i{display:block;width:46px;height:2px;background:var(--brass);margin-top:10px}
  #titleblock .ver{margin-top:8px;font-size:10px;letter-spacing:.18em;color:var(--brass)}
  #compass{position:fixed;top:max(18px, env(safe-area-inset-top));right:20px;z-index:6;
    width:52px;height:52px;border-radius:50%;
    background:var(--panel);border:1px solid var(--panel-line);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
  #needle{position:absolute;inset:0;transition:transform .15s ease-out}
  #needle::before{content:"";position:absolute;left:50%;top:7px;width:2px;height:19px;margin-left:-1px;
    background:linear-gradient(var(--brass),transparent)}
  #needle::after{content:"N";position:absolute;left:50%;top:5px;transform:translateX(-50%);
    font-size:8.5px;font-weight:600;color:var(--brass);letter-spacing:0}
  #compass b{position:absolute;left:50%;top:50%;width:5px;height:5px;margin:-2.5px;border-radius:50%;background:var(--ink-dim)}
  #views{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:7;
    display:flex;background:var(--panel);border:1px solid var(--panel-line);border-radius:11px;overflow:hidden;
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);flex-wrap:wrap;justify-content:center;max-width:96vw}
  #views button{appearance:none;background:none;border:none;color:var(--ink-dim);cursor:pointer;
    font-family:Archivo,Inter,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.16em;
    padding:13px 14px 12px;position:relative;transition:color .2s}
  #views button + button{border-left:1px solid var(--panel-line)}
  #views button.on{color:var(--ink)}
  #views button.on::after{content:"";position:absolute;left:12px;right:12px;bottom:7px;height:2px;background:var(--brass)}
  #views button:hover{color:var(--ink)}
  #hint{position:fixed;left:50%;bottom:calc(72px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:5;
    font-size:10.5px;letter-spacing:.12em;color:var(--ink-dim);transition:opacity .8s;white-space:nowrap}
  #hint.fade{opacity:0}
  #nav{position:fixed;top:max(18px, env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:6;
    display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:90vw}
  #nav a{font-size:10px;letter-spacing:.14em;text-decoration:none;color:var(--ink-dim);
    padding:8px 12px;border-radius:8px;border:1px solid var(--panel-line);
    background:var(--panel);backdrop-filter:blur(10px)}
  #nav a:hover{color:var(--ink);border-color:var(--brass-dim)}
  #nav a.on{color:var(--ink);border-color:var(--brass-dim);background:rgba(201,163,106,.12)}
  #loading{position:fixed;inset:0;z-index:20;background:var(--bg);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
    transition:opacity .6s}
  #loading.done{opacity:0;pointer-events:none}
  #loading .lt{font-family:Archivo;font-weight:700;font-size:14px;letter-spacing:.32em;text-align:center}
  #loading .ls{font-size:10px;letter-spacing:.24em;color:var(--ink-dim)}
  #loading .bar{width:150px;height:2px;background:rgba(255,255,255,.08);border-radius:1px;overflow:hidden;margin-top:8px}
  #loading .bar i{display:block;width:40%;height:100%;background:var(--brass);border-radius:1px;
    animation:shimmer 1.2s ease-in-out infinite}
  @keyframes shimmer{0%{transform:translateX(-110%)}100%{transform:translateX(380%)}}
  @media (max-width:720px){
    #titleblock h1{font-size:12px;letter-spacing:.18em}
    #nav{top:auto;bottom:calc(78px + env(safe-area-inset-bottom));left:12px;right:12px;transform:none}
    #views button{padding:11px 10px;font-size:9.5px;letter-spacing:.1em}
  }
</style>
</head>
<body>
<canvas id="c"></canvas>

<header id="titleblock">
  <h1>ELEVATION STUDY</h1>
  <p>EXTERIOR ONLY · NO INTERIORS</p>
  <div class="ver">${label.toUpperCase()}</div>
  <i></i>
</header>

<nav id="nav" aria-label="Elevation versions">
  <a href="/elevations/version-one/" ${versionDir === 'version-one' ? 'class="on"' : ''}>V1</a>
  <a href="/elevations/version-two/" ${versionDir === 'version-two' ? 'class="on"' : ''}>V2</a>
  <a href="/elevations/version-three/" ${versionDir === 'version-three' ? 'class="on"' : ''}>V3</a>
  <a href="/elevations/version-four/" ${versionDir === 'version-four' ? 'class="on"' : ''}>V4</a>
  <a href="/elevations/version-five/" ${versionDir === 'version-five' ? 'class="on"' : ''}>V5</a>
  <a href="/elevations/version-six/" ${versionDir === 'version-six' ? 'class="on"' : ''}>V6</a>
  <a href="/elevations/version-seven/" ${versionDir === 'version-seven' ? 'class="on"' : ''}>V7</a>
  <a href="/elevations/version-eight/" ${versionDir === 'version-eight' ? 'class="on"' : ''}>V8</a>
  <a href="/elevations/version-nine/" ${versionDir === 'version-nine' ? 'class="on"' : ''}>V9</a>
  <a href="/elevations/version-ten/" ${versionDir === 'version-ten' ? 'class="on"' : ''}>V10</a>
  <a href="/elevations/version-eleven/" ${versionDir === 'version-eleven' ? 'class="on"' : ''}>V11</a>
  <a href="/elevations/version-twelve/" ${versionDir === 'version-twelve' ? 'class="on"' : ''}>V12</a>
  <a href="/elevations/version-thirteen/" ${versionDir === 'version-thirteen' ? 'class="on"' : ''}>V13</a>
  <a href="/elevations/version-fourteen/" ${versionDir === 'version-fourteen' ? 'class="on"' : ''}>V14</a>
  <a href="/elevations/version-fifteen/" ${versionDir === 'version-fifteen' ? 'class="on"' : ''}>V15</a>
  <a href="/elevations/version-sixteen/" ${versionDir === 'version-sixteen' ? 'class="on"' : ''}>V16</a>
  <a href="/">Main house</a>
</nav>

<div id="compass" aria-hidden="true"><div id="needle"></div><b></b></div>

<nav id="views">
  <button data-view="exterior" class="on">ORBIT</button>
  <button data-view="east">EAST</button>
  <button data-view="north">NORTH</button>
  <button data-view="south">SOUTH</button>
  <button data-view="west">WEST</button>
</nav>

<div id="hint">DRAG TO ORBIT · SCROLL TO ZOOM · RIGHT-DRAG TO PAN</div>

<div id="loading">
  <div class="lt">ELEVATION · ${label.toUpperCase()}</div>
  <div class="ls">EXTERIOR ONLY · PREPARING 3D MODEL</div>
  <div class="bar"><i></i></div>
</div>

<!-- Root-absolute asset paths so the page works with or without a trailing slash -->
<script src="/lib/three.min.js"></script>
<script>window.THREE||document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\\/script>')</script>
<script src="/lib/GLTFLoader.js"></script>
<script>window.THREE&&THREE.GLTFLoader||document.write('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"><\\/script>')</script>
<script src="/lib/DRACOLoader.js"></script>
<script>window.THREE&&THREE.DRACOLoader||document.write('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js"><\\/script>')</script>
<script src="/perf.js"></script>
<script src="/elevations/${versionDir}/houseScene.js"></script>
<script>
(function () {
  'use strict';
  function bootFail(msg) {
    var ls = document.querySelector('#loading .ls');
    var bar = document.querySelector('#loading .bar');
    if (ls) ls.textContent = msg;
    if (bar) bar.style.display = 'none';
  }
  if (!window.THREE) { bootFail('FAILED TO LOAD 3D ENGINE'); return; }
  if (!window.HouseScene) { bootFail('FAILED TO LOAD SCENE'); return; }

  const THREE = window.THREE;
  const canvas = document.getElementById('c');

  // Adaptive quality (same contract as main index.html)
  const Q = window.Perf ? Perf.detect()
    : { tier: 'high', dpr: Math.min(window.devicePixelRatio || 1, 2), antialias: true, shadows: true, shadowType: 'pcfsoft', shadowMap: 2048, powerPreference: 'high-performance' };

  let renderer;
  try {
    const opts = window.Perf && Perf.rendererOpts
      ? Perf.rendererOpts(Q, canvas)
      : { canvas: canvas, antialias: Q.antialias !== false, powerPreference: Q.powerPreference || 'high-performance', alpha: false };
    renderer = new THREE.WebGLRenderer(opts);
  } catch (e) {
    bootFail('WEBGL UNAVAILABLE ON THIS DEVICE');
    return;
  }
  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  else if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
  }
  const SHADOW_TYPE = {
    basic: THREE.BasicShadowMap,
    pcf: THREE.PCFShadowMap,
    pcfsoft: THREE.PCFSoftShadowMap
  };
  renderer.shadowMap.enabled = Q.shadows !== false;
  renderer.shadowMap.type = SHADOW_TYPE[Q.shadowType] || THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = Q.shadows !== false;
  renderer.setPixelRatio(Q.dpr || Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x101214, 1);

  let needsRender = true;
  function requestRender() { needsRender = true; }

  if (window.Perf && Perf.onContextLoss) {
    Perf.onContextLoss(canvas, function () {}, function () { requestRender(); });
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101214);
  scene.fog = new THREE.Fog(0x101214, 45, 95);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.15, 200);
  let data;
  try {
    data = window.HouseScene.build(THREE);
  } catch (err) {
    console.error(err);
    bootFail('SCENE BUILD FAILED — SEE CONSOLE');
    return;
  }
  scene.add(data.root);

  // Site + exterior + outdoor decks always on; no dollhouse floors
  if (data.site) data.site.visible = true;
  if (data.exterior) data.exterior.visible = true;
  if (data.outdoors) data.outdoors.forEach(function (g) { g.visible = true; });
  if (data.floors) data.floors.forEach(function (f) { if (f.group) f.group.visible = false; });

  // Lighting
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x3a342c, 0.55));
  const sun = new THREE.DirectionalLight(0xfff2df, 1.15);
  sun.position.set(28, 42, 12);
  sun.castShadow = Q.shadows !== false;
  const sm = Q.shadowMap || 2048;
  sun.shadow.mapSize.set(sm, sm);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 90;
  sun.shadow.camera.left = -35;
  sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -25;
  sun.shadow.bias = -0.00025;
  scene.add(sun);
  scene.add(sun.target);
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));

  function bakeShadows() {
    if (Q.shadows === false) return;
    renderer.shadowMap.needsUpdate = true;
  }

  const views = data.views || {};
  const VIEW_KEYS = ['exterior', 'east', 'north', 'south', 'west'];

  const ctl = {
    theta: 0.85, phi: 1.15, radius: 34,
    target: new THREE.Vector3(7.5, 3.3, -7.0),
    dragging: false, panning: false,
    lx: 0, ly: 0, interacted: false
  };

  function applyView(name, instant) {
    const v = views[name] || views.exterior;
    if (!v) return;
    const pos = new THREE.Vector3(v.pos[0], v.pos[1], v.pos[2]);
    const tgt = new THREE.Vector3(v.target[0], v.target[1], v.target[2]);
    ctl.target.copy(tgt);
    const offset = pos.clone().sub(tgt);
    ctl.radius = offset.length();
    ctl.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / ctl.radius)));
    ctl.theta = Math.atan2(offset.x, offset.z);
    ctl.interacted = true;
    document.querySelectorAll('#views button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-view') === name);
    });
    if (instant) updateCamera();
  }

  function updateCamera() {
    const s = Math.sin(ctl.phi);
    camera.position.set(
      ctl.target.x + ctl.radius * s * Math.sin(ctl.theta),
      ctl.target.y + ctl.radius * Math.cos(ctl.phi),
      ctl.target.z + ctl.radius * s * Math.cos(ctl.theta)
    );
    camera.lookAt(ctl.target);
    const needle = document.getElementById('needle');
    if (needle) needle.style.transform = 'rotate(' + (-ctl.theta * 180 / Math.PI) + 'deg)';
  }

  applyView('exterior', true);

  document.querySelectorAll('#views button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyView(btn.getAttribute('data-view'), true);
      requestRender();
    });
  });

  // Pointer controls
  canvas.addEventListener('pointerdown', function (e) {
    ctl.dragging = e.button === 0;
    ctl.panning = e.button === 2 || e.button === 1;
    ctl.lx = e.clientX; ctl.ly = e.clientY;
    ctl.interacted = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!ctl.dragging && !ctl.panning) return;
    const dx = e.clientX - ctl.lx, dy = e.clientY - ctl.ly;
    ctl.lx = e.clientX; ctl.ly = e.clientY;
    if (ctl.panning) {
      const pan = ctl.radius * 0.0014;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      camera.getWorldDirection(right);
      right.cross(camera.up).normalize();
      up.copy(camera.up).normalize();
      ctl.target.addScaledVector(right, -dx * pan);
      ctl.target.addScaledVector(up, dy * pan);
    } else {
      ctl.theta -= dx * 0.0052;
      ctl.phi = Math.max(0.12, Math.min(Math.PI - 0.12, ctl.phi + dy * 0.0042));
    }
    updateCamera();
    requestRender();
  });
  canvas.addEventListener('pointerup', function () {
    ctl.dragging = false; ctl.panning = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    ctl.radius = Math.max(4.5, Math.min(80, ctl.radius * (1 + e.deltaY * 0.0012)));
    ctl.interacted = true;
    updateCamera();
    requestRender();
  }, { passive: false });

  // Touch pinch
  let pinchDist = 0;
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist = Math.hypot(dx, dy);
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2 && pinchDist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      ctl.radius = Math.max(4.5, Math.min(80, ctl.radius * (pinchDist / d)));
      pinchDist = d;
      updateCamera();
      requestRender();
    }
  }, { passive: true });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    requestRender();
  });

  // Hint fade
  setTimeout(function () {
    var h = document.getElementById('hint');
    if (h) h.classList.add('fade');
  }, 4500);

  let autoUntil = performance.now() + 12000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let shadowsBaked = false;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!ctl.interacted && !reduceMotion && now < autoUntil) {
      ctl.theta += 0.0022;
      updateCamera();
      needsRender = true;
    }
    if (document.hidden) return;
    if (needsRender || (!ctl.interacted && now < autoUntil)) {
      if (!shadowsBaked) {
        bakeShadows();
        shadowsBaked = true;
      }
      renderer.render(scene, camera);
      needsRender = false;
    }
  }
  requestAnimationFrame(frame);

  // Hide loading after first paint
  requestAnimationFrame(function () {
    bakeShadows();
    shadowsBaked = true;
    renderer.render(scene, camera);
    needsRender = false;
    var el = document.getElementById('loading');
    if (el) el.classList.add('done');
  });

  window.addEventListener('houseCarReady', function () {
    shadowsBaked = false;
    bakeShadows();
    shadowsBaked = true;
    requestRender();
  });
})();
</script>
</body>
</html>
`;

for (const v of versions) {
  const dir = path.join(elevRoot, v.dir);
  fs.mkdirSync(dir, { recursive: true });
  const vtext = text.replace(
    'elevations houseScene — EXTERIOR ONLY',
    'elevations / ' + v.dir + ' — EXTERIOR ONLY (' + v.label + ')'
  );
  fs.writeFileSync(path.join(dir, 'houseScene.js'), vtext);
  fs.writeFileSync(path.join(dir, 'index.html'), viewerHtml(v.label, v.dir));
  console.log('wrote', v.dir, 'houseScene lines:', vtext.split('\n').length);
}

// Elevations index + README
const readme = `# Elevation Studies

Exterior-only variants of the Chandrasekhar Residence for facade / elevation
exploration. **No interiors** — room partitions, furniture, curtains, skirting,
and dollhouse floor plates were removed so each version stays light and easy
to iterate on.

## Versions

| Folder | Viewer | Notes |
|--------|--------|--------|
| \`version-one/\` | [Open V1](./version-one/) | Baseline exterior (current building shell) |
| \`version-two/\` | [Open V2](./version-two/) | Copy of baseline — edit freely |
| \`version-three/\` | [Open V3](./version-three/) | Copy of baseline — edit freely |

All three start as identical exterior copies of the main \`houseScene.js\`.
Change materials, openings, massing, or facade treatments per folder without
touching the full house (interiors live only in the project root).

## What each version contains

- Building shell walls, glazing, doors, parapet, mumty
- Site (plot, vegetation, neighbours, road)
- Portico / balconies / outdoor decks + planters
- Elevation camera presets: Orbit · East · North · South · West

## What was removed

- Interior wall partitions (\`IW\`)
- Room data / labels (\`ROOMS\`)
- Full furniture kit (beds, kitchens, baths, etc.)
- Dollhouse per-floor cutaways
- Interior curtains, skirting, room downlights

Outdoor-only helpers kept: \`planter\`, \`lounger\`, \`table\`, \`car\`.

## Run locally

From the project root (same static server as the main house):

\`\`\`bash
node serve.js
# then open e.g. http://localhost:8080/elevations/version-one/
\`\`\`

Or:

\`\`\`bash
npx http-server -p 8129 -c-1
# http://localhost:8129/elevations/version-one/
\`\`\`

## Editing tips

1. Work only inside the version folder you care about (\`houseScene.js\`).
2. Facade treatments live in the \`exterior()\` IIFE (search for
   \`EAST FACADE\`, \`NORTH FACADE\`, etc.).
3. Window/door schedules: \`OPEN.f0\` / \`OPEN.f1\` / \`OPEN.f2\`.
4. Colours/materials: palette \`C\` and \`buildMaterials\`.
5. Rebuild all three exteriors from the live main house anytime:

\`\`\`bash
node scripts/build-elevation-exteriors.js
\`\`\`

(That overwrites all three versions with a fresh exterior strip of root
\`houseScene.js\` — only do this when you want to reset from the main building.)
`;

fs.writeFileSync(path.join(elevRoot, 'README.md'), readme);

const indexHtml = `<!DOCTYPE html>
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
  p{margin-top:10px;color:var(--dim);font-size:13px;letter-spacing:.08em;max-width:420px;text-align:center;line-height:1.55}
  .rule{width:46px;height:2px;background:var(--brass);margin:18px 0 28px}
  .grid{display:grid;gap:14px;width:min(720px,100%);grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
  a.card{display:block;padding:22px 20px;border-radius:12px;border:1px solid var(--line);
    background:var(--panel);text-decoration:none;color:inherit;transition:border-color .2s,transform .2s}
  a.card:hover{border-color:rgba(201,163,106,.45);transform:translateY(-2px)}
  a.card strong{font-family:Archivo,sans-serif;letter-spacing:.2em;font-size:13px;display:block}
  a.card span{display:block;margin-top:8px;font-size:12px;color:var(--dim);letter-spacing:.04em;line-height:1.45}
  .back{margin-top:36px;font-size:12px;letter-spacing:.14em;color:var(--dim);text-decoration:none}
  .back:hover{color:var(--brass)}
</style>
</head>
<body>
  <h1>ELEVATION STUDIES</h1>
  <p>Exterior-only building shells for trying multiple facade versions. Interiors are stripped out on purpose.</p>
  <div class="rule"></div>
  <div class="grid">
    <a class="card" href="/elevations/version-one/"><strong>VERSION ONE</strong><span>Baseline exterior from the current house. Start here.</span></a>
    <a class="card" href="/elevations/version-two/"><strong>VERSION TWO</strong><span>Independent copy — explore alternate elevation ideas.</span></a>
    <a class="card" href="/elevations/version-three/"><strong>VERSION THREE</strong><span>Independent copy — third elevation direction.</span></a>
  </div>
  <a class="back" href="/">← Full house (with interiors)</a>
</body>
</html>
`;
fs.writeFileSync(path.join(elevRoot, 'index.html'), indexHtml);

console.log('elevations ready at', elevRoot);
console.log('markers used:', markers);
