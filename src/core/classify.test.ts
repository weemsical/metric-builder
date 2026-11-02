import { describe, expect, it } from 'vitest';
import { classify } from './classify';
import type { Target, Thresholds } from './types';

const thresholds: Thresholds = { amber: 0.7, green: 0.9 };

describe('classify', () => {
  it('returns null when there is no target', () => {
    expect(classify(50, undefined)).toBeNull();
  });

  it('classifies a higher-is-better value target against thresholds', () => {
    const target: Target = { value: 100, direction: 'higherIsBetter' };
    expect(classify(95, target, thresholds)).toEqual({
      attainment: 0.95,
      status: 'green',
    });
    expect(classify(80, target, thresholds)).toEqual({
      attainment: 0.8,
      status: 'amber',
    });
    expect(classify(50, target, thresholds)).toEqual({
      attainment: 0.5,
      status: 'red',
    });
  });

  it('classifies a lower-is-better value target', () => {
    const target: Target = { value: 100, direction: 'lowerIsBetter' };
    expect(classify(80, target, thresholds)!.status).toBe('green');
    expect(classify(125, target, thresholds)!.status).toBe('amber');
    expect(classify(200, target, thresholds)!.status).toBe('red');
  });

  it('classifies a range target as green inside and red outside', () => {
    const target: Target = { min: 10, max: 20, direction: 'higherIsBetter' };
    expect(classify(15, target)).toEqual({ attainment: 1, status: 'green' });
    expect(classify(25, target)).toEqual({ attainment: 0, status: 'red' });
    expect(classify(5, target)).toEqual({ attainment: 0, status: 'red' });
  });

  it('classifies open-ended range targets (min-only, max-only)', () => {
    expect(
      classify(15, { min: 10, direction: 'higherIsBetter' })!.status
    ).toBe('green');
    expect(classify(5, { min: 10, direction: 'higherIsBetter' })!.status).toBe(
      'red'
    );
    expect(classify(15, { max: 20, direction: 'higherIsBetter' })!.status).toBe(
      'green'
    );
    expect(classify(25, { max: 20, direction: 'higherIsBetter' })!.status).toBe(
      'red'
    );
  });

  it('defaults status to green at full attainment when no thresholds given', () => {
    const target: Target = { value: 100, direction: 'higherIsBetter' };
    expect(classify(100, target)!.status).toBe('green');
    expect(classify(50, target)!.status).toBe('red');
  });

  it('guards divide-by-zero', () => {
    expect(
      classify(10, { value: 0, direction: 'higherIsBetter' })!.attainment
    ).toBe(0);
    expect(
      classify(0, { value: 100, direction: 'lowerIsBetter' })!.attainment
    ).toBe(1);
  });

  it('treats a target with no value and no range as zero attainment', () => {
    expect(classify(50, { direction: 'higherIsBetter' })).toEqual({
      attainment: 0,
      status: 'red',
    });
  });
});
