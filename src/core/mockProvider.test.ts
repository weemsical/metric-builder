import { describe, expect, it } from 'vitest';
import { createMockProvider, type MockSourceSeed } from './mockProvider';

const trainees: MockSourceSeed = {
  source: { id: 'gym', name: 'Gym Sessions', enabled: true },
  describe: {
    type: 'session',
    fields: [
      { apiName: 'trainerId', label: 'Trainer', type: 'text', isPrimaryKey: false },
      { apiName: 'traineeId', label: 'Trainee', type: 'text', isPrimaryKey: false },
      { apiName: 'reps', label: 'Reps', type: 'number', isPrimaryKey: false },
    ],
  },
  rows: [
    { traineeId: 'ana', reps: 10, day: '2024-03-01T00:00:00Z' },
    { traineeId: 'ana', reps: 20, day: '2024-03-01T00:00:00Z' },
    { traineeId: 'bo', reps: 5, day: '2024-03-01T00:00:00Z' },
    { traineeId: null, reps: 99, day: '2024-03-01T00:00:00Z' },
    { traineeId: 'cy', reps: 'not-a-number', day: '2024-03-01T00:00:00Z' },
  ],
};

const asOf = Date.parse('2024-06-01T00:00:00Z');
const provider = createMockProvider([trainees]);

describe('createMockProvider', () => {
  it('lists the seeded sources', async () => {
    expect(await provider.listSources()).toEqual([trainees.source]);
  });

  it('describes a known source', async () => {
    expect((await provider.describeSource('gym')).fields).toHaveLength(3);
  });

  it('throws describing an unknown source', async () => {
    await expect(provider.describeSource('nope')).rejects.toThrow('nope');
  });

  it('returns an empty result for an incomplete definition', async () => {
    expect(await provider.queryData({ sourceId: 'gym' }, asOf)).toEqual([]);
  });

  it('returns an empty result when no source is selected', async () => {
    expect(await provider.queryData({}, asOf)).toEqual([]);
  });

  it('throws querying an unknown source', async () => {
    await expect(
      provider.queryData(
        {
          sourceId: 'nope',
          measure: { aggregation: 'count' },
          subjectField: 'traineeId',
        },
        asOf
      )
    ).rejects.toThrow('nope');
  });

  it('sums a field per subject, skipping null subjects and non-numeric values, sorted desc', async () => {
    const rows = await provider.queryData(
      {
        sourceId: 'gym',
        measure: { field: 'reps', aggregation: 'sum' },
        subjectField: 'traineeId',
      },
      asOf
    );
    expect(rows).toEqual([
      { subject: 'ana', value: 30 },
      { subject: 'bo', value: 5 },
      { subject: 'cy', value: 0 },
    ]);
  });

  it('counts rows per subject', async () => {
    const rows = await provider.queryData(
      {
        sourceId: 'gym',
        measure: { aggregation: 'count' },
        subjectField: 'traineeId',
      },
      asOf
    );
    expect(rows).toEqual([
      { subject: 'ana', value: 2 },
      { subject: 'bo', value: 1 },
      { subject: 'cy', value: 1 },
    ]);
  });

  it('returns an empty series when no source is selected', async () => {
    expect(await provider.querySeries!({}, asOf)).toEqual([]);
  });

  it('computes a per-subject series over seed rows', async () => {
    const series = await provider.querySeries!(
      {
        sourceId: 'gym',
        measure: { aggregation: 'count' },
        subjectField: 'traineeId',
        window: { field: 'day', granularity: 'daily' },
      },
      asOf
    );
    expect(series).toEqual([
      { subject: 'ana', points: [{ bucket: '2024-03-01', value: 2 }] },
      { subject: 'bo', points: [{ bucket: '2024-03-01', value: 1 }] },
      { subject: 'cy', points: [{ bucket: '2024-03-01', value: 1 }] },
    ]);
  });
});
