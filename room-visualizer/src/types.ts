// ============================================================
// アプリ全体で使う型定義
// ============================================================

/** 部屋タイプ */
export type RoomTypeId =
  | 'living'
  | 'dining'
  | 'ldk'
  | 'bedroom'
  | 'kids'
  | 'study'
  | 'washitsu'
  | 'entrance'
  | 'other';

/** インテリアスタイル */
export type StyleId =
  | 'natural'
  | 'modern'
  | 'nordic'
  | 'hotel'
  | 'vintage'
  | 'wamodern'
  | 'simple'
  | 'luxury'
  | 'family'
  | 'single';

/** 変更したい項目 / リフォームイメージ / ターゲット のID（文字列で保持） */
export type ChangeItemId = string;
export type ReformItemId = string;
export type TargetId = string;

/** 元画像（アップロード画像 or サンプル画像） */
export interface SourceImage {
  /** 画像の実体（data URL または SVG data URL） */
  dataUrl: string;
  /** ファイル名（サンプルの場合は説明的な名称） */
  fileName: string;
  /** サンプル画像かどうか。true の場合はモック用の合成シーンを生成できる */
  isSample: boolean;
  /** サンプル画像のときの部屋タイプ（シーン生成に使う） */
  sampleRoomType?: RoomTypeId;
}

/** 物件情報（将来的に社内物件DBと連携する想定のフィールド構成） */
export interface PropertyInfo {
  /** 将来、社内物件DBのレコードIDを保持する（連携時に使用） */
  externalId?: string;
  name: string;
  address: string;
  roomNumber: string;
  staff: string;
  purpose: string;
  memo: string;
}

/** 生成条件（そのまま generateImage() に渡す） */
export interface GenerationCondition {
  roomType: RoomTypeId;
  styles: StyleId[];
  changeItems: ChangeItemId[];
  reformItems: ReformItemId[];
  targets: TargetId[];
  freeText: string;
}

/** 1枚の生成結果 */
export interface GeneratedImage {
  id: string;
  styleId: StyleId;
  styleName: string;
  /** 生成画像（data URL） */
  dataUrl: string;
  /** このスタイルのポイント（箇条書き） */
  points: string[];
  /** 使用したアイテム例 */
  items: UsedItem[];
  /** 生成に使ったプロンプト（将来のAPI接続時にそのまま送る想定） */
  prompt: string;
  createdAt: string;
}

export interface UsedItem {
  name: string;
  /** サムネイル（SVG data URL） */
  thumbnail: string;
  note: string;
}

/** 1回の生成＝1案件（履歴の1レコード） */
export interface GenerationRecord {
  id: string;
  createdAt: string;
  property: PropertyInfo;
  condition: GenerationCondition;
  source: SourceImage;
  results: GeneratedImage[];
  /** お気に入りに入れた生成画像のID */
  favoriteImageIds: string[];
}

/** 画像生成APIのリクエスト/レスポンス（将来のAPI接続時の入出力） */
export interface GenerateImageRequest {
  source: SourceImage;
  condition: GenerationCondition;
  styleId: StyleId;
  property?: PropertyInfo;
  /** 再生成時に少しだけ違う結果を出すための種（将来のAPI接続時は seed として渡す） */
  variantSeed?: number;
}

export interface GenerateImageResponse {
  image: GeneratedImage;
}
