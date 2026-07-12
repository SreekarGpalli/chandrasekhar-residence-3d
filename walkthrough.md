# House3D — Development Changelog

All modifications have been successfully implemented and verified in [houseScene.js](file:///c:/Users/sreek/Desktop/VC/House3D/houseScene.js) (3D model) with the orbit viewer ([index.html](file:///c:/Users/sreek/Desktop/VC/House3D/index.html)) and first-person walkthrough ([walkthrough.html](file:///c:/Users/sreek/Desktop/VC/House3D/walkthrough.html)).

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
- Implemented `type: 'slider'` in the `glazing()` renderer inside [houseScene.js](file:///c:/Users/sreek/Desktop/VC/House3D/houseScene.js).
- Features an outer boundary frame, individual panel frames with depth offsets (placed on inner/outer tracks to simulate realistic overlapping panels), glass panes, and dual-sided brass pull handles.
- Supporting configurations for 2, 3, or 4 panels.

#### 2. Updated First Floor (FF) Wall Layout
- Modified the balcony slider wall entry in `IW[1]` and the full-height `wallRun` calls in [houseScene.js](file:///c:/Users/sreek/Desktop/VC/House3D/houseScene.js) to replace the window and door openings with a single, centered opening of width $2400\text{ mm}$ and height $2400\text{ mm}$.
- Replaced the separate window and door glazing calls with a single sliding glass door glazing call of `type: 'slider'` with 3 panes.

#### 3. Ensured Smooth Traversal in Walkthrough
- Added `'frame'` and `'brass'` materials to the `nonCollidableMaterials` set in [walkthrough.html](file:///c:/Users/sreek/Desktop/VC/House3D/walkthrough.html).
- This prevents the player from colliding with the door frame or the brass handle, allowing completely smooth walk-through access.

#### 4. Unified Scene Builder Loading
- Replaced the inline duplicated `HouseScene` script block in [index.html](file:///c:/Users/sreek/Desktop/VC/House3D/index.html) with a reference to the shared [houseScene.js](file:///c:/Users/sreek/Desktop/VC/House3D/houseScene.js) file.
- This eliminated ~2,500 lines of duplicate code, synchronized all previous modeling updates (such as bedroom door relocations, furniture/wardrobe adjustments, and the new terrace staircase) to the home page, and resolved the issue where the homepage and walkthrough were out of sync.

---

## Phase 5 — Faucet Coordinate Bug Fixes (Completed)

We identified and resolved the cause of the hovering object in the first-floor dining room.

### Key Details

#### 1. Identified Copy-Paste Type Division Errors
- **The Issue**: A coordinate conversion typo inside `Fur.sink()` and `Fur.basin()` in [houseScene.js](file:///c:/Users/sreek/Desktop/VC/House3D/houseScene.js) caused the midpoint of horizontal spouts and nozzles to divide their millimeter coordinate offset by `2000` instead of `1000` when converting to Three.js world space meters.
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
- Fixed a bug in [walkthrough.html](file:///c:/Users/sreek/Desktop/VC/House3D/walkthrough.html) where in-place material modifications during the first scene traversal (such as upgrading the glass color to `0xafc4d2` and frame color to `0x3b3e42`) caused name resolution via `hex2name` to return `undefined` in later steps. This previously resulted in glass door frames, glass panes, and brass handles being treated as colliders, blocking the player from walking into the service balcony.
- Cached the original material names in `o.material.userData.name` during the first reskinning pass, and updated both the world-aligned UV texture mapper and first-person collision detector to read from `userData.name`. This enables smooth, walk-through traversal into the service balcony.

---

## Phase 7 — Bathroom Shower Fixtures Upgrades (Completed)

We installed premium, modern shower head fixtures (riser pipe, mixer handle, handheld wand, hose, and overhead rain shower plate) in all 5 bathrooms that have shower areas.

### Changes Made

#### 1. Added Modern Shower Fixture 3D Modeling Helper
- Implemented `Fur.showerHead(bag, cx, cy, fY, facing)` inside [houseScene.js](file:///c:/Users/sreek/Desktop/VC/House3D/houseScene.js).
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

We implemented requested architectural design updates to the 3D model in [houseScene.js](file:///c:/Users/sreek/Desktop/VC/House3D/houseScene.js):

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
- [walkthrough.html](file:///c:/Users/sreek/Desktop/VC/House3D/walkthrough.html): `isPlayerExterior()` treated plan y < 0 as "YARD / DRIVEWAY"; upper floors now allow y ≥ -762 so the service bands and south balconies label correctly.

### Verification
- `node --check` clean; zero console errors in both viewers.
- Raycast geometry audit (fresh `HouseScene.build` + `THREE.Raycaster`): old shell wall gone in both bands (rays reach the slider/kitchen walls at 1.93 m / 1.91 m), GF yard junk gone (ray hits grass at 0.045 m), washer porthole at x 7.21, C.B door face at x 8.756, hob top at f1+0.875, basin bowl at f1+0.87, grill-door approach clear to floor tile.
- Walkthrough visual pass: HUD labels (WET KITCHEN / UTILITY / DINING), sink+DW counter, stove + cupboards + grill door, washer stack, basin under window, C.B cupboard, dining slider sight line, and the south facade massing all confirmed on screen.

---

## Verification & Testing

- **Syntax & Compilation**: Verified [houseScene.js](file:///c:/Users/sreek/Desktop/VC/House3D/houseScene.js) with Node.js script execution — 0 errors.
- **Interactive Viewers**:
  - Orbit Viewer ([index.html](file:///c:/Users/sreek/Desktop/VC/House3D/index.html)): All layers render cleanly; south balcony overhangs and raised east balcony decks align perfectly.
  - Walkthrough ([walkthrough.html](file:///c:/Users/sreek/Desktop/VC/House3D/walkthrough.html)): First-person walking controller navigates transition steps onto the raised East balcony and through doors out to the south service balcony.



