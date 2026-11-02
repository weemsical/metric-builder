import type { FieldType, FilterOperator } from './types';

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
