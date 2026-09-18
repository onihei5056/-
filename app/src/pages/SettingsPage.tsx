import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasPin, setPin, clearPin, lock } from '../utils/auth';
import { getStorageEstimate, isStoragePersisted, requestPersistentStorage } from '../utils/storage';
import { deliverFile, exportCases, importFromFile } from '../utils/backup';

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
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isStoragePersisted().then(setPersisted);
    getStorageEstimate().then(setEstimate);
  }, []);

  const handleExport = async () => {
    setBackupBusy(true);
    setBackupMessage('書き出しています…');
    try {
      const result = await exportCases();
      if (result.caseCount === 0) {
        setBackupMessage('書き出す案件がありません。');
        return;
      }
      const how = await deliverFile(result.blob, result.fileName);
      setBackupMessage(
        `${result.caseCount}件の案件(写真${result.photoCount}枚 / 約${result.sizeMB}MB)を書き出しました。` +
          (how === 'shared' ? '共有メニューから「ファイルに保存」を選んで保存してください。' : 'ダウンロードフォルダをご確認ください。')
      );
    } catch (e) {
      setBackupMessage('書き出しに失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImport = async (file: File) => {
    if (!window.confirm(`「${file.name}」を取り込みます。\n既存の案件は上書きされません。よろしいですか?`)) return;
    setBackupBusy(true);
    setBackupMessage('取り込んでいます…');
    try {
      const r = await importFromFile(file);
      setBackupMessage(
        `${r.added}件の案件(写真${r.photoCount}枚)を取り込みました。` +
          (r.renamedDueToConflict > 0
            ? `うち${r.renamedDueToConflict}件は既存の案件と重複するため「(取込)」を付けた別案件として追加しました。`
            : '')
      );
    } catch (e) {
      setBackupMessage('取り込みに失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBackupBusy(false);
    }
  };

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
          <h3 className="card-title">データの書き出し・取り込み</h3>
          <p className="field-note">
            調査データは端末の中だけに保存されます。機種変更・URLの変更・サイトデータの削除では
            引き継がれないため、定期的に書き出して保管してください。
            書き出したファイルは、別の端末や別のURLのアプリで取り込んで復元できます。
          </p>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = '';
            }}
          />

          <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} disabled={backupBusy} onClick={handleExport}>
            {backupBusy ? '処理中…' : '全案件を書き出す(写真を含む)'}
          </button>
          <button
            className="btn btn-secondary btn-block"
            style={{ marginTop: 10 }}
            disabled={backupBusy}
            onClick={() => importInputRef.current?.click()}
          >
            ファイルから取り込む
          </button>

          {backupMessage && (
            <div className="note-box" style={{ marginTop: 12, marginBottom: 0 }}>
              {backupMessage}
            </div>
          )}

          <p className="field-note" style={{ marginTop: 10 }}>
            取り込みで既存の案件が消えることはありません。同じ案件が既にある場合は
            「(取込)」を付けた別案件として追加します。
          </p>
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
