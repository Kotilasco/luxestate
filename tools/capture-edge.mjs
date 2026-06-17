const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const url = process.argv[2] || 'https://bootstrapmade.com/demo/LuxEstate/';
const outDir = process.argv[3] || 'screenshots';

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir(outDir, { recursive: true });

const port = 9223 + Math.floor(Math.random() * 1000);
const profile = `${process.cwd()}\\.edge-capture-${port}`;

const edge = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--disable-extensions',
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${port}`,
  '--window-size=1440,1100',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(endpoint) {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${endpoint}`);
      if (response.ok) {
        return response.json();
      }
    } catch {}
    await sleep(250);
  }
  throw new Error('Could not connect to Edge remote debugger');
}

function cdp(wsUrl) {
  let id = 0;
  const pending = new Map();
  const ws = new WebSocket(wsUrl);

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
    }
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  return {
    async send(method, params = {}) {
      await ready;
      const message = { id: ++id, method, params };
      ws.send(JSON.stringify(message));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    close() {
      ws.close();
    }
  };
}

try {
  const tabs = await json('/json');
  const page = tabs.find((tab) => tab.type === 'page');
  const client = cdp(page.webSocketDebuggerUrl);

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send('Page.navigate', { url });
  await sleep(5000);

  const metrics = await client.send('Page.getLayoutMetrics');
  const contentHeight = Math.ceil(metrics.cssContentSize.height);
  const viewportHeight = 1100;
  const positions = [];

  for (let y = 0; y < contentHeight; y += viewportHeight) {
    positions.push(y);
  }

  let index = 0;
  for (const y of positions) {
    await client.send('Runtime.evaluate', {
      expression: `window.scrollTo(0, ${y}); new Promise(r => setTimeout(r, 700));`,
      awaitPromise: true,
    });
    const shot = await client.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
      fromSurface: true,
    });
    await writeFile(`${outDir}/demo-${String(index).padStart(2, '0')}.png`, Buffer.from(shot.data, 'base64'));
    index++;
  }

  const full = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
  });
  await writeFile(`${outDir}/demo-full.png`, Buffer.from(full.data, 'base64'));

  client.close();
  console.log(`Captured ${positions.length} viewport screenshots and full page (${contentHeight}px high).`);
} finally {
  edge.kill();
}
