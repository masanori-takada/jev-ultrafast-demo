// Wiring: panel UI + engine + adapter. Shared by the demo pages and the bookmarklet.
import { createEngine, normText } from './engine.js';
import { mountPanel } from './panel.js';
import { pickAdapter } from './adapters/index.js';
import { decodePrompt } from './config.js';

export const PRESET_PROMPTS = {
  mamazon: 'Mamazonで「ノートパソコン」を探す。価格 100000円以下、評価4以上、「価格の安い順」で並び替える。購入はしない。',
  form: 'Personal Formで、氏名=「山田 太郎」、フリガナ=「ヤマダ タロウ」、メールアドレス=「taro@example.com」、電話番号=「09012345678」、生年月日=「1990-01-15」、都道府県=「東京都」、住所=「千代田区架空1-2-3」、職業=「会社員」、希望する連絡方法=「メール」、興味のあるテーマ=「生成AI」、「入力内容を確認しました」にチェックして「送信（デモ）」を押す。備考は空欄のまま。「架空の個人情報をコピーする」は押さない。',
};

const wordsOf = (...xs) => xs.flatMap((x) => String(x || '').split(/[\s.\-_/:|—]+/)).filter((w) => w.length > 1);

/** @param {{host:Element, mode:'demo'|'bookmarklet', adapter?:object, ctx?:object, css?:string, onClose?:Function, promptFor?:Function}} o */
export function startApp(o) {
  // inside the rewriting proxy the real site is o.proxyHost (location.hostname is the proxy's)
  const siteHost = o.proxyHost || location.hostname;
  const adapter = o.adapter || pickAdapter(siteHost, globalThis.JEV_ADAPTER);
  const panel = mountPanel(o.host, { mode: o.mode, css: o.css, onClose: o.onClose, dock: o.dock, proxyHost: o.proxyHost, appSrc: o.appSrc });
  const hash = (location.hash.match(/preset=(\w+)/) || [])[1];
  const initial = (hash && PRESET_PROMPTS[hash]) || (hash === 'suumoja' && adapter.defaultPrompt) || adapter.defaultPrompt;
  panel.setPrompt(initial);
  // handed over by the app's 開く: prefill ONCE, drop the hash, never auto-start
  let autoStart = false;
  if (o.mode === 'bookmarklet') {
    const m = /^#jev-prompt=([A-Za-z0-9_-]*)(&jev-auto=1)?$/.exec(location.hash);
    if (m) {
      autoStart = !!m[2];
      const t = decodePrompt(m[1]); if (t) panel.setPrompt(t);
      try { history.replaceState(history.state, '', location.pathname + location.search); } catch { /* ignore */ }
    }
  }
  const persistKey = adapter.id === 'demo' ? null : `jev.pending.${siteHost}`;
  const eng = createEngine({ panel, shield: adapter.shield, persistKey, noFavorite: !!o.proxyHost });
  const ctx = { hints: adapter.hints || {}, get jevKey() { return panel.getKey(); }, fetchFn: (...a) => fetch(...a), site: o.ctx?.site };
  // site-name words (e.g. 'Mamazonで…') are not search terms
const ignore = [...wordsOf(siteHost, document.title), 'Mamazon', 'Personal', 'Form', 'SUUMO', 'SUUMOじゃ', 'スーモジャ'];
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
  // once per navigation (the hash is already gone); the engine's safety denylist is unchanged
  if (autoStart) setTimeout(() => panel.el.start.click(), 400);
  return { panel, eng, adapter };
}
export { normText };
