const http = require('http');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function get(u) {
  return new Promise((res, rej) => {
    http
      .get(u, (r) => {
        const c = [];
        r.on('data', (d) => c.push(d));
        r.on('end', () =>
          res({ status: r.statusCode, headers: r.headers, body: Buffer.concat(c) })
        );
      })
      .on('error', rej);
  });
}

(async () => {
  const base = process.env.BASE || 'http://localhost:8080';
  console.log('Base', base);

  const paths = [
    '/elevations/version-one/',
    '/elevations/version-one/index.html',
    '/elevations/version-one/houseScene.js',
    '/lib/three.min.js',
    '/perf.js',
    '/lib/GLTFLoader.js',
    '/lib/DRACOLoader.js'
  ];
  for (const p of paths) {
    try {
      const r = await get(base + p);
      console.log(r.status, p, 'len=' + r.body.length, r.headers['content-type'] || '');
      if (r.status !== 200) console.log('  BODY', r.body.toString('utf8').slice(0, 180));
    } catch (e) {
      console.log('ERR', p, e.message);
    }
  }

  const html = (await get(base + '/elevations/version-one/')).body.toString('utf8');
  const scripts = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  console.log('\nScript tags:');
  for (const src of scripts) {
    if (/^https?:/i.test(src)) {
      console.log('  CDN skip', src);
      continue;
    }
    const abs = new URL(src, base + '/elevations/version-one/').href;
    try {
      const r = await get(abs);
      console.log(' ', r.status, src, '->', abs, 'len=' + r.body.length);
      if (r.status !== 200) console.log('   ', r.body.toString('utf8').slice(0, 120));
    } catch (e) {
      console.log('  ERR', src, e.message);
    }
  }

  // Parse/load like browser
  const threeCode = (await get(base + '/lib/three.min.js')).body.toString('utf8');
  const sceneCode = (await get(base + '/elevations/version-one/houseScene.js')).body.toString(
    'utf8'
  );
  const perfCode = (await get(base + '/perf.js')).body.toString('utf8');

  const sb = {
    console,
    performance: { now: () => Date.now() },
    setTimeout,
    clearTimeout,
    location: { protocol: 'http:', href: base + '/elevations/version-one/' },
    document: {
      createElement: () => ({ style: {}, appendChild() {}, remove() {}, setAttribute() {} }),
      getElementById: () => null,
      querySelector: () => null,
      body: { appendChild() {} },
      head: { appendChild() {} },
      addEventListener() {}
    },
    navigator: { userAgent: 'diag' },
    window: null,
    self: null,
    globalThis: null
  };
  sb.window = sb;
  sb.self = sb;
  sb.globalThis = sb;
  const ctx = vm.createContext(sb);

  try {
    vm.runInContext(threeCode, ctx, { filename: 'three.min.js' });
    console.log('\nTHREE loaded', !!(ctx.THREE || ctx.window.THREE));
  } catch (e) {
    console.log('\nTHREE FAIL', e.message);
  }
  try {
    vm.runInContext(perfCode, ctx, { filename: 'perf.js' });
    console.log('Perf loaded', !!ctx.window.Perf);
  } catch (e) {
    console.log('Perf FAIL', e.message);
  }
  try {
    vm.runInContext(sceneCode, ctx, { filename: 'houseScene.js' });
    console.log(
      'HouseScene loaded',
      !!ctx.window.HouseScene,
      typeof (ctx.window.HouseScene && ctx.window.HouseScene.build)
    );
  } catch (e) {
    console.log('HouseScene FAIL', e.message);
    console.log(e.stack.split('\n').slice(0, 8).join('\n'));
  }

  if (ctx.window.HouseScene && (ctx.THREE || ctx.window.THREE)) {
    const THREE = ctx.THREE || ctx.window.THREE;
    try {
      const data = ctx.window.HouseScene.build(THREE);
      console.log(
        'BUILD OK children=',
        data.root.children.map((c) => c.name).join(',')
      );
    } catch (e) {
      console.log('BUILD FAIL', e.message);
      console.log(e.stack.split('\n').slice(0, 15).join('\n'));
    }
  }

  // Local file syntax check for all versions
  console.log('\nLocal syntax checks:');
  for (const v of [
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
  ]) {
    const p = path.join('elevations', v, 'houseScene.js');
    try {
      new vm.Script(fs.readFileSync(p, 'utf8'), { filename: p });
      console.log('  OK syntax', v);
    } catch (e) {
      console.log('  SYNTAX ERR', v, e.message);
    }
  }
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
