import { classify } from './classify';
import type { RankMethod, SubjectValue, Target } from './types';

export const rankSubjects = (
  results: SubjectValue[],
  rankMethod: RankMethod = 'score',
  target?: Target
): SubjectValue[] => {
  const ranked = [...results];

  if (rankMethod === 'percentToGoal' && target) {
    return ranked.sort(
      (a, b) =>
        classify(b.value, target)!.attainment -
        classify(a.value, target)!.attainment
    );
  }

  return ranked.sort((a, b) => b.value - a.value);
};
