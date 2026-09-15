import { IconHeart, IconHistory, IconHome, IconLogo, IconSettings, IconSparkle, IconUpload } from '../icons';

export type PageId = 'home' | 'generate' | 'favorites' | 'history' | 'settings';

const NAV: { id: PageId; label: string; icon: JSX.Element }[] = [
  { id: 'home', label: 'ホーム', icon: <IconHome size={15} /> },
  { id: 'generate', label: '画像生成', icon: <IconSparkle size={15} /> },
  { id: 'favorites', label: 'お気に入り', icon: <IconHeart size={15} /> },
  { id: 'history', label: '履歴', icon: <IconHistory size={15} /> },
  { id: 'settings', label: '設定', icon: <IconSettings size={15} /> },
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
        <button type="button" className="btn btn-primary" onClick={onUploadClick}>
          <IconUpload size={15} />
          <span className="btn-label">画像をアップロード</span>
        </button>
      </div>
    </header>
  );
}
