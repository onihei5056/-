import type { GeneratedImage, PropertyInfo } from '../types';
import { ROOM_TYPES } from '../mock/options';
import type { RoomTypeId } from '../types';
import { formatDateTime } from '../utils/format';
import {
  IconCheck,
  IconCompare,
  IconDownload,
  IconHeart,
  IconLayers,
  IconRefresh,
  IconShare,
} from '../icons';
import { Disclaimer } from './Disclaimer';

interface Props {
  image: GeneratedImage | null;
  property: PropertyInfo;
  roomType: RoomTypeId;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDownload: () => void;
  onShare: () => void;
  onRegenerateSame: () => void;
  onRegenerateOther: () => void;
  onCompare: () => void;
}

/** 右カラム：選択中の生成画像の詳細 */
export function ResultDetail({
  image,
  property,
  roomType,
  isFavorite,
  onToggleFavorite,
  onDownload,
  onShare,
  onRegenerateSame,
  onRegenerateOther,
  onCompare,
}: Props) {
  if (!image) {
    return (
      <section className="card card-pad">
        <p className="hint" style={{ margin: 0 }}>
          生成結果を選択すると、スタイルのポイントと使用アイテムがここに表示されます。
        </p>
      </section>
    );
  }

  const roomLabel = ROOM_TYPES.find((r) => r.id === roomType)?.label ?? '';

  return (
    <div className="detail-grid">
      <section className="card">
        <div className="card-head">
          <IconLayers size={15} />
          <h3>このスタイルのポイント</h3>
        </div>
        <div className="card-body">
          <div className="section-title" style={{ color: 'var(--accent-dark)' }}>
            {image.styleName}
            {roomLabel && <span className="opt" style={{ color: 'var(--muted)', fontWeight: 400 }}>｜{roomLabel}</span>}
          </div>
          <ul className="point-list">
            {image.points.map((p) => (
              <li key={p}>
                <IconCheck size={13} className="dot" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>使用したアイテム例</h3>
          <span className="head-sub">{image.items.length}点</span>
        </div>
        <div className="card-body">
          <div className="item-grid">
            {image.items.map((it) => (
              <div className="item-card" key={it.name}>
                <img src={it.thumbnail} alt={it.name} />
                <div className="it">
                  <div className="it-name">{it.name}</div>
                  <div className="it-note">{it.note}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="hint">実際の家具・仕様を示すものではありません。イメージ用の参考例です。</p>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>この画像への操作</h3>
        </div>
        <div className="card-body">
          <div className="action-list">
            <button type="button" className="btn btn-primary" onClick={onDownload}>
              <IconDownload size={15} />
              この画像をダウンロード
            </button>
            <button type="button" className="btn" onClick={onToggleFavorite}>
              <IconHeart size={15} filled={isFavorite} />
              {isFavorite ? 'お気に入りから外す' : 'お気に入りに保存'}
            </button>
            <button type="button" className="btn" onClick={onShare}>
              <IconShare size={15} />
              共有する
            </button>
            <button type="button" className="btn" onClick={onRegenerateSame}>
              <IconRefresh size={15} />
              同じスタイルでもう一度生成
            </button>
            <button type="button" className="btn" onClick={onRegenerateOther}>
              <IconLayers size={15} />
              別スタイルで生成
            </button>
            <button type="button" className="btn" onClick={onCompare}>
              <IconCompare size={15} />
              元写真と比較
            </button>
          </div>

          <hr className="divider" />
          <table className="meta-table">
            <tbody>
              <tr>
                <th>物件名</th>
                <td>{property.name || '（未入力）'}</td>
              </tr>
              <tr>
                <th>部屋番号</th>
                <td>{property.roomNumber || '—'}</td>
              </tr>
              <tr>
                <th>担当者</th>
                <td>{property.staff || '—'}</td>
              </tr>
              <tr>
                <th>生成日時</th>
                <td>{formatDateTime(image.createdAt)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 12 }}>
            <Disclaimer />
          </div>
        </div>
      </section>
    </div>
  );
}
