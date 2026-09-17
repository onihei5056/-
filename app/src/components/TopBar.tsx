import { useNavigate } from 'react-router-dom';

export type SaveState = 'saved' | 'saving' | 'unsaved';

interface Props {
  caseName: string;
  address?: string;
  stepLabel: string;
  percent: number;
  saveState: SaveState;
  /** 入力済み項目数 / 表示対象項目数(必須は物件名のみのため、必須未入力数ではなく入力量を示す) */
  filled?: number;
  total?: number;
}

const saveStateLabel: Record<SaveState, string> = {
  saved: '保存済み',
  saving: '保存中…',
  unsaved: '未保存の変更あり'
};

export function TopBar({ caseName, address, stepLabel, percent, saveState, filled, total }: Props) {
  const navigate = useNavigate();
  return (
    <div className="topbar">
      <div className="topbar__title-row">
        <div style={{ minWidth: 0 }}>
          <div className="topbar__case">{caseName || '(物件名未設定)'}</div>
          {address && <div className="topbar__step">{address}</div>}
        </div>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => navigate('/')}>
            案件一覧
          </button>
        </div>
      </div>
      <div className="topbar__step">{stepLabel}</div>
      <div className="topbar__progress">
        <div className="topbar__progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="topbar__meta">
        <span className="topbar__badge">入力状況 {percent}%</span>
        {total !== undefined && filled !== undefined && (
          <span className="topbar__badge">
            {filled}/{total} 項目
          </span>
        )}
        <span
          className={`topbar__badge${
            saveState === 'unsaved' ? ' topbar__badge--warn' : saveState === 'saved' ? ' topbar__badge--ok' : ''
          }`}
        >
          {saveStateLabel[saveState]}
        </span>
      </div>
    </div>
  );
}
