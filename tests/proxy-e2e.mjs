// Proxy e2e (no internet): fake upstream (tests/fixtures as 'testsite.local') -> proxy function over node:http -> chromium on a phone viewport.
// The panel script is the REAL web/bookmarklet.js served locally (JEV_PANEL_URL).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launch } from './pw.mjs';
import { startServer } from './serve.mjs';
import { startProxy, portOf } from './proxy-adapter.mjs';
import { encodePrompt } from '../web/js/config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('node', [path.join(ROOT, 'tools/build-bookmarklet.mjs')], { stdio: 'pipe' });
const FIX = path.join(ROOT, 'tests/fixtures');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL:', m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}: expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`);

const web = await startServer(4181);
const hits = [];
const upstream = http.createServer((req, res) => {
  hits.push(req.url);
  const u = new URL(req.url, 'http://x');
  const f = path.join(FIX, path.basename(u.pathname));
  if (u.pathname === '/api/ping') { res.writeHead(200, { 'content-type': 'application/json', 'set-cookie': 'a=b' }); return res.end('{"ok":true}'); }
  if (u.pathname === '/old') { res.writeHead(302, { location: '/realestate.html' }); return res.end(); }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('nf'); }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "script-src 'none'", 'x-frame-options': 'DENY' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => upstream.listen(0, '127.0.0.1', r));
process.env.JEV_PROXY_TEST_UPSTREAM = `http://127.0.0.1:${portOf(upstream)}`;
process.env.JEV_PANEL_URL = 'http://127.0.0.1:4181/bookmarklet.js';
const proxy = await startProxy(4182);
const PX = 'http://127.0.0.1:4182';
const browser = await launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await ctx.route('**/favicon.ico', (r) => r.fulfill({ status: 204 }));
  const page = await ctx.newPage();
  const errors = [], external = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => { const u = new URL(r.url()); if (u.hostname !== '127.0.0.1') external.push(r.url()); });
  const typed = 'Tokyo 1LDK 10万円以下';
  await page.goto(`${PX}/p/testsite.local/old#jev-prompt=${encodePrompt(typed)}`); // via a proxied redirect: hash must survive
  await page.waitForSelector('#jev-root', { state: 'attached' });
  eq(new URL(page.url()).pathname, '/p/testsite.local/realestate.html', 'redirect landed on proxied path');
  eq(await page.locator('script[data-jev-proxy-host="testsite.local"]').count(), 1, 'panel script injected with proxy host');
  const sh = (fn) => page.evaluate(fn);
  const txt = (id) => page.evaluate((i) => document.getElementById('jev-root').shadowRoot.querySelector(i).textContent, id);
  ok(await page.evaluate(() => !!document.getElementById('jev-root').shadowRoot.querySelector('#panel')), 'panel mounted');
  const tab = await txt('#tab-ro');
  ok(tab.includes('realestate') && tab.endsWith('https://testsite.local/realestate.html'), 'tab row shows ORIGINAL url: ' + tab);
  eq(await page.evaluate(() => document.getElementById('jev-root').shadowRoot.querySelector('#prompt').value), typed, 'prompt prefilled from hash');
  eq(await page.evaluate(() => location.hash), '', 'hash removed');
  eq(await txt('#status'), '待機中', 'not auto-started');
  eq(await page.evaluate(() => [area.value, window.__clicked]), ['すべて', undefined], 'page untouched before start');
  // the proxied page is served without CSP/XFO although upstream sent script-src 'none' (otherwise the panel could not have run)
  const r = await ctx.request.get(`${PX}/p/testsite.local/api/ping`); eq([r.status(), r.headers()['set-cookie']], [200, undefined], 'passthrough json, cookie dropped');
  eq(await page.evaluate(async () => (await (await fetch('/api/ping')).json()).ok), true, 'shimmed root-relative fetch reaches the proxied upstream');
  ok(hits.includes('/api/ping'), 'upstream saw /api/ping (not the proxy root)');
  // generic run on the proxied fake page
  const panelRoot = page.locator('#sheet-handle');
  if ((await page.locator('#panel').getAttribute('data-snap')) === 'collapsed') { await panelRoot.click(); await page.waitForTimeout(300); }
  await page.locator('#btn-start').click();
  await page.waitForFunction(() => /完了|停止|エラー/.test(document.getElementById('jev-root').shadowRoot.querySelector('#status').textContent), null, { timeout: 30000 }).catch(() => {});
  eq(await page.evaluate(() => [area.value, layout.value, rent.value, window.__clicked]), ['東京都', '1LDK', '10万円', undefined], 'generic run set the filters on the proxied page');
  ok((await txt('#status')).includes('完了'), 'run finished: ' + (await txt('#status')));
  ok(errors.length === 0, 'no console errors ' + errors.join('|'));
  eq(external, [], 'no non-local requests');
  // off-list host is refused with the friendly page
  await page.goto(`${PX}/p/evil.example/`); ok((await page.textContent('body')).includes('まだ対応していません'), 'off-list host: friendly 403 page');
  await ctx.close();
} finally {
  await browser.close(); for (const s of [web, upstream, proxy]) { s.closeAllConnections?.(); s.close(); }
}
console.log(`proxy e2e: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
