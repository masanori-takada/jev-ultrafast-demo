(function () {
'use strict';
const PANEL_CSS = "#panel, #panel *, #panel *::before, #panel *::after { box-sizing: border-box; } #panel { --p-bg: #0e111c; --p-card: #171b2b; --p-border: rgba(255,255,255,.1); --p-text: #e8eaf2; --p-muted: #8a90a6; --p-blue: #5b6cff; --p-link: #6f8bff; --p-ok: #4ad295; --p-instr: #13172a; --p-amber: #f0b64a; --p-err: #ff6b6b; --p-strip: #eef0f2; --v-select: #7d7dff; --v-click: #6f8bff; --v-type: #6f8bff; font: 12px/1.45 \"Hiragino Sans\",\"Noto Sans JP\",system-ui,-apple-system,\"Segoe UI\",sans-serif; color: var(--p-text); background: var(--p-strip); display: flex; flex-direction: column; min-height: 0; text-align: left; letter-spacing: 0; } #panel .chrome { display: flex; align-items: center; gap: 8px; padding: 8px 10px 8px 14px; color: #222; font-weight: 700; font-size: 13px; flex: none; } #panel .chrome .jicon { width: 18px; height: 18px; border-radius: 4px; background: #3a3d44; color: #fff; font-size: 10px; display: grid; place-items: center; font-weight: 800; } #panel .chrome .sp { flex: 1; } #panel .chrome button { all: unset; cursor: pointer; width: 28px; height: 28px; display: grid; place-items: center; color: #333; border-radius: 6px; font-size: 14px; } #panel .chrome button:focus-visible { outline: 2px solid var(--p-blue); } #panel .card { background: var(--p-bg); border-radius: 10px; margin: 0 6px 6px; flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; } #panel .scroll { overflow-y: auto; flex: 1; min-height: 0; display: flex; flex-direction: column; overscroll-behavior: contain; } #panel .handle { display: none; } #panel header.hd { display: flex; align-items: center; justify-content: space-between; padding: 12px 12px 10px; border-bottom: 1px solid rgba(255,255,255,.06); flex: none; } #panel header.hd h2 { margin: 0; font-size: 14px; font-weight: 700; color: #fff; display: flex; gap: 6px; align-items: center; } #panel header.hd h2 i { color: var(--p-blue); font-style: normal; font-size: 12px; } #panel #conn-badge { font-size: 10px; color: var(--p-ok); background: rgba(74,210,149,.12); border: 1px solid rgba(74,210,149,.3); border-radius: 10px; padding: 2px 8px; white-space: nowrap; } #panel #conn-badge[data-state=connecting] { color: var(--p-muted); background: rgba(255,255,255,.05); border-color: var(--p-border); } #panel .sect { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.06); } #panel .lbl { display: block; font-size: 10px; color: var(--p-muted); margin-bottom: 6px; } #panel .lbl small { font-size: 10px; opacity: .8; } #panel .tabbox { position: relative; } #panel .tabbox select { appearance: none; -webkit-appearance: none; width: 100%; background: var(--p-card); color: var(--p-text); border: 1px solid var(--p-border); border-radius: 8px; padding: 9px 26px 9px 10px; font: inherit; font-size: 11.5px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; min-height: 44px; } #panel .tabbox::after { content: '▾'; position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--p-muted); pointer-events: none; font-size: 11px; } #panel .tabbox.ro::after { content: none; } #panel .tabbox .ro-text { display: block; background: var(--p-card); border: 1px solid var(--p-border); border-radius: 8px; padding: 9px 10px; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 44px; line-height: 24px; } #panel .urlrow { display: flex; gap: 6px; } #panel .tabbox select[hidden] { display: none; } #panel .tabbox:has(.urlrow:not([hidden]))::after { content: none; } #panel .urlrow input { flex: 1; min-width: 0; background: var(--p-card); color: var(--p-text); border: 1px solid var(--p-border); border-radius: 8px; padding: 0 10px; font: inherit; font-size: 11.5px; min-height: 44px; } #panel .tabbox:has(.urlrow:not([hidden])):focus-within { border-radius: 8px; } #panel .urlrow input:focus, #panel #prompt:focus, #panel .keyrow input:focus { outline: none; border-color: var(--p-blue); box-shadow: 0 0 0 3px rgba(79,109,245,.25); } #panel .btn { all: unset; box-sizing: border-box; cursor: pointer; border-radius: 8px; min-height: 44px; min-width: 44px; padding: 0 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-weight: 700; font-size: 12px; text-align: center; } #panel .btn:focus-visible, #panel .preset:focus-visible { outline: 2px solid #fff; outline-offset: 2px; } #panel .btn.small { background: var(--p-card); border: 1px solid var(--p-border); color: var(--p-text); font-weight: 600; } #panel .urlrow[hidden] { display: none; } #panel #prompt { width: 100%; min-height: 168px; resize: vertical; background: #12151f; color: var(--p-text); border: 1px solid var(--p-border); border-radius: 10px; padding: 10px 12px; font: inherit; font-size: 13px; line-height: 1.6; } #panel .presets { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; margin-top: 10px; } #panel .preset { all: unset; box-sizing: border-box; cursor: pointer; max-width: 100%; min-height: 44px; display: inline-flex; align-items: center; padding: 0 12px; border: 1px solid var(--p-border); border-radius: 999px; background: rgba(23,27,43,.6); color: var(--p-muted); font-size: 11px; } #panel .preset:hover { color: var(--p-text); border-color: rgba(255,255,255,.22); } #panel .ctl { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.06); flex: none; } #panel #btn-start { background: var(--p-blue); color: #fff; min-width: 90px; } #panel #btn-start:disabled, #panel #btn-start[aria-disabled=true] { background: #3a4580; opacity: .6; cursor: default; } #panel #btn-stop { color: var(--p-muted); border: 1px solid transparent; background: transparent; min-width: 70px; } #panel #btn-stop:not(:disabled) { color: #fff; background: #222639; border-color: rgba(255,255,255,.12); } #panel #btn-stop:disabled { cursor: default; opacity: .75; } #panel #timer { margin-left: auto; font-weight: 700; font-size: 16px; color: #fff; font-variant-numeric: tabular-nums; } #panel .stat { padding: 10px 12px 6px; display: flex; gap: 10px; align-items: center; font-size: 11px; flex: none; } #panel .stat .k { color: var(--p-muted); } #panel #status { font-weight: 700; } #panel #status[data-state=running] { color: var(--p-link); } #panel #status[data-state=done] { color: var(--p-ok); } #panel #status[data-state=stopped] { color: var(--p-amber); } #panel #status[data-state=error] { color: var(--p-err); } #panel #instr { margin: 4px 12px 8px; padding: 10px; background: var(--p-instr); border: 1px solid rgba(255,255,255,.06); border-radius: 8px; color: var(--p-muted); font-size: 11px; line-height: 1.55; flex: none; word-break: break-word; } #panel #instr[hidden] { display: none; } #panel #log { padding: 2px 12px 10px; font-size: 11.5px; } #panel #log .row { display: grid; grid-template-columns: 56px 76px 1fr; gap: 0 6px; padding: 5px 0; border-bottom: 1px dotted rgba(255,255,255,.12); animation: jev-in .15s ease-out; align-items: baseline; } #panel #log .ms { color: var(--p-muted); text-align: left; font-variant-numeric: tabular-nums; } #panel #log .verb { font-weight: 700; color: var(--v-click); } #panel #log .verb.SELECT { color: var(--v-select); } #panel #log .verb.TYPE_TEXT { color: var(--v-type); } #panel #log .verb.NOTE { color: var(--p-muted); } #panel #log .verb.SKIP { color: var(--p-amber); } #panel #log .label { color: var(--p-text); word-break: break-word; } #panel #log .label .val { color: var(--p-ok); } #panel .foot { padding: 8px 12px; font-size: 10px; color: var(--p-muted); border-top: 1px solid rgba(255,255,255,.06); flex: none; } #panel .foot[hidden] { display: none; } #panel details.settings { padding: 8px 12px; border-top: 1px solid rgba(255,255,255,.06); font-size: 11px; color: var(--p-muted); flex: none; } #panel details.settings summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; } #panel .keyrow { display: flex; gap: 6px; margin-top: 4px; } #panel .keyrow input { flex: 1; min-width: 0; min-height: 44px; background: var(--p-card); color: var(--p-text); border: 1px solid var(--p-border); border-radius: 8px; padding: 0 10px; font: inherit; font-size: 13px; } .jev-target { outline: 2px solid #2f6bff !important; outline-offset: 2px; box-shadow: 0 0 0 5px rgba(47,107,255,.25) !important; transition: box-shadow .2s; } @keyframes jev-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { #panel #log .row { animation: none; } } #panel[data-layout=sheet] { --collapsed: 168px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 2147483600; max-width: 560px; margin: 0 auto; height: calc(var(--collapsed) + env(safe-area-inset-bottom, 0px)); border-radius: 16px 16px 0 0; box-shadow: 0 -6px 24px rgba(0,0,0,.35); transition: height .22s ease; padding-bottom: env(safe-area-inset-bottom, 0px); background: var(--p-bg); } #panel[data-layout=sheet][data-snap=half] { height: 55dvh; } #panel[data-layout=sheet][data-snap=full] { height: 88dvh; } #panel[data-layout=sheet][data-dragging] { transition: none; } #panel[data-layout=sheet] .chrome { display: none; } #panel[data-layout=sheet] .card { margin: 0; border-radius: 16px 16px 0 0; } #panel[data-layout=sheet] .handle { display: flex; align-items: center; justify-content: center; height: 24px; flex: none; touch-action: none; cursor: grab; position: relative; } #panel[data-layout=sheet] .handle::before { content: ''; position: absolute; left: 0; right: 0; top: -10px; height: 44px; } #panel[data-layout=sheet] .handle span { width: 40px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.3); } #panel[data-layout=sheet] header.hd { padding: 0 12px 6px; border: 0; } #panel[data-layout=sheet] .ctl { padding: 6px 12px; border: 0; } #panel[data-layout=sheet] .stat { padding: 2px 12px 8px; } #panel[data-layout=sheet][data-snap=collapsed] .scroll > :not(.ctl):not(.stat) { display: none; } #panel[data-layout=sheet] #prompt { font-size: 16px; } #panel[data-layout=sheet] .urlrow input, #panel[data-layout=sheet] .keyrow input { font-size: 16px; } #panel[data-layout=sheet] .tabbox select { font-size: 14px; } #panel[data-layout=sheet] #sheet-close { display: inline-grid; } #panel #sheet-close { all: unset; display: none; position: absolute; right: 8px; top: 2px; width: 44px; height: 44px; place-items: center; color: var(--p-muted); cursor: pointer; font-size: 16px; z-index: 2; } #panel[data-layout=sheet] #sheet-close { display: grid; } @media (max-height: 500px) and (orientation: landscape) { #panel[data-layout=sheet] { left: auto; right: 0; width: 40vw; max-width: none; height: 100dvh !important; border-radius: 0; } } #panel[data-layout=side] #prompt { min-height: 254px; } #panel[data-layout=side] { height: 100%; width: 100%; border-radius: 8px; } @media (pointer: fine) { #panel[data-layout=side] .preset { min-height: 30px; } #panel[data-layout=side] .presets { gap: 6px; margin-top: 8px; } #panel[data-layout=side] .btn, #panel[data-layout=side] .tabbox select, #panel[data-layout=side] .tabbox .ro-text { min-height: 36px; } #panel[data-layout=side] .tabbox .ro-text { line-height: 18px; } #panel[data-layout=side] .sect { padding: 8px 12px; } #panel[data-layout=side] .ctl { padding: 8px 12px; } #panel[data-layout=side] header.hd { padding: 10px 12px 8px; } } #panel[data-layout=sheet] header.hd { padding-right: 56px; } #panel[data-layout=sheet][data-dock] { left: auto; right: 0; top: 0; bottom: auto; width: 380px; max-width: 100vw; height: 100dvh !important; margin: 0; border-radius: 0; padding-bottom: 0; box-shadow: -6px 0 24px rgba(0,0,0,.35); } #panel[data-dock] .handle { display: none; } #panel[data-dock] .card { border-radius: 0; height: 100%; } #panel .build { flex: none; padding: 4px 12px 6px; font-size: 10px; color: var(--p-muted); text-align: right; border-top: 1px solid rgba(255,255,255,.06); } #panel .status-link { color: var(--p-blue); font-size: 11px; margin-left: 4px; }";
const __d = {}, __c = {};
function __r(k) { return __c[k] || (__c[k] = __d[k]()); }
__d["generic/text.js"] = function () {
const norm = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
const hira2kata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const VALUE_SYN = [
[/tokyo|とうきょう|トウキョウ/g, '東京'], [/kanagawa|かながわ/g, '神奈川'], [/saitama|さいたま/g, '埼玉'], [/chiba|ちば/g, '千葉'],
[/osaka|おおさか/g, '大阪'], [/kyoto|きょうと/g, '京都'], [/yokohama/g, '横浜'],
[/remote|work from home|wfh|在宅勤務|テレワーク|在宅/g, 'リモート'], [/engineer|developer|programmer/g, 'エンジニア'],
[/designer/g, 'デザイナー'], [/sales/g, '営業'], [/full[- ]?time|正社員/g, '正社員'], [/part[- ]?time|パート/g, 'アルバイト'],
[/new arrivals?|newest|latest/g, '新着'], [/cheapest|low(est)? price|price low|安い/g, '安い'], [/highest rated|top rated|best rated|rating|review|レビュー/g, 'レビュー'],
[/popular|人気/g, '人気'], [/recommended/g, 'おすすめ'],
];
const canon = (s) => {
let t = hira2kata(norm(s).toLowerCase());
t = t.replace(/[\s・,，、。.!！?？:：;；()（）\[\]「」『』"'“”‘’\-_/]/g, '');
for (const [re, to] of VALUE_SYN) t = t.replace(re, hira2kata(to).toLowerCase());
return t;
};
const CONCEPTS = {
price: ['価格', '値段', '賃料', '家賃', '料金', '予算', '金額', 'price', 'cost', 'rent', '円', '¥', '万円'],
rating: ['評価', 'レビュー', 'rating', 'review', '★', '星', 'stars', 'star'],
salary: ['年収', '給与', '給料', '月給', '時給', '報酬', 'salary', 'pay', 'income', '収入'],
location: ['エリア', '地域', '場所', '都道府県', '所在地', '勤務地', '市区町村', 'location', 'area', 'prefecture', 'city', 'region', '沿線', '駅'],
layout: ['間取り', '間取', 'layout', 'floorplan', 'bedrooms', 'ldk'],
brand: ['ブランド', 'メーカー', 'brand', 'maker', 'manufacturer'],
jobtype: ['職種', '雇用形態', '職業', '雇用', 'jobtype', 'job type', 'employment', 'カテゴリ', 'category'],
sort: ['並び替え', '並べ替え', 'ソート', 'sort', 'order', '表示順', '順'],
keyword: ['キーワード', '検索', 'フリーワード', 'keyword', 'search', 'query', '職種・', 'q'],
};
const CONCEPT_CANON = Object.fromEntries(Object.entries(CONCEPTS).map(([k, v]) => [k, v.map((x) => canon(x)).filter((x) => x.length >= 1)]));
function conceptsOf(label) {
const c = canon(label); const out = new Set();
if (!c) return out;
for (const [k, words] of Object.entries(CONCEPT_CANON)) if (words.some((w) => (w.length === 1 ? c === w || c.startsWith(w) || c.endsWith(w) : c.includes(w)))) out.add(k);
return out;
}
const conceptOverlap = (a, b) => [...a].some((x) => b.has(x));
/** 0..1 similarity of a term against a candidate text (both canonicalised internally). */
function textScore(term, text) {
const a = canon(term), b = canon(text);
if (!a || !b) return 0;
if (a === b) return 1;
if (b.includes(a)) return Math.max(0.72, 0.72 + 0.28 * (a.length / b.length));
if (a.includes(b) && b.length >= 2) return 0.55 * (b.length / a.length) + 0.2;
return 0;
}
const WILD = /^(すべて|全て|指定なし|選択してください|選択|上限なし|下限なし|未選択|選んでください|all|any|none|--+)$/i;
const isWildcard = (t) => WILD.test(norm(t));
/** Parse the first number in a text. 10万円 -> {value:100000, money:true}; ¥5,000 -> 5000 money; ★4以上 -> 4 plain. */
function parseNum(text) {
const s = norm(text).replace(/,/g, '');
const m = s.match(/(?:¥|￥)?\s*(\d+(?:\.\d+)?)\s*(万|千|k)?\s*(円|¥|yen)?/i);
if (!m) return null;
let v = parseFloat(m[1]); const mult = m[2];
if (mult === '万') v *= 1e4; else if (mult === '千') v *= 1e3; else if (mult && mult.toLowerCase() === 'k') v *= 1e3;
const money = !!(m[3] || mult === '万' || /[¥￥]/.test(s.slice(Math.max(0, m.index - 1), m.index + 1)) || /^[¥￥]/.test(m[0]));
return { value: v, money, text: m[0], index: m.index };
}
/** All numbers in text (for ranges like 600万〜800万). */
function parseAllNums(text) {
const out = []; let rest = norm(text).replace(/,/g, '');
const re = /(?:¥|￥)?\s*(\d+(?:\.\d+)?)\s*(万|千|k)?\s*(円|¥|yen)?/gi; let m;
while ((m = re.exec(rest))) {
let v = parseFloat(m[1]); if (m[2] === '万') v *= 1e4; else if (m[2] === '千' || (m[2] || '').toLowerCase() === 'k') v *= 1e3;
out.push({ value: v, money: !!(m[3] || m[2] === '万' || /[¥￥]/.test(m[0])) });
}
return out;
}
const opOf = (s) => {
const t = norm(s).toLowerCase();
if (/以下|まで|以内|未満|上限|max|under|up to|<=|≤|less than|below/.test(t)) return 'max';
if (/以上|から|下限|min|over|from|≥|>=|more than|above|at least/.test(t)) return 'min';
return null;
};
return {norm, canon, CONCEPTS, conceptsOf, conceptOverlap, textScore, isWildcard, parseNum, parseAllNums, opOf};
};
__d["generic/safety.js"] = function () {
const {norm} = __r("generic/text.js");
const JA = /購入|購買|注文|今すぐ買|買う|買い物を続|応募|申し込|申込|申請|送信|送付|送る|問い合わせ|問合せ|お問合|問い合せ|資料請求|請求|見積|依頼|相談|予約|エントリー|契約|支払|決済|お会計|会計|レジ|手続き|ログイン|ログアウト|サインイン|サインアップ|退会|解約|削除|会員登録|新規登録|アカウント作成|ご予約|予約を確定|参加する|寄付|チェックアウト/;
const CART_JA = /カートに入れる|カートに追加|カートへ/;
const EN = /\b(buy|bought|purchase|purchases|check ?out|apply|applying|application|submit|sign ?in|sign ?out|sign ?up|log ?in|log ?out|logout|login|register|registration|subscribe|unsubscribe|pay|pays|payment|payments|billing|delete|remove|trash|erase|destroy|send|sending|inquiry|inquire|inquiries|enquiry|enquire|enquiries|contact|book|booking|reserve|reservation|enrol+|donate|confirm|proceed|order|orders|ordering|continue to (?:pay|checkout|order)|complete (?:order|purchase))\b/i;
const EN_CART = /\badd to (?:cart|bag|basket|trolley)\b|\bto (?:cart|basket)\b/i;
const EN_APPLY_FILTER = /\bapply\s+(?:filters?|changes|selection|sort|refinements?)\b/i;
const ZW = /[\u00ad\u200b-\u200f\u2028-\u202f\u2060\ufeff]/g;
/** @returns {string|null} reason when the label is blocked. */
function blockedLabel(label, { allowCart = false, allow = [] } = {}) {
let t = norm(String(label ?? '').replace(ZW, ''));
if (!t) return null;
if (allow.some((re) => re.test(t))) return null;
const ja = t.replace(/\s+/g, '');
const en = t.replace(/\bsort(?:ed|ing)?\s+(?:by\s+)?order\b/gi, ' ').replace(/\border\s+by\b/gi, ' ').replace(EN_APPLY_FILTER, ' ');
if (JA.test(ja) || EN.test(en)) return 'denylist';
if ((CART_JA.test(ja) || EN_CART.test(en)) && !allowCart) return 'cart';
return null;
}
const BAD_WORD = '(?:checkout|check-out|cart|basket|login|log-in|signin|sign-in|signup|sign-up|register|registration|logout|log-out|signout|sign-out|order|orders|purchase|buy|payment|pay|billing|apply|application|inquiry|inquire|enquiry|contact|entry|entries|reserve|reservation|booking|delete|remove|unsubscribe|subscribe|account|confirm|send|donate|trash)';
const BAD_PATH = new RegExp(`(^|[/._-])${BAD_WORD}(?=$|[/._-])`, 'i');
const BAD_QUERY = new RegExp(`(?:^|&)(?:action|do|cmd|command|mode|method|op|step|page|view|task)=${BAD_WORD}(?:$|&)`, 'i');
function blockedHref(href) {
const h = String(href ?? '').replace(ZW, '').trim();
if (!h) return null;
if (/^\s*(?:javascript|mailto|tel|sms|data|vbscript):/i.test(h)) return /^javascript:\s*(?:void\(0\)|;)?\s*$/i.test(h) ? null : 'href';
let u; try { u = new URL(h, 'http://x.invalid/'); } catch { return 'href'; }
let path = u.pathname; try { path = decodeURIComponent(path); } catch {}
if (BAD_PATH.test(path) || BAD_QUERY.test(u.search.slice(1))) return 'href';
return null;
}
const PAY_AC = /cc-|card|credit/i;
const SUBMIT_SEL = 'button:not([type=button]):not([type=reset]),input[type=submit],input[type=image]';
const idWords = (s) => String(s || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-.:]+/g, ' ');
/** Is submitting this whole form unsafe? (password/payment fields, bad action, contact-form shape, blocked submit button). */
function blockedForm(form, policy = {}) {
if (!form) return null;
if (form.querySelector('input[type=password],input[autocomplete^=cc-],input[name*=card i]')) return 'form';
const act = form.getAttribute('action'); if (act && blockedHref(act)) return 'form';
if (form.querySelector('textarea') && form.querySelector('input[type=email],input[type=tel]') && !policy.allow?.length) return 'form';
for (const b of form.querySelectorAll(SUBMIT_SEL)) {
const t = [b.innerText, b.getAttribute('value'), b.getAttribute('aria-label'), b.getAttribute('title'), b.getAttribute('alt'), idWords(b.id), idWords(b.getAttribute('name')), b.getAttribute('formaction') && blockedHref(b.getAttribute('formaction')) ? 'submit' : ''].filter(Boolean).join(' ');
if (blockedLabel(t, policy)) return 'form';
}
return null;
}
/** DOM wrapper: checks label texts, ids/names, type, enclosing button/link/form (password / payment / contact) and href. */
function blockedElement(el, policy = {}) {
if (!el) return null;
const type = (el.getAttribute?.('type') || '').toLowerCase();
if (type === 'password') return 'password';
if (PAY_AC.test(el.getAttribute?.('autocomplete') || '')) return 'payment';
if (el.matches?.('textarea,select,input:not([type=submit]):not([type=button]):not([type=image]):not([type=reset]):not([type=checkbox]):not([type=radio])')) return null;
const targets = new Set([el]);
const anc = el.closest?.('button,a[href],[role=button],[role=link],input[type=submit],label,summary'); if (anc) targets.add(anc);
let allowed = false;
for (const x of targets) {
const xt = (x.getAttribute?.('type') || '').toLowerCase();
const isBtn = x.matches?.('button,a,[role=button],[role=link],input[type=submit],input[type=image],input[type=button]');
const text = [x.innerText, x.value && /button|submit|image|reset/.test(xt) ? x.value : '', x.getAttribute?.('aria-label'), x.getAttribute?.('title'), x.getAttribute?.('alt'),
isBtn ? idWords(x.id) : '', isBtn ? idWords(x.getAttribute?.('name')) : '', isBtn ? idWords(x.getAttribute?.('data-testid')) : '', isBtn ? idWords(x.getAttribute?.('data-action')) : '',
isBtn && x.getAttribute?.('formaction') && blockedHref(x.getAttribute('formaction')) ? 'submit' : ''].filter(Boolean).join(' ');
const r = blockedLabel(text, policy); if (r) return r;
if (text && policy.allow?.some((re) => re.test(norm(text)))) allowed = true;
}
const a = el.closest?.('a[href]'); if (a && !allowed) { const h = blockedHref(a.getAttribute('href')); if (h) return h; }
const submitLike = el.matches?.(SUBMIT_SEL) && type !== 'button';
const form = el.closest?.('form');
if (submitLike && form) {
if (form.querySelector('input[type=password],input[autocomplete^=cc-],input[name*=card i]')) return 'form';
const act = form.getAttribute('action'); if (act && !allowed && blockedHref(act)) return 'form';
if (!allowed && form.querySelector('textarea') && form.querySelector('input[type=email],input[type=tel]')) return 'form';
}
return null;
}
return {blockedLabel, blockedHref, blockedForm, blockedElement};
};
__d["engine.js"] = function () {
const {blockedElement, blockedForm} = __r("generic/safety.js");
const fmtTimer = (ms) => (Math.max(0, ms) / 1000).toFixed(1) + 's';
const skipLabel = (label) => (/送信|submit/i.test(label) ? '送信はスキップ(安全のため)' : `スキップ(安全のため): ${label}`);
const normText = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
class NotFoundError extends Error {
constructor(what) { super(`要素が見つかりません: ${what}`); this.name = 'NotFoundError'; this.what = what; }
}
class AbortedError extends Error { constructor() { super('aborted'); this.name = 'AbortedError'; } }
function sleep(ms, signal) {
return new Promise((resolve, reject) => {
if (signal?.aborted) return reject(new AbortedError());
const id = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve(); }, Math.max(0, ms));
const onAbort = () => { clearTimeout(id); reject(new AbortedError()); };
signal?.addEventListener('abort', onAbort, { once: true });
});
}
function isVisible(el) {
if (!el || !el.isConnected) return false;
const r = el.getBoundingClientRect();
if (r.width < 1 || r.height < 1) return false;
const cs = el.ownerDocument.defaultView.getComputedStyle(el);
return cs.visibility !== 'hidden' && cs.display !== 'none';
}
const CLICKABLE = 'a,button,label,summary,[role=button],[role=link],[role=tab],[role=option],input[type=button],input[type=submit],input[type=checkbox],input[type=radio],li,span,div';
/** Find the best visible element whose text matches one of `texts` (first text = highest priority).
*  exact match beats "includes"; among equals the smallest (innermost) element wins. Never throws. */
function findByText(texts, { root = document, sel = CLICKABLE, exactOnly = false, filter } = {}) {
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
function createEngine({ panel, doc = document, speed = 1, shield = false, persistKey = null, reducedMotion } = {}) {
const win = doc.defaultView;
const reduce = reducedMotion ?? !!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const glideMs = reduce ? 60 : 260;
let policy = { allowCart: false, allow: [] };
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
setPolicy(p) { policy = { allowCart: false, allow: [], ...p }; },
/** Safety denylist check (purchase/submit/login/...); see generic/safety.js */
blocked(el) { return blockedElement(el, policy); },
blockedForm(form) { return blockedForm(form, policy); },
/** Show the cursor on a control and log a SKIP row without clicking it. */
async skip(el, label) { if (el) await eng.glideTo(el); eng.logRow('SKIP', skipLabel(label)); },
async settle(ms = 220) { await sleep(ms / speed, controller?.signal); },
async click(el, label) {
if (eng.blocked(el)) { eng.logRow('SKIP', skipLabel(label)); return false; }
await eng.glideTo(el); eng.ripple(el);
eng.logRow('CLICK', label);
el.click();
return true;
},
async check(el, label, want = true) {
if (el.checked === want) return false;
const target = el.matches?.('input') && !isVisible(el) && el.labels?.[0] ? el.labels[0] : el;
if (eng.blocked(target)) { eng.logRow('SKIP', skipLabel(label)); return false; }
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
if (eng.blocked(el)) { eng.logRow('SKIP', skipLabel(label)); return false; }
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
return {fmtTimer, skipLabel, normText, NotFoundError, AbortedError, sleep, isVisible, findByText, createEngine};
};
__d["generic/jev.js"] = function () {
const JEV_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/evaluate';
const JEV_MODEL = 'typesafe-ai/jev';
const KEY_STORAGE = 'jev.gatewayKey';
/** @returns {Promise<{id:string, confidence:number, probabilities:object}|null>} null on any failure or when no key. */
async function askJev({ key, url, intent, candidates, fetchFn = globalThis.fetch, endpoint = JEV_ENDPOINT }) {
if (!key || !candidates?.length || !fetchFn) return null;
const criteria = {};
for (const c of candidates) criteria[c.id] = c.description;
const body = {
model: JEV_MODEL,
state: `page: ${url}\nintent: ${intent}\ncandidate controls:\n${candidates.map((c) => `- ${c.id}: ${c.description}`).join('\n')}`,
questions: { q: { type: 'choice', question: `次の指示に最も合うコントロールはどれか: ${intent}`, criteria } },
};
try {
const res = await fetchFn(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
if (!res.ok) return null;
const j = await res.json();
const a = j?.answers?.q;
if (!a || !(a.choice in criteria)) return null;
return { id: a.choice, confidence: a.confidence ?? null, probabilities: a.probabilities ?? null };
} catch { return null; }
}
return {JEV_ENDPOINT, JEV_MODEL, KEY_STORAGE, askJev};
};
__d["version.js"] = function () {
const BUILD_ID = 'build 2026-10-03 v2';
return {BUILD_ID};
};
__d["panel.js"] = function () {
const {fmtTimer} = __r("engine.js");
const {KEY_STORAGE} = __r("generic/jev.js");
const {BUILD_ID} = __r("version.js");
const PRESETS = [
{ id: 'mamazon', label: '🛒 Mamazon：パソコンを最安で購入', page: 'mamazon.html' },
{ id: 'suumoja', label: '🏠 SUUMOじゃ：東京1LDKを探して問い合わせ', page: 'index.html' },
{ id: 'form', label: '📝 Personal Form：架空プロフィールで送信', page: 'form.html' },
];
const DEMO_SITES = [
{ title: 'AIエージェント操作用 デモサイト一覧', page: 'sites.html' },
{ title: 'Mamazon（架空の通販サイト）', page: 'mamazon.html' },
{ title: 'スーモジャ（架空の不動産サイト）', page: 'index.html' },
{ title: 'Personal Form（架空プロフィールフォーム）', page: 'form.html' },
];
const BM_URL = 'bookmarklet.js';
/** Percent-encodes ONLY what a javascript: URL needs (%, #, CR/LF) so it stays valid in a phone bookmark URL field. */
function encodeBookmarklet(code) {
return 'javascript:' + String(code).replace(/%/g, '%25').replace(/#/g, '%23').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
let bmCache = null;
/** Fetches bookmarklet.js ONCE here in the app page (same origin: no CSP/CORS issue) and returns the FULL self-contained javascript: text. */
async function bookmarkletCode(base) {
if (bmCache) return bmCache;
const r = await fetch(new URL(BM_URL, base).href);
if (!r.ok) throw new Error(`bookmarklet.js ${r.status}`);
return (bmCache = encodeBookmarklet(await r.text()));
}
/** Constructed stylesheets are exempt from the host page's style-src CSP (an injected <style> is not); <style> stays as fallback. */
function applyCss(root, css) {
try { const sh = new CSSStyleSheet(); sh.replaceSync(css); root.adoptedStyleSheets = [sh]; return; } catch { /* old browser */ }
const st = document.createElement('style'); st.textContent = css; root.appendChild(st);
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
<div class="urlrow" id="url-row" hidden><input id="tab-url" type="url" inputmode="url" placeholder="サイトのURLを入力" aria-label="操作するサイトのURL"><button type="button" class="btn small" id="tab-open">開く</button></div></div>`}
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
<div class="build" id="build-id">${esc(BUILD_ID)}</div>
</div>
</aside>`;
function mountPanel(host, opts = {}) {
const o = { mode: 'demo', adapters: null, ...opts };
let root = host;
if (o.mode === 'bookmarklet') { root = host.attachShadow({ mode: 'open' }); applyCss(root, o.css || ''); }
const wrap = document.createElement('div'); wrap.innerHTML = HTML(o); root.appendChild(wrap.firstElementChild);
const $ = (s) => root.querySelector(s);
const panel = $('#panel');
const el = { prompt: $('#prompt'), start: $('#btn-start'), stop: $('#btn-stop'), timer: $('#timer'), status: $('#status'), instr: $('#instr'), log: $('#log'), foot: $('#foot'), badge: $('#conn-badge') };
const handlers = { start: [], stop: [], tab: [] };
const api = { root, el, panel, onStart: (f) => handlers.start.push(f), onStop: (f) => handlers.stop.push(f) };
setTimeout(() => { el.badge.dataset.state = 'ok'; el.badge.textContent = 'サーバー接続OK'; }, 400);
const loc = globalThis.location;
if (o.mode === 'bookmarklet') {
$('#tab-ro').textContent = `${document.title || '(無題)'} — ${loc.href}`;
} else {
const sel = $('#tab-select'); const cur = (loc.pathname.split('/').pop() || 'index.html');
sel.innerHTML = DEMO_SITES.map((s) => `<option value="${s.page}">${esc(s.title)} — ${esc(loc.origin)}/${esc(s.page)}</option>`).join('') + '<option value="__url">その他のURLを入力…</option>';
sel.value = DEMO_SITES.some((s) => s.page === cur) ? cur : 'sites.html';
const urlRow = $('#url-row');
const urlEl = $('#tab-url');
const parseUrl = (v) => { v = v.trim(); if (!v) return null; try { const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u : null; } catch { return null; } };
const openExternal = () => {
const u = parseUrl(urlEl.value);
if (!u) return;
if (u.origin === loc.origin) { loc.href = u.href; return; }
let w = null;
try { w = window.open(u.href, '_blank', 'noopener'); } catch { /* blocked */ }
if (!w) loc.href = u.href;
};
const box = $('#tab-box');
const showUrl = (on) => { urlRow.hidden = !on; sel.hidden = on; box.dataset.mode = on ? 'url' : 'select'; };
const resetSel = () => { sel.value = DEMO_SITES.some((s) => s.page === cur) ? cur : 'sites.html'; };
sel.addEventListener('change', () => { if (sel.value === '__url') showUrl(true); else { showUrl(false); if (sel.value !== cur) loc.href = sel.value; } });
urlEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') { showUrl(false); resetSel(); } else if (e.key === 'Enter') { e.preventDefault(); openExternal(); } });
$('#tab-open').addEventListener('click', openExternal);
api.externalBlocked = () => { if (urlRow.hidden) return false; const u = parseUrl(urlEl.value); return !!u && u.origin !== loc.origin; };
root.querySelectorAll('.preset').forEach((b) => b.addEventListener('click', () => {
const p = PRESETS[Number(b.dataset.preset) - 1]; const here = cur === p.page;
for (const f of handlers.tab) f(p, here);
if (!here) loc.href = `${p.page}#preset=${p.id}`;
}));
}
const persist = o.mode !== 'bookmarklet';
const keyEl = $('#jev-key');
keyEl.value = persist ? (store((s) => s.getItem(KEY_STORAGE)) || '') : memKey;
if (o.mode === 'bookmarklet') keyEl.placeholder = 'AI Gateway キー（このページを閉じるまでのみ保持）';
keyEl.addEventListener('input', () => { memKey = keyEl.value; if (persist) store((s) => (keyEl.value ? s.setItem(KEY_STORAGE, keyEl.value) : s.removeItem(KEY_STORAGE))); });
$('#jev-key-clear').addEventListener('click', () => { keyEl.value = ''; memKey = ''; if (persist) store((s) => s.removeItem(KEY_STORAGE)); });
api.getKey = () => keyEl.value.trim() || null;
el.start.addEventListener('click', () => {
if (el.start.disabled) return;
if (api.externalBlocked?.()) {
el.status.dataset.state = 'error';
el.status.textContent = '⚠ 外部サイトはこの画面からは操作できません。拡張機能かブックマークレットで使えます。';
const a = document.createElement('a'); a.href = 'bookmarklet.html'; a.textContent = 'くわしい手順'; a.className = 'status-link';
el.status.append(' ', a); return;
}
handlers.start.forEach((f) => f());
});
el.stop.addEventListener('click', () => { if (!el.stop.disabled) handlers.stop.forEach((f) => f()); });
api.onPreset = (f) => handlers.tab.push(f);
$('#btn-x').addEventListener('click', () => { if (o.onClose) o.onClose(); });
$('#sheet-close').addEventListener('click', () => { if (o.mode === 'bookmarklet' && (panel.dataset.snap === 'collapsed' || panel.dataset.dock)) { o.onClose?.(); } else setSnap('collapsed'); });
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
function setSnap(s) { if (panel.dataset.dock && s === 'collapsed') s = 'full'; panel.dataset.snap = s; panel.style.height = ''; syncPad(); }
const collapsedH = () => 168;
function syncPad() {
if (o.mode !== 'demo') return;
document.body.style.paddingBottom = panel.dataset.layout === 'sheet' ? `calc(${collapsedH()}px + env(safe-area-inset-bottom, 0px))` : '';
}
function setLayout(l) { panel.dataset.layout = l; panel.dataset.snap = 'collapsed'; panel.style.height = ''; syncPad(); }
const dockMq = o.dock && matchMedia('(min-width: 769px) and (min-height: 501px)');
const dockOn = () => !!(dockMq && dockMq.matches);
const applyDock = () => { if (dockOn()) { panel.dataset.dock = 'right'; panel.dataset.snap = 'full'; } else delete panel.dataset.dock; };
if (o.mode === 'bookmarklet') { setLayout('sheet'); applyDock(); dockMq?.addEventListener?.('change', () => { setLayout('sheet'); applyDock(); }); }
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
return {PRESETS, DEMO_SITES, encodeBookmarklet, bookmarkletCode, mountPanel};
};
__d["adapters/demo.js"] = function () {
const {NotFoundError} = __r("engine.js");
const DEFAULT_PROMPT = 'SUUMOじゃ、エリアを「東京都」、間取りを「1LDK」、賃料上限を「10万円」にして「この条件で検索」。最初の物件の「物件の詳細を見る」を開き、「お気に入り」を押す。続けて「空室状況を問い合わせる」を押し、お名前 山田 太郎、メールアドレス taro@example.com、お問い合わせ内容「来週末に内見を希望します。空室状況を教えてください。」を入力して「内容を送信する（デモ）」を押し、送信完了の表示が出たら終了。';
const OPTIONS = {
area: ['東京都', '神奈川県', '埼玉県', '千葉県'],
layout: ['1R', '1K', '1DK', '1LDK', '2LDK', '3LDK'],
rent: ['5万円', '7万円', '10万円', '15万円', '20万円'],
};
const DEFAULTS = { area: '東京都', layout: '1LDK', rent: '10万円', name: '山田 太郎', email: 'taro@example.com', body: '来週末に内見を希望します。空室状況を教えてください。' };
function parsePrompt(text) {
const t = String(text || '');
const pick = (re) => (t.match(re) || [])[1];
const notes = [];
const opt = (key, label, re) => {
const v = pick(re);
if (v == null) return DEFAULTS[key];
if (OPTIONS[key].includes(v)) return v;
notes.push(`${label}「${v}」は選べないため「${DEFAULTS[key]}」を使います`);
return DEFAULTS[key];
};
return {
area: opt('area', 'エリア', /エリアを「(.+?)」/),
layout: opt('layout', '間取り', /間取りを「(.+?)」/),
rent: opt('rent', '賃料上限', /賃料上限を「(.+?)」/),
name: pick(/お名前 ([^\s、,。]+ [^\s、,。]+)/) || DEFAULTS.name,
email: pick(/メールアドレス (\S+@\S+?)[,、。\s]/) || DEFAULTS.email,
body: pick(/お問い合わせ内容「(.+?)」/) || DEFAULTS.body,
notes,
};
}
function instrText(p) {
return `Jev への指示（英語化）: Set エリア to ${p.area}, 間取り to ${p.layout}, 賃料上限 to ${p.rent}, then click 'この条件で検索'. Click '物件の詳細を見る' on the first result, then click お気に入り on that property. Then click '空室状況を問い合わせる'. In the inquiry form, fill お名前 = ${p.name}, メールアドレス = ${p.email}, お問い合わせ内容 = ${p.body} Then do NOT click '内容を送信する（デモ）' (skipped for safety). When the inquiry form is filled in, DONE.`;
}
const $ = (s) => document.querySelector(s);
const need = (el, what) => { if (!el) throw new NotFoundError(what); return el; };
/** Steps with target timestamps (ms since スタート) from spec section 2. The submit button is never clicked. */
function buildScript(p) {
return [
{ t: 1111, verb: 'SELECT', label: `エリア → ${p.area}`, run: (e, s) => { e.setPolicy({ allow: [/空室状況を問い合わせる/] }); return e.select(need($('#f-area'), 'エリア'), p.area, s.label); } },
{ t: 1495, verb: 'SELECT', label: `間取り → ${p.layout}`, run: (e, s) => e.select(need($('#f-layout'), '間取り'), p.layout, s.label) },
{ t: 1787, verb: 'SELECT', label: `賃料上限 → ${p.rent}`, run: (e, s) => e.select(need($('#f-rent'), '賃料上限'), p.rent, s.label) },
{ t: 2066, verb: 'CLICK', label: 'この条件で検索', run: (e, s) => e.click(need($('#btn-search'), s.label), s.label) },
{ t: 2385, verb: 'CLICK', label: '物件の詳細を見る', run: async (e, s) => {
let b = $('#results .card .btn-detail');
if (!b) { // fallback: nothing matched (e.g. edited prompt) -> use the defaults and carry on
e.note('該当物件なし: 既定の条件(東京都 / 1LDK / 10万円)で再検索します');
for (const [id, v] of [['#f-area', DEFAULTS.area], ['#f-layout', DEFAULTS.layout], ['#f-rent', DEFAULTS.rent]]) { const el = $(id); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }
$('#btn-search')?.click(); b = $('#results .card .btn-detail');
}
return e.click(need(b, s.label), s.label);
} },
{ t: 2690, verb: 'CLICK', label: 'お気に入り', run: (e, s) => e.click(need($('#detail-fav'), s.label), s.label) },
{ t: 3000, verb: 'CLICK', label: '空室状況を問い合わせる', run: (e, s) => e.click(need($('#btn-inquire'), s.label), s.label) },
{ t: 3600, verb: 'TYPE_TEXT', label: `お名前 → "${p.name}"`, run: (e, s) => e.type(need($('#inq-name'), 'お名前'), p.name, s.label) },
{ t: 4600, verb: 'TYPE_TEXT', label: `メールアドレス → "${p.email}"`, run: (e, s) => e.type(need($('#inq-email'), 'メールアドレス'), p.email, s.label) },
{ t: 5600, verb: 'TYPE_TEXT', label: `お問い合わせ内容 → "${p.body}"`, run: (e, s) => e.type(need($('#inq-body'), 'お問い合わせ内容'), p.body, s.label) },
{ t: 6900, verb: 'SKIP', label: '送信はスキップ(安全のため)', run: (e) => e.skip($('#btn-submit-demo'), '内容を送信する（デモ）') },
{ t: 7300, verb: 'DONE', label: '(完了)', run: async () => {} },
];
}
const demoAdapter = {
id: 'demo', recipe: true,
name: 'スーモジャ デモ',
shield: true,
tabLabel: 'AIエージェント操作用 デモサイト一覧 — https://play.…',
defaultPrompt: DEFAULT_PROMPT,
match: () => false,
parse: parsePrompt,
instr: instrText,
buildSteps: buildScript,
reset(ctx) { ctx?.site?.reset?.(); },
};
return {DEFAULT_PROMPT, OPTIONS, parsePrompt, instrText, buildScript, demoAdapter};
};
__d["generic/scan.js"] = function () {
const {norm} = __r("generic/text.js");
const {isVisible} = __r("engine.js");
const txt = (el) => norm(el?.innerText ?? el?.textContent ?? '');
const inUi = (el) => !!el.closest('#jev-root,#panel,#jev-cursor,#cursor,#jev-shield,[data-jev-ignore]');
function nearbyText(el) {
let cur = el;
for (let depth = 0; depth < 3 && cur && cur.parentElement; depth++) {
let p = cur.previousElementSibling;
while (p) {
if (!p.querySelector?.('input,select,textarea,button') && !/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(p.tagName)) { const t = txt(p); if (t && t.length <= 30) return t; }
p = p.previousElementSibling;
}
const head = cur.parentElement.querySelector(':scope > label, :scope > legend, :scope > dt, :scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6, :scope > strong, :scope > span.label, :scope > .title');
if (head && head !== el && !head.contains(el)) { const t = txt(head); if (t && t.length <= 30) return t; }
cur = cur.parentElement;
}
return '';
}
function labelOf(el) {
const parts = [];
const lb = el.getAttribute('aria-labelledby');
if (lb) for (const id of lb.split(/\s+/)) { const t = txt(el.ownerDocument.getElementById(id)); if (t) parts.push(t); }
if (el.labels?.length) for (const l of el.labels) { const clone = l.cloneNode(true); clone.querySelectorAll('input,select,textarea').forEach((x) => x.remove()); const t = txt(clone); if (t) parts.push(t); }
const al = el.getAttribute('aria-label'); if (al) parts.push(norm(al));
if (!parts.length) { const lg = el.closest('fieldset')?.querySelector('legend'); if (lg) parts.push(txt(lg)); }
if (!parts.length) { const n = nearbyText(el); if (n) parts.push(n); }
const ph = el.getAttribute('placeholder'); if (ph) parts.push(norm(ph));
const ti = el.getAttribute('title'); if (ti) parts.push(norm(ti));
parts.push(`${el.getAttribute('name') || ''} ${el.id || ''}`.trim());
return parts.filter(Boolean).join(' ');
}
function groupOf(el) {
const box = el.closest('fieldset,section,[role=group],dl,.facet,.filter,.filters > div,nav,ul');
if (!box) return '';
const h = box.querySelector(':scope > legend, :scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6, :scope > dt, :scope > strong, :scope > .title, :scope > .facet-title, :scope > label, :scope > p, :scope > span') || box.previousElementSibling;
const t = h && !h.contains(el) ? txt(h) : '';
return t.length <= 30 ? t : '';
}
const isSelected = (el) => {
if (el.matches('input[type=checkbox],input[type=radio]')) return el.checked;
if (el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-current') === 'true') return true;
return /(^|[\s_-])(active|selected|is-active|is-selected|checked|on)($|[\s_-])/.test(el.className || '');
};
let seq = 0;
/** @returns {{inputs:Array, choices:Array, buttons:Array}} */
function scanControls(doc = document) {
const inputs = [], choices = [], buttons = [];
const add = (arr, o) => { arr.push({ id: `c${++seq}`, ...o }); };
for (const el of doc.querySelectorAll('select')) {
if (!isVisible(el) || inUi(el) || el.disabled) continue;
const label = labelOf(el);
[...el.options].forEach((o, i) => add(choices, { kind: 'option', el, optionEl: o, optionIndex: i, text: norm(o.text), group: label, selected: o.selected && i === el.selectedIndex, ctrl: el }));
add(inputs, { kind: 'select', el, label });
}
for (const el of doc.querySelectorAll('input,textarea')) {
if (inUi(el) || el.disabled || el.readOnly) continue;
const t = (el.getAttribute('type') || 'text').toLowerCase();
if (/^(hidden|submit|button|reset|image|file|password|color)$/.test(t)) continue;
if (t === 'checkbox' || t === 'radio') {
const label = el.labels?.[0] ? txt(el.labels[0]) : txt(el.nextSibling?.nodeType === 1 ? el.nextSibling : el.parentElement) || norm(el.getAttribute('aria-label') || el.value);
const target = isVisible(el) ? el : (el.labels?.[0] && isVisible(el.labels[0]) ? el.labels[0] : null);
if (!target) continue;
add(choices, { kind: 'check', el, clickEl: target, text: label, group: groupOf(el) || labelOf(el), selected: el.checked, radio: t === 'radio' });
continue;
}
if (!isVisible(el)) continue;
add(inputs, { kind: t === 'range' ? 'range' : (t === 'number' || t === 'tel') ? 'number' : el.tagName === 'TEXTAREA' ? 'textarea' : (t === 'search' ? 'search' : 'text'), el, label: labelOf(el), type: t,
min: el.getAttribute('min'), max: el.getAttribute('max') });
}
const PRESS = 'button,a[href],[role=button],[role=checkbox],[role=radio],[role=option],[role=tab],[role=menuitemradio],[role=menuitemcheckbox],li[tabindex],li[onclick],label.chip,.chip,.facet a';
for (const el of doc.querySelectorAll(PRESS)) {
if (!isVisible(el) || inUi(el) || el.disabled) continue;
if (el.matches('input,select')) continue;
if (el.tagName === 'LABEL' && el.control) continue;
const text = norm(el.innerText || el.getAttribute('aria-label') || el.value || '');
if (!text) continue;
const rec = { kind: 'press', el, clickEl: el, text, group: groupOf(el), selected: isSelected(el) };
if (text.length <= 28) add(choices, rec);
add(buttons, rec);
}
for (const el of doc.querySelectorAll('input[type=submit],input[type=button]')) {
if (!isVisible(el) || inUi(el)) continue;
add(buttons, { kind: 'press', el, clickEl: el, text: norm(el.value || el.getAttribute('aria-label') || ''), group: '', selected: false });
}
return { inputs, choices, buttons };
}
return {labelOf, scanControls};
};
__d["generic/match.js"] = function () {
const {canon, conceptsOf, conceptOverlap, textScore, parseNum, parseAllNums, opOf, isWildcard} = __r("generic/text.js");
const labelConcepts = (c) => conceptsOf(`${c.group || ''} ${c.label || ''}`);
const describe = (c) => (c.kind === 'option' ? `選択肢「${c.text}」(${c.group || '無題'})` : c.kind === 'check' ? `チェック「${c.text}」(${c.group || '無題'})` :
c.kind === 'press' ? `ボタン「${c.text}」` : `入力欄(${c.label || '無題'})`);
const describeControl = describe;
function labelBonus(intent, c) {
if (!intent.label) return 0;
const g = `${c.group || ''} ${c.label || ''}`;
const direct = textScore(intent.label, g) > 0 || canon(g).includes(canon(intent.label));
if (direct) return 0.2;
if (conceptOverlap(conceptsOf(intent.label), labelConcepts(c))) return 0.15;
return -0.25;
}
/** Score a choice (option / checkbox / chip) for a term or pair intent. */
function scoreTerm(intent, c) {
if (isWildcard(c.text) || c.kind === 'input') return 0;
const s = textScore(intent.text, c.text);
if (!s) return 0;
return Math.max(0, Math.min(1, s * 0.85 + 0.1 + labelBonus(intent, c)));
}
/** Score a choice for a numeric intent. */
function scoreNum(intent, c) {
if (isWildcard(c.text) || c.kind === 'input') return 0;
const nums = parseAllNums(c.text); if (!nums.length) return 0;
const first = nums[0];
if (first.money !== !!intent.money) return 0;
const cop = opOf(c.text);
let s = 0;
const lo = nums[0].value, hi = nums.length > 1 ? nums[1].value : null;
const target = intent.value;
if (hi != null) { // range option: min -> lower bound match, max -> upper bound
s = intent.op === 'max' ? (hi === target ? 0.85 : 0) : (lo === target ? 0.85 : 0);
if (!s && target >= lo && target <= hi) s = 0.5;
} else if (lo === target) s = 0.82;
else if (intent.op === 'max' && lo < target && (cop === 'max' || !cop)) s = 0.4 + 0.05 * (lo / target);
else if (intent.op === 'min' && lo > target && (cop === 'min' || !cop)) s = 0.4 + 0.05 * (target / lo);
if (!s) return 0;
if (intent.op && cop) s += intent.op === cop ? 0.08 : -0.2;
return Math.max(0, Math.min(1, s + labelBonus(intent, c) * 0.8));
}
/** For text/number/range inputs: label/placeholder concept match + min/max role. */
function scoreInput(intent, c) {
if (!/^(text|search|number|range|textarea)$/.test(c.kind)) return 0;
const lc = labelConcepts(c); const ic = intent.label ? conceptsOf(intent.label) : new Set();
const lab = `${c.label || ''}`;
if (intent.kind === 'num') {
if (!['number', 'text', 'range'].includes(c.kind)) return 0;
const role = inputRole(lab); // 'min' | 'max' | null
if (intent.op === 'max' && role === 'min') return 0;
if (intent.op === 'min' && role === 'max') return 0;
let s = 0.2;
if (intent.label && (canon(lab).includes(canon(intent.label)) || conceptOverlap(ic, lc))) s += 0.35;
else if (intent.label) return 0;
else if (!intent.money || !conceptOverlap(new Set(['price', 'salary']), lc)) return 0;
if (role && role === intent.op) s += 0.2; else if (!role) s += 0.05;
if (c.kind === 'number' || c.kind === 'range') s += 0.1;
return Math.min(1, s);
}
if (intent.kind === 'pair') {
if (c.kind === 'range') return 0;
const direct = textScore(intent.label, lab); const viaConcept = conceptOverlap(conceptsOf(intent.label), lc);
const base = direct ? 0.55 + 0.4 * direct : viaConcept ? 0.55 : 0;
const inc = canon(lab).includes(canon(intent.label)) ? 0.85 : 0;
return Math.max(base, inc);
}
return 0;
}
function inputRole(label) {
const t = String(label).normalize('NFKC').toLowerCase();
if (/最小|下限|以上|から|min|from|最低|lower/.test(t)) return 'min';
if (/最大|上限|以下|まで|max|to\b|最高|upper/.test(t)) return 'max';
return null;
}
/** Is this a free-text search box? score for keyword typing. */
function scoreKeywordInput(c) {
if (!/^(text|search)$/.test(c.kind)) return 0;
const lc = labelConcepts(c); let s = 0.3;
if (c.type === 'search') s += 0.4;
if (lc.has('keyword')) s += 0.3;
if (lc.has('salary') || lc.has('price')) return 0;
return Math.min(1, s);
}
/** Rank candidates; flag ambiguity (low score or near-tie between different controls). */
function rank(scored) {
const list = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
const best = list[0] || null;
const second = list.find((x) => x !== best && x.c.ctrl !== best?.c.ctrl && x.c.el !== best?.c.el);
const ambiguous = !!best && (best.score < 0.6 || (second && best.score - second.score < 0.08));
return { best, list, ambiguous };
}
function bestFor(intent, scan) {
const sc = [];
const cs = scan.choices || [];
if (intent.kind === 'term' || intent.kind === 'pair') for (const c of cs) sc.push({ c, score: scoreTerm(intent, c), via: 'choice' });
if (intent.kind === 'num') for (const c of cs) sc.push({ c, score: scoreNum(intent, c), via: 'choice' });
if (intent.kind === 'num' || intent.kind === 'pair') for (const c of scan.inputs || []) sc.push({ c, score: scoreInput(intent, c), via: 'input' });
if (intent.kind === 'sort') for (const c of cs) {
const t = canon(intent.text); const ct = canon(c.text.replace(/順$/, ''));
const sortish = conceptsOf(c.group).has('sort') || /順|sort/i.test(c.text) || conceptsOf(c.group).has('sort');
const s = ct && (ct.includes(t) || t.includes(ct)) && sortish ? (ct === t ? 0.95 : 0.8) : 0;
sc.push({ c, score: c.selected ? s * 0.5 : s, via: 'choice' });
}
return rank(sc);
}
return {describeControl, scoreTerm, scoreNum, scoreInput, inputRole, scoreKeywordInput, rank, bestFor, parseNum};
};
__d["generic/intent.js"] = function () {
const {norm, parseNum, opOf, conceptsOf} = __r("generic/text.js");
const FILLER = /(?:に(?:して|設定して|絞って)|を(?:探して|検索して|探す|検索)|で(?:探して|検索して)|検索(?:して)?|探(?:して)?|絞り込(?:んで|み)?|してください|ください|お願い(?:します)?|して|押す|押して|入力(?:する|して)?|チェック(?:して)?|設定|クリック|開く|開き|並び替える|並べ替える|並べる|選ぶ|選択|条件で|で$|を$|の$)/g;
const STOP = new Set(['', 'と', 'を', 'に', 'で', 'の', 'は', 'が', 'し', 'て', 'and', 'the', 'a', 'in', 'for', 'with', 'search', 'find']);
/** @returns {{pairs:Array, nums:Array, terms:Array, sort:string|null, intents:Array, allowCart:boolean}} */
const NEG = /空欄|のまま|しない|押さない|行わない|不要|never|don'?t|do not/i;
function parseIntents(prompt, { ignore = [] } = {}) {
let text = norm(prompt).split(/(?<=。)/).filter((x) => !NEG.test(x)).join('');
const ign = ignore.map((x) => norm(x).toLowerCase()).filter(Boolean);
const intents = [];
const explicit = /([^\s「」、,。=:：を]{1,12}?)\s*(?:を|は|=|:|：)\s*「([^」]+)」|([^\s「」、,。=:：]{1,12})\s*(?:=|:|：)\s*([^\s、,。]+)/g;
text = text.replace(explicit, (_, l1, v1, l2, v2) => { intents.push(makeIntent(l1 || l2, v1 || v2)); return ' '; });
text = text.replace(/「([^」]+)」/g, (_, v) => { intents.push(makeIntent(null, v)); return ' '; });
text = text.replace(/(検索|探して|絞り込|ください)/g, ' $1 ');
const raw = text.split(/[\s、,，。;；\/]+/).filter(Boolean);
const tokens = [];
for (const t of raw) { const c = t.replace(FILLER, '').trim(); if (!STOP.has(c.toLowerCase()) && c.length > 0 && !ign.includes(c.toLowerCase())) tokens.push(c); }
for (let i = 0; i < tokens.length; i++) {
const t = tokens[i];
const sortM = t.match(/^(.+?)順$/) || t.match(/^(?:sort|並び替え|並べ替え)[:：]?(.+)$/i);
if (sortM && !/\d/.test(t)) { intents.push({ kind: 'sort', text: sortM[1], raw: t }); continue; }
if (!/\d/.test(t) && tokens[i + 1] && /^[\d¥￥]/.test(norm(tokens[i + 1])) && conceptsOf(t).size) { intents.push(makeIntent(t, tokens[++i])); continue; }
if (/\d/.test(t)) {
const m = parseNum(t);
if (m && /^(円|万円|以上|以下|まで|から|以内|未満|〜|~|\+|超|\s)*$/i.test(t.slice(m.index + m.text.length))) { const label = t.slice(0, m.index).replace(/[¥￥]$/, '').trim() || null; intents.push(makeIntent(label, t.slice(m.index))); continue; }
}
intents.push({ kind: 'term', text: t, raw: t });
}
const sort = intents.find((x) => x.kind === 'sort')?.text || null;
return { intents, nums: intents.filter((x) => x.kind === 'num'), terms: intents.filter((x) => x.kind === 'term' || x.kind === 'pair'), sort,
allowCart: /カート|add to cart/i.test(prompt) };
}
const NUM_ONLY = /^(円|万円|以上|以下|まで|から|以内|未満|〜|~|\+|超|\s)*$/i;
function makeIntent(label, value) {
const v = norm(value); let n = /\d/.test(v) ? parseNum(v) : null;
if (n && label && /^[\d\-+()]+$/.test(v) && (/^0|-/.test(v) || v.length >= 7)) n = null;
if (n && !(v.slice(0, n.index).trim() === '' && NUM_ONLY.test(v.slice(n.index + n.text.length)))) n = null;
if (n) {
let op = opOf(v) || (label ? opOf(label) : null);
return { kind: 'num', label: label ? norm(label) : null, value: n.value, money: n.money, op, raw: v };
}
return label ? { kind: 'pair', label: norm(label), text: v, raw: v } : { kind: 'term', text: v, raw: v };
}
function describeIntents(p) {
return p.intents.map((i) => i.kind === 'num' ? `${i.label || '数値'} ${i.value}${i.op === 'max' ? ' 以下' : i.op === 'min' ? ' 以上' : ''}` :
i.kind === 'sort' ? `並び順: ${i.text}` : i.kind === 'pair' ? `${i.label}=${i.text}` : `「${i.text}」`).join(' / ');
}
return {parseIntents, describeIntents};
};
__d["generic/agent.js"] = function () {
const {scanControls} = __r("generic/scan.js");
const {bestFor, scoreKeywordInput, describeControl} = __r("generic/match.js");
const {parseIntents, describeIntents} = __r("generic/intent.js");
const {blockedLabel} = __r("generic/safety.js");
const {askJev} = __r("generic/jev.js");
const {norm} = __r("generic/text.js");
const APPLY_RE = /検索|絞り込|絞込|適用|結果を見る|更新|apply filters?|search|filter|update|go$/i;
const shortGroup = (g) => norm(g).replace(/[*＊]/g, '').slice(0, 14);
const lab = (c, fallback) => shortGroup(c.group || c.label) || fallback;
function englishize(parsed) {
const parts = parsed.intents.map((i) => i.kind === 'num' ? `set ${i.label || 'the numeric filter'} ${i.op === 'max' ? '(max) ' : i.op === 'min' ? '(min) ' : ''}to ${i.raw}` :
i.kind === 'sort' ? `sort by ${i.text}` : i.kind === 'pair' ? `set ${i.label} to ${i.text}` : `select or search '${i.text}'`);
return `Jev への指示（英語化）: ${parts.length ? parts.join(', then ') : 'no recognizable filters'}. Then click the search/apply button. Never click purchase / apply / submit / login / payment controls (logged as SKIP).`;
}
async function pick(eng, intent, ctx) {
const scan = scanControls(eng.doc);
let r = bestFor(intent, scan);
if (r.best && r.ambiguous && ctx.jevKey) {
const cands = r.list.slice(0, 5).map((x, i) => ({ id: `k${i}`, description: describeControl(x.c), x }));
const a = await askJev({ key: ctx.jevKey, url: eng.win.location.origin + eng.win.location.pathname, intent: intent.text || intent.label || intent.raw, candidates: cands, fetchFn: ctx.fetchFn });
const chosen = a && cands.find((c) => c.id === a.id);
if (chosen) { eng.note(`Jev判定: ${chosen.description}`); return { best: chosen.x, jev: true }; }
}
if (r.best && r.best.score >= 0.45) return { best: r.best };
return { best: null };
}
async function act(eng, intent, hit) {
const c = hit.c;
if (c.kind === 'option') {
if (c.selected) return 'already';
await eng.select(c.ctrl, c.text, `${lab(c, '選択')} → ${c.text}`); return 'did';
}
if (c.kind === 'check') { return (await eng.check(c.el, `${lab(c, '選択')} → ${c.text}`)) ? 'did' : 'already'; }
if (c.kind === 'press') { if (c.selected) return 'already'; return (await eng.click(c.clickEl, `${lab(c, '')}${c.group ? ' → ' : ''}${c.text}`)) ? 'did' : 'blocked'; }
let text = intent.kind === 'num' ? numText(intent, c) : intent.text;
if (c.kind === 'range') {
await eng.glideTo(c.el); eng.logRow('SELECT', `${lab(c, '範囲')} → ${text}`);
c.el.value = text; c.el.dispatchEvent(new Event('input', { bubbles: true })); c.el.dispatchEvent(new Event('change', { bubbles: true }));
return 'did';
}
return (await eng.type(c.el, String(text), `${lab(c, intent.label || '入力')} → "${text}"`)) ? 'did' : 'blocked';
}
function numText(intent, c) {
let v = intent.value;
if (intent.money && /万/.test(c.label || '')) v = v / 1e4;
return String(Number.isInteger(v) ? v : +v.toFixed(2));
}
/** Apply all intents. Returns {acted, unmatched[]}. */
async function applyIntents(eng, parsed, ctx = {}) {
eng.setPolicy({ allowCart: parsed.allowCart, allow: ctx.hints?.allow || [] });
let acted = 0; const keywords = [];
const order = [...parsed.intents.filter((i) => i.kind === 'num' || i.kind === 'pair'), ...parsed.intents.filter((i) => i.kind === 'term')];
for (const intent of order) {
const word = intent.text || intent.raw;
if (intent.kind === 'term' && blockedLabel(word, { allowCart: parsed.allowCart })) { await skipFor(eng, word); continue; }
const { best } = await pick(eng, intent, ctx);
if (best) { const res = await act(eng, intent, best); if (res === 'did') acted++; await eng.settle(); continue; }
if (intent.kind === 'term') keywords.push(word); else eng.note(`該当なし: ${intent.label || ''} ${intent.raw}`);
}
if (keywords.length) {
const scan = scanControls(eng.doc);
const kin = scan.inputs.map((c) => ({ c, s: scoreKeywordInput(c) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)[0];
if (kin) { const q = keywords.join(' '); if (await eng.type(kin.c.el, q, `${lab(kin.c, '検索')} → "${q}"`)) acted++; await eng.settle(); }
else eng.note(`キーワード入力欄が見つかりません: ${keywords.join(' ')}`);
}
for (const intent of parsed.intents.filter((i) => i.kind === 'sort')) {
const { best } = await pick(eng, intent, ctx);
if (best) { const res = await act(eng, intent, best); if (res === 'did') acted++; await eng.settle(); } else eng.note(`並び替えが見つかりません: ${intent.raw}`);
}
return { acted, keywords };
}
async function skipFor(eng, word) {
const scan = scanControls(eng.doc);
const el = scan.buttons.find((b) => b.text.includes(word.slice(0, 2)) || word.includes(b.text.slice(0, 2)) && b.text.length > 1)?.el;
await eng.skip(el, word);
}
/** Press the apply/search button (or Enter in the keyword box). Skips anything on the denylist. */
async function pressApply(eng, ctx = {}) {
const scan = scanControls(eng.doc);
const texts = ctx.hints?.applyTexts || [];
const cands = scan.buttons.filter((b) => (texts.some((t) => b.text.includes(t)) || APPLY_RE.test(b.text)) && !blockedLabel(b.text, {}) && !eng.blocked(b.el));
cands.sort((a, b) => score(b.text, texts) - score(a.text, texts));
if (cands[0]) { await eng.click(cands[0].clickEl, cands[0].text); await eng.settle(350); return true; }
const kin = scan.inputs.find((c) => /^(text|search)$/.test(c.kind) && scoreKeywordInput(c) > 0.3);
if (kin) {
const form = kin.el.closest('form');
if (!form || !eng.blockedForm(form)) {
await eng.glideTo(kin.el); eng.logRow('CLICK', '検索 (Enter)');
for (const t of ['keydown', 'keypress', 'keyup']) kin.el.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
try { form?.requestSubmit?.(); } catch {}
await eng.settle(350); return true;
}
}
return false;
}
const score = (t, texts) => (texts.some((x) => t.includes(x)) ? 10 : 0) + (/^(検索|この条件で検索|絞り込む|search)$/i.test(norm(t)) ? 5 : 0) + (/検索/.test(t) ? 2 : 0);
/** Steps for the engine runner. */
function genericSteps(parsed, ctx = {}) {
return [
{ id: 'filters', verb: 'NOTE', label: '条件を設定', silent: true, run: async (e) => { const r = await applyIntents(e, parsed, ctx); ctx.state = r; } },
{ id: 'apply', verb: 'CLICK', label: '検索', silent: true, navigates: true, run: async (e) => { if (ctx.state?.acted) await pressApply(e, ctx); } },
];
}
return {englishize, applyIntents, pressApply, genericSteps, parseIntents, describeIntents};
};
__d["adapters/suumo.js"] = function () {
const {NotFoundError, findByText, isVisible} = __r("engine.js");
const {genericSteps} = __r("generic/agent.js");
const {parseIntents} = __r("generic/intent.js");
const {blockedLabel} = __r("generic/safety.js");
const SUUMO_PROMPT = 'SUUMOで、エリアを「東京都」、間取りを「1LDK」、賃料上限を「10万円」にして検索。最初の物件の詳細を開き、「お気に入り」を押す。問い合わせフォームは送信しない。';
const SUUMO_HINTS = { applyTexts: ['この条件で検索', '検索する', '絞り込む', '条件を確定'] };
function parseSuumo(text) {
const p = parseIntents(text);
p.intents = p.intents.filter((i) => !(i.kind === 'term' && /^(suumo|スーモ)|お気に入り|詳細|問い合わせ|フォーム/i.test(i.text)));
p.wantDetail = /詳細/.test(text); p.wantFav = /お気に入り/.test(text);
return p;
}
const suumoInstr = (p) => `Jev への指示（英語化）: On suumo.jp/sp, apply the filters (${p.intents.map((i) => i.label ? `${i.label}=${i.raw || i.text}` : i.raw || i.text).join(', ')}), run the search, open the first result's detail page and tap お気に入り. Never submit any inquiry form. (UNVERIFIED recipe)`;
/** Steps: generic filters + search, then recipe-specific detail / favorite. */
function suumoSteps(p, ctx = {}) {
ctx.hints = { ...SUUMO_HINTS, ...(ctx.hints || {}) };
const steps = genericSteps(p, ctx);
if (p.wantDetail !== false) steps.push({ id: 'detail', verb: 'CLICK', label: '最初の物件の詳細', navigates: true, run: async (e, s) => {
const el = document.querySelector('a[href*="/chintai/jnc_"],a[href*="/chintai/bc_"],a[href*="/jnc_"],a[href*="/bc_"]')
|| document.querySelector('[class*=cassette] a[href],[class*=property] a[href],[class*=bukken] a[href]')
|| findByText(['詳細を見る', '物件詳細'], { sel: 'a,button' });
if (!el) throw new NotFoundError('最初の物件');
await e.click(el, s.label);
} });
if (p.wantFav !== false) steps.push({ id: 'favorite', verb: 'CLICK', label: 'お気に入り', run: async (e, s) => {
const el = findByText(['お気に入りに追加', 'お気に入り登録', 'お気に入り', 'キープ'], { sel: 'button,a,[role=button],label,span',
filter: (x) => !blockedLabel(x.innerText || '') && !/一覧|リスト|確認/.test(x.innerText || '') })
|| document.querySelector('[class*=favorite],[class*=keep],[data-ga*=keep]');
if (!el || !isVisible(el)) throw new NotFoundError('お気に入りボタン');
await e.click(el, s.label);
} });
return steps;
}
const suumoAdapter = {
id: 'suumo-sp', recipe: true, name: 'SUUMO (未検証レシピ)', shield: false, tabLabel: 'suumo.jp/sp — 未検証レシピ',
defaultPrompt: SUUMO_PROMPT, match: (host) => /(^|\.)suumo\.jp$/i.test(host),
parse: parseSuumo, instr: suumoInstr, buildSteps: suumoSteps, hints: SUUMO_HINTS,
};
return {SUUMO_PROMPT, SUUMO_HINTS, parseSuumo, suumoInstr, suumoSteps, suumoAdapter};
};
__d["adapters/index.js"] = function () {
const {demoAdapter} = __r("adapters/demo.js");
const {suumoAdapter} = __r("adapters/suumo.js");
const {genericSteps, englishize} = __r("generic/agent.js");
const {parseIntents} = __r("generic/intent.js");
const genericAdapter = {
id: 'generic', name: '汎用エンジン', shield: false, tabLabel: '', defaultPrompt: '東京 1LDK 10万円以下', match: () => true,
parse: parseIntents, instr: englishize, buildSteps: genericSteps, hints: {},
};
const ADAPTERS = [suumoAdapter, demoAdapter, genericAdapter];
function pickAdapter(hostname, override) {
if (override) { const a = ADAPTERS.find((x) => x.id === override); if (a) return a; }
return ADAPTERS.find((a) => a.recipe && a.match(hostname)) || genericAdapter;
}
return {genericAdapter, ADAPTERS, pickAdapter};
};
__d["app.js"] = function () {
const {createEngine, normText} = __r("engine.js");
const {mountPanel} = __r("panel.js");
const {pickAdapter} = __r("adapters/index.js");
const PRESET_PROMPTS = {
mamazon: 'Mamazonで「ノートパソコン」を探す。価格 100000円以下、評価4以上、「価格の安い順」で並び替える。購入はしない。',
form: 'Personal Formで、氏名=「山田 太郎」、フリガナ=「ヤマダ タロウ」、メールアドレス=「taro@example.com」、電話番号=「09012345678」、生年月日=「1990-01-15」、都道府県=「東京都」、住所=「千代田区架空1-2-3」、職業=「会社員」、希望する連絡方法=「メール」、興味のあるテーマ=「生成AI」、「入力内容を確認しました」にチェックして「送信（デモ）」を押す。備考は空欄のまま。「架空の個人情報をコピーする」は押さない。',
};
const wordsOf = (...xs) => xs.flatMap((x) => String(x || '').split(/[\s.\-_/:|—]+/)).filter((w) => w.length > 1);
/** @param {{host:Element, mode:'demo'|'bookmarklet', adapter?:object, ctx?:object, css?:string, onClose?:Function, promptFor?:Function}} o */
function startApp(o) {
const adapter = o.adapter || pickAdapter(location.hostname, globalThis.JEV_ADAPTER);
const panel = mountPanel(o.host, { mode: o.mode, css: o.css, onClose: o.onClose, dock: o.dock });
const hash = (location.hash.match(/preset=(\w+)/) || [])[1];
const initial = (hash && PRESET_PROMPTS[hash]) || (hash === 'suumoja' && adapter.defaultPrompt) || adapter.defaultPrompt;
panel.setPrompt(initial);
const persistKey = adapter.id === 'demo' ? null : `jev.pending.${location.hostname}`;
const eng = createEngine({ panel, shield: adapter.shield, persistKey });
const ctx = { hints: adapter.hints || {}, get jevKey() { return panel.getKey(); }, fetchFn: (...a) => fetch(...a), site: o.ctx?.site };
const ignore = [...wordsOf(location.hostname, document.title), 'Mamazon', 'Personal', 'Form', 'SUUMO', 'SUUMOじゃ', 'スーモジャ'];
panel.onPreset((p, here) => { if (here) { panel.setPrompt(p.id === 'suumoja' ? adapter.defaultPrompt : PRESET_PROMPTS[p.id]); } });
const pending = eng.pending();
if (pending && persistKey) panel.setStatusText(`前回の続き（ステップ${pending.idx + 1}）から再開できます`);
panel.onStart(async () => {
const text = panel.getPrompt();
const parsed = adapter.parse(text, { ignore });
panel.clearLog(); panel.setInstr(adapter.instr(parsed));
adapter.reset?.(o.ctx);
const c = { ...ctx, state: null };
const steps = adapter.buildSteps(parsed, c);
const resume = persistKey ? eng.pending() : null;
if (parsed.notes?.length) for (const n of parsed.notes) setTimeout(() => panel.log(0, 'NOTE', n), 0);
await eng.run(steps, { startIndex: resume && resume.idx < steps.length ? resume.idx : 0 });
});
panel.onStop(() => eng.stop());
return { panel, eng, adapter };
}
return {PRESET_PROMPTS, startApp, normText};
};
__d["bookmarklet-entry.js"] = function () {
const {startApp} = __r("app.js");
(function jevBookmarklet() {
const old = document.getElementById('jev-root');
if (old) { old.remove(); return; } // second tap toggles the panel off
const host = document.createElement('div');
host.id = 'jev-root';
host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;left:0;bottom:0;width:0;height:0';
document.documentElement.appendChild(host);
startApp({ host, mode: 'bookmarklet', css: typeof PANEL_CSS === 'string' ? PANEL_CSS : '', dock: !!globalThis.__JEV_EXT__, onClose: () => host.remove() });
})();
return {};
};
__r("bookmarklet-entry.js");
})();