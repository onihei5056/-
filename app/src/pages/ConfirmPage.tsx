import { useNavigate, useParams } from 'react-router-dom';
import { useCase } from '../hooks/useCase';
import { useIssues } from '../hooks/useIssues';
import { useCaseProgress } from '../hooks/useCaseProgress';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { SectionTabs } from '../components/SectionTabs';
import { nextStep, prevStep, screenStep } from '../schema/flow';
import { getSectionById } from '../schema/sections';
import { UI_SECTIONS } from '../schema/uiSections';

function sectionPath(caseId: string, sectionId: string): string {
  return screenStep(sectionId)?.path(caseId) ?? `/case/${caseId}/${sectionId}`;
}

function sectionLabel(sectionId: string): string {
  return screenStep(sectionId)?.label ?? getSectionById(sectionId)?.title ?? sectionId;
}

export function ConfirmPage() {
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  const { surveyCase } = useCase(caseId);
  const { issues, refresh } = useIssues(caseId);
  const { progress } = useCaseProgress(caseId);

  const prev = prevStep('confirm');
  const next = nextStep('confirm');

  return (
    <div className="app-shell">
      <TopBar
        caseName={surveyCase?.name ?? ''}
        address={surveyCase?.address}
        stepLabel="入力内容確認"
        percent={progress.overall.percent}
        saveState="saved"
        filled={progress.overall.filled}
        total={progress.overall.total}
      />
      <SectionTabs caseId={caseId} current="confirm" progress={progress} />
      <div className="page-body">
        <h2 className="section-title">入力内容確認</h2>

        <div className="note-box">
          必須項目は「物件名」のみです。未入力の項目があってもPDFは出力できます。
          下記は確認をおすすめする事項で、出力を妨げるものではありません。
        </div>

        <div className="card">
          <h3 className="card-title">大分類ごとの入力状況</h3>
          {UI_SECTIONS.map((ui) => (
            <div key={ui.id}>
              <div className="progress-group-title">{ui.title}</div>
              {ui.kind === 'fittings' ? (
                <ProgressRow
                  label="付帯設備表"
                  filled={progress.bySection[ui.id]?.filled ?? 0}
                  total={progress.bySection[ui.id]?.total ?? 0}
                  percent={progress.bySection[ui.id]?.percent ?? 0}
                  onClick={() => navigate(`/case/${caseId}/ui/${ui.id}`)}
                />
              ) : (
                ui.children.map((childId) => {
                  const step = screenStep(childId);
                  if (!step) return null;
                  if (childId === 'equipment-photos') {
                    return (
                      <ProgressRow
                        key={childId}
                        label={step.label}
                        countText={`${progress.photoCount}枚`}
                        onClick={() => navigate(step.path(caseId))}
                      />
                    );
                  }
                  if (childId === 'wall-survey') {
                    return (
                      <ProgressRow
                        key={childId}
                        label={step.label}
                        countText={`${progress.wallCount}件`}
                        onClick={() => navigate(step.path(caseId))}
                      />
                    );
                  }
                  const p = progress.bySection[childId];
                  if (!p) return null;
                  return (
                    <ProgressRow
                      key={childId}
                      label={step.label}
                      filled={p.filled}
                      total={p.total}
                      percent={p.percent}
                      onClick={() => navigate(step.path(caseId))}
                    />
                  );
                })
              )}
            </div>
          ))}
        </div>

        {issues.length > 0 && (
          <div className="card">
            <h3 className="card-title" style={{ color: 'var(--color-warning)' }}>
              確認をおすすめする事項({issues.length}件)
            </h3>
            {issues.map((issue, idx) => (
              <div key={idx} className="list-issue warning" onClick={() => navigate(sectionPath(caseId, issue.sectionId))}>
                <span>
                  【{sectionLabel(issue.sectionId)}】{issue.message}
                </span>
                <span>▶</span>
              </div>
            ))}
          </div>
        )}

        {issues.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: 700 }}>
            確認事項はありません。
          </div>
        )}
      </div>
      <BottomNav
        onBack={prev ? () => navigate(prev.path(caseId)) : undefined}
        onSave={async () => refresh()}
        onNext={() => next && navigate(next.path(caseId))}
        nextLabel="PDFプレビューへ"
      />
    </div>
  );
}

interface ProgressRowProps {
  label: string;
  filled?: number;
  total?: number;
  percent?: number;
  countText?: string;
  onClick: () => void;
}

/** 大項目の下に並べる、画面ごとの入力状況1行 */
function ProgressRow({ label, filled, total, percent, countText, onClick }: ProgressRowProps) {
  const complete = total !== undefined && total > 0 && filled === total;
  return (
    <div className="progress-row" onClick={onClick}>
      <span className="progress-row__label">{label}</span>
      <span className="progress-row__bar">
        {percent !== undefined && <span className="progress-row__fill" style={{ width: `${percent}%` }} />}
      </span>
      <span className={`progress-row__count${complete ? ' complete' : ''}`}>
        {countText ?? `${filled}/${total}`}
      </span>
    </div>
  );
}
