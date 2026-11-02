import type { Direction, Target, Thresholds } from '../core/types';

export type TargetInputProps = {
  target?: Target;
  thresholds?: Thresholds;
  onTargetChange: (target: Target | undefined) => void;
  onThresholdsChange: (thresholds: Thresholds | undefined) => void;
};

export const TargetInput = ({
  target,
  thresholds,
  onTargetChange,
  onThresholdsChange,
}: TargetInputProps) => (
  <div className="metric-stage__target">
    <label className="metric-stage__field">
      <span className="metric-stage__label">Goal value</span>
      <input
        className="metric-stage__select"
        type="number"
        value={target?.value ?? ''}
        onChange={(event) =>
          onTargetChange(
            event.target.value === ''
              ? undefined
              : {
                  value: Number(event.target.value),
                  direction: target?.direction ?? 'higherIsBetter',
                }
          )
        }
      />
    </label>

    <label className="metric-stage__field">
      <span className="metric-stage__label">Goal direction</span>
      <select
        className="metric-stage__select"
        value={target?.direction ?? 'higherIsBetter'}
        onChange={(event) =>
          onTargetChange({
            value: target?.value,
            direction: event.target.value as Direction,
          })
        }
      >
        <option value="higherIsBetter">Higher is better</option>
        <option value="lowerIsBetter">Lower is better</option>
      </select>
    </label>

    <label className="metric-stage__field">
      <span className="metric-stage__label">Amber threshold</span>
      <input
        className="metric-stage__select"
        type="number"
        step="0.1"
        value={thresholds?.amber ?? ''}
        onChange={(event) =>
          onThresholdsChange({
            amber: Number(event.target.value),
            green: thresholds?.green ?? 0,
          })
        }
      />
    </label>

    <label className="metric-stage__field">
      <span className="metric-stage__label">Green threshold</span>
      <input
        className="metric-stage__select"
        type="number"
        step="0.1"
        value={thresholds?.green ?? ''}
        onChange={(event) =>
          onThresholdsChange({
            amber: thresholds?.amber ?? 0,
            green: Number(event.target.value),
          })
        }
      />
    </label>
  </div>
);
