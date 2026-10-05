# Architecture Reference

> Detailed technical reference for the Chandrasekhar Residence 3D scene system.
> For the project overview and file map, see [README.md](./README.md).

---

## Coordinate System

### Plan Coordinates (authoring space)

All building geometry is authored in **plan millimetres**:
- **x** → East (0 = west outer wall face)
- **y** → North (0 = south outer wall face)
- **Origin** = Building SW outer corner

### World Coordinates (Three.js scene)

```
World X =  plan_x / 1000    (metres, east)
World Z = -plan_y / 1000    (metres, south — note the negation)
World Y =  height            (metres, up)
```

### Wall Thickness Convention

Exterior walls: 230 mm (plan x 0–230 on west, 12420–12650 on east, etc.)
Interior walls: typically 115 mm (one brick width)

### Key Dimension Constants

```javascript
const FOOTPRINT = {
  x0: 0,     x1: 16600,   // main block E-W (mm)
  y0: 0,     y1: 8870,    // main block N-S (mm)
  upperY0: -762,           // FF/SF south service band extends south
  northBalcY1: 9900        // north balcony extends north
};

const L = {
  ground: 0,               // natural ground level
  f0: 0.75,                // Ground Floor FFL (metres)
  f1: 4.103,               // First Floor FFL
  f2: 7.456,               // Second Floor FFL
  roof: 10.809,            // Roof slab top
  parapetTop: 11.709,      // Parapet top
  f2f: 3.353,              // Floor-to-floor height
  slabT: 0.15,             // Slab thickness
  cut: 1.5,                // Dollhouse section cut height above floor
  porticoFl: 0.15,         // Portico floor level
  pathFl: 0.05,            // Pathway level
  liftTop: 10.809          // Lift shaft top
};
```

---

## Geometry Pipeline

### The Bag System (`makeBag()`)

All geometry is created through a **merge bag** pattern. Instead of creating
individual Three.js meshes, geometry is accumulated per material into vertex
buffers, then merged into one mesh per material:

```
1. Create bag:     const bag = makeBag(THREE)
2. Add geometry:   bag.box(mat, cx,cy,cz, sx,sy,sz)
                   bag.cyl(mat, cx,cy,cz, r, h)
                   bag.sph(mat, cx,cy,cz, r)
                   bag.blob(mat, cx,cy,cz, sx,sy,sz, ry, low)
                   bag.branch(mat, x0,y0,z0, x1,y1,z1, r0,r1)
3. Build meshes:   const group = bag.build(THREE, materials)
```

This produces **one mesh per material** — ~70 materials → ~70 draw calls for
the entire building. Each mesh has `userData.matKey` for material identification.

### The `pb()` Primitive

```javascript
pb(bag, mat, x0, x1, y0, y1, h0, h1)
```

The most-called function. Places an axis-aligned box in **plan-mm coordinates**
(x0,x1,y0,y1) with heights in **metres** (h0,h1). Converts to world coords
internally:
- Centre X = (x0+x1)/2000
- Centre Z = -(y0+y1)/2000
- Centre Y = (h0+h1)/2
- Size = deltas in metres

### Wall Construction

`wallRun(bag, mat, dir, a0, a1, b0, b1, h0, h1, floorY, openings, capMat)`:
- Builds a wall run along axis `dir` ('x' or 'y')
- `a0..a1`: run direction range (mm)
- `b0..b1`: thickness band (mm)
- Automatically cuts rectangular openings from the `openings` array
- Each opening: `{c, w, sill, h}` — centre, width, sill height, opening height

### Glazing System

`glazing(bag, spec)` builds windows, doors, French doors, security grills:
- `spec.type`: 'win' | 'door' | 'frenchdoor' | 'grill' | 'panel' | 'fixed'
- `spec.face`: 'E' | 'N' | 'S' | 'W'
- `spec.band`: [inner_mm, outer_mm] wall thickness band
- Produces frame + glass + hardware (hinges, handles, pulls)

---

## Material System

### Palette (`C`)

~70 named colours as sRGB hex values. Organized by role:
- **BODY**: white, white2 (lime-white plaster)
- **SOFT**: sand, stone, charcoal, charDark, plinth
- **PUNCT**: frame (charcoal openings), glass
- **LINE**: brass, steel, chrome
- **FLOOR**: tLiving, tBed, tBath, tKitch, tUtil, tOut, tCirc, tOffice, tPooja
- **FURNITURE**: fabric, fabric2, woodF, woodD, mattress, pillow, bedding
- **LANDSCAPE**: green, green2, grass, leafDark, leafLight, bark, boug, ixora
- **SITE**: ground, plotPad, road, paver, concrete

### Material Creation

`buildMaterials(THREE)` converts sRGB palette → linear, creates
`MeshStandardMaterial` with tuned roughness/metalness per surface type.
Special materials:
- `eastPlaster`: sand-float plaster texture (procedural bump map)
- `glass`: transparent, low roughness
- `lamp`: emissive (warm LED glow)
- `coveLED`: low-intensity emissive for indirect strip lighting

### Hex Dedupe Rule

`walkthrough.html` reverse-maps material colours to palette names. Every hex
in `C` **must be unique** — shared values break the reverse lookup. Duplicates
are nudged by 1 LSB and marked `// dedupe`.

---

## Scene Graph Structure

```
root (Group: 'residence')
├── site         — compound walls, gate, driveway, piers, bollards
├── exterior     — building shell (all floors), facade features, SE rod box
├── context      — roads, footpaths, kerbs, median
├── car          — GLB model or procedural fallback
├── garden       — instanced foliage (trees, shrubs, grass tufts)
├── outdoor0     — GF terrace deck, portico soffit
├── outdoor1     — FF balcony decks, splayed bay, guard rails
├── outdoor2     — SF balcony decks, pergola, guard rails
├── floor0       — GF interiors (walls, tiles, furniture, lighting)
├── floor1       — FF interiors
└── floor2       — SF interiors
```

The viewer hides/shows floor groups for the dollhouse cut. Outdoor groups are
separate so they can be shown/hidden independently.

---

## Data Structures

### `ROOMS[floorIndex]` — Array of room definitions

```javascript
R('MASTER BEDROOM', '4575 × 3430', 230, 4805, 230, 3663, 'bed')
//  name             dimensions     x0    x1    y0    y1    type
```
Types: `bed`, `living`, `bath`, `kitchen`, `utility`, `office`, `circ`
(circulation), `pooja`, `walk` (walk-in), `out` (outdoor).

### `OPEN.f0/f1/f2` — Exterior opening schedules

Per floor, per face (E/N/S/W):
```javascript
{ c: 6150, w: 1500, sill: 900, h: 1500, type: 'win', panes: 2 }
// c=centre(mm), w=width, sill=above floor, h=height, type, panes
```

### `IW[floorIndex]` — Interior wall sets

```javascript
{ dir: 'y', b: [4805, 4920], a: [230, 2216], ops: [{c:1200, w:800}] }
// dir=axis, b=thickness band, a=run range, ops=door/window openings
```

---

## Viewer Architecture (index.html)

### Boot Sequence

1. `perf.js` detects hardware → picks tier → sets renderer options
2. Three.js renderer created with tier settings
3. `HouseScene.build(THREE)` called → returns scene graph
4. Post-processing pipeline initialized (if tier allows)
5. Shadow map rendered **once** (static scene)
6. OrbitControls attached, render loop starts

### Post-Processing Pipeline (high/lite tiers)

```
Scene HDR → Normal+Depth pass → SSGI (1 bounce, 2 rays/px)
                               → SSR (Fresnel-weighted)
                               → Composite (AO, bounce, reflections, edge cavity)
                               → Temporal Accumulation (64 samples, Halton jitter)
                               → Lens + Filmic (DOF, CA, ACES, grade, grain)
```

### On-Demand Rendering

The orbit viewer only redraws when:
- Camera is moving (orbit, pan, zoom)
- Accumulation hasn't converged
- Window resized
- Tab visibility changed

Still frames → ~0 GPU cost.

---

## Walkthrough Architecture (walkthrough.html)

### Player Controller

- **Movement**: WASD keys, arrow keys, or touch joystick
- **Look**: Mouse (pointer lock) or touch drag
- **Speed**: Walk 2.8 m/s, run (shift) 5.2 m/s, fly 8 m/s
- **Gravity**: Player falls at 9.8 m/s², auto-climbs stairs < 0.4 m

### Collision System

Raycasts from player position against all meshes where
`NON_COLLIDE_MATERIALS[mesh.userData.matKey]` is NOT set. Furniture, glass,
curtains, plants are walk-through; walls, floors, ground are solid.

### Night Mode

The walkthrough remaps material properties based on the palette hex→name
reverse lookup. It boosts emissive values on `lamp`/`coveLED` materials and
darkens ambient to simulate interior night lighting.

---

## Performance Tiers (perf.js)

| Tier | DPR | Shadows | Post | Target |
|------|-----|---------|------|--------|
| high | 2.0 | 2048px PCFSoft | full pipeline | Discrete GPU desktops |
| medium | 1.5 | 1024px PCF | lite pipeline | Integrated GPUs, flagships |
| low | 1.0 | 512px PCF | off (forward) | Budget phones, old laptops |
| potato | 1.0 | off | off | Software GPUs |

Override: `?q=high|medium|low|potato` and/or `?post=full|lite|off`.
