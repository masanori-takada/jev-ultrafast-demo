# Jev プロキシ（許可リスト限定の書き換えプロキシ）

アプリの「操作するタブ」にURLを入れて「開く」を押すと、そのサイトを **Jev パネル付きで** 開くための小さなサーバーです（Vercel の関数 1 本、依存ライブラリなし）。ブラウザは他サイトのページを直接操作できないため、サーバー側でページを取得し、リンクを `/p/<ホスト>/...` に書き換え、パネルのスクリプトを差し込みます。ブックマークレットと拡張機能は引き続き代替手段です。

`GET /p/<ホスト>/<パス>?<クエリ>` → `https://<ホスト>/<パス>?<クエリ>`

## 対応サイト（許可リスト）
`suumo.jp` `amazon.co.jp` `amazon.com` `indeed.com` `jp.indeed.com` `doda.jp` `rikunabi.com` `mynavi.jp` `green-japan.com` `wantedly.com` `kakaku.com` `rakuten.co.jp` `zozo.jp` `mercari.com`（サブドメイン可）。

リストは `api/p.js` 冒頭の `ALLOW` と、アプリ側 `web/js/config.js` の `PROXY_HOSTS` の2か所（`npm run test:proxy` で一致を検査）。それ以外のホスト、IPアドレス、localhost、ユーザー情報付きURL、443以外のポートは、取得せずに403の案内ページを返します（オープンプロキシではありません）。

## 動作
- GET / HEAD のみ。Cookie は送受信とも捨てます。転送するヘッダーは Accept / Accept-Language / User-Agent のみ。
- 応答から CSP・X-Frame-Options を外し、`noindex` と `no-store` を付けます。HTML 内の `<meta>` CSP と `integrity` も外します。
- HTML: `href src action srcset data-src poster`、`<style>`/`style=` 内の `url()`/`@import`、`<base>` を書き換え、`<head>` に fetch/XHR/`new URL` 用の小さな補正を、`</body>` 直前にパネルの `<script data-jev-proxy-host>` を差し込みます。CSS は `url()`/`@import` を書き換え。JS・JSON・画像などはそのまま。Shift_JIS / EUC-JP は UTF-8 に変換。
- リダイレクトは許可リスト内のものだけ、`Location` を `/p/<ホスト>/...` に書き換えてブラウザへ返します（リスト外は403）。タイムアウト15秒、本文は最大8MB。
- パネルのスクリプトは既定で `https://masanori-takada.github.io/jev-ultrafast-demo/bookmarklet.js`。環境変数 `JEV_PANEL_URL` で変更できます。

## できないこと（正直な制限）
- ログイン、POST フォーム（検索ボタンが POST のサイト）、購入・応募・送信（もともと Jev は押しません）。
- クライアント側で組み立てるURL（インラインJS）や `location.pathname` に依存する SPA・重いクライアントアプリ。
- Vercel などデータセンターのIPを拒否するサイト、ボット対策（CAPTCHA 等）。403/429/5xx やボット確認画面は日本語のエラーページになります。
- Vercel の応答サイズ上限（約4.5MB）。プロキシのドメインは全サイトで共有されます（localStorage も共通）。許可リストを広げすぎないでください。
- **実サイト（suumo.jp など）での動作は未検証です。** テストは手元の疑似サイトのみ（インターネット接続なし）。

## Vercel へのデプロイ
1. Vercel で新規プロジェクトを作り、リポジトリを選んで **Root Directory を `proxy/`** にする（Framework は Other、ビルド設定なし）。
2. プロジェクト名を `jev-ultrafast-demo` にすると `https://jev-ultrafast-demo.vercel.app` になり、アプリの既定値 `PROXY_BASE`（`web/js/config.js`）と一致します。別名なら `PROXY_BASE` を直してビルドし直してください。
3. 環境変数は不要です（`JEV_PROXY_TEST_UPSTREAM` はテスト専用なので **本番では絶対に設定しない**）。
4. 確認: `https://<あなたのドメイン>/p/suumo.jp/sp/` を開く。

## ローカルテスト
`npm run test:proxy`（node:test と Playwright。疑似サイト `testsite.local` を `JEV_PROXY_TEST_UPSTREAM` で手元のサーバーに向けます）。
