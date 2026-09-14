import type { AnswerValue, CalcSpec, SectionAnswers } from '../types';
import { SECTIONS } from '../schema/sections';

function toNum(v: AnswerValue | undefined): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

/**
 * calc の参照先を解決する。
 * 「sectionId.fieldId」形式なら他セクションの回答(globals)から取得する。
 */
function resolve(
  id: string,
  values: Record<string, AnswerValue>,
  globals?: Record<string, AnswerValue>
): number {
  if (id.includes('.')) return toNum(globals?.[id]);
  return toNum(values[id]);
}

/** 自動計算項目の値を算出する(延床面積合計・建ぺい率・容積率など) */
export function computeCalc(
  calc: CalcSpec,
  values: Record<string, AnswerValue>,
  globals?: Record<string, AnswerValue>
): number {
  if (calc.kind === 'sum') {
    const total = calc.sourceFieldIds.reduce((acc, id) => acc + resolve(id, values, globals), 0);
    return Math.round((total + Number.EPSILON) * 100) / 100;
  }
  // ratio: [numerator, denominator]
  const [numId, denId] = calc.sourceFieldIds;
  const num = resolve(numId, values, globals);
  const den = resolve(denId, values, globals);
  if (den === 0) return 0;
  const mult = calc.ratioMultiplier ?? 1;
  return Math.round(((num / den) * mult + Number.EPSILON) * 100) / 100;
}

/**
 * 全セクションの回答を「sectionId.fieldId」キーのフラットなMapにする。
 * 自動計算項目(calc)は保存されないため、ここで計算して展開しておく。
 * これにより他セクションの計算結果(例: 延床面積合計)を参照する計算
 * (例: 容積率 = 延床面積合計 ÷ 敷地面積)が成立する。
 * 手動修正された計算項目は保存値を優先する。
 */
export function buildGlobals(rows: Pick<SectionAnswers, 'sectionId' | 'values' | 'manualOverride'>[]): Record<string, AnswerValue> {
  const flat: Record<string, AnswerValue> = {};
  const bySection = new Map(rows.map((r) => [r.sectionId, r]));
  for (const row of rows) {
    for (const [fieldId, value] of Object.entries(row.values)) {
      flat[`${row.sectionId}.${fieldId}`] = value;
    }
  }
  // 計算項目が他の計算項目を参照する場合に備えて2巡する
  for (let pass = 0; pass < 2; pass++) {
    for (const section of SECTIONS) {
      const row = bySection.get(section.id);
      const values = row?.values ?? {};
      for (const group of section.groups) {
        for (const field of group.fields) {
          if (!field.calc) continue;
          const key = `${section.id}.${field.id}`;
          const manual = row?.manualOverride?.[field.id];
          if (manual && values[field.id] !== undefined && values[field.id] !== null) continue;
          flat[key] = computeCalc(field.calc, values, flat);
        }
      }
    }
  }
  return flat;
}
