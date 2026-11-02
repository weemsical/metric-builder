import { describe, expect, it } from 'vitest';
import { rankSubjects } from './rankSubjects';
import type { SubjectValue, Target } from './types';

const results: SubjectValue[] = [
  { subject: 'a', value: 80 },
  { subject: 'b', value: 120 },
  { subject: 'c', value: 200 },
];

describe('rankSubjects', () => {
  it('ranks by descending value for the default score method', () => {
    expect(rankSubjects(results).map((r) => r.subject)).toEqual([
      'c',
      'b',
      'a',
    ]);
  });

  it('does not mutate the input', () => {
    const copy = [...results];
    rankSubjects(results);
    expect(results).toEqual(copy);
  });

  it('ranks by attainment for percentToGoal with a lower-is-better target', () => {
    const target: Target = { value: 100, direction: 'lowerIsBetter' };
    expect(
      rankSubjects(results, 'percentToGoal', target).map((r) => r.subject)
    ).toEqual(['a', 'b', 'c']);
  });

  it('falls back to score for percentToGoal without a target', () => {
    expect(
      rankSubjects(results, 'percentToGoal').map((r) => r.subject)
    ).toEqual(['c', 'b', 'a']);
  });
});
