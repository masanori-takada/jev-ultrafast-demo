# Spec: Jev Ultrafast side-panel demo replica ("スーモジャ" fake site + agent panel)

Source: 24 s phone screen recording of a YouTube video (title overlay "常識を変えるAI「Jev」凄さを語りたい", #usutaku_channel). The recorded content is a browser with a fake real-estate site on the left and the dark "Jev Ultrafast" side panel on the right. The YouTube chrome, the red/yellow caption "サイドパネル操作デモ", the subtitles and the iOS control centre are NOT part of the replica.
Everything is fictional and runs fully client-side. The agent is a scripted SIMULATION (no LLM, no network).

## 1. Video timeline (reference)
| t (s) | Observation |
|---|---|
| 0-2 | Idle state. Panel: status 完了, timer 12.1s, previous-run log (TYPE_TEXT 氏名 "山田 太郎" 1874ms; フリガナ "ヤマダ タロウ" 2756ms; メールアドレス * "taro@example.com" 3955ms; 電話番号 * "09012345678" 5663ms; 生年月日 * "1990-01-15" 7162ms; SELECT 都道府県 → 東京都 7487ms...). Site shows 24件. Log rows are separated by faint dotted lines; ms column muted, VERB bold ~60px column, label starts at ~55% of panel width. |
| 3-10 | Presenter selects/highlights prompt text; textarea shows focus ring (blue border, glow); a blue cursor-badge (diamond icon) sits over the text. |
| ~11-14 | Press スタート (pointer on button). Timer 0.3s: button disabled/dim, 停止 enabled, status "操作中…" (blue), status box shows English-ized instruction (see 4.5), log empty, footer note visible. |
| ~14.5 | 0.8s: panel 操作中… (blue), 停止 enabled (white text, dark outline), timer live, footer note visible; site still 24件, all selects すべて/上限なし. |
| ~15.5 | 1.8s: エリア=東京都 and 間取り=1LDK already applied live (filters apply on select change), results **3件** (風見ハイツ代々木, 雨音メゾン神楽坂, 空色ルーフ阿佐ヶ谷); log shows only `1111ms SELECT エリア → 東京都` at that moment. After 賃料上限=10万円 → 1件 (空色ルーフ阿佐ヶ谷). Log: 1111ms SELECT エリア → 東京都 / 1495ms SELECT 間取り → 1LDK / 1787ms SELECT 賃料上限 → 10万円 / 2066ms CLICK この条件で検索 / 2385ms CLICK 物件の詳細を見る / 2690ms CLICK お気に入り / ... |
| ~16.5-18 | 2.8s: detail modal (see 3.2) with 2385ms row last visible. 3.8s: inquiry modal "架空の空室問い合わせ" open over the dimmed detail modal, お名前 prefilled "山田 たろう", メール placeholder "demo@example.com", textarea "空室状況と内見可能な日時を教えてください。" |
| ~19-20 | 4.8s: お名前 typed "山田 太郎" (field focus ring green, small lock/info icons at right), 5.8s email being typed, 6.5s both filled. In the video the textarea is NOT edited; the replica additionally types the body per scope. |
| ~21 | 7.4s: status 完了 (green check), スタート re-enabled, 停止 disabled, timer stops. (In the video a completion modal then appears; SCOPE CHANGE: the replica does NOT submit and has no completion modal. The run ends with the filled inquiry form still open.) |
| 22-24 | Control centre overlay (ignore). |

Replica run duration target: ~7.3 s (+/- 0.5 s) at default speed. Time scale constant `SPEED=1`.

## 2. Scripted action sequence (log is `<elapsed ms> <VERB> <label>`)
Elapsed times are cumulative since スタート; the script uses these as target timestamps (reference run); actual displayed ms = real elapsed.
| ms | Verb | Label (right column) | DOM effect |
|---|---|---|---|
| 1111 | SELECT | エリア → 東京都 | area select value=東京都; list re-filters |
| 1495 | SELECT | 間取り → 1LDK | |
| 1787 | SELECT | 賃料上限 → 10万円 | |
| 2066 | CLICK | この条件で検索 | apply filters -> "1件" |
| 2385 | CLICK | 物件の詳細を見る | open detail modal of first result |
| 2690 | CLICK | お気に入り | heart toggles on, header counter 0 -> 1 |
| 3000 | CLICK | 空室状況を問い合わせる | inquiry modal opens |
| 3600 | TYPE_TEXT | お名前 → "山田 太郎" | typed char by char (~40 ms/char) |
| 4600 | TYPE_TEXT | メールアドレス → "taro@example.com" | |
| 5600 | TYPE_TEXT | お問い合わせ内容 → "来週末に内見を希望します。空室状況を教えてください。" | replaces prefilled text |
| 6900 | SKIP | 送信はスキップ(安全のため) | cursor glides to 内容を送信する（デモ） but does NOT click it (safety denylist) |
| 7300 | DONE | (status 完了, no log row) | run ends with the filled inquiry form still open; no CLICK row for the submit button |
Log rows beyond the visible area scroll (log is a scrollable list; auto-scroll to newest).
Parsing: from prompt extract エリア (regex `エリアを「(.+?)」`), 間取り (`間取りを「(.+?)」`), 賃料上限 (`賃料上限を「(.+?)」`), 名前 (`お名前 (\S+ \S+)`), email (`メールアドレス (\S+@\S+?),`), 内容 (`お問い合わせ内容「(.+?)」`). Fallback to defaults above if no match or value not an available option (a `NOTE` row explains). If the edited filters yield zero results, a `NOTE` row is logged and the defaults (東京都/1LDK/10万円) are re-applied so the run still completes.

## 3. Layout and visual design (desktop, reference 1100x690 viewport of the recording; replica must scale fluidly)
### 3.1 Overall
Browser region: left column (site) flex 1; right side panel fixed width 235/1100 ≈ 22% -> `clamp(320px, 22vw, 400px)`, margin 6px, rounded 8px, background `#0f1220`-ish dark navy. Panel outer strip background light grey `#eef0f2`.
### 3.2 Site "スーモジャ"
- Page bg `#f6f6f2`; text `#222`. Font: system Japanese sans (`"Hiragino Sans","Noto Sans JP",system-ui,sans-serif`).
- Demo banner 1: yellow `#ffe600` full width, height ~28px, small bold text "これはAIエージェント検証用のデモサイトです" (frame shows "...検証用のデモサイトです" with a leading icon) centered/left.
- Banner 2: dark green `#1f4d2b` (rgba ~ #1e3d28), white text 11px: "これはAIエージェント検証用のジョークサイトです　掲載物件はすべて架空です。SUUMO・株式会社リクルート・不動産会社とは一切関係ありません。" (Replica must keep this wording: jokes site, listings fictional.)
- Header (white, height 52px): logo "スーモジャ" (green `#2f7d32`, bold 20px) with tagline "住まいを、直感しよう。" (6px, grey); nav tabs: 借りる (active, green text, 3px green underline), 買う, 建てる, 暮らす; right: pill button "♡ お気に入り" with red badge count (circle `#c2185b`, white, initial "0"), white bg 1px border `#ddd`, radius 8px.
- Hero (height ~165px): gradient `#e8f3d0 -> #fbf4d2` (pale green to cream); chip "✦ 架空の住まい探し" (white pill); H1 two lines "まだ知らない街に、<br>ちょうどいい部屋を。" 26px bold; sub "首都圏の架空物件を24件掲載。ログインなしですべての機能を試せます。" 8px grey; decorations: orange circle `#e0a030` top right, green house outline + clover shape bottom right (SVG).
- Search card (white, radius 8, shadow, overlaps hero bottom): keyword input full width with search icon, placeholder "駅名・市区町村・物件名で検索", focused look: 2px green border `#6a9a3a`. Row of 4 labeled selects + orange button:
  - エリア: すべて / 東京都 / 神奈川県 / 埼玉県 / 千葉県
  - 物件種別: すべて / マンション / アパート / 一戸建て (video labelled 物件種別)
  - 間取り: すべて / 1R / 1K / 1DK / 1LDK / 2LDK / 3LDK
  - 賃料上限: 上限なし / 5万円 / 7万円 / 10万円 / 15万円 / 20万円
  - Button "🔍 この条件で検索" bg `#e8501e` (orange-red), white bold, radius 6, height 38px.
- Breadcrumb: "サービス一覧 / 架空物件を探す" (9px, link green underline).
- Results header: "検索結果 **24**件" (24 in orange `#e8501e` 20px bold), link "⇌ 条件をリセット" (underline), right: sort select "おすすめ順", segmented toggle "☰ 一覧" (active green `#2f7d32` white text) / "▦ 地図" (inactive; may toggle to a simple placeholder map).
- Listing grid: 2 columns desktop, card = white, radius 6, 1px `#e3e3e3` border. Left photo 140x~165 (full height, with green tag "賃貸" top-left (`#2f7d32` white) ("購入" for sale, same style), and "写真 5枚" bottom-right black translucent). Photos are generated inline SVG/CSS gradient scenes (mountain, tiger-like warm brown, pier, rocky shore, trees, building facade...). Right: two small tag chips, green text with 1px green outline on pale green (e.g. "おすすめ", "南向き", "築浅", "宅配BOX"; no orange chips), heart (♡) button top-right (44px hit area, toggles ♥ red), title bold 12px, location line "📍 東京都渋谷区" + "🚉 代々木駅 徒歩7分", 3-col spec row with tiny grey headers: 賃料 (buy: 販売価格) orange bold 18px e.g. "12.8万円" + small "管理費 6,000円" | 間取り / 専有面積 ("1LDK" bold, "38.2㎡") | 築年 / 階数 ("2018年", "6階"), thin dividers between columns and above/below the row, check line "✓ 南向き・角部屋", full-width outline button "物件の詳細を見る" (1px green `#2f7d32` border, green text, radius 4, height 36px).
- 24 listings (fictional; deterministic): rent 4.5-24万, layouts 1R-3LDK, years 1985-2024, areas across 東京都/神奈川県/埼玉県/千葉県. Required fixtures (from video): 
  1. 風見ハイツ代々木 / 東京都渋谷区 / 代々木駅 徒歩7分 / 12.8万円 (管理費6,000円) / 1LDK 38.2㎡ / 2018年 6階 / 南向き・角部屋 / 賃貸 / tags おすすめ, 南向き / photo mountain (Matterhorn-like, cloud) / 写真5枚
  2. 月灯りレジデンス / 東京都世田谷区 / 三軒茶屋駅 徒歩5分 / 9.6万円 (管理費6,000円) / 1K 25.4㎡ / 2021年 8階 / 宅配BOX・ペット相談 / 賃貸 / tags 築浅, 宅配BOX / photo tiger / 写真6枚
  3. 川辺の白い家 / 東京都江東区 / 清澄白河駅 徒歩4分 / label 販売価格 5,680万円 / 2LDK 61.8㎡ / 2015年 11階 / リノベ済・眺望良好 (approx.) / 購入 / photo pier+waves / 写真7枚
  4. こもれび荘 202 / 東京都杉並区 / 西荻窪駅 徒歩10分 / 7.9万円 (管理費6,000円) / 1DK 29.1㎡ / 1996年 2階 / 古民家・庭付き (approx.) / 賃貸 / photo seaside white building + sea / 写真8枚
  5. 雨音メゾン神楽坂 / 東京都新宿区 / 神楽坂駅 徒歩4分 / 14.5万円 (管理費6,000円) / 1LDK 41.3㎡ / 2022年 4階 / 築浅・楽器相談 / 賃貸 / tags 築浅, 楽器相談 (second chip unreadable) / photo green glass bottles on wooden fence / 写真6枚. Place anywhere after #4.
  6. 空色ルーフ阿佐ヶ谷 / 東京都杉並区 / 阿佐ヶ谷駅 徒歩8分 (use ヶ) / 9.1万円 (管理費6,000円・敷1 / 礼1) / 1LDK 34.8㎡ / 2009年 / 特徴・check line 屋上菜園・ネット無料 / 賃貸 / photo b/w foggy trees. 東京都 & 1LDK must give EXACTLY 3 listings (#1, #5, #6, in that order) and adding 賃料上限10万円 must leave ONLY #6 (#1, #5 are >10万). Number of 東京都 listings: author choice 16 (not verified in video).
  Remaining 18: author-generated, fictional, whimsical names; none may be 東京都+1LDK. #1-#4 are the first four cards in the default order (おすすめ順).
- Favorite: toggling heart updates header badge count; persisted in memory only.
- Detail modal (frame t16.6): white, radius 10, ~58% wide, centered, ✕ white circle top-right. Left (~52%): large photo (b/w foggy trees) over 2 thumbnails side by side (steaming rock shore, flat-lay of tools). Right: chips "賃貸", "架空物件" (green outline); title "空色ルーフ阿佐ヶ谷" 18px bold; "📍 東京都杉並区 / 阿佐ヶ谷駅 徒歩8分"; cream box with orange "9.1万円" 22px and small "管理費 6,000円・敷1 / 礼1"; 2x2 spec table (間取り 1LDK | 面積 34.8㎡ / 築年 2009年 | 特徴 屋上菜園・ネット無料); yellow note with star icon "この物件情報は完全なフィクションです。実際の内見・契約はできません。"; buttons row: outline "♡ お気に入り" (turns red "♥ お気に入り済み" when active) + orange `#e8501e` "空室状況を問い合わせる". Backdrop rgba(0,0,0,.6) over blurred page.
- Inquiry modal "架空の空室問い合わせ": white card 300px/1100 ≈ 27vw (min 320px), radius 10, centered; ✕ circle button top-right; yellow note chip "入力内容は保存・送信されません" (bg `#fff3c4`, 7px text); title "架空の空室問い合わせ" 16px bold; subtitle "空色ルーフ阿佐ヶ谷" grey (property name, with ヶ); labels お名前 / メールアドレス / お問い合わせ内容 (bold 8px); inputs height 22px, radius 4, 1px `#ccc`, focus border `#6a9a3a` + soft ring; name placeholder/prefill "山田 たろう", email placeholder "demo@example.com", textarea (3 rows, resize) prefilled "空室状況と内見可能な日時を教えてください。"; submit button full width orange `#e0501c` "内容を送信する（デモ）" height 28px bold.
- Submit button "内容を送信する（デモ）" stays visible in the inquiry form but is inert (a no-op: `type=button`, no handler beyond preventDefault; the agent never clicks it). There is NO completion modal ("問い合わせ送信が完了しました"/"問い合わせ体験が完了しました") in the replica. Modals use `role="dialog" aria-modal`.

### 3.3 Jev Ultrafast panel (dark)
Tokens: bg `#0e111c`; card/inputs `#171b2b`; border `rgba(255,255,255,.1)`; text `#e8eaf2`; muted `#8a90a6`; accent blue `#4f6df5` (button) / link blue `#6f8bff`; green ok `#4ad295`; verb colors: SELECT `#7d7dff` (indigo-violet), CLICK `#6f8bff`-ish blue, TYPE_TEXT `#6f8bff` blue; value strings green `#4ad295` in quotes. Font 11px (scale: desktop panel is small-text dense), monospace for ms column? (ms column is grey proportional digits, 8px).
Top chrome row (light bar above dark card): "J Jev Ultrafast" small title (J in a dark rounded square icon), right icons: pin-off and ✕ (decorative, no-op; ✕ collapses sheet on mobile).
Inside dark card top→bottom:
1. Header: "⚡ Jev Ultrafast" bold 11px white (⚡ small blue); right pill badge "サーバー接続OK" (green text `#4ad295`, bg rgba(74,210,149,.12), 1px border green alpha, radius 10px). Replica: after a fake 400 ms "接続中…" at load, show OK.
2. Label "操作するタブ" (muted 7px). Select-like box (readonly, bg #171b2b): "AIエージェント操作用 デモサイト一覧 — https://play.…" with ellipsis.
3. Label "Jev にやってほしいこと" + muted suffix " — 下のプリセットを押すとそのページを開いて指示が入ります". Textarea (min-height 125/690, resize handle, radius 6, bg #171b2b, 1px border; focus: border `#4f6df5` + glow). Default value (exact):
   `SUUMOじゃ、エリアを「東京都」、間取りを「1LDK」、賃料上限を「10万円」にして「この条件で検索」。最初の物件の「物件の詳細を見る」を開き、「お気に入り」を押す。続けて「空室状況を問い合わせる」を押し、お名前 山田 太郎、メールアドレス taro@example.com、お問い合わせ内容「来週末に内見を希望します。空室状況を教えてください。」を入力して「内容を送信する（デモ）」を押し、送信完了の表示が出たら終了。` (the video's wording is kept; the engine still never submits: see section 9.4 — it logs `SKIP 送信はスキップ(安全のため)` instead.)
4. Preset chips (full-width pill rows, bg #171b2b, 1px border, muted text, 8px, tappable): 
   - "🛒 Mamazon：パソコンを最安で購入"
   - "🏠 SUUMOじゃ｜東京1LDKを探して問い合わせ"
   - "📝 Personal Form：架空プロフィールで送信"
   Pressing a chip fills the textarea with a preset prompt and updates the 操作するタブ box. Preset 2 = default prompt. Presets 1/3 only fill text; スタート then runs the same scripted run (or, for preset 3, a log-only simulated form fill variant is optional; MVP: all run SUUMOじゃ script and show a notice line "このデモでは SUUMOじゃ のシナリオのみ実行します" in the status box). 
5. Buttons row: primary "▶ スタート" (bg `#4f6df5`, white bold, radius 6, 66x24 of 235 wide; disabled while running: dim `#3a4580`, opacity .6) ; ghost "■ 停止" (grey text, enabled only while running: white text with dark `#222639` bg); right-aligned timer "12.1s" bold white 10px, format `x.xs` live-updating every 100 ms; shows last run time after finish; "0.0s" initially.
6. Status: label "状態" muted + value: idle: nothing/"待機中"; running: "操作中…" blue `#6f8bff`; done: green check chip "✅ 完了" (green); stopped: "⏹ 停止しました" amber; error: red. Below it a muted box (bg `#13172a`, radius 6, 7px text, 5-6 lines) containing the English-ized instruction ("Jev への指示 (英語化): ...", exact text below) shown while running/after done.
   Running text: `Jev への指示 (英語化): Set エリア to 東京都, 間取り to 1LDK, 賃料上限 to 10万円, then click 'この条件で検索'. Click '物件の詳細を見る' on the first result, then click お気に入り on that property. Then click '空室状況を問い合わせる'. In the inquiry form, fill お名前 = 山田 太郎, メールアドレス = taro@example.com, お問い合わせ内容 = 来週末に内見を希望します。空室状況を教えてください。 Then stop; do not submit the form. When the inquiry form is filled in, DONE.`
   Idle/previous (initial) text: `Jev への指示 (英語化): Fill the form: 氏名 = 山田 太郎, フリガナ = ヤマダ タロウ, メールアドレス = taro@example.com, 電話番号 = 09012345678, 生年月日 = 1990-01-15, 都道府県 = 東京都, 住所 = 千代田区架空1-2-3, 職業 = 会社員, 希望する連絡方法 = メール, check 興味のあるテーマ 生成AI, check the confirmation checkbox, then click '送信 (デモ)'. Leave 備考 empty. Never click '架空の個人情報をコピーする'. When '送信完了' is visible, DONE.` with status 完了, timer 12.1s and the previous log (see timeline 0-2) -- the replica MAY start in this "previous run" state (matches video frame 0) or clean idle; choose: START IN PREVIOUS-RUN STATE for fidelity? DECISION: start clean idle (timer 0.0s, empty log, no status box) to avoid confusing users; offer nothing else.
7. Action log: rows grid `[ms 44px] [VERB 60px] [label 1fr]`; ms right-aligned muted; VERB bold colored uppercase; label light text; value in quotes green: `氏名 * "山田 太郎"`. New rows slide in (150 ms). Scrollable region fills remaining panel height.
8. Footer note (muted, 7px) pinned at bottom while running: "操作は今開いているタブで行われます。実サイトでは購入・送信が本当に実行されるので注意。"

### 3.4 Agent visual feedback (replica additions that mimic the real extension)
- A blue circular cursor badge (diamond/pointer icon, `#2f6bff`, 22px) glides (200-300 ms ease) to each target element's centre before the action; target gets a 2px blue outline pulse (class `jev-target`) for 350 ms; click ripple.
- Selects: animated value change with highlight; typing: char-by-char with caret.
- While running, a thin blue top progress line on site area (optional) and site content is `inert`-ish: user clicks ignored on the site (pointer-events none overlay) to avoid interference.

## 4. States and behaviors
- Idle: スタート enabled, 停止 disabled.
- Running: スタート disabled, 停止 enabled, status 操作中…, timer ticking, log filling.
- Done: status ✅ 完了, the filled inquiry form stays open (closable via ✕); スタート enabled; timer frozen.
- Stopped (停止): cancel all timeouts via AbortController, remove cursor, status "停止しました", partial log kept, timer frozen; site state left as-is (modals closed on next run start).
- Re-run: reset site (close modals, filters to すべて, favorites cleared, 24件), clear log, restart timer.
- Reduced motion: respects `prefers-reduced-motion` (shorter glides, no ripple).
- Offline: after first load, everything works with no network (service worker precache).

## 5. Mobile adaptation (<= 768px)
- Site fills the viewport (100dvh scroll). Banners stack (text wraps, 10-11px). Header: logo left, お気に入り pill right; nav tabs become horizontally scrollable row. Hero compact (H1 22px). Search card: keyword full width; selects in a 2x2 grid; search button full-width, min-height 48px. Results: 1-column cards (photo 110px wide left, content right; at <=380px photo on top 120px tall). All interactive targets >= 44px. Modals become near-fullscreen sheets (inset 12px, max-height 92dvh, internal scroll).
- Jev panel = bottom sheet: fixed bottom, width 100%, border-radius 16px 16px 0 0, three snap heights: collapsed (handle + header + スタート/停止 + timer + status = ~120px), half (55dvh), full (88dvh). Drag handle (pill, 44px tall hit area) supports touch/pointer drag with snapping and tap-to-toggle; ✕ collapses; a floating "⚡ Jev" FAB is not needed since collapsed bar always visible. Sheet respects `env(safe-area-inset-bottom)`; page bottom padding = collapsed height so content isn't hidden. On スタート the sheet auto-collapses to the compact bar so the site actions are visible; on completion it stays collapsed and the compact bar shows 完了 and timer. The inquiry modal has z-index below the collapsed bar? No: modals z-index 1000, sheet 1100 (sheet stays usable for 停止); the modal's max-height subtracts collapsed sheet height.
- Textarea font-size >= 16px on focus to prevent iOS zoom (use 16px on mobile); inputs 16px.
- Landscape phones (height < 500px): panel becomes right-hand sheet at 40vw.
- Desktop >768px: side-by-side as 3.1.
- `meta viewport` with `viewport-fit=cover`, `theme-color` `#ffe600`? use `#1f4d2b`; no horizontal scroll at 320 px width.

## 6. PWA
`web/manifest.webmanifest` (name "スーモジャ × Jev Ultrafast デモ", short_name "Jevデモ", `display: standalone`, `lang: ja`, start_url `./`, scope `./`, theme `#1f4d2b`, bg `#0e111c`, icons 192/512 PNG + maskable SVG). `web/sw.js`: cache-first app shell precache (versioned `CACHE='jev-demo-v1'`), skipWaiting + clients.claim, offline fallback to `index.html`. Icons generated programmatically (SVG + PNG via node script or inline data), no external downloads. No external fonts/CDN requests (system fonts).

## 7. Accessibility and content safety
Labels for all inputs, `aria-live="polite"` on status and log, focus trap in modals, ESC closes modals, visible focus rings. All names/emails/addresses fictional; banners present. No network requests of user input.

## 8. Acceptance criteria
AC1 Load `web/index.html` over http: site shows both banners, hero, search form, "検索結果 24件", >= 24 cards, panel shows サーバー接続OK, default prompt (exact string 3.3), 3 preset chips, スタート enabled, 停止 disabled, timer 0.0s.
AC2 Running スタート produces, in order, log rows with verbs/labels exactly per section 2, with SELECT/CLICK/TYPE_TEXT colored distinctly; monotonic ms; first three SELECT rows between 1.0-1.3s, whole run 5.5-9s (target 7.3s).
AC3 Filters apply live on select change: after エリア+間取り the count is "検索結果 3件" (風見ハイツ代々木, 雨音メゾン神楽坂, 空色ルーフ阿佐ヶ谷); after step 3 it is "検索結果 1件" and the single card is 空色ルーフ阿佐ヶ谷 (9.1万円, 1LDK, 2009年).
AC4 Header counter becomes 1 after お気に入り; detail modal heart is active.
AC5 Inquiry modal fields end with 山田 太郎 / taro@example.com / the prompt's inquiry text; the modal is still open, the 内容を送信する（デモ） button is visible and clicking it does nothing; NO completion modal exists in the DOM and no CLICK 内容を送信する row is logged (last row is `SKIP 送信はスキップ(安全のため)`, directly after TYPE_TEXT お問い合わせ内容); status shows 完了; スタート re-enabled, 停止 disabled; timer frozen.
AC6 停止 during the run halts further log rows within 300 ms, status 停止しました, no further DOM change.
AC7 Editing the prompt (e.g. エリアを「神奈川県」) changes the performed selection (or falls back with a log notice if no listing matches; still completes).
AC8 Viewport 390x844 (touch): no horizontal scroll; Jev sheet visible at bottom with スタート/停止 >= 44px tall; drag handle changes sheet height; full run completes with the filled inquiry modal visible above the collapsed sheet; all buttons >= 44x44 CSS px.
AC9 Lighthouse-style PWA checks: valid manifest linked, SW registered and controlling after reload, page loads with network disabled (Playwright `context.setOffline(true)`).
AC10 No console errors; no requests to external origins.
AC11 Visual: colors in sections 3.2-3.3 used as design tokens in CSS variables; desktop screenshot at 1100x690 visually matches the layout of frames t03/t18 (panel right ~22%, banners, hero, 2-column cards).

## 9. Addendum: generic engine, bookmarklet, safety, Jev mode (supersedes the "scripted only" idea of sections 2-3.3 where they conflict)

### 9.1 Architecture
- `web/js/engine.js` — site-agnostic runner: `createEngine({panel, shield, persistKey})` -> `run(steps)`, `stop()`, cursor glide + highlight (`.jev-target`) + ripple, `click/select/check/type/skip`, timing log (`panel.log(ms, verb, label)`), timer, abort, safety checks (9.4), sessionStorage resume for multi-page sites.
- `web/js/generic/*` — the GENERIC agent, usable on any search/filter site:
  - `scan.js` scans select, input (text/search/number/range), checkbox, radio, buttons, links, aria-role controls and facet lists; labels via `label[for]`, wrapping label, `aria-label(ledby)`, placeholder, legend, nearby text, name/id. Re-scans after every action.
  - `intent.js` parses the free-text prompt into intents: `pair` (label -> value, e.g. `エリアを「東京都」`, `氏名=「山田 太郎」`), `num` (value + unit + op, e.g. `10万円以下`, `評価4以上`, `年収600万以上`), `sort` (`レビュー順`), `term` (facet value or search keyword). Sentences with negations (`購入はしない`) and site names are ignored.
  - `text.js` NFKC + hiragana/katakana folding, JP/EN synonym tables (price, rating, salary, location, layout, brand, job type, sort; Tokyo<->東京, remote<->リモート ...), number normalization (`10万円` = `100000` = `¥100,000`, `600万`, `★4`).
  - `match.js` fuzzy scoring of intents against controls/options (label bonus, unit/op compatibility, min/max input roles, nearest valid option for numeric limits); flags ambiguity (best score < 0.6 or tie between different controls).
  - `agent.js` applies intents (select option, tick facet/check, press chip, type into numeric/text inputs, type the keyword, choose sort), then presses the apply/search button (or Enter). Unmatched `pair`/`num` intents log a `NOTE`; unmatched terms become the search keyword.
  - `safety.js`, `jev.js`: see 9.4 and 9.3.
- `web/js/adapters/*` — OPTIONAL RECIPES that only add hints; the generic path works without them: `demo` (scripted スーモジャ run per section 2, trusted for 空室状況を問い合わせる), `suumo-sp` (hints + steps open-first-result and お気に入り; UNVERIFIED against the live site, see 9.2), `generic` (default; no hints). `pickAdapter(hostname, override)` selects by `location.hostname` (override `window.JEV_ADAPTER`).
- `web/js/panel.js` (UI only), `web/js/app.js` (wiring), `web/js/bookmarklet-entry.js`.

### 9.2 Recipe suumo-sp (UNVERIFIED)
suumo.jp was not reachable from the build sandbox. The recipe is written from general knowledge of suumo.jp/sp/: it adds apply-button texts, then (if the prompt mentions it) taps the first result's detail link and お気に入り, using text-based lookups with fallbacks. Failures end the run with `要素が見つかりません: …` (status red, no exception). It never submits inquiry forms and acts only on the current page. Marked UNVERIFIED in code comments, bookmarklet page and here. Page navigations kill the injected script, so progress is kept in sessionStorage and the user re-taps the bookmarklet on the next page to resume.

### 9.3 Jev mode (optional)
When a match is ambiguous and the user has entered their own AI Gateway key in the panel settings (standalone PWA: stored only in its own `localStorage['jev.gatewayKey']`; BOOKMARKLET mode on a third-party host page: kept in a module variable only, cleared on reload, never written to host localStorage/sessionStorage/cookies, UI says `このページを閉じるまでのみ保持`; never in code or repo), the engine asks Jev: `POST https://ai-gateway.vercel.sh/v1/evaluate` with `{"model":"typesafe-ai/jev","state":"<page url, intent, candidate controls>","questions":{"q":{"type":"choice","question":"...","criteria":{"<candidateId>":"<description>"}}}}` and uses `answers.q.choice`. Without a key, or on any error, the best heuristic candidate (score >= 0.45) is used. Unit-tested with a mocked fetch.

### 9.4 Safety denylist (engine-enforced, tested)
Never click or submit a control whose label (text, value, aria-label, title, alt) or type matches: 購入, 注文, 今すぐ買う, 応募, 申し込み/申込, 送信, 問い合わせ, 支払い/決済, ログイン, 退会, 削除, 会員登録, Buy Now, Place order, Purchase, Checkout, Apply (bare) / Apply now / Apply for, Submit, Sign in/up, Pay, Delete, Unsubscribe; `カートに入れる` / `Add to cart` only when the prompt itself contains カート. `Apply filters` is allowed. Also never type into `type=password` or card-autocomplete fields, never press submit buttons inside a form that contains them, and never follow `/checkout|login|order|...` links. Blocked controls log `SKIP スキップ(安全のため): <label>` (for submit-type labels: `SKIP 送信はスキップ(安全のため)`). Only a recipe can whitelist labels (`allow`), the demo recipe whitelists the fake 空室状況を問い合わせる modal opener.

### 9.5 Panel (replaces 3.3 where different)
Exact copy of the video's panel: light chrome (J icon, title, pin-off, x), dark card, `⚡ Jev Ultrafast` + badge, `操作するタブ` row, label `Jev にやって欲しいこと — 下のプリセットを押すとそのページを開いて指示が入ります`, large resizable textarea (blue focus ring), three presets, スタート/停止 + timer, `状態` row (`✅ 完了` green / `操作中…` blue / `⏹ 停止しました` amber / error red), grey `Jev への指示（英語化）: …` box generated by rule templates from the parsed intents, dotted-row log (`ms | VERB | label`, values in green 「」), plus a collapsed `Jev モード設定` section (key field, local only).
- `操作するタブ` is a real control. Demo build: a select styled as the box (`<page title> — <url>`, ellipsized) listing the デモサイト一覧 pages (hub, Mamazon, スーモジャ, Personal Form) + `その他のURLを入力…`, which swaps the select for a URL input + `開く` inside the same single box (no separate 対象サイト row). Choosing a demo page navigates to it. An external URL cannot be driven cross-origin from the PWA: a Japanese note explains this, with a button to `bookmarklet.html`, and the site opens in a new tab. Bookmarklet build: read-only box showing `document.title — location.href`.
- Presets OPEN their demo page (`mamazon.html#preset=mamazon`, `index.html#preset=suumoja`, `form.html#preset=form`) and fill the textarea. Mamazon and Personal Form run through the generic engine (no scripted timings); スーモジャ uses the scripted recipe.
- Panel layout: desktop side column; <=768px (or short landscape) bottom sheet with drag handle (collapsed ~148px / half 55dvh / full 88dvh); bookmarklet: always the bottom sheet, rendered in a Shadow DOM so host-page CSS cannot interfere.

### 9.6 Demo pages
`index.html` スーモジャ (section 3.2), `mamazon.html` (search box, price checkbox facets, rating link facets, brand facets, sort dropdown, decoy `カートに入れる`/`今すぐ買う` buttons that do nothing), `form.html` Personal Form (氏名, フリガナ, メールアドレス, 電話番号, 生年月日, 都道府県, 住所, 職業, 希望する連絡方法, 興味のあるテーマ, 備考, 確認チェック, inert `架空の個人情報をコピーする` and `送信（デモ）`), `sites.html` hub (デモサイト一覧). All carry the demo banner and make no external requests.

### 9.7 Bookmarklet
`node tools/build-bookmarklet.mjs` (no deps) bundles engine + generic agent + recipes + panel + CSS into ONE self-contained `web/bookmarklet.js` and generates `web/bookmarklet.html`: a `javascript:` link with the code inlined, a `コピー` button (clipboard API with textarea fallback), short Japanese iOS Safari and Android Chrome steps, usage examples and the safety/UNVERIFIED notes. The bookmarklet selects the recipe by `location.hostname` and otherwise runs the generic engine; tapping it again closes the panel.

### 9.8 Added acceptance criteria
AC12 Generic engine on fixture pages (desktop and 390x844): `Tokyo 1LDK 10万円以下` sets area/layout/rent selects (real-estate style) and presses 検索; `価格 5000円以下 評価4以上 レビュー順` ticks the ¥5,000以下 facet, the ★4以上 link and the レビュー評価順 sort (shop style); `年収600万以上 リモート可 エンジニア` fills the min-salary number input with 600, presses the リモート可 chip, types エンジニア and submits (job-board style).
AC13 Safety fixture: `購入 ログイン Apply 検索` clicks nothing and logs SKIP rows; `「Apply filters」` is clicked; `カートに入れる` is clicked only because the prompt asks.
AC14 Jev mode unit test with mocked fetch (request shape, answer parsing, no key -> no request, errors -> null).
AC15 Mamazon and Personal Form presets complete with the expected control states; Personal Form never clicks 送信（デモ） (logs `送信はスキップ(安全のため)`).
AC16 Bookmarklet bundle injected into a foreign page shows the hostname and `title — href`; `bookmarklet.html` contains the inlined link, copy button and iOS/Android steps.

### 9.9 Extension + external-URL flow
- `extension/` is a Chrome/Edge Manifest V3 extension (permissions: `activeTab`, `scripting` only; no host permissions, no content scripts, no network). `background.js`: toolbar click -> `chrome.scripting.executeScript` sets `__JEV_EXT__` then injects `panel.js` (the bookmarklet bundle, generated by `npm run build:extension`; also writes `dist/jev-ultrafast-extension/` and `dist/jev-ultrafast-extension.zip` via the `zip` CLI if present). Clicking again toggles the panel off. With `__JEV_EXT__` and a viewport > 768px wide and > 500px high the panel is a 380px right-docked, full-height column (`data-dock="right"`, never collapses); narrower it is the usual bottom sheet. Install steps: `extension/README.ja.md`.
- Web app: choosing `その他のURLを入力…` shows only the URL input (placeholder `サイトのURLを入力`) and `開く`; the prompt follows directly below. `開く` with a same-origin URL navigates; external URLs: see 9.10.
- Tests: `tests/ext.mjs` loads the unpacked extension in chromium (`--headless=new`), triggers the background handler (a synthetic click cannot grant `activeTab`, so the test copy of the manifest adds a 127.0.0.1 host permission; the shipped manifest is asserted in unit tests), checks the docked panel, a generic run, and toggle-off. e2e covers the external flow on desktop and 390x844.

### 9.10 Rewriting proxy (`proxy/`) and app wiring (build 2026-10-03 v3)
- A browser cannot drive another origin, so `proxy/` is a tiny standalone Vercel project (`api/p.js`, CommonJS, Node 20, no dependencies; `vercel.json` rewrites `/p/:host/:path*` -> `/api/p?host=:host&path=:path*`). It fetches `https://<host>/<path>` for ALLOWLISTED hosts only, rewrites links to `/p/<host>/...`, injects the shim (fetch/XHR/`new URL`) in `<head>` and `<script src=PANEL_URL data-jev-proxy-host=<host>>` before `</body>`. Not an open proxy: other hosts / IPs / localhost / userinfo / non-443 ports -> Japanese 403 page, never fetched. GET/HEAD only, no cookies either way, CSP/XFO removed, 15 s timeout, 8 MB cap, redirects validated and passed to the browser with rewritten Location, upstream 403/429/5xx or bot-challenge titles -> Japanese error page. Details, limits and deploy steps: `proxy/README.ja.md`. Known breakage: logins, POST forms, SPAs reading `location.pathname`, datacenter-IP blocks, bot protection. **Live-site behaviour (suumo.jp etc.) is untested**; tests use a local fake upstream (`testsite.local` via `JEV_PROXY_TEST_UPSTREAM`, test only).
- Allowlist: one array `ALLOW` in `proxy/api/p.js`, mirrored as `PROXY_HOSTS` in `web/js/config.js` (`PROXY_BASE` default `https://jev-ultrafast-demo.vercel.app`); a unit test asserts equality.
- App: `開く` or `スタート` with an allowlisted external URL navigates the SAME tab to `${PROXY_BASE}/p/<host>/<path+query>#jev-prompt=<base64url(UTF-8 prompt text)>` (hash is never sent to a server). A non-allowlisted external URL sets the status line `このサイトはまだ対応していません（対応: suumo.jp, amazon.co.jp …）` plus the `くわしい手順` link to `bookmarklet.html`.
- Panel in bookmarklet/extension mode: reads `#jev-prompt=` once on load, fills the textarea, removes the hash with `history.replaceState`, never auto-starts. When `data-jev-proxy-host` is present the read-only tab row shows `title — https://<host>/<original path>` and the recipe is picked by that host. Safety denylist unchanged.
- Tests: `npm run test:proxy` = `tests/proxy.test.mjs` (allowlist incl. tricky hosts, redirects, headers/cookies, HTML/CSS rewriting, injection, shim logic, size/timeout, POST) + `tests/proxy-e2e.mjs` (chromium 390x844 on the proxied fake realestate page with the real `bookmarklet.js`: injection, panel, hash prefill/removal, no auto-start, generic run). e2e covers the app side with a stubbed `PROXY_BASE`.

### 9.11 First-time experience (build 2026-10-03 v4)
Goal: a first-time person (iPhone) understands the one action within 3 seconds. User-facing copy never says Jev / Ultrafast / プロキシ / ブックマークレット / CSP / URL / ハッシュ / エンジン / セレクタ (only the panel header logo `Jev Ultrafast` is kept); the bookmarklet is called `自動操作ボタン`; addresses are `サイトのアドレス`. Unit/e2e assert this for `start.html` and the panel text.
- `web/start.html` (also manifest `start_url`, hub `sites.html` first tile, service-worker cache list): ONE box `どのサイトで、何をしたい？`, big button `おまかせで探す`, one line `見つけた物件は、最後に本物のサイトで開いてお気に入りに入れられます`, then a `サイトを選ぶ` grid of 12 sites (住まい / 買い物 / 仕事; 2 columns, >=48px). Tapping an OK site fills a sample sentence. Blocked sites (ZOZOTOWN, Indeed, リクナビNEXT; the site refuses the server) carry the tag `自動操作は使えません` and link straight to the real site in a new tab (no proxy, no auto-start) with the note `このサイトは中継できないため、そのまま開きます`.
- `config.js`: `SITES` (name, start URL, aliases, sample, blocked), `resolveSentence(text)`: a typed address wins, else an alias (NFKC, case-insensitive). Result: proxy href `${PROXY_BASE}/p/<host>/<path>#jev-prompt=<whole sentence>&jev-auto=1`, or `blocked` (+ `サイトを開く` button), or `unknown` (`どのサイトか分かりませんでした。サイト名（例: SUUMO）を入れてください。`). Every SITES host is inside `PROXY_HOSTS`.
- Panel (proxy mode): reads `#jev-prompt=...[&jev-auto=1]` once, removes the hash, auto-starts ONCE (same engine, same safety denylist). A slim dismissible notice `ログインが必要なページでは使えません（詳しく）` links to the ORIGINAL app's `start.html#login` (derived from the panel script `src`). Demo/app mode shows one line `はじめての方はこちら →` (start.html) under the tab row.
- Hand-off (proxy mode only): button `本物の{サイト名}で開く` (+ hint `ログインして♡お気に入りに追加できます`) opens the ORIGINAL URL of the current page (`/p/<host>/<path>?<query>` -> `https://<host>/<path>?<query>`) in the same tab, so a detail page opens the detail page and a list opens the list. Logins never go through the proxy. After a finished run the sheet expands, the button becomes primary and the status reads `見つかりました。お気に入りに入れるときは「本物の…で開く」を押してください`. In proxy mode the engine skips favorite-like controls (お気に入り / ♡ / ウォッチ / いいね / wishlist / like; `policy.noFavorite`), logs `SKIP お気に入りは本物のサイトで（ボタンを表示）` and emphasises the button; outside proxy mode favorites are clicked as before.
- Login guide (not the first-time path): `start.html#login`, opened by the small bottom link `ログインして使いたい方（上級者向け）`; 3 device tabs auto-selected from the userAgent, `自動操作ボタンをコピー` (✅ コピーしました, textarea fallback), short steps with inline-SVG illustrations, PC: `jev-ultrafast-extension.zip` (published beside the app, copied to `web/` by `npm run build:extension`), FAQ. `web/bookmarklet.html` is generated by `tools/build-bookmarklet.mjs` and only forwards to `start.html#login`; the shared copy logic is `web/js/bm.js`.
- Screens: `docs/screens/start-*.png`, `panel-demo-mobile.png`, `hub-mobile.png`.
