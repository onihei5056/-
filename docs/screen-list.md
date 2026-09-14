# 画面一覧

| No | 画面名 | パス(ルーティング) | 主なコンポーネント | 概要 |
|---|---|---|---|---|
| 1 | 案件一覧 | `#/` | `CaseListPage` | 案件の検索・新規作成・サンプル作成・複製・削除 |
| 2 | 新規調査の作成 | `#/case/new` | `CaseNewPage` | 案件名・所在地・調査日・担当者を入力して案件を作成 |
| 3 | 物件基本情報 | `#/case/:id/property-basic` | `SectionPage` | 物件種別・地番家屋番号・建築年月日・面積・評価額・境界明示・マンション調査事項 |
| 4 | 売主および権利関係 | `#/case/:id/seller-rights` | `SectionPage` | 面談情報・登記名義人・売却理由・空家・残置物・第三者占有・契約不適合等 |
| 5 | 法務局調査 | `#/case/:id/registry` | `SectionPage` | 登記記録・抵当権・地役権等 |
| 6 | 役所調査 | `#/case/:id/city-office` | `SectionPage` | 役所調査・取得書類 |
| 7 | 道路、用途地域、建築制限 | `#/case/:id/road-zoning` | `SectionPage` | 計画道路・用途地域・建蔽率容積率・道路種別・高さ制限等 |
| 8 | 上下水道、電気、ガス | `#/case/:id/utilities` | `SectionPage` | 飲用水・電気・ガス・太陽光・汚水雑排水 |
| 9 | 周辺環境 | `#/case/:id/surroundings` | `SectionPage` | 周辺施設・ブロック塀・擁壁有無・がけ条例・町内会・隣家訪問 |
| 10 | 設備現況写真 | `#/case/:id/equipment-photos` | `EquipmentPhotosPage` + `PhotoManager` | 9区分の写真登録(撮影・選択・コメント・並び替え・回転・削除・PDF掲載切替) |
| 11 | 擁壁調査 | `#/case/:id/wall-survey` | `WallSurveyPage` + `PhotoManager` | 擁壁の複数追加、許認可・工法・不具合箇所・写真 |
| 12 | 入力内容確認 | `#/case/:id/confirm` | `ConfirmPage` | エラー/警告の一覧表示、タップでジャンプ、警告確認チェック |
| 13 | PDFプレビュー | `#/case/:id/pdf-preview` | `PdfPreviewPage` | PDF生成・プレビュー・印刷・共有・端末保存・再出力 |
| 14 | 設定 | `#/settings` | `SettingsPage` | 写真原本保持設定、簡易PINロック設定 |

画面3〜11がスマートフォン向けステップフロー(全11ステップ)を構成し、`app/src/schema/flow.ts` の
`FLOW_STEPS` で順序を一元管理しています。各画面は共通の `TopBar`(案件名・ステップ・進捗率・保存状態・
未入力必須項目数)と `BottomNav`(戻る・一時保存・次へ)を持ちます。
