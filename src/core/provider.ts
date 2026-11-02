import type { MetricDefinition } from './metricDefinition';
import type {
  MetricSource,
  SourceDescribe,
  SubjectSeries,
  SubjectValue,
} from './types';

export type MetricDataProvider = {
  listSources: () => Promise<MetricSource[]>;
  describeSource: (sourceId: string) => Promise<SourceDescribe>;
  queryData: (
    definition: MetricDefinition,
    asOf: number
  ) => Promise<SubjectValue[]>;
  querySeries?: (
    definition: MetricDefinition,
    asOf: number
  ) => Promise<SubjectSeries[]>;
};
