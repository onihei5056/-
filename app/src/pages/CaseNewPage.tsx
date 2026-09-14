import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, getCurrentUser, getDeviceId, addAuditLog, sectionAnswerKey } from '../db/db';
import { uid } from '../utils/id';

export function CaseNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [surveyDate, setSurveyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [surveyor, setSurveyor] = useState(getCurrentUser());

  const canCreate = name.trim() !== '' && address.trim() !== '';

  const handleCreate = async () => {
    const id = uid();
    const now = Date.now();
    await db.cases.add({
      id,
      name: name.trim(),
      address: address.trim(),
      surveyDate,
      surveyor: surveyor.trim() || '未設定担当者',
      status: 'in_progress',
      createdAt: now,
      createdBy: getCurrentUser(),
      updatedAt: now,
      updatedBy: getCurrentUser(),
      deviceId: getDeviceId(),
      version: 1
    });
    await db.sectionAnswers.put({
      key: sectionAnswerKey(id, 'seller-info'),
      caseId: id,
      sectionId: 'seller-info',
      values: { surveyDate, staffName: surveyor.trim() },
      manualOverride: {},
      updatedAt: now,
      updatedBy: getCurrentUser()
    });
    await addAuditLog(id, 'create', '案件を新規作成');
    navigate(`/case/${id}/seller-info`);
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar__title-row">
          <div className="topbar__case">新規調査の作成</div>
        </div>
      </div>
      <div className="page-body">
        <div className="card">
          <h3 className="card-title">案件情報</h3>
          <div className="field">
            <label className="field-label">
              案件名<span className="field-required">必須</span>
            </label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 渋谷区サンプル1-2-3 戸建調査" />
          </div>
          <div className="field">
            <label className="field-label">
              物件所在地<span className="field-required">必須</span>
            </label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="例: 東京都渋谷区サンプル1-2-3" />
          </div>
          <div className="field">
            <label className="field-label">調査日</label>
            <input className="input" type="date" value={surveyDate} onChange={(e) => setSurveyDate(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">調査担当者</label>
            <input className="input" value={surveyor} onChange={(e) => setSurveyor(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="bottomnav">
        <button className="btn btn-ghost" style={{ flex: '0 0 30%' }} onClick={() => navigate('/')}>
          戻る
        </button>
        <button className="btn btn-primary btn-block" disabled={!canCreate} onClick={handleCreate}>
          作成して入力開始
        </button>
      </div>
    </div>
  );
}
