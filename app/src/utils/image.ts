/**
 * 写真の圧縮・回転ユーティリティ。
 * 文字・メーター口径・配管・擁壁のクラック等の視認性を保つため、
 * 長辺2000px / JPEG品質0.82を既定値とする(設定画面で変更可)。
 */
export interface CompressOptions {
  maxDimension: number;
  quality: number;
}

export const DEFAULT_COMPRESS_OPTIONS: CompressOptions = {
  maxDimension: 2000,
  quality: 0.82
};

export async function fileToImageBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export async function compressImage(
  file: Blob,
  opts: CompressOptions = DEFAULT_COMPRESS_OPTIONS
): Promise<Blob> {
  const bitmap = await fileToImageBitmap(file);
  const scale = Math.min(1, opts.maxDimension / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context取得に失敗しました');
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', opts.quality)
  );
  if (!blob) throw new Error('画像の圧縮に失敗しました');
  return blob;
}

export async function rotateImageBlob(blob: Blob, degrees: 90 | 180 | 270): Promise<Blob> {
  const bitmap = await fileToImageBitmap(blob);
  const swap = degrees === 90 || degrees === 270;
  const w = swap ? bitmap.height : bitmap.width;
  const h = swap ? bitmap.width : bitmap.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context取得に失敗しました');
  ctx.translate(w / 2, h / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  const out: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (!out) throw new Error('画像の回転に失敗しました');
  return out;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
