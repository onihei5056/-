import { REFORM_ITEMS } from '../mock/options';
import { IconRefresh } from '../icons';

/**
 * 表示中の画像だけを、その場で作り直すためのクイック変更バー。
 *
 * 出先（内見中）での「壁紙を変えたイメージも見たい」という要望に、
 * 設定パネルへ戻らず1タップで応えるための導線。
 * 内部的には通常のリフォーム項目のON/OFFなので、PCの設定パネルと状態は共通。
 */

/**
 * クイック変更に出す項目（内装の見た目に直結するものだけを厳選）。
 * 狭い画面で1行に収まるよう、表示名は短縮版を使う。
 */
const QUICK_ITEMS: { id: string; label: string }[] = [
  { id: 'wallWhite', label: '壁紙を白系に' },
  { id: 'accentCloth', label: 'アクセントクロス' },
  { id: 'floorLight', label: '床を明るく' },
  { id: 'floorDark', label: '床をダーク系に' },
  { id: 'downlight', label: 'ダウンライト風' },
  { id: 'refresh', label: '全体を新しく' },
];

/** 同時に選べない組み合わせ（床は明るく／ダークのどちらか一方） */
const EXCLUSIVE: Record<string, string> = {
  floorLight: 'floorDark',
  floorDark: 'floorLight',
};

interface Props {
  /** 現在選択中のリフォーム項目 */
  selected: string[];
  /** 変更後のリフォーム項目一覧を受け取り、その場で再生成する */
  onApply: (nextReformItems: string[]) => void;
  disabled?: boolean;
  styleName?: string;
}

export function QuickAdjust({ selected, onApply, disabled, styleName }: Props) {
  // 定義漏れを防ぐため、リフォーム項目に実在するIDだけを表示する
  const items = QUICK_ITEMS.filter((q) => REFORM_ITEMS.some((r) => r.id === q.id));

  const toggle = (id: string) => {
    const on = selected.includes(id);
    let next = on ? selected.filter((v) => v !== id) : [...selected, id];
    const conflict = EXCLUSIVE[id];
    if (!on && conflict) next = next.filter((v) => v !== conflict);
    onApply(next);
  };

  return (
    <section className="quick-adjust">
      <div className="qa-head">
        <IconRefresh size={14} />
        <span>この画像をその場で変更</span>
        <span className="qa-note">
          {styleName ? `「${styleName}」を作り直します` : '表示中の画像を作り直します'}
        </span>
      </div>
      <div className="qa-chips">
        {items.map((r) => {
          const on = selected.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              className={`chip${on ? ' on' : ''}`}
              onClick={() => toggle(r.id)}
              disabled={disabled}
              aria-pressed={on}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
