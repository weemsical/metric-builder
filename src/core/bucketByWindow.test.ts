import { describe, expect, it } from 'vitest';
import { bucketByWindow, enumerateBuckets } from './bucketByWindow';

const at = (iso: string) => Date.parse(iso);

describe('bucketByWindow', () => {
  it('buckets daily in UTC by default', () => {
    expect(bucketByWindow(at('2024-03-10T12:00:00Z'), 'daily')).toBe(
      '2024-03-10'
    );
  });

  it('buckets weekly to the preceding Sunday by default', () => {
    expect(bucketByWindow(at('2024-03-13T00:00:00Z'), 'weekly')).toBe(
      '2024-03-10'
    );
  });

  it('respects weekStartsOn = Monday', () => {
    expect(bucketByWindow(at('2024-03-13T00:00:00Z'), 'weekly', 'UTC', 1)).toBe(
      '2024-03-11'
    );
  });

  it('handles a week that crosses a month boundary', () => {
    expect(bucketByWindow(at('2024-03-02T00:00:00Z'), 'weekly')).toBe(
      '2024-02-25'
    );
  });

  it('buckets monthly to the first of the month', () => {
    expect(bucketByWindow(at('2024-03-10T00:00:00Z'), 'monthly')).toBe(
      '2024-03-01'
    );
  });

  it('buckets quarterly to the first month of the quarter', () => {
    expect(bucketByWindow(at('2024-05-10T00:00:00Z'), 'quarterly')).toBe(
      '2024-04-01'
    );
    expect(bucketByWindow(at('2024-02-10T00:00:00Z'), 'quarterly')).toBe(
      '2024-01-01'
    );
  });

  it('buckets annually to Jan 1', () => {
    expect(bucketByWindow(at('2024-07-04T00:00:00Z'), 'annually')).toBe(
      '2024-01-01'
    );
  });

  it('uses the given IANA time zone for calendar parts', () => {
    expect(
      bucketByWindow(at('2024-03-10T02:00:00Z'), 'daily', 'America/Los_Angeles')
    ).toBe('2024-03-09');
  });
});

describe('enumerateBuckets', () => {
  it('enumerates contiguous daily buckets', () => {
    expect(
      enumerateBuckets(at('2024-02-28T00:00:00Z'), at('2024-03-01T00:00:00Z'), 'daily')
    ).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
  });

  it('enumerates weekly buckets', () => {
    expect(
      enumerateBuckets(at('2024-03-01T00:00:00Z'), at('2024-03-15T00:00:00Z'), 'weekly')
    ).toEqual(['2024-02-25', '2024-03-03', '2024-03-10']);
  });

  it('enumerates monthly buckets across a year boundary', () => {
    expect(
      enumerateBuckets(at('2023-11-15T00:00:00Z'), at('2024-01-10T00:00:00Z'), 'monthly')
    ).toEqual(['2023-11-01', '2023-12-01', '2024-01-01']);
  });

  it('enumerates quarterly buckets', () => {
    expect(
      enumerateBuckets(at('2024-02-01T00:00:00Z'), at('2024-08-01T00:00:00Z'), 'quarterly')
    ).toEqual(['2024-01-01', '2024-04-01', '2024-07-01']);
  });

  it('enumerates annual buckets', () => {
    expect(
      enumerateBuckets(at('2022-06-01T00:00:00Z'), at('2024-06-01T00:00:00Z'), 'annually')
    ).toEqual(['2022-01-01', '2023-01-01', '2024-01-01']);
  });
});
