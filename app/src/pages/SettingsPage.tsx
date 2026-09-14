import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasPin, setPin, clearPin, lock } from '../utils/auth';

function keepOriginalGet(): boolean {
  return localStorage.getItem('survey-keep-original-photo') === '1';
}

export function SettingsPage() {
  const navigate = useNavigate();
  const [pinInput, setPinInput] = useState('');
  const [keepOriginal, setKeepOriginal] = useState(keepOriginalGet());
  const [pinEnabled, setPinEnabled] = useState(hasPin());

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar__title-row">
          <div className="topbar__case">設定</div>
        </div>
      </div>
      <div className="page-body">
        <div className="card">
          <h3 className="card-title">写真の保存設定</h3>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={keepOriginal}
              onChange={(e) => {
                setKeepOriginal(e.target.checked);
                localStorage.setItem('survey-keep-original-photo', e.target.checked ? '1' : '0');
              }}
            />
            圧縮前の元写真も端末内に保持する(端末の空き容量を多く使用します)
          </label>
        </div>

        <div className="card">
          <h3 className="card-title">端末ロック(簡易PIN認証)</h3>
          <p className="field-note">
            現場での端末共有時に画面を保護する簡易ロックです。15分操作がないと自動的にロックされます。
            複数担当者・複数拠点での本格的なアクセス権限管理が必要な場合は、サーバー認証への切り替えが必要です(docs/security.md参照)。
          </p>
          {pinEnabled ? (
            <button
              className="btn btn-danger btn-block"
              onClick={() => {
                clearPin();
                setPinEnabled(false);
              }}
            >
              PINロックを解除する
            </button>
          ) : (
            <>
              <input
                className="input"
                type="password"
                inputMode="numeric"
                placeholder="4桁以上のPINを設定"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
              />
              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 10 }}
                disabled={pinInput.length < 4}
                onClick={async () => {
                  await setPin(pinInput);
                  setPinEnabled(true);
                  setPinInput('');
                }}
              >
                PINを設定する
              </button>
            </>
          )}
          {pinEnabled && (
            <button
              className="btn btn-ghost btn-block"
              style={{ marginTop: 10 }}
              onClick={() => {
                lock();
                navigate('/');
              }}
            >
              今すぐロックする(ログアウト)
            </button>
          )}
        </div>
      </div>
      <div className="bottomnav">
        <button className="btn btn-primary btn-block" onClick={() => navigate('/')}>
          案件一覧に戻る
        </button>
      </div>
    </div>
  );
}
