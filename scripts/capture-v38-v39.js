/**
 * High-resolution photoreal capture script for V38 and V39.
 * Captures clean, UI-free 1920x1080 renders at human eye-level and hero perspectives.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const versions = [
  { id: 'v38', port: 9358, dir: 'version-thirty-eight', stamp: 'V38_SE_V33SOUTH_20260818', name: 'Version Thirty-Eight' },
  { id: 'v39', port: 9359, dir: 'version-thirty-nine', stamp: 'V39_SE_V33SOUTH_20260818', name: 'Version Thirty-Nine' }
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
  for (let i = 0; i < 40; i++) {
    try { await get('http://127.0.0.1:' + port + '/json/version'); return; }
    catch (_) { await sleep(200); }
  }
  throw new Error('chrome debug port ' + port + ' did not open');
}

async function captureVersion(v) {
  console.log(`\n================ Processing ${v.name} (${v.id}) ================`);
  const outDir = path.resolve(__dirname, '..', 'elevations', v.dir);
  const userData = path.join(outDir, `.chrome-${v.id}`);
  fs.mkdirSync(userData, { recursive: true });

  const url = `http://localhost:8080/elevations/${v.dir}/?v=${v.stamp}`;
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

    // Wait for 3D scene boot
    let ready = false;
    for (let i = 0; i < 60; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '({ok:!!(window.__el && window.__el.look && document.getElementById("loading") && document.getElementById("loading").classList.contains("done")), stamp: window.__HOUSE3D_STAIR_RAIL__||""})',
        returnByValue: true
      });
      if (r.result && r.result.value && r.result.value.ok) {
        ready = true;
        break;
      }
      await sleep(500);
    }
    if (!ready) throw new Error('3D engine boot failed for ' + v.id);

    // Hide UI elements for clean render
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
      await sleep(250);
      await send('Runtime.evaluate', { expression: 'window.__el.resolve(28); true', returnByValue: true });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const filePath = path.join(outDir, filename);
      fs.writeFileSync(filePath, Buffer.from(pic.data, 'base64'));
      console.log(`Saved: ${filePath}`);
    }

    // 1. East Elevation - Human Street View
    await takeShot(`${v.id}-east-human-view.png`, `
      window.__el.look(12.5, 4.8, -4.4, 25.0, 1.57, 1.44);
      true;
    `);

    // 2. East Elevation - Full Architectural Elevation
    await takeShot(`${v.id}-east-elevation.png`, `
      window.__el.applyView('east');
      true;
    `);

    // 3. South Elevation - Full Architectural Elevation
    await takeShot(`${v.id}-south-elevation.png`, `
      window.__el.applyView('south');
      true;
    `);

    // 4. South-East Hero Perspective - Street-level 3/4 view
    await takeShot(`${v.id}-se-hero-human.png`, `
      window.__el.look(11.8, 4.6, -2.8, 23.0, 0.72, 1.36);
      true;
    `);

    // 5. South-East Closer Detail on SE treatment
    await takeShot(`${v.id}-se-corner-detail.png`, `
      window.__el.look(16.5, 6.8, 0.2, 13.0, 0.75, 1.18);
      true;
    `);

    // 6. South SE Corner Detail (focused on window and solid wall)
    await takeShot(`${v.id}-south-se-detail.png`, `
      window.__el.look(15.0, 5.8, 1.0, 14.0, 0.25, 1.35);
      true;
    `);

    // 7. Photoreal Covers
    await takeShot(`elevation-se-photoreal.png`, `
      window.__el.look(11.8, 4.6, -2.8, 23.0, 0.72, 1.36);
      true;
    `);
    await takeShot(`elevation-east-photoreal.png`, `
      window.__el.look(12.5, 4.8, -4.4, 25.0, 1.57, 1.44);
      true;
    `);

    ws.close();
  } finally {
    chrome.kill();
  }
}

async function main() {
  for (const v of versions) {
    await captureVersion(v);
  }
  console.log('\nAll V38 and V39 views captured successfully!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
