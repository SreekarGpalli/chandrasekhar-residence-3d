# Chandrasekhar Residence — Interactive 3D

A plan-faithful, procedurally-built 3D visualization of the Chandrasekhar Family
Residence (G+2, Anantapur), running entirely in the browser with **Three.js**.
No build step, no framework — just static files.

- **`index.html`** — orbit / dollhouse viewer: rotate the building, switch
  between Exterior · Ground · First · Second, and tap rooms to inspect them.
- **`walkthrough.html`** — photoreal first-person walkthrough: WASD + mouse to
  walk the house, with collision, stair-climbing and a fly mode.

## Runs on any hardware

The renderer adapts itself to whatever device it's on, so the experience stays
smooth on old laptops and budget phones as well as high-end machines:

- **Hardware-tiered quality** (`perf.js`) — on load it reads the GPU, CPU core
  count, RAM and form factor and picks a tier (`high` / `medium` / `low` /
  `potato`) that sets pixel ratio, antialiasing, shadow resolution + filter, and
  texture anisotropy accordingly.
- **Dynamic resolution scaling** — every frame the real frame-time is measured
  and the drawing-buffer resolution is nudged up or down to hold the framerate
  in a target band. Even if the tier guess is off, it converges to smooth.
- **Static shadows** — the scene and sun never move, so the shadow map is
  rendered **once** instead of every frame (a large GPU saving).
- **On-demand rendering** (orbit viewer) — an idle, still view costs ~zero GPU;
  it only redraws while the camera is moving or just after you interact.
- **Tab-visibility pause** — rendering stops when the tab is hidden.
- **Self-hosted Three.js** — served from the same origin (Vercel's edge) for
  fast, reliable loading worldwide, with a CDN fallback if the local copy is
  missing.

## Run locally

It's a static site — serve the folder with any static server:

```bash
npx http-server -p 8129 -c-1
# then open http://localhost:8129/
```

(Opening `index.html` directly via `file://` won't work because the browser
blocks loading `houseScene.js` cross-origin; use a local server.)

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New… → Project** and import the repo.
3. Framework preset: **Other**. Leave the build command empty and the output
   directory as the repo root — there is nothing to build.
4. Deploy. `vercel.json` only sets long-lived cache headers for the static
   assets; no build configuration is required.

## Browser support

Any browser with WebGL 1 (all current Chrome, Edge, Firefox, Safari, and their
mobile versions). On devices without WebGL a clear message is shown instead of a
blank page.
