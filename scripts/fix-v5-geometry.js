/**
 * Fix Version Five geometry mistakes:
 * - solids covering doors/windows
 * - beams through lift / stair void
 * - tower overlapping office window
 * - screen/planter hitting columns
 * - west fins through openings
 * - north wings covering hall window
 * - double-fill over door openings
 *
 * Keeps the strong design language with correct clearances.
 */
const fs = require('fs');
const path = require('path');
const FILE = path.resolve(__dirname, '..', 'elevations', 'version-five', 'houseScene.js');
let src = fs.readFileSync(FILE, 'utf8');

function replaceFromTo(label, start, end, insert) {
  const i0 = src.indexOf(start);
  if (i0 < 0) throw new Error('start missing: ' + label);
  const i1 = src.indexOf(end, i0);
  if (i1 < 0) throw new Error('end missing: ' + label);
  src = src.slice(0, i0) + insert + src.slice(i1);
  console.log('ok', label);
}

/* Smaller, cleaner columns — less collision with beams */
const columns = `    function columnsEast(bag, topH, botH) {
      // V5 portico piers: stone base, white shaft, charcoal edge, stone capital.
      // Sized to clear mid beams (beams land on capital faces, not through shafts).
      if (botH === undefined || botH === null) botH = 0;
      const baseH = 0.48;
      const capH = 0.22;
      const shaftBot = botH + baseH;
      const shaftTop = Math.max(shaftBot + 0.08, topH - capH);
      for (const cy of [8720, 4290, 150]) {
        pb(bag, 'plinth', 16270, 16630, cy - 180, cy + 180, botH, shaftBot);
        pb(bag, 'copingLight', 16260, 16640, cy - 190, cy + 190, shaftBot - 0.04, shaftBot);
        // Main shaft
        pb(bag, 'white', 16310, 16590, cy - 140, cy + 140, shaftBot, shaftTop);
        // Thin east face accent only (does not widen N/S into beams)
        pb(bag, 'charcoal', 16590, 16625, cy - 50, cy + 50, shaftBot, shaftTop);
        // Capital
        pb(bag, 'plinth', 16280, 16620, cy - 170, cy + 170, shaftTop, topH);
        pb(bag, 'accentWarm', 16290, 16610, cy - 160, cy + 160, topH - 0.05, topH);
      }
    }

`;

// Replace columnsEast function body via marker
{
  const start = '    function columnsEast(bag, topH, botH) {';
  const end = '    function drawSFSlab';
  const i0 = src.indexOf(start);
  const i1 = src.indexOf(end);
  if (i0 < 0 || i1 < 0) throw new Error('columnsEast markers missing');
  // Keep from drawSFSlab onward intact
  src = src.slice(0, i0) + columns + src.slice(i1);
  console.log('ok columnsEast');
}

/*
  East openings (c along y):
  GF: door 5580-6780 | win 6960-8460 | kit 2100-3300
  FF: grill -600-0 | door 5580-6780 | side 6785-7235 | kit 2600-3800 | pooja 7805-8255
  SF: french 5585-7235 | bed 2600-3800

  Lift: x 12650-14270, y 0-2035
  Stair void: x 14270-15400, y ~1040-3890
  Columns: y 150, 4290, 8720 at x ~16300-16600
  Portico outer x 17362
  House east face EF=12650
*/

const facade = `      // ===== EAST ELEVATION (geometry-corrected) =====
      (function eastFacade() {
        const EF = 12650;
        const PORT_X1 = 17362;
        const LIFT_EX = 14270;
        const VOID_WX = 14270, VOID_EX = 15400;
        const COL_YS = [150, 4290, 8720];
        const roofH = L.roof - L.slabT;

        // Opening helpers (east face: centre c along y)
        function leaf(c, w) { return [c - w / 2, c + w / 2]; }
        function overlaps(a0, a1, b0, b1, pad) {
          pad = pad || 0;
          return !(a1 + pad < b0 || a0 - pad > b1);
        }
        // All east glazed leaves to keep clear of solid cladding
        const EAST_LEAVES = [];
        for (const [sch, fY] of [[OPEN.f0.E, L.f0], [OPEN.f1.E, L.f1], [OPEN.f2.E, L.f2]]) {
          for (const o of sch) {
            const [y0, y1] = leaf(o.c, o.w);
            EAST_LEAVES.push({
              y0: y0, y1: y1,
              z0: fY + (o.sill || 0) / 1000 - 0.05,
              z1: fY + (o.sill || 0) / 1000 + o.h / 1000 + 0.08
            });
          }
        }
        function hitsOpening(y0, y1, z0, z1, padY, padZ) {
          padY = padY == null ? 80 : padY;
          padZ = padZ == null ? 0.04 : padZ;
          for (const Lf of EAST_LEAVES) {
            if (overlaps(y0, y1, Lf.y0, Lf.y1, padY) && overlaps(z0, z1, Lf.z0, Lf.z1, padZ)) return true;
          }
          return false;
        }

        // ── 1. Stone cladding panels on SOUTH third — ONLY solid wall (not over glass) ──
        // Kitchen GF win 2100-3300, FF/SF kit 2600-3800 → stone only in clear bands
        (function southStone() {
          const bands = [
            [40, 1950],    // below kitchen window
            [3400, 5050]   // between kitchen zone and entry tower
          ];
          for (const [ya, yb] of bands) {
            // GF band
            pb(eBag, 'plinth', EF + 5, EF + 110, ya, yb, L.f0 + 0.05, L.f1 - 0.18);
            // FF band
            pb(eBag, 'plinth', EF + 5, EF + 110, ya, yb, L.f1 + 0.05, L.f2 - 0.18);
            // SF band
            pb(eBag, 'plinth', EF + 5, EF + 110, ya, yb, L.f2 + 0.05, L.roof - 0.20);
            // joint lines
            for (let z = L.f0 + 1.1; z < L.roof - 0.4; z += 1.15) {
              if (hitsOpening(ya, yb, z - 0.1, z + 0.1, 0, 0.2)) continue;
              pb(eBag, 'charDark', EF + 95, EF + 115, ya + 20, yb - 20, z - 0.012, z + 0.012);
            }
          }
        })();

        // North bookend blade — keep clear of north-east corner windows (office N is on north face)
        // East face north end is solid above ~8460 on GF (office win ends 8460)
        pb(eBag, 'charcoal', EF + 5, EF + 220, 8500, 8860, L.f0 + 0.05, L.roof - 0.08);
        pb(eBag, 'accentWarm', EF + 190, EF + 230, 8510, 8850, L.f0 + 0.05, L.f0 + 0.14);
        pb(eBag, 'accentWarm', EF + 190, EF + 230, 8510, 8850, L.roof - 0.20, L.roof - 0.08);

        // ── 2. Shadow shelves — segmented, never through openings ──
        function shelfRun(yA, yB, zBot, zTop, proj) {
          if (yB - yA < 200) return;
          // skip if fully blocked
          if (hitsOpening(yA, yB, zBot, zTop, 40, 0.02)) {
            // split into sub-runs around openings
            const cuts = [yA];
            for (const Lf of EAST_LEAVES) {
              if (overlaps(yA, yB, Lf.y0, Lf.y1, 60) && overlaps(zBot, zTop, Lf.z0, Lf.z1, 0.05)) {
                cuts.push(Lf.y0 - 90, Lf.y1 + 90);
              }
            }
            cuts.push(yB);
            cuts.sort((a, b) => a - b);
            for (let i = 0; i < cuts.length - 1; i += 2) {
              // after sort, walk contiguous free segments
            }
            // simpler: paint only free samples
            let cursor = yA;
            const blocks = EAST_LEAVES
              .filter(Lf => overlaps(yA, yB, Lf.y0, Lf.y1, 60) && overlaps(zBot, zTop, Lf.z0, Lf.z1, 0.05))
              .map(Lf => [Math.max(yA, Lf.y0 - 90), Math.min(yB, Lf.y1 + 90)])
              .sort((a, b) => a[0] - b[0]);
            for (const [b0, b1] of blocks) {
              if (b0 > cursor + 150) {
                pb(eBag, 'charDark', EF + 5, EF + proj, cursor, b0, zBot, zTop);
                pb(eBag, 'accentWarm', EF + 25, EF + proj - 20, cursor + 20, b0 - 20, zBot - 0.035, zBot);
              }
              cursor = Math.max(cursor, b1);
            }
            if (yB > cursor + 150) {
              pb(eBag, 'charDark', EF + 5, EF + proj, cursor, yB, zBot, zTop);
              pb(eBag, 'accentWarm', EF + 25, EF + proj - 20, cursor + 20, yB - 20, zBot - 0.035, zBot);
            }
            return;
          }
          pb(eBag, 'charDark', EF + 5, EF + proj, yA, yB, zBot, zTop);
          pb(eBag, 'accentWarm', EF + 25, EF + proj - 20, yA + 25, yB - 25, zBot - 0.035, zBot);
        }
        // Runs away from entry zone (doors 5580-7235)
        const shelfBands = [
          [50, 2000],
          [3400, 5450],
          [7350, 8480],
          [8520, 8860]
        ];
        for (const [ya, yb] of shelfBands) {
          shelfRun(ya, yb, L.f0 - 0.01, L.f0 + 0.11, 400);
          shelfRun(ya, yb, L.f1 - 0.14, L.f1 - 0.01, 420);
          shelfRun(ya, yb, L.f2 - 0.14, L.f2 - 0.01, 420);
          shelfRun(ya, yb, L.roof - 0.16, L.roof - 0.02, 450);
        }

        // ── 3. ENTRY TOWER — frame only (no solid fill over doors) ──
        // Door stack: GF 5580-6780, FF 5580-7235, SF 5585-7235
        // Must stop before GF office window 6960-8460 on the right for GF-level right jamb...
        // Use shared frame to y=6900 (covers doors; sidelite 6785-7235 gets partial frame + box)
        (function entryTower() {
          const yL = 5480;   // left of GF/FF/SF doors (5580)
          const yR = 6880;   // right of main door leaf; clear of GF office win (6960)
          const xOut = EF + 320;
          // Left jamb (solid)
          pb(eBag, 'charcoal', EF + 5, xOut, yL - 100, yL + 90, L.f0, L.roof - 0.06);
          // Right jamb — full height but only to yR (does not cover office window)
          pb(eBag, 'charcoal', EF + 5, xOut, yR - 90, yR + 100, L.f0, L.roof - 0.06);
          // Head at roof
          pb(eBag, 'charcoal', EF + 5, xOut + 40, yL - 100, yR + 100, L.roof - 0.22, L.roof + 0.02);
          pb(eBag, 'accentWarm', EF + 20, xOut + 25, yL - 70, yR + 70, L.roof - 0.28, L.roof - 0.22);
          // Base plinth under jambs only (not across door threshold)
          pb(eBag, 'plinth', EF + 5, xOut + 20, yL - 100, yL + 90, L.f0 - 0.02, L.f0 + 0.22);
          pb(eBag, 'plinth', EF + 5, xOut + 20, yR - 90, yR + 100, L.f0 - 0.02, L.f0 + 0.22);

          // Floor-line headers INSIDE tower (above door heads: door top = floor+2.4)
          // Place just under next slab / above door
          for (const [z0, z1] of [
            [L.f0 + 2.48, L.f0 + 2.62],
            [L.f1 + 2.48, L.f1 + 2.62],
            [L.f2 + 2.48, L.f2 + 2.62]
          ]) {
            pb(eBag, 'charDark', EF + 10, xOut - 10, yL + 90, yR - 90, z0, z1);
            pb(eBag, 'accentWarm', EF + 30, xOut - 30, yL + 110, yR - 110, z0 - 0.04, z0);
          }

          // Canopies over each door leaf only (not full tower width nonsense)
          function canopy(floorY, c, w, proj) {
            const ya = c - w / 2 - 80, yb = c + w / 2 + 80;
            const z = floorY + 2.48;
            pb(eBag, 'charDark', EF + 40, EF + proj, ya, yb, z, z + 0.12);
            pb(eBag, 'accentWarm', EF + 60, EF + proj - 25, ya + 30, yb - 30, z - 0.08, z);
            pb(eBag, 'lamp', EF + 100, EF + proj - 80, ya + 80, yb - 80, z - 0.10, z - 0.08);
            pb(eBag, 'charDark', EF + proj - 20, EF + proj + 15, ya - 15, yb + 15, z - 0.10, z + 0.14);
          }
          canopy(L.f0, 6180, 1200, 1000);
          canopy(L.f1, 6400, 1650, 1100); // door+sidelite combined centre
          canopy(L.f2, 6410, 1650, 1000);

          // FF sidelite (6785-7235) gets its own right frame extension at FF/SF only
          pb(eBag, 'charcoal', EF + 5, EF + 200, 6880, 7280, L.f1, L.f2 - 0.05);
          pb(eBag, 'charcoal', EF + 5, EF + 200, 6880, 7280, L.f2, L.roof - 0.08);

          // Accent strips on jamb outer edges
          pb(eBag, 'accentWarm', xOut - 20, xOut + 12, yL - 90, yL + 80, L.f0 + 0.30, L.roof - 0.20);
          pb(eBag, 'accentWarm', xOut - 20, xOut + 12, yR - 80, yR + 90, L.f0 + 0.30, L.roof - 0.20);
        })();

        // ── 4. Deep window boxes — only on non-entry openings ──
        function boxSurround(c, w, sill, h, floorY) {
          const ya = c - w / 2, yb = c + w / 2;
          // skip if inside main door tower leaf
          if (ya < 6900 && yb > 5480 && sill < 100) return;
          const hBot = floorY + sill / 1000;
          const hTop = hBot + h / 1000;
          const d = 150;
          pb(eBag, 'charDark', EF + 5, EF + d, ya - 80, ya - 12, hBot - 0.06, hTop + 0.08);
          pb(eBag, 'charDark', EF + 5, EF + d, yb + 12, yb + 80, hBot - 0.06, hTop + 0.08);
          pb(eBag, 'charDark', EF + 5, EF + d, ya - 80, yb + 80, hTop + 0.01, hTop + 0.10);
          if (sill > 80) {
            pb(eBag, 'charDark', EF + 5, EF + d + 30, ya - 80, yb + 80, hBot - 0.08, hBot);
            pb(eBag, 'accentWarm', EF + 20, EF + d + 20, ya - 50, yb + 50, hBot - 0.015, hBot + 0.02);
          }
        }
        for (const o of OPEN.f0.E) boxSurround(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.E) boxSurround(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.E) boxSurround(o.c, o.w, o.sill || 0, o.h, L.f2);

        // ── 5. PORTICO STRUCTURE — only over real deck, never through lift/stair void ──
        (function porticoStructure() {
          const zTop = roofH - 0.02;
          const zBot = zTop - 0.32;

          // Outer east fascia (full portico N–S) — above roof slab edge only
          pb(eBag, 'charDark', PORT_X1 - 140, PORT_X1 + 40, -780, 8950, zBot - 0.05, zTop + 0.08);
          pb(eBag, 'accentWarm', PORT_X1 - 120, PORT_X1 + 25, -760, 8930, zBot - 0.10, zBot - 0.05);

          // South + north portico edge fascias (outer y only)
          pb(eBag, 'charDark', LIFT_EX + 50, PORT_X1 + 30, -780, -620, zBot, zTop + 0.06);
          pb(eBag, 'charDark', EF + 80, PORT_X1 + 30, 8900, 9050, zBot, zTop + 0.06);

          // Longitudinal beam on column line — SEGMENT between columns (not through piers)
          const colHalf = 200;
          const segs = [
            [150 + colHalf, 4290 - colHalf],
            [4290 + colHalf, 8720 - colHalf]
          ];
          for (const [ya, yb] of segs) {
            pb(eBag, 'charcoal', 16340, 16560, ya, yb, zBot, zTop);
            pb(eBag, 'accentWarm', 16355, 16545, ya + 20, yb - 20, zBot - 0.04, zBot);
          }

          // Wall-plate beam along house face — skip lift y 0-2100 and entry tower y 5480-6900
          const wallSegs = [
            [-700, -40],
            [2100, 5400],
            [7350, 8860]
          ];
          for (const [ya, yb] of wallSegs) {
            pb(eBag, 'charcoal', EF + 10, EF + 180, ya, yb, zBot, zTop);
          }

          // E–W cross beams: only on solid deck strips (east of void / south strip / north deck)
          function crossBeam(cy) {
            // South strip full (y < 200): EF to PORT
            if (cy < 200) {
              pb(eBag, 'charDark', EF + 120, PORT_X1 - 50, cy - 70, cy + 70, zBot + 0.05, zTop);
              return;
            }
            // Through lift band y 0-2100: only east of lift
            if (cy < 2100) {
              pb(eBag, 'charDark', LIFT_EX + 40, PORT_X1 - 50, cy - 70, cy + 70, zBot + 0.05, zTop);
              return;
            }
            // Stair void band y 1040-3890: two segments
            if (cy < 3890) {
              pb(eBag, 'charDark', EF + 120, VOID_WX - 40, cy - 70, cy + 70, zBot + 0.05, zTop);
              pb(eBag, 'charDark', VOID_EX + 40, PORT_X1 - 50, cy - 70, cy + 70, zBot + 0.05, zTop);
              return;
            }
            // Continuous north deck
            pb(eBag, 'charDark', EF + 120, PORT_X1 - 50, cy - 70, cy + 70, zBot + 0.05, zTop);
          }
          // At columns + mid points that are valid
          for (const cy of [150, 4290, 5500, 7000, 8720]) crossBeam(cy);
          // Extra south of lift on outer strip only
          for (const cy of [900, 1600]) {
            pb(eBag, 'charDark', LIFT_EX + 40, PORT_X1 - 50, cy - 55, cy + 55, zBot + 0.08, zTop - 0.02);
          }

          // Mid-height beams at FF / SF — ONLY outer east strip + north deck (never through lift/stair)
          function midDeckBeam(z0, z1) {
            // Outer east strip full height of portico y
            pb(eBag, 'charDark', VOID_EX + 30, PORT_X1 - 50, 3900, 8860, z0, z1);
            pb(eBag, 'copingLight', VOID_EX + 50, PORT_X1 - 70, 3920, 8840, z1, z1 + 0.025);
            // South outer strip east of lift
            pb(eBag, 'charDark', LIFT_EX + 40, PORT_X1 - 50, -700, 200, z0, z1);
          }
          midDeckBeam(L.f1 - 0.14, L.f1 - 0.02);
          midDeckBeam(L.f2 - 0.14, L.f2 - 0.02);

          // Hanging fins on outer fascia — clear of column y
          for (let y = 500; y < 8600; y += 1000) {
            if (COL_YS.some(c => Math.abs(c - y) < 280)) continue;
            pb(eBag, 'charcoal', PORT_X1 - 90, PORT_X1 + 25, y - 40, y + 40, zBot - 0.70, zBot);
          }

          // North screen wall: between house and north column — stop short of column (x max 16080)
          // Column base ~16270. Screen y 8780-9000 (north of main house bulk, on portico)
          pb(eBag, 'charcoal', EF + 80, 16050, 8780, 8980, L.porticoFl, L.f1 - 0.20);
          pb(eBag, 'plinth', EF + 70, 16060, 8770, 8990, L.porticoFl, L.porticoFl + 0.30);
          for (let x = EF + 250; x < 15950; x += 180) {
            pb(eBag, 'ms', x - 14, x + 14, 8955, 8975, L.f0 + 1.35, L.f1 - 0.30);
          }
          pb(eBag, 'accentWarm', EF + 70, 16060, 8770, 8990, L.f1 - 0.20, L.f1 - 0.10);

          // South planter — clear of south column (col y=150 ±180 → avoid y<360)
          pb(eBag, 'plinth', EF + 250, 16050, 420, 780, L.porticoFl, L.porticoFl + 0.50);
          pb(eBag, 'accentWarm', EF + 260, 16040, 430, 770, L.porticoFl + 0.50, L.porticoFl + 0.56);
        })();

        // ── 6. Lift tower accent — fin only on SE, no full shell over existing lift ──
        (function liftAccent() {
          // Fin east of lift, south corner — stay clear of stair flight (void starts ~1040)
          pb(eBag, 'charDark', LIFT_EX - 20, LIFT_EX + 160, 40, 200, 0.1, L.liftTop);
          pb(eBag, 'accentWarm', LIFT_EX + 120, LIFT_EX + 165, 50, 190, 0.3, L.liftTop - 0.1);
          // Horizontal accent slots only on solid lift east face (y 230-1800), not doors
          for (let z = 1.4; z < L.liftTop - 0.8; z += 1.4) {
            pb(eBag, 'accentWarm', LIFT_EX - 5, LIFT_EX + 55, 500, 1600, z, z + 0.06);
          }
          // Crown only slightly proud (existing lift already has top plate)
          pb(eBag, 'accentWarm', 12660, 14290, 20, 2010, L.liftTop + 0.02, L.liftTop + 0.08);
        })();

        // ── 7. Upper deck solid edge parapet — outer east only, north of stair void ──
        for (const fY of [L.f1, L.f2]) {
          pb(eBag, 'charcoal', PORT_X1 - 100, PORT_X1 - 25, 4000, 8700, fY + 0.02, fY + 0.65);
          pb(eBag, 'steel', PORT_X1 - 110, PORT_X1 - 15, 3990, 8710, fY + 0.65, fY + 0.74);
        }

        // Divider fin between stone zone and entry (solid wall only)
        pb(eBag, 'charcoal', EF + 5, EF + 240, 5080, 5200, L.f0 + 0.05, L.roof - 0.10);
        pb(eBag, 'accentWarm', EF + 200, EF + 250, 5090, 5190, L.f0 + 0.25, L.roof - 0.18);
      })();

      // ===== N / S / W datums — moderate projection, not colliding with east shelves =====
      (function perimeterBands() {
        const datums = [
          [L.f0 - 0.01, L.f0 + 0.10, L.f0 + 0.10, L.f0 + 0.13],
          [L.f1 - 0.12, L.f1 - 0.01, L.f1 - 0.01, L.f1 + 0.015],
          [L.f2 - 0.12, L.f2 - 0.01, L.f2 - 0.01, L.f2 + 0.015],
          [L.roof - 0.12, L.roof - 0.01, L.roof - 0.01, L.roof + 0.015]
        ];
        const serviceWallBot = L.f1 - 0.05;
        const serviceWallTop = L.f2 + 0.05;
        for (const [bh0, bh1, ch0, ch1] of datums) {
          pb(eBag, 'charDark', 200, 12420, Y1n - 15, Y1n + 140, bh0, bh1);
          pb(eBag, 'copingLight', 190, 12430, Y1n - 18, Y1n + 148, ch0, ch1);
          pb(eBag, 'charDark', 200, 4800, -140, 15, bh0, bh1);
          pb(eBag, 'copingLight', 190, 4810, -148, 20, ch0, ch1);
          if (bh0 >= serviceWallBot && bh1 <= serviceWallTop) {
            pb(eBag, 'charDark', 4920, 12420, -762 - 140, -762 + 15, bh0, bh1);
            pb(eBag, 'copingLight', 4910, 12430, -762 - 148, -762 + 20, ch0, ch1);
          }
          pb(eBag, 'charDark', -140, 15, 200, 8640, bh0, bh1);
          pb(eBag, 'copingLight', -148, 20, 190, 8650, ch0, ch1);
        }
      })();

      // ===== NORTH FACADE — entry wings clear of hall window =====
      (function northFacade() {
        const NF = Y1n;
        // Hall win ends 7700; door 8050-9250; office win starts 10250
        // Left wing: 7740-8020 | Right wing: 9280-10080
        pb(eBag, 'charcoal', 7740, 8020, NF + 5, NF + 300, L.f0, L.roof - 0.08);
        pb(eBag, 'charcoal', 9280, 10080, NF + 5, NF + 300, L.f0, L.roof - 0.08);
        pb(eBag, 'plinth', 7730, 8030, NF + 5, NF + 310, L.f0 - 0.02, L.f0 + 0.35);
        pb(eBag, 'plinth', 9270, 10090, NF + 5, NF + 310, L.f0 - 0.02, L.f0 + 0.35);

        // Portal = jambs + head only (NOT a solid plug over the door)
        pb(eBag, 'charDark', 8020, 8120, NF + 5, NF + 100, L.f0 + 0.05, L.f0 + 2.55); // left reveal
        pb(eBag, 'charDark', 9180, 9280, NF + 5, NF + 100, L.f0 + 0.05, L.f0 + 2.55); // right reveal
        pb(eBag, 'charDark', 8020, 9280, NF + 5, NF + 100, L.f0 + 2.45, L.f0 + 2.65); // head
        pb(eBag, 'accentWarm', 8040, 9260, NF + 85, NF + 115, L.f0 + 0.15, L.f0 + 2.45);

        // Canopy over door + stoop
        pb(eBag, 'charDark', 7700, 10100, NF + 10, NF + 950, L.f0 + 2.55, L.f0 + 2.68);
        pb(eBag, 'accentWarm', 7750, 10050, NF + 50, NF + 900, L.f0 + 2.43, L.f0 + 2.55);
        pb(eBag, 'lamp', 8100, 9200, NF + 100, NF + 820, L.f0 + 2.41, L.f0 + 2.43);
        pb(eBag, 'charDark', 7680, 10120, NF + 920, NF + 970, L.f0 + 2.40, L.f0 + 2.72);
        // Side blades under canopy (outside door leaf)
        pb(eBag, 'charcoal', 7760, 7920, NF + 40, NF + 220, L.f0 + 1.50, L.f0 + 2.68);
        pb(eBag, 'charcoal', 9880, 10040, NF + 40, NF + 220, L.f0 + 1.50, L.f0 + 2.68);

        // North shelves — break at openings
        const nWins = [];
        for (const [sch, fY] of [[OPEN.f0.N, L.f0], [OPEN.f1.N, L.f1], [OPEN.f2.N, L.f2]]) {
          for (const o of sch) nWins.push({ x0: o.c - o.w / 2, x1: o.c + o.w / 2, fY, sill: o.sill || 0, h: o.h });
        }
        function nShelf(xA, xB, z0, z1, proj) {
          const blocks = nWins
            .filter(w => !(xB < w.x0 - 80 || xA > w.x1 + 80) && z0 < w.fY + w.sill / 1000 + w.h / 1000 + 0.2 && z1 > w.fY + w.sill / 1000 - 0.15)
            .map(w => [w.x0 - 80, w.x1 + 80])
            .sort((a, b) => a[0] - b[0]);
          let cur = xA;
          const draw = (a, b) => {
            if (b - a < 200) return;
            pb(eBag, 'charDark', a, b, NF + 5, NF + proj, z0, z1);
            pb(eBag, 'accentWarm', a + 25, b - 25, NF + 30, NF + proj - 25, z0 - 0.03, z0);
          };
          for (const [b0, b1] of blocks) {
            if (b0 > cur) draw(cur, Math.min(b0, xB));
            cur = Math.max(cur, b1);
          }
          if (cur < xB) draw(cur, xB);
        }
        for (const [z0, z1, proj] of [
          [L.f1 - 0.12, L.f1 - 0.01, 300],
          [L.f2 - 0.12, L.f2 - 0.01, 300],
          [L.roof - 0.14, L.roof - 0.02, 340]
        ]) {
          nShelf(250, 12350, z0, z1, proj);
        }

        // Window boxes on north openings (skip main door)
        function nBox(c, w, sill, h, floorY) {
          if (sill < 100 && c > 8000 && c < 9300) return;
          const xa = c - w / 2, xb = c + w / 2;
          const hBot = floorY + sill / 1000, hTop = hBot + h / 1000;
          pb(eBag, 'charDark', xa - 70, xa - 12, NF + 5, NF + 140, hBot - 0.05, hTop + 0.08);
          pb(eBag, 'charDark', xb + 12, xb + 70, NF + 5, NF + 140, hBot - 0.05, hTop + 0.08);
          pb(eBag, 'charDark', xa - 70, xb + 70, NF + 5, NF + 140, hTop + 0.01, hTop + 0.09);
          if (sill > 80) {
            pb(eBag, 'charDark', xa - 70, xb + 70, NF + 5, NF + 155, hBot - 0.07, hBot);
            pb(eBag, 'accentWarm', xa - 40, xb + 40, NF + 25, NF + 145, hBot - 0.015, hBot + 0.02);
          }
        }
        for (const o of OPEN.f0.N) nBox(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.N) nBox(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.N) nBox(o.c, o.w, o.sill || 0, o.h, L.f2);
      })();

      // ===== PORTICO LIGHTS (clear of pier bases) =====
      (function porticoLights() {
        const t0 = L.porticoFl + 0.016;
        for (const cy of [8720, 4290, 150]) {
          // outside pier footprint (pier ~16270-16630)
          pb(eBag, 'steel', 16220, 16255, cy - 30, cy + 30, t0, t0 + 0.04);
          pb(eBag, 'lamp', 16228, 16248, cy - 22, cy + 22, t0 + 0.035, t0 + 0.07);
          pb(eBag, 'steel', 16645, 16680, cy - 30, cy + 30, t0, t0 + 0.04);
          pb(eBag, 'lamp', 16652, 16672, cy - 22, cy + 22, t0 + 0.035, t0 + 0.07);
        }
        for (const fl of [L.porticoFl, L.f1, L.f2]) {
          for (const [x0, x1] of [[12740, 12810], [13880, 13950]]) {
            pb(eBag, 'charDark', x0, x1, 2040, 2100, fl + 1.55, fl + 1.90);
            pb(eBag, 'lamp', x0 + 10, x1 - 10, 2095, 2125, fl + 1.62, fl + 1.82);
          }
        }
      })();

      // ===== SOUTH FACADE =====
      (function southFacade() {
        const SF = 0;
        // shelves with break at windows
        const sWins = [];
        for (const [sch, fY] of [[OPEN.f0.S, L.f0], [OPEN.f1.S, L.f1], [OPEN.f2.S, L.f2]]) {
          for (const o of sch) {
            if (o.c > 7000 && fY === L.f0) continue; // only bedroom stretch shelves x<4800
            sWins.push({ x0: o.c - o.w / 2, x1: o.c + o.w / 2 });
          }
        }
        function sShelf(xA, xB, z0, z1, proj) {
          const blocks = sWins
            .filter(w => !(xB < w.x0 - 70 || xA > w.x1 + 70))
            .map(w => [w.x0 - 70, w.x1 + 70])
            .sort((a, b) => a[0] - b[0]);
          let cur = xA;
          const draw = (a, b) => {
            if (b - a < 180) return;
            pb(eBag, 'charDark', a, b, SF - proj, SF + 10, z0, z1);
            pb(eBag, 'accentWarm', a + 20, b - 20, SF - proj + 25, SF - 15, z0 - 0.03, z0);
          };
          for (const [b0, b1] of blocks) {
            if (b0 > cur) draw(cur, Math.min(b0, xB));
            cur = Math.max(cur, b1);
          }
          if (cur < xB) draw(cur, xB);
        }
        for (const [z0, z1, proj] of [
          [L.f0 - 0.01, L.f0 + 0.10, 280],
          [L.f1 - 0.12, L.f1 - 0.01, 320],
          [L.f2 - 0.12, L.f2 - 0.01, 320],
          [L.roof - 0.14, L.roof - 0.02, 360]
        ]) sShelf(250, 4750, z0, z1, proj);

        function sBox(c, w, sill, h, floorY) {
          const xa = c - w / 2, xb = c + w / 2;
          const hBot = floorY + sill / 1000, hTop = hBot + h / 1000;
          pb(eBag, 'charDark', xa - 65, xa - 12, SF - 150, SF + 10, hBot - 0.05, hTop + 0.08);
          pb(eBag, 'charDark', xb + 12, xb + 65, SF - 150, SF + 10, hBot - 0.05, hTop + 0.08);
          pb(eBag, 'charDark', xa - 65, xb + 65, SF - 150, SF + 10, hTop + 0.01, hTop + 0.09);
          if (sill > 80) {
            pb(eBag, 'charDark', xa - 65, xb + 65, SF - 165, SF + 10, hBot - 0.07, hBot);
            pb(eBag, 'accentWarm', xa - 40, xb + 40, SF - 155, SF - 15, hBot - 0.015, hBot + 0.02);
          }
        }
        for (const o of OPEN.f0.S) if (o.c < 7000) sBox(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.S) sBox(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.S) if (o.c < 7000 || o.type === 'win') sBox(o.c, o.w, o.sill || 0, o.h, L.f2);

        // Stone panel only where solid (master win 1750-3250) → use 500-1600
        pb(eBag, 'plinth', 500, 1600, SF - 55, SF + 20, L.f0 + 0.25, L.f1 - 0.25);
      })();

      // ===== WEST FACADE — fins clear of all openings =====
      (function westFacade() {
        const WF = 0;
        // Openings GF: 2360-3560, 4260-4860, 6400-7600
        // FF/SF: 3130-4330, 5160-5760, 6970-8170
        // Clear fin centres: ~1200, ~6000, ~8500
        for (const fy of [1200, 6000, 8500]) {
          pb(eBag, 'charcoal', WF - 280, WF + 10, fy - 85, fy + 85, L.f0 + 0.15, L.roof - 0.12);
          pb(eBag, 'accentWarm', WF - 290, WF + 15, fy - 95, fy + 95, L.roof - 0.12, L.roof - 0.05);
          pb(eBag, 'plinth', WF - 290, WF + 15, fy - 95, fy + 95, L.f0, L.f0 + 0.18);
        }
        for (const [z0, z1, proj] of [
          [L.f0 - 0.01, L.f0 + 0.10, 260],
          [L.f1 - 0.12, L.f1 - 0.01, 300],
          [L.f2 - 0.12, L.f2 - 0.01, 300],
          [L.roof - 0.14, L.roof - 0.02, 340]
        ]) {
          // continuous shelf with simple skips at known opening bands
          const skip = [[2300, 3600], [4200, 4900], [5100, 5800], [6350, 8200]];
          let cur = 250;
          const end = 8600;
          const marks = skip.flatMap(([a, b]) => [a, b]).concat([end]).sort((a, b) => a - b);
          // walk free segments
          const segs = [[250, 2280], [3620, 4180], [4920, 5080], [5820, 6330], [8220, 8600]];
          for (const [a, b] of segs) {
            if (b - a < 200) continue;
            pb(eBag, 'charDark', WF - proj, WF + 10, a, b, z0, z1);
            pb(eBag, 'accentWarm', WF - proj + 25, WF - 15, a + 20, b - 20, z0 - 0.03, z0);
          }
        }
        function wBox(c, w, sill, h, floorY) {
          const ya = c - w / 2, yb = c + w / 2;
          const hBot = floorY + sill / 1000, hTop = hBot + h / 1000;
          pb(eBag, 'charDark', WF - 150, WF + 10, ya - 65, ya - 12, hBot - 0.05, hTop + 0.08);
          pb(eBag, 'charDark', WF - 150, WF + 10, yb + 12, yb + 65, hBot - 0.05, hTop + 0.08);
          pb(eBag, 'charDark', WF - 150, WF + 10, ya - 65, yb + 65, hTop + 0.01, hTop + 0.09);
          if (sill > 80) {
            pb(eBag, 'charDark', WF - 165, WF + 10, ya - 65, yb + 65, hBot - 0.07, hBot);
            pb(eBag, 'accentWarm', WF - 155, WF - 20, ya - 40, yb + 40, hBot - 0.015, hBot + 0.02);
          }
        }
        for (const o of OPEN.f0.W) wBox(o.c, o.w, o.sill || 0, o.h, L.f0);
        for (const o of OPEN.f1.W) wBox(o.c, o.w, o.sill || 0, o.h, L.f1);
        for (const o of OPEN.f2.W) wBox(o.c, o.w, o.sill || 0, o.h, L.f2);
      })();

      // ===== PARAPET — light crown only (no double mass) =====
      (function parapetSkyline() {
        const pt = L.parapetTop;
        pb(eBag, 'accentWarm', X0 - 20, eastX[1] + 30, -800, -600, pt + 0.06, pt + 0.11);
        pb(eBag, 'accentWarm', X0 - 20, eastX[1] + 30, 9700, 9900, pt + 0.06, pt + 0.11);
        pb(eBag, 'accentWarm', X0 - 30, 160, -800, 9900, pt + 0.06, pt + 0.11);
        pb(eBag, 'accentWarm', eastX[1] - 160, eastX[1] + 30, -800, 9900, pt + 0.06, pt + 0.11);
      })();

`;

replaceFromTo(
  'facade suite fixed',
  '      // ===== EAST ELEVATION REBUILD',
  '    })();\n    const exterior = eBag.build(THREE, materials); exterior.name = \'exterior\'; root.add(exterior);',
  facade
);

// header note
if (/DESIGN: EAST ELEVATION REBUILD/.test(src)) {
  src = src.replace(
    /DESIGN: EAST ELEVATION REBUILD[\s\S]*?Cost-aware:[\s\S]*?\n/,
    `DESIGN: East elevation (geometry-corrected)
   Frame-only entry tower, segmented shelves, portico beams that
   respect lift/stair voids, fins clear of openings.
`
  );
}

fs.writeFileSync(FILE, src);
console.log('wrote', FILE, 'lines', src.split('\n').length);
