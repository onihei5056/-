/** 日時を「2026/09/15 10:24」形式で表示する */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 日付のみ（検索用） */
export function toDateKey(iso: string): string {
  const d = new Date(iso);
  const p = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** ファイル名に使えない文字を除去する */
export function safeFileName(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '_').trim() || 'room';
}
