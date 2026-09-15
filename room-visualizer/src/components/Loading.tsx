import { useEffect, useState } from 'react';

const MESSAGES = [
  'お部屋のイメージを作成しています…',
  '窓・間取り・撮影アングルはそのままに、家具を配置しています…',
  '床・壁・照明の仕上げを調整しています…',
  'スタイル別の候補を並べています…',
];

interface Props {
  /** 生成中のスタイル名（進捗表示に使用） */
  current?: string;
  progress?: number;
}

/** 生成中のローディング演出 */
export function LoadingOverlay({ current, progress = 0 }: Props) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="spinner" />
        <p className="loading-title">{MESSAGES[i]}</p>
        <p className="loading-sub">
          {current ? `「${current}」を生成中です` : 'しばらくお待ちください'}
        </p>
        <div className="progress">
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

/** 生成中のプレースホルダ */
export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
