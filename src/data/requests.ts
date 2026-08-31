export type RequestParams = Record<string, string | number | boolean>;

export type GatewayRequest = {
  path: string;
  params: RequestParams;
};

export const organizationInstancesRequest = (
  organizationId: string
): GatewayRequest => ({
  path: '/integrations/organization',
  params: { organizationId, isAcOrgId: true },
});

export const describeRequest = (instanceId: string): GatewayRequest => ({
  path: '/integrations/describe',
  params: { instanceId },
});

export const dataRequest = (instanceId: string): GatewayRequest => ({
  path: '/integrations/data',
  params: { instanceId },
});

export const buildUrl = (
  baseUrl: string,
  path: string,
  params: RequestParams
): string => {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();

  return query ? `${baseUrl}${path}?${query}` : `${baseUrl}${path}`;
};
