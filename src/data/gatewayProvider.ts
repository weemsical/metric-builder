import { computeFormula } from '../core/computeFormula';
import { computeSubjectSeries } from '../core/computeSubjectSeries';
import { computeSubjectValues } from '../core/computeSubjectValues';
import type { MetricDefinition } from '../core/metricDefinition';
import type { MetricDataProvider } from '../core/provider';
import type { MetricSource, SourceDescribe } from '../core/types';
import {
  buildUrl,
  dataRequest,
  describeRequest,
  organizationInstancesRequest,
  type GatewayRequest,
} from './requests';

export type GatewayProviderConfig = {
  baseUrl: string;
  organizationId: string;
  getAuthHeader?: () => string | undefined;
  fetchImpl?: typeof fetch;
};

type GatewayInstance = {
  id: string;
  name: string;
  enabled: boolean;
};

type Envelope<T> = {
  status: string;
  data: T;
};

export const createGatewayProvider = (
  config: GatewayProviderConfig
): MetricDataProvider => {
  const doFetch = config.fetchImpl ?? fetch;

  const request = async <T>({ path, params }: GatewayRequest): Promise<T> => {
    const headers = new Headers();
    const auth = config.getAuthHeader?.();
    if (auth) {
      headers.set('Authorization', auth);
    }

    const response = await doFetch(buildUrl(config.baseUrl, path, params), {
      headers,
    });
    if (!response.ok) {
      throw new Error(`Gateway request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  };

  return {
    listSources: async (): Promise<MetricSource[]> => {
      const body = await request<Envelope<GatewayInstance[]>>(
        organizationInstancesRequest(config.organizationId)
      );
      return body.data.map(({ id, name, enabled }) => ({ id, name, enabled }));
    },

    describeSource: async (sourceId: string): Promise<SourceDescribe> => {
      const body = await request<Envelope<SourceDescribe>>(
        describeRequest(sourceId)
      );
      return body.data;
    },

    queryData: async (definition: MetricDefinition, asOf: number) => {
      if (definition.formula) {
        const results = await Promise.all(
          definition.formula.components.map(async (component) => {
            if (!component.sourceId) {
              return [];
            }
            const body = await request<
              Envelope<Array<Record<string, unknown>>>
            >(dataRequest(component.sourceId));
            return computeSubjectValues(body.data, component, asOf);
          })
        );
        return computeFormula(results, definition.formula.op);
      }
      if (!definition.sourceId) {
        return [];
      }
      const body = await request<Envelope<Array<Record<string, unknown>>>>(
        dataRequest(definition.sourceId)
      );
      return computeSubjectValues(body.data, definition, asOf);
    },

    querySeries: async (definition: MetricDefinition, asOf: number) => {
      if (!definition.sourceId) {
        return [];
      }
      const body = await request<Envelope<Array<Record<string, unknown>>>>(
        dataRequest(definition.sourceId)
      );
      return computeSubjectSeries(body.data, definition, asOf);
    },
  };
};
