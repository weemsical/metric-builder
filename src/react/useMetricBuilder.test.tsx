import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createMockProvider, type MockSourceSeed } from '../core/mockProvider';
import type { MetricDataProvider } from '../core/provider';
import type { MetricDefinition } from '../core/metricDefinition';
import { MetricBuilderProvider } from './MetricBuilderProvider';
import { useMetricBuilder } from './useMetricBuilder';

const seed: MockSourceSeed = {
  source: { id: 'gym', name: 'Gym Sessions', enabled: true },
  describe: {
    type: 'session',
    fields: [
      { apiName: 'traineeId', label: 'Trainee', type: 'text', isPrimaryKey: false },
      { apiName: 'reps', label: 'Reps', type: 'number', isPrimaryKey: false },
    ],
  },
  rows: [{ traineeId: 'ana', reps: 10 }],
};

const datedSeed: MockSourceSeed = {
  source: { id: 'crm', name: 'Sales', enabled: true },
  describe: {
    type: 'activity',
    fields: [
      { apiName: 'owner', label: 'Owner', type: 'text', isPrimaryKey: false },
      { apiName: 'amount', label: 'Amount', type: 'number', isPrimaryKey: false },
      { apiName: 'closedAt', label: 'Closed At', type: 'date', isPrimaryKey: false },
    ],
  },
  rows: [{ owner: 'Jo', amount: 10, closedAt: '2024-03-01' }],
};

const wrapperFor =
  (provider: MetricDataProvider) =>
  ({ children }: { children: ReactNode }) => (
    <MetricBuilderProvider dataProvider={provider}>
      {children}
    </MetricBuilderProvider>
  );

const renderBuilder = (
  provider: MetricDataProvider,
  definition: MetricDefinition,
  onChange = vi.fn()
) =>
  renderHook(() => useMetricBuilder(definition, onChange), {
    wrapper: wrapperFor(provider),
  });

describe('useMetricBuilder', () => {
  it('loads sources from the provider', async () => {
    const { result } = renderBuilder(createMockProvider([seed]), {});
    expect(result.current.sourcesLoading).toBe(true);
    await waitFor(() => expect(result.current.sourcesLoading).toBe(false));
    expect(result.current.sources).toEqual([seed.source]);
  });

  it('flags an error when sources fail to load', async () => {
    const failing: MetricDataProvider = {
      listSources: () => Promise.reject(new Error('down')),
      describeSource: () => Promise.reject(new Error('down')),
      queryData: () => Promise.resolve([]),
    };
    const { result } = renderBuilder(failing, {});
    await waitFor(() => expect(result.current.sourcesError).toBe(true));
    expect(result.current.sourcesLoading).toBe(false);
  });

  it('does not load fields until a source is selected', async () => {
    const { result } = renderBuilder(createMockProvider([seed]), {});
    await waitFor(() => expect(result.current.sourcesLoading).toBe(false));
    expect(result.current.fields).toEqual([]);
    expect(result.current.fieldsLoading).toBe(false);
  });

  it('loads fields once a source is selected', async () => {
    const { result } = renderBuilder(createMockProvider([seed]), {
      sourceId: 'gym',
    });
    await waitFor(() => expect(result.current.fields).toHaveLength(2));
    expect(result.current.fieldsError).toBe(false);
  });

  it('flags an error when fields fail to load', async () => {
    const failing: MetricDataProvider = {
      listSources: () => Promise.resolve([seed.source]),
      describeSource: () => Promise.reject(new Error('nope')),
      queryData: () => Promise.resolve([]),
    };
    const { result } = renderBuilder(failing, { sourceId: 'gym' });
    await waitFor(() => expect(result.current.fieldsError).toBe(true));
    expect(result.current.fieldsLoading).toBe(false);
  });

  it('exposes filter state, operatorsFor, and add/change/remove helpers', async () => {
    const onChange = vi.fn();
    const { result } = renderBuilder(
      createMockProvider([seed]),
      { sourceId: 'gym' },
      onChange
    );
    await waitFor(() => expect(result.current.fields).toHaveLength(2));

    expect(result.current.filters).toEqual([]);
    expect(result.current.operatorsFor('reps')).toEqual(
      expect.arrayContaining(['gte', 'lt'])
    );
    expect(result.current.operatorsFor('traineeId')).toContain('contains');
    expect(result.current.operatorsFor('nope')).toContain('equals');

    result.current.addFilter({ field: 'reps', operator: 'gte', value: 30 });
    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'gym',
      filters: [{ field: 'reps', operator: 'gte', value: 30 }],
    });
  });

  it('changes and removes filters', async () => {
    const onChange = vi.fn();
    const { result } = renderBuilder(
      createMockProvider([seed]),
      {
        sourceId: 'gym',
        filters: [{ field: 'reps', operator: 'gte', value: 30 }],
      },
      onChange
    );
    await waitFor(() => expect(result.current.fields).toHaveLength(2));

    result.current.changeFilter(0, { field: 'reps', operator: 'lt', value: 10 });
    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'gym',
      filters: [{ field: 'reps', operator: 'lt', value: 10 }],
    });

    result.current.removeFilter(0);
    expect(onChange).toHaveBeenCalledWith({ sourceId: 'gym', filters: [] });
  });

  it('exposes date fields and window/range setters', async () => {
    const onChange = vi.fn();
    const { result } = renderBuilder(
      createMockProvider([datedSeed]),
      { sourceId: 'crm' },
      onChange
    );
    await waitFor(() => expect(result.current.fields).toHaveLength(3));

    expect(result.current.dateFields.map((f) => f.apiName)).toEqual(['closedAt']);
    expect(result.current.window).toBeUndefined();
    expect(result.current.range).toBeUndefined();

    result.current.setWindow({ field: 'closedAt', granularity: 'weekly' });
    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'crm',
      window: { field: 'closedAt', granularity: 'weekly' },
    });

    result.current.setRange({ field: 'closedAt', lastDays: 30 });
    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'crm',
      range: { field: 'closedAt', lastDays: 30 },
    });
  });

  it('clears window and range when set to undefined', async () => {
    const onChange = vi.fn();
    const { result } = renderBuilder(
      createMockProvider([datedSeed]),
      {
        sourceId: 'crm',
        window: { field: 'closedAt', granularity: 'weekly' },
        range: { field: 'closedAt', lastDays: 30 },
      },
      onChange
    );
    await waitFor(() => expect(result.current.fields).toHaveLength(3));

    result.current.setWindow(undefined);
    expect(onChange).toHaveBeenLastCalledWith({
      sourceId: 'crm',
      range: { field: 'closedAt', lastDays: 30 },
    });

    result.current.setRange(undefined);
    expect(onChange).toHaveBeenLastCalledWith({
      sourceId: 'crm',
      window: { field: 'closedAt', granularity: 'weekly' },
    });
  });

  it('exposes handlers that emit transformed definitions', async () => {
    const onChange = vi.fn();
    const { result } = renderBuilder(
      createMockProvider([seed]),
      { sourceId: 'gym', measure: { aggregation: 'sum' } },
      onChange
    );
    await waitFor(() => expect(result.current.sourcesLoading).toBe(false));

    result.current.selectSource('other');
    result.current.selectAggregation('avg');
    result.current.selectField('reps');
    result.current.selectSubject('traineeId');

    expect(onChange).toHaveBeenNthCalledWith(1, { sourceId: 'other' });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      sourceId: 'gym',
      measure: { aggregation: 'avg' },
    });
    expect(onChange).toHaveBeenNthCalledWith(3, {
      sourceId: 'gym',
      measure: { aggregation: 'sum', field: 'reps' },
    });
    expect(onChange).toHaveBeenNthCalledWith(4, {
      sourceId: 'gym',
      measure: { aggregation: 'sum' },
      subjectField: 'traineeId',
    });
  });
});
