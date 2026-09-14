import { useEffect, useState } from 'react';

const DISMISS_KEY = 'survey-install-guide-dismissed';

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * ホーム画面追加の案内。
 * - iPhone/Safari: beforeinstallpromptが発火しないため「共有→ホーム画面に追加」を案内。
 * - Android/Chrome: beforeinstallpromptを捕捉してインストールボタンを表示。
 * どちらも一度閉じたら(または追加済みなら)再表示しない。
 */
export function InstallPrompt() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissed) return;
    if (isIos()) {
      setShowIosGuide(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
    setShowIosGuide(false);
    setDeferredEvent(null);
  };

  if (dismissed || isStandalone()) return null;

  if (showIosGuide) {
    return (
      <div className="install-banner" role="dialog" aria-label="ホーム画面への追加案内">
        <strong>ホーム画面に追加してご利用ください</strong>
        <p style={{ fontSize: '0.85rem', margin: '8px 0' }}>
          画面下部の共有ボタン(四角から矢印が上に伸びるアイコン)をタップし、「ホーム画面に追加」を選択すると、
          通常のアプリのように起動できます。
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={dismiss}>
            今後表示しない
          </button>
        </div>
      </div>
    );
  }

  if (deferredEvent) {
    return (
      <div className="install-banner" role="dialog" aria-label="アプリのインストール案内">
        <strong>アプリをホーム画面に追加</strong>
        <p style={{ fontSize: '0.85rem', margin: '8px 0' }}>
          ホーム画面に追加すると、通常のアプリのようにオフラインでも起動できます。
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={dismiss}>
            閉じる
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={async () => {
              await deferredEvent.prompt();
              await deferredEvent.userChoice;
              dismiss();
            }}
          >
            インストール
          </button>
        </div>
      </div>
    );
  }

  return null;
}
