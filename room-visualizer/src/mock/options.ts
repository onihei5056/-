// ============================================================
// 設定パネルの選択肢定義（モックデータ）
// 選択内容は generateImage() に渡され、モック画像の内容にも反映される
// ============================================================
import type { RoomTypeId } from '../types';
import type { SceneFeature } from './roomScene';

export interface RoomTypeOption {
  id: RoomTypeId;
  label: string;
  keywords: string;
}

export const ROOM_TYPES: RoomTypeOption[] = [
  { id: 'living', label: 'リビング', keywords: 'living room' },
  { id: 'dining', label: 'ダイニング', keywords: 'dining room' },
  { id: 'ldk', label: 'LDK', keywords: 'open plan living dining kitchen' },
  { id: 'bedroom', label: '寝室', keywords: 'bedroom' },
  { id: 'kids', label: '子供部屋', keywords: 'kids room' },
  { id: 'study', label: '書斎', keywords: 'home office / study' },
  { id: 'washitsu', label: '和室', keywords: 'japanese tatami room' },
  { id: 'entrance', label: '玄関', keywords: 'entrance hall' },
  { id: 'other', label: 'その他', keywords: 'room' },
];

export interface ChangeItemOption {
  id: string;
  label: string;
  keywords: string;
  /** 選択時に追加される家具（モック描画用） */
  addFeature?: SceneFeature;
  /** 選択時に外される家具（モック描画用） */
  removeFeature?: SceneFeature;
}

export const CHANGE_ITEMS: ChangeItemOption[] = [
  { id: 'placeFurniture', label: '家具を配置する', keywords: 'add furniture to the empty room' },
  { id: 'replaceFurniture', label: '家具を変更する', keywords: 'replace existing furniture' },
  { id: 'smallItems', label: 'インテリア小物を追加', keywords: 'add decorative small items', addFeature: 'smallItems' },
  { id: 'flooring', label: 'フローリングを変更', keywords: 'change flooring material' },
  { id: 'wallpaper', label: '壁紙を変更', keywords: 'change wall paper' },
  { id: 'curtain', label: 'カーテンを追加／変更', keywords: 'add or change curtains', addFeature: 'curtain' },
  { id: 'lighting', label: '照明を変更', keywords: 'change lighting fixture' },
  { id: 'rug', label: 'ラグを追加', keywords: 'add a rug', addFeature: 'rug' },
  { id: 'plant', label: '観葉植物を追加', keywords: 'add indoor plants', addFeature: 'plant' },
  { id: 'tv', label: 'テレビ・テレビボードを追加', keywords: 'add TV and TV board', addFeature: 'tv' },
  { id: 'dining', label: 'ダイニングセットを追加', keywords: 'add dining table and chairs', addFeature: 'dining' },
  { id: 'bed', label: 'ベッドを追加', keywords: 'add a bed', addFeature: 'bed' },
  { id: 'storage', label: '収納家具を追加', keywords: 'add storage furniture', addFeature: 'storage' },
  { id: 'art', label: 'アート・壁飾りを追加', keywords: 'add wall art', addFeature: 'art' },
];

export interface ReformItemOption {
  id: string;
  label: string;
  keywords: string;
  note?: string;
}

export const REFORM_ITEMS: ReformItemOption[] = [
  { id: 'refresh', label: '古い部屋を新しく見せる', keywords: 'renovated and refreshed look', note: '全体の明度・清潔感を上げます' },
  { id: 'washitsuToYoushitsu', label: '和室から洋室', keywords: 'convert tatami room to western style flooring room' },
  { id: 'floorLight', label: '床を明るく', keywords: 'lighter flooring color' },
  { id: 'floorDark', label: '床をダーク系に', keywords: 'darker flooring color' },
  { id: 'wallWhite', label: '壁紙を白系に', keywords: 'white wall paper' },
  { id: 'accentCloth', label: 'アクセントクロスを追加', keywords: 'accent wall' },
  { id: 'downlight', label: '照明をダウンライト風に', keywords: 'recessed downlights' },
  { id: 'doors', label: '建具を変更', keywords: 'replace interior doors' },
  { id: 'kitchen', label: 'キッチンを新しく見せる', keywords: 'renovated kitchen', note: 'キッチンが写っている写真向け' },
  { id: 'water', label: '洗面・水回りを新しく見せる', keywords: 'renovated bathroom / washroom', note: '水回りが写っている写真向け' },
];

export interface TargetOption {
  id: string;
  label: string;
  keywords: string;
}

export const TARGETS: TargetOption[] = [
  { id: 'single', label: '単身', keywords: 'single person' },
  { id: 'couple', label: 'カップル', keywords: 'couple / DINKS' },
  { id: 'family', label: 'ファミリー', keywords: 'family with children' },
  { id: 'senior', label: 'シニア', keywords: 'senior' },
  { id: 'investment', label: '投資用', keywords: 'investment property' },
  { id: 'sale', label: '売却用', keywords: 'for sale listing' },
  { id: 'rent', label: '賃貸募集用', keywords: 'for rent listing' },
];

/** 自由入力欄のサンプル（クリックで入力できるようにする） */
export const FREE_TEXT_EXAMPLES = [
  '明るく広く見えるように',
  '30代ファミリー向け',
  '高級感を出したい',
  '木目を多めに',
  'なるべく現実的な家具配置',
  '物件写真として違和感のない範囲',
];

/** 用途（物件情報） */
export const PROPERTY_PURPOSES = ['賃貸募集', '売却', '投資用', 'リフォーム提案', '社内資料', 'その他'];

/** 免責文（生成結果付近とダウンロード時に表示する想定） */
export const DISCLAIMER =
  '本画像はAIによるイメージです。実際の物件の設備・仕様・家具配置とは異なる場合があります。';
