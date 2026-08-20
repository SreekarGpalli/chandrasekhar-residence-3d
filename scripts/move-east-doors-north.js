/**
 * V1–V3: Move east-face main doors toward the north wall.
 * Any windows that sat north of / between those doors move south.
 *
 * East plan y: 0 = south, 8870 = north outer.
 *
 * New east stack (south → north):
 *   service/kitchen windows  →  mid windows  →  entry doors near north
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'elevations');
const VERSIONS = ['version-one', 'version-two', 'version-three'];

// New centres (mm along east face y)
const DOOR_C = 8000;          // GF/FF pivot doors — leaf 7400..8600
const FRENCH_C = 8000;        // SF french — leaf 7175..8825
const SIDE_C = 7100;          // FF sidelite south of door — 6875..7325
const GF_OFFICE_WIN = 4950;   // was 7710 north of door → south mid
const FF_POOJA = 5200;        // was 8030 north of door → south mid
// Kitchen / SE grill / bed south windows stay

function patch(file) {
  let s = fs.readFileSync(file, 'utf8');
  const before = s;

  // ── OPEN schedules ──
  s = s.replace(
    /E: \[\s*\n\s*\{ c: 6180, w: 1200, sill: 0, h: 2400, type: 'door' \},[^\n]*\n\s*\{ c: 7710, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 \},[^\n]*\n\s*\{ c: 2700, w: 1200, sill: 1100, h: 900, type: 'win' \}[^\n]*\n\s*\],/,
    `E: [
        { c: 2700, w: 1200, sill: 1100, h: 900, type: 'win' },                    // kitchen sink (south)
        { c: ${GF_OFFICE_WIN}, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }, // office window (moved south of door)
        { c: ${DOOR_C}, w: 1200, sill: 0, h: 2400, type: 'door' }                   // office door (near north)
      ],`
  );

  s = s.replace(
    /E: \[\s*\n\s*\{ c: -300, w: 600, sill: 0, h: 2400, type: 'grill', door: true \},[^\n]*\n\s*\{ c: 6180, w: 1200, sill: 0, h: 2400, type: 'door' \},[^\n]*\n\s*\{ c: 7010, w: 450, sill: 0, h: 2400, type: 'fixed', panes: 1 \},[^\n]*\n\s*\{ c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' \},[^\n]*\n\s*\{ c: 8030, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 \}[^\n]*\n\s*\],/,
    `E: [
        { c: -300, w: 600, sill: 0, h: 2400, type: 'grill', door: true },         // SE service grill (south)
        { c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' },                   // kitchen (south)
        { c: ${FF_POOJA}, w: 450, sill: 1500, h: 900, type: 'fixed', panes: 1 }, // pooja slit (moved south of entry)
        { c: ${SIDE_C}, w: 450, sill: 0, h: 2400, type: 'fixed', panes: 1 },     // sidelite (south of door)
        { c: ${DOOR_C}, w: 1200, sill: 0, h: 2400, type: 'door' }                // duplex entry (near north)
      ],`
  );

  s = s.replace(
    /E: \[\s*\n\s*\{ c: 6410, w: 1650, sill: 0, h: 2400, type: 'frenchdoor' \},[^\n]*\n\s*\{ c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' \}[^\n]*\n\s*\],/,
    `E: [
        { c: 3200, w: 1200, sill: 1100, h: 900, type: 'win' },                   // bedroom window (south)
        { c: ${FRENCH_C}, w: 1650, sill: 0, h: 2400, type: 'frenchdoor' }        // family french door (near north)
      ],`
  );

  // ── East entry lamps ──
  // Combined FF opening: sidelite 6875..7325 + door 7400..8600 → 6875..8600, c=7737.5, w=1725
  const ffCombC = Math.round((6875 + 8600) / 2); // 7738
  const ffCombW = 8600 - 6875; // 1725
  s = s.replace(
    /\/\/ East entry lamps: GF office c=6180; FF duplex c=6180\+sidelite; SF french c=6410\.\s*\n\s*\(function eastEntryLamps\(\) \{\s*\n\s*function eastLamp\(cy, fl\) \{\s*\n\s*pb\(eBag, 'charDark', EB\[1\], EB\[1\] \+ 70, cy - 50, cy \+ 50, fl \+ 1\.7, fl \+ 2\.05\);\s*\n\s*pb\(eBag, 'steel', EB\[1\] \+ 4, EB\[1\] \+ 62, cy - 40, cy \+ 40, fl \+ 1\.74, fl \+ 2\.01\);\s*\n\s*pb\(eBag, 'lamp', EB\[1\] \+ 70, EB\[1\] \+ 98, cy - 35, cy \+ 35, fl \+ 1\.78, fl \+ 1\.97\);\s*\n\s*\}\s*\n\s*for \(const cy of flankCenters\(6180, 1200, 190\)\) eastLamp\(cy, L\.f0\);\s*\n\s*\/\/ FF door 6180 \+ sidelite 7010 → combined opening ~5580\.\.7235, c≈6407\.5 w≈1655\s*\n\s*for \(const cy of flankCenters\(6408, 1655, 190\)\) eastLamp\(cy, L\.f1\);\s*\n\s*for \(const cy of flankCenters\(6410, 1650, 190\)\) eastLamp\(cy, L\.f2\);\s*\n\s*\}\)\(\);/,
    `// East entry lamps: doors near north (c=${DOOR_C})
      (function eastEntryLamps() {
        function eastLamp(cy, fl) {
          pb(eBag, 'charDark', EB[1], EB[1] + 70, cy - 50, cy + 50, fl + 1.7, fl + 2.05);
          pb(eBag, 'steel', EB[1] + 4, EB[1] + 62, cy - 40, cy + 40, fl + 1.74, fl + 2.01);
          pb(eBag, 'lamp', EB[1] + 70, EB[1] + 98, cy - 35, cy + 35, fl + 1.78, fl + 1.97);
        }
        for (const cy of flankCenters(${DOOR_C}, 1200, 190)) eastLamp(cy, L.f0);
        // FF sidelite ${SIDE_C} + door ${DOOR_C} → combined ~6875..8600
        for (const cy of flankCenters(${ffCombC}, ${ffCombW}, 190)) eastLamp(cy, L.f1);
        for (const cy of flankCenters(${FRENCH_C}, 1650, 190)) eastLamp(cy, L.f2);
      })();`
  );

  // ── Vertical fins clear of new leaves ──
  // Leaves: kit~2100-3300/3800, office 4200-5700, pooja 4975-5425, side 6875-7325, door 7400-8600/8825
  // Clear: ~800, ~6200 (between office/pooja and sidelite), ~8750 (north of door)
  s = s.replace(
    /for \(const fy of \[350, 3950, 8550\]\) \{/,
    'for (const fy of [800, 6200, 8750]) {'
  );

  // ── Entrance canopies (y ranges from door leaves) ──
  // GF door 7400-8600
  s = s.replace(
    /\/\/ GF office door \(c=6180, w=1200\) — 750mm projection, 100mm thick\s*\n\s*pb\(eBag, 'charDark', EF - 25, EF \+ 750, 5280, 7080,\s*\n\s*L\.f0 \+ 2\.50, L\.f0 \+ 2\.60\);[^\n]*\n\s*pb\(eBag, 'accentWarm', EF \+ 30, EF \+ 740, 5300, 7060,\s*\n\s*L\.f0 \+ 2\.40, L\.f0 \+ 2\.50\);[^\n]*\n\s*pb\(eBag, 'lamp', EF \+ 80, EF \+ 700, 5450, 6900,\s*\n\s*L\.f0 \+ 2\.385, L\.f0 \+ 2\.40\);[^\n]*\n\s*pb\(eBag, 'charDark', EF \+ 740, EF \+ 770, 5270, 7090,\s*\n\s*L\.f0 \+ 2\.38, L\.f0 \+ 2\.62\);[^\n]*/,
    `// GF office door (c=${DOOR_C}, w=1200) — near north
        pb(eBag, 'charDark', EF - 25, EF + 750, 7300, 8700,
           L.f0 + 2.50, L.f0 + 2.60);
        pb(eBag, 'accentWarm', EF + 30, EF + 740, 7320, 8680,
           L.f0 + 2.40, L.f0 + 2.50);
        pb(eBag, 'lamp', EF + 80, EF + 700, 7450, 8550,
           L.f0 + 2.385, L.f0 + 2.40);
        pb(eBag, 'charDark', EF + 740, EF + 770, 7290, 8710,
           L.f0 + 2.38, L.f0 + 2.62);`
  );

  // FF duplex canopy
  s = s.replace(
    /\/\/ FF duplex entry \(c=6180 door \+ c=7010 sidelite\) — wider canopy\s*\n\s*pb\(eBag, 'charDark', EF - 25, EF \+ 750, 5280, 7470,\s*\n\s*L\.f1 \+ 2\.50, L\.f1 \+ 2\.60\);\s*\n\s*pb\(eBag, 'accentWarm', EF \+ 30, EF \+ 740, 5300, 7450,\s*\n\s*L\.f1 \+ 2\.40, L\.f1 \+ 2\.50\);\s*\n\s*pb\(eBag, 'lamp', EF \+ 80, EF \+ 700, 5450, 7300,\s*\n\s*L\.f1 \+ 2\.385, L\.f1 \+ 2\.40\);\s*\n\s*pb\(eBag, 'charDark', EF \+ 740, EF \+ 770, 5270, 7480,\s*\n\s*L\.f1 \+ 2\.38, L\.f1 \+ 2\.62\);/,
    `// FF duplex entry (sidelite c=${SIDE_C} + door c=${DOOR_C}) — near north
        pb(eBag, 'charDark', EF - 25, EF + 750, 6780, 8700,
           L.f1 + 2.50, L.f1 + 2.60);
        pb(eBag, 'accentWarm', EF + 30, EF + 740, 6800, 8680,
           L.f1 + 2.40, L.f1 + 2.50);
        pb(eBag, 'lamp', EF + 80, EF + 700, 6950, 8550,
           L.f1 + 2.385, L.f1 + 2.40);
        pb(eBag, 'charDark', EF + 740, EF + 770, 6770, 8710,
           L.f1 + 2.38, L.f1 + 2.62);
        // SF french canopy (c=${FRENCH_C})
        pb(eBag, 'charDark', EF - 25, EF + 750, 7080, 8920,
           L.f2 + 2.50, L.f2 + 2.60);
        pb(eBag, 'accentWarm', EF + 30, EF + 740, 7100, 8900,
           L.f2 + 2.40, L.f2 + 2.50);
        pb(eBag, 'lamp', EF + 80, EF + 700, 7250, 8750,
           L.f2 + 2.385, L.f2 + 2.40);
        pb(eBag, 'charDark', EF + 740, EF + 770, 7070, 8930,
           L.f2 + 2.38, L.f2 + 2.62);`
  );

  // ── Accent blank panels — solid wall between south glazing and north doors ──
  s = s.replace(
    /\/\/ GF: blank zone between kitchen windows and office door\s*\n\s*pb\(eBag, 'accentWarm', EF - 5, EF \+ 50, 3500, 5250,\s*\n\s*L\.f0 \+ 0\.30, L\.f0 \+ 0\.60\);\s*\n\s*pb\(eBag, 'copingLight', EF - 5, EF \+ 50, 3500, 5250,\s*\n\s*L\.f0 \+ 0\.60, L\.f0 \+ 0\.65\);\s*\n\s*\/\/ FF: blank zone south of entry\s*\n\s*pb\(eBag, 'accentWarm', EF - 5, EF \+ 50, 3950, 5250,\s*\n\s*L\.f1 \+ 0\.30, L\.f1 \+ 0\.60\);\s*\n\s*pb\(eBag, 'copingLight', EF - 5, EF \+ 50, 3950, 5250,\s*\n\s*L\.f1 \+ 0\.60, L\.f1 \+ 0\.65\);\s*\n\s*\/\/ SF: blank zone south of french door\s*\n\s*pb\(eBag, 'accentWarm', EF - 5, EF \+ 50, 3950, 5250,\s*\n\s*L\.f2 \+ 0\.30, L\.f2 \+ 0\.60\);\s*\n\s*pb\(eBag, 'copingLight', EF - 5, EF \+ 50, 3950, 5250,\s*\n\s*L\.f2 \+ 0\.60, L\.f2 \+ 0\.65\);/,
    `// Solid band between mid windows and north entry doors
        pb(eBag, 'accentWarm', EF - 5, EF + 50, 5800, 7000,
           L.f0 + 0.30, L.f0 + 0.60);
        pb(eBag, 'copingLight', EF - 5, EF + 50, 5800, 7000,
           L.f0 + 0.60, L.f0 + 0.65);
        pb(eBag, 'accentWarm', EF - 5, EF + 50, 5600, 6800,
           L.f1 + 0.30, L.f1 + 0.60);
        pb(eBag, 'copingLight', EF - 5, EF + 50, 5600, 6800,
           L.f1 + 0.60, L.f1 + 0.65);
        pb(eBag, 'accentWarm', EF - 5, EF + 50, 4000, 6800,
           L.f2 + 0.30, L.f2 + 0.60);
        pb(eBag, 'copingLight', EF - 5, EF + 50, 4000, 6800,
           L.f2 + 0.60, L.f2 + 0.65);`
  );

  // ── Office stoop on portico ──
  s = s.replace(
    /\/\/ Office stoop on portico \(door c=6180\)\s*\n\s*st = 0\.60;\s*\n\s*for \(let i = 0; i < 3; i\+\+\) \{\s*\n\s*pb\(o0, 'plinth', 12650 \+ i \* 300, 12950 \+ i \* 300, 5580, 6780, L\.porticoFl, st\);\s*\n\s*pb\(o0, 'copingLight', 12660 \+ i \* 300, 12940 \+ i \* 300, 5600, 6760, st, st \+ 0\.018\);\s*\n\s*st -= 0\.15;\s*\n\s*\}/,
    `// Office stoop on portico (door c=${DOOR_C}, leaf 7400..8600)
      st = 0.60;
      for (let i = 0; i < 3; i++) {
        pb(o0, 'plinth', 12650 + i * 300, 12950 + i * 300, 7400, 8600, L.porticoFl, st);
        pb(o0, 'copingLight', 12660 + i * 300, 12940 + i * 300, 7420, 8580, st, st + 0.018);
        st -= 0.15;
      }`
  );

  // ── warmFix east entry ──
  // Old flanks for door 6180: 5390, 6970; canopy 6180
  // New door 8000 ± 600 → flanks ~7210, 8790; canopy mid 8000
  // FF combined flanks around 7738 ± 862 → 6876, 8600 approx
  s = s.replace(
    /\/\/ East entry flanks \+ canopy under-glow\s*\n\s*warmFix\(12700, 5390, L\.f0 \+ 1\.88, 0\);\s*\n\s*warmFix\(12700, 6970, L\.f0 \+ 1\.88, 0\);\s*\n\s*warmFix\(13000, 6180, L\.f0 \+ 2\.40, 0\);\s*\n\s*warmFix\(12700, 5390, L\.f1 \+ 1\.88, 1\);\s*\n\s*warmFix\(12700, 7425, L\.f1 \+ 1\.88, 1\);\s*\n\s*warmFix\(13000, 6408, L\.f1 \+ 2\.40, 1\);\s*\n\s*warmFix\(12700, 5395, L\.f2 \+ 1\.88, 2\);\s*\n\s*warmFix\(12700, 7425, L\.f2 \+ 1\.88, 2\);/,
    `// East entry flanks + canopy under-glow (doors near north)
    warmFix(12700, 7210, L.f0 + 1.88, 0);
    warmFix(12700, 8790, L.f0 + 1.88, 0);
    warmFix(13000, ${DOOR_C}, L.f0 + 2.40, 0);
    warmFix(12700, 6880, L.f1 + 1.88, 1);
    warmFix(12700, 8600, L.f1 + 1.88, 1);
    warmFix(13000, ${ffCombC}, L.f1 + 2.40, 1);
    warmFix(12700, 7080, L.f2 + 1.88, 2);
    warmFix(12700, 8920, L.f2 + 1.88, 2);
    warmFix(13000, ${FRENCH_C}, L.f2 + 2.40, 2);`
  );

  // Planters near old mid-entry — shift one toward new door
  s = s.replace(
    /Fur\.planter\(o0, 13100, 5300, L\.porticoFl, 0\.65\);\s*\n\s*Fur\.planter\(o0, 13100, 7100, L\.porticoFl, 0\.65\);/,
    `Fur.planter(o0, 13100, 4800, L.porticoFl, 0.65);\n      Fur.planter(o0, 13100, 8200, L.porticoFl, 0.65);`
  );

  if (s === before) {
    throw new Error('No changes applied — patterns may not match: ' + file);
  }

  // Sanity: old door centres should be gone from OPEN east doors
  if (/c: 6180, w: 1200, sill: 0, h: 2400, type: 'door'/.test(s)) {
    throw new Error('Old door c=6180 still present in ' + file);
  }
  if (!new RegExp(`c: ${DOOR_C}, w: 1200, sill: 0, h: 2400, type: 'door'`).test(s)) {
    throw new Error('New door c not found in ' + file);
  }

  fs.writeFileSync(file, s);
  console.log('patched', path.relative(process.cwd(), file));
}

for (const v of VERSIONS) {
  const f = path.join(ROOT, v, 'houseScene.js');
  if (!fs.existsSync(f)) {
    console.warn('skip missing', f);
    continue;
  }
  patch(f);
}

console.log('\\nDone. East doors → north (~y=' + DOOR_C + '); mid windows moved south.');
