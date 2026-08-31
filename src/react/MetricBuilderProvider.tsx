import type { ReactNode } from 'react';
import type { MetricDataProvider } from '../core/provider';
import { MetricDataProviderContext } from './metricBuilderContext';

export type MetricBuilderProviderProps = {
  dataProvider: MetricDataProvider;
  children: ReactNode;
};

export const MetricBuilderProvider = ({
  dataProvider,
  children,
}: MetricBuilderProviderProps) => (
  <MetricDataProviderContext.Provider value={dataProvider}>
    {children}
  </MetricDataProviderContext.Provider>
);
