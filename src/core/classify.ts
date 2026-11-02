import type { RagStatus, Target, Thresholds } from './types';

export type Classification = {
  attainment: number;
  status: RagStatus;
};

const isRangeTarget = (target: Target): boolean =>
  target.min !== undefined || target.max !== undefined;

const statusFor = (
  attainment: number,
  thresholds: Thresholds | undefined
): RagStatus => {
  if (thresholds) {
    if (attainment >= thresholds.green) {
      return 'green';
    }
    if (attainment >= thresholds.amber) {
      return 'amber';
    }
    return 'red';
  }
  return attainment >= 1 ? 'green' : 'red';
};

export const classify = (
  value: number,
  target: Target | undefined,
  thresholds?: Thresholds
): Classification | null => {
  if (!target) {
    return null;
  }

  if (isRangeTarget(target)) {
    const inRange =
      (target.min === undefined || value >= target.min) &&
      (target.max === undefined || value <= target.max);
    return { attainment: inRange ? 1 : 0, status: inRange ? 'green' : 'red' };
  }

  const goal = target.value ?? 0;
  const attainment =
    target.direction === 'higherIsBetter'
      ? goal === 0
        ? 0
        : value / goal
      : value === 0
        ? 1
        : goal / value;

  return { attainment, status: statusFor(attainment, thresholds) };
};
