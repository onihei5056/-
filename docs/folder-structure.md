# フォルダ構成

```
/(リポジトリルート)
├── README.md                 … 既存(元のリポジトリ用、簡易)
├── index.html, ...           … 既存の別プロジェクト(クアルトボードゲーム、本タスクと無関係)
├── docs/                     … 本タスクの納品ドキュメント一式(このディレクトリ)
│   ├── excel-analysis.md
│   ├── screen-list.md
│   ├── item-definitions.md
│   ├── mapping-table.md
│   ├── db-design.md
│   ├── screen-flow.md
│   ├── folder-structure.md   … (本ファイル)
│   ├── security.md
│   ├── operation-manual.md
│   ├── test-items.md
│   ├── device-check-points.md
│   └── open-issues.md
└── app/                      … 不動産現地調査PWA 本体
    ├── README.md              … セットアップ〜配置〜保守までの操作マニュアル(技術知識が少ない担当者向け)
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts         … Vite + vite-plugin-pwa(Service Worker/Manifest生成)設定
    ├── index.html             … アプリのエントリHTML
    ├── public/
    │   └── icons/              … PWAアイコン(192/512/512maskable/apple-touch-icon)
    └── src/
        ├── main.tsx           … Reactエントリポイント
        ├── App.tsx            … ルーティング定義(react-router, 遅延ロード)
        ├── styles.css         … 全画面共通スタイル(業務用デザイン: 紺基調・大きい文字/ボタン)
        ├── types.ts           … 全体で使う型定義(案件/写真/擁壁/項目定義/検証結果)
        ├── vite-env.d.ts
        ├── db/
        │   └── db.ts          … IndexedDB(Dexie)スキーマ、現在ユーザー/端末ID、監査ログ
        ├── schema/
        │   ├── sections.ts    … 項目定義スキーマ本体(元Excelのセル番地付き)+ 写真区分 + 脚注※1〜※20
        │   ├── wall.ts        … 擁壁調査シートの選択肢定義(工法・材質・水抜き穴・排水・変状・根拠法令)と免責文
        │   └── flow.ts        … スマホ入力フローのステップ順序定義
        ├── hooks/
        │   ├── useCase.ts           … 案件情報の取得
        │   ├── useSectionAnswers.ts … セクション回答の読込・自動保存(デバウンス)・手動保存
        │   ├── useGlobalAnswers.ts  … 全セクションの回答＋計算結果(セクション横断の自動計算用)
        │   └── useIssues.ts         … 入力チェック結果の取得
        ├── components/
        │   ├── TopBar.tsx        … 案件名/所在地/ステップ/進捗率/保存状態/未入力必須数
        │   ├── BottomNav.tsx     … 戻る/一時保存/次への固定フッター
        │   ├── DynamicForm.tsx   … 項目定義スキーマから画面を自動描画
        │   ├── FieldInput.tsx    … 項目種別ごとの入力コントロール(テキスト/数値/日付/選択/計算等)
        │   ├── PhotoManager.tsx  … 写真登録(撮影/選択/圧縮/コメント/箇所名/並び替え/回転/削除/PDF掲載切替)
        │   ├── WallFields.tsx    … 擁壁調査シート専用の入力部品(セグメント/複数選択/テキスト/日付)
        │   ├── AuthGate.tsx      … 簡易PINロック画面
        │   ├── InstallPrompt.tsx … ホーム画面追加の案内(iOS/Android)
        │   └── UpdateToast.tsx   … 新バージョン検知時の更新通知
        ├── pages/
        │   ├── CaseListPage.tsx        … 案件一覧(検索・新規・サンプル作成・複製・削除)
        │   ├── CaseNewPage.tsx         … 新規調査の作成
        │   ├── SectionPage.tsx         … 汎用セクション入力画面(3〜9番目の全画面を1コンポーネントで担当)
        │   ├── EquipmentPhotosPage.tsx … 設備現況写真
        │   ├── WallSurveyPage.tsx      … 擁壁調査(複数追加)
        │   ├── ConfirmPage.tsx         … 入力内容確認
        │   ├── PdfPreviewPage.tsx      … PDFプレビュー・出力
        │   └── SettingsPage.tsx        … 設定(写真原本保持、PINロック)
        ├── pdf/
        │   ├── blocks.ts       … PDF用DOMブロック生成(見出し/表/写真カード)
        │   └── generator.ts    … データ収集→ページ割付(ビンパッキング)→html2canvas→jsPDF
        └── utils/
            ├── id.ts           … ID生成
            ├── condition.ts    … 条件分岐の評価
            ├── calc.ts         … 自動計算(合計/比率)
            ├── image.ts        … 写真の圧縮・回転・DataURL変換
            ├── validation.ts   … 入力チェック(必須/数値/日付/写真必須)とエラー・警告の分類
            ├── progress.ts     … 進捗率・ステップ完了判定
            ├── auth.ts         … 簡易PINロックのハッシュ化・アンロック状態管理
            └── sampleData.ts   … サンプル案件生成(動作確認用)
```

## 設計上のポイント

- **項目定義とUIの分離**: `schema/sections.ts` に全項目を宣言的に定義し、`DynamicForm` / `FieldInput` が
  それを解釈して画面を生成します。項目の追加・変更・並び替えは基本的に `sections.ts` の編集のみで完結します
  (擁壁調査のみ項目数・構造が複雑なため専用画面 `WallSurveyPage.tsx` で個別実装)。
- **入力画面とPDF帳票の分離**: 入力はカード/ステップ形式のUI(`pages/*`)、PDF出力は `pdf/generator.ts` が
  同じIndexedDBデータから独立して帳票レイアウトを生成します。画面の見た目を変えてもPDFレイアウトには影響しません。
- **コード分割**: `App.tsx` で各ページを `React.lazy` により遅延ロードし、特にサイズの大きい
  PDF生成(jsPDF + html2canvas)は「PDFプレビュー」へ遷移した時点で初めて読み込むようにし、
  スマートフォンでの初期表示を軽量に保っています。
