/**
 * 端末ロック用の簡易認証(PIN)。
 * 本実装は「同じ端末を複数人が共有する現場」での簡易的な画面ロックを想定した
 * MVP実装であり、複数ユーザーのアクセス権限管理や監査を伴う本番運用では
 * サーバーサイド認証(社内IdP/OAuth等)への置き換えを前提とする
 * (詳細は docs/security.md および 要確認事項一覧を参照)。
 */
const PIN_KEY = 'survey-app-pin-hash';
const UNLOCK_KEY = 'survey-app-unlocked-at';
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15分操作なしで再認証

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hasPin(): boolean {
  return !!localStorage.getItem(PIN_KEY);
}

export async function setPin(pin: string): Promise<void> {
  localStorage.setItem(PIN_KEY, await hashPin(pin));
  markUnlocked();
}

export function clearPin(): void {
  localStorage.removeItem(PIN_KEY);
  markUnlocked();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return true;
  return (await hashPin(pin)) === stored;
}

export function markUnlocked(): void {
  sessionStorage.setItem(UNLOCK_KEY, String(Date.now()));
}

export function lock(): void {
  sessionStorage.removeItem(UNLOCK_KEY);
}

export function isUnlocked(): boolean {
  if (!hasPin()) return true;
  const at = sessionStorage.getItem(UNLOCK_KEY);
  if (!at) return false;
  return Date.now() - Number(at) < IDLE_TIMEOUT_MS;
}

export function touchActivity(): void {
  if (sessionStorage.getItem(UNLOCK_KEY)) {
    sessionStorage.setItem(UNLOCK_KEY, String(Date.now()));
  }
}
