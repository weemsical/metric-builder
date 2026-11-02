import { toEpoch } from './toEpoch';
import type { Range } from './types';

export const DAY_MS = 86_400_000;

export const filterByRange = (
  rows: Array<Record<string, unknown>>,
  range: Range | undefined,
  asOf: number
): Array<Record<string, unknown>> => {
  if (!range) {
    return rows;
  }
  const cutoff = asOf - range.lastDays * DAY_MS;
  return rows.filter((row) => {
    const time = toEpoch(row[range.field]);
    return !Number.isNaN(time) && time >= cutoff && time <= asOf;
  });
};
