import { useRef, useState } from 'react';
import type { SourceImage } from '../types';
import { IconImage, IconRefresh, IconTrash, IconUpload } from '../icons';
import { normalizeUploadedImage } from '../utils/image';

const ACCEPT = 'image/jpeg,image/png,image/webp';

interface Props {
  source: SourceImage | null;
  onChange: (source: SourceImage | null) => void;
  onUseSample: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function UploadPanel({ source, onChange, onUseSample, inputRef }: Props) {
  const localRef = useRef<HTMLInputElement>(null);
  const fileRef = inputRef ?? localRef;
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) {
      setError('JPG / PNG / WEBP の画像を選択してください。');
      return;
    }
    setError('');
    const dataUrl = await normalizeUploadedImage(file);
    onChange({ dataUrl, fileName: file.name, isSample: false });
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
            <p className="hint">対応形式：JPG / JPEG / PNG / WEBP（長辺1600pxに自動縮小）</p>
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
      </div>
    </section>
  );
}
