import { db, getDeviceId, getCurrentUser, addAuditLog, sectionAnswerKey } from '../db/db';
import { uid } from './id';
import { emptyWallSurvey } from '../schema/wall';
import type { AnswerValue, PhotoCategoryKey, PhotoRecord, SurveyCase } from '../types';

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

async function addSamplePhoto(
  caseId: string,
  category: PhotoCategoryKey,
  label: string,
  color: string,
  order: number,
  refId?: string,
  photoLabel?: string
) {
  const blob = await placeholderPhoto(label, color);
  const record: PhotoRecord = {
    id: uid(),
    caseId,
    category,
    refId,
    label: photoLabel,
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

/**
 * 案件一覧から1タップで生成できるサンプル案件。
 * 値はすべて元Excel「不動産調査シート_2026.3.1.xlsx」の選択肢に準拠している。
 */
export async function createSampleCase(): Promise<string> {
  const caseId = uid();
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const sample: SurveyCase = {
    id: caseId,
    name: 'サンプル案件(東京都渋谷区)',
    address: '東京都渋谷区サンプル1-2-3',
    surveyDate: today,
    surveyor: 'サンプル担当者',
    buildingAgeYears: 39,
    status: 'in_progress',
    createdAt: now,
    createdBy: getCurrentUser(),
    updatedAt: now,
    updatedBy: getCurrentUser(),
    deviceId: getDeviceId(),
    version: 1
  };
  await db.cases.add(sample);

  const sections: Record<string, Record<string, AnswerValue>> = {
    'seller-info': {
      sellerName: '調査 太郎',
      judgmentCapacity: '有',
      ownershipForm: '単独',
      propertyType: '既存住宅',
      interviewee: '売主本人',
      surveyDate: today,
      staffName: 'サンプル担当者',
      ownerStatus: '同居',
      saleReason: '住み替えのため(サンプル)',
      vacantYears: 2,
      vacantSince: '2024-04-01',
      previousUse: '自己居住',
      managementStatus: '定期来訪',
      visitIntervalMonths: 1,
      visitCount: 2,
      moveDestination: '購入',
      moveDestinationStatus: '済',
      moveSupport: '不要',
      leaseback: '不要',
      moveOutTiming: '日付指定',
      moveOutDate: '2026-12-20',
      leftover: '有',
      leftoverHandling: '売主にて処分',
      boundaryClarity: '明示',
      boundaryMethod: ['確定測量'],
      contractNonconformity: ['免責'],
      otherBurden: ['更地渡し'],
      estimateRequest: ['残置物', '測量'],
      landArea: 120.5,
      parcelCount: 2,
      areaB1: 0,
      area1F: 55.2,
      area2F: 48.6,
      area3F: 0
    },
    'property-rights': {
      chiban: '渋谷区サンプル1丁目2番3',
      kaokuBango: '2番3',
      jukyoHyoji: '渋谷区サンプル1丁目2番3号',
      buildEra: '平成',
      buildDate: '1998-04-01',
      landValuation: 18000000,
      buildingValuation: 4200000,
      propertyTax: 152000,
      propertyTaxYear: 2026,
      thirdPartyOccupancy: '無',
      hasTitleDeed: '有',
      hasPurchaseContract: '有',
      hasFloorPlan: '無'
    },
    registry: {
      registryDocs: ['土地謄本', '公図', '地積測量図', '建物謄本', '建物図面'],
      registeredLandCategory: '宅地',
      actualLandCategory: '宅地',
      sellerNameAddressChange: '無',
      kouzuDifference: '無',
      addressDifference: '無',
      buildingPlanDifference: '無',
      unregisteredExtension: '無',
      garageRegistration: '不要',
      warehouseRegistration: '不要',
      demolitionRegistration: '未',
      hasMortgage: '有',
      remainingDebt: 850,
      shortfallOwnFunds: 0,
      hasSuperficies: '無',
      hasLeasehold: '無',
      hasSeizure: '無',
      hasBankruptcy: '無',
      hasRepurchaseClause: '無',
      hasProvisionalRegistration: '無'
    },
    'city-office': {
      officeDocs: ['固定資産公課(評価)証明書', '都市計画図', '道路台帳図', 'ハザードマップ(洪水・津波・高潮・土砂・ため池)', '地番図'],
      planRoad: '無',
      urbanDevelopmentProject: '無',
      zoning: '一住',
      districts: ['準防火'],
      designatedCoverage: 60,
      cornerLotRelaxation: '無',
      currentCoverage: 60,
      designatedFar: 200,
      farCoefficient: '0.4',
      buildingArea: 60.2,
      coverageExceeded: '無',
      farExceeded: '無',
      roadPublicPrivate: '公道',
      road1Side: '南',
      road1Width: 5.4,
      frontage1: 12.3,
      frontage1Note: '南側',
      setbackArea: 0,
      road1Direction: '南',
      road1Class: '1号',
      waterwayWidth: 0,
      waterwayOccupancyPermit: '無',
      waterwayCharge: '無',
      wallLineRestriction: '無',
      minSiteArea: 0,
      exteriorWallSetback: 0,
      absoluteHeight: '制限なし',
      roadSlopeLimit: '有',
      neighborSlopeLimit: '無',
      northSlopeLimit: '有',
      shadowRegulation: '1',
      buildingAgreement: '無',
      localOrdinance: '無',
      landReadjustment: '無',
      otherLaws: []
    },
    utilities: {
      utilityDocs: ['上水道台帳', '下水道台帳'],
      waterSupply: '公営',
      privatePipe: '無',
      inletDiameter: 20,
      meterRight: 20,
      onSiteMeter: '有',
      meterUserOwner: '適',
      utilityPole: '無',
      powerCapacity: 40,
      internet: '有',
      electricEasement: '無',
      allElectric: '無',
      antenna: '有',
      antennaBs: '有',
      cableTv: '無',
      solar: '無',
      gasType: '都市ガス',
      drainageType: '下水道',
      beneficiaryCharge: '済',
      sewerUsageConfirm: '有'
    },
    surroundings: {
      cbHeight: 0.8,
      cbThickness: 0.12,
      cbBraceRequired: '不要',
      cbBraceExists: '無',
      cbRebar: '有',
      cbFoundation: '有',
      hasWall: '有',
      heightDifference: '有',
      groundBelowHeight: 0,
      groundAboveHeight: 1.8,
      wallKinds: ['石積擁壁'],
      cliffOrdinance: '無',
      groundReinforcement: '無',
      chonaikaiFee: 3600,
      chonaikaiHead: 'サンプル 花子',
      gomiLocationConfirmed: '済',
      neighbor1Side: '東',
      neighbor1Name: 'サンプル 一郎',
      neighbor1Visited: '済',
      neighbor1Note: '越境・トラブルなし'
    },
    mansion: {}
  };

  for (const [sectionId, values] of Object.entries(sections)) {
    await db.sectionAnswers.put({
      key: sectionAnswerKey(caseId, sectionId),
      caseId,
      sectionId,
      values,
      manualOverride: {},
      updatedAt: now,
      updatedBy: getCurrentUser()
    });
  }

  // 設備現況写真(元Excel帳票の6枠)
  await addSamplePhoto(caseId, 'suido', '上水道', '#0b2c5c', 0);
  await addSamplePhoto(caseId, 'meter', 'メーター', '#14477f', 0);
  await addSamplePhoto(caseId, 'osui', '汚水', '#3c3c3c', 0);
  await addSamplePhoto(caseId, 'usui', '雨水', '#2d5f6e', 0);
  await addSamplePhoto(caseId, 'gas', 'ガス', '#7a4b12', 0);
  await addSamplePhoto(caseId, 'denki', '電気', '#5c3d0b', 0);
  await addSamplePhoto(caseId, 'gesui', '下水', '#333f4d', 0);

  // 擁壁調査シート
  const wall = emptyWallSurvey(caseId, 1, uid(), getCurrentUser());
  wall.direction = '西';
  wall.location = '本物件内';
  wall.owner = '売主';
  wall.position = '上';
  wall.permitRequired = '必要';
  wall.permits = wall.permits.map((p) =>
    p.law === '宅地造成等規制法にもとづく'
      ? {
          ...p,
          checked: true,
          permit: '有' as const,
          permitDate: '1997-06-01',
          permitNumber: '第123号',
          inspection: '有' as const,
          inspectionDate: '1997-09-01',
          inspectionNumber: '検第45号'
        }
      : p
  );
  wall.cliffApplicable = '該当しない';
  wall.methods = ['空石積み擁壁'];
  wall.materials = ['玉石'];
  wall.weepHoles = ['3㎡に1ヶ所以上無い'];
  wall.deformations = ['クラック(ひび割れ)'];
  wall.otherNote = '石積擁壁の上にコンクリートブロック擁壁が設置されております。';
  wall.remarks = 'サンプルデータです。実際の重要事項説明文は現地・行政調査の結果に基づき記載してください。';
  await db.wallSurveys.add(wall);

  await addSamplePhoto(caseId, 'yoheki-site', '敷地図・撮影方向', '#4b4b4b', 0, wall.id);
  await addSamplePhoto(caseId, 'yoheki-view', '擁壁全景', '#5c3d0b', 0, wall.id);
  await addSamplePhoto(caseId, 'yoheki-defect', 'クラック', '#7a1f1f', 0, wall.id, 'クラック');

  await addAuditLog(caseId, 'sample_create', 'サンプル案件を作成');
  return caseId;
}
