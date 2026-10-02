// Bundles engine + generic agent + recipes + panel into ONE self-contained script (no deps),
// writes web/bookmarklet.js and web/bookmarklet.html (javascript: link, copy button, install steps).
// Usage: node tools/build-bookmarklet.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web');
const JS = path.join(WEB, 'js');
const ENTRY = 'bookmarklet-entry.js';

export function bundle() {
  const order = [], seen = new Set();
  const mods = {};
  const visit = (rel) => {
    if (seen.has(rel)) return; seen.add(rel);
    let src = fs.readFileSync(path.join(JS, rel), 'utf8');
    const names = [];
    const pre = [];
    src = src.replace(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)';?[ \t]*$/gm, (_, list, from) => {
      const dep = path.posix.normalize(path.posix.join(path.posix.dirname(rel), from));
      visit(dep);
      pre.push(`const {${list.trim()}} = __r(${JSON.stringify(dep)});`);
      return '';
    });
    src = src.replace(/^export\s+(async\s+function|function|const|let|class)\s+([A-Za-z0-9_$]+)/gm, (_, kind, name) => { names.push(name); return `${kind} ${name}`; });
    src = src.replace(/^export\s*\{([^}]*)\};?[ \t]*$/gm, (_, list) => { list.split(',').map((x) => x.trim()).filter(Boolean).forEach((n) => names.push(n)); return ''; });
    if (/^\s*(import|export)\s/m.test(src)) throw new Error(`unsupported import/export syntax in ${rel}`);
    mods[rel] = `__d[${JSON.stringify(rel)}] = function () {\n${pre.join('\n')}\n${src}\nreturn {${names.join(', ')}};\n};`;
    order.push(rel);
  };
  visit(ENTRY);
  const css = fs.readFileSync(path.join(WEB, 'css/panel.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  const code = `(function () {\n'use strict';\nconst PANEL_CSS = ${JSON.stringify(css)};\nconst __d = {}, __c = {};\nfunction __r(k) { return __c[k] || (__c[k] = __d[k]()); }\n${order.map((k) => mods[k]).join('\n')}\n__r(${JSON.stringify(ENTRY)});\n})();`;
  // light minification: drop full-line comments and indentation (safe: no multi-line strings depend on it)
  return code.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//')).join('\n');
}

function main() {
const code = bundle();
fs.writeFileSync(path.join(WEB, 'bookmarklet.js'), code);
// minimal percent-encoding keeps the link short (raw UTF-8 is fine in href); newlines must survive as %0A
const href = 'javascript:' + code.replace(/%/g, '%25').replace(/#/g, '%23').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Jev ブックマークレット</title>
<meta name="theme-color" content="#1f4d2b">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<style>
:root { --bg:#f6f6f2; --card:#fff; --text:#1b1f27; --muted:#666; --line:#ddd; --green:#2f7d32; --blue:#2f6bff; --warn:#fff3c4; }
@media (prefers-color-scheme: dark) { :root { --bg:#0e111c; --card:#171b2b; --text:#e8eaf2; --muted:#9aa0b5; --line:#2a2f45; --warn:#3a3215; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:15px/1.7 "Hiragino Sans","Noto Sans JP",system-ui,sans-serif; padding:16px; }
main { max-width:680px; margin:0 auto; }
h1 { font-size:22px; margin:8px 0; } h2 { font-size:17px; margin:0 0 8px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; margin:14px 0; }
.btn { display:inline-flex; align-items:center; justify-content:center; min-height:48px; padding:0 18px; border-radius:10px; border:1px solid var(--line); background:var(--card); color:var(--text); font:inherit; font-weight:700; cursor:pointer; text-decoration:none; }
.btn.primary { background:var(--blue); border-color:var(--blue); color:#fff; }
.row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.warn { background:var(--warn); border-radius:8px; padding:10px 12px; font-size:13px; }
ol { padding-left:22px; margin:8px 0; } li { margin:4px 0; }
code { background:rgba(127,127,127,.18); padding:1px 5px; border-radius:4px; font-size:13px; }
.ok { color:var(--green); font-weight:700; min-height:1.5em; }
a { color:var(--blue); }
</style>
</head>
<body>
<main>
<h1>Jev ブックマークレット</h1>
<p>任意のサイト（例: <code>suumo.jp/sp/</code>、通販・求人サイトなど）の上で Jev パネルを開きます。パネルは「絞り込み」を自動で操作する汎用エンジンで、サイトに合わせたレシピ（suumo.jp 用など）は補助です。</p>
<div class="warn">安全のため、購入・注文・応募・申込・送信・問い合わせ・ログイン・支払い・削除などのボタンは<b>絶対に押しません</b>（ログに「スキップ(安全のため)」と出ます）。suumo.jp 用のレシピは<b>実サイトでの動作未検証</b>です。</div>

<div class="card">
<h2>1. このリンクをブックマークに登録</h2>
<p><a class="btn primary" id="bm" href="${esc(href)}" draggable="true">Jev パネル</a></p>
<p class="row"><button class="btn" id="copy" type="button">コピー</button><span class="ok" id="copied" role="status" aria-live="polite"></span></p>
<textarea id="bm-text" readonly hidden aria-label="ブックマークレットのコード" style="width:100%;height:96px;font-size:16px"></textarea>
<p style="color:var(--muted);font-size:13px">「コピー」はブックマークレットのコードをクリップボードにコピーします（約 ${Math.round(href.length / 1024)} KB）。</p>
</div>

<div class="card">
<h2>iPhone / iPad（Safari）</h2>
<ol>
<li>この画面で「コピー」を押す。</li>
<li>共有ボタン →「ブックマークを追加」で、名前を <code>Jev</code> にして保存。</li>
<li>ブックマーク一覧で保存した「Jev」を長押し →「編集」。</li>
<li>URL欄の中身を全部消して、コピーしたコードを貼り付けて保存。</li>
<li>操作したいサイトを開き、ブックマーク（またはアドレスバー付近のお気に入り）から「Jev」を開く。画面下にパネルが出ます。</li>
</ol>
</div>

<div class="card">
<h2>Android（Chrome）</h2>
<ol>
<li>この画面で「コピー」を押す。</li>
<li>メニュー ⋮ →「☆ ブックマーク」で保存し、保存後にブックマーク一覧から編集。名前は <code>Jev</code>、URL欄にコピーしたコードを貼り付けて保存。</li>
<li>操作したいサイトを開き、アドレスバーに <code>Jev</code> と入力して、候補に出た<b>ブックマーク</b>をタップ（Chrome は貼り付けた <code>javascript:</code> を手入力すると先頭が消えるため、ブックマーク経由で実行します）。</li>
</ol>
</div>

<div class="card">
<h2>使い方</h2>
<ol>
<li>パネルの入力欄に指示を書きます。例: <code>東京 1LDK 10万円以下</code> / <code>価格 5000円以下 評価4以上 レビュー順</code> / <code>年収600万以上 リモート可 エンジニア</code></li>
<li>「スタート」で、画面上のフィルタが自動で操作されます（青いカーソルとログ付き）。</li>
<li>ページ遷移するサイトでは、遷移後にもう一度ブックマークを開くと続きから再開できます。</li>
<li>もう一度ブックマークをタップするとパネルが閉じます。</li>
</ol>
<p style="color:var(--muted);font-size:13px">Jev モード（任意）: パネルの「Jev モード設定」に、あなた自身の AI Gateway キーを入力すると、曖昧な一致をJevに判定させます。キーはその端末の localStorage にのみ保存され、このページやコードには含まれません。</p>
</div>
<p><a href="sites.html">← デモサイト一覧へ</a></p>
</main>
<script>
document.getElementById('copy').addEventListener('click', async () => {
  const code = decodeURIComponent(document.getElementById('bm').getAttribute('href'));
  const kb = '（約 ' + Math.round(code.length / 1024) + ' KB）';
  const done = (t) => { document.getElementById('copied').textContent = t; };
  const ta = document.getElementById('bm-text');
  try { await navigator.clipboard.writeText(code); ta.hidden = true; done('コピーしました。' + kb); }
  catch { ta.value = code; ta.hidden = false; ta.focus(); ta.select(); done('コピーできませんでした。下の文字を全部選んでコピーしてください。' + kb); }
});
document.getElementById('bm').addEventListener('click', (e) => { if (location.protocol !== 'javascript:') { e.preventDefault(); document.getElementById('copied').textContent = 'このページでは実行しません。ブックマークに登録してください'; } });
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(WEB, 'bookmarklet.html'), html);
console.log(`bookmarklet.js ${code.length} bytes; link ${href.length} chars`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main();

