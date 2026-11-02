import type { Pacing, PacingStrategy } from '../core/types';

export type PacingSelectProps = {
  pacing?: Pacing;
  onPacingChange: (pacing: Pacing | undefined) => void;
};

const STRATEGIES: ReadonlyArray<{ value: PacingStrategy; label: string }> = [
  { value: 'steady', label: 'Steady' },
  { value: 'rampUp', label: 'Ramp Up' },
  { value: 'bigFinish', label: 'Big Finish' },
];

export const PacingSelect = ({ pacing, onPacingChange }: PacingSelectProps) => (
  <div className="metric-stage__pacing">
    <label className="metric-stage__field">
      <span className="metric-stage__label">Pacing</span>
      <select
        className="metric-stage__select"
        value={pacing?.strategy ?? ''}
        onChange={(event) =>
          onPacingChange(
            event.target.value === ''
              ? undefined
              : {
                  strategy: event.target.value as PacingStrategy,
                  excludeWeekends: pacing?.excludeWeekends,
                }
          )
        }
      >
        <option value="">No pacing</option>
        {STRATEGIES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>

    {pacing && (
      <label className="metric-stage__checkbox">
        <input
          type="checkbox"
          checked={pacing.excludeWeekends ?? false}
          onChange={(event) =>
            onPacingChange({
              ...pacing,
              excludeWeekends: event.target.checked,
            })
          }
        />
        <span className="metric-stage__label">Exclude weekends</span>
      </label>
    )}
  </div>
);
