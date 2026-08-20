/**
 * Load elevation houseScene with a stub THREE and record every box
 * near the external stair (x 14–17m, y/z plan 0–4.2m).
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const file = process.argv[2] || 'elevations/version-one/houseScene.js';

const boxes = [];

function makeTHREE() {
  class Object3D {
    constructor() {
      this.children = [];
      this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } };
      this.rotation = { x: 0, y: 0, z: 0, set() { return this; } };
      this.scale = { set() { return this; } };
      this.visible = true;
      this.name = '';
      this.castShadow = false;
      this.receiveShadow = false;
    }
    add(c) { this.children.push(c); return this; }
    traverse(fn) {
      fn(this);
      for (const c of this.children) if (c.traverse) c.traverse(fn);
    }
  }
  class Group extends Object3D {}
  class Mesh extends Object3D {
    constructor(geo, mat) {
      super();
      this.geometry = geo;
      this.material = mat;
      // record if bag sets position after
    }
  }
  class BoxGeometry {
    constructor(w, h, d) {
      this.parameters = { width: w, height: h, depth: d };
    }
  }
  class Material {
    constructor(o) {
      Object.assign(this, o || {});
      this.color = (o && o.color != null) ? o.color : 0;
    }
    clone() { return new Material(this); }
  }
  class Color {
    constructor(c) { this.c = c; }
    set(c) { this.c = c; return this; }
    multiplyScalar() { return this; }
    getHex() { return this.c; }
  }
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new Vector3(this.x, this.y, this.z); }
    add() { return this; }
    sub() { return this; }
    length() { return 0; }
  }
  class Euler {
    set() { return this; }
  }
  class Matrix4 {
    makeRotationFromEuler() { return this; }
  }
  class BufferGeometry {
    setAttribute() { return this; }
    setIndex() { return this; }
  }
  class BufferAttribute {
    constructor(arr, n) { this.arr = arr; this.n = n; }
  }
  class Points extends Mesh {}
  class LineSegments extends Mesh {}
  class LineBasicMaterial extends Material {}
  class PointsMaterial extends Material {}

  // Patch Mesh so we capture world-ish placement after bag.box
  const OrigMesh = Mesh;
  return {
    Object3D, Group,
    Mesh: class extends OrigMesh {
      constructor(geo, mat) {
        super(geo, mat);
        this._rec = { geo, mat };
      }
    },
    BoxGeometry,
    MeshStandardMaterial: Material,
    MeshBasicMaterial: Material,
    MeshPhysicalMaterial: Material,
    MeshLambertMaterial: Material,
    MeshPhongMaterial: Material,
    LineBasicMaterial,
    PointsMaterial,
    Color, Vector3, Euler, Matrix4,
    BufferGeometry, BufferAttribute, Float32BufferAttribute: BufferAttribute,
    Points, LineSegments,
    DoubleSide: 2, FrontSide: 0, BackSide: 1,
    sRGBEncoding: 3001, ACESFilmicToneMapping: 4,
    PCFSoftShadowMap: 2, SRGBColorSpace: 'srgb',
    RepeatWrapping: 1000, ClampToEdgeWrapping: 1001,
    AdditiveBlending: 2, NormalBlending: 1
  };
}

// Intercept by wrapping bag after - easier: monkeypatch via rewriting pb is hard.
// Instead, patch Mesh prototype position.set after build by traversing and
// recording meshes whose material name/color suggests rail and x in range.

const THREE = makeTHREE();
const code = fs.readFileSync(file, 'utf8');
const sandbox = { window: { THREE }, console, Math, Date, parseInt, parseFloat, isNaN, Infinity, JSON };
vm.runInNewContext(code, sandbox);
const HS = sandbox.window.HouseScene;
if (!HS) {
  console.error('No HouseScene');
  process.exit(1);
}

let data;
try {
  data = HS.build(THREE);
} catch (e) {
  console.error('BUILD FAIL', e.stack || e);
  process.exit(1);
}

const hits = [];
data.root.traverse((o) => {
  if (!o.geometry || !o.geometry.parameters) return;
  const p = o.position;
  const g = o.geometry.parameters;
  // plan mm from world: X*1000, Yplan = -Z*1000
  const x = p.x * 1000;
  const yPlan = -p.z * 1000;
  const y = p.y;
  // near stair tower
  if (x < 14000 || x > 17500) return;
  if (yPlan < -100 || yPlan > 4500) return;
  if (y < 0.5 || y > 6) return;
  const mat = o.material || {};
  const color = mat.color != null ? mat.color : (mat.opts && mat.opts.color);
  const w = g.width * 1000, h = g.height * 1000, d = g.depth * 1000;
  // railing-like: thin tall posts or long thin rails
  const thin = Math.min(w, d) < 80;
  const tall = h > 400 || (g.height > 0.4);
  const long = Math.max(w, d) > 400;
  if (!(thin || tall || long)) return;
  hits.push({
    x: Math.round(x),
    yPlan: Math.round(yPlan),
    y: +y.toFixed(2),
    w: Math.round(w),
    h: Math.round(h),
    d: Math.round(d),
    color,
    name: o.parent && o.parent.name
  });
});

hits.sort((a, b) => a.x - b.x || a.yPlan - b.yPlan);
console.log('FILE', file);
console.log('stamp', sandbox.window.__HOUSE3D_STAIR_RAIL__ || 'none');
console.log('hits', hits.length);
// cluster by x
const byX = {};
for (const h of hits) {
  const k = Math.round(h.x / 50) * 50;
  byX[k] = (byX[k] || 0) + 1;
}
console.log('count by X~50mm bins:', byX);
// show unique X values with counts
const xCount = {};
for (const h of hits) {
  const k = Math.round(h.x / 10) * 10;
  xCount[k] = (xCount[k] || 0) + 1;
}
const xs = Object.keys(xCount).map(Number).sort((a, b) => a - b);
console.log('X positions (mm) with mesh counts:');
for (const x of xs) {
  if (xCount[x] >= 2) console.log(' ', x, 'n=' + xCount[x]);
}
