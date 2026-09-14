import type { WallPermitEntry, WallSurveyRecord } from '../types';

/**
 * 擁壁調査シートの選択肢定義。
 * 出典: 不動産調査シート_2026.3.1.xlsx「擁壁調査シート」
 * 空欄のチェックボックス(□のみでラベルなし)は自由入力欄として「その他」を用意している。
 */

/** 擁壁の許認可 根拠法令(F5,F7,F9,F11) */
export const WALL_PERMIT_LAWS = [
  '宅地造成等規制法にもとづく',
  '都市計画法に定める開発行為にもとづく',
  '建築基準法第88条(工作物への準用)',
  'その他'
];

/** 擁壁の工法(A23〜J24) */
export const WALL_METHODS = [
  '空石積み擁壁',
  '増積み擁壁',
  '二段擁壁',
  '二重擁壁',
  '張出し床版付擁壁',
  'その他'
];

/** 擁壁の材質(A26〜X26) */
export const WALL_MATERIALS = ['空洞コンクリートブロック擁壁', '大谷石', '玉石', 'その他'];

/** 水抜き穴の状況(A28〜J29) */
export const WALL_WEEP_HOLES = [
  '水抜き穴が無い',
  '3㎡に1ヶ所以上無い',
  '口径が狭い(75mm未満)',
  '詰まり',
  '異常な色の流水'
];

/** 排水設備等の状況(A31〜R31,A32) */
export const WALL_DRAINAGE = [
  '水のしみ出し',
  'クラック・目地からの湧水',
  '排水施設不良(排水溝のずれ・欠損)',
  'その他'
];

/** 擁壁変状・経年変化(A34〜X35) */
export const WALL_DEFORMATIONS = [
  'クラック(ひび割れ)',
  '水平移動',
  '不同沈下(目地の開き)',
  'ふくらみ',
  '出隅部(コーナー部)の開き',
  '傾斜(傾き)・折損',
  'その他'
];

/** 擁壁調査シート右下の免責文(AC44) */
export const WALL_DISCLAIMER =
  '※本書は立入ることのできる範囲で、擁壁の外観上確認できる項目のみで作成しており、' +
  '目視出来ない部分に不具合が生じている可能性があります。擁壁自体の構造・性能・品質または' +
  '将来にわたる安全性を保証するものではありません。擁壁の安全性を総合的に判定するには、' +
  '擁壁構造体を支持する地盤耐力、擁壁構造体の詳細、擁壁背面の土質分布、裏込め材の詳細、' +
  '地下水位、排水等の状況を確認する必要があります。詳しくは、専門家にご相談ください。';

export function emptyPermits(): WallPermitEntry[] {
  return WALL_PERMIT_LAWS.map((law) => ({
    law,
    lawOther: '',
    checked: false,
    permit: '' as const,
    permitDate: '',
    permitNumber: '',
    inspection: '' as const,
    inspectionDate: '',
    inspectionNumber: ''
  }));
}

export function emptyWallSurvey(caseId: string, index: number, id: string, updatedBy: string): WallSurveyRecord {
  return {
    id,
    caseId,
    index,
    direction: '',
    location: '',
    locationDetail: '',
    owner: '',
    ownerDetail: '',
    position: '',
    positionOther: '',
    permitRequired: '',
    permits: emptyPermits(),
    permitUnknown: false,
    permitNotObtained: false,
    cliffApplicable: '',
    cliffRestrictionSummary: '',
    methods: [],
    methodOther: '',
    materials: [],
    materialOther: '',
    weepHoles: [],
    drainage: [],
    drainageOther: '',
    deformations: [],
    deformationOther: '',
    otherNote: '',
    remarks: '',
    updatedAt: Date.now(),
    updatedBy
  };
}
