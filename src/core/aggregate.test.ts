import { describe, expect, it } from 'vitest';
import { aggregate } from './aggregate';

describe('aggregate', () => {
  it('counts entries regardless of value', () => {
    expect(aggregate([1, 2, 3], 'count')).toBe(3);
  });

  it('sums values', () => {
    expect(aggregate([10, 20, 5], 'sum')).toBe(35);
  });

  it('averages values', () => {
    expect(aggregate([10, 20, 30], 'avg')).toBe(20);
  });

  it('takes the minimum', () => {
    expect(aggregate([10, 3, 7], 'min')).toBe(3);
  });

  it('takes the maximum', () => {
    expect(aggregate([10, 3, 7], 'max')).toBe(10);
  });

  it('returns 0 for an empty set (non-count)', () => {
    expect(aggregate([], 'sum')).toBe(0);
    expect(aggregate([], 'avg')).toBe(0);
    expect(aggregate([], 'min')).toBe(0);
    expect(aggregate([], 'max')).toBe(0);
  });

  it('returns 0 counting an empty set', () => {
    expect(aggregate([], 'count')).toBe(0);
  });
});
