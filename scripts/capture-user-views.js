const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const VERSIONS = [
  { id: 'v29', dir: 'version-twenty-nine', stamp: 'V29_OFFW_20260816b', name: 'Version Twenty-Nine' },
  { id: 'v33', dir: 'version-thirty-three', stamp: 'V33_OFFW_20260816b', name: 'Version Thirty-Three' },
  { id: 'v36', dir: 'version-thirty-six', stamp: 'V36_OFFW_20260816b', name: 'Version Thirty-Six' }
];

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

async function waitPort(port) {
  for (let i = 0; i < 50; i++) {
    try { await get('http://127.0.0.1:' + port + '/json/version'); return; }
    catch (_) { await sleep(200); }
  }
  throw new Error('chrome debug port ' + port + ' did not open');
}

async function renderVersion(v, port) {
  console.log(`\n========================================`);
  console.log(`Rendering ${v.name} (${v.id}) on port ${port}...`);
  console.log(`========================================`);

  const outDir = path.resolve(__dirname, '..', 'elevations', v.dir);
  const userData = path.join(outDir, `.chrome-view-${v.id}-${port}`);
  fs.mkdirSync(userData, { recursive: true });

  const url = `http://localhost:8080/elevations/${v.dir}/?v=${v.stamp}`;
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1920,1080',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + userData,
    url
  ], { stdio: 'ignore' });

  try {
    await waitPort(port);
    let target;
    for (let i = 0; i < 30; i++) {
      const list = await get('http://127.0.0.1:' + port + '/json/list');
      target = (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target) break;
      await sleep(200);
    }
    if (!target) throw new Error('no target page found');

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

    // Wait for boot (allow up to 25s for shader compilation & textures)
    let ready = false;
    for (let i = 0; i < 50; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '!!(window.__el && window.__el.look)',
        returnByValue: true
      });
      if (r.result && r.result.value) { ready = true; break; }
      await sleep(500);
    }
    if (!ready) throw new Error('Boot failed for ' + v.id);

    // Hide UI overlays
    await send('Runtime.evaluate', {
      expression: `
        ['titleblock', 'nav', 'compass', 'sun', 'views', 'hint', 'conv'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
        true;
      `,
      returnByValue: true
    });

    async function takeShot(filename, jsAction) {
      await send('Runtime.evaluate', { expression: jsAction, returnByValue: true });
      await sleep(350);
      await send('Runtime.evaluate', { expression: 'window.__el.resolve(28); true', returnByValue: true });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const filePath = path.join(outDir, filename);
      fs.writeFileSync(filePath, Buffer.from(pic.data, 'base64'));
      console.log(`✓ Saved: ${filename}`);
    }

    // 1. South-East Human Eye-Level View (SE Street Corner, human eye level ~1.8m)
    await takeShot(`${v.id}-se-human-view.png`, `
      window.__el.applySun('morning');
      window.__el.look(11.8, 3.2, 4.4, 25.0, 0.82, 1.47);
      true;
    `);

    // 2. North-East Human Eye-Level View (NE Garden Corner, human eye level ~1.8m)
    await takeShot(`${v.id}-ne-human-view.png`, `
      window.__el.applySun('morning');
      window.__el.look(9.8, 7.2, 4.4, 26.0, 2.44, 1.47);
      true;
    `);

    ws.close();
  } finally {
    chrome.kill();
  }
}

async function main() {
  let port = 9410;
  for (const v of VERSIONS) {
    port++;
    await renderVersion(v, port);
    await sleep(500);
  }
  console.log('\n========================================');
  console.log('All South-East & North-East Human-Level 3D views captured!');
  console.log('========================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
