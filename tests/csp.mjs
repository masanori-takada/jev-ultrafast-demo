// Cross-origin + strict-CSP check: the copied bookmarklet text must run on a host page (other port) that sends
// "default-src 'none'; script-src 'none'". Executed like a browser bookmarklet: CDP Runtime.evaluate (page CSP does not apply to
// bookmarklets / devtools evaluation; that is the real-world behaviour, and we also prove that a plain <script> IS blocked).
import http from 'node:http';
import { launch } from './pw.mjs';
import { startServer } from './serve.mjs';

const APP = 4175, HOST = 4176;
const app = await startServer(APP);
const host = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'; script-src 'none'" });
  res.end('<!doctype html><meta charset="utf-8"><title>CSP host</title><h1>host</h1><button id="b">x</button>');
});
await new Promise((r) => host.listen(HOST, '127.0.0.1', r));
const browser = await launch();
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL:', m); } };
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const appPage = await ctx.newPage();
  await appPage.goto(`http://127.0.0.1:${APP}/sites.html`);
  const copied = await appPage.evaluate(async () => { const m = await import('./js/panel.js'); return m.bookmarkletCode(location.href); });
  ok(copied.startsWith('javascript:') && copied.length > 50000 && !decodeURIComponent(copied.slice(11)).startsWith('fetch('), 'copied text is a full javascript: URL without fetch stub');
  const bundle = await (await ctx.request.get(`http://127.0.0.1:${APP}/bookmarklet.js`)).text();
  const code = decodeURIComponent(copied.slice('javascript:'.length));
  ok(code === bundle, 'decoded text equals web/bookmarklet.js');

  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(`http://127.0.0.1:${HOST}/`);
  const plain = await page.evaluate(() => new Promise((res) => { const s = document.createElement('script'); s.textContent = 'window.__x=1'; document.head.appendChild(s); setTimeout(() => res(window.__x === 1), 100); }));
  ok(plain === false, 'precondition: strict CSP blocks a normal inline script');
  const r = await cdp.send('Runtime.evaluate', { expression: code });
  ok(!r.exceptionDetails, 'bookmarklet evaluates without exception: ' + JSON.stringify(r.exceptionDetails || {}).slice(0, 200));
  await page.waitForSelector('#jev-root', { state: 'attached', timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => !!document.getElementById('jev-root')), 'panel mounted on cross-origin strict-CSP page');
  const w = await page.evaluate(() => { const p = document.getElementById('jev-root')?.shadowRoot?.querySelector('#panel'); return p ? p.getBoundingClientRect().width : 0; });
  ok(w > 100, 'panel is styled (width ' + w + ')');
  await ctx.close();
} finally { await browser.close(); app.close(); host.close(); }
console.log(fail ? `csp: ${fail} failed` : 'csp: all passed'); if (fail) process.exit(1);
