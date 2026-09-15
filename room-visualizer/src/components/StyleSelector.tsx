import { useMemo } from 'react';
import type { StyleId } from '../types';
import { ROOM_TYPE_FEATURES, STYLE_PRESETS } from '../mock/styles';
import { renderRoomSvg, svgToDataUrl } from '../mock/roomScene';
import type { RoomTypeId } from '../types';
import { IconCheck } from '../icons';

interface Props {
  roomType: RoomTypeId;
  selected: StyleId[];
  onToggle: (id: StyleId) => void;
}

/** スタイル選択カード。サンプル画像は選択中の部屋タイプに合わせて描画する */
export function StyleSelector({ roomType, selected, onToggle }: Props) {
  const thumbs = useMemo(() => {
    const map: Partial<Record<StyleId, string>> = {};
    for (const s of STYLE_PRESETS) {
      map[s.id] = svgToDataUrl(
        renderRoomSvg({
          palette: s.palette,
          features: ROOM_TYPE_FEATURES[roomType],
          lighting: s.lighting,
          tatami: roomType === 'washitsu',
        }),
      );
    }
    return map;
  }, [roomType]);

  return (
    <section className="card">
      <div className="card-head">
        <span className="step">3</span>
        <h2>インテリアスタイル</h2>
        <span className="head-sub">{selected.length}件選択</span>
      </div>
      <div className="card-body">
        <div className="style-grid">
          {STYLE_PRESETS.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                className={`style-card${on ? ' on' : ''}`}
                onClick={() => onToggle(s.id)}
                title={s.summary}
                aria-pressed={on}
              >
                <img src={thumbs[s.id]} alt={`${s.name}のサンプル`} loading="lazy" />
                {on && (
                  <span className="tick">
                    <IconCheck size={12} />
                  </span>
                )}
                <span className="style-card-name">{s.name}</span>
              </button>
            );
          })}
        </div>
        <p className="hint">複数選択すると、同じお部屋で見比べられる候補をまとめて生成します。</p>
      </div>
    </section>
  );
}
