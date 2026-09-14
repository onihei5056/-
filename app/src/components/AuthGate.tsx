import { useEffect, useState, type ReactNode } from 'react';
import { hasPin, isUnlocked, markUnlocked, touchActivity, verifyPin, IDLE_TIMEOUT_MS } from '../utils/auth';

export function AuthGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [pin, setPinInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const onActivity = () => touchActivity();
    window.addEventListener('click', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('touchstart', onActivity);
    const interval = setInterval(() => {
      if (hasPin() && !isUnlocked()) setUnlocked(false);
    }, 15000);
    return () => {
      window.removeEventListener('click', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
      clearInterval(interval);
    };
  }, []);

  if (!hasPin() || unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 className="section-title">端末ロック中</h2>
          <p className="field-note">
            {IDLE_TIMEOUT_MS / 60000}分間操作がなかったため再認証が必要です。PINを入力してください。
          </p>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="PIN"
            style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.4rem' }}
          />
          {error && <div className="field-error">{error}</div>}
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 16 }}
            onClick={async () => {
              if (await verifyPin(pin)) {
                markUnlocked();
                setUnlocked(true);
                setError('');
                setPinInput('');
              } else {
                setError('PINが正しくありません');
              }
            }}
          >
            ロック解除
          </button>
        </div>
      </div>
    </div>
  );
}
