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

  const kits = { planks, marble, slab, travertine, weave, boucle, fluted, limewash, grain };

  /* ---- material treatments for the interior keys ----
     Fields follow the viewers' own convention: tex/tile/rough/metal/env,
     interior (warm room IBL), reflect (SSR strength, index.html). */
  const T = {
    // floors
    tLiving: { tex: 'marble', tile: 1.6, rough: 0.24, metal: 0, env: 0.62, reflect: 0.22, interior: true },
    tCirc:   { tex: 'marble', tile: 1.6, rough: 0.24, metal: 0, env: 0.62, reflect: 0.22, interior: true },
    tKitch:  { tex: 'marble', tile: 1.6, rough: 0.26, metal: 0, env: 0.6, reflect: 0.2, interior: true },
    tOffice: { tex: 'marble', tile: 1.6, rough: 0.26, metal: 0, env: 0.6, reflect: 0.2, interior: true },
    tPooja:  { tex: 'marble', tile: 1.2, rough: 0.30, metal: 0, env: 0.6, reflect: 0.18, interior: true },
    tBed:    { tex: 'planks', tile: 1.2, rough: 0.52, metal: 0, env: 0.45, reflect: 0.10, interior: true },
    tWalk:   { tex: 'planks', tile: 1.2, rough: 0.52, metal: 0, env: 0.45, reflect: 0.10, interior: true },
    tBath:   { tex: 'marble', tile: 1.2, rough: 0.42, metal: 0, env: 0.5, reflect: 0.10, interior: true, matte: true },
    tUtil:   { tex: 'marble', tile: 1.2, rough: 0.48, metal: 0, env: 0.45, reflect: 0.06, interior: true, matte: true },
    // joinery
    oak:       { tex: 'grain', tile: 0.8, rough: 0.55, metal: 0, env: 0.5, reflect: 0.08, interior: true },
    oakDark:   { tex: 'grain', tile: 0.8, rough: 0.5, metal: 0, env: 0.5, reflect: 0.08, interior: true },
    alu:       { rough: 0.34, metal: 0.9, env: 1.0, reflect: 0.3, interior: true },
    aluDark:   { rough: 0.4, metal: 0.75, env: 0.9, reflect: 0.2, interior: true },
    lacq:      { rough: 0.6, metal: 0, env: 0.45, reflect: 0.06, interior: true },
    lacqSage:  { rough: 0.62, metal: 0, env: 0.45, reflect: 0.06, interior: true },
    lacqTaupe: { rough: 0.62, metal: 0, env: 0.45, reflect: 0.06, interior: true },
    lacqNavy:  { rough: 0.5, metal: 0, env: 0.55, reflect: 0.06, interior: true },   // PU satin on mouldings
    lacqNavyDk:{ rough: 0.5, metal: 0, env: 0.55, reflect: 0.06, interior: true },   // PU satin, pilasters
    paintNavy: { rough: 0.88, metal: 0, env: 0.35, interior: true }, // matte emulsion
    walnutI:   { tex: 'grain', tile: 0.7, rough: 0.48, metal: 0, env: 0.5, reflect: 0.08, interior: true },
    fluted:    { tex: 'fluted', tile: 0.6, rough: 0.22, metal: 0, env: 0.9, reflect: 0.2, interior: true, matte: true },
    // stone
    quartz:    { tex: 'slab', tile: 1.4, rough: 0.2, metal: 0, env: 0.8, reflect: 0.25, interior: true },
    marbleV:   { tex: 'slab', tile: 2.2, rough: 0.16, metal: 0, env: 0.8, reflect: 0.28, interior: true },
    travertine:{ tex: 'travertine', tile: 1.4, rough: 0.62, metal: 0, env: 0.5, reflect: 0.06, interior: true },
    stoneDk:   { tex: 'slab', tile: 1.0, rough: 0.3, metal: 0, env: 0.7, reflect: 0.2, interior: true },
    tileBath:  { tex: 'marble', tile: 1.2, rough: 0.28, metal: 0, env: 0.7, reflect: 0.18, interior: true, matte: true },
    wallLime:  { tex: 'limewash', tile: 2.2, rough: 0.95, metal: 0, env: 0.35, interior: true },
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
    ceramic:   { rough: 0.42, metal: 0, env: 0.65, reflect: 0.1, interior: true },
    mirrorI:   { rough: 0.03, metal: 1.0, env: 1.4, reflect: 0.95, interior: true }
  };

  function treatment(name) {
    const t = T[name];
    return t ? Object.assign({}, t) : null;
  }

  return { kits, treatment, keys: Object.keys(T) };
})();
