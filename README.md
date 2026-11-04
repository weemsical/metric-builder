# @ascentcloud/metric-builder

Domain-agnostic metric builder for Ascent Cloud React products. Pick a data **source**, define a
**measure** (an aggregation over a field), and group by a **subject** (the person or entity being
measured — a sales rep, a trainee, anyone). Shareable across products; not tied to any one host's
store, auth, or gateway.

## Subpath exports

- `@ascentcloud/metric-builder/core` — framework-agnostic metric model, pure transforms, types, and
  the `MetricDataProvider` port. No React, no Redux.
- `@ascentcloud/metric-builder/data` — platform-gateway data adapter (`fetch`-based), parameterized
  by an injected base URL and auth headers. Optional — a host may implement the provider port itself.
- `@ascentcloud/metric-builder/react` — `MetricBuilderProvider`, the `useMetricBuilder` hook, and the
  `MetricStage` UI. Decoupled from `@ascentcloud/platform-ui`; the host supplies org id and a provider.

## Quick start

Wire the controlled `MetricStage` to a provider; the host owns the definition state:

```tsx
import { useState } from 'react';
import { emptyMetricDefinition, createMockProvider, type MetricDefinition } from '@ascentcloud/metric-builder/core';
import { MetricBuilderProvider, MetricStage } from '@ascentcloud/metric-builder/react';

const provider = createMockProvider(seeds); // or createGatewayProvider(config) from /data, or your own

export const Builder = () => {
  const [definition, setDefinition] = useState<MetricDefinition>(emptyMetricDefinition());
  return (
    <MetricBuilderProvider dataProvider={provider}>
      <MetricStage definition={definition} onChange={setDefinition} />
    </MetricBuilderProvider>
  );
};
```

Compute a leaderboard from a complete definition with `provider.queryData(definition)` (or, for rows
you already hold, the pure `computeSubjectValues(rows, definition)`). See `src/dev/App.tsx` for the
full wiring.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the code is structured, the three layers, the
  data flow, and where the roadmap extends. **Start here to understand the codebase.**
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — setup, the TDD workflow, adding a capability, and releasing.
- [`docs/prd-metric-builder.md`](docs/prd-metric-builder.md) — product vision, host products,
  guiding principles, and per-roadmap acceptance criteria.
- [`docs/plan-metric-builder-roadmap.md`](docs/plan-metric-builder-roadmap.md) — phased plan and
  resolved design decisions.

## Theming

`MetricStage` ships its own scoped stylesheet (auto-injected) so it looks and behaves the same in
every host, while fitting each app's theme. It styles against the `@ascentcloud/platform-ui` token
contract — `--pui-*` CSS custom properties — with hard-coded fallbacks:

```css
color: var(--pui-color-text-strong, #17282d);
border-radius: var(--pui-radius-md, 6px);
```

- In a platform app that imports `@ascentcloud/platform-ui/style.css`, the builder inherits that
  app's theme automatically — including per-app overrides like dark mode (channel redefines `--pui-*`
  under `html.dark`). No per-host styling needed.
- Standalone (this playground, Storybook, or a non-platform host like L11), the fallbacks render a
  sensible default. There is **no hard dependency** on `platform-ui`.
- All rules are scoped under `.metric-stage` with a local reset, so host CSS can't bleed in and the
  builder's styles can't leak out. Internal `--mb-*` variables alias the `--pui-*` tokens.

## Peer dependencies

`react` and `react-dom` are provided by the host. The `data` adapter uses the platform `fetch` API
and adds no Redux dependency.

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
