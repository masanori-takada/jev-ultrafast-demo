// Generic agent: free-text prompt -> scan page -> match -> act -> rescan. Works on any search/filter site.
// Recipes (adapters/*) only contribute hints; this path works without them.
import { scanControls } from './scan.js';
import { bestFor, scoreKeywordInput, describeControl } from './match.js';
import { parseIntents, describeIntents } from './intent.js';
import { blockedLabel } from './safety.js';
import { askJev } from './jev.js';
import { norm } from './text.js';

const APPLY_RE = /検索|絞り込|絞込|適用|結果を見る|更新|apply filters?|search|filter|update|go$/i;
const shortGroup = (g) => norm(g).replace(/[*＊]/g, '').slice(0, 14);
const lab = (c, fallback) => shortGroup(c.group || c.label) || fallback;

export function englishize(parsed) {
  const parts = parsed.intents.map((i) => i.kind === 'num' ? `set ${i.label || 'the numeric filter'} ${i.op === 'max' ? '(max) ' : i.op === 'min' ? '(min) ' : ''}to ${i.raw}` :
    i.kind === 'sort' ? `sort by ${i.text}` : i.kind === 'pair' ? `set ${i.label} to ${i.text}` : `select or search '${i.text}'`);
  return `自動操作の内容（英語）: ${parts.length ? parts.join(', then ') : 'no recognizable filters'}. Then click the search/apply button. Never click purchase / apply / submit / login / payment controls (logged as SKIP).`;
}

async function pick(eng, intent, ctx) {
  const scan = scanControls(eng.doc);
  let r = bestFor(intent, scan);
  if (r.best && r.ambiguous && ctx.jevKey) {
    const cands = r.list.slice(0, 5).map((x, i) => ({ id: `k${i}`, description: describeControl(x.c), x }));
    const a = await askJev({ key: ctx.jevKey, url: eng.win.location.origin + eng.win.location.pathname, intent: intent.text || intent.label || intent.raw, candidates: cands, fetchFn: ctx.fetchFn });
    const chosen = a && cands.find((c) => c.id === a.id);
    if (chosen) { eng.note(`AI判断: ${chosen.description}`); return { best: chosen.x, jev: true }; }
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
  // inputs
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
export async function applyIntents(eng, parsed, ctx = {}) {
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
export async function pressApply(eng, ctx = {}) {
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
export function genericSteps(parsed, ctx = {}) {
  return [
    { id: 'filters', verb: 'NOTE', label: '条件を設定', silent: true, run: async (e) => { const r = await applyIntents(e, parsed, ctx); ctx.state = r; } },
    { id: 'apply', verb: 'CLICK', label: '検索', silent: true, navigates: true, run: async (e) => { if (ctx.state?.acted) await pressApply(e, ctx); } },
  ];
}
export { parseIntents, describeIntents };
