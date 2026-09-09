# Architecture — `@ascentcloud/metric-builder`

This document explains how the package is put together so a new contributor can find their way
around and extend it safely. For *what* we're building and *why*, read
[`prd-metric-builder.md`](./prd-metric-builder.md); for the phased capability plan, read
[`plan-metric-builder-roadmap.md`](./plan-metric-builder-roadmap.md). This file is about the code
as it exists today.

## The one-sentence mental model

A user picks a **source** (a table of rows), defines a **measure** (an aggregation over a field),
and groups by a **subject** (the entity being measured). The library turns that definition into one
ranked value per subject.

```
MetricDefinition ──▶ computeSubjectValues(rows, definition) ──▶ SubjectValue[]  (sorted desc)
```

Everything else — React UI, gateway adapter, mock provider — exists to feed rows into that pure
function and render its output.

## Three layers, three subpath exports

The package ships as three independent entry points. A host adopts only what it needs. Dependencies
flow **downward only** — `react` and `data` depend on `core`; `core` depends on nothing.

```
┌───────────────────────────────────────────────────────────────┐
│  @ascentcloud/metric-builder/react   (opt-in UI)               │
│  MetricBuilderProvider · useMetricBuilder · MetricStage        │
└───────────────────────────┬───────────────────────────────────┘
                            │ depends on
┌───────────────────────────┴───────────────────────────────────┐
│  @ascentcloud/metric-builder/core   (required)                 │
│  MetricDefinition · computeSubjectValues · aggregate           │
│  MetricDataProvider (port) · createMockProvider · types        │
└───────────────────────────┬───────────────────────────────────┘
                            │ implemented by (optional)
┌───────────────────────────┴───────────────────────────────────┐
│  @ascentcloud/metric-builder/data   (opt-in adapter)           │
│  createGatewayProvider  →  platform gateway over fetch         │
└───────────────────────────────────────────────────────────────┘
```

| Export | Directory | Depends on | Purpose |
| --- | --- | --- | --- |
| `/core` | `src/core/` | nothing | The metric model, pure transforms, types, and the provider port. No React, no Redux, no I/O. |
| `/data` | `src/data/` | `core` | A `MetricDataProvider` implementation that reads from the Ascent Cloud platform gateway via `fetch`. Optional — a host can implement the port itself. |
| `/react` | `src/react/` | `core` | Context provider, the `useMetricBuilder` hook, and the controlled `MetricStage` UI. |

Subpath boundaries are enforced by `package.json` `exports`; keep them clean by never importing
`react`/`data` from `core`.

## The core model (`src/core/`)

### The definition

A `MetricDefinition` is a plain, serializable object. Every field is optional so a partially-built
definition is always valid to hold in state:

```ts
type Aggregation = 'count' | 'sum' | 'avg' | 'min' | 'max';
type Measure = { field?: string; aggregation: Aggregation };
type MetricDefinition = {
  sourceId?: string;
  measure?: Measure;
  subjectField?: string;
};
```

`metricDefinition.ts` provides **immutable transition helpers** — every edit returns a new object,
never mutating the input:

- `emptyMetricDefinition()` — a fresh `{}`.
- `withSource(def, id)` — sets the source. **Selecting a new source resets the rest of the
  definition** (returns `{ sourceId }`), because a measure/subject from a different source is
  meaningless. Re-selecting the same source is a no-op that preserves the object identity.
- `withAggregation(def, agg)` — sets `measure.aggregation`, preserving any existing `measure.field`.
- `withMeasureField(def, field)` — sets `measure.field`, defaulting `aggregation` to `'sum'` if none
  was chosen.
- `withSubjectField(def, subjectField)` — sets the grouping field.
- `isMetricComplete(def)` — `true` only when `sourceId`, `subjectField`, and `measure` are all set
  **and** the measure has a field, *unless* the aggregation is `count` (which needs no field).

Because these are pure and additive, the roadmap can grow `MetricDefinition` (filters, windows,
targets…) without breaking existing saved definitions — see the PRD's backward-compatibility
principle.

### The compute path

Two pure functions do all the work. They are the heart of the package and carry the heaviest test
coverage.

`aggregate(values: number[], aggregation): number` — the reducer. `count` returns length; `sum`/
`avg`/`min`/`max` fold the numbers. Empty arrays return `0` for `avg`/`min`/`max` rather than
throwing or returning `NaN`/`Infinity`.

`computeSubjectValues(rows, definition): SubjectValue[]` — the group-by:

1. Returns `[]` immediately if the definition isn't complete (nothing to compute).
2. Walks each row, reads the subject field, and **skips rows with a null/undefined subject** (they
   are not grouped under an empty key).
3. For `count`, pushes `1` per row. For every other aggregation, coerces `measure.field` with
   `Number(...)` and **skips `NaN`** (non-numeric cells are ignored, not errors).
4. Runs `aggregate` per subject group and returns `SubjectValue[]` **sorted by value descending** —
   this ordering *is* the leaderboard.

These invariants (skip-null-subject, ignore-NaN, empty-returns-empty, stable descending sort) are
contract, not incidental. The edge-case ACs in the PRD (`AC-E.*`) pin them down; don't change them
without updating the tests that assert them.

### The port and mock provider

`MetricDataProvider` is the **seam between the library and any data backend**. It is the only way
`core`/`react` reach data:

```ts
type MetricDataProvider = {
  listSources: () => Promise<MetricSource[]>;
  describeSource: (sourceId: string) => Promise<SourceDescribe>;
  queryData: (definition: MetricDefinition) => Promise<SubjectValue[]>;
};
```

A host supplies an object matching this shape and injects it via `MetricBuilderProvider`. The
library never learns the host's auth, URLs, or storage.

`createMockProvider(seeds)` is the in-memory reference implementation used by tests and the dev
playground. Each seed bundles a `source`, its `describe` (field list), and raw `rows`; `queryData`
just calls `computeSubjectValues` on the matching seed's rows. Unknown source ids throw
`Unknown source: <id>`.

### Types

`types.ts` holds the vocabulary shared across layers: `FieldType` (`text | number | date | bool |
object | geography | unknown` — note `geography` already exists for the planned Shepherd host),
`SourceField`, `MetricSource`, `SourceDescribe`, and `SubjectValue` (`{ subject, value }`).

## The data adapter (`src/data/`)

`createGatewayProvider(config)` implements the port against the Ascent Cloud platform gateway. It is
**parameterized, not hard-wired** — the host injects everything environment-specific:

```ts
type GatewayProviderConfig = {
  baseUrl: string;                          // gateway root
  organizationId: string;
  getAuthHeader?: () => string | undefined; // called per request; returns e.g. "Bearer …"
  fetchImpl?: typeof fetch;                 // override for tests / non-browser hosts
};
```

`requests.ts` is deliberately split out as **pure request builders** (`organizationInstancesRequest`,
`describeRequest`, `dataRequest`, `buildUrl`) so URL/param construction is unit-testable without a
network. The gateway wraps responses in an `{ status, data }` envelope; the provider unwraps `data`.
Non-2xx responses throw `Gateway request failed: <status>`.

Note that `queryData` here **fetches raw rows and runs `computeSubjectValues` client-side** — the
same pure function the mock uses. This is intentional: aggregation logic lives in one place, and
(per the PRD) client-side compute must keep working for offline-first hosts like Shepherd that read
from a local replica instead of this gateway.

## The React layer (`src/react/`)

The UI is **stateless and fully controlled**. The host owns the `MetricDefinition` and passes it
down with an `onChange` callback; the library never stores definition state.

- **`MetricBuilderProvider`** — a thin context provider. Put a `MetricDataProvider` in; everything
  below can reach it. That's its whole job.
- **`metricBuilderContext.ts`** — the context object plus `useMetricDataProvider()`, which throws a
  clear error if used outside the provider.
- **`useMetricBuilder(definition, onChange)`** — the brain. It:
  - loads sources on mount and tracks `sourcesLoading`/`sourcesError`;
  - describes the selected source when `sourceId` changes, tracking `fieldsLoading`/`fieldsError`
    (derived by comparing the last-described source id against the current one, so stale describes
    don't leak);
  - returns `selectSource/selectAggregation/selectField/selectSubject` callbacks that wrap the pure
    `with…` helpers and hand the next definition to `onChange`.
- **`MetricStage`** — the visible UI: Source → Aggregation → Field → Subject selects. It hides the
  Field select when the aggregation is `count`, shows loading/error hints, and renders an alert if
  sources fail to load. It renders `useMetricBuilder`'s state and calls its callbacks; it holds no
  state of its own.

### Data flow, end to end

```
host state ──definition──▶ MetricStage ──uses──▶ useMetricBuilder ──▶ MetricDataProvider
    ▲                          │                        │                     │
    │                          │ onChange(next)         │ listSources/         │
    └──────────setState────────┘   via with…()          │ describeSource       │
                                                        ▼                     ▼
                                          controlled selects            source/field lists

host separately calls provider.queryData(definition) ──▶ computeSubjectValues ──▶ leaderboard
```

`src/dev/App.tsx` is the smallest real example of this wiring: it holds the definition in
`useState`, renders `MetricStage`, and calls `provider.queryData` to show a live leaderboard.

## Where things extend (roadmap seams)

The roadmap (R0–R5) grows this skeleton. Each capability is a **vertical slice** through the same
layers, and the seams already exist:

- **New definition fields** (filters, windows, targets…) → extend `MetricDefinition` additively in
  `metricDefinition.ts`, add a `with…` helper, keep `isMetricComplete` honest.
- **New compute behavior** → new pure helpers alongside `computeSubjectValues`/`aggregate`
  (`applyFilters`, `bucketByWindow`, `classify`), each fully tested before any UI.
- **New I/O** (e.g. saving named metrics) → a new optional port in `core`, mirroring
  `MetricDataProvider`, never a hard dependency on a specific backend.
- **New UI** → additional controlled inputs in `MetricStage` (or small sibling components), gated by
  `FieldType`, still driven by `onChange`.

The guiding constraints — domain-agnostic core, host owns state, ports over coupling, additive/
backward-compatible model, pure tested transforms — are spelled out in the PRD's *Guiding
principles* and should be treated as non-negotiable when adding to any layer.

## File map

```
src/
  core/                      framework-agnostic model + transforms (no React/Redux/I-O)
    types.ts                 FieldType, SourceField, MetricSource, SourceDescribe, SubjectValue
    metricDefinition.ts      MetricDefinition, Measure, Aggregation, with… helpers, isMetricComplete
    aggregate.ts             pure reducer over number[]
    computeSubjectValues.ts  pure group-by-subject + aggregate + sort
    provider.ts              MetricDataProvider port (the data seam)
    mockProvider.ts          createMockProvider — in-memory port impl for tests/playground
    packageInfo.ts           trivial package identity helper
    index.ts                 the /core public surface
  data/                      platform-gateway adapter (optional)
    requests.ts              pure request/URL builders
    gatewayProvider.ts       createGatewayProvider (fetch → gateway → computeSubjectValues)
    index.ts                 the /data public surface
  react/                     controlled UI (optional)
    metricBuilderContext.ts  context + useMetricDataProvider guard
    MetricBuilderProvider.tsx provider component
    useMetricBuilder.ts      loads sources/fields, exposes selection callbacks
    MetricStage.tsx          the source→aggregation→field→subject UI
    MetricStage.css          scoped styles
    index.ts                 the /react public surface
  dev/                       local playground (not published)
    seeds.ts                 two demo sources (gym sessions, sales activity)
    App.tsx / main.tsx       MetricStage wired to a mock provider + live leaderboard
```

Every `*.ts`/`*.tsx` above has a colocated `*.test.ts(x)`; coverage thresholds are enforced at 100%.
See [`CONTRIBUTING.md`](../CONTRIBUTING.md) for the development workflow.
