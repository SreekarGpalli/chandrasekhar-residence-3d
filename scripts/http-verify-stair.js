const http = require('http');

function get(u) {
  return new Promise((res, rej) => {
    http.get(u, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => res({ status: r.statusCode, headers: r.headers, body: d }));
    }).on('error', rej);
  });
}

(async () => {
  const a = await get('http://localhost:8080/elevations/version-one/houseScene.js?v=stair-rail-20260812c');
  console.log('status', a.status);
  console.log('cache', a.headers['cache-control']);
  console.log('stamp', a.body.includes('STAIR_RAIL_FIX_20260812c'));
  console.log('extMS', /pb\(bag,\s*'ms',\s*16380/.test(a.body));
  console.log('spine', a.body.includes("stairRailing(bag, 'y', 15470"));
  console.log('f2east', a.body.includes("stairRailing(bag, 'y', 15360"));
  const b = await get('http://localhost:8080/elevations/version-one/');
  console.log('html bust', b.body.includes('stair-rail-20260812c'));
  console.log('html stamp ui', b.body.includes('__HOUSE3D_STAIR_RAIL__'));
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
