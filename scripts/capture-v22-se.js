/**
 * Headless Chrome screenshots of V22 south / SE views.
 * Verifies the south fin return hides the SE portico column.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const OUT = path.resolve(__dirname, '..', 'elevations', 'version-twenty-two');
const URL = 'http://localhost:8080/elevations/version-twenty-two/?v=V22_SOUTH_RET_20260814d';

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
  const userData = path.join(OUT, '.chrome-cap');
  fs.mkdirSync(userData, { recursive: true });
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
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

    // Wait for HouseScene boot + __el
    let ready = false;
    for (let i = 0; i < 60; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '!!(window.__el && window.__el.applyView && document.getElementById("loading") && document.getElementById("loading").classList.contains("done"))',
        returnByValue: true
      });
      if (r.result && r.result.value) { ready = true; break; }
      await sleep(500);
    }
    if (!ready) throw new Error('scene did not boot');

    async function shot(name, js) {
      await send('Runtime.evaluate', { expression: js, returnByValue: true });
      await sleep(200);
      await send('Runtime.evaluate', {
        expression: 'window.__el.resolve(24); true',
        returnByValue: true
      });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const file = path.join(OUT, name);
      fs.writeFileSync(file, Buffer.from(pic.data, 'base64'));
      console.log('wrote', name, fs.statSync(file).size);
    }

    await shot('cap-hero.png', "window.__el.applyView('hero'); true");
    await shot('cap-south.png', "window.__el.applyView('south'); true");
    await shot('cap-east.png', "window.__el.applyView('east'); true");
    await shot(
      'cap-se-south.png',
      "window.__el.look(16.75, 6.2, 0.80, 11.5, 0.08, 1.22); true"
    );
    await shot(
      'cap-se-corner.png',
      "window.__el.look(16.6, 6.0, 0.40, 10.0, 0.55, 1.18); true"
    );
    // Terrace SE — confirm the south parapet wall is still there
    await shot(
      'cap-terrace-se.png',
      "window.__el.look(16.4, 11.4, 0.20, 9.0, 0.45, 0.72); true"
    );

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
