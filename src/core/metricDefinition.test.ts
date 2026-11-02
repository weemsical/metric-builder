import { describe, expect, it } from 'vitest';
import {
  emptyMetricDefinition,
  isMetricComplete,
  removeFilter,
  updateFilter,
  withAggregation,
  withFilter,
  withMeasureField,
  withPacing,
  withRange,
  withRankMethod,
  withSource,
  withSubjectField,
  withTarget,
  withThresholds,
  withWindow,
  type MetricDefinition,
} from './metricDefinition';
import type {
  Filter,
  Pacing,
  Range,
  Target,
  Thresholds,
  Window,
} from './types';

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

describe('filter helpers', () => {
  const a: Filter = { field: 'stage', operator: 'equals', value: 'Won' };
  const b: Filter = { field: 'amount', operator: 'gte', value: 1000 };

  it('withFilter appends to an empty definition without mutating it', () => {
    const def: MetricDefinition = { sourceId: 'crm' };
    const next = withFilter(def, a);
    expect(next.filters).toEqual([a]);
    expect(def.filters).toBeUndefined();
  });

  it('withFilter appends to existing filters immutably', () => {
    const def: MetricDefinition = { sourceId: 'crm', filters: [a] };
    const next = withFilter(def, b);
    expect(next.filters).toEqual([a, b]);
    expect(def.filters).toEqual([a]);
  });

  it('updateFilter replaces the filter at an index', () => {
    const def: MetricDefinition = { sourceId: 'crm', filters: [a, b] };
    const next = updateFilter(def, 0, b);
    expect(next.filters).toEqual([b, b]);
    expect(def.filters).toEqual([a, b]);
  });

  it('removeFilter drops the filter at an index', () => {
    const def: MetricDefinition = { sourceId: 'crm', filters: [a, b] };
    const next = removeFilter(def, 0);
    expect(next.filters).toEqual([b]);
    expect(def.filters).toEqual([a, b]);
  });

  it('updateFilter and removeFilter tolerate a definition with no filters', () => {
    const def: MetricDefinition = { sourceId: 'crm' };
    expect(updateFilter(def, 0, a).filters).toEqual([]);
    expect(removeFilter(def, 0).filters).toEqual([]);
  });
});

describe('window and range helpers', () => {
  const window: Window = { field: 'closedAt', granularity: 'weekly' };
  const range: Range = { field: 'closedAt', lastDays: 30 };

  it('withWindow sets the window immutably', () => {
    const def: MetricDefinition = { sourceId: 'crm' };
    const next = withWindow(def, window);
    expect(next.window).toEqual(window);
    expect(def.window).toBeUndefined();
  });

  it('withRange sets the range immutably', () => {
    const def: MetricDefinition = { sourceId: 'crm' };
    const next = withRange(def, range);
    expect(next.range).toEqual(range);
    expect(def.range).toBeUndefined();
  });
});

describe('target, thresholds, pacing, rank helpers', () => {
  const target: Target = { value: 100, direction: 'higherIsBetter' };
  const thresholds: Thresholds = { amber: 0.7, green: 0.9 };
  const pacing: Pacing = { strategy: 'rampUp', excludeWeekends: true };

  it('withTarget sets the target immutably', () => {
    const def: MetricDefinition = { sourceId: 'crm' };
    const next = withTarget(def, target);
    expect(next.target).toEqual(target);
    expect(def.target).toBeUndefined();
  });

  it('withThresholds sets thresholds immutably', () => {
    const def: MetricDefinition = { sourceId: 'crm' };
    expect(withThresholds(def, thresholds).thresholds).toEqual(thresholds);
    expect(def.thresholds).toBeUndefined();
  });

  it('withPacing sets pacing immutably', () => {
    const def: MetricDefinition = { sourceId: 'crm' };
    expect(withPacing(def, pacing).pacing).toEqual(pacing);
    expect(def.pacing).toBeUndefined();
  });

  it('withRankMethod sets the rank method immutably', () => {
    const def: MetricDefinition = { sourceId: 'crm' };
    expect(withRankMethod(def, 'percentToGoal').rankMethod).toBe(
      'percentToGoal'
    );
    expect(def.rankMethod).toBeUndefined();
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
