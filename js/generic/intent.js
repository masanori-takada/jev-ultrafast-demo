// Free-text prompt -> intents. Pure.
import { norm, parseNum, opOf, conceptsOf } from './text.js';

const FILLER = /(?:に(?:して|設定して|絞って)|を(?:探して|検索して|探す|検索)|で(?:探して|検索して)|検索(?:して)?|探(?:して)?|絞り込(?:んで|み)?|してください|ください|お願い(?:します)?|して|押す|押して|入力(?:する|して)?|チェック(?:して)?|設定|クリック|開く|開き|並び替える|並べ替える|並べる|選ぶ|選択|条件で|で$|を$|の$)/g;
const STOP = new Set(['', 'と', 'を', 'に', 'で', 'の', 'は', 'が', 'し', 'て', 'and', 'the', 'a', 'in', 'for', 'with', 'search', 'find']);

/** @returns {{pairs:Array, nums:Array, terms:Array, sort:string|null, intents:Array, allowCart:boolean}} */
const NEG = /空欄|のまま|しない|押さない|行わない|不要|never|don'?t|do not/i;
export function parseIntents(prompt, { ignore = [] } = {}) {
  // sentences with a negation ("購入はしない", "…は押さない") are guard rails, not intents
  let text = norm(prompt).split(/(?<=。)/).filter((x) => !NEG.test(x)).join('');
  const ign = ignore.map((x) => norm(x).toLowerCase()).filter(Boolean);
  const intents = [];
  // 1. explicit label -> value:  エリアを「東京都」 / エリア=東京都 / エリア: 東京都 / エリアは東京都
  const explicit = /([^\s「」、,。=:：を]{1,12}?)\s*(?:を|は|=|:|：)\s*「([^」]+)」|([^\s「」、,。=:：]{1,12})\s*(?:=|:|：)\s*([^\s、,。]+)/g;
  text = text.replace(explicit, (_, l1, v1, l2, v2) => { intents.push(makeIntent(l1 || l2, v1 || v2)); return ' '; });
  // 2. quoted free values
  text = text.replace(/「([^」]+)」/g, (_, v) => { intents.push(makeIntent(null, v)); return ' '; });
  // 3. tokens
  text = text.replace(/(検索|探して|絞り込|ください)/g, ' $1 ');
  const raw = text.split(/[\s、,，。;；\/]+/).filter(Boolean);
  const tokens = [];
  for (const t of raw) { const c = t.replace(FILLER, '').trim(); if (!STOP.has(c.toLowerCase()) && c.length > 0 && !ign.includes(c.toLowerCase())) tokens.push(c); }
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const sortM = t.match(/^(.+?)順$/) || t.match(/^(?:sort|並び替え|並べ替え)[:：]?(.+)$/i);
    if (sortM && !/\d/.test(t)) { intents.push({ kind: 'sort', text: sortM[1], raw: t }); continue; }
    // label token followed by numeric token (価格 5000円以下)
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

export function describeIntents(p) {
  return p.intents.map((i) => i.kind === 'num' ? `${i.label || '数値'} ${i.value}${i.op === 'max' ? ' 以下' : i.op === 'min' ? ' 以上' : ''}` :
    i.kind === 'sort' ? `並び順: ${i.text}` : i.kind === 'pair' ? `${i.label}=${i.text}` : `「${i.text}」`).join(' / ');
}
