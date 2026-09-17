import type { FieldDef, SectionDef, SubGroup } from '../types';

/**
 * ============================================================================
 * 項目定義スキーマ
 * ----------------------------------------------------------------------------
 * 出典: 不動産調査シート_2026.3.1.xlsx
 *   - シート「不動産調査シート2026.3.1」(表示シート / 印刷範囲 A1:J74)
 *     … 役所調査・供給施設・周辺環境・マンション調査事項
 *   - シート「不動産調査シート」(非表示の旧版 / 印刷範囲 A1:J94)
 *     … 売主/面談情報・物件情報・法務局調査(現行版シートには含まれないため旧版から採用)
 *   - シート「設備現況写真」「擁壁調査シート」… 別ファイルで実装
 *
 * excelRef には元Excelのシート名とセル番地を記載している。
 * needsConfirmation:true は「元Excelの記載だけでは仕様が確定できずアプリ側で解釈した項目」で、
 * docs/open-issues.md にも同じ内容を掲載している。
 * ============================================================================
 */

const YES_NO = [
  { value: '有', label: '有' },
  { value: '無', label: '無' }
];
const DONE_NOT = [
  { value: '済', label: '済' },
  { value: '未', label: '未' }
];
const NEED_NOT = [
  { value: '要', label: '要' },
  { value: '不要', label: '不要' }
];

function opts(...labels: string[]) {
  return labels.map((l) => ({ value: l, label: l }));
}

function f(def: FieldDef): FieldDef {
  return def;
}

function g(id: string, title: string, fields: FieldDef[]): SubGroup {
  return { id, title, fields };
}

/** 元Excel A88(旧版シート)の脚注 ※1〜※20 */
export const FOOTNOTES: Record<number, string> = {
  1: '判断能力に欠ける場合、別手段検討',
  2: '共有名義の場合、契約方法検討(全員署名捺印或いは委任状対応)',
  3: '住民票住所確認（住所変更登記の有無）',
  4: '相続登記',
  5: '引渡し時期検討',
  6: 'オーナーチェンジ等特約',
  7: '紛失の場合、費用説明',
  8: '譲渡所得税説明',
  9: '地目(現況)が田畑の場合、農地法届出或いは許可が必要。行政書士へ依頼',
  10: '未登記建物をはじめ、該当する場合費用負担の説明と調査士へ各登記依頼',
  11: '該当する場合、売主負担の旨説明と司法書士へ各登記依頼',
  12: '2号→開発登録簿取得。5号→位置指定図取得。私道の場合通行掘削の許可',
  13: '擁壁の高低差や建確検済の有無、崖条例等特約',
  14: '建築協定、条例等該当する場合、内容・制限等確認',
  15: '敷地面積2,000㎡以上の場合届出',
  16: 'ガソスタやクリーニング店等跡地含めて懸念有る場合調査',
  17: '現地高圧線や謄本確認',
  18: '名義変更特約、手続き',
  19: '浄化槽(汲取式)の場合、決済までには売主へ清掃を依頼する',
  20: '地中埋設物のリスク'
};

const note = (n: number, extra?: string) =>
  `※${n} ${FOOTNOTES[n]}${extra ? ` / ${extra}` : ''}`;

// ---------------------------------------------------------------------------
// 1. 売主・面談情報(旧版シート A2〜B17 / I8:J15)
// ---------------------------------------------------------------------------
const sellerInfo: SectionDef = {
  id: 'seller-info',
  sheetRef: '不動産調査シート(旧版シート) 2〜17行',
  title: '売主・面談情報',
  stepIndex: 1,
  groups: [
    g('uriteki', '売主・物件種別', [
      f({ id: 'sellerName', label: '売主', type: 'text', maxLength: 60, excelRef: '不動産調査シート!A2' }),
      f({ id: 'judgmentCapacity', label: '判断能力', type: 'radio', options: YES_NO, note: note(1), excelRef: '不動産調査シート!F2' }),
      f({ id: 'ownershipForm', label: '名義', type: 'radio', options: opts('単独', '共有'), note: note(2), excelRef: '不動産調査シート!F2' }),
      f({ id: 'propertyType', label: '物件種別', type: 'radio', options: opts('土地', '既存住宅', '新築住宅'), excelRef: '不動産調査シート!J2' })
    ]),
    g('mendan', '面談者・調査情報', [
      f({ id: 'interviewee', label: '面談者', type: 'radio', options: opts('売主本人', '売主以外'), excelRef: '不動産調査シート!B3' }),
      f({ id: 'intervieweeRelation', label: '売主との関係', type: 'text', maxLength: 40,
        condition: { fieldId: 'interviewee', equals: '売主以外' }, excelRef: '不動産調査シート!E3' }),
      f({ id: 'surveyDate', label: '調査日', type: 'date', excelRef: '不動産調査シート!H3,I3' }),
      f({ id: 'staffName', label: '担当', type: 'text', maxLength: 40, excelRef: '不動産調査シート!G4' })
    ]),
    g('meigi', '登記名義人の現況・売却理由', [
      f({ id: 'ownerStatus', label: '登記名義人の現況', type: 'radio', options: opts('同居', '別居', '施設', '死亡'), note: note(3), excelRef: '不動産調査シート!B4' }),
      f({ id: 'inheritanceDivision', label: '分割協議', type: 'radio', options: DONE_NOT, note: note(4),
        condition: { fieldId: 'ownerStatus', equals: '死亡' }, excelRef: '不動産調査シート!B4' }),
      f({ id: 'saleReason', label: '売却理由', type: 'textarea', maxLength: 500, excelRef: '不動産調査シート!A5,B5' })
    ]),
    g('akiya', '空家期間・従前の利用方法・管理状況', [
      f({ id: 'vacantYears', label: '空家期間 約', type: 'number', unit: '年', min: 0, max: 100, excelRef: '不動産調査シート!B7' }),
      f({ id: 'vacantSince', label: '空家になった時期', type: 'date', excelRef: '不動産調査シート!B7' }),
      f({ id: 'previousUse', label: '従前の利用方法', type: 'radio', options: opts('自己居住', '親居住', '賃貸', '他'), excelRef: '不動産調査シート!B8' }),
      f({ id: 'previousUseOther', label: '従前の利用方法(他)', type: 'text', maxLength: 60,
        condition: { fieldId: 'previousUse', equals: '他' }, excelRef: '不動産調査シート!B8' }),
      f({ id: 'managementStatus', label: '管理状況', type: 'radio', options: opts('放置', '定期来訪', '第三者へ依頼'), excelRef: '不動産調査シート!B9' }),
      f({ id: 'visitIntervalMonths', label: '定期来訪 間隔', type: 'number', unit: 'ヶ月に', min: 0,
        condition: { fieldId: 'managementStatus', equals: '定期来訪' }, excelRef: '不動産調査シート!B9' }),
      f({ id: 'visitCount', label: '定期来訪 回数', type: 'number', unit: '回程度', min: 0,
        condition: { fieldId: 'managementStatus', equals: '定期来訪' }, excelRef: '不動産調査シート!B9' })
    ]),
    g('hikkoshi', '居住中の場合の引越先・退去時期', [
      f({ id: 'moveDestination', label: '居住中の場合引越先', type: 'radio', options: opts('購入', '賃貸', '未定', 'その他'), excelRef: '不動産調査シート!B10' }),
      f({ id: 'moveDestinationStatus', label: '購入・賃貸の状況', type: 'radio', options: DONE_NOT,
        condition: { fieldId: 'moveDestination', equals: ['購入', '賃貸'] }, excelRef: '不動産調査シート!B10' }),
      f({ id: 'moveDestinationOther', label: '引越先(その他)', type: 'text', maxLength: 60,
        condition: { fieldId: 'moveDestination', equals: 'その他' }, excelRef: '不動産調査シート!B10' }),
      f({ id: 'moveSupport', label: '引越先斡旋', type: 'radio', options: NEED_NOT, note: '未・未定の場合に確認', excelRef: '不動産調査シート!B11' }),
      f({ id: 'leaseback', label: 'リースバック', type: 'radio', options: NEED_NOT, excelRef: '不動産調査シート!B11' }),
      f({ id: 'moveOutTiming', label: '退去時期(目安)', type: 'radio', options: opts('日付指定', '売却決定後', 'その他'), note: note(5), excelRef: '不動産調査シート!B12' }),
      f({ id: 'moveOutDate', label: '退去予定日', type: 'date',
        condition: { fieldId: 'moveOutTiming', equals: '日付指定' }, excelRef: '不動産調査シート!B12' }),
      f({ id: 'moveOutOther', label: '退去時期(その他)', type: 'text', maxLength: 60,
        condition: { fieldId: 'moveOutTiming', equals: 'その他' }, excelRef: '不動産調査シート!B12' })
    ]),
    g('zanchi', '残置物・境界明示・契約不適合', [
      f({ id: 'leftover', label: '残置物', type: 'radio', options: YES_NO, excelRef: '不動産調査シート!B13' }),
      f({ id: 'leftoverHandling', label: '残置物の処分', type: 'radio', options: opts('売主にて処分', '現況渡し'),
        condition: { fieldId: 'leftover', equals: '有' }, excelRef: '不動産調査シート!B13' }),
      f({ id: 'boundaryClarity', label: '境界明示', type: 'radio', options: opts('非明示', '明示'), excelRef: '不動産調査シート!B14' }),
      f({ id: 'boundaryMethod', label: '明示方法', type: 'checkbox-multi', options: opts('境界復元', '確定測量', '現況確認のみ'),
        condition: { fieldId: 'boundaryClarity', equals: '明示' }, excelRef: '不動産調査シート!B14' }),
      f({ id: 'contractNonconformity', label: '契約不適合', type: 'checkbox-multi', options: opts('有', '免責', 'インスペクション'), excelRef: '不動産調査シート!B15' })
    ]),
    g('futan', 'その他負担・見積依頼', [
      f({ id: 'otherBurden', label: 'その他負担', type: 'checkbox-multi', options: opts('建物登記', '用途変更', '農転費用', '更地渡し'), excelRef: '不動産調査シート!B16' }),
      f({ id: 'estimateRequest', label: '見積依頼', type: 'checkbox-multi', options: opts('残置物', '建物登記', '測量', '農転', '用途変更', '解体・造成'), excelRef: '不動産調査シート!B17' }),
      f({ id: 'estimateRequestOther', label: '見積依頼(他)', type: 'text', maxLength: 60, excelRef: '不動産調査シート!B17' })
    ]),
    g('menseki', '面積(敷地・延床)', [
      f({ id: 'landArea', label: '敷地面積', type: 'number', unit: '㎡', min: 0, note: note(16), excelRef: '不動産調査シート!I8,J8' }),
      f({ id: 'parcelCount', label: '総筆数', type: 'number', unit: '筆', min: 0, excelRef: '不動産調査シート!I9,J9' }),
      f({ id: 'areaB1', label: '地階延面', type: 'number', unit: '㎡', min: 0, excelRef: '不動産調査シート!I11,J11' }),
      f({ id: 'area1F', label: '1F延面', type: 'number', unit: '㎡', min: 0, excelRef: '不動産調査シート!I12,J12' }),
      f({ id: 'area2F', label: '2F延面', type: 'number', unit: '㎡', min: 0, excelRef: '不動産調査シート!I13,J13' }),
      f({ id: 'area3F', label: '3F延面', type: 'number', unit: '㎡', min: 0, excelRef: '不動産調査シート!I14,J14' }),
      f({ id: 'areaTotal', label: '延床面積 合計(自動計算)', type: 'calc', unit: '㎡',
        calc: { kind: 'sum', sourceFieldIds: ['areaB1', 'area1F', 'area2F', 'area3F'] }, excelRef: '不動産調査シート!I15,J15' })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 2. 物件情報・権利関係(旧版シート 19〜25行)
// ---------------------------------------------------------------------------
const propertyRights: SectionDef = {
  id: 'property-rights',
  sheetRef: '不動産調査シート(旧版シート) 19〜25行',
  title: '物件情報・権利関係',
  stepIndex: 2,
  groups: [
    g('chiban', '地番・家屋番号・住居表示', [
      f({ id: 'chiban', label: '地番', type: 'text', maxLength: 60, excelRef: '不動産調査シート!A19,B19' }),
      f({ id: 'kaokuBango', label: '家屋番号', type: 'text', maxLength: 60, excelRef: '不動産調査シート!E19,F19' }),
      f({ id: 'jukyoHyoji', label: '住居表示', type: 'text', maxLength: 120, excelRef: '不動産調査シート!G19' })
    ]),
    g('kenchiku', '建築年月日', [
      f({ id: 'buildEra', label: '元号', type: 'radio', options: opts('昭和', '平成', '令和', '西暦'), excelRef: '不動産調査シート!B20' }),
      f({ id: 'buildDate', label: '建築年月日', type: 'date', excelRef: '不動産調査シート!B20' })
    ]),
    g('hyoka', '評価額・納税額', [
      f({ id: 'landValuation', label: '土地評価', type: 'number', unit: '円', min: 0, excelRef: '不動産調査シート!B21' }),
      f({ id: 'buildingValuation', label: '建物評価', type: 'number', unit: '円', min: 0, excelRef: '不動産調査シート!B21' }),
      f({ id: 'propertyTax', label: '固都税等(土地建物)', type: 'number', unit: '円', min: 0, excelRef: '不動産調査シート!B21' }),
      f({ id: 'propertyTaxYear', label: '固都税 年度', type: 'number', unit: '年度', min: 1900, max: 2200, excelRef: '不動産調査シート!B21' })
    ]),
    g('senyu', '第三者占有', [
      f({ id: 'thirdPartyOccupancy', label: '第三者占有', type: 'radio', options: YES_NO, note: note(6), excelRef: '不動産調査シート!A22,B22' }),
      f({ id: 'occupancyType', label: '占有の種類', type: 'radio', options: opts('賃貸借', '使用貸借'),
        condition: { fieldId: 'thirdPartyOccupancy', equals: '有' }, excelRef: '不動産調査シート!B22' }),
      f({ id: 'monthlyRent', label: '月額賃料', type: 'number', unit: '万円', min: 0,
        condition: { fieldId: 'occupancyType', equals: '賃貸借' }, excelRef: '不動産調査シート!B22' }),
      f({ id: 'occupancyFrom', label: '契約期間(開始)', type: 'date',
        condition: { fieldId: 'thirdPartyOccupancy', equals: '有' }, excelRef: '不動産調査シート!B22' }),
      f({ id: 'occupancyTo', label: '契約期間(終了)', type: 'date',
        condition: { fieldId: 'thirdPartyOccupancy', equals: '有' }, excelRef: '不動産調査シート!B22' }),
      f({ id: 'tenantName', label: '賃(使)借人氏名', type: 'text', maxLength: 60,
        condition: { fieldId: 'thirdPartyOccupancy', equals: '有' }, excelRef: '不動産調査シート!B23' }),
      f({ id: 'tenantAddress', label: '賃(使)借人住所', type: 'text', maxLength: 120,
        condition: { fieldId: 'thirdPartyOccupancy', equals: '有' }, excelRef: '不動産調査シート!F23' }),
      f({ id: 'tenantContract', label: '賃(使用)貸借契約書', type: 'radio', options: YES_NO,
        condition: { fieldId: 'thirdPartyOccupancy', equals: '有' }, excelRef: '不動産調査シート!B24' }),
      f({ id: 'tenantArrears', label: '滞納', type: 'radio', options: YES_NO,
        condition: { fieldId: 'thirdPartyOccupancy', equals: '有' }, excelRef: '不動産調査シート!B24' })
    ]),
    g('hokan', '保管書類', [
      f({ id: 'hasTitleDeed', label: '登記識別情報通知[権利書]', type: 'radio', options: YES_NO, note: note(7), excelRef: '不動産調査シート!B25' }),
      f({ id: 'hasPurchaseContract', label: '新築時[購入時]契約書類', type: 'radio', options: YES_NO, note: note(8), excelRef: '不動産調査シート!B25' }),
      f({ id: 'hasFloorPlan', label: '間取図', type: 'radio', options: YES_NO, excelRef: '不動産調査シート!B25' })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 3. 法務局調査(旧版シート 26〜33行)
// ---------------------------------------------------------------------------
const registry: SectionDef = {
  id: 'registry',
  sheetRef: '不動産調査シート(旧版シート) 26〜33行',
  title: '法務局調査',
  stepIndex: 3,
  groups: [
    g('shutoku', '取得書類', [
      f({ id: 'registryDocs', label: '取得書類', type: 'checkbox-multi',
        options: opts('土地謄本', '公図', '地積測量図', '建物謄本', '建物図面', '地役権図面', '建物未登記'),
        note: note(10), excelRef: '不動産調査シート!B27' })
    ]),
    g('chimoku', '地目・名義', [
      f({ id: 'registeredLandCategory', label: '登記簿上地目', type: 'text', maxLength: 30, excelRef: '不動産調査シート!B28' }),
      f({ id: 'actualLandCategory', label: '現況地目', type: 'text', maxLength: 30, note: note(9), excelRef: '不動産調査シート!B28' }),
      f({ id: 'sellerNameAddressChange', label: '売主住所、氏名変更', type: 'radio', options: YES_NO, note: note(3), excelRef: '不動産調査シート!B28' })
    ]),
    g('soui', '現況との相違・未登記', [
      f({ id: 'kouzuDifference', label: '公図と現況の相違', type: 'radio', options: YES_NO, note: note(10), excelRef: '不動産調査シート!B29' }),
      f({ id: 'addressDifference', label: '所在地、家屋番号相違', type: 'radio', options: YES_NO, note: note(10), excelRef: '不動産調査シート!B29' }),
      f({ id: 'buildingPlanDifference', label: '建物図面と現況の相違', type: 'radio', options: YES_NO, note: note(10), excelRef: '不動産調査シート!B30' }),
      f({ id: 'unregisteredExtension', label: '増築未登記', type: 'radio', options: YES_NO, note: note(10), excelRef: '不動産調査シート!B30' }),
      f({ id: 'garageRegistration', label: '堀込車庫登記', type: 'radio', options: opts('済', '未', '不要'), note: note(10), excelRef: '不動産調査シート!B30' }),
      f({ id: 'warehouseRegistration', label: '外部倉庫登記', type: 'radio', options: opts('済', '未', '不要'), note: note(10), excelRef: '不動産調査シート!B31' }),
      f({ id: 'demolitionRegistration', label: '滅失登記', type: 'radio', options: DONE_NOT, note: note(10), excelRef: '不動産調査シート!B31' })
    ]),
    g('kenri', '権利部(乙区・甲区)', [
      f({ id: 'hasMortgage', label: '(根)抵当権設定[権利部乙区]', type: 'radio', options: YES_NO, note: note(11), excelRef: '不動産調査シート!B31' }),
      f({ id: 'remainingDebt', label: '残債', type: 'number', unit: '万円', min: 0,
        condition: { fieldId: 'hasMortgage', equals: '有' }, excelRef: '不動産調査シート!B32' }),
      f({ id: 'shortfallOwnFunds', label: '不足分自己資金', type: 'number', unit: '万円', min: 0,
        condition: { fieldId: 'hasMortgage', equals: '有' }, excelRef: '不動産調査シート!B32' }),
      f({ id: 'hasSuperficies', label: '地上権', type: 'radio', options: YES_NO, excelRef: '不動産調査シート!B32' }),
      f({ id: 'hasLeasehold', label: '賃借権', type: 'radio', options: YES_NO, excelRef: '不動産調査シート!B32' }),
      f({ id: 'hasSeizure', label: '差押', type: 'radio', options: YES_NO, excelRef: '不動産調査シート!B33' }),
      f({ id: 'hasBankruptcy', label: '破産', type: 'radio', options: YES_NO, excelRef: '不動産調査シート!B33' }),
      f({ id: 'hasRepurchaseClause', label: '買戻特約[権利部甲区]', type: 'radio', options: YES_NO, note: note(11), excelRef: '不動産調査シート!B33' }),
      f({ id: 'hasProvisionalRegistration', label: '仮登記', type: 'radio', options: YES_NO, excelRef: '不動産調査シート!B33' })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 4. 役所調査(2026.3.1シート 2〜39行)
// ---------------------------------------------------------------------------
const cityOffice: SectionDef = {
  id: 'city-office',
  sheetRef: '不動産調査シート2026.3.1 2〜39行',
  title: '役所調査(都市計画法・建築基準法など)',
  stepIndex: 4,
  groups: [
    g('shutoku', '取得書類', [
      f({ id: 'officeDocs', label: '取得書類', type: 'checkbox-multi',
        options: opts(
          '固定資産公課(評価)証明書', '都市計画図', '道路台帳図', '宅造許可証明書', '位置指定図面',
          '開発登録簿(土地利用計画図)', '建築確認概要書', '工作物建確検済(2ｍ超擁壁)',
          'ハザードマップ(洪水・津波・高潮・土砂・ため池)', '地番図'
        ),
        note: `${note(12)} / 建築確認概要書は増築ある場合は増築分も / ${note(13)}`,
        excelRef: '不動産調査シート2026.3.1!B3〜B6' }),
      f({ id: 'positionDesignationNumber', label: '位置指定 指定番号', type: 'text', maxLength: 40,
        condition: { fieldId: 'officeDocs', equals: '位置指定図面' }, excelRef: '不動産調査シート2026.3.1!B4' }),
      f({ id: 'positionDesignationDate', label: '位置指定 年月日', type: 'date',
        condition: { fieldId: 'officeDocs', equals: '位置指定図面' }, excelRef: '不動産調査シート2026.3.1!B4' })
    ]),
    g('keikakudoro', '計画道路他', [
      f({ id: 'planRoad', label: '計画道路', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B7' }),
      f({ id: 'planRoadStage', label: '計画道路の段階', type: 'checkbox-multi', options: opts('1.計画決定', '2.事業決定'),
        condition: { fieldId: 'planRoad', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B7' }),
      f({ id: 'planRoadName', label: '計画道路 名称', type: 'text', maxLength: 60,
        condition: { fieldId: 'planRoad', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B7' }),
      f({ id: 'planRoadWidth', label: '計画道路 幅員', type: 'number', unit: 'ｍ', min: 0,
        condition: { fieldId: 'planRoad', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B7' }),
      f({ id: 'otherCityPlanFacility', label: 'その他の都市計画施設', type: 'text', maxLength: 80, excelRef: '不動産調査シート2026.3.1!B8' }),
      f({ id: 'urbanDevelopmentProject', label: '市街地開発事業', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B8' })
    ]),
    g('youto1', '用途地域①', [
      f({ id: 'zoning', label: '用途地域', type: 'radio',
        options: opts('一低', '二低', '田住', '一中高', '二中高', '一住', '二住', '準住', '近商', '商業', '準工', '工業', '工専', '指定なし(調整)', '都計外'),
        excelRef: '不動産調査シート2026.3.1!B9,B10' })
    ]),
    g('youto2', '用途地域②(調整区域の場合)', [
      f({ id: 'chouseiChecklist', label: '調整区域チェックリスト、フローチャート確認', type: 'radio', options: DONE_NOT,
        condition: { fieldId: 'zoning', equals: '指定なし(調整)' }, excelRef: '不動産調査シート2026.3.1!B11' }),
      f({ id: 'agriculturalPromotionArea', label: '農業振興地域(田畑の場合)', type: 'radio', options: YES_NO,
        condition: { fieldId: 'zoning', equals: '指定なし(調整)' }, excelRef: '不動産調査シート2026.3.1!B12' }),
      f({ id: 'tenantFarmerRight', label: '小作権', type: 'radio', options: YES_NO,
        condition: { fieldId: 'zoning', equals: '指定なし(調整)' }, excelRef: '不動産調査シート2026.3.1!B12' }),
      f({ id: 'personalRequirement', label: '属人性要件', type: 'radio', options: YES_NO, note: '有の場合、許可要件の確認',
        condition: { fieldId: 'zoning', equals: '指定なし(調整)' }, excelRef: '不動産調査シート2026.3.1!B13' })
    ]),
    g('chiiki', '地域地区等', [
      f({ id: 'districts', label: '地域地区等', type: 'checkbox-multi',
        options: opts('防火', '準防火', '22条', '地区計画', '風致地区', 'その他'),
        excelRef: '不動産調査シート2026.3.1!B14,B15' }),
      f({ id: 'districtName', label: '指定地区名', type: 'text', maxLength: 60, excelRef: '不動産調査シート2026.3.1!B14' }),
      f({ id: 'districtPlanName', label: '地区計画 名称', type: 'text', maxLength: 60,
        condition: { fieldId: 'districts', equals: '地区計画' }, excelRef: '不動産調査シート2026.3.1!B14' }),
      f({ id: 'districtOther', label: 'その他(地域地区)', type: 'text', maxLength: 60,
        condition: { fieldId: 'districts', equals: 'その他' }, excelRef: '不動産調査シート2026.3.1!B15' })
    ]),
    g('kenpei', '建蔽容積', [
      f({ id: 'designatedCoverage', label: '指定建蔽率', type: 'number', unit: '%', min: 0, max: 100, excelRef: '不動産調査シート2026.3.1!B16' }),
      f({ id: 'cornerLotRelaxation', label: '角地緩和', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B16' }),
      f({ id: 'currentCoverage', label: '指定建蔽率→現状', type: 'number', unit: '%', min: 0, max: 200, excelRef: '不動産調査シート2026.3.1!B16' }),
      f({ id: 'designatedFar', label: '指定容積率', type: 'number', unit: '%', min: 0, max: 1500, excelRef: '不動産調査シート2026.3.1!B16' }),
      f({ id: 'farCoefficient', label: '容積率 係数', type: 'text', maxLength: 20, excelRef: '不動産調査シート2026.3.1!B16' }),
      f({ id: 'buildingArea', label: '建築面積', type: 'number', unit: '㎡', min: 0,
        note: '※1Fより2Fの面積が広い場合は2F面積で算出', excelRef: '不動産調査シート2026.3.1!B17',
        needsConfirmation: true }),
      f({ id: 'calcCoverage', label: '本物件の建ぺい率(自動計算)', type: 'calc', unit: '%',
        calc: { kind: 'ratio', sourceFieldIds: ['buildingArea', 'seller-info.landArea'], ratioMultiplier: 100 },
        note: '建築面積÷敷地面積。※1Fより2Fの面積が広い場合は2F面積で算出',
        excelRef: '不動産調査シート2026.3.1!B17' }),
      f({ id: 'calcFar', label: '本物件の容積率(自動計算)', type: 'calc', unit: '%',
        calc: { kind: 'ratio', sourceFieldIds: ['seller-info.areaTotal', 'seller-info.landArea'], ratioMultiplier: 100 },
        note: '延床面積÷敷地面積。※前面幅員4m未満の場合は4mとみなし算出 ※増築未登記がある場合は増築後の面積で算出',
        excelRef: '不動産調査シート2026.3.1!B18,B19' }),
      f({ id: 'coverageExceeded', label: '建ぺい超過', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B20' }),
      f({ id: 'farExceeded', label: '容積率超過', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B20' })
    ]),
    g('doro', '道路種別', [
      f({ id: 'roadPublicPrivate', label: '道路区分', type: 'radio', options: opts('公道', '私道'), note: note(12), excelRef: '不動産調査シート2026.3.1!B21,B22' }),
      f({ id: 'privateRoadPermit', label: '私道 通行掘削許可', type: 'radio', options: YES_NO,
        condition: { fieldId: 'roadPublicPrivate', equals: '私道' }, excelRef: '不動産調査シート2026.3.1!B21,B22' }),
      f({ id: 'road1Side', label: '幅員① 方位・位置', type: 'text', maxLength: 30, note: '※幅員は現地計測が必須です。(計測箇所を写真におさめる)役所書類等は参考にしない', excelRef: '不動産調査シート2026.3.1!B21' }),
      f({ id: 'road1Width', label: '幅員①', type: 'number', unit: 'ｍ', min: 0, needsPhoto: true, excelRef: '不動産調査シート2026.3.1!B21' }),
      f({ id: 'road2Side', label: '幅員② 方位・位置', type: 'text', maxLength: 30, excelRef: '不動産調査シート2026.3.1!B21' }),
      f({ id: 'road2Width', label: '幅員②', type: 'number', unit: 'ｍ', min: 0, excelRef: '不動産調査シート2026.3.1!B21' }),
      f({ id: 'road3Side', label: '幅員③ 方位・位置', type: 'text', maxLength: 30, excelRef: '不動産調査シート2026.3.1!B22' }),
      f({ id: 'road3Width', label: '幅員③', type: 'number', unit: 'ｍ', min: 0, excelRef: '不動産調査シート2026.3.1!B22' }),
      f({ id: 'road4Side', label: '幅員④ 方位・位置', type: 'text', maxLength: 30, excelRef: '不動産調査シート2026.3.1!B22' }),
      f({ id: 'road4Width', label: '幅員④', type: 'number', unit: 'ｍ', min: 0, excelRef: '不動産調査シート2026.3.1!B22' }),
      f({ id: 'frontage1', label: '間口①', type: 'number', unit: 'ｍ', min: 0, excelRef: '不動産調査シート2026.3.1!B24' }),
      f({ id: 'frontage1Note', label: '間口①(位置)', type: 'text', maxLength: 30, excelRef: '不動産調査シート2026.3.1!B24' }),
      f({ id: 'frontage2', label: '間口②', type: 'number', unit: 'ｍ', min: 0, excelRef: '不動産調査シート2026.3.1!B24' }),
      f({ id: 'frontage2Note', label: '間口②(位置)', type: 'text', maxLength: 30, excelRef: '不動産調査シート2026.3.1!B24' }),
      f({ id: 'frontage3', label: '間口③', type: 'number', unit: 'ｍ', min: 0, excelRef: '不動産調査シート2026.3.1!B24' }),
      f({ id: 'frontage3Note', label: '間口③(位置)', type: 'text', maxLength: 30, excelRef: '不動産調査シート2026.3.1!B24' }),
      f({ id: 'setbackArea', label: 'セットバック対象面積 約', type: 'number', unit: '㎡', min: 0, excelRef: '不動産調査シート2026.3.1!B24' })
    ]),
    g('doro-kbn', '接道の道路区分(方位別)', [
      f({ id: 'road1Direction', label: '方位①', type: 'text', maxLength: 20, excelRef: '不動産調査シート2026.3.1!B25' }),
      f({ id: 'road1Class', label: '道路区分①', type: 'radio',
        options: opts('1号', '2号', '3号', '4号', '5号', '2項(中心)', '2項(一方)', '43条許可', '非道路'),
        excelRef: '不動産調査シート2026.3.1!B25' }),
      f({ id: 'road2Direction', label: '方位②', type: 'text', maxLength: 20, excelRef: '不動産調査シート2026.3.1!B26' }),
      f({ id: 'road2Class', label: '道路区分②', type: 'radio',
        options: opts('1号', '2号', '3号', '4号', '5号', '2項(中心)', '2項(一方)', '43条許可', '非道路'),
        excelRef: '不動産調査シート2026.3.1!B26' }),
      f({ id: 'road3Direction', label: '方位③', type: 'text', maxLength: 20, excelRef: '不動産調査シート2026.3.1!B27' }),
      f({ id: 'road3Class', label: '道路区分③', type: 'radio',
        options: opts('1号', '2号', '3号', '4号', '5号', '2項(中心)', '2項(一方)', '43条許可', '非道路'),
        excelRef: '不動産調査シート2026.3.1!B27' }),
      f({ id: 'road4Direction', label: '方位④', type: 'text', maxLength: 20, excelRef: '不動産調査シート2026.3.1!B28' }),
      f({ id: 'road4Class', label: '道路区分④', type: 'radio',
        options: opts('1号', '2号', '3号', '4号', '5号', '2項(中心)', '2項(一方)', '43条許可', '非道路'),
        excelRef: '不動産調査シート2026.3.1!B28' })
    ]),
    g('suiro', '水路・前面道路側溝', [
      f({ id: 'waterwayWidth', label: '水路幅', type: 'number', unit: 'm', min: 0, excelRef: '不動産調査シート2026.3.1!B29' }),
      f({ id: 'waterwayOccupancyPermit', label: '占用許可', type: 'radio', options: YES_NO,
        note: '※水路占用許可があることにより接道義務を果たします。ない場合は占用許可取得必要', excelRef: '不動産調査シート2026.3.1!B29' }),
      f({ id: 'waterwayCharge', label: '負担金', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B29' }),
      f({ id: 'waterwayChargeAmount', label: '負担金額', type: 'number', unit: '円/㎡', min: 0,
        condition: { fieldId: 'waterwayCharge', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B29' }),
      f({ id: 'waterAssociation', label: '水利組合及び組合長の確認', type: 'text', maxLength: 80, excelRef: '不動産調査シート2026.3.1!B30' })
    ]),
    g('takasa', '高さ制限等', [
      f({ id: 'wallLineRestriction', label: '壁面線の制限', type: 'radio', options: YES_NO, note: note(14), excelRef: '不動産調査シート2026.3.1!B32' }),
      f({ id: 'minSiteArea', label: '敷地の最低限度', type: 'number', unit: '㎡', min: 0, excelRef: '不動産調査シート2026.3.1!B32' }),
      f({ id: 'exteriorWallSetback', label: '外壁後退', type: 'number', unit: 'm', min: 0, excelRef: '不動産調査シート2026.3.1!B32' }),
      f({ id: 'absoluteHeight', label: '絶対高さ', type: 'radio', options: opts('10m', '12m', '制限なし'), excelRef: '不動産調査シート2026.3.1!B33' }),
      f({ id: 'roadSlopeLimit', label: '道路斜線', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B33' }),
      f({ id: 'neighborSlopeLimit', label: '隣地斜線', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B33' }),
      f({ id: 'northSlopeLimit', label: '北側斜線', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B33' }),
      f({ id: 'shadowRegulation', label: '日影規制', type: 'text', unit: '種', maxLength: 20, excelRef: '不動産調査シート2026.3.1!B34' }),
      f({ id: 'buildingAgreement', label: '建築協定', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B34' }),
      f({ id: 'localOrdinance', label: '地方公共団体の条例等による制限', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B34' })
    ]),
    g('kukaku', '土地区画整理法', [
      f({ id: 'landReadjustment', label: '土地区画整理法に基づく制限', type: 'radio', options: YES_NO,
        note: '※有の場合は重説表記を参考に調査すること', excelRef: '不動産調査シート2026.3.1!B35' })
    ]),
    g('hourei', 'その他法令', [
      f({ id: 'otherLaws', label: 'その他法令', type: 'checkbox-multi',
        options: opts(
          '6.景観法', '24.農地法', '25.宅地造成及び特定盛土等規制法', '38.津波防災地域づくりに関する法律',
          '42.土砂災害防止対策推進法', '49.文化財保護法', '51.国土利用計画法届出', '54.土壌汚染対策法',
          '55.都市再生特別措置法', '屋外広告物条例', '河川法', '水防法'
        ),
        note: `${note(9)} / ${note(15)} / ${note(16)}`,
        excelRef: '不動産調査シート2026.3.1!A37〜A39' }),
      f({ id: 'kokudoNotification', label: '国土利用計画法届出', type: 'radio', options: NEED_NOT, note: note(15),
        condition: { fieldId: 'otherLaws', equals: '51.国土利用計画法届出' }, excelRef: '不動産調査シート2026.3.1!A38' }),
      f({ id: 'toshiSaiseiGuide', label: '都市誘導', type: 'radio', options: opts('内', '外'),
        condition: { fieldId: 'otherLaws', equals: '55.都市再生特別措置法' }, excelRef: '不動産調査シート2026.3.1!A39' }),
      f({ id: 'toshiSaiseiResidence', label: '居住誘導', type: 'radio', options: opts('内', '外'),
        condition: { fieldId: 'otherLaws', equals: '55.都市再生特別措置法' }, excelRef: '不動産調査シート2026.3.1!A39' })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 5. 飲用水・電気・ガスの供給施設および排水施設(2026.3.1シート 40〜53行)
// ---------------------------------------------------------------------------
const utilities: SectionDef = {
  id: 'utilities',
  sheetRef: '不動産調査シート2026.3.1 40〜53行',
  title: '飲用水・電気・ガス・排水施設',
  stepIndex: 5,
  groups: [
    g('shutoku', '取得書類', [
      f({ id: 'utilityDocs', label: '取得書類', type: 'checkbox-multi',
        options: opts('上水道台帳', '下水道台帳', '浄化槽排水経路図', 'ガス配管図'),
        note: '※下部、別シートの設備状況写真も提出必須', excelRef: '不動産調査シート2026.3.1!B42' })
    ]),
    g('inyosui', '飲用水', [
      f({ id: 'waterSupply', label: '飲用水', type: 'radio', options: opts('公営', '私営', '井戸'), excelRef: '不動産調査シート2026.3.1!B43' }),
      f({ id: 'privatePipe', label: '私設管', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B43' }),
      f({ id: 'inletDiameter', label: '引込管口径', type: 'number', unit: 'ｍｍ', min: 0, needsPhoto: true, excelRef: '不動産調査シート2026.3.1!B43' }),
      f({ id: 'meterRight', label: 'メーター権利', type: 'number', unit: 'ｍｍ', min: 0, excelRef: '不動産調査シート2026.3.1!B44' }),
      f({ id: 'onSiteMeter', label: '現地メーター', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B44' }),
      f({ id: 'meterUserOwner', label: 'メーター使用者/所有者', type: 'radio', options: opts('適', '非'), excelRef: '不動産調査シート2026.3.1!B44' })
    ]),
    g('denki', '電気', [
      f({ id: 'utilityPole', label: '敷地内電柱', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B45' }),
      f({ id: 'powerCapacity', label: '電力', type: 'number', unit: 'A', min: 0, excelRef: '不動産調査シート2026.3.1!B45' }),
      f({ id: 'internet', label: 'ネット', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B45' }),
      f({ id: 'electricEasement', label: '地役権', type: 'radio', options: YES_NO, note: note(17), excelRef: '不動産調査シート2026.3.1!B45' }),
      f({ id: 'allElectric', label: 'オール電化', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B45' }),
      f({ id: 'antenna', label: 'アンテナ', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B46' }),
      f({ id: 'antennaBs', label: 'BS', type: 'radio', options: YES_NO,
        condition: { fieldId: 'antenna', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B46' }),
      f({ id: 'cableTv', label: 'ケーブルテレビ', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B46' }),
      f({ id: 'cableTvFee', label: 'ケーブルテレビ費用', type: 'number', unit: '円/月', min: 0,
        condition: { fieldId: 'cableTv', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B46' })
    ]),
    g('taiyoko', '太陽光', [
      f({ id: 'solar', label: '太陽光', type: 'radio', options: opts('無', '有'), note: note(18), excelRef: '不動産調査シート2026.3.1!B47' }),
      f({ id: 'solarCapacity', label: '搭載容量', type: 'number', unit: 'kw', min: 0,
        condition: { fieldId: 'solar', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B47' }),
      f({ id: 'solarContractFrom', label: '契約期間(開始)', type: 'date',
        condition: { fieldId: 'solar', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B47' }),
      f({ id: 'solarContractTo', label: '契約期間(終了)', type: 'date',
        condition: { fieldId: 'solar', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B47' }),
      f({ id: 'solarUnitPrice', label: '売電単価', type: 'number', unit: '円', min: 0,
        condition: { fieldId: 'solar', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B48' })
    ]),
    g('gas', 'ガス', [
      f({ id: 'gasType', label: 'ガス', type: 'radio', options: opts('都市ガス', 'LPガス'), excelRef: '不動産調査シート2026.3.1!B49' }),
      f({ id: 'lpCompany', label: 'LPガス 会社名', type: 'text', maxLength: 60,
        condition: { fieldId: 'gasType', equals: 'LPガス' }, excelRef: '不動産調査シート2026.3.1!B49' }),
      f({ id: 'lpContact', label: 'LPガス 連絡先', type: 'text', maxLength: 60,
        condition: { fieldId: 'gasType', equals: 'LPガス' }, excelRef: '不動産調査シート2026.3.1!B49' })
    ]),
    g('haisui', '汚水・雑排水', [
      f({ id: 'drainageType', label: '汚水・雑排水', type: 'radio', options: opts('下水道', '浄化槽', '汲取式'), note: note(19), excelRef: '不動産調査シート2026.3.1!B50〜B53' }),
      f({ id: 'beneficiaryCharge', label: '受益者負担金', type: 'radio', options: DONE_NOT,
        condition: { fieldId: 'drainageType', equals: '下水道' }, excelRef: '不動産調査シート2026.3.1!B50' }),
      f({ id: 'beneficiaryChargeUnit', label: '受益者負担金 ㎡単価', type: 'number', unit: '円',
        condition: { fieldId: 'beneficiaryCharge', equals: '未' }, excelRef: '不動産調査シート2026.3.1!B50' }),
      f({ id: 'sewerUsageConfirm', label: '下水道使用料(接続)確認', type: 'radio', options: YES_NO,
        condition: { fieldId: 'drainageType', equals: '下水道' }, excelRef: '不動産調査シート2026.3.1!B50' }),
      f({ id: 'jokasoScope', label: '浄化槽 集中/個別', type: 'radio', options: opts('集中', '個別'),
        condition: { fieldId: 'drainageType', equals: '浄化槽' }, excelRef: '不動産調査シート2026.3.1!B51' }),
      f({ id: 'jokasoType', label: '浄化槽 合併/単独', type: 'radio', options: opts('合併', '単独'),
        condition: { fieldId: 'drainageType', equals: '浄化槽' }, excelRef: '不動産調査シート2026.3.1!B51' }),
      f({ id: 'jokasoInstallable', label: '浄化槽設置', type: 'radio', options: opts('可', '不可'),
        condition: { fieldId: 'drainageType', equals: '浄化槽' }, excelRef: '不動産調査シート2026.3.1!F51' }),
      f({ id: 'jokasoCompany', label: '浄化槽管理会社', type: 'text', maxLength: 60,
        condition: { fieldId: 'drainageType', equals: '浄化槽' }, excelRef: '不動産調査シート2026.3.1!B52' }),
      f({ id: 'jokasoContact', label: '浄化槽管理会社 連絡先', type: 'text', maxLength: 60,
        condition: { fieldId: 'drainageType', equals: '浄化槽' }, excelRef: '不動産調査シート2026.3.1!B52' }),
      f({ id: 'kumitoriCompany', label: '汲取式 管理会社', type: 'text', maxLength: 60,
        condition: { fieldId: 'drainageType', equals: '汲取式' }, excelRef: '不動産調査シート2026.3.1!B53' }),
      f({ id: 'kumitoriContact', label: '汲取式 連絡先', type: 'text', maxLength: 60,
        condition: { fieldId: 'drainageType', equals: '汲取式' }, excelRef: '不動産調査シート2026.3.1!B53' })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 6. 周辺環境他(2026.3.1シート 54〜67行 / 地盤補強のみ旧版シート A80)
// ---------------------------------------------------------------------------
const surroundings: SectionDef = {
  id: 'surroundings',
  sheetRef: '不動産調査シート2026.3.1 54〜67行',
  title: '周辺環境他',
  stepIndex: 6,
  wallSurveyTrigger: true,
  groups: [
    g('cb', 'C.B(コンクリートブロック)', [
      f({ id: 'cbHeight', label: 'C.B 高さ', type: 'number', unit: 'm', min: 0,
        note: '※CBは高さ1.2ｍ、ブロック6段、厚さ0.12ｍまでＯＫ', excelRef: '不動産調査シート2026.3.1!B55' }),
      f({ id: 'cbThickness', label: 'C.B 厚さ', type: 'number', unit: 'm', min: 0, excelRef: '不動産調査シート2026.3.1!B55' }),
      f({ id: 'cbBraceRequired', label: '控え壁', type: 'radio', options: NEED_NOT, excelRef: '不動産調査シート2026.3.1!B55' }),
      f({ id: 'cbBraceExists', label: '控え壁の有無', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B55' }),
      f({ id: 'cbRebar', label: '鉄筋', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B55' }),
      f({ id: 'cbFoundation', label: '基礎', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B55' })
    ]),
    g('yoheki', '擁壁', [
      f({ id: 'hasWall', label: '擁壁', type: 'radio', options: YES_NO,
        note: '※擁壁がある場合は擁壁調査シートの提出が必須です(「有」で擁壁調査が入力対象になります)',
        excelRef: '不動産調査シート2026.3.1!A57,B57' }),
      f({ id: 'heightDifference', label: '周辺高低差', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B58' }),
      f({ id: 'groundBelowHeight', label: '地盤下高さ', type: 'number', unit: 'm', min: 0,
        condition: { fieldId: 'heightDifference', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B58' }),
      f({ id: 'groundAboveHeight', label: '地盤上高さ', type: 'number', unit: 'm', min: 0,
        condition: { fieldId: 'heightDifference', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B58' }),
      f({ id: 'wallKinds', label: '擁壁の種類', type: 'checkbox-multi',
        options: opts('石積擁壁', 'コンクリート擁壁', '旧住宅地造成事業エリアの該当'),
        excelRef: '不動産調査シート2026.3.1!B59' }),
      f({ id: 'concreteWallInspection', label: 'コンクリート擁壁 建確検済', type: 'radio', options: YES_NO, note: note(13),
        condition: { fieldId: 'wallKinds', equals: 'コンクリート擁壁' }, excelRef: '不動産調査シート2026.3.1!B59' })
    ]),
    g('gake', 'がけ条例', [
      f({ id: 'cliffOrdinance', label: 'がけ条例', type: 'radio', options: YES_NO,
        note: '※高低差が2m超の場合、各行政にてがけ地に関する条例有り', excelRef: '不動産調査シート2026.3.1!B60' })
    ]),
    g('jiban', '地盤補強', [
      f({ id: 'groundReinforcement', label: '地盤補強', type: 'radio',
        options: opts('無', '柱状改良', '鋼管杭', '砕石工法', 'ベタ', 'その他'),
        note: `${note(20)} / この項目は2026.3.1シートには無く旧版シートA80から採用`,
        needsConfirmation: true, excelRef: '不動産調査シート(旧版)!A80,B80' }),
      f({ id: 'groundReinforcementOther', label: '地盤補強(その他)', type: 'text', maxLength: 60,
        condition: { fieldId: 'groundReinforcement', equals: 'その他' }, excelRef: '不動産調査シート(旧版)!B80' })
    ]),
    g('chonaikai', '町内会・ゴミステーション', [
      f({ id: 'chonaikaiFee', label: '町内会費', type: 'number', unit: '円/年', min: 0, excelRef: '不動産調査シート2026.3.1!B61' }),
      f({ id: 'chonaikaiHead', label: '町内会長', type: 'text', maxLength: 40, excelRef: '不動産調査シート2026.3.1!B61' }),
      f({ id: 'gomiLocationConfirmed', label: 'ゴミステーション 位置確認(地図へ記載)', type: 'radio', options: DONE_NOT, excelRef: '不動産調査シート2026.3.1!B62' })
    ]),
    g('rinka', '隣家訪問', [
      ...[1, 2, 3, 4].flatMap((i) => [
        f({ id: `neighbor${i}Side`, label: `隣家${i} 方位(側)`, type: 'text', maxLength: 20, excelRef: `不動産調査シート2026.3.1!B${63 + i}` }),
        f({ id: `neighbor${i}Name`, label: `隣家${i} 氏名(様宅)`, type: 'text', maxLength: 40, excelRef: `不動産調査シート2026.3.1!B${63 + i}` }),
        f({ id: `neighbor${i}Visited`, label: `隣家${i} 訪問`, type: 'radio', options: DONE_NOT, excelRef: `不動産調査シート2026.3.1!B${63 + i}` }),
        f({ id: `neighbor${i}Note`, label: `隣家${i} 特記`, type: 'textarea', maxLength: 300, excelRef: `不動産調査シート2026.3.1!B${63 + i}` })
      ])
    ])
  ]
};

// ---------------------------------------------------------------------------
// 7. マンション調査事項(2026.3.1シート 68〜74行)
// ---------------------------------------------------------------------------
const mansion: SectionDef = {
  id: 'mansion',
  sheetRef: '不動産調査シート2026.3.1 68〜74行',
  title: 'マンション調査事項',
  stepIndex: 7,
  groups: [
    g('docs', '売主取得書類', [
      f({ id: 'mansionDocs', label: '売主取得書類', type: 'checkbox-multi',
        options: opts('管理規約', '長期修繕計画', '総会議事録', '議案書'),
        note: '重要事項調査報告書を参照して記入', excelRef: '不動産調査シート2026.3.1!B69' })
    ]),
    g('kanrihi', '管理費等', [
      f({ id: 'feeIncrease', label: '値上がり', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B70' }),
      f({ id: 'feeIncreaseTime', label: '値上がり 時期', type: 'text', maxLength: 40,
        condition: { fieldId: 'feeIncrease', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B70' }),
      f({ id: 'feeIncreaseAmount', label: '値上がり 金額', type: 'number', unit: '円', min: 0,
        condition: { fieldId: 'feeIncrease', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B70' }),
      f({ id: 'feeArrears', label: '滞納', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B70' })
    ]),
    g('parking', '駐車場関係', [
      f({ id: 'parkingVacancy', label: '駐車場 空き', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B71' }),
      f({ id: 'parkingVacancyCount', label: '駐車場 空き台数', type: 'number', unit: '台', min: 0,
        condition: { fieldId: 'parkingVacancy', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B71' }),
      f({ id: 'parkingCheckDate', label: '駐車場 確認年月日', type: 'date', excelRef: '不動産調査シート2026.3.1!B71' }),
      f({ id: 'parkingFee', label: '駐車場 料金', type: 'number', unit: '円/月', min: 0, excelRef: '不動産調査シート2026.3.1!B71' })
    ]),
    g('bicycle', '駐輪場', [
      f({ id: 'bicycleVacancy', label: '駐輪場 空き', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B72' }),
      f({ id: 'bicycleVacancyCount', label: '駐輪場 空き台数', type: 'number', unit: '台', min: 0,
        condition: { fieldId: 'bicycleVacancy', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B72' }),
      f({ id: 'bicycleCheckDate', label: '駐輪場 確認年月日', type: 'date', excelRef: '不動産調査シート2026.3.1!B72' }),
      f({ id: 'bicycleFee', label: '駐輪場 料金', type: 'number', unit: '円/月', min: 0, excelRef: '不動産調査シート2026.3.1!B72' })
    ]),
    g('other', 'その他', [
      f({ id: 'majorRepairPlan', label: '大規模修繕予定', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B73' }),
      f({ id: 'majorRepairTime', label: '大規模修繕 時期', type: 'text', maxLength: 40,
        condition: { fieldId: 'majorRepairPlan', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B73' }),
      f({ id: 'majorRepairCharge', label: '特別負担金', type: 'number', unit: '円', min: 0,
        condition: { fieldId: 'majorRepairPlan', equals: '有' }, excelRef: '不動産調査シート2026.3.1!B73' }),
      f({ id: 'seismicDiagnosis', label: '耐震診断', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B73' }),
      f({ id: 'pet', label: 'ペット', type: 'radio', options: opts('可', '否'), excelRef: '不動産調査シート2026.3.1!B74' }),
      f({ id: 'bulkPower', label: '一括受電', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B74' }),
      f({ id: 'asbestosSurvey', label: 'アスベスト調査', type: 'radio', options: YES_NO, excelRef: '不動産調査シート2026.3.1!B74' })
    ])
  ]
};

export const SECTIONS: SectionDef[] = [
  sellerInfo,
  propertyRights,
  registry,
  cityOffice,
  utilities,
  surroundings,
  mansion
];

export function getSectionById(id: string): SectionDef | undefined {
  return SECTIONS.find((s) => s.id === id);
}

/**
 * 設備現況写真の区分。
 * 元Excel「設備現況写真」シートは写真枠6つ(上水道/メーター/汚水/雨水/ガス/電気)だが、
 * 同シートK・L列の撮影注意事項は【上水】【下水】【浄化槽】【雨水】【ガス】について
 * 記載されているため、下水・浄化槽・その他設備の枠を追加している(要確認)。
 */
export const PHOTO_CATEGORIES: {
  key: string;
  label: string;
  note: string;
  inExcelForm: boolean;
}[] = [
  {
    key: 'suido',
    label: '上水道',
    inExcelForm: true,
    note:
      '・道路、隣地からの位置が分かるようにメーターボックスを写す(越境の有無)\n' +
      '　引込がない場合は【引込無し】と記入\n' +
      '・引込が私設共有管かどうかの確認\n' +
      '・私設共有管の場合、何件の共有、共有管の経路(他人地通過の有無)\n' +
      '・私設共有管の場合、引き直しを行う場合は原則本管からの引き直しが必要。\n' +
      '　またメーターの増径には共有者の同意必要(＝現実的には難しい、引き直し)'
  },
  {
    key: 'meter',
    label: 'メーター',
    inExcelForm: true,
    note:
      '・メーターボックスを開けて口径が分かるように写す\n' +
      '　メーターがない場合は【メーター無し】と記入\n' +
      '・メーター13mmの場合は要注意、分担金の有無、金額調査'
  },
  {
    key: 'osui',
    label: '汚水',
    inExcelForm: true,
    note:
      '【下水】\n' +
      '・道路からの位置が分かるように最終枡(マンホール)を写す(越境の有無)\n' +
      '・役所の配管図に引込経路の記載がない場合や、引込マークの数が土地の件数と合わない場合は現地詳細調査が必要\n' +
      '・共有かどうか、排水経路の確認手順\n' +
      '①敷地内の全ての枡を開け配管の方向確認(隣地方向からの配管があれば共有の可能性大)\n' +
      '②各汚水桝のふたを開け、共有と思われる隣地等に声をかけ、風呂キッチン等で水を流してもらい、流れる経路を確認する(石鹸水を流すと泡立ちわかりやすい)'
  },
  {
    key: 'usui',
    label: '雨水',
    inExcelForm: true,
    note:
      '・分流か合流かの確認\n' +
      '・道路からの位置が分かるようにマンホールまたは雨水桝を写す\n' +
      '　配管から直接側溝に流している場合は配管と側溝部分の写真\n' +
      '①敷地内の全ての枡を開け配管の方向確認(隣地方向からの配管があれば共有の可能性大)'
  },
  {
    key: 'gas',
    label: 'ガス',
    inExcelForm: true,
    note:
      '・都市ガスで土地の場合は道路際のピン、戸建てはメーター\n' +
      '　プロパンは会社名が分かるようにボンベを写す'
  },
  {
    key: 'denki',
    label: '電気',
    inExcelForm: true,
    note: '・引込線・メーター・契約容量表示が分かるように撮影してください。'
  },
  {
    key: 'gesui',
    label: '下水(最終枡・マンホール)',
    inExcelForm: false,
    note:
      '・道路からの位置が分かるように最終枡(マンホール)を写す(越境の有無)\n' +
      '・役所の配管図に引込経路の記載がない場合や、引込マークの数が土地の件数と合わない場合は現地詳細調査が必要'
  },
  {
    key: 'jokaso',
    label: '浄化槽',
    inExcelForm: false,
    note: '・浄化槽の場合はブロワの写真、汲取りの場合は臭突の写真'
  },
  {
    key: 'other',
    label: 'その他設備',
    inExcelForm: false,
    note: '・上記区分に該当しない設備の現況が分かるように撮影してください。'
  }
];

/** 設備現況写真シートの共通注意事項(K4,K5,K40,K41) */
export const PHOTO_SHEET_NOTES = [
  '写真撮影は受託時が基本です。店長が受託した場合も店長自ら撮影してください',
  '※契約審査時、枠内に収まらない場合は別途写真を添付する',
  '※上下水の引込が共有の場合は重説備考欄にて、引き直し方法、維持管理、掘削同意の必要可否、費用負担の説明が必要'
];

/** 設備現況写真シート下部の免責文(A42)。築年数は案件ごとに入力する */
export const PHOTO_DISCLAIMER_TEMPLATE =
  '※撮影日現在の現況写真であり、配管等の性能を保証するものではありません。' +
  '築年数が{years}年経過しており老朽化している可能性があります。' +
  '万一、取替えが必要となった場合その費用は買主負担となります。';
