import { createContext, useContext } from 'react';
import type { MetricStore } from '../core/store';

export const MetricStoreContext = createContext<MetricStore | null>(null);

export const useMetricStore = (): MetricStore => {
  const store = useContext(MetricStoreContext);
  if (!store) {
    throw new Error(
      'useMetricStore must be used within a MetricBuilderProvider that was given a metricStore'
    );
  }
  return store;
};
