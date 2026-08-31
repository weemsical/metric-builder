import { createContext, useContext } from 'react';
import type { MetricDataProvider } from '../core/provider';

export const MetricDataProviderContext =
  createContext<MetricDataProvider | null>(null);

export const useMetricDataProvider = (): MetricDataProvider => {
  const provider = useContext(MetricDataProviderContext);
  if (!provider) {
    throw new Error(
      'useMetricDataProvider must be used within a MetricBuilderProvider'
    );
  }
  return provider;
};
