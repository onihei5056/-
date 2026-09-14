import type { AnswerValue, CalcSpec } from '../types';

function toNum(v: AnswerValue | undefined): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

/** 自動計算項目の値を算出する(建蔽率/容積率/延床面積合計など) */
export function computeCalc(calc: CalcSpec, values: Record<string, AnswerValue>): number {
  if (calc.kind === 'sum') {
    return calc.sourceFieldIds.reduce((acc, id) => acc + toNum(values[id]), 0);
  }
  // ratio: [numerator, denominator]
  const [numId, denId] = calc.sourceFieldIds;
  const num = toNum(values[numId]);
  const den = toNum(values[denId]);
  if (den === 0) return 0;
  const mult = calc.ratioMultiplier ?? 1;
  return Math.round(((num / den) * mult + Number.EPSILON) * 100) / 100;
}
