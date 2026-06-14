/* ============================================================
   perf.js — adaptive quality + performance engine
   ------------------------------------------------------------
   Goal: a smooth, correct experience on ANY hardware, from old
   integrated-GPU laptops and budget phones up to gaming rigs.

   Strategy (three layers):
     1. Static tier  — read the device once (GPU string, cores,
        RAM, mobile) and pick conservative-but-good defaults for
        pixel ratio, antialiasing, shadow map size/filter and
        texture anisotropy.
     2. Dynamic scaler — every frame, watch the real frame time
        and scale the drawing-buffer resolution up/down to keep
        the framerate in a target band. This is the safety net:
        even if the tier guess is wrong, the scene stays smooth.
     3. The pages themselves render shadows once (the scene and
        sun are static) and pause when the tab is hidden.

   Exposes window.Perf = { detect, makeScaler, onHidden }.
   ============================================================ */
window.Perf = (function () {
  'use strict';

  /* Read the GPU's unmasked renderer string via a throwaway context.
     Used only to bias the tier; never relied on (it can be empty). */
  function probeGPU() {
    try {
      const c = document.createElement('canvas');
      const g = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!g) return '';
      const ext = g.getExtension('WEBGL_debug_renderer_info');
      const s = ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
      // best-effort cleanup of the probe context
      const lose = g.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      return String(s || '');
    } catch (_) { return ''; }
  }

  /* Tier presets. scaleFloor = lowest the dynamic scaler may shrink
     the resolution to before it stops (keeps things legible). */
  const PRESETS = {
    high:   { dpr: 2.0, antialias: true,  shadows: true,  shadowType: 'pcfsoft', shadowMap: 2048, anisotropy: 8, scaleFloor: 0.70 },
    medium: { dpr: 1.5, antialias: true,  shadows: true,  shadowType: 'pcf',     shadowMap: 1024, anisotropy: 4, scaleFloor: 0.55 },
    low:    { dpr: 1.0, antialias: false, shadows: true,  shadowType: 'basic',   shadowMap: 1024, anisotropy: 1, scaleFloor: 0.45 },
    potato: { dpr: 1.0, antialias: false, shadows: false, shadowType: 'basic',   shadowMap: 512,  anisotropy: 1, scaleFloor: 0.40 }
  };

  function detect(overrides) {
    const gpu = probeGPU();
    const ua = navigator.userAgent || '';
    const mobile = /android|iphone|ipad|ipod|iemobile|mobile|tablet|silk/i.test(ua);
    const cores = navigator.hardwareConcurrency || (mobile ? 4 : 8);
    const mem = navigator.deviceMemory || (mobile ? 3 : 8);

    // Software / emulated renderers — render on the CPU, must go minimal.
    const software = /(swiftshader|llvmpipe|software|microsoft basic render|google.*angle.*(disabled|software))/i.test(gpu);
    // Known weak integrated / old mobile GPUs.
    const weakGPU = /(mali-4|mali-t6|mali-t7|mali-g3|adreno \(?(1|2|3)\d\d|powervr sgx|powervr.*g6|intel.*(gma|hd graphics (2|3|4)\d{2}\b|graphics media))/i.test(gpu);

    let tier = 'high';
    if (mobile || cores <= 4 || mem <= 4 || weakGPU) tier = 'medium';
    if (cores <= 2 || mem <= 2 || weakGPU && mobile) tier = 'low';
    if (software) tier = 'potato';

    const preset = Object.assign({}, PRESETS[tier], overrides || {});
    // Never request a pixel ratio higher than the device actually has.
    preset.dpr = Math.min(preset.dpr, window.devicePixelRatio || 1);
    return Object.assign({ tier: tier, gpu: gpu, mobile: mobile, cores: cores, mem: mem }, preset);
  }

  /* Dynamic resolution scaler. Call sample(frameMs) once per frame.
     It nudges renderer.setPixelRatio (which re-applies the drawing
     buffer size) to hold the framerate in [minFps .. targetFps]. */
  function makeScaler(renderer, q, opts) {
    opts = opts || {};
    const targetMs = 1000 / (opts.targetFps || 58);
    const hardMs = 1000 / (opts.minFps || 32);
    const floor = q.scaleFloor != null ? q.scaleFloor : 0.5;
    const maxDpr = q.dpr;

    let scale = 1;          // 0..1 multiplier on maxDpr
    let ema = targetMs;     // smoothed frame time
    let cooldown = 0;       // frames to wait after an adjustment

    function apply() { renderer.setPixelRatio(maxDpr * scale); }
    apply();

    function sample(frameMs) {
      // ignore absurd spikes (tab wake, GC, alt-tab) so they don't nuke quality
      const ms = Math.min(frameMs, 100);
      ema += (ms - ema) * 0.1;
      if (cooldown > 0) { cooldown--; return; }
      if (ema > hardMs && scale > floor) {            // way too slow → shrink hard
        scale = Math.max(floor, scale - 0.14); apply(); cooldown = 40;
      } else if (ema > targetMs && scale > floor) {   // a bit slow → shrink gently
        scale = Math.max(floor, scale - 0.07); apply(); cooldown = 40;
      } else if (ema < targetMs * 0.7 && scale < 1) { // lots of headroom → grow back
        scale = Math.min(1, scale + 0.05); apply(); cooldown = 80;
      }
    }

    return {
      sample: sample,
      apply: apply,
      get scale() { return scale; },
      get dpr() { return maxDpr * scale; }
    };
  }

  /* Run a callback whenever the page is hidden/shown (Page Visibility). */
  function onHidden(cb) {
    document.addEventListener('visibilitychange', function () { cb(document.hidden); });
  }

  return { probeGPU: probeGPU, detect: detect, makeScaler: makeScaler, onHidden: onHidden };
})();
