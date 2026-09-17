import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/db';
import { useCase } from '../hooks/useCase';
import { useIssues } from '../hooks/useIssues';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { PhotoManager } from '../components/PhotoManager';
import { PHOTO_CATEGORIES, PHOTO_SHEET_NOTES, PHOTO_DISCLAIMER_TEMPLATE } from '../schema/sections';
import { SectionTabs } from '../components/SectionTabs';
import { useCaseProgress } from '../hooks/useCaseProgress';
import { nextStep, prevStep } from '../schema/flow';
import type { PhotoCategoryKey } from '../types';

export function EquipmentPhotosPage() {
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  const { surveyCase, refresh: refreshCase } = useCase(caseId);
  const { issues, refresh } = useIssues(caseId);

  const sectionId = 'equipment-photos';
  const { progress, refresh: refreshProgress } = useCaseProgress(caseId);
  const prev = prevStep(sectionId);
  const next = nextStep(sectionId);
  const photoWarnings = issues.filter((i) => i.sectionId === sectionId);

  const years = surveyCase?.buildingAgeYears;
  const disclaimer = PHOTO_DISCLAIMER_TEMPLATE.replace('{years}', years ? String(years) : '　　');

  return (
    <div className="app-shell">
      <TopBar
        caseName={surveyCase?.name ?? ''}
        address={surveyCase?.address}
        stepLabel="設備現況写真"
        percent={progress.overall.percent}
        saveState="saved"
        filled={progress.overall.filled}
        total={progress.overall.total}
      />
      <SectionTabs caseId={caseId} current={sectionId} progress={progress} />
      <div className="page-body">
        <h2 className="section-title">設備現況写真</h2>

        <div className="note-box">
          {PHOTO_SHEET_NOTES.map((n, i) => (
            <div key={i}>{n}</div>
          ))}
        </div>

        {photoWarnings.length > 0 && (
          <div className="confirm-box">
            利用中の設備区分に未登録の写真があります(入力内容確認画面でも一覧できます)。
          </div>
        )}

        <div className="card">
          <h3 className="card-title">帳票下部の免責文</h3>
          <div className="field">
            <label className="field-label">
              築年数<span className="field-unit">(年)</span>
            </label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              value={years ?? ''}
              onChange={async (e) => {
                const v = e.target.value === '' ? undefined : Number(e.target.value);
                await db.cases.update(caseId, { buildingAgeYears: v, updatedAt: Date.now() });
                await refreshCase();
              }}
            />
            <div className="field-note">PDFの設備現況写真ページ下部に次の文言で出力されます。</div>
          </div>
          <div className="note-box" style={{ marginBottom: 0 }}>
            {disclaimer}
          </div>
        </div>

        {PHOTO_CATEGORIES.map((cat) => (
          <PhotoManager
            key={cat.key}
            caseId={caseId}
            category={cat.key as PhotoCategoryKey}
            title={cat.inExcelForm ? `【${cat.label}】` : `【${cat.label}】(帳票枠外)`}
            note={cat.note}
          />
        ))}
      </div>
      <BottomNav
        onBack={prev ? () => navigate(prev.path(caseId)) : undefined}
        onSave={async () => {
          await Promise.all([refresh(), refreshProgress()]);
        }}
        onNext={async () => {
          await Promise.all([refresh(), refreshProgress()]);
          if (next) navigate(next.path(caseId));
        }}
      />
    </div>
  );
}
