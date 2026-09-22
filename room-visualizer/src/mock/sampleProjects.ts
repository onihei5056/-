// ============================================================
// サンプルデータ（初回起動時に履歴へ投入される案件）
// ============================================================
import type { GenerationRecord, PropertyInfo, SourceImage, StyleId } from '../types';
import { EMPTY_PALETTE, ROOM_TYPE_FEATURES, STYLE_MAP } from './styles';
import { itemThumb, renderRoomSvg, svgToDataUrl } from './roomScene';

/** サンプルの元写真（家具のない明るい空室）を生成する */
export function sampleSourceImage(
  roomType: 'ldk' | 'bedroom',
  fileName: string,
): SourceImage {
  return {
    dataUrl: svgToDataUrl(
      renderRoomSvg({
        palette: EMPTY_PALETTE,
        features: [],
        lighting: 'ceiling',
        empty: true,
        tatami: false,
      }),
    ),
    fileName,
    isSample: true,
    sampleRoomType: roomType,
  };
}

const SAMPLE_STYLES: StyleId[] = ['natural', 'modern', 'nordic', 'hotel', 'vintage', 'wamodern'];

function buildResults(roomType: 'ldk' | 'bedroom', styleIds: StyleId[], prefix: string) {
  return styleIds.map((styleId, i) => {
    const style = STYLE_MAP[styleId];
    return {
      id: `${prefix}_${styleId}`,
      styleId,
      styleName: style.name,
      dataUrl: svgToDataUrl(
        renderRoomSvg({
          palette: style.palette,
          features: ROOM_TYPE_FEATURES[roomType],
          lighting: style.lighting,
        }),
      ),
      points: style.points,
      items: style.items.map((it) => ({
        name: it.name,
        note: it.note,
        thumbnail: itemThumb(it.kind, style.palette),
      })),
      prompt: `[サンプル] ${style.keywords}`,
      createdAt: new Date(Date.now() - (i + 1) * 60000).toISOString(),
    };
  });
}

export const SAMPLE_PROPERTY_A: PropertyInfo = {
  name: 'グリーンハイツ江坂',
  address: '大阪府吹田市江坂町1-2-3',
  roomNumber: '302号室',
  staff: '営業部 佐藤',
  purpose: '賃貸募集',
  memo: '南向き・角部屋。空室のまま3ヶ月。家具ありのイメージで反響を増やしたい。',
};

const SAMPLE_PROPERTY_B: PropertyInfo = {
  name: 'パークサイド千里',
  address: '大阪府豊中市新千里東町4-5-6',
  roomNumber: '705号室',
  staff: '営業部 田中',
  purpose: '売却',
  memo: '築18年。内装リフォーム提案とあわせて提示する。',
};

/** 初回起動時に投入するサンプル履歴 */
export function buildSampleRecords(): GenerationRecord[] {
  const now = Date.now();
  const recordA: GenerationRecord = {
    id: 'rec_sample_a',
    createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    property: SAMPLE_PROPERTY_A,
    condition: {
      roomType: 'ldk',
      styles: SAMPLE_STYLES,
      changeItems: ['placeFurniture', 'rug', 'plant', 'curtain', 'tv', 'art', 'smallItems'],
      reformItems: ['refresh'],
      targets: ['family', 'rent'],
      freeText: '明るく広く見えるように。物件写真として違和感のない範囲で。',
    },
    source: sampleSourceImage('ldk', 'グリーンハイツ江坂302_LDK.jpg'),
    results: buildResults('ldk', SAMPLE_STYLES, 'rec_sample_a'),
    favoriteImageIds: ['rec_sample_a_natural', 'rec_sample_a_hotel'],
  };

  const recordB: GenerationRecord = {
    id: 'rec_sample_b',
    createdAt: new Date(now - 1000 * 60 * 60 * 51).toISOString(),
    property: SAMPLE_PROPERTY_B,
    condition: {
      roomType: 'bedroom',
      styles: ['hotel', 'natural', 'simple'],
      changeItems: ['placeFurniture', 'bed', 'curtain', 'rug'],
      reformItems: ['floorDark', 'wallWhite'],
      targets: ['couple', 'sale'],
      freeText: '高級感を出したい。',
    },
    source: sampleSourceImage('bedroom', 'パークサイド千里705_洋室.jpg'),
    results: buildResults('bedroom', ['hotel', 'natural', 'simple'], 'rec_sample_b'),
    favoriteImageIds: ['rec_sample_b_hotel'],
  };

  return [recordA, recordB];
}
