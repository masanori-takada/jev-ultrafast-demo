// Jevボタン (bookmarklet) text: shared by start.html and the panel. Pure; no DOM.
const BM_URL = 'bookmarklet.js';
/** Percent-encodes ONLY what a javascript: URL needs (%, #, CR/LF) so it stays valid in a phone bookmark URL field. */
export function encodeBookmarklet(code) {
  return 'javascript:' + String(code).replace(/%/g, '%25').replace(/#/g, '%23').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
let bmCache = null;
/** Fetches bookmarklet.js ONCE here in the app page (same origin: no CSP/CORS issue) and returns the FULL self-contained javascript: text. */
export async function bookmarkletCode(base) {
  if (bmCache) return bmCache;
  const r = await fetch(new URL(BM_URL, base).href);
  if (!r.ok) throw new Error(`bookmarklet.js ${r.status}`);
  return (bmCache = encodeBookmarklet(await r.text()));
}
