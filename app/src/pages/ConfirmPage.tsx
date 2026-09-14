import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCase } from '../hooks/useCase';
import { useIssues } from '../hooks/useIssues';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { FLOW_STEPS, nextStep, prevStep, stepIndexOf } from '../schema/flow';
import { computeOverallPercent } from '../utils/progress';
import { countErrors, countMissingRequired, countWarnings } from '../utils/validation';
import { getSectionById } from '../schema/sections';

function sectionPath(caseId: string, sectionId: string): string {
  if (sectionId === 'equipment-photos') return `/case/${caseId}/equipment-photos`;
  if (sectionId === 'wall-survey') return `/case/${caseId}/wall-survey`;
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
  const [ackWarnings, setAckWarnings] = useState(false);

  const sectionId = 'confirm';
  const stepNumber = stepIndexOf(sectionId) + 1;
  const percent = computeOverallPercent(issues);
  const missing = countMissingRequired(issues);
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const prev = prevStep(sectionId);
  const next = nextStep(sectionId);

  const canProceed = errors.length === 0 && (warnings.length === 0 || ackWarnings);

  return (
    <div className="app-shell">
      <TopBar
        caseName={surveyCase?.name ?? ''}
        address={surveyCase?.address}
        stepLabel="入力内容確認"
        stepNumber={stepNumber}
        totalSteps={FLOW_STEPS.length}
        percent={percent}
        saveState="saved"
        missingRequiredCount={missing}
      />
      <div className="page-body">
        <h2 className="section-title">入力内容確認</h2>

        <div className="card">
          <h3 className="card-title">サマリー</h3>
          <div className="topbar__meta" style={{ color: '#333' }}>
            <span className="pill pill-progress">修正必須エラー {countErrors(issues)}件</span>
            <span className="pill pill-draft">警告 {countWarnings(issues)}件</span>
            <span className="pill pill-done">全体進捗 {percent}%</span>
          </div>
        </div>

        {errors.length === 0 && warnings.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: 700 }}>
            未入力・警告項目はありません。PDF出力に進めます。
          </div>
        )}

        {errors.length > 0 && (
          <div className="card">
            <h3 className="card-title" style={{ color: 'var(--color-danger)' }}>
              修正必須のエラー({errors.length}件)
            </h3>
            {errors.map((issue, idx) => (
              <div
                key={idx}
                className="list-issue error"
                onClick={() => navigate(sectionPath(caseId, issue.sectionId))}
              >
                <span>
                  【{sectionLabel(issue.sectionId)}】{issue.message}
                </span>
                <span>▶</span>
              </div>
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="card">
            <h3 className="card-title" style={{ color: 'var(--color-warning)' }}>
              確認後に続行できる警告({warnings.length}件)
            </h3>
            {warnings.map((issue, idx) => (
              <div
                key={idx}
                className="list-issue warning"
                onClick={() => navigate(sectionPath(caseId, issue.sectionId))}
              >
                <span>
                  【{sectionLabel(issue.sectionId)}】{issue.message}
                </span>
                <span>▶</span>
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontWeight: 700 }}>
              <input type="checkbox" checked={ackWarnings} onChange={(e) => setAckWarnings(e.target.checked)} />
              警告内容を確認しました。このまま進めます。
            </label>
          </div>
        )}
      </div>
      <BottomNav
        onBack={prev ? () => navigate(prev.path(caseId)) : undefined}
        onSave={async () => refresh()}
        onNext={async () => {
          await refresh();
          if (next) navigate(next.path(caseId));
        }}
        nextDisabled={!canProceed}
        nextLabel="PDFプレビューへ"
      />
    </div>
  );
}
