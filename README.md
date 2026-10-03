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
npm test                      # unit + Playwright e2e + 拡張 + CSP + プロキシ（npm run test:proxy）。node:test + Playwright e2e（/opt/pw-browsers の chromium を使用）
```
スマホでは「ホーム画面に追加」でPWAとして使えます。はじめての方は `web/start.html`（サイト名とやりたいことを書いて「おまかせで探す」）。ログインして使う場合は `start.html#login` で「自動操作ボタン」（ブックマーク）を作ります（`bookmarklet.html` は古いリンク用の転送ページ）。

詳細は `docs/spec.md`（9章が汎用エンジン/ブックマークレット）と `docs/plan.md`。スクリーンショットは `docs/screens/`。

## 実サイト（suumo など）で使う
- **PC（Chrome / Edge）**: `extension/` を「パッケージ化されていない拡張機能」として読み込み（手順は `extension/README.ja.md`、`npm run build:extension` で `dist/jev-ultrafast-extension.zip` も作成）。ツールバーのボタンで右側にパネルが出ます。
- **スマホ（かんたん）**: `start.html` に「SUUMOで東京の1LDK、家賃10万円以下」のように書いて「おまかせで探す」。対応サイトを自動で開き、そのまま自動操作します（購入・応募・送信・ログインは押しません）。見つけたら「本物のサイトで開く」ボタンでログイン・お気に入りへ。Indeed / ZOZOTOWN / リクナビNEXT は中継できないため、そのまま開きます。
- **スマホ（プロキシ経由・従来）**: アプリの「操作するタブ」に対応サイト（suumo.jp、amazon.co.jp など）のURLを入れて「開く」を押すと、許可リスト限定の書き換えプロキシ経由でそのサイトがJevパネル付きで開き、指示文が入った状態になります（自動では始まりません）。プロキシは `proxy/`（Vercel、Root Directory を `proxy/` に。手順は `proxy/README.ja.md`）。**実サイトでの動作は未検証**で、ログイン・POST・重いアプリ・ボット対策のサイトでは動きません。対応外のサイトは `start.html#login` の手順が出ます。
- 他サイトのページに画面を出せるのは拡張機能か「自動操作ボタン」（ブックマークレット）だけです（Webページ単体では不可）。
