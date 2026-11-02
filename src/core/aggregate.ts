import type { Aggregation } from './metricDefinition';

export const aggregate = (values: number[], aggregation: Aggregation): number => {
  switch (aggregation) {
    case 'count':
      return values.length;
    case 'sum':
      return values.reduce((total, value) => total + value, 0);
    case 'avg':
      return values.length === 0
        ? 0
        : values.reduce((total, value) => total + value, 0) / values.length;
    case 'min':
      return values.length === 0 ? 0 : Math.min(...values);
    case 'max':
      return values.length === 0 ? 0 : Math.max(...values);
    case 'countDistinct':
      return new Set(values).size;
  }
};
