/* ============================================================
   interiorKit.js — shared interior finishes for index.html and
   walkthrough.html (Oct 2026 interiors pass).

   Both viewers re-skin houseScene's flat palette with procedural
   canvas textures. The interior palette keys added in houseScene's C
   (oak, alu, lacq, quartz, boucle, linen, …) and the floor tints get
   their texture generators and material treatments from here, so the
   two viewers cannot drift apart.

   Generators take a pixel size and return CANVASES:
     { map, height?, rough?, ns, hs }
   map is near-neutral (the palette colour sets the hue); height is
   turned into a normal map by the viewer's own normalFromHeight.
   ============================================================ */
window.InteriorKit = (function () {
  'use strict';

  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h || w;
    return c;
  }
  // seeded so every load paints the same floor
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function noise(size, cells, R, amp) {
    // value noise drawn as a smoothed low-res canvas
    const n = cv(cells), x = n.getContext('2d');
    const img = x.createImageData(cells, cells);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (R() - 0.5) * 255 * amp;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const out = cv(size), o = out.getContext('2d');
    o.imageSmoothingEnabled = true;
    // draw 3x3 so the smoothing wraps at the edges
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      o.drawImage(n, dx * size, dy * size, size, size);
    }
    return out;
  }
  function fbm(size, R, base, oct) {
    const c = cv(size), x = c.getContext('2d');
    x.fillStyle = '#808080'; x.fillRect(0, 0, size, size);
    let a = 0.55, cells = base;
    for (let o = 0; o < oct; o++) {
      x.globalAlpha = a; x.drawImage(noise(size, cells, R, 1), 0, 0);
      a *= 0.55; cells = Math.min(cells * 2, size);
    }
    x.globalAlpha = 1;
    return c;
  }
  function speckle(c, spread, R) {
    const x = c.getContext('2d'), w = c.width, h = c.height;
    const img = x.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = (R() - 0.5) * spread;
      d[i] = Math.max(0, Math.min(255, d[i] + r));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + r));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + r));
    }
    x.putImageData(img, 0, 0);
  }
  function grey(v) { v = Math.max(0, Math.min(255, v | 0)); return 'rgb(' + v + ',' + v + ',' + v + ')'; }

  /* ---- engineered oak planks: texture = 1.2 m square, 6 boards of 200 mm ---- */
  function planks(s) {
    const R = rng(11), c = cv(s), x = c.getContext('2d');
    const hs = s >> 1, h = cv(hs), hx = h.getContext('2d');
    hx.fillStyle = '#bdbdbd'; hx.fillRect(0, 0, hs, hs);
    const rows = 6, bh = s / rows;
    for (let r = 0; r < rows; r++) {
      const y0 = r * bh;
      // two boards per row with a staggered end joint
      const joint = (0.2 + R() * 0.6) * s;
      const segs = [[joint - s, joint], [joint, joint + s]];
      for (const [a0, a1] of segs) {
        const tone = 200 + R() * 34;
        for (const off of [0, -s, s]) {
          const xa = a0 + off, xb = a1 + off;
          if (xb < 0 || xa > s) continue;
          x.fillStyle = grey(tone); x.fillRect(xa, y0, xb - xa, bh);
          // grain: long thin streaks along the board
          x.save(); x.beginPath(); x.rect(xa, y0, xb - xa, bh); x.clip();
          for (let k = 0; k < 42; k++) {
            const yy = y0 + R() * bh, amp = 1 + R() * 3;
            x.strokeStyle = R() < 0.5 ? 'rgba(90,90,90,' + (0.05 + R() * 0.1) + ')' : 'rgba(255,255,255,' + (0.05 + R() * 0.08) + ')';
            x.lineWidth = 0.6 + R() * 1.8;
            x.beginPath(); x.moveTo(xa, yy);
            x.bezierCurveTo(xa + (xb - xa) * 0.33, yy + amp, xa + (xb - xa) * 0.66, yy - amp, xb, yy + (R() - 0.5) * 2);
            x.stroke();
          }
          // a couple of cathedral arches per board
          for (let k = 0; k < 2; k++) {
            const cx = xa + R() * (xb - xa), cy = y0 + bh * (0.3 + R() * 0.4);
            for (let j = 0; j < 5; j++) {
              x.strokeStyle = 'rgba(80,80,80,0.07)'; x.lineWidth = 1.2;
              x.beginPath(); x.ellipse(cx, cy, 40 + j * 22, 6 + j * 4, 0, 0, Math.PI * 2); x.stroke();
            }
          }
          x.restore();
          // end joint groove
          x.fillStyle = 'rgba(60,60,60,0.55)'; x.fillRect(xa - 1, y0, 2, bh);
          hx.fillStyle = '#3a3a3a'; hx.fillRect((xa - 1) / 2, y0 / 2, 1.5, bh / 2);
        }
      }
      // long-edge micro bevel
      x.fillStyle = 'rgba(55,55,55,0.6)'; x.fillRect(0, y0, s, 2);
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(0, y0 + 2, s, 2);
      hx.fillStyle = '#303030'; hx.fillRect(0, y0 / 2, hs, 1.5);
    }
    speckle(c, 6, R);
    return { map: c, height: h, hs: 1.4, ns: 0.45 };
  }

  /* ---- large-format marble-look porcelain: 2 x 2 slabs per texture ---- */
  function marbleBase(s, R, veins, grout, n) {
    const c = cv(s), x = c.getContext('2d');
    x.fillStyle = '#f4f2ee'; x.fillRect(0, 0, s, s);
    x.globalAlpha = 0.10; x.drawImage(fbm(s, R, 4, 6), 0, 0); x.globalAlpha = 1;
    // veins: soft wide pass then a crisp core
    for (let v = 0; v < veins; v++) {
      let px = R() * s, py = R() * s;
      const ang = -0.6 + R() * 0.5, len = s * (0.5 + R() * 0.9);
      const pts = [[px, py]];
      for (let k = 1; k < 9; k++) {
        px += Math.cos(ang) * len / 8 + (R() - 0.5) * s * 0.05;
        py += Math.sin(ang) * len / 8 + (R() - 0.5) * s * 0.05;
        pts.push([px, py]);
      }
      for (const [wdt, alpha] of [[9, 0.035], [4, 0.07], [1.4, 0.22]]) {
        for (const ox of [0, -s, s]) for (const oy of [0, -s, s]) {
          x.strokeStyle = 'rgba(120,118,115,' + alpha + ')';
          x.lineWidth = wdt * (s / 1024);
          x.beginPath(); x.moveTo(pts[0][0] + ox, pts[0][1] + oy);
          for (let k = 1; k < pts.length; k++) x.lineTo(pts[k][0] + ox, pts[k][1] + oy);
          x.stroke();
        }
      }
    }
    speckle(c, 4, R);
    let h = null;
    if (grout) {
      const ts = s / n;
      h = cv(s >> 1); const hx = h.getContext('2d');
      hx.fillStyle = '#d0d0d0'; hx.fillRect(0, 0, s >> 1, s >> 1);
      for (let i = 0; i <= n; i++) {
        const q = Math.min(s - 1.5, Math.max(1.5, i * ts));
        x.fillStyle = 'rgba(176,170,160,0.9)';
        x.fillRect(q - 1.2, 0, 2.4, s); x.fillRect(0, q - 1.2, s, 2.4);
        hx.fillStyle = '#404040';
        hx.fillRect(q / 2 - 1, 0, 2, s / 2); hx.fillRect(0, q / 2 - 1, s / 2, 2);
      }
      // slab-to-slab tone shift so the grid reads as separate tiles
      for (let ty = 0; ty < n; ty++) for (let tx = 0; tx < n; tx++) {
        x.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
        x.fillRect(tx * ts + 2, ty * ts + 2, ts - 4, ts - 4);
      }
    }
    return { c, h };
  }
  function marble(s) {
    const R = rng(23), m = marbleBase(s, R, 7, true, 2);
    return { map: m.c, height: m.h, hs: 1.2, ns: 0.35 };
  }
  // seamless slab (worktops, feature walls): stronger veins, no grout
  function slab(s) {
    const R = rng(37), m = marbleBase(s, R, 10, false, 1);
    return { map: m.c, ns: 0.2 };
  }

  /* ---- the house floor: Calacatta-style polished marble, 1.2 m slabs ----
     Four slabs per texture, each painted on its own — ivory ground, soft warm
     and cool clouds, two or three bold grey veins that flow diagonally across
     the slab and sprout a few feathers, each with a faint warm seam — and
     separated by rectified joints. This is an ATLAS, not a repeating floor:
     houseScene lays it with explicit UVs (treatment flag preUV) — each floor
     slab, tread and threshold takes one of the four painted slabs in one of
     eight orientations, so the joints land where the mason put them. The
     texture's own tile size is unused. Mirroring one slab inside the texture
     was tried and gives kaleidoscope diamonds, so every slab is unique. */
  function floorMarble(s) {
    const R = rng(71), ts = s >> 1, k = ts / 512;
    const c = cv(s), cx = c.getContext('2d');
    let x = cx;
    // veins run one general way (a long diagonal), flow smoothly, and only
    // sprout a few short feathers — roots and cracks come from busy branching
    function vein(px, py, ang, len, w, depth) {
      const pts = [[px, py]], seg = 20, base = ang;
      for (let i = 1; i <= seg; i++) {
        ang += (R() - 0.5) * 0.2 + (base - ang) * 0.08;
        px += Math.cos(ang) * len / seg; py += Math.sin(ang) * len / seg;
        pts.push([px, py]);
      }
      const path = () => {
        x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 1; i++) {
          x.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
        }
        x.stroke();
      };
      x.lineCap = 'round'; x.lineJoin = 'round';
      // soft grey halo, body, crisp core, a faint warm seam beside it
      for (const [wd, col, a, blur] of [[9, '128,128,132', 0.10, 8], [3.2, '112,112,116', 0.16, 1.8], [1.0, '84,84,90', 0.44, 0], [0.35, '178,148,100', 0.08, 0]]) {
        x.filter = blur ? 'blur(' + (blur * k).toFixed(2) + 'px)' : 'none';
        x.strokeStyle = 'rgba(' + col + ',' + a + ')'; x.lineWidth = Math.max(0.6, w * wd * k);
        path();
      }
      x.filter = 'none';
      if (depth < 1) for (let b = 0; b < 2; b++) {
        const at = pts[4 + Math.floor(R() * (seg - 8))];
        vein(at[0], at[1], ang + (R() < 0.5 ? -1 : 1) * (0.28 + R() * 0.3), len * (0.22 + R() * 0.2), w * 0.45, depth + 1);
      }
    }
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
      cx.save();
      cx.beginPath(); cx.rect(tx * ts, ty * ts, ts, ts); cx.clip();
      cx.translate(tx * ts, ty * ts);
      cx.fillStyle = '#f6f3ed'; cx.fillRect(0, 0, ts, ts);
      cx.globalAlpha = 0.15; cx.drawImage(fbm(ts, R, 3, 6), 0, 0); cx.globalAlpha = 1;
      // a few large warm / cool clouds so no stretch of floor is one flat tone
      for (let i = 0; i < 9; i++) {
        const gx = R() * ts, gy = R() * ts, r = ts * (0.25 + R() * 0.35);
        const g = cx.createRadialGradient(gx, gy, 0, gx, gy, r);
        g.addColorStop(0, R() < 0.5 ? 'rgba(196,176,140,0.10)' : 'rgba(150,152,158,0.08)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        cx.fillStyle = g; cx.fillRect(0, 0, ts, ts);
      }
      // two or three bold veins entering from the top / left edge, one heading
      const ang0 = 0.5 + R() * 0.7, n = 2 + (R() < 0.5 ? 1 : 0);
      for (let v = 0; v < n; v++) {
        const top = R() < 0.55;
        vein(top ? R() * ts * 0.75 : -ts * 0.1, top ? -ts * 0.1 : R() * ts * 0.6,
          ang0 + (R() - 0.5) * 0.25, ts * (1.25 + R() * 0.3), 4.2 - v * 1.0, 0);
      }
      cx.restore();
      // slab-to-slab tone shift so the grid reads as separate, cut slabs
      cx.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
      cx.fillRect(tx * ts, ty * ts, ts, ts);
    }
    // rectified joints: a clear warm-grey line, so the laying reads as a grid
    // of cut slabs (the veins stop dead at every joint)
    const h = cv(s >> 1), hx = h.getContext('2d');
    hx.fillStyle = '#d8d8d8'; hx.fillRect(0, 0, s >> 1, s >> 1);
    for (let i = 0; i <= 2; i++) {
      const q = Math.min(s - 1, Math.max(1, i * ts));
      cx.fillStyle = 'rgba(150,142,130,0.95)';
      cx.fillRect(q - 1.3, 0, 2.6, s); cx.fillRect(0, q - 1.3, s, 2.6);
      hx.fillStyle = '#484848';
      hx.fillRect(q / 2 - 0.75, 0, 1.5, s / 2); hx.fillRect(0, q / 2 - 0.75, s / 2, 1.5);
    }
    speckle(c, 3, R);
    return { map: c, height: h, hs: 0.9, ns: 0.25 };
  }

  /* ---- large-format FLOOR SLABS, 1200 x 1800 mm (4 x 6 ft) glazed vitrified
     (GVT) slabs, the mid-range Indian large-format tile: full-body tough,
     satin or matte (not mirror-polished, so not slippery and scuffs hide).
     Atlas of 2x2 slabs; each slab is painted at its true 2:3 shape (short side
     across the canvas = u, long side down it = v) and squashed into a square
     cell. houseScene's per-slab UVs (slabUV) stretch it back. Each slab gets a
     2 mm colour-matched epoxy joint (half of it on each slab edge).
     Looks (all warm, so they sit with the white walls, oak, cream joinery,
     and set off the blue limewash and navy instead of fighting them):
       ivory      - Botticino / crema marble look, satin
       travertine - vein-cut travertine look, filled + honed matte
       limestone  - light warm-greige limestone look, matte
       white      - soft warm-white marble look, satin ---- */
  function floorSlab(style, s) {
    const S = s >= 512 ? 2048 : 1024, ts = S >> 1, th = Math.round(ts * 1.5), k = ts / 1024;
    const R = rng({ ivory: 301, travertine: 302, limestone: 303, white: 304, kadapa: 305 }[style]);
    const P = {
      ivory:      { base: [230, 216, 192], joint: 'rgba(176,158,130,0.9)' },
      travertine: { base: [218, 200, 170], joint: 'rgba(170,150,120,0.9)' },
      limestone:  { base: [212, 204, 190], joint: 'rgba(166,158,144,0.9)' },
      white:      { base: [238, 235, 229], joint: 'rgba(188,182,172,0.9)' },
      // honed Kadapa-style limestone for stair treads + landings: warm charcoal, deliberately not black
      kadapa:     { base: [112, 106, 98], joint: 'rgba(82,77,70,0.9)' }
    }[style];
    const c = cv(S), cx = c.getContext('2d');
    const h = cv(S >> 1), hx = h.getContext('2d');
    hx.fillStyle = '#d0d0d0'; hx.fillRect(0, 0, S >> 1, S >> 1);
    const rgb = (a, d) => 'rgba(' + a.map(v => Math.max(0, Math.min(255, v + d)) | 0).join(',') + ',';
    for (let cy = 0; cy < 2; cy++) for (let cxi = 0; cxi < 2; cxi++) {
      const t = cv(ts, th), x = t.getContext('2d');
      x.fillStyle = 'rgb(' + P.base.join(',') + ')'; x.fillRect(0, 0, ts, th);
      // soft overall cloud, every look
      x.globalAlpha = style === 'white' ? 0.16 : style === 'kadapa' ? 0.08 : 0.26; x.drawImage(fbm(512, R, 3, 6), 0, 0, ts, th); x.globalAlpha = 1;
      for (let i = 0; i < 10; i++) {
        const gx = R() * ts, gy = R() * th, r = ts * (0.3 + R() * 0.4);
        const g = x.createRadialGradient(gx, gy, 0, gx, gy, r);
        g.addColorStop(0, R() < 0.5 ? rgb(P.base, -26) + '0.16)' : rgb(P.base, 14) + '0.16)');
        g.addColorStop(1, style === 'kadapa' ? rgb(P.base, 0) + '0)' : 'rgba(255,255,255,0)');   // dark stone: fade to its own colour, not a white haze
        x.fillStyle = g; x.fillRect(0, 0, ts, th);
      }
      const vein = (px, py, ang, len, w, col, a, blur) => {
        const pts = [[px, py]], seg = 24, base = ang;
        for (let i = 1; i <= seg; i++) {
          ang += (R() - 0.5) * 0.28 + (base - ang) * 0.1;
          px += Math.cos(ang) * len / seg; py += Math.sin(ang) * len / seg; pts.push([px, py]);
        }
        x.lineCap = 'round'; x.lineJoin = 'round';
        for (const [wd, aa, bl] of [[4, a * 0.35, blur * 3], [1.4, a * 0.7, blur], [0.6, a, 0]]) {
          x.filter = bl ? 'blur(' + (bl * k).toFixed(2) + 'px)' : 'none';
          x.strokeStyle = 'rgba(' + col + ',' + aa + ')'; x.lineWidth = Math.max(0.6, w * wd * k);
          x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length - 1; i++) x.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
          x.stroke();
        }
        x.filter = 'none';
      };
      if (style === 'ivory') {
        // Botticino: a fine web of soft tan veins in a cloudy cream ground, low contrast
        const ang0 = 1.05 + (R() - 0.5) * 0.6;
        for (let v = 0; v < 10; v++) vein(R() * ts, -th * 0.05 + R() * th * 0.4, ang0 + (R() - 0.5) * 1.0, th * (0.4 + R() * 0.7), 2.2 + R() * 2.4, '150,118,80', 0.24 + R() * 0.14, 3.5);
        for (let i = 0; i < 260; i++) { x.fillStyle = 'rgba(176,150,112,' + (0.10 + R() * 0.15) + ')'; const r = (0.6 + R() * 2.2) * k; x.beginPath(); x.ellipse(R() * ts, R() * th, r, r * (0.5 + R() * 0.6), R() * 3, 0, 7); x.fill(); }
      } else if (style === 'travertine') {
        // vein-cut: bedding bands down the slab's length, filled pores along them
        for (let b = 0; b < 46; b++) {
          const x0 = R() * ts, w = (2 + R() * 30) * k, d = R() < 0.6 ? -22 - R() * 22 : 10 + R() * 12;
          x.fillStyle = rgb(P.base, d) + (0.12 + R() * 0.2) + ')';
          x.beginPath(); x.moveTo(x0, 0);
          let xx = x0; const pts = [];
          for (let yy = 0; yy <= th + 1; yy += th / 16) { xx += (R() - 0.5) * 6 * k; pts.push([xx, yy]); x.lineTo(xx, yy); }
          for (let i = pts.length - 1; i >= 0; i--) x.lineTo(pts[i][0] + w * (0.7 + R() * 0.6), pts[i][1]);
          x.closePath(); x.fill();
        }
        for (let i = 0; i < 520; i++) {
          const px = R() * ts, py = R() * th, rl = (2 + R() * 9) * k, rw = rl * (0.18 + R() * 0.22);
          x.fillStyle = 'rgba(150,124,92,' + (0.22 + R() * 0.25) + ')';
          x.beginPath(); x.ellipse(px, py, rw, rl, (R() - 0.5) * 0.2, 0, 7); x.fill();
        }
      } else if (style === 'limestone') {
        // fine even grain, a few faint shell fragments, almost no veining
        for (let i = 0; i < 26; i++) { const gx = R() * ts, gy = R() * th, r = ts * (0.08 + R() * 0.18); const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, rgb(P.base, -24) + '0.14)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, ts, th); }
        for (let i = 0; i < 7000; i++) { const d = R() < 0.55 ? -46 : 30; x.fillStyle = rgb(P.base, d) + (0.10 + R() * 0.18) + ')'; const r = (0.5 + R() * 1.4) * k; x.fillRect(R() * ts, R() * th, r, r); }
        for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(160,150,132,' + (0.12 + R() * 0.12) + ')'; x.lineWidth = 1.2 * k; const r = (3 + R() * 8) * k, a0 = R() * 6; x.beginPath(); x.arc(R() * ts, R() * th, r, a0, a0 + 1 + R() * 1.6); x.stroke(); }
      } else if (style === 'kadapa') {
        // honed limestone: fine even grain, a few faint pale hairline veins, no bold figure (quiet next to the ivory floor)
        for (let i = 0; i < 9000; i++) { const d = R() < 0.5 ? -15 : 13; x.fillStyle = rgb(P.base, d) + (0.10 + R() * 0.16) + ')'; const r = (0.5 + R() * 1.3) * k; x.fillRect(R() * ts, R() * th, r, r); }
        for (let v = 0; v < 4; v++) vein(R() * ts, R() * th * 0.5, 1.2 + (R() - 0.5) * 0.8, th * (0.3 + R() * 0.4), 1.0, '156,148,136', 0.10 + R() * 0.06, 2.5);
      } else {
        // soft warm-white marble: two or three gentle grey veins, nothing bold
        const ang0 = 1.1 + (R() - 0.5) * 0.5;
        for (let v = 0; v < 3; v++) vein(R() * ts * 0.8, -th * 0.05, ang0 + (R() - 0.5) * 0.3, th * (0.9 + R() * 0.4), 4.2 - v * 1.0, '128,128,134', 0.38, 4.5);
        for (let v = 0; v < 5; v++) vein(R() * ts, R() * th, ang0 + (R() - 0.5) * 1.4, th * (0.15 + R() * 0.25), 1.4, '140,140,146', 0.22, 2);
      }
      // squash the 2:3 slab into its square atlas cell, then its half-joints
      const X0 = cxi * ts, Y0 = cy * ts;
      cx.drawImage(t, 0, 0, ts, th, X0, Y0, ts, ts);
      cx.fillStyle = P.joint;
      const jw = 1.3 * (S / 2048) * 1.4, jh = jw / 1.5;           // ~1 mm each side, even after the stretch
      cx.fillRect(X0, Y0, jw, ts); cx.fillRect(X0 + ts - jw, Y0, jw, ts);
      cx.fillRect(X0, Y0, ts, jh); cx.fillRect(X0, Y0 + ts - jh, ts, jh);
      hx.fillStyle = '#5a5a5a';
      const hX = X0 / 2, hY = Y0 / 2, hs2 = ts / 2, hw = Math.max(0.8, jw / 2), hh = Math.max(0.6, jh / 2);
      hx.fillRect(hX, hY, hw, hs2); hx.fillRect(hX + hs2 - hw, hY, hw, hs2);
      hx.fillRect(hX, hY, hs2, hh); hx.fillRect(hX, hY + hs2 - hh, hs2, hh);
    }
    speckle(c, 3, R);
    return { map: c, height: h, hs: 0.9, ns: style === 'travertine' || style === 'limestone' || style === 'kadapa' ? 0.3 : 0.2 };
  }
  const floorKadapa = s => floorSlab('kadapa', s);
  const floorIvory = s => floorSlab('ivory', s), floorTravertine = s => floorSlab('travertine', s);
  const floorLimestone = s => floorSlab('limestone', s), floorWhite = s => floorSlab('white', s);

  /* ---- honed travertine: horizontal bedding + elongated pores ---- */
  function travertine(s) {
    const R = rng(41), c = cv(s), x = c.getContext('2d');
    x.fillStyle = '#ebe7e0'; x.fillRect(0, 0, s, s);
    x.globalAlpha = 0.18; x.drawImage(fbm(s, R, 3, 5), 0, 0); x.globalAlpha = 1;
    for (let i = 0; i < 40; i++) {
      const y = R() * s, hh = 3 + R() * 18;
      x.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(150,140,125,0.05)';
      x.fillRect(0, y, s, hh);
    }
    const h = cv(s >> 1), hx = h.getContext('2d');
    hx.fillStyle = '#c8c8c8'; hx.fillRect(0, 0, s >> 1, s >> 1);
    for (let i = 0; i < 260; i++) {
      const px = R() * s, py = R() * s, w = 1.5 + R() * 7, t = 0.6 + R() * 1.4;
      x.fillStyle = 'rgba(120,110,96,' + (0.12 + R() * 0.2) + ')';
      x.beginPath(); x.ellipse(px, py, w, t, 0, 0, Math.PI * 2); x.fill();
      hx.fillStyle = '#5a5a5a';
      hx.beginPath(); hx.ellipse(px / 2, py / 2, w / 2, Math.max(0.6, t / 2), 0, 0, Math.PI * 2); hx.fill();
    }
    speckle(c, 6, R);
    return { map: c, height: h, hs: 1.1, ns: 0.3 };
  }

  /* ---- woven upholstery / linen ---- */
  function weave(s) {
    const R = rng(53), c = cv(s), x = c.getContext('2d');
    x.fillStyle = '#e6e6e6'; x.fillRect(0, 0, s, s);
    const p = Math.max(3, Math.round(s / 160));
    for (let i = 0; i < s; i += p) {
      x.fillStyle = 'rgba(0,0,0,' + (0.05 + R() * 0.06) + ')'; x.fillRect(i, 0, Math.max(1, p * 0.45), s);
      x.fillStyle = 'rgba(255,255,255,' + (0.05 + R() * 0.05) + ')'; x.fillRect(0, i, s, Math.max(1, p * 0.45));
    }
    // slubs — the irregular thick threads that make linen look like linen
    for (let i = 0; i < 260; i++) {
      x.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(60,60,60,0.10)';
      x.fillRect(R() * s, R() * s, 6 + R() * 40, 1 + R() * 1.6);
    }
    x.globalAlpha = 0.08; x.drawImage(fbm(s, R, 6, 4), 0, 0); x.globalAlpha = 1;
    speckle(c, 10, R);
    const hs = s >> 1, h = cv(hs), hx = h.getContext('2d');
    hx.drawImage(c, 0, 0, hs, hs);
    return { map: c, height: h, hs: 0.9, ns: 0.5 };
  }

  /* ---- boucle / wool loop pile ---- */
  function boucle(s) {
    const R = rng(67), c = cv(s), x = c.getContext('2d');
    x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, s, s);
    const hs = s >> 1, h = cv(hs), hx = h.getContext('2d');
    hx.fillStyle = '#707070'; hx.fillRect(0, 0, hs, hs);
    const n = Math.round(s * s / 90);
    for (let i = 0; i < n; i++) {
      const px = R() * s, py = R() * s, r = 1.5 + R() * 3.5;
      const v = 190 + R() * 65;
      x.fillStyle = grey(v); x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(80,80,80,0.25)'; x.lineWidth = 0.8; x.stroke();
      hx.fillStyle = grey(140 + R() * 115); hx.beginPath(); hx.arc(px / 2, py / 2, r / 2, 0, Math.PI * 2); hx.fill();
    }
    return { map: c, height: h, hs: 1.6, ns: 0.8 };
  }

  /* ---- fluted / reeded: vertical ribs (glass shutters, timber panels) ---- */
  function fluted(s) {
    const c = cv(s), x = c.getContext('2d');
    const hs = s >> 1, h = cv(hs), hx = h.getContext('2d');
    const ribs = 24;
    for (let i = 0; i < s; i++) {
      const t = (i / s) * ribs % 1;
      const v = Math.sin(t * Math.PI);           // half-round reed profile
      x.fillStyle = grey(205 + v * 45); x.fillRect(i, 0, 1, s);
      if (i % 2 === 0) { hx.fillStyle = grey(40 + v * 200); hx.fillRect(i / 2, 0, 1, hs); }
    }
    return { map: c, height: h, hs: 2.4, ns: 0.9 };
  }

  /* ---- handmade zellige, stacked vertically (shower walls) ----
     Texture = 0.6 m: six 100 mm columns x two 300 mm rows. Every tile has
     its own tone, a soft light-to-dark glaze gradient, pooled glaze at the
     edges and a slightly uneven surface, so the light breaks across the
     wall the way a handmade glaze does. The palette colour sets the hue. */
  function zellige(s) {
    const R = rng(113), c = cv(s), x = c.getContext('2d');
    const hs = s >> 1, h = cv(hs), hx = h.getContext('2d');
    const cols = 6, rows = 2, bw = s / cols, bh = s / rows;
    const g = Math.max(2, Math.round(s / 256));
    x.fillStyle = '#f1efe9'; x.fillRect(0, 0, s, s);                // grout
    hx.fillStyle = '#262626'; hx.fillRect(0, 0, hs, hs);
    for (let r = 0; r < rows; r++) for (let cl = 0; cl < cols; cl++) {
      const x0 = cl * bw + g / 2, y0 = r * bh + g / 2, w = bw - g, th = bh - g;
      const base = 196 + R() * 40;
      const ang = R() * Math.PI * 2, dx = Math.cos(ang) * w, dy = Math.sin(ang) * th;
      const gr = x.createLinearGradient(x0 + w / 2 - dx / 2, y0 + th / 2 - dy / 2, x0 + w / 2 + dx / 2, y0 + th / 2 + dy / 2);
      gr.addColorStop(0, grey(base + 16)); gr.addColorStop(1, grey(base - 18));
      x.fillStyle = gr; x.fillRect(x0, y0, w, th);
      for (let k = 0; k < 4; k++) {                                  // glaze mottling
        const bx = x0 + R() * w, by = y0 + R() * th, br = w * (0.4 + R() * 0.8);
        const rg = x.createRadialGradient(bx, by, 0, bx, by, br);
        const lite = R() < 0.5;
        rg.addColorStop(0, lite ? 'rgba(255,255,255,0.10)' : 'rgba(40,40,40,0.09)');
        rg.addColorStop(1, 'rgba(128,128,128,0)');
        x.save(); x.beginPath(); x.rect(x0, y0, w, th); x.clip();
        x.fillStyle = rg; x.fillRect(x0, y0, w, th); x.restore();
      }
      x.strokeStyle = 'rgba(25,25,25,0.16)'; x.lineWidth = 2.5;     // glaze pooling at the edge
      x.strokeRect(x0 + 1.25, y0 + 1.25, w - 2.5, th - 2.5);
      x.strokeStyle = 'rgba(255,255,255,0.20)'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(x0 + 3, y0 + 3); x.lineTo(x0 + w - 3, y0 + 3); x.stroke();
      // uneven surface: each tile leans a little, and its rim rolls off
      const hg = hx.createLinearGradient(x0 / 2, y0 / 2, (x0 + w * (0.3 + R() * 0.7)) / 2, (y0 + th) / 2);
      const hb = 150 + R() * 50;
      hg.addColorStop(0, grey(hb + 22)); hg.addColorStop(1, grey(hb - 22));
      hx.fillStyle = hg; hx.fillRect(x0 / 2, y0 / 2, w / 2, th / 2);
      hx.strokeStyle = 'rgba(40,40,40,0.55)'; hx.lineWidth = 2;
      hx.strokeRect(x0 / 2 + 1, y0 / 2 + 1, w / 2 - 2, th / 2 - 2);
    }
    speckle(c, 5, R);
    return { map: c, height: h, hs: 1.0, ns: 0.7 };
  }

  /* ---- limewash feature wall ---- */
  function limewash(s) {
    const R = rng(79), c = cv(s), x = c.getContext('2d');
    x.fillStyle = '#e4e4e4'; x.fillRect(0, 0, s, s);
    x.globalAlpha = 0.35; x.drawImage(fbm(s, R, 3, 6), 0, 0);
    x.globalAlpha = 1;
    for (let i = 0; i < 120; i++) {
      const px = R() * s, py = R() * s;
      const rot = (R() - 0.5) * 1.2, gr = 60 + R() * 120, light = R() < 0.5;
      // paint each blob at all nine wrap offsets so the texture tiles: a blob
      // cut at the canvas edge used to leave a visible seam every tile on a
      // wall this large
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        x.save(); x.translate(px + ox * s, py + oy * s); x.rotate(rot);
        const g = x.createRadialGradient(0, 0, 0, 0, 0, gr);
        g.addColorStop(0, light ? 'rgba(255,255,255,0.10)' : 'rgba(110,110,110,0.08)');
        g.addColorStop(1, 'rgba(128,128,128,0)');
        x.fillStyle = g; x.scale(2.2, 0.8); x.beginPath(); x.arc(0, 0, 180, 0, Math.PI * 2); x.fill();
        x.restore();
      }
    }
    speckle(c, 5, R);
    return { map: c, ns: 0.2 };
  }

  /* ---- limewash PAINT for whole rooms. What makes real limewash read as
     real, and what a smooth airbrushed cloud lacks:
       - mottling at several scales at once (big clouds, hand-sized patches,
         a chalky mid-grain), mostly in VALUE, with only a small hue shift;
       - the brush: short X-strokes from a wide block brush, each a bundle
         of fine bristle streaks, with pigment collected at its edges;
       - tide marks where one coat dried against the next (thin, slightly
         darker rings);
       - a mineral tooth: per-pixel grain in colour AND relief, so grazing
         light catches it.
     Two close shades of one colour, double-loaded (C1 deeper, C2 lighter);
     lighter areas also go a touch chalkier, as lime does when it cures.
     Painted at 1024 px wherever the viewer allows 384+ (one wall finish, so
     the extra 4 MB is worth it). Wrap-tiled throughout. ---- */
  function limewashPaint(s) {
    const S = s >= 384 ? 1024 : 512;
    const R = rng(131), c = cv(S), x = c.getContext('2d');
    const h = cv(S), hx = h.getContext('2d');
    const C1 = [146, 164, 180], C2 = [178, 194, 208];          // two close shades of ONE dusty blue: far-apart colours read as blotches, not limewash
    const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    // value noise that truly wraps (the shared noise()/fbm() clamp at the canvas
    // edge, which left a hard line at every tile seam once the grain got fine)
    const field = (cells, oct) => {
      const f = new Float32Array(S * S);
      let amp = 1, cl = cells;
      for (let o = 0; o < oct; o++, amp *= 0.55, cl = Math.min(cl * 2, S)) {
        const gd = new Float32Array(cl * cl);
        for (let i = 0; i < gd.length; i++) gd[i] = R();
        const sc = cl / S;
        for (let Y = 0; Y < S; Y++) {
          const gy = Y * sc, y0 = Math.floor(gy), fy = gy - y0, ty = fy * fy * (3 - 2 * fy);
          const r0 = (y0 % cl) * cl, r1 = ((y0 + 1) % cl) * cl;
          for (let X = 0; X < S; X++) {
            const gx = X * sc, x0 = Math.floor(gx), fx = gx - x0, tx = fx * fx * (3 - 2 * fx);
            const c0 = x0 % cl, c1 = (x0 + 1) % cl;
            const a = gd[r0 + c0] + (gd[r0 + c1] - gd[r0 + c0]) * tx;
            const bb = gd[r1 + c0] + (gd[r1 + c1] - gd[r1 + c0]) * tx;
            f[Y * S + X] += amp * (a + (bb - a) * ty);
          }
        }
      }
      let m = 0, q = 0;
      for (let i = 0; i < f.length; i++) m += f[i];
      m /= f.length;
      for (let i = 0; i < f.length; i++) q += (f[i] - m) * (f[i] - m);
      const sd = Math.sqrt(q / f.length) || 1;
      for (let i = 0; i < f.length; i++) f[i] = Math.max(0, Math.min(1, 0.5 + (f[i] - m) / (sd * 4)));
      return f;
    };
    const big = field(2, 5), mid = field(6, 5), chalk = field(48, 3), tideF = field(4, 4);

    // ---- brush layer: grey 128 = no mark; strokes push lighter/darker ----
    const b = cv(S), bx = b.getContext('2d');
    bx.fillStyle = 'rgb(128,128,128)'; bx.fillRect(0, 0, S, S);
    const M = S / 2.8;                                         // px per metre (tile 2.8 m)
    bx.lineCap = 'round';
    for (let n = 0; n < 340; n++) {
      const cx = R() * S, cy = R() * S;
      const ang = (R() < 0.5 ? -0.78 : 0.78) + (R() - 0.5) * 0.7;   // the X
      const len = (0.22 + R() * 0.32) * M, wid = (0.09 + R() * 0.07) * M;
      const bow = (R() - 0.5) * 0.25 * len, tone = (R() - 0.5) * 2;  // lighter or darker pass
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
      const reach = len / 2 + wid;
      const nb = 16;
      for (let k = 0; k < nb; k++) {
        const off = (k + R()) / nb - 0.5;
        const edge = Math.abs(off) > 0.38;                    // pigment piles up at the brush edges
        const v = edge ? -0.6 - R() * 0.4 : tone * (0.5 + R() * 0.5);
        const a = (edge ? 0.06 : 0.045) + R() * 0.05;
        bx.strokeStyle = v > 0 ? 'rgba(255,255,255,' + (a * v) + ')' : 'rgba(0,0,0,' + (a * -v) + ')';
        bx.lineWidth = (2.5 + R() * 4) * (S / 1024);
        const t0 = R() * 0.15, t1 = 1 - R() * 0.15;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const px0 = cx + ox * S, py0 = cy + oy * S;
          if (px0 + reach < 0 || px0 - reach > S || py0 + reach < 0 || py0 - reach > S) continue;
          bx.beginPath();
          for (let q = 0; q <= 8; q++) {
            const t = t0 + (t1 - t0) * q / 8, al = (t - 0.5) * len;
            const ac = off * wid + bow * (1 - 4 * (t - 0.5) * (t - 0.5));
            const px = px0 + dx * al + nx * ac, py = py0 + dy * al + ny * ac;
            if (q) bx.lineTo(px, py); else bx.moveTo(px, py);
          }
          bx.stroke();
        }
      }
    }
    // soften the bristle marks (crisp 1 px lines read as scratches up close);
    // blurred at the nine wrap offsets so the tile stays seamless
    if ('filter' in bx) {
      const t = cv(S), tx = t.getContext('2d');
      tx.filter = 'blur(' + (2 * S / 1024) + 'px)';
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) tx.drawImage(b, ox * S, oy * S);
      bx.drawImage(t, 0, 0);
    }
    const bd = bx.getImageData(0, 0, S, S).data;

    // ---- compose colour + relief per pixel ----
    const img = x.createImageData(S, S), o = img.data;
    const himg = hx.createImageData(S, S), ho = himg.data;
    for (let i = 0; i < S * S; i++) {
      const br = (bd[i * 4] - 128) / 128;                      // -1..1 brush mark
      const tr = Math.pow(1 - Math.abs(2 * tideF[i] - 1), 14); // thin tide lines where tideF ~ 0.5
      let t = 0.55 * big[i] + 0.45 * mid[i] + 0.55 * br;      // which load dominates here
      t = ss(0.12, 0.88, t);
      const g = R() - 0.5;                                     // mineral grain
      const val = 1 + 0.045 * (chalk[i] - 0.5) * 2 + 0.035 * g - 0.045 * tr;
      const bloom = 0.10 * ss(0.65, 1, t);                     // cured lime goes chalky where thin
      for (let k = 0; k < 3; k++) {
        let v = (C1[k] + (C2[k] - C1[k]) * t) * val;
        v = v + (232 - v) * bloom;
        o[i * 4 + k] = Math.max(0, Math.min(255, v));
      }
      o[i * 4 + 3] = 255;
      const hv = 128 + g * 26 + br * 30 + (chalk[i] - 0.5) * 20 - tr * 14;
      ho[i * 4] = ho[i * 4 + 1] = ho[i * 4 + 2] = Math.max(0, Math.min(255, hv));
      ho[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    hx.putImageData(himg, 0, 0);
    return { map: c, height: h, hs: 1.6, ns: 0.45 };
  }

  /* ---- neutral oak grain (furniture, joinery). The viewers' own wood
     kits carry a walnut/teak cast that turned light oak orange. ---- */
  function grain(s) {
    const R = rng(97), c = cv(s), x = c.getContext('2d');
    const hs = s >> 1, h = cv(hs), hx = h.getContext('2d');
    x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, s, s);
    for (let k = 0; k < 160; k++) {
      const px = R() * s, amp = 2 + R() * 6, wv = 0.5 + R() * 2.2;
      const v = R() < 0.55 ? 150 + R() * 40 : 225 + R() * 25;
      x.strokeStyle = 'rgba(' + (v | 0) + ',' + (v | 0) + ',' + (v | 0) + ',' + (0.18 + R() * 0.3) + ')';
      x.lineWidth = wv;
      for (const off of [0, -s, s]) {
        x.beginPath(); x.moveTo(px + off, 0);
        x.bezierCurveTo(px + off + amp, s / 3, px + off - amp, 2 * s / 3, px + off, s); x.stroke();
      }
    }
    // ray flecks — the short silvery dashes that say "oak"
    for (let k = 0; k < 500; k++) {
      x.fillStyle = 'rgba(255,255,255,' + (0.06 + R() * 0.1) + ')';
      x.fillRect(R() * s, R() * s, 1 + R() * 2, 4 + R() * 14);
    }
    speckle(c, 6, R);
    hx.drawImage(c, 0, 0, hs, hs);
    return { map: c, height: h, hs: 0.5, ns: 0.25 };
  }

  const kits = { planks, marble, slab, floorMarble, floorKadapa, floorIvory, floorTravertine, floorLimestone, floorWhite, travertine, weave, boucle, fluted, limewash, limewashPaint, grain, zellige };

  /* ---- material treatments for the interior keys ----
     Fields follow the viewers' own convention: tex/tile/rough/metal/env,
     interior (warm room IBL), reflect (SSR strength, index.html). */
  const WOOD = { tex: 'grain', tile: 0.8, rough: 0.5, metal: 0, env: 0.5, reflect: 0.08, interior: true };
  const T = {
    // floors
    // tFloor is the laid marble: houseScene gives it explicit per-slab UVs
    // (2x2 slabs per texture period), so the viewers must not box-project it
    tFloor:  { tex: 'floorIvory', tile: 2.4, rough: 0.32, metal: 0, env: 0.6, reflect: 0.16, interior: true, preUV: true },
    // interior stair treads + mid-landings: honed Kadapa-style stone, per-slab UVs like tFloor
    tTread:  { tex: 'floorKadapa', tile: 2.4, rough: 0.5, metal: 0, env: 0.45, reflect: 0.08, interior: true, preUV: true },
    // one polished book-matched marble through every interior room (1.2 m slabs)
    tLiving: { tex: 'floorMarble', tile: 2.4, rough: 0.16, metal: 0, env: 0.7, reflect: 0.30, interior: true },
    tCirc:   { tex: 'floorMarble', tile: 2.4, rough: 0.16, metal: 0, env: 0.7, reflect: 0.30, interior: true },
    tKitch:  { tex: 'floorMarble', tile: 2.4, rough: 0.16, metal: 0, env: 0.7, reflect: 0.30, interior: true },
    tOffice: { tex: 'floorMarble', tile: 2.4, rough: 0.16, metal: 0, env: 0.7, reflect: 0.30, interior: true },
    tPooja:  { tex: 'floorMarble', tile: 2.4, rough: 0.16, metal: 0, env: 0.7, reflect: 0.30, interior: true },
    tBed:    { tex: 'floorMarble', tile: 2.4, rough: 0.16, metal: 0, env: 0.7, reflect: 0.30, interior: true },
    tWalk:   { tex: 'floorMarble', tile: 2.4, rough: 0.16, metal: 0, env: 0.7, reflect: 0.30, interior: true },
    tBath:   { tex: 'floorMarble', tile: 2.4, rough: 0.16, metal: 0, env: 0.7, reflect: 0.30, interior: true },
    tUtil:   { tex: 'floorMarble', tile: 2.4, rough: 0.16, metal: 0, env: 0.7, reflect: 0.30, interior: true },
    // joinery — ONE wood: every timber key (leaves, mouldings, frames, cabinets,
    // furniture, window frames) shares this treatment and one brown in the
    // viewers' COL, so no piece of joinery can read lighter or redder than another
    oak:       WOOD, oakDark: WOOD, walnutI: WOOD, walnut: WOOD, woodD: WOOD, woodF: WOOD, frame: WOOD, alu: WOOD,
    aluDark:   { rough: 0.4, metal: 0.75, env: 0.9, reflect: 0.2, interior: true },
    lacq:      { rough: 0.6, metal: 0, env: 0.45, reflect: 0.06, interior: true },
    lacqSage:  { rough: 0.62, metal: 0, env: 0.45, reflect: 0.06, interior: true },
    lacqTaupe: { rough: 0.62, metal: 0, env: 0.45, reflect: 0.06, interior: true },
    lacqNavy:  { rough: 0.5, metal: 0, env: 0.55, reflect: 0.06, interior: true },   // PU satin on mouldings
    lacqNavyDk:{ rough: 0.5, metal: 0, env: 0.55, reflect: 0.06, interior: true },   // PU satin, pilasters
    paintNavy: { rough: 0.88, metal: 0, env: 0.35, interior: true }, // matte emulsion
    fluted:    { tex: 'fluted', tile: 0.6, rough: 0.22, metal: 0, env: 0.9, reflect: 0.2, interior: true, matte: true },
    // stone
    quartz:    { tex: 'slab', tile: 1.4, rough: 0.2, metal: 0, env: 0.8, reflect: 0.25, interior: true },
    marbleV:   { tex: 'slab', tile: 2.2, rough: 0.16, metal: 0, env: 0.8, reflect: 0.28, interior: true },
    travertine:{ tex: 'travertine', tile: 1.4, rough: 0.62, metal: 0, env: 0.5, reflect: 0.06, interior: true },
    stoneDk:   { tex: 'slab', tile: 1.0, rough: 0.3, metal: 0, env: 0.7, reflect: 0.2, interior: true },
    tileBath:  { tex: 'marble', tile: 1.2, rough: 0.28, metal: 0, env: 0.7, reflect: 0.18, interior: true, matte: true },
    // skirting cut from the floor marble: same kit and tint as tFloor, but
    // box-projected (the floor itself carries explicit per-slab UVs)
    skirtTile: { tex: 'floorIvory', tile: 2.4, rough: 0.32, metal: 0, env: 0.6, reflect: 0.16, interior: true },
    tileShower:{ tex: 'zellige', tile: 0.6, rough: 0.2, metal: 0, env: 0.9, reflect: 0.3, interior: true },
    wallLime:  { tex: 'limewash', tile: 2.2, rough: 0.95, metal: 0, env: 0.35, interior: true },
    limeWash:  { tex: 'limewashPaint', tile: 2.8, rough: 0.97, metal: 0, env: 0.4, interior: true },
    // soft goods
    boucle:    { tex: 'boucle', tile: 0.22, rough: 1.0, metal: 0, env: 0.25, interior: true, matte: true },
    linen:     { tex: 'weave', tile: 0.3, rough: 0.96, metal: 0, env: 0.25, interior: true, matte: true },
    linenDk:   { tex: 'weave', tile: 0.3, rough: 0.96, metal: 0, env: 0.25, interior: true, matte: true },
    duvet:     { tex: 'weave', tile: 0.35, rough: 0.97, metal: 0, env: 0.25, interior: true, matte: true },
    sheet:     { tex: 'weave', tile: 0.4, rough: 0.92, metal: 0, env: 0.3, interior: true, matte: true },
    velvet:    { tex: 'weave', tile: 0.5, rough: 0.72, metal: 0, env: 0.35, interior: true, matte: true },
    terra:     { tex: 'weave', tile: 0.3, rough: 0.95, metal: 0, env: 0.25, interior: true, matte: true },
    rugW:      { tex: 'boucle', tile: 0.45, rough: 1.0, metal: 0, env: 0.2, interior: true, matte: true },
    rugD:      { tex: 'boucle', tile: 0.45, rough: 1.0, metal: 0, env: 0.2, interior: true, matte: true },
    artA:      { tex: 'weave', tile: 0.25, rough: 0.9, metal: 0, env: 0.3, interior: true, matte: true },
    artB:      { tex: 'weave', tile: 0.25, rough: 0.9, metal: 0, env: 0.3, interior: true, matte: true },
    artC:      { tex: 'weave', tile: 0.25, rough: 0.9, metal: 0, env: 0.3, interior: true, matte: true },
    artD:      { tex: 'weave', tile: 0.25, rough: 0.9, metal: 0, env: 0.3, interior: true, matte: true },
    // metal / misc
    leather:   { rough: 0.48, metal: 0, env: 0.6, reflect: 0.08, interior: true },
    blackM:    { rough: 0.45, metal: 0.55, env: 0.6, reflect: 0.1, interior: true },
    brassI:    { rough: 0.3, metal: 1.0, env: 1.1, reflect: 0.45, interior: true },
    // BLDC ceiling fan: gloss powder-coat white body + blades, piano-black display disc
    fanWhite:  { rough: 0.28, metal: 0, env: 0.75, reflect: 0.12, interior: true },
    fanBlack:  { rough: 0.25, metal: 0, env: 0.18, reflect: 0.06, interior: true },
    ceramic:   { rough: 0.42, metal: 0, env: 0.65, reflect: 0.1, interior: true },
    mirrorI:   { rough: 0.03, metal: 1.0, env: 1.4, reflect: 0.95, interior: true }
  };

  function treatment(name) {
    const t = T[name];
    return t ? Object.assign({}, t) : null;
  }

  return { kits, treatment, keys: Object.keys(T) };
})();
