// Bundles engine + generic agent + recipes + panel into ONE self-contained script (no deps),
// writes web/bookmarklet.js and web/bookmarklet.html (redirect to start.html#login).
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

function syncSwCache() {
  const id = /BUILD_ID\s*=\s*'([^']+)'/.exec(fs.readFileSync(path.join(JS, 'version.js'), 'utf8'))[1];
  const f = path.join(WEB, 'sw.js'); const src = fs.readFileSync(f, 'utf8');
  const out = src.replace(/const CACHE = '[^']*';/, `const CACHE = '${id}';`);
  if (out !== src) fs.writeFileSync(f, out);
}

function main() {
syncSwCache();
const code = bundle();
fs.writeFileSync(path.join(WEB, 'bookmarklet.js'), code);
// minimal percent-encoding keeps the link short (raw UTF-8 is fine in href); newlines must survive as %0A
// bookmarklet.html only forwards old links to the beginner guide; the copy-code logic lives in js/bm.js (shared with start.html)
const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Jevボタンの作りかた</title>
<meta http-equiv="refresh" content="0; url=start.html#login">
<link rel="canonical" href="start.html#login">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<style>body{font:17px/1.7 "Hiragino Sans","Noto Sans JP",system-ui,sans-serif;padding:24px 16px;max-width:560px;margin:0 auto;background:#f5f6f8;color:#161a22}@media(prefers-color-scheme:dark){body{background:#0e111c;color:#f1f3fa}a{color:#9db0ff}}a{display:inline-block;min-height:48px;line-height:48px}</style>
</head>
<body>
<p>ページが移動しました。自動で切りかわらないときは、下をタップしてください。</p>
<p><a href="start.html#login">Jevボタンの作りかたを見る</a></p>
<script>location.replace('start.html#login');</script>
</body>
</html>
`;
fs.writeFileSync(path.join(WEB, 'bookmarklet.html'), html);
console.log(`bookmarklet.js ${code.length} bytes`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main();

