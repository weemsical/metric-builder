import type { PacingStrategy } from './types';

const PACE_FACTOR: Record<PacingStrategy, number> = {
  steady: 0,
  rampUp: 1.3,
  bigFinish: 5,
};

export const expectedPace = (
  goal: number,
  elapsed: number,
  strategy: PacingStrategy
): number => goal * Math.pow(elapsed, 1 + PACE_FACTOR[strategy]);

const DAY_MS = 86_400_000;

const dayIndex = (epoch: number): number => Math.floor(epoch / DAY_MS);

const businessDaysInclusive = (startDay: number, endDay: number): number => {
  let count = 0;
  for (let day = startDay; day <= endDay; day += 1) {
    const weekday = new Date(day * DAY_MS).getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      count += 1;
    }
  }
  return count;
};

export const elapsedFraction = (
  start: number,
  end: number,
  asOf: number,
  excludeWeekends = false
): number => {
  const startDay = dayIndex(start);
  const endDay = dayIndex(end);
  const asOfDay = dayIndex(asOf);

  const total = excludeWeekends
    ? businessDaysInclusive(startDay, endDay)
    : endDay - startDay + 1;
  const elapsed = excludeWeekends
    ? businessDaysInclusive(startDay, asOfDay)
    : asOfDay - startDay + 1;

  return total === 0 ? 0 : elapsed / total;
};
