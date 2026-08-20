/**
 * Make elevation viewers resilient:
 * 1) Force trailing slash so relative houseScene.js resolves correctly
 * 2) Root-absolute fallbacks for /lib and version houseScene
 * 3) Clear load errors on screen
 */
const fs = require('fs');
const path = require('path');

const versions = [
  'version-one',
  'version-two',
  'version-three',
  'version-four',
  'version-five',
  'version-six',
  'version-seven',
  'version-eight',
  'version-nine',
  'version-ten',
  'version-eleven',
  'version-twelve',
  'version-thirteen',
  'version-fourteen',
  'version-fifteen',
  'version-sixteen'
];

function bootScript(versionDir) {
  return `<script>
(function () {
  'use strict';

  /* Without a trailing slash, relative "houseScene.js" resolves to
     /elevations/houseScene.js (404) → FAILED TO LOAD SCENE. */
  var p = location.pathname || '';
  if (p.slice(-1) !== '/' && !/\\.html?$/i.test(p)) {
    location.replace(p + '/' + (location.search || '') + (location.hash || ''));
    return;
  }

  function bootFail(msg) {
    var ls = document.querySelector('#loading .ls');
    var bar = document.querySelector('#loading .bar');
    if (ls) ls.textContent = msg;
    if (bar) bar.style.display = 'none';
    console.error(msg);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(src); };
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  // Prefer relative paths; fall back to project-root absolute paths.
  var ver = '${versionDir}';
  // THREE + HouseScene are required. Loaders/perf are optional.
  var required = [
    ['../../lib/three.min.js', '/lib/three.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'],
    ['houseScene.js', '/elevations/' + ver + '/houseScene.js']
  ];
  var optional = [
    ['../../lib/GLTFLoader.js', '/lib/GLTFLoader.js'],
    ['../../lib/DRACOLoader.js', '/lib/DRACOLoader.js'],
    ['../../perf.js', '/perf.js']
  ];

  function loadOne(candidates, optional) {
    var i = 0;
    function next(err) {
      if (i >= candidates.length) {
        if (optional) return Promise.resolve(null);
        return Promise.reject(err || new Error('No candidates left'));
      }
      var src = candidates[i++];
      return loadScript(src).catch(function (e) { return next(e); });
    }
    return next();
  }

  function loadSeq(list, optional) {
    return list.reduce(function (p, cands) {
      return p.then(function () { return loadOne(cands, optional); });
    }, Promise.resolve());
  }

  // Load THREE first, then optional helpers, then HouseScene last.
  loadOne(required[0], false)
    .then(function () { return loadSeq(optional, true); })
    .then(function () { return loadOne(required[1], false); })
    .then(function () {
      if (!window.THREE) { bootFail('FAILED TO LOAD 3D ENGINE'); return; }
      if (!window.HouseScene) { bootFail('FAILED TO LOAD SCENE (HouseScene missing after houseScene.js)'); return; }
      try { bootApp(); }
      catch (err) { bootFail('BOOT ERROR: ' + (err && err.message ? err.message : err)); }
    })
    .catch(function (e) {
      bootFail('FAILED TO LOAD: ' + (e && e.message ? e.message : e));
    });

  function bootApp() {
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
    bootFail('SCENE BUILD FAILED: ' + (err && err.message ? err.message : err));
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
  } // end bootApp
})();
</script>`;
}

for (const v of versions) {
  const htmlPath = path.join('elevations', v, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Keep page chrome only — everything before the first runtime <script>
  const loadIdx = html.indexOf('id="loading"');
  let scriptAt = html.indexOf('<script', loadIdx >= 0 ? loadIdx : 0);
  if (scriptAt < 0) scriptAt = html.indexOf('<script');
  if (scriptAt < 0) {
    console.log('WARN no cut point', v);
    continue;
  }
  const head = html.slice(0, scriptAt).replace(/\s+$/, '');
  const newHtml = head + '\n\n' + bootScript(v) + '\n</body>\n</html>\n';

  fs.writeFileSync(htmlPath, newHtml);
  console.log('rewrote boot', v, 'bytes', newHtml.length);
}

// Also make houseScene paths dual-friendly: resolve relative to page if absolute fails
// Keep ../../models paths (page is always under elevations/version-x/ after slash fix)
console.log('done');
