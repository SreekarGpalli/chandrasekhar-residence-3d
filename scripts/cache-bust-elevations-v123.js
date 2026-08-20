const fs = require('fs');
const path = require('path');

const bust = 'stair-rail-20260812c';

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'index.html');
  let s = fs.readFileSync(f, 'utf8');

  s = s.replace(
    "['houseScene.js', '/elevations/' + ver + '/houseScene.js']",
    "['houseScene.js?v=" + bust + "', '/elevations/' + ver + '/houseScene.js?v=" + bust + "']"
  );

  if (!s.includes('__HOUSE3D_STAIR_RAIL__')) {
    s = s.replace(
      "if (!window.HouseScene) { bootFail('FAILED TO LOAD SCENE (HouseScene missing after houseScene.js)'); return; }",
      "if (!window.HouseScene) { bootFail('FAILED TO LOAD SCENE (HouseScene missing after houseScene.js)'); return; }\n" +
        "      var ls0 = document.querySelector('#loading .ls');\n" +
        "      if (ls0) ls0.textContent = (window.__HOUSE3D_STAIR_RAIL__\n" +
        "        ? ('SCENE OK · ' + window.__HOUSE3D_STAIR_RAIL__)\n" +
        "        : 'SCENE OK · (no rail stamp — old cache?)');"
    );
  }

  fs.writeFileSync(f, s);
  console.log(v, 'cache-bust', s.includes(bust), 'stamp-ui', s.includes('__HOUSE3D_STAIR_RAIL__'));
}
