import { useCallback, useEffect, useRef, useState } from 'react';
import { IconCompare } from '../icons';

interface Props {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

/** Before / After スライダー（ドラッグで比較） */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'BEFORE 元写真',
  afterLabel = 'AFTER 生成イメージ',
}: Props) {
  const [pos, setPos] = useState(50);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => dragging.current && move(e.clientX);
    const onTouch = (e: TouchEvent) => dragging.current && move(e.touches[0].clientX);
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouch);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', onUp);
    };
  }, [move]);

  return (
    <div
      className="ba-wrap"
      ref={wrapRef}
      onMouseDown={(e) => {
        dragging.current = true;
        move(e.clientX);
      }}
      onTouchStart={(e) => {
        dragging.current = true;
        move(e.touches[0].clientX);
      }}
    >
      <img src={beforeSrc} alt="元写真" draggable={false} />
      {/* 左=元写真／右=生成イメージ。clip-path で切り出すので画像の実寸に依存しない */}
      <div className="ba-after" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <img src={afterSrc} alt="生成イメージ" draggable={false} />
      </div>
      <span className="ba-tag left" style={{ opacity: pos > 14 ? 1 : 0, transition: 'opacity .15s' }}>
        {beforeLabel}
      </span>
      <span className="ba-tag right" style={{ opacity: pos < 86 ? 1 : 0, transition: 'opacity .15s' }}>
        {afterLabel}
      </span>
      <div className="ba-handle" style={{ left: `${pos}%` }}>
        <span className="ba-knob">
          <IconCompare size={17} />
        </span>
      </div>
    </div>
  );
}

/** 左右比較（並べて表示） */
export function SideBySide({ beforeSrc, afterSrc }: Props) {
  return (
    <div className="sbs">
      <figure>
        <img src={beforeSrc} alt="元写真" />
        <figcaption>BEFORE｜元写真</figcaption>
      </figure>
      <figure>
        <img src={afterSrc} alt="生成イメージ" />
        <figcaption>AFTER｜生成イメージ</figcaption>
      </figure>
    </div>
  );
}
