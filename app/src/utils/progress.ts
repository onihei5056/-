import { FLOW_STEPS } from '../schema/flow';
import type { ValidationIssue } from '../types';

/** ステップごとに「修正必須エラー」が無ければ完了とみなす */
export function computeStepCompletion(issues: ValidationIssue[]): Record<string, boolean> {
  const errorSections = new Set(issues.filter((i) => i.level === 'error').map((i) => i.sectionId));
  const result: Record<string, boolean> = {};
  for (const step of FLOW_STEPS) {
    if (step.id === 'confirm' || step.id === 'pdf-preview') continue;
    result[step.id] = !errorSections.has(step.id);
  }
  return result;
}

export function computeOverallPercent(issues: ValidationIssue[]): number {
  const completion = computeStepCompletion(issues);
  const keys = Object.keys(completion);
  if (keys.length === 0) return 100;
  const done = keys.filter((k) => completion[k]).length;
  return Math.round((done / keys.length) * 100);
}
