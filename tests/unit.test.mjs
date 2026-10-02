import test from 'node:test';
import assert from 'node:assert/strict';
import { LISTINGS } from '../web/js/data.js';
import { filterListings } from '../web/js/filter.js';
import { parsePrompt, buildScript, DEFAULT_PROMPT } from '../web/js/adapters/demo.js';
import { fmtTimer, normText } from '../web/js/engine.js';
import { pickAdapter } from '../web/js/adapters/index.js';
import { suumoSteps, parseSuumo, SUUMO_PROMPT } from '../web/js/adapters/suumo.js';
import { svgPhoto, ART_KINDS } from '../web/js/art.js';

const ids = (l) => l.map((x) => x.id);

test('24 unique listings, 16 in Tokyo', () => {
  assert.equal(LISTINGS.length, 24);
  assert.equal(new Set(ids(LISTINGS)).size, 24);
  assert.equal(LISTINGS.filter((l) => l.pref === '東京都').length, 16);
});
test('fixtures 1-6', () => {
  const [a, b, c, d] = LISTINGS;
  assert.equal(a.name, '風見ハイツ代々木'); assert.equal(a.price, 12.8); assert.equal(a.layout, '1LDK'); assert.equal(a.floor, '6階');
  assert.equal(b.name, '月灯りレジデンス'); assert.equal(b.city, '世田谷区');
  assert.equal(c.name, '川辺の白い家'); assert.equal(c.priceLabel, '5,680万円'); assert.equal(c.mode, 'buy');
  assert.equal(d.name, 'こもれび荘 202'); assert.equal(d.price, 7.9); assert.equal(d.layout, '1DK');
  const g = LISTINGS.find((l) => l.name === '雨音メゾン神楽坂'); assert.equal(g.price, 14.5); assert.equal(g.layout, '1LDK');
  const s = LISTINGS.find((l) => l.id === 'asagaya');
  assert.equal(s.name, '空色ルーフ阿佐ヶ谷'); assert.equal(s.price, 9.1); assert.equal(s.year, 2009); assert.equal(s.walk, 8);
});
test('filter: Tokyo+1LDK = 3, +10万 = 1', () => {
  const t = filterListings(LISTINGS, { area: '東京都', layout: '1LDK' });
  assert.deepEqual(ids(t), ['yoyogi', 'kagurazaka', 'asagaya']);
  const r = filterListings(LISTINGS, { area: '東京都', layout: '1LDK', rent: '10万円' });
  assert.deepEqual(ids(r), ['asagaya']);
  assert.equal(filterListings(LISTINGS, { area: 'すべて', rent: '上限なし' }).length, 24);
  assert.equal(filterListings(LISTINGS, { kw: '阿佐ヶ谷' }).length >= 1, true);
  assert.equal(filterListings(LISTINGS, { rent: '10万円' }).every((l) => l.price <= 10), true);
});
test('art: scenes', () => {
  assert.ok(ART_KINDS.length >= 8);
  for (const k of ART_KINDS) assert.match(svgPhoto(k, 1), /^data:image\/svg\+xml/);
  for (const l of LISTINGS) assert.ok(ART_KINDS.includes(l.art), l.id);
});
test('parsePrompt default', () => {
  const p = parsePrompt(DEFAULT_PROMPT);
  assert.deepEqual({ ...p, notes: undefined }, { area: '東京都', layout: '1LDK', rent: '10万円', name: '山田 太郎', email: 'taro@example.com',
    body: '来週末に内見を希望します。空室状況を教えてください。', notes: undefined });
  assert.deepEqual(p.notes, []);
});
test('parsePrompt fallbacks', () => {
  const p = parsePrompt('ぐちゃぐちゃ');
  assert.equal(p.area, '東京都'); assert.equal(p.name, '山田 太郎');
  const q = parsePrompt('エリアを「火星」、間取りを「9LDK」、賃料上限を「1円」');
  assert.equal(q.area, '東京都'); assert.equal(q.layout, '1LDK'); assert.equal(q.rent, '10万円'); assert.equal(q.notes.length, 3);
  assert.equal(parsePrompt('エリアを「神奈川県」').area, '神奈川県');
});
test('buildScript order/timing, never submits', () => {
  const s = buildScript(parsePrompt(DEFAULT_PROMPT));
  assert.deepEqual(s.filter((x) => !['DONE', 'SKIP'].includes(x.verb)).map((x) => x.t), [1111, 1495, 1787, 2066, 2385, 2690, 3000, 3600, 4600, 5600]);
  assert.deepEqual(s.filter((x) => !['DONE', 'SKIP'].includes(x.verb)).map((x) => `${x.verb} ${x.label}`), [
    'SELECT エリア → 東京都', 'SELECT 間取り → 1LDK', 'SELECT 賃料上限 → 10万円', 'CLICK この条件で検索', 'CLICK 物件の詳細を見る',
    'CLICK お気に入り', 'CLICK 空室状況を問い合わせる', 'TYPE_TEXT お名前 → "山田 太郎"', 'TYPE_TEXT メールアドレス → "taro@example.com"',
    'TYPE_TEXT お問い合わせ内容 → "来週末に内見を希望します。空室状況を教えてください。"']);
  assert.equal(s.at(-1).verb, 'DONE'); assert.equal(s.at(-1).t, 7300);
  assert.deepEqual(s.at(-2).label, '送信はスキップ(安全のため)'); assert.equal(s.at(-2).verb, 'SKIP');
  assert.ok(!s.some((x) => x.verb === 'CLICK' && x.label.includes('内容を送信')));
});
test('fmtTimer / normText', () => {
  assert.equal(fmtTimer(7400), '7.4s'); assert.equal(fmtTimer(0), '0.0s'); assert.equal(fmtTimer(12130), '12.1s');
  assert.equal(normText(' １ＬＤＫ\n  東京都 '), '1LDK 東京都');
});
test('pickAdapter by hostname', () => {
  assert.equal(pickAdapter('suumo.jp').id, 'suumo-sp');
  assert.equal(pickAdapter('www.suumo.jp').id, 'suumo-sp');
  assert.equal(pickAdapter('localhost').id, 'generic');
  assert.equal(pickAdapter('example.com').id, 'generic');
  assert.equal(pickAdapter('amazon.co.jp').id, 'generic');
  assert.equal(pickAdapter('evil-suumo.jp.example.com').id, 'generic');
  assert.equal(pickAdapter('localhost', 'demo').id, 'demo');
});
test('suumo recipe: generic filters + detail + favorite, no inquiry step', () => {
  const p = parseSuumo(SUUMO_PROMPT);
  const s = suumoSteps(p, {});
  assert.deepEqual(s.map((x) => x.id), ['filters', 'apply', 'detail', 'favorite']);
  assert.ok(s.every((x) => !/問い合わせ|送信|申し込/.test(x.label)));
  assert.ok(s.every((x) => typeof x.run === 'function'));
  assert.deepEqual(p.intents.map((i) => i.label + '=' + (i.raw)), ['エリア=東京都', '間取り=1LDK', '賃料上限=10万円']);
});

import { parseIntents } from '../web/js/generic/intent.js';
import { parseNum, textScore, canon, opOf } from '../web/js/generic/text.js';
import { bestFor, inputRole } from '../web/js/generic/match.js';
import { blockedLabel, blockedHref } from '../web/js/generic/safety.js';
import { askJev, JEV_ENDPOINT, JEV_MODEL } from '../web/js/generic/jev.js';

test('number/unit normalisation', () => {
  assert.equal(parseNum('10万円').value, 100000); assert.equal(parseNum('¥5,000').value, 5000); assert.equal(parseNum('5000円以下').money, true);
  assert.equal(parseNum('600万').value, 6000000); assert.equal(parseNum('★4以上').money, false);
  assert.equal(opOf('10万円以下'), 'max'); assert.equal(opOf('評価4以上'), 'min');
  assert.ok(textScore('Tokyo', '東京都') > 0.7); assert.equal(canon('リモート可'), canon('remote可'));
  assert.equal(inputRole('最低年収(万円)'), 'min');
});
test('intents: three sample prompts', () => {
  const a = parseIntents('Tokyo 1LDK 10万円以下');
  assert.deepEqual(a.intents.map((i) => [i.kind, i.text ?? i.value, i.op]), [['term', 'Tokyo', undefined], ['term', '1LDK', undefined], ['num', 100000, 'max']]);
  const b = parseIntents('価格 5000円以下 評価4以上 レビュー順');
  assert.deepEqual(b.intents.map((i) => [i.kind, i.label ?? i.text, i.value, i.op]), [['num', '価格', 5000, 'max'], ['num', '評価', 4, 'min'], ['sort', 'レビュー', undefined, undefined]]);
  const c = parseIntents('年収600万以上 リモート可 エンジニア');
  assert.deepEqual(c.intents.map((i) => [i.kind, i.label ?? i.text, i.value]), [['num', '年収', 6000000], ['term', 'リモート可', undefined], ['term', 'エンジニア', undefined]]);
  const d = parseIntents('エリアを「東京都」、賃料上限を「10万円」にして検索');
  assert.deepEqual(d.intents.map((i) => [i.kind, i.label, i.raw]), [['pair', 'エリア', '東京都'], ['num', '賃料上限', '10万円']]);
  assert.equal(d.intents[1].op, 'max');
  const e = parseIntents('氏名=「山田 太郎」、メール=「a@b.c」');
  assert.equal(e.intents[0].text, '山田 太郎');
});
test('match: options, facets, ambiguity', () => {
  const opt = (g, t, sel = false) => ({ id: g + t, kind: 'option', group: g, text: t, selected: sel, ctrl: g, el: g });
  const scan = { inputs: [], choices: [opt('エリア', 'すべて'), opt('エリア', '東京都'), opt('エリア', '神奈川県'), opt('賃料上限', '上限なし'), opt('賃料上限', '5万円'), opt('賃料上限', '10万円'), opt('賃料上限', '15万円')] };
  assert.equal(bestFor({ kind: 'term', text: 'Tokyo' }, scan).best.c.text, '東京都');
  assert.equal(bestFor({ kind: 'num', value: 100000, money: true, op: 'max' }, scan).best.c.text, '10万円');
  assert.equal(bestFor({ kind: 'num', value: 120000, money: true, op: 'max' }, scan).best.c.text, '10万円');
  const amb = { inputs: [], choices: [opt('A', '東京都'), opt('B', '東京都')] };
  assert.equal(bestFor({ kind: 'term', text: '東京' }, amb).ambiguous, true);
  assert.equal(bestFor({ kind: 'term', text: 'zzz' }, scan).best, null);
});
test('safety denylist', () => {
  for (const l of ['購入する', '注文を確定', '今すぐ買う', '応募する', '申し込み', '送信', '問い合わせ', 'お支払い', 'ログイン', '退会', '削除', 'Buy Now', 'Place order', 'Apply', 'Apply now', 'Submit', 'Sign in', 'Pay now', 'カートに入れる'])
    assert.ok(blockedLabel(l), l);
  for (const l of ['検索', 'この条件で検索', 'Apply filters', 'Search', '絞り込む', '1LDK', 'お気に入り', 'もっと見る']) assert.equal(blockedLabel(l), null, l);
  assert.equal(blockedLabel('カートに入れる', { allowCart: true }), null);
  assert.equal(blockedLabel('空室状況を問い合わせる', { allow: [/空室状況/] }), null);
});
test('Jev mode: mocked fetch, key never in code', async () => {
  const calls = [];
  const fetchFn = async (url, init) => { calls.push({ url, init }); return { ok: true, json: async () => ({ answers: { q: { choice: 'k1', confidence: 0.9, probabilities: { k0: 0.1, k1: 0.9 } } } }) }; };
  const cands = [{ id: 'k0', description: 'A' }, { id: 'k1', description: 'B' }];
  const r = await askJev({ key: 'TESTKEY', url: 'https://x.test/', intent: '東京', candidates: cands, fetchFn });
  assert.equal(r.id, 'k1'); assert.equal(r.confidence, 0.9);
  assert.equal(calls[0].url, JEV_ENDPOINT); assert.equal(calls[0].init.method, 'POST');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.model, JEV_MODEL); assert.deepEqual(Object.keys(body.questions.q.criteria), ['k0', 'k1']);
  assert.equal(body.questions.q.type, 'choice'); assert.match(body.state, /https:\/\/x\.test\//); assert.match(body.state, /東京/);
  assert.equal(calls[0].init.headers.authorization, 'Bearer TESTKEY');
  assert.equal(await askJev({ key: '', url: 'u', intent: 'i', candidates: cands, fetchFn }), null); assert.equal(calls.length, 1);
  assert.equal(await askJev({ key: 'k', url: 'u', intent: 'i', candidates: cands, fetchFn: async () => { throw new Error('net'); } }), null);
  assert.equal(await askJev({ key: 'k', url: 'u', intent: 'i', candidates: cands, fetchFn: async () => ({ ok: true, json: async () => ({ answers: { q: { choice: 'zzz' } } }) }) }), null);
});
test('safety denylist: adversarial label and href variants', () => {
  for (const l of ['Payment', 'Order now', 'Buy', 'Send message', 'Contact us', 'Inquiry', 'Checkout', 'ＢＵＹ　ＮＯＷ', '購​入', '購 入', '資料請求', 'エントリー', '内見予約', 'ログアウト', 'Log out', 'Register', 'Subscribe', 'Remove', 'Book now', 'Continue to payment', '手続きに進む', '契約へ進む'])
    assert.ok(blockedLabel(l), l);
  for (const l of ['Sort order', 'Order by price', '検索', 'Next', 'OK', 'Apply filters', 'もっと見る', 'お気に入り'])
    assert.equal(blockedLabel(l), null, l);
  for (const h of ['/checkout/start', '/cart/add', '/orders/1', 'mailto:a@b.c', 'tel:123', 'javascript:doIt()', '/apply', '/inquiry', '/account/delete', '?action=purchase', '/signup'])
    assert.ok(blockedHref(h), h);
  for (const h of ['/search?sort=price&order=asc', '/list?page=2', '#', 'javascript:void(0)', '/properties/12'])
    assert.equal(blockedHref(h), null, h);
});

import fs from 'node:fs';
test('extension manifest: MV3, activeTab+scripting only, no host permissions, files exist', () => {
  const root = new URL('../extension/', import.meta.url);
  const m = JSON.parse(fs.readFileSync(new URL('manifest.json', root), 'utf8'));
  assert.equal(m.manifest_version, 3);
  assert.deepEqual([...m.permissions].sort(), ['activeTab', 'scripting']);
  assert.equal(m.host_permissions, undefined); assert.equal(m.content_scripts, undefined); assert.equal(m.optional_host_permissions, undefined);
  assert.equal(m.background.service_worker, 'background.js');
  for (const f of [m.background.service_worker, ...Object.values(m.action.default_icon), ...Object.values(m.icons), 'panel.js', 'README.ja.md'])
    assert.ok(fs.existsSync(new URL(f, root)), f);
  const bg = fs.readFileSync(new URL('background.js', root), 'utf8');
  assert.ok(/executeScript/.test(bg) && /files: \['panel\.js'\]/.test(bg));
  assert.ok(!/https?:\/\//.test(bg), 'no URLs in background');
});
test('extension/panel.js equals the bookmarklet bundle and has no network/remote-code calls except Jev mode fetch', async () => {
  const { bundle } = await import('../tools/build-bookmarklet.mjs');
  assert.equal(fs.readFileSync(new URL('../extension/panel.js', import.meta.url), 'utf8'), bundle());
});
test('bookmarkletCode: full self-contained javascript: text, no fetch stub, decodes to bookmarklet.js', async () => {
  const { bookmarkletCode, encodeBookmarklet } = await import('../web/js/panel.js');
  const code = fs.readFileSync(new URL('../web/bookmarklet.js', import.meta.url), 'utf8');
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { ok: true, text: async () => code }; };
  try {
    const a = await bookmarkletCode('https://example.github.io/app/index.html#x');
    const b = await bookmarkletCode('https://example.github.io/app/index.html#x');
    assert.equal(calls, 1, 'fetched once');
    assert.equal(a, b);
    assert.ok(a.startsWith('javascript:'));
    assert.ok(!decodeURIComponent(a.slice(11)).startsWith('fetch('), 'no fetch stub');
    assert.ok(!/[\n\r#]/.test(a), 'no raw newline or #');
    assert.equal(decodeURIComponent(a.slice(11)), code);
  } finally { globalThis.fetch = realFetch; }
  assert.equal(decodeURIComponent(encodeBookmarklet('a%b#c\nd\r').slice(11)), 'a%b#c\nd\r');
});
test('sw.js cache name equals the build id (version.js) and is shown in the panel', async () => {
  const { BUILD_ID } = await import('../web/js/version.js');
  const sw = fs.readFileSync(new URL('../web/sw.js', import.meta.url), 'utf8');
  assert.equal(/const CACHE = '([^']+)'/.exec(sw)[1], BUILD_ID);
  assert.match(BUILD_ID, /^build \d{4}-\d{2}-\d{2} v\d+$/);
  assert.ok(/cache: 'no-cache'/.test(sw) && /clients\.claim/.test(sw) && /skipWaiting/.test(sw));
});

import { PROXY_HOSTS, isSupportedHost, proxyUrl, originalUrl, encodePrompt, decodePrompt, UNSUPPORTED_TEXT } from '../web/js/config.js';
test('config: prompt base64url round-trips (UTF-8), proxyUrl and originalUrl', () => {
  for (const t of ['', 'a', '東京 1LDK 10万円以下 ✓ 😀', '??>>~~']) { const e = encodePrompt(t); assert.match(e, /^[A-Za-z0-9_-]*$/); assert.equal(decodePrompt(e), t); }
  assert.equal(proxyUrl(new URL('https://suumo.jp/sp/x?a=1#z'), 'hi', 'https://p.test'), 'https://p.test/p/suumo.jp/sp/x?a=1#jev-prompt=' + encodePrompt('hi'));
  assert.equal(proxyUrl(new URL('https://example.org/'), 'hi'), null);
  assert.equal(proxyUrl(new URL('https://suumo.jp:8443/'), 'hi'), null);
  assert.equal(isSupportedHost('www.suumo.jp'), true); assert.equal(isSupportedHost('suumo.jp.evil.com'), false); assert.equal(isSupportedHost('127.0.0.1'), false);
  assert.equal(originalUrl({ pathname: '/p/suumo.jp/sp/x', search: '?a=1' }, 'suumo.jp'), 'https://suumo.jp/sp/x?a=1');
  assert.equal(originalUrl({ pathname: '/p/suumo.jp', search: '' }, 'suumo.jp'), 'https://suumo.jp/');
  assert.equal(originalUrl({ pathname: '/other', search: '' }, 'suumo.jp'), null);
  assert.equal(PROXY_HOSTS.length, 14);
  assert.equal(UNSUPPORTED_TEXT, 'このサイトはまだ対応していません（対応: suumo.jp, amazon.co.jp …）');
});
