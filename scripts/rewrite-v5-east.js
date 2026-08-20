/**
 * Version Five — REAL east elevation redesign.
 * Not paint. Massing, depth, portico structure, entry tower, shadow shelves.
 */
const fs = require('fs');
const path = require('path');
const FILE = path.resolve(__dirname, '..', 'elevations', 'version-five', 'houseScene.js');
let src = fs.readFileSync(FILE, 'utf8');

function replaceExact(label, from, to) {
  if (!src.includes(from)) throw new Error('missing: ' + label);
  src = src.replace(from, to);
  console.log('ok', label);
}

function replaceFromTo(label, start, end, insert) {
  const i0 = src.indexOf(start);
  if (i0 < 0) throw new Error('start missing: ' + label);
  const i1 = src.indexOf(end, i0);
  if (i1 < 0) throw new Error('end missing: ' + label);
  src = src.slice(0, i0) + insert + src.slice(i1);
  console.log('ok block', label, 'bytes', insert.length);
}

/* ---------- header ---------- */
replaceExact(
  'header',
  src.match(/\/\* =+\n   elevations \/ version-five[\s\S]*?={3,} \*\//)[0],
  `/* ============================================================
   elevations / version-five — EXTERIOR ONLY (Version Five)
   DESIGN: EAST ELEVATION REBUILD — "Portico Frame · Entry Tower"

   Real architectural composition (not colour swaps):
   • Three-part east wall massing (stone south · glass entry · white north)
   • Full-height charcoal ENTRY TOWER framing stacked east doors
   • Deep floating SHADOW SHELVES at every floor (450mm)
   • Portico as structure: primary beams, secondary grid, deep fascia
   • Cruciform stone/plaster piers + north screen wall
   • Lift tower as solid charcoal vertical anchor
   • Deep north main-door portal + stone cheek walls
   Cost-aware: plaster, RCC shelves, MS, limited stone cladding.
   ============================================================ */`
);

/* ---------- columns: cruciform piers + capital beam seat ---------- */
replaceExact(
  'columnsEast',
  src.match(/    function columnsEast\(bag, topH, botH\) \{[\s\S]*?\n    \}\n\n    function drawSFSlab/)[0],
  `    function columnsEast(bag, topH, botH) {
      // V5 cruciform portico piers — read as architecture, not sticks.
      if (botH === undefined || botH === null) botH = 0;
      const baseH = 0.55;
      const capH = 0.28;
      const shaftBot = botH + baseH;
      const shaftTop = Math.max(shaftBot + 0.08, topH - capH);
      for (const cy of [8720, 4290, 150]) {
        // Stone plinth block
        pb(bag, 'plinth', 16240, 16660, cy - 210, cy + 210, botH, shaftBot);
        pb(bag, 'copingLight', 16230, 16670, cy - 220, cy + 220, shaftBot - 0.05, shaftBot);
        // Cruciform shaft: main square + east/west/north/south blades
        pb(bag, 'white', 16300, 16600, cy - 150, cy + 150, shaftBot, shaftTop);
        pb(bag, 'charcoal', 16270, 16300, cy - 55, cy + 55, shaftBot, shaftTop); // west blade
        pb(bag, 'charcoal', 16600, 16650, cy - 55, cy + 55, shaftBot, shaftTop); // east blade
        pb(bag, 'charcoal', 16370, 16530, cy - 200, cy - 150, shaftBot, shaftTop); // south blade
        pb(bag, 'charcoal', 16370, 16530, cy + 150, cy + 200, shaftBot, shaftTop); // north blade
        // Capital plate + terracotta edge
        pb(bag, 'plinth', 16250, 16650, cy - 200, cy + 200, shaftTop, topH);
        pb(bag, 'accentWarm', 16260, 16640, cy - 190, cy + 190, topH - 0.06, topH);
      }
    }

    function drawSFSlab`
);

/* ---------- full facade suite from EAST through parapet ---------- */
const facade = `      // ===== EAST ELEVATION REBUILD — Portico Frame · Entry Tower =====
      (function eastFacade() {
        const EF = 12650;           // house east face
        const PORT_X1 = 17362;      // portico outer edge
        const COL_X = 16450;        // column centre line (approx)
        const ey0 = 0, ey1 = 8870;
        const roofH = L.roof - L.slabT;

        // ═══════════════════════════════════════════════════════════
        // 1. THREE-PART WALL MASSING (material composition)
        //    South third = dark stone cladding volume
        //    Centre = white wall behind tall entry tower
        //    North third = white with charcoal corner blade
        // ═══════════════════════════════════════════════════════════
        // South solid stone cladding (y 0..3400) — full storey stack, 120mm proud
        pb(eBag, 'plinth', EF - 5, EF + 120, ey0 - 30, 3400, L.f0, L.roof - 0.05);
        // Horizontal stone joints every ~1.1m (ashlar reading)
        for (let z = L.f0 + 1.05; z < L.roof - 0.3; z += 1.10) {
          pb(eBag, 'charDark', EF + 100, EF + 125, ey0, 3400, z - 0.015, z + 0.015);
        }
        // Vertical stone joint rhythm
        for (const y of [850, 1700, 2550]) {
          pb(eBag, 'charDark', EF + 100, EF + 125, y - 12, y + 12, L.f0 + 0.1, L.roof - 0.1);
        }
        // North charcoal corner blade (y 8200..8870) full height — bookend
        pb(eBag, 'charcoal', EF - 5, EF + 280, 8200, ey1 + 40, L.f0, L.roof - 0.02);
        pb(eBag, 'accentWarm', EF + 250, EF + 290, 8200, ey1 + 40, L.f0, L.f0 + 0.12);
        pb(eBag, 'accentWarm', EF + 250, EF + 290, 8200, ey1 + 40, L.roof - 0.18, L.roof - 0.02);

        // ═══════════════════════════════════════════════════════════
        // 2. DEEP FLOATING SHADOW SHELVES (450mm) — every floor datum
        //    These cast real horizontal shade lines across the whole east face
        // ═══════════════════════════════════════════════════════════
        function shadowShelf(zBot, zTop, yA, yB, proj) {
          pb(eBag, 'charDark', EF - 20, EF + proj, yA, yB, zBot, zTop);
          pb(eBag, 'accentWarm', EF + 30, EF + proj - 25, yA + 30, yB - 30, zBot - 0.04, zBot);
          // drip nose
          pb(eBag, 'charDark', EF + proj - 20, EF + proj + 15, yA - 10, yB + 10, zBot - 0.06, zTop + 0.02);
        }
        // Continuous shelves — broken only at entry tower gap (filled by tower frame)
        const shelfY = [[ey0 - 40, 5100], [7700, ey1 + 40]];
        for (const [ya, yb] of shelfY) {
          shadowShelf(L.f0 - 0.02, L.f0 + 0.14, ya, yb, 450);
          shadowShelf(L.f1 - 0.16, L.f1 - 0.01, ya, yb, 480);
          shadowShelf(L.f2 - 0.16, L.f2 - 0.01, ya, yb, 480);
          shadowShelf(L.roof - 0.18, L.roof - 0.02, ya, yb, 520);
        }
        // Through shelves at entry tower y 5100..7700 (shallower — tower takes over)
        shadowShelf(L.f0 - 0.02, L.f0 + 0.10, 5100, 7700, 200);
        shadowShelf(L.f1 - 0.12, L.f1 - 0.01, 5100, 7700, 200);
        shadowShelf(L.f2 - 0.12, L.f2 - 0.01, 5100, 7700, 200);

        // ═══════════════════════════════════════════════════════════
        // 3. FULL-HEIGHT ENTRY TOWER — the east face centrepiece
        //    Unifies GF office door + FF duplex + SF french into one vertical
        //    architectural figure (charcoal outer frame, white inner, glass stack)
        // ═══════════════════════════════════════════════════════════
        (function entryTower() {
          const y0 = 5150, y1 = 7650; // wraps all east entry doors
          const x0 = EF - 30, x1 = EF + 380; // 380mm deep frame
          // Outer charcoal frame — continuous GF to roof
          // Left jamb
          pb(eBag, 'charcoal', x0, x1, y0 - 120, y0 + 100, L.f0, L.roof - 0.02);
          // Right jamb
          pb(eBag, 'charcoal', x0, x1, y1 - 100, y1 + 120, L.f0, L.roof - 0.02);
          // Head beam at roof
          pb(eBag, 'charcoal', x0, x1 + 80, y0 - 120, y1 + 120, L.roof - 0.28, L.roof + 0.05);
          pb(eBag, 'accentWarm', x0 + 20, x1 + 60, y0 - 80, y1 + 80, L.roof - 0.32, L.roof - 0.28);
          // Base plinth of tower
          pb(eBag, 'plinth', x0, x1 + 40, y0 - 120, y1 + 120, L.f0 - 0.02, L.f0 + 0.28);
          pb(eBag, 'accentWarm', x0 + 10, x1 + 30, y0 - 90, y1 + 90, L.f0 + 0.28, L.f0 + 0.34);

          // Inner white reveal (recessed face)
          pb(eBag, 'white', EF - 10, EF + 80, y0 + 100, y1 - 100, L.f0 + 0.34, L.roof - 0.30);

          // Cross beams at each floor inside tower (horizontal charcoal)
          for (const z of [L.f1 - 0.08, L.f2 - 0.08]) {
            pb(eBag, 'charDark', EF - 15, EF + 360, y0 + 90, y1 - 90, z, z + 0.14);
            pb(eBag, 'accentWarm', EF + 40, EF + 340, y0 + 120, y1 - 120, z - 0.04, z);
          }

          // Vertical glass "light slot" flanks beside doors (fixed glazing strips)
          // Left light slot
          pb(eBag, 'frame', EF + 85, EF + 110, y0 + 140, y0 + 280, L.f0 + 0.40, L.roof - 0.35);
          pb(eBag, 'glass', EF + 110, EF + 125, y0 + 155, y0 + 265, L.f0 + 0.50, L.roof - 0.45);
          // Right light slot
          pb(eBag, 'frame', EF + 85, EF + 110, y1 - 280, y1 - 140, L.f0 + 0.40, L.roof - 0.35);
          pb(eBag, 'glass', EF + 110, EF + 125, y1 - 265, y1 - 155, L.f0 + 0.50, L.roof - 0.45);

          // Deep canopies projecting from tower at each entry level
          function towerCanopy(z, yA, yB, proj) {
            pb(eBag, 'charDark', EF + 50, EF + proj, yA, yB, z + 2.42, z + 2.58);
            pb(eBag, 'accentWarm', EF + 80, EF + proj - 30, yA + 40, yB - 40, z + 2.32, z + 2.42);
            pb(eBag, 'lamp', EF + 120, EF + proj - 80, yA + 100, yB - 100, z + 2.30, z + 2.32);
            pb(eBag, 'charDark', EF + proj - 25, EF + proj + 20, yA - 20, yB + 20, z + 2.28, z + 2.62);
            // side blades hanging down
            pb(eBag, 'charcoal', EF + 60, EF + 200, yA - 50, yA + 20, z + 1.60, z + 2.58);
            pb(eBag, 'charcoal', EF + 60, EF + 200, yB - 20, yB + 50, z + 1.60, z + 2.58);
          }
          towerCanopy(L.f0, 5380, 6980, 1100); // GF office
          towerCanopy(L.f1, 5280, 7520, 1200); // FF duplex wider
          towerCanopy(L.f2, 5480, 7340, 1000); // SF french

          // Terracotta vertical accent strips on outer jambs
          pb(eBag, 'accentWarm', x1 - 25, x1 + 15, y0 - 100, y0 + 80, L.f0 + 0.40, L.roof - 0.30);
          pb(eBag, 'accentWarm', x1 - 25, x1 + 15, y1 - 80, y1 + 100, L.f0 + 0.40, L.roof - 0.30);
        })();

        // Window surrounds on remaining east openings (kitchen etc.) — deep box frames
        function boxSurround(c, w, sill, h, floorY) {
          const ya = c - w / 2, yb = c + w / 2;
          const hBot = floorY + sill / 1000;
          const hTop = hBot + h / 1000;
          const depth = 180;
          // deep charcoal box
          pb(eBag, 'charDark', EF - 15, EF + depth, ya - 100, ya - 15, hBot - 0.08, hTop + 0.10);
          pb(eBag, 'charDark', EF - 15, EF + depth, yb + 15, yb + 100, hBot - 0.08, hTop + 0.10);
          pb(eBag, 'charDark', EF - 15, EF + depth, ya - 100, yb + 100, hTop + 0.02, hTop + 0.12);
          if (sill > 80) {
            pb(eBag, 'charDark', EF - 15, EF + depth + 40, ya - 100, yb + 100, hBot - 0.10, hBot);
            pb(eBag, 'accentWarm', EF + 20, EF + depth + 30, ya - 60, yb + 60, hBot - 0.02, hBot + 0.03);
          }
        }
        // Only non-entry openings get box surrounds (entry is in tower)
        for (const o of OPEN.f0.E) {
          if (o.c < 5000 || o.c > 7800) boxSurround(o.c, o.w, o.sill || 0, o.h, L.f0);
        }
        for (const o of OPEN.f1.E) {
          if (o.c < 2000 || (o.c > 2000 && o.c < 5000) || o.c > 8200) {
            if (Math.abs(o.c - 6180) > 400 && Math.abs(o.c - 7010) > 400)
              boxSurround(o.c, o.w, o.sill || 0, o.h, L.f1);
          }
        }
        for (const o of OPEN.f2.E) {
          if (Math.abs(o.c - 6410) > 500) boxSurround(o.c, o.w, o.sill || 0, o.h, L.f2);
        }

        // ═══════════════════════════════════════════════════════════
        // 4. PORTICO STRUCTURE — beams, fascia, soffit grid
        // ═══════════════════════════════════════════════════════════
        (function porticoStructure() {
          const zBeam = roofH - 0.02;
          const zBeamBot = zBeam - 0.38;
          const zSec = zBeam - 0.22;

          // Outer deep fascia (portico east edge) — strong skyline
          pb(eBag, 'charDark', PORT_X1 - 180, PORT_X1 + 60, -900, 9100, zBeamBot - 0.08, zBeam + 0.12);
          pb(eBag, 'accentWarm', PORT_X1 - 160, PORT_X1 + 40, -880, 9080, zBeamBot - 0.14, zBeamBot - 0.08);
          // North & south portico edge fascias
          pb(eBag, 'charDark', EF + 50, PORT_X1 + 40, -900, -720, zBeamBot - 0.05, zBeam + 0.10);
          pb(eBag, 'charDark', EF + 50, PORT_X1 + 40, 8950, 9100, zBeamBot - 0.05, zBeam + 0.10);

          // Primary longitudinal beam on column line (N–S)
          pb(eBag, 'charcoal', 16320, 16580, -400, 9100, zBeamBot, zBeam);
          pb(eBag, 'accentWarm', 16340, 16560, -350, 9050, zBeamBot - 0.05, zBeamBot);

          // Primary beam at house face (wall plate)
          pb(eBag, 'charcoal', EF - 40, EF + 220, -400, 9100, zBeamBot, zBeam);

          // Cross beams (E–W) at regular rhythm — structural grid
          const crossYs = [150, 1200, 2400, 3600, 4290, 5400, 6600, 7800, 8720];
          for (const cy of crossYs) {
            pb(eBag, 'charDark', EF + 100, PORT_X1 - 40, cy - 90, cy + 90, zSec, zBeam);
          }

          // Secondary soffit ribs (lighter) between cross beams
          for (let y = 400; y < 8800; y += 700) {
            if (crossYs.some(c => Math.abs(c - y) < 200)) continue;
            pb(eBag, 'charDark', EF + 200, PORT_X1 - 100, y - 35, y + 35, zBeam - 0.12, zBeam - 0.02);
          }

          // Mid-height portico beam at FF slab (horizontal datum across portico)
          pb(eBag, 'charDark', EF + 80, PORT_X1 - 60, -500, 9050, L.f1 - 0.20, L.f1 - 0.02);
          pb(eBag, 'copingLight', EF + 100, PORT_X1 - 80, -480, 9030, L.f1 - 0.02, L.f1 + 0.03);
          // Mid beam at SF
          pb(eBag, 'charDark', EF + 80, PORT_X1 - 60, -500, 9050, L.f2 - 0.20, L.f2 - 0.02);
          pb(eBag, 'copingLight', EF + 100, PORT_X1 - 80, -480, 9030, L.f2 - 0.02, L.f2 + 0.03);

          // Vertical hanging fins from roof fascia (east edge screen rhythm)
          for (let y = 200; y < 8800; y += 900) {
            pb(eBag, 'charcoal', PORT_X1 - 100, PORT_X1 + 40, y - 50, y + 50, zBeamBot - 0.85, zBeamBot);
          }

          // North portico SCREEN WALL (privacy + composition) — between north column and house
          // Solid charcoal wall with vertical MS jaali upper band
          pb(eBag, 'charcoal', EF + 50, 15800, 8600, 9000, L.porticoFl, L.f1 - 0.15);
          pb(eBag, 'plinth', EF + 40, 15810, 8580, 9020, L.porticoFl, L.porticoFl + 0.35);
          // Jaali upper half of screen
          for (let x = EF + 200; x < 15700; x += 160) {
            pb(eBag, 'ms', x - 18, x + 18, 8980, 9010, L.f0 + 1.4, L.f1 - 0.25);
          }
          for (let z = L.f0 + 1.5; z < L.f1 - 0.3; z += 0.28) {
            pb(eBag, 'ms', EF + 180, 15700, 8985, 9010, z - 0.015, z + 0.015);
          }
          // Cap on screen
          pb(eBag, 'accentWarm', EF + 40, 15810, 8570, 9030, L.f1 - 0.15, L.f1 - 0.05);

          // South portico low planter wall (y ~200..900)
          pb(eBag, 'plinth', EF + 200, 15800, 200, 700, L.porticoFl, L.porticoFl + 0.55);
          pb(eBag, 'accentWarm', EF + 210, 15790, 210, 690, L.porticoFl + 0.55, L.porticoFl + 0.62);
          pb(eBag, 'charDark', EF + 250, 15750, 250, 650, L.porticoFl + 0.62, L.porticoFl + 0.72);

          // Connecting beam between columns at mid height (ties piers)
          for (const z of [L.f1 + 0.05, L.f2 + 0.05]) {
            pb(eBag, 'charDark', 16340, 16560, 150, 8720, z, z + 0.12);
          }
        })();

        // ═══════════════════════════════════════════════════════════
        // 5. LIFT TOWER — solid charcoal vertical monument
        // ═══════════════════════════════════════════════════════════
        (function liftMonument() {
          // Extra cladding shell proud of existing lift (lift already charcoal)
          const lx0 = 12640, lx1 = 14300, ly0 = -40, ly1 = 2100;
          // Outer vertical fin on SE corner of lift
          pb(eBag, 'charDark', lx1 - 40, lx1 + 200, ly0, ly0 + 180, 0, L.liftTop + 0.1);
          pb(eBag, 'accentWarm', lx1 + 160, lx1 + 210, ly0 + 10, ly0 + 170, 0.2, L.liftTop);
          // Horizontal slot bands on east face of lift (rhythm)
          for (let z = 1.2; z < L.liftTop - 0.5; z += 1.15) {
            pb(eBag, 'accentWarm', lx1 - 10, lx1 + 90, 400, 1800, z, z + 0.08);
            pb(eBag, 'glass', lx1 + 90, lx1 + 100, 450, 1750, z + 0.01, z + 0.07);
          }
          // Crown plate
          pb(eBag, 'charDark', lx0 - 50, lx1 + 220, ly0 - 50, ly1 + 50, L.liftTop, L.liftTop + 0.18);
          pb(eBag, 'accentWarm', lx0 - 40, lx1 + 200, ly0 - 40, ly1 + 40, L.liftTop + 0.18, L.liftTop + 0.24);
        })();

        // ═══════════════════════════════════════════════════════════
        // 6. BALCONY EDGE PARAPETS on upper east decks (solid, not stick rails only)
        //    Low solid charcoal parapet + steel top rail — more architectural
        // ═══════════════════════════════════════════════════════════
        (function eastBalconyEdges() {
          for (const fY of [L.f1, L.f2]) {
            // Outer east edge solid parapet strip
            pb(eBag, 'charcoal', PORT_X1 - 120, PORT_X1 - 20, 3900, 8800, fY, fY + 0.72);
            pb(eBag, 'steel', PORT_X1 - 130, PORT_X1 - 10, 3890, 8810, fY + 0.72, fY + 0.82);
            pb(eBag, 'accentWarm', PORT_X1 - 125, PORT_X1 - 15, 3900, 8800, fY + 0.82, fY + 0.88);
          }
        })();

        // South stone volume — deep window boxes already via boxSurround for kitchen win
        // Add vertical charcoal fin separating south stone mass from entry tower
        pb(eBag, 'charcoal', EF - 10, EF + 320, 3320, 3480, L.f0, L.roof - 0.05);
        pb(eBag, 'accentWarm', EF + 280, EF + 330, 3310, 3490, L.f0 + 0.2, L.roof - 0.15);
      })();

      // ===== PERIMETER DATUMS (N/S/W) — bold enough to match east shelves =====
      (function perimeterBands() {
        const datums = [
          [L.f0 - 0.02, L.f0 + 0.12, L.f0 + 0.12, L.f0 + 0.16],
          [L.f1 - 0.16, L.f1 - 0.02, L.f1 - 0.02, L.f1 + 0.02],
          [L.f2 - 0.16, L.f2 - 0.02, L.f2 - 0.02, L.f2 + 0.02],
          [L.roof - 0.16, L.roof - 0.02, L.roof - 0.02, L.roof + 0.02]
        ];
        const serviceWallBot = L.f1 - 0.05;
        const serviceWallTop = L.f2 + 0.05;
        for (const [bh0, bh1, ch0, ch1] of datums) {
          pb(eBag, 'charDark', 200, 12420, Y1n - 20, Y1n + 200, bh0, bh1);
          pb(eBag, 'copingLight', 190, 12430, Y1n - 25, Y1n + 210, ch0, ch1);
          pb(eBag, 'charDark', 200, 4800, -200, 20, bh0, bh1);
          pb(eBag, 'copingLight', 190, 4810, -210, 25, ch0, ch1);
          if (bh0 >= serviceWallBot && bh1 <= serviceWallTop) {
            pb(eBag, 'charDark', 4920, 12420, -762 - 200, -762 + 20, bh0, bh1);
            pb(eBag, 'copingLight', 4910, 12430, -762 - 210, -762 + 25, ch0, ch1);
          }
          pb(eBag, 'charDark', -200, 20, 200, 8640, bh0, bh1);
          pb(eBag, 'copingLight', -210, 25, 190, 8650, ch0, ch1);
        }
      })();

      // ===== NORTH FACADE — monumental main entry =====
      (function northFacade() {
        const NF = Y1n;
        // Full-height charcoal wing walls flanking main door
        // Door c=8650 w=1200 → 8050..9250
        pb(eBag, 'charcoal', 7600, 8000, NF - 20, NF + 350, L.f0, L.roof - 0.05);
        pb(eBag, 'charcoal', 9300, 9700, NF - 20, NF + 350, L.f0, L.roof - 0.05);
        // Stone base on wings
        pb(eBag, 'plinth', 7580, 8020, NF - 30, NF + 360, L.f0 - 0.02, L.f0 + 0.45);
        pb(eBag, 'plinth', 9280, 9720, NF - 30, NF + 360, L.f0 - 0.02, L.f0 + 0.45);
        // Deep portal recess
        pb(eBag, 'charDark', 8000, 9300, NF - 25, NF + 120, L.f0, L.f0 + 2.70);
        pb(eBag, 'accentWarm', 8050, 9250, NF + 100, NF + 140, L.f0 + 0.15, L.f0 + 2.55);
        // Massive floating canopy
        pb(eBag, 'charDark', 7550, 9750, NF - 30, NF + 1100, L.f0 + 2.55, L.f0 + 2.72);
        pb(eBag, 'accentWarm', 7600, 9700, NF + 50, NF + 1050, L.f0 + 2.42, L.f0 + 2.55);
        pb(eBag, 'lamp', 8100, 9200, NF + 120, NF + 950, L.f0 + 2.40, L.f0 + 2.42);
        pb(eBag, 'charDark', 7520, 9780, NF + 1060, NF + 1120, L.f0 + 2.38, L.f0 + 2.78);
        // Hanging side blades under canopy
        pb(eBag, 'charcoal', 7600, 7800, NF + 50, NF + 280, L.f0 + 1.40, L.f0 + 2.72);
        pb(eBag, 'charcoal', 9500, 9700, NF + 50, NF + 280, L.f0 + 1.40, L.f0 + 2.72);
        // Horizontal shelf continuous on north face
        for (const [zb, zt, proj] of [
          [L.f1 - 0.16, L.f1 - 0.01, 350],
          [L.f2 - 0.16, L.f2 - 0.01, 350],
          [L.roof - 0.18, L.roof - 0.02, 400]
        ]) {
          pb(eBag, 'charDark', 200, 12400, NF - 20, NF + proj, zb, zt);
          pb(eBag, 'accentWarm', 250, 12350, NF + 40, NF + proj - 30, zb - 0.04, zb);
        }
        // Window box surrounds on north openings
        function nBox(c, w, sill, h, floorY) {
          if (c > 8000 && c < 9300 && floorY < L.f0 + 0.1) return; // skip main door
          const xa = c - w / 2, xb = c + w / 2;
          const hBot = floorY + sill / 1000, hTop = hBot + h / 1000;
          pb(eBag, 'charDark', xa - 90, xa - 15, NF - 15, NF + 160, hBot - 0.08, hTop + 0.10);
          pb(eBag, 'charDark', xb + 15, xb + 90, NF - 15, NF + 160, hBot - 0.08, hTop + 0.10);
          pb(eBag, 'charDark', xa - 90, xb + 90, NF - 15, NF + 160, hTop + 0.02, hTop + 0.12);
          if (sill > 80) {
            pb(eBag, 'charDark', xa - 90, xb + 90, NF - 15, NF + 180, hBot - 0.10, hBot);
            pb(eBag, 'accentWarm', xa - 50, xb + 50, NF + 20, NF + 170, hBot - 0.02, hBot + 0.03);
          }
        }
        for (const o of OPEN.f0.N) nBox(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.N) nBox(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.N) nBox(o.c, o.w, o.sill || 0, o.h, L.f2);
      })();

      // ===== PORTICO LIGHTS =====
      (function porticoLights() {
        const t0 = L.porticoFl + 0.016;
        for (const cy of [8720, 4290, 150]) {
          pb(eBag, 'steel', 16230, 16280, cy - 40, cy + 40, t0, t0 + 0.05);
          pb(eBag, 'lamp', 16238, 16272, cy - 30, cy + 30, t0 + 0.04, t0 + 0.09);
          pb(eBag, 'steel', 16620, 16670, cy - 40, cy + 40, t0, t0 + 0.05);
          pb(eBag, 'lamp', 16628, 16662, cy - 30, cy + 30, t0 + 0.04, t0 + 0.09);
        }
        // Beam under-glow strips on primary cross beams
        for (const cy of [150, 4290, 8720]) {
          pb(eBag, 'lamp', 14000, 16000, cy - 40, cy + 40, L.roof - L.slabT - 0.45, L.roof - L.slabT - 0.42);
        }
        for (const fl of [L.porticoFl, L.f1, L.f2]) {
          for (const [x0, x1] of [[12720, 12800], [13890, 13970]]) {
            pb(eBag, 'charDark', x0, x1, 2035, 2120, fl + 1.55, fl + 1.95);
            pb(eBag, 'lamp', x0 + 12, x1 - 12, 2110, 2145, fl + 1.62, fl + 1.85);
          }
        }
      })();

      // ===== SOUTH FACADE — deep shelves + window boxes =====
      (function southFacade() {
        const SF = 0;
        for (const [zb, zt, proj] of [
          [L.f0 - 0.02, L.f0 + 0.12, 320],
          [L.f1 - 0.16, L.f1 - 0.01, 380],
          [L.f2 - 0.16, L.f2 - 0.01, 380],
          [L.roof - 0.18, L.roof - 0.02, 420]
        ]) {
          pb(eBag, 'charDark', 200, 4800, SF - proj, SF + 20, zb, zt);
          pb(eBag, 'accentWarm', 250, 4750, SF - proj + 30, SF - 20, zb - 0.04, zb);
        }
        function sBox(c, w, sill, h, floorY) {
          const xa = c - w / 2, xb = c + w / 2;
          const hBot = floorY + sill / 1000, hTop = hBot + h / 1000;
          pb(eBag, 'charDark', xa - 80, xa - 12, SF - 170, SF + 15, hBot - 0.08, hTop + 0.10);
          pb(eBag, 'charDark', xb + 12, xb + 80, SF - 170, SF + 15, hBot - 0.08, hTop + 0.10);
          pb(eBag, 'charDark', xa - 80, xb + 80, SF - 170, SF + 15, hTop + 0.02, hTop + 0.12);
          if (sill > 80) {
            pb(eBag, 'charDark', xa - 80, xb + 80, SF - 190, SF + 15, hBot - 0.10, hBot);
            pb(eBag, 'accentWarm', xa - 50, xb + 50, SF - 180, SF - 20, hBot - 0.02, hBot + 0.03);
          }
        }
        for (const o of OPEN.f0.S) if (o.c < 7000) sBox(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.S) sBox(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.S) if (o.c < 7000 || o.type === 'win') sBox(o.c, o.w, o.sill || 0, o.h, L.f2);
        // Stone cladding bay on south bedroom stretch (GF band)
        pb(eBag, 'plinth', 600, 2200, SF - 80, SF + 30, L.f0 + 0.2, L.f1 - 0.2);
      })();

      // ===== WEST FACADE — shade fins + deep shelves =====
      (function westFacade() {
        const WF = 0;
        for (const [zb, zt, proj] of [
          [L.f0 - 0.02, L.f0 + 0.12, 320],
          [L.f1 - 0.16, L.f1 - 0.01, 380],
          [L.f2 - 0.16, L.f2 - 0.01, 380],
          [L.roof - 0.18, L.roof - 0.02, 420]
        ]) {
          pb(eBag, 'charDark', WF - proj, WF + 20, 200, 8640, zb, zt);
          pb(eBag, 'accentWarm', WF - proj + 30, WF - 20, 250, 8590, zb - 0.04, zb);
        }
        // Three deep vertical shade fins
        for (const fy of [1100, 4800, 7200]) {
          pb(eBag, 'charcoal', WF - 350, WF + 15, fy - 100, fy + 100, L.f0 + 0.15, L.roof - 0.12);
          pb(eBag, 'accentWarm', WF - 360, WF + 20, fy - 110, fy + 110, L.roof - 0.12, L.roof - 0.04);
          pb(eBag, 'plinth', WF - 360, WF + 20, fy - 110, fy + 110, L.f0, L.f0 + 0.20);
        }
        function wBox(c, w, sill, h, floorY) {
          const ya = c - w / 2, yb = c + w / 2;
          const hBot = floorY + sill / 1000, hTop = hBot + h / 1000;
          pb(eBag, 'charDark', WF - 170, WF + 15, ya - 80, ya - 12, hBot - 0.08, hTop + 0.10);
          pb(eBag, 'charDark', WF - 170, WF + 15, yb + 12, yb + 80, hBot - 0.08, hTop + 0.10);
          pb(eBag, 'charDark', WF - 170, WF + 15, ya - 80, yb + 80, hTop + 0.02, hTop + 0.12);
          if (sill > 80) {
            pb(eBag, 'charDark', WF - 190, WF + 15, ya - 80, yb + 80, hBot - 0.10, hBot);
            pb(eBag, 'accentWarm', WF - 180, WF - 20, ya - 50, yb + 50, hBot - 0.02, hBot + 0.03);
          }
        }
        for (const o of OPEN.f0.W) wBox(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.W) wBox(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.W) wBox(o.c, o.w, o.sill || 0, o.h, L.f2);
      })();

      // ===== PARAPET CROWN — deep outer fascia matching portico =====
      (function parapetSkyline() {
        const pt = L.parapetTop;
        // Heavier outer crown
        pb(eBag, 'charDark', X0 - 40, eastX[1] + 80, -820, -560, pt - 0.05, pt + 0.12);
        pb(eBag, 'charDark', X0 - 40, eastX[1] + 80, 9660, 9950, pt - 0.05, pt + 0.12);
        pb(eBag, 'charDark', X0 - 80, 200, -820, 9950, pt - 0.05, pt + 0.12);
        pb(eBag, 'charDark', eastX[1] - 80, eastX[1] + 80, -820, 9950, pt - 0.05, pt + 0.12);
        pb(eBag, 'accentWarm', X0 - 35, eastX[1] + 70, -810, -570, pt + 0.12, pt + 0.18);
        pb(eBag, 'accentWarm', X0 - 35, eastX[1] + 70, 9670, 9940, pt + 0.12, pt + 0.18);
        pb(eBag, 'accentWarm', X0 - 70, 190, -810, 9940, pt + 0.12, pt + 0.18);
        pb(eBag, 'accentWarm', eastX[1] - 70, eastX[1] + 70, -810, 9940, pt + 0.12, pt + 0.18);
      })();

`;

replaceFromTo(
  'facade suite',
  '      // ===== EAST FACADE',
  '    })();\n    const exterior = eBag.build(THREE, materials); exterior.name = \'exterior\'; root.add(exterior);',
  facade
);

/* Update viewer label */
const idx = path.resolve(__dirname, '..', 'elevations', 'version-five', 'index.html');
let html = fs.readFileSync(idx, 'utf8');
html = html.replace(
  /<p>LIME · LATERITE · SHADE<\/p>/,
  '<p>PORTICO FRAME · ENTRY TOWER</p>'
);
html = html.replace(
  /VERSION FIVE · DESIGNED/,
  'VERSION FIVE · EAST REBUILD'
);
html = html.replace(
  /LIME · LATERITE · SHADE · PREPARING/,
  'EAST ELEVATION REBUILD · PREPARING'
);
fs.writeFileSync(idx, html);

fs.writeFileSync(FILE, src);
console.log('wrote', FILE);
console.log('lines', src.split('\n').length);
