import { db } from '../db/db';
import { SECTIONS } from '../schema/sections';
import { isFieldVisible } from '../utils/condition';
import type { AnswerValue, ValidationIssue, WallSurveyRecord } from '../types';

const NUMBER_HARD_MAX = 1_000_000_000; // 異常値判定の上限

function isEmpty(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function datePair(
  issues: ValidationIssue[],
  sectionId: string,
  fieldId: string,
  from: unknown,
  to: unknown,
  message: string,
  level: 'error' | 'warning' = 'warning'
) {
  if (typeof from === 'string' && typeof to === 'string' && from && to && new Date(from) > new Date(to)) {
    issues.push({ sectionId, fieldId, level, category: 'date', message });
  }
}

/**
 * 案件全体の入力チェック。
 * 必須項目は「物件名」のみ(案件作成時に入力済み)としたため、
 * ここで返すのはすべて「確認をおすすめする事項」であり、入力やPDF出力を妨げない。
 */
export async function validateCase(caseId: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const allAnswers = await db.sectionAnswers.where('caseId').equals(caseId).toArray();
  const answersBySection = new Map(allAnswers.map((a) => [a.sectionId, a.values]));

  for (const section of SECTIONS) {
    const values = answersBySection.get(section.id) ?? {};
    for (const group of section.groups) {
      for (const field of group.fields) {
        if (field.type === 'calc') continue;
        if (!isFieldVisible(field.condition, values)) continue;
        const v = values[field.id];

        if (field.required && isEmpty(v)) {
          issues.push({
            sectionId: section.id,
            fieldId: field.id,
            level: 'warning',
            category: 'required',
            message: `「${field.label}」が未入力です`
          });
          continue;
        }

        if (field.type === 'number' && !isEmpty(v)) {
          const n = typeof v === 'number' ? v : parseFloat(String(v));
          if (Number.isNaN(n)) {
            issues.push({
              sectionId: section.id,
              fieldId: field.id,
              level: 'warning',
              category: 'format',
              message: `「${field.label}」は数値で入力してください`
            });
          } else {
            if (field.min !== undefined && n < field.min) {
              issues.push({
                sectionId: section.id,
                fieldId: field.id,
                level: 'warning',
                category: 'range',
                message: `「${field.label}」の値が小さすぎる可能性があります(${n}${field.unit ?? ''})`
              });
            }
            if ((field.max !== undefined && n > field.max) || n > NUMBER_HARD_MAX) {
              issues.push({
                sectionId: section.id,
                fieldId: field.id,
                level: 'warning',
                category: 'range',
                message: `「${field.label}」の値が大きすぎる可能性があります(${n}${field.unit ?? ''})`
              });
            }
          }
        }
      }
    }
  }

  // ---- 日付の整合性 ----
  const seller = answersBySection.get('seller-info') ?? {};
  const rights = answersBySection.get('property-rights') ?? {};
  const util = answersBySection.get('utilities') ?? {};

  datePair(issues, 'seller-info', 'vacantSince', seller.vacantSince, seller.surveyDate, '空家になった時期が調査日より後になっています');
  datePair(issues, 'property-rights', 'occupancyTo', rights.occupancyFrom, rights.occupancyTo, '第三者占有の契約期間が開始日と終了日で逆転しています');
  datePair(issues, 'utilities', 'solarContractTo', util.solarContractFrom, util.solarContractTo, '太陽光の契約期間が開始日と終了日で逆転しています');

  if (typeof rights.buildDate === 'string' && rights.buildDate && typeof seller.surveyDate === 'string' && seller.surveyDate) {
    if (new Date(rights.buildDate) > new Date(seller.surveyDate)) {
      issues.push({
        sectionId: 'property-rights',
        fieldId: 'buildDate',
        level: 'warning',
        category: 'date',
        message: '建築年月日が調査日より後になっています'
      });
    }
  }

  // ---- 建蔽・容積の超過判定(自動計算値との突き合わせ) ----
  const office = answersBySection.get('city-office') ?? {};
  const landArea = Number(seller.landArea ?? 0);
  const buildingArea = Number(office.buildingArea ?? 0);
  const areaTotal =
    Number(seller.areaB1 ?? 0) + Number(seller.area1F ?? 0) + Number(seller.area2F ?? 0) + Number(seller.area3F ?? 0);
  if (landArea > 0 && buildingArea > 0 && office.designatedCoverage) {
    const actual = (buildingArea / landArea) * 100;
    if (actual > Number(office.designatedCoverage) && office.coverageExceeded !== '有') {
      issues.push({
        sectionId: 'city-office',
        fieldId: 'coverageExceeded',
        level: 'warning',
        category: 'other',
        message: `建ぺい率の計算値(${actual.toFixed(1)}%)が指定建蔽率(${office.designatedCoverage}%)を超えています。建ぺい超過の選択をご確認ください`
      });
    }
  }
  if (landArea > 0 && areaTotal > 0 && office.designatedFar) {
    const actual = (areaTotal / landArea) * 100;
    if (actual > Number(office.designatedFar) && office.farExceeded !== '有') {
      issues.push({
        sectionId: 'city-office',
        fieldId: 'farExceeded',
        level: 'warning',
        category: 'other',
        message: `容積率の計算値(${actual.toFixed(1)}%)が指定容積率(${office.designatedFar}%)を超えています。容積率超過の選択をご確認ください`
      });
    }
  }

  // ---- 設備現況写真(Excel帳票の6枠＋排水方式に応じた区分) ----
  const photos = await db.photos.where('caseId').equals(caseId).toArray();
  const countByCategory = (cat: string, refId?: string) =>
    photos.filter((p) => p.category === cat && (refId ? p.refId === refId : !p.refId)).length;

  const requiredCategories: { key: string; label: string; when: boolean }[] = [
    { key: 'suido', label: '上水道', when: true },
    { key: 'meter', label: 'メーター', when: true },
    { key: 'osui', label: '汚水', when: true },
    { key: 'usui', label: '雨水', when: true },
    { key: 'gas', label: 'ガス', when: true },
    { key: 'denki', label: '電気', when: true },
    { key: 'gesui', label: '下水(最終枡・マンホール)', when: util.drainageType === '下水道' },
    { key: 'jokaso', label: '浄化槽', when: util.drainageType === '浄化槽' || util.drainageType === '汲取式' }
  ];
  for (const rc of requiredCategories) {
    if (rc.when && countByCategory(rc.key) === 0) {
      issues.push({
        sectionId: 'equipment-photos',
        level: 'warning',
        category: 'photo',
        message: `設備現況写真「${rc.label}」が未登録です`
      });
    }
  }

  // ---- 擁壁調査 ----
  const surroundings = answersBySection.get('surroundings') ?? {};
  if (surroundings.hasWall === '有') {
    const walls: WallSurveyRecord[] = await db.wallSurveys.where('caseId').equals(caseId).toArray();
    if (walls.length === 0) {
      issues.push({
        sectionId: 'wall-survey',
        level: 'warning',
        category: 'required',
        message: '擁壁「有」ですが擁壁調査シートが1件も登録されていません'
      });
    }
    for (const wall of walls) {
      if (!wall.location) {
        issues.push({
          sectionId: 'wall-survey',
          wallId: wall.id,
          level: 'warning',
          category: 'required',
          message: `擁壁調査(${wall.index}) の設置場所が未入力です`
        });
      }
      if (!wall.permitRequired) {
        issues.push({
          sectionId: 'wall-survey',
          wallId: wall.id,
          level: 'warning',
          category: 'required',
          message: `擁壁調査(${wall.index}) の許認可(必要/不要/不明)が未選択です`
        });
      }
      if (countByCategory('yoheki-view', wall.id) === 0) {
        issues.push({
          sectionId: 'wall-survey',
          wallId: wall.id,
          level: 'warning',
          category: 'photo',
          message: `擁壁調査(${wall.index}) の全景写真が未登録です`
        });
      }
      const hasDefect =
        wall.weepHoles.length > 0 || wall.drainage.length > 0 || wall.deformations.length > 0;
      if (hasDefect && countByCategory('yoheki-defect', wall.id) === 0) {
        issues.push({
          sectionId: 'wall-survey',
          wallId: wall.id,
          level: 'warning',
          category: 'photo',
          message: `擁壁調査(${wall.index}) は不具合箇所が選択されていますが不具合箇所の写真が未登録です`
        });
      }
      for (const p of wall.permits) {
        if (!p.checked) continue;
        if (p.permitDate && p.inspectionDate && new Date(p.inspectionDate) < new Date(p.permitDate)) {
          issues.push({
            sectionId: 'wall-survey',
            wallId: wall.id,
            level: 'warning',
            category: 'date',
            message: `擁壁調査(${wall.index}) ${p.law} の検査済証日付が許可日付より前になっています`
          });
        }
      }
    }
  }

  return issues;
}

export function countErrors(issues: ValidationIssue[]): number {
  return issues.filter((i) => i.level === 'error').length;
}
export function countWarnings(issues: ValidationIssue[]): number {
  return issues.filter((i) => i.level === 'warning').length;
}
/** 画面上部に表示する「未入力必須項目数」 */
export function countMissingRequired(issues: ValidationIssue[]): number {
  return issues.filter((i) => i.category === 'required').length;
}
