import { db, getCurrentUser, addAuditLog } from '../db/db';
import { uid } from './id';
import { blobToDataUrl } from './image';
import type { AuditLogEntry, PhotoRecord, SectionAnswers, SurveyCase, WallSurveyRecord } from '../types';

/**
 * 案件データの書き出し・取り込み。
 *
 * このアプリは端末内(IndexedDB)にしかデータを保存しないため、
 * 次の場面ではデータが引き継がれない:
 *   - 機種変更
 *   - 配置先の変更によるURLの変更(GitHub Pages → 自社サーバー など)
 *   - ブラウザのサイトデータ削除
 * その対策として、写真を含む全データを1つのJSONファイルに書き出し、
 * 別の端末・別のURLのアプリで取り込めるようにする。
 *
 * 写真はBlobのままJSONに入らないため、data URL(base64)に変換して格納する。
 * このためファイルサイズは写真の実サイズより約3割大きくなる。
 */

export const BACKUP_FORMAT_VERSION = 1;

interface PhotoExport extends Omit<PhotoRecord, 'blob' | 'originalBlob'> {
  blobDataUrl: string;
  originalBlobDataUrl?: string;
}

export interface BackupFile {
  formatVersion: number;
  exportedAt: number;
  exportedBy: string;
  appName: string;
  cases: SurveyCase[];
  sectionAnswers: (SectionAnswers & { key: string })[];
  wallSurveys: WallSurveyRecord[];
  photos: PhotoExport[];
  auditLogs: AuditLogEntry[];
}

export interface ExportResult {
  blob: Blob;
  fileName: string;
  caseCount: number;
  photoCount: number;
  sizeMB: number;
}

/** 指定した案件(未指定なら全案件)を1つのJSONファイルに書き出す */
export async function exportCases(caseIds?: string[]): Promise<ExportResult> {
  const allCases = await db.cases.toArray();
  const cases = caseIds ? allCases.filter((c) => caseIds.includes(c.id)) : allCases;
  const ids = new Set(cases.map((c) => c.id));

  const [answers, walls, photos, logs] = await Promise.all([
    db.sectionAnswers.toArray(),
    db.wallSurveys.toArray(),
    db.photos.toArray(),
    db.auditLogs.toArray()
  ]);

  const targetPhotos = photos.filter((p) => ids.has(p.caseId));
  const photoExports: PhotoExport[] = [];
  for (const p of targetPhotos) {
    const { blob, originalBlob, ...rest } = p;
    photoExports.push({
      ...rest,
      blobDataUrl: await blobToDataUrl(blob),
      originalBlobDataUrl: originalBlob ? await blobToDataUrl(originalBlob) : undefined
    });
  }

  const backup: BackupFile = {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: Date.now(),
    exportedBy: getCurrentUser(),
    appName: '不動産現地調査PWA',
    cases,
    sectionAnswers: answers.filter((a) => ids.has(a.caseId)),
    wallSurveys: walls.filter((w) => ids.has(w.caseId)),
    photos: photoExports,
    auditLogs: logs.filter((l) => ids.has(l.caseId))
  };

  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const d = new Date();
  const stamp =
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}` +
    `_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  const namePart = cases.length === 1 ? cases[0].name.replace(/[\\/:*?"<>|]/g, '_') : `全${cases.length}件`;

  return {
    blob,
    fileName: `現地調査データ_${namePart}_${stamp}.json`,
    caseCount: cases.length,
    photoCount: photoExports.length,
    sizeMB: Math.round((blob.size / 1024 / 1024) * 10) / 10
  };
}

export interface ImportResult {
  added: number;
  renamedDueToConflict: number;
  photoCount: number;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * 書き出したJSONファイルを取り込む。
 * 既存データは決して上書きしない。IDが重複する案件は新しいIDを振って
 * 「(取込)」を付けた別案件として追加する。
 */
export async function importFromFile(file: File): Promise<ImportResult> {
  const text = await file.text();
  let backup: BackupFile;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error('ファイルを読み取れませんでした。書き出したJSONファイルを選んでください。');
  }
  if (!backup || !Array.isArray(backup.cases)) {
    throw new Error('このアプリで書き出したファイルではないようです。');
  }
  if (backup.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new Error('より新しいバージョンで書き出されたファイルです。アプリを更新してからお試しください。');
  }

  const existingIds = new Set((await db.cases.toArray()).map((c) => c.id));
  const idMap = new Map<string, string>();
  let renamed = 0;

  for (const c of backup.cases) {
    if (existingIds.has(c.id)) {
      idMap.set(c.id, uid());
      renamed++;
    } else {
      idMap.set(c.id, c.id);
    }
  }

  const mapId = (oldId: string) => idMap.get(oldId) ?? oldId;

  await db.transaction('rw', db.cases, db.sectionAnswers, db.wallSurveys, db.photos, db.auditLogs, async () => {
    for (const c of backup.cases) {
      const newId = mapId(c.id);
      await db.cases.put({
        ...c,
        id: newId,
        name: newId === c.id ? c.name : `${c.name}(取込)`
      });
    }
    for (const a of backup.sectionAnswers ?? []) {
      const newCaseId = mapId(a.caseId);
      await db.sectionAnswers.put({ ...a, caseId: newCaseId, key: `${newCaseId}::${a.sectionId}` });
    }
    for (const w of backup.wallSurveys ?? []) {
      const newCaseId = mapId(w.caseId);
      await db.wallSurveys.put({ ...w, id: newCaseId === w.caseId ? w.id : uid(), caseId: newCaseId });
    }
  });

  // 写真はBlob復元を伴うためトランザクション外で処理する
  let photoCount = 0;
  for (const p of backup.photos ?? []) {
    const { blobDataUrl, originalBlobDataUrl, ...rest } = p;
    const newCaseId = mapId(p.caseId);
    await db.photos.put({
      ...rest,
      id: newCaseId === p.caseId ? p.id : uid(),
      caseId: newCaseId,
      blob: await dataUrlToBlob(blobDataUrl),
      originalBlob: originalBlobDataUrl ? await dataUrlToBlob(originalBlobDataUrl) : undefined
    });
    photoCount++;
  }

  for (const c of backup.cases) {
    await addAuditLog(mapId(c.id), 'import', `書き出しファイルから取り込み(書き出し日時: ${new Date(backup.exportedAt).toLocaleString('ja-JP')})`);
  }

  return { added: backup.cases.length, renamedDueToConflict: renamed, photoCount };
}

/**
 * 書き出したファイルを端末に渡す。
 * iPhoneでは共有シートから「ファイルに保存」を選べるため共有を優先し、
 * 使えない環境ではダウンロードにフォールバックする。
 */
export async function deliverFile(blob: Blob, fileName: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: blob.type });
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: unknown) => Promise<void>;
  };
  if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: fileName });
      return 'shared';
    } catch {
      // 共有をキャンセルした場合などはダウンロードへ
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}
