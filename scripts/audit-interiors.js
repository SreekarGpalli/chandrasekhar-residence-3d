/* ============================================================
   audit-interiors.js — dev tool, run inside walkthrough.html:

     const s = document.createElement('script');
     s.src = 'scripts/audit-interiors.js?' + Date.now(); document.head.appendChild(s);
     // then: await HouseAudit.run({ post: 'http://localhost:8130/' })

   Rebuilds the house with window.__HOUSE_AUDIT on (every Fur.* call
   records its bounding box), adds the CC0 scans from the live scene, and
   checks each floor for:
     · furniture clashing with furniture
     · furniture pushed into walls
     · anything standing in a doorway's swing / approach zone
     · free floor a person (r = 220 mm) cannot reach from the stair
   It also draws a labelled plan per floor so orientation and spacing
   can be judged by eye. Returns { report, plans }.
   ============================================================ */
window.HouseAudit = (function () {
  'use strict';
  const DECOR = new Set(['rug', 'art', 'curtains', 'clad', 'books', 'mirror', 'showerHead', 'shower',
    'pendant', 'surfaceDownlight', 'ceilingFan', 'splitAC', 'coveLedge', 'voidCluster', 'vanityBar',
    'taskStrip', 'wallBracket', 'wallSconce', 'bedsideSconce', 'surfacePanel', 'profileLight',
    'murtiGanesha', 'murtiVenkateswara', 'murtiLakshmi', 'murtiPedestal', 'kuthuVilakku', 'poojaThali',
    'poojaPhotoFrame', 'rangeHood', 'hob', 'sink', 'tv', 'floorLamp', 'drum']);
  const BUILTIN = new Set(['fullHeightWardrobe', 'wardrobe', 'vastuWardrobe', 'counterX', 'kitBaseDoors',
    'kitBaseDrawers', 'kitWallRun', 'kitPantry', 'wallCabinet', 'tvFeatureWall', 'shelves', 'crockeryUnit',
    'privacyScreen', 'console', 'wc', 'basin', 'fridge', 'washer', 'side', 'openingFrame', 'slidingDoor', 'foyerPartition']);

  function floorOf(y, L) {
    const F = [L.f0, L.f1, L.f2, L.roof];
    for (let i = 0; i < 3; i++) if (y >= F[i] - 0.06 && y < F[i + 1] - 0.06) return i;
    return -1;
  }
  const planBox = (b) => ({ x0: b[0] * 1000, x1: b[3] * 1000, y0: -b[5] * 1000, y1: -b[2] * 1000, z0: b[1], z1: b[4] });
  const ov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);

  function walls(A, fi) {
    // shell + interior walls as plan rects (doors cut out, windows kept solid)
    const out = [];
    const L = A.levels, cut = [L.f0, L.f1, L.f2][fi] + 3.2;
    const add = (dir, a0, a1, b0, b1, ops) => {
      const doors = (ops || []).filter(o => (o.sill || 0) < 50 && (o.type === undefined || o.type === 'door' || o.door || o.type === 'frenchdoor'))
        .map(o => [o.c - o.w / 2, o.c + o.w / 2]).sort((p, q) => p[0] - q[0]);
      let cur = a0;
      for (const [d0, d1] of doors) {
        if (d1 <= cur || d0 >= a1) continue;
        if (d0 > cur) out.push(dir === 'x' ? { x0: cur, x1: d0, y0: b0, y1: b1 } : { x0: b0, x1: b1, y0: cur, y1: d0 });
        cur = Math.max(cur, d1);
      }
      if (cur < a1) out.push(dir === 'x' ? { x0: cur, x1: a1, y0: b0, y1: b1 } : { x0: b0, x1: b1, y0: cur, y1: a1 });
    };
    const sch = A.open['f' + fi];
    const sX1 = fi === 1 ? 4805 : 12420, eY0 = fi === 1 ? 1411 : 0;
    add('y', eY0, 8870, 12420, 12650, sch.E);
    add('x', 230, 12420, 8640, 8870, sch.N);
    add('x', 230, sX1, 0, 230, sch.S);
    add('y', 0, 8870, 0, 230, sch.W);
    for (const w of A.iw[fi]) add(w.dir, w.a[0], w.a[1], w.b[0], w.b[1], w.ops.map(o => Object.assign({ type: (o.sill || 0) < 50 ? 'door' : 'win' }, o)));
    return out;
  }

  function doorsOf(A, fi) {
    const ds = [];
    for (const w of A.iw[fi]) for (const o of w.ops) {
      if ((o.sill || 0) >= 50 || o.w < 600) continue;
      ds.push({ dir: w.dir, c: o.c, w: o.w, b0: w.b[0], b1: w.b[1] });
    }
    const sch = A.open['f' + fi];
    for (const o of sch.E) if (o.type === 'door' || o.type === 'frenchdoor') ds.push({ dir: 'y', c: o.c, w: o.w, b0: 12420, b1: 12650, ext: true });
    for (const o of sch.N) if (o.type === 'door') ds.push({ dir: 'x', c: o.c, w: o.w, b0: 8640, b1: 8870, ext: true });
    return ds;
  }

  async function run(opts) {
    opts = opts || {};
    window.__HOUSE_AUDIT = true;
    const d = window.HouseScene.build(THREE);
    window.__HOUSE_AUDIT = false;
    const A = d.audit, L = A.levels;
    const items = A.items.map((it, i) => Object.assign({ id: i, name: it.name, args: it.args.map(v => typeof v === 'number' ? Math.round(v * 1000) / 1000 : v) }, planBox(it.box)))
      .filter(it => isFinite(it.x0));
    items.forEach(it => { it.fi = floorOf(it.z0, L); it.zr0 = it.z0 - [L.f0, L.f1, L.f2][Math.max(0, it.fi)]; it.zr1 = it.z1 - [L.f0, L.f1, L.f2][Math.max(0, it.fi)]; });
    // A door casing's bbox is the whole ring, which would read as a solid
    // block across the doorway. Swap each for its real pieces (jamb linings,
    // head, architraves on both faces) so clashes and reachability see what
    // is actually there. Mirrors Fur.openingFrame in houseScene.js.
    for (let k = items.length - 1; k >= 0; k--) {
      const it = items[k]; if (it.name !== 'openingFrame') continue;
      const [dir, w0, w1, a0, a1, , h, sA] = it.args, zA = sA || 0, Lj = 18, A = 50, P = 15;
      const tag = it.args.slice(0, 5).join(',');
      const parts = [];
      const put = (nm, s0, s1, d0, d1, z0, z1) => parts.push(Object.assign({ id: items.length + parts.length, name: 'openingFrame', args: [nm, tag], fi: it.fi, zr0: z0, zr1: z1, z0: it.z0 - it.zr0 + z0, z1: it.z0 - it.zr0 + z1 },
        dir === 'y' ? { x0: d0, x1: d1, y0: s0, y1: s1 } : { x0: s0, x1: s1, y0: d0, y1: d1 }));
      put('jambA', a0, a0 + Lj, w0, w1, zA, h); put('jambB', a1 - Lj, a1, w0, w1, 0, h); put('head', a0, a1, w0, w1, h - 0.018, h);
      for (const [g, f0, f1] of [['lo', w0 - P, w0], ['hi', w1, w1 + P]]) {
        put('arcA-' + g, a0 - A, a0 + Lj, f0, f1, zA, h + 0.05); put('arcB-' + g, a1 - Lj, a1 + A, f0, f1, 0, h + 0.05); put('arcH-' + g, a0 - A, a1 + A, f0, f1, h - 0.018, h + 0.05);
      }
      items.splice(k, 1, ...parts);
    }
    items.forEach((it, i) => { it.id = i; });
    // CC0 scans from the live scene
    const live = (window.__wt && __wt.scene) || null;
    if (live) {
      const seen = new Set();
      live.traverse(o => {
        if (!o.isMesh || !o.userData.scan) return;
        let top = o; while (top.parent && !/^interiorScans\d$/.test(top.parent.name)) top = top.parent;
        if (seen.has(top)) return; seen.add(top);
        const b = new THREE.Box3().setFromObject(top);
        const pbx = planBox([b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z]);
        const fi = floorOf(pbx.z0, L);
        items.push(Object.assign({ id: items.length, name: 'scan:' + o.userData.scan, args: [], fi,
          zr0: pbx.z0 - [L.f0, L.f1, L.f2][Math.max(0, fi)], zr1: pbx.z1 - [L.f0, L.f1, L.f2][Math.max(0, fi)] }, pbx));
      });
    }
    const report = { clashes: [], intoWalls: [], doors: [], unreachable: [] };
    const plans = [];
    for (let fi = 0; fi < 3; fi++) {
      const F = items.filter(it => it.fi === fi);
      const W = walls(A, fi);
      const solid = F.filter(it => !DECOR.has(it.name) && it.zr0 < 1.6);
      // 1. clashes
      for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
        const a = solid[i], b = solid[j];
        const ox = ov(a.x0, a.x1, b.x0, b.x1), oy = ov(a.y0, a.y1, b.y0, b.y1), oz = ov(a.z0, a.z1, b.z0, b.z1);
        // casing pieces are 15-18 mm thin: any real overlap counts, but not
        // a casing against its own pieces
        const fa = a.name === 'openingFrame', fb = b.name === 'openingFrame';
        if (fa && fb && a.args[1] === b.args[1]) continue;
        const t = fa || fb ? 1 : 30, tz = fa || fb ? 0.005 : 0.03;
        if (ox > t && oy > t && oz > tz) {
          // an object resting on another's top is fine
          if (Math.abs(a.z0 - b.z1) < 0.03 || Math.abs(b.z0 - a.z1) < 0.03) continue;
          report.clashes.push({ fi, a: a.name + ' ' + a.args.slice(0, 5).join(','), b: b.name + ' ' + b.args.slice(0, 5).join(','), ox: Math.round(ox), oy: Math.round(oy) });
        }
      }
      // 1b. wall / ceiling fittings against furniture and joinery, any height
      const HIGH = new Set(['splitAC', 'ceilingFan', 'art', 'mirror', 'pendant', 'curtains', 'voidCluster', 'floorLamp']);
      const hi = F.filter(it => HIGH.has(it.name));
      const body = F.filter(it => !DECOR.has(it.name) || it.name === 'tv');
      for (const a of hi) for (const b of body.concat(hi)) {
        if (a === b) continue;
        if (HIGH.has(b.name) && b.id < a.id) continue;
        const ox = ov(a.x0, a.x1, b.x0, b.x1), oy = ov(a.y0, a.y1, b.y0, b.y1), oz = ov(a.z0, a.z1, b.z0, b.z1);
        if (ox > 15 && oy > 15 && oz > 0.02)
          report.clashes.push({ fi, a: a.name + ' ' + a.args.slice(0, 5).join(','), b: b.name + ' ' + b.args.slice(0, 5).join(','), ox: Math.round(ox), oy: Math.round(oy), oz: +oz.toFixed(2), kind: 'fitting' });
      }
      // 2. into walls
      for (const it of solid) {
        if (BUILTIN.has(it.name)) continue;
        for (const w of W) {
          const ox = ov(it.x0, it.x1, w.x0, w.x1), oy = ov(it.y0, it.y1, w.y0, w.y1);
          if (ox > 40 && oy > 40) { report.intoWalls.push({ fi, item: it.name + ' ' + it.args.slice(0, 5).join(','), wall: [w.x0, w.x1, w.y0, w.y1].map(Math.round).join(','), pen: Math.round(Math.min(ox, oy)) }); break; }
        }
      }
      // 3. doorways (700 mm approach each side)
      for (const dr of doorsOf(A, fi)) {
        const z = dr.dir === 'x'
          ? { x0: dr.c - dr.w / 2 + 40, x1: dr.c + dr.w / 2 - 40, y0: dr.b0 - 700, y1: dr.b1 + 700 }
          : { x0: dr.b0 - 700, x1: dr.b1 + 700, y0: dr.c - dr.w / 2 + 40, y1: dr.c + dr.w / 2 - 40 };
        for (const it of F) {
          if (DECOR.has(it.name) && it.name !== 'floorLamp') continue;
          if (it.zr0 > 1.9) continue;
          if (ov(it.x0, it.x1, z.x0, z.x1) > 20 && ov(it.y0, it.y1, z.y0, z.y1) > 20)
            report.doors.push({ fi, door: dr.dir + '@' + Math.round((dr.b0 + dr.b1) / 2) + ' c' + dr.c + (dr.ext ? ' (ext)' : ''), item: it.name + ' ' + it.args.slice(0, 5).join(',') });
        }
      }
      // 4. reachability on a 50 mm grid, person radius 220 mm
      const G = 50, X0 = -800, Y0 = -800, NX = Math.ceil((13300 - X0) / G), NY = Math.ceil((9900 - Y0) / G);
      const blk = new Uint8Array(NX * NY);
      const mark = (r, pad) => {
        const i0 = Math.max(0, Math.floor((r.x0 - pad - X0) / G)), i1 = Math.min(NX - 1, Math.floor((r.x1 + pad - X0) / G));
        const j0 = Math.max(0, Math.floor((r.y0 - pad - Y0) / G)), j1 = Math.min(NY - 1, Math.floor((r.y1 + pad - Y0) / G));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) blk[j * NX + i] = 1;
      };
      const R = 220;
      W.forEach(w => mark(w, R));
      F.forEach(it => { if (it.name === 'rug' || it.name === 'art' || it.name === 'clad' || it.name === 'mirror' || it.name === 'curtains') return; if (it.zr0 > 1.4 || it.zr1 < 0.12) return; mark(it, R); });
      // stair shaft is a hole on the SF; void over the FF hall is fine
      const inRoom = (i, j) => {
        const x = X0 + (i + 0.5) * G, y = Y0 + (j + 0.5) * G;
        return A.rooms[fi].find(r => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1 && r.type !== 'out' && r.name !== 'LIFT');
      };
      const seedPt = [[8000, 6300], [10300, 7000], [12150, 6500]][fi];   // open floor near each level's arrival
      const seen = new Uint8Array(NX * NY), q = [];
      const si = Math.floor((seedPt[0] - X0) / G), sj = Math.floor((seedPt[1] - Y0) / G);
      if (!blk[sj * NX + si]) { seen[sj * NX + si] = 1; q.push(sj * NX + si); }
      while (q.length) {
        const c = q.pop(), i = c % NX, j = (c / NX) | 0;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NX || nj >= NY) continue;
          const n = nj * NX + ni; if (blk[n] || seen[n]) continue;
          const px = X0 + (ni + 0.5) * G, py = Y0 + (nj + 0.5) * G;
          if (px < 0 || px > 12650 || py < (fi ? -762 : 0) || py > 8870) continue;   // stay in the building
          seen[n] = 1; q.push(n);
        }
      }
      const roomStat = {};
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const r = inRoom(i, j); if (!r) continue;
        const k = r.name + '@' + r.x0;
        const s = roomStat[k] || (roomStat[k] = { name: r.name, free: 0, reach: 0 });
        if (!blk[j * NX + i]) { s.free++; if (seen[j * NX + i]) s.reach++; }
      }
      for (const k in roomStat) {
        const s = roomStat[k];
        if (fi === 2 && s.name === 'STAIRCASE') continue;   // SF stair bay is the open shaft
        if (s.free === 0 || s.reach / s.free < 0.9) report.unreachable.push({ fi, room: s.name, freeM2: +(s.free * G * G / 1e6).toFixed(2), reachPct: s.free ? Math.round(100 * s.reach / s.free) : 0 });
      }
      // 5. plan drawing
      if (opts.post) {
        const S = 0.1, c = document.createElement('canvas');
        c.width = Math.ceil(NX * G * S); c.height = Math.ceil(NY * G * S);
        const x = c.getContext('2d');
        const P = (px, py) => [(px - X0) * S, c.height - (py - Y0) * S];
        x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
          if (!inRoom(i, j)) continue;
          const n = j * NX + i;
          x.fillStyle = blk[n] ? '#eee' : seen[n] ? '#e4f4e4' : '#ffb3b3';
          const [px, py] = P(X0 + i * G, Y0 + (j + 1) * G); x.fillRect(px, py, G * S + 0.5, G * S + 0.5);
        }
        x.fillStyle = '#222';
        W.forEach(w => { const [a, b] = P(w.x0, w.y1); x.fillRect(a, b, (w.x1 - w.x0) * S, (w.y1 - w.y0) * S); });
        x.font = '10px sans-serif';
        F.forEach(it => {
          const [a, b] = P(it.x0, it.y1);
          const dec = DECOR.has(it.name);
          x.strokeStyle = it.name.startsWith('scan:') ? '#c06000' : dec ? '#9ab' : '#1155cc';
          x.lineWidth = dec ? 0.6 : 1.4;
          x.strokeRect(a, b, (it.x1 - it.x0) * S, (it.y1 - it.y0) * S);
          if (!dec || it.name === 'rug') { x.fillStyle = x.strokeStyle; x.fillText(it.name.replace('scan:', '*').slice(0, 18), a + 2, b + 10); }
        });
        x.fillStyle = '#000'; x.font = 'bold 11px sans-serif';
        A.rooms[fi].forEach(r => { if (r.type === 'out') return; const [a, b] = P(r.x0 + 60, r.y0 + 120); x.fillText(r.name, a, b); });
        // grid ticks every 1 m
        x.fillStyle = '#888'; x.font = '9px sans-serif';
        for (let gx = 0; gx <= 13000; gx += 1000) { const [a] = P(gx, 0); x.fillText(gx / 1000 + 'm', a, c.height - 2); }
        for (let gy = 0; gy <= 9000; gy += 1000) { const [, b] = P(0, gy); x.fillText(gy / 1000 + 'm', 2, b); }
        const url = c.toDataURL('image/png');
        plans.push(url);
        await fetch(opts.post + 'plan-f' + fi + '.png', { method: 'POST', body: url });
      }
    }
    report.items = items.filter(i => i.fi >= 0).map(i => ({ fi: i.fi, name: i.name, args: i.args.slice(0, 9), box: [i.x0, i.x1, i.y0, i.y1].map(Math.round), z: [+(i.zr0).toFixed(2), +(i.zr1).toFixed(2)] }));
    if (opts.post) await fetch(opts.post + 'audit.json', { method: 'POST', body: JSON.stringify(report, null, 1) });
    return { counts: { clashes: report.clashes.length, intoWalls: report.intoWalls.length, doors: report.doors.length, unreachable: report.unreachable.length } };
  }
  return { run };
})();
