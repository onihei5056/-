// ============================================================
// 画像生成レイヤー
// ------------------------------------------------------------
// ★ 将来的に画像生成APIへ接続するのはこのファイルだけです。
//   UI側は generateImage() の入出力だけを見ているため、
//   ここをAPI呼び出しに差し替えれば画面の修正は不要です。
//
// 現在はモック実装：
//   - サンプル物件  … 同じ骨格のSVGシーンをスタイル別に描き分け
//   - アップロード写真 … 元写真に色調補正＋家具レイヤーを合成
// どちらも外部通信は行わないため、API課金は一切発生しません。
// ============================================================
import type {
  GenerateImageRequest,
  GenerateImageResponse,
  GeneratedImage,
  StyleId,
} from '../types';
import { STYLE_MAP, ROOM_TYPE_FEATURES } from '../mock/styles';
import { CHANGE_ITEMS } from '../mock/options';
import { itemThumb, renderRoomSvg, svgToDataUrl } from '../mock/roomScene';
import type { LightingType, ScenePalette, SceneFeature } from '../mock/roomScene';
import { buildPrompt } from './promptBuilder';

/** 生成モード。.env の VITE_IMAGE_SOURCE で切り替える想定（現在は 'mock' のみ実装） */
const IMAGE_SOURCE = import.meta.env.VITE_IMAGE_SOURCE ?? 'mock';

/** モックのローディング時間（ms） */
export const MOCK_LATENCY_MS = 1500;

// ------------------------------------------------------------
// 色ユーティリティ（リフォーム項目による内装の変化を再現する）
// ------------------------------------------------------------
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** ratio>0 で白寄り、ratio<0 で黒寄り */
function shade(hex: string, ratio: number) {
  const { r, g, b } = hexToRgb(hex);
  const t = ratio > 0 ? 255 : 0;
  const k = Math.abs(ratio);
  return rgbToHex(r + (t - r) * k, g + (t - g) * k, b + (t - b) * k);
}

// ------------------------------------------------------------
// 条件 → シーン設定への変換（モック描画用）
// ------------------------------------------------------------
export interface SceneSpec {
  palette: ScenePalette;
  features: SceneFeature[];
  lighting: LightingType;
  tatami: boolean;
}

export function buildSceneSpec(req: GenerateImageRequest): SceneSpec {
  const style = STYLE_MAP[req.styleId];
  const { condition } = req;
  let palette: ScenePalette = { ...style.palette };
  let lighting = style.lighting;
  let tatami = condition.roomType === 'washitsu';

  const features = new Set<SceneFeature>(ROOM_TYPE_FEATURES[condition.roomType]);
  for (const id of condition.changeItems) {
    const item = CHANGE_ITEMS.find((c) => c.id === id);
    if (item?.addFeature) features.add(item.addFeature);
    if (item?.removeFeature) features.delete(item.removeFeature);
  }

  const reform = new Set(condition.reformItems);
  if (reform.has('refresh')) {
    palette.wallBack = shade(palette.wallBack, 0.35);
    palette.wallLeft = shade(palette.wallLeft, 0.3);
    palette.wallRight = shade(palette.wallRight, 0.32);
    palette.ceiling = shade(palette.ceiling, 0.4);
    palette.floor = shade(palette.floor, 0.18);
    palette.lightStrength = 1.2;
  }
  if (reform.has('washitsuToYoushitsu')) {
    tatami = false;
    palette.floor = shade(palette.floor, 0.1);
  }
  if (reform.has('floorLight')) {
    tatami = false;
    palette.floor = shade(palette.floor, 0.34);
    palette.floorLine = shade(palette.floorLine, 0.28);
  }
  if (reform.has('floorDark')) {
    tatami = false;
    palette.floor = shade(palette.floor, -0.4);
    palette.floorLine = shade(palette.floorLine, -0.45);
  }
  if (reform.has('wallWhite')) {
    palette.wallBack = shade(palette.wallBack, 0.65);
    palette.wallLeft = shade(palette.wallLeft, 0.6);
    palette.wallRight = shade(palette.wallRight, 0.62);
    palette.ceiling = '#ffffff';
  }
  if (reform.has('accentCloth')) {
    palette.accentWall = shade(palette.fabricDark, 0.25);
  }
  if (reform.has('downlight')) lighting = 'downlight';
  if (reform.has('doors')) {
    palette.wood = shade(palette.wood, 0.22);
    palette.woodDark = shade(palette.woodDark, 0.16);
  }

  // 再生成（variantSeed あり）のときは、仕上げと小物を少しだけ振る
  if (req.variantSeed) {
    const r = (i: number) => (Math.sin(req.variantSeed! * 9301 + i * 49297) + 1) / 2;
    palette = {
      ...palette,
      floor: shade(palette.floor, (r(1) - 0.5) * 0.22),
      wallBack: shade(palette.wallBack, (r(2) - 0.5) * 0.14),
      fabric: shade(palette.fabric, (r(3) - 0.5) * 0.26),
      fabricDark: shade(palette.fabricDark, (r(4) - 0.5) * 0.2),
      cushion: shade(palette.cushion, (r(5) - 0.5) * 0.3),
      rug: shade(palette.rug, (r(6) - 0.5) * 0.18),
    };
    if (r(7) > 0.5) features.add('smallItems');
    else features.delete('smallItems');
    if (r(8) > 0.35) features.add('plant');
  }

  // 「照明を変更」が未選択なら、スタイル既定の照明をそのまま使う
  return { palette, features: Array.from(features), lighting, tatami };
}

// ------------------------------------------------------------
// アップロード写真へのモック合成
// ------------------------------------------------------------
/** スタイルごとの色調補正（CSS filter 相当） */
const GRADE: Record<StyleId, string> = {
  natural: 'brightness(1.10) saturate(1.05) contrast(1.02) sepia(0.12)',
  modern: 'brightness(1.06) saturate(0.82) contrast(1.10)',
  nordic: 'brightness(1.16) saturate(0.95) contrast(0.98)',
  hotel: 'brightness(0.98) saturate(1.02) contrast(1.12) sepia(0.10)',
  vintage: 'brightness(1.02) saturate(1.10) contrast(1.05) sepia(0.28)',
  wamodern: 'brightness(1.04) saturate(0.90) contrast(1.06) sepia(0.14)',
  simple: 'brightness(1.14) saturate(0.92) contrast(1.00)',
  luxury: 'brightness(0.99) saturate(1.05) contrast(1.14) sepia(0.08)',
  family: 'brightness(1.12) saturate(1.08) contrast(1.00) sepia(0.10)',
  single: 'brightness(1.10) saturate(0.88) contrast(1.04)',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = src;
  });
}

/**
 * アップロード写真から「生成結果っぽい」画像を作る（モック専用）
 * 1. 元写真をそのまま描画（＝構造は一切変えない）
 * 2. スタイル別の色調補正をかける
 * 3. 家具レイヤー（SVG）を重ねる
 */
async function composeUploadedVariant(sourceDataUrl: string, spec: SceneSpec, styleId: StyleId) {
  const img = await loadImage(sourceDataUrl);
  const maxW = 1400;
  const scale = Math.min(1, maxW / img.naturalWidth);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceDataUrl;

  ctx.filter = GRADE[styleId];
  ctx.drawImage(img, 0, 0, w, h);
  ctx.filter = 'none';

  // 家具レイヤー（元写真のアングルに合わせて全面に重ねる）
  const overlaySvg = renderRoomSvg({
    palette: spec.palette,
    features: spec.features,
    lighting: spec.lighting,
    tatami: spec.tatami,
    mode: 'furniture',
  });
  try {
    const overlay = await loadImage(svgToDataUrl(overlaySvg));
    // 画像を cover 配置（縦横比を保ったまま全面を覆う）
    const r = Math.max(w / overlay.naturalWidth, h / overlay.naturalHeight);
    const ow = overlay.naturalWidth * r;
    const oh = overlay.naturalHeight * r;
    ctx.globalAlpha = 0.96;
    ctx.drawImage(overlay, (w - ow) / 2, h - oh, ow, oh);
    ctx.globalAlpha = 1;
  } catch {
    /* 家具レイヤーの合成に失敗しても、色調補正済みの画像は返す */
  }

  // 光の回り込み（雰囲気付け）
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, `${spec.palette.lightTone}33`);
  grad.addColorStop(0.6, '#00000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  return canvas.toDataURL('image/jpeg', 0.9);
}

// ------------------------------------------------------------
// 公開API
// ------------------------------------------------------------
let seq = 0;
const newId = () => `img_${Date.now().toString(36)}_${(seq++).toString(36)}`;

/**
 * 1スタイル分の画像を生成する。
 *
 * 将来的に画像生成APIへ接続する場合は、この関数の中身を
 * 自社バックエンド経由のfetchに差し替えてください。
 * APIキーはフロントエンドに置かず、必ずサーバー側で保持します。
 *
 * 例）
 * ------------------------------------------------------------
 * const res = await fetch(import.meta.env.VITE_IMAGE_API_ENDPOINT, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     image: req.source.dataUrl,   // 元写真
 *     prompt,                      // buildPrompt() の結果
 *     model: import.meta.env.VITE_IMAGE_API_MODEL,
 *   }),
 * });
 * const { imageUrl } = await res.json();
 * ------------------------------------------------------------
 */
export async function generateImage(req: GenerateImageRequest): Promise<GenerateImageResponse> {
  const style = STYLE_MAP[req.styleId];
  const prompt = buildPrompt(req.condition, req.styleId, req.property);

  if (IMAGE_SOURCE !== 'mock') {
    // 将来的に画像生成APIへ接続（未実装のため、ここではモックにフォールバック）
    console.warn('[generateImage] API接続は未実装のためモック画像を返します');
  }

  const spec = buildSceneSpec(req);

  let dataUrl: string;
  if (req.source.isSample) {
    // サンプル物件：同じ骨格のシーンをスタイル別に描画
    dataUrl = svgToDataUrl(
      renderRoomSvg({
        palette: spec.palette,
        features: spec.features,
        lighting: spec.lighting,
        tatami: spec.tatami,
      }),
    );
  } else {
    // アップロード写真：元写真を土台に合成
    dataUrl = await composeUploadedVariant(req.source.dataUrl, spec, req.styleId);
  }

  const image: GeneratedImage = {
    id: newId(),
    styleId: req.styleId,
    styleName: style.name,
    dataUrl,
    points: style.points,
    items: style.items.map((it) => ({
      name: it.name,
      note: it.note,
      thumbnail: itemThumb(it.kind, spec.palette),
    })),
    prompt,
    createdAt: new Date().toISOString(),
  };

  return { image };
}

/** 複数スタイルをまとめて生成する */
export async function generateImages(
  reqBase: Omit<GenerateImageRequest, 'styleId'>,
  styleIds: StyleId[],
): Promise<GeneratedImage[]> {
  const results: GeneratedImage[] = [];
  for (const styleId of styleIds) {
    const { image } = await generateImage({ ...reqBase, styleId });
    results.push(image);
  }
  return results;
}
