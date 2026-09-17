import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCase } from '../hooks/useCase';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { prevStep } from '../schema/flow';
import { SectionTabs } from '../components/SectionTabs';
import { useCaseProgress } from '../hooks/useCaseProgress';
import { generatePdfBlob, pdfFileName } from '../pdf/generator';
import { db, addAuditLog } from '../db/db';

export function PdfPreviewPage() {
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  const { surveyCase, refresh } = useCase(caseId);
  const [status, setStatus] = useState('準備中');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sectionId = 'pdf-preview';
  const { progress } = useCaseProgress(caseId);
  const prev = prevStep(sectionId);

  const generate = async () => {
    setGenerating(true);
    setStatus('生成中…');
    try {
      const blob = await generatePdfBlob(caseId, setStatus);
      setPdfBlob(blob);
      setPdfUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      setStatus('生成完了');
    } catch (e) {
      console.error(e);
      setStatus('生成に失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveToDevice = async () => {
    if (!pdfBlob || !surveyCase) return;
    const filename = pdfFileName(surveyCase);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(pdfBlob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    await db.cases.update(caseId, { status: 'completed' });
    await addAuditLog(caseId, 'pdf_export', 'PDFを端末へ保存し、案件を完了扱いにしました');
    await refresh();
  };

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleShare = async () => {
    if (!pdfBlob || !surveyCase) return;
    const filename = pdfFileName(surveyCase);
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean; share?: (data: unknown) => Promise<void> };
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title: filename });
    } else {
      window.alert('この端末では共有機能が利用できないため、「端末へ保存」をご利用ください。');
    }
  };

  return (
    <div className="app-shell">
      <TopBar
        caseName={surveyCase?.name ?? ''}
        address={surveyCase?.address}
        stepLabel="PDFプレビュー"
        percent={progress.overall.percent}
        saveState="saved"
        filled={progress.overall.filled}
        total={progress.overall.total}
      />
      <SectionTabs caseId={caseId} current={sectionId} progress={progress} />
      <div className="page-body">
        <h2 className="section-title">PDFプレビュー</h2>
        <div className="card">
          <div className="field-note" style={{ marginBottom: 10 }}>
            状態: {status}
          </div>
          <div className="photo-actions">
            <button className="btn btn-ghost btn-sm" disabled={generating} onClick={generate}>
              再出力
            </button>
            <button className="btn btn-secondary btn-sm" disabled={!pdfBlob} onClick={handlePrint}>
              印刷
            </button>
            <button className="btn btn-secondary btn-sm" disabled={!pdfBlob} onClick={handleShare}>
              共有
            </button>
            <button className="btn btn-primary btn-sm" disabled={!pdfBlob} onClick={handleSaveToDevice}>
              端末へ保存
            </button>
          </div>
        </div>

        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            title="PDFプレビュー"
            style={{ width: '100%', height: '70vh', border: '1px solid var(--color-border)', borderRadius: 8 }}
          />
        ) : (
          <div className="card">PDFを生成しています。しばらくお待ちください。</div>
        )}
      </div>
      <BottomNav
        onBack={prev ? () => navigate(prev.path(caseId)) : undefined}
        onSave={() => navigate('/')}
        onNext={() => navigate('/')}
        nextLabel="保存して一覧へ戻る"
      />
    </div>
  );
}
