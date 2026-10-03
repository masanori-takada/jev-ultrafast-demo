// Site-agnostic engine: DOM action runner (select/click/type with a visible cursor),
// timing log, timer, start/stop. Per-site knowledge lives in adapters/*.js.
// NOTE: bundled into the bookmarklet by tools/build-bookmarklet.mjs -> keep imports single-line
// (`import {a} from './x.js';`) and exports as `export function|const|class`.

import { blockedElement, blockedForm } from './generic/safety.js';

export const fmtTimer = (ms) => (Math.max(0, ms) / 1000).toFixed(1) + 's';
export const skipLabel = (label) => (/送信|submit/i.test(label) ? '送信はスキップ(安全のため)' : `スキップ(安全のため): ${label}`);
export const normText = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

export class NotFoundError extends Error {
  constructor(what) { super(`要素が見つかりません: ${what}`); this.name = 'NotFoundError'; this.what = what; }
}
export class AbortedError extends Error { constructor() { super('aborted'); this.name = 'AbortedError'; } }

export function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new AbortedError());
    const id = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve(); }, Math.max(0, ms));
    const onAbort = () => { clearTimeout(id); reject(new AbortedError()); };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function isVisible(el) {
  if (!el || !el.isConnected) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  const cs = el.ownerDocument.defaultView.getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}

const CLICKABLE = 'a,button,label,summary,[role=button],[role=link],[role=tab],[role=option],input[type=button],input[type=submit],input[type=checkbox],input[type=radio],li,span,div';

/** Find the best visible element whose text matches one of `texts` (first text = highest priority).
 *  exact match beats "includes"; among equals the smallest (innermost) element wins. Never throws. */
export function findByText(texts, { root = document, sel = CLICKABLE, exactOnly = false, filter } = {}) {
  const list = (Array.isArray(texts) ? texts : [texts]).map(normText);
  const cands = [...root.querySelectorAll(sel)].filter((e) => isVisible(e) && !e.closest('#jev-root,#panel,#jev-cursor'));
  for (const t of list) {
    const label = (e) => normText(e.value && /^(button|submit)$/.test(e.type || '') ? e.value : (e.innerText ?? e.textContent) || e.getAttribute?.('aria-label') || '');
    const exact = cands.filter((e) => label(e) === t && (!filter || filter(e)));
    if (exact.length) return exact.sort((a, b) => area(a) - area(b))[0];
    if (!exactOnly) {
      const inc = cands.filter((e) => label(e).includes(t) && label(e).length <= t.length + 24 && (!filter || filter(e)));
      if (inc.length) return inc.sort((a, b) => area(a) - area(b))[0];
    }
  }
  return null;
}
const area = (e) => { const r = e.getBoundingClientRect(); return r.width * r.height; };

export function createEngine({ panel, doc = document, speed = 1, shield = false, persistKey = null, reducedMotion, noFavorite = false } = {}) {
  const win = doc.defaultView;
  const reduce = reducedMotion ?? !!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const glideMs = reduce ? 60 : 260;
  let policy = { allowCart: false, allow: [], noFavorite };
  const skipRow = (el, label) => { if (eng.blocked(el) === 'favorite') { eng.logRow('SKIP', 'お気に入りは本物のサイトで（ボタンを表示）'); panel?.showHandoff?.(); } else eng.logRow('SKIP', skipLabel(label)); };
  let controller = null, t0 = 0, timerId = 0, running = false, cursorEl = null, shieldEl = null, rowLogged = false, lastTimerMs = 0;
  const store = () => { try { return win.sessionStorage; } catch { return null; } };

  function ensureCursor() {
    if (cursorEl && cursorEl.isConnected) return cursorEl;
    cursorEl = doc.createElement('div');
    cursorEl.id = 'jev-cursor';
    cursorEl.setAttribute('aria-hidden', 'true');
    cursorEl.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2l9 10-9 10-9-10z" fill="#fff"/><path d="M12 5.2L18.4 12 12 18.8 5.6 12z" fill="#2f6bff"/></svg>';
    Object.assign(cursorEl.style, { position: 'fixed', left: '0', top: '0', width: '28px', height: '28px', zIndex: '2147483646', pointerEvents: 'none',
      borderRadius: '50%', background: '#2f6bff', boxShadow: '0 2px 8px rgba(47,107,255,.6)', display: 'grid', placeItems: 'center',
      transform: 'translate(-100px,-100px)', transition: `transform ${glideMs}ms ease` });
    doc.body.appendChild(cursorEl);
    return cursorEl;
  }
  function removeCursor() { cursorEl?.remove(); cursorEl = null; }
  function addShield() {
    if (!shield || shieldEl) return;
    shieldEl = doc.createElement('div'); shieldEl.id = 'jev-shield';
    Object.assign(shieldEl.style, { position: 'fixed', inset: '0', zIndex: '2147483000', background: 'transparent', cursor: 'progress' });
    doc.body.appendChild(shieldEl);
  }
  const removeShield = () => { shieldEl?.remove(); shieldEl = null; };

  const elapsed = () => performance.now() - t0;

  const eng = {
    doc, win, get running() { return running; }, elapsed,
    signal: () => controller?.signal,
    async glideTo(el) {
      if (!isVisible(el)) { el.scrollIntoView?.({ block: 'center' }); }
      else { const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > win.innerHeight) el.scrollIntoView?.({ block: 'center' }); }
      const r = el.getBoundingClientRect(); const c = ensureCursor();
      c.style.transform = `translate(${Math.round(r.left + r.width / 2 - 14)}px,${Math.round(r.top + r.height / 2 - 14)}px)`;
      await sleep(glideMs, controller?.signal);
      // inline style (not a class): in the bookmarklet the panel CSS lives in a shadow root and cannot style host elements
      const st = el.style, prev = [st.outline, st.outlineOffset]; st.outline = '2px solid #2f6bff'; st.outlineOffset = '2px';
      setTimeout(() => { st.outline = prev[0]; st.outlineOffset = prev[1]; }, 350);
    },
    ripple(el) {
      if (reduce) return;
      const r = el.getBoundingClientRect(); const d = doc.createElement('div');
      Object.assign(d.style, { position: 'fixed', left: `${r.left + r.width / 2 - 14}px`, top: `${r.top + r.height / 2 - 14}px`, width: '28px', height: '28px',
        borderRadius: '50%', border: '2px solid #2f6bff', zIndex: '2147483645', pointerEvents: 'none', transition: 'transform .4s, opacity .4s' });
      doc.body.appendChild(d); requestAnimationFrame(() => { d.style.transform = 'scale(2.2)'; d.style.opacity = '0'; }); setTimeout(() => d.remove(), 450);
    },
    setPolicy(p) { policy = { allowCart: false, allow: [], noFavorite, ...p }; },
    /** Safety denylist check (purchase/submit/login/...); see generic/safety.js */
    blocked(el) { return blockedElement(el, policy); },
    blockedForm(form) { return blockedForm(form, policy); },
    /** Show the cursor on a control and log a SKIP row without clicking it. */
    async skip(el, label) { if (el) await eng.glideTo(el); skipRow(el, label); },
    async settle(ms = 220) { await sleep(ms / speed, controller?.signal); },
    async click(el, label) {
      if (eng.blocked(el)) { skipRow(el, label); return false; }
      await eng.glideTo(el); eng.ripple(el);
      eng.logRow('CLICK', label);
      el.click();
      return true;
    },
    async check(el, label, want = true) {
      if (el.checked === want) return false;
      const target = el.matches?.('input') && !isVisible(el) && el.labels?.[0] ? el.labels[0] : el;
      if (eng.blocked(target)) { skipRow(target, label); return false; }
      await eng.glideTo(target); eng.ripple(target);
      eng.logRow('CLICK', label);
      target.click();
      return true;
    },
    async select(el, text, label) {
      await eng.glideTo(el);
      const opt = [...el.options].find((o) => normText(o.text) === normText(text) || o.value === text);
      if (!opt) throw new NotFoundError(`${label || 'select'} の選択肢「${text}」`);
      eng.logRow('SELECT', label);
      el.focus?.();
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(el, opt.value);
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    async type(el, text, label, perChar = 35) {
      if (eng.blocked(el)) { skipRow(el, label); return false; }
      await eng.glideTo(el); eng.ripple(el);
      eng.logRow('TYPE_TEXT', label);
      el.focus?.();
      const proto = el instanceof win.HTMLTextAreaElement ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, ''); el.dispatchEvent(new Event('input', { bubbles: true }));
      for (const ch of text) {
        await sleep(perChar / speed, controller?.signal);
        setter.call(el, el.value + ch);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    /** Log the current step's row now (steps may call this at the moment the action happens). */
    logRow(verb, label) { rowLogged = true; panel?.log(Math.round(elapsed()), verb, label); },
    note(text) { panel?.log(Math.round(elapsed()), 'NOTE', text); },
    stop() { if (running) controller?.abort(); },

    /** Run adapter steps. Resolves with the final state: 'done' | 'stopped' | 'error'. */
    async run(steps, { startIndex = 0 } = {}) {
      if (running) return 'busy';
      running = true; controller = new AbortController(); t0 = performance.now();
      const sig = controller.signal;
      panel?.setState('running'); panel?.setTimer(0);
      timerId = setInterval(() => { lastTimerMs = elapsed(); panel?.setTimer(lastTimerMs); }, 100);
      addShield(); ensureCursor();
      let state = 'done';
      try {
        for (let i = startIndex; i < steps.length; i++) {
          const s = steps[i];
          if (s.t != null) await sleep(s.t / speed - (s.verb === 'DONE' ? 0 : glideMs) - elapsed(), sig);
          if (s.verb === 'DONE') break;
          rowLogged = false;
          if (s.navigates && persistKey) { try { store()?.setItem(persistKey, JSON.stringify({ idx: i + 1, ts: Date.now() })); } catch {} }
          await s.run(eng, s);
          if (!rowLogged && !s.silent) panel?.log(Math.round(elapsed()), s.verb, s.label);
          if (persistKey && !s.navigates) { try { store()?.setItem(persistKey, JSON.stringify({ idx: i + 1, ts: Date.now() })); } catch {} }
        }
        try { store()?.removeItem(persistKey); } catch {}
      } catch (e) {
        if (e instanceof AbortedError || sig.aborted) state = 'stopped';
        else { state = 'error'; panel?.setError(e instanceof NotFoundError ? e.message : `エラー: ${e?.message || e}`); }
      } finally {
        clearInterval(timerId); panel?.setTimer(elapsed());
        removeCursor(); removeShield(); running = false;
      }
      panel?.setState(state);
      return state;
    },
    /** Saved progress after a page navigation (bookmarklet use), or null. */
    pending() {
      if (!persistKey) return null;
      try { const v = JSON.parse(store()?.getItem(persistKey) || 'null'); return v && Date.now() - v.ts < 15 * 60e3 ? v : null; } catch { return null; }
    },
    clearPending() { try { store()?.removeItem(persistKey); } catch {} },
  };
  return eng;
}
