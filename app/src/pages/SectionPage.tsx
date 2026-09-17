import { useNavigate, useParams } from 'react-router-dom';
import { getSectionById } from '../schema/sections';
import { useSectionAnswers } from '../hooks/useSectionAnswers';
import { useCase } from '../hooks/useCase';
import { useIssues } from '../hooks/useIssues';
import { useGlobalAnswers } from '../hooks/useGlobalAnswers';
import { useCaseProgress } from '../hooks/useCaseProgress';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { DynamicForm } from '../components/DynamicForm';
import { SectionTabs } from '../components/SectionTabs';
import { nextStep, prevStep } from '../schema/flow';
import { computeSectionProgress } from '../utils/progress';

export function SectionPage() {
  const { caseId = '', sectionId = '' } = useParams();
  const navigate = useNavigate();
  const section = getSectionById(sectionId);
  const { surveyCase } = useCase(caseId);
  const { values, manualOverride, saveState, setValue, setManual, saveNow } = useSectionAnswers(caseId, sectionId);
  const { issues, refresh } = useIssues(caseId);
  const { globals, refresh: refreshGlobals } = useGlobalAnswers(caseId);
  const { progress, refresh: refreshProgress } = useCaseProgress(caseId);

  if (!section) {
    return <div className="page-body">セクションが見つかりません。</div>;
  }

  // 入力中の値で即座に反映したいので、このセクションだけは手元の値から計算する
  const sectionProgress = computeSectionProgress(sectionId, values);
  const sectionIssues = issues.filter((i) => i.sectionId === sectionId);
  const prev = prevStep(sectionId);
  const next = nextStep(sectionId);

  const syncAll = async () => {
    await saveNow();
    await Promise.all([refresh(), refreshGlobals(), refreshProgress()]);
  };

  return (
    <div className="app-shell">
      <TopBar
        caseName={surveyCase?.name ?? ''}
        address={surveyCase?.address}
        stepLabel={section.title}
        percent={progress.overall.percent}
        saveState={saveState}
        filled={progress.overall.filled}
        total={progress.overall.total}
      />
      <SectionTabs caseId={caseId} current={sectionId} progress={progress} />
      <div className="page-body">
        <h2 className="section-title">
          {section.title}
          <span className="section-title__count">
            {sectionProgress.filled}/{sectionProgress.total} 入力済み
          </span>
        </h2>

        <DynamicForm
          sectionId={sectionId}
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
        onSave={syncAll}
        onNext={async () => {
          await syncAll();
          if (next) navigate(next.path(caseId));
        }}
        saving={saveState === 'saving'}
      />
    </div>
  );
}
