import { describe, expect, it } from 'vitest';
import { elapsedFraction, expectedPace } from './expectedPace';

const at = (iso: string) => Date.parse(iso);

describe('expectedPace', () => {
  it('is linear for steady (paceFactor 0)', () => {
    expect(expectedPace(100, 0.5, 'steady')).toBe(50);
  });

  it('back-loads rampUp (exponent 2.3) and bigFinish (exponent 6)', () => {
    expect(expectedPace(100, 0.5, 'rampUp')).toBeCloseTo(
      100 * Math.pow(0.5, 2.3),
      5
    );
    expect(expectedPace(100, 0.5, 'bigFinish')).toBeCloseTo(1.5625, 5);
  });

  it('is 0 at the start and the full goal at the end for every strategy', () => {
    for (const strategy of ['steady', 'rampUp', 'bigFinish'] as const) {
      expect(expectedPace(100, 0, strategy)).toBe(0);
      expect(expectedPace(100, 1, strategy)).toBe(100);
    }
  });
});

describe('elapsedFraction', () => {
  it('counts inclusive calendar days', () => {
    expect(
      elapsedFraction(
        at('2024-03-01T00:00:00Z'),
        at('2024-03-10T00:00:00Z'),
        at('2024-03-05T00:00:00Z')
      )
    ).toBe(0.5);
  });

  it('counts inclusive business days when excludeWeekends', () => {
    expect(
      elapsedFraction(
        at('2024-03-04T00:00:00Z'),
        at('2024-03-08T00:00:00Z'),
        at('2024-03-06T00:00:00Z'),
        true
      )
    ).toBe(0.6);
  });

  it('returns 0 when the business-day window is empty', () => {
    expect(
      elapsedFraction(
        at('2024-03-02T00:00:00Z'),
        at('2024-03-03T00:00:00Z'),
        at('2024-03-03T00:00:00Z'),
        true
      )
    ).toBe(0);
  });
});
