import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasPin, setPin, clearPin, lock } from '../utils/auth';
import { getStorageEstimate, isStoragePersisted, requestPersistentStorage } from '../utils/storage';

function keepOriginalGet(): boolean {
  return localStorage.getItem('survey-keep-original-photo') === '1';
}

export function SettingsPage() {
  const navigate = useNavigate();
  const [pinInput, setPinInput] = useState('');
  const [keepOriginal, setKeepOriginal] = useState(keepOriginalGet());
  const [pinEnabled, setPinEnabled] = useState(hasPin());
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [estimate, setEstimate] = useState<{ usedMB: number; quotaMB: number } | null>(null);

  useEffect(() => {
    isStoragePersisted().then(setPersisted);
    getStorageEstimate().then(setEstimate);
  }, []);

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
          <h3 className="card-title">データの保存状態</h3>
          {persisted === null ? (
            <div className="field-note">確認中…</div>
          ) : persisted ? (
            <div style={{ color: 'var(--color-success)', fontWeight: 700 }}>
              ✓ 保護されています(端末の空き容量が不足しない限り自動削除されません)
            </div>
          ) : (
            <>
              <div style={{ color: 'var(--color-warning)', fontWeight: 700 }}>
                ⚠ 未保護です
              </div>
              <p className="field-note">
                しばらく使用しないとOSが保存データを削除する場合があります。ホーム画面に追加してから
                下のボタンを押すと保護を要求できます。調査完了後は必ずPDFを出力・保存してください。
              </p>
              <button
                className="btn btn-secondary btn-block"
                style={{ marginTop: 8 }}
                onClick={async () => setPersisted(await requestPersistentStorage())}
              >
                データ保護を要求する
              </button>
            </>
          )}
          {estimate && (
            <div className="field-note" style={{ marginTop: 8 }}>
              使用量: 約{estimate.usedMB}MB / 利用可能: 約{estimate.quotaMB}MB
            </div>
          )}
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
