const fs = require('fs');
const path = require('path');

// Original shared plane was c=6400; 250mm left (south) → c=6150
for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  s = s.split("{ c: 6200, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }").join(
    "{ c: 6150, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }"
  );
  s = s.split("{ c: 6200, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }").join(
    "{ c: 6150, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }"
  );
  // if already partially at 6400 somehow
  s = s.split("{ c: 6400, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }").join(
    "{ c: 6150, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }"
  );
  s = s.split("{ c: 6400, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }").join(
    "{ c: 6150, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }"
  );
  fs.writeFileSync(f, s);
  console.log(v, 'OK', s.includes("c: 6150, w: 1500"), s.includes("c: 6150, w: 900"));
}
