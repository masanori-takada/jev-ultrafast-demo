// Extension e2e: loads extension/ unpacked in chromium, clicks the toolbar action, asserts the docked panel and a generic run.
// If extension loading is impossible in this environment it falls back to injecting extension/panel.js via addScriptTag (and says so).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, chromePath } from './pw.mjs';
import { startServer } from './serve.mjs';
import { buildExtension } from '../tools/build-extension.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'extension');
buildExtension();
// A synthetic action click cannot grant activeTab, so the TEST copy of the extension additionally gets a host permission for
// the local fixture server. The shipped manifest (activeTab + scripting only) is checked in the unit tests.
const EXT = fs.mkdtempSync(path.join(os.tmpdir(), 'jev-ext-src-'));
fs.cpSync(SRC, EXT, { recursive: true });
const mf = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8')); mf.host_permissions = ['http://127.0.0.1/*'];
fs.writeFileSync(path.join(EXT, 'manifest.json'), JSON.stringify(mf));
const PORT = 4174, BASE = `http://127.0.0.1:${PORT}`;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL:', m); } };
const server = await startServer(PORT);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jev-ext-'));
const ctx = await chromium.launchPersistentContext(dir, {
  executablePath: chromePath(), headless: false, viewport: { width: 1180, height: 820 },
  args: ['--headless=new', '--no-sandbox', `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});
let sw = ctx.serviceWorkers()[0];
if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 8000 }).catch(() => null);
const viaExtension = !!sw;
console.log(viaExtension ? 'extension service worker loaded: ' + sw.url() : 'NOTE: extension did not load; using addScriptTag fallback');
const hasPanel = (page) => page.evaluate(() => !!document.getElementById('jev-root'));
const inShadow = (page, fn, arg) => page.evaluate(([f, a]) => { const r = document.getElementById('jev-root').shadowRoot; return new Function('r', 'a', f)(r, a); }, [fn, arg]);

async function click(page) {
  if (viaExtension) {
    await page.bringToFront();
    await sw.evaluate(async () => { const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true }); await jevToggle(t); }).catch(() => {});
  } else {
    await page.evaluate(() => { globalThis.__JEV_EXT__ = true; });
    if (await hasPanel(page)) await page.evaluate(() => document.getElementById('jev-root').remove());
    else await page.addScriptTag({ path: path.join(EXT, 'panel.js') });
  }
}

for (const f of ['realestate.html', 'shop.html']) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/__fixtures__/${f}`);
  ok(!(await hasPanel(page)), `${f}: no panel before click`);
  await click(page);
  await page.waitForFunction(() => !!document.getElementById('jev-root'), null, { timeout: 5000 }).catch(() => {});
  ok(await hasPanel(page), `${f}: panel appears after action click`);
  if (await hasPanel(page)) {
    const box = await inShadow(page, 'const b=r.querySelector("#panel").getBoundingClientRect();return [r.querySelector("#panel").dataset.dock,Math.round(b.right),Math.round(b.width),Math.round(b.height)]');
    ok(box[0] === 'right' && box[1] >= 1160 && box[2] === 380 && box[3] === 820, `${f}: docked right column ${JSON.stringify(box)}`);
    ok((await inShadow(page, 'return r.querySelector("#tab-ro").textContent')).includes('127.0.0.1'), `${f}: shows tab title/href`);
    if (f === 'realestate.html') {
      await page.locator('#prompt').fill('Tokyo 1LDK 10万円以下');
      await page.locator('#btn-start').click();
      await page.waitForFunction(() => /完了|エラー/.test(document.getElementById('jev-root').shadowRoot.querySelector('#status').textContent), null, { timeout: 20000 }).catch(() => {});
      ok(await page.evaluate(() => [area.value, layout.value, rent.value].join('|')) === '東京都|1LDK|10万円', 'realestate: generic run set filters');
    }
    await click(page);
    await page.waitForTimeout(300);
    ok(!(await hasPanel(page)), `${f}: second click closes panel`);
  }
  await page.close();
}
await ctx.close(); server.close(); fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(EXT, { recursive: true, force: true });
console.log(`ext: ${pass} passed, ${fail} failed (${viaExtension ? 'real extension load' : 'addScriptTag fallback'})`);
process.exit(fail ? 1 : 0);
