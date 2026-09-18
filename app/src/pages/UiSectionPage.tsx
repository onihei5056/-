import { useNavigate, useParams } from 'react-router-dom';
import { getUiSectionById } from '../schema/uiSections';
import { useSectionAnswers } from '../hooks/useSectionAnswers';
import { useCase } from '../hooks/useCase';
import { useCaseProgress } from '../hooks/useCaseProgress';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { SectionTabs } from '../components/SectionTabs';
import { FittingsForm } from '../components/FittingsForm';
import { nextStep, prevStep } from '../schema/flow';
import { computeUiSectionProgress } from '../utils/progress';

/**
 * UI構成について.xlsxの大項目(①〜④)の画面。
 * schema/uiSections.ts の kind で中身を切り替える。
 *   fittings    … 付帯設備表の入力フォーム
 *   placeholder … 大項目名のみ(内容は追加指示を受けてから実装する)
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

        {section.kind === 'fittings' ? (
          <FittingsForm values={values} onChange={setValue} />
        ) : (
          <div className="card">
            <p className="note-box">この大項目の入力内容は未設定です。</p>
          </div>
        )}
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
