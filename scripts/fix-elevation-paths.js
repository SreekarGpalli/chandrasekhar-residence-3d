/**
 * Fix elevation viewers so scripts load without root-absolute paths.
 * Absolute "/lib/..." and "/elevations/.../houseScene.js" fail when:
 *  - opening index.html via file://
 *  - serving from a non-project root
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

for (const v of versions) {
  const dir = path.join('elevations', v);
  const htmlPath = path.join(dir, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  html = html
    .replace(/src="\/lib\/three\.min\.js"/g, 'src="../../lib/three.min.js"')
    .replace(/src="\/lib\/GLTFLoader\.js"/g, 'src="../../lib/GLTFLoader.js"')
    .replace(/src="\/lib\/DRACOLoader\.js"/g, 'src="../../lib/DRACOLoader.js"')
    .replace(/src="\/perf\.js"/g, 'src="../../perf.js"')
    .replace(
      new RegExp('src="/elevations/' + v + '/houseScene\\.js"'),
      'src="houseScene.js"'
    )
    .replace(/href="\/elevations\/version-one\/"/g, 'href="../version-one/"')
    .replace(/href="\/elevations\/version-two\/"/g, 'href="../version-two/"')
    .replace(/href="\/elevations\/version-three\/"/g, 'href="../version-three/"')
    .replace(/href="\/elevations\/version-four\/"/g, 'href="../version-four/"')
    .replace(/href="\/elevations\/version-five\/"/g, 'href="../version-five/"')
    .replace(/href="\/elevations\/version-six\/"/g, 'href="../version-six/"')
    .replace(/href="\/elevations\/version-seven\/"/g, 'href="../version-seven/"')
    .replace(/href="\/elevations\/version-eight\/"/g, 'href="../version-eight/"')
    .replace(/href="\/elevations\/version-nine\/"/g, 'href="../version-nine/"')
    .replace(/href="\/elevations\/version-ten\/"/g, 'href="../version-ten/"')
    .replace(/href="\/elevations\/version-eleven\/"/g, 'href="../version-eleven/"')
    .replace(/href="\/elevations\/version-twelve\/"/g, 'href="../version-twelve/"')
    .replace(/href="\/elevations\/version-thirteen\/"/g, 'href="../version-thirteen/"')
    .replace(/href="\/elevations\/version-fourteen\/"/g, 'href="../version-fourteen/"')
    .replace(/href="\/elevations\/version-fifteen\/"/g, 'href="../version-fifteen/"')
    .replace(/href="\/elevations\/version-sixteen\/"/g, 'href="../version-sixteen/"')
    .replace(/href="\/"/g, 'href="../../index.html"');

  html = html.replace(
    "if (!window.HouseScene) { bootFail('FAILED TO LOAD SCENE'); return; }",
    "if (!window.HouseScene) { bootFail('FAILED TO LOAD SCENE — run: node serve.js  then open /elevations/" +
      v +
      "/'); return; }"
  );

  fs.writeFileSync(htmlPath, html);

  const scenePath = path.join(dir, 'houseScene.js');
  if (fs.existsSync(scenePath)) {
    let scene = fs.readFileSync(scenePath, 'utf8');
    scene = scene
      .replace(
        "const CAR_MODEL_URL = '/models/car.glb';",
        "const CAR_MODEL_URL = '../../models/car.glb';"
      )
      .replace(
        "draco.setDecoderPath('/lib/draco/');",
        "draco.setDecoderPath('../../lib/draco/');"
      );
    fs.writeFileSync(scenePath, scene);
  }
  console.log('fixed', v);
}

// Hub
const hub = path.join('elevations', 'index.html');
let h = fs.readFileSync(hub, 'utf8');
h = h
  .replace(/href="\/elevations\/version-one\/"/g, 'href="version-one/"')
  .replace(/href="\/elevations\/version-two\/"/g, 'href="version-two/"')
  .replace(/href="\/elevations\/version-three\/"/g, 'href="version-three/"')
  .replace(/href="\/elevations\/version-four\/"/g, 'href="version-four/"')
  .replace(/href="\/elevations\/version-five\/"/g, 'href="version-five/"')
  .replace(/href="\/elevations\/version-six\/"/g, 'href="version-six/"')
  .replace(/href="\/elevations\/version-seven\/"/g, 'href="version-seven/"')
  .replace(/href="\/elevations\/version-eight\/"/g, 'href="version-eight/"')
  .replace(/href="\/elevations\/version-nine\/"/g, 'href="version-nine/"')
  .replace(/href="\/elevations\/version-ten\/"/g, 'href="version-ten/"')
  .replace(/href="\/elevations\/version-eleven\/"/g, 'href="version-eleven/"')
  .replace(/href="\/elevations\/version-twelve\/"/g, 'href="version-twelve/"')
  .replace(/href="\/elevations\/version-thirteen\/"/g, 'href="version-thirteen/"')
  .replace(/href="\/elevations\/version-fourteen\/"/g, 'href="version-fourteen/"')
  .replace(/href="\/elevations\/version-fifteen\/"/g, 'href="version-fifteen/"')
  .replace(/href="\/elevations\/version-sixteen\/"/g, 'href="version-sixteen/"')
  .replace(/href="\/"/g, 'href="../index.html"');
fs.writeFileSync(hub, h);
console.log('hub fixed');
