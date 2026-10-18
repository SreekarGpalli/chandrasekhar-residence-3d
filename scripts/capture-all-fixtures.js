/**
 * High-resolution photoreal capture script for sinks and vanities across all floors.
 * Captures clean 1920x1080 renders of every sink, vanity, and mirror in Chandrasekhar Residence.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9388;
const OUT_DIR = 'C:\\Users\\sreek\\.gemini\\antigravity-ide\\brain\\cd6ee74e-9b39-47cf-9651-930f717943dd';
const URL = 'http://localhost:8080/walkthrough.html?v=' + Date.now();

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

const VIEWS = [
  {
    name: '01_GF_Master_Bath_Vanity.png',
    pos: [5.37, -0.05, -0.95],
    yaw: 0.0,
    pitch: -0.36
  },
  {
    name: '02_GF_Handwash_Vanity.png',
    pos: [2.75, -0.05, -4.10],
    yaw: 0.0,
    pitch: -0.36
  },
  {
    name: '03_GF_Kitchen_Sink.png',
    pos: [10.60, 0.00, -2.70],
    yaw: -Math.PI / 2,
    pitch: -0.26
  },
  {
    name: '04_FF_Kitchen_Sink.png',
    pos: [10.60, 3.35, -3.20],
    yaw: -Math.PI / 2,
    pitch: -0.26
  },
  {
    name: '05_FF_Wet_Kitchen_Sink.png',
    pos: [11.15, 3.35, -0.54],
    yaw: Math.PI / 2,
    pitch: -0.26
  },
  {
    name: '06_FF_West_Suite_Vanity.png',
    pos: [2.70, 3.30, -5.00],
    yaw: 0.0,
    pitch: -0.36
  },
  {
    name: '07_FF_Utility_Wash_Basin.png',
    pos: [7.70, 3.30, -0.55],
    yaw: Math.PI,
    pitch: -0.36
  },
  {
    name: '08_SF_East_Bath_Vanity.png',
    pos: [7.195, 6.65, -1.60],
    yaw: Math.PI,
    pitch: -0.36
  }
];

async function main() {
  console.log('Launching Chrome for photoreal fixture capture...');
  const userData = path.join(OUT_DIR, 'scratch', '.chrome-fixtures');
  fs.mkdirSync(userData, { recursive: true });

  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check',
    '--window-size=1920,1080',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + userData,
    URL
  ], { stdio: 'ignore' });

  try {
    await waitPort(PORT);
    let target;
    for (let i = 0; i < 30; i++) {
      const list = await get('http://127.0.0.1:' + PORT + '/json/list');
      target = (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target) break;
      await sleep(200);
    }
    if (!target) throw new Error('No page found');

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

    console.log('Waiting for walkthrough to load and 3D scene build...');
    let ready = false;
    for (let i = 0; i < 50; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '({ ok: !!(window.__wt && window.__wt.player && window.__walkthrough) })',
        returnByValue: true
      });
      if (r.result && r.result.value && r.result.value.ok) {
        ready = true;
        break;
      }
      await sleep(400);
    }
    if (!ready) throw new Error('Scene did not load in time');

    // Dismiss intro modal and hide UI elements
    await send('Runtime.evaluate', {
      expression: `
        const intro = document.getElementById('intro');
        if (intro) intro.style.display = 'none';
        ['hud', 'levels', 'help', 'crosshair', 'foot'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
        window.__walkthrough.toggleFly(true);
        true;
      `,
      returnByValue: true
    });
    await sleep(500);

    for (const v of VIEWS) {
      console.log('Capturing: ' + v.name);
      await send('Runtime.evaluate', {
        expression: `
          window.__walkthrough.toggleFly(true);
          window.__walkthrough.player.pos.set(${v.pos[0]}, ${v.pos[1]}, ${v.pos[2]});
          window.__walkthrough.player.yaw = ${v.yaw};
          window.__walkthrough.player.pitch = ${v.pitch};
          window.__walkthrough.player.velY = 0;
          window.__walkthrough.placeCamera();
          true;
        `,
        returnByValue: true
      });
      await sleep(1000); // Allow Three.js lights, shadows, and textures to render cleanly

      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const filePath = path.join(OUT_DIR, v.name);
      fs.writeFileSync(filePath, Buffer.from(pic.data, 'base64'));
      console.log('Saved: ' + filePath);
    }

    ws.close();
    console.log('All fixture views captured successfully!');
  } finally {
    try { chrome.kill(); } catch (_) {}
  }
}

main().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
