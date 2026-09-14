# データベース設計

## 採用方式

端末内IndexedDB(ライブラリ: [Dexie.js](https://dexie.org/))に一次保存する「オフラインファースト」構成です。
現場での通信不安定を前提に、まず端末内で完結して入力・保存・写真登録・PDF出力まで行える設計とし、
将来的にサーバー同期を追加する場合も同じテーブル構成を送信キューの元データとして流用できるようにしています
(サーバー同期は本バージョンでは未実装。方針は `docs/security.md` および `docs/open-issues.md` を参照)。

実装: `app/src/db/db.ts`(Dexieスキーマ定義)

## ER概要

```mermaid
erDiagram
  CASES ||--o{ SECTION_ANSWERS : "has"
  CASES ||--o{ PHOTOS : "has"
  CASES ||--o{ WALL_SURVEYS : "has"
  CASES ||--o{ AUDIT_LOGS : "has"
  WALL_SURVEYS ||--o{ PHOTOS : "has (refId)"

  CASES {
    string id PK
    string name
    string address
    string surveyDate
    string surveyor
    string status
    number createdAt
    string createdBy
    number updatedAt
    string updatedBy
    string deviceId
    number version
  }
  SECTION_ANSWERS {
    string key PK "caseId::sectionId"
    string caseId FK
    string sectionId
    object values "フィールドID→値"
    object manualOverride "自動計算の手動修正フラグ"
    number updatedAt
    string updatedBy
  }
  PHOTOS {
    string id PK
    string caseId FK
    string category
    string refId "擁壁ID等の紐付け先(任意)"
    blob blob "表示・PDF用(圧縮後)"
    blob originalBlob "原本(設定時のみ)"
    number takenAt
    string photographer
    string comment
    number order
    number rotation
    boolean includeInPdf
    number createdAt
    number updatedAt
  }
  WALL_SURVEYS {
    string id PK
    string caseId FK
    number index
    string orientation
    string location
    string owner
    string positionRelation
    string permitType
    string hasPermit
    string permitDate
    string permitNumber
    string hasInspectionCert
    string inspectionDate
    string inspectionNumber
    string cliffOrdinance
    string method
    string material
    string weepHoleStatus
    string drainageStatus
    array defects "不具合箇所配列"
    string remarks
    number updatedAt
    string updatedBy
  }
  AUDIT_LOGS {
    string id PK
    string caseId FK
    string action
    string detail
    string actor
    number at
  }
```

## テーブル(Object Store)一覧

| テーブル | 主キー | インデックス | 説明 |
|---|---|---|---|
| `cases` | `id` | name, address, surveyDate, surveyor, status, updatedAt | 案件マスタ |
| `sectionAnswers` | `key`(`caseId::sectionId`) | caseId, sectionId, updatedAt | 画面(大分類)ごとの回答値 |
| `photos` | `id` | caseId, category, refId, order, updatedAt | 写真(設備現況・擁壁共通) |
| `wallSurveys` | `id` | caseId, index, updatedAt | 擁壁調査(1案件に複数) |
| `auditLogs` | `id` | caseId, at | 操作履歴(作成・更新・写真追加削除・PDF出力等) |

## 型定義

TypeScript型は `app/src/types.ts` を正とします(`SurveyCase` / `SectionAnswers` / `PhotoRecord` /
`WallSurveyRecord` / `WallDefect` / `AuditLogEntry` / `ValidationIssue`)。

## 複数端末編集時の扱い(要確認込み)

- `cases.updatedAt` / `updatedBy` / `deviceId` / `version` を保持しており、他端末での更新検知の土台としています。
- 現バージョンは**単一端末でのオフライン利用**を主眼としており、複数端末間の自動同期機能は未実装です。
- 複数端末で同一案件を編集する場合は、案件一覧の「複製」機能で明示的にコピーを作るか、将来のサーバー同期実装時に
  `version` を用いた楽観的排他制御(サーバー側が保持するバージョンと不一致の場合は上書きせず競合として通知)を
  行う設計を想定しています。詳細は `docs/open-issues.md` の該当項目を参照してください。

## オフラインデータの無制限保持を避ける設計

- 写真は既定で圧縮後画像のみ保持(原本保持は設定でオプトイン、`survey-keep-original-photo`)。
- 案件削除時はトランザクションで `sectionAnswers` / `photos` / `wallSurveys` / `auditLogs` を連鎖削除。
- 個人情報を含む案件データを無制限に端末へ残さないよう、PDF出力完了後の案件のエクスポート/バックアップ後に
  古い案件を一覧から削除する運用を想定(具体的な保持期間ポリシーは組織側で決定し、`docs/security.md` に追記してください)。
