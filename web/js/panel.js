// Jev Ultrafast panel UI (pure UI: no engine knowledge). Used by the demo pages and by the bookmarklet.
import { fmtTimer } from './engine.js';
import { KEY_STORAGE } from './generic/jev.js';

export const PRESETS = [
  { id: 'mamazon', label: '🛒 Mamazon：パソコンを最安で購入', page: 'mamazon.html' },
  { id: 'suumoja', label: '🏠 SUUMOじゃ：東京1LDKを探して問い合わせ', page: 'index.html' },
  { id: 'form', label: '📝 Personal Form：架空プロフィールで送信', page: 'form.html' },
];
export const DEMO_SITES = [
  { title: 'AIエージェント操作用 デモサイト一覧', page: 'sites.html' },
  { title: 'Mamazon（架空の通販サイト）', page: 'mamazon.html' },
  { title: 'スーモジャ（架空の不動産サイト）', page: 'index.html' },
  { title: 'Personal Form（架空プロフィールフォーム）', page: 'form.html' },
];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Bookmarklet mode runs on a third-party host page: the key lives ONLY in this module variable (gone on reload) and never touches host storage.
let memKey = '';
const store = (fn) => { try { return fn(globalThis.localStorage); } catch { return null; } };

const HTML = (o) => `
<aside id="panel" data-layout="side" data-snap="collapsed" aria-label="Jev Ultrafast">
  <div class="chrome"><span class="jicon">J</span><span>Jev Ultrafast</span><span class="sp"></span>
    <button type="button" id="btn-pin" aria-label="ピン留め解除" tabindex="-1">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5M9 3h6l-1 6 4 4H6l4-4zM3 3l18 18"/></svg></button>
    <button type="button" id="btn-x" aria-label="閉じる">✕</button></div>
  <div class="card">
    <button type="button" id="sheet-close" aria-label="シートを折りたたむ">✕</button>
    <div id="sheet-handle" class="handle" role="button" aria-label="パネルの高さを変える" tabindex="0"><span></span></div>
    <header class="hd"><h2><i>⚡</i> Jev Ultrafast</h2><span id="conn-badge" data-state="connecting">接続中…</span></header>
    <div class="scroll">
      <div class="sect tabsect">
        <span class="lbl" id="tab-lbl">操作するタブ</span>
        ${o.mode === 'bookmarklet'
          ? `<div class="tabbox ro"><span class="ro-text" id="tab-ro"></span></div>`
          : `<div class="tabbox" id="tab-box"><select id="tab-select" aria-labelledby="tab-lbl"></select>
               <div class="urlrow" id="url-row" hidden><input id="tab-url" type="url" inputmode="url" placeholder="https://（操作したいサイトのURL）" aria-label="操作するサイトのURL"><button type="button" class="btn small" id="tab-open">開く</button></div></div>
             <div class="note" id="tab-note" hidden></div>`}
      </div>
      <div class="sect">
        <label class="lbl" for="prompt">Jev にやって欲しいこと <small>— 下のプリセットを押すとそのページを開いて指示が入ります</small></label>
        <textarea id="prompt" spellcheck="false"></textarea>
        <div class="presets" id="presets">${o.mode === 'bookmarklet' ? '' : PRESETS.map((p, i) => `<button type="button" class="preset" data-preset="${i + 1}">${esc(p.label)}</button>`).join('')}</div>
      </div>
      <div class="ctl">
        <button type="button" class="btn" id="btn-start">▶ スタート</button>
        <button type="button" class="btn" id="btn-stop" disabled>■ 停止</button>
        <span id="timer" aria-label="経過時間">0.0s</span>
      </div>
      <div class="stat"><span class="k">状態</span><span id="status" role="status" aria-live="polite" data-state="idle">待機中</span></div>
      <div id="instr" hidden></div>
      <div id="log" role="log" aria-live="polite"></div>
      <details class="settings" id="settings"><summary>Jev モード設定（任意）</summary>
        <div id="key-note">${o.mode === 'bookmarklet'
          ? '曖昧な一致をJevに判定させるには、あなた自身のAI Gatewayキーを入力します。キーはこのページを閉じるまでのみ保持され、このサイトのlocalStorage・cookieなどには一切保存しません。未入力ならヒューリスティックのみで動作します。'
          : '曖昧な一致をJevに判定させるには、あなた自身のAI Gatewayキーを入力します。キーはこの端末のlocalStorageにのみ保存され、コードやサーバーには含まれません。未入力ならヒューリスティックのみで動作します。'}</div>
        <div class="keyrow"><input id="jev-key" type="password" autocomplete="off" placeholder="AI Gateway キー" aria-label="AI Gateway キー"><button type="button" class="btn small" id="jev-key-clear">消去</button></div>
      </details>
      <div class="foot" id="foot" hidden>操作は今開いているタブで行われます。実サイトでは購入・送信が本当に実行されるので注意。</div>
    </div>
  </div>
</aside>`;

export function mountPanel(host, opts = {}) {
  const o = { mode: 'demo', adapters: null, ...opts };
  let root = host;
  if (o.mode === 'bookmarklet') { root = host.attachShadow({ mode: 'open' }); const st = document.createElement('style'); st.textContent = o.css || ''; root.appendChild(st); }
  const wrap = document.createElement('div'); wrap.innerHTML = HTML(o); root.appendChild(wrap.firstElementChild);
  const $ = (s) => root.querySelector(s);
  const panel = $('#panel');
  const el = { prompt: $('#prompt'), start: $('#btn-start'), stop: $('#btn-stop'), timer: $('#timer'), status: $('#status'), instr: $('#instr'), log: $('#log'), foot: $('#foot'), badge: $('#conn-badge') };
  const handlers = { start: [], stop: [], tab: [] };
  const api = { root, el, panel, onStart: (f) => handlers.start.push(f), onStop: (f) => handlers.stop.push(f) };

  // connection badge: fake 400 ms "接続中…"
  setTimeout(() => { el.badge.dataset.state = 'ok'; el.badge.textContent = 'サーバー接続OK'; }, 400);

  // ---- tab row ----
  const loc = globalThis.location;
  if (o.mode === 'bookmarklet') {
    $('#tab-ro').textContent = `${document.title || '(無題)'} — ${loc.href}`;
  } else {
    const sel = $('#tab-select'); const cur = (loc.pathname.split('/').pop() || 'index.html');
    sel.innerHTML = DEMO_SITES.map((s) => `<option value="${s.page}">${esc(s.title)} — ${esc(loc.origin)}/${esc(s.page)}</option>`).join('') + '<option value="__url">その他のURLを入力…</option>';
    sel.value = DEMO_SITES.some((s) => s.page === cur) ? cur : 'sites.html';
    const urlRow = $('#url-row'), note = $('#tab-note');
    const openExternal = () => {
      const v = $('#tab-url').value.trim(); let u;
      try { u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); } catch { u = null; }
      if (!u) { note.hidden = false; note.textContent = 'URLの形式が正しくありません。'; return; }
      if (u.origin === loc.origin) { loc.href = u.href; return; }
      note.hidden = false;
      note.innerHTML = `この画面（PWA）からは他サイト（${esc(u.hostname)}）を直接操作できません（ブラウザの制限）。外部サイトで使うには、ブックマークレットを追加して、そのサイト上でパネルを開いてください。`;
      const b = document.createElement('a'); b.className = 'btn'; b.href = 'bookmarklet.html'; b.textContent = 'ブックマークレットの追加ページを開く'; b.style.display = 'flex'; b.style.textDecoration = 'none';
      note.appendChild(b);
      window.open(u.href, '_blank', 'noopener');
    };
    const box = $('#tab-box');
    const showUrl = (on) => { urlRow.hidden = !on; sel.hidden = on; box.dataset.mode = on ? 'url' : 'select'; };
    sel.addEventListener('change', () => { if (sel.value === '__url') { showUrl(true); $('#tab-url').focus(); } else { showUrl(false); note.hidden = true; if (sel.value !== cur) loc.href = sel.value; } });
    $('#tab-url').addEventListener('keydown', (e) => { if (e.key === 'Escape') { showUrl(false); sel.value = DEMO_SITES.some((s) => s.page === cur) ? cur : 'sites.html'; } });
    $('#tab-open').addEventListener('click', openExternal);
    $('#tab-url').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); openExternal(); } });
    // presets open the demo page and fill the prompt
    root.querySelectorAll('.preset').forEach((b) => b.addEventListener('click', () => {
      const p = PRESETS[Number(b.dataset.preset) - 1]; const here = cur === p.page;
      for (const f of handlers.tab) f(p, here);
      if (!here) loc.href = `${p.page}#preset=${p.id}`;
    }));
  }

  // ---- key setting: localStorage in the standalone PWA only; memory only in bookmarklet mode ----
  const persist = o.mode !== 'bookmarklet';
  const keyEl = $('#jev-key');
  keyEl.value = persist ? (store((s) => s.getItem(KEY_STORAGE)) || '') : memKey;
  if (o.mode === 'bookmarklet') keyEl.placeholder = 'AI Gateway キー（このページを閉じるまでのみ保持）';
  keyEl.addEventListener('input', () => { memKey = keyEl.value; if (persist) store((s) => (keyEl.value ? s.setItem(KEY_STORAGE, keyEl.value) : s.removeItem(KEY_STORAGE))); });
  $('#jev-key-clear').addEventListener('click', () => { keyEl.value = ''; memKey = ''; if (persist) store((s) => s.removeItem(KEY_STORAGE)); });
  api.getKey = () => keyEl.value.trim() || null;

  // ---- buttons ----
  el.start.addEventListener('click', () => { if (!el.start.disabled) handlers.start.forEach((f) => f()); });
  el.stop.addEventListener('click', () => { if (!el.stop.disabled) handlers.stop.forEach((f) => f()); });
  api.onPreset = (f) => handlers.tab.push(f);
  $('#btn-x').addEventListener('click', () => { if (o.onClose) o.onClose(); });
  $('#sheet-close').addEventListener('click', () => { if (o.mode === 'bookmarklet' && panel.dataset.snap === 'collapsed') { o.onClose?.(); } else setSnap('collapsed'); });

  // ---- log ----
  const valHtml = (label) => esc(label).replace(/&quot;(.*?)&quot;/g, '<span class="val">「$1」</span>');
  api.log = (ms, verb, label) => {
    const r = document.createElement('div'); r.className = 'row';
    r.innerHTML = `<span class="ms">${ms}ms</span><span class="verb ${verb}">${verb}</span><span class="label">${valHtml(label)}</span>`;
    el.log.appendChild(r);
    const sc = $('.scroll'); if (panel.dataset.snap !== 'collapsed') sc.scrollTop = sc.scrollHeight;
  };
  api.clearLog = () => { el.log.innerHTML = ''; };
  api.setTimer = (ms) => { el.timer.textContent = fmtTimer(ms); };
  api.setInstr = (t) => { el.instr.hidden = !t; el.instr.textContent = t || ''; };
  api.getPrompt = () => el.prompt.value;
  api.setPrompt = (v) => { el.prompt.value = v; };
  const TEXT = { idle: '待機中', running: '操作中…', done: '✅ 完了', stopped: '⏹ 停止しました', error: '⚠ エラー' };
  api.setState = (s) => {
    el.status.dataset.state = s; if (s !== 'error') el.status.textContent = TEXT[s];
    const running = s === 'running';
    el.start.disabled = running; el.stop.disabled = !running; el.foot.hidden = !running;
    if (running && panel.dataset.layout === 'sheet') setSnap('collapsed');
  };
  api.setError = (msg) => { el.status.dataset.state = 'error'; el.status.textContent = `⚠ ${msg}`; };
  api.setStatusText = (t) => { el.status.textContent = t; };

  // ---- layout: side column on desktop, bottom sheet on phones / bookmarklet ----
  function setSnap(s) { panel.dataset.snap = s; panel.style.height = ''; syncPad(); }
  const collapsedH = () => 168;
  function syncPad() {
    if (o.mode !== 'demo') return;
    document.body.style.paddingBottom = panel.dataset.layout === 'sheet' ? `calc(${collapsedH()}px + env(safe-area-inset-bottom, 0px))` : '';
  }
  function setLayout(l) { panel.dataset.layout = l; panel.dataset.snap = 'collapsed'; panel.style.height = ''; syncPad(); }
  if (o.mode === 'bookmarklet') setLayout('sheet');
  else { const mq = matchMedia('(max-width: 768px), (max-height: 500px) and (orientation: landscape)'); setLayout(mq.matches ? 'sheet' : 'side'); mq.addEventListener?.('change', () => setLayout(mq.matches ? 'sheet' : 'side')); }
  api.setSnap = setSnap;

  const handle = $('#sheet-handle');
  let drag = null;
  handle.addEventListener('pointerdown', (e) => { drag = { y0: e.clientY, h0: panel.getBoundingClientRect().height, moved: false }; handle.setPointerCapture?.(e.pointerId); panel.dataset.dragging = '1'; });
  handle.addEventListener('pointermove', (e) => {
    if (!drag) return; const dy = drag.y0 - e.clientY; if (Math.abs(dy) > 6) drag.moved = true;
    if (drag.moved) panel.style.height = `${Math.max(collapsedH(), Math.min(innerHeight * 0.92, drag.h0 + dy))}px`;
  });
  const end = () => {
    if (!drag) return; delete panel.dataset.dragging;
    const h = panel.getBoundingClientRect().height; const was = drag; drag = null;
    if (!was.moved) { setSnap(panel.dataset.snap === 'collapsed' ? 'half' : 'collapsed'); return; }
    const opts2 = [['collapsed', collapsedH()], ['half', innerHeight * 0.55], ['full', innerHeight * 0.88]];
    setSnap(opts2.sort((a, b) => Math.abs(a[1] - h) - Math.abs(b[1] - h))[0][0]);
  };
  handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
  handle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSnap(panel.dataset.snap === 'collapsed' ? 'half' : 'collapsed'); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.dataset.snap !== 'collapsed' && panel.dataset.layout === 'sheet' && root.activeElement) setSnap('collapsed'); });

  api.destroy = () => { document.body.style.paddingBottom = ''; (o.mode === 'bookmarklet' ? host : panel).remove(); };
  api.setState('idle');
  return api;
}
