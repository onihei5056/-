import { useNavigate, useParams } from 'react-router-dom';
import { getSectionById } from '../schema/sections';
import { useSectionAnswers } from '../hooks/useSectionAnswers';
import { useCase } from '../hooks/useCase';
import { useIssues } from '../hooks/useIssues';
import { useGlobalAnswers } from '../hooks/useGlobalAnswers';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { DynamicForm } from '../components/DynamicForm';
import { FLOW_STEPS, nextStep, prevStep, stepIndexOf } from '../schema/flow';
import { computeOverallPercent } from '../utils/progress';
import { countMissingRequired } from '../utils/validation';

export function SectionPage() {
  const { caseId = '', sectionId = '' } = useParams();
  const navigate = useNavigate();
  const section = getSectionById(sectionId);
  const { surveyCase } = useCase(caseId);
  const { values, manualOverride, saveState, setValue, setManual, saveNow } = useSectionAnswers(caseId, sectionId);
  const { issues, refresh } = useIssues(caseId);
  const { globals, refresh: refreshGlobals } = useGlobalAnswers(caseId);

  if (!section) {
    return <div className="page-body">セクションが見つかりません。</div>;
  }

  const stepNumber = stepIndexOf(sectionId) + 1;
  const percent = computeOverallPercent(issues);
  const missing = countMissingRequired(issues);
  const sectionIssues = issues.filter((i) => i.sectionId === sectionId);
  const prev = prevStep(sectionId);
  const next = nextStep(sectionId);

  const goNext = async () => {
    await saveNow();
    const result = await refresh();
    const hasError = result.some((i) => i.sectionId === sectionId && i.level === 'error');
    if (hasError && !window.confirm('この画面に未入力の必須項目があります。このまま次へ進みますか?')) {
      return;
    }
    if (next) navigate(next.path(caseId));
  };

  return (
    <div className="app-shell">
      <TopBar
        caseName={surveyCase?.name ?? ''}
        address={surveyCase?.address}
        stepLabel={section.title}
        stepNumber={stepNumber}
        totalSteps={FLOW_STEPS.length}
        percent={percent}
        saveState={saveState}
        missingRequiredCount={missing}
      />
      <div className="page-body">
        <h2 className="section-title">{section.title}</h2>
        {sectionIssues.some((i) => i.level === 'error') && (
          <div className="confirm-box">この画面には未入力の必須項目があります。下記でご確認ください。</div>
        )}
        <DynamicForm
          groups={section.groups}
          values={values}
          globals={globals}
          manualOverride={manualOverride}
          issues={sectionIssues}
          onChange={setValue}
          onToggleManual={setManual}
        />
      </div>
      <BottomNav
        onBack={prev ? () => navigate(prev.path(caseId)) : () => navigate('/')}
        onSave={async () => {
          await saveNow();
          await refresh();
          await refreshGlobals();
        }}
        onNext={goNext}
        saving={saveState === 'saving'}
      />
    </div>
  );
}
