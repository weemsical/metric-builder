import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMetricDataProvider } from './metricBuilderContext';

describe('useMetricDataProvider', () => {
  it('throws when used outside a MetricBuilderProvider', () => {
    expect(() => renderHook(() => useMetricDataProvider())).toThrow(
      /within a MetricBuilderProvider/
    );
  });
});
