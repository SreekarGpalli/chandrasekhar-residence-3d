/**
 * Close-ups of the flushed box: under-slab wall, south parapet, rod parity.
 * look(tx, ty, tz, radius, theta, phi) — orbit, not world pos.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9335;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function get(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => {
      const c = [];
      r.on('data', (d) => c.push(d));
      r.on('end', () => res(JSON.parse(Buffer.concat(c).toString() || 'null')));
    }).on('error', rej);
  });
}
async function waitPort() {
  for (let i = 0; i < 40; i++) {
    try { await get('http://127.0.0.1:' + PORT + '/json/version'); return; }
    catch (_) { await sleep(200); }
  }
  throw new Error('chrome debug port did not open');
}

async function capture(versionDir, stamp, outDir) {
  const URL = 'http://localhost:8080/elevations/' + versionDir + '/?v=' + stamp;
  const userData = path.join(outDir, '.chrome-cap2');
  fs.mkdirSync(userData, { recursive: true });
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check',
    '--window-size=1600,900',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + userData,
    URL
  ], { stdio: 'ignore' });

  try {
    await waitPort();
    let target;
    for (let i = 0; i < 30; i++) {
      const list = await get('http://127.0.0.1:' + PORT + '/json/list');
      target = (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target) break;
      await sleep(200);
    }
    if (!target) throw new Error('no page target');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
    };
    function send(method, params) {
      const n = ++id;
      return new Promise((res, rej) => {
        pending.set(n, { res, rej });
        ws.send(JSON.stringify({ id: n, method, params }));
      });
    }
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.bringToFront');

    let ready = false;
    for (let i = 0; i < 60; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '!!(window.__el && window.__el.look && document.getElementById("loading") && document.getElementById("loading").classList.contains("done"))',
        returnByValue: true
      });
      if (r.result && r.result.value) { ready = true; break; }
      await sleep(500);
    }
    if (!ready) throw new Error('scene did not boot');

    async function shot(name, js) {
      await send('Runtime.evaluate', { expression: js, returnByValue: true });
      await sleep(200);
      await send('Runtime.evaluate', { expression: 'window.__el.resolve(24); true', returnByValue: true });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const file = path.join(outDir, name);
      fs.writeFileSync(file, Buffer.from(pic.data, 'base64'));
      console.log('wrote', name, fs.statSync(file).size);
    }

    // East, tight on FF slab under the box. theta=π/2 looks from +X.
    await shot('close-east-under.png',
      "window.__el.look(17.37, 3.92, -1.20, 6.2, 1.5708, 1.38); true");
    // East, mid-box so rods + splay + under wall read together
    await shot('close-east-box.png',
      "window.__el.look(17.37, 7.20, -1.20, 9.5, 1.520, 1.32); true");
    // South, the L-box / return. theta=0 looks from +Z (south).
    await shot('close-south-box.png',
      "window.__el.look(15.80, 7.20, 0.77, 9.0, 0.08, 1.32); true");
    // SE oblique — both legs + under-box L
    await shot('close-se.png',
      "window.__el.look(16.60, 6.40, 0.20, 11.0, 0.72, 1.22); true");
    // Terrace, south parapet on the flushed leg
    await shot('close-terrace.png',
      "window.__el.look(15.80, 11.35, 0.35, 7.5, 0.55, 1.05); true");

    ws.close();
  } finally {
    chrome.kill();
    await sleep(400);
  }
}

async function main() {
  const root = path.resolve(__dirname, '..', 'elevations');
  await capture('version-twenty-six', 'V26_FLUSH_20260814b',
    path.join(root, 'version-twenty-six'));
  await capture('version-twenty-seven', 'V27_FLUSH_20260814b',
    path.join(root, 'version-twenty-seven'));
}
main().catch((e) => { console.error(e); process.exit(1); });
