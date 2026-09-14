import { db, getDeviceId, getCurrentUser, addAuditLog, sectionAnswerKey } from '../db/db';
import { uid } from './id';
import type { PhotoCategoryKey, PhotoRecord, SurveyCase, WallSurveyRecord } from '../types';

function placeholderPhoto(label: string, color: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  ctx.font = '24px sans-serif';
  ctx.fillText('サンプル画像(仮)', canvas.width / 2, canvas.height / 2 + 50);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85));
}

async function addSamplePhoto(caseId: string, category: PhotoCategoryKey, label: string, color: string, order: number, refId?: string) {
  const blob = await placeholderPhoto(label, color);
  const record: PhotoRecord = {
    id: uid(),
    caseId,
    category,
    refId,
    blob,
    mimeType: 'image/jpeg',
    takenAt: Date.now(),
    photographer: 'サンプル担当者',
    comment: `${label}の状況(サンプルコメント)`,
    order,
    rotation: 0,
    includeInPdf: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await db.photos.add(record);
}

/** 案件一覧から1タップで生成できるサンプル案件(入力・写真・擁壁調査込み) */
export async function createSampleCase(): Promise<string> {
  const caseId = uid();
  const now = Date.now();
  const sample: SurveyCase = {
    id: caseId,
    name: 'サンプル案件(東京都渋谷区)',
    address: '東京都渋谷区サンプル1-2-3',
    surveyDate: new Date().toISOString().slice(0, 10),
    surveyor: 'サンプル担当者',
    status: 'in_progress',
    createdAt: now,
    createdBy: getCurrentUser(),
    updatedAt: now,
    updatedBy: getCurrentUser(),
    deviceId: getDeviceId(),
    version: 1
  };
  await db.cases.add(sample);

  const sections: Record<string, Record<string, unknown>> = {
    'property-basic': {
      propertyType: 'house',
      caseName: sample.name,
      address: sample.address,
      surveyDate: sample.surveyDate,
      surveyor: sample.surveyor,
      weather: 'sunny',
      chiban: '1番2',
      kaokuBango: '1番2の1',
      jukyoHyoji: '渋谷区サンプル1丁目2番3号',
      kenchikuDate: '1998-04-01',
      kozo: ['wood'],
      floorsAbove: 2,
      floorsBelow: 0,
      landArea: 120,
      landAreaJissoku: 121.5,
      areaB1: 0,
      area1F: 55,
      area2F: 48,
      buildingArea: 60,
      kotei_land: 18000000,
      kotei_building: 4200000,
      boundaryStatus: 'clear'
    },
    'seller-rights': {
      sellerName: '調査 太郎',
      sellerContact: '090-0000-0000',
      mendanDate: sample.surveyDate,
      meigiSameAsSeller: 'yes',
      meigiStatus: 'alive',
      saleReason: ['souzoku'],
      isVacant: 'yes',
      vacantSince: '2025-01-10',
      vacantMonths: 8,
      previousUse: 'jitaku',
      managementStatus: 'normal',
      hasLeftover: 'yes',
      leftoverHandling: 'seller_dispose',
      leftoverDetail: '家財一式(タンス・食器棚)',
      hasOccupant: 'no',
      defectHistory: 'no',
      needsEstimate: 'no'
    },
    registry: {
      touchiChosaDate: sample.surveyDate,
      chosekiChosaki: '東京法務局渋谷出張所',
      landRegisteredArea: 120,
      landCategory: 'takuchi',
      buildingRegisteredArea: 103,
      hasMortgage: 'no',
      hasEasement: 'no',
      chiseki_kokai: 'yes'
    },
    'city-office': {
      yakushoChosaDate: sample.surveyDate,
      yakushoName: '渋谷区役所',
      chosaTanto: '建築課',
      doc_toshikeikaku: 'yes',
      doc_dorodaicho: 'yes',
      doc_gesuidaicho: 'yes',
      doc_hazard: 'yes'
    },
    'road-zoning': {
      planRoad: 'no',
      youtoChiiki: 'dai1shu_jukyo',
      chiikichiku: ['junbouka'],
      kenpeiritsuKitei: 60,
      yosekiritsuKitei: 200,
      roadType: 'shido42-1-1',
      roadWidth: 5.4,
      setback: 'no',
      hasGutter: 'yes',
      hasWaterway: 'no',
      landReadjustment: 'no',
      otherLaws: ['none']
    },
    utilities: {
      waterSupply: 'jousui',
      waterMeterDiameter: '20',
      electricCompany: '東京電力',
      electricCapacity: 40,
      gasType: 'city',
      hasSolar: 'no',
      drainageType: 'gesuido'
    },
    surroundings: {
      nearbyFacilities: ['school', 'store', 'station'],
      noiseVibration: 'no',
      hasConcreteBlock: 'no',
      hasWall: 'yes',
      cliffOrdinanceGeneral: 'no',
      groundReinforcement: 'no',
      chonaikaiJoin: 'yes',
      chonaikaiFee: 300,
      gomiStationLocation: '敷地北側路上',
      rinkaVisited: 'yes',
      rinkaResult: '特にトラブルなし。境界の越境なし。'
    }
  };

  for (const [sectionId, values] of Object.entries(sections)) {
    await db.sectionAnswers.put({
      key: sectionAnswerKey(caseId, sectionId),
      caseId,
      sectionId,
      values: values as never,
      manualOverride: {},
      updatedAt: now,
      updatedBy: getCurrentUser()
    });
  }

  await addSamplePhoto(caseId, 'suido', '上水道', '#0b2c5c', 0);
  await addSamplePhoto(caseId, 'meter', 'メーター', '#0b2c5c', 0);
  await addSamplePhoto(caseId, 'denki', '電気', '#0b2c5c', 0);
  await addSamplePhoto(caseId, 'gesui', '下水', '#0b2c5c', 0);

  const wallId = uid();
  const wall: WallSurveyRecord = {
    id: wallId,
    caseId,
    index: 1,
    orientation: '北側',
    shootingDirection: '南向き撮影',
    location: '敷地北側境界沿い',
    owner: '売主',
    positionRelation: '上側',
    permitType: '宅地造成等規制法',
    hasPermit: '有',
    permitDate: '1997-06-01',
    permitNumber: '第123号',
    hasInspectionCert: '有',
    inspectionDate: '1997-09-01',
    inspectionNumber: '検第45号',
    cliffOrdinance: '非該当',
    method: '間知石積み',
    material: '石積み',
    weepHoleStatus: '3㎡に1箇所設置・機能良好',
    drainageStatus: '良好',
    defects: [
      { id: uid(), types: ['クラック'], location: '中央部下方', note: '幅0.5mm程度の軽微なひび割れ' }
    ],
    remarks: 'サンプルデータのため詳細は要確認。',
    updatedAt: now,
    updatedBy: getCurrentUser()
  };
  await db.wallSurveys.add(wall);
  await addSamplePhoto(caseId, 'yoheki', '擁壁全景', '#5c3d0b', 0, wallId);
  await addSamplePhoto(caseId, 'yoheki', 'クラック箇所', '#7a1f1f', 1, wallId);

  await addAuditLog(caseId, 'sample_create', 'サンプル案件を作成');
  return caseId;
}
