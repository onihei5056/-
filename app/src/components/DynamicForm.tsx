import { useState } from 'react';
import type { AnswerValue, SubGroup, ValidationIssue } from '../types';
import { isFieldVisible } from '../utils/condition';
import { computeGroupProgress } from '../utils/progress';
import { FieldInput } from './FieldInput';

interface Props {
  sectionId: string;
  groups: SubGroup[];
  values: Record<string, AnswerValue>;
  globals?: Record<string, AnswerValue>;
  manualOverride: Record<string, boolean>;
  issues?: ValidationIssue[];
  onChange: (fieldId: string, value: AnswerValue) => void;
  onToggleManual: (fieldId: string, manual: boolean) => void;
}

/**
 * 中分類ごとの開閉式(アコーディオン)フォーム。
 * 項目数が多いため既定では閉じておき、見出しをタップしたときだけ小項目を表示する。
 * 見出しには入力済み件数を出し、どこまで入力したかを畳んだままでも把握できるようにしている。
 */
export function DynamicForm({
  sectionId,
  groups,
  values,
  globals,
  manualOverride,
  issues,
  onChange,
  onToggleManual
}: Props) {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const errorByField = new Map((issues ?? []).filter((i) => i.fieldId).map((i) => [i.fieldId, i.message]));

  const toggle = (id: string) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allOpen = openIds.length === groups.length;

  return (
    <>
      <div className="accordion-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setOpenIds(allOpen ? [] : groups.map((g) => g.id))}
        >
          {allOpen ? 'すべて閉じる' : 'すべて開く'}
        </button>
      </div>

      {groups.map((group) => {
        const open = openIds.includes(group.id);
        const p = computeGroupProgress(sectionId, group.id, values);
        const visibleFields = group.fields.filter((field) => isFieldVisible(field.condition, values));
        return (
          <div className={`card accordion${open ? ' open' : ''}`} key={group.id}>
            <button type="button" className="accordion-header" onClick={() => toggle(group.id)} aria-expanded={open}>
              <span className="accordion-header__title">{group.title}</span>
              <span className="accordion-header__right">
                <span className={`accordion-header__count${p.total > 0 && p.filled === p.total ? ' complete' : ''}`}>
                  {p.filled}/{p.total}
                </span>
                <span className="accordion-header__chevron">{open ? '▲' : '▼'}</span>
              </span>
            </button>

            {open && (
              <div className="accordion-body">
                {visibleFields.map((field) => (
                  <FieldInput
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                    values={values}
                    globals={globals}
                    manualOverride={!!manualOverride[field.id]}
                    error={errorByField.get(field.id)}
                    onChange={(v) => onChange(field.id, v)}
                    onToggleManual={(m) => onToggleManual(field.id, m)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
