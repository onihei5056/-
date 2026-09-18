import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getUiSectionById } from '../schema/uiSections';
import { useSectionAnswers } from '../hooks/useSectionAnswers';
import { useCase } from '../hooks/useCase';
import { useCaseProgress } from '../hooks/useCaseProgress';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { SectionTabs } from '../components/SectionTabs';
import { FittingsForm } from '../components/FittingsForm';
import { nextStep, prevStep, screenStep } from '../schema/flow';
import { computeUiSectionProgress } from '../utils/progress';

/**
 * UI構成について.xlsxの大項目そのものが入力画面になるもの(現状は④付帯設備表のみ)。
 * 小項目をまとめるだけの大項目(kind: 'group')を開いた場合は、最初の小項目へ転送する。
 * 回答は他の画面と同じ sectionAnswers テーブルに、画面IDをキーにして保存される。
 */
export function UiSectionPage() {
  const { caseId = '', uiSectionId = '' } = useParams();
  const navigate = useNavigate();
  const section = getUiSectionById(uiSectionId);
  const { surveyCase } = useCase(caseId);
  const { values, saveState, setValue, saveNow } = useSectionAnswers(caseId, uiSectionId);
  const { progress, refresh: refreshProgress } = useCaseProgress(caseId);

  if (!section) {
    return <div className="page-body">画面が見つかりません。</div>;
  }

  // 小項目をまとめるだけの大項目は、最初の小項目の画面へ移動する
  if (section.kind === 'group') {
    const first = section.children.map(screenStep).find((s) => !!s);
    return <Navigate to={first ? first.path(caseId) : '/'} replace />;
  }

  const sectionProgress = computeUiSectionProgress(uiSectionId, values);
  const prev = prevStep(uiSectionId);
  const next = nextStep(uiSectionId);

  const syncAll = async () => {
    await saveNow();
    await refreshProgress();
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
      <SectionTabs caseId={caseId} current={uiSectionId} progress={progress} />
      <div className="page-body">
        <h2 className="section-title">
          {section.title}
          {sectionProgress.total > 0 && (
            <span className="section-title__count">
              {sectionProgress.filled}/{sectionProgress.total} 入力済み
            </span>
          )}
        </h2>

        <FittingsForm values={values} onChange={setValue} />
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
