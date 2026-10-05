# Chandrasekhar Residence — Project Index

> **Read this file first.** It maps the entire codebase so you can find what you
> need without reading 7,000+ lines of scene code.

## What This Project Is

An interactive, plan-faithful 3D visualization of the Chandrasekhar Family
Residence (G+2, Anantapur, India). Runs entirely in the browser with Three.js
r128. No build step, no framework — static files served from any HTTP server.

**Building**: 16.6 m × 8.87 m footprint, 3 floors (Ground + First + Second),
east-facing, with an east portico/balcony band, a lift tower, and an
internal + external staircase.

---

## Directory Map

```
House3D/
├── index.html            ← Main orbit/dollhouse viewer (3,439 lines)
│                           Includes: design version switcher, floor pills,
│                           room labels, post-processing pipeline (SSGI/SSR),
│                           sun presets, compass, info cards.
│                           Loads: houseScene.js, perf.js, lib/three.min.js
│
├── houseScene.js         ← THE SCENE (7,180 lines, 395 KB) ★ SEE SECTION INDEX BELOW
│                           Exports window.HouseScene.build(THREE) → scene graph.
│                           Contains ALL geometry: walls, floors, openings, stairs,
│                           furniture, fixtures, vegetation, site, roads.
│
├── walkthrough.html      ← First-person walkthrough (2,086 lines)
│                           WASD+mouse, collision, stair climbing, fly mode,
│                           night-mode material remapping. Loads houseScene.js.
│
├── perf.js               ← Adaptive quality engine (313 lines)
│                           GPU detection, tier selection (high/medium/low/potato),
│                           dynamic resolution scaler, frame-budget watchdog.
│
├── serve.js              ← Zero-dependency Node.js static server (91 lines)
│                           Run: `node serve.js` → http://localhost:8080
│
├── export-to-blender.html ← Builds scene and exports as GLB for Blender import
├── vercel.json           ← Cache headers for Vercel deployment
├── README.md             ← User-facing project readme
├── walkthrough.md        ← Walkthrough feature documentation
│
├── Blender/              ← Blender pipeline (SEE Blender/README.md for full docs)
│   ├── README.md           ★ Comprehensive Blender folder docs for agents
│   ├── index.html          GLB orbit viewer (floor isolation, views, sun modes)
│   ├── walkthrough.html    FPS walkthrough (WASD, fly, night mode)
│   ├── *.blend             Blender project files (master + backups)
│   └── *.glb               Exported GLB model (~11 MB)
│
├── elevations/           ← Exterior-only design variants (no interiors)
│   ├── README.md           Full history of all versions V19→V43
│   ├── index.html          Elevation gallery landing page
│   ├── compare-renders.html  Side-by-side render comparison tool
│   ├── version-thirty-eight/  V38: Splayed Rod Box
│   ├── version-forty/         V40: Rod Box to Roof
│   ├── version-forty-one/     V41: Clover Jali
│   └── version-forty-three/   V43: Continuous Rods
│
├── lib/                  ← Self-hosted Three.js r128 + loaders
│   ├── three.min.js        Three.js core (603 KB)
│   ├── GLTFLoader.js       glTF/GLB importer
│   ├── GLTFExporter.js     glTF/GLB exporter (for Blender pipeline)
│   ├── DRACOLoader.js      Draco mesh compression
│   └── draco/              Draco WASM decoder
│
├── assets/               ← Foliage source photos (hedge, shrub, trees)
├── models/               ← 3D models (car.glb for the portico SUV)
├── mep/                  ← MEP engineering (lighting layout, calculations)
│   ├── README.md           Ground floor lighting & fan design docs
│   ├── build_pdf.py        Generates drawing set PDFs
│   ├── build_plan.py       Ceiling plan generator
│   ├── calc_lighting.py    IS 3646 lumen-method calculations
│   ├── layout_points.py    Fixture position engine
│   └── data/               Room geometry JSON
│
├── scripts/              ← 75+ automation scripts (SEE .agents/SCRIPTS_INDEX.md)
│
└── .agents/              ← THIS DIRECTORY — project documentation for AI agents
    ├── README.md           You are here
    ├── ARCHITECTURE.md     Coordinate system, geometry pipeline, material system
    └── SCRIPTS_INDEX.md    Categorized index of all scripts
```

---

## houseScene.js — Section Index ★ TOKEN SAVER

The file has a detailed TOC comment at the top (after line 16). Here is a
summary so you can jump directly to any section:

| Lines | Section | Key Functions / Data |
|-------|---------|---------------------|
| 1–16 | File header | Module pattern intro |
| 17–21 | Module wrapper | `window.HouseScene = (function() { ... })()` |
| 24–31 | **Level constants `L`** | Floor heights in metres: ground=0, f0=0.75, f1=4.103, f2=7.456, roof=10.809 |
| 33–129 | **Color palette `C`** | ~70 sRGB hex values, every colour used in the building |
| 132–294 | **`buildMaterials(THREE)`** | Creates PBR materials from `C`, lime-grain + sand-float textures |
| 296–334 | **Shadow/collision/footprint** | `NO_SHADOW_CAST`, `NON_COLLIDE_MATERIALS`, `FOOTPRINT` |
| 337–453 | **`makeBag(THREE)`** | Geometry merge pipeline — all geometry goes through this |
| 456–460 | **`pb()`** | Plan-mm box primitive (THE most-called function) |
| 462–489 | **`wallRun()`** | Wall with openings cut out |
| 493–709 | **`glazing()`** | Windows, doors, French doors, security grills, panels |
| 713–909 | **Railings & parapets** | `railing()`, `railPillar()`, `edgeWall()`, `patternedRail()`, `glassRail()` |
| 910–1048 | **Stairs & utilities** | `flight()`, `plainFlight()`, `stairLanding()`, `plate()`, `rng()` |
| 1050–1182 | **Vegetation kit** | `plantShrub()`, `plantTree()` — procedural trees with foliage |
| 1182–1237 | **`nbrHouse()`** | Neighbour house generator (unused but kept) |
| 1239–2953 | **`Fur` — Furniture kit** | `bed`, `sofa`, `table`, `chair`, `wardrobe`, `sink`, `basin`, `wc`, `shower`, `hob`, `fridge`, `tv`, `car`, etc. |
| 2954–3224 | **Electrical/HVAC + Lighting** | `splitAC`, `fan`, `downlight`, `surfacePanel`, `profileLight`, `wallBracket`, `wallSconce`, `vanityBar`, `taskStrip` |
| 3226–3232 | **Room type map `TYPE`** | Maps room names to floor-tile material keys |
| 3234–3286 | **`ROOMS[]`** | Room definitions per floor — name, dimensions, plan-mm coords |
| 3288–3358 | **`OPEN{}`** | Exterior opening schedules — windows, doors per floor per face (E/N/S/W) |
| 3361–3417 | **`IW[]`** | Interior wall sets per floor — wall runs with door/window openings |
| 3420–3572 | **`build(THREE)` — main entry** | Creates materials, calls `placeCar()`, `placeGarden()` |
| 3573–4180 | **`placeGarden()`** | Photo-sourced leaf cards, instanced vegetation, real grass |
| 4246–4380 | **`makeLum()` + `curtains()`** | Per-floor lighting fixture factory, curtain generator |
| 4381–4501 | **Site geometry** | Compound walls, gate, driveway, piers, bollards |
| 4508–4564 | **Context** | Roads, footpaths, kerbs, median (surrounding area) |
| 4567–4700 | **Stair helpers** | `stairRailing()`, `stairWalls()`, `externalStairVoidRails()` |
| 4709–5040 | **External staircase** | U-stair flights, well screen, stair gate |
| 5041–5155 | **`liftTower()` + `columnsEast()`** | Lift shaft with stainless portals, east structural blades |
| 5249–5808 | **Exterior shell** | Terrace rails, facade lamps, east facade, perimeter bands, SE rod box |
| 5816–6120 | **Outdoor decks** | Per-floor balcony/deck geometry, FF/SF pergola, guards |
| 6124–7086 | **Per-floor interiors** | Walls, slabs, floor tiles, glazing, interior walls, furniture, lighting PER FLOOR |
| 7088–7094 | **View presets** | Camera positions for exterior/floor0/floor1/floor2 |
| 7105–7151 | **Warm fixtures** | Walkthrough light-pool positions |
| 7153–7170 | **Return object** | `{ root, site, exterior, outdoors, floors, views, lights, ... }` |
| 7173–7179 | **Module export** | `return { build, LEVELS, COLORS, ... }` |

---

## Coordinate System (Quick Reference)

| Domain | Units | Axes | Origin |
|--------|-------|------|--------|
| **Plan** | millimetres (mm) | x → East, y → North | Building SW outer corner |
| **World (Three.js)** | metres | X = x/1000, Z = −y/1000, Y = up | Same origin |
| **`pb()` calls** | x0,x1,y0,y1 in mm; h0,h1 in metres | As above | — |

Key dimensions: Main block 0–16600 mm (E-W) × 0–8870 mm (N-S).
East portico/balcony: 12650–17362 mm × −762–8870 mm.

---

## Design Version System

The main `index.html` supports `?v=<code>` to switch between elevation designs:

| `?v=` | Code | Scene Source |
|-------|------|-------------|
| *(none)* | FULL | `houseScene.js` (full house with interiors) |
| `v43` | V43 | `elevations/version-forty-three/houseScene.js` |
| `v41` | V41 | `elevations/version-forty-one/houseScene.js` |
| `v38` | V38 | `elevations/version-thirty-eight/houseScene.js` |
| `v40` | V40 | `elevations/version-forty/houseScene.js` |

Elevation versions are **exterior-only** — no interior walls, no furniture, no floor tiles.

---

## How Files Connect

```
index.html ──loads──→ perf.js (quality detection)
     │                 lib/three.min.js (renderer)
     │                 houseScene.js (or elevation variant)
     └──calls──→ HouseScene.build(THREE) → scene graph
                        │
                        ├── root (Group: 'residence')
                        │   ├── site (compound, driveway, gate)
                        │   ├── exterior (building shell, facade)
                        │   ├── context (roads, footpaths)
                        │   ├── car (Group: GLB or procedural)
                        │   ├── garden (instanced foliage)
                        │   ├── outdoor0/1/2 (terrace decks per floor)
                        │   └── floor0/1/2 (interior per floor)
                        │
                        └── returns { root, floors, views, lights, bounds, ... }

walkthrough.html ──same dependency chain──→ adds WASD controller, collision
```

---

## Common Tasks (Quick Lookup)

| Task | Where to look |
|------|--------------|
| Change a wall colour | `C` palette (L33–129), then `buildMaterials()` (L132) |
| Add/move a window | `OPEN{}` (L3288–3358) — find the floor and face |
| Add/move an interior door | `IW[]` (L3361–3417) — find the floor |
| Change room dimensions | `ROOMS[]` (L3234–3286) — floor tiles auto-fill |
| Add furniture to a room | Find the `fi === N` block in per-floor interiors (L6124–7086), call `Fur.*` |
| Add a light fixture | Use `Lum.*` inside the per-floor block (L6220 creates `Lum` per floor) |
| Change floor height | `L` constants (L24–31) |
| Adjust performance tiers | `perf.js` `PRESETS` object (L73–83) |
| Change exterior rods/screen | See `seRodBox()` at L5698 in houseScene.js |
| Modify stair geometry | `plainFlight()` calls in external stair (L4709+) or internal stair (within per-floor blocks) |
