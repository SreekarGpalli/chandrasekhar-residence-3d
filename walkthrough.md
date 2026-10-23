# House3D — Development Changelog

All modifications have been successfully implemented and verified in [houseScene.js](./houseScene.js) (3D model) with the orbit viewer ([index.html](./index.html)) and first-person walkthrough ([walkthrough.html](./walkthrough.html)).

---

## Phase 1 — Bug Fixes & Code Quality (Completed)

We implemented robust error handling, modernized Three.js API usage, corrected GC allocations, added full keyboard/mobile accessibility, and optimized rendering.

### Summary of Phase 1 Changes
- **CDN Error Handling**: Displays clean network error state on loading screen if Three.js fails.
- **Three.js API Updates**: Modernized sRGB color space rendering configuration.
- **GC Allocation Tuning**: Extracted Vector3 allocations from per-frame animate loop.
- **Mobile Room Navigation**: Added touch-friendly hamburger drawer/bottom-sheet.
- **Keyboard Navigation**: Added proper keyboard access (Enter/Space support) on all interactive labels and side panels.
- **Geometry Deduplication**: Extracted stairs wall drawing code to `stairWalls()` helper function.

---

## Phase 2 — Full-Height Walls & Interior Details (Completed)

This phase raises all interior and exterior walls in the dollhouse views to their true full height, and adds realistic kitchen and bathroom furniture details without altering any room positions or layout coordinates.

### Changes Made

#### 1. Raised Dollhouse Walls to Full Interior Height
- Raised the `cut` height variable from `fY + L.cut` (1.5m cut height) to `fY + L.f2f - L.slabT` (3.203m full interior height, up to the ceiling slab).
- Updated all context elements (lift towers, external stair towers, columnsEast) across the Ground Floor, First Floor, and Second Floor to use `cut` height so they align flush with the new wall heights.
- Fixed the `dollOps` helper function to map opening heights to their actual window/door heights (`h: o.h`) instead of a hardcoded `3000` height. This correctly renders the top lintel wall portions above every window and door in the floor/interior views, resolving the issue where they were left open to the ceiling.


#### 2. Added Furniture Elements inside the `Fur` Namespace
We introduced three new furniture building methods in the `Fur` utility object:
- **`Fur.wallCabinet(bag, x0, x1, y0, y1, fY)`**: Builds upper kitchen wood cabinets (mounted from $1.4\text{ m}$ to $2.2\text{ m}$ high) with a top crown moulding plate.
- **`Fur.rangeHood(bag, cx, cy, fY)`**: Builds a steel chimney range hood (with a $600\text{ mm}$ wide canopy from $1.4\text{ m}$ to $1.5\text{ m}$ and a central chimney duct up to $2.6\text{ m}$ high).
- **`Fur.mirror(bag, x0, x1, y0, y1, fY)`**: Builds a vanity mirror (mounted from $0.9\text{ m}$ to $1.7\text{ m}$ high) featuring a reflective glass material and thin steel boundary trims.

#### 3. Placed Kitchen and Utility Wall Details
Cabinets and range hoods were placed above counters and hobs, carefully adjusted to avoid windows:
- **Ground Floor Kitchen**: Added upper wall cabinets along the East counter (`y = 230` to `800` and `y = 1400` to `2050`) and placed a range hood centered above the hob (`y = 1100`). The sink window area (`y = 2100` to `3300`) was left open.
- **First Floor Kitchen**: Added upper wall cabinets along the East counter (`y = 1539` to `2100` and `y = 3850` to `4933`) and placed a range hood centered above the hob (`y = 2400`), cleanly avoiding the kitchen window (`y = 2600` to `3800`).
- **First Floor Utility (Wet Kitchen)**: Left simple without any wall cabinets or chimney range hood, per user feedback.

#### 4. Placed Bathroom Vanity Mirrors
Vanity mirrors were added flat against the adjacent walls above all 6 basins:
- **Ground Floor**:
  - Master Bath: Mirror against the North wall at $y = 2216$.
  - Common Bath handwash: Mirror against the South wall at $y = 4945$.
- **First Floor**:
  - Master Bath: Mirror against the North wall at $y = 6381$.
  - Dining handwash: Mirror against the East wall at $x = 9370$.
- **Second Floor**:
  - Master Bath 02: Mirror against the North wall at $y = 6381$.
  - Bath 03: Mirror against the South wall at $y = 230$.

#### 5. Raised Bedroom Wardrobes and Walk-in Shelving to Full Height
- Raised the height of bedroom cupboards (`vastuWardrobe` and `wardrobe` helpers) from $1.45\text{ m}$ to $2.40\text{ m}$ ($2.36\text{ m}$ body + $0.04\text{ m}$ top crown). This applies to all bedrooms on every floor.
- Raised the height of shelving units (`shelves` helper) in all walk-in closets from $1.35\text{ m}$ to a full height of $2.30\text{ m}$.

#### 6. Extended Wall Above First Floor Breakfast Counter
- Reduced the breakfast counter opening height from `h: 3000` to `h: 1200` in the kitchen-dining partition wall. This correctly builds the top lintel wall segment above the breakfast counter, extending it down from the ceiling to $2.10\text{ m}$ high (aligning perfectly with the adjacent kitchen archway).

#### 7. Relocated First Floor Master Bedroom Door & Added Crockery Unit
- **Bedroom Door Relocation**: Moved the door opening on the East wall of the First Floor Master Bedroom northwards (centered at $y = 3850$ instead of $3000$, shifting it towards the walk-in closet wall).
- **Crockery Unit Addition**: Defined a new helper function `Fur.crockeryUnit()` to build a premium wood cabinet base ($850\text{ mm}$ high), counter top, and upper glass-shelved display unit with sliding glass display doors ($1.35\text{ m}$ to $2.15\text{ m}$ high). Placed this crockery unit on the dining room side of the freed-up west wall (`x = 4920` to `5370`, `y = 1530` to `3300`), extending it to fill the entire wall segment from the bedroom door all the way to the south corner.

#### 8. First Floor Kitchen North Wall Cupboards & Pantry Unit
- **Pantry Cabinets**: Added a new tall pantry unit (`woodD`/`woodF`, $2.40\text{ m}$ high) directly next to the refrigerator along the North wall (`x = 10350` to `10950`, `y = 4345` to `4945`). Also raised the original South-West corner pantry unit to $2.40\text{ m}$ for visual consistency.
- **North Wall Counter & Wall Cabinets**: In the remaining space along the North wall, added a new base counter (`x = 10950` to `11800`, `y = 4345` to `4945`) and upper wall cabinets (`x = 10950` to `11800`, `y = 4595` to `4945`) which connect with the East counter to form a continuous L-shaped configuration, utilizing the entire wall.

#### 9. Raised Ground Floor Kitchen Pooja Unit
- **Pooja Cupboard Unit**: Raised the cupboard unit housing the Pooja shrine in the North-East corner of the Ground Floor kitchen (`x = 11620` to `12420`, `y = 3427` to `4027`) from $1.24\text{ m}$ to the full cabinetry height of **$2.40\text{ m}$** ($2360\text{ mm}$ body + $40\text{ mm}$ top crown).

#### 10. Ground Floor Kitchen West Wall Cabinets
- **West Wall Cabinets**: Extended the existing upper wall cabinets (`x = 9487` to `9837`) all the way down to the south wall (`y = 230` to `2230`, instead of ending at `830`), covering the entire west counter layout. Removed the pantry cupboard that blocked the entry door opening.

---

## Verification & Syntax Testing

- **Syntax Validation**: Checked all three `<script>` tags inside `index.html` via Node.js syntax parsing—all blocks are clean and 100% syntactically correct.
- **Layout & Structure Preservation**: Checked that all coordinate calculations for new furniture match existing countertops and walls, ensuring no structural elements or rooms were moved or broken.

---

## Phase 3 — Enhanced Walkthrough Navigation & Access (Completed)

We resolved the walkthrough navigation limitations, giving users the freedom to seamlessly traverse and inspect all interior, exterior, and balcony areas:

### Key Features Implemented

#### 1. Walking Traversal Through Doors & Glass
- **Door and Window Collision Exclusions**: We filtered out meshes with materials representing doors (`walnut`, `liftDoor`), glass (`glass`, `carGlass`), and wooden paneling/trim (`woodD`, `woodF`) from the walking collision detector.
- **Seamless Balcony & Room Transitions**: Users can now walk straight through sliding glass doors, bedroom doors, main entrances, and window panels to transition naturally between spaces (e.g., bedroom to balcony, dining room to portico).

#### 2. Flight Mode Noclip (No-Collision) Traversal
- **Complete Movement Freedom**: Modified the flight controller (`F` key or click to toggle) to completely bypass collision checks (`moveAxis` calls).
- **Inspect Anywhere**: Users can fly in any direction through solid walls, floors, and ceilings, making it easy to exit the house, view the exterior facade, or fly directly into rooms like the Ground Floor office.

#### 3. Interactive UI & New Spawn Points
- **Exterior Driveway Spawn**: Added an **EXTERIOR** spawn location (`E` button on the right / key `5` shortcut) placing the camera on the driveway looking at the house.
- **Clickable Footer Elements**: Made the footer controls interactive (e.g., clicking the **F fly** span toggles flight mode directly, changing the label to **F walk** and highlighting it in brass). This makes the walkthrough more accessible for mobile/touch devices.

#### 4. Context-Aware HUD
- Added dynamic position-based detection for non-standard spaces. The HUD room/floor label now updates when visiting:
  - **YARD / DRIVEWAY** (with floor level marked as `EXTERIOR`)
  - **PORTICO**
  - **NORTH BALCONY** (First Floor / Second Floor)
  - **EAST BALCONY** (First Floor / Second Floor)
  - **LIFT** (Ground Floor / First Floor / Second Floor)
  - **TERRACE** (Roof)

---

## Phase 4 — Dining-to-Balcony Wall Opening Upgrades (Completed)

We replaced the separate window and door separating the first-floor dining room and the service balcony with a modern 3-panel sliding glass door system.

### Changes Made

#### 1. Added Modern Sliding Glass Door Glazing Renderer
- Implemented `type: 'slider'` in the `glazing()` renderer inside [houseScene.js](./houseScene.js).
- Features an outer boundary frame, individual panel frames with depth offsets (placed on inner/outer tracks to simulate realistic overlapping panels), glass panes, and dual-sided brass pull handles.
- Supporting configurations for 2, 3, or 4 panels.

#### 2. Updated First Floor (FF) Wall Layout
- Modified the balcony slider wall entry in `IW[1]` and the full-height `wallRun` calls in [houseScene.js](./houseScene.js) to replace the window and door openings with a single, centered opening of width $2400\text{ mm}$ and height $2400\text{ mm}$.
- Replaced the separate window and door glazing calls with a single sliding glass door glazing call of `type: 'slider'` with 3 panes.

#### 3. Ensured Smooth Traversal in Walkthrough
- Added `'frame'` and `'brass'` materials to the `nonCollidableMaterials` set in [walkthrough.html](./walkthrough.html).
- This prevents the player from colliding with the door frame or the brass handle, allowing completely smooth walk-through access.

#### 4. Unified Scene Builder Loading
- Replaced the inline duplicated `HouseScene` script block in [index.html](./index.html) with a reference to the shared [houseScene.js](./houseScene.js) file.
- This eliminated ~2,500 lines of duplicate code, synchronized all previous modeling updates (such as bedroom door relocations, furniture/wardrobe adjustments, and the new terrace staircase) to the home page, and resolved the issue where the homepage and walkthrough were out of sync.

---

## Phase 5 — Faucet Coordinate Bug Fixes (Completed)

We identified and resolved the cause of the hovering object in the first-floor dining room.

### Key Details

#### 1. Identified Copy-Paste Type Division Errors
- **The Issue**: A coordinate conversion typo inside `Fur.sink()` and `Fur.basin()` in [houseScene.js](./houseScene.js) caused the midpoint of horizontal spouts and nozzles to divide their millimeter coordinate offset by `2000` instead of `1000` when converting to Three.js world space meters.
- **The Impact**: This halved their X-coordinate or Z-coordinate values, causing these steel and chrome elements to render far away from their sinks. For the first-floor kitchen sink, this offset placed the faucet spout directly inside the dining room space (`x ≈ 6.1m` instead of the kitchen sink's `x ≈ 12.1m`), floating at about $1.24\text{ m}$ height above the floor near the dining chairs.

#### 2. Resolved the Typos
- Corrected the division factors in `Fur.sink` (4 locations) and `Fur.basin` (2 locations) to divide by `1000`.
- Verified that all faucet spouts and extensions are now drawn flush with their corresponding sinks and vanity counters on all floors, and no floating objects remain in the dining room or other living spaces.

## Phase 6 — First Floor Service Balcony & Bathroom Door Upgrades (Completed)

We optimized the service balcony layout on the first floor and fixed the rendering of the common bathroom door.

### Changes Made

#### 1. Optimized & Unobstructed Service Balcony Layout
- **Stacked Washing Machine & Dryer**: Replaced the separate side-by-side washer and dryer layout with a stacked washer-dryer configuration, placed in a custom cupboard in the South-West corner of the service balcony (X: 6595 to 7195, Y: 152 to 752) facing East.
- **Enclosing Cupboard**: Built a wood carcass around the stack with a divider shelf, a top crown panel (at 2.40m), and storage cabinets with brass handles above the dryer, facing East.
- **Unobstructed Vanity Sink**: Placed the vanity sink and mirror against the North wall on the East side (X: 8520 to 9320, Y: 877 to 1377), facing South. Because the laundry cupboard is moved to the West, the East side is completely open, providing ample standing space and zero physical obstruction for the vanity sink.

#### 2. Adjusted Sliding Glass Door
- Shifted the balcony sliding glass door slightly to the west (center X = 7575, width = 1800mm, 2 panes) in both the exterior shell rendering (`exterior()`) and interior wall schedule (`IW[1]`). This extended the solid portion of the North wall on the East side, providing a clean 895mm wide wall surface to perfectly fit the vanity sink without overlapping the glass panes.

#### 3. Common Bathroom Door Rendering Fix
- Restored the common bathroom's North wall (`cbath north`) to a solid wall, and added a door opening (`c: 1080, w: 650`) to the common bathroom's East wall (`balcony west cheek`) in the interior wall schedule `IW[1]`. The door is shifted slightly North to clear the 600mm deep stacked laundry cupboard in the South-West corner.
- Rendered a proper closed door with a custom door frame (using `'frame'` material) and wood panel (using `'walnut'` material) matching the other doors in the residence. Added dual-sided brass pull handles on both the service balcony side and the bathroom interior side.
- Replaced the solid white balcony cheek box `pb(eBag, 'white', 6480, 6595, ...)` in `exterior()` with a `wallRun` featuring the matching door opening (`[{ c: 1080, w: 650 }]`). This ensures the door is visible in the rendering and is not overlapped by a solid white wall block.

#### 4. Walkthrough Collision & UV Resolution
- Fixed a bug in [walkthrough.html](./walkthrough.html) where in-place material modifications during the first scene traversal (such as upgrading the glass color to `0xafc4d2` and frame color to `0x3b3e42`) caused name resolution via `hex2name` to return `undefined` in later steps. This previously resulted in glass door frames, glass panes, and brass handles being treated as colliders, blocking the player from walking into the service balcony.
- Cached the original material names in `o.material.userData.name` during the first reskinning pass, and updated both the world-aligned UV texture mapper and first-person collision detector to read from `userData.name`. This enables smooth, walk-through traversal into the service balcony.

---

## Phase 7 — Bathroom Shower Fixtures Upgrades (Completed)

We installed premium, modern shower head fixtures (riser pipe, mixer handle, handheld wand, hose, and overhead rain shower plate) in all 5 bathrooms that have shower areas.

### Changes Made

#### 1. Added Modern Shower Fixture 3D Modeling Helper
- Implemented `Fur.showerHead(bag, cx, cy, fY, facing)` inside [houseScene.js](./houseScene.js).
- The helper renders:
  - A wall-mounted backplate (`chrome`) with a thermostatic mixer handle (`charcoal` and `chrome`) at height `fY + 1.0m`.
  - A vertical riser rail pipe (`chrome`) up to height `fY + 2.0m`.
  - A horizontal overhead arm (`chrome`) extending $350\text{ mm}$ out from the wall.
  - A rain shower head plate ($200\text{ mm} \times 200\text{ mm}$, `chrome` material) pointing downwards.
  - A handheld shower bracket (`charcoal`), handheld nozzle (`chrome`), and vertical hose (`charcoal`).

#### 2. Positioned Shower Fixtures in Bathrooms
Per the mounting wall alignment of other fixtures like toilets and vanity basins, we correctly oriented the shower heads in each bathroom:
- **Ground Floor Master Bath**: Center $x = 6301$, South wall ($y = 230$), facing North (`'N'`).
- **Ground Floor Office/Guest Bath**: Center $x = 680$, North wall ($y = 5345$), facing South (`'S'`).
- **First Floor Master Bath 01**: Center $x = 680$, North wall ($y = 6381$), facing South (`'S'`).
- **Second Floor Master Bath 02**: Center $x = 680$, North wall ($y = 6381$), facing South (`'S'`).
- **Second Floor Bath 03**: Center $x = 5370$, South wall ($y = 230$), facing North (`'N'`).

The common bathroom on the first floor is correctly excluded from modifications, as requested.

---

## Phase 8 — Architectural Revisions: South Balconies, Expanded Portico & Raised East Balconies (Completed)

We implemented requested architectural design updates to the 3D model in [houseScene.js](./houseScene.js):

### Summary of Changes Made

#### 1. 2.5-ft South Balcony (First Floor & Second Floor)
- Extended a 2.5-ft ($762\text{ mm}$) balcony slab, tile finish, charcoal fascia, and stainless steel/glass railing along the South facade ($y = -762\text{ mm}$ down from $y = 0$) spanning $x = 4920\text{ mm}$ to $x = 16600\text{ mm}$.
- **First Floor Utility Premises**: On the First Floor, this south balcony serves as a service balcony for the holiday premises (wet kitchen and dining area). The South wall window schedule `OPEN.f1.S` was updated with a dedicated service access door at $x = 10800\text{ mm}$.
- **Second Floor**: Added a South balcony access French door at $x = 10000\text{ mm}$ in `OPEN.f2.S`.

#### 2. Expanded Ground Floor Portico
- Extended the Portico footprint southwards from $y = 3975\text{ mm}$ down to $y = -762\text{ mm}$ ($x = 12650\text{ mm}$ to $16600\text{ mm}$).
- Added structural column supports in `columnsEast` at $y = -612\text{ mm}$ along with extended concrete slab and tile finishes to support the upper balcony overhangs and stair landings.

#### 3. Raised East Balconies (+2.5 ft)
- Elevated the East Balcony floor slabs on the First Floor and Second Floor by $2.5\text{ ft}$ ($0.762\text{ m}$) above the main interior floors ($L.f1 + 0.762\text{ m} = 4.865\text{ m}$ for FF, and $L.f2 + 0.762\text{ m} = 8.218\text{ m}$ for SF).
- Added 3-step interior transition flights (`flight()`) inside the doorway thresholds ($x = 12420\text{ mm}$ to $12650\text{ mm}$) to step up smoothly from the interior floors to the raised East Balcony decks.
- Adjusted external stair riser calculation (`RISE_E`) and flight risers so visitors arriving via the external stair land at the raised East Balcony elevation ($4.865\text{ m}$).
- Raised all East Balcony railings, soffits, and fascia boards to align with the new $+2.5\text{ ft}$ height.

---

## Phase 9 — First Floor South Band per Owner Sketch (Completed)

Implemented the owner's hand-drawn first-floor plan: the south side now properly utilizes the balcony depth with two enclosed service bands (≈6.5 ft deep, y = -762 to 1411) plus the original 2.5 ft open balcony along the master bedroom.

### Layout (east → west, matching the sketch; "C.B" = Common Bathroom, relocated per owner)
1. **WET KITCHEN** (x 9486..12420): stove counter + 2×2 hob + upper cupboards on the East wall (y 620..1411, clear of the door), the existing SE secure grill door to the stair landing (sketch "Door"), and a sink (North) + dishwasher (South) counter against the West divider. A new 1130 mm full-height opening (c = 10650) connects it to the main kitchen, flush with the west counter end.
2. **COMMON BATH** (x 8250..9370, relocated from its old cell at x 4916..6476): WC against the outer South wall facing North, high ventilator window (c = 8810, w = 600, sill 1700), and a walnut door in its West wall (c = 1000, w = 700) opening off the utility. The old bathroom cell was demolished (north wall, WC, door) and is now an open **dining alcove** (second DINING rect, 4921..6476 × 233..1413) lit by the existing c = 5700 vent window.
3. **UTILITY** (x 4920..8135, extended west to the dining|bedroom partition line): entered via the dining sliding glass door (c = 7350, w = 1200, 2 panes, clear of the bathroom); stacked washer + dryer cupboard in the **North-West corner facing East** (x 4920..5540, y 250..1413), wash basin on the **South wall** under a grilled window (c = 7700, w = 800), and a full-height **secure grill door in the SW corner West wall** (x 4805..4920, c = -207, w = 800) opening onto the remaining south balcony behind the bedroom. The dining|utility north wall (x 4920..6595, y 1413..1526) was rebuilt; the FF south shell now runs x 230..4805 only (the c = 5700 vent window was removed with it).
4. **SOUTH BALCONY** (x 0..4805): 2.5 ft open strip with railing along the master bedroom, now reachable from the utility through the SW grill door.

### Structural / shell changes (both exterior + dollhouse groups)
- Removed the old FF south shell wall stretch (x 6595..12420, y 0..230) that previously sliced through both bands (with its two stranded grill windows at c 7595 / c 10890); FF south shell now runs x 230..6595 only.
- New weather-secure outer wall at y -762..-646 spanning x 6480..12420 with two grilled windows; FF east shell starts at y 1411 with a hand-drawn SE corner wall (y -762..1411) carrying the grill door, fixing the door previously half-clipped at y = 0 and blocked by a counter.
- Split the full-width south railing/tiles into the west strip (x 0..6480) + portico-top (x 12650..16600); band floors tiled inset; west cheek extended down to y -646.
- ROOMS/downlights updated (WET KITCHEN, UTILITY, SOUTH BALCONY) — 4 new band downlights.

### Fixes found along the way
- Deleted a misplaced duplicate of the utility program on the **Ground Floor** (counters, hob, range hood, dishwasher, wall cabinets floating in mid-air over the south yard and intersecting the GF kitchen counters).
- [walkthrough.html](./walkthrough.html): `isPlayerExterior()` treated plan y < 0 as "YARD / DRIVEWAY"; upper floors now allow y ≥ -762 so the service bands and south balconies label correctly.

### Verification
- `node --check` clean; zero console errors in both viewers.
- Raycast geometry audit (fresh `HouseScene.build` + `THREE.Raycaster`): old shell wall gone in both bands (rays reach the slider/kitchen walls at 1.93 m / 1.91 m), GF yard junk gone (ray hits grass at 0.045 m), washer porthole at x 7.21, C.B door face at x 8.756, hob top at f1+0.875, basin bowl at f1+0.87, grill-door approach clear to floor tile.
- Walkthrough visual pass: HUD labels (WET KITCHEN / UTILITY / DINING), sink+DW counter, stove + cupboards + grill door, washer stack, basin under window, C.B cupboard, dining slider sight line, and the south facade massing all confirmed on screen.

---

## Phase 10 — Double-Height Void Geometry Reconfiguration (Completed)

Reconfigured the duplex double-height void (gap in the First Floor ceiling / Second Floor slab) per owner instructions:
1. **East Extension to North Window End**:
   - The void previously ended at $x = 8241\text{ mm}$ (the west reveal of the North window at $c = 8760\text{ mm}$, $w = 1000\text{ mm}$).
   - Extended the void eastward across the full window span to $x = 9260\text{ mm}$ (flush with the east reveal of the North window).
   - This brings the North window directly into the double-height space, bathing the full two-storey volume in natural daylight.
2. **South-to-North Dimension Reduction**:
   - The void's southern edge was previously at $y = 6000\text{ mm}$.
   - Shifted the south boundary northwards by $996\text{ mm}$ to $y = 6996\text{ mm}$, perfectly aligning with the centerline / midpoint of the downward flight (Flight A) of the internal staircase ($y = 6496\text{ mm}$ to $7496\text{ mm}$).
   - The west edge remains unchanged at $x = 6020\text{ mm}$.
   - The TV feature wall on the solid North wall ($x = 6020\text{ mm}$ to $8241\text{ mm}$) remains in place as requested.
3. **Slabs, Tiles, Soffits & Railings**:
   - Updated Second Floor base slabs (`buildFloor` fi=2), `drawSFSlab`, `drawSFTiles`, and `drawSFSoffit` to reflect the new void boundaries ($x = 6020\text{ mm}$ to $9260\text{ mm}$, $y = 6996\text{ mm}$ to $8641\text{ mm}$).
   - The solid floor on the Second Floor now extends across $y = 6496\text{ mm}$ to $6996\text{ mm}$ east of the stairwell ($x = 4630\text{ mm}$ to $12421\text{ mm}$).
   - Re-routed Second Floor safety railings to guard the new opening:
     - West railing: $x = 6020\text{ mm}$, from $y = 6996\text{ mm}$ to $8641\text{ mm}$ ($h = 1.0\text{ m}$).
     - South railing: $y = 6996\text{ mm}$, from $x = 6020\text{ mm}$ to $9260\text{ mm}$ ($h = 1.0\text{ m}$).
     - East railing: $x = 9260\text{ mm}$, from $y = 6996\text{ mm}$ to $8641\text{ mm}$ ($h = 1.0\text{ m}$).
   - Adjusted ceiling downlights on First Floor and Second Floor so no canisters hang in mid-air inside the void.
   - Updated `ROOMS[2]` room polygons (`FAMILY ROOM`, `LOUNGE`, `GALLERY`) for seamless floor tiling and HUD tracking.

---

## Phase 11 — Tall Double-Height North Windows & Beam Band (Completed)

Transformed the two stacked North windows east of the TV feature wall ($c = 8760\text{ mm}$, $w = 1000\text{ mm}$, span $8260\text{ mm}$ to $9260\text{ mm}$) into grand architectural double-height windows:
1. **Tall Window Dimensions**:
   - Both the First Floor window (`OPEN.f1.N`) and Second Floor window (`OPEN.f2.N`) were enlarged from standard bedroom windows ($\text{sill} = 900\text{ mm}, h = 1400\text{ mm}$) to expansive picture glazing with a low sill ($\text{sill} = 300\text{ mm}$) and soaring $2.5\text{ m}$ height ($h = 2500\text{ mm}$).
   - Lower window spans $Z = 4.403\text{ m}$ to $6.903\text{ m}$ ($2.8\text{ m}$ above FF finished floor).
   - Upper window spans $Z = 7.756\text{ m}$ to $10.256\text{ m}$ ($2.8\text{ m}$ above SF finished floor, reaching up under the roof beam).
2. **Intermediate Structural Beam Band**:
   - Preserved the structural floor beam and slab band spanning between the two storeys ($Z = 6.903\text{ m}$ to $7.756\text{ m}$, total height $853\text{ mm}$).
   - This band incorporates the $403\text{ mm}$ beam drop below the Second Floor ceiling soffit, the $150\text{ mm}$ slab thickness, and the $300\text{ mm}$ Second Floor sill upstand.
3. **Clean Architectural Glass View**:
   - Removed gathered fabric curtains from this double-height window bay to keep the full $1.0\text{ m} \times 2.5\text{ m}$ glass panels completely open, maximizing natural daylight flooding the double-height void.

---

## Phase 12 — Ultra-Tight Spandrel Beam Gap & Architectural Blinds (Completed)

Refined the double-height glazing and window treatments per owner feedback:
1. **Ultra-Tight Structural Spandrel Beam Gap**:
   - The user requested closing the vertical distance between the two stacked North windows east of the TV wall ($c = 8760\text{ mm}$, $w = 1000\text{ mm}$) to leave just the floor slab plus a minimal beam drop:
     - **Lower Window (First Floor `OPEN.f1.N`)**: Lowered sill to $\text{sill} = 200\text{ mm}$ and raised height to $h = 2900\text{ mm}$. Window head now reaches $Z = 7.203\text{ m}$, leaving just a crisp $103\text{ mm}$ beam drop below the Second Floor slab soffit ($7.306\text{ m}$).
     - **Upper Window (Second Floor `OPEN.f2.N`)**: Lowered sill to $\text{sill} = 100\text{ mm}$ (minimal floor curb) and adjusted height to $h = 2850\text{ mm}$ ($Z = 7.556\text{ m}$ to $10.406\text{ m}$).
     - **Inter-Window Distance Reduced**: The gap between the upper window sill ($7.556\text{ m}$) and lower window head ($7.203\text{ m}$) is now just **$353\text{ mm}$** ($103\text{ mm}$ beam drop + $150\text{ mm}$ slab + $100\text{ mm}$ curb), down from $853\text{ mm}$ in Phase 11. The two storeys now read as a near-continuous architectural glass curtain wall.
2. **Modern Architectural Roman/Venetian Blinds**:
   - Replaced clumsy, crowded fabric curtains with a dedicated architectural blind system (`opt.blind = true` in `curtains()`):
     - **Window West of TV Wall ($c = 5500\text{ mm}$)**: Removed the bulky fabric curtains that previously crowded the TV wall pilaster and covered 63% of the glass. Implemented a tailored Roman blind with a slim dark aluminum cassette (`aluDark`), brass trim inlay (`brassI`), accordion fold tiers, horizontal brass ribs, and bottom weighted hem bar. The blind is neatly inset within the window opening ($x = 5020\text{ mm}$ to $5980\text{ mm}$), preserving a generous $40\text{ mm}$ clear reveal to the TV feature wall pilaster ($x = 6020\text{ mm}$), while leaving the lower 75% of the glass unobstructed.
     - **South-Facing Windows ($c = 3950\text{ mm}$, $c = 10000\text{ mm}$)**: Applied the matching architectural blind system to the First Floor Master Bedroom South window and Second Floor South windows, completely eliminating curtain overhang/bunching against bedside tables and corners.

---

## Phase 13 — TV Feature Wall Redesign: Light Travertine, Oak Fluted Dividers & Floating Console (Completed)

Redesigned the double-height TV unit feature wall ($x = 6020\text{ mm}$ to $8241\text{ mm}$, total height $6.556\text{ m}$) to harmonize with the newly extended double-height void and soaring North picture glazing:

1. **Code Backup**:
   - The original navy blue classical coffered media wall code was safely archived to [archive/tvFeatureWall_navy_backup.js](./archive/tvFeatureWall_navy_backup.js) for full preservation.
2. **Vertical Visual Dividers (Non-Protruding)**:
   - Added two dedicated vertical visual dividers on the TV wall plane, each $240\text{ mm}$ wide, running floor-to-ceiling from First Floor level up through the void to the Second Floor soffit ($Z = 0$ to $6.556\text{ m}$):
     - **West Divider ($u = 0\dots240\text{ mm}$)**: Separates the small North window ($c = 5500\text{ mm}$) from the TV area.
     - **East Divider ($u = 1981\dots2221\text{ mm}$)**: Separates the TV area from the tall double-height picture window ($c = 8760\text{ mm}$).
     - Built with warm natural light oak vertical fluted slats ($16\text{ mm}$ slat width, $10\text{ mm}$ depth, $14\text{ mm}$ spacing) mounted over a smoked oak backing.
     - Framed along the inner edge with continuous, full-height satin brass reveal lines (`brassI`) and recessed shadow reveals.
     - Sits completely flat on the wall plane (only $12\text{ mm}$ proud of the field), creating a powerful vertical gesture without protruding into the room.
3. **Serene Light Palette & Central Field**:
   - Replaced the dark navy coffered grid with a budget-friendly, contemporary light palette:
     - **Lower Field ($Z = 0.06\text{ m}\dots3.353\text{ m}$)**: Warm honed cream travertine stone field (`travertine`) with delicate horizontal satin brass inlays (`brassI`) dividing the stone courses.
     - **Upper Void Field ($Z = 3.353\text{ m}\dots6.556\text{ m}$)**: Warm-white matte lacquer acoustic panels (`lacq`) with refined vertical brass reveal seams, reflecting natural daylight from the adjacent tall window.
     - **Plinth & Crown Reveals**: Recessed dark bronze negative shadow plinth ($60\text{ mm}$) and top soffit shadow reveal (`aluDark`).
4. **TV & Floating Media Console**:
   - 55" OLED TV centered at $Z = 1.27\text{ m}$ AFF with ultra-slim flush bracket.
   - Minimalist floating console ($1650\text{ mm}$ wide, $320\text{ mm}$ deep, $300\text{ mm}$ high, floating $300\text{ mm}$ AFF):
     - Warm natural oak carcass with softened corners.
     - Honed travertine top surface plate with bevel.
     - Three seamless push-latch doors: center door in micro-fluted oak, side doors in warm-white matte lacquer.
     - Satin brass lip trim and warm 2700K indirect LED under-glow (`coveLED`) washing the floor tiles below.
     - Minimalist accessories: compact soundbar, trio of design books, travertine tray, and polished brass sphere.

---

## Phase 14 — TV Feature Wall Redesign: Single South Fluted Border & Seamless North Glazing Transition (Completed)

Refined the TV feature wall design per user feedback: the vertical visual divider was updated to be present **strictly on the South flank** (left/small window side), with **no border on the North flank** (right/tall picture window side), allowing an unobstructed, seamless transition into the double-height picture window:

1. **South Flank Vertical Fluted Divider ($u = 0\dots260\text{ mm}$)**:
   - Dedicated full-height visual divider column ($260\text{ mm}$ wide) running floor-to-ceiling from First Floor level up to the Second Floor soffit ($Z = 0$ to $6.556\text{ m}$).
   - Separates the small North window ($c = 5500\text{ mm}$, with Roman blind) and stair approach from the TV area.
   - Built with 7 precision-fluted natural light oak slats ($18\text{ mm}$ wide, $10\text{ mm}$ deep, $14\text{ mm}$ spacing) over a smoked dark oak backing (`oakDark`).
   - Inner edge features a concealed vertical linear warm LED wash strip (`coveLED`), continuous satin brass channel (`brassI`), and recessed shadow reveal (`charDark`).
   - Flat, non-protruding profile ($12\text{ mm}$ depth within the wall finish plane).
2. **North Flank Seamless Transition ($u = 264\dots2221\text{ mm}$)**:
   - Completely eliminated the right-side border to prevent visual clutter and clashing against the tall window casing.
   - The honed cream travertine slab field ($Z = 0.06\text{ m}\dots3.353\text{ m}$) and upper warm-white matte lacquer acoustic panels ($Z = 3.353\text{ m}\dots6.556\text{ m}$) extend continuously and cleanly all the way to the window reveal edge ($x = 8241\text{ mm}$).
   - Finished along the window jamb with a crisp architectural satin brass knife-edge bead (`brassI`, $4\text{ mm}$) and negative shadow reveal, creating a seamless connection to the natural daylight of the double-height picture window.
3. **Travertine Field & Bookmatch Paneling**:
   - 3-panel bookmatch rhythm with delicate vertical shadow reveals.
   - Horizontal satin brass T-bar inlays at $Z = 680\text{ mm}$ (above console), $Z = 1720\text{ mm}$ (above TV), and $Z = 3353\text{ mm}$ (Second Floor datum band).
4. **TV & Floating Media Console Alignment**:
   - TV and console are perfectly centered on the travertine stone field ($u_C = 1240.5\text{ mm}$, $x = 7260.5\text{ mm}$), creating exact equal margins ($366.5\text{ mm}$) on both sides of the 55" OLED screen.
   - Floating media console ($1760\text{ mm}$ wide, $320\text{ mm}$ deep, $280\text{ mm}$ box height, floating $300\text{ mm}$ AFF):
     - Balanced $76.5\text{ mm}$ floating reveals on both ends.
     - Chamfered honed travertine top slab plate matching the wall.
     - Asymmetric three-door front: South door in fluted natural oak (echoing the south vertical wall column), center and right doors in warm-white matte lacquer (`lacq`).
     - Concealed 2700K warm LED under-glow (`coveLED`) casting a soft wash across the floor tiles.
     - Styling: Central soundbar, design books on the south side, and a sculptural travertine tray with polished brass sphere and ceramic bud vase on the north side.

---

## Phase 15 — Double-Height Void Chandelier Redesign: Satin Brass & Frosted Opal Glass Cascade (Completed)

Re-engineered the double-height void chandelier to match the enlarged double-height void geometry ($X = 6020\dots9260\text{ mm}$, $Y = 6996\dots8641\text{ mm}$) and the residence's refined warm contemporary aesthetic:

1. **Centering & Void Spatial Alignment**:
   - The old chandelier cluster was positioned at $(7125, 7325)$, causing it to sit over $500\text{ mm}$ off-center to the west and only $329\text{ mm}$ from the south bridge railing, with south drops clipping inside the Second Floor slab edge ($y \le 6996$).
   - Relocated the fixture canopy to the exact bilateral geometric center of the void: **$X_c = 7640\text{ mm}$, $Y_c = 7818\text{ mm}$**.
   - Clearances are now perfectly balanced: $823\text{ mm}$ to the North TV wall, $822\text{ mm}$ to the South bridge railing, $1620\text{ mm}$ to the West railing, and $1620\text{ mm}$ to the East family room edge.
2. **Ceiling Canopy**:
   - Upgraded from a tiny round disc to an elongated stadium-profile brushed satin brass plate ($960\text{ mm} \times 640\text{ mm}$, `brassI`) with a recessed dark bronze shadow plinth (`charDark`) mounted flush at the roof soffit (`VOID_TOP = 6.556\text{ m}` AFF).
   - Features turned brass strain-relief escutcheons for all 7 suspension cables.
3. **Sculptural Pendant Design**:
   - Replaced the blunt, flat grey cylinders with 7 bespoke hand-blown frosted opal glass globes (`curtain`).
   - Each pendant features:
     - High-tensile braided stainless steel suspension micro-cable (`steel`).
     - Stepped cylindrical socket finial and gallery collar in satin brass (`brassI`).
     - Internal warm 2700K radiant LED core (`lamp`) providing glare-free ambient illumination.
     - Horizontal satin brass equatorial accent band (`brassI`) matching the TV wall brass inlays.
     - Turned brass lower finial pin.
4. **Calibrated 7-Drop Vertical Cascade**:
   - Drops span a smooth $2.0\text{ m}$ vertical cascade from First Floor living volume through Second Floor gallery eye level:
     - **Anchor Core** (drop $3.35\text{ m} \to Z = 3.21\text{ m}$ AFF): transitions between storeys at slab level.
     - **Lower Drops** (drop $3.60\text{ m}\dots3.95\text{ m} \to Z = 2.61\text{ m}\dots2.96\text{ m}$ AFF): float gracefully above the living room seating area, providing intimate ambient warmth well clear of head height ($2.1\text{ m}$) and TV sightlines ($1.61\text{ m}$).
     - **Mid Drops** (drop $2.70\text{ m}\dots3.10\text{ m} \to Z = 3.46\text{ m}\dots3.86\text{ m}$ AFF): connect the vertical void.
     - **Upper Drops** (drop $1.95\text{ m}\dots2.30\text{ m} \to Z = 4.26\text{ m}\dots4.61\text{ m}$ AFF): sit directly at eye level ($4.55\text{ m}$) for occupants walking across the Second Floor bridge walkway.

---

## Phase 16 — Double-Height Void Chandelier: Architectural Floating Halo Rings (Completed)

Re-engineered the double-height void chandelier from the ground up based on the user's selected preference for a clean, open, high-end architectural fixture:

1. **Floating Halo Rings Concept**:
   - Replaced the dangling globe cluster with an architectural **Floating Halo Rings Chandelier** (Flos / Henge / Moooi inspired).
   - Three concentric, slender satin brass circular rings suspended at dynamic subtle inclinations on fine aircraft cables.
   - **Completely Open Center**: Unobstructed sightlines through the ring centers directly to the honed travertine feature wall, fluted oak column, and double-height picture window.
2. **Three Concentric Halo Rings Geometry**:
   - **Upper Ring** ($1100\text{ mm}$ dia, $R = 550\text{ mm}$, $Z \approx 4.10\text{ m}$ AFF, drop $2.45\text{ m}$): Greets Second Floor gallery occupants at eye level, subtly tilted ($+7^\circ$) towards the tall window.
   - **Middle Ring** ($800\text{ mm}$ dia, $R = 400\text{ mm}$, $Z \approx 3.35\text{ m}$ AFF, drop $3.20\text{ m}$): Bridges between storeys right at the Second Floor floor line, counter-tilted ($-8^\circ$) for dynamic architectural balance.
   - **Lower Ring** ($520\text{ mm}$ dia, $R = 260\text{ mm}$, $Z \approx 2.65\text{ m}$ AFF, drop $3.90\text{ m}$): Floats in the upper First Floor living lounge volume, safely clear of head height ($2.1\text{ m}$) and TV sightlines ($1.61\text{ m}$).
3. **Lighting & Material Detailing**:
   - **Casing**: Slender precision-formed satin brass circular profile (`brassI`, $18\text{ mm}$ cross-section).
   - **Integrated Halo Diffuser**: Continuous dual-layer warm 2700K LED channel (`coveLED` + `lamp`) inset along the underside of each ring, casting a seamless 360-degree ambient halo.
   - **Suspension**: 3 micro-cables per ring ($9$ total) in high-tensile braided steel (`steel`, $1.4\text{ mm}$) with turned satin brass mounting couplers on the rings and brass escutcheons at the ceiling canopy.
   - **Ceiling Canopy**: Circular satin brass architectural canopy plate ($680\text{ mm}$ dia, `brassI`) with a recessed graphite shadow reveal (`charDark`) flush at the roof soffit (`VOID_TOP = 6.556\text{ m}` AFF).

---

---

## Phase 17 — Black MS Railings & Golden Oak UPVC Windows (Completed)

Replaced all Stainless Steel (SS) and chrome railings with Black Mild Steel (MS) railings everywhere, and transformed all window frames into Golden Oak / Teak Wood-Laminate UPVC window joinery per Indian residential building standards:

1. **Everywhere Black Mild Steel (MS) Railing**:
   - Completely eliminated all stainless steel (`steel`) and chrome (`chrome`) elements from railings across the entire residence.
   - **Vertical MS Square Pickets Design**:
     - Upright pickets: $20 \times 20\text{ mm}$ square mild steel balusters in satin black (`ms`), spaced uniformly at $\sim 110\text{ mm}$ pitch.
     - Top handrail: $50 \times 30\text{ mm}$ rectangular MS box section in black (`ms`).
     - Bottom runner bar: $30 \times 12\text{ mm}$ horizontal MS flat bar elevated $+75\text{ mm}$ off the finished floor for easy balcony washing and drainage.
     - Intermediate safety runner: $20 \times 10\text{ mm}$ horizontal MS safety runner bar at mid-height ($+480\text{ mm}$ AFF).
     - Base anchor studs: $36 \times 36\text{ mm}$ MS base plates securing stanchion posts to the structural concrete slabs.
   - **Applied Everywhere**:
     - First Floor and Second Floor East, South, and North Balconies.
     - Second Floor internal bridge / gallery void railings guarding the double-height living room below.
     - External U-staircase (both climbing flights, mid-landing continuous U-turn, landing perimeter rails, void guardrails).
     - Internal staircases (Ground to First, First to Second, landings).
     - Rooftop mumty access railings.
     - Ground Floor portico security stair gate & utility security door stiles, rails, and kick plates.

2. **Golden Oak / Teak Wood-Laminate UPVC Windows**:
   - Converted all window and door joinery into authentic multi-chamber UPVC sections with Golden Oak / Teak wood-laminate finish (`0x8e6035` in `frame`), popular in contemporary Indian luxury villas:
     - **Outer Master Chamber Frame**: $60\text{ mm}$ extruded UPVC frame casing with integrated weather flange.
     - **Inner Operable Sashes**: $42\text{ mm}$ stepped UPVC sash profiles sitting inside the outer frame with realistic reveal lines.
     - **EPDM Rubber Weather Gaskets**: Continuous black rubber beading (`ms`) bordering the perimeter of every glass pane, authentic to Indian UPVC windows (Fenesta / Kommerling style).
     - **Glazing Beads**: Internal beveled UPVC profile beads securing the glass.
     - **Hardware**: Satin brass casement espagnolette handles (`brass`) mounted on operable sashes.
     - **Sliding Systems**: Multi-track UPVC sliding frames with stepped slider panels, black EPDM gaskets, and brass pull hardware.
     - **French Doors**: Heavy-duty UPVC balcony door profiles with multi-point locking gear and EPDM gaskets.
     - **Material Properties**: Non-metallic polymer laminate (`metalness: 0.02`, `roughness: 0.40`).

3. **Blender & 3D Export Synchronization**:
   - Re-exported the updated procedural house to `Blender/chandrasekhar_residence_full.glb` via `scripts/export-to-blender.js`.
   - Verified live in both the orbit viewer ([index.html](./index.html)) and first-person walkthrough ([walkthrough.html](./walkthrough.html)).


4. **Clear Glazing + Horizontal Window Grilles**:
   - The EPDM gasket was a solid black slab the size of each pane, which boxed the glass in and made every window opaque. It is now a thin 8 mm bead round the glass edge (windows, French doors, sliders, stair-landing ribbon).
   - Glass is a dark blue-green tint (linear `0.10, 0.20, 0.24`, opacity `0.42`). A pale glass albedo is lit like paint and frosts the pane, so the tint is deliberately dark.
   - Every openable shell window gets a minimalist grill (`windowGrille()`): black MS $16\text{ mm}$ square horizontal bars at $\sim 150\text{ mm}$ pitch in a $24\text{ mm}$ flat frame, with thin vertical back stays on spans of $1100\text{ mm}$ or more, fixed on the room side of the window, grouted into the reveal behind the glass as is usual in Indian houses. Fixed lights are left bare; `grille: false` opts a window out.
