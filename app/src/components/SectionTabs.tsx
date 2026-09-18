import { useNavigate } from 'react-router-dom';
import { SECTIONS } from '../schema/sections';
import type { CaseProgress } from '../hooks/useCaseProgress';

interface Props {
  caseId: string;
  current: string;
  progress: CaseProgress;
}

/**
 * 大分類を横並びで表示する目次。
 * タップするとその大分類の画面へ直接移動できる(ステップを順に辿る必要がない)。
 * 各タブには入力済み件数を表示し、どこが手つかずか一目で分かるようにしている。
 */
export function SectionTabs({ caseId, current, progress }: Props) {
  const navigate = useNavigate();

  const tabs = [
    ...SECTIONS.map((s) => {
      const p = progress.bySection[s.id];
      return {
        id: s.id,
        label: s.title,
        path: `/case/${caseId}/${s.id}`,
        badge: p ? `${p.filled}/${p.total}` : '',
        done: !!p && p.total > 0 && p.filled === p.total,
        started: !!p && p.filled > 0
      };
    }),
    {
      id: 'equipment-photos',
      label: '設備現況写真',
      path: `/case/${caseId}/equipment-photos`,
      badge: progress.photoCount > 0 ? `${progress.photoCount}枚` : '',
      done: false,
      started: progress.photoCount > 0
    },
    {
      id: 'wall-survey',
      label: '擁壁調査',
      path: `/case/${caseId}/wall-survey`,
      badge: progress.wallCount > 0 ? `${progress.wallCount}件` : '',
      done: false,
      started: progress.wallCount > 0
    },
    {
      id: 'confirm',
      label: '入力内容確認',
      path: `/case/${caseId}/confirm`,
      badge: '',
      done: false,
      started: false
    },
    {
      id: 'pdf-preview',
      label: 'PDF出力',
      path: `/case/${caseId}/pdf-preview`,
      badge: '',
      done: false,
      started: false
    }
  ];

  return (
    <nav className="section-tabs" aria-label="目次">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`section-tab${t.id === current ? ' current' : ''}${t.done ? ' done' : t.started ? ' started' : ''}`}
          onClick={() => t.id !== current && navigate(t.path)}
        >
          <span className="section-tab__label">{t.label}</span>
          {t.badge && <span className="section-tab__badge">{t.badge}</span>}
        </button>
      ))}
    </nav>
  );
}
