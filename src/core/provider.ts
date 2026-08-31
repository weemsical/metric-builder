import type { MetricDefinition } from './metricDefinition';
import type { MetricSource, SourceDescribe, SubjectValue } from './types';

export type MetricDataProvider = {
  listSources: () => Promise<MetricSource[]>;
  describeSource: (sourceId: string) => Promise<SourceDescribe>;
  queryData: (definition: MetricDefinition) => Promise<SubjectValue[]>;
};
