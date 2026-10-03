// start.html: one sentence -> proxy (auto-start), plus the optional Jevボタン guide (#login).
import { resolveSentence, SITES, BLOCKED_NOTE, detectDevice } from './config.js';
import { bookmarkletCode } from './bm.js';
import { registerSW } from './sw-register.js';

const $ = (s) => document.querySelector(s);
const loc = globalThis.location;
const ask = $('#ask'), msg = $('#go-msg');

// ---- first screen ----
const GROUPS = ['住まい', '買い物', '仕事'];
$('#sites').innerHTML = GROUPS.map((g) => `<h3>${g}</h3><div class="grid">${SITES.filter((x) => x.group === g).map((x) => x.blocked
  ? `<a class="site blocked" href="${x.url}" target="_blank" rel="noopener" data-id="${x.id}"><b>${x.name}</b><small>自動操作は使えません</small></a>`
  : `<button type="button" class="site" data-id="${x.id}"><b>${x.name}</b></button>`).join('')}</div>`).join('');
const say = (t, link) => { msg.textContent = t; if (link) { const a = document.createElement('a'); a.href = link; a.target = '_blank'; a.rel = 'noopener'; a.className = 'btn secondary open-real'; a.textContent = 'サイトを開く'; msg.append(a); } msg.hidden = !t; };
$('#sites').addEventListener('click', (e) => {
  const b = e.target.closest('.site'); if (!b) return;
  if (b.classList.contains('blocked')) return say(BLOCKED_NOTE); // the link itself opens the real site in a new tab (no proxy, no auto-start)
  ask.value = SITES.find((x) => x.id === b.dataset.id).sample; say(''); ask.focus(); scrollTo({ top: 0, behavior: 'smooth' });
});
$('#go-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const r = resolveSentence(ask.value);
  if (r.kind === 'empty') return say('やりたいことを書いてください。下のサイトをタップしてもOKです。');
  if (r.kind === 'unknown') return say('どのサイトか分かりませんでした。サイト名（例: SUUMO）を入れてください。');
  if (r.kind === 'blocked') return say(BLOCKED_NOTE, r.href);
  say('サイトを開いています…'); loc.href = r.href;
});

// ---- login guide (hidden unless #login) ----
let device = detectDevice(navigator.userAgent, navigator.maxTouchPoints);
const tabs = [...document.querySelectorAll('.tab')];
function pick(d) {
  device = d;
  for (const t of tabs) { const on = t.dataset.device === d; t.setAttribute('aria-selected', String(on)); $(`#panel-${t.dataset.device}`).hidden = !on; }
  $('#device-note').textContent = { ios: 'iPhone / iPad だと思います。違うときは、上で選んでください。', android: 'Android だと思います。違うときは、上で選んでください。', pc: 'パソコンだと思います。違うときは、上で選んでください。' }[d];
}
tabs.forEach((t) => t.addEventListener('click', () => pick(t.dataset.device)));
pick(device);
function route() {
  const login = loc.hash === '#login';
  $('#login').hidden = !login; $('#first').hidden = login;
  if (login) scrollTo(0, 0);
}
addEventListener('hashchange', route); route();
$('#back').addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', loc.pathname); route(); });

document.querySelectorAll('.copybox').forEach((box) => {
  const btn = box.querySelector('.js-copy'), ok = box.querySelector('.copied'), fb = box.querySelector('.fallback'), ta = fb.querySelector('textarea');
  btn.addEventListener('click', async () => {
    let code = '';
    try { code = await bookmarkletCode(loc.href); } catch { ok.textContent = '読みこめませんでした。電波を確認して、もう一度押してください。'; return; }
    try { await navigator.clipboard.writeText(code); fb.hidden = true; ok.textContent = '✅ コピーしました'; btn.dataset.done = '1'; btn.textContent = 'もう一度コピー'; }
    catch { ta.value = code; fb.hidden = false; ta.focus(); ta.select(); ok.textContent = ''; }
  });
});
registerSW();
