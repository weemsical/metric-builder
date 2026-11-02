import { describe, expect, it } from 'vitest';
import { applyFilters } from './applyFilters';

const rows = [
  { stage: 'Won', amount: 5000, closed: true, closedAt: '2024-03-10' },
  { stage: 'Lost', amount: 1500, closed: true, closedAt: '2024-01-05' },
  { stage: 'Open', amount: 8000, closed: false, closedAt: null },
];

describe('applyFilters', () => {
  it('returns rows unchanged for no filters', () => {
    expect(applyFilters(rows, [])).toEqual(rows);
  });

  it('keeps rows matching an equals filter, case-insensitively', () => {
    expect(
      applyFilters(rows, [{ field: 'stage', operator: 'equals', value: 'won' }])
    ).toEqual([rows[0]]);
  });

  it('excludes rows matching a notEquals filter', () => {
    expect(
      applyFilters(rows, [
        { field: 'stage', operator: 'notEquals', value: 'Won' },
      ])
    ).toEqual([rows[1], rows[2]]);
  });

  it('compares numbers with gt/gte/lt/lte', () => {
    expect(
      applyFilters(rows, [{ field: 'amount', operator: 'gte', value: 5000 }])
    ).toEqual([rows[0], rows[2]]);
    expect(
      applyFilters(rows, [{ field: 'amount', operator: 'lt', value: 5000 }])
    ).toEqual([rows[1]]);
    expect(
      applyFilters(rows, [{ field: 'amount', operator: 'gt', value: 5000 }])
    ).toEqual([rows[2]]);
    expect(
      applyFilters(rows, [{ field: 'amount', operator: 'lte', value: 5000 }])
    ).toEqual([rows[0], rows[1]]);
  });

  it('compares dates via the toEpoch seam', () => {
    expect(
      applyFilters(rows, [
        { field: 'closedAt', operator: 'gte', value: '2024-02-01' },
      ])
    ).toEqual([rows[0]]);
  });

  it('treats a comparison against an uncoercible value as a miss', () => {
    expect(
      applyFilters(rows, [{ field: 'stage', operator: 'gt', value: 5 }])
    ).toEqual([]);
  });

  it('matches a case-insensitive contains', () => {
    expect(
      applyFilters(rows, [{ field: 'stage', operator: 'contains', value: 'o' }])
    ).toEqual([rows[0], rows[1], rows[2]]);
    expect(
      applyFilters(rows, [{ field: 'stage', operator: 'contains', value: 'WO' }])
    ).toEqual([rows[0]]);
  });

  it('matches isTrue and isFalse on bool values', () => {
    expect(
      applyFilters(rows, [{ field: 'closed', operator: 'isTrue' }])
    ).toEqual([rows[0], rows[1]]);
    expect(
      applyFilters(rows, [{ field: 'closed', operator: 'isFalse' }])
    ).toEqual([rows[2]]);
  });

  it('matches isNull and isNotNull', () => {
    expect(
      applyFilters(rows, [{ field: 'closedAt', operator: 'isNull' }])
    ).toEqual([rows[2]]);
    expect(
      applyFilters(rows, [{ field: 'closedAt', operator: 'isNotNull' }])
    ).toEqual([rows[0], rows[1]]);
  });

  it('ANDs multiple filters: a row must pass all', () => {
    expect(
      applyFilters(rows, [
        { field: 'amount', operator: 'gte', value: 2000 },
        { field: 'closed', operator: 'isTrue' },
      ])
    ).toEqual([rows[0]]);
  });

  it('treats a comma-separated value as OR within one filter', () => {
    expect(
      applyFilters(rows, [
        { field: 'stage', operator: 'equals', value: 'won,lost' },
      ])
    ).toEqual([rows[0], rows[1]]);
  });
});
