/**
 * Intercept plan boxes near the external stair during build.
 */
const fs = require('fs');
const vm = require('vm');

const file = process.argv[2] || 'elevations/version-one/houseScene.js';
let code = fs.readFileSync(file, 'utf8');

// Inject recorder right after pb function definition
const inject = `
  window.__STAIR_PB__ = [];
  var __pb_orig = pb;
  pb = function(bag, mat, x0, x1, y0, y1, h0, h1, rx, ry, rz) {
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    if (mx >= 14000 && mx <= 17500 && my >= -200 && my <= 4500 && h1 > 0.5) {
      if (mat === 'ms' || mat === 'steel' || mat === 'chrome' || mat === 'bronze' || mat === 'white') {
        window.__STAIR_PB__.push({
          mat: mat,
          x0: Math.round(x0), x1: Math.round(x1),
          y0: Math.round(y0), y1: Math.round(y1),
          h0: +h0.toFixed(3), h1: +h1.toFixed(3),
          mx: Math.round(mx), my: Math.round(my)
        });
      }
    }
    return __pb_orig(bag, mat, x0, x1, y0, y1, h0, h1, rx, ry, rz);
  };
`;

// Insert after "function pb(bag, mat, x0, x1, y0, y1, h0, h1, rx, ry, rz) { ... }"
const marker = 'function pb(bag, mat, x0, x1, y0, y1, h0, h1, rx, ry, rz) {';
const idx = code.indexOf(marker);
if (idx < 0) {
  console.error('pb not found');
  process.exit(1);
}
// find end of pb function - next function at same indent
const after = code.indexOf('\n  function wallRun', idx);
if (after < 0) {
  console.error('wallRun not found');
  process.exit(1);
}
code = code.slice(0, after) + '\n' + inject + code.slice(after);

function makeTHREE() {
  class Object3D {
    constructor() {
      this.children = [];
      this.position = { x: 0, y: 0, z: 0, set() { return this; } };
      this.rotation = { set() { return this; } };
      this.scale = { set() { return this; } };
      this.visible = true;
      this.name = '';
      this.castShadow = false;
      this.receiveShadow = false;
      this.userData = {};
    }
    add(c) { this.children.push(c); return this; }
    traverse(fn) { fn(this); this.children.forEach((c) => c.traverse && c.traverse(fn)); }
  }
  class Group extends Object3D {}
  class Mesh extends Object3D {
    constructor(g, m) { super(); this.geometry = g; this.material = m; }
  }
  class Geom {
    constructor() {
      this.attributes = {
        position: { count: 8, array: new Float32Array(24) },
        normal: { count: 8, array: new Float32Array(24) }
      };
      this.index = { count: 36, getX: (i) => i % 8 };
    }
    dispose() {}
    computeBoundingSphere() {}
    computeBoundingBox() {}
    setAttribute() { return this; }
    setIndex() { return this; }
    applyMatrix4() { return this; }
    clone() { return new Geom(); }
    scale() { return this; }
  }
  class BoxGeometry extends Geom {
    constructor() {
      super();
      // 8 verts cube
      this.attributes.position = {
        count: 8,
        array: new Float32Array([
          -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
          -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5
        ])
      };
      this.attributes.normal = {
        count: 8,
        array: new Float32Array([
          0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
          0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1
        ])
      };
      this.index = null; // non-indexed path
    }
  }
  class CylGeometry extends BoxGeometry {}
  class SphereGeometry extends BoxGeometry {}
  class ConeGeometry extends BoxGeometry {}
  class IcosahedronGeometry extends BoxGeometry {
    constructor(r, d) { super(); this._low = d === 0; }
  }
  class Material {
    constructor(o) { Object.assign(this, o || {}); }
  }
  class Color {
    constructor(c) { this.c = c; }
    set() { return this; }
    multiplyScalar() { return this; }
  }
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    fromBufferAttribute(attr, i) {
      this.x = attr.array[i * 3]; this.y = attr.array[i * 3 + 1]; this.z = attr.array[i * 3 + 2];
      return this;
    }
    applyMatrix4() { return this; }
    applyMatrix3() { return this; }
    normalize() { return this; }
    length() { return Math.hypot(this.x, this.y, this.z); }
  }
  class Euler {
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  }
  class Quaternion {
    setFromEuler() { return this; }
  }
  class Matrix3 {
    getNormalMatrix() { return this; }
  }
  class Matrix4 {
    constructor() { this.elements = new Float32Array(16); }
    compose() { return this; }
    multiplyMatrices() { return this; }
    copy() { return this; }
  }
  class BufferGeometry extends Geom {}
  class BufferAttribute {
    constructor(arr, n) { this.array = arr; this.n = n; this.count = arr.length / n; }
  }
  class Float32BufferAttribute extends BufferAttribute {}

  return {
    Object3D, Group, Mesh,
    BoxGeometry, CylinderGeometry: CylGeometry, SphereGeometry, ConeGeometry,
    IcosahedronGeometry,
    MeshStandardMaterial: Material, MeshBasicMaterial: Material,
    MeshPhysicalMaterial: Material, MeshLambertMaterial: Material, MeshPhongMaterial: Material,
    Color, Vector3, Euler, Quaternion, Matrix3, Matrix4,
    BufferGeometry, BufferAttribute, Float32BufferAttribute,
    DoubleSide: 2, FrontSide: 0, BackSide: 1,
    sRGBEncoding: 3001, ACESFilmicToneMapping: 4, PCFSoftShadowMap: 2,
    SRGBColorSpace: 'srgb', RepeatWrapping: 1000, ClampToEdgeWrapping: 1001,
    AdditiveBlending: 2, NormalBlending: 1
  };
}

const THREE = makeTHREE();
const sandbox = {
  window: { THREE },
  console,
  Math,
  Date,
  parseInt,
  parseFloat,
  isNaN,
  Infinity,
  JSON,
  Float32Array,
  Uint16Array,
  Uint32Array
};
vm.runInNewContext(code, sandbox);
const HS = sandbox.window.HouseScene;
try {
  HS.build(THREE);
} catch (e) {
  console.error('BUILD', e.message);
  // still print what we got
}

const rows = sandbox.window.__STAIR_PB__ || [];
console.log('FILE', file);
console.log('stamp', sandbox.window.__HOUSE3D_STAIR_RAIL__ || 'none');
console.log('recorded', rows.length);

// Focus metal rails
const metal = rows.filter((r) => r.mat === 'ms' || r.mat === 'steel' || r.mat === 'chrome' || r.mat === 'bronze');
console.log('\n=== METAL near stair ===');
// group by approximate X center
const groups = {};
for (const r of metal) {
  const k = Math.round(r.mx / 20) * 20;
  if (!groups[k]) groups[k] = [];
  groups[k].push(r);
}
const keys = Object.keys(groups).map(Number).sort((a, b) => a - b);
for (const k of keys) {
  const g = groups[k];
  const y0 = Math.min(...g.map((r) => r.y0));
  const y1 = Math.max(...g.map((r) => r.y1));
  const h0 = Math.min(...g.map((r) => r.h0));
  const h1 = Math.max(...g.map((r) => r.h1));
  const mats = [...new Set(g.map((r) => r.mat))].join(',');
  console.log(
    'X~' + k,
    'n=' + g.length,
    'y=' + y0 + '..' + y1,
    'h=' + h0.toFixed(2) + '..' + h1.toFixed(2),
    mats
  );
}

// Show any metal with X > 16000 (true exterior bay)
console.log('\n=== METAL X>16000 (east bay / exterior face) ===');
metal
  .filter((r) => r.mx > 16000)
  .slice(0, 40)
  .forEach((r) =>
    console.log(r.mat, 'x', r.x0 + '-' + r.x1, 'y', r.y0 + '-' + r.y1, 'h', r.h0 + '-' + r.h1)
  );

// white walls in east bay
console.log('\n=== WHITE walls X 16000-16700 (stair east wall) ===');
rows
  .filter((r) => r.mat === 'white' && r.mx >= 16000 && r.mx <= 16700)
  .slice(0, 20)
  .forEach((r) =>
    console.log('x', r.x0 + '-' + r.x1, 'y', r.y0 + '-' + r.y1, 'h', r.h0 + '-' + r.h1)
  );
