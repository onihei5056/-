import { useRef, useState } from 'react';
import type { SourceImage } from '../types';
import { IconCamera, IconImage, IconRefresh, IconTrash, IconUpload } from '../icons';
import { isAcceptableImage, normalizeUploadedImage } from '../utils/image';
import { useIsPhone } from '../hooks/useMediaQuery';

/**
 * iPhone/Androidの写真（HEIC含む）も選べるよう image/* を基本にする。
 * 拡張子も併記しているのは、一部端末で MIME タイプが空になる場合があるため。
 */
const ACCEPT = 'image/*,.jpg,.jpeg,.png,.webp,.heic,.heif';

interface Props {
  source: SourceImage | null;
  onChange: (source: SourceImage | null) => void;
  onUseSample: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function UploadPanel({ source, onChange, onUseSample, inputRef }: Props) {
  const localRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = inputRef ?? localRef;
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isPhone = useIsPhone();

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!isAcceptableImage(file)) {
      setError('画像ファイル（JPG / PNG / WEBP / HEIC）を選択してください。');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const dataUrl = await normalizeUploadedImage(file);
      onChange({ dataUrl, fileName: file.name || '撮影した写真.jpg', isSample: false });
    } catch {
      setError('この画像は読み込めませんでした。別の写真をお試しください。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <span className="step">1</span>
        <h2>画像をアップロード</h2>
      </div>
      <div className="card-body">
        {!source ? (
          <>
            {/* スマホでは「その場で撮影」を主動線にする（内見中の利用を想定） */}
            {isPhone ? (
              <div className="upload-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => cameraRef.current?.click()}
                  disabled={busy}
                >
                  <IconCamera size={18} />
                  カメラで撮影する
                </button>
                <button
                  type="button"
                  className="btn btn-lg"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                >
                  <IconImage size={17} />
                  写真ライブラリから選ぶ
                </button>
              </div>
            ) : (
              <div
                className={`dropzone${drag ? ' drag' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  void handleFiles(e.dataTransfer.files);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              >
                <div className="dropzone-icon">
                  <IconUpload size={26} />
                </div>
                <div className="dropzone-main">ここに画像をドラッグ＆ドロップ</div>
                <div className="dropzone-sub">または</div>
                <button type="button" className="btn btn-sm" style={{ marginTop: 8 }}>
                  画像を選択
                </button>
              </div>
            )}
            {busy && <p className="hint">画像を読み込んでいます…</p>}
            <p className="hint">
              対応形式：JPG / JPEG / PNG / WEBP / HEIC（iPhoneの写真）。長辺1600pxに自動縮小します。
            </p>
            <p className="hint">室内全体が分かる写真がおすすめです。窓・壁・間取りが分かるほど精度が上がります。</p>
            <button type="button" className="btn btn-sm" style={{ marginTop: 10 }} onClick={onUseSample}>
              <IconImage size={14} />
              サンプル写真で試す
            </button>
          </>
        ) : (
          <>
            <div className="thumb-row">
              <div className="thumb">
                <img src={source.dataUrl} alt="アップロードした元画像" />
              </div>
              <div className="thumb-meta">
                <div className="thumb-name">{source.fileName}</div>
                <div className="hint" style={{ marginTop: 2 }}>
                  {source.isSample ? 'サンプル画像' : 'アップロード済み'}
                </div>
                <div className="thumb-actions">
                  {isPhone && (
                    <button type="button" className="btn btn-sm" onClick={() => cameraRef.current?.click()}>
                      <IconCamera size={13} />
                      撮り直す
                    </button>
                  )}
                  <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
                    <IconRefresh size={13} />
                    別画像に変更
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => onChange(null)}>
                    <IconTrash size={13} />
                    削除
                  </button>
                </div>
              </div>
            </div>
            {!source.isSample && (
              <p className="hint">
                モック版では、この写真に色調補正と家具レイヤーを合成した簡易プレビューを表示します。
              </p>
            )}
          </>
        )}
        {error && (
          <p className="hint" style={{ color: 'var(--warn)' }}>
            {error}
          </p>
        )}
        {/* 写真ライブラリから選ぶ（capture属性なし） */}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {/* その場で撮影する（capture属性ありで背面カメラを直接起動） */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </section>
  );
}
