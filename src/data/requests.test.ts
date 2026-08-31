import { describe, expect, it } from 'vitest';
import {
  buildUrl,
  dataRequest,
  describeRequest,
  organizationInstancesRequest,
} from './requests';

describe('organizationInstancesRequest', () => {
  it('targets the organization endpoint and flags the Ascent Cloud org id', () => {
    expect(organizationInstancesRequest('org-1')).toEqual({
      path: '/integrations/organization',
      params: { organizationId: 'org-1', isAcOrgId: true },
    });
  });
});

describe('describeRequest', () => {
  it('targets the describe endpoint with the instance id', () => {
    expect(describeRequest('i1')).toEqual({
      path: '/integrations/describe',
      params: { instanceId: 'i1' },
    });
  });
});

describe('dataRequest', () => {
  it('targets the data endpoint with the instance id', () => {
    expect(dataRequest('i1')).toEqual({
      path: '/integrations/data',
      params: { instanceId: 'i1' },
    });
  });
});

describe('buildUrl', () => {
  it('joins base, path, and stringified params', () => {
    expect(
      buildUrl('https://gw/platform-api', '/integrations/organization', {
        organizationId: 'org-1',
        isAcOrgId: true,
      })
    ).toBe(
      'https://gw/platform-api/integrations/organization?organizationId=org-1&isAcOrgId=true'
    );
  });

  it('omits the query string when there are no params', () => {
    expect(buildUrl('https://gw', '/x', {})).toBe('https://gw/x');
  });
});
