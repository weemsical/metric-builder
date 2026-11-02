import { toEpoch } from './toEpoch';
import type { Filter } from './types';

const splitValues = (value: unknown): unknown[] =>
  typeof value === 'string' && value.includes(',')
    ? value.split(',').map((part) => part.trim())
    : [value];

const textEquals = (raw: unknown, value: unknown): boolean =>
  splitValues(value).some(
    (part) => String(raw).toLowerCase() === String(part).toLowerCase()
  );

const toComparable = (value: unknown): number => {
  const asNumber = Number(value);
  return Number.isNaN(asNumber) ? toEpoch(value) : asNumber;
};

const compare = (
  raw: unknown,
  value: unknown,
  op: (a: number, b: number) => boolean
): boolean => {
  const a = toComparable(raw);
  const b = toComparable(value);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return false;
  }
  return op(a, b);
};

export const matchesFilter = (
  row: Record<string, unknown>,
  filter: Filter
): boolean => {
  const raw = row[filter.field];
  switch (filter.operator) {
    case 'equals':
      return textEquals(raw, filter.value);
    case 'notEquals':
      return !textEquals(raw, filter.value);
    case 'gt':
      return compare(raw, filter.value, (a, b) => a > b);
    case 'gte':
      return compare(raw, filter.value, (a, b) => a >= b);
    case 'lt':
      return compare(raw, filter.value, (a, b) => a < b);
    case 'lte':
      return compare(raw, filter.value, (a, b) => a <= b);
    case 'contains':
      return String(raw)
        .toLowerCase()
        .includes(String(filter.value).toLowerCase());
    case 'isTrue':
      return Boolean(raw) === true;
    case 'isFalse':
      return Boolean(raw) === false;
    case 'isNull':
      return raw === null || raw === undefined;
    case 'isNotNull':
      return raw !== null && raw !== undefined;
  }
};

export const applyFilters = (
  rows: Array<Record<string, unknown>>,
  filters: Filter[]
): Array<Record<string, unknown>> =>
  rows.filter((row) => filters.every((filter) => matchesFilter(row, filter)));
