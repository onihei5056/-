import { useNavigate } from 'react-router-dom';

export type SaveState = 'saved' | 'saving' | 'unsaved';

interface Props {
  caseName: string;
  address?: string;
  stepLabel: string;
  stepNumber: number;
  totalSteps: number;
  percent: number;
  saveState: SaveState;
  missingRequiredCount: number;
}

const saveStateLabel: Record<SaveState, string> = {
  saved: '保存済み',
  saving: '保存中…',
  unsaved: '未保存の変更あり'
};

export function TopBar({ caseName, address, stepLabel, stepNumber, totalSteps, percent, saveState, missingRequiredCount }: Props) {
  const navigate = useNavigate();
  return (
    <div className="topbar">
      <div className="topbar__title-row">
        <div>
          <div className="topbar__case">{caseName || '(案件名未設定)'}</div>
          {address && <div className="topbar__step">{address}</div>}
        </div>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => navigate('/')}>
            案件一覧
          </button>
        </div>
      </div>
      <div className="topbar__step">
        ステップ {stepNumber}/{totalSteps}: {stepLabel}
      </div>
      <div className="topbar__progress">
        <div className="topbar__progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="topbar__meta">
        <span className="topbar__badge">全体進捗 {percent}%</span>
        <span className={`topbar__badge${saveState === 'unsaved' ? ' topbar__badge--warn' : saveState === 'saved' ? ' topbar__badge--ok' : ''}`}>
          {saveStateLabel[saveState]}
        </span>
        {missingRequiredCount > 0 ? (
          <span className="topbar__badge topbar__badge--warn">未入力必須 {missingRequiredCount}件</span>
        ) : (
          <span className="topbar__badge topbar__badge--ok">必須項目 入力済</span>
        )}
      </div>
    </div>
  );
}
