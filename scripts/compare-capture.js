/**
 * Shoot every remaining elevation from the same east-facing cameras.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'elevations', 'compare', 'raw');

const VERSIONS = [
  ['V24', 'version-twenty-four', 'V24_OFFW_20260816b'],
  ['V26', 'version-twenty-six', 'V26_OFFW_20260816b'],
  ['V27', 'version-twenty-seven', 'V27_OFFW_20260816b'],
  ['V29', 'version-twenty-nine', 'V29_OFFW_20260816b'],
  ['V33', 'version-thirty-three', 'V33_OFFW_20260816b'],
  ['V34', 'version-thirty-four', 'V34_OFFW_20260816b'],
  ['V35', 'version-thirty-five', 'V35_OFFW_20260816b'],
  ['V36', 'version-thirty-six', 'V36_OFFW_20260816b']
];

const VIEWS = [
  ['east', "window.__el.applyView('east'); true"],
  ['hero', "window.__el.applyView('hero'); true"],
  ['se', "window.__el.look(16.70, 6.80, 0.20, 12.5, 0.74, 1.16); true"],
  ['se-high', "window.__el.look(16.50, 8.40, 0.50, 11.2, 0.80, 1.02); true"],
  ['east-close', "window.__el.look(15.40, 6.40, -3.80, 11.5, 1.42, 1.20); true"],
  ['se-low', "window.__el.look(16.20, 4.40, 0.90, 10.8, 0.58, 1.24); true"]
];

const HIDE_UI = `
(function(){
  ['nav','titleblock','sun','views','compass','loading'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  true;
})();
`;

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

async function captureVersion(label, dir, stamp, port) {
  const url = 'http://localhost:8080/elevations/' + dir + '/?v=' + stamp;
  const userData = path.join(OUT, '.chrome-' + label);
  fs.mkdirSync(userData, { recursive: true });
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check',
    '--window-size=1600,900',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + userData,
    url
  ], { stdio: 'ignore' });

  try {
    for (let i = 0; i < 50; i++) {
      try { await get('http://127.0.0.1:' + port + '/json/version'); break; }
      catch (_) { await sleep(200); }
    }
    let target;
    for (let i = 0; i < 40; i++) {
      const list = await get('http://127.0.0.1:' + port + '/json/list');
      target = (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target) break;
      await sleep(200);
    }
    if (!target) throw new Error('no page ' + label);

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
    for (let i = 0; i < 70; i++) {
      const r = await send('Runtime.evaluate', {
        expression: '!!(window.__el && window.__el.look && document.getElementById("loading") && document.getElementById("loading").classList.contains("done"))',
        returnByValue: true
      });
      if (r.result && r.result.value) { ready = true; break; }
      await sleep(400);
    }
    if (!ready) throw new Error('no boot ' + label);
    await send('Runtime.evaluate', { expression: HIDE_UI, returnByValue: true });

    for (const [name, js] of VIEWS) {
      await send('Runtime.evaluate', { expression: js, returnByValue: true });
      await sleep(240);
      await send('Runtime.evaluate', { expression: 'window.__el.resolve(22); true', returnByValue: true });
      const pic = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const dest = path.join(OUT, name + '-' + label + '.png');
      fs.writeFileSync(dest, Buffer.from(pic.data, 'base64'));
      console.log('wrote', name + '-' + label + '.png');
    }
    ws.close();
  } finally {
    chrome.kill();
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let port = 9400;
  for (const [label, dir, stamp] of VERSIONS) {
    console.log('---', label);
    await captureVersion(label, dir, stamp, port++);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
