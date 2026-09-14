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
  equals?: string | string[]; // このいずれかに一致で表示
  notEquals?: string | string[];
}

export interface CalcSpec {
  /** 参照するフィールドID群を合計/割合計算する */
  kind: 'sum' | 'ratio';
  sourceFieldIds: string[]; // sum: 合計対象 / ratio: [分子, 分母]
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
  note?: string; // Excelの注意書き
  condition?: FieldCondition; // 条件分岐
  needsPhoto?: boolean; // 写真必須項目
  photoCategory?: string; // 紐づく写真区分キー
  calc?: CalcSpec;
  min?: number;
  max?: number;
  maxLength?: number;
  excelRef?: string; // 元Excel対応セル/シート参照(要確認込み)
  needsConfirmation?: boolean; // 元Excel未提供のため一般様式で仮定義した項目
}

export interface SubGroup {
  id: string;
  title: string; // 中分類
  fields: FieldDef[];
}

export interface SectionDef {
  id: string; // 大分類のスラッグ = 画面ID
  sheetRef: string; // 対応する元Excelシート名(仮)
  title: string; // 画面タイトル(大分類)
  stepIndex: number; // スマホ画面構成上のステップ番号
  groups: SubGroup[];
  wallSurveyTrigger?: boolean; // このセクションで「擁壁=有」等になると擁壁調査を追加対象にする
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

export type PhotoCategoryKey =
  | 'suido' // 上水道
  | 'meter' // メーターボックス
  | 'osui' // 汚水
  | 'usui' // 雨水
  | 'gesui' // 下水
  | 'jokaso' // 浄化槽
  | 'gas' // ガス
  | 'denki' // 電気
  | 'other' // その他設備
  | 'yoheki'; // 擁壁(不具合箇所等)

export interface PhotoRecord {
  id: string;
  caseId: string;
  category: PhotoCategoryKey;
  refId?: string; // 擁壁調査ID等、カテゴリ内の紐づけ先
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

export interface WallDefect {
  id: string;
  types: string[]; // クラック/水平移動/不同沈下/ふくらみ/傾斜 等(複数選択)
  location: string; // 不具合箇所の説明
  note: string;
}

export interface WallSurveyRecord {
  id: string;
  caseId: string;
  index: number; // 表示順(第1擁壁, 第2擁壁...)
  orientation: string; // 対象擁壁の方位/場所
  shootingDirection: string; // 撮影方向
  location: string; // 擁壁の設置場所
  owner: string; // 擁壁の所有者
  positionRelation: '上側' | '下側' | ''; // 本物件が上側/下側
  permitType: string; // 許認可の種類
  hasPermit: '有' | '無' | '';
  permitDate: string;
  permitNumber: string;
  hasInspectionCert: '有' | '無' | '';
  inspectionDate: string;
  inspectionNumber: string;
  cliffOrdinance: '該当' | '非該当' | '';
  method: string; // 工法
  material: string; // 材質
  weepHoleStatus: string; // 水抜き穴の状況
  drainageStatus: string; // 排水設備の状況
  defects: WallDefect[];
  remarks: string;
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
