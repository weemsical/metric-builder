import { useEffect, useState } from 'react';
import {
  createMemoryStore,
  createMockProvider,
  emptyMetricDefinition,
  isMetricComplete,
  type MetricDefinition,
  type SubjectValue,
} from '../core';
import {
  MetricBuilderProvider,
  MetricStage,
  useSavedMetrics,
} from '../react';
import { seeds } from './seeds';

const provider = createMockProvider(seeds);
const store = createMemoryStore();

const SavedMetrics = ({
  definition,
  onLoad,
}: {
  definition: MetricDefinition;
  onLoad: (definition: MetricDefinition) => void;
}) => {
  const { saved, loading, save, load, remove } = useSavedMetrics();
  const [name, setName] = useState('');

  return (
    <div>
      <h2 style={{ fontSize: '1rem', marginTop: '1.5rem' }}>Saved metrics</h2>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          placeholder="Name this metric"
          value={name}
          onChange={(event) => setName(event.target.value)}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          disabled={!name}
          onClick={() => {
            save(name, definition);
            setName('');
          }}
        >
          Save
        </button>
      </div>
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : saved.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Nothing saved yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {saved.map((metric) => (
            <li key={metric.id} style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                style={{ flex: 1, textAlign: 'left' }}
                onClick={() => load(metric.id).then((m) => onLoad(m.definition))}
              >
                {metric.name}
              </button>
              <button type="button" onClick={() => remove(metric.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const App = () => {
  const [definition, setDefinition] = useState<MetricDefinition>(
    emptyMetricDefinition()
  );
  const [leaderboard, setLeaderboard] = useState<SubjectValue[]>([]);

  useEffect(() => {
    provider.queryData(definition).then(setLeaderboard);
  }, [definition]);

  const complete = isMetricComplete(definition);

  return (
    <MetricBuilderProvider dataProvider={provider} metricStore={store}>
      <main
        style={{
          fontFamily: 'system-ui, sans-serif',
          maxWidth: 760,
          margin: '2rem auto',
          padding: '0 1rem',
          color: '#111827',
        }}
      >
        <h1 style={{ marginBottom: '0.25rem' }}>Metric Builder</h1>
        <p style={{ marginTop: 0, color: '#6b7280' }}>
          Pick a source, define a measure, group by a subject. Try{' '}
          <strong>Gym Sessions → Sum of Reps by Trainee</strong> or{' '}
          <strong>Sales Activity → Sum of Amount by Owner</strong>.
        </p>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            marginTop: '1.5rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1rem' }}>Definition</h2>
            <MetricStage definition={definition} onChange={setDefinition} />
            <SavedMetrics definition={definition} onLoad={setDefinition} />
          </div>

          <div>
            <h2 style={{ fontSize: '1rem' }}>Leaderboard</h2>
            {complete ? (
              <ol style={{ paddingLeft: '1.25rem' }}>
                {leaderboard.map((row) => (
                  <li key={row.subject}>
                    <strong>{row.subject}</strong> — {row.value}
                  </li>
                ))}
              </ol>
            ) : (
              <p style={{ color: '#6b7280' }}>
                Finish the definition to preview a ranking.
              </p>
            )}

            <h2 style={{ fontSize: '1rem', marginTop: '1.5rem' }}>State</h2>
            <pre
              style={{
                background: '#f3f4f6',
                padding: '0.75rem',
                borderRadius: 6,
                fontSize: '0.8rem',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(definition, null, 2)}
            </pre>
          </div>
        </section>
      </main>
    </MetricBuilderProvider>
  );
};
