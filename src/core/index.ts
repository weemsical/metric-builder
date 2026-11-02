export { packageInfo, type PackageInfo } from './packageInfo';
export {
  emptyMetricDefinition,
  isMetricComplete,
  removeFilter,
  updateFilter,
  withAggregation,
  withFilter,
  withMeasureField,
  withRange,
  withSource,
  withSubjectField,
  withWindow,
  type Aggregation,
  type Measure,
  type MetricDefinition,
} from './metricDefinition';
export { aggregate } from './aggregate';
export { applyFilters, matchesFilter } from './applyFilters';
export {
  evaluateFilterLogic,
  type FilterLogicResult,
} from './evaluateFilterLogic';
export { operatorsForFieldType } from './operators';
export { toEpoch } from './toEpoch';
export { bucketByWindow, enumerateBuckets } from './bucketByWindow';
export { computeSubjectValues } from './computeSubjectValues';
export { computeSubjectSeries } from './computeSubjectSeries';
export type { MetricDataProvider } from './provider';
export { createMockProvider, type MockSourceSeed } from './mockProvider';
export {
  createMemoryStore,
  type MemoryStoreOptions,
  type MetricStore,
  type SavedMetric,
} from './store';
export type {
  FieldType,
  Filter,
  FilterOperator,
  Granularity,
  MetricSource,
  Range,
  SeriesPoint,
  SourceDescribe,
  SourceField,
  SubjectSeries,
  SubjectValue,
  Window,
} from './types';
