# Room Visualizer（AIインテリアイメージ）— モック版

不動産会社の営業担当者向けの **AI部屋イメージ生成ツール** です。
空室・中古住宅・マンションの室内写真から、家具を配置した「完成後のイメージ画像」を作成し、
お客様への提案や物件広告に使える形で保存できます。

> **本アプリの思想**
> AIで部屋そのものを別物に作り替えるのではなく、
> **窓位置・柱・梁・ドア・間取り・部屋の形・撮影アングルは維持したまま**、
> 家具・インテリア・床・壁・照明だけを変更します。
> 実物と違う構造の画像を広告に使わないための設計です。

> **現在はモック版です。**
> 画像生成APIには接続していません。**外部通信を行わないため、API利用料金は一切発生しません。**
> 生成結果は、同じ部屋の骨格を共有するサンプルシーン（SVG）や、
> アップロード写真への色調補正＋家具レイヤー合成で再現しています。

---

## 1. 起動方法

必要なもの：Node.js 20以上（推奨 22）と npm

```bash
cd room-visualizer
npm install      # 初回のみ
npm run dev      # 開発サーバー起動 → http://localhost:5174/
```

その他のコマンド：

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動（ホットリロードあり） |
| `npm run build` | 本番ビルド（`dist/` に静的ファイルを出力） |
| `npm run preview` | ビルド結果をローカルで確認（http://localhost:4173/） |
| `npm run typecheck` | 型チェックのみ実行 |

ビルド結果の `dist/` は、静的ファイルを置けるWebサーバーにそのまま配置できます
（サーバー言語は不要。`vite.config.ts` の `base: './'` により、サブディレクトリ配置にも対応）。

---

## 2. 主な機能

### 画像生成メイン画面（`#/generate`）

3カラム構成です。

| 位置 | 内容 |
|---|---|
| 左 | 設定パネル（①画像アップロード → ②部屋タイプ → ③スタイル → ④変更項目 → ⑤リフォーム → ⑥ターゲット → ⑦自由入力 → 生成ボタン） |
| 中央 | Before/After比較（スライダー／左右並べ）と生成候補一覧 |
| 右 | 選択中画像のポイント・使用アイテム例・各種操作 |

実装済みの動作：

- 画像アップロード（ドラッグ＆ドロップ／ファイル選択、JPG・PNG・WEBP、長辺1600pxへ自動縮小）
- アップロード画像のプレビュー・削除・別画像に変更
- サンプル写真の読み込み（「サンプル写真で試す」）
- 部屋タイプ／インテリアスタイル（複数可）／変更項目（複数可）／リフォームイメージ／ターゲット／自由入力
- 生成ボタン → ローディング演出（「お部屋のイメージを作成しています…」）→ 結果表示
- **選択条件が生成結果に反映されます**（例：「観葉植物を追加」で植物が出現、「床をダーク系に」で床が暗くなる、「照明をダウンライト風に」で照明が変わる）
- Before / After スライダー（左：元写真／右：生成イメージ）と左右比較の切り替え
- 生成候補カード（お気に入り／拡大／ダウンロード／再生成）
- 画像拡大モーダル（Escで閉じる）
- 右カラムの内容切り替え（ポイント・使用アイテム・操作）
- 同じスタイルで再生成（毎回少し違う仕上げになります）／別スタイルを追加生成
- 物件情報の入力（物件名・所在地・部屋番号・担当者・用途・メモ、すべて任意）

### 履歴画面（`#/history`）

- 生成日時・物件名・部屋タイプ・選択スタイル・元画像・生成画像・お気に入り状態を一覧表示
- 検索：物件名（所在地・担当者・メモも対象）／生成日／スタイル／部屋タイプ
- 「この条件で開く」で生成画面へ読み込み、削除も可能

### お気に入り画面（`#/favorites`）

- お気に入り登録した生成画像を **案件ごとにまとめて** 表示
- 拡大・ダウンロード・お気に入り解除・案件を開く

### ホーム（`#/home`）／設定（`#/settings`）

- ホーム：使い方（3ステップ）と最近の案件
- 設定：ダウンロード画像への注意文の焼き込み切り替え、保存先の説明、履歴の初期化

### 保存について

お気に入り・履歴はブラウザの **LocalStorage** に保存され、更新しても保持されます
（キー：`roomVisualizer.records.v1`）。容量上限に配慮し、履歴は直近15件を保持します。
端末・ブラウザをまたいだ共有はできないため、将来的にはサーバー保存への移行を想定しています。

### 注意表示（免責）

「本画像はAIによるイメージです。実際の物件の設備・仕様・家具配置とは異なる場合があります。」を
生成結果付近・拡大表示・画面下部に常時表示します。
設定画面のスイッチをONにすると、**ダウンロードする画像の下部にもこの一文を焼き込みます**（初期値ON）。
文言は `src/mock/options.ts` の `DISCLAIMER` で変更できます。

---

## 3. フォルダ構成

```
room-visualizer/
├── index.html                  … エントリHTML
├── vite.config.ts              … Vite設定（ポート5174 / base './'）
├── .env.example                … 環境変数のサンプル（.env は作成してください・Git管理外）
└── src/
    ├── main.tsx                … エントリポイント
    ├── App.tsx                 … 画面切り替え（ハッシュルーティング）とトースト
    ├── styles.css              … デザイントークンと全画面のスタイル
    ├── types.ts                … 型定義（生成条件・生成結果・履歴など）
    ├── api/
    │   ├── generateImage.ts    … ★画像生成レイヤー（APIに差し替えるのはここだけ）
    │   └── promptBuilder.ts    … プロンプト生成（構造維持の指示を必ず先頭に付与）
    ├── mock/
    │   ├── roomScene.ts        … 室内シーンのSVG描画（部屋の骨格は全スタイル共通）
    │   ├── styles.ts           … インテリアスタイル10種のパレット・ポイント・アイテム
    │   ├── options.ts          … 部屋タイプ・変更項目・リフォーム・ターゲット・免責文
    │   └── sampleProjects.ts   … サンプル案件2件（初回起動時に履歴へ投入）
    ├── store/AppStore.tsx      … 履歴・お気に入りの状態（LocalStorage保存）
    ├── hooks/useLocalStorage.ts
    ├── utils/
    │   ├── image.ts            … 画像の縮小・ダウンロード・免責文の焼き込み
    │   └── format.ts           … 日時整形・ファイル名の安全化
    ├── icons/index.tsx         … SVGアイコン（外部ライブラリ不使用）
    ├── components/
    │   ├── Header.tsx              … ヘッダー（ナビ＋アップロードボタン）
    │   ├── UploadPanel.tsx         … 画像アップロード
    │   ├── PropertyForm.tsx        … 物件情報
    │   ├── StyleSelector.tsx       … インテリアスタイル選択（サンプル画像付き）
    │   ├── GenerationOptions.tsx   … 部屋タイプ／変更項目／リフォーム／ターゲット／自由入力
    │   ├── BeforeAfter.tsx         … Before/Afterスライダー・左右比較
    │   ├── ResultGallery.tsx       … 生成候補一覧
    │   ├── ResultDetail.tsx        … 右カラム詳細
    │   ├── ImageModal.tsx          … 画像拡大モーダル
    │   ├── Loading.tsx             … ローディング演出
    │   └── Disclaimer.tsx          … 免責表示
    └── pages/
        ├── GeneratePage.tsx    … 画像生成メイン画面
        ├── HistoryPage.tsx     … 履歴画面
        ├── FavoritesPage.tsx   … お気に入り画面
        ├── HomePage.tsx        … ホーム
        └── SettingsPage.tsx    … 設定
```

---

## 4. 将来的に画像生成APIを接続する場所

差し替えるのは **`src/api/generateImage.ts` の `generateImage()` だけ** です。
UI側は入出力（`GenerateImageRequest` / `GenerateImageResponse`）しか見ていないため、画面の修正は不要です。

```ts
// src/api/generateImage.ts
export async function generateImage(req: GenerateImageRequest): Promise<GenerateImageResponse> {
  const prompt = buildPrompt(req.condition, req.styleId, req.property);

  // 将来的に画像生成APIへ接続
  const res = await fetch(import.meta.env.VITE_IMAGE_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: req.source.dataUrl,               // 元写真
      prompt,                                   // 構造維持の指示を含むプロンプト
      model: import.meta.env.VITE_IMAGE_API_MODEL,
    }),
  });
  const { imageUrl } = await res.json();
  // …GeneratedImage を組み立てて返す
}
```

プロンプトは `src/api/promptBuilder.ts` で組み立て済みです。
`STRUCTURE_LOCK_PROMPT`（窓・柱・梁・ドア・間取り・アングルを変えない指示）が必ず先頭に入ります。

### APIキーの取り扱い（重要）

- **APIキーはコードに直書きしないでください。**
- **フロントエンド（`.env` の `VITE_` 変数を含む）にも置かないでください。**
  `VITE_` で始まる環境変数はビルド結果に埋め込まれ、ブラウザから読み取れてしまいます。
- APIキーは **自社サーバー（バックエンド）側で保持** し、このアプリからは自社サーバーのエンドポイントを呼び出す構成にしてください。
- `.env` は `.gitignore` 済みです。設定例は `.env.example` を参照してください。

```
VITE_IMAGE_SOURCE=mock                                  # mock | api
VITE_IMAGE_API_ENDPOINT=https://example.com/api/room-image
VITE_IMAGE_API_MODEL=gpt-image-1
```

### そのほかの連携ポイント

| 項目 | 場所 | 内容 |
|---|---|---|
| 物件DB連携 | `src/components/PropertyForm.tsx` | 物件名の候補（`datalist`）を社内DBから取得する想定。`PropertyInfo.externalId` にレコードIDを保持できます |
| 保存先の移行 | `src/store/AppStore.tsx` / `src/hooks/useLocalStorage.ts` | LocalStorage → サーバーAPIへ差し替え |
| 共有機能 | `src/pages/GeneratePage.tsx` の `handleShare` | 現在はクリップボードコピー。共有リンク発行へ差し替え |

---

## 5. モック版での制限事項

- 画像生成AIは使用していません。サンプル物件は同じ骨格のSVGシーンを描き分け、アップロード写真は色調補正＋家具レイヤーの合成で代替しています。
- アップロード写真に合成する家具は、写真の実際の床面・奥行きを解析していないため、位置が完全には合いません（API接続後は解消されます）。
- リフォーム項目のうち「キッチンを新しく見せる」「洗面・水回りを新しく見せる」「建具を変更」は、選択状態とプロンプトへの反映のみです。
- ログイン・ユーザー管理はありません。
