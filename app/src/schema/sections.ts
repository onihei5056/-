import type { FieldDef, SectionDef, SubGroup } from '../types';

/**
 * ============================================================================
 * 項目定義スキーマ(仮)
 * ----------------------------------------------------------------------------
 * 本ファイルは「不動産調査シート_2026.3.1.xlsx」を分析して作成する予定だったが、
 * セッション開始時点で当該Excelファイルの実体が提供されなかったため、
 * ユーザーの指示に基づき「一般的な不動産現地調査シートの標準様式」を仮定義として
 * 実装している(AskUserQuestionでの確認結果: 「ファイルなしで一般的な様式で進める」)。
 *
 * そのため、本ファイル内の全項目(ラベル文言・選択肢・単位・要否・並び順)は
 * 「要確認」対象である。実際のExcelが提供され次第、本ファイルと
 * docs/item-definitions.md / docs/mapping-table.md / docs/open-issues.md を
 * 突き合わせて修正すること。個々のfield定義には excelRef と
 * needsConfirmation:true を自動付与し、画面上・PDF上でも要確認である旨が
 * 追跡できるようにしている。
 * ============================================================================
 */

let uidSeq = 0;
function nextId(prefix: string) {
  uidSeq += 1;
  return `${prefix}`;
}
void nextId;

function f(def: FieldDef): FieldDef {
  return {
    excelRef: '要確認(元Excel未提供のため一般様式で仮定義)',
    needsConfirmation: true,
    ...def
  };
}

function g(id: string, title: string, fields: FieldDef[]): SubGroup {
  return { id, title, fields };
}

// ---------------------------------------------------------------------------
// 3. 物件基本情報
// ---------------------------------------------------------------------------
const propertyBasic: SectionDef = {
  id: 'property-basic',
  sheetRef: '不動産調査シート(仮) / 物件基本情報',
  title: '物件基本情報',
  stepIndex: 3,
  groups: [
    g('kibon', '物件基本情報', [
      f({ id: 'propertyType', label: '物件種別', type: 'radio', required: true,
        options: [
          { value: 'land', label: '土地' },
          { value: 'house', label: '一戸建て' },
          { value: 'apartment', label: '区分マンション' },
          { value: 'other', label: 'その他' }
        ] }),
      f({ id: 'caseName', label: '案件名', type: 'text', required: true, maxLength: 60 }),
      f({ id: 'address', label: '物件所在地', type: 'text', required: true, maxLength: 200 }),
      f({ id: 'surveyDate', label: '調査日', type: 'date', required: true }),
      f({ id: 'surveyor', label: '調査担当者', type: 'text', required: true, maxLength: 40 }),
      f({ id: 'weather', label: '天候', type: 'select',
        options: [
          { value: 'sunny', label: '晴' }, { value: 'cloudy', label: '曇' },
          { value: 'rainy', label: '雨' }, { value: 'snowy', label: '雪' }
        ] })
    ]),
    g('chiban', '地番、家屋番号、住居表示', [
      f({ id: 'chiban', label: '地番', type: 'text', maxLength: 30 }),
      f({ id: 'kaokuBango', label: '家屋番号', type: 'text', maxLength: 30 }),
      f({ id: 'jukyoHyoji', label: '住居表示', type: 'text', maxLength: 100 })
    ]),
    g('kenchikuYmd', '建築年月日', [
      f({ id: 'kenchikuDate', label: '建築年月日', type: 'date' }),
      f({ id: 'kenchikuDateUnknown', label: '建築年月日不明', type: 'radio',
        options: [{ value: 'yes', label: '不明' }, { value: 'no', label: '判明' }] }),
      f({ id: 'kozo', label: '構造', type: 'checkbox-multi',
        options: [
          { value: 'wood', label: '木造' }, { value: 'steel', label: '鉄骨造' },
          { value: 'rc', label: 'RC造' }, { value: 'src', label: 'SRC造' },
          { value: 'other', label: 'その他' }
        ] }),
      f({ id: 'floorsAbove', label: '地上階数', type: 'number', unit: '階', min: 0, max: 60 }),
      f({ id: 'floorsBelow', label: '地下階数', type: 'number', unit: '階', min: 0, max: 10 })
    ]),
    g('menseki', '土地・建物の面積', [
      f({ id: 'landArea', label: '敷地面積(公簿)', type: 'number', unit: '㎡', min: 0 }),
      f({ id: 'landAreaJissoku', label: '敷地面積(実測)', type: 'number', unit: '㎡', min: 0 }),
      f({ id: 'areaB1', label: '地階床面積', type: 'number', unit: '㎡', min: 0 }),
      f({ id: 'area1F', label: '1階床面積', type: 'number', unit: '㎡', min: 0 }),
      f({ id: 'area2F', label: '2階床面積', type: 'number', unit: '㎡', min: 0 }),
      f({ id: 'area3F', label: '3階以上床面積', type: 'number', unit: '㎡', min: 0 }),
      f({ id: 'totalFloorArea', label: '延床面積合計(自動計算)', type: 'calc', unit: '㎡',
        calc: { kind: 'sum', sourceFieldIds: ['areaB1', 'area1F', 'area2F', 'area3F'] } }),
      f({ id: 'buildingArea', label: '建築面積', type: 'number', unit: '㎡', min: 0 })
    ]),
    g('hyoka', '土地、建物、固定資産税等の評価額', [
      f({ id: 'kotei_land', label: '固定資産税評価額(土地)', type: 'number', unit: '円', min: 0 }),
      f({ id: 'kotei_building', label: '固定資産税評価額(建物)', type: 'number', unit: '円', min: 0 }),
      f({ id: 'rosenka', label: '相続税路線価', type: 'number', unit: '円/㎡', min: 0 }),
      f({ id: 'koteiShisanZeigaku', label: '固定資産税・都市計画税(年額)', type: 'number', unit: '円/年', min: 0 })
    ]),
    g('kyokai', '境界明示', [
      f({ id: 'boundaryStatus', label: '境界明示', type: 'radio', required: true,
        options: [{ value: 'clear', label: '明示済' }, { value: 'unclear', label: '未明示' }, { value: 'partial', label: '一部未明示' }] }),
      f({ id: 'boundaryNote', label: '境界に関する備考', type: 'textarea', maxLength: 500 })
    ]),
    g('mansion', 'マンション調査事項', [
      f({ id: 'mgmtCompany', label: '管理会社', type: 'text', maxLength: 60,
        condition: { fieldId: 'propertyType', equals: 'apartment' } }),
      f({ id: 'mgmtFee', label: '管理費', type: 'number', unit: '円/月', min: 0,
        condition: { fieldId: 'propertyType', equals: 'apartment' } }),
      f({ id: 'repairFund', label: '修繕積立金', type: 'number', unit: '円/月', min: 0,
        condition: { fieldId: 'propertyType', equals: 'apartment' } }),
      f({ id: 'repairFundBalance', label: '修繕積立金残高', type: 'number', unit: '円', min: 0,
        condition: { fieldId: 'propertyType', equals: 'apartment' } }),
      f({ id: 'longTermRepairPlan', label: '長期修繕計画の有無', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }],
        condition: { fieldId: 'propertyType', equals: 'apartment' } }),
      f({ id: 'mgmtForm', label: '管理形態', type: 'select',
        options: [{ value: 'zenkan', label: '全部委託' }, { value: 'bubun', label: '一部委託' }, { value: 'jichi', label: '自主管理' }],
        condition: { fieldId: 'propertyType', equals: 'apartment' } }),
      f({ id: 'petAllowed', label: 'ペット飼育', type: 'radio',
        options: [{ value: 'yes', label: '可' }, { value: 'no', label: '不可' }],
        condition: { fieldId: 'propertyType', equals: 'apartment' } })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 4. 売主および権利関係
// ---------------------------------------------------------------------------
const sellerRights: SectionDef = {
  id: 'seller-rights',
  sheetRef: '不動産調査シート(仮) / 売主・権利関係',
  title: '売主および権利関係',
  stepIndex: 4,
  groups: [
    g('mendan', '売主および面談情報', [
      f({ id: 'sellerName', label: '売主氏名', type: 'text', required: true, maxLength: 60 }),
      f({ id: 'sellerContact', label: '売主連絡先', type: 'text', maxLength: 60 }),
      f({ id: 'mendanDate', label: '面談日', type: 'date' }),
      f({ id: 'mendanPlace', label: '面談場所', type: 'text', maxLength: 60 }),
      f({ id: 'mendanAttendee', label: '同席者', type: 'text', maxLength: 60 })
    ]),
    g('meigi', '登記名義人の現況', [
      f({ id: 'meigiSameAsSeller', label: '登記名義人=売主', type: 'radio',
        options: [{ value: 'yes', label: '同一' }, { value: 'no', label: '異なる' }] }),
      f({ id: 'meigiName', label: '登記名義人氏名', type: 'text', maxLength: 60,
        condition: { fieldId: 'meigiSameAsSeller', equals: 'no' } }),
      f({ id: 'meigiRelation', label: '売主との関係', type: 'text', maxLength: 40,
        condition: { fieldId: 'meigiSameAsSeller', equals: 'no' } }),
      f({ id: 'meigiStatus', label: '名義人の現況', type: 'select',
        options: [{ value: 'alive', label: 'ご存命' }, { value: 'deceased_unregistered', label: '死亡・未相続登記' }, { value: 'deceased_registered', label: '死亡・相続登記済' }] })
    ]),
    g('baikyaku', '売却理由', [
      f({ id: 'saleReason', label: '売却理由', type: 'checkbox-multi',
        options: [
          { value: 'souzoku', label: '相続' }, { value: 'kaitakae', label: '住み替え' },
          { value: 'shikin', label: '資金化' }, { value: 'rikon', label: '離婚' },
          { value: 'kaigo', label: '介護・施設入居' }, { value: 'other', label: 'その他' }
        ] }),
      f({ id: 'saleReasonNote', label: '売却理由 補足', type: 'textarea', maxLength: 500 })
    ]),
    g('akiya', '空家期間、従前の利用方法、管理状況', [
      f({ id: 'isVacant', label: '空家の有無', type: 'radio', required: true,
        options: [{ value: 'yes', label: '空家' }, { value: 'no', label: '居住中' }] }),
      f({ id: 'vacantSince', label: '空家期間(開始)', type: 'date',
        condition: { fieldId: 'isVacant', equals: 'yes' } }),
      f({ id: 'vacantMonths', label: '空家期間', type: 'number', unit: 'ヶ月', min: 0,
        condition: { fieldId: 'isVacant', equals: 'yes' } }),
      f({ id: 'previousUse', label: '従前の利用方法', type: 'select',
        options: [{ value: 'jitaku', label: '自宅' }, { value: 'chintai', label: '賃貸' }, { value: 'jimusho', label: '事務所・店舗' }, { value: 'sonota', label: 'その他' }] }),
      f({ id: 'managementStatus', label: '管理状況', type: 'radio', required: true,
        options: [{ value: 'good', label: '良好' }, { value: 'normal', label: '普通' }, { value: 'bad', label: '不良' }] }),
      f({ id: 'managementNote', label: '管理状況 備考', type: 'textarea', maxLength: 500 })
    ]),
    g('taikyo', '居住中の場合の引越先、退去時期', [
      f({ id: 'moveDestination', label: '引越先', type: 'text', maxLength: 100,
        condition: { fieldId: 'isVacant', equals: 'no' } }),
      f({ id: 'moveOutDate', label: '退去予定時期', type: 'date',
        condition: { fieldId: 'isVacant', equals: 'no' } })
    ]),
    g('zanchi', '残置物', [
      f({ id: 'hasLeftover', label: '残置物の有無', type: 'radio', required: true,
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'leftoverHandling', label: '残置物の処分方法', type: 'radio',
        options: [{ value: 'seller_dispose', label: '売主処分' }, { value: 'as_is', label: '現況渡し' }],
        condition: { fieldId: 'hasLeftover', equals: 'yes' } }),
      f({ id: 'leftoverDetail', label: '残置物の内容', type: 'textarea', maxLength: 500,
        condition: { fieldId: 'hasLeftover', equals: 'yes' } })
    ]),
    g('daisansha', '第三者占有', [
      f({ id: 'hasOccupant', label: '第三者占有の有無', type: 'radio', required: true,
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'occupantType', label: '占有の種類', type: 'radio',
        options: [{ value: 'chintaishaku', label: '賃貸借' }, { value: 'shiyoutaishaku', label: '使用貸借' }],
        condition: { fieldId: 'hasOccupant', equals: 'yes' } }),
      f({ id: 'occupantPeriod', label: '契約期間', type: 'text', maxLength: 60,
        condition: { fieldId: 'hasOccupant', equals: 'yes' } }),
      f({ id: 'occupantName', label: '占有者氏名', type: 'text', maxLength: 60,
        condition: { fieldId: 'hasOccupant', equals: 'yes' } }),
      f({ id: 'occupantAddress', label: '占有者住所', type: 'text', maxLength: 100,
        condition: { fieldId: 'hasOccupant', equals: 'yes' } }),
      f({ id: 'occupantContract', label: '契約書の有無', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }],
        condition: { fieldId: 'hasOccupant', equals: 'yes' } }),
      f({ id: 'occupantArrears', label: '滞納の有無', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }],
        condition: { fieldId: 'hasOccupant', equals: 'yes' } })
    ]),
    g('futekigo', '契約不適合、見積依頼', [
      f({ id: 'defectHistory', label: '契約不適合(告知事項)の有無', type: 'radio', required: true,
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'defectDetail', label: '告知事項の内容', type: 'textarea', maxLength: 800,
        condition: { fieldId: 'defectHistory', equals: 'yes' } }),
      f({ id: 'needsEstimate', label: '見積依頼の要否', type: 'radio',
        options: [{ value: 'yes', label: '要' }, { value: 'no', label: '不要' }] }),
      f({ id: 'estimateTarget', label: '見積依頼先・内容', type: 'textarea', maxLength: 300,
        condition: { fieldId: 'needsEstimate', equals: 'yes' } })
    ]),
    g('hokan', '保管書類', [
      f({ id: 'hasKenrisho', label: '権利証・登記識別情報', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'hasJissokuzu', label: '実測図・確定測量図', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'hasKenchikuKakuninsho', label: '建築確認済証・検査済証', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'otherDocuments', label: 'その他保管書類', type: 'textarea', maxLength: 300 })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 5. 法務局調査
// ---------------------------------------------------------------------------
const registry: SectionDef = {
  id: 'registry',
  sheetRef: '不動産調査シート(仮) / 法務局調査',
  title: '法務局調査',
  stepIndex: 5,
  groups: [
    g('touki', '登記記録', [
      f({ id: 'touchiChosaDate', label: '調査日', type: 'date' }),
      f({ id: 'chosekiChosaki', label: '調査法務局', type: 'text', maxLength: 60 }),
      f({ id: 'landRegisteredArea', label: '登記簿地積', type: 'number', unit: '㎡', min: 0 }),
      f({ id: 'landCategory', label: '地目', type: 'select',
        options: [
          { value: 'takuchi', label: '宅地' }, { value: 'noden', label: '田' }, { value: 'hatake', label: '畑' },
          { value: 'yamarin', label: '山林' }, { value: 'zappa', label: '雑種地' }, { value: 'other', label: 'その他' }
        ] }),
      f({ id: 'buildingRegisteredArea', label: '登記簿床面積', type: 'number', unit: '㎡', min: 0 }),
      f({ id: 'hasMortgage', label: '抵当権等の設定', type: 'radio', required: true,
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'mortgageDetail', label: '抵当権等の内容', type: 'textarea', maxLength: 500,
        condition: { fieldId: 'hasMortgage', equals: 'yes' } }),
      f({ id: 'hasEasement', label: '地役権・賃借権等の設定', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'easementDetail', label: '地役権等の内容', type: 'textarea', maxLength: 500,
        condition: { fieldId: 'hasEasement', equals: 'yes' } }),
      f({ id: 'chiseki_kokai', label: '公図・地積測量図の有無', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 6. 役所調査
// ---------------------------------------------------------------------------
const cityOffice: SectionDef = {
  id: 'city-office',
  sheetRef: '不動産調査シート(仮) / 役所調査',
  title: '役所調査',
  stepIndex: 6,
  groups: [
    g('yakusho', '役所調査', [
      f({ id: 'yakushoChosaDate', label: '調査日', type: 'date' }),
      f({ id: 'yakushoName', label: '調査役所名', type: 'text', maxLength: 60 }),
      f({ id: 'chosaTanto', label: '担当課・担当者', type: 'text', maxLength: 60 })
    ]),
    g('shutoku', '取得書類', [
      f({ id: 'doc_toshikeikaku', label: '都市計画図', type: 'radio',
        options: [{ value: 'yes', label: '取得済' }, { value: 'no', label: '未取得' }] }),
      f({ id: 'doc_dorodaicho', label: '道路台帳図', type: 'radio',
        options: [{ value: 'yes', label: '取得済' }, { value: 'no', label: '未取得' }] }),
      f({ id: 'doc_gesuidaicho', label: '下水道台帳', type: 'radio',
        options: [{ value: 'yes', label: '取得済' }, { value: 'no', label: '未取得' }] }),
      f({ id: 'doc_hazard', label: 'ハザードマップ', type: 'radio',
        options: [{ value: 'yes', label: '取得済' }, { value: 'no', label: '未取得' }] }),
      f({ id: 'doc_other', label: 'その他取得書類', type: 'textarea', maxLength: 300 })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 7. 道路、用途地域、建築制限
// ---------------------------------------------------------------------------
const roadZoning: SectionDef = {
  id: 'road-zoning',
  sheetRef: '不動産調査シート(仮) / 道路・用途地域・建築制限',
  title: '道路、用途地域、建築制限',
  stepIndex: 7,
  groups: [
    g('keikakudoro', '計画道路', [
      f({ id: 'planRoad', label: '計画道路', type: 'radio', required: true,
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'planRoadKettei', label: '計画決定', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }],
        condition: { fieldId: 'planRoad', equals: 'yes' } }),
      f({ id: 'planRoadJigyo', label: '事業決定', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }],
        condition: { fieldId: 'planRoad', equals: 'yes' } }),
      f({ id: 'planRoadName', label: '計画道路名称', type: 'text', maxLength: 60,
        condition: { fieldId: 'planRoad', equals: 'yes' } }),
      f({ id: 'planRoadWidth', label: '計画道路幅員', type: 'number', unit: 'm', min: 0,
        condition: { fieldId: 'planRoad', equals: 'yes' } })
    ]),
    g('youto', '用途地域、地域地区', [
      f({ id: 'youtoChiiki', label: '用途地域', type: 'select', required: true,
        options: [
          { value: 'dai1shu_tei', label: '第一種低層住居専用地域' }, { value: 'dai2shu_tei', label: '第二種低層住居専用地域' },
          { value: 'dai1shu_chuko', label: '第一種中高層住居専用地域' }, { value: 'dai2shu_chuko', label: '第二種中高層住居専用地域' },
          { value: 'dai1shu_jukyo', label: '第一種住居地域' }, { value: 'dai2shu_jukyo', label: '第二種住居地域' },
          { value: 'junjukyo', label: '準住居地域' }, { value: 'kinrinshogyo', label: '近隣商業地域' },
          { value: 'shogyo', label: '商業地域' }, { value: 'junkogyo', label: '準工業地域' },
          { value: 'kogyo', label: '工業地域' }, { value: 'kogyosenyo', label: '工業専用地域' },
          { value: 'mushitei', label: '無指定' }
        ] }),
      f({ id: 'chiikichiku', label: '地域地区(防火・高度地区等)', type: 'checkbox-multi',
        options: [
          { value: 'bouka', label: '防火地域' }, { value: 'junbouka', label: '準防火地域' },
          { value: 'koudo', label: '高度地区' }, { value: 'keikan', label: '景観地区' }, { value: 'none', label: '指定なし' }
        ] })
    ]),
    g('kenpei', '建蔽率、容積率', [
      f({ id: 'kenpeiritsuKitei', label: '建蔽率(規定)', type: 'number', unit: '%', min: 0, max: 100 }),
      f({ id: 'yosekiritsuKitei', label: '容積率(規定)', type: 'number', unit: '%', min: 0, max: 1000 }),
      f({ id: 'kenpeiritsuJissai', label: '建蔽率(実際・自動計算)', type: 'calc', unit: '%',
        calc: { kind: 'ratio', sourceFieldIds: ['buildingArea', 'landArea'], ratioMultiplier: 100 } }),
      f({ id: 'yosekiritsuJissai', label: '容積率(実際・自動計算)', type: 'calc', unit: '%',
        calc: { kind: 'ratio', sourceFieldIds: ['totalFloorArea', 'landArea'], ratioMultiplier: 100 } })
    ]),
    g('doroshubetsu', '道路種別、前面道路および側溝、水路', [
      f({ id: 'roadType', label: '道路種別', type: 'select', required: true,
        options: [
          { value: 'shido42-1-1', label: '42条1項1号(公道)' }, { value: 'shido42-1-4', label: '42条1項4号' },
          { value: 'shido42-1-5', label: '42条1項5号(位置指定道路)' }, { value: 'shido42-2', label: '42条2項道路(みなし道路)' },
          { value: 'private', label: '私道' }, { value: 'none', label: '道路に接していない' }
        ] }),
      f({ id: 'roadWidth', label: '前面道路幅員', type: 'number', unit: 'm', min: 0 }),
      f({ id: 'setback', label: 'セットバックの要否', type: 'radio',
        options: [{ value: 'yes', label: '要' }, { value: 'no', label: '不要' }] }),
      f({ id: 'privateRoadPermitPassage', label: '通行許可の有無', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }],
        condition: { fieldId: 'roadType', equals: 'private' } }),
      f({ id: 'privateRoadPermitExcavation', label: '掘削許可の有無', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }],
        condition: { fieldId: 'roadType', equals: 'private' } }),
      f({ id: 'hasGutter', label: '側溝の有無', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'hasWaterway', label: '水路の有無', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] })
    ]),
    g('takasa', '高さ制限、土地区画整理法、その他法令', [
      f({ id: 'heightLimit', label: '高さ制限', type: 'text', maxLength: 60 }),
      f({ id: 'kitagawaShaeki', label: '北側斜線・道路斜線等', type: 'text', maxLength: 60 }),
      f({ id: 'landReadjustment', label: '土地区画整理法の該当', type: 'radio',
        options: [{ value: 'yes', label: '該当' }, { value: 'no', label: '非該当' }] }),
      f({ id: 'otherLaws', label: 'その他法令上の制限', type: 'checkbox-multi',
        options: [
          { value: 'nouchi', label: '農地法' }, { value: 'shinrin', label: '森林法' },
          { value: 'kokudo', label: '国土利用計画法' }, { value: 'bunkazai', label: '文化財保護法' },
          { value: 'none', label: '該当なし' }
        ] })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 8. 上下水道、電気、ガス
// ---------------------------------------------------------------------------
const utilities: SectionDef = {
  id: 'utilities',
  sheetRef: '不動産調査シート(仮) / 上下水道・電気・ガス',
  title: '上下水道、電気、ガス',
  stepIndex: 8,
  groups: [
    g('inyosui', '飲用水', [
      f({ id: 'waterSupply', label: '飲用水', type: 'select', required: true,
        options: [{ value: 'jousui', label: '公営水道' }, { value: 'idomizu', label: '井戸水' }, { value: 'kumiai', label: '簡易水道組合' }] }),
      f({ id: 'waterMeterDiameter', label: '水道メーター口径', type: 'text', unit: 'mm', maxLength: 20 })
    ]),
    g('denki', '電気', [
      f({ id: 'electricCompany', label: '電力会社', type: 'text', maxLength: 40 }),
      f({ id: 'electricCapacity', label: '契約容量', type: 'number', unit: 'A', min: 0 })
    ]),
    g('gas', 'ガス', [
      f({ id: 'gasType', label: 'ガス種別', type: 'radio', required: true,
        options: [{ value: 'city', label: '都市ガス' }, { value: 'lp', label: 'LPガス' }, { value: 'none', label: 'なし' }] }),
      f({ id: 'lpCompanyName', label: 'LPガス会社名', type: 'text', maxLength: 60,
        condition: { fieldId: 'gasType', equals: 'lp' } }),
      f({ id: 'lpCompanyContact', label: 'LPガス会社連絡先', type: 'text', maxLength: 60,
        condition: { fieldId: 'gasType', equals: 'lp' } })
    ]),
    g('taiyoko', '太陽光', [
      f({ id: 'hasSolar', label: '太陽光発電設備', type: 'radio', required: true,
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'solarCapacity', label: '搭載容量', type: 'number', unit: 'kW', min: 0,
        condition: { fieldId: 'hasSolar', equals: 'yes' } }),
      f({ id: 'solarContractPeriod', label: '売電契約期間', type: 'text', maxLength: 40,
        condition: { fieldId: 'hasSolar', equals: 'yes' } }),
      f({ id: 'solarUnitPrice', label: '売電単価', type: 'number', unit: '円/kWh', min: 0,
        condition: { fieldId: 'hasSolar', equals: 'yes' } })
    ]),
    g('osui', '汚水、雑排水', [
      f({ id: 'drainageType', label: '排水方式', type: 'radio', required: true,
        options: [{ value: 'gesuido', label: '公共下水道' }, { value: 'jokaso', label: '浄化槽' }, { value: 'kumitori', label: '汲み取り' }] }),
      f({ id: 'jokasoType', label: '浄化槽 集中/個別', type: 'radio',
        options: [{ value: 'shuchu', label: '集中' }, { value: 'kobetsu', label: '個別' }],
        condition: { fieldId: 'drainageType', equals: 'jokaso' } }),
      f({ id: 'jokasoGappei', label: '浄化槽 合併/単独', type: 'radio',
        options: [{ value: 'gappei', label: '合併処理' }, { value: 'tandoku', label: '単独処理' }],
        condition: { fieldId: 'drainageType', equals: 'jokaso' } }),
      f({ id: 'jokasoMgmtCompany', label: '浄化槽管理会社', type: 'text', maxLength: 60,
        condition: { fieldId: 'drainageType', equals: 'jokaso' } }),
      f({ id: 'jokasoMgmtContact', label: '浄化槽管理会社連絡先', type: 'text', maxLength: 60,
        condition: { fieldId: 'drainageType', equals: 'jokaso' } })
    ])
  ]
};

// ---------------------------------------------------------------------------
// 9. 周辺環境
// ---------------------------------------------------------------------------
const surroundings: SectionDef = {
  id: 'surroundings',
  sheetRef: '不動産調査シート(仮) / 周辺環境',
  title: '周辺環境',
  stepIndex: 9,
  wallSurveyTrigger: true,
  groups: [
    g('shuhen', '周辺環境', [
      f({ id: 'nearbyFacilities', label: '周辺施設', type: 'checkbox-multi',
        options: [
          { value: 'school', label: '学校' }, { value: 'hospital', label: '病院' },
          { value: 'store', label: '商業施設' }, { value: 'park', label: '公園' },
          { value: 'station', label: '駅' }, { value: 'cemetery', label: '墓地・斎場' },
          { value: 'factory', label: '工場' }
        ] }),
      f({ id: 'noiseVibration', label: '騒音・振動等', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'noiseVibrationDetail', label: '騒音・振動等の内容', type: 'textarea', maxLength: 300,
        condition: { fieldId: 'noiseVibration', equals: 'yes' } })
    ]),
    g('block', 'コンクリートブロック', [
      f({ id: 'hasConcreteBlock', label: 'コンクリートブロック塀の有無', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }] }),
      f({ id: 'blockHeight', label: 'ブロック塀高さ', type: 'number', unit: 'm', min: 0,
        condition: { fieldId: 'hasConcreteBlock', equals: 'yes' } }),
      f({ id: 'blockCondition', label: 'ブロック塀の状態', type: 'select',
        options: [{ value: 'good', label: '良好' }, { value: 'crack', label: 'ひび割れあり' }, { value: 'lean', label: '傾斜あり' }],
        condition: { fieldId: 'hasConcreteBlock', equals: 'yes' } })
    ]),
    g('yoheki', '擁壁、がけ条例、地盤補強', [
      f({ id: 'hasWall', label: '擁壁の有無', type: 'radio', required: true,
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }],
        note: '「有」を選択すると擁壁調査(複数追加可)が入力対象になります。' }),
      f({ id: 'cliffOrdinanceGeneral', label: 'がけ条例の該当', type: 'radio',
        options: [{ value: 'yes', label: '該当' }, { value: 'no', label: '非該当' }] }),
      f({ id: 'groundReinforcement', label: '地盤補強の有無', type: 'radio',
        options: [{ value: 'yes', label: '有' }, { value: 'no', label: '無' }, { value: 'unknown', label: '不明' }] }),
      f({ id: 'groundReinforcementDetail', label: '地盤補強の内容', type: 'textarea', maxLength: 300,
        condition: { fieldId: 'groundReinforcement', equals: 'yes' } })
    ]),
    g('chonaikai', '町内会、ゴミステーション', [
      f({ id: 'chonaikaiJoin', label: '町内会加入状況', type: 'radio',
        options: [{ value: 'yes', label: '加入' }, { value: 'no', label: '未加入' }] }),
      f({ id: 'chonaikaiFee', label: '町内会費', type: 'number', unit: '円/月', min: 0 }),
      f({ id: 'gomiStationLocation', label: 'ゴミステーションの場所', type: 'text', maxLength: 100 }),
      f({ id: 'gomiStationNote', label: 'ゴミ出しルール備考', type: 'textarea', maxLength: 300 })
    ]),
    g('rinka', '隣家訪問', [
      f({ id: 'rinkaVisited', label: '隣家訪問の実施', type: 'radio',
        options: [{ value: 'yes', label: '実施済' }, { value: 'no', label: '未実施' }] }),
      f({ id: 'rinkaResult', label: '隣家訪問結果・特記事項', type: 'textarea', maxLength: 500,
        condition: { fieldId: 'rinkaVisited', equals: 'yes' } })
    ])
  ]
};

export const SECTIONS: SectionDef[] = [
  propertyBasic,
  sellerRights,
  registry,
  cityOffice,
  roadZoning,
  utilities,
  surroundings
];

export function getSectionById(id: string): SectionDef | undefined {
  return SECTIONS.find((s) => s.id === id);
}

export const PHOTO_CATEGORIES: { key: string; label: string; note: string }[] = [
  { key: 'suido', label: '上水道', note: '止水栓・メーター周りが分かるように撮影してください。' },
  { key: 'meter', label: 'メーターボックス', note: 'メーター指針・口径表示が読み取れる距離で撮影してください。' },
  { key: 'osui', label: '汚水', note: '汚水桝の蓝・配管の状態が分かるように撮影してください。' },
  { key: 'usui', label: '雨水', note: '雨水桝・排水経路が分かるように撮影してください。' },
  { key: 'gesui', label: '下水', note: '公共桝の位置・深さが分かるように撮影してください。' },
  { key: 'jokaso', label: '浄化槽', note: '銘板(容量・型式)が読み取れるように撮影してください。' },
  { key: 'gas', label: 'ガス', note: 'メーター・供給管の種類が分かるように撮影してください。' },
  { key: 'denki', label: '電気', note: '引込線・メーター・契約容量表示が分かるように撮影してください。' },
  { key: 'other', label: 'その他設備', note: 'その他設備の状況が分かるように撮影してください。' }
];

export const WALL_DEFECT_TYPES = ['クラック', '水平移動', '不同沈下', 'ふくらみ', '傾斜', 'その他'];
