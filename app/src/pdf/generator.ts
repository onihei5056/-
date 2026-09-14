import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { db } from '../db/db';
import {
  SECTIONS,
  PHOTO_CATEGORIES,
  PHOTO_SHEET_NOTES,
  PHOTO_DISCLAIMER_TEMPLATE,
  FOOTNOTES
} from '../schema/sections';
import { WALL_DISCLAIMER, WALL_PERMIT_LAWS } from '../schema/wall';
import { isFieldVisible } from '../utils/condition';
import { buildGlobals, computeCalc } from '../utils/calc';
import { blobToDataUrl } from '../utils/image';
import type { AnswerValue, FieldDef, PhotoRecord, SurveyCase, WallSurveyRecord } from '../types';
import {
  buildFieldsTableBlock,
  buildNoteBlock,
  buildPhotoPairBlock,
  buildSubTitleBlock,
  buildTitleBlock,
  CONTENT_WIDTH_PX,
  PDF_FONT,
  type PhotoCell,
  type Row
} from './blocks';

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

const CHECKED = '☑';
const UNCHECKED = '☐';

/**
 * 元Excelは「□選択肢」を並べた帳票のため、PDFでも全選択肢を☑/☐で出力する。
 * 条件分岐で非表示になった項目も行自体は残し、未選択(☐)・空欄(-)として出力することで
 * 元Excelの書式・行構成を崩さない。
 */
function fieldValueText(field: FieldDef, values: Record<string, AnswerValue>, globals: Record<string, AnswerValue>): string {
  const visible = isFieldVisible(field.condition, values);
  const v = visible ? values[field.id] : undefined;

  if (field.type === 'calc' && field.calc) {
    return visible ? String(computeCalc(field.calc, values, globals)) : '-';
  }

  if (field.options && (field.type === 'radio' || field.type === 'checkbox-multi' || field.type === 'select')) {
    const selected = Array.isArray(v) ? v : v === null || v === undefined || v === '' ? [] : [String(v)];
    return field.options
      .map((o) => `${selected.includes(o.value) ? CHECKED : UNCHECKED}${o.label}`)
      .join('　');
  }

  if (v === null || v === undefined || v === '') return '-';
  return String(v);
}

function sectionRows(
  fields: FieldDef[],
  values: Record<string, AnswerValue>,
  globals: Record<string, AnswerValue>
): Row[] {
  return fields.map((field) => ({
    label: field.label,
    value: fieldValueText(field, values, globals),
    unit:
      field.type === 'number' || field.type === 'calc'
        ? fieldValueText(field, values, globals) === '-'
          ? undefined
          : field.unit
        : undefined
  }));
}

function checkboxList(options: string[], selected: string[]): string {
  return options.map((o) => `${selected.includes(o) ? CHECKED : UNCHECKED}${o}`).join('　');
}

async function photoCell(title: string, p: PhotoRecord | undefined): Promise<PhotoCell> {
  if (!p) return { title };
  return {
    title: p.label ? `${title}（${p.label}）` : title,
    dataUrl: await blobToDataUrl(p.blob),
    takenAt: fmtDateTime(p.takenAt),
    photographer: p.photographer,
    comment: p.comment
  };
}

/** 写真リストを2枚ずつのブロック(=Excelの2列グリッド)に変換 */
async function photoPairBlocks(entries: { title: string; photo: PhotoRecord }[]): Promise<HTMLElement[]> {
  const blocks: HTMLElement[] = [];
  for (let i = 0; i < entries.length; i += 2) {
    const left = await photoCell(entries[i].title, entries[i].photo);
    const right = entries[i + 1] ? await photoCell(entries[i + 1].title, entries[i + 1].photo) : undefined;
    blocks.push(buildPhotoPairBlock(left, right));
  }
  return blocks;
}

/**
 * 案件データを収集し、印刷用ブロック(DOM要素)の配列を構築する。
 * 帳票構成は元Excelの3シート(不動産調査シート / 設備現況写真 / 擁壁調査シート)に対応。
 */
async function buildBlocks(caseId: string): Promise<{ blocks: HTMLElement[]; surveyCase: SurveyCase }> {
  const surveyCase = await db.cases.get(caseId);
  if (!surveyCase) throw new Error('案件が見つかりません');

  const allAnswers = await db.sectionAnswers.where('caseId').equals(caseId).toArray();
  const answersBySection = new Map(allAnswers.map((a) => [a.sectionId, a.values]));
  const globals = buildGlobals(allAnswers);
  const photos = await db.photos.where('caseId').equals(caseId).toArray();
  const walls = await db.wallSurveys.where('caseId').equals(caseId).sortBy('index');

  const blocks: HTMLElement[] = [];

  // ===== 帳票1: 不動産調査シート =====
  blocks.push(buildTitleBlock('不動産調査シート', '出典様式: 不動産調査シート_2026.3.1.xlsx'));
  blocks.push(
    buildFieldsTableBlock('案件情報', [
      { label: '案件名', value: surveyCase.name },
      { label: '物件所在地', value: surveyCase.address },
      { label: '調査日', value: surveyCase.surveyDate },
      { label: '調査担当者', value: surveyCase.surveyor },
      { label: 'PDF作成日時', value: fmtDateTime(Date.now()) }
    ])
  );

  for (const section of SECTIONS) {
    const values = answersBySection.get(section.id) ?? {};
    blocks.push(buildTitleBlock(section.title, `元Excel: ${section.sheetRef}`));
    for (const group of section.groups) {
      blocks.push(buildFieldsTableBlock(group.title, sectionRows(group.fields, values, globals)));
    }
  }

  // 脚注(元Excel 旧版シート A88)
  blocks.push(buildSubTitleBlock('脚注(※1〜※20)'));
  blocks.push(
    buildNoteBlock(
      Object.entries(FOOTNOTES)
        .map(([n, text]) => `※${n}.${text}`)
        .join('　'),
      { small: true, border: true }
    )
  );

  // ===== 帳票2: 設備現況写真 =====
  blocks.push(buildTitleBlock('設備現況写真', '元Excel: 設備現況写真シート'));
  blocks.push(buildNoteBlock(PHOTO_SHEET_NOTES.join('\n'), { border: true }));

  const equipmentEntries: { title: string; photo: PhotoRecord }[] = [];
  for (const cat of PHOTO_CATEGORIES) {
    const list = photos
      .filter((p) => p.category === cat.key && !p.refId && p.includeInPdf)
      .sort((a, b) => a.order - b.order);
    list.forEach((photo) => equipmentEntries.push({ title: `【${cat.label}】`, photo }));
  }
  if (equipmentEntries.length === 0) {
    blocks.push(buildNoteBlock('設備現況写真は登録されていません。', { border: true }));
  } else {
    blocks.push(...(await photoPairBlocks(equipmentEntries)));
  }

  const equipmentPhotos = equipmentEntries.map((e) => e.photo);
  const shootDates = equipmentPhotos.map((p) => p.takenAt).sort((a, b) => a - b);
  const photographers = Array.from(new Set(equipmentPhotos.map((p) => p.photographer))).filter(Boolean);
  blocks.push(
    buildFieldsTableBlock('撮影情報', [
      { label: '撮影日', value: shootDates.length ? new Date(shootDates[0]).toLocaleDateString('ja-JP') : '-' },
      { label: '撮影者', value: photographers.length ? photographers.join('、') : '-' }
    ])
  );
  blocks.push(
    buildNoteBlock(
      PHOTO_DISCLAIMER_TEMPLATE.replace(
        '{years}',
        surveyCase.buildingAgeYears ? String(surveyCase.buildingAgeYears) : '　　'
      ),
      { border: true }
    )
  );

  // ===== 帳票3: 擁壁調査シート =====
  for (const wall of walls) {
    blocks.push(
      buildTitleBlock(`擁壁調査シート ${wall.index}`, `元Excel: 擁壁調査シート / （${wall.direction || '　'}）側の擁壁について`)
    );
    blocks.push(
      buildFieldsTableBlock('擁壁の基本情報', [
        { label: '対象擁壁(方位)', value: wall.direction ? `（${wall.direction}）側` : '-' },
        {
          label: '擁壁の設置場所',
          value: `${checkboxList(['本物件内', '隣接地内'], wall.location ? [wall.location] : [])}${
            wall.locationDetail ? `（${wall.locationDetail}）` : ''
          }`
        },
        {
          label: '擁壁の所有者',
          value: `${checkboxList(['売主', '隣接地'], wall.owner ? [wall.owner] : [])}${
            wall.ownerDetail ? `（${wall.ownerDetail}）` : ''
          }`
        },
        {
          label: '本物件の敷地の位置',
          value: `${checkboxList(
            ['本物件の敷地が擁壁の上', '本物件の敷地が擁壁の下', 'その他'],
            wall.position === '上'
              ? ['本物件の敷地が擁壁の上']
              : wall.position === '下'
                ? ['本物件の敷地が擁壁の下']
                : wall.position === 'その他'
                  ? ['その他']
                  : []
          )}${wall.positionOther ? `（${wall.positionOther}）` : ''}`
        },
        {
          label: '擁壁の許認可',
          value: checkboxList(['必要', '不要', '不明'], wall.permitRequired ? [wall.permitRequired] : [])
        }
      ])
    );

    if (wall.permitRequired === '必要') {
      const permitRows: Row[] = [];
      wall.permits.forEach((p) => {
        const lawName = p.law === 'その他' && p.lawOther ? p.lawOther : p.law;
        permitRows.push({
          label: `${p.checked ? CHECKED : UNCHECKED}${lawName}`,
          value:
            `許可: ${checkboxList(['無', '有'], p.permit ? [p.permit] : [])}` +
            `　日付: ${p.permitDate || '-'}　番号: ${p.permitNumber || '-'}\n` +
            `検査済証: ${checkboxList(['無', '有'], p.inspection ? [p.inspection] : [])}` +
            `　日付: ${p.inspectionDate || '-'}　番号: ${p.inspectionNumber || '-'}`
        });
      });
      permitRows.push({
        label: 'その他の状況',
        value: checkboxList(
          ['許認可の取得は不明', '許認可を取得していない'],
          [
            ...(wall.permitUnknown ? ['許認可の取得は不明'] : []),
            ...(wall.permitNotObtained ? ['許認可を取得していない'] : [])
          ]
        )
      });
      blocks.push(buildFieldsTableBlock('擁壁の許認可(根拠法令別)', permitRows));
    }

    blocks.push(
      buildFieldsTableBlock('「がけ」について', [
        {
          label: '地方公共団体が定める「がけ」に',
          value: checkboxList(['該当しない', '該当する'], wall.cliffApplicable ? [wall.cliffApplicable] : [])
        },
        { label: '制限の概要', value: wall.cliffRestrictionSummary || '-' }
      ])
    );

    blocks.push(
      buildFieldsTableBlock('擁壁の不適格・不具合箇所', [
        {
          label: '【擁壁の工法】',
          value: `${checkboxList(
            ['空石積み擁壁', '増積み擁壁', '二段擁壁', '二重擁壁', '張出し床版付擁壁', 'その他'],
            wall.methods
          )}${wall.methodOther ? `（${wall.methodOther}）` : ''}`
        },
        {
          label: '【擁壁の材質】',
          value: `${checkboxList(['空洞コンクリートブロック擁壁', '大谷石', '玉石', 'その他'], wall.materials)}${
            wall.materialOther ? `（${wall.materialOther}）` : ''
          }`
        },
        {
          label: '【水抜き穴の状況】',
          value: checkboxList(
            ['水抜き穴が無い', '3㎡に1ヶ所以上無い', '口径が狭い(75mm未満)', '詰まり', '異常な色の流水'],
            wall.weepHoles
          )
        },
        {
          label: '【排水設備等の状況】',
          value: `${checkboxList(
            ['水のしみ出し', 'クラック・目地からの湧水', '排水施設不良(排水溝のずれ・欠損)', 'その他'],
            wall.drainage
          )}${wall.drainageOther ? `（${wall.drainageOther}）` : ''}`
        },
        {
          label: '【擁壁変状・経年変化】',
          value: `${checkboxList(
            [
              'クラック(ひび割れ)',
              '水平移動',
              '不同沈下(目地の開き)',
              'ふくらみ',
              '出隅部(コーナー部)の開き',
              '傾斜(傾き)・折損',
              'その他'
            ],
            wall.deformations
          )}${wall.deformationOther ? `（${wall.deformationOther}）` : ''}`
        },
        { label: '【その他】', value: wall.otherNote || '-' },
        { label: '備考', value: wall.remarks || '-' }
      ])
    );

    const wallEntries: { title: string; photo: PhotoRecord }[] = [];
    const push = (category: string, baseTitle: string) => {
      photos
        .filter((p) => p.category === category && p.refId === wall.id && p.includeInPdf)
        .sort((a, b) => a.order - b.order)
        .forEach((photo, i) => wallEntries.push({ title: `${baseTitle}${i + 1}`, photo }));
    };
    push('yoheki-site', '敷地図・撮影方向');
    push('yoheki-view', '全景');
    push('yoheki-defect', '不具合箇所');
    if (wallEntries.length > 0) {
      blocks.push(...(await photoPairBlocks(wallEntries)));
    }
    blocks.push(buildNoteBlock(WALL_DISCLAIMER, { small: true, border: true }));
  }

  return { blocks, surveyCase };
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
  header.innerHTML = `<span>${escapeHtml(caseInfo.name)} / ${escapeHtml(caseInfo.address)}</span><span>不動産調査シート</span>`;
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
 * 1ブロック(=写真1行や項目表1つ)は分割せず、必ず同一ページ内に収める。
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
  return `不動産調査シート_${safeName}_${stamp}.pdf`;
}

/** 帳票に載る根拠法令一覧(ドキュメント用に再エクスポート) */
export { WALL_PERMIT_LAWS };
