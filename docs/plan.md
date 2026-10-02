# Implementation plan: スーモジャ × Jev Ultrafast PWA

Spec: `docs/spec.md` (scope: the run ends after the inquiry form is filled; no submit, no completion modal; the 内容を送信する（デモ） button is inert).
Stack: static vanilla HTML/CSS/JS under `web/`, no build. Tests: Node + Playwright with preinstalled chromium (`/opt/pw-browsers`; never run `playwright install`).

## File map
```
web/index.html            shell: banners, header, hero, search, results, modals, panel
web/manifest.webmanifest
web/sw.js                 precache + offline fallback
web/css/site.css          site tokens + layout + modals
web/css/panel.css         Jev panel, sheet (mobile), cursor
web/js/data.js            24 listings (window.JEV_DATA / ES module export)
web/js/art.js             svgPhoto(kind, seed) -> inline SVG data URI scenes
web/js/site.js            filters, render, favorites, modals (open/close API)
web/js/agent.js           prompt parser, script builder, runner (abort), cursor
web/js/panel.js           panel UI: presets, buttons, timer, status, log, sheet drag
web/js/main.js            wiring + SW registration
web/icons/icon.svg, icon-192.png, icon-512.png, maskable.svg
tools/make-icons.mjs      generates PNG icons (pure Node, zlib) 
package.json              devDeps: playwright (or playwright-core), scripts
tests/unit.test.mjs       node:test for pure logic (parser, filter)
tests/e2e.mjs             Playwright run (desktop + mobile)
tests/serve.mjs           tiny static server (http.createServer) on port 4173
```
All modules are ES modules (`<script type="module">`), pure logic exported separately from DOM code so Node can import them (`parsePrompt`, `filterListings`, `buildScript`, `fmtTimer`).

## Conventions
- Stable test hooks (use exactly): `#kw`, `#f-area`, `#f-type`, `#f-layout`, `#f-rent`, `#btn-search`, `#result-count` (text "24" number only inside `<b>`), `#results .card[data-id]`, `.card .btn-detail`, `.card .heart`, `#fav-count`, `#detail-modal`, `#detail-fav`, `#btn-inquire`, `#inquiry-modal`, `#inq-name`, `#inq-email`, `#inq-body`, `#btn-submit-demo`, `#panel`, `#sheet-handle`, `#prompt`, `.preset[data-preset]`, `#btn-start`, `#btn-stop`, `#timer`, `#status`, `#instr`, `#log .row` (children `.ms .verb .label`), `#conn-badge`, `#cursor`.
- Design tokens as CSS custom properties on `:root` (colors from spec 3.2/3.3).
- Commit after each task (messages end with the repo attribution lines).

## Tasks (TDD where logic exists)

### T1. Scaffold and tooling
Create `web/` skeleton, `package.json` (`"type":"module"`, devDependency `playwright-core`, scripts `test:unit`, `test:e2e`, `serve`), `tests/serve.mjs`. Check the browser path: `ls /opt/pw-browsers` and set `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`; launch with `chromium.launch({executablePath})` found via glob `/opt/pw-browsers/chromium-*/chrome-linux/chrome` if the default lookup fails. If `playwright-core` is not resolvable offline, use a globally installed one (`npm ls -g`) or `NODE_PATH`.
Verify: `node tests/serve.mjs & curl -sI localhost:4173/ | head -1` -> 200.

### T2. Data + art (test first)
1. Write `tests/unit.test.mjs` cases: 24 listings; unique ids; 東京都 count === 16 (author choice); 東京都 & 1LDK ids === [代々木, 神楽坂, 阿佐ヶ谷] (3); exactly ONE listing with area 東京都 & layout 1LDK & rent <= 10 (id "asagaya", 空色ルーフ阿佐ヶ谷, 9.1万円, 2009); listing 1 風見ハイツ代々木 12.8万 1LDK 6階; fixtures #1-#6 per spec 3.2 (月灯りレジデンス 世田谷区, 川辺の白い家 5,680万, こもれび荘 202 7.9万 1DK, 雨音メゾン神楽坂 14.5万 1LDK).
2. Implement `data.js` (fields: id,name,mode 'rent'|'buy',price(万円),priceLabel,mgmt,layout,area,station,walk,pref,city,year,floor,tags[],check,photos,art kind) and `art.js` (>=8 scene kinds: mountain, tiger-warm gradient, pier, shore, trees-bw, facade, sky, park; pure SVG strings -> `data:image/svg+xml`).
Verify: `node --test tests/` passes.

### T3. Pure logic (test first)
Tests: `filterListings(list,{area,type,layout,rent,kw})` (rent upper bound inclusive in 万円; "すべて"/"上限なし" wildcards); `parsePrompt(text)` returns `{area,layout,rent,name,email,body}` for the default prompt (東京都,1LDK,10万円,山田 太郎,taro@example.com,来週末に内見を希望します。空室状況を教えてください。) and fallbacks for garbage; invalid option -> fallback + `notes[]`; `buildScript(parsed)` returns steps in spec section 2 order with target ms `[1111,1495,1787,2066,2385,2690,3000,3600,4600,5600]` (+ DONE at 6400) and NO step whose label contains 内容を送信; `fmtTimer(7400)==='7.4s'`.
Implement in `site.js`/`agent.js` (pure exports).
Verify: `npm run test:unit`.

### T4. Site markup + CSS (desktop first)
`index.html`, `site.css`: banners, header with fav counter, hero (inline SVG deco), search card, breadcrumb, results header/sort/toggle, 2-col grid, card layout, detail modal, inquiry modal (with inert `#btn-submit-demo`: `type=button`, click handler only `preventDefault`). No completion modal anywhere.
`site.js` DOM: render cards, search applies only on `#btn-search` click or Enter (video shows 3件 after area+layout selects, so select changes re-filter live; button re-applies and scrolls to results), reset link, favorites with counter, open/close modals (ESC, backdrop, focus trap).
Verify: Playwright smoke script (`tests/e2e.mjs --smoke`) at 1100x690: counts 24; select 東京都 then 1LDK -> "3"; add 10万円 -> "1" and name 空色ルーフ阿佐ヶ谷; click heart -> `#fav-count` "1"; screenshot to scratchpad and compare visually with refs t03.jpg / t18.jpg.

### T5. Panel UI
`panel.html` section within index, `panel.css`, `panel.js`: header + badge (接続中… 400ms then サーバー接続OK), tab box, prompt textarea with default, preset chips filling prompt, buttons, timer, status, instruction box, log, footer note. Emits events `jev:start`, `jev:stop`; exposes `panel.log(ms,verb,label,value?)`, `panel.setState('idle'|'running'|'done'|'stopped')`, `panel.setInstr(text)`.
Verify: unit-ish Playwright check: preset click changes `#prompt` value; initial states (AC1).

### T6. Agent runner
`agent.js`: `run({parsed, signal, panel, site})` using `sleepUntil(t0+ms, signal)`; helpers `moveCursorTo(el)`, `pulse(el)`, `selectValue(el,v)`, `typeInto(el,text,perCharMs=35)` (dispatch `input` events), `clickEl(el)` (ripple + `el.click()`); each step logs a row with actual elapsed ms immediately after performing the action. Steps: select area/layout/rent; click `#btn-search`; click first `.card .btn-detail`; click `#detail-fav` (log label お気に入り); click `#btn-inquire`; type name/email/body; finish -> `panel.setState('done')`, stop timer, remove cursor. Pre-run: `site.reset()`. Site input shield during run. Abort: on 停止, controller.abort(), state 'stopped'.
Fallback: if a parsed value is not a valid option or yields zero results the run logs a notes row (verb `NOTE`) and uses defaults, still completing.
Verify: e2e desktop full run (T9).

### T7. Mobile layout + sheet
`@media (max-width:768px)` per spec section 5: stacked banners, scrolling nav, 2x2 selects, 1-col cards, near-fullscreen modals, bottom sheet with drag handle using Pointer Events (`touch-action:none` on handle), snap states `collapsed|half|full` stored in `data-snap`, auto-collapse on start, `env(safe-area-inset-*)` paddings, `100dvh`, 16px inputs, 44px min targets (`min-height:44px; min-width:44px` on buttons, chips, hearts, selects, modal close).
Verify: e2e at 390x844 with `hasTouch:true, isMobile:true`: `scrollWidth <= innerWidth`; every visible `button, .preset, select, input, a` has bbox >= 44 in the smaller dimension (assert for buttons/presets/hearts/close; list offenders); drag handle with `page.touchscreen`/mouse changes sheet height; also 320x640 no horizontal scroll.

### T8. PWA
`manifest.webmanifest`, `sw.js` (precache list of every file in the map; cache-first, navigation fallback), `tools/make-icons.mjs` generating 192/512 PNG from a simple raster (Node `zlib` PNG encoder), icon.svg, `<link rel=manifest>`, apple-touch-icon, theme-color, SW registration in `main.js` (only on http(s)).
Verify: e2e: after load `navigator.serviceWorker.ready` resolves; reload; `context.setOffline(true)`; reload -> page renders `#results .card` x24; manifest JSON parses with display standalone and icons exist (HTTP 200).

### T9. End-to-end tests (`tests/e2e.mjs`, run under both desktop 1100x690 and mobile 390x844 projects)
Steps: load; assert AC1; click `#btn-start`; assert `#btn-start` disabled / `#btn-stop` enabled / `#status` contains 操作中; wait for `#status` to contain 完了 (timeout 15 s); assert elapsed (parse `#timer`) between 5.5 and 9 s; `#log .row` verbs/labels equal expected ten rows in order and the last row is `TYPE_TEXT お問い合わせ内容`; no row contains 内容を送信; count `#result-count` 1; `#fav-count` 1; `#inquiry-modal` visible with values 山田 太郎 / taro@example.com / 来週末に内見を希望します。空室状況を教えてください。; `#btn-submit-demo` visible, click it, modal still open and no element matches `text=問い合わせ体験が完了しました` or `text=問い合わせ送信が完了しました`; ms column values monotonic and first SELECT in 900-1500 ms.
Extra cases: (a) stop test: start, wait 2.5 s, click `#btn-stop`, assert status 停止, log row count frozen over 700 ms; (b) prompt edit: replace エリアを「東京都」 with 「神奈川県」, run, assert completes (fallback allowed); (c) rerun after done resets log; (d) offline run; (e) console errors == 0 and no requests to non-localhost origins (`page.on('request')`); (f) screenshots saved to the scratchpad for visual review.
Verify: `npm run test:e2e` all green (exit 0).

### T10. Polish and visual QA
Compare screenshots with `ref/t03.jpg` (idle), `t15`/`t16` (mid-run), t19 (end state minus completion modal); adjust spacing/colors; reduced-motion media; a11y labels; ensure `lang="ja"`, title "スーモジャ × Jev Ultrafast デモ".
Verify: full suite `npm test` (unit + e2e) green; `grep -rn "https\?://" web --include=*.{html,css,js}` shows only the placeholder display string and the SVG xmlns; `grep -rn "完了しました" web` returns nothing.

### T11. Docs / deploy hint
Brief `README.md` section: run `node tests/serve.mjs` or any static host; "Add to Home Screen" instructions. Final commit.

## Risk notes
- iOS Safari: `dvh`, `touch-action`, SW scope `./` requires serving over HTTPS or localhost; document it.
- Timer/log timestamps use `performance.now()` deltas, not setTimeout drift; script step times are targets, not guarantees.
- Playwright browser path: if the default executable is missing, pass `executablePath` explicitly from `/opt/pw-browsers`.


## Addendum: generic engine, panel copy, bookmarklet (implemented as tasks T12-T18)
Spec: `docs/spec.md` section 9. The scripted スーモジャ run (T1-T11) stays; the core is now generic.

### File map additions
```
web/js/engine.js              site-agnostic runner (cursor, log, timer, abort, safety)
web/js/generic/{text,intent,scan,match,agent,safety,jev}.js
web/js/adapters/{demo,suumo,index}.js   recipes (hints only) + registry (generic fallback)
web/js/{panel,app,bookmarklet-entry,mamazon,sw-register}.js
web/{mamazon,form,sites,bookmarklet}.html, web/css/pages.css, web/bookmarklet.js (generated)
tools/build-bookmarklet.mjs, tools/make-icons.mjs
tests/fixtures/{realestate,shop,jobs,safety}.html, tests/{unit.test.mjs,e2e.mjs,serve.mjs,pw.mjs}
```
### Tasks
- T12 (TDD) `generic/text.js`, `intent.js`, `match.js`, `safety.js`, `jev.js` pure modules + unit tests (number/unit normalisation, three sample prompts, option matching incl. nearest numeric option, ambiguity, denylist table, mocked-fetch Jev test).
- T13 `scan.js` + `agent.js` + engine safety hooks (SKIP rows, `check`, `skip`, `settle`).
- T14 recipes: demo (scripted, SKIP row + zero-result fallback) and suumo-sp (UNVERIFIED) + `pickAdapter`.
- T15 panel copy (`panel.js`, `panel.css`): tab select + URL row + external-URL note, presets that open pages, key setting, hostname, sheet drag logic.
- T16 pages: Mamazon, Personal Form, hub; presets/prompts in `app.js`.
- T17 `tools/build-bookmarklet.mjs`: module bundler (own module scopes, no deps), CSS inlined, `bookmarklet.html` generation.
- T18 e2e: demo ACs desktop+mobile, fixtures via the real bundle (AC12/13), pages (AC15), bookmarklet page (AC16), PWA, mobile layout/44px/drag; screenshots to `docs/screens/`.
Verify: `npm test` (unit + e2e) green.
