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
export function proxyUrl(u, prompt, base = PROXY_BASE) {
  if (!isSupportedHost(u.hostname) || u.port) return null;
  return `${base}/p/${u.hostname.toLowerCase()}${u.pathname}${u.search}#jev-prompt=${encodePrompt(prompt || '')}`;
}
/** Original site URL of a proxied page: /p/<host>/x?y -> https://<host>/x?y (null when not under /p/<host>/). */
export function originalUrl(loc, proxyHost) {
  const pre = `/p/${proxyHost}`;
  if (!proxyHost || (loc.pathname !== pre && !loc.pathname.startsWith(pre + '/'))) return null;
  return `https://${proxyHost}${loc.pathname.slice(pre.length) || '/'}${loc.search}`;
}
