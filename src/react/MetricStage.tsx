import type { Aggregation, MetricDefinition } from '../core/metricDefinition';
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
        <span className="metric-stage__label">Source</span>
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
            <span className="metric-stage__label">Aggregation</span>
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
              <span className="metric-stage__label">Field</span>
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
            <span className="metric-stage__label">Subject</span>
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
        </>
      )}
    </div>
  );
};
