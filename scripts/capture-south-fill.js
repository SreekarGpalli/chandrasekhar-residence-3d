/**
 * Fills in the two South-facing shots for the four older elevation versions
 * (V29, V33, V36, V37) so every version in elevations/ has the same six-angle
 * render set as V38 / V40 / V41. Camera presets and the shot list are copied
 * verbatim from capture-v41.js, so the frames line up across versions.
 *
 * Requires the static server on :8080 (node serve.js) and Chrome.
 *   node scripts/capture-south-fill.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const VERSIONS = [
  { id: 'v29', port: 9381, dir: 'version-twenty-nine',  name: 'Version Twenty-Nine' },
  { id: 'v33', port: 9382, dir: 'version-thirty-three', name: 'Version Thirty-Three' },
  { id: 'v36', port: 9383, dir: 'version-thirty-six',   name: 'Version Thirty-Six' },
  { id: 'v37', port: 9384, dir: 'version-thirty-seven', name: 'Version Thirty-Seven' }
];

// Same two frames capture-v41.js shoots as #3 and #6.
const SHOTS = [
  { file: 'south-elevation',  js: "window.__el.applyView('south'); true;" },
  { file: 'south-se-detail',  js: 'window.__el.look(15.0, 5.8, 1.0, 14.0, 0.25, 1.35); true;' }
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function get(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => {
      const c = [];
      r.on('data', (d) => c.push(d));
      r.on('end', () => res(JSON.parse(Buffer.concat(c).toString() || 'null')));
    }).on('error', rej);
  });
}

async function waitPort(port) {
  for (let i = 0; i < 40; i++) {
    try { await get('http://127.0.0.1:' + port + '/json/version'); return; }
    catch (_) { await sleep(200); }
  }
  throw new Error('chrome debug port ' + port + ' did not open');
}

async function capture(v) {
  console.log(`\n================ ${v.name} (${v.id}) ================`);
  const outDir = path.resolve(__dirname, '..', 'elevations', v.dir);
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'house3d-' + v.id + '-'));

  const url = `http://localhost:8080/elevations/${v.dir}/?v=south-fill`;
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check',
    '--window-size=1920,1080',
    '--remote-debugging-port=' + v.port,
    '--user-data-dir=' + userData,
    url
  ], { stdio: 'ignore' });

  try {
    await waitPort(v.port);
    let target;
    for (let i = 0; i < 30; i++) {
      const list = await get('http://127.0.0.1:' + v.port + '/json/list');
      target = (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target) break;
      await sleep(200);
    }
    if (!target) throw new Error('no page found for ' + v.id);

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error))); else res(msg.result);
      }
    };
    const send = (method, params) => {
      const n = ++id;
      return new Promise((res, rej) => {
        pending.set(n, { res, rej });
        ws.send(JSON.stringify({ id: n, method, params }));
      });
    };
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
    if (!ready) throw new Error('3D engine boot failed for ' + v.id);

    await send('Runtime.evaluate', {
      expression: "['titleblock','nav','compass','sun','views','hint','conv'].forEach(id=>{const el=document.getElementById(id); if(el) el.style.display='none';}); true;",
      returnByValue: true
    });

    for (const shot of SHOTS) {
      await send('Runtime.evaluate', { expression: shot.js, returnByValue: true });
      await sleep(250);
      await send('Runtime.evaluate', { expression: 'window.__el.resolve(28); true', returnByValue: true });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const filePath = path.join(outDir, `${v.id}-${shot.file}.png`);
      fs.writeFileSync(filePath, Buffer.from(pic.data, 'base64'));
      console.log('Saved: ' + filePath);
    }

    ws.close();
  } finally {
    chrome.kill();
    // Chrome can hold the profile dir open for a moment after kill; cleanup is
    // best-effort so a locked temp folder never fails the capture run.
    await sleep(500);
    try { fs.rmSync(userData, { recursive: true, force: true }); } catch (_) {}
  }
}

(async () => {
  for (const v of VERSIONS) await capture(v);
  console.log('\nSouth fill complete.');
})().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
