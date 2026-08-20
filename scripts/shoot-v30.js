/**
 * Flexible V30 shooter.
 *   node scripts/shoot-v30.js <tag> "<name>=<js>" ...
 * Each view js runs in the page; screenshots land in scratchpad/<tag>-<name>.png
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9341;
const OUT = process.env.SHOT_OUT ||
  'C:\\Users\\sreek\\AppData\\Local\\Temp\\claude\\C--Users-sreek-Desktop-VC-House3D\\902bcac4-fe3b-45df-9de3-1908d9e392be\\scratchpad';
const URL = 'http://localhost:8080/elevations/version-thirty/?v=' + Date.now();

const tag = process.argv[2] || 'shot';
const views = process.argv.slice(3).map((s) => {
  const i = s.indexOf('=');
  const name = s.slice(0, i);
  let js = s.slice(i + 1);
  // name=@path  →  run the file's contents as the expression
  if (js.startsWith('@')) js = fs.readFileSync(js.slice(1), 'utf8');
  return { name: name, js: js };
});

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
  for (let i = 0; i < 60; i++) {
    try { await get('http://127.0.0.1:' + PORT + '/json/version'); return; }
    catch (_) { await sleep(200); }
  }
  throw new Error('chrome debug port did not open');
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const userData = path.join(OUT, '.chrome-shoot');
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
    for (let i = 0; i < 40; i++) {
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

    let ready = false, stamp = '';
    for (let i = 0; i < 90; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '({ok:!!(window.__el && window.__el.look && document.getElementById("loading") && document.getElementById("loading").classList.contains("done")), stamp: window.__HOUSE3D_STAIR_RAIL__||""})',
        returnByValue: true
      });
      if (r.result && r.result.value && r.result.value.ok) { ready = true; stamp = r.result.value.stamp; break; }
      await sleep(500);
    }
    if (!ready) throw new Error('no boot');
    console.log('stamp', stamp);

    // hide UI chrome so the shots are pure geometry
    await send('Runtime.evaluate', {
      expression: "document.querySelectorAll('header,.views,.suns,.hint,.vnav,#loading,.badge,footer,nav').forEach(e=>e.style.display='none'); true",
      returnByValue: true
    });

    for (const v of views) {
      const r = await send('Runtime.evaluate', { expression: v.js, returnByValue: true });
      if (r && r.result && r.result.value !== true) {
        console.log('[' + v.name + ']', JSON.stringify(r.result.value));
      }
      if (v.name.startsWith('_')) continue;   // eval-only, no screenshot
      await sleep(200);
      await send('Runtime.evaluate', { expression: 'window.__el.resolve(22); true', returnByValue: true });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const f = path.join(OUT, tag + '-' + v.name + '.png');
      fs.writeFileSync(f, Buffer.from(pic.data, 'base64'));
      console.log('wrote', f);
    }
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
