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

  it('is unchanged by an empty filters array (backward compat)', () => {
    const withEmpty = computeSubjectValues(rows, {
      sourceId: 'gym',
      measure: { field: 'reps', aggregation: 'sum' },
      subjectField: 'traineeId',
      filters: [],
    });
    const without = computeSubjectValues(rows, {
      sourceId: 'gym',
      measure: { field: 'reps', aggregation: 'sum' },
      subjectField: 'traineeId',
    });
    expect(withEmpty).toEqual(without);
  });

  it('applies filters (AND) before aggregating', () => {
    expect(
      computeSubjectValues(rows, {
        sourceId: 'gym',
        measure: { field: 'reps', aggregation: 'sum' },
        subjectField: 'traineeId',
        filters: [{ field: 'reps', operator: 'gte', value: 10 }],
      })
    ).toEqual([{ subject: 'ana', value: 30 }]);
  });

  it('honors filterLogic to OR filters', () => {
    expect(
      computeSubjectValues(rows, {
        sourceId: 'gym',
        measure: { aggregation: 'count' },
        subjectField: 'traineeId',
        filters: [
          { field: 'reps', operator: 'gte', value: 100 },
          { field: 'reps', operator: 'lt', value: 10 },
        ],
        filterLogic: '1 OR 2',
      })
    ).toEqual([{ subject: 'bo', value: 1 }]);
  });

  it('excludes all rows when filterLogic is invalid', () => {
    expect(
      computeSubjectValues(rows, {
        sourceId: 'gym',
        measure: { aggregation: 'count' },
        subjectField: 'traineeId',
        filters: [{ field: 'reps', operator: 'gte', value: 10 }],
        filterLogic: 'banana',
      })
    ).toEqual([]);
  });

  it('counts distinct non-null field values per subject', () => {
    const sessions = [
      { trainerId: 't1', traineeId: 'ana' },
      { trainerId: 't1', traineeId: 'ana' },
      { trainerId: 't1', traineeId: 'bo' },
      { trainerId: 't2', traineeId: 'cy' },
      { trainerId: 't2', traineeId: null },
    ];
    expect(
      computeSubjectValues(sessions, {
        sourceId: 'gym',
        measure: { field: 'traineeId', aggregation: 'countDistinct' },
        subjectField: 'trainerId',
      })
    ).toEqual([
      { subject: 't1', value: 2 },
      { subject: 't2', value: 1 },
    ]);
  });
});
