/* ============================================================
   perf.js — adaptive quality + performance engine
   For project overview see .agents/README.md
   ------------------------------------------------------------
   Goal: a smooth, correct experience on ANY hardware, from old
   integrated-GPU laptops and budget phones up to gaming rigs.

   Strategy (three layers):
     1. Static tier  — read the device once (GPU string, cores,
        RAM, mobile, max texture size) and pick conservative-but-
        good defaults for pixel ratio, antialiasing, shadow map
        size/filter and texture anisotropy.
     2. Dynamic scaler — every frame, watch the real frame time
        and scale the drawing-buffer resolution up/down to keep
        the framerate in a target band. This is the safety net:
        even if the tier guess is wrong, the scene stays smooth.
     3. The pages themselves render shadows once (the scene and
        sun are static) and pause when the tab is hidden.

   Exposes window.Perf = {
     detect, makeScaler, onHidden, prefersReducedMotion, texSize,
     attachViewport, rendererOpts, onContextLoss, PRESETS
   };
   ============================================================ */
window.Perf = (function () {
  'use strict';

  /* Read the GPU's unmasked renderer string via a throwaway context.
     Used only to bias the tier; never relied on (it can be empty). */
  function probeGPU() {
    try {
      const c = document.createElement('canvas');
      /* Ask for WebGL2 FIRST. The old order requested 'webgl' and then tested
         the result with `instanceof WebGL2RenderingContext`, which is false by
         construction — a webgl context is never a webgl2 one — so this always
         reported webgl2: false on every device ever made. Anything gating a
         feature on it silently got the fallback. */
      const g2 = c.getContext('webgl2');
      const g = g2 || c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!g) return { name: '', maxTex: 2048, webgl2: false };
      const ext = g.getExtension('WEBGL_debug_renderer_info');
      const name = ext ? String(g.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '') : '';
      const maxTex = g.getParameter(g.MAX_TEXTURE_SIZE) || 2048;
      // best-effort cleanup of the probe context
      const lose = g.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      return { name: name, maxTex: maxTex, webgl2: !!g2 };
    } catch (_) { return { name: '', maxTex: 2048, webgl2: false }; }
  }

  /* Tier presets. scaleFloor = lowest the dynamic scaler may shrink
     the resolution to before it stops (keeps things legible).
     texSize = max edge for procedural canvas textures. */
  /* logDepth is FALSE on every tier and should stay that way.

     A logarithmic depth buffer writes gl_FragDepth from the fragment shader,
     and that has three consequences this project cannot afford:

       1. polygonOffset stops working. The offset is applied to the
          interpolated depth, which the shader then overwrites — so every
          coincident surface pair the viewers rely on polygonOffset to
          separate (the exterior shell vs. the per-floor duplicate of the same
          wall) z-fights instead. That was the flickering seen all over the
          high tier, and ONLY the high tier, because it was the only preset
          with this on.
       2. Any screen-space pass that reconstructs position from the depth
          texture reads a logarithmic value through a linear un-projection.
          The SSGI/SSR ray marches in index.html were tracing against a
          fictional scene as a result.
       3. Early-Z and hierarchical-Z are disabled for every draw, which costs
          more than the precision was ever worth here.

     near/far are 0.5/1200 (ratio 2400:1), so a plain 24-bit depth buffer
     resolves ~0.1 mm at 30 m and ~1 mm at 100 m. There is nothing to fix. */
  const PRESETS = {
    high:   { dpr: 2.0, antialias: true,  shadows: true,  shadowType: 'pcfsoft', shadowMap: 2048, anisotropy: 8, scaleFloor: 0.70, texSize: 512, post: 'full',  logDepth: false, powerPreference: 'high-performance' },
    medium: { dpr: 1.5, antialias: true,  shadows: true,  shadowType: 'pcf',     shadowMap: 1024, anisotropy: 4, scaleFloor: 0.55, texSize: 384, post: 'lite',  logDepth: false, powerPreference: 'high-performance' },
    /* `low` keeps MSAA and a PCF filter on purpose. It renders forward, with
       no post pipeline at all, so multisampling is its ONLY antialiasing —
       and on the tiled GPUs that land here, MSAA resolves inside tile memory
       and is close to free, while jagged railings and a hard-edged shadow map
       are the two things that actually make this tier look cheap. */
    low:    { dpr: 1.0, antialias: true,  shadows: true,  shadowType: 'pcf',     shadowMap: 512,  anisotropy: 1, scaleFloor: 0.45, texSize: 256, post: 'off',   logDepth: false, powerPreference: 'default' },
    potato: { dpr: 1.0, antialias: false, shadows: false, shadowType: 'basic',   shadowMap: 256,  anisotropy: 1, scaleFloor: 0.40, texSize: 128, post: 'off',   logDepth: false, powerPreference: 'low-power' }
  };

  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (_) { return false; }
  }

  /* Read a manual override off the URL: ?q=high|medium|low|potato forces the
     tier, ?post=full|lite|off forces the render path. Two reasons this earns
     its place. Testing: the tiers are the whole low-end story and there is no
     other way to see what a phone sees from a desktop. And support: device
     detection is heuristic, so when it guesses wrong for someone there needs to
     be a link you can send them that works. */
  function urlOverride() {
    try {
      const p = new URLSearchParams(location.search);
      const o = {};
      const q = (p.get('q') || '').toLowerCase();
      if (PRESETS[q]) o.tier = q;
      const post = (p.get('post') || '').toLowerCase();
      if (post === 'full' || post === 'lite' || post === 'off') o.post = post;
      return o;
    } catch (_) { return {}; }
  }

  function detect(overrides) {
    const forced = urlOverride();
    const probe = probeGPU();
    const gpu = probe.name || '';
    const ua = navigator.userAgent || '';
    const mobile = /android|iphone|ipad|ipod|iemobile|mobile|tablet|silk/i.test(ua)
      || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)); // iPadOS desktop UA
    const cores = navigator.hardwareConcurrency || (mobile ? 4 : 8);
    const mem = navigator.deviceMemory || (mobile ? 3 : 8);
    const dprRaw = window.devicePixelRatio || 1;
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    const slowNet = !!(navigator.connection && /2g/i.test(navigator.connection.effectiveType || ''));

    // Software / emulated renderers — render on the CPU, must go minimal.
    const software = /(swiftshader|llvmpipe|software|microsoft basic render|google.*angle.*(disabled|software))/i.test(gpu);
    // Known weak integrated / old mobile GPUs.
    const weakGPU = /(mali-4|mali-t6|mali-t7|mali-g3|adreno \(?(1|2|3)\d\d|powervr sgx|powervr.*g6|intel.*(gma|hd graphics (2|3|4)\d{2}\b|graphics media))/i.test(gpu);
    // Strong discrete / modern mobile
    const strongGPU = /(nvidia|geforce|radeon|rtx |gtx |apple m[1-4]|apple gpu|adreno \(?[6-9]|mali-g7|mali-g[89]|adreno \(?7)/i.test(gpu);

    let tier = 'high';
    if (mobile || cores <= 4 || mem <= 4 || weakGPU || saveData) tier = 'medium';
    if (cores <= 2 || mem <= 2 || (weakGPU && mobile) || slowNet) tier = 'low';
    if (software || probe.maxTex < 2048) tier = 'potato';
    // Bump real gaming-class desktop back up if we over-downgraded on cores alone
    if (!mobile && strongGPU && mem >= 8 && cores >= 6 && tier === 'medium' && !saveData) tier = 'high';
    if (forced.tier) tier = forced.tier;

    const preset = Object.assign({}, PRESETS[tier], overrides || {}, forced);
    /* Phones that are not on a modern GPU do not run the screen-space pipeline
       at all, whatever tier they landed in. `medium` is where every phone with
       a plausible core count ends up, and the pipeline's cost there is a second
       full-screen geometry pass plus four ray-marched full-screen passes — on a
       tiled mobile GPU that is the difference between 60 fps and 12. The
       forward path with MSAA is both the cheaper AND the better-looking answer
       on that hardware, and the frame-time watchdog in the viewer can still
       step a device down further if even that struggles. */
    if (mobile && !strongGPU && !forced.post && preset.post !== 'off') preset.post = 'off';
    // Never request a pixel ratio higher than the device actually has.
    // On phones, hard-cap at 1.75 even when reported DPR is 3 — saves fill-rate.
    const dprCap = mobile ? Math.min(1.75, preset.dpr) : preset.dpr;
    preset.dpr = Math.min(dprCap, dprRaw);
    // Shadow maps cannot exceed GPU texture limit (and waste VRAM on weak GPUs)
    const shadowCap = Math.min(preset.shadowMap, Math.max(256, probe.maxTex / 2));
    preset.shadowMap = shadowCap;
    preset.reducedMotion = prefersReducedMotion();
    preset.maxTex = probe.maxTex;
    preset.webgl2 = probe.webgl2;
    return Object.assign({ tier: tier, gpu: gpu, mobile: mobile, cores: cores, mem: mem }, preset);
  }

  /* Options for THREE.WebGLRenderer construction from a quality profile. */
  function rendererOpts(q, canvas) {
    return {
      canvas: canvas,
      antialias: !!(q && q.antialias),
      powerPreference: (q && q.powerPreference) || 'high-performance',
      // Don't refuse software GL — potato tier handles it.
      failIfMajorPerformanceCaveat: false,
      alpha: false,
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: !!(q && q.logDepth),
      preserveDrawingBuffer: false
    };
  }

  /* Cap a requested texture edge to the tier's budget. */
  function texSize(q, preferred) {
    const cap = (q && q.texSize) || 512;
    const gpuCap = (q && q.maxTex) ? Math.min(q.maxTex, 4096) : 2048;
    return Math.max(64, Math.min(preferred || cap, cap, gpuCap));
  }

  /* Dynamic resolution scaler. Call sample(frameMs) once per frame.
     Smaller steps + longer cooldowns reduce hitchy quality pumping.
     onChange(dpr) is optional — walkthrough uses it to throttle RT rebuilds. */
  function makeScaler(renderer, q, opts) {
    opts = opts || {};
    const targetMs = 1000 / (opts.targetFps || 58);
    const hardMs = 1000 / (opts.minFps || 32);
    const floor = q.scaleFloor != null ? q.scaleFloor : 0.5;
    const maxDpr = q.dpr;
    const onChange = typeof opts.onChange === 'function' ? opts.onChange : null;
    // Hard cap on drawing buffer area (~8M pixels) — protects integrated GPUs
    // when the window is large AND dpr is high.
    const maxPixels = opts.maxPixels || (q.mobile ? 2.5e6 : 8e6);

    let scale = 1;          // 0..1 multiplier on maxDpr
    let ema = targetMs;     // smoothed frame time
    let cooldown = 0;       // frames to wait after an adjustment
    let lastApply = 0;
    let frozen = false;
    let stableFrames = 0;

    function apply() {
      let dpr = maxDpr * scale;
      // Area clamp: if w*h*dpr^2 is huge, pull dpr down further
      try {
        const el = renderer.domElement;
        const w = el.clientWidth || window.innerWidth || 1;
        const h = el.clientHeight || window.innerHeight || 1;
        const area = w * h * dpr * dpr;
        if (area > maxPixels) dpr = Math.sqrt(maxPixels / (w * h));
      } catch (_) { /* ignore */ }
      dpr = Math.max(0.5, Math.min(maxDpr, dpr));
      renderer.setPixelRatio(dpr);
      lastApply = performance.now();
      if (onChange) onChange(dpr);
    }
    apply();

    function sample(frameMs) {
      if (frozen) return;
      // ignore absurd spikes (tab wake, GC, alt-tab) so they don't nuke quality
      const ms = Math.min(frameMs, 100);
      ema += (ms - ema) * 0.08;
      if (cooldown > 0) { cooldown--; return; }

      // Freeze scaler after a long stretch of good frames to stop pumping.
      if (ema < targetMs * 0.85 && scale >= 0.98) {
        stableFrames++;
        if (stableFrames > 400) { frozen = true; return; }
      } else {
        stableFrames = 0;
      }

      // Don't resize more often than every ~250ms (POST RT thrash protection).
      if (performance.now() - lastApply < 250) return;

      if (ema > hardMs && scale > floor) {            // way too slow → shrink
        scale = Math.max(floor, scale - 0.08); apply(); cooldown = 50;
      } else if (ema > targetMs && scale > floor) {   // a bit slow → shrink gently
        scale = Math.max(floor, scale - 0.04); apply(); cooldown = 55;
      } else if (ema < targetMs * 0.65 && scale < 1) { // lots of headroom → grow back
        scale = Math.min(1, scale + 0.03); apply(); cooldown = 90;
      }
    }

    return {
      sample: sample,
      apply: apply,
      freeze: function () { frozen = true; },
      unfreeze: function () { frozen = false; stableFrames = 0; },
      get scale() { return scale; },
      get dpr() { return maxDpr * scale; },
      get frozen() { return frozen; }
    };
  }

  /* Run a callback whenever the page is hidden/shown (Page Visibility). */
  function onHidden(cb) {
    document.addEventListener('visibilitychange', function () { cb(document.hidden); });
  }

  /* Mobile browser chrome (URL bar show/hide) fires visualViewport resize
     without a matching window resize. Bind both for correct aspect. */
  function attachViewport(resizeFn) {
    let t = 0;
    function onResize() {
      clearTimeout(t);
      t = setTimeout(resizeFn, 50);
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
      window.visualViewport.addEventListener('scroll', onResize);
    }
    resizeFn();
    return function detach() {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
        window.visualViewport.removeEventListener('scroll', onResize);
      }
    };
  }

  /* Recover from GPU process loss (common on mobile after backgrounding). */
  function onContextLoss(canvas, onLost, onRestored) {
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      if (onLost) onLost(e);
    }, false);
    canvas.addEventListener('webglcontextrestored', function (e) {
      if (onRestored) onRestored(e);
    }, false);
  }

  return {
    probeGPU: probeGPU,
    detect: detect,
    makeScaler: makeScaler,
    onHidden: onHidden,
    prefersReducedMotion: prefersReducedMotion,
    texSize: texSize,
    rendererOpts: rendererOpts,
    attachViewport: attachViewport,
    onContextLoss: onContextLoss,
    PRESETS: PRESETS
  };
})();
