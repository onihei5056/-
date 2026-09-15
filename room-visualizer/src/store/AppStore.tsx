// ============================================================
// アプリ全体の状態（履歴・お気に入り）
// LocalStorageに保存し、ブラウザを更新しても内容を保持する。
// 将来的に社内サーバー保存へ移行する場合も、このファイルの差し替えで対応できる。
// ============================================================
import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { GeneratedImage, GenerationRecord } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { buildSampleRecords } from '../mock/sampleProjects';

const STORAGE_KEY = 'roomVisualizer.records.v1';
/** LocalStorageの容量上限（おおむね5MB）を超えないよう、履歴は直近N件のみ保持する */
const MAX_RECORDS = 15;

export interface FavoriteEntry {
  record: GenerationRecord;
  image: GeneratedImage;
}

interface AppStoreValue {
  records: GenerationRecord[];
  favorites: FavoriteEntry[];
  addRecord: (record: GenerationRecord) => void;
  updateRecord: (recordId: string, updater: (record: GenerationRecord) => GenerationRecord) => void;
  removeRecord: (recordId: string) => void;
  toggleFavorite: (recordId: string, imageId: string) => void;
  isFavorite: (recordId: string, imageId: string) => boolean;
  resetToSamples: () => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [records, setRecords, reset] = useLocalStorage<GenerationRecord[]>(
    STORAGE_KEY,
    buildSampleRecords,
  );

  const addRecord = useCallback(
    (record: GenerationRecord) => {
      setRecords((prev) => [record, ...prev].slice(0, MAX_RECORDS));
    },
    [setRecords],
  );

  const updateRecord = useCallback(
    (recordId: string, updater: (record: GenerationRecord) => GenerationRecord) => {
      setRecords((prev) => prev.map((r) => (r.id === recordId ? updater(r) : r)));
    },
    [setRecords],
  );

  const removeRecord = useCallback(
    (recordId: string) => {
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    },
    [setRecords],
  );

  const toggleFavorite = useCallback(
    (recordId: string, imageId: string) => {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id !== recordId) return r;
          const has = r.favoriteImageIds.includes(imageId);
          return {
            ...r,
            favoriteImageIds: has
              ? r.favoriteImageIds.filter((id) => id !== imageId)
              : [...r.favoriteImageIds, imageId],
          };
        }),
      );
    },
    [setRecords],
  );

  const isFavorite = useCallback(
    (recordId: string, imageId: string) =>
      records.find((r) => r.id === recordId)?.favoriteImageIds.includes(imageId) ?? false,
    [records],
  );

  const favorites = useMemo<FavoriteEntry[]>(() => {
    const list: FavoriteEntry[] = [];
    for (const record of records) {
      for (const id of record.favoriteImageIds) {
        const image = record.results.find((r) => r.id === id);
        if (image) list.push({ record, image });
      }
    }
    return list;
  }, [records]);

  const value = useMemo<AppStoreValue>(
    () => ({
      records,
      favorites,
      addRecord,
      updateRecord,
      removeRecord,
      toggleFavorite,
      isFavorite,
      resetToSamples: reset,
    }),
    [records, favorites, addRecord, updateRecord, removeRecord, toggleFavorite, isFavorite, reset],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('AppStoreProvider の内側で使用してください');
  return ctx;
}
