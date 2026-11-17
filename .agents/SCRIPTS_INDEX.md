# Scripts Index

Run the local viewer with `npm start` and check the deployment budget with
`npm run check:deploy`.

## Scene inspection and capture

- `scripts/audit-interiors.js` audits interior geometry.
- `scripts/capture-all-fixtures.js` captures fixture checks.
- `tools/coplanar-audit.js` checks the running walkthrough for coplanar faces.

## Blender and drawings

- `npm run export:blender` runs `scripts/export-blender-web.js`.
- `scripts/export-to-blender.js` serves the local GLB export workflow.
- `scripts/setup_blender_scene.py` configures the imported Blender scene.
- `scripts/render_hall_cycles.py` renders the hall in Blender.
- `scripts/media_wall_a4.py` and `scripts/media_wall_drawing.py` generate drawings.
