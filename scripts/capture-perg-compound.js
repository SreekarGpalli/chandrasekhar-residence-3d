/**
 * Inspect SF pergola + compound wall on V29 (source of V33–V36).
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9360;
const OUT = path.resolve(__dirname, '..', 'elevations', 'version-twenty-nine');
const URL = 'http://localhost:8080/elevations/version-twenty-nine/?v=V29_PERG_20260816a';

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

async function main() {
  const userData = path.join(OUT, '.chrome-perg');
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
    for (let i = 0; i < 40; i++) {
      try { await get('http://127.0.0.1:' + PORT + '/json/version'); break; }
      catch (_) { await sleep(200); }
    }
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
    for (let i = 0; i < 60; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '({ok:!!(window.__el && window.__el.look && document.getElementById("loading") && document.getElementById("loading").classList.contains("done"))})',
        returnByValue: true
      });
      if (r.result && r.result.value && r.result.value.ok) { ready = true; break; }
      await sleep(500);
    }
    if (!ready) throw new Error('no boot');

    async function shot(name, js) {
      await send('Runtime.evaluate', { expression: js, returnByValue: true });
      await sleep(220);
      await send('Runtime.evaluate', { expression: 'window.__el.resolve(22); true', returnByValue: true });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      fs.writeFileSync(path.join(OUT, name), Buffer.from(pic.data, 'base64'));
      console.log('wrote', name);
    }

    await shot('insp-east.png', "window.__el.applyView('east'); true");
    await shot('insp-south.png', "window.__el.applyView('south'); true");
    await shot('insp-hero.png', "window.__el.applyView('hero'); true");
    await shot('insp-aerial.png', "window.__el.applyView('aerial'); true");
    await shot('insp-perg-se.png',
      "window.__el.look(15.80, 10.40, 1.20, 8.5, 0.72, 1.05); true");
    await shot('insp-perg-east.png',
      "window.__el.look(15.80, 10.20, -1.40, 7.2, 1.20, 1.12); true");
    await shot('insp-perg-top.png',
      "window.__el.look(15.80, 10.70, -1.40, 6.5, 0.95, 0.55); true");
    await shot('insp-comp-east.png',
      "window.__el.look(17.00, 1.40, -4.40, 18.0, 1.45, 1.35); true");
    await shot('insp-comp-se.png',
      "window.__el.look(11.00, 1.20, 0.80, 16.0, 0.55, 1.32); true");
    await shot('insp-comp-ne.png',
      "window.__el.look(11.00, 1.40, -14.00, 18.0, 2.35, 1.28); true");
    await shot('insp-gate.png',
      "window.__el.look(21.80, 1.20, -6.50, 8.0, 1.55, 1.35); true");

    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
