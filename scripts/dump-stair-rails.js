/**
 * Dump every railing / stairRailing / ms-bar near the external stair
 * by monkey-patching bag builders while loading houseScene.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Minimal THREE stub so build can run enough to collect pb calls
function makeTHREE() {
  const noop = () => {};
  class Object3D {
    constructor() {
      this.children = [];
      this.position = { set: noop, x: 0, y: 0, z: 0 };
      this.rotation = { set: noop, x: 0, y: 0, z: 0 };
      this.scale = { set: noop, x: 1, y: 1, z: 1 };
      this.visible = true;
      this.name = '';
    }
    add(c) { this.children.push(c); return this; }
    traverse(fn) { fn(this); this.children.forEach((c) => c.traverse && c.traverse(fn)); }
  }
  class Group extends Object3D {}
  class Mesh extends Object3D {
    constructor(geo, mat) {
      super();
      this.geometry = geo;
      this.material = mat;
    }
  }
  class BoxGeometry {
    constructor(w, h, d) {
      this.parameters = { width: w, height: h, depth: d };
    }
  }
  class MeshStandardMaterial {
    constructor(opts) {
      this.opts = opts || {};
      this.color = (opts && opts.color) || 0;
    }
  }
  class MeshBasicMaterial extends MeshStandardMaterial {}
  class MeshPhysicalMaterial extends MeshStandardMaterial {}
  class MeshLambertMaterial extends MeshStandardMaterial {}
  class MeshPhongMaterial extends MeshStandardMaterial {}
  class Color {
    constructor(c) { this.c = c; }
    set() { return this; }
    multiplyScalar() { return this; }
  }
  class Vector3 {
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy() { return this; }
  }
  class Euler {
    constructor() {}
    set() { return this; }
  }
  class Matrix4 {
    makeRotationFromEuler() { return this; }
  }
  return {
    Object3D, Group, Mesh, BoxGeometry,
    MeshStandardMaterial, MeshBasicMaterial, MeshPhysicalMaterial,
    MeshLambertMaterial, MeshPhongMaterial,
    Color, Vector3, Euler, Matrix4,
    DoubleSide: 2, FrontSide: 0, BackSide: 1,
    sRGBEncoding: 3001, ACESFilmicToneMapping: 4,
    PCFSoftShadowMap: 2, SRGBColorSpace: 'srgb'
  };
}

const file = process.argv[2] || 'elevations/version-one/houseScene.js';
const code = fs.readFileSync(file, 'utf8');

// Intercept bag.box by patching after HouseScene loads — easier: parse pb calls statically
const lines = code.split(/\n/);
const hits = [];
for (let i = 0; i < lines.length; i++) {
  const L = lines[i];
  if (/stairRailing\s*\(/.test(L) || /railing\s*\(/.test(L) || /pb\(\s*bag,\s*'ms'/.test(L) || /pb\(\s*\w+,\s*'ms'/.test(L) || /pb\(\s*\w+,\s*'steel'/.test(L)) {
    // only stair/void region interest: numbers in 14000-17000 or function context
    if (/14\d{3}|15\d{3}|16\d{3}|VOID_|towY|L\.f1|LAND_E|externalStair|1638|1629|1536|1547|145/.test(L) || /stairRailing|externalStairVoid|MS bar|walk-rail/.test(L)) {
      hits.push(String(i + 1).padStart(5) + ': ' + L.trim());
    }
  }
}
console.log('FILE', file);
console.log('stamp', /STAIR_RAIL_FIX/.test(code) ? code.match(/STAIR_RAIL_FIX\w+/)[0] : 'NONE');
console.log('--- rail-related lines near stair ---');
hits.forEach((h) => console.log(h));

// Also show if 16380 geometry exists anywhere
console.log('\nany 16380?', /16380/.test(code));
console.log('any 16420?', /16420/.test(code));
console.log('window stamp assign?', /__HOUSE3D_STAIR_RAIL__/.test(code));
