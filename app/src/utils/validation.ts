import { db } from '../db/db';
import { SECTIONS } from '../schema/sections';
import { isFieldVisible } from './condition';
import type { AnswerValue, ValidationIssue, WallSurveyRecord } from '../types';

const NUMBER_HARD_MAX = 1_000_000_000; // 異常値判定の上限(仮)

function isEmpty(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/**
 * 案件全体の入力チェックを行う。
 * エラー(修正必須)と警告(確認後続行可)に分けて返す。
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
            level: 'error',
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
              level: 'error',
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

  // 日付の逆転チェック(空家開始日 > 調査日)
  const sellerValues = answersBySection.get('seller-rights') ?? {};
  const basicValues = answersBySection.get('property-basic') ?? {};
  const surveyDate = basicValues.surveyDate as string | undefined;
  const vacantSince = sellerValues.vacantSince as string | undefined;
  if (surveyDate && vacantSince && new Date(vacantSince) > new Date(surveyDate)) {
    issues.push({
      sectionId: 'seller-rights',
      fieldId: 'vacantSince',
      level: 'error',
      category: 'date',
      message: '空家期間(開始)が調査日より後になっています'
    });
  }

  // 写真必須チェック(利用状況に応じて必要な設備区分の写真登録有無)
  const util = answersBySection.get('utilities') ?? {};
  const photos = await db.photos.where('caseId').equals(caseId).toArray();
  const countByCategory = (cat: string) => photos.filter((p) => p.category === cat).length;

  const requiredCategories: { key: string; label: string; when: boolean }[] = [
    { key: 'suido', label: '上水道', when: true },
    { key: 'meter', label: 'メーターボックス', when: true },
    { key: 'denki', label: '電気', when: true },
    { key: 'gas', label: 'ガス', when: util.gasType !== 'none' },
    { key: 'osui', label: '汚水', when: util.drainageType === 'gesuido' },
    { key: 'gesui', label: '下水', when: util.drainageType === 'gesuido' },
    { key: 'jokaso', label: '浄化槽', when: util.drainageType === 'jokaso' }
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

  // 擁壁調査: 擁壁=有 の場合、1件以上の擁壁調査が必要。不具合ありの場合は写真必須。
  const surroundingValues = answersBySection.get('surroundings') ?? {};
  if (surroundingValues.hasWall === 'yes') {
    const walls: WallSurveyRecord[] = await db.wallSurveys.where('caseId').equals(caseId).toArray();
    if (walls.length === 0) {
      issues.push({
        sectionId: 'wall-survey',
        level: 'error',
        category: 'required',
        message: '擁壁「有」ですが擁壁調査が1件も登録されていません'
      });
    }
    for (const wall of walls) {
      if (!wall.location) {
        issues.push({
          sectionId: 'wall-survey',
          wallId: wall.id,
          level: 'error',
          category: 'required',
          message: `擁壁調査(${wall.index}) の設置場所が未入力です`
        });
      }
      const wallPhotoCount = photos.filter((p) => p.category === 'yoheki' && p.refId === wall.id).length;
      if (wall.defects.length > 0 && wallPhotoCount === 0) {
        issues.push({
          sectionId: 'wall-survey',
          wallId: wall.id,
          level: 'error',
          category: 'photo',
          message: `擁壁調査(${wall.index}) は不具合箇所が登録されていますが写真が未登録です`
        });
      }
      if (wall.permitDate && wall.inspectionDate && new Date(wall.inspectionDate) < new Date(wall.permitDate)) {
        issues.push({
          sectionId: 'wall-survey',
          wallId: wall.id,
          level: 'warning',
          category: 'date',
          message: `擁壁調査(${wall.index}) の検査日が許可日より前になっています`
        });
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
