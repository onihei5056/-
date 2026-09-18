import { SECTIONS } from '../schema/sections';
import { isFieldVisible } from './condition';
import type { AnswerValue, SectionAnswers } from '../types';

/**
 * 進捗の考え方。
 * 必須項目は「物件名」のみとし、調査シート内の項目はすべて任意入力にしたため、
 * 進捗は「必須の未入力数」ではなく「入力済み項目数 / 表示対象項目数」で表す。
 * 条件分岐で非表示の項目と自動計算項目は母数に含めない。
 */
export interface Progress {
  filled: number;
  total: number;
  percent: number;
}

function isFilled(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function toProgress(filled: number, total: number): Progress {
  return { filled, total, percent: total === 0 ? 0 : Math.round((filled / total) * 100) };
}

/** 中分類(グループ)単位の入力状況 */
export function computeGroupProgress(
  sectionId: string,
  groupId: string,
  values: Record<string, AnswerValue>
): Progress {
  const section = SECTIONS.find((s) => s.id === sectionId);
  const group = section?.groups.find((g) => g.id === groupId);
  if (!group) return toProgress(0, 0);
  let filled = 0;
  let total = 0;
  for (const field of group.fields) {
    if (field.type === 'calc') continue;
    if (!isFieldVisible(field.condition, values)) continue;
    total++;
    if (isFilled(values[field.id])) filled++;
  }
  return toProgress(filled, total);
}

/** 大分類(画面)単位の入力状況 */
export function computeSectionProgress(sectionId: string, values: Record<string, AnswerValue>): Progress {
  const section = SECTIONS.find((s) => s.id === sectionId);
  if (!section) return toProgress(0, 0);
  let filled = 0;
  let total = 0;
  for (const group of section.groups) {
    const p = computeGroupProgress(sectionId, group.id, values);
    filled += p.filled;
    total += p.total;
  }
  return toProgress(filled, total);
}

/** 案件全体の入力状況と、大分類ごとの内訳 */
export function computeAllProgress(
  rows: Pick<SectionAnswers, 'sectionId' | 'values'>[]
): { overall: Progress; bySection: Record<string, Progress> } {
  const bySection: Record<string, Progress> = {};
  const valuesOf = new Map(rows.map((r) => [r.sectionId, r.values]));
  let filled = 0;
  let total = 0;
  for (const section of SECTIONS) {
    const p = computeSectionProgress(section.id, valuesOf.get(section.id) ?? {});
    bySection[section.id] = p;
    filled += p.filled;
    total += p.total;
  }
  return { overall: toProgress(filled, total), bySection };
}
