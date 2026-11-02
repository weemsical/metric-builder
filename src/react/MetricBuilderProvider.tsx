import type { ReactNode } from 'react';
import type { MetricDataProvider } from '../core/provider';
import type { MetricStore } from '../core/store';
import { MetricDataProviderContext } from './metricBuilderContext';
import { MetricStoreContext } from './metricStoreContext';

export type MetricBuilderProviderProps = {
  dataProvider: MetricDataProvider;
  metricStore?: MetricStore;
  children: ReactNode;
};

export const MetricBuilderProvider = ({
  dataProvider,
  metricStore,
  children,
}: MetricBuilderProviderProps) => (
  <MetricDataProviderContext.Provider value={dataProvider}>
    <MetricStoreContext.Provider value={metricStore ?? null}>
      {children}
    </MetricStoreContext.Provider>
  </MetricDataProviderContext.Provider>
);
