/**
 * V1–V3: move door-adjacent east windows slightly south (left on east elevation).
 * Shared plane: c=6400 → c=6200 (~200mm).
 */
const fs = require('fs');
const path = require('path');

for (const v of ['version-one', 'version-two', 'version-three']) {
  const f = path.join('elevations', v, 'houseScene.js');
  let s = fs.readFileSync(f, 'utf8');
  const before = s;

  // Only the three door-adjacent openings that share the vertical plane
  s = s.replace(
    "{ c: 6400, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // office window (closer to door)",
    "{ c: 6200, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // office window (slightly left of door)"
  );
  s = s.replace(
    "{ c: 6400, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // aligned with GF east window",
    "{ c: 6200, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // aligned with GF (slightly left of door)"
  );
  s = s.replace(
    "{ c: 6400, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // square fixed, aligned with GF/SF plane",
    "{ c: 6200, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // square fixed (slightly left, aligned)"
  );

  // Fallbacks if comments differ
  if (s === before || !s.includes("{ c: 6200, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }")) {
    s = s.replace(
      /\{ c: 6400, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 \},[^\n]*/g,
      "{ c: 6200, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // door-adjacent window (slightly left)"
    );
  }
  if (!s.includes("{ c: 6200, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }")) {
    s = s.replace(
      /\{ c: 6400, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 \},[^\n]*/,
      "{ c: 6200, w: 900, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // square fixed (slightly left, aligned)"
    );
  }

  if (s === before) console.log(v, 'NO CHANGE');
  else {
    fs.writeFileSync(f, s);
    console.log(v, 'OK');
  }
}

const t = fs.readFileSync('elevations/version-one/houseScene.js', 'utf8');
for (const fl of ['f0', 'f1', 'f2']) {
  const m = t.match(new RegExp(fl + ': \\{\\s*E: \\[([\\s\\S]*?)\\],\\s*N:'));
  console.log(fl, m[1].replace(/\s+/g, ' ').trim());
}
