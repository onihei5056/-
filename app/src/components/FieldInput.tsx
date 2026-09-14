import type { ReactNode } from 'react';
import type { AnswerValue, FieldDef } from '../types';
import { computeCalc } from '../utils/calc';

interface Props {
  field: FieldDef;
  value: AnswerValue | undefined;
  values: Record<string, AnswerValue>;
  manualOverride: boolean;
  onChange: (value: AnswerValue) => void;
  onToggleManual: (manual: boolean) => void;
  error?: string;
}

export function FieldInput({ field, value, values, manualOverride, onChange, onToggleManual, error }: Props) {
  const label = (
    <label className="field-label">
      {field.label}
      {field.required && <span className="field-required">必須</span>}
      {field.needsConfirmation && <span className="field-confirm-flag" title={field.excelRef}>要確認</span>}
      {field.unit && <span className="field-unit">({field.unit})</span>}
    </label>
  );

  let body: ReactNode;

  switch (field.type) {
    case 'text':
      body = (
        <input
          className="input"
          type="text"
          value={(value as string) ?? ''}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case 'textarea':
      body = (
        <textarea
          className="input"
          rows={4}
          value={(value as string) ?? ''}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case 'number':
      body = (
        <div className="input-with-unit">
          <input
            className="input"
            type="number"
            inputMode="decimal"
            value={value === null || value === undefined ? '' : String(value)}
            min={field.min}
            max={field.max}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          />
        </div>
      );
      break;
    case 'date':
      body = (
        <input
          className="input"
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case 'select':
      body = (
        <select className="input" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">選択してください</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'radio':
      body = (
        <div className="segment-group">
          {field.options?.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`segment-btn${value === o.value ? ' selected' : ''}`}
              onClick={() => onChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      );
      break;
    case 'checkbox-multi': {
      const arr = Array.isArray(value) ? value : [];
      body = (
        <div className="multi-group">
          {field.options?.map((o) => {
            const selected = arr.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                className={`multi-btn${selected ? ' selected' : ''}`}
                onClick={() => {
                  const next = selected ? arr.filter((v) => v !== o.value) : [...arr, o.value];
                  onChange(next);
                }}
              >
                {selected ? '✓ ' : ''}
                {o.label}
              </button>
            );
          })}
        </div>
      );
      break;
    }
    case 'calc': {
      const computed = field.calc ? computeCalc(field.calc, values) : 0;
      if (manualOverride) {
        body = (
          <div>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              value={value === null || value === undefined ? '' : String(value)}
              onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            />
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onToggleManual(false)}>
              自動計算に戻す
            </button>
          </div>
        );
      } else {
        body = (
          <div className="calc-readout">
            <span>
              {computed}
              {field.unit}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onToggleManual(true)}>
              手動修正
            </button>
          </div>
        );
      }
      break;
    }
    default:
      body = null;
  }

  return (
    <div className="field">
      {label}
      {body}
      {field.note && <div className="field-note">※ {field.note}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
