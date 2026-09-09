# Contributing to `@ascentcloud/metric-builder`

Thanks for building on the metric builder. This guide covers local setup, the workflow we hold to,
and how to add a new capability without breaking the four host products that depend on this package.

Before writing code, skim these:

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — how the code is structured and where the seams
  are. Start here.
- [`docs/prd-metric-builder.md`](./docs/prd-metric-builder.md) — product vision, host products,
  guiding principles, and the acceptance criteria each roadmap item must meet.
- [`docs/plan-metric-builder-roadmap.md`](./docs/plan-metric-builder-roadmap.md) — the phased plan
  and the resolved design decisions (D1–D15).

## Prerequisites

- **Node 22+** (`.nvmrc` pins `22`; run `nvm use`).
- **pnpm 9+** — this repo is pnpm-only; do not use `npm`/`yarn` (the lockfile and `.npmrc` assume
  pnpm).

## Setup

```bash
nvm use
pnpm install
```

If you need the package to *resolve* its GitHub Packages registry (e.g. installing it as a
dependency elsewhere), set `NODE_AUTH_TOKEN` to a GitHub token with `read:packages`. Local
development in this repo does not need it.

## Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Serves the playground at http://localhost:5173 — real `MetricStage` on a mock provider. |
| `pnpm test` | Vitest in watch mode. |
| `pnpm test:coverage` | Full run with coverage; **100% thresholds are enforced** and will fail the run. |
| `pnpm type:check` | `tsc --noEmit` — no emit, just type errors. |
| `pnpm lint` | ESLint over the repo. |
| `pnpm build` | `tsc -b && vite build` — ESM + `.d.ts` per subpath into `dist/`. |

Run a single file while iterating: `pnpm test src/core/aggregate.test.ts`.

## The playground

`pnpm dev` runs `src/dev/` — the real `MetricStage` wired to a `createMockProvider` over the seeds in
`src/dev/seeds.ts` (a fitness trainer scoring trainees, and sales activity), plus a live definition
JSON view and computed leaderboard. It needs no gateway or auth. It's the fastest way to see a change
end-to-end; add a seed there to exercise a new field type or aggregation by hand.

## Development workflow — TDD is mandatory

This package was built test-first and holds **100% coverage**. Every change — feature, fix, refactor
— follows red → green → refactor:

1. **Read** the relevant existing test and source files, and sketch a test plan.
2. **Red** — write a failing test and run it. Confirm it fails for the right reason.
3. **Green** — write the *minimum* code to pass. Run it.
4. **Refactor** — clean up, then run the **full** suite (`pnpm test:coverage`) and confirm it's
   green with coverage intact.
5. Repeat per behavior — don't batch multiple new behaviors into one cycle.

Never report "tests pass" without the actual terminal output. Tests live colocated with source
(`foo.ts` ↔ `foo.test.ts`); match that convention for anything new.

### House style

- **No explanatory comments in code.** The code and tests should read clearly on their own.
- **`core` stays pure and dependency-free** — no React, no Redux, no `fetch`, no domain (sales/
  fitness/geo) vocabulary. Domain meaning comes from the host's data and labels.
- **Immutable transitions** — definition edits return new objects (`with…` helpers); never mutate.
- **Controlled UI** — React components hold no definition state; the host owns it via `onChange`.
- Prettier and ESLint configs are in the repo; let them format.

## Adding a capability (the vertical-slice recipe)

The roadmap grows the package one **tracer-bullet slice** at a time — a slice cuts through model →
compute → provider (if it needs I/O) → UI, and ships as something a host can actually use. Follow the
existing patterns:

1. **Model** (`src/core/metricDefinition.ts` + `types.ts`) — add the new field to `MetricDefinition`
   *additively* (optional, so old saved definitions still compute). Add a `with…` transition helper
   and any new types. Keep `isMetricComplete` accurate.
2. **Compute** (`src/core/`) — add a new **pure** helper next to `computeSubjectValues`/`aggregate`
   (e.g. `applyFilters`, `bucketByWindow`, `classify`) and test it exhaustively, including the edge
   cases the PRD pins down (null subjects, non-numeric values, empty results). Wire it into the
   compute path so definitions *without* the new field behave exactly as before — add a regression
   test proving that.
3. **Port / I/O** (only if the capability needs data or storage) — extend the `MetricDataProvider`
   contract, or add a **new optional port** in `core` (mirroring the provider pattern). Never add a
   hard dependency on a specific gateway or store — hosts implement the port.
4. **UI** (`src/react/`) — expose new selection callbacks from `useMetricBuilder`, then add
   controlled inputs to `MetricStage` (or a small sibling component with its own tests), gated by
   `FieldType` so sources lacking the relevant fields degrade gracefully.
5. **Export** it from the relevant `index.ts`, and exercise it in `src/dev/` if it's user-visible.

Check your slice against the matching **acceptance criteria** in the PRD before opening a PR — each
roadmap item (R0–R5) has AC-numbered, testable criteria written to line up with this suite.

## Public API surface

The published surface is exactly what the three `index.ts` files re-export:

- `src/core/index.ts` → `@ascentcloud/metric-builder/core`
- `src/data/index.ts` → `@ascentcloud/metric-builder/data`
- `src/react/index.ts` → `@ascentcloud/metric-builder/react`

Adding to these is an API change; treat removals/renames as breaking. `react`/`react-dom` are peer
dependencies supplied by the host — don't promote them to real dependencies.

## Changesets & releasing

Versioning is managed with [Changesets](https://github.com/changesets/changesets).

1. With your change, add a changeset describing it and picking a semver bump:
   ```bash
   pnpm changeset
   ```
   Follow the *backward-compatible model* principle: additive definition fields are usually a
   `minor`; anything that changes existing behavior or the public surface is a careful `major`.
2. Merging to `main` accumulates changesets. `pnpm version` (via `changeset version`) applies them
   and updates the changelog.
3. Publishing is automated: pushing a `v*` tag triggers `.github/workflows/publish.yml`, which
   installs, runs `vitest run --coverage`, builds, and `pnpm release` (`changeset publish`) to GitHub
   Packages. A red coverage run blocks the publish.

## Before you open a PR

- [ ] `pnpm test:coverage` is green with 100% coverage.
- [ ] `pnpm type:check` and `pnpm lint` are clean.
- [ ] `pnpm build` succeeds.
- [ ] New behavior has tests; behavior-preserving claims have a regression test.
- [ ] The change is additive/backward-compatible, or a `major` changeset explains why not.
- [ ] A changeset is included.
- [ ] No comments added to code; no React/Redux/I-O leaked into `core`.
