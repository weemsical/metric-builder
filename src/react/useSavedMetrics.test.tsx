import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createMemoryStore, type MetricStore } from '../core/store';
import type { MetricDefinition } from '../core/metricDefinition';
import { MetricBuilderProvider } from './MetricBuilderProvider';
import { useMetricStore } from './metricStoreContext';
import { useSavedMetrics } from './useSavedMetrics';

const definition: MetricDefinition = {
  sourceId: 'gym',
  measure: { aggregation: 'count' },
  subjectField: 'traineeId',
};

const wrapperFor =
  (store: MetricStore) =>
  ({ children }: { children: ReactNode }) => (
    <MetricBuilderProvider
      dataProvider={{
        listSources: () => Promise.resolve([]),
        describeSource: () => Promise.reject(new Error('unused')),
        queryData: () => Promise.resolve([]),
      }}
      metricStore={store}
    >
      {children}
    </MetricBuilderProvider>
  );

describe('useSavedMetrics', () => {
  it('throws when used outside a store provider', () => {
    expect(() => renderHook(() => useMetricStore())).toThrow(
      /within a MetricBuilderProvider/
    );
  });

  it('loads the saved list, then saves, lists, loads and removes', async () => {
    const store = createMemoryStore();
    const { result } = renderHook(() => useSavedMetrics(), {
      wrapper: wrapperFor(store),
    });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.saved).toEqual([]);
    expect(result.current.error).toBe(false);

    let id = '';
    await act(async () => {
      id = await result.current.save('Rows per trainee', definition);
    });
    await waitFor(() =>
      expect(result.current.saved).toEqual([{ id, name: 'Rows per trainee' }])
    );

    expect(await result.current.load(id)).toEqual({
      name: 'Rows per trainee',
      definition,
    });

    await act(async () => {
      await result.current.remove(id);
    });
    await waitFor(() => expect(result.current.saved).toEqual([]));
  });

  it('flags an error when the list fails to load', async () => {
    const failing: MetricStore = {
      save: () => Promise.reject(new Error('down')),
      load: () => Promise.reject(new Error('down')),
      list: () => Promise.reject(new Error('down')),
      remove: () => Promise.reject(new Error('down')),
    };
    const { result } = renderHook(() => useSavedMetrics(), {
      wrapper: wrapperFor(failing),
    });
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
  });
});
