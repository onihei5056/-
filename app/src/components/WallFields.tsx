import type { ReactNode } from 'react';

/** 擁壁調査シート用の小さな入力部品(項目定義スキーマを使わない専用画面のため個別実装) */

export function Field({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
      {note && <div className="field-note">※ {note}</div>}
    </div>
  );
}

export function SegmentField({
  label,
  note,
  options,
  value,
  onChange
}: {
  label: string;
  note?: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} note={note}>
      <div className="segment-group">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`segment-btn${value === o ? ' selected' : ''}`}
            onClick={() => onChange(value === o ? '' : o)}
          >
            {o}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function MultiField({
  label,
  note,
  options,
  values,
  onChange
}: {
  label: string;
  note?: string;
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <Field label={label} note={note}>
      <div className="multi-group">
        {options.map((o) => {
          const selected = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              className={`multi-btn${selected ? ' selected' : ''}`}
              onClick={() => onChange(selected ? values.filter((v) => v !== o) : [...values, o])}
            >
              {selected ? '✓ ' : ''}
              {o}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

export function TextField({
  label,
  note,
  value,
  onChange,
  placeholder,
  multiline,
  rows
}: {
  label: string;
  note?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <Field label={label} note={note}>
      {multiline ? (
        <textarea className="input" rows={rows ?? 3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <input className="input" type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
