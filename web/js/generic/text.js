// Text normalisation, synonyms and number parsing for the generic engine (pure; runs in Node and browsers).
export const norm = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

const hira2kata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

// value synonyms: romaji / English -> canonical Japanese (applied on lower-cased text)
const VALUE_SYN = [
  [/tokyo|とうきょう|トウキョウ/g, '東京'], [/kanagawa|かながわ/g, '神奈川'], [/saitama|さいたま/g, '埼玉'], [/chiba|ちば/g, '千葉'],
  [/osaka|おおさか/g, '大阪'], [/kyoto|きょうと/g, '京都'], [/yokohama/g, '横浜'],
  [/remote|work from home|wfh|在宅勤務|テレワーク|在宅/g, 'リモート'], [/engineer|developer|programmer/g, 'エンジニア'],
  [/designer/g, 'デザイナー'], [/sales/g, '営業'], [/full[- ]?time|正社員/g, '正社員'], [/part[- ]?time|パート/g, 'アルバイト'],
  [/new arrivals?|newest|latest/g, '新着'], [/cheapest|low(est)? price|price low|安い/g, '安い'], [/highest rated|top rated|best rated|rating|review|レビュー/g, 'レビュー'],
  [/popular|人気/g, '人気'], [/recommended/g, 'おすすめ'],
];
export const canon = (s) => {
  let t = hira2kata(norm(s).toLowerCase());
  t = t.replace(/[\s・,，、。.!！?？:：;；()（）\[\]「」『』"'“”‘’\-_/]/g, '');
  for (const [re, to] of VALUE_SYN) t = t.replace(re, hira2kata(to).toLowerCase());
  return t;
};

// concept groups for LABELS (field names), JP + EN
export const CONCEPTS = {
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
export function conceptsOf(label) {
  const c = canon(label); const out = new Set();
  if (!c) return out;
  for (const [k, words] of Object.entries(CONCEPT_CANON)) if (words.some((w) => (w.length === 1 ? c === w || c.startsWith(w) || c.endsWith(w) : c.includes(w)))) out.add(k);
  return out;
}
export const conceptOverlap = (a, b) => [...a].some((x) => b.has(x));

/** 0..1 similarity of a term against a candidate text (both canonicalised internally). */
export function textScore(term, text) {
  const a = canon(term), b = canon(text);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (b.includes(a)) return Math.max(0.72, 0.72 + 0.28 * (a.length / b.length));
  if (a.includes(b) && b.length >= 2) return 0.55 * (b.length / a.length) + 0.2;
  return 0;
}

const WILD = /^(すべて|全て|指定なし|選択してください|選択|上限なし|下限なし|未選択|選んでください|all|any|none|--+)$/i;
export const isWildcard = (t) => WILD.test(norm(t));

/** Parse the first number in a text. 10万円 -> {value:100000, money:true}; ¥5,000 -> 5000 money; ★4以上 -> 4 plain. */
export function parseNum(text) {
  const s = norm(text).replace(/,/g, '');
  const m = s.match(/(?:¥|￥)?\s*(\d+(?:\.\d+)?)\s*(万|千|k)?\s*(円|¥|yen)?/i);
  if (!m) return null;
  let v = parseFloat(m[1]); const mult = m[2];
  if (mult === '万') v *= 1e4; else if (mult === '千') v *= 1e3; else if (mult && mult.toLowerCase() === 'k') v *= 1e3;
  const money = !!(m[3] || mult === '万' || /[¥￥]/.test(s.slice(Math.max(0, m.index - 1), m.index + 1)) || /^[¥￥]/.test(m[0]));
  return { value: v, money, text: m[0], index: m.index };
}
/** All numbers in text (for ranges like 600万〜800万). */
export function parseAllNums(text) {
  const out = []; let rest = norm(text).replace(/,/g, '');
  const re = /(?:¥|￥)?\s*(\d+(?:\.\d+)?)\s*(万|千|k)?\s*(円|¥|yen)?/gi; let m;
  while ((m = re.exec(rest))) {
    let v = parseFloat(m[1]); if (m[2] === '万') v *= 1e4; else if (m[2] === '千' || (m[2] || '').toLowerCase() === 'k') v *= 1e3;
    out.push({ value: v, money: !!(m[3] || m[2] === '万' || /[¥￥]/.test(m[0])) });
  }
  return out;
}
export const opOf = (s) => {
  const t = norm(s).toLowerCase();
  if (/以下|まで|以内|未満|上限|max|under|up to|<=|≤|less than|below/.test(t)) return 'max';
  if (/以上|から|下限|min|over|from|≥|>=|more than|above|at least/.test(t)) return 'min';
  return null;
};
