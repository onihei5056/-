/**
 * 端末内データ(IndexedDB)の永続化。
 *
 * iOS/iPadOSのSafariは、一定期間使われないサイトの保存データを自動的に削除することがある。
 * 現地調査の入力途中データや未出力の写真が消えると業務影響が大きいため、
 * 起動時にブラウザへ「永続保存」を要求する。
 * ホーム画面に追加されたPWAでは許可されやすい。
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator) || !navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function isStoragePersisted(): Promise<boolean> {
  if (!('storage' in navigator) || !navigator.storage?.persisted) return false;
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

/** 使用量・空き容量の目安(設定画面に表示する) */
export async function getStorageEstimate(): Promise<{ usedMB: number; quotaMB: number } | null> {
  if (!('storage' in navigator) || !navigator.storage?.estimate) return null;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    if (usage === undefined || quota === undefined) return null;
    return { usedMB: Math.round((usage / 1024 / 1024) * 10) / 10, quotaMB: Math.round(quota / 1024 / 1024) };
  } catch {
    return null;
  }
}
