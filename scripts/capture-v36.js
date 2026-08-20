/**
 * V36 SF east SE MS rail — east, hero, south, SE, close SF guard.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9346;
const OUT = path.resolve(__dirname, '..', 'elevations', 'version-thirty-six');
const URL = 'http://localhost:8080/elevations/version-thirty-six/?v=V36_SERAIL_20260816a';

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
  const userData = path.join(OUT, '.chrome-v36');
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

    await shot('v36-hero.png', "window.__el.applyView('hero'); true");
    await shot('v36-east.png', "window.__el.applyView('east'); true");
    await shot('v36-south.png', "window.__el.applyView('south'); true");
    await shot('v36-se.png',
      "window.__el.look(16.70, 6.80, 0.20, 12.5, 0.74, 1.16); true");
    await shot('v36-se-sf.png',
      "window.__el.look(17.28, 8.00, 1.40, 8.2, 0.92, 1.22); true");
    await shot('v36-se-corner.png',
      "window.__el.look(17.25, 8.10, -0.40, 5.6, 0.55, 1.18); true");

    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
