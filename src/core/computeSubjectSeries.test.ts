import { describe, expect, it } from 'vitest';
import { computeSubjectSeries } from './computeSubjectSeries';

const asOf = Date.parse('2024-04-01T00:00:00Z');

const rows = [
  { owner: 'Jo', amount: 100, date: '2024-03-04T00:00:00Z' },
  { owner: 'Jo', amount: 50, date: '2024-03-05T00:00:00Z' },
  { owner: 'Jo', amount: 200, date: '2024-03-11T00:00:00Z' },
  { owner: 'Kim', amount: 80, date: '2024-03-12T00:00:00Z' },
];

const base = {
  sourceId: 'crm',
  measure: { field: 'amount', aggregation: 'sum' as const },
  subjectField: 'owner',
  window: { field: 'date', granularity: 'weekly' as const },
};

describe('computeSubjectSeries', () => {
  it('returns [] when the metric is incomplete or has no window', () => {
    expect(computeSubjectSeries(rows, { sourceId: 'crm' }, asOf)).toEqual([]);
    expect(
      computeSubjectSeries(
        rows,
        {
          sourceId: 'crm',
          measure: { field: 'amount', aggregation: 'sum' },
          subjectField: 'owner',
        },
        asOf
      )
    ).toEqual([]);
  });

  it('buckets weekly per subject with dense buckets, empty sum = 0', () => {
    expect(computeSubjectSeries(rows, base, asOf)).toEqual([
      {
        subject: 'Jo',
        points: [
          { bucket: '2024-03-03', value: 150 },
          { bucket: '2024-03-10', value: 200 },
        ],
      },
      {
        subject: 'Kim',
        points: [
          { bucket: '2024-03-03', value: 0 },
          { bucket: '2024-03-10', value: 80 },
        ],
      },
    ]);
  });

  it('uses null for empty buckets of avg', () => {
    expect(
      computeSubjectSeries(
        rows,
        { ...base, measure: { field: 'amount', aggregation: 'avg' } },
        asOf
      )
    ).toEqual([
      {
        subject: 'Jo',
        points: [
          { bucket: '2024-03-03', value: 75 },
          { bucket: '2024-03-10', value: 200 },
        ],
      },
      {
        subject: 'Kim',
        points: [
          { bucket: '2024-03-03', value: null },
          { bucket: '2024-03-10', value: 80 },
        ],
      },
    ]);
  });

  it('fills contiguous empty daily buckets', () => {
    const daily = [
      { owner: 'Jo', date: '2024-03-01T00:00:00Z' },
      { owner: 'Jo', date: '2024-03-03T00:00:00Z' },
    ];
    expect(
      computeSubjectSeries(
        daily,
        {
          sourceId: 'crm',
          measure: { aggregation: 'count' },
          subjectField: 'owner',
          window: { field: 'date', granularity: 'daily' },
        },
        asOf
      )
    ).toEqual([
      {
        subject: 'Jo',
        points: [
          { bucket: '2024-03-01', value: 1 },
          { bucket: '2024-03-02', value: 0 },
          { bucket: '2024-03-03', value: 1 },
        ],
      },
    ]);
  });

  it('returns [] when no row has a valid window date and no range', () => {
    expect(
      computeSubjectSeries(
        [{ owner: 'Jo', date: 'nope' }],
        {
          sourceId: 'crm',
          measure: { aggregation: 'count' },
          subjectField: 'owner',
          window: { field: 'date', granularity: 'daily' },
        },
        asOf
      )
    ).toEqual([]);
  });

  it('skips rows with an unparseable window date', () => {
    expect(
      computeSubjectSeries(
        [
          { owner: 'Jo', date: '2024-03-01T00:00:00Z' },
          { owner: 'Jo', date: 'nope' },
        ],
        {
          sourceId: 'crm',
          measure: { aggregation: 'count' },
          subjectField: 'owner',
          window: { field: 'date', granularity: 'daily' },
        },
        asOf
      )
    ).toEqual([
      { subject: 'Jo', points: [{ bucket: '2024-03-01', value: 1 }] },
    ]);
  });

  it('applies a rolling range anchored at asOf and spans it', () => {
    expect(
      computeSubjectSeries(
        rows,
        { ...base, range: { field: 'date', lastDays: 7 } },
        Date.parse('2024-03-12T12:00:00Z')
      )
    ).toEqual([
      {
        subject: 'Jo',
        points: [
          { bucket: '2024-03-03', value: 0 },
          { bucket: '2024-03-10', value: 200 },
        ],
      },
      {
        subject: 'Kim',
        points: [
          { bucket: '2024-03-03', value: 0 },
          { bucket: '2024-03-10', value: 80 },
        ],
      },
    ]);
  });
});
