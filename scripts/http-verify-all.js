const http = require('http');
function get(u) {
  return new Promise((res, rej) => {
    http.get(u, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => res({ status: r.statusCode, cache: r.headers['cache-control'], body: d }));
    }).on('error', rej);
  });
}
(async () => {
  const urls = [
    'http://localhost:8080/houseScene.js?v=STAIR_RAIL_FIX_20260812d',
    'http://localhost:8080/elevations/version-one/houseScene.js?v=STAIR_RAIL_FIX_20260812d',
    'http://localhost:8080/index.html',
    'http://localhost:8080/elevations/version-one/'
  ];
  for (const u of urls) {
    const r = await get(u);
    const ext = /pb\(bag,\s*'(ms|bronze)',\s*1638/.test(r.body);
    const stamp = r.body.includes('STAIR_RAIL_FIX_20260812d');
    console.log(u.replace('http://localhost:8080', ''));
    console.log('  status', r.status, 'stamp', stamp, 'extMS', ext, 'cache', r.cache || '-');
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
