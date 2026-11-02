export { packageInfo, type PackageInfo } from './packageInfo';
export {
  emptyMetricDefinition,
  isMetricComplete,
  removeFilter,
  updateFilter,
  withAggregation,
  withFilter,
  withMeasureField,
  withSource,
  withSubjectField,
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
export { computeSubjectValues } from './computeSubjectValues';
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
  MetricSource,
  SourceDescribe,
  SourceField,
  SubjectValue,
} from './types';
