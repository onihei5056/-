import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, addAuditLog, getCurrentUser } from '../db/db';
import type { WallPermitEntry, WallSurveyRecord } from '../types';
import {
  WALL_DEFORMATIONS,
  WALL_DISCLAIMER,
  WALL_DRAINAGE,
  WALL_MATERIALS,
  WALL_METHODS,
  WALL_WEEP_HOLES,
  emptyWallSurvey
} from '../schema/wall';
import { uid } from '../utils/id';
import { useCase } from '../hooks/useCase';
import { useIssues } from '../hooks/useIssues';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { PhotoManager } from '../components/PhotoManager';
import { DateField, MultiField, SegmentField, TextField } from '../components/WallFields';
import { SectionTabs } from '../components/SectionTabs';
import { useCaseProgress } from '../hooks/useCaseProgress';
import { nextStep, prevStep } from '../schema/flow';

export function WallSurveyPage() {
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  const { surveyCase } = useCase(caseId);
  const { issues, refresh } = useIssues(caseId);
  const [walls, setWalls] = useState<WallSurveyRecord[]>([]);
  const [wallRequired, setWallRequired] = useState<boolean | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sectionId = 'wall-survey';
  const { progress, refresh: refreshProgress } = useCaseProgress(caseId);
  const prev = prevStep(sectionId);
  const next = nextStep(sectionId);
  const wallIssues = issues.filter((i) => i.sectionId === sectionId);

  const load = async () => {
    const list = await db.wallSurveys.where('caseId').equals(caseId).sortBy('index');
    setWalls(list);
    const surroundings = await db.sectionAnswers.get(`${caseId}::surroundings`);
    setWallRequired(surroundings?.values?.hasWall === '有');
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const patchWall = (id: string, patch: Partial<WallSurveyRecord>) => {
    setWalls((prevWalls) => prevWalls.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(async () => {
      await db.wallSurveys.update(id, { ...patch, updatedAt: Date.now(), updatedBy: getCurrentUser() });
      refresh();
    }, 600);
  };

  const patchPermit = (wall: WallSurveyRecord, lawIndex: number, patch: Partial<WallPermitEntry>) => {
    patchWall(wall.id, {
      permits: wall.permits.map((p, i) => (i === lawIndex ? { ...p, ...patch } : p))
    });
  };

  const addWall = async () => {
    const w = emptyWallSurvey(caseId, walls.length + 1, uid(), getCurrentUser());
    await db.wallSurveys.add(w);
    await addAuditLog(caseId, 'wall_add', `擁壁調査(${w.index})を追加`);
    await load();
  };

  const removeWall = async (w: WallSurveyRecord) => {
    if (!window.confirm(`擁壁調査(${w.index})を削除します。関連する写真も削除されます。よろしいですか?`)) return;
    await db.wallSurveys.delete(w.id);
    await db.photos.where('caseId').equals(caseId).filter((p) => p.refId === w.id).delete();
    await addAuditLog(caseId, 'wall_delete', `擁壁調査(${w.index})を削除`);
    await load();
    await refresh();
  };

  return (
    <div className="app-shell">
      <TopBar
        caseName={surveyCase?.name ?? ''}
        address={surveyCase?.address}
        stepLabel="擁壁調査シート"
        percent={progress.overall.percent}
        saveState="saved"
        filled={progress.overall.filled}
        total={progress.overall.total}
      />
      <SectionTabs caseId={caseId} current={sectionId} progress={progress} />
      <div className="page-body">
        <h2 className="section-title">擁壁調査シート</h2>
        {wallRequired === false && walls.length === 0 && (
          <div className="note-box">
            「周辺環境他」画面の擁壁が「無」のため、このシートの入力は不要です。擁壁がある場合は擁壁を「有」に変更してください。
          </div>
        )}
        {wallRequired && (
          <div className="note-box">
            擁壁がある場合は擁壁調査シートの提出が必須です。擁壁が複数ある場合は「擁壁を追加」で追加してください。
          </div>
        )}
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
                削除
              </button>
            </h3>

            <TextField
              label="（　）側の擁壁について"
              placeholder="例: 西"
              value={w.direction}
              onChange={(v) => patchWall(w.id, { direction: v })}
            />
            <SegmentField
              label="擁壁の設置場所"
              options={['本物件内', '隣接地内']}
              value={w.location}
              onChange={(v) => patchWall(w.id, { location: v as WallSurveyRecord['location'] })}
            />
            {w.location === '隣接地内' && (
              <TextField label="隣接地内(詳細)" value={w.locationDetail} onChange={(v) => patchWall(w.id, { locationDetail: v })} />
            )}
            <SegmentField
              label="擁壁の所有者"
              options={['売主', '隣接地']}
              value={w.owner}
              onChange={(v) => patchWall(w.id, { owner: v as WallSurveyRecord['owner'] })}
            />
            {w.owner === '隣接地' && (
              <TextField label="所有者(詳細)" value={w.ownerDetail} onChange={(v) => patchWall(w.id, { ownerDetail: v })} />
            )}
            <SegmentField
              label="本物件の敷地は擁壁の"
              options={['上', '下', 'その他']}
              value={w.position}
              onChange={(v) => patchWall(w.id, { position: v as WallSurveyRecord['position'] })}
            />
            {w.position === 'その他' && (
              <TextField label="位置関係(その他)" value={w.positionOther} onChange={(v) => patchWall(w.id, { positionOther: v })} />
            )}

            <h3 className="card-title" style={{ marginTop: 20 }}>
              擁壁の許認可
            </h3>
            <SegmentField
              label="許認可"
              options={['必要', '不要', '不明']}
              value={w.permitRequired}
              onChange={(v) => patchWall(w.id, { permitRequired: v as WallSurveyRecord['permitRequired'] })}
            />

            {w.permitRequired === '必要' && (
              <>
                {w.permits.map((p, i) => (
                  <div className="card" key={p.law} style={{ background: '#fbfbfb' }}>
                    <button
                      type="button"
                      className={`multi-btn${p.checked ? ' selected' : ''}`}
                      style={{ marginBottom: 10 }}
                      onClick={() => patchPermit(w, i, { checked: !p.checked })}
                    >
                      {p.checked ? '✓ ' : ''}
                      {p.law}
                    </button>
                    {p.checked && (
                      <>
                        {p.law === 'その他' && (
                          <TextField label="法令名" value={p.lawOther} onChange={(v) => patchPermit(w, i, { lawOther: v })} />
                        )}
                        <SegmentField
                          label="許可"
                          options={['有', '無']}
                          value={p.permit}
                          onChange={(v) => patchPermit(w, i, { permit: v as WallPermitEntry['permit'] })}
                        />
                        {p.permit === '有' && (
                          <>
                            <DateField label="許可 日付" value={p.permitDate} onChange={(v) => patchPermit(w, i, { permitDate: v })} />
                            <TextField label="許可 番号" value={p.permitNumber} onChange={(v) => patchPermit(w, i, { permitNumber: v })} />
                          </>
                        )}
                        <SegmentField
                          label="検査済証"
                          options={['有', '無']}
                          value={p.inspection}
                          onChange={(v) => patchPermit(w, i, { inspection: v as WallPermitEntry['inspection'] })}
                        />
                        {p.inspection === '有' && (
                          <>
                            <DateField label="検査済証 日付" value={p.inspectionDate} onChange={(v) => patchPermit(w, i, { inspectionDate: v })} />
                            <TextField label="検査済証 番号" value={p.inspectionNumber} onChange={(v) => patchPermit(w, i, { inspectionNumber: v })} />
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div className="multi-group" style={{ marginBottom: 16 }}>
                  <button
                    type="button"
                    className={`multi-btn${w.permitUnknown ? ' selected' : ''}`}
                    onClick={() => patchWall(w.id, { permitUnknown: !w.permitUnknown })}
                  >
                    {w.permitUnknown ? '✓ ' : ''}許認可の取得は不明
                  </button>
                  <button
                    type="button"
                    className={`multi-btn${w.permitNotObtained ? ' selected' : ''}`}
                    onClick={() => patchWall(w.id, { permitNotObtained: !w.permitNotObtained })}
                  >
                    {w.permitNotObtained ? '✓ ' : ''}許認可を取得していない
                  </button>
                </div>
              </>
            )}

            <h3 className="card-title" style={{ marginTop: 20 }}>
              「がけ」について
            </h3>
            <SegmentField
              label="地方公共団体が定める「がけ」に"
              options={['該当しない', '該当する']}
              value={w.cliffApplicable}
              onChange={(v) => patchWall(w.id, { cliffApplicable: v as WallSurveyRecord['cliffApplicable'] })}
            />
            {w.cliffApplicable === '該当する' && (
              <TextField
                label="制限の概要"
                multiline
                rows={4}
                value={w.cliffRestrictionSummary}
                onChange={(v) => patchWall(w.id, { cliffRestrictionSummary: v })}
              />
            )}

            <h3 className="card-title" style={{ marginTop: 20 }}>
              擁壁の不適格・不具合箇所
            </h3>
            <MultiField
              label="【擁壁の工法】"
              options={WALL_METHODS}
              values={w.methods}
              onChange={(v) => patchWall(w.id, { methods: v })}
            />
            {w.methods.includes('その他') && (
              <TextField label="工法(その他)" value={w.methodOther} onChange={(v) => patchWall(w.id, { methodOther: v })} />
            )}
            <MultiField
              label="【擁壁の材質】"
              options={WALL_MATERIALS}
              values={w.materials}
              onChange={(v) => patchWall(w.id, { materials: v })}
            />
            {w.materials.includes('その他') && (
              <TextField label="材質(その他)" value={w.materialOther} onChange={(v) => patchWall(w.id, { materialOther: v })} />
            )}
            <MultiField
              label="【水抜き穴の状況】"
              options={WALL_WEEP_HOLES}
              values={w.weepHoles}
              onChange={(v) => patchWall(w.id, { weepHoles: v })}
            />
            <MultiField
              label="【排水設備等の状況】"
              options={WALL_DRAINAGE}
              values={w.drainage}
              onChange={(v) => patchWall(w.id, { drainage: v })}
            />
            {w.drainage.includes('その他') && (
              <TextField label="排水設備(その他)" value={w.drainageOther} onChange={(v) => patchWall(w.id, { drainageOther: v })} />
            )}
            <MultiField
              label="【擁壁変状・経年変化】"
              options={WALL_DEFORMATIONS}
              values={w.deformations}
              onChange={(v) => patchWall(w.id, { deformations: v })}
            />
            {w.deformations.includes('その他') && (
              <TextField label="変状(その他)" value={w.deformationOther} onChange={(v) => patchWall(w.id, { deformationOther: v })} />
            )}
            <TextField
              label="【その他】"
              multiline
              rows={3}
              placeholder="例: 石積擁壁の上にコンクリートブロック擁壁が設置されております。"
              value={w.otherNote}
              onChange={(v) => patchWall(w.id, { otherNote: v })}
            />
            <TextField
              label="備考"
              multiline
              rows={5}
              placeholder="重要事項説明に記載する擁壁に関する説明文など"
              value={w.remarks}
              onChange={(v) => patchWall(w.id, { remarks: v })}
            />

            <PhotoManager
              caseId={caseId}
              category="yoheki-site"
              refId={w.id}
              title={`擁壁${w.index} 敷地図・撮影方向`}
              note="敷地図に撮影方向を書き込んだものを撮影・登録してください。"
            />
            <PhotoManager
              caseId={caseId}
              category="yoheki-view"
              refId={w.id}
              title={`擁壁${w.index} 全景(①②③)`}
              note="擁壁の全景が分かるように撮影してください(Excel帳票では3枠)。"
            />
            <PhotoManager
              caseId={caseId}
              category="yoheki-defect"
              refId={w.id}
              title={`擁壁${w.index} 不具合箇所(④⑤)`}
              note="不具合箇所ごとに撮影し、コメント欄へ箇所名(例: クラック)を記入してください(Excel帳票では2枠)。"
              enableLabel
              labelPlaceholder="不具合箇所名(例: クラック)"
            />
          </div>
        ))}

        <button className="btn btn-primary btn-block" onClick={addWall}>
          ＋ 擁壁を追加
        </button>

        <div className="note-box" style={{ marginTop: 16 }}>
          {WALL_DISCLAIMER}
        </div>
      </div>
      <BottomNav
        onBack={prev ? () => navigate(prev.path(caseId)) : undefined}
        onSave={async () => {
          await Promise.all([refresh(), refreshProgress()]);
        }}
        onNext={async () => {
          await Promise.all([refresh(), refreshProgress()]);
          if (next) navigate(next.path(caseId));
        }}
      />
    </div>
  );
}
