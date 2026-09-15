import type { GeneratedImage, SourceImage } from '../types';
import { IconDownload, IconExpand, IconHeart, IconRefresh } from '../icons';

interface Props {
  source: SourceImage;
  results: GeneratedImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onExpand: (image: GeneratedImage | 'source') => void;
  onDownload: (image: GeneratedImage) => void;
  onRegenerate: (image: GeneratedImage) => void;
  isFavorite: (imageId: string) => boolean;
  onToggleFavorite: (imageId: string) => void;
}

/** 生成候補一覧（元写真＋スタイル別の生成結果） */
export function ResultGallery({
  source,
  results,
  selectedId,
  onSelect,
  onExpand,
  onDownload,
  onRegenerate,
  isFavorite,
  onToggleFavorite,
}: Props) {
  return (
    <div className="result-grid">
      {/* 元の写真 */}
      <article className="result-card" onClick={() => onExpand('source')}>
        <div className="rc-head">
          <span className="orig">元</span>
          元の写真
        </div>
        <img src={source.dataUrl} alt="元の写真" />
        <div className="rc-actions">
          <span className="hint" style={{ margin: 0, padding: '2px 6px' }}>
            {source.fileName}
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="icon-btn"
            title="拡大"
            onClick={(e) => {
              e.stopPropagation();
              onExpand('source');
            }}
          >
            <IconExpand size={15} />
          </button>
        </div>
      </article>

      {results.map((img) => {
        const fav = isFavorite(img.id);
        return (
          <article
            key={img.id}
            className={`result-card${selectedId === img.id ? ' on' : ''}`}
            onClick={() => onSelect(img.id)}
          >
            <div className="rc-head">{img.styleName}</div>
            {/* 1回目のクリックで選択、選択済みの画像をもう一度クリックすると拡大表示 */}
            <img
              src={img.dataUrl}
              alt={`${img.styleName}の生成イメージ`}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedId === img.id) onExpand(img);
                else onSelect(img.id);
              }}
            />
            <div className="rc-actions">
              <button
                type="button"
                className={`icon-btn${fav ? ' fav' : ''}`}
                title={fav ? 'お気に入り解除' : 'お気に入りに保存'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(img.id);
                }}
              >
                <IconHeart size={15} filled={fav} />
              </button>
              <button
                type="button"
                className="icon-btn"
                title="拡大"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand(img);
                }}
              >
                <IconExpand size={15} />
              </button>
              <button
                type="button"
                className="icon-btn"
                title="ダウンロード"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(img);
                }}
              >
                <IconDownload size={15} />
              </button>
              <button
                type="button"
                className="icon-btn"
                title="このスタイルで再生成"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(img);
                }}
              >
                <IconRefresh size={15} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
