import { describe, expect, it } from 'vitest';
import { toEpoch } from './toEpoch';

describe('toEpoch', () => {
  it('passes an epoch number through', () => {
    expect(toEpoch(1000)).toBe(1000);
  });

  it('parses an ISO 8601 string', () => {
    expect(toEpoch('1970-01-01T00:00:00.000Z')).toBe(0);
  });

  it('reads a Date instance', () => {
    expect(toEpoch(new Date(0))).toBe(0);
  });

  it('returns NaN for an unparseable value', () => {
    expect(toEpoch('not-a-date')).toBeNaN();
  });

  it('returns NaN for a value that is not a number, string, or Date', () => {
    expect(toEpoch(null)).toBeNaN();
    expect(toEpoch({})).toBeNaN();
  });
});
