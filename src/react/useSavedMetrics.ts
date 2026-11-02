import { useCallback, useEffect, useState } from 'react';
import type { MetricDefinition } from '../core/metricDefinition';
import { useMetricStore } from './metricStoreContext';

export type UseSavedMetrics = {
  saved: Array<{ id: string; name: string }>;
  loading: boolean;
  error: boolean;
  save: (name: string, definition: MetricDefinition) => Promise<string>;
  load: (
    id: string
  ) => Promise<{ name: string; definition: MetricDefinition }>;
  remove: (id: string) => Promise<void>;
};

export const useSavedMetrics = (): UseSavedMetrics => {
  const store = useMetricStore();
  const [saved, setSaved] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    store.list().then(
      (metrics) => {
        setSaved(metrics);
        setLoading(false);
      },
      () => {
        setError(true);
        setLoading(false);
      }
    );
  }, [store]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    saved,
    loading,
    error,
    save: async (name, definition) => {
      const id = await store.save(name, definition);
      refresh();
      return id;
    },
    load: (id) => store.load(id),
    remove: async (id) => {
      await store.remove(id);
      refresh();
    },
  };
};
