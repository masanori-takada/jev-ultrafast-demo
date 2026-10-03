'use strict';
// Jev allowlist rewriting proxy: GET /p/<host>/<path> fetches https://<host>/<path> (allowlisted hosts ONLY) and
// rewrites links so the page keeps working under /p/<host>/..., then injects the Jev panel script.
// NOT an open proxy: any other host gets a 403 page and is never fetched. No cookies in either direction.
// What breaks (honest list): logins, POST forms, heavy client-side apps / SPAs that read location.pathname,
// inline JS that builds URLs (only fetch/XHR/new URL are shimmed), sites that block datacenter IPs, bot protection
// (answered with a Japanese error page). Redirects are NOT followed here: each 3xx is validated against the
// allowlist and handed to the browser with a rewritten Location (so the URL and #hash stay right).
// Query params named "host"/"path" in the upstream query: only the first of each is taken as routing.
const ALLOW = ['suumo.jp', 'amazon.co.jp', 'amazon.com', 'indeed.com', 'jp.indeed.com', 'doda.jp', 'rikunabi.com',
  'mynavi.jp', 'green-japan.com', 'wantedly.com', 'kakaku.com', 'rakuten.co.jp', 'zozo.jp', 'mercari.com'];
const PANEL_DEFAULT = 'https://masanori-takada.github.io/jev-ultrafast-demo/bookmarklet.js';
const TEST = 'testsite.local'; // maps to JEV_PROXY_TEST_UPSTREAM; only active when that env var is set (tests only)
const env = (k) => process.env[k] || '';
const list = () => (env('JEV_PROXY_TEST_UPSTREAM') ? [...ALLOW, TEST] : ALLOW);
const allowed = (h) => {
  h = String(h || '').toLowerCase();
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(h) || /^[\d.]+$/.test(h)) return false; // no IPv6/userinfo/port/IP literals
  return list().some((a) => h === a || h.endsWith('.' + a));
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const page = (title, msg, extra) => `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="font:16px/1.7 system-ui,sans-serif;max-width:640px;margin:24px auto;padding:0 16px"><h1 style="font-size:20px">${esc(title)}</h1><p>${esc(msg)}</p>${extra || ''}<p style="font-size:13px;color:#666">自動操作の中継ページ</p></body></html>`;
const sites = () => `<p>対応サイト:</p><ul>${ALLOW.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>`;
const SKIP = /^(#|data:|javascript:|mailto:|tel:|blob:|about:)/i;

// absolute / protocol-relative / root-relative / relative URL -> /p/<host>/..., or null when it must stay unchanged
function px(v, base) {
  v = String(v).replace(/&amp;/g, '&').trim();
  if (!v || SKIP.test(v)) return null;
  let u; try { u = new URL(v, base); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || u.port || u.username || u.password || !allowed(u.hostname)) return null;
  return `/p/${u.hostname}${u.pathname}${u.search}${u.hash}`;
}
const cssRw = (css, base) => css
  .replace(/url\(\s*(["']?)([^)"']*)\1\s*\)/gi, (m, q, u) => { const r = px(u, base); return r == null ? m : `url(${q}${r}${q})`; })
  .replace(/@import\s+(["'])([^"']+)\1/gi, (m, q, u) => { const r = px(u, base); return r == null ? m : `@import ${q}${r}${q}`; });

// Runs in the proxied page: fetch / XHR / new URL(root-relative, location) go through /p/<host>.
const shim = (host) => `<script>(function(){var P="/p/${host}",A=${JSON.stringify(list())};
function ok(h){return A.some(function(a){return h===a||h.slice(-a.length-1)==="."+a})}
function fx(u){try{var x=new URL(String(u),location.href);
if(x.origin===location.origin)return x.pathname.indexOf(P+"/")===0||x.pathname===P?String(u):P+x.pathname+x.search+x.hash;
if(!x.port&&ok(x.hostname))return"/p/"+x.hostname+x.pathname+x.search+x.hash}catch(e){}return u}
var F=window.fetch;if(F)window.fetch=function(i,o){i=i&&typeof i==="object"&&i.url!==undefined?new Request(fx(i.url),i):fx(i);return F.call(this,i,o)};
var O=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){var a=[].slice.call(arguments);a[1]=fx(u);return O.apply(this,a)};
window.URL=new Proxy(window.URL,{construct:function(t,a,n){if(typeof a[0]==="string"&&/^\\/(?!\\/)/.test(a[0])&&a[1]&&String(a[1]).indexOf(location.origin)===0)a=[fx(a[0]),a[1]];return Reflect.construct(t,a,n)}});
})();</script>`;

function htmlRw(html, host, base) {
  const bm = /<base\s[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(html);
  if (bm) { try { base = new URL(bm[1] ?? bm[2], base).href; } catch { /* keep page URL */ } }
  html = html
    .replace(/<meta\s[^>]*http-equiv\s*=\s*["']?content-security-policy[^>]*>/gi, '')
    .replace(/\sintegrity\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '') // CSS is rewritten, so hashes would no longer match
    .replace(/(\s(?:href|src|action|data-src|poster)\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi, (m, p, a, b, c) => {
      const r = px(a ?? b ?? c, base); return r == null ? m : `${p}"${r.replace(/&/g, '&amp;')}"`; })
    .replace(/(\s(?:srcset|data-srcset)\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi, (m, p, a, b) =>
      `${p}"${(a ?? b).split(/\s*,\s+/).map((e) => { const [u, ...d] = e.trim().split(/\s+/); const r = px(u, base); return [r == null ? u : r.replace(/&/g, '&amp;'), ...d].join(' '); }).join(', ')}"`)
    .replace(/(\sstyle\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi, (m, p, a, b) => `${p}"${cssRw(a ?? b, base).replace(/"/g, '&quot;')}"`)
    .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, o, css, c) => o + cssRw(css, base) + c)
    .replace(/(<meta\s[^>]*http-equiv\s*=\s*["']?refresh[^>]*content\s*=\s*["'][^"']*?url=)([^"']*)/gi, (m, p, u) => { const r = px(u, base); return r == null ? m : p + r; });
  const panel = `<script src="${esc(env('JEV_PANEL_URL') || PANEL_DEFAULT)}" data-jev-proxy-host="${host}"></script>`;
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + shim(host)) : shim(host) + html;
  const i = html.toLowerCase().lastIndexOf('</body>');
  return i < 0 ? html + panel : html.slice(0, i) + panel + html.slice(i);
}

async function readBody(r, limit) {
  if (Number(r.headers.get('content-length')) > limit) return null;
  const parts = []; let n = 0;
  for await (const c of r.body) { n += c.length; if (n > limit) { try { await r.body.cancel(); } catch { /* ignore */ } return null; } parts.push(c); }
  return Buffer.concat(parts);
}

module.exports = async (req, res) => {
  const send = (code, type, body, h = {}) => {
    res.statusCode = code;
    const all = { 'content-type': type, 'x-robots-tag': 'noindex', 'cache-control': 'no-store', ...h };
    for (const k of Object.keys(all)) res.setHeader(k, all[k]);
    const buf = Buffer.from(body || '');
    if (body != null) res.setHeader('content-length', buf.length);
    res.end(req.method === 'HEAD' ? undefined : buf);
  };
  const err = (code, title, msg, extra) => send(code, 'text/html; charset=utf-8', page(title, msg, extra));
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'text/html; charset=utf-8', page('対応していない操作です', 'この中継ページは表示のみ対応です。'), { allow: 'GET, HEAD' });

  const rest = new URLSearchParams(); let host, path;
  for (const [k, v] of new URL(req.url, 'http://x').searchParams) {
    if (k === 'host' && host === undefined) host = v; else if (k === 'path' && path === undefined) path = v; else rest.append(k, v);
  }
  host = String(host || '').toLowerCase().replace(/:443$/, '');
  if (!allowed(host)) return err(403, 'このサイトはまだ対応していません', '安全のため、対応しているサイトだけを表示できます。', sites());
  const target = new URL(`https://${host}`);
  target.pathname = '/' + (path || ''); target.search = rest.toString();
  const test = env('JEV_PROXY_TEST_UPSTREAM');
  const real = host === TEST && test ? test.replace(/\/$/, '') + target.pathname + target.search : target.href;
  const limit = Number(env('JEV_PROXY_MAX_BYTES')) || 8 * 1024 * 1024;
  const h = req.headers;
  let r;
  try {
    r = await fetch(real, { method: req.method, redirect: 'manual', signal: AbortSignal.timeout(Number(env('JEV_PROXY_TIMEOUT_MS')) || 15000),
      headers: { accept: h.accept || '*/*', 'accept-language': h['accept-language'] || 'ja,en;q=0.8', 'user-agent': h['user-agent'] || 'Mozilla/5.0 (compatible; JevProxy)' } });
  } catch (e) {
    return err(504, 'サイトから応答がありません', e && e.name === 'TimeoutError' ? '15秒以内に応答がありませんでした。' : 'サイトに接続できませんでした。');
  }
  if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
    const to = px(r.headers.get('location'), target.href);
    if (to == null) return err(403, 'リダイレクト先は未対応です', '移動先が対応していないサイトのため、表示しません。', sites());
    return send(r.status, 'text/plain; charset=utf-8', '', { location: to });
  }
  if (r.status === 403 || r.status === 429 || r.status >= 500) {
    return err(502, 'サイトに拒否されました', `サイトが応答コード ${r.status} を返しました。サーバー（データセンター）からのアクセス制限・ボット対策の可能性があります。自動操作ボタンか拡張機能を使ってください。`);
  }
  const type = r.headers.get('content-type') || 'application/octet-stream';
  const fwd = {};
  for (const k of ['content-language', 'content-disposition']) if (r.headers.get(k)) fwd[k] = r.headers.get(k);
  if (req.method === 'HEAD') return send(r.status, type, null, fwd);
  let buf;
  try { buf = await readBody(r, limit); } catch { return err(504, 'サイトから応答がありません', '読み込み中にタイムアウトまたは切断されました。'); }
  if (!buf) return err(502, '大きすぎて表示できません', `${Math.round(limit / 1048576)}MB を超えるため表示できません。`);
  const isHtml = /^(text\/html|application\/xhtml)/i.test(type), isCss = /^text\/css/i.test(type);
  if (!isHtml && !isCss) return send(r.status, type, buf, fwd); // JS / JSON / images / fonts pass through unchanged
  let cs = (/charset=["']?([\w-]+)/i.exec(type) || [])[1] || (isHtml && (/<meta[^>]+charset=["']?([\w-]+)/i.exec(buf.subarray(0, 2048).toString('latin1')) || [])[1]);
  let text; try { text = new TextDecoder(cs || 'utf-8').decode(buf); } catch { text = buf.toString('utf8'); } // Shift_JIS / EUC-JP -> UTF-8
  if (isCss) return send(r.status, 'text/css; charset=utf-8', cssRw(text, target.href), fwd);
  const title = (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(text) || [])[1] || '';
  if (/Robot Check|Just a moment|Access Denied|Attention Required|Pardon Our Interruption|ロボットではありません/i.test(title)) {
    return err(502, 'ボット対策で止められました', 'サイトが自動アクセスを確認する画面を返しました。自動操作ボタンか拡張機能を使ってください。');
  }
  return send(r.status, 'text/html; charset=utf-8', htmlRw(text, host, target.href), fwd);
};
module.exports.ALLOW = ALLOW;
module.exports.allowed = allowed; // for tests
