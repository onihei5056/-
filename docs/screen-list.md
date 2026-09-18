# 画面一覧

| No | 画面名 | パス(ルーティング) | 主なコンポーネント | 対応する元Excel |
|---|---|---|---|---|
| 1 | 案件一覧 | `#/` | `CaseListPage` | - |
| 2 | 新規調査の作成 | `#/case/new` | `CaseNewPage` | - |
| 3 | 売主・面談情報 | `#/case/:id/seller-info` | `SectionPage` | 不動産調査シート(旧版) 2〜17行 / I8:J15 |
| 4 | 物件情報・権利関係 | `#/case/:id/property-rights` | `SectionPage` | 不動産調査シート(旧版) 19〜25行 |
| 5 | 法務局調査 | `#/case/:id/registry` | `SectionPage` | 不動産調査シート(旧版) 26〜33行 |
| 6 | 役所調査(都市計画法・建築基準法など) | `#/case/:id/city-office` | `SectionPage` | 不動産調査シート2026.3.1 2〜39行 |
| 7 | 飲用水・電気・ガス・排水施設 | `#/case/:id/utilities` | `SectionPage` | 不動産調査シート2026.3.1 40〜53行 |
| 8 | 周辺環境他 | `#/case/:id/surroundings` | `SectionPage` | 不動産調査シート2026.3.1 54〜67行(＋旧版A80) |
| 9 | マンション調査事項 | `#/case/:id/mansion` | `SectionPage` | 不動産調査シート2026.3.1 68〜74行 |
| 10 | 設備現況写真 | `#/case/:id/equipment-photos` | `EquipmentPhotosPage` + `PhotoManager` | 設備現況写真シート |
| 11 | 擁壁調査シート | `#/case/:id/wall-survey` | `WallSurveyPage` + `PhotoManager` | 擁壁調査シート |
| 12 | 入力内容確認 | `#/case/:id/confirm` | `ConfirmPage` | - |
| 13 | PDFプレビュー | `#/case/:id/pdf-preview` | `PdfPreviewPage` | - |
| 14 | 設定 | `#/settings` | `SettingsPage` | - |

画面3〜13は「戻る/次へ」で順に辿れるほか、各画面上部の**目次タブ**(`SectionTabs`)から
任意の大分類へ直接移動できます。順序は `app/src/schema/flow.ts` の `FLOW_STEPS` で一元管理しています。

各入力画面は共通の以下の要素を持ちます。

- `TopBar` … 物件名・所在地・現在の大分類・入力状況(%)・入力済み項目数・一時保存状態
- `SectionTabs` … 大分類を横並びで表示する目次。タブごとに入力済み件数を表示し、
  未着手/入力中/完了を枠線の色で区別する
- `DynamicForm` … 中分類ごとの開閉式(アコーディオン)。既定では閉じており、
  見出しをタップすると小項目が開く。見出しには入力済み件数を表示
- `BottomNav` … 戻る・一時保存・次へ

### 必須項目の扱い

必須は**物件名のみ**(案件作成時に入力)。調査シート内の項目はすべて任意入力で、
**未入力のままでもPDFを出力できます**。入力チェックの結果は「確認をおすすめする事項」として
確認画面に一覧表示されますが、出力を妨げません。

画面3〜9は項目定義スキーマ(`app/src/schema/sections.ts`)から `SectionPage` が自動生成しており、
項目の追加・変更はスキーマの編集のみで反映されます。擁壁調査シートのみ、元Excelの帳票構造が
特殊(根拠法令×許可/検査済証のマトリクス、写真6枠)なため専用画面として実装しています。
