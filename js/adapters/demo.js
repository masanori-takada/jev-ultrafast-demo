// Adapter 1: the fictional スーモジャ demo site (fully tested). Scripted simulation, no LLM.
import { NotFoundError } from '../engine.js';

export const DEFAULT_PROMPT = 'SUUMOじゃ、エリアを「東京都」、間取りを「1LDK」、賃料上限を「10万円」にして「この条件で検索」。最初の物件の「物件の詳細を見る」を開き、「お気に入り」を押す。続けて「空室状況を問い合わせる」を押し、お名前 山田 太郎、メールアドレス taro@example.com、お問い合わせ内容「来週末に内見を希望します。空室状況を教えてください。」を入力して「内容を送信する（デモ）」を押し、送信完了の表示が出たら終了。';

export const OPTIONS = {
  area: ['東京都', '神奈川県', '埼玉県', '千葉県'],
  layout: ['1R', '1K', '1DK', '1LDK', '2LDK', '3LDK'],
  rent: ['5万円', '7万円', '10万円', '15万円', '20万円'],
};
const DEFAULTS = { area: '東京都', layout: '1LDK', rent: '10万円', name: '山田 太郎', email: 'taro@example.com', body: '来週末に内見を希望します。空室状況を教えてください。' };

export function parsePrompt(text) {
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

export function instrText(p) {
  return `自動操作の内容（英語）: Set エリア to ${p.area}, 間取り to ${p.layout}, 賃料上限 to ${p.rent}, then click 'この条件で検索'. Click '物件の詳細を見る' on the first result, then click お気に入り on that property. Then click '空室状況を問い合わせる'. In the inquiry form, fill お名前 = ${p.name}, メールアドレス = ${p.email}, お問い合わせ内容 = ${p.body} Then do NOT click '内容を送信する（デモ）' (skipped for safety). When the inquiry form is filled in, DONE.`;
}

const $ = (s) => document.querySelector(s);
const need = (el, what) => { if (!el) throw new NotFoundError(what); return el; };

/** Steps with target timestamps (ms since スタート) from spec section 2. The submit button is never clicked. */
export function buildScript(p) {
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

export const demoAdapter = {
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
