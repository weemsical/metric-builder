import { computeSubjectSeries } from './computeSubjectSeries';
import { computeSubjectValues } from './computeSubjectValues';
import type { MetricDefinition } from './metricDefinition';
import type { MetricDataProvider } from './provider';
import type { MetricSource, SourceDescribe } from './types';

export type MockSourceSeed = {
  source: MetricSource;
  describe: SourceDescribe;
  rows: Array<Record<string, unknown>>;
};

export const createMockProvider = (
  seeds: MockSourceSeed[]
): MetricDataProvider => {
  const seedFor = (sourceId: string): MockSourceSeed => {
    const seed = seeds.find((candidate) => candidate.source.id === sourceId);
    if (!seed) {
      throw new Error(`Unknown source: ${sourceId}`);
    }
    return seed;
  };

  return {
    listSources: async () => seeds.map((seed) => seed.source),

    describeSource: async (sourceId) => seedFor(sourceId).describe,

    queryData: async (definition: MetricDefinition, asOf: number) => {
      if (!definition.sourceId) {
        return [];
      }
      return computeSubjectValues(
        seedFor(definition.sourceId).rows,
        definition,
        asOf
      );
    },

    querySeries: async (definition: MetricDefinition, asOf: number) => {
      if (!definition.sourceId) {
        return [];
      }
      return computeSubjectSeries(
        seedFor(definition.sourceId).rows,
        definition,
        asOf
      );
    },
  };
};
