import Dexie, { Table } from 'dexie';
import type {
  SurveyCase,
  SectionAnswers,
  PhotoRecord,
  WallSurveyRecord,
  AuditLogEntry
} from '../types';

/**
 * IndexedDB (Dexie) 定義。
 * オフライン優先: すべての入力・写真は端末内にまず保存し、
 * 将来サーバー同期を追加する場合もこのテーブル構成をそのまま送信キューの元データにできる。
 */
export class SurveyDB extends Dexie {
  cases!: Table<SurveyCase, string>;
  sectionAnswers!: Table<SectionAnswers & { key: string }, string>;
  photos!: Table<PhotoRecord, string>;
  wallSurveys!: Table<WallSurveyRecord, string>;
  auditLogs!: Table<AuditLogEntry, string>;

  constructor() {
    super('real-estate-survey-db');
    this.version(1).stores({
      cases: 'id, name, address, surveyDate, surveyor, status, updatedAt',
      sectionAnswers: 'key, caseId, sectionId, updatedAt',
      photos: 'id, caseId, category, refId, order, updatedAt',
      wallSurveys: 'id, caseId, index, updatedAt',
      auditLogs: 'id, caseId, at'
    });
  }
}

export const db = new SurveyDB();

export function sectionAnswerKey(caseId: string, sectionId: string): string {
  return `${caseId}::${sectionId}`;
}

/** 端末を識別するID(複数端末編集時の更新者/競合検知に利用) */
export function getDeviceId(): string {
  const KEY = 'survey-device-id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'device-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getCurrentUser(): string {
  return localStorage.getItem('survey-current-user') || '未設定担当者';
}

export function setCurrentUser(name: string) {
  localStorage.setItem('survey-current-user', name);
}

export async function addAuditLog(caseId: string, action: string, detail: string) {
  await db.auditLogs.add({
    id: crypto.randomUUID(),
    caseId,
    action,
    detail,
    actor: getCurrentUser(),
    at: Date.now()
  });
}
