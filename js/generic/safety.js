// Safety denylist. Enforced inside the engine for every click/submit/typing. Pure functions + a DOM wrapper.
// Policy: never click/submit anything that buys, applies, sends, inquires, pays, logs in/out, registers or deletes.
import { norm } from './text.js';

// JA is tested on text with ALL whitespace/zero-width characters removed ("購 入" == "購入").
const JA = /購入|購買|注文|今すぐ買|買う|買い物を続|応募|申し込|申込|申請|送信|送付|送る|問い合わせ|問合せ|お問合|問い合せ|資料請求|請求|見積|依頼|相談|予約|エントリー|契約|支払|決済|お会計|会計|レジ|手続き|ログイン|ログアウト|サインイン|サインアップ|退会|解約|削除|会員登録|新規登録|アカウント作成|ご予約|予約を確定|参加する|寄付|チェックアウト/;
const CART_JA = /カートに入れる|カートに追加|カートへ/;
const EN = /\b(buy|bought|purchase|purchases|check ?out|apply|applying|application|submit|sign ?in|sign ?out|sign ?up|log ?in|log ?out|logout|login|register|registration|subscribe|unsubscribe|pay|pays|payment|payments|billing|delete|remove|trash|erase|destroy|send|sending|inquiry|inquire|inquiries|enquiry|enquire|enquiries|contact|book|booking|reserve|reservation|enrol+|donate|confirm|proceed|order|orders|ordering|continue to (?:pay|checkout|order)|complete (?:order|purchase))\b/i;
const EN_CART = /\badd to (?:cart|bag|basket|trolley)\b|\bto (?:cart|basket)\b/i;
const EN_APPLY_FILTER = /\bapply\s+(?:filters?|changes|selection|sort|refinements?)\b/i;
// proxy mode only: a favorite saved here would land on the proxy origin, not in the person's account (policy.noFavorite)
const FAV = /お気に入り|ウォッチ|いいね|キープ|[♡♥❤]|favou?rite|wish ?list|watch ?list|\blike\b/i;
const ZW = /[\u00ad\u200b-\u200f\u2028-\u202f\u2060\ufeff]/g;

/** @returns {string|null} reason when the label is blocked. */
export function blockedLabel(label, { allowCart = false, allow = [], noFavorite = false } = {}) {
  let t = norm(String(label ?? '').replace(ZW, ''));
  if (!t) return null;
  if (allow.some((re) => re.test(t))) return null;
  if (noFavorite && FAV.test(t)) return 'favorite';
  const ja = t.replace(/\s+/g, '');
  // harmless uses of risky words: sorting ("Sort order", "order by"), applying filters
  const en = t.replace(/\bsort(?:ed|ing)?\s+(?:by\s+)?order\b/gi, ' ').replace(/\border\s+by\b/gi, ' ').replace(EN_APPLY_FILTER, ' ');
  if (JA.test(ja) || EN.test(en)) return 'denylist';
  if ((CART_JA.test(ja) || EN_CART.test(en)) && !allowCart) return 'cart';
  return null;
}

const BAD_WORD = '(?:checkout|check-out|cart|basket|login|log-in|signin|sign-in|signup|sign-up|register|registration|logout|log-out|signout|sign-out|order|orders|purchase|buy|payment|pay|billing|apply|application|inquiry|inquire|enquiry|contact|entry|entries|reserve|reservation|booking|delete|remove|unsubscribe|subscribe|account|confirm|send|donate|trash)';
const BAD_PATH = new RegExp(`(^|[/._-])${BAD_WORD}(?=$|[/._-])`, 'i');
const BAD_QUERY = new RegExp(`(?:^|&)(?:action|do|cmd|command|mode|method|op|step|page|view|task)=${BAD_WORD}(?:$|&)`, 'i');
export function blockedHref(href) {
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
export function blockedForm(form, policy = {}) {
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
export function blockedElement(el, policy = {}) {
  if (!el) return null;
  const type = (el.getAttribute?.('type') || '').toLowerCase();
  if (type === 'password') return 'password';
  if (PAY_AC.test(el.getAttribute?.('autocomplete') || '')) return 'payment';
  // typing into a text field is harmless (its label may say 問い合わせ); only the secret/payment checks above apply
  if (el.matches?.('textarea,select,input:not([type=submit]):not([type=button]):not([type=image]):not([type=reset]):not([type=checkbox]):not([type=radio])')) return null;
  // the element itself and the nearest clickable ancestor (a click on a <span> inside a button presses the button)
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
