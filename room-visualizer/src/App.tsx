import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomNav, Header } from './components/Header';
import type { PageId } from './components/Header';
import { GeneratePage } from './pages/GeneratePage';
import { HistoryPage } from './pages/HistoryPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { AppStoreProvider, useAppStore } from './store/AppStore';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { GenerationRecord } from './types';
import { DISCLAIMER } from './mock/options';

const PAGES: PageId[] = ['home', 'generate', 'favorites', 'history', 'settings'];

/** URLのハッシュから画面を決める（ブラウザの戻る／進む・ブックマークに対応） */
function pageFromHash(): PageId {
  const id = window.location.hash.replace(/^#\/?/, '') as PageId;
  return PAGES.includes(id) ? id : 'home';
}

function Shell() {
  const { records, favorites } = useAppStore();
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [openedRecord, setOpenedRecord] = useState<GenerationRecord | null>(null);
  const [toast, setToast] = useState('');
  const [burnNotice, setBurnNotice] = useLocalStorage<boolean>(
    'roomVisualizer.burnNotice.v1',
    () => true,
  );
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number>();

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goto = useCallback((p: PageId) => {
    window.location.hash = `#/${p}`;
    setPage(p);
    window.scrollTo({ top: 0 });
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const openRecord = useCallback(
    (record: GenerationRecord) => {
      setOpenedRecord(record);
      goto('generate');
    },
    [goto],
  );

  const startNew = useCallback(() => {
    setOpenedRecord(null);
    goto('generate');
    // 画像生成画面へ遷移したあとにファイル選択を開く
    window.setTimeout(() => uploadInputRef.current?.click(), 120);
  }, [goto]);

  return (
    <>
      <Header
        page={page}
        onNavigate={goto}
        favoriteCount={favorites.length}
        historyCount={records.length}
        onUploadClick={startNew}
      />

      {page === 'home' && <HomePage onStart={startNew} onGoHistory={() => goto('history')} />}

      {page === 'generate' && (
        <GeneratePage
          // 履歴から開いた案件を初期値として読み込むため、案件ごとに作り直す
          key={openedRecord?.id ?? 'new'}
          initialRecord={openedRecord}
          uploadInputRef={uploadInputRef}
          notify={notify}
          burnNoticeOnDownload={burnNotice}
        />
      )}

      {page === 'favorites' && (
        <FavoritesPage onOpenRecord={openRecord} notify={notify} burnNoticeOnDownload={burnNotice} />
      )}

      {page === 'history' && <HistoryPage onOpenRecord={openRecord} notify={notify} />}

      {page === 'settings' && (
        <SettingsPage
          burnNoticeOnDownload={burnNotice}
          onChangeBurnNotice={setBurnNotice}
          notify={notify}
        />
      )}

      <p className="footer-note">
        Room Visualizer（モック版）｜{DISCLAIMER}
      </p>

      {/* スマートフォン用ボトムナビ（640px以下でのみ表示） */}
      <BottomNav page={page} onNavigate={goto} favoriteCount={favorites.length} />

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <Shell />
    </AppStoreProvider>
  );
}
