import type {
  CoordinateFields,
  Filter,
  FormulaOp,
  Pacing,
  Range,
  RankMethod,
  Target,
  Thresholds,
  Window,
} from './types';

export type Formula = {
  op: FormulaOp;
  components: MetricDefinition[];
};

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
  window?: Window;
  range?: Range;
  target?: Target;
  thresholds?: Thresholds;
  pacing?: Pacing;
  rankMethod?: RankMethod;
  coordinates?: CoordinateFields;
  formula?: Formula;
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

export const withWindow = (
  definition: MetricDefinition,
  window: Window
): MetricDefinition => ({ ...definition, window });

export const withRange = (
  definition: MetricDefinition,
  range: Range
): MetricDefinition => ({ ...definition, range });

export const withTarget = (
  definition: MetricDefinition,
  target: Target
): MetricDefinition => ({ ...definition, target });

export const withThresholds = (
  definition: MetricDefinition,
  thresholds: Thresholds
): MetricDefinition => ({ ...definition, thresholds });

export const withPacing = (
  definition: MetricDefinition,
  pacing: Pacing
): MetricDefinition => ({ ...definition, pacing });

export const withRankMethod = (
  definition: MetricDefinition,
  rankMethod: RankMethod
): MetricDefinition => ({ ...definition, rankMethod });

export const withCoordinates = (
  definition: MetricDefinition,
  coordinates: CoordinateFields
): MetricDefinition => ({ ...definition, coordinates });

export const withFormula = (
  definition: MetricDefinition,
  formula: Formula
): MetricDefinition => ({ ...definition, formula });

export const withComponent = (
  definition: MetricDefinition,
  component: MetricDefinition
): MetricDefinition => ({
  ...definition,
  formula: {
    op: definition.formula?.op ?? 'divide',
    components: [...(definition.formula?.components ?? []), component],
  },
});

export const removeComponent = (
  definition: MetricDefinition,
  index: number
): MetricDefinition => ({
  ...definition,
  formula: {
    op: definition.formula?.op ?? 'divide',
    components: (definition.formula?.components ?? []).filter(
      (_, i) => i !== index
    ),
  },
});

export const isMetricComplete = (definition: MetricDefinition): boolean => {
  if (definition.formula) {
    const { components } = definition.formula;
    return components.length > 0 && components.every(isMetricComplete);
  }

  if (!definition.sourceId || !definition.subjectField || !definition.measure) {
    return false;
  }

  return (
    definition.measure.aggregation === 'count' || Boolean(definition.measure.field)
  );
};
