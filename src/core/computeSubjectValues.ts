import { matchesFilter } from './applyFilters';
import { evaluateFilterLogic } from './evaluateFilterLogic';
import { filterByRange } from './filterByRange';
import { isMetricComplete, type MetricDefinition } from './metricDefinition';
import { reduceValues } from './reduceValues';
import type { Coordinates, Filter, SubjectValue } from './types';

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

export const computeSubjectValues = (
  rows: Array<Record<string, unknown>>,
  definition: MetricDefinition,
  asOf: number
): SubjectValue[] => {
  if (!isMetricComplete(definition)) {
    return [];
  }

  const { measure, subjectField, filters, filterLogic, range, coordinates } =
    definition;
  const groups = new Map<string, unknown[]>();
  const coordsBySubject = new Map<string, Coordinates>();

  const ranged = filterByRange(rows, range, asOf);
  for (const row of filterRows(ranged, filters, filterLogic)) {
    const subject = row[subjectField as string];
    if (subject === null || subject === undefined) {
      continue;
    }

    const key = String(subject);
    const bucket = groups.get(key) ?? [];
    groups.set(key, bucket);

    bucket.push(
      measure!.aggregation === 'count' ? 1 : row[measure!.field as string]
    );

    if (coordinates && !coordsBySubject.has(key)) {
      const lat = Number(row[coordinates.latField]);
      const lng = Number(row[coordinates.lngField]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        coordsBySubject.set(key, { lat, lng });
      }
    }
  }

  return [...groups.entries()]
    .map(([subject, values]) => {
      const base: SubjectValue = {
        subject,
        value: reduceValues(values, measure!.aggregation),
      };
      const coords = coordsBySubject.get(subject);
      return coords ? { ...base, coordinates: coords } : base;
    })
    .sort((a, b) => b.value - a.value);
};
