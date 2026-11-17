# Chandrasekhar Residence — Interactive 3D

A plan-faithful, procedurally-built 3D visualization of the Chandrasekhar Family
Residence (G+2, Anantapur), running entirely in the browser with **Three.js**.
No build step, no framework — just static files.

- **`index.html`** is the 3D model viewer. Orbit and zoom around the house, inspect individual floors, and open **Rooms** to see room dimensions.
- **`walkthrough.html`** is the first-person walkthrough. Walk with WASD and the mouse, use touch gestures on a phone, or take the **Go to level** menu directly to a floor or the roof. Both pages have a **Help** button for controls.

## Switching design versions

- **Full House** uses the V43 exterior and furnished interiors. Open `/` or `/walkthrough.html`.
- **Full House 2** uses the V42 exterior and the same interiors. Open `/?v=full2` or `/walkthrough.html?v=full2`.

Use the header to switch between versions or between the 3D model and walkthrough. The 3D model carries your view, orbit, and lighting when you switch versions.

## Runs on any hardware

The renderer adapts itself to whatever device it's on, so the experience stays
smooth on old laptops and budget phones as well as high-end machines:

- **Hardware-tiered quality** (`perf.js`) — on load it reads the GPU, CPU core
  count, RAM and form factor and picks a tier (`high` / `medium` / `low` /
  `potato`) that sets pixel ratio, antialiasing, shadow resolution + filter, and
  texture anisotropy accordingly.
- **Three render paths, one per class of device.** The tier also picks *how* the
  frame is drawn:

  | Path | Who gets it | What it does |
  |------|-------------|--------------|
  | `full` | desktop with a discrete GPU | screen-space GI, screen-space reflections, screen-space cavity/edge shading, 64-sample jittered accumulation, ACES + grade |
  | `lite` | integrated GPUs, flagship phones | the same pipeline at reduced ray counts and 20 samples, capped at device pixel ratio 1 |
  | `off`  | ordinary phones, weak or software GPUs | a single forward pass with MSAA and ACES — one geometry pass instead of two, no full-screen ray marches |

  The heavy paths cost roughly 3× a forward frame, which is the wrong trade on a
  tiled mobile GPU, so phones without a modern GPU get `off` by default.
- **Temporal reprojection** — while you orbit, the previous frame is reprojected
  through the camera's motion instead of being discarded, so a moving view stays
  resolved rather than dissolving into single-sample noise. Measured at ~2.5×
  less frame-to-frame change than restarting the accumulation each frame.
- **Frame-budget watchdog** — device detection is a heuristic, so the viewer also
  measures. Sustained slow frames step the quality down a rung at a time
  (resolution → sample count → drop the pipeline entirely) until it is smooth.
- **Dynamic resolution scaling** — on the forward path, the real frame-time is
  measured every frame and the drawing-buffer resolution is nudged up or down to
  hold the framerate in a target band.
- **Static shadows** — the scene and sun never move, so the shadow map is
  rendered **once** instead of every frame (a large GPU saving).
- **On-demand rendering** (orbit viewer) — an idle, still view costs ~zero GPU;
  it only redraws while the camera is moving or just after you interact.
- **Tab-visibility pause** — rendering stops when the tab is hidden.
- **Self-hosted Three.js** — served from the same origin (Vercel's edge) for
  fast, reliable loading worldwide, with a CDN fallback if the local copy is
  missing.

### Forcing a quality level

Detection is a guess, and sometimes it is wrong. Two query parameters override
it — useful for testing what a phone sees, and for anyone whose device is
misidentified:

- `?q=high|medium|low|potato` — force the hardware tier
- `?post=full|lite|off` — force the render path

They combine with `?v=` (`/?v=full2&q=low`).

## Run locally

It's a static site — serve the folder with any static server:

```bash
node serve.js
# then open http://localhost:8080
```

Use the local server to load scene scripts and assets over HTTP.

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
