import { describe, expect, it } from 'vitest';
import {
  emptyMetricDefinition,
  isMetricComplete,
  withAggregation,
  withMeasureField,
  withSource,
  withSubjectField,
  type MetricDefinition,
} from './metricDefinition';

describe('emptyMetricDefinition', () => {
  it('starts with nothing selected', () => {
    expect(emptyMetricDefinition()).toEqual({});
  });
});

describe('withSource', () => {
  it('sets the source on an empty definition', () => {
    expect(withSource(emptyMetricDefinition(), 'src-1')).toEqual({
      sourceId: 'src-1',
    });
  });

  it('returns the same reference when the source is unchanged', () => {
    const def: MetricDefinition = { sourceId: 'src-1', subjectField: 'ownerId' };
    expect(withSource(def, 'src-1')).toBe(def);
  });

  it('resets field-dependent selections when the source changes', () => {
    const def: MetricDefinition = {
      sourceId: 'src-1',
      measure: { field: 'amount', aggregation: 'sum' },
      subjectField: 'ownerId',
    };
    expect(withSource(def, 'src-2')).toEqual({ sourceId: 'src-2' });
  });
});

describe('withAggregation', () => {
  it('sets the aggregation, preserving an existing field', () => {
    const def: MetricDefinition = {
      sourceId: 'src-1',
      measure: { field: 'amount', aggregation: 'sum' },
    };
    expect(withAggregation(def, 'avg').measure).toEqual({
      field: 'amount',
      aggregation: 'avg',
    });
  });

  it('sets the aggregation when no measure exists yet', () => {
    const def: MetricDefinition = { sourceId: 'src-1' };
    expect(withAggregation(def, 'count').measure).toEqual({
      aggregation: 'count',
    });
  });
});

describe('withMeasureField', () => {
  it('sets the field, preserving an existing aggregation', () => {
    const def: MetricDefinition = {
      sourceId: 'src-1',
      measure: { aggregation: 'sum' },
    };
    expect(withMeasureField(def, 'amount').measure).toEqual({
      field: 'amount',
      aggregation: 'sum',
    });
  });

  it('defaults the aggregation to sum when none is set', () => {
    const def: MetricDefinition = { sourceId: 'src-1' };
    expect(withMeasureField(def, 'amount').measure).toEqual({
      field: 'amount',
      aggregation: 'sum',
    });
  });
});

describe('withSubjectField', () => {
  it('sets the subject field', () => {
    const def: MetricDefinition = { sourceId: 'src-1' };
    expect(withSubjectField(def, 'ownerId').subjectField).toBe('ownerId');
  });
});

describe('isMetricComplete', () => {
  it('is false when nothing is set', () => {
    expect(isMetricComplete(emptyMetricDefinition())).toBe(false);
  });

  it('is false without a subject field', () => {
    expect(
      isMetricComplete({
        sourceId: 'src-1',
        measure: { field: 'amount', aggregation: 'sum' },
      })
    ).toBe(false);
  });

  it('requires a field for non-count aggregations', () => {
    expect(
      isMetricComplete({
        sourceId: 'src-1',
        measure: { aggregation: 'sum' },
        subjectField: 'ownerId',
      })
    ).toBe(false);
  });

  it('allows count without a field', () => {
    expect(
      isMetricComplete({
        sourceId: 'src-1',
        measure: { aggregation: 'count' },
        subjectField: 'ownerId',
      })
    ).toBe(true);
  });

  it('requires a field for countDistinct', () => {
    expect(
      isMetricComplete({
        sourceId: 'src-1',
        measure: { aggregation: 'countDistinct' },
        subjectField: 'ownerId',
      })
    ).toBe(false);
    expect(
      isMetricComplete({
        sourceId: 'src-1',
        measure: { field: 'traineeId', aggregation: 'countDistinct' },
        subjectField: 'ownerId',
      })
    ).toBe(true);
  });

  it('is true with source, measure field, and subject', () => {
    expect(
      isMetricComplete({
        sourceId: 'src-1',
        measure: { field: 'amount', aggregation: 'sum' },
        subjectField: 'ownerId',
      })
    ).toBe(true);
  });
});
