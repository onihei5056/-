import type { AnswerValue, FieldCondition } from '../types';

function matches(value: AnswerValue | undefined, target: string | string[]): boolean {
  const arr = Array.isArray(target) ? target : [target];
  if (Array.isArray(value)) return value.some((v) => arr.includes(v));
  return value !== null && value !== undefined && arr.includes(String(value));
}

/** 条件分岐の評価: フィールドが表示対象かどうか */
export function isFieldVisible(
  condition: FieldCondition | undefined,
  values: Record<string, AnswerValue>
): boolean {
  if (!condition) return true;
  const current = values[condition.fieldId];
  if (condition.equals !== undefined) return matches(current, condition.equals);
  if (condition.notEquals !== undefined) return !matches(current, condition.notEquals);
  return true;
}
