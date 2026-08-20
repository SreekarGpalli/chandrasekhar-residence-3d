/**
 * Terrace SE corner — V24/V25 reference vs V26/V27.
 * look(tx, ty, tz, radius, theta, phi)
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9337;

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

async function capture(versionDir, stamp, prefix) {
  const outDir = path.resolve(__dirname, '..', 'elevations', versionDir);
  const URL = 'http://localhost:8080/elevations/' + versionDir + '/?v=' + stamp;
  const userData = path.join(outDir, '.chrome-tse');
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
    if (!target) throw new Error('no page ' + versionDir);

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

    let ready = false;
    for (let i = 0; i < 60; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '!!(window.__el && window.__el.look && document.getElementById("loading") && document.getElementById("loading").classList.contains("done"))',
        returnByValue: true
      });
      if (r.result && r.result.value) { ready = true; break; }
      await sleep(500);
    }
    if (!ready) throw new Error('no boot ' + versionDir);

    async function shot(name, js) {
      await send('Runtime.evaluate', { expression: js, returnByValue: true });
      await sleep(200);
      await send('Runtime.evaluate', { expression: 'window.__el.resolve(20); true', returnByValue: true });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const file = path.join(outDir, prefix + name);
      fs.writeFileSync(file, Buffer.from(pic.data, 'base64'));
      console.log('wrote', prefix + name);
    }

    // Down onto the SE terrace corner
    await shot('tse-top.png',
      "window.__el.look(16.40, 11.55, 0.10, 7.2, 0.62, 0.85); true");
    // From the south, parapet on the box
    await shot('tse-south.png',
      "window.__el.look(16.20, 11.35, 0.85, 8.0, 0.08, 1.12); true");
    // From the east, patterned bay + corner
    await shot('tse-east.png',
      "window.__el.look(17.50, 11.40, -1.10, 8.5, 1.55, 1.12); true");
    // Oblique SE
    await shot('tse-se.png',
      "window.__el.look(16.70, 11.20, 0.25, 9.0, 0.78, 1.05); true");

    ws.close();
  } finally {
    chrome.kill();
    await sleep(400);
  }
}

async function main() {
  await capture('version-twenty-six', 'V26_FLUSH_20260814c', 'fix-');
  await capture('version-twenty-seven', 'V27_FLUSH_20260814d', 'fix-');
}
main().catch((e) => { console.error(e); process.exit(1); });
