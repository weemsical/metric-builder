import type { Filter } from './types';

export type Aggregation =
  | 'count'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'countDistinct';

export type Measure = {
  field?: string;
  aggregation: Aggregation;
};

export type MetricDefinition = {
  sourceId?: string;
  measure?: Measure;
  subjectField?: string;
  filters?: Filter[];
  filterLogic?: string;
};

export const emptyMetricDefinition = (): MetricDefinition => ({});

export const withSource = (
  definition: MetricDefinition,
  sourceId: string
): MetricDefinition =>
  sourceId === definition.sourceId ? definition : { sourceId };

export const withAggregation = (
  definition: MetricDefinition,
  aggregation: Aggregation
): MetricDefinition => ({
  ...definition,
  measure: { ...definition.measure, aggregation },
});

export const withMeasureField = (
  definition: MetricDefinition,
  field: string
): MetricDefinition => ({
  ...definition,
  measure: { aggregation: definition.measure?.aggregation ?? 'sum', field },
});

export const withSubjectField = (
  definition: MetricDefinition,
  subjectField: string
): MetricDefinition => ({
  ...definition,
  subjectField,
});

export const withFilter = (
  definition: MetricDefinition,
  filter: Filter
): MetricDefinition => ({
  ...definition,
  filters: [...(definition.filters ?? []), filter],
});

export const updateFilter = (
  definition: MetricDefinition,
  index: number,
  filter: Filter
): MetricDefinition => ({
  ...definition,
  filters: (definition.filters ?? []).map((existing, i) =>
    i === index ? filter : existing
  ),
});

export const removeFilter = (
  definition: MetricDefinition,
  index: number
): MetricDefinition => ({
  ...definition,
  filters: (definition.filters ?? []).filter((_, i) => i !== index),
});

export const isMetricComplete = (definition: MetricDefinition): boolean => {
  if (!definition.sourceId || !definition.subjectField || !definition.measure) {
    return false;
  }

  return (
    definition.measure.aggregation === 'count' || Boolean(definition.measure.field)
  );
};
