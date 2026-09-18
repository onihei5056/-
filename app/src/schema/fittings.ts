import type { FittingsRow } from '../types';

/**
 * ============================================================================
 * 付帯設備表の行定義
 * ----------------------------------------------------------------------------
 * 出典: UI構成について.xlsx「付帯設備表」シート 2〜48行(行の順序そのまま)
 *
 * このファイルはExcelの各セルをそのまま保持している。
 *   row    … Excelの行番号。保存キーの元になるため変更しないこと
 *   middle … B列 中項目(空欄の行は直前の中項目に属するため、ここでは補完済み)
 *   small  … C列 小項目
 *   mode   … D列 入力方式(チェックボックス / 自由記載)
 *   e      … E列 1つ目の選択項目
 *   f      … F列 2つ目の選択項目
 *   g      … G列 追加自由入力項目の見出し
 *
 * 項目の修正はこの配列を直接編集すれば画面に反映される
 * (表記・並び順ともExcelに合わせること)。
 * 中項目名・小項目名が重複しても row が異なれば別の入力として扱われる。
 * ============================================================================
 */

/** F列で「同時に1つしか選べない」もの。それ以外のF列は複数選択。 */
export const FITTINGS_EXCLUSIVE_F: string[] = ['鏡有・鏡無', 'モニター：有・無'];

/** H列。全ての入力行に共通で表示する自由記載欄の見出し。 */
export const FITTINGS_DEFECT_LABEL = '判明している故障・不具合の具体的内容（自由記載）';

export const FITTINGS_ROWS: FittingsRow[] = [
  { row: 2, middle: '給湯関係', small: '給湯器', mode: 'チェックボックス', e: '有・無', f: '給湯箇所：キッチン・浴室・洗面所', g: '特定保守製品の表示', startsGroup: true },
  { row: 3, middle: '給湯関係', small: '屋内式ガス湯沸かし器（個別）', mode: 'チェックボックス', e: '有・無', g: '特定保守製品の表示', startsGroup: false },
  { row: 4, middle: 'キッチン設備', small: '流し台', mode: 'チェックボックス', e: '有・無', startsGroup: true },
  { row: 5, middle: 'キッチン設備', small: '混合水栓', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 6, middle: 'キッチン設備', small: 'レンジフード《換気扇》', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 7, middle: 'キッチン設備', small: 'コンロ', mode: 'チェックボックス', e: '有・無', f: '電気・ガス', startsGroup: false },
  { row: 8, middle: 'キッチン設備', small: 'グリル', mode: 'チェックボックス', e: '有・無', f: '電気・ガス', startsGroup: false },
  { row: 9, middle: 'キッチン設備', small: 'ビルトインオーブンレンジ', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 10, middle: 'キッチン設備', small: 'ビルトイン食器洗浄乾燥機', mode: 'チェックボックス', e: '有・無', g: '特定保守製品の表示', startsGroup: false },
  { row: 11, middle: 'キッチン設備', small: '浄水器', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 12, middle: 'キッチン設備', small: 'ディスポーザー', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 13, middle: '浴室設備', small: 'シャワー', mode: 'チェックボックス', e: '有・無', startsGroup: true },
  { row: 14, middle: '浴室設備', small: '混合水栓', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 15, middle: '浴室設備', small: '浴槽', mode: 'チェックボックス', e: '有・無', f: '追炊き・足し湯・保温・湯張り', startsGroup: false },
  { row: 16, middle: '浴室設備', small: '浴室洗面台', mode: 'チェックボックス', e: '有・無', f: '鏡有・鏡無', startsGroup: false },
  { row: 17, middle: '浴室設備', small: '屋内式風呂がま《バランス釜》', mode: 'チェックボックス', e: '有・無', g: '特定保守製品の表示', startsGroup: false },
  { row: 18, middle: '浴室設備', small: '浴室内乾燥（浴室内乾燥（暖房）機）', mode: 'チェックボックス', e: '有・無', g: '特定保守製品の表示', startsGroup: false },
  { row: 19, middle: '洗面設備', small: '洗面台', mode: 'チェックボックス', e: '有・無', f: '洗面台・照明・シャワー・コンセント・鏡・曇り止め', startsGroup: true },
  { row: 20, middle: 'トイレ設備', small: 'トイレ', mode: 'チェックボックス', e: '有・無', f: '便器・温水洗浄・保温・乾燥・ロータンク', startsGroup: true },
  { row: 21, middle: '洗濯設備', small: '防水パン', mode: 'チェックボックス', e: '有・無', startsGroup: true },
  { row: 22, middle: '洗濯設備', small: '洗濯用水栓', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 23, middle: '空調関係', small: '冷暖房機1', mode: 'チェックボックス', e: '有・無', f: '電気・ガス・石油', g: '設置個所・台数', startsGroup: true },
  { row: 24, middle: '空調関係', small: '冷暖房機2', mode: 'チェックボックス', e: '有・無', f: '電気・ガス・石油', g: '設置個所・台数', startsGroup: false },
  { row: 25, middle: '空調関係', small: '冷暖房機3', mode: 'チェックボックス', e: '有・無', f: '電気・ガス・石油', g: '設置個所・台数', startsGroup: false },
  { row: 26, middle: '空調関係', small: '床暖房設備', mode: 'チェックボックス', e: '有・無', f: '電気・ガス・石油', startsGroup: false },
  { row: 27, middle: '空調関係', small: '換気扇', mode: 'チェックボックス', e: '有・無', f: '浴室・洗面所・トイレ', startsGroup: false },
  { row: 28, middle: '空調関係', small: '２４時間換気システム', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 29, middle: 'その他', small: 'インターホン', mode: 'チェックボックス', e: '有・無', f: 'モニター：有・無', startsGroup: true },
  { row: 30, middle: '備考', small: '', mode: '自由記載', startsGroup: true },
  { row: 31, middle: '照明', small: '室内照明器具', mode: 'チェックボックス', e: '有・無', g: '台数', startsGroup: true },
  { row: 32, middle: '収納関係', small: '収納棚', mode: 'チェックボックス', e: '有・無', f: '食器棚（造付）・電動昇降戸棚・つり戸棚', startsGroup: true },
  { row: 33, middle: '収納関係', small: '収納スペース', mode: 'チェックボックス', e: '有・無', f: '床下収納・小屋裏収納', g: '他', startsGroup: false },
  { row: 34, middle: '収納関係', small: '下駄箱', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 35, middle: '建具関係', small: '網戸', mode: 'チェックボックス', e: '有・無', startsGroup: true },
  { row: 36, middle: '建具関係', small: '畳・ふすま', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 37, middle: '建具関係', small: '戸・扉', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 38, middle: '建具関係', small: '障子', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 39, middle: 'テレビ視聴', small: 'ＴＶ共視聴設備', mode: 'チェックボックス', e: '有・無', startsGroup: true },
  { row: 40, middle: 'その他', small: 'カーペット（敷込）', mode: 'チェックボックス', e: '有・無', startsGroup: true },
  { row: 41, middle: 'その他', small: 'カーテン', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 42, middle: 'その他', small: 'カーテンレール', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 43, middle: 'その他', small: '物干し', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 44, middle: 'その他', small: 'スロップシンク（屋外）', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 45, middle: 'その他', small: '屋外水栓', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 46, middle: 'その他', small: 'インターネット回線', mode: 'チェックボックス', e: '有・無', startsGroup: false },
  { row: 47, middle: 'その他', small: '住宅用火災警報器', mode: 'チェックボックス', e: '有・無', g: '設置個所', startsGroup: false },
  { row: 48, middle: '備考', small: '', mode: '自由記載', startsGroup: true },
];

/** 中項目のまとまり(行の並び順を保ったままグループ化する) */
export interface FittingsGroup {
  /** グループ内の先頭行番号。中項目名が重複しても一意になるのでキーに使う */
  key: number;
  middle: string;
  rows: FittingsRow[];
}

export function getFittingsGroups(): FittingsGroup[] {
  const groups: FittingsGroup[] = [];
  for (const row of FITTINGS_ROWS) {
    if (row.startsGroup || groups.length === 0) {
      groups.push({ key: row.row, middle: row.middle, rows: [row] });
    } else {
      groups[groups.length - 1].rows.push(row);
    }
  }
  return groups;
}

/** F列の文字列を「見出し」と「選択肢」に分解する(例: 給湯箇所：キッチン・浴室 → 見出し+2択) */
export function parseChoices(raw: string): { prefix: string; options: string[]; exclusive: boolean } {
  const exclusive = FITTINGS_EXCLUSIVE_F.includes(raw);
  const idx = raw.indexOf('：');
  const prefix = idx >= 0 ? raw.slice(0, idx + 1) : '';
  const body = idx >= 0 ? raw.slice(idx + 1) : raw;
  return { prefix, options: body.split('・').filter((s) => s !== ''), exclusive };
}

/** 保存キー。行番号で区切るため、中項目名や小項目名が重複しても混ざらない。 */
export const fittingsKey = (row: number, part: 'e' | 'f' | 'g' | 'h' | 'text') => `r${row}_${part}`;
