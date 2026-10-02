// スーモジャ demo site: render, filters, favorites, modals. (fictional)
import { LISTINGS } from './data.js';
import { filterListings } from './filter.js';
import { svgPhoto } from './art.js';

const $ = (s, r = document) => r.querySelector(s);
const state = { filters: {}, favs: new Set(), current: null };
const ids = ['area', 'type', 'layout', 'rent'];

function card(l) {
  const price = l.mode === 'buy' ? `<span>販売価格</span>` : `<span>賃料</span>`;
  const chips = l.tags.slice(0, 2).map((t) => `<span class="chip">${t}</span>`).join('');
  return `<article class="card" data-id="${l.id}">
    <div class="photo"><img alt="${l.name}の写真" src="${svgPhoto(l.art, l.id.length)}"><span class="tag">${l.mode === 'buy' ? '購入' : '賃貸'}</span><span class="cnt">写真 ${l.photos}枚</span></div>
    <div class="body"><div class="chips">${chips}</div>
      <button type="button" class="heart ${state.favs.has(l.id) ? 'on' : ''}" aria-label="${l.name}をお気に入りに追加" aria-pressed="${state.favs.has(l.id)}">${state.favs.has(l.id) ? '♥' : '♡'}</button>
      <h3>${l.name}</h3>
      <div class="meta"><span>📍 ${l.pref}${l.city}</span><span>🚉 ${l.station} 徒歩${l.walk}分</span></div>
      <div class="specs"><div>${price}<b class="pr">${l.priceLabel}</b><small>${l.mgmtLabel}</small></div><div><span>間取り / 専有面積</span><b>${l.layout}</b><small>${l.size}㎡</small></div><div><span>築年 / 階数</span><b>${l.year}年</b><small>${l.floor}</small></div></div>
      <div class="check">✓ ${l.check}</div>
      <button type="button" class="btn-detail">物件の詳細を見る</button></div></article>`;
}
function sortList(list, sort) {
  const l = [...list];
  if (sort === '賃料の安い順') l.sort((a, b) => a.price - b.price);
  if (sort === '築年の新しい順') l.sort((a, b) => b.year - a.year);
  return l;
}
export function render() {
  const f = { ...state.filters };
  const list = sortList(filterListings(LISTINGS, f), state.sort);
  $('#results').innerHTML = list.map(card).join('');
  $('#result-count').innerHTML = `<b>${list.length}</b>`;
  $('#empty').hidden = list.length > 0;
  $('#fav-count').textContent = state.favs.size;
}
function readFilters() {
  state.filters = { area: $('#f-area').value, type: $('#f-type').value, layout: $('#f-layout').value, rent: $('#f-rent').value, kw: $('#kw').value };
}
function toggleFav(id) { state.favs.has(id) ? state.favs.delete(id) : state.favs.add(id); render(); if (state.current) syncDetailFav(); }
function syncDetailFav() {
  const on = state.favs.has(state.current.id); const b = $('#detail-fav');
  b.classList.toggle('on', on); b.textContent = on ? '♥ お気に入り済み' : '♡ お気に入り'; b.setAttribute('aria-pressed', on);
}

// ---- modals (focus trap, ESC, backdrop) ----
const stack = [];
function open(m, opener) {
  m.hidden = false; stack.push({ m, opener });
  const f = m.querySelector('[data-close]'); (m.querySelector('input,textarea') && m.id === 'inquiry-modal' ? f : f)?.focus({ preventScroll: true });
}
function close(m) {
  m.hidden = true; const i = stack.findIndex((s) => s.m === m); if (i >= 0) { const [s] = stack.splice(i, 1); s.opener?.focus?.({ preventScroll: true }); }
  if (m.id === 'detail-modal') state.current = null;
}
function openDetail(id, opener) {
  const l = LISTINGS.find((x) => x.id === id); state.current = l;
  $('#d-photo').src = svgPhoto(l.art, l.id.length); $('#d-photo').alt = l.name;
  $('#d-th1').src = svgPhoto('steam', 2); $('#d-th2').src = svgPhoto('tools', 3);
  $('#d-title').textContent = l.name; $('#d-loc').textContent = `📍 ${l.pref}${l.city} / ${l.station} 徒歩${l.walk}分`;
  $('#d-price').textContent = l.priceLabel; $('#d-mgmt').textContent = l.mgmtLabel;
  $('#d-spec').innerHTML = `<div>間取り<b>${l.layout}</b></div><div>面積<b>${l.size}㎡</b></div><div>築年<b>${l.year}年</b></div><div>特徴<b>${l.check}</b></div>`;
  syncDetailFav(); open($('#detail-modal'), opener);
}
export function reset() {
  for (const m of [...stack]) close(m.m);
  for (const id of ids) $(`#f-${id}`).selectedIndex = 0;
  $('#kw').value = ''; $('#f-sort').selectedIndex = 0; state.sort = 'おすすめ順'; state.favs.clear();
  $('#inq-name').value = '山田 たろう'; $('#inq-email').value = ''; $('#inq-body').value = '空室状況と内見可能な日時を教えてください。';
  readFilters(); render(); $('.site-col').scrollTop = 0;
}

export function initSite() {
  state.sort = 'おすすめ順';
  for (const id of ids) $(`#f-${id}`).addEventListener('change', () => { readFilters(); render(); });
  $('#kw').addEventListener('input', () => { readFilters(); render(); });
  $('#kw').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#btn-search').click(); } });
  $('#f-sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  $('#btn-search').addEventListener('click', () => { readFilters(); render(); $('#results').scrollIntoView({ block: 'nearest' }); });
  $('#btn-reset').addEventListener('click', reset);
  $('#v-map').addEventListener('click', () => { $('#v-map').classList.add('on'); $('#v-list').classList.remove('on'); });
  $('#v-list').addEventListener('click', () => { $('#v-list').classList.add('on'); $('#v-map').classList.remove('on'); });
  $('#results').addEventListener('click', (e) => {
    const c = e.target.closest('.card'); if (!c) return;
    if (e.target.closest('.heart')) return toggleFav(c.dataset.id);
    if (e.target.closest('.btn-detail')) openDetail(c.dataset.id, e.target.closest('.btn-detail'));
  });
  $('#detail-fav').addEventListener('click', () => state.current && toggleFav(state.current.id));
  $('#btn-inquire').addEventListener('click', (e) => { $('#i-sub').textContent = state.current?.name || ''; open($('#inquiry-modal'), e.currentTarget); });
  $('#btn-submit-demo').addEventListener('click', (e) => { e.preventDefault(); }); // inert by design: nothing is ever sent
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => close(b.closest('.backdrop'))));
  document.querySelectorAll('.backdrop').forEach((bd) => bd.addEventListener('mousedown', (e) => { if (e.target === bd) close(bd); }));
  document.querySelectorAll('[data-jev-nav]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
  addEventListener('keydown', (e) => {
    const top = stack.at(-1); if (!top) return;
    if (e.key === 'Escape') close(top.m);
    if (e.key === 'Tab') { const f = [...top.m.querySelectorAll('button,input,textarea,select,a[href]')].filter((x) => !x.disabled && x.offsetParent); if (!f.length) return;
      const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  });
  readFilters(); render();
  return { reset, render };
}
