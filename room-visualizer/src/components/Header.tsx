import { IconCamera, IconHeart, IconHistory, IconHome, IconLogo, IconSettings, IconSparkle } from '../icons';

export type PageId = 'home' | 'generate' | 'favorites' | 'history' | 'settings';

const NAV: { id: PageId; label: string; shortLabel: string; icon: JSX.Element }[] = [
  { id: 'home', label: 'ホーム', shortLabel: 'ホーム', icon: <IconHome size={15} /> },
  { id: 'generate', label: '画像生成', shortLabel: '生成', icon: <IconSparkle size={15} /> },
  { id: 'favorites', label: 'お気に入り', shortLabel: 'お気に入り', icon: <IconHeart size={15} /> },
  { id: 'history', label: '履歴', shortLabel: '履歴', icon: <IconHistory size={15} /> },
  { id: 'settings', label: '設定', shortLabel: '設定', icon: <IconSettings size={15} /> },
];

interface Props {
  page: PageId;
  onNavigate: (page: PageId) => void;
  favoriteCount: number;
  historyCount: number;
  onUploadClick: () => void;
}

export function Header({ page, onNavigate, favoriteCount, historyCount, onUploadClick }: Props) {
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-logo">
          <IconLogo size={19} />
        </span>
        <span className="brand-text">
          <span className="brand-name">Room Visualizer</span>
          <span className="brand-sub">AIで、理想の空間をすぐに。</span>
        </span>
      </div>

      <nav className="nav">
        {NAV.map((item) => {
          const badge =
            item.id === 'favorites' ? favoriteCount : item.id === 'history' ? historyCount : 0;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item${page === item.id ? ' active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={page === item.id ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
              {badge > 0 && <span className="nav-badge">{badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="header-right">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onUploadClick}
          aria-label="画像をアップロード"
        >
          <IconCamera size={16} />
          <span className="btn-label">画像をアップロード</span>
        </button>
      </div>
    </header>
  );
}

/**
 * スマートフォン用のボトムナビゲーション。
 * iPhoneでは画面上部より親指が届く下部にナビを置いたほうが操作しやすいため、
 * 640px以下ではヘッダー内のナビを隠してこちらを表示する（表示切替はCSS側）。
 */
export function BottomNav({
  page,
  onNavigate,
  favoriteCount,
}: {
  page: PageId;
  onNavigate: (page: PageId) => void;
  favoriteCount: number;
}) {
  return (
    <nav className="bottom-nav" aria-label="メインメニュー">
      {NAV.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`bottom-nav-item${page === item.id ? ' active' : ''}`}
          onClick={() => onNavigate(item.id)}
          aria-current={page === item.id ? 'page' : undefined}
        >
          <span className="bn-icon">
            {item.icon}
            {item.id === 'favorites' && favoriteCount > 0 && <span className="bn-dot" />}
          </span>
          {item.shortLabel}
        </button>
      ))}
    </nav>
  );
}
