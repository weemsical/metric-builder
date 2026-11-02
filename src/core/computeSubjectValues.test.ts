import { describe, expect, it } from 'vitest';
import { computeSubjectValues } from './computeSubjectValues';

const asOf = Date.parse('2024-06-01T00:00:00Z');

const rows = [
  { traineeId: 'ana', reps: 10 },
  { traineeId: 'ana', reps: 20 },
  { traineeId: 'bo', reps: 5 },
  { traineeId: null, reps: 99 },
  { traineeId: 'cy', reps: 'not-a-number' },
];

describe('computeSubjectValues', () => {
  it('returns empty for an incomplete definition', () => {
    expect(computeSubjectValues(rows, { sourceId: 'gym' }, asOf)).toEqual([]);
  });

  it('sums per subject, skipping null subjects and non-numeric values, sorted desc', () => {
    expect(
      computeSubjectValues(
        rows,
        {
          sourceId: 'gym',
          measure: { field: 'reps', aggregation: 'sum' },
          subjectField: 'traineeId',
        },
        asOf
      )
    ).toEqual([
      { subject: 'ana', value: 30 },
      { subject: 'bo', value: 5 },
      { subject: 'cy', value: 0 },
    ]);
  });

  it('counts rows per subject', () => {
    expect(
      computeSubjectValues(
        rows,
        {
          sourceId: 'gym',
          measure: { aggregation: 'count' },
          subjectField: 'traineeId',
        },
        asOf
      )
    ).toEqual([
      { subject: 'ana', value: 2 },
      { subject: 'bo', value: 1 },
      { subject: 'cy', value: 1 },
    ]);
  });

  it('is unchanged by an empty filters array (backward compat)', () => {
    const withEmpty = computeSubjectValues(
      rows,
      {
        sourceId: 'gym',
        measure: { field: 'reps', aggregation: 'sum' },
        subjectField: 'traineeId',
        filters: [],
      },
      asOf
    );
    const without = computeSubjectValues(
      rows,
      {
        sourceId: 'gym',
        measure: { field: 'reps', aggregation: 'sum' },
        subjectField: 'traineeId',
      },
      asOf
    );
    expect(withEmpty).toEqual(without);
  });

  it('applies filters (AND) before aggregating', () => {
    expect(
      computeSubjectValues(
        rows,
        {
          sourceId: 'gym',
          measure: { field: 'reps', aggregation: 'sum' },
          subjectField: 'traineeId',
          filters: [{ field: 'reps', operator: 'gte', value: 10 }],
        },
        asOf
      )
    ).toEqual([{ subject: 'ana', value: 30 }]);
  });

  it('honors filterLogic to OR filters', () => {
    expect(
      computeSubjectValues(
        rows,
        {
          sourceId: 'gym',
          measure: { aggregation: 'count' },
          subjectField: 'traineeId',
          filters: [
            { field: 'reps', operator: 'gte', value: 100 },
            { field: 'reps', operator: 'lt', value: 10 },
          ],
          filterLogic: '1 OR 2',
        },
        asOf
      )
    ).toEqual([{ subject: 'bo', value: 1 }]);
  });

  it('excludes all rows when filterLogic is invalid', () => {
    expect(
      computeSubjectValues(
        rows,
        {
          sourceId: 'gym',
          measure: { aggregation: 'count' },
          subjectField: 'traineeId',
          filters: [{ field: 'reps', operator: 'gte', value: 10 }],
          filterLogic: 'banana',
        },
        asOf
      )
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
      computeSubjectValues(
        sessions,
        {
          sourceId: 'gym',
          measure: { field: 'traineeId', aggregation: 'countDistinct' },
          subjectField: 'trainerId',
        },
        asOf
      )
    ).toEqual([
      { subject: 't1', value: 2 },
      { subject: 't2', value: 1 },
    ]);
  });

  it('attaches the first valid coordinates per subject when requested', () => {
    const sites = [
      { region: 'north', lat: 'nope', lng: -74.1 },
      { region: 'north', lat: 40.2, lng: -74.2 },
      { region: 'south', lat: 30, lng: -80 },
    ];
    expect(
      computeSubjectValues(
        sites,
        {
          sourceId: 'geo',
          measure: { aggregation: 'count' },
          subjectField: 'region',
          coordinates: { latField: 'lat', lngField: 'lng' },
        },
        asOf
      )
    ).toEqual([
      { subject: 'north', value: 2, coordinates: { lat: 40.2, lng: -74.2 } },
      { subject: 'south', value: 1, coordinates: { lat: 30, lng: -80 } },
    ]);
  });

  it('never attaches coordinates when not requested', () => {
    const result = computeSubjectValues(
      [{ region: 'north', lat: 40.2, lng: -74.2 }],
      {
        sourceId: 'geo',
        measure: { aggregation: 'count' },
        subjectField: 'region',
      },
      asOf
    );
    expect(result[0]).not.toHaveProperty('coordinates');
  });

  it('applies a rolling range anchored at asOf before aggregating', () => {
    const dated = [
      { owner: 'Jo', amount: 100, date: '2024-03-01T00:00:00Z' },
      { owner: 'Jo', amount: 50, date: '2024-03-20T00:00:00Z' },
    ];
    expect(
      computeSubjectValues(
        dated,
        {
          sourceId: 'crm',
          measure: { field: 'amount', aggregation: 'sum' },
          subjectField: 'owner',
          range: { field: 'date', lastDays: 7 },
        },
        Date.parse('2024-03-22T00:00:00Z')
      )
    ).toEqual([{ subject: 'Jo', value: 50 }]);
  });
});
