import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { db } from '../db/db';
import { SECTIONS, PHOTO_CATEGORIES } from '../schema/sections';
import { isFieldVisible } from '../utils/condition';
import { computeCalc } from '../utils/calc';
import { blobToDataUrl } from '../utils/image';
import type { AnswerValue, FieldDef, PhotoRecord, SurveyCase, WallSurveyRecord } from '../types';
import { buildFieldsTableBlock, buildPhotoBlock, buildTitleBlock, CONTENT_WIDTH_PX, PDF_FONT, type Row } from './blocks';

const A4_W_MM = 210;
const A4_H_MM = 297;
const PAGE_W_PX = 794; // 96dpi換算のA4幅
const PAGE_H_PX = 1123; // 96dpi換算のA4高さ
const PAGE_PADDING_PX = 32;
const HEADER_H_PX = 46;
const FOOTER_H_PX = 30;
const CONTENT_HEIGHT_PX = PAGE_H_PX - PAGE_PADDING_PX * 2 - HEADER_H_PX - FOOTER_H_PX;

function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString('ja-JP');
}

function fieldValueText(field: FieldDef, values: Record<string, AnswerValue>): string {
  if (!isFieldVisible(field.condition, values)) return '-';
  const v = values[field.id];
  if (field.type === 'calc' && field.calc) {
    return String(computeCalc(field.calc, values));
  }
  if (v === null || v === undefined || v === '') return '-';
  if (Array.isArray(v)) {
    if (v.length === 0) return '-';
    const labels = v.map((val) => field.options?.find((o) => o.value === val)?.label ?? val);
    return labels.join('、');
  }
  if (field.type === 'radio' || field.type === 'select') {
    return field.options?.find((o) => o.value === v)?.label ?? String(v);
  }
  return String(v);
}

/**
 * 案件データを収集し、印刷用ブロック(DOM要素)の配列を構築する。
 * 写真ブロックは1枚=1ブロックとして扱い、ページ分割時に写真が途中で
 * 切れないようにする。
 */
async function buildBlocks(caseId: string): Promise<{ blocks: HTMLElement[]; surveyCase: SurveyCase }> {
  const surveyCase = await db.cases.get(caseId);
  if (!surveyCase) throw new Error('案件が見つかりません');

  const allAnswers = await db.sectionAnswers.where('caseId').equals(caseId).toArray();
  const answersBySection = new Map(allAnswers.map((a) => [a.sectionId, a.values]));
  const photos = await db.photos.where('caseId').equals(caseId).toArray();
  const walls = await db.wallSurveys.where('caseId').equals(caseId).sortBy('index');

  const blocks: HTMLElement[] = [];

  // 表紙
  blocks.push(buildTitleBlock('不動産現地調査報告書'));
  blocks.push(
    buildFieldsTableBlock('案件情報', [
      { label: '案件名', value: surveyCase.name },
      { label: '物件所在地', value: surveyCase.address },
      { label: '調査日', value: surveyCase.surveyDate },
      { label: '調査担当者', value: surveyCase.surveyor },
      { label: 'PDF作成日時', value: fmtDateTime(Date.now()) }
    ])
  );

  // 各セクション
  for (const section of SECTIONS) {
    const values = answersBySection.get(section.id) ?? {};
    blocks.push(buildTitleBlock(section.title, `対応シート(仮): ${section.sheetRef}`));
    for (const group of section.groups) {
      const rows: Row[] = group.fields.map((field) => ({
        label: field.label,
        value: fieldValueText(field, values),
        unit: field.type === 'calc' || field.type === 'number' ? field.unit : undefined
      }));
      blocks.push(buildFieldsTableBlock(group.title, rows));
    }
  }

  // 設備現況写真
  blocks.push(buildTitleBlock('設備現況写真'));
  for (const cat of PHOTO_CATEGORIES) {
    const list = photos
      .filter((p) => p.category === cat.key && !p.refId && p.includeInPdf)
      .sort((a, b) => a.order - b.order);
    if (list.length === 0) continue;
    blocks.push(buildTitleBlock(`　${cat.label}`));
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const dataUrl = await blobToDataUrl(p.blob);
      blocks.push(
        buildPhotoBlock(cat.label, i + 1, list.length, dataUrl, {
          takenAt: fmtDateTime(p.takenAt),
          photographer: p.photographer,
          comment: p.comment
        })
      );
    }
  }

  // 擁壁調査
  if (walls.length > 0) {
    blocks.push(buildTitleBlock('擁壁調査'));
    for (const wall of walls) {
      blocks.push(buildFieldsTableBlock(`擁壁調査 ${wall.index}`, wallRows(wall)));
      const wallPhotos = photos
        .filter((p) => p.category === 'yoheki' && p.refId === wall.id && p.includeInPdf)
        .sort((a, b) => a.order - b.order);
      for (let i = 0; i < wallPhotos.length; i++) {
        const p = wallPhotos[i];
        const dataUrl = await blobToDataUrl(p.blob);
        blocks.push(
          buildPhotoBlock(`擁壁調査${wall.index}`, i + 1, wallPhotos.length, dataUrl, {
            takenAt: fmtDateTime(p.takenAt),
            photographer: p.photographer,
            comment: p.comment
          })
        );
      }
    }
  }

  return { blocks, surveyCase };
}

function wallRows(wall: WallSurveyRecord): Row[] {
  const defectText =
    wall.defects.length === 0
      ? '-'
      : wall.defects.map((d, i) => `(${i + 1}) ${d.types.join('・') || '種類未選択'}: ${d.location || '-'} ${d.note ? '/' + d.note : ''}`).join('\n');
  return [
    { label: '対象擁壁の方位・場所', value: wall.orientation || '-' },
    { label: '撮影方向', value: wall.shootingDirection || '-' },
    { label: '擁壁の設置場所', value: wall.location || '-' },
    { label: '擁壁の所有者', value: wall.owner || '-' },
    { label: '本物件の位置', value: wall.positionRelation || '-' },
    { label: '許認可の種類', value: wall.permitType || '-' },
    { label: '許可の有無', value: wall.hasPermit || '-' },
    { label: '許可日', value: wall.permitDate || '-' },
    { label: '許可番号', value: wall.permitNumber || '-' },
    { label: '検査済証の有無', value: wall.hasInspectionCert || '-' },
    { label: '検査日', value: wall.inspectionDate || '-' },
    { label: '検査番号', value: wall.inspectionNumber || '-' },
    { label: 'がけ条例', value: wall.cliffOrdinance || '-' },
    { label: '工法', value: wall.method || '-' },
    { label: '材質', value: wall.material || '-' },
    { label: '水抜き穴の状況', value: wall.weepHoleStatus || '-' },
    { label: '排水設備の状況', value: wall.drainageStatus || '-' },
    { label: '不具合箇所', value: defectText },
    { label: '備考', value: wall.remarks || '-' }
  ];
}

function buildPageShell(): { page: HTMLDivElement; content: HTMLDivElement } {
  const page = document.createElement('div');
  Object.assign(page.style, {
    width: `${PAGE_W_PX}px`,
    height: `${PAGE_H_PX}px`,
    background: '#ffffff',
    boxSizing: 'border-box',
    padding: `${PAGE_PADDING_PX}px`,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: PDF_FONT
  });
  const content = document.createElement('div');
  Object.assign(content.style, {
    height: `${CONTENT_HEIGHT_PX}px`,
    overflow: 'hidden'
  });
  page.appendChild(content);
  return { page, content };
}

function addHeaderFooter(page: HTMLDivElement, caseInfo: SurveyCase, pageNum: number, totalPages: number) {
  const header = document.createElement('div');
  Object.assign(header.style, {
    height: `${HEADER_H_PX}px`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #0b2c5c',
    marginBottom: '10px',
    fontSize: '12px',
    color: '#0b2c5c',
    fontWeight: '700',
    fontFamily: PDF_FONT
  });
  header.innerHTML = `<span>${escapeHtml(caseInfo.name)} / ${escapeHtml(caseInfo.address)}</span><span>不動産現地調査報告書</span>`;
  page.insertBefore(header, page.firstChild);

  const footer = document.createElement('div');
  Object.assign(footer.style, {
    height: `${FOOTER_H_PX}px`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #999',
    marginTop: '10px',
    fontSize: '11px',
    color: '#555',
    fontFamily: PDF_FONT
  });
  footer.innerHTML = `<span>作成日時: ${escapeHtml(fmtDateTime(Date.now()))}</span><span>${pageNum} / ${totalPages} ページ</span>`;
  page.appendChild(footer);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/**
 * ブロック配列をA4ページに収まるように詰め込む(ビンパッキング)。
 * 1ブロック(=1写真や1グループ表)は分割せず、必ず同一ページ内に収める。
 */
function paginate(blocks: HTMLElement[], measured: number[]): HTMLElement[][] {
  const pages: HTMLElement[][] = [];
  let current: HTMLElement[] = [];
  let currentHeight = 0;
  blocks.forEach((block, i) => {
    const h = measured[i];
    if (currentHeight + h > CONTENT_HEIGHT_PX && current.length > 0) {
      pages.push(current);
      current = [];
      currentHeight = 0;
    }
    current.push(block);
    currentHeight += h;
  });
  if (current.length > 0) pages.push(current);
  return pages;
}

export async function generatePdfBlob(caseId: string, onProgress?: (msg: string) => void): Promise<Blob> {
  onProgress?.('データを収集しています…');
  const { blocks, surveyCase } = await buildBlocks(caseId);

  // 1. 計測用コンテナに全ブロックを配置して実高さを取得
  const measureRoot = document.createElement('div');
  Object.assign(measureRoot.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    width: `${CONTENT_WIDTH_PX}px`
  });
  document.body.appendChild(measureRoot);
  blocks.forEach((b) => measureRoot.appendChild(b));
  const measured = blocks.map((b) => b.getBoundingClientRect().height + 4);
  document.body.removeChild(measureRoot);

  onProgress?.('ページを構成しています…');
  const pageGroups = paginate(blocks, measured);
  const totalPages = pageGroups.length;

  const renderRoot = document.createElement('div');
  Object.assign(renderRoot.style, { position: 'fixed', left: '-99999px', top: '0' });
  document.body.appendChild(renderRoot);

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  try {
    for (let i = 0; i < pageGroups.length; i++) {
      onProgress?.(`PDFを生成しています… (${i + 1}/${totalPages})`);
      const { page, content } = buildPageShell();
      pageGroups[i].forEach((b) => content.appendChild(b));
      addHeaderFooter(page, surveyCase, i + 1, totalPages);
      renderRoot.appendChild(page);

      const canvas = await html2canvas(page, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, A4_W_MM, A4_H_MM);

      renderRoot.removeChild(page);
    }
  } finally {
    document.body.removeChild(renderRoot);
  }

  onProgress?.('完了');
  return pdf.output('blob');
}

export function pdfFileName(surveyCase: SurveyCase): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const safeName = surveyCase.name.replace(/[\\/:*?"<>|]/g, '_');
  return `不動産調査_${safeName}_${stamp}.pdf`;
}
