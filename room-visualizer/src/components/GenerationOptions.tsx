import { useState } from 'react';
import { CHANGE_ITEMS, FREE_TEXT_EXAMPLES, REFORM_ITEMS, ROOM_TYPES, TARGETS } from '../mock/options';
import type { RoomTypeId } from '../types';
import { IconChevron } from '../icons';

/** 部屋タイプ */
export function RoomTypeSelector({
  value,
  onChange,
}: {
  value: RoomTypeId;
  onChange: (v: RoomTypeId) => void;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <span className="step">2</span>
        <h2>部屋タイプ</h2>
      </div>
      <div className="card-body">
        <div className="chip-group">
          {ROOM_TYPES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`chip${value === r.id ? ' on' : ''}`}
              onClick={() => onChange(r.id)}
              aria-pressed={value === r.id}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 変更したい項目（チェックボックス） */
export function ChangeItemSelector({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <span className="step">4</span>
        <h2>変更したい項目</h2>
        <span className="head-sub">{selected.length}件</span>
      </div>
      <div className="card-body">
        <div className="check-list">
          {CHANGE_ITEMS.map((c) => {
            const on = selected.includes(c.id);
            return (
              <label key={c.id} className={`check${on ? ' on' : ''}`}>
                <input type="checkbox" checked={on} onChange={() => onToggle(c.id)} />
                <span>{c.label}</span>
              </label>
            );
          })}
        </div>
        <p className="hint">
          構造（窓・柱・梁・ドア・間取り・撮影アングル）は変更しません。家具と内装のみを変更します。
        </p>
      </div>
    </section>
  );
}

/** リフォームイメージ（折りたたみ） */
export function ReformSelector({
  selected,
  onToggle,
  defaultOpen = true,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="card">
      <button type="button" className="accordion-btn" onClick={() => setOpen((v) => !v)}>
        <span className="step">5</span>
        リフォームイメージ
        <span className="count">{selected.length > 0 ? `${selected.length}件選択中` : '任意'}</span>
        <IconChevron size={16} open={open} />
      </button>
      {open && (
        <div className="card-body" style={{ paddingTop: 0 }}>
          <div className="check-list">
            {REFORM_ITEMS.map((r) => {
              const on = selected.includes(r.id);
              return (
                <label key={r.id} className={`check${on ? ' on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => onToggle(r.id)} />
                  <span>
                    {r.label}
                    {r.note && <span className="note">{r.note}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/** ターゲット（折りたたみ） */
export function TargetSelector({
  selected,
  onToggle,
  defaultOpen = true,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const summary = selected
    .map((id) => TARGETS.find((t) => t.id === id)?.label)
    .filter(Boolean)
    .join('・');
  return (
    <section className="card">
      <button type="button" className="accordion-btn" onClick={() => setOpen((v) => !v)}>
        <span className="step">6</span>
        ターゲット
        <span className="count">{summary || '未選択'}</span>
        <IconChevron size={16} open={open} />
      </button>
      {open && (
        <div className="card-body" style={{ paddingTop: 0 }}>
          <div className="chip-group">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip${selected.includes(t.id) ? ' on' : ''}`}
                onClick={() => onToggle(t.id)}
                aria-pressed={selected.includes(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** 自由入力（折りたたみ） */
export function FreeTextInput({
  value,
  onChange,
  defaultOpen = true,
}: {
  value: string;
  onChange: (v: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="card">
      <button type="button" className="accordion-btn" onClick={() => setOpen((v) => !v)}>
        <span className="step">7</span>
        追加の希望
        <span className="count">{value.trim() ? '入力あり' : '任意'}</span>
        <IconChevron size={16} open={open} />
      </button>
      {open && (
      <div className="card-body" style={{ paddingTop: 0 }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="例）明るく広く見えるように。なるべく現実的な家具配置で。"
        />
        <div className="example-row">
          {FREE_TEXT_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="example-chip"
              onClick={() => onChange(value ? `${value.replace(/[。\s]*$/, '')}。${ex}` : ex)}
            >
              ＋ {ex}
            </button>
          ))}
        </div>
      </div>
      )}
    </section>
  );
}
