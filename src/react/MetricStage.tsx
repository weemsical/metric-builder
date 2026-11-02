import type { Aggregation, MetricDefinition } from '../core/metricDefinition';
import type { RankMethod } from '../core/types';
import { FilterRow } from './FilterRow';
import { PacingSelect } from './PacingSelect';
import { TargetInput } from './TargetInput';
import { WindowControls } from './WindowControls';
import { useMetricBuilder } from './useMetricBuilder';
import './MetricStage.css';

export type MetricStageProps = {
  definition: MetricDefinition;
  onChange: (next: MetricDefinition) => void;
};

const AGGREGATIONS: ReadonlyArray<{ value: Aggregation; label: string }> = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'countDistinct', label: 'Count Distinct' },
];

export const MetricStage = ({ definition, onChange }: MetricStageProps) => {
  const builder = useMetricBuilder(definition, onChange);
  const { measure } = definition;

  if (builder.sourcesError) {
    return (
      <div className="metric-stage">
        <p className="metric-stage__hint" role="alert">
          Couldn't load sources.
        </p>
      </div>
    );
  }

  return (
    <div className="metric-stage">
      <label className="metric-stage__field">
        <span className="metric-stage__label">What are you measuring?</span>
        <select
          className="metric-stage__select"
          value={definition.sourceId ?? ''}
          onChange={(event) => builder.selectSource(event.target.value)}
        >
          <option value="" disabled>
            Choose a source…
          </option>
          {builder.sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </label>

      {!definition.sourceId ? (
        <p className="metric-stage__hint">Pick a source to define a measure.</p>
      ) : builder.fieldsLoading ? (
        <p className="metric-stage__hint">Loading fields…</p>
      ) : builder.fieldsError ? (
        <p className="metric-stage__hint" role="alert">
          Couldn't load fields for this source.
        </p>
      ) : (
        <>
          <label className="metric-stage__field">
            <span className="metric-stage__label">How should we total it?</span>
            <select
              className="metric-stage__select"
              value={measure?.aggregation ?? ''}
              onChange={(event) =>
                builder.selectAggregation(event.target.value as Aggregation)
              }
            >
              <option value="" disabled>
                Choose an aggregation…
              </option>
              {AGGREGATIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {measure?.aggregation !== 'count' && (
            <label className="metric-stage__field">
              <span className="metric-stage__label">Which field?</span>
              <select
                className="metric-stage__select"
                value={measure?.field ?? ''}
                onChange={(event) => builder.selectField(event.target.value)}
              >
                <option value="" disabled>
                  Choose a field…
                </option>
                {builder.fields.map((field) => (
                  <option key={field.apiName} value={field.apiName}>
                    {field.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="metric-stage__field">
            <span className="metric-stage__label">Group results by</span>
            <select
              className="metric-stage__select"
              value={definition.subjectField ?? ''}
              onChange={(event) => builder.selectSubject(event.target.value)}
            >
              <option value="" disabled>
                Choose a subject…
              </option>
              {builder.fields.map((field) => (
                <option key={field.apiName} value={field.apiName}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>

          <div className="metric-stage__filters">
            <span className="metric-stage__label">Filters</span>
            {builder.filters.map((filter, index) => (
              <FilterRow
                key={index}
                filter={filter}
                fields={builder.fields}
                operatorsFor={builder.operatorsFor}
                onChange={(next) => builder.changeFilter(index, next)}
                onRemove={() => builder.removeFilter(index)}
              />
            ))}
            <button
              type="button"
              disabled={builder.fields.length === 0}
              onClick={() =>
                builder.addFilter({
                  field: builder.fields[0].apiName,
                  operator: builder.operatorsFor(builder.fields[0].apiName)[0],
                  value: '',
                })
              }
            >
              Add filter
            </button>

            <label className="metric-stage__field">
              <span className="metric-stage__label">Advanced filter logic</span>
              <input
                className="metric-stage__select"
                placeholder="e.g. 1 AND (2 OR 3)"
                value={builder.filterLogic ?? ''}
                onChange={(event) => builder.setFilterLogic(event.target.value)}
              />
            </label>
          </div>

          <WindowControls
            dateFields={builder.dateFields}
            window={builder.window}
            range={builder.range}
            onWindowChange={builder.setWindow}
            onRangeChange={builder.setRange}
          />

          <TargetInput
            target={builder.target}
            thresholds={builder.thresholds}
            onTargetChange={builder.setTarget}
            onThresholdsChange={builder.setThresholds}
          />

          <PacingSelect
            pacing={builder.pacing}
            onPacingChange={builder.setPacing}
          />

          <label className="metric-stage__field">
            <span className="metric-stage__label">Rank by</span>
            <select
              className="metric-stage__select"
              value={builder.rankMethod ?? 'score'}
              onChange={(event) =>
                builder.setRankMethod(event.target.value as RankMethod)
              }
            >
              <option value="score">Score</option>
              <option value="percentToGoal">Percent to goal</option>
            </select>
          </label>
        </>
      )}
    </div>
  );
};
