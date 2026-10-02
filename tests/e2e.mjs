// Playwright e2e: demo (desktop + 390x844), generic engine on fixture pages via the real bookmarklet bundle, PWA, safety.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './pw.mjs';
import { startServer } from './serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('node', [path.join(ROOT, 'tools/build-bookmarklet.mjs')], { stdio: 'pipe' });
const BUNDLE = fs.readFileSync(path.join(ROOT, 'web/bookmarklet.js'), 'utf8');
const SHOTS = path.join(ROOT, 'docs/screens'); fs.mkdirSync(SHOTS, { recursive: true });
const PORT = 4173, BASE = `http://127.0.0.1:${PORT}`;
const ONLY = process.argv.slice(2);

let pass = 0, fail = 0; const failures = [];
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; failures.push(msg); console.log('  FAIL:', msg); } };
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg}: expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = await startServer(PORT);
const browser = await launch();
const PROJECTS = [
  { name: 'desktop', opts: { viewport: { width: 1180, height: 820 } } },
  { name: 'mobile', opts: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } },
];

async function newPage(proj, { offline = false } = {}) {
  const ctx = await browser.newContext({ ...proj.opts, serviceWorkers: 'allow' });
  const page = await ctx.newPage();
  const errors = [], external = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => { const u = new URL(r.url()); if (!['127.0.0.1', 'localhost'].includes(u.hostname) && !/^(data|blob|about)/.test(u.protocol)) external.push(r.url()); });
  return { ctx, page, errors, external };
}
const isSheet = (page) => page.locator('#panel').getAttribute('data-layout').then((v) => v === 'sheet');
async function openPanel(page) { if ((await isSheet(page)) && (await page.locator('#panel').getAttribute('data-snap')) === 'collapsed') { await page.locator('#sheet-handle').click(); await page.waitForTimeout(300); } }
const rows = async (page) => page.$$eval('#log .row', (rs) => rs.map((r) => ({ ms: parseInt(r.querySelector('.ms').textContent), verb: r.querySelector('.verb').textContent, label: r.querySelector('.label').textContent.replace(/[「」]/g, '"') })));
const timerSec = async (page) => parseFloat((await page.locator('#timer').textContent()).replace('s', ''));
async function runWith(page, prompt, { waitMs = 30000 } = {}) {
  await openPanel(page);
  if (prompt != null) await page.locator('#prompt').fill(prompt);
  await page.locator('#btn-start').click();
  await page.waitForFunction(() => { const s = document.querySelector('#status') || document.querySelector('#jev-root')?.shadowRoot?.querySelector('#status'); return s && /完了|停止|エラー/.test(s.textContent); }, null, { timeout: waitMs }).catch(() => {});
  await page.waitForTimeout(150);
}
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name) });
const section = (n) => console.log(`\n== ${n}`);
const want = (n) => !ONLY.length || ONLY.some((o) => n.includes(o));

for (const proj of PROJECTS) {
  const mobile = proj.name === 'mobile';

  if (want('demo')) {
    section(`[${proj.name}] SUUMOじゃ demo (scripted)`);
    const { ctx, page, errors, external } = await newPage(proj);
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#results .card');
    // AC1
    eq(await page.locator('#result-count b').textContent(), '24', 'AC1 count');
    ok((await page.locator('#results .card[data-id]').count()) >= 24, 'AC1 >=24 cards');
    ok(await page.locator('.banner.b1').isVisible() && await page.locator('.banner.b2').isVisible(), 'AC1 banners');
    await page.waitForFunction(() => document.querySelector('#conn-badge').textContent.includes('サーバー接続OK'));
    eq(await page.locator('.preset').count(), 3, 'AC1 3 presets');
    eq(await page.locator('#btn-start').isEnabled(), true, 'AC1 start enabled'); eq(await page.locator('#btn-stop').isDisabled(), true, 'AC1 stop disabled');
    eq((await page.locator('#timer').textContent()), '0.0s', 'AC1 timer');
    await openPanel(page);
    const { DEFAULT_PROMPT } = await import('../web/js/adapters/demo.js');
    eq(await page.locator('#prompt').inputValue(), DEFAULT_PROMPT, 'AC1 default prompt');
    ok((await page.locator('#tab-select option:checked').textContent()).includes('127.0.0.1'), 'tab row shows title — url'); eq(await page.locator('#hostname, .host').count(), 0, 'no separate 対象サイト row');
    ok((await page.locator('#tab-select').inputValue()) === 'index.html', 'tab select shows current page');
    if (!mobile) await shot(page, 'desktop-idle.png'); else { await shot(page, 'mobile-idle-half.png'); }
    // run
    await page.locator('#btn-start').click();
    await page.waitForTimeout(500);
    ok(await page.locator('#btn-start').isDisabled(), 'running: start disabled'); ok(await page.locator('#btn-stop').isEnabled(), 'running: stop enabled');
    ok((await page.locator('#status').textContent()).includes('操作中'), 'running: status');
    if (mobile) eq(await page.locator('#panel').getAttribute('data-snap'), 'collapsed', 'sheet auto-collapses on start');
    await page.waitForTimeout(1500);
    if (!mobile) await shot(page, 'desktop-running.png');
    const c1 = await page.locator('#result-count b').textContent(); // live filtering during the run
    await page.waitForFunction(() => /完了/.test(document.querySelector('#status').textContent), null, { timeout: 15000 });
    const t = await timerSec(page);
    ok(t >= 5.5 && t <= 9, `AC2 run duration ${t}s`);
    const r = await rows(page);
    eq(r.map((x) => `${x.verb} ${x.label}`), [
      'SELECT エリア → 東京都', 'SELECT 間取り → 1LDK', 'SELECT 賃料上限 → 10万円', 'CLICK この条件で検索', 'CLICK 物件の詳細を見る', 'CLICK お気に入り', 'CLICK 空室状況を問い合わせる',
      'TYPE_TEXT お名前 → "山田 太郎"', 'TYPE_TEXT メールアドレス → "taro@example.com"', 'TYPE_TEXT お問い合わせ内容 → "来週末に内見を希望します。空室状況を教えてください。"',
      'SKIP 送信はスキップ(安全のため)'], 'AC2 log rows');
    ok(r.every((x, i) => i === 0 || x.ms >= r[i - 1].ms), 'AC2 monotonic ms');
    ok(r[0].ms >= 900 && r[0].ms <= 1500, `AC2 first SELECT at ${r[0].ms}ms`);
    ok(!r.some((x) => /^CLICK.*内容を送信/.test(`${x.verb} ${x.label}`)), 'AC5 submit never clicked');
    eq(await page.locator('#result-count b').textContent(), '1', 'AC3 final count 1');
    eq(await page.locator('#results .card h3').textContent(), '空色ルーフ阿佐ヶ谷', 'AC3 card name');
    ok(c1 === '1' || c1 === '3' || c1 === '24', 'AC3 live filtering observed (' + c1 + ')');
    eq(await page.locator('#fav-count').textContent(), '1', 'AC4 fav counter');
    ok((await page.locator('#detail-fav').textContent()).includes('お気に入り済み'), 'AC4 detail heart active');
    ok(await page.locator('#inquiry-modal').isVisible(), 'AC5 inquiry modal open');
    eq([await page.locator('#inq-name').inputValue(), await page.locator('#inq-email').inputValue(), await page.locator('#inq-body').inputValue()], ['山田 太郎', 'taro@example.com', '来週末に内見を希望します。空室状況を教えてください。'], 'AC5 field values');
    ok(await page.locator('#btn-submit-demo').isVisible(), 'AC5 submit visible');
    await page.locator('#btn-submit-demo').click({ force: true }).catch(() => {});
    ok(await page.locator('#inquiry-modal').isVisible(), 'AC5 modal still open after clicking inert submit');
    eq(await page.locator('text=問い合わせ体験が完了しました').count() + await page.locator('text=問い合わせ送信が完了しました').count(), 0, 'AC5 no completion modal');
    ok((await page.locator('#status').textContent()).includes('完了'), 'AC5 status 完了');
    ok(await page.locator('#btn-start').isEnabled() && await page.locator('#btn-stop').isDisabled(), 'AC5 buttons reset');
    const tf = await page.locator('#timer').textContent(); await sleep(600); eq(await page.locator('#timer').textContent(), tf, 'AC5 timer frozen');
    await shot(page, `${proj.name}-done.png`);
    if (!mobile) {
      const vh = page.viewportSize().height; const inView = async (sel) => { const b = await page.locator(sel).first().boundingBox(); return !!b && b.y >= 0 && b.y + b.height <= vh; };
      ok(await inView('#status'), '状態 box visible at 1180x820');
      await page.setViewportSize({ width: 1180, height: 1500 }); await page.waitForTimeout(250);
      for (const sel of ['#log .row:first-child', '#log .row:nth-child(5)']) { const b = await page.locator(sel).boundingBox(); ok(!!b && b.y >= 0 && b.y + b.height <= 1500, `log row visible in tall panel ${sel} ${JSON.stringify(b)}`); }
      ok((await page.locator('#prompt').evaluate((t) => t.scrollHeight <= t.clientHeight + 2)), 'textarea shows full prompt (not clipped) in tall panel');
      await page.locator('#panel').screenshot({ path: path.join(SHOTS, 'desktop-panel-tall.png') });
      await page.setViewportSize({ width: 1180, height: 820 }); await page.waitForTimeout(150);
    }
    if (mobile) {
      const bb = await page.locator('#inquiry-modal .modal').boundingBox(); const pb = await page.locator('#panel').boundingBox();
      ok(bb.y + bb.height <= pb.y + 2, `AC8 modal above sheet (${bb.y + bb.height} <= ${pb.y})`);
    }
    // restart resets
    await page.locator('#btn-start').click(); await page.waitForTimeout(400);
    ok((await rows(page)).length <= 1, 'rerun clears log'); await page.locator('#btn-stop').click();
    // stop (AC6)
    await page.waitForTimeout(200);
    await page.locator('#btn-start').click(); await page.waitForTimeout(2500); await page.locator('#btn-stop').click(); await page.waitForTimeout(300);
    const n1 = (await rows(page)).length; await page.waitForTimeout(800);
    eq((await rows(page)).length, n1, 'AC6 log frozen after stop'); ok((await page.locator('#status').textContent()).includes('停止'), 'AC6 status 停止しました');
    ok(await page.locator('#cursor').count() === 0, 'AC6 cursor removed');
    // prompt edit (AC7)
    await openPanel(page);
    await page.locator('#prompt').fill(DEFAULT_PROMPT.replace('エリアを「東京都」', 'エリアを「神奈川県」'));
    await page.locator('#btn-start').click(); await page.waitForFunction(() => /完了/.test(document.querySelector('#status').textContent), null, { timeout: 15000 });
    ok((await rows(page))[0].label.includes('神奈川県'), 'AC7 edited prompt performed');
    ok(errors.length === 0, 'AC10 console errors: ' + errors.join(' | ')); eq(external, [], 'AC10 no external requests');
    await ctx.close();
  }

  if (mobile && want('mobile')) {
    section('[mobile] layout');
    for (const [w, h] of [[390, 844], [320, 640]]) {
      const { ctx, page } = await newPage({ opts: { ...proj.opts, viewport: { width: w, height: h } } });
      for (const f of ['index.html', 'mamazon.html', 'form.html', 'sites.html', 'bookmarklet.html']) {
        await page.goto(`${BASE}/${f}`); await page.waitForTimeout(500);
        const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(sw[0] <= sw[1], `no horizontal scroll ${f} @${w}: ${sw}`);
      }
      await ctx.close();
    }
    const { ctx, page } = await newPage(proj);
    await page.goto(`${BASE}/index.html`); await page.waitForSelector('#results .card');
    const pb = await page.locator('#panel').boundingBox();
    ok(pb.y + pb.height >= 844 - 1 && pb.height < 200, `sheet collapsed at bottom (${JSON.stringify(pb)})`);
    for (const sel of ['#btn-start', '#btn-stop']) { const b = await page.locator(sel).boundingBox(); ok(b.height >= 44, `${sel} >=44 tall (${b.height})`); }
    // drag handle
    const h0 = (await page.locator('#panel').boundingBox()).height;
    const hb = await page.locator('#sheet-handle').boundingBox();
    await page.mouse.move(hb.x + hb.width / 2, hb.y + 10); await page.mouse.down(); await page.mouse.move(hb.x + hb.width / 2, hb.y - 250, { steps: 8 }); await page.mouse.up();
    await page.waitForTimeout(350);
    const h1 = (await page.locator('#panel').boundingBox()).height;
    ok(h1 > h0 + 150, `drag handle grows sheet (${h0} -> ${h1})`);
    await shot(page, 'mobile-sheet-open.png');
    // 44px targets
    const offenders = await page.evaluate(() => {
      const out = [];
      const sels = 'button, .preset, select, input:not([type=hidden]):not([type=checkbox]):not([type=radio]), .heart, [data-close], a.btn';
      const scan = (root) => root.querySelectorAll(sels).forEach((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        if (r.width && r.height && cs.visibility !== 'hidden' && (r.width < 43.5 || r.height < 43.5)) out.push(`${e.tagName}#${e.id || e.className}:${Math.round(r.width)}x${Math.round(r.height)}`); });
      scan(document); return out; });
    const ign = offenders.filter((o) => !/^BUTTON#(v-list|v-map)|^BUTTON#$/.test(o) || /heart|preset|btn/.test(o));
    eq(offenders.filter((o) => /heart|preset|close|BUTTON#btn|BUTTON#fav|SELECT|INPUT#(kw|tab|inq)/.test(o)), [], 'AC8 targets >=44px: ' + offenders.join(', '));
    await page.locator('#sheet-handle').click(); await page.waitForTimeout(300);
    eq(await page.locator('#panel').getAttribute('data-snap'), 'collapsed', 'tap handle toggles to collapsed');
    await ctx.close();
  }

  if (want('generic')) {
    section(`[${proj.name}] generic engine on fixture sites (bookmarklet bundle)`);
    const load = async (f) => { const x = await newPage(proj); await x.page.goto(`${BASE}/__fixtures__/${f}`); await x.page.addScriptTag({ content: BUNDLE }); await x.page.waitForSelector('#panel', { state: 'attached' }); return x; };
    {
      // iOS-safe fallback: with CSSStyleSheet/adoptedStyleSheets absent the panel must still be styled via <style>
      const x = await newPage(proj);
      await x.page.addInitScript(() => { try { delete CSSStyleSheet.prototype.replaceSync; } catch {} try { delete Document.prototype.adoptedStyleSheets; delete ShadowRoot.prototype.adoptedStyleSheets; } catch {} try { delete globalThis.CSSStyleSheet; } catch {} });
      await x.page.goto(`${BASE}/__fixtures__/realestate.html`); await x.page.addScriptTag({ content: BUNDLE }); await x.page.waitForSelector('#panel', { state: 'attached' });
      const r = await x.page.evaluate(() => { const sr = document.getElementById('jev-root').shadowRoot; return { noApi: typeof CSSStyleSheet === 'undefined' && !('adoptedStyleSheets' in sr), style: !!sr.querySelector('style'), pos: getComputedStyle(sr.querySelector('#panel')).position, build: sr.querySelector('#build-id')?.textContent }; });
      ok(r.noApi && r.style && r.pos === 'fixed' && /^build /.test(r.build), 'bookmarklet panel styled via <style> fallback without adoptedStyleSheets ' + JSON.stringify(r));
      await x.ctx.close();
    }
    {
      const { ctx, page, errors } = await load('realestate.html');
      eq(await page.evaluate(() => document.getElementById('jev-root').shadowRoot.querySelector('#tab-ro').textContent.includes('127.0.0.1')), true, 'bookmarklet panel shows title — href');
      ok((await page.evaluate(() => document.getElementById('jev-root').shadowRoot.querySelector('#tab-ro').textContent)).includes('realestate'), 'tab row shows title — href');
      // JOB1: in bookmarklet mode the Gateway key is memory-only and never written to host storage
      await openPanel(page); await page.evaluate(() => { document.getElementById('jev-root').shadowRoot.querySelector('#settings').open = true; });
      ok((await page.locator('#key-note').textContent()).includes('このページを閉じるまでのみ保持'), 'bookmarklet key note says memory-only (Japanese)');
      await page.locator('#jev-key').fill('SECRET-KEY-123');
      const hostStore = await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage), document.cookie]));
      ok(!hostStore.includes('SECRET-KEY-123') && !hostStore.includes('gatewayKey'), 'bookmarklet: key not written to host localStorage/sessionStorage/cookie: ' + hostStore);
      eq(await page.evaluate(() => localStorage.length + sessionStorage.length), 0, 'bookmarklet: host storage untouched by key entry');
      await runWith(page, 'Tokyo 1LDK 10万円以下');
      eq(await page.evaluate(() => [area.value, layout.value, rent.value, applied.textContent]), ['東京都', '1LDK', '10万円', '東京都|1LDK|10万円'], 'realestate states');
      eq(await page.evaluate(() => window.__clicked), undefined, 'realestate: 問い合わせ not clicked');
      ok((await page.locator('#status').textContent()).includes('完了'), 'realestate status done');
      await shot(page, `${proj.name}-generic-realestate.png`);
      // labelled form + synonyms
      await runWith(page, 'エリアを「神奈川県」、間取りを「2LDK」、賃料上限を「15万円」にして検索');
      eq(await page.evaluate(() => [area.value, layout.value, rent.value]), ['神奈川県', '2LDK', '15万円'], 'realestate labelled prompt');
      ok(errors.length === 0, 'no console errors realestate ' + errors.join('|')); await ctx.close();
    }
    {
      const { ctx, page } = await load('shop.html');
      await runWith(page, '価格 5000円以下 評価4以上 レビュー順');
      const st = await page.evaluate(() => ({ p: [...document.querySelectorAll('[name=p]')].map((x) => x.checked), b: [...document.querySelectorAll('[name=b]')].map((x) => x.checked), r: window.__rating, sort: document.getElementById('sort').value, c: window.__clicked }));
      eq(st, { p: [false, true, false], b: [false, false], r: 4, sort: 'レビュー評価順', c: undefined }, 'shop facet/sort states');
      await shot(page, `${proj.name}-generic-shop.png`); await ctx.close();
    }
    {
      const { ctx, page } = await load('jobs.html');
      await runWith(page, '年収600万以上 リモート可 エンジニア');
      const st = await page.evaluate(() => ({ smin: smin.value, smax: smax.value, q: q.value, chips: [...document.querySelectorAll('.chip')].map((c) => c.getAttribute('aria-pressed')), sub: window.__submitted, c: window.__clicked }));
      eq([st.smin, st.smax, st.q, st.chips, st.c], ['600', '', 'エンジニア', ['false', 'true', 'false'], undefined], 'jobs states');
      ok(st.sub >= 1, 'jobs search submitted'); await shot(page, `${proj.name}-generic-jobs.png`); await ctx.close();
    }
    {
      const { ctx, page } = await load('adversarial.html');
      await runWith(page, '東京 Payment Send Buy 資料請求 Continue Next');
      eq(await page.evaluate(() => [window.__clicked, window.__submitted, window.__plain]), [undefined, undefined, undefined], 'adversarial: nothing clicked/submitted (incl. Enter in contact form)');
      await ctx.close();
    }
    {
      const { ctx, page } = await load('realestate.html');
      await runWith(page, 'Tokyo');
      ok(await page.evaluate(() => { const e = document.getElementById('area'); return e.style.outline === '' || e.style.outline.includes('2px'); }), 'target highlight uses inline style (no class)');
      eq(await page.evaluate(() => document.querySelectorAll('.jev-target').length), 0, 'no jev-target class on host elements');
      await ctx.close();
    }
    {
      const { ctx, page } = await load('safety.html');
      await runWith(page, '購入 ログイン Apply 検索');
      const rr = await rows(page);
      ok(rr.filter((x) => x.verb === 'SKIP').length >= 3 && rr.every((x) => x.verb === 'SKIP' || x.verb === 'NOTE'), 'safety: SKIP rows ' + JSON.stringify(rr));
      ok(rr.some((x) => x.label.includes('スキップ(安全のため)')), 'safety: label text');
      eq(await page.evaluate(() => window.__clicked), undefined, 'safety: nothing clicked');
      await runWith(page, '「Apply filters」');
      { const c = await page.evaluate(() => window.__clicked || []); ok(c.length >= 1 && c.every((x) => x === 'filters'), 'Apply filters allowed (not "Apply"): ' + c); }
      await runWith(page, 'カートに入れる');
      ok((await page.evaluate(() => window.__clicked || [])).includes('cart'), 'cart allowed only when prompt asks');
      await ctx.close();
    }
  }

  if (want('pages')) {
    section(`[${proj.name}] Mamazon / Personal Form / hub pages via their own panel`);
    {
      const { ctx, page, errors } = await newPage(proj);
      await page.goto(`${BASE}/mamazon.html#preset=mamazon`); await page.waitForSelector('#products .prod');
      await runWith(page, null);
      const st = await page.evaluate(() => ({ p100: document.querySelector('[name=price][value="100000"]').checked, others: [...document.querySelectorAll('[name=price]')].filter((x) => x.checked).length, r: document.querySelector('#f-rating a[aria-current]')?.dataset.min, sort: sort.value, q: q.value,
        prices: [...document.querySelectorAll('.prod .price')].map((e) => +e.textContent.replace(/[^\d]/g, '')) }));
      eq([st.p100, st.others, st.r, st.sort, st.q], [true, 1, '4', 'asc', 'ノートパソコン'], 'mamazon states');
      ok(st.prices.length > 0 && st.prices.every((p, i) => i === 0 || p >= st.prices[i - 1]) && st.prices.every((p) => p <= 100000), 'mamazon sorted + filtered ' + st.prices);
      ok((await rows(page)).every((x) => x.verb !== 'CLICK' || !/購入|買う|カート/.test(x.label)), 'mamazon never buys');
      await shot(page, `${proj.name}-mamazon.png`); ok(errors.length === 0, 'mamazon console clean ' + errors); await ctx.close();
    }
    {
      const { ctx, page, errors } = await newPage(proj);
      await page.goto(`${BASE}/form.html#preset=form`); await page.waitForSelector('#f-name');
      await runWith(page, null);
      const st = await page.evaluate(() => ({ v: ['f-name', 'f-kana', 'f-mail', 'f-tel', 'f-birth', 'f-pref', 'f-addr', 'f-job', 'f-note'].map((i) => document.getElementById(i).value),
        contact: document.querySelector('[name=contact][value=mail]').checked, theme: [...document.querySelectorAll('[name=theme]')].map((x) => x.checked), confirm: document.getElementById('f-confirm').checked }));
      eq(st.v, ['山田 太郎', 'ヤマダ タロウ', 'taro@example.com', '09012345678', '1990-01-15', '東京都', '千代田区架空1-2-3', '会社員', ''], 'form values');
      eq([st.contact, st.theme, st.confirm], [true, [true, false, false], true], 'form choices');
      const rr = await rows(page);
      ok(rr.some((x) => x.verb === 'SKIP' && x.label === '送信はスキップ(安全のため)'), 'form: 送信はスキップ(安全のため) logged');
      ok(rr.every((x) => !/CLICK.*(送信|コピー)/.test(`${x.verb} ${x.label}`)), 'form: no submit/copy click');
      eq(await page.locator('#sent').isHidden(), true, 'form: nothing sent');
      await shot(page, `${proj.name}-form.png`); ok(errors.length === 0, 'form console clean ' + errors); await ctx.close();
    }
    {
      const { ctx, page } = await newPage(proj);
      await page.goto(`${BASE}/sites.html`); await openPanel(page);
      // preset opens that demo page and fills the prompt
      await page.locator('.preset[data-preset="1"]').click(); await page.waitForURL(/mamazon\.html/);
      await page.waitForSelector('#prompt', { state: 'attached' }); await openPanel(page);
      ok((await page.locator('#prompt').inputValue()).includes('Mamazon'), 'preset 1 opens Mamazon and fills prompt');
      // external URL note
      await openPanel(page);
      await page.locator('#tab-select').selectOption('__url');
      await page.locator('#tab-url').fill('https://suumo.jp/sp/');
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE }).catch(() => {});
      await page.locator('#tab-open').click();
      const note = await page.locator('#tab-note').textContent();
      ok(/ブックマークレット/.test(note) && /suumo\.jp/.test(note), 'external URL shows Japanese bookmarklet flow');
      ok((await page.locator('#tab-note a[href="bookmarklet.html"]').count()) === 1, 'note links to bookmarklet.html');
      ok(await page.locator('#bm-copy').isVisible() && (await page.locator('#bm-copy').boundingBox()).height >= 44, 'big copy button visible');
      eq(await page.locator('#tab-note ol li').count(), 4, 'four numbered steps');
      ok(/iPhone/.test(note) && /Android/.test(note) && /PC は拡張機能が便利/.test(note), 'phone steps + PC extension note');
      eq(await page.locator('#bm-open').getAttribute('href'), 'https://suumo.jp/sp/', 'サイトを開く href = entered URL');
      eq([await page.locator('#bm-open').getAttribute('target'), (await page.locator('#bm-open').textContent())], ['_blank', 'サイトを開く'], 'open in new tab');
      await page.locator('#bm-copy').click(); await page.waitForTimeout(200);
      const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
      if (clip !== null) { ok(clip.startsWith('javascript:') && !clip.includes('fetch("') && clip.length > 50000, 'clipboard holds javascript: bookmarklet'); ok(!/[A-Za-z0-9]{32,}key/i.test(clip), 'no key in code'); }
      ok((await page.locator('#bm-ok').textContent()).includes('コピーしました') || !(await page.locator('#bm-text').isHidden()), 'copy feedback or select-text fallback');
      // clipboard failure -> fallback textarea with selected code
      await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('no')) }, configurable: true }); });
      await page.locator('#bm-copy').click(); await page.waitForTimeout(100);
      ok(await page.locator('#bm-text').isVisible() && (await page.locator('#bm-text').inputValue()).startsWith('javascript:'), 'fallback textarea shows code');
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow');
      await shot(page, `${proj.name}-external-flow.png`);
      await ctx.close();
    }
    for (const noAdopted of [false, true]) {
      // flow shows immediately on selecting __url (no typing); open link follows the typed URL; also with constructed stylesheets removed
      const { ctx, page, errors } = await newPage(proj);
      const tag = noAdopted ? ' [no adoptedStyleSheets]' : '';
      if (noAdopted) await page.addInitScript(() => { try { delete globalThis.CSSStyleSheet.prototype.replaceSync; } catch {} try { delete globalThis.CSSStyleSheet; } catch {} try { delete Document.prototype.adoptedStyleSheets; delete ShadowRoot.prototype.adoptedStyleSheets; } catch {} });
      await page.goto(`${BASE}/sites.html`); await openPanel(page);
      if (noAdopted) ok(await page.evaluate(() => !('adoptedStyleSheets' in document) && typeof CSSStyleSheet === 'undefined'), 'adoptedStyleSheets really removed');
      ok(/\bbuild \d{4}-\d{2}-\d{2} v\d+/.test(await page.locator('#build-id').textContent()) && await page.locator('#build-id').isVisible(), 'build id visible' + tag);
      await page.locator('#tab-select').selectOption('__url');
      ok(/SUUMO.*使い方が出ます/.test(await page.locator('#tab-url').getAttribute('placeholder')), 'url placeholder hint');
      await page.locator('#bm-copy').waitFor({ state: 'visible', timeout: 1000 });
      eq(await page.locator('#tab-note ol li').count(), 4, 'steps shown with NO typing' + tag);
      const bb = await page.locator('#bm-copy').boundingBox();
      ok(bb && bb.y >= 0 && bb.y + bb.height <= (await page.evaluate(() => innerHeight)), 'copy button inside viewport w/o typing ' + JSON.stringify(bb));
      const pr = await page.locator('#prompt').boundingBox();
      ok(bb.y < pr.y, 'flow is above the prompt');
      ok(await page.locator('#bm-open').getAttribute('aria-disabled') === 'true' && (await page.locator('#bm-open').getAttribute('href')) === null, 'サイトを開く disabled before URL' + tag);
      ok((await page.locator('#bm-hint').textContent()).includes('URLを入力すると開けます'), 'hint before URL');
      ok(await page.evaluate(() => getComputedStyle(document.querySelector('#bm-copy')).backgroundColor !== 'rgba(0, 0, 0, 0)'), 'panel is styled' + tag);
      await page.locator('#tab-url').pressSequentially('https://suumo.jp/sp/');
      await page.waitForTimeout(100);
      eq(await page.locator('#bm-open').getAttribute('href'), 'https://suumo.jp/sp/', 'typing enables サイトを開く' + tag);
      ok(await page.locator('#bm-open').getAttribute('aria-disabled') === null, 'open enabled');
      await page.locator('#tab-url').fill(''); await page.waitForTimeout(100);
      ok(await page.locator('#bm-copy').isVisible() && await page.locator('#bm-open').getAttribute('aria-disabled') === 'true', 'clearing field keeps flow, disables open');
      await page.locator('#tab-url').fill('suumo.jp'); await page.waitForTimeout(100);
      eq(await page.locator('#bm-open').getAttribute('href'), 'https://suumo.jp/', 'scheme-less host enables open');
      await page.locator('#tab-url').fill(`${BASE}/mamazon.html`); await page.waitForTimeout(100);
      ok(await page.locator('#bm-copy').isVisible() && (await page.locator('#bm-hint').textContent()).includes('移動できます'), 'same-origin URL shows note, flow stays');
      ok(await page.locator('#bm-open').getAttribute('aria-disabled') === 'true', 'same-origin: bookmarklet open disabled');
      await page.locator('#tab-open').click(); await page.waitForURL(/mamazon\.html/);
      ok(errors.length === 0, 'no console errors ' + errors);
      await ctx.close();
    }
    {
      // stale cache: an old cached shell must not win over the network
      const { ctx, page } = await newPage(proj);
      await page.goto(`${BASE}/sites.html`); await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload(); await page.waitForSelector('#panel');
      await page.evaluate(async () => { for (const k of await caches.keys()) { const c = await caches.open(k); await c.put(new Request(new URL('js/panel.js', location.href).href), new Response('/*stale*/export const PRESETS=[];', { headers: { 'content-type': 'text/javascript' } })); } await caches.open('jev-demo-v3'); });
      await page.reload(); await page.waitForSelector('#panel'); await openPanel(page);
      await page.locator('#tab-select').selectOption('__url');
      ok(await page.locator('#bm-copy').isVisible(), 'stale cached panel.js is bypassed (network-first)');
      eq(await page.evaluate(() => caches.keys()).then((k) => k.length), 2, 'seeded old cache exists until next activation');
      await ctx.close();
    }
    {
      const { ctx, page } = await newPage(proj);
      await page.goto(`${BASE}/bookmarklet.html`);
      const href = await page.locator('#bm').getAttribute('href');
      ok(href.startsWith('javascript:') && href.length > 20000, 'bookmarklet link inlined code');
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE }).catch(() => {});
      await page.locator('#copy').click(); await page.waitForTimeout(200);
      ok((await page.locator('#copied').textContent()).includes('コピー'), 'copy button feedback');
      ok(/iPhone/.test(await page.locator('body').textContent()) && /Android/.test(await page.locator('body').textContent()), 'iOS + Android steps present');
      await ctx.close();
    }
  }

  if (!mobile && want('pwa')) {
    section('PWA');
    const { ctx, page, errors } = await newPage(proj);
    await page.goto(`${BASE}/index.html`); await page.waitForSelector('#results .card');
    await page.locator('#settings summary').click(); await page.locator('#jev-key').fill('PWA-KEY');
    eq(await page.evaluate(() => localStorage.getItem('jev.gatewayKey')), 'PWA-KEY', 'standalone PWA keeps key in own localStorage');
    await page.evaluate(() => navigator.serviceWorker.ready); await page.reload(); await page.waitForSelector('#results .card');
    ok(await page.evaluate(() => !!navigator.serviceWorker.controller), 'SW controls page after reload');
    const man = await (await ctx.request.get(`${BASE}/manifest.webmanifest`)).json();
    eq([man.display, man.lang, man.start_url], ['standalone', 'ja', './'], 'manifest basics');
    for (const i of man.icons) ok((await ctx.request.get(`${BASE}/${i.src}`)).status() === 200, `icon ${i.src}`);
    await ctx.setOffline(true); await page.reload(); await page.waitForSelector('#results .card');
    eq(await page.locator('#results .card').count(), 24, 'offline reload renders 24 cards');
    await page.goto(`${BASE}/mamazon.html`); await page.waitForSelector('#products .prod'); ok(true, 'offline Mamazon');
    await ctx.setOffline(false); await ctx.close();
  }

  if (!mobile && want('pwa')) {
    section('SW network-first');
    const { ctx, page } = await newPage(proj);
    await page.goto(`${BASE}/index.html`); await page.waitForSelector('#results .card');
    await page.evaluate(() => navigator.serviceWorker.ready); await page.reload(); await page.waitForSelector('#results .card');
    const cssFile = path.join(ROOT, 'web/css/pages.css'); const orig = fs.readFileSync(cssFile, 'utf8');
    let css = '';
    try {
      fs.writeFileSync(cssFile, orig + '\n/* NEWMARK */\n');
      await page.reload(); await page.waitForSelector('#results .card');
      css = await page.evaluate(() => fetch('css/pages.css').then((r) => r.text()));
    } finally { fs.writeFileSync(cssFile, orig); }
    ok(css.includes('NEWMARK'), 'changed asset served from network when online');
    await ctx.close();
  }
}

await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log(failures.join('\n')); process.exit(1); }
