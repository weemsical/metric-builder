import type { Filter, FilterOperator, SourceField } from '../core/types';

export type FilterRowProps = {
  filter: Filter;
  fields: SourceField[];
  operatorsFor: (field: string) => FilterOperator[];
  onChange: (filter: Filter) => void;
  onRemove: () => void;
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Equals',
  notEquals: 'Not equals',
  gt: 'Greater than',
  gte: 'Greater than or equal',
  lt: 'Less than',
  lte: 'Less than or equal',
  contains: 'Contains',
  isTrue: 'Is true',
  isFalse: 'Is false',
  isNull: 'Is empty',
  isNotNull: 'Is not empty',
};

const VALUELESS: ReadonlySet<FilterOperator> = new Set([
  'isTrue',
  'isFalse',
  'isNull',
  'isNotNull',
]);

const inputTypeFor = (type: SourceField['type'] | undefined): string => {
  if (type === 'number') {
    return 'number';
  }
  if (type === 'date') {
    return 'date';
  }
  return 'text';
};

export const FilterRow = ({
  filter,
  fields,
  operatorsFor,
  onChange,
  onRemove,
}: FilterRowProps) => {
  const operators = operatorsFor(filter.field);
  const fieldType = fields.find((f) => f.apiName === filter.field)?.type;

  return (
    <div className="metric-stage__filter-row">
      <label className="metric-stage__field">
        <span className="metric-stage__label">Filter field</span>
        <select
          className="metric-stage__select"
          value={filter.field}
          onChange={(event) => {
            const field = event.target.value;
            onChange({
              ...filter,
              field,
              operator: operatorsFor(field)[0],
            });
          }}
        >
          {fields.map((field) => (
            <option key={field.apiName} value={field.apiName}>
              {field.label}
            </option>
          ))}
        </select>
      </label>

      <label className="metric-stage__field">
        <span className="metric-stage__label">Operator</span>
        <select
          className="metric-stage__select"
          value={filter.operator}
          onChange={(event) =>
            onChange({
              ...filter,
              operator: event.target.value as FilterOperator,
            })
          }
        >
          {operators.map((operator) => (
            <option key={operator} value={operator}>
              {OPERATOR_LABELS[operator]}
            </option>
          ))}
        </select>
      </label>

      {!VALUELESS.has(filter.operator) && (
        <label className="metric-stage__field">
          <span className="metric-stage__label">Value</span>
          <input
            className="metric-stage__select"
            type={inputTypeFor(fieldType)}
            value={String(filter.value ?? '')}
            onChange={(event) =>
              onChange({ ...filter, value: event.target.value })
            }
          />
        </label>
      )}

      <button type="button" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
};
