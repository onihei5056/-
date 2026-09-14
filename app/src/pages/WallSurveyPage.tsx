import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, addAuditLog, getCurrentUser } from '../db/db';
import type { WallSurveyRecord } from '../types';
import { WALL_DEFECT_TYPES } from '../schema/sections';
import { uid } from '../utils/id';
import { useCase } from '../hooks/useCase';
import { useIssues } from '../hooks/useIssues';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { PhotoManager } from '../components/PhotoManager';
import { FLOW_STEPS, nextStep, prevStep, stepIndexOf } from '../schema/flow';
import { computeOverallPercent } from '../utils/progress';
import { countMissingRequired } from '../utils/validation';

const RADIO2 = (a: string, b: string) => [{ value: a, label: a }, { value: b, label: b }];

function emptyWall(caseId: string, index: number): WallSurveyRecord {
  const now = Date.now();
  return {
    id: uid(),
    caseId,
    index,
    orientation: '',
    shootingDirection: '',
    location: '',
    owner: '',
    positionRelation: '',
    permitType: '',
    hasPermit: '',
    permitDate: '',
    permitNumber: '',
    hasInspectionCert: '',
    inspectionDate: '',
    inspectionNumber: '',
    cliffOrdinance: '',
    method: '',
    material: '',
    weepHoleStatus: '',
    drainageStatus: '',
    defects: [],
    remarks: '',
    updatedAt: now,
    updatedBy: getCurrentUser()
  };
}

export function WallSurveyPage() {
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  const { surveyCase } = useCase(caseId);
  const { issues, refresh } = useIssues(caseId);
  const [walls, setWalls] = useState<WallSurveyRecord[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sectionId = 'wall-survey';
  const stepNumber = stepIndexOf(sectionId) + 1;
  const percent = computeOverallPercent(issues);
  const missing = countMissingRequired(issues);
  const prev = prevStep(sectionId);
  const next = nextStep(sectionId);
  const wallIssues = issues.filter((i) => i.sectionId === sectionId);

  const load = async () => {
    const list = await db.wallSurveys.where('caseId').equals(caseId).sortBy('index');
    setWalls(list);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const patchWall = (id: string, patch: Partial<WallSurveyRecord>) => {
    setWalls((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(async () => {
      await db.wallSurveys.update(id, { ...patch, updatedAt: Date.now(), updatedBy: getCurrentUser() });
      refresh();
    }, 600);
  };

  const addWall = async () => {
    const w = emptyWall(caseId, walls.length + 1);
    await db.wallSurveys.add(w);
    await addAuditLog(caseId, 'wall_add', `擁壁調査(${w.index})を追加`);
    await load();
  };

  const removeWall = async (w: WallSurveyRecord) => {
    if (!window.confirm(`擁壁調査(${w.index})を削除します。関連する写真も削除されます。よろしいですか?`)) return;
    await db.wallSurveys.delete(w.id);
    await db.photos.where({ caseId, category: 'yoheki', refId: w.id }).delete();
    await addAuditLog(caseId, 'wall_delete', `擁壁調査(${w.index})を削除`);
    await load();
    await refresh();
  };

  const addDefect = (w: WallSurveyRecord) => {
    patchWall(w.id, { defects: [...w.defects, { id: uid(), types: [], location: '', note: '' }] });
  };
  const updateDefect = (w: WallSurveyRecord, defectId: string, patch: Partial<WallSurveyRecord['defects'][number]>) => {
    patchWall(w.id, { defects: w.defects.map((d) => (d.id === defectId ? { ...d, ...patch } : d)) });
  };
  const removeDefect = (w: WallSurveyRecord, defectId: string) => {
    patchWall(w.id, { defects: w.defects.filter((d) => d.id !== defectId) });
  };

  return (
    <div className="app-shell">
      <TopBar
        caseName={surveyCase?.name ?? ''}
        address={surveyCase?.address}
        stepLabel="擁壁調査"
        stepNumber={stepNumber}
        totalSteps={FLOW_STEPS.length}
        percent={percent}
        saveState="saved"
        missingRequiredCount={missing}
      />
      <div className="page-body">
        <h2 className="section-title">擁壁調査</h2>
        <div className="note-box">
          周辺環境画面で「擁壁の有無=有」の場合に入力してください。擁壁が複数ある場合は「擁壁を追加」で追加調査を作成できます。
        </div>
        {wallIssues.length > 0 && (
          <div className="confirm-box">
            {wallIssues.map((i, idx) => (
              <div key={idx}>・{i.message}</div>
            ))}
          </div>
        )}

        {walls.map((w) => (
          <div className="card" key={w.id}>
            <h3 className="card-title">
              擁壁調査 {w.index}
              <button className="btn btn-danger btn-sm" style={{ float: 'right' }} onClick={() => removeWall(w)}>
                この擁壁を削除
              </button>
            </h3>

            <div className="field">
              <label className="field-label">対象擁壁の方位・場所</label>
              <input className="input" value={w.orientation} onChange={(e) => patchWall(w.id, { orientation: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">撮影方向</label>
              <input className="input" value={w.shootingDirection} onChange={(e) => patchWall(w.id, { shootingDirection: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">
                擁壁の設置場所<span className="field-required">必須</span>
              </label>
              <input className="input" value={w.location} onChange={(e) => patchWall(w.id, { location: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">擁壁の所有者</label>
              <input className="input" value={w.owner} onChange={(e) => patchWall(w.id, { owner: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">本物件が擁壁の上側/下側</label>
              <div className="segment-group">
                {RADIO2('上側', '下側').map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`segment-btn${w.positionRelation === o.value ? ' selected' : ''}`}
                    onClick={() => patchWall(w.id, { positionRelation: o.value as WallSurveyRecord['positionRelation'] })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="field-label">許認可の種類</label>
              <input className="input" value={w.permitType} onChange={(e) => patchWall(w.id, { permitType: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">許可の有無</label>
              <div className="segment-group">
                {RADIO2('有', '無').map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`segment-btn${w.hasPermit === o.value ? ' selected' : ''}`}
                    onClick={() => patchWall(w.id, { hasPermit: o.value as WallSurveyRecord['hasPermit'] })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {w.hasPermit === '有' && (
              <>
                <div className="field">
                  <label className="field-label">許可日</label>
                  <input className="input" type="date" value={w.permitDate} onChange={(e) => patchWall(w.id, { permitDate: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">許可番号</label>
                  <input className="input" value={w.permitNumber} onChange={(e) => patchWall(w.id, { permitNumber: e.target.value })} />
                </div>
              </>
            )}
            <div className="field">
              <label className="field-label">検査済証の有無</label>
              <div className="segment-group">
                {RADIO2('有', '無').map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`segment-btn${w.hasInspectionCert === o.value ? ' selected' : ''}`}
                    onClick={() => patchWall(w.id, { hasInspectionCert: o.value as WallSurveyRecord['hasInspectionCert'] })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {w.hasInspectionCert === '有' && (
              <>
                <div className="field">
                  <label className="field-label">検査日</label>
                  <input className="input" type="date" value={w.inspectionDate} onChange={(e) => patchWall(w.id, { inspectionDate: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">検査番号</label>
                  <input className="input" value={w.inspectionNumber} onChange={(e) => patchWall(w.id, { inspectionNumber: e.target.value })} />
                </div>
              </>
            )}
            <div className="field">
              <label className="field-label">がけ条例への該当</label>
              <div className="segment-group">
                {RADIO2('該当', '非該当').map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`segment-btn${w.cliffOrdinance === o.value ? ' selected' : ''}`}
                    onClick={() => patchWall(w.id, { cliffOrdinance: o.value as WallSurveyRecord['cliffOrdinance'] })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="field-label">擁壁の工法</label>
              <input className="input" value={w.method} onChange={(e) => patchWall(w.id, { method: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">擁壁の材質</label>
              <input className="input" value={w.material} onChange={(e) => patchWall(w.id, { material: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">水抜き穴の状況</label>
              <textarea className="input" rows={2} value={w.weepHoleStatus} onChange={(e) => patchWall(w.id, { weepHoleStatus: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">排水設備の状況</label>
              <textarea className="input" rows={2} value={w.drainageStatus} onChange={(e) => patchWall(w.id, { drainageStatus: e.target.value })} />
            </div>

            <h3 className="card-title" style={{ marginTop: 20 }}>
              不具合箇所
            </h3>
            {w.defects.map((d, i) => (
              <div key={d.id} className="card" style={{ background: '#fbfbfb' }}>
                <div className="field">
                  <label className="field-label">不具合箇所 {i + 1}: 種類(複数選択可)</label>
                  <div className="multi-group">
                    {WALL_DEFECT_TYPES.map((t) => {
                      const selected = d.types.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          className={`multi-btn${selected ? ' selected' : ''}`}
                          onClick={() =>
                            updateDefect(w, d.id, {
                              types: selected ? d.types.filter((x) => x !== t) : [...d.types, t]
                            })
                          }
                        >
                          {selected ? '✓ ' : ''}
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">不具合箇所の説明</label>
                  <input className="input" value={d.location} onChange={(e) => updateDefect(w, d.id, { location: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">備考</label>
                  <textarea className="input" rows={2} value={d.note} onChange={(e) => updateDefect(w, d.id, { note: e.target.value })} />
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeDefect(w, d.id)}>
                  この不具合を削除
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-block" style={{ marginBottom: 16 }} onClick={() => addDefect(w)}>
              ＋ 不具合箇所を追加
            </button>

            <div className="field">
              <label className="field-label">備考</label>
              <textarea className="input" rows={3} value={w.remarks} onChange={(e) => patchWall(w.id, { remarks: e.target.value })} />
            </div>

            <PhotoManager
              caseId={caseId}
              category="yoheki"
              refId={w.id}
              title={`擁壁調査${w.index} 写真(全景・不具合箇所)`}
              note="敷地図・撮影方向が分かるカット、全景、不具合箇所の順で撮影してください。"
            />
          </div>
        ))}

        <button className="btn btn-primary btn-block" onClick={addWall}>
          ＋ 擁壁を追加
        </button>
      </div>
      <BottomNav
        onBack={prev ? () => navigate(prev.path(caseId)) : undefined}
        onSave={async () => refresh()}
        onNext={async () => {
          await refresh();
          if (next) navigate(next.path(caseId));
        }}
      />
    </div>
  );
}
