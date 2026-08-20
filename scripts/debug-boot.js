const { spawn } = require('child_process');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function get(url) {
  return new Promise((res, rej) => {
    http.get(url, r => {
      const c = [];
      r.on('data', d => c.push(d));
      r.on('end', () => res(JSON.parse(Buffer.concat(c).toString() || 'null')));
    }).on('error', rej);
  });
}

async function test(dir, port) {
  console.log('Testing boot for', dir);
  const u = `http://localhost:8080/elevations/${dir}/`;
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--enable-webgl',
    '--remote-debugging-port=' + port,
    '--user-data-dir=C:\\Users\\sreek\\Desktop\\VC\\House3D\\.temp-dbg-' + port,
    u
  ]);

  for (let i = 0; i < 30; i++) {
    try { await get('http://127.0.0.1:' + port + '/json/version'); break; } catch (_) { await sleep(200); }
  }

  const list = await get('http://127.0.0.1:' + port + '/json/list');
  const target = list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 0;
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log(`[${dir} console]`, msg.params.type, msg.params.args.map(a => a.value || a.description));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error(`[${dir} exception]`, msg.params.exceptionDetails);
    }
  };

  ws.send(JSON.stringify({ id: ++id, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: ++id, method: 'Page.enable' }));

  for (let i = 0; i < 10; i++) {
    await sleep(500);
    const n = ++id;
    ws.send(JSON.stringify({
      id: n,
      method: 'Runtime.evaluate',
      params: { expression: '({ el: !!window.__el, look: !!(window.__el && window.__el.look), err: window.__bootErr })', returnByValue: true }
    }));
  }

  await sleep(1000);
  ws.close();
  chrome.kill();
}

test('version-thirty-three', 9401).then(() => test('version-thirty-six', 9402));
