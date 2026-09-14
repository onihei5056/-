# 配置用ファイル(ビルド済み)

`不動産現地調査PWA_配置用.zip` は、そのままWebサーバーに置けば動く状態にビルドしたファイル一式です。
パソコンでのビルド作業(`npm install` など)をせずに配置したい場合に使用してください。

## 使い方

1. このZIPをダウンロードして解凍する
2. 解凍して出てきた**中身をすべて**、Webサーバーの公開フォルダにアップロードする
   - 例: `public_html/survey/` に入れる → `https://自社ドメイン/survey/` で開ける
   - サブフォルダでも動きます(特別な設定は不要)
3. **HTTPS(`https://`)でアクセスできることを必ず確認する**
   - `http://` ではiPhoneのホーム画面追加もオフライン機能も動作しません
4. iPhoneのSafariでそのURLを開き、共有ボタン →「ホーム画面に追加」

詳しい手順は `../docs/iphone-setup.md` を参照してください。

## 中身

| ファイル/フォルダ | 内容 |
|---|---|
| `index.html` | アプリの入口 |
| `assets/` | アプリ本体(JavaScript・CSS) |
| `icons/` | ホーム画面用アイコン |
| `manifest.webmanifest` | アプリとして扱うための設定 |
| `sw.js`, `workbox-*.js` | オフライン動作用 |
| `quarto/` | 既存のクアルトゲーム(不動産調査アプリとは無関係) |

## 注意

このZIPは作成時点のスナップショットです。ソースコードを変更した場合は、
`app` フォルダで `npm run build` を実行して `app/dist` の中身を使うか、
GitHub Actions(`.github/workflows/deploy-pages.yml`)による自動公開をご利用ください。
