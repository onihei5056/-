import { useNavigate, useParams } from 'react-router-dom';
import { useCase } from '../hooks/useCase';
import { useIssues } from '../hooks/useIssues';
import { useCaseProgress } from '../hooks/useCaseProgress';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { SectionTabs } from '../components/SectionTabs';
import { nextStep, prevStep } from '../schema/flow';
import { SECTIONS, getSectionById } from '../schema/sections';

function sectionPath(caseId: string, sectionId: string): string {
  return `/case/${caseId}/${sectionId}`;
}

function sectionLabel(sectionId: string): string {
  if (sectionId === 'equipment-photos') return '設備現況写真';
  if (sectionId === 'wall-survey') return '擁壁調査';
  return getSectionById(sectionId)?.title ?? sectionId;
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
          {SECTIONS.map((s) => {
            const p = progress.bySection[s.id];
            if (!p) return null;
            return (
              <div key={s.id} className="progress-row" onClick={() => navigate(sectionPath(caseId, s.id))}>
                <span className="progress-row__label">{s.title}</span>
                <span className="progress-row__bar">
                  <span className="progress-row__fill" style={{ width: `${p.percent}%` }} />
                </span>
                <span className={`progress-row__count${p.total > 0 && p.filled === p.total ? ' complete' : ''}`}>
                  {p.filled}/{p.total}
                </span>
              </div>
            );
          })}
          <div className="progress-row" onClick={() => navigate(`/case/${caseId}/equipment-photos`)}>
            <span className="progress-row__label">設備現況写真</span>
            <span className="progress-row__bar" />
            <span className="progress-row__count">{progress.photoCount}枚</span>
          </div>
          <div className="progress-row" onClick={() => navigate(`/case/${caseId}/wall-survey`)}>
            <span className="progress-row__label">擁壁調査</span>
            <span className="progress-row__bar" />
            <span className="progress-row__count">{progress.wallCount}件</span>
          </div>
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
