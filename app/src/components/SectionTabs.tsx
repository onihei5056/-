import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCREEN_SHORT_LABELS, UI_SECTIONS, getUiSectionByScreen } from '../schema/uiSections';
import { screenStep } from '../schema/flow';
import type { CaseProgress } from '../hooks/useCaseProgress';
import type { Progress } from '../utils/progress';

interface Props {
  caseId: string;
  current: string;
  progress: CaseProgress;
}

/**
 * 2段構成の目次。
 *   1段目 … 大項目(①〜④)を横並び。タップするとその中の小項目が下に出てくる
 *   2段目 … 開いている大項目に属する入力画面(小項目)
 * 並び順・所属は schema/uiSections.ts の1か所で決まる。
 */
export function SectionTabs({ caseId, current, progress }: Props) {
  const navigate = useNavigate();
  const currentUi = getUiSectionByScreen(current);
  // 既定では「今いる画面の大項目」を開く。別の大項目をタップするとそちらが開く
  const [openedId, setOpenedId] = useState<string | null>(null);
  const openId = openedId ?? currentUi?.id ?? null;
  const opened = UI_SECTIONS.find((s) => s.id === openId);

  /** 大項目の入力状況(小項目の合計) */
  const groupProgress = (childIds: string[]): Progress => {
    let filled = 0;
    let total = 0;
    for (const id of childIds) {
      const p = progress.bySection[id];
      if (!p) continue;
      filled += p.filled;
      total += p.total;
    }
    return { filled, total, percent: total === 0 ? 0 : Math.round((filled / total) * 100) };
  };

  const go = (path: string) => navigate(path);

  return (
    <div className="section-tabs-wrap">
      <nav className="section-tabs" aria-label="大項目">
        {UI_SECTIONS.map((s) => {
          const p = s.kind === 'fittings' ? progress.bySection[s.id] : groupProgress(s.children);
          const isCurrent = currentUi?.id === s.id;
          const isOpen = openId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className={`section-tab${isCurrent ? ' current' : ''}${
                p && p.total > 0 && p.filled === p.total ? ' done' : p && p.filled > 0 ? ' started' : ''
              }${isOpen ? ' open' : ''}`}
              onClick={() => {
                if (s.kind === 'fittings') {
                  setOpenedId(s.id);
                  if (current !== s.id) go(`/case/${caseId}/ui/${s.id}`);
                } else {
                  setOpenedId(s.id);
                }
              }}
            >
              <span className="section-tab__label">{s.title}</span>
              {p && p.total > 0 && (
                <span className="section-tab__badge">
                  {p.filled}/{p.total}
                </span>
              )}
              {s.children.length > 0 && <span className="section-tab__chevron">{isOpen ? '▲' : '▼'}</span>}
            </button>
          );
        })}
        <button
          type="button"
          className={`section-tab section-tab--finish${current === 'confirm' ? ' current' : ''}`}
          onClick={() => current !== 'confirm' && go(`/case/${caseId}/confirm`)}
        >
          <span className="section-tab__label">入力内容確認</span>
        </button>
        <button
          type="button"
          className={`section-tab section-tab--finish${current === 'pdf-preview' ? ' current' : ''}`}
          onClick={() => current !== 'pdf-preview' && go(`/case/${caseId}/pdf-preview`)}
        >
          <span className="section-tab__label">PDF出力</span>
        </button>
      </nav>

      {opened && opened.children.length > 0 && (
        <nav className="section-tabs section-tabs--child" aria-label={`${opened.title}の小項目`}>
          {opened.children.map((childId) => {
            const step = screenStep(childId);
            if (!step) return null;
            const p = progress.bySection[childId];
            const badge =
              childId === 'equipment-photos'
                ? progress.photoCount > 0
                  ? `${progress.photoCount}枚`
                  : ''
                : childId === 'wall-survey'
                  ? progress.wallCount > 0
                    ? `${progress.wallCount}件`
                    : ''
                  : p && p.total > 0
                    ? `${p.filled}/${p.total}`
                    : '';
            return (
              <button
                key={childId}
                type="button"
                className={`section-tab section-tab--child${childId === current ? ' current' : ''}${
                  p && p.total > 0 && p.filled === p.total ? ' done' : p && p.filled > 0 ? ' started' : ''
                }`}
                onClick={() => childId !== current && go(step.path(caseId))}
              >
                <span className="section-tab__label">{SCREEN_SHORT_LABELS[childId] ?? step.label}</span>
                {badge && <span className="section-tab__badge">{badge}</span>}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
