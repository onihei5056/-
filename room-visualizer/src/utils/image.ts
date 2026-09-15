import { DISCLAIMER } from '../mock/options';
import { safeFileName } from './format';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = src;
  });
}

/**
 * アップロード画像を扱いやすいサイズへ縮小する。
 * （LocalStorageの容量上限に配慮し、長辺1600pxのJPEGに変換）
 */
export async function normalizeUploadedImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
  const img = await loadImage(dataUrl);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && dataUrl.length < 1_200_000) return dataUrl;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.88);
}

/**
 * 画像をダウンロードする。
 * withNotice=true のときは、画像下部に免責文を焼き込む。
 * （不動産広告として配布する際に注意表示を残すための機能）
 */
export async function downloadImage(
  dataUrl: string,
  fileNameBase: string,
  withNotice: boolean,
): Promise<void> {
  let out = dataUrl;
  if (withNotice) {
    try {
      out = await burnNotice(dataUrl);
    } catch {
      /* 焼き込みに失敗した場合は元画像をそのまま保存する */
    }
  }
  const a = document.createElement('a');
  a.href = out;
  a.download = `${safeFileName(fileNameBase)}.${out.startsWith('data:image/png') ? 'png' : 'jpg'}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** 画像下部に免責文の帯を追加する */
async function burnNotice(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || 1200;
  const h = img.naturalHeight || 800;
  const barH = Math.max(34, Math.round(w * 0.042));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h + barH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.fillStyle = '#1d2a27';
  ctx.fillRect(0, h, w, barH);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(barH * 0.42)}px "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(DISCLAIMER, Math.round(w * 0.02), h + barH / 2);
  return canvas.toDataURL('image/jpeg', 0.92);
}
