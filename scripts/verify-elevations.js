/**
 * Smoke-test elevation pages + exterior-only scene builds.
 * Expects serve.js on localhost:8080 (or starts nothing — uses files for build).
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.ELEV_BASE || 'http://localhost:8080';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks)
          });
        });
      })
      .on('error', reject);
  });
}

function makeSandbox() {
  const sandbox = {
    console,
    performance: { now: () => Date.now() },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URL,
    Blob,
    ArrayBuffer,
    Float32Array,
    Float64Array,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    DataView,
    Promise,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Math,
    JSON,
    Date,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    isFinite,
    isNaN,
    parseInt,
    parseFloat,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
    Infinity,
    NaN,
    undefined,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    navigator: { userAgent: 'node-verify-elevations' },
    location: { protocol: 'http:', href: BASE + '/', hostname: 'localhost' },
    document: {
      createElement: () => ({
        style: {},
        appendChild() {},
        remove() {},
        setAttribute() {},
        addEventListener() {}
      }),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { appendChild() {}, removeChild() {} },
      head: { appendChild() {} },
      addEventListener() {},
      removeEventListener() {}
    },
    Image: class {},
    XMLHttpRequest: class {
      open() {}
      send() {
        this.status = 0;
        if (this.onerror) this.onerror();
      }
      setRequestHeader() {}
      addEventListener() {}
      removeEventListener() {}
    },
    requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 0),
    cancelAnimationFrame: clearTimeout
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.global = sandbox;
  return sandbox;
}

function loadScript(ctx, filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(code, ctx, { filename: path.basename(filePath) });
}

function buildScene(houseScenePath) {
  const sandbox = makeSandbox();
  const ctx = vm.createContext(sandbox);
  loadScript(ctx, path.join(ROOT, 'lib', 'three.min.js'));
  const THREE = ctx.THREE || ctx.window.THREE;
  if (!THREE) throw new Error('THREE failed to load');
  ctx.THREE = THREE;
  ctx.window.THREE = THREE;

  // Optional loaders (car path) — ignore failures in node
  try {
    loadScript(ctx, path.join(ROOT, 'lib', 'GLTFLoader.js'));
  } catch (_) {}
  try {
    loadScript(ctx, path.join(ROOT, 'lib', 'DRACOLoader.js'));
  } catch (_) {}

  loadScript(ctx, houseScenePath);
  if (!ctx.window.HouseScene || typeof ctx.window.HouseScene.build !== 'function') {
    throw new Error('HouseScene.build missing in ' + houseScenePath);
  }

  const t0 = Date.now();
  const data = ctx.window.HouseScene.build(THREE);
  const ms = Date.now() - t0;

  let meshCount = 0;
  data.root.traverse((o) => {
    if (o.isMesh) meshCount++;
  });

  return {
    ms,
    meshCount,
    names: data.root.children.map((c) => c.name),
    floors: data.floors.length,
    outdoors: data.outdoors.length,
    views: Object.keys(data.views || {}),
    hasExterior: !!data.exterior,
    hasSite: !!data.site,
    lights: (data.lights || []).length,
    data
  };
}

async function checkUrl(url, expectType) {
  const res = await httpGet(url);
  if (res.status !== 200) {
    throw new Error(url + ' returned ' + res.status);
  }
  if (expectType) {
    const ct = (res.headers['content-type'] || '').toLowerCase();
    if (!ct.includes(expectType)) {
      throw new Error(url + ' content-type ' + ct + ' expected ' + expectType);
    }
  }
  return res;
}

async function checkHtmlScripts(pagePath) {
  const pageUrl = BASE + pagePath;
  const res = await checkUrl(pageUrl, 'text/html');
  const html = res.body.toString('utf8');
  const isViewer = /version-(one|two|three|four|five)/.test(pagePath);

  // Version viewers must load the engine + scene; hub page is links only
  if (isViewer) {
    if (!html.includes('houseScene.js')) {
      throw new Error(pagePath + ' missing houseScene.js script tag');
    }
    if (!html.includes('three.min.js') && !html.includes('three.js')) {
      throw new Error(pagePath + ' missing three.js script tag');
    }
  }

  const scripts = [];
  const re = /src=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html))) scripts.push(m[1]);

  for (const src of scripts) {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      // CDN fallbacks — skip live check
      continue;
    }
    const abs = new URL(src, pageUrl).href;
    const r = await httpGet(abs);
    if (r.status !== 200) {
      throw new Error(pagePath + ' script ' + src + ' -> ' + r.status + ' (' + abs + ')');
    }
  }

  // Links between versions / hub
  const links = [];
  const reA = /href=["']([^"']+)["']/g;
  while ((m = reA.exec(html))) links.push(m[1]);
  for (const href of links) {
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) continue;
    const abs = new URL(href, pageUrl).href;
    if (!abs.startsWith(BASE)) continue;
    const r = await httpGet(abs);
    if (r.status !== 200) {
      throw new Error(pagePath + ' link ' + href + ' -> ' + r.status + ' (' + abs + ')');
    }
  }

  return { scripts, links };
}

(async () => {
  const errors = [];
  const log = (...a) => console.log(...a);

  log('=== HTTP page + asset checks ===');
  // Final pages (must be 200 HTML)
  const pages = [
    '/',
    '/elevations/',
    '/elevations/version-one/',
    '/elevations/version-six/',
    '/elevations/version-fourteen/',
    '/elevations/version-sixteen/',
    '/elevations/version-seventeen/',
    '/elevations/version-nineteen/',
    '/elevations/version-twenty-one/',
    '/elevations/version-twenty-two/'
  ];
  for (const p of pages) {
    try {
      await checkUrl(BASE + p, 'text/html');
      log('OK 200', p);
    } catch (e) {
      errors.push(String(e.message || e));
      log('FAIL', p, e.message || e);
    }
  }
  // Directory URLs without slash must 301 → trailing slash (relative assets)
  const redirects = [
    '/elevations',
    '/elevations/version-one',
    '/elevations/version-nineteen',
    '/elevations/version-twenty-one',
    '/elevations/version-twenty-two'
  ];
  for (const p of redirects) {
    try {
      const res = await httpGet(BASE + p);
      if (res.status !== 301 && res.status !== 302 && res.status !== 308) {
        throw new Error('expected redirect, got ' + res.status);
      }
      const loc = res.headers.location || '';
      if (!loc.endsWith('/') && !loc.includes(p + '/')) {
        throw new Error('redirect location missing trailing slash: ' + loc);
      }
      log('OK', res.status, p, '→', loc);
    } catch (e) {
      errors.push(String(e.message || e));
      log('FAIL redirect', p, e.message || e);
    }
  }

  const assets = [
    ['/lib/three.min.js', 'javascript'],
    ['/lib/GLTFLoader.js', 'javascript'],
    ['/lib/DRACOLoader.js', 'javascript'],
    ['/lib/draco/draco_decoder.js', 'javascript'],
    ['/lib/draco/draco_wasm_wrapper.js', 'javascript'],
    ['/lib/draco/draco_decoder.wasm', 'wasm'],
    ['/perf.js', 'javascript'],
    ['/houseScene.js', 'javascript'],
    ['/models/car.glb', 'model'],
    ['/elevations/version-one/houseScene.js', 'javascript'],
    ['/elevations/version-six/houseScene.js', 'javascript'],
    ['/elevations/version-fourteen/houseScene.js', 'javascript'],
    ['/elevations/version-sixteen/houseScene.js', 'javascript'],
    ['/elevations/version-seventeen/houseScene.js', 'javascript'],
    ['/elevations/version-nineteen/houseScene.js', 'javascript'],
    ['/elevations/version-twenty-one/houseScene.js', 'javascript'],
    ['/elevations/version-twenty-two/houseScene.js', 'javascript']
  ];
  for (const [p, kind] of assets) {
    try {
      await checkUrl(BASE + p, kind);
      log('OK 200', p);
    } catch (e) {
      errors.push(String(e.message || e));
      log('FAIL', p, e.message || e);
    }
  }

  log('\n=== HTML script/link resolution ===');
  for (const p of [
    '/elevations/',
    '/elevations/version-one/',
    '/elevations/version-nineteen/',
    '/elevations/version-twenty-one/',
    '/elevations/version-twenty-two/'
  ]) {
    try {
      const info = await checkHtmlScripts(p);
      log('OK scripts+links', p, '→', info.scripts.length, 'scripts,', info.links.length, 'links');
    } catch (e) {
      errors.push(String(e.message || e));
      log('FAIL', p, e.message || e);
    }
  }

  log('\n=== Scene build (exterior-only) ===');
  const versions = [
    'version-one',
    'version-six',
    'version-fourteen',
    'version-sixteen',
    'version-seventeen',
    'version-nineteen',
    'version-twenty-one',
    'version-twenty-two'
  ];
  for (const ver of versions) {
    try {
      const r = buildScene(path.join(ROOT, 'elevations', ver, 'houseScene.js'));
      log(
        'OK build',
        ver,
        r.ms + 'ms',
        'meshes=' + r.meshCount,
        'children=' + r.names.join(','),
        'floors=' + r.floors,
        'views=' + r.views.join('+')
      );
      if (!r.hasExterior) throw new Error('missing exterior group');
      if (!r.hasSite) throw new Error('missing site group');
      if (r.floors !== 0) throw new Error('floors should be empty, got ' + r.floors);
      if (r.outdoors < 3) throw new Error('expected 3 outdoor amenity groups, got ' + r.outdoors);
      for (const v of ['exterior', 'east', 'north', 'south', 'west']) {
        if (!r.views.includes(v)) throw new Error('missing view ' + v);
      }
      if (r.meshCount < 20) throw new Error('suspiciously few meshes: ' + r.meshCount);

      // Interior leaks
      const sceneText = fs.readFileSync(
        path.join(ROOT, 'elevations', ver, 'houseScene.js'),
        'utf8'
      );
      for (const bad of ['const ROOMS', 'const IW =', 'function curtains', 'Fur.bed(']) {
        if (sceneText.includes(bad)) throw new Error('interior leftover: ' + bad);
      }
    } catch (e) {
      errors.push(ver + ': ' + (e.stack || e.message || e));
      log('FAIL build', ver, e.message || e);
    }
  }

  log('\n=== Main house still builds ===');
  try {
    const main = buildScene(path.join(ROOT, 'houseScene.js'));
    log(
      'OK main',
      main.ms + 'ms',
      'meshes=' + main.meshCount,
      'floors=' + main.floors,
      'outdoors=' + main.outdoors
    );
    if (main.floors !== 3) throw new Error('main house should have 3 dollhouse floors');
  } catch (e) {
    errors.push('main: ' + (e.message || e));
    log('FAIL main', e.message || e);
  }

  // Index.html inline app: ensure it calls HouseScene.build and view buttons exist
  log('\n=== Viewer app structure ===');
  for (const ver of versions) {
    const html = fs.readFileSync(
      path.join(ROOT, 'elevations', ver, 'index.html'),
      'utf8'
    );
    const need = [
      'HouseScene.build',
      'data-view="exterior"',
      'data-view="east"',
      'data-view="north"',
      'data-view="south"',
      'data-view="west"',
      '/lib/three.min.js',
      '/perf.js',
      '/elevations/' + ver + '/houseScene.js'
    ];
    for (const n of need) {
      if (!html.includes(n)) {
        errors.push(ver + ' index missing: ' + n);
        log('FAIL', ver, 'missing', n);
      }
    }
    // Broken relative lib path (no leading /) would 404 from wrong base URL
    if (html.includes('src="lib/three.min.js"') || html.includes("src='lib/three.min.js'")) {
      errors.push(ver + ' index uses unsafe relative lib path');
    }
    log('OK viewer structure', ver);
  }

  if (errors.length) {
    console.error('\n' + errors.length + ' FAILURE(S):');
    errors.forEach((e) => console.error(' -', e));
    process.exit(1);
  }
  console.log('\nALL CHECKS PASSED — elevations open and build correctly.');
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
