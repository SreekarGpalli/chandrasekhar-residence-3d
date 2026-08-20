// Minimal static file server — no dependencies, pure Node.
// Run:  node serve.js
// Then open:  http://localhost:8080
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);
const PORT = 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.map': 'application/json'
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  // prevent path traversal — resolve under root and reject escape
  const resolved = path.resolve(root, '.' + path.sep + urlPath.replace(/^\/+/, ''));
  const rel = path.relative(root, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Directory without trailing slash → redirect so relative asset URLs resolve
  // correctly (e.g. /elevations/version-one → /elevations/version-one/).
  // Without this, houseScene.js would load from the parent folder and 404.
  try {
    const isDir =
      (urlPath !== '/' && !urlPath.endsWith('/') && fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) ||
      // also treat .../version-one (no slash) as dir even if index resolution differs
      (urlPath !== '/' && !urlPath.endsWith('/') && !path.extname(urlPath) &&
        fs.existsSync(resolved + path.sep + 'index.html'));
    if (isDir) {
      const q = (req.url || '').includes('?') ? '?' + (req.url || '').split('?').slice(1).join('?') : '';
      res.writeHead(301, { Location: urlPath + '/' + q });
      res.end();
      return;
    }
  } catch (_) { /* continue */ }

  if (urlPath === '/') urlPath = '/index.html';
  // Directory URLs → index.html (e.g. /elevations/version-one/)
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  let filePath = path.resolve(root, '.' + path.sep + urlPath.replace(/^\/+/, ''));
  const rel2 = path.relative(root, filePath);
  if (rel2.startsWith('..') || path.isAbsolute(rel2)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 Not Found: ' + urlPath); return; }
    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // Always revalidate HTML/JS so elevation houseScene edits show up after refresh
      'Cache-Control': (ext === '.html' || ext === '.js' || ext === '.mjs' || ext === '.css')
        ? 'no-store, no-cache, must-revalidate, max-age=0'
        : 'public, max-age=3600',
      'Pragma': 'no-cache'
    };
    res.writeHead(200, headers);
    res.end(data);
  });
}).on('error', (err) => {
  console.error('Server failed to start on port ' + PORT + ': ' + err.message);
  process.exit(1);
}).listen(PORT, '0.0.0.0', () => {
  console.log('Serving ' + root);
  console.log('Open  http://localhost:8080');
  console.log('Elevations  http://localhost:8080/elevations/');
  console.log('V24  http://localhost:8080/elevations/version-twenty-four/');
  console.log('V36  http://localhost:8080/elevations/version-thirty-six/');
});
