import { bucketByWindow, enumerateBuckets } from './bucketByWindow';
import { filterByRange } from './filterByRange';
import { isMetricComplete, type MetricDefinition } from './metricDefinition';
import { reduceValues } from './reduceValues';
import { toEpoch } from './toEpoch';
import type { Aggregation, Measure } from './metricDefinition';
import type { SubjectSeries } from './types';

const emptyValue = (aggregation: Aggregation): number | null =>
  aggregation === 'count' || aggregation === 'sum' ? 0 : null;

const operandFor = (
  row: Record<string, unknown>,
  measure: Measure
): unknown => (measure.aggregation === 'count' ? 1 : row[measure.field as string]);

export const computeSubjectSeries = (
  rows: Array<Record<string, unknown>>,
  definition: MetricDefinition,
  asOf: number
): SubjectSeries[] => {
  const { measure, subjectField, window, range } = definition;
  if (!isMetricComplete(definition) || !window) {
    return [];
  }

  const filtered = filterByRange(rows, range, asOf);

  const times = filtered
    .map((row) => toEpoch(row[window.field]))
    .filter((time) => !Number.isNaN(time));

  let startEpoch: number;
  let endEpoch: number;
  if (range) {
    startEpoch = asOf - range.lastDays * 86_400_000;
    endEpoch = asOf;
  } else {
    if (times.length === 0) {
      return [];
    }
    startEpoch = Math.min(...times);
    endEpoch = Math.max(...times);
  }

  const labels = enumerateBuckets(
    startEpoch,
    endEpoch,
    window.granularity,
    window.timeZone,
    window.weekStartsOn
  );

  const bySubject = new Map<string, Map<string, unknown[]>>();
  for (const row of filtered) {
    const subject = row[subjectField as string];
    if (subject === null || subject === undefined) {
      continue;
    }
    const time = toEpoch(row[window.field]);
    if (Number.isNaN(time)) {
      continue;
    }
    const label = bucketByWindow(
      time,
      window.granularity,
      window.timeZone,
      window.weekStartsOn
    );
    const key = String(subject);
    const buckets = bySubject.get(key) ?? new Map<string, unknown[]>();
    bySubject.set(key, buckets);
    const operands = buckets.get(label) ?? [];
    buckets.set(label, operands);
    operands.push(operandFor(row, measure!));
  }

  return [...bySubject.entries()].map(([subject, buckets]) => ({
    subject,
    points: labels.map((bucket) => {
      const operands = buckets.get(bucket);
      return {
        bucket,
        value: operands
          ? reduceValues(operands, measure!.aggregation)
          : emptyValue(measure!.aggregation),
      };
    }),
  }));
};
