const http = require('http');

function get(u) {
  return new Promise((res, rej) => {
    http
      .get(u, (r) => {
        const chunks = [];
        r.on('data', (c) => chunks.push(c));
        r.on('end', () =>
          res({ s: r.statusCode, b: Buffer.concat(chunks).toString('utf8') })
        );
      })
      .on('error', rej);
  });
}

(async () => {
  const base = 'http://localhost:8080/elevations/version-one/';
  const html = (await get(base)).b;
  const scripts = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  console.log('scripts:', scripts);
  for (const src of scripts) {
    if (/^https?:/i.test(src)) continue;
    const abs = new URL(src, base).href;
    const r = await get(abs);
    const ok =
      r.s === 200 &&
      (r.b.includes('HouseScene') ||
        r.b.includes('THREE') ||
        r.b.includes('Perf') ||
        r.b.includes('GLTFLoader') ||
        r.b.includes('DRACOLoader'));
    console.log(r.s, ok ? 'OK' : 'BAD', src, '->', abs);
    if (r.s !== 200) process.exitCode = 1;
  }
  // parse houseScene
  const scene = await get(base + 'houseScene.js');
  if (!scene.b.includes('window.HouseScene')) {
    console.error('houseScene missing HouseScene export');
    process.exitCode = 1;
  } else console.log('HouseScene export present');
})().catch((e) => {
  console.error(e.message);
  console.error('Is serve.js running? node serve.js');
  process.exit(1);
});
