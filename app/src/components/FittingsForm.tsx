import { useState } from 'react';
import type { AnswerValue, FittingsRow } from '../types';
import {
  FITTINGS_DEFECT_LABEL,
  fittingsKey,
  getFittingsGroups,
  parseChoices
} from '../schema/fittings';
import { computeFittingsRowFilled } from '../utils/progress';

interface Props {
  values: Record<string, AnswerValue>;
  onChange: (key: string, value: AnswerValue) => void;
}

/**
 * 付帯設備表の入力フォーム。
 * schema/fittings.ts の行定義(Excelの2〜48行)をそのままの並び順で描画する。
 * 中項目ごとの開閉式にして、既定では閉じた状態から始める。
 *
 * 保存キーは行番号ベース(r{行番号}_e など)なので、
 * 中項目名・小項目名が重複していても別の行の入力と混ざらない。
 */
export function FittingsForm({ values, onChange }: Props) {
  const groups = getFittingsGroups();
  const [openKeys, setOpenKeys] = useState<number[]>([]);
  const allOpen = openKeys.length === groups.length;

  const toggle = (key: number) =>
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <>
      <div className="accordion-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setOpenKeys(allOpen ? [] : groups.map((g) => g.key))}
        >
          {allOpen ? 'すべて閉じる' : 'すべて開く'}
        </button>
      </div>

      {groups.map((group) => {
        const open = openKeys.includes(group.key);
        const filled = group.rows.filter((r) => computeFittingsRowFilled(r, values)).length;
        return (
          <div className={`card accordion${open ? ' open' : ''}`} key={group.key}>
            <button
              type="button"
              className="accordion-header"
              onClick={() => toggle(group.key)}
              aria-expanded={open}
            >
              <span className="accordion-header__title">{group.middle}</span>
              <span className="accordion-header__count">
                {filled}/{group.rows.length}
              </span>
              <span className="accordion-header__chevron">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
              <div className="accordion-body">
                {group.rows.map((row) => (
                  <FittingsRowInput key={row.row} row={row} values={values} onChange={onChange} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

interface RowProps {
  row: FittingsRow;
  values: Record<string, AnswerValue>;
  onChange: (key: string, value: AnswerValue) => void;
}

function FittingsRowInput({ row, values, onChange }: RowProps) {
  // D列が「自由記載」の行(備考)。行ごとに別々の欄として保存する
  if (row.mode === '自由記載') {
    const key = fittingsKey(row.row, 'text');
    return (
      <div className="fittings-row">
        <div className="fittings-row__title">{row.small || row.middle}</div>
        <textarea
          className="input"
          rows={4}
          value={(values[key] as string) ?? ''}
          onChange={(e) => onChange(key, e.target.value)}
        />
      </div>
    );
  }

  const eKey = fittingsKey(row.row, 'e');
  const fKey = fittingsKey(row.row, 'f');
  const gKey = fittingsKey(row.row, 'g');
  const hKey = fittingsKey(row.row, 'h');
  const eChoices = row.e ? parseChoices(row.e) : null;
  const fChoices = row.f ? parseChoices(row.f) : null;

  return (
    <div className="fittings-row">
      <div className="fittings-row__title">{row.small}</div>

      {/* E列: 1つだけ選択(もう一度押すと選択を外せる) */}
      {eChoices && (
        <div className="segment-group">
          {eChoices.options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`segment-btn${values[eKey] === opt ? ' selected' : ''}`}
              onClick={() => onChange(eKey, values[eKey] === opt ? '' : opt)}
            >
              {values[eKey] === opt ? '☑ ' : '☐ '}
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* F列: 既定は複数選択。排他指定のものだけ1つだけ選択 */}
      {fChoices && (
        <div className="fittings-sub">
          {fChoices.prefix && <div className="fittings-sub__label">{fChoices.prefix}</div>}
          {fChoices.exclusive ? (
            <div className="segment-group">
              {fChoices.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`segment-btn${values[fKey] === opt ? ' selected' : ''}`}
                  onClick={() => onChange(fKey, values[fKey] === opt ? '' : opt)}
                >
                  {values[fKey] === opt ? '☑ ' : '☐ '}
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="multi-group">
              {fChoices.options.map((opt) => {
                const arr = Array.isArray(values[fKey]) ? (values[fKey] as string[]) : [];
                const selected = arr.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`multi-btn${selected ? ' selected' : ''}`}
                    onClick={() =>
                      onChange(fKey, selected ? arr.filter((v) => v !== opt) : [...arr, opt])
                    }
                  >
                    {selected ? '☑ ' : '☐ '}
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* G列: 追加自由入力項目。Excelに記載がある行だけ表示する */}
      {row.g && (
        <div className="fittings-sub">
          <div className="fittings-sub__label">{row.g}</div>
          <input
            className="input"
            type="text"
            value={(values[gKey] as string) ?? ''}
            onChange={(e) => onChange(gKey, e.target.value)}
          />
        </div>
      )}

      {/* H列: 全ての入力行に共通の自由記載欄 */}
      <div className="fittings-sub">
        <div className="fittings-sub__label">{FITTINGS_DEFECT_LABEL}</div>
        <textarea
          className="input"
          rows={2}
          value={(values[hKey] as string) ?? ''}
          onChange={(e) => onChange(hKey, e.target.value)}
        />
      </div>
    </div>
  );
}
