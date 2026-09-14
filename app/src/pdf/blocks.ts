/**
 * PDF帳票用のDOMブロック生成ヘルパー。
 * html2canvasで画像化するため、外部CSSに依存せずインラインstyleで完結させる。
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
        fontSize: '20px',
        padding: '10px 14px',
        borderRadius: '4px',
        fontFamily: PDF_FONT
      },
      [text]
    ),
    ...(sub
      ? [
          el(
            'div',
            { fontSize: '12px', color: '#444', marginTop: '4px', fontFamily: PDF_FONT },
            [sub]
          )
        ]
      : [])
  ]);
}

export interface Row {
  label: string;
  value: string;
  unit?: string;
  wide?: boolean; // 自由記述など横幅いっぱいに使う行
}

export function buildFieldsTableBlock(groupTitle: string, rows: Row[]): HTMLDivElement {
  const table = el('div', {
    width: '100%',
    border: '1px solid #333',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '14px',
    fontFamily: PDF_FONT
  });
  table.append(
    el(
      'div',
      {
        background: '#e7edf6',
        color: '#0b2c5c',
        fontWeight: '700',
        fontSize: '14px',
        padding: '6px 10px',
        borderBottom: '1px solid #333'
      },
      [groupTitle]
    )
  );
  rows.forEach((row, idx) => {
    const rowEl = el('div', {
      display: 'flex',
      borderBottom: idx === rows.length - 1 ? 'none' : '1px solid #ccc',
      fontSize: '13px'
    });
    rowEl.append(
      el(
        'div',
        {
          width: '190px',
          flex: '0 0 190px',
          padding: '7px 10px',
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
          padding: '7px 10px',
          color: '#111',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap'
        },
        [row.value + (row.unit ? ` ${row.unit}` : '')]
      )
    );
    table.append(rowEl);
  });
  return table;
}

export function buildPhotoBlock(
  categoryLabel: string,
  index: number,
  total: number,
  dataUrl: string,
  meta: { takenAt: string; photographer: string; comment: string }
): HTMLDivElement {
  const wrap = el('div', {
    width: '100%',
    border: '1px solid #333',
    borderRadius: '4px',
    marginBottom: '14px',
    fontFamily: PDF_FONT,
    overflow: 'hidden'
  });

  const header = el(
    'div',
    {
      background: '#e7edf6',
      color: '#0b2c5c',
      fontWeight: '700',
      fontSize: '13px',
      padding: '5px 10px',
      borderBottom: '1px solid #333'
    },
    [`${categoryLabel}  (${index}/${total})`]
  );

  const img = document.createElement('img');
  Object.assign(img.style, {
    display: 'block',
    width: '100%',
    maxHeight: '420px',
    objectFit: 'contain',
    background: '#eee'
  });
  img.src = dataUrl;

  const caption = el(
    'div',
    { padding: '8px 10px', fontSize: '12px', color: '#333', lineHeight: '1.6' },
    [`撮影日時: ${meta.takenAt}　撮影者: ${meta.photographer}`, el('br', {}), `コメント: ${meta.comment || '(なし)'}`]
  );

  wrap.append(header, img, caption);
  return wrap;
}
