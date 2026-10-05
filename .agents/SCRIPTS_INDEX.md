# Scripts Index

> Categorized index of all scripts in `scripts/`. Most are Node.js/Puppeteer
> automation scripts. None are required for the site to run — they are
> development/build/capture tools.

---

## Capture Scripts (Screenshot Automation)

Headless Chrome scripts that load the viewer and capture screenshots at
specific camera angles. Used to generate comparison renders and documentation.

| Script | Purpose |
|--------|---------|
| `capture-user-views.js` | Capture from user-defined camera positions |
| `capture-angles.js` | Capture at multiple orbital angles |
| `capture-human-views.js` | Human-eye-level perspective captures |
| `capture-gpu-photoreal.js` | High-quality GPU-rendered captures |
| `capture-open-rods.js` | Capture open rod design views |
| `capture-perg-compound.js` | Capture pergola and compound views |
| `capture-south-fill.js` | South elevation fill captures |
| `capture-terrace-se.js` | Terrace SE corner captures |
| `capture-v22-se.js` | V22 SE corner captures |
| `capture-v26-v27-close.js` | V26/V27 close-up captures |
| `capture-v26-v27-fix.js` | V26/V27 fix verification captures |
| `capture-v27-south.js` | V27 south elevation captures |
| `capture-v28.js` | V28 design captures |
| `capture-v29.js` | V29 design captures |
| `capture-v30.js` | V30 design captures |
| `capture-v31.js` | V31 design captures |
| `capture-v32.js` | V32 design captures |
| `capture-v33.js` | V33 design captures |
| `capture-v35.js` | V35 design captures |
| `capture-v36.js` | V36 design captures |
| `capture-v37.js` | V37 design captures |
| `capture-v37-human-views.js` | V37 human-eye-level captures |
| `capture-v38-v39.js` | V38/V39 design captures |
| `capture-v40.js` | V40 design captures |
| `capture-v41.js` | V41 design captures |
| `compare-capture.js` | Side-by-side comparison captures |
| `shoot-v30.js` | V30 specific angle shots |
| `snapshot-v21-to-v23.js` | V21→V23 progression snapshots |

**Supporting**: `compare-stitch.ps1` — PowerShell script to stitch comparison images.

---

## Fix Scripts (Geometry Corrections)

Scripts that modify `houseScene.js` to fix geometry bugs or adjust positions.
Most are one-time patches — applied once and kept for history.

| Script | Purpose |
|--------|---------|
| `fix-elevation-boot.js` | Fix elevation viewer bootstrap issues |
| `fix-elevation-paths.js` | Fix elevation asset URL paths |
| `fix-stair-east-rail-real.js` | Fix east stair railing geometry |
| `fix-stair-interior-rail-v123.js` | Fix interior stair rail (all 3 floors) |
| `fix-stair-rail-sides-v123.js` | Fix stair rail side alignment |
| `fix-stair-rails-all.js` | Comprehensive stair rail fix |
| `fix-stair-rails-canonical.js` | Canonical stair rail positions |
| `fix-stair-rails-v123.js` | Version-specific stair rail fixes |
| `fix-v5-geometry.js` | Design V5 geometry corrections |
| `fix-void-rails-both-sides-v123.js` | Void safety rail fixes |

---

## Build / Scaffold Scripts (Design Version Generation)

Scripts that generate new design versions or scaffold elevation variants.

| Script | Purpose |
|--------|---------|
| `design-version-five.js` | Generate Design Version 5 geometry |
| `scaffold-v4-v5.js` | Scaffold V4→V5 transition |
| `scaffold-v21-v22.js` | Scaffold V21→V22 transition |
| `build-elevation-exteriors.js` | Build all elevation exterior variants (30K lines) |
| `rewrite-v5-east.js` | Rewrite V5 east facade geometry |

---

## Verification & Diagnostic Scripts

Scripts that validate geometry, check for errors, or dump diagnostic info.

| Script | Purpose |
|--------|---------|
| `verify-elevations.js` | Full elevation geometry verification |
| `verify-elevation-urls.js` | Check all elevation asset URLs resolve |
| `verify-v21-v22.js` | Verify V21/V22 geometry consistency |
| `verify-stair-rail.js` | Verify stair rail positions |
| `diagnose-elevations.js` | Diagnose elevation rendering issues |
| `debug-boot.js` | Debug viewer bootstrap sequence |
| `dump-stair-rails.js` | Dump stair rail geometry data |
| `list-stair-meshes.js` | List all stair-related meshes |
| `list-stair-pb.js` | List all stair `pb()` calls |
| `http-verify-all.js` | HTTP-based full verification |
| `http-verify-stair.js` | HTTP-based stair verification |

---

## One-Off Geometry Tweaks

Small targeted adjustments to specific building elements.

| Script | Purpose |
|--------|---------|
| `align-east-openings-v123.js` | Align east facade openings |
| `cache-bust-elevations-v123.js` | Cache-bust elevation assets |
| `extend-void-rail-v123.js` | Extend void safety rails |
| `force-stair-rail-update-v123.js` | Force stair rail recalculation |
| `lift-shaft-white-v123.js` | Change lift shaft material to white |
| `move-east-doors-north.js` | Shift east-face doors northward |
| `nudge-east-windows-v123.js` | Nudge east window positions |
| `nudge-windows-left-v123.js` | Nudge windows leftward |
| `plain-facade-v123.js` | Simplify facade details |
| `reverse-ugly-rail-supports-v123.js` | Reverse problematic rail supports |
| `sf-window-gap-v123.js` | Fix SF window gap |
| `simplify-elevation-nav.js` | Simplify elevation navigation UI |
| `stair-wall-white-v123.js` | Change stair wall material to white |
| `terrace-open-rail-v123.js` | Open up terrace railings |
| `terrace-rails-and-supports-v123.js` | Terrace rail support geometry |
| `thin-rail-pillars-v123.js` | Thin out rail pillar dimensions |
| `tweak-east-windows-v123.js` | Fine-tune east window positions |
| `windows-250mm-v123.js` | Adjust windows to 250mm standard |

---

## Blender / Export Scripts

| Script | Purpose |
|--------|---------|
| `export-to-blender.js` | Node.js GLB export server (receives from `export-to-blender.html`) |
| `setup_blender_scene.py` | Python script to configure Blender scene after GLB import |

---

## Naming Convention

- `*-v123.js` — Applies the change to all three elevation versions (V1, V2, V3)
- `capture-v*.js` — Captures screenshots for a specific design version
- `fix-*.js` — Bug fix or geometry correction
- `scaffold-*.js` — Generates a new design version from an existing one
