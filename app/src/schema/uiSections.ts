/**
 * ============================================================================
 * UI構成について.xlsx「大項目」シートの画面構成(アプリ全体の目次)
 * ----------------------------------------------------------------------------
 * このファイルが**画面の並び順と目次の階層の唯一の定義**です。
 * ここを編集すれば、目次タブ・画面の前後移動・進捗集計にすべて反映されます。
 *
 *   大項目(①〜④) … 目次の横並びタブ
 *     └ children  … その大項目に属する入力画面(タップすると出てくる小項目)
 *
 *   kind: 'group'    … 既存の入力画面をまとめる大項目
 *   kind: 'fittings' … 付帯設備表の入力画面そのもの(schema/fittings.ts で生成)
 *
 * 大項目は①〜④の4つで確定(これ以外に大項目は増やさない)。
 * 目次1段目に並ぶ「入力内容確認」「PDF出力」は大項目ではなく入力後の操作。
 *
 * 【追加指示が来たときの修正手順】
 *   ・画面を別の大項目へ移す      → children の配列から移すだけ
 *   ・大項目を増やす・名前を変える → この配列に1行足す/書き換える
 *   ・付帯設備表の項目を変える     → schema/fittings.ts を編集
 *
 * 【項目が重複したときの方針】
 *   同じ内容の項目が「④付帯設備表」と他の大項目の両方に出てくる場合は、
 *   **④付帯設備表の側を正**とし、他方には作らない(二重入力を避けるため)。
 * ============================================================================
 */

export type UiSectionKind = 'group' | 'fittings';

export interface UiSectionDef {
  /** 大項目ID(URLと保存キーに使う)。一度公開したら変更しないこと */
  id: string;
  /** 大項目名。Excelの表記をそのまま使う */
  title: string;
  kind: UiSectionKind;
  /**
   * この大項目に属する入力画面のID(表示順)。
   * SECTIONS のID、または 'equipment-photos' / 'wall-survey'。
   */
  children: string[];
}

export const UI_SECTIONS: UiSectionDef[] = [
  {
    id: 'ui-city-office',
    title: '①役所調査',
    kind: 'group',
    // 役所・法務局など公的機関での調査
    children: ['city-office', 'utilities', 'registry']
  },
  {
    id: 'ui-property',
    title: '②物件調査',
    kind: 'group',
    // 物件そのもの・現地の調査
    children: ['property-rights', 'surroundings', 'mansion', 'equipment-photos', 'wall-survey']
  },
  {
    id: 'ui-condition',
    title: '③物件状況',
    kind: 'group',
    // 売主からの聞き取り(物件状況等報告書に相当)
    children: ['seller-info']
  },
  {
    id: 'ui-fittings',
    title: '④付帯設備表',
    kind: 'fittings',
    children: []
  }
];

/**
 * 目次タブに表示する短縮名。画面のタイトルは変えずに、目次だけ短く表示する。
 * (スマホの横幅に収めるため。書き換えても画面タイトルには影響しない)
 */
export const SCREEN_SHORT_LABELS: Record<string, string> = {
  'city-office': '都市計画法・建築基準法',
  utilities: '飲用水・電気・ガス・排水',
  registry: '法務局',
  'property-rights': '物件情報・権利関係',
  surroundings: '周辺環境他',
  mansion: 'マンション',
  'equipment-photos': '設備現況写真',
  'wall-survey': '擁壁調査',
  'seller-info': '売主・面談'
};

export function getUiSectionById(id: string): UiSectionDef | undefined {
  return UI_SECTIONS.find((s) => s.id === id);
}

/** 画面IDから、それが属する大項目を引く */
export function getUiSectionByScreen(screenId: string): UiSectionDef | undefined {
  return UI_SECTIONS.find((s) => s.id === screenId || s.children.includes(screenId));
}

/** 目次の並び順に並べた画面IDの一覧(大項目→小項目の順に展開したもの) */
export const SCREEN_ORDER: string[] = UI_SECTIONS.flatMap((s) =>
  s.kind === 'fittings' ? [s.id] : s.children
);
