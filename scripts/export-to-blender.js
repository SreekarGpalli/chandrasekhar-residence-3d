const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const os = require('os');

const OUT_DIR = path.resolve(__dirname, '..', 'Blender');
const OUT_FILE = path.join(OUT_DIR, 'chandrasekhar_residence_full.glb');
const SAVE_PORT = 8081;
const SITE_PORT = 8080;
const EXPORT_URL = 'http://127.0.0.1:' + SITE_PORT + '/export-to-blender.html';
const TIMEOUT_MS = 15 * 60 * 1000;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function chromePath() {
  const env = process.env.CHROME_PATH || process.env.GOOGLE_CHROME_BIN;
  if (env && fs.existsSync(env)) return env;
  const candidates = process.platform === 'win32'
    ? [
        process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe'),
        process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google/Chrome/Application/chrome.exe'),
        process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
        process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Microsoft/Edge/Application/msedge.exe'),
      ]
    : process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        ]
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];
  for (const c of candidates) {
    if (!c) continue;
    if (c.indexOf(path.sep) === -1) {
      try {
        const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [c], { encoding: 'utf8' });
        if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0];
      } catch (_) {}
    } else if (fs.existsSync(c)) return c;
  }
  return null;
}

function portOpen(port) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: '/', timeout: 1500 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function backupExisting() {
  if (!fs.existsSync(OUT_FILE)) return;
  const bak = OUT_FILE.replace(/\.glb$/i, '_PreExport_Backup.glb');
  if (!fs.existsSync(bak)) fs.copyFileSync(OUT_FILE, bak);
}

let server;
let chromeProcess;
let finished = false;

function shutdown(code) {
  if (finished) return;
  finished = true;
  if (chromeProcess && !chromeProcess.killed) {
    try { chromeProcess.kill(); } catch (_) {}
  }
  if (server) {
    try { server.close(); } catch (_) {}
  }
  process.exit(code);
}

function startSaveServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const origin = req.headers.origin || '';
      if (origin === 'http://127.0.0.1:' + SITE_PORT || origin === 'http://localhost:' + SITE_PORT) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      if (req.method === 'POST' && req.url === '/save-glb') {
        backupExisting();
        const tmp = OUT_FILE + '.partial';
        const out = fs.createWriteStream(tmp);
        let bytes = 0;
        req.on('data', (chunk) => { bytes += chunk.length; });
        req.pipe(out);
        out.on('finish', () => {
          fs.renameSync(tmp, OUT_FILE);
          console.log('[Export] Saved ' + bytes + ' bytes to ' + OUT_FILE);
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Saved ' + bytes + ' bytes');
          setTimeout(() => shutdown(0), 400);
        });
        const fail = (err) => {
          console.error('[Export] Write failed:', err && err.message);
          try { fs.unlinkSync(tmp); } catch (_) {}
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Write failed');
          }
          setTimeout(() => shutdown(1), 400);
        };
        req.on('error', fail);
        out.on('error', fail);
        return;
      }
      res.writeHead(404);
      res.end('Not Found');
    });
    server.on('error', reject);
    server.listen(SAVE_PORT, '127.0.0.1', () => {
      console.log('[Export] Save server on http://127.0.0.1:' + SAVE_PORT);
      resolve();
    });
  });
}

async function run() {
  if (!(await portOpen(SITE_PORT))) {
    console.error('[Export] Nothing is listening on port ' + SITE_PORT + '.');
    console.error('Start the site first:  node serve.js');
    process.exit(1);
  }
  const chrome = chromePath();
  if (!chrome) {
    console.error('[Export] Chrome/Edge not found. Set CHROME_PATH, or open ' + EXPORT_URL + ' yourself after starting this script.');
    await startSaveServer();
    console.log('[Export] Waiting for a browser POST to /save-glb …');
    setTimeout(() => {
      console.error('[Export] Timed out.');
      shutdown(1);
    }, TIMEOUT_MS);
    return;
  }

  await startSaveServer();
  const tempUserData = path.join(os.tmpdir(), 'house3d-chrome-export');
  console.log('[Export] Launching ' + chrome);
  chromeProcess = spawn(chrome, [
    '--headless=new',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + tempUserData,
    EXPORT_URL
  ], { stdio: 'inherit' });
  chromeProcess.on('error', (err) => {
    console.error('[Export] Failed to launch browser:', err.message);
    shutdown(1);
  });
  setTimeout(() => {
    console.error('[Export] Timed out waiting for the GLB.');
    shutdown(1);
  }, TIMEOUT_MS);
}

run().catch((err) => {
  console.error('[Export] Error:', err);
  shutdown(1);
});
