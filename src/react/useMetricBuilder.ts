import { useEffect, useState } from 'react';
import {
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
  type Aggregation,
  type MetricDefinition,
} from '../core/metricDefinition';
import { operatorsForFieldType } from '../core/operators';
import type {
  Filter,
  FilterOperator,
  MetricSource,
  Pacing,
  Range,
  RankMethod,
  SourceField,
  Target,
  Thresholds,
  Window,
} from '../core/types';
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
  filters: Filter[];
  filterLogic?: string;
  setFilterLogic: (logic: string) => void;
  operatorsFor: (field: string) => FilterOperator[];
  addFilter: (filter: Filter) => void;
  changeFilter: (index: number, filter: Filter) => void;
  removeFilter: (index: number) => void;
  dateFields: SourceField[];
  window?: Window;
  range?: Range;
  setWindow: (window: Window | undefined) => void;
  setRange: (range: Range | undefined) => void;
  target?: Target;
  thresholds?: Thresholds;
  pacing?: Pacing;
  rankMethod?: RankMethod;
  setTarget: (target: Target | undefined) => void;
  setThresholds: (thresholds: Thresholds | undefined) => void;
  setPacing: (pacing: Pacing | undefined) => void;
  setRankMethod: (rankMethod: RankMethod | undefined) => void;
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
    filters: definition.filters ?? [],
    filterLogic: definition.filterLogic,
    setFilterLogic: (logic) => {
      if (logic) {
        onChange({ ...definition, filterLogic: logic });
        return;
      }
      const { filterLogic: _removed, ...rest } = definition;
      onChange(rest);
    },
    operatorsFor: (field) =>
      operatorsForFieldType(
        fields.find((candidate) => candidate.apiName === field)?.type ??
          'unknown'
      ),
    addFilter: (filter) => onChange(withFilter(definition, filter)),
    changeFilter: (index, filter) =>
      onChange(updateFilter(definition, index, filter)),
    removeFilter: (index) => onChange(removeFilter(definition, index)),
    dateFields: fields.filter((field) => field.type === 'date'),
    window: definition.window,
    range: definition.range,
    setWindow: (window) => {
      if (window) {
        onChange(withWindow(definition, window));
        return;
      }
      const { window: _removed, ...rest } = definition;
      onChange(rest);
    },
    setRange: (range) => {
      if (range) {
        onChange(withRange(definition, range));
        return;
      }
      const { range: _removed, ...rest } = definition;
      onChange(rest);
    },
    target: definition.target,
    thresholds: definition.thresholds,
    pacing: definition.pacing,
    rankMethod: definition.rankMethod,
    setTarget: (target) => {
      if (target) {
        onChange(withTarget(definition, target));
        return;
      }
      const { target: _removed, ...rest } = definition;
      onChange(rest);
    },
    setThresholds: (thresholds) => {
      if (thresholds) {
        onChange(withThresholds(definition, thresholds));
        return;
      }
      const { thresholds: _removed, ...rest } = definition;
      onChange(rest);
    },
    setPacing: (pacing) => {
      if (pacing) {
        onChange(withPacing(definition, pacing));
        return;
      }
      const { pacing: _removed, ...rest } = definition;
      onChange(rest);
    },
    setRankMethod: (rankMethod) => {
      if (rankMethod) {
        onChange(withRankMethod(definition, rankMethod));
        return;
      }
      const { rankMethod: _removed, ...rest } = definition;
      onChange(rest);
    },
  };
};
