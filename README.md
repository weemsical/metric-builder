# @ascentcloud/metric-builder

Domain-agnostic metric builder for Ascent Cloud React products. Pick a data **source**, define a
**measure** (an aggregation over a field), and group by a **subject** (the person or entity being
measured — a sales rep, a trainee, anyone). Shareable across products; not tied to any one host's
store, auth, or gateway.

## Subpath exports

- `@ascentcloud/metric-builder/core` — framework-agnostic metric model, pure transforms, types, and
  the `MetricDataProvider` port. No React, no Redux.
- `@ascentcloud/metric-builder/data` — platform-gateway data adapter (RTK Query), parameterized by an
  injected base URL and auth headers. Optional — a host may implement the provider port itself.
- `@ascentcloud/metric-builder/react` — `MetricBuilderProvider`, the `useMetricBuilder` hook, and the
  `MetricStage` UI. Decoupled from `@ascentcloud/platform-ui`; the host supplies org id and a provider.

## Peer dependencies

`react`, `react-dom`, `@reduxjs/toolkit`, `react-redux` are provided by the host.

## Install

Published to GitHub Packages. Consumers need `@ascentcloud:registry=https://npm.pkg.github.com` in
their `.npmrc` (see this repo's `.npmrc`) and a `NODE_AUTH_TOKEN`.

```
pnpm add @ascentcloud/metric-builder
```

## Develop

```
pnpm install
pnpm dev             # local playground at http://localhost:5173
pnpm test            # watch
pnpm test:coverage   # 100% thresholds enforced
pnpm type:check
pnpm build           # tsc -b && vite build (ESM + .d.ts per subpath)
```

### Playground

`pnpm dev` serves `src/dev/` — the real `MetricStage` wired to a `MockMetricDataProvider`
(`src/dev/seeds.ts`) with two demo sources (a fitness trainer scoring trainees, and sales activity),
plus a live definition + computed leaderboard. No gateway or auth required.
