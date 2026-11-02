import type { Granularity, Range, SourceField, Window } from '../core/types';

export type WindowControlsProps = {
  dateFields: SourceField[];
  window?: Window;
  range?: Range;
  onWindowChange: (window: Window | undefined) => void;
  onRangeChange: (range: Range | undefined) => void;
};

const GRANULARITIES: ReadonlyArray<{ value: Granularity; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

export const WindowControls = ({
  dateFields,
  window,
  range,
  onWindowChange,
  onRangeChange,
}: WindowControlsProps) => (
  <div className="metric-stage__window">
    <label className="metric-stage__field">
      <span className="metric-stage__label">Window field</span>
      <select
        className="metric-stage__select"
        value={window?.field ?? ''}
        onChange={(event) =>
          onWindowChange(
            event.target.value
              ? {
                  field: event.target.value,
                  granularity: window?.granularity ?? 'daily',
                }
              : undefined
          )
        }
      >
        <option value="">No trend window</option>
        {dateFields.map((field) => (
          <option key={field.apiName} value={field.apiName}>
            {field.label}
          </option>
        ))}
      </select>
    </label>

    {window && (
      <label className="metric-stage__field">
        <span className="metric-stage__label">Granularity</span>
        <select
          className="metric-stage__select"
          value={window.granularity}
          onChange={(event) =>
            onWindowChange({
              ...window,
              granularity: event.target.value as Granularity,
            })
          }
        >
          {GRANULARITIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    )}

    <label className="metric-stage__field">
      <span className="metric-stage__label">Range field</span>
      <select
        className="metric-stage__select"
        value={range?.field ?? ''}
        onChange={(event) =>
          onRangeChange(
            event.target.value
              ? { field: event.target.value, lastDays: range?.lastDays ?? 30 }
              : undefined
          )
        }
      >
        <option value="">No rolling range</option>
        {dateFields.map((field) => (
          <option key={field.apiName} value={field.apiName}>
            {field.label}
          </option>
        ))}
      </select>
    </label>

    {range && (
      <label className="metric-stage__field">
        <span className="metric-stage__label">Last days</span>
        <input
          className="metric-stage__select"
          type="number"
          value={String(range.lastDays)}
          onChange={(event) =>
            onRangeChange({ ...range, lastDays: Number(event.target.value) })
          }
        />
      </label>
    )}
  </div>
);
