import { useRegisterSW } from 'virtual:pwa-register/react';

/** 新しいバージョンが利用可能になったら通知し、タップで更新を適用する */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registration && setInterval(() => registration.update(), 60 * 60 * 1000);
    }
  });

  if (needRefresh) {
    return (
      <div className="toast">
        新しいバージョンがあります
        <button className="btn btn-sm btn-primary" onClick={() => updateServiceWorker(true)}>
          更新する
        </button>
      </div>
    );
  }
  if (offlineReady) {
    return (
      <div className="toast" onClick={() => setOfflineReady(false)}>
        オフラインでも利用できる準備ができました
      </div>
    );
  }
  return null;
}
