import { describe, expect, it } from 'vitest';
import { computeSubjectValues } from './computeSubjectValues';

const rows = [
  { traineeId: 'ana', reps: 10 },
  { traineeId: 'ana', reps: 20 },
  { traineeId: 'bo', reps: 5 },
  { traineeId: null, reps: 99 },
  { traineeId: 'cy', reps: 'not-a-number' },
];

describe('computeSubjectValues', () => {
  it('returns empty for an incomplete definition', () => {
    expect(computeSubjectValues(rows, { sourceId: 'gym' })).toEqual([]);
  });

  it('sums per subject, skipping null subjects and non-numeric values, sorted desc', () => {
    expect(
      computeSubjectValues(rows, {
        sourceId: 'gym',
        measure: { field: 'reps', aggregation: 'sum' },
        subjectField: 'traineeId',
      })
    ).toEqual([
      { subject: 'ana', value: 30 },
      { subject: 'bo', value: 5 },
      { subject: 'cy', value: 0 },
    ]);
  });

  it('counts rows per subject', () => {
    expect(
      computeSubjectValues(rows, {
        sourceId: 'gym',
        measure: { aggregation: 'count' },
        subjectField: 'traineeId',
      })
    ).toEqual([
      { subject: 'ana', value: 2 },
      { subject: 'bo', value: 1 },
      { subject: 'cy', value: 1 },
    ]);
  });
});
