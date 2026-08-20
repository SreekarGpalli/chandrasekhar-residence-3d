/**
 * V31 FF MS rails — east, hero, SE, south, box, balcony.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9339;
const OUT = path.resolve(__dirname, '..', 'elevations', 'version-thirty-one');
const URL = 'http://localhost:8080/elevations/version-thirty-one/?v=V31_MSRAIL_20260815e';

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

async function main() {
  const userData = path.join(OUT, '.chrome-v31');
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
    if (!target) throw new Error('no page');

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
    let stamp = '';
    for (let i = 0; i < 60; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '({ok:!!(window.__el && window.__el.look && document.getElementById("loading") && document.getElementById("loading").classList.contains("done")), stamp: window.__HOUSE3D_STAIR_RAIL__||""})',
        returnByValue: true
      });
      if (r.result && r.result.value && r.result.value.ok) {
        ready = true;
        stamp = r.result.value.stamp;
        break;
      }
      await sleep(500);
    }
    if (!ready) throw new Error('no boot');
    console.log('stamp', stamp);

    async function shot(name, js) {
      await send('Runtime.evaluate', { expression: js, returnByValue: true });
      await sleep(220);
      await send('Runtime.evaluate', { expression: 'window.__el.resolve(22); true', returnByValue: true });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      fs.writeFileSync(path.join(OUT, name), Buffer.from(pic.data, 'base64'));
      console.log('wrote', name);
    }

    await shot('v31-hero.png', "window.__el.applyView('hero'); true");
    await shot('v31-east.png', "window.__el.applyView('east'); true");
    await shot('v31-south.png', "window.__el.applyView('south'); true");
    await shot('v31-south-rods.png',
      "window.__el.look(15.70, 6.20, 0.80, 9.0, 0.08, 1.22); true");
    await shot('v31-south-join.png',
      "window.__el.look(14.20, 5.80, 0.80, 6.5, 0.12, 1.28); true");
    await shot('v31-se.png',
      "window.__el.look(16.70, 6.80, 0.20, 12.5, 0.74, 1.16); true");
    await shot('v31-box.png',
      "window.__el.look(17.90, 5.80, -4.20, 7.0, 1.05, 1.34); true");
    await shot('v31-sbal.png',
      "window.__el.look(2.40, 4.90, 0.60, 9.5, 0.50, 1.40); true");
    await shot('v31-ne.png',
      "window.__el.look(18.40, 6.20, -9.20, 7.5, 2.15, 1.18); true");
    await shot('v31-se-col.png',
      "window.__el.look(17.40, 6.20, 0.80, 6.5, 0.85, 1.22); true");
    await shot('v31-ne-rail.png',
      "window.__el.look(17.20, 8.20, -9.70, 5.5, 2.35, 1.15); true");

    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
