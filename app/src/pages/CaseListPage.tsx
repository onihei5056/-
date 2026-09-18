import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, getCurrentUser, setCurrentUser, addAuditLog } from '../db/db';
import type { SurveyCase } from '../types';
import { uid } from '../utils/id';
import { createSampleCase } from '../utils/sampleData';

const statusLabel: Record<SurveyCase['status'], { text: string; cls: string }> = {
  draft: { text: '下書き', cls: 'pill-draft' },
  in_progress: { text: '調査中', cls: 'pill-progress' },
  completed: { text: '完了', cls: 'pill-done' }
};

export function CaseListPage() {
  const [cases, setCases] = useState<SurveyCase[]>([]);
  const [keyword, setKeyword] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    const list = await db.cases.orderBy('updatedAt').reverse().toArray();
    setCases(list);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return cases;
    return cases.filter((c) =>
      [c.name, c.address, c.surveyDate, c.surveyor].some((v) => v.toLowerCase().includes(k))
    );
  }, [cases, keyword]);

  const handleDuplicate = async (c: SurveyCase) => {
    const newId = uid();
    const now = Date.now();
    await db.cases.add({ ...c, id: newId, name: `${c.name}(複製)`, createdAt: now, updatedAt: now, version: 1 });
    const answers = await db.sectionAnswers.where('caseId').equals(c.id).toArray();
    for (const a of answers) {
      await db.sectionAnswers.put({ ...a, key: `${newId}::${a.sectionId}`, caseId: newId });
    }
    const photos = await db.photos.where('caseId').equals(c.id).toArray();
    for (const p of photos) {
      await db.photos.add({ ...p, id: uid(), caseId: newId });
    }
    const walls = await db.wallSurveys.where('caseId').equals(c.id).toArray();
    for (const w of walls) {
      await db.wallSurveys.add({ ...w, id: uid(), caseId: newId });
    }
    await addAuditLog(newId, 'duplicate', `案件「${c.name}」を複製`);
    await load();
  };

  const handleDelete = async (c: SurveyCase) => {
    if (!window.confirm(`案件「${c.name}」を削除します。写真・入力内容もすべて削除され、元に戻せません。よろしいですか?`)) return;
    await db.transaction('rw', db.cases, db.sectionAnswers, db.photos, db.wallSurveys, db.auditLogs, async () => {
      await db.cases.delete(c.id);
      await db.sectionAnswers.where('caseId').equals(c.id).delete();
      await db.photos.where('caseId').equals(c.id).delete();
      await db.wallSurveys.where('caseId').equals(c.id).delete();
      await db.auditLogs.where('caseId').equals(c.id).delete();
    });
    await load();
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar__title-row">
          <div className="topbar__case">不動産現地調査</div>
          <div className="top-actions">
            <button className="icon-btn" onClick={() => navigate('/settings')}>
              設定
            </button>
          </div>
        </div>
        <div className="topbar__step">案件一覧</div>
      </div>
      <div className="page-body">
        <div className="field">
          <label className="field-label">担当者名(記録用)</label>
          <input
            className="input"
            defaultValue={getCurrentUser()}
            onBlur={(e) => setCurrentUser(e.target.value || '未設定担当者')}
            placeholder="例: 山田太郎"
          />
        </div>

        <div className="field">
          <input
            className="input"
            placeholder="物件名・所在地・調査日・担当者で検索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginBottom: 12 }}
          onClick={() => navigate('/case/new')}
        >
          ＋ 新規調査の作成
        </button>
        <button
          className="btn btn-ghost btn-block"
          style={{ marginBottom: 20 }}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const id = await createSampleCase();
              await load();
              navigate(`/case/${id}/seller-info`);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? '作成中…' : 'サンプル案件を作成(動作確認用)'}
        </button>

        {filtered.length === 0 && <div className="field-note">該当する案件がありません。</div>}

        {filtered.map((c) => (
          <div className="case-item" key={c.id}>
            <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/case/${c.id}/seller-info`)}>
              <div className="case-item__name">{c.name || '(物件名未設定)'}</div>
              <div className="case-item__address">{c.address || '(所在地未設定)'}</div>
              <div className="case-item__meta">
                <span className={`pill ${statusLabel[c.status].cls}`}>{statusLabel[c.status].text}</span>
                <span>調査日: {c.surveyDate || '未設定'}</span>
                <span>担当: {c.surveyor || '未設定'}</span>
                <span>更新: {new Date(c.updatedAt).toLocaleString('ja-JP')}</span>
              </div>
            </div>
            <div className="photo-actions" style={{ marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(c)}>
                複製
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
