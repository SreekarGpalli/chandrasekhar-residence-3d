/**
 * Headless Chrome shots of V26 / V27 after the flush continuity fix.
 * East close-up: under-box slab wall. South: parapet + rod parity.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9334;

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
  const userData = path.join(outDir, '.chrome-cap');
  fs.mkdirSync(userData, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });
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
    if (!target) throw new Error('no page target for ' + versionDir);

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
    let stampGot = '';
    for (let i = 0; i < 60; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '({ok:!!(window.__el && window.__el.applyView && document.getElementById("loading") && document.getElementById("loading").classList.contains("done")), stamp: window.__HOUSE3D_STAIR_RAIL__ || ""})',
        returnByValue: true
      });
      if (r.result && r.result.value && r.result.value.ok) {
        ready = true;
        stampGot = r.result.value.stamp;
        break;
      }
      await sleep(500);
    }
    if (!ready) throw new Error('scene did not boot: ' + versionDir);
    console.log(versionDir, 'stamp', stampGot);

    async function shot(name, js) {
      await send('Runtime.evaluate', { expression: js, returnByValue: true });
      await sleep(250);
      await send('Runtime.evaluate', {
        expression: 'window.__el.resolve(24); true',
        returnByValue: true
      });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const file = path.join(outDir, name);
      fs.writeFileSync(file, Buffer.from(pic.data, 'base64'));
      console.log('wrote', file, fs.statSync(file).size);
    }

    await shot('cap-east.png', "window.__el.applyView('east'); true");
    await shot('cap-south.png', "window.__el.applyView('south'); true");
    // Tight on the FF slab under the east box
    await shot(
      'cap-east-under.png',
      "window.__el.look(22.5, 4.1, -1.2, 17.3, 4.0, -1.2); true"
    );
    // SE corner, see both legs + under-box wall
    await shot(
      'cap-se-corner.png',
      "window.__el.look(20.4, 5.6, 2.4, 15.8, 6.2, -0.4); true"
    );
    // Terrace SE — south parapet on the flushed leg
    await shot(
      'cap-terrace-se.png',
      "window.__el.look(16.4, 11.4, 0.20, 15.5, 11.0, 0.55); true"
    );

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
