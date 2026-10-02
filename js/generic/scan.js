// Scan the page for operable controls and collect visible labels. DOM only; returns plain records (with `el`).
import { norm } from './text.js';
import { isVisible } from '../engine.js';

const txt = (el) => norm(el?.innerText ?? el?.textContent ?? '');
const inUi = (el) => !!el.closest('#jev-root,#panel,#jev-cursor,#cursor,#jev-shield,[data-jev-ignore]');

function nearbyText(el) {
  // 1. previous siblings (and ancestors' previous siblings, up to 3 levels): short text without controls
  let cur = el;
  for (let depth = 0; depth < 3 && cur && cur.parentElement; depth++) {
    let p = cur.previousElementSibling;
    while (p) {
      if (!p.querySelector?.('input,select,textarea,button') && !/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(p.tagName)) { const t = txt(p); if (t && t.length <= 30) return t; }
      p = p.previousElementSibling;
    }
    // parent's own leading text / label-like child
    const head = cur.parentElement.querySelector(':scope > label, :scope > legend, :scope > dt, :scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6, :scope > strong, :scope > span.label, :scope > .title');
    if (head && head !== el && !head.contains(el)) { const t = txt(head); if (t && t.length <= 30) return t; }
    cur = cur.parentElement;
  }
  return '';
}
export function labelOf(el) {
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
export function scanControls(doc = document) {
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
