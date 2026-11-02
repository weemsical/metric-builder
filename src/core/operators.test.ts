import { describe, expect, it } from 'vitest';
import { operatorsForFieldType } from './operators';

describe('operatorsForFieldType', () => {
  it('offers equality and null checks for every type', () => {
    for (const type of [
      'text',
      'number',
      'date',
      'bool',
      'object',
      'geography',
      'unknown',
    ] as const) {
      expect(operatorsForFieldType(type)).toEqual(
        expect.arrayContaining(['equals', 'notEquals', 'isNull', 'isNotNull'])
      );
    }
  });

  it('adds comparison operators for number and date', () => {
    const comparisons = ['gt', 'gte', 'lt', 'lte'];
    expect(operatorsForFieldType('number')).toEqual(
      expect.arrayContaining(comparisons)
    );
    expect(operatorsForFieldType('date')).toEqual(
      expect.arrayContaining(comparisons)
    );
    expect(operatorsForFieldType('text')).not.toEqual(
      expect.arrayContaining(comparisons)
    );
  });

  it('adds contains for text only', () => {
    expect(operatorsForFieldType('text')).toContain('contains');
    expect(operatorsForFieldType('number')).not.toContain('contains');
  });

  it('adds isTrue/isFalse for bool only', () => {
    expect(operatorsForFieldType('bool')).toEqual(
      expect.arrayContaining(['isTrue', 'isFalse'])
    );
    expect(operatorsForFieldType('text')).not.toContain('isTrue');
  });
});
