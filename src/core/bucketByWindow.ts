import type { Granularity } from './types';

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type CalendarParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
};

const partsIn = (epoch: number, timeZone: string): CalendarParts => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const found: Record<string, string> = {};
  for (const part of formatter.formatToParts(new Date(epoch))) {
    found[part.type] = part.value;
  }
  return {
    year: Number(found.year),
    month: Number(found.month),
    day: Number(found.day),
    weekday: WEEKDAY_INDEX[found.weekday],
  };
};

const pad = (value: number): string => String(value).padStart(2, '0');

const isoDate = (year: number, month: number, day: number): string =>
  `${year}-${pad(month)}-${pad(day)}`;

export const bucketByWindow = (
  epoch: number,
  granularity: Granularity,
  timeZone = 'UTC',
  weekStartsOn = 0
): string => {
  const { year, month, day, weekday } = partsIn(epoch, timeZone);

  switch (granularity) {
    case 'daily':
      return isoDate(year, month, day);
    case 'weekly': {
      const offset = (weekday - weekStartsOn + 7) % 7;
      const start = new Date(Date.UTC(year, month - 1, day - offset));
      return isoDate(
        start.getUTCFullYear(),
        start.getUTCMonth() + 1,
        start.getUTCDate()
      );
    }
    case 'monthly':
      return isoDate(year, month, 1);
    case 'quarterly':
      return isoDate(year, Math.floor((month - 1) / 3) * 3 + 1, 1);
    case 'annually':
      return isoDate(year, 1, 1);
  }
};

const nextBucket = (label: string, granularity: Granularity): string => {
  const [year, month, day] = label.split('-').map(Number);
  let next: Date;
  switch (granularity) {
    case 'daily':
      next = new Date(Date.UTC(year, month - 1, day + 1));
      break;
    case 'weekly':
      next = new Date(Date.UTC(year, month - 1, day + 7));
      break;
    case 'monthly':
      next = new Date(Date.UTC(year, month, 1));
      break;
    case 'quarterly':
      next = new Date(Date.UTC(year, month - 1 + 3, 1));
      break;
    case 'annually':
      next = new Date(Date.UTC(year + 1, 0, 1));
      break;
  }
  return isoDate(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate()
  );
};

export const enumerateBuckets = (
  startEpoch: number,
  endEpoch: number,
  granularity: Granularity,
  timeZone = 'UTC',
  weekStartsOn = 0
): string[] => {
  const end = bucketByWindow(endEpoch, granularity, timeZone, weekStartsOn);
  const buckets: string[] = [];
  let current = bucketByWindow(startEpoch, granularity, timeZone, weekStartsOn);
  while (current <= end) {
    buckets.push(current);
    current = nextBucket(current, granularity);
  }
  return buckets;
};
