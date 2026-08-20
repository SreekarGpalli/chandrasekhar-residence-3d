const fs = require('fs');
for (const v of ['version-one', 'version-two', 'version-three']) {
  const s = fs.readFileSync('elevations/' + v + '/houseScene.js', 'utf8');
  console.log('===', v, '===');
  console.log(' stamp', /STAIR_RAIL_FIX_20260812c/.test(s));
  console.log(' extMS16380', /pb\(bag,\s*'ms',\s*16380/.test(s));
  console.log(' spine15470', /stairRailing\(bag,\s*'y',\s*15470/.test(s));
  console.log(' east16290', /stairRailing\(bag,\s*'y',\s*16290/.test(s));
  console.log(' f2e15360', /stairRailing\(bag,\s*'y',\s*15360/.test(s));
  const a = s.indexOf('function externalStairVoidRails');
  console.log(s.slice(a, a + 700));
  console.log('---');
}
