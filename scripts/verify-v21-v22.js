const http = require('http');

function get(u) {
  return new Promise((res, rej) => {
    http
      .get(u, (r) => {
        const chunks = [];
        r.on('data', (c) => chunks.push(c));
        r.on('end', () =>
          res({
            status: r.statusCode,
            loc: r.headers.location,
            body: Buffer.concat(chunks).toString('utf8'),
            len: Buffer.concat(chunks).length
          })
        );
      })
      .on('error', rej);
  });
}

(async () => {
  const keep = [
    ['v1', 'http://localhost:8080/elevations/version-one/', ['VERSION ONE', '../version-six/', '../version-nineteen/']],
    ['v6', 'http://localhost:8080/elevations/version-six/', ['VERSION SIX', '../version-one/']],
    ['v14', 'http://localhost:8080/elevations/version-fourteen/', ['VERSION FOURTEEN']],
    ['v16', 'http://localhost:8080/elevations/version-sixteen/', ['VERSION SIXTEEN']],
    ['v17', 'http://localhost:8080/elevations/version-seventeen/', ['VERSION SEVENTEEN']],
    ['v19', 'http://localhost:8080/elevations/version-nineteen/', ['VERSION NINETEEN', 'SSGI', 'houseScene.js']],
    ['v21', 'http://localhost:8080/elevations/version-twenty-one/', ['VERSION TWENTY-ONE', 'SSGI', 'houseScene.js']],
    ['v22', 'http://localhost:8080/elevations/version-twenty-two/', ['VERSION TWENTY-TWO', 'SSGI', 'houseScene.js']],
    ['hub', 'http://localhost:8080/elevations/', ['VERSION NINETEEN', 'VERSION TWENTY-ONE', 'version-one/']]
  ];
  const forbidden = ['V19 · STUDY', 'V19 · PHOTOREAL', 'study.html', 'real.html', 'version-two/', 'version-five/', 'version-twenty/', 'seventeen-real'];
  let fail = 0;
  for (const [name, url, needles] of keep) {
    const r = await get(url);
    const miss = needles.filter((n) => !r.body.includes(n));
    const leak = forbidden.filter((n) => r.body.includes(n));
    const ok = r.status === 200 && miss.length === 0 && leak.length === 0;
    if (!ok) fail++;
    console.log(
      (ok ? 'OK  ' : 'FAIL') +
        '  ' +
        name +
        '  status=' +
        r.status +
        (miss.length ? '  missing=' + miss.join('|') : '') +
        (leak.length ? '  leak=' + leak.join('|') : '')
    );
  }

  const gone = [
    'http://localhost:8080/elevations/version-two/',
    'http://localhost:8080/elevations/version-five/',
    'http://localhost:8080/elevations/version-twenty/',
    'http://localhost:8080/elevations/version-seventeen-real/',
    'http://localhost:8080/elevations/version-nineteen/real.html',
    'http://localhost:8080/elevations/version-twenty-one/study.html',
    'http://localhost:8080/elevations/version-twenty-two/study.html'
  ];
  for (const url of gone) {
    const r = await get(url);
    const ok = r.status === 404;
    if (!ok) fail++;
    console.log((ok ? 'OK  ' : 'FAIL') + '  gone  ' + url.replace('http://localhost:8080', '') + '  status=' + r.status);
  }
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
