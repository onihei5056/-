// アプリ全体で使う型定義

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'radio' // 単一選択(有/無 済/未など) セグメントボタン表示
  | 'checkbox-multi' // 複数選択の大きな選択ボタン
  | 'select'
  | 'calc'; // 自動計算項目(手動修正可)

export interface FieldOption {
  value: string;
  label: string;
}

/** 条件分岐: 指定フィールドの値が特定値のとき表示する */
export interface FieldCondition {
  fieldId: string; // 参照するフィールドID(同一セクション内)
  equals?: string | string[]; // このいずれかに一致で表示(複数選択項目は含むかどうかで判定)
  notEquals?: string | string[];
}

export interface CalcSpec {
  /** 参照するフィールドID群を合計/割合計算する */
  kind: 'sum' | 'ratio';
  /**
   * sum: 合計対象 / ratio: [分子, 分母]
   * 「sectionId.fieldId」形式で他セクションの項目も参照できる
   * (例: 建ぺい率 = 建築面積 ÷ seller-info.landArea)
   */
  sourceFieldIds: string[];
  ratioMultiplier?: number; // ratio用 (例: 100で%表示)
}

export interface FieldDef {
  id: string; // セクション内一意キー(=保存キー)
  label: string; // 画面表示ラベル(元Excel項目名を踏襲)
  type: FieldType;
  required?: boolean; // 必須
  unit?: string; // 単位表示 (m, ㎡, 円 など)
  options?: FieldOption[]; // radio/select/checkbox-multi
  placeholder?: string;
  note?: string; // Excelの注意書き・脚注
  condition?: FieldCondition; // 条件分岐
  needsPhoto?: boolean; // 写真を伴うことが望ましい項目
  calc?: CalcSpec;
  min?: number;
  max?: number;
  maxLength?: number;
  excelRef?: string; // 元Excelのシート名・セル番地
  needsConfirmation?: boolean; // 元Excelの記載だけでは確定できずアプリ側で解釈した項目
}

export interface SubGroup {
  id: string;
  title: string; // 中分類
  fields: FieldDef[];
}

export interface SectionDef {
  id: string; // 大分類のスラッグ = 画面ID
  sheetRef: string; // 対応する元Excelシート・行
  title: string; // 画面タイトル(大分類)
  stepIndex: number; // スマホ画面構成上のステップ番号
  groups: SubGroup[];
  wallSurveyTrigger?: boolean; // このセクションで「擁壁=有」になると擁壁調査を追加対象にする
}

export type AnswerValue = string | string[] | number | null;

export interface SectionAnswers {
  caseId: string;
  sectionId: string;
  values: Record<string, AnswerValue>;
  manualOverride?: Record<string, boolean>; // calc項目を手動修正したかどうか
  updatedAt: number;
  updatedBy: string;
}

/**
 * 写真区分。
 * 設備現況写真シートの6枠(suido/meter/osui/usui/gas/denki)＋
 * 注意事項に登場する下水・浄化槽・その他、
 * 擁壁調査シートの3種(敷地図・撮影方向 / 全景①②③ / 不具合箇所④⑤)。
 */
export type PhotoCategoryKey =
  | 'suido'
  | 'meter'
  | 'osui'
  | 'usui'
  | 'gas'
  | 'denki'
  | 'gesui'
  | 'jokaso'
  | 'other'
  | 'yoheki-site'
  | 'yoheki-view'
  | 'yoheki-defect';

export interface PhotoRecord {
  id: string;
  caseId: string;
  category: PhotoCategoryKey;
  refId?: string; // 擁壁調査ID等、カテゴリ内の紐づけ先
  label?: string; // 擁壁「④不具合箇所(　　)」の箇所名など
  blob: Blob; // 表示・PDF用(圧縮後)
  originalBlob?: Blob; // 原本保持設定時のみ
  mimeType: string;
  takenAt: number; // 撮影日時
  photographer: string; // 撮影者
  comment: string;
  order: number; // 並び順
  rotation: 0 | 90 | 180 | 270;
  includeInPdf: boolean;
  gpsLat?: number;
  gpsLng?: number;
  createdAt: number;
  updatedAt: number;
}

/** 擁壁の許認可(根拠法令ごとの許可・検査済証) */
export interface WallPermitEntry {
  law: string; // 根拠法令
  lawOther: string; // 法令名の自由入力(Excelの空欄チェック用)
  checked: boolean; // この法令に該当するか
  permit: '有' | '無' | '';
  permitDate: string;
  permitNumber: string;
  inspection: '有' | '無' | '';
  inspectionDate: string;
  inspectionNumber: string;
}

export interface WallSurveyRecord {
  id: string;
  caseId: string;
  index: number; // 表示順(擁壁1, 擁壁2...)
  direction: string; // （　）側の擁壁について
  location: '本物件内' | '隣接地内' | ''; // 擁壁の設置場所
  locationDetail: string;
  owner: '売主' | '隣接地' | ''; // 擁壁の所有者
  ownerDetail: string;
  position: '上' | '下' | 'その他' | ''; // 本物件の敷地が擁壁の上/下
  positionOther: string;
  permitRequired: '必要' | '不要' | '不明' | ''; // 擁壁の許認可
  permits: WallPermitEntry[];
  permitUnknown: boolean; // 許認可の取得は不明
  permitNotObtained: boolean; // 許認可を取得していない
  cliffApplicable: '該当しない' | '該当する' | ''; // 「がけ」について
  cliffRestrictionSummary: string; // 制限の概要
  methods: string[]; // 擁壁の工法
  methodOther: string;
  materials: string[]; // 擁壁の材質
  materialOther: string;
  weepHoles: string[]; // 水抜き穴の状況
  drainage: string[]; // 排水設備等の状況
  drainageOther: string;
  deformations: string[]; // 擁壁変状・経年変化
  deformationOther: string;
  otherNote: string; // 【その他】自由記述
  remarks: string; // 備考
  updatedAt: number;
  updatedBy: string;
}

export type CaseStatus = 'draft' | 'in_progress' | 'completed';

export interface SurveyCase {
  id: string;
  name: string; // 案件名
  address: string; // 物件所在地
  surveyDate: string; // 調査日
  surveyor: string; // 担当者
  buildingAgeYears?: number; // 設備現況写真シート免責文に差し込む築年数
  status: CaseStatus;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  deviceId: string; // 最終更新端末
  version: number; // 楽観的排他制御用
}

export interface AuditLogEntry {
  id: string;
  caseId: string;
  action: string;
  detail: string;
  actor: string;
  at: number;
}

export interface ValidationIssue {
  sectionId: string;
  fieldId?: string;
  wallId?: string;
  level: 'error' | 'warning';
  category: 'required' | 'format' | 'range' | 'photo' | 'date' | 'other';
  message: string;
}
