import { useEffect, useState } from 'react';
import {
  withAggregation,
  withMeasureField,
  withSource,
  withSubjectField,
  type Aggregation,
  type MetricDefinition,
} from '../core/metricDefinition';
import type { MetricSource, SourceField } from '../core/types';
import { useMetricDataProvider } from './metricBuilderContext';

export type UseMetricBuilder = {
  sources: MetricSource[];
  sourcesLoading: boolean;
  sourcesError: boolean;
  fields: SourceField[];
  fieldsLoading: boolean;
  fieldsError: boolean;
  selectSource: (sourceId: string) => void;
  selectAggregation: (aggregation: Aggregation) => void;
  selectField: (field: string) => void;
  selectSubject: (subjectField: string) => void;
};

type Loadable<T> = { status: 'loading' | 'error'; value: T } | { status: 'ready'; value: T };

type Described = { sourceId: string; fields: SourceField[] };

export const useMetricBuilder = (
  definition: MetricDefinition,
  onChange: (next: MetricDefinition) => void
): UseMetricBuilder => {
  const provider = useMetricDataProvider();
  const [sourcesState, setSourcesState] = useState<Loadable<MetricSource[]>>({
    status: 'loading',
    value: [],
  });
  const [described, setDescribed] = useState<Described | null>(null);
  const [erroredSource, setErroredSource] = useState<string | null>(null);

  useEffect(() => {
    provider.listSources().then(
      (sources) => setSourcesState({ status: 'ready', value: sources }),
      () => setSourcesState({ status: 'error', value: [] })
    );
  }, [provider]);

  const { sourceId } = definition;
  useEffect(() => {
    if (!sourceId) {
      return;
    }
    provider.describeSource(sourceId).then(
      (describe) => setDescribed({ sourceId, fields: describe.fields }),
      () => setErroredSource(sourceId)
    );
  }, [provider, sourceId]);

  const fieldsError = erroredSource === sourceId && Boolean(sourceId);
  const fields =
    described && described.sourceId === sourceId ? described.fields : [];
  const fieldsLoading =
    Boolean(sourceId) && !fieldsError && described?.sourceId !== sourceId;

  return {
    sources: sourcesState.value,
    sourcesLoading: sourcesState.status === 'loading',
    sourcesError: sourcesState.status === 'error',
    fields,
    fieldsLoading,
    fieldsError,
    selectSource: (id) => onChange(withSource(definition, id)),
    selectAggregation: (aggregation) =>
      onChange(withAggregation(definition, aggregation)),
    selectField: (field) => onChange(withMeasureField(definition, field)),
    selectSubject: (subjectField) =>
      onChange(withSubjectField(definition, subjectField)),
  };
};
