// Minimal static file server — no dependencies, pure Node.
// For project overview see .agents/README.md
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
  '.map': 'application/json',
  '.webp': 'image/webp',
  '.bin': 'application/octet-stream',
  '.blend': 'application/octet-stream',
  '.md': 'text/markdown; charset=utf-8'
};

function underRoot(urlPath) {
  const resolved = path.resolve(root, '.' + path.sep + String(urlPath || '').replace(/^\/+/, ''));
  const rel = path.relative(root, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return resolved;
}

function cacheControl(ext) {
  if (ext === '.html' || ext === '.js' || ext === '.mjs' || ext === '.css') {
    return 'no-store, no-cache, must-revalidate, max-age=0';
  }
  if (ext === '.glb' || ext === '.gltf' || ext === '.wasm' || ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
    return 'public, max-age=3600, must-revalidate';
  }
  return 'public, max-age=3600';
}

function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header || '').trim());
  if (!m) return null;
  let start = m[1] === '' ? NaN : Number(m[1]);
  let end = m[2] === '' ? NaN : Number(m[2]);
  if (Number.isNaN(start) && Number.isNaN(end)) return null;
  if (Number.isNaN(start)) {
    start = Math.max(0, size - end);
    end = size - 1;
  } else if (Number.isNaN(end)) {
    end = size - 1;
  }
  if (start < 0 || end < start || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

function sendFile(req, res, filePath) {
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = TYPES[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': type,
      'Accept-Ranges': 'bytes',
      'Cache-Control': cacheControl(ext),
      'X-Content-Type-Options': 'nosniff'
    };
    if (ext === '.html' || ext === '.js' || ext === '.mjs' || ext === '.css') {
      headers.Pragma = 'no-cache';
    }

    if (req.method === 'HEAD') {
      headers['Content-Length'] = st.size;
      res.writeHead(200, headers);
      res.end();
      return;
    }

    const range = parseRange(req.headers.range, st.size);
    if (req.headers.range && !range) {
      res.writeHead(416, { 'Content-Range': 'bytes */' + st.size, 'Accept-Ranges': 'bytes' });
      res.end();
      return;
    }

    let start = 0;
    let end = st.size - 1;
    let status = 200;
    if (range) {
      start = range.start;
      end = range.end;
      status = 206;
      headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + st.size;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(status, headers);
    const stream = fs.createReadStream(filePath, { start, end });
    stream.on('error', () => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    req.on('close', () => stream.destroy());
    stream.pipe(res);
  });
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const resolved = underRoot(urlPath);
  if (!resolved) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Method Not Allowed');
    return;
  }

  // Directory without trailing slash → redirect so relative asset URLs resolve
  // correctly (e.g. /elevations/version-one → /elevations/version-one/).
  try {
    const isDir =
      (urlPath !== '/' && !urlPath.endsWith('/') && fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) ||
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
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = underRoot(urlPath);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  sendFile(req, res, filePath);
}).on('error', (err) => {
  console.error('Server failed to start on port ' + PORT + ': ' + err.message);
  process.exit(1);
}).listen(PORT, '0.0.0.0', () => {
  console.log('Serving ' + root);
  console.log('Open          http://localhost:' + PORT + '/');
  console.log('Walkthrough   http://localhost:' + PORT + '/walkthrough.html');
  console.log('Blender 3D    http://localhost:' + PORT + '/Blender/');
  console.log('Blender walk  http://localhost:' + PORT + '/Blender/walkthrough.html');
  console.log('Elevations    http://localhost:' + PORT + '/elevations/');
});
