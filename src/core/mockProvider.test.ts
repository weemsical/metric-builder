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
    { traineeId: 'ana', reps: 10 },
    { traineeId: 'ana', reps: 20 },
    { traineeId: 'bo', reps: 5 },
    { traineeId: null, reps: 99 },
    { traineeId: 'cy', reps: 'not-a-number' },
  ],
};

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
    expect(await provider.queryData({ sourceId: 'gym' })).toEqual([]);
  });

  it('returns an empty result when no source is selected', async () => {
    expect(await provider.queryData({})).toEqual([]);
  });

  it('throws querying an unknown source', async () => {
    await expect(
      provider.queryData({
        sourceId: 'nope',
        measure: { aggregation: 'count' },
        subjectField: 'traineeId',
      })
    ).rejects.toThrow('nope');
  });

  it('sums a field per subject, skipping null subjects and non-numeric values, sorted desc', async () => {
    const rows = await provider.queryData({
      sourceId: 'gym',
      measure: { field: 'reps', aggregation: 'sum' },
      subjectField: 'traineeId',
    });
    expect(rows).toEqual([
      { subject: 'ana', value: 30 },
      { subject: 'bo', value: 5 },
      { subject: 'cy', value: 0 },
    ]);
  });

  it('counts rows per subject', async () => {
    const rows = await provider.queryData({
      sourceId: 'gym',
      measure: { aggregation: 'count' },
      subjectField: 'traineeId',
    });
    expect(rows).toEqual([
      { subject: 'ana', value: 2 },
      { subject: 'bo', value: 1 },
      { subject: 'cy', value: 1 },
    ]);
  });
});
