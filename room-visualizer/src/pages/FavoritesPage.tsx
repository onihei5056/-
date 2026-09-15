import { useMemo, useState } from 'react';
import { useAppStore } from '../store/AppStore';
import { formatDateTime } from '../utils/format';
import { ROOM_TYPES } from '../mock/options';
import { IconDownload, IconExpand, IconHeart, IconSparkle } from '../icons';
import { ImageModal } from '../components/ImageModal';
import { Disclaimer } from '../components/Disclaimer';
import { downloadImage } from '../utils/image';
import { safeFileName } from '../utils/format';
import type { GenerationRecord } from '../types';

interface Props {
  onOpenRecord: (record: GenerationRecord) => void;
  notify: (m: string) => void;
  burnNoticeOnDownload: boolean;
}

/** お気に入り画面：案件ごとにまとめて表示する */
export function FavoritesPage({ onOpenRecord, notify, burnNoticeOnDownload }: Props) {
  const { favorites, toggleFavorite } = useAppStore();
  const [modal, setModal] = useState<{ src: string; title: string } | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, { record: GenerationRecord; images: typeof favorites }>();
    for (const f of favorites) {
      const g = map.get(f.record.id) ?? { record: f.record, images: [] };
      g.images.push(f);
      map.set(f.record.id, g);
    }
    return Array.from(map.values());
  }, [favorites]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-head" style={{ marginBottom: 16 }}>
          <h1>お気に入り</h1>
          <p>お客様への提案候補として保存した画像を、案件ごとにまとめています。</p>
          <span className="spacer" />
          <span className="hint" style={{ margin: 0 }}>{favorites.length}件</span>
        </div>

        {groups.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <IconHeart size={34} />
            </div>
            <h3>お気に入りはまだありません</h3>
            <p>生成結果のハートアイコンから、提案に使いたい画像を保存できます。</p>
          </div>
        ) : (
          groups.map(({ record, images }) => {
            const roomLabel = ROOM_TYPES.find((x) => x.id === record.condition.roomType)?.label ?? '';
            return (
              <section className="fav-group" key={record.id}>
                <div className="fav-group-head">
                  <h3>
                    {record.property.name || '（物件名なし）'}
                    {record.property.roomNumber && ` ${record.property.roomNumber}`}
                  </h3>
                  <span className="sub">
                    {roomLabel}／{formatDateTime(record.createdAt)}
                  </span>
                  <span className="spacer" style={{ marginLeft: 'auto' }} />
                  <button type="button" className="btn btn-sm" onClick={() => onOpenRecord(record)}>
                    <IconSparkle size={14} />
                    この案件を開く
                  </button>
                </div>
                <div className="fav-grid">
                  {images.map(({ image }) => (
                    <article className="result-card" key={image.id}>
                      <div className="rc-head">{image.styleName}</div>
                      <img
                        src={image.dataUrl}
                        alt={image.styleName}
                        onClick={() =>
                          setModal({
                            src: image.dataUrl,
                            title: `${record.property.name || '物件'}｜${image.styleName}`,
                          })
                        }
                      />
                      <div className="rc-actions">
                        <button
                          type="button"
                          className="icon-btn fav"
                          title="お気に入りから外す"
                          onClick={() => {
                            toggleFavorite(record.id, image.id);
                            notify('お気に入りから外しました');
                          }}
                        >
                          <IconHeart size={15} filled />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          title="拡大"
                          onClick={() =>
                            setModal({
                              src: image.dataUrl,
                              title: `${record.property.name || '物件'}｜${image.styleName}`,
                            })
                          }
                        >
                          <IconExpand size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          title="ダウンロード"
                          onClick={() => {
                            void downloadImage(
                              image.dataUrl,
                              `${safeFileName(record.property.name || 'RoomVisualizer')}_${image.styleName}`,
                              burnNoticeOnDownload,
                            );
                            notify('画像を保存しました');
                          }}
                        >
                          <IconDownload size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })
        )}

        <Disclaimer />
      </div>
      {modal && <ImageModal src={modal.src} title={modal.title} onClose={() => setModal(null)} />}
    </div>
  );
}
