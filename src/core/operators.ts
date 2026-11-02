import type { Aggregation } from './metricDefinition';
import type { FieldType, FilterOperator } from './types';

const ALL_AGGREGATIONS: Aggregation[] = [
  'count',
  'sum',
  'avg',
  'min',
  'max',
  'countDistinct',
];

export const aggregationsForFieldType = (type: FieldType): Aggregation[] =>
  type === 'geography'
    ? ['count', 'countDistinct']
    : [...ALL_AGGREGATIONS];

const BASE: FilterOperator[] = ['equals', 'notEquals', 'isNull', 'isNotNull'];
const COMPARISON: FilterOperator[] = ['gt', 'gte', 'lt', 'lte'];

export const operatorsForFieldType = (type: FieldType): FilterOperator[] => {
  switch (type) {
    case 'number':
    case 'date':
      return [...BASE, ...COMPARISON];
    case 'text':
      return [...BASE, 'contains'];
    case 'bool':
      return [...BASE, 'isTrue', 'isFalse'];
    default:
      return [...BASE];
  }
};
