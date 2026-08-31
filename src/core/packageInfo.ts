export type PackageInfo = {
  name: string;
};

export const packageInfo = (): PackageInfo => ({
  name: '@ascentcloud/metric-builder',
});
