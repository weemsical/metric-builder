import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGatewayProvider } from './gatewayProvider';

type Call = { url: string; init?: RequestInit };

const fakeFetch = (body: unknown, ok = true, status = 200) => {
  const calls: Call[] = [];
  const impl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return {
      ok,
      status,
      json: async () => body,
    } as Response;
  }) as unknown as typeof fetch;
  return { impl, calls };
};

const orgBody = {
  status: 'success',
  data: [
    { id: 'gym', name: 'Gym Sessions', enabled: true, integration: { id: 'x', name: 'X' } },
  ],
};

const describeBody = {
  status: 'success',
  data: {
    type: 'session',
    fields: [
      { apiName: 'traineeId', label: 'Trainee', type: 'text', isPrimaryKey: false },
      { apiName: 'reps', label: 'Reps', type: 'number', isPrimaryKey: false },
    ],
  },
};

const dataBody = {
  status: 'success',
  data: [
    { traineeId: 'ana', reps: 10, day: '2024-03-01T00:00:00Z' },
    { traineeId: 'ana', reps: 20, day: '2024-03-01T00:00:00Z' },
    { traineeId: 'bo', reps: 5, day: '2024-03-01T00:00:00Z' },
  ],
};

const asOf = Date.parse('2024-06-01T00:00:00Z');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createGatewayProvider', () => {
  it('lists sources mapped to core shape and passes the auth header', async () => {
    const { impl, calls } = fakeFetch(orgBody);
    const provider = createGatewayProvider({
      baseUrl: 'https://gw/platform-api',
      organizationId: 'org-1',
      getAuthHeader: () => 'Bearer token-1',
      fetchImpl: impl,
    });

    expect(await provider.listSources()).toEqual([
      { id: 'gym', name: 'Gym Sessions', enabled: true },
    ]);
    expect(calls[0].url).toBe(
      'https://gw/platform-api/integrations/organization?organizationId=org-1&isAcOrgId=true'
    );
    expect(new Headers(calls[0].init?.headers).get('Authorization')).toBe(
      'Bearer token-1'
    );
  });

  it('describes a source', async () => {
    const { impl } = fakeFetch(describeBody);
    const provider = createGatewayProvider({
      baseUrl: 'https://gw',
      organizationId: 'org-1',
      fetchImpl: impl,
    });
    expect((await provider.describeSource('gym')).fields).toHaveLength(2);
  });

  it('omits the auth header when none is configured', async () => {
    const { impl, calls } = fakeFetch(describeBody);
    const provider = createGatewayProvider({
      baseUrl: 'https://gw',
      organizationId: 'org-1',
      fetchImpl: impl,
    });
    await provider.describeSource('gym');
    expect(new Headers(calls[0].init?.headers).get('Authorization')).toBeNull();
  });

  it('queries data and aggregates per subject', async () => {
    const { impl, calls } = fakeFetch(dataBody);
    const provider = createGatewayProvider({
      baseUrl: 'https://gw',
      organizationId: 'org-1',
      fetchImpl: impl,
    });
    expect(
      await provider.queryData(
        {
          sourceId: 'gym',
          measure: { field: 'reps', aggregation: 'sum' },
          subjectField: 'traineeId',
        },
        asOf
      )
    ).toEqual([
      { subject: 'ana', value: 30 },
      { subject: 'bo', value: 5 },
    ]);
    expect(calls[0].url).toBe('https://gw/integrations/data?instanceId=gym');
  });

  it('returns empty without querying when no source is selected', async () => {
    const { impl, calls } = fakeFetch(dataBody);
    const provider = createGatewayProvider({
      baseUrl: 'https://gw',
      organizationId: 'org-1',
      fetchImpl: impl,
    });
    expect(await provider.queryData({}, asOf)).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it('computes a series and returns empty without a source', async () => {
    const { impl, calls } = fakeFetch(dataBody);
    const provider = createGatewayProvider({
      baseUrl: 'https://gw',
      organizationId: 'org-1',
      fetchImpl: impl,
    });
    expect(await provider.querySeries!({}, asOf)).toEqual([]);
    expect(calls).toHaveLength(0);
    expect(
      await provider.querySeries!(
        {
          sourceId: 'gym',
          measure: { aggregation: 'count' },
          subjectField: 'traineeId',
          window: { field: 'day', granularity: 'daily' },
        },
        asOf
      )
    ).toEqual([
      { subject: 'ana', points: [{ bucket: '2024-03-01', value: 2 }] },
      { subject: 'bo', points: [{ bucket: '2024-03-01', value: 1 }] },
    ]);
  });

  it('throws when the gateway responds with an error status', async () => {
    const { impl } = fakeFetch({}, false, 500);
    const provider = createGatewayProvider({
      baseUrl: 'https://gw',
      organizationId: 'org-1',
      fetchImpl: impl,
    });
    await expect(provider.listSources()).rejects.toThrow('500');
  });

  it('falls back to global fetch when no fetch is injected', async () => {
    const { impl } = fakeFetch(orgBody);
    vi.stubGlobal('fetch', impl);
    const provider = createGatewayProvider({
      baseUrl: 'https://gw',
      organizationId: 'org-1',
    });
    expect(await provider.listSources()).toHaveLength(1);
  });
});
