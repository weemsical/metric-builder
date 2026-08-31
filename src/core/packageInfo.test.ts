import { describe, expect, it } from 'vitest';
import { packageInfo } from './packageInfo';

describe('packageInfo', () => {
  it('reports the package name', () => {
    expect(packageInfo().name).toBe('@ascentcloud/metric-builder');
  });
});
