// Recipe 'suumo-sp' for https://suumo.jp/sp/ (mobile site). A recipe only adds HINTS to the generic engine.
//
// !!! UNVERIFIED AGAINST THE LIVE SITE !!!
// suumo.jp was not reachable from the development sandbox, so everything here comes from general knowledge of the
// mobile site. The generic engine does the filtering (text/label based, with fallbacks); this recipe only adds
// apply-button texts and two extra steps (open first result, tap お気に入り). Every failed lookup ends gracefully
// with the status line '要素が見つかりません: …'. Expect to adjust the texts after trying it on a real phone.
//
// Safety: never submits an inquiry/contact form (the engine denylist blocks 問い合わせ/資料請求/申込/送信).
// It only acts on the page the user is currently on (no scraping, no fetching other pages).
import { NotFoundError, findByText, isVisible } from '../engine.js';
import { genericSteps } from '../generic/agent.js';
import { parseIntents } from '../generic/intent.js';
import { blockedLabel } from '../generic/safety.js';

export const SUUMO_PROMPT = 'SUUMOで、エリアを「東京都」、間取りを「1LDK」、賃料上限を「10万円」にして検索。最初の物件の詳細を開き、「お気に入り」を押す。問い合わせフォームは送信しない。';
export const SUUMO_HINTS = { applyTexts: ['この条件で検索', '検索する', '絞り込む', '条件を確定'] };

export function parseSuumo(text) {
  const p = parseIntents(text);
  // 'お気に入り' / '詳細' are page actions here, not filters
  p.intents = p.intents.filter((i) => !(i.kind === 'term' && /^(suumo|スーモ)|お気に入り|詳細|問い合わせ|フォーム/i.test(i.text)));
  p.wantDetail = /詳細/.test(text); p.wantFav = /お気に入り/.test(text);
  return p;
}
export const suumoInstr = (p) => `自動操作の内容（英語）: On suumo.jp/sp, apply the filters (${p.intents.map((i) => i.label ? `${i.label}=${i.raw || i.text}` : i.raw || i.text).join(', ')}), run the search, open the first result's detail page and tap お気に入り. Never submit any inquiry form. (UNVERIFIED recipe)`;

/** Steps: generic filters + search, then recipe-specific detail / favorite. */
export function suumoSteps(p, ctx = {}) {
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

export const suumoAdapter = {
  id: 'suumo-sp', recipe: true, name: 'SUUMO (未検証レシピ)', shield: false, tabLabel: 'suumo.jp/sp — 未検証レシピ',
  defaultPrompt: SUUMO_PROMPT, match: (host) => /(^|\.)suumo\.jp$/i.test(host),
  parse: parseSuumo, instr: suumoInstr, buildSteps: suumoSteps, hints: SUUMO_HINTS,
};
