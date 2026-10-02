// Bookmarklet entry: injects the panel into the current page. Bundled by tools/build-bookmarklet.mjs (PANEL_CSS is prepended).
import { startApp } from './app.js';

(function jevBookmarklet() {
  const old = document.getElementById('jev-root');
  if (old) { old.remove(); return; } // second tap toggles the panel off
  // set by the rewriting proxy's injected <script data-jev-proxy-host>; must be read synchronously
  const proxyHost = (document.currentScript && document.currentScript.getAttribute('data-jev-proxy-host')) || '';
  const host = document.createElement('div');
  host.id = 'jev-root';
  host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;left:0;bottom:0;width:0;height:0';
  document.documentElement.appendChild(host);
  // eslint-disable-next-line no-undef
  startApp({ host, mode: 'bookmarklet', css: typeof PANEL_CSS === 'string' ? PANEL_CSS : '', dock: !!globalThis.__JEV_EXT__, proxyHost, onClose: () => host.remove() });
})();
