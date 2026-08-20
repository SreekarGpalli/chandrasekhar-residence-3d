/**
 * V25 (reference) vs V27 south/east — default views + face-on box.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9336;

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
  const userData = path.join(outDir, '.chrome-cap3');
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
    if (!ready) throw new Error('scene did not boot ' + versionDir);

    async function shot(name, js) {
      await send('Runtime.evaluate', { expression: js, returnByValue: true });
      await sleep(200);
      await send('Runtime.evaluate', { expression: 'window.__el.resolve(24); true', returnByValue: true });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const file = path.join(outDir, prefix + name);
      fs.writeFileSync(file, Buffer.from(pic.data, 'base64'));
      console.log('wrote', prefix + name, fs.statSync(file).size);
    }

    await shot('east.png', "window.__el.applyView('east'); true");
    await shot('south.png', "window.__el.applyView('south'); true");
    await shot('south-box.png',
      "window.__el.look(15.80, 7.40, 0.77, 10.5, 0.04, 1.28); true");
    await shot('se.png',
      "window.__el.look(16.60, 6.80, 0.15, 12.0, 0.70, 1.18); true");
    await shot('roof-south.png',
      "window.__el.look(15.50, 11.50, 0.40, 9.0, 0.15, 1.05); true");

    ws.close();
  } finally {
    chrome.kill();
    await sleep(500);
  }
}

async function main() {
  await capture('version-twenty-five', 'V25_V24TREAT_20260814a', 'ref-');
  await capture('version-twenty-seven', 'V27_FLUSH_20260814c', 'chk-');
}
main().catch((e) => { console.error(e); process.exit(1); });
