/* Coplanar-face audit for the walkthrough (walkthrough.html, ?v=full2 or default).
 *
 * Z-fighting ("white speckle", flicker) happens where two DIFFERENT materials put a face in the
 * same plane facing the same way. This finds them in the built scene:
 *   1. every axis-aligned triangle of every visible, opaque mesh is bucketed by (facing, plane, 0.5 mm);
 *   2. pairs from different meshes AND different material keys, in the same top-level group
 *      (groups are ordered against each other by the walkthrough's polygonOffset), whose
 *      triangles really overlap are collected;
 *   3. each cluster is checked for visibility: a ray from 20 cm in front of the face must meet
 *      the face first, from open air (not from inside a solid, checked by crossing parity).
 *
 * Use (browser console on the walkthrough, after "Enter the house"):
 *     const s = document.createElement('script'); s.src = 'tools/coplanar-audit.js'; document.head.appendChild(s);
 *     // then, once loaded:
 *     await window.coplanarAudit({ top: 40 })      // -> JSON: [group pair face, triangles, clusters, sample plan-mm x,y,height]
 *
 * Sample positions are plan millimetres (x, y) and height above datum (mm). Same-material pairs and
 * faces of different groups are ignored on purpose. Remaining hits are real: fix the geometry (move
 * one face 1-2 mm, cut one out of the other, or lower the lower layer under the upper) or give the
 * materials different layers in walkthrough.html (WT_LAYER).
 */
window.coplanarAudit = async function (opts) {
  opts = opts || {};
  const scene = __wt.scene, metas = [], P = [];
  const visible = o => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };
  scene.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  const grpOf = o => { let p = o; while (p.parent && p.parent.name !== 'residence') p = p.parent; return p.name; };
  scene.traverse(o => {
    if (!o.isMesh || !o.geometry || !visible(o)) return;
    const mat = o.material; if (mat && (mat.transparent && mat.opacity < 0.99)) return;
    const key = o.userData.matKey || (mat && mat.userData && mat.userData.name) || o.userData.scan || o.name || 'mesh';
    const mi = metas.length; metas.push({ key, scan: o.userData.scan || null, grp: grpOf(o) });
    const g = o.geometry, pos = g.attributes.position, idx = g.index, n = (idx ? idx.count : pos.count) / 3, m = o.matrixWorld;
    const W = new Float64Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(m); W[3 * i] = v.x; W[3 * i + 1] = v.y; W[3 * i + 2] = v.z; }
    for (let t = 0; t < n; t++) {
      const a = idx ? idx.getX(3 * t) : 3 * t, b = idx ? idx.getX(3 * t + 1) : 3 * t + 1, c = idx ? idx.getX(3 * t + 2) : 3 * t + 2;
      const ax = W[3 * a], ay = W[3 * a + 1], az = W[3 * a + 2], bx = W[3 * b], by = W[3 * b + 1], bz = W[3 * b + 2], cx = W[3 * c], cy = W[3 * c + 1], cz = W[3 * c + 2];
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const L = Math.hypot(nx, ny, nz); if (L < 1e-7) continue; nx /= L; ny /= L; nz /= L;
      let axis = -1; if (Math.abs(nx) > 0.99995) axis = 0; else if (Math.abs(ny) > 0.99995) axis = 1; else if (Math.abs(nz) > 0.99995) axis = 2; else continue;
      const nn = [nx, ny, nz][axis], co = axis === 0 ? (ax + bx + cx) / 3 : axis === 1 ? (ay + by + cy) / 3 : (az + bz + cz) / 3;
      const u = axis === 0 ? [ay, by, cy] : [ax, bx, cx], w2 = axis === 2 ? [ay, by, cy] : [az, bz, cz];
      P.push(mi, axis * 2 + (nn > 0 ? 1 : 0), co, u[0], w2[0], u[1], w2[1], u[2], w2[2]);
    }
  });
  const N = P.length / 9, buckets = new Map();
  for (let i = 0; i < N; i++) { const k = P[9 * i + 1] * 1e7 + Math.round(P[9 * i + 2] / 0.0005) + 5e6; let b = buckets.get(k); if (!b) buckets.set(k, b = []); b.push(i); }
  const bbox = i => { const u0 = P[9 * i + 3], u1 = P[9 * i + 5], u2 = P[9 * i + 7], v0 = P[9 * i + 4], v1 = P[9 * i + 6], v2 = P[9 * i + 8]; return [Math.min(u0, u1, u2), Math.max(u0, u1, u2), Math.min(v0, v1, v2), Math.max(v0, v1, v2)]; };
  const inTri = (i, x, y) => { const x0 = P[9 * i + 3], y0 = P[9 * i + 4], x1 = P[9 * i + 5], y1 = P[9 * i + 6], x2 = P[9 * i + 7], y2 = P[9 * i + 8]; const d1 = (x - x1) * (y0 - y1) - (x0 - x1) * (y - y1), d2 = (x - x2) * (y1 - y2) - (x1 - x2) * (y - y2), d3 = (x - x0) * (y2 - y0) - (x2 - x0) * (y - y0); const neg = d1 < -1e-9 || d2 < -1e-9 || d3 < -1e-9, pos = d1 > 1e-9 || d2 > 1e-9 || d3 > 1e-9; return !(neg && pos); };
  const out = new Map();
  const note = (ia, ib, ox, oy, pk, co, dist) => {
    const ma = metas[P[9 * ia]], mb = metas[P[9 * ib]];
    const ka = ma.key + (ma.scan ? '#scan' : ''), kb = mb.key + (mb.scan ? '#scan' : '');
    const pair = ka < kb ? ka + ' | ' + kb : kb + ' | ' + ka, axis = pk >> 1, sg = (pk & 1) ? '+' : '-';
    const w = axis === 0 ? [co, ox, oy] : axis === 1 ? [ox, co, oy] : [ox, oy, co];
    const plan = [Math.round(w[0] * 1000), Math.round(-w[2] * 1000), Math.round(w[1] * 1000)];
    const ck = ma.grp + ' ' + pair + ' @' + 'xyz'[axis] + sg + ' ' + Math.round(plan[0] / 1500) + ',' + Math.round(plan[1] / 1500) + ',' + Math.round(plan[2] / 700);
    let e = out.get(ck); if (!e) out.set(ck, e = { pair, face: 'xyz'[axis] + sg, n: 0, d: 1, s: plan, grp: ma.grp });
    e.n++; e.d = Math.min(e.d, dist);
  };
  const seen = new Set();
  for (const k of buckets.keys()) {
    const A = buckets.get(k), Bk = buckets.get(k + 1); if (A.length < 2 && !Bk) continue;
    const L = Bk ? A.concat(Bk) : A, cell = 0.5, hash = new Map();
    for (let ii = 0; ii < L.length; ii++) { const bb = bbox(L[ii]); for (let cx = Math.floor(bb[0] / cell); cx <= Math.floor(bb[1] / cell); cx++) for (let cy = Math.floor(bb[2] / cell); cy <= Math.floor(bb[3] / cell); cy++) { const hk = cx * 100003 + cy; let h = hash.get(hk); if (!h) hash.set(hk, h = []); h.push(L[ii]); } }
    for (const h of hash.values()) { if (h.length < 2) continue;
      for (let x = 0; x < h.length; x++) for (let y = x + 1; y < h.length; y++) {
        const ia = h[x], ib = h[y]; if (P[9 * ia] === P[9 * ib] || P[9 * ia + 1] !== P[9 * ib + 1]) continue;
        const ma = metas[P[9 * ia]], mb = metas[P[9 * ib]]; if (ma.grp !== mb.grp) continue;
        if (ma.key === mb.key && !ma.scan) continue;
        const pk2 = ia < ib ? ia * 4e6 + ib : ib * 4e6 + ia; if (seen.has(pk2)) continue; seen.add(pk2);
        const dist = Math.abs(P[9 * ia + 2] - P[9 * ib + 2]); if (dist > 0.00075) continue;
        const a = bbox(ia), b = bbox(ib), ou0 = Math.max(a[0], b[0]), ou1 = Math.min(a[1], b[1]), ov0 = Math.max(a[2], b[2]), ov1 = Math.min(a[3], b[3]);
        if (ou1 - ou0 < 0.004 || ov1 - ov0 < 0.004) continue;
        let hit = null; for (const fu of [0.25, 0.5, 0.75]) for (const fv of [0.25, 0.5, 0.75]) { const x0 = ou0 + (ou1 - ou0) * fu, y0 = ov0 + (ov1 - ov0) * fv; if (!hit && inTri(ia, x0, y0) && inTri(ib, x0, y0)) hit = [x0, y0]; }
        if (!hit) continue; note(ia, ib, hit[0], hit[1], P[9 * ia + 1], (P[9 * ia + 2] + P[9 * ib + 2]) / 2, dist);
      } }
  }
  // visibility: open air in front (ray from 20 cm out meets the face first) and not inside a solid (crossing parity)
  const rows = [...out.values()], rc = new THREE.Raycaster(), dirs = { 'x+': [1,0,0], 'x-': [-1,0,0], 'y+': [0,1,0], 'y-': [0,-1,0], 'z+': [0,0,1], 'z-': [0,0,-1] };
  const targets = []; scene.traverse(o => { if (o.isMesh && o.visible) targets.push(o); });
  const saved = new Map(); targets.forEach(o => saved.set(o.material, o.material.side)); for (const m of saved.keys()) m.side = THREE.DoubleSide;
  const keep = [];
  for (const r of rows) {
    const n = new THREE.Vector3(...dirs[r.face]), p = new THREE.Vector3(r.s[0] / 1000, r.s[2] / 1000, -r.s[1] / 1000);
    const o = p.clone().addScaledVector(n, 0.2); rc.set(o, n.clone().negate()); rc.far = 0.5;
    const h = rc.intersectObjects(targets, false);
    if (!(h.length && Math.abs(h[0].distance - 0.2) < 0.012)) continue;
    const o2 = p.clone().addScaledVector(n, 0.05);
    const probes = n.y !== 0 ? [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1)] : [new THREE.Vector3(0, 1, 0), new THREE.Vector3(n.x !== 0 ? 0 : 1, 0, n.x !== 0 ? 1 : 0)];
    let inside = 0; for (const d of probes) { rc.set(o2, d); rc.far = 400; inside += (rc.intersectObjects(targets, false).length % 2 === 1) ? 1 : 0; }
    if (inside < 2) keep.push(r);
  }
  for (const [m, s] of saved) m.side = s;
  keep.sort((a, b) => b.n - a.n); window.__coplanarRows = keep;
  const by = {}; for (const r of keep) { const k = r.grp + ' ' + r.pair + ' ' + r.face; (by[k] = by[k] || { n: 0, g: 0, s: [] }); by[k].n += r.n; by[k].g++; if (by[k].s.length < 2) by[k].s.push(r.s.join(',')); }
  return JSON.stringify({ triangles: N, clusters: rows.length, visible: keep.length, top: Object.entries(by).sort((a, b) => b[1].n - a[1].n).slice(0, opts.top || 40).map(([k, e]) => [k, e.n, e.g, e.s.join(' | ')]) });
};
