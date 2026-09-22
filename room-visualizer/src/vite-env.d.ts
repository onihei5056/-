/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'mock' | 'api' — 画像生成の取得元 */
  readonly VITE_IMAGE_SOURCE?: string;
  /** 画像生成APIのエンドポイント（自社バックエンド経由） */
  readonly VITE_IMAGE_API_ENDPOINT?: string;
  /** 画像生成モデル名 */
  readonly VITE_IMAGE_API_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
