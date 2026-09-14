import { SECTIONS } from './sections';

export interface FlowStep {
  id: string;
  label: string;
  path: (caseId: string) => string;
}

export const FLOW_STEPS: FlowStep[] = [
  ...SECTIONS.map((s) => ({ id: s.id, label: s.title, path: (caseId: string) => `/case/${caseId}/${s.id}` })),
  { id: 'equipment-photos', label: '設備現況写真', path: (caseId: string) => `/case/${caseId}/equipment-photos` },
  { id: 'wall-survey', label: '擁壁調査', path: (caseId: string) => `/case/${caseId}/wall-survey` },
  { id: 'confirm', label: '入力内容確認', path: (caseId: string) => `/case/${caseId}/confirm` },
  { id: 'pdf-preview', label: 'PDFプレビュー', path: (caseId: string) => `/case/${caseId}/pdf-preview` }
];

export function stepIndexOf(sectionId: string): number {
  return FLOW_STEPS.findIndex((s) => s.id === sectionId);
}

export function nextStep(sectionId: string): FlowStep | undefined {
  const idx = stepIndexOf(sectionId);
  return idx >= 0 ? FLOW_STEPS[idx + 1] : undefined;
}

export function prevStep(sectionId: string): FlowStep | undefined {
  const idx = stepIndexOf(sectionId);
  return idx > 0 ? FLOW_STEPS[idx - 1] : undefined;
}
