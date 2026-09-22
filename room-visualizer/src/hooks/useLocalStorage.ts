import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * LocalStorageと同期するstate。
 * お気に入り・履歴をブラウザ更新後も保持するために使用する。
 * （将来的にサーバー保存へ移行する場合は、このフックの中だけを差し替える）
 */
export function useLocalStorage<T>(key: string, initial: () => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* 破損時は初期値で復旧する */
    }
    return initial();
  });

  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value));
    } catch (e) {
      // 画像を多く保存すると容量上限（おおむね5MB）に達することがある
      console.warn('[localStorage] 保存に失敗しました。容量上限の可能性があります。', e);
    }
  }, [value]);

  const reset = useCallback(() => {
    window.localStorage.removeItem(keyRef.current);
    setValue(initial());
    // initial は初回のみ利用する想定のため依存から外す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, setValue, reset] as const;
}
