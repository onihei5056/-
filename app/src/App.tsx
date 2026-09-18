import { Suspense, lazy } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthGate } from './components/AuthGate';
import { InstallPrompt } from './components/InstallPrompt';
import { UpdateToast } from './components/UpdateToast';

const CaseListPage = lazy(() => import('./pages/CaseListPage').then((m) => ({ default: m.CaseListPage })));
const CaseNewPage = lazy(() => import('./pages/CaseNewPage').then((m) => ({ default: m.CaseNewPage })));
const SectionPage = lazy(() => import('./pages/SectionPage').then((m) => ({ default: m.SectionPage })));
const EquipmentPhotosPage = lazy(() =>
  import('./pages/EquipmentPhotosPage').then((m) => ({ default: m.EquipmentPhotosPage }))
);
const WallSurveyPage = lazy(() => import('./pages/WallSurveyPage').then((m) => ({ default: m.WallSurveyPage })));
const ConfirmPage = lazy(() => import('./pages/ConfirmPage').then((m) => ({ default: m.ConfirmPage })));
// PDF出力はjsPDF/html2canvasを含み容量が大きいため、遷移時に初めて読み込む
const PdfPreviewPage = lazy(() => import('./pages/PdfPreviewPage').then((m) => ({ default: m.PdfPreviewPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

function LoadingFallback() {
  return (
    <div className="app-shell">
      <div className="page-body">読み込み中…</div>
    </div>
  );
}

export function App() {
  return (
    <AuthGate>
      <HashRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<CaseListPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/case/new" element={<CaseNewPage />} />
            <Route path="/case/:caseId/equipment-photos" element={<EquipmentPhotosPage />} />
            <Route path="/case/:caseId/wall-survey" element={<WallSurveyPage />} />
            <Route path="/case/:caseId/confirm" element={<ConfirmPage />} />
            <Route path="/case/:caseId/pdf-preview" element={<PdfPreviewPage />} />
            <Route path="/case/:caseId/:sectionId" element={<SectionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
      <InstallPrompt />
      <UpdateToast />
    </AuthGate>
  );
}
