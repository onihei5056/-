import { useNavigate, useParams } from 'react-router-dom';
import { useCase } from '../hooks/useCase';
import { useIssues } from '../hooks/useIssues';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { PhotoManager } from '../components/PhotoManager';
import { PHOTO_CATEGORIES } from '../schema/sections';
import { FLOW_STEPS, nextStep, prevStep, stepIndexOf } from '../schema/flow';
import { computeOverallPercent } from '../utils/progress';
import { countMissingRequired } from '../utils/validation';

export function EquipmentPhotosPage() {
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  const { surveyCase } = useCase(caseId);
  const { issues, refresh } = useIssues(caseId);

  const sectionId = 'equipment-photos';
  const stepNumber = stepIndexOf(sectionId) + 1;
  const percent = computeOverallPercent(issues);
  const missing = countMissingRequired(issues);
  const prev = prevStep(sectionId);
  const next = nextStep(sectionId);
  const photoWarnings = issues.filter((i) => i.sectionId === sectionId);

  return (
    <div className="app-shell">
      <TopBar
        caseName={surveyCase?.name ?? ''}
        address={surveyCase?.address}
        stepLabel="設備現況写真"
        stepNumber={stepNumber}
        totalSteps={FLOW_STEPS.length}
        percent={percent}
        saveState="saved"
        missingRequiredCount={missing}
      />
      <div className="page-body">
        <h2 className="section-title">設備現況写真</h2>
        {photoWarnings.length > 0 && (
          <div className="confirm-box">
            利用中の設備区分に対して未登録の写真があります(下記確認画面でも一覧できます)。
          </div>
        )}
        {PHOTO_CATEGORIES.map((cat) => (
          <PhotoManager key={cat.key} caseId={caseId} category={cat.key as never} title={cat.label} note={cat.note} />
        ))}
      </div>
      <BottomNav
        onBack={prev ? () => navigate(prev.path(caseId)) : undefined}
        onSave={async () => {
          await refresh();
        }}
        onNext={async () => {
          await refresh();
          if (next) navigate(next.path(caseId));
        }}
      />
    </div>
  );
}
