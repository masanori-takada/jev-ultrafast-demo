// Match intents to scanned controls by fuzzy label matching. Pure (works on plain records).
import { canon, conceptsOf, conceptOverlap, textScore, parseNum, parseAllNums, opOf, isWildcard } from './text.js';

const labelConcepts = (c) => conceptsOf(`${c.group || ''} ${c.label || ''}`);
const describe = (c) => (c.kind === 'option' ? `選択肢「${c.text}」(${c.group || '無題'})` : c.kind === 'check' ? `チェック「${c.text}」(${c.group || '無題'})` :
  c.kind === 'press' ? `ボタン「${c.text}」` : `入力欄(${c.label || '無題'})`);
export const describeControl = describe;

function labelBonus(intent, c) {
  if (!intent.label) return 0;
  const g = `${c.group || ''} ${c.label || ''}`;
  const direct = textScore(intent.label, g) > 0 || canon(g).includes(canon(intent.label));
  if (direct) return 0.2;
  if (conceptOverlap(conceptsOf(intent.label), labelConcepts(c))) return 0.15;
  return -0.25;
}

/** Score a choice (option / checkbox / chip) for a term or pair intent. */
export function scoreTerm(intent, c) {
  if (isWildcard(c.text) || c.kind === 'input') return 0;
  const s = textScore(intent.text, c.text);
  if (!s) return 0;
  return Math.max(0, Math.min(1, s * 0.85 + 0.1 + labelBonus(intent, c)));
}

/** Score a choice for a numeric intent. */
export function scoreNum(intent, c) {
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
export function scoreInput(intent, c) {
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
    // 氏名 / 氏名* style labels contain the intent label
    const inc = canon(lab).includes(canon(intent.label)) ? 0.85 : 0;
    return Math.max(base, inc);
  }
  return 0;
}
export function inputRole(label) {
  const t = String(label).normalize('NFKC').toLowerCase();
  if (/最小|下限|以上|から|min|from|最低|lower/.test(t)) return 'min';
  if (/最大|上限|以下|まで|max|to\b|最高|upper/.test(t)) return 'max';
  return null;
}
/** Is this a free-text search box? score for keyword typing. */
export function scoreKeywordInput(c) {
  if (!/^(text|search)$/.test(c.kind)) return 0;
  const lc = labelConcepts(c); let s = 0.3;
  if (c.type === 'search') s += 0.4;
  if (lc.has('keyword')) s += 0.3;
  if (lc.has('salary') || lc.has('price')) return 0;
  return Math.min(1, s);
}

/** Rank candidates; flag ambiguity (low score or near-tie between different controls). */
export function rank(scored) {
  const list = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  const best = list[0] || null;
  const second = list.find((x) => x !== best && x.c.ctrl !== best?.c.ctrl && x.c.el !== best?.c.el);
  const ambiguous = !!best && (best.score < 0.6 || (second && best.score - second.score < 0.08));
  return { best, list, ambiguous };
}
export function bestFor(intent, scan) {
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
export { parseNum };
