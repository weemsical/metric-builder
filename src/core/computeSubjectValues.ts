import { aggregate } from './aggregate';
import { matchesFilter } from './applyFilters';
import { evaluateFilterLogic } from './evaluateFilterLogic';
import {
  isMetricComplete,
  type Aggregation,
  type MetricDefinition,
} from './metricDefinition';
import type { Filter, SubjectValue } from './types';

const filterRows = (
  rows: Array<Record<string, unknown>>,
  filters: Filter[] | undefined,
  filterLogic: string | undefined
): Array<Record<string, unknown>> => {
  if (!filters || filters.length === 0) {
    return rows;
  }
  return rows.filter((row) => {
    const results = filters.map((filter) => matchesFilter(row, filter));
    const outcome = evaluateFilterLogic(results, filterLogic);
    return outcome.ok && outcome.value;
  });
};

const reduceValues = (
  values: unknown[],
  aggregation: Aggregation
): number => {
  if (aggregation === 'countDistinct') {
    const distinct = new Set(
      values
        .filter((value) => value !== null && value !== undefined)
        .map(String)
    );
    return distinct.size;
  }

  const numbers = values
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
  return aggregate(numbers, aggregation);
};

export const computeSubjectValues = (
  rows: Array<Record<string, unknown>>,
  definition: MetricDefinition
): SubjectValue[] => {
  if (!isMetricComplete(definition)) {
    return [];
  }

  const { measure, subjectField, filters, filterLogic } = definition;
  const groups = new Map<string, unknown[]>();

  for (const row of filterRows(rows, filters, filterLogic)) {
    const subject = row[subjectField as string];
    if (subject === null || subject === undefined) {
      continue;
    }

    const bucket = groups.get(String(subject)) ?? [];
    groups.set(String(subject), bucket);

    bucket.push(
      measure!.aggregation === 'count' ? 1 : row[measure!.field as string]
    );
  }

  return [...groups.entries()]
    .map(([subject, values]) => ({
      subject,
      value: reduceValues(values, measure!.aggregation),
    }))
    .sort((a, b) => b.value - a.value);
};
