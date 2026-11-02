import { aggregate } from './aggregate';
import type { Aggregation } from './metricDefinition';

export const reduceValues = (
  values: unknown[],
  aggregation: Aggregation
): number => {
  if (aggregation === 'countDistinct') {
    const distinct = new Set(
      values
        .filter((value) => value !== null && value !== undefined)
        .map(String)
    );
    return distinct.size;
  }

  const numbers = values
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
  return aggregate(numbers, aggregation);
};
