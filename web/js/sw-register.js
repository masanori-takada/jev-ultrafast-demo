export function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!had) return; // first install: nothing stale to replace
    try { if (sessionStorage.getItem('jev.swReload')) return; sessionStorage.setItem('jev.swReload', '1'); } catch { return; }
    location.reload();
  });
}
