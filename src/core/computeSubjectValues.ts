import { aggregate } from './aggregate';
import { isMetricComplete, type MetricDefinition } from './metricDefinition';
import type { SubjectValue } from './types';

export const computeSubjectValues = (
  rows: Array<Record<string, unknown>>,
  definition: MetricDefinition
): SubjectValue[] => {
  if (!isMetricComplete(definition)) {
    return [];
  }

  const { measure, subjectField } = definition;
  const groups = new Map<string, number[]>();

  for (const row of rows) {
    const subject = row[subjectField as string];
    if (subject === null || subject === undefined) {
      continue;
    }

    const bucket = groups.get(String(subject)) ?? [];
    groups.set(String(subject), bucket);

    if (measure!.aggregation === 'count') {
      bucket.push(1);
    } else {
      const value = Number(row[measure!.field as string]);
      if (!Number.isNaN(value)) {
        bucket.push(value);
      }
    }
  }

  return [...groups.entries()]
    .map(([subject, values]) => ({
      subject,
      value: aggregate(values, measure!.aggregation),
    }))
    .sort((a, b) => b.value - a.value);
};
