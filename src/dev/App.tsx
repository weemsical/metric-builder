import { useEffect, useState } from 'react';
import {
  createMockProvider,
  emptyMetricDefinition,
  isMetricComplete,
  type MetricDefinition,
  type SubjectValue,
} from '../core';
import { MetricBuilderProvider, MetricStage } from '../react';
import { seeds } from './seeds';

const provider = createMockProvider(seeds);

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
    <MetricBuilderProvider dataProvider={provider}>
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
