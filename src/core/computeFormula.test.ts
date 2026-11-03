import { describe, expect, it } from 'vitest';
import { computeFormula } from './computeFormula';
import type { SubjectValue } from './types';

const num: SubjectValue[] = [
  { subject: 'a', value: 10 },
  { subject: 'b', value: 5 },
];
const den: SubjectValue[] = [
  { subject: 'a', value: 2 },
  { subject: 'c', value: 4 },
];

describe('computeFormula', () => {
  it('adds with an outer join, treating missing subjects as 0', () => {
    expect(computeFormula([num, den], 'add')).toEqual([
      { subject: 'a', value: 12 },
      { subject: 'b', value: 5 },
      { subject: 'c', value: 4 },
    ]);
  });

  it('subtracts left to right, missing = 0', () => {
    expect(computeFormula([num, den], 'subtract')).toEqual([
      { subject: 'a', value: 8 },
      { subject: 'b', value: 5 },
      { subject: 'c', value: -4 },
    ]);
  });

  it('multiplies, missing = 0', () => {
    expect(computeFormula([num, den], 'multiply')).toEqual([
      { subject: 'a', value: 20 },
      { subject: 'b', value: 0 },
      { subject: 'c', value: 0 },
    ]);
  });

  it('divides, excluding missing or zero denominators, missing numerator = 0', () => {
    expect(computeFormula([num, den], 'divide')).toEqual([
      { subject: 'a', value: 5 },
      { subject: 'c', value: 0 },
    ]);
  });

  it('excludes a subject whose denominator is zero', () => {
    expect(
      computeFormula(
        [[{ subject: 'a', value: 10 }], [{ subject: 'a', value: 0 }]],
        'divide'
      )
    ).toEqual([]);
  });
});
