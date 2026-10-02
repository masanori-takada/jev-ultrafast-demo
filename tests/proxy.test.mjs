// Proxy unit/integration tests (node:test): local fake upstream via JEV_PROXY_TEST_UPSTREAM, no internet.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { startProxy, portOf } from './proxy-adapter.mjs';

let up, px, UP, PX;
const seen = [];
const ROUTES = {
  '/page': () => [200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'", 'x-frame-options': 'DENY', 'set-cookie': 'sid=1; Path=/', 'content-encoding': 'identity' },
    `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'"><base href="https://testsite.local/dir/"><title>T</title>
<link rel="stylesheet" href="/s.css" integrity="sha256-abc"><style>a{background:url(/bg.png)} @import "/imp.css";</style></head>
<body><a href="https://testsite.local/abs?x=1&amp;y=2">a</a><a href="//testsite.local/proto">b</a><a href='/root'>c</a><a href="rel/x">d</a><a href="https://evil.example/o">e</a><a href="#frag">f</a><a href="mailto:a@b.c">g</a>
<img src=/img.png srcset="/a.png 1x, https://testsite.local/b.png 2x, https://evil.example/c.png 3x" data-src="/lazy.png"><video poster="/p.jpg"></video>
<form action="/search"><input></form><div style="background:url('/inline.png')"></div></body></html>`],
  '/nobody': () => [200, { 'content-type': 'text/html' }, '<p>no body tag</p>'],
  '/css': () => [200, { 'content-type': 'text/css' }, 'a{background:url("/a.png")}b{background:url(https://testsite.local/b.png)}c{background:url(https://evil.example/c.png)}@import url(/i.css);@import "/j.css";'],
  '/js': () => [200, { 'content-type': 'text/javascript' }, 'var u="/not-rewritten"; fetch("/x")'],
  '/json': () => [200, { 'content-type': 'application/json' }, '{"u":"/x"}'],
  '/redir': () => [302, { location: '/dest?a=1' }, ''],
  '/redir-abs': () => [301, { location: 'https://testsite.local/abs-dest' }, ''],
  '/redir-evil': () => [302, { location: 'https://evil.example/steal' }, ''],
  '/redir-lookalike': () => [302, { location: 'https://suumo.jp.evil.com/' }, ''],
  '/redir-ip': () => [302, { location: 'http://127.0.0.1:1/' }, ''],
  '/denied': () => [403, { 'content-type': 'text/html' }, 'no'],
  '/limited': () => [429, {}, ''],
  '/boom': () => [503, {}, ''],
  '/challenge': () => [200, { 'content-type': 'text/html' }, '<title>Just a moment...</title>x'],
  '/big': () => [200, { 'content-type': 'application/octet-stream' }, 'y'.repeat(5000)],
  '/slow': null,
  '/sjis': () => [200, { 'content-type': 'text/html; charset=Shift_JIS' }, Buffer.from('3c68746d6c3e3c626f64793e', 'hex')],
};
before(async () => {
  up = http.createServer((req, res) => {
    seen.push({ url: req.url, headers: req.headers, method: req.method });
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/slow') return; // never answers
    const r = ROUTES[u.pathname];
    if (!r) { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end(`echo ${req.url}`); }
    const [code, h, body] = r(); res.writeHead(code, h); res.end(body);
  });
  await new Promise((r) => up.listen(0, '127.0.0.1', r)); UP = portOf(up);
  px = await startProxy(0); PX = portOf(px);
  process.env.JEV_PROXY_TEST_UPSTREAM = `http://127.0.0.1:${UP}`;
  process.env.JEV_PANEL_URL = 'http://panel.test/bookmarklet.js';
});
after(() => { up.closeAllConnections?.(); px.closeAllConnections?.(); up.close(); px.close(); delete process.env.JEV_PROXY_TEST_UPSTREAM; delete process.env.JEV_PANEL_URL; });
const get = (p, opt = {}) => fetch(`http://127.0.0.1:${PX}${p}`, { redirect: 'manual', ...opt });
const rawGet = (target, hostHeader) => new Promise((resolve) => { // send an arbitrary request line (fetch would normalise it)
  const s = net.connect(PX, '127.0.0.1', () => s.write(`GET ${target} HTTP/1.0\r\nHost: ${hostHeader || 'x'}\r\n\r\n`));
  let d = ''; s.on('data', (c) => (d += c)); s.on('end', () => resolve(d));
});

test('allowlist: tricky hosts never reach upstream', async () => {
  const before = seen.length;
  const bad = ['suumo.jp.evil.com', 'evil.com%2F@suumo.jp', 'evil.com', '127.0.0.1', 'localhost', '0x7f.0.0.1', '[::1]', 'user:pw@suumo.jp', 'user@suumo.jp',
    'suumo.jp:8443', 'suumo.jp:80', 'xn--suumo-9r4a.jp', 'xn--80ak6aa92e.com', 'notsuumo.jp', 'suumo.jp.', 'suumo.jp%00.evil.com', '2130706433', 'testsitelocal', 'amazon.co.jp.evil.com'];
  for (const h of bad) {
    const r = await get(`/p/${h}/x`);
    assert.equal(r.status, 403, h);
    const t = await r.text();
    assert.match(t, /まだ対応していません/); assert.match(t, /suumo\.jp/);
  }
  assert.equal(seen.length, before, 'upstream untouched');
});
test('allowlist: legitimate host forms are accepted by the allow check', async () => {
  const { handler } = await import('./proxy-adapter.mjs');
  for (const h of ['suumo.jp', 'SUUMO.JP', 'www.suumo.jp', 'sp.suumo.jp', 'm.amazon.co.jp', 'jp.indeed.com', 'www.amazon.com']) assert.equal(handler.allowed(h), true, h);
  for (const h of ['', 'jp', 'co.jp', 'amazon.co.jp.evil.com', 'evilsuumo.jp', '127.0.0.1', 'a b.suumo.jp', 'suumo.jp/x']) assert.equal(handler.allowed(h), false, h);
  assert.equal(handler.ALLOW.length, 14);
});
test('test-mode host only exists with the env var', async () => {
  const saved = process.env.JEV_PROXY_TEST_UPSTREAM; delete process.env.JEV_PROXY_TEST_UPSTREAM;
  try { assert.equal((await get('/p/testsite.local/page')).status, 403); } finally { process.env.JEV_PROXY_TEST_UPSTREAM = saved; }
});
test('POST/PUT rejected with 405; HEAD works', async () => {
  const n = seen.length;
  for (const m of ['POST', 'PUT', 'DELETE', 'PATCH']) { const r = await get('/p/testsite.local/page', { method: m, body: m === 'POST' || m === 'PUT' ? 'a=1' : undefined }); assert.equal(r.status, 405, m); assert.equal(r.headers.get('allow'), 'GET, HEAD'); }
  assert.equal(seen.length, n);
  const h = await get('/p/testsite.local/page', { method: 'HEAD' }); assert.equal(h.status, 200); assert.equal(await h.text(), '');
  assert.equal(seen.at(-1).method, 'HEAD');
});
test('request headers: only accept/accept-language/user-agent; cookies dropped', async () => {
  await get('/p/testsite.local/echo', { headers: { cookie: 'a=b', authorization: 'Bearer x', 'accept-language': 'ja-JP', 'user-agent': 'UA-Test/1', accept: 'text/html', referer: 'http://evil/' } });
  const h = seen.at(-1).headers;
  assert.equal(h.cookie, undefined); assert.equal(h.authorization, undefined); assert.equal(h.referer, undefined);
  assert.equal(h['user-agent'], 'UA-Test/1'); assert.equal(h['accept-language'], 'ja-JP'); assert.equal(h.accept, 'text/html');
});
test('path and query are forwarded', async () => {
  await get('/p/testsite.local/a/b%20c/d?q=1&host=2&z=%E3%81%82');
  assert.match(seen.at(-1).url, /^\/a\/b%20c\/d\?q=1/);
  assert.match(seen.at(-1).url, /z=%E3%81%82/);
  await get('/p/testsite.local');
  assert.equal(seen.at(-1).url, '/');
});
test('response headers: security headers and cookies stripped, hardening headers set', async () => {
  const r = await get('/p/testsite.local/page');
  for (const k of ['content-security-policy', 'x-frame-options', 'set-cookie', 'content-encoding']) assert.equal(r.headers.get(k), null, k);
  assert.equal(r.headers.get('x-robots-tag'), 'noindex'); assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.match(r.headers.get('content-type'), /^text\/html; charset=utf-8/);
  const body = await r.text(); assert.equal(Number(r.headers.get('content-length')), Buffer.byteLength(body));
});
test('HTML rewriting', async () => {
  const t = await (await get('/p/testsite.local/page')).text();
  assert.ok(t.includes('href="/p/testsite.local/abs?x=1&amp;y=2"'), 'absolute + entity');
  assert.ok(t.includes('href="/p/testsite.local/proto"'), 'protocol-relative');
  assert.ok(t.includes(`href="/p/testsite.local/root"`), 'root-relative single-quoted');
  assert.ok(t.includes('href="/p/testsite.local/dir/rel/x"'), 'relative resolved against <base>');
  assert.ok(t.includes('href="https://evil.example/o"'), 'non-allowlisted left alone');
  assert.ok(t.includes('href="#frag"') && t.includes('href="mailto:a@b.c"'), 'fragment/mailto untouched');
  assert.ok(t.includes('<base href="/p/testsite.local/dir/">'), '<base> rewritten');
  assert.ok(t.includes('src="/p/testsite.local/img.png"') && t.includes('data-src="/p/testsite.local/lazy.png"') && t.includes('poster="/p/testsite.local/p.jpg"') && t.includes('action="/p/testsite.local/search"'));
  assert.ok(t.includes('srcset="/p/testsite.local/a.png 1x, /p/testsite.local/b.png 2x, https://evil.example/c.png 3x"'), 'srcset');
  assert.ok(t.includes('url(/p/testsite.local/bg.png)') && t.includes('@import "/p/testsite.local/imp.css"'), 'style tag url/@import');
  assert.ok(t.includes("url('/p/testsite.local/inline.png')"), 'style attribute');
  assert.ok(!/integrity=/.test(t), 'integrity removed');
  assert.ok(!/http-equiv="Content-Security-Policy"/i.test(t), 'meta CSP removed');
});
test('panel + shim injection', async () => {
  const t = await (await get('/p/testsite.local/page')).text();
  assert.ok(t.includes('<script src="http://panel.test/bookmarklet.js" data-jev-proxy-host="testsite.local"></script></body>'));
  assert.ok(t.indexOf('window.fetch=') > t.indexOf('<head>') && t.indexOf('window.fetch=') < t.indexOf('<title>'), 'shim at top of head');
  assert.equal((t.match(/data-jev-proxy-host/g) || []).length, 1);
  const nb = await (await get('/p/testsite.local/nobody')).text();
  assert.ok(nb.endsWith('data-jev-proxy-host="testsite.local"></script>') && nb.includes('window.fetch='), 'no <body>: appended at the end, shim prepended');
});
test('shim logic (executed in a fake window)', async () => {
  const t = await (await get('/p/testsite.local/page')).text();
  const code = /<script>(\(function\(\)\{var P=[\s\S]*?)<\/script>/.exec(t)[1];
  const calls = [];
  const win = { fetch: (i) => calls.push(['fetch', typeof i === 'string' ? i : i.url]), URL, Request: class { constructor(u) { this.url = u; } } };
  const xhr = function () {}; xhr.prototype.open = (m, u) => calls.push(['xhr', u]);
  const loc = { href: 'http://px.test/p/testsite.local/dir/', origin: 'http://px.test' };
  new Function('window', 'XMLHttpRequest', 'location', 'Request', 'Proxy', 'Reflect', 'URL', code)(win, xhr, loc, win.Request, Proxy, Reflect, URL);
  win.fetch('/api/x'); win.fetch('https://testsite.local/y?z=1'); win.fetch('https://evil.example/q'); win.fetch('/p/testsite.local/already');
  new xhr().open('GET', '/xhr');
  assert.deepEqual(calls, [['fetch', '/p/testsite.local/api/x'], ['fetch', '/p/testsite.local/y?z=1'], ['fetch', 'https://evil.example/q'], ['fetch', '/p/testsite.local/already'], ['xhr', '/p/testsite.local/xhr']]);
  assert.equal(new win.URL('/rooted', 'http://px.test/p/testsite.local/').pathname, '/p/testsite.local/rooted');
  assert.equal(new win.URL('/x', 'http://other.test/').pathname, '/x');
});
test('CSS rewriting; JS/JSON pass through unchanged', async () => {
  const c = await (await get('/p/testsite.local/css')).text();
  assert.equal(c, 'a{background:url("/p/testsite.local/a.png")}b{background:url(/p/testsite.local/b.png)}c{background:url(https://evil.example/c.png)}@import url(/p/testsite.local/i.css);@import "/p/testsite.local/j.css";');
  assert.equal(await (await get('/p/testsite.local/js')).text(), 'var u="/not-rewritten"; fetch("/x")');
  assert.equal(await (await get('/p/testsite.local/json')).text(), '{"u":"/x"}');
  assert.ok(!(await (await get('/p/testsite.local/js')).text()).includes('data-jev'));
});
test('redirects: allowlisted ones rewritten and passed on; off-list refused', async () => {
  let r = await get('/p/testsite.local/redir'); assert.equal(r.status, 302); assert.equal(r.headers.get('location'), '/p/testsite.local/dest?a=1');
  r = await get('/p/testsite.local/redir-abs'); assert.equal(r.status, 301); assert.equal(r.headers.get('location'), '/p/testsite.local/abs-dest');
  for (const p of ['redir-evil', 'redir-lookalike', 'redir-ip']) {
    r = await get(`/p/testsite.local/${p}`); assert.equal(r.status, 403, p); assert.equal(r.headers.get('location'), null); assert.match(await r.text(), /リダイレクト先/);
  }
});
test('upstream 403/429/5xx and bot challenge -> Japanese error page', async () => {
  for (const p of ['denied', 'limited', 'boom', 'challenge']) {
    const r = await get(`/p/testsite.local/${p}`); assert.equal(r.status, 502, p);
    assert.match(await r.text(), /拒否|ボット/);
  }
});
test('size limit', async () => {
  process.env.JEV_PROXY_MAX_BYTES = '1000';
  try { const r = await get('/p/testsite.local/big'); assert.equal(r.status, 502); assert.match(await r.text(), /大きすぎ/); } finally { delete process.env.JEV_PROXY_MAX_BYTES; }
  assert.equal((await get('/p/testsite.local/big')).status, 200);
});
test('timeout', async () => {
  process.env.JEV_PROXY_TIMEOUT_MS = '300';
  try { const r = await get('/p/testsite.local/slow'); assert.equal(r.status, 504); assert.match(await r.text(), /応答がありません/); } finally { delete process.env.JEV_PROXY_TIMEOUT_MS; }
});
test('Shift_JIS decoding to UTF-8', async () => {
  const r = await get('/p/testsite.local/sjis'); assert.match(r.headers.get('content-type'), /utf-8/);
  assert.match(await r.text(), /<body>/);
});
test('config: proxy ALLOW equals app config', async () => {
  const { PROXY_HOSTS } = await import('../web/js/config.js');
  assert.deepEqual(PROXY_HOSTS, (await import('./proxy-adapter.mjs')).handler.ALLOW);
});
test('raw request-line oddities do not reach upstream', async () => {
  const n = seen.length;
  const out = await rawGet('/api/p?host=127.0.0.1%3A80&path=');
  assert.match(out, /403/);
  assert.equal(seen.length, n);
});
