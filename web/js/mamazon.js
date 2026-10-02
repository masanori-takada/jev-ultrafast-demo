// Mamazon: fictional shop with search, price/rating/brand facets and a sort dropdown. Buying is impossible (decoy buttons only).
import { svgPhoto } from './art.js';
import { startApp } from './app.js';
import { genericAdapter } from './adapters/index.js';
import { PRESET_PROMPTS } from './app.js';
import { registerSW } from './sw-register.js';

const BR = ['ナナミ', 'ホシゾラ', 'カゼノ'];
const KINDS = ['facade', 'sky', 'tools', 'park'];
const P = Array.from({ length: 16 }, (_, i) => ({
  id: i, name: `${BR[i % 3]} ノートパソコン ${['Air', 'Pro', 'Lite', 'Max'][i % 4]} ${13 + (i % 3)}インチ`, brand: BR[i % 3],
  price: [39800, 59800, 79800, 98000, 119000, 138000, 149800, 169000, 189000, 45800, 88800, 99800, 129800, 159800, 199800, 69800][i],
  rating: [3.2, 4.1, 4.5, 3.8, 4.3, 4.7, 3.5, 4.0, 4.6, 3.0, 4.2, 4.4, 3.9, 4.8, 4.1, 3.6][i], isNew: i % 5 === 0, art: KINDS[i % 4],
}));
const $ = (s) => document.querySelector(s);
const st = { price: new Set(), minRating: 0, brands: new Set(), q: '', sort: 'rec' };
$('#f-brand').innerHTML = BR.map((b) => `<label><input type="checkbox" name="brand" value="${b}"> ${b}</label>`).join('');

function render() {
  let l = P.filter((p) => (!st.price.size || p.price <= Math.max(...st.price)) && p.rating >= st.minRating && (!st.brands.size || st.brands.has(p.brand)) && (!st.q || p.name.includes(st.q)));
  if (st.price.size) { const lim = Math.min(...st.price); l = l.filter((p) => p.price <= lim); }
  if (st.sort === 'asc') l.sort((a, b) => a.price - b.price); if (st.sort === 'desc') l.sort((a, b) => b.price - a.price);
  if (st.sort === 'rev') l.sort((a, b) => b.rating - a.rating); if (st.sort === 'new') l.sort((a, b) => b.isNew - a.isNew);
  $('#products').innerHTML = l.map((p) => `<article class="prod" data-id="${p.id}"><img alt="" src="${svgPhoto(p.art, p.id)}"><h4>${p.name}</h4>
    <div class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))} ${p.rating}</div><div class="price">¥${p.price.toLocaleString('en-US')}</div>
    <div class="row"><button type="button" class="cart">カートに入れる</button><button type="button" class="buy">今すぐ買う</button></div></article>`).join('');
  $('#count').textContent = `${l.length}件`; $('#empty').hidden = l.length > 0;
}
document.addEventListener('change', (e) => {
  if (e.target.name === 'price') { e.target.checked ? st.price.add(+e.target.value) : st.price.delete(+e.target.value); }
  if (e.target.name === 'brand') { e.target.checked ? st.brands.add(e.target.value) : st.brands.delete(e.target.value); }
  if (e.target.id === 'sort') st.sort = e.target.value;
  render();
});
$('#f-rating').addEventListener('click', (e) => {
  const a = e.target.closest('a'); if (!a) return; e.preventDefault();
  const on = a.getAttribute('aria-current') === 'true'; $('#f-rating').querySelectorAll('a').forEach((x) => x.removeAttribute('aria-current'));
  st.minRating = on ? 0 : +a.dataset.min; if (!on) a.setAttribute('aria-current', 'true'); render();
});
const go = () => { st.q = $('#q').value.trim(); render(); };
$('#shop-go').addEventListener('click', go); $('#q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
render();
const app = startApp({ host: document.getElementById('panel-host'), mode: 'demo', adapter: genericAdapter });
if (!/preset=/.test(location.hash)) app.panel.setPrompt(PRESET_PROMPTS.mamazon);
registerSW();
