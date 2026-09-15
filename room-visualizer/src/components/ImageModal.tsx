import { useEffect } from 'react';
import { IconClose, IconDownload, IconHeart } from '../icons';
import { Disclaimer } from './Disclaimer';

interface Props {
  src: string;
  title: string;
  subtitle?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDownload?: () => void;
  onClose: () => void;
}

/** 画像拡大モーダル */
export function ImageModal({
  src,
  title,
  subtitle,
  isFavorite,
  onToggleFavorite,
  onDownload,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          {subtitle && <span className="hint" style={{ margin: 0 }}>{subtitle}</span>}
          <span className="spacer" />
          {onToggleFavorite && (
            <button type="button" className="btn btn-sm" onClick={onToggleFavorite}>
              <IconHeart size={14} filled={isFavorite} />
              {isFavorite ? 'お気に入り解除' : 'お気に入り'}
            </button>
          )}
          {onDownload && (
            <button type="button" className="btn btn-sm" onClick={onDownload}>
              <IconDownload size={14} />
              ダウンロード
            </button>
          )}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="閉じる">
            <IconClose size={18} />
          </button>
        </div>
        <div className="modal-body">
          <img src={src} alt={title} />
        </div>
        <div className="modal-foot">
          <Disclaimer plain />
        </div>
      </div>
    </div>
  );
}
