import type { ReactNode } from 'react';
import type { Formula, MetricDefinition } from '../core/metricDefinition';
import type { FormulaOp } from '../core/types';

export type FormulaBuilderProps = {
  formula: Formula;
  onChange: (formula: Formula) => void;
  renderComponent: (
    component: MetricDefinition,
    onComponentChange: (next: MetricDefinition) => void,
    index: number
  ) => ReactNode;
};

const OPERATIONS: ReadonlyArray<{ value: FormulaOp; label: string }> = [
  { value: 'add', label: '+ Add' },
  { value: 'subtract', label: '− Subtract' },
  { value: 'multiply', label: '× Multiply' },
  { value: 'divide', label: '÷ Divide' },
];

export const FormulaBuilder = ({
  formula,
  onChange,
  renderComponent,
}: FormulaBuilderProps) => {
  const replaceComponent = (index: number, next: MetricDefinition) =>
    onChange({
      ...formula,
      components: formula.components.map((component, i) =>
        i === index ? next : component
      ),
    });

  return (
    <div className="metric-stage__formula">
      <label className="metric-stage__field">
        <span className="metric-stage__label">Operation</span>
        <select
          className="metric-stage__select"
          value={formula.op}
          onChange={(event) =>
            onChange({ ...formula, op: event.target.value as FormulaOp })
          }
        >
          {OPERATIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {formula.components.map((component, index) => (
        <div key={index} className="metric-stage__formula-component">
          {renderComponent(
            component,
            (next) => replaceComponent(index, next),
            index
          )}
          <button
            type="button"
            onClick={() =>
              onChange({
                ...formula,
                components: formula.components.filter((_, i) => i !== index),
              })
            }
          >
            Remove component
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange({ ...formula, components: [...formula.components, {}] })
        }
      >
        Add component
      </button>
    </div>
  );
};
