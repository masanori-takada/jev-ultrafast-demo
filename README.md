# スーモジャ × Jev Ultrafast デモ

AIエージェントパネル「Jev Ultrafast」の再現デモ（すべて架空・端末内で動作。外部通信なし）と、任意のサイトで使えるブックマークレット。

- `web/index.html` スーモジャ（架空の不動産サイト）+ パネル。`mamazon.html`（架空の通販）、`form.html`（架空フォーム）、`sites.html`（デモサイト一覧）
- エージェントは汎用エンジン（`web/js/generic/`）。フリーテキストを解釈して画面上の絞り込みコントロールを操作します。サイト別の「レシピ」（`web/js/adapters/`）は補助です。**suumo.jp 用レシピは実サイト未検証**です。
- 安全: 購入・注文・応募・申込・送信・問い合わせ・ログイン・支払い・削除などは押しません（ログに `スキップ(安全のため)`）。
- Jev モード（任意）: パネル設定に自分のAI Gatewayキーを入力（localStorageのみ。リポジトリには含まれません）。

## 使い方
```
node tests/serve.mjs          # http://127.0.0.1:4173/ （任意の静的ホストでも可。SWはHTTPS/localhost必須）
node tools/build-bookmarklet.mjs   # web/bookmarklet.js と web/bookmarklet.html を生成
npm test                      # node:test + Playwright e2e（/opt/pw-browsers の chromium を使用）
```
スマホでは「ホーム画面に追加」でPWAとして使えます。実サイトで使うには `web/bookmarklet.html`（iOS Safari / Android Chrome の手順付き）からブックマークレットを登録してください。

詳細は `docs/spec.md`（9章が汎用エンジン/ブックマークレット）と `docs/plan.md`。スクリーンショットは `docs/screens/`。
