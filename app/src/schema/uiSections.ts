/**
 * ============================================================================
 * UI構成について.xlsx「大項目」シートの画面定義
 * ----------------------------------------------------------------------------
 * Excelの大項目(①〜④)をそのままアプリの画面にしたもの。
 *
 *   kind: 'fittings'    … 付帯設備表の入力画面(schema/fittings.ts の行定義で生成)
 *   kind: 'placeholder' … 大項目名のみ表示し、内容は未実装の画面
 *
 * 【追加指示が来たときの修正手順】
 *   1. 内容が決まった大項目の kind を 'placeholder' から作成する画面種別に変える
 *   2. 入力項目そのものは各スキーマファイル(付帯設備表なら schema/fittings.ts)を編集する
 *   3. ここに大項目を足すだけで、目次タブ・画面ルート・進捗集計に自動で反映される
 * ============================================================================
 */

export type UiSectionKind = 'fittings' | 'placeholder';

export interface UiSectionDef {
  /** 画面ID(URLと保存キーに使う)。一度公開したら変更しないこと */
  id: string;
  /** 画面タイトル。Excelの大項目の表記をそのまま使う */
  title: string;
  kind: UiSectionKind;
}

export const UI_SECTIONS: UiSectionDef[] = [
  { id: 'ui-city-office', title: '①役所調査', kind: 'placeholder' },
  { id: 'ui-property', title: '②物件調査', kind: 'placeholder' },
  { id: 'ui-condition', title: '③物件状況', kind: 'placeholder' },
  { id: 'ui-fittings', title: '④付帯設備表', kind: 'fittings' }
];

export function getUiSectionById(id: string): UiSectionDef | undefined {
  return UI_SECTIONS.find((s) => s.id === id);
}

/** 画面ID一覧(ルーティングと進捗集計で使う) */
export const UI_SECTION_IDS = UI_SECTIONS.map((s) => s.id);
