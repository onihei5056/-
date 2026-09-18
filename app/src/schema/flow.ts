import { SECTIONS } from './sections';
import { UI_SECTIONS, SCREEN_ORDER } from './uiSections';

export interface FlowStep {
  id: string;
  label: string;
  path: (caseId: string) => string;
}

/**
 * 項目定義を持たない特殊画面(写真・擁壁は帳票構造が特殊なため専用画面)。
 * ここに足して uiSections.ts の children に画面IDを書けば、目次にも前後移動にも載る。
 */
const SPECIAL_SCREENS: Record<string, { label: string; path: (caseId: string) => string }> = {
  'equipment-photos': {
    label: '設備現況写真',
    path: (caseId: string) => `/case/${caseId}/equipment-photos`
  },
  'wall-survey': {
    label: '擁壁調査',
    path: (caseId: string) => `/case/${caseId}/wall-survey`
  }
};

/** 画面IDから目次1件分の情報を作る(順序は uiSections.ts が決める) */
export function screenStep(screenId: string): FlowStep | undefined {
  const uiSection = UI_SECTIONS.find((s) => s.id === screenId);
  if (uiSection) {
    return { id: uiSection.id, label: uiSection.title, path: (caseId) => `/case/${caseId}/ui/${uiSection.id}` };
  }
  const section = SECTIONS.find((s) => s.id === screenId);
  if (section) {
    return { id: section.id, label: section.title, path: (caseId) => `/case/${caseId}/${section.id}` };
  }
  const special = SPECIAL_SCREENS[screenId];
  return special ? { id: screenId, label: special.label, path: special.path } : undefined;
}

/** 「戻る/次へ」でたどる順序。UI構成について.xlsxの大項目①〜④の順に並ぶ */
export const FLOW_STEPS: FlowStep[] = [
  ...SCREEN_ORDER.map(screenStep).filter((s): s is FlowStep => !!s),
  { id: 'confirm', label: '入力内容確認', path: (caseId: string) => `/case/${caseId}/confirm` },
  { id: 'pdf-preview', label: 'PDFプレビュー', path: (caseId: string) => `/case/${caseId}/pdf-preview` }
];

/** 最初の入力画面(案件を開いたときの遷移先) */
export const firstStepPath = (caseId: string) => FLOW_STEPS[0].path(caseId);

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
