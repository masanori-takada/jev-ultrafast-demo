// Proxy wiring shared by the panel. PROXY_HOSTS is a COPY of ALLOW in proxy/api/p.js (the proxy must stay a standalone,
// copy-by-hand project); tests/proxy.test.mjs asserts the two lists are identical.
export const PROXY_BASE = 'https://jev-ultrafast-demo.vercel.app';
export const PROXY_HOSTS = ['suumo.jp', 'amazon.co.jp', 'amazon.com', 'indeed.com', 'jp.indeed.com', 'doda.jp', 'rikunabi.com',
  'mynavi.jp', 'green-japan.com', 'wantedly.com', 'kakaku.com', 'rakuten.co.jp', 'zozo.jp', 'mercari.com'];

export const isSupportedHost = (h) => {
  h = String(h || '').toLowerCase();
  return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(h) && !/^[\d.]+$/.test(h) && PROXY_HOSTS.some((a) => h === a || h.endsWith('.' + a));
};
export const UNSUPPORTED_TEXT = `このサイトはまだ対応していません（対応: ${PROXY_HOSTS.slice(0, 2).join(', ')} …）`;

/** UTF-8 text <-> base64url (the prompt travels in the URL #hash: never sent to any server). */
export function encodePrompt(text) {
  const bin = Array.from(new TextEncoder().encode(String(text)), (b) => String.fromCharCode(b)).join('');
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodePrompt(b64) {
  try {
    const s = String(b64).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch { return null; }
}
/** https://suumo.jp/sp/?a=1 + prompt -> `${PROXY_BASE}/p/suumo.jp/sp/?a=1#jev-prompt=...` (null when the host is not supported). */
export function proxyUrl(u, prompt, base = PROXY_BASE, auto = false) {
  if (!isSupportedHost(u.hostname) || u.port) return null;
  return `${base}/p/${u.hostname.toLowerCase()}${u.pathname}${u.search}#jev-prompt=${encodePrompt(prompt || '')}${auto ? '&jev-auto=1' : ''}`;
}
/** Original site URL of a proxied page: /p/<host>/x?y -> https://<host>/x?y (null when not under /p/<host>/). */
export function originalUrl(loc, proxyHost) {
  const pre = `/p/${proxyHost}`;
  if (!proxyHost || (loc.pathname !== pre && !loc.pathname.startsWith(pre + '/'))) return null;
  return `https://${proxyHost}${loc.pathname.slice(pre.length) || '/'}${loc.search}`;
}

/** Friendly site names for the hand-off button; falls back to the hostname. */
export const SITE_NAMES = { 'suumo.jp': 'SUUMO', 'amazon.co.jp': 'Amazon', 'amazon.com': 'Amazon', 'kakaku.com': '価格.com', 'indeed.com': 'Indeed', 'doda.jp': 'doda',
  'rikunabi.com': 'リクナビ', 'mynavi.jp': 'マイナビ', 'green-japan.com': 'Green', 'wantedly.com': 'Wantedly', 'rakuten.co.jp': '楽天市場', 'zozo.jp': 'ZOZOTOWN', 'mercari.com': 'メルカリ' };
export function siteName(host) {
  host = String(host || '').toLowerCase();
  const k = Object.keys(SITE_NAMES).find((a) => host === a || host.endsWith('.' + a));
  return k ? SITE_NAMES[k] : host;
}
/** Parses what a person typed ("suumo.jp/sp/" or "https://…") into an http(s) URL with a dotted host, else null. */
export function parseUserUrl(v) {
  v = String(v || '').trim(); if (!v) return null;
  try { const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u : null; } catch { return null; }
}
/** The ONE 開く decision, shared by the panel and start.html: {kind:'invalid'} | {kind:'same'|'proxy', href} | {kind:'unsupported'}. */
export function resolveOpen(value, prompt, loc, base = PROXY_BASE) {
  const u = parseUserUrl(value);
  if (!u) return { kind: 'invalid' };
  if (u.origin === loc.origin) return { kind: 'same', href: u.href };
  const t = proxyUrl(u, prompt, base);
  return t ? { kind: 'proxy', href: t } : { kind: 'unsupported' };
}
/** The 12 start-page sites (hosts verified through the deployed proxy; every url host is inside PROXY_HOSTS, unit-tested).
 *  blocked: the site refuses the server's requests -> never proxied, opened directly. aliases are matched on NFKC-lowercased text. */
export const SITES = [
  { id: 'suumo', name: 'SUUMO', group: '住まい', url: 'https://suumo.jp/sp/', domain: 'suumo.jp', re: /suumo|スーモ/, sample: 'SUUMOで東京の1LDK、家賃10万円以下' },
  { id: 'amazon', name: 'Amazon', group: '買い物', url: 'https://www.amazon.co.jp/', domain: 'amazon.co.jp', re: /amazon|アマゾン/, sample: 'Amazonでワイヤレスイヤホン、評価4以上、5000円以下' },
  { id: 'rakuten', name: '楽天市場', group: '買い物', url: 'https://www.rakuten.co.jp/', domain: 'rakuten.co.jp', re: /楽天|rakuten/, sample: '楽天市場でノートパソコン、10万円以下' },
  { id: 'kakaku', name: '価格.com', group: '買い物', url: 'https://kakaku.com/', domain: 'kakaku.com', re: /価格\.?com|価格コム|カカクコム|kakaku/, sample: '価格.comでノートパソコン、10万円以下' },
  { id: 'mercari', name: 'メルカリ', group: '買い物', url: 'https://jp.mercari.com/', domain: 'mercari.com', re: /メルカリ|mercari/, sample: 'メルカリでカメラ、5000円以下' },
  { id: 'zozo', name: 'ZOZOTOWN', group: '買い物', url: 'https://zozo.jp/', domain: 'zozo.jp', re: /zozo|ゾゾ/, blocked: true },
  { id: 'indeed', name: 'Indeed', group: '仕事', url: 'https://jp.indeed.com/', domain: 'indeed.com', re: /indeed|インディード/, blocked: true },
  { id: 'doda', name: 'doda', group: '仕事', url: 'https://doda.jp/', domain: 'doda.jp', re: /doda|デューダ/, sample: 'dodaで東京のエンジニア、年収600万円以上' },
  { id: 'rikunabi', name: 'リクナビNEXT', group: '仕事', url: 'https://next.rikunabi.com/', domain: 'rikunabi.com', re: /リクナビ|rikunabi/, blocked: true },
  { id: 'mynavi', name: 'マイナビ転職', group: '仕事', url: 'https://tenshoku.mynavi.jp/', domain: 'mynavi.jp', re: /マイナビ|mynavi/, sample: 'マイナビ転職で東京の営業、年収500万円以上' },
  { id: 'green', name: 'Green', group: '仕事', url: 'https://www.green-japan.com/', domain: 'green-japan.com', re: /green|グリーン/, sample: 'Greenで東京のエンジニア、リモート可' },
  { id: 'wantedly', name: 'Wantedly', group: '仕事', url: 'https://www.wantedly.com/', domain: 'wantedly.com', re: /wantedly|ウォンテッドリー/, sample: 'Wantedlyでデザイナー、リモート可' },
];
export const BLOCKED_NOTE = 'このサイトは中継できないため、そのまま開きます';
const nfkc = (t) => String(t || '').normalize('NFKC').toLowerCase();
const siteOfHost = (h) => SITES.find((x) => h === x.domain || h.endsWith('.' + x.domain));
/** Start-page decision: a typed address wins, else a site name (alias). The WHOLE sentence is the prompt and auto-start is flagged.
 *  {kind:'empty'|'unknown'} | {kind:'proxy', href, site?} | {kind:'blocked', site, href: real site (never proxied)} */
export function resolveSentence(text, base = PROXY_BASE) {
  text = String(text || '').trim();
  if (!text) return { kind: 'empty' };
  const m = text.match(/https?:\/\/[^\s、。「」]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s、。「」]*)?/i);
  const u = m && parseUserUrl(m[0]);
  if (u) {
    const site = siteOfHost(u.hostname.toLowerCase());
    if (site?.blocked) return { kind: 'blocked', site, href: u.href };
    const href = proxyUrl(u, text, base, true); if (href) return { kind: 'proxy', href, site };
  }
  const site = SITES.find((x) => x.re.test(nfkc(text)));
  if (!site) return { kind: 'unknown' };
  if (site.blocked) return { kind: 'blocked', site, href: site.url };
  return { kind: 'proxy', href: proxyUrl(new URL(site.url), text, base, true), site };
}
/** 'ios' | 'android' | 'pc' from userAgent (iPadOS reports as Macintosh + touch). */
export function detectDevice(ua, maxTouchPoints = 0) {
  ua = String(ua || '');
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'pc';
}
