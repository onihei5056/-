/**
 * PDF帳票用のDOMブロック生成ヘルパー。
 * html2canvasで画像化するため、外部CSSに依存せずインラインstyleで完結させる。
 * レイアウトは元Excel「不動産調査シート_2026.3.1.xlsx」の帳票構成に合わせている。
 */
export const PDF_FONT = '"Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",sans-serif';
export const CONTENT_WIDTH_PX = 700; // A4横幅794pxから左右余白を引いた値

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration>,
  children?: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  (children ?? []).forEach((c) => node.append(c));
  return node;
}

export function buildTitleBlock(text: string, sub?: string): HTMLDivElement {
  return el('div', { width: '100%', marginBottom: '10px' }, [
    el(
      'div',
      {
        background: '#0b2c5c',
        color: '#fff',
        fontWeight: '700',
        fontSize: '19px',
        padding: '9px 14px',
        borderRadius: '3px',
        fontFamily: PDF_FONT
      },
      [text]
    ),
    ...(sub ? [el('div', { fontSize: '11px', color: '#444', marginTop: '4px', fontFamily: PDF_FONT }, [sub])] : [])
  ]);
}

export function buildSubTitleBlock(text: string): HTMLDivElement {
  return el(
    'div',
    {
      width: '100%',
      background: '#e7edf6',
      color: '#0b2c5c',
      fontWeight: '700',
      fontSize: '14px',
      padding: '6px 10px',
      marginBottom: '8px',
      borderLeft: '5px solid #0b2c5c',
      fontFamily: PDF_FONT
    },
    [text]
  );
}

export interface Row {
  label: string;
  value: string;
  unit?: string;
}

/** 元Excelの「項目名列 + 記入列」の2列構成を再現した表 */
export function buildFieldsTableBlock(groupTitle: string, rows: Row[]): HTMLDivElement {
  const table = el('div', {
    width: '100%',
    border: '1px solid #333',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '12px',
    fontFamily: PDF_FONT
  });
  table.append(
    el(
      'div',
      {
        background: '#e7edf6',
        color: '#0b2c5c',
        fontWeight: '700',
        fontSize: '13px',
        padding: '5px 10px',
        borderBottom: '1px solid #333'
      },
      [groupTitle]
    )
  );
  rows.forEach((row, idx) => {
    const rowEl = el('div', {
      display: 'flex',
      borderBottom: idx === rows.length - 1 ? 'none' : '1px solid #ccc',
      fontSize: '12px'
    });
    rowEl.append(
      el(
        'div',
        {
          width: '180px',
          flex: '0 0 180px',
          padding: '6px 8px',
          background: '#f7f8fa',
          color: '#222',
          fontWeight: '700',
          borderRight: '1px solid #ccc',
          wordBreak: 'break-word'
        },
        [row.label]
      ),
      el(
        'div',
        {
          flex: '1',
          padding: '6px 8px',
          color: '#111',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.7'
        },
        [row.value + (row.unit ? ` ${row.unit}` : '')]
      )
    );
    table.append(rowEl);
  });
  return table;
}

/** 注意書き・脚注などの本文ブロック */
export function buildNoteBlock(text: string, opts?: { small?: boolean; border?: boolean }): HTMLDivElement {
  return el(
    'div',
    {
      width: '100%',
      fontSize: opts?.small ? '10px' : '11px',
      color: '#333',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap',
      padding: opts?.border ? '8px 10px' : '4px 2px',
      border: opts?.border ? '1px solid #999' : 'none',
      borderRadius: '3px',
      marginBottom: '10px',
      fontFamily: PDF_FONT,
      wordBreak: 'break-word'
    },
    [text]
  );
}

export interface PhotoCell {
  title: string;
  dataUrl?: string;
  takenAt?: string;
  photographer?: string;
  comment?: string;
}

/**
 * 元Excel「設備現況写真」シートの2列グリッドを再現した写真ブロック。
 * 1ブロック=2枚(1行)としてページ分割するため、写真が途中で切れない。
 */
export function buildPhotoPairBlock(left: PhotoCell, right?: PhotoCell): HTMLDivElement {
  const wrap = el('div', {
    width: '100%',
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
    fontFamily: PDF_FONT
  });
  wrap.append(buildPhotoCell(left));
  wrap.append(right ? buildPhotoCell(right) : el('div', { flex: '1' }));
  return wrap;
}

function buildPhotoCell(cell: PhotoCell): HTMLDivElement {
  const box = el('div', {
    flex: '1',
    border: '1px solid #333',
    borderRadius: '3px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  });
  box.append(
    el(
      'div',
      {
        background: '#e7edf6',
        color: '#0b2c5c',
        fontWeight: '700',
        fontSize: '12px',
        padding: '4px 8px',
        borderBottom: '1px solid #333'
      },
      [cell.title]
    )
  );
  if (cell.dataUrl) {
    const img = document.createElement('img');
    Object.assign(img.style, {
      display: 'block',
      width: '100%',
      height: '230px',
      objectFit: 'contain',
      background: '#f0f0f0'
    });
    img.src = cell.dataUrl;
    box.append(img);
  } else {
    box.append(
      el(
        'div',
        {
          height: '230px',
          background: '#fafafa',
          color: '#999',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
        ['(写真なし)']
      )
    );
  }
  box.append(
    el(
      'div',
      { padding: '5px 8px', fontSize: '10px', color: '#333', lineHeight: '1.5', borderTop: '1px solid #ccc' },
      [
        `撮影日時: ${cell.takenAt ?? '-'}　撮影者: ${cell.photographer ?? '-'}`,
        el('br', {}),
        `コメント: ${cell.comment || '(なし)'}`
      ]
    )
  );
  return box;
}
