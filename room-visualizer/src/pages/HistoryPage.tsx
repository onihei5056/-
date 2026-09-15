import { useMemo, useState } from 'react';
import { useAppStore } from '../store/AppStore';
import { ROOM_TYPES } from '../mock/options';
import { STYLE_PRESETS } from '../mock/styles';
import { formatDateTime, toDateKey } from '../utils/format';
import { IconHeart, IconSearch, IconSliders, IconSparkle, IconTrash } from '../icons';
import { useIsPhone } from '../hooks/useMediaQuery';
import { ImageModal } from '../components/ImageModal';
import { Disclaimer } from '../components/Disclaimer';
import type { GenerationRecord } from '../types';

interface Props {
  onOpenRecord: (record: GenerationRecord) => void;
  notify: (m: string) => void;
}

/** 履歴画面：過去に生成した案件を検索・再表示する */
export function HistoryPage({ onOpenRecord, notify }: Props) {
  const { records, removeRecord, toggleFavorite } = useAppStore();
  const [q, setQ] = useState('');
  const [date, setDate] = useState('');
  const [style, setStyle] = useState('');
  const [roomType, setRoomType] = useState('');
  const [modal, setModal] = useState<{ src: string; title: string } | null>(null);
  // スマートフォンでは絞り込み条件を折りたたみ、検索欄だけを常時表示する
  const isPhone = useIsPhone();
  const [showFilters, setShowFilters] = useState(false);
  const activeFilters = [date, style, roomType].filter(Boolean).length;
  const filtersVisible = !isPhone || showFilters;

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        if (q) {
          const hay = `${r.property.name} ${r.property.address} ${r.property.roomNumber} ${r.property.staff} ${r.property.memo}`;
          if (!hay.toLowerCase().includes(q.toLowerCase())) return false;
        }
        if (date && toDateKey(r.createdAt) !== date) return false;
        if (style && !r.results.some((x) => x.styleId === style)) return false;
        if (roomType && r.condition.roomType !== roomType) return false;
        return true;
      }),
    [records, q, date, style, roomType],
  );

  return (
    <div className="page">
      <div className="container">
        <div className="page-head" style={{ marginBottom: 14 }}>
          <h1>履歴</h1>
          <p>過去に生成した案件を検索して、再表示・再生成できます。</p>
        </div>

        <div className="toolbar">
          <div className="search">
            <IconSearch size={15} className="ic" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="物件名・所在地・担当者で検索"
            />
          </div>
          {isPhone && (
            <button
              type="button"
              className="btn btn-sm filter-toggle"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
            >
              <IconSliders size={14} />
              絞り込み
              {activeFilters > 0 && <span className="nav-badge">{activeFilters}</span>}
            </button>
          )}
          {filtersVisible && (
            <>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="生成日" />
              <select value={style} onChange={(e) => setStyle(e.target.value)} aria-label="スタイル">
                <option value="">すべてのスタイル</option>
                {STYLE_PRESETS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select value={roomType} onChange={(e) => setRoomType(e.target.value)} aria-label="部屋タイプ">
                <option value="">すべての部屋タイプ</option>
                {ROOM_TYPES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </>
          )}
          {(q || date || style || roomType) && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setQ('');
                setDate('');
                setStyle('');
                setRoomType('');
              }}
            >
              条件をクリア
            </button>
          )}
          <span className="result-count">{filtered.length}件 / 全{records.length}件</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <IconSearch size={34} />
            </div>
            <h3>該当する履歴がありません</h3>
            <p>検索条件を変更するか、画像生成画面から新しく生成してください。</p>
          </div>
        ) : (
          <div className="history-list">
            {filtered.map((r) => {
              const roomLabel = ROOM_TYPES.find((x) => x.id === r.condition.roomType)?.label ?? '';
              return (
                <article className="card history-card" key={r.id}>
                  <div className="hc-src">
                    <img src={r.source.dataUrl} alt="元画像" />
                    <div className="cap">元画像</div>
                  </div>
                  <div className="hc-main">
                    <div className="hc-title">
                      <h3>
                        {r.property.name || '（物件名なし）'}
                        {r.property.roomNumber && ` ${r.property.roomNumber}`}
                      </h3>
                      <span className="date">{formatDateTime(r.createdAt)}</span>
                    </div>
                    <div className="hc-tags">
                      {roomLabel && <span className="tag">{roomLabel}</span>}
                      {r.results.map((x) => (
                        <span className="tag plain" key={x.id}>
                          {x.styleName}
                        </span>
                      ))}
                      {r.property.staff && <span className="tag plain">担当：{r.property.staff}</span>}
                    </div>
                    <div className="hc-thumbs">
                      {r.results.map((x) => {
                        const fav = r.favoriteImageIds.includes(x.id);
                        return (
                          <div
                            className="hc-thumb"
                            key={x.id}
                            onClick={() => setModal({ src: x.dataUrl, title: `${r.property.name || '物件'}｜${x.styleName}` })}
                          >
                            <img src={x.dataUrl} alt={x.styleName} loading="lazy" />
                            {fav && (
                              <span className="fav-mark">
                                <IconHeart size={14} filled />
                              </span>
                            )}
                            <div className="nm">
                              {x.styleName}
                              <span style={{ marginLeft: 'auto' }}>
                                <button
                                  type="button"
                                  className={`icon-btn${fav ? ' fav' : ''}`}
                                  style={{ width: 22, height: 20 }}
                                  title={fav ? 'お気に入り解除' : 'お気に入りに保存'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(r.id, x.id);
                                  }}
                                >
                                  <IconHeart size={13} filled={fav} />
                                </button>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="hc-actions">
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => onOpenRecord(r)}>
                        <IconSparkle size={14} />
                        この条件で開く
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          removeRecord(r.id);
                          notify('履歴を削除しました');
                        }}
                      >
                        <IconTrash size={14} />
                        削除
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <Disclaimer />
        </div>
      </div>
      {modal && <ImageModal src={modal.src} title={modal.title} onClose={() => setModal(null)} />}
    </div>
  );
}
