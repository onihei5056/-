import type { AnswerValue, SubGroup, ValidationIssue } from '../types';
import { isFieldVisible } from '../utils/condition';
import { FieldInput } from './FieldInput';

interface Props {
  groups: SubGroup[];
  values: Record<string, AnswerValue>;
  globals?: Record<string, AnswerValue>;
  manualOverride: Record<string, boolean>;
  issues?: ValidationIssue[];
  onChange: (fieldId: string, value: AnswerValue) => void;
  onToggleManual: (fieldId: string, manual: boolean) => void;
}

export function DynamicForm({ groups, values, globals, manualOverride, issues, onChange, onToggleManual }: Props) {
  const errorByField = new Map((issues ?? []).filter((i) => i.fieldId).map((i) => [i.fieldId, i.message]));

  return (
    <>
      {groups.map((group) => (
        <div className="card" key={group.id}>
          <h3 className="card-title">{group.title}</h3>
          {group.fields
            .filter((field) => isFieldVisible(field.condition, values))
            .map((field) => (
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
      ))}
    </>
  );
}
