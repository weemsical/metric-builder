# Implementation Plan — metric-builder roadmap

**Source PRD:** `docs/prd-metric-builder.md`
**Last updated:** 2026-08-31
**Method:** strict TDD (red → green → refactor) per global workflow; **100% coverage enforced**
(`vitest --coverage`). Every phase is a vertical, tracer-bullet slice touching **core → compute →
provider → react**, shippable on its own, additive and backward-compatible.

## Conventions for every phase

- **Red first.** Write a failing test, run it, capture the RED output before writing code.
- **Minimum green.** Smallest code to pass; run and capture GREEN.
- **Refactor.** Run the full suite after each change; keep coverage at 100%.
- **Backward compatibility gate.** Existing `computeSubjectValues`, `isMetricComplete`, and
  `MetricStage` behavior must not change for definitions that omit the new fields. Each phase adds a
  regression test asserting "empty new-field == today's result."
- **Checkpoint.** A phase is done only when the full suite passes with 100% coverage and the dev
  playground (`src/dev`) exercises the new capability against `createMockProvider`.

Decisions locked in discovery:
- **R2 uses a separate `computeSubjectSeries` function** — `computeSubjectValues` keeps its
  one-value-per-subject contract untouched.

---

# Phase R0 — Persistence port (deep)

**Goal:** an optional way for hosts to save, load, list, and remove named metric definitions,
without the library owning storage. Unblocks "named metrics" in every product.

### User stories
- **US-R0.1** As a host developer, I want a `MetricStore` port so I can persist metric definitions
  in my product's own backend.
- **US-R0.2** As a host developer, I want a `createMemoryStore()` reference implementation so tests
  and the playground can save/load without a backend.
- **US-R0.3** As a manager (via host UI), I want to save a metric under a name and reload it later.

### Acceptance criteria (from PRD AC-0.4/0.5/0.6)
- `MetricStore` port: `save(name, definition) → Promise<id>`, `load(id) → Promise<{ name,
  definition }>`, `list() → Promise<Array<{ id, name }>>`, `remove(id) → Promise<void>`.
- The port is **not** required to build/compute a metric; no `core` transform imports it.
- `createMemoryStore()` implements the port in-memory; ids are stable within a store instance.
- `load` of an unknown id rejects (documented error); `list` returns `[]` when empty.

### Layers & files
- **core (new):** `src/core/store.ts` (`MetricStore`, `SavedMetric` types), `createMemoryStore`.
- **core:** `src/core/store.test.ts`; export from `src/core/index.ts`.
- **react (optional, thin):** `src/react/useSavedMetrics.ts` — hook wrapping a provided store
  (`save/load/list/remove` + loading/error state), context-injected like the data provider. Plus
  `useSavedMetrics.test.tsx`. (UI to *name/pick* a saved metric can stay host-side; the hook is the
  seam.)
- **dev:** wire a `createMemoryStore()` into `src/dev/App.tsx` to save/reload the current definition.

### TDD cycles (each its own red→green→refactor)
1. `createMemoryStore().save` returns an id and `load(id)` round-trips name+definition.
2. `list()` returns `[]` empty, then the saved `{id,name}` after a save.
3. `remove(id)` deletes; subsequent `load` rejects; `list` omits it.
4. `load(unknownId)` rejects with a clear error.
5. Two saves produce distinct ids; ids are stable across `list`/`load`.
6. `useSavedMetrics` exposes `save/load/list/remove` and reflects loading/error state (component test
   with a memory store).

### Checkpoint
Full suite green at 100% coverage; playground can save a metric, reload it, and list saved metrics.

### Risks / notes
- **Id generation must be deterministic-friendly for tests** (no `Math.random`/`Date.now` in
  scripts is a *workflow* constraint, not a runtime one — but prefer an injectable id factory or a
  monotonic counter so tests stay deterministic and coverage is trivial).
- Keep `MetricStore` free of auth/RBAC — that is host territory (Shepherd scopes via sync rules).

---

# Phase R0.5 — Count Distinct (small, from L11)

**Goal:** add `countDistinct` to the aggregation set. Tiny baseline slice; can run alongside R0/R1.

### Acceptance criteria (PRD AC-0.7/0.8)
- `Aggregation` gains `countDistinct`; `aggregate(values, 'countDistinct')` returns the count of
  distinct values. `count`/`sum`/`avg`/`min`/`max` unchanged (regression).
- `computeSubjectValues` counts distinct non-null values of `measure.field` per subject; option
  appears in `MetricStage`. `isMetricComplete` requires a field for `countDistinct`.

### Layers & files
- **core:** `aggregate.ts` (+ test) — new branch; `metricDefinition.ts` — `countDistinct` in the
  `Aggregation` union and `isMetricComplete` field check; `index.ts` unchanged export surface.
- **react:** add the option to the `AGGREGATIONS` list in `MetricStage.tsx` (+ test).

### TDD cycles
1. `aggregate([1,1,2], 'countDistinct')` → `2`; empty → `0`.
2. `isMetricComplete` false for `countDistinct` without a field, true with one.
3. `computeSubjectValues` counts distinct field values per subject; `count` regression still passes.
4. `MetricStage` renders and selects the Count Distinct option.

### Checkpoint
Full suite green at 100%; playground shows a distinct-count metric (e.g. distinct trainees per
trainer).

---

# Phase R1 — Filters / criteria (deep)

**Goal:** restrict rows before aggregating, with AND semantics, operators gated by field type.
Highest cross-product demand; foundational for meaningful metrics. Shape mirrors Shepherd's existing
`filters` table (`{ field, operator, value }`) for zero-translation interop.

### User stories
- **US-R1.1** As a trainer, I want to include only rows matching criteria (e.g. `sessionType =
  strength`, `completed = true`, `date` in range) so the metric measures the right subset.
- **US-R1.2** As a manager, I want to combine multiple criteria with AND to narrow the population.
- **US-R1.3** As a user, I only want to see operators that make sense for the chosen field's type.

### Acceptance criteria (from PRD AC-1.1–1.4)
- `MetricDefinition` gains optional `filters?: Filter[]`, `Filter = { field, operator, value }`.
  Absent/empty `filters` computes identically to today (regression test).
- Operators cover `FieldType`: equality/inequality (all types), numeric/`date` comparison
  (`gt/gte/lt/lte`), `contains` (`text`), `isTrue`/`isFalse` (`bool`), `isNull`/`isNotNull` (all).
- `computeSubjectValues` applies all filters with **AND** before grouping; a row failing any filter
  is excluded.
- The builder only offers operators valid for the selected field's `FieldType`.
- **(from L11)** A filter `value` may be comma-separated, evaluated as **OR** for that filter.
- **(from L11)** Optional `filterLogic` string (`"1 AND (2 OR 3)"`, 1-based) overrides all-AND;
  absent → AND. `evaluateFilterLogic` is pure; invalid logic is a surfaced validation error, not a
  crash. Cross-object/relationship filters are out of scope (Salesforce-specific).

### Layers & files
- **core (types):** `src/core/types.ts` — add `FilterOperator`, `Filter`; a
  `operatorsForFieldType(type): FilterOperator[]` helper (pure, drives UI + validation).
- **core (compute):** `src/core/applyFilters.ts` + `applyFilters.test.ts` — pure
  `applyFilters(rows, filters): rows`. Integrate into `computeSubjectValues.ts` (filter → group →
  aggregate).
- **core (model):** `src/core/metricDefinition.ts` — `withFilter`, `updateFilter`, `removeFilter`
  immutable helpers; keep `isMetricComplete` unchanged (filters are optional).
- **core:** export new types/helpers from `src/core/index.ts`.
- **react (hook):** `src/react/useMetricBuilder.ts` — expose `filters`, `addFilter`,
  `changeFilter`, `removeFilter`, and `operatorsFor(field)` derived from described fields.
- **react (UI):** new `src/react/FilterRow.tsx` (+ test) and render a list of filter rows in
  `MetricStage.tsx`; field select → operator select (type-gated) → value input (typed by field).
- **dev/seeds:** add a `bool`/`date`/`text` field to a seed so filters are demonstrable.

### TDD cycles
1. `operatorsForFieldType('number')` includes comparison ops; `'text'` includes `contains`; `'bool'`
   includes `isTrue/isFalse`; all include equality + null checks.
2. `applyFilters(rows, [])` returns rows unchanged (regression anchor).
3. `applyFilters` equality filter keeps only matching rows.
4. Numeric `gte` filter; `text` `contains`; `bool` `isTrue`; `isNull`/`isNotNull` each a cycle.
5. Multiple filters AND together (row must pass all).
6. `computeSubjectValues` with a filter excludes failing rows before aggregating; without filters,
   identical to pre-R1 result (backward-compat regression).
7. `withFilter`/`changeFilter`/`removeFilter` produce new immutable definitions.
8. `MetricStage` renders a filter row, offers only type-valid operators, and calls `onChange` with
   the composed filter (component test).
9. (L11) Comma-separated `value` matches any listed value (OR-within-filter).
10. (L11) `evaluateFilterLogic([...], "1 AND (2 OR 3)")` returns the correct boolean; malformed logic
    returns a validation error, not a throw; absent logic defaults to AND (regression).

### Checkpoint
Full suite green at 100% coverage; playground filters the gym seed (e.g. only `minutes >= 30`) and
the ranked results reflect the filter.

### Risks / notes
- **Value typing.** Store `value` loosely (PRD/Shepherd use JSON) but coerce per field type at
  compare time (reuse the `Number(...)`/`Boolean` discipline already in `computeSubjectValues`).
- **Date comparison** needs a defined representation (ISO string vs epoch). Decide here and reuse in
  R2 windowing — keep them consistent.
- Operator gating lives in **one** pure helper so UI and compute can't drift.

---

# Phase R2 — Time windows & trends (sketch)

**Goal:** the "ongoing performance" story — per-subject series bucketed by
`daily/weekly/monthly/quarterly/annually`, plus an optional rolling range. **New function; does not
alter `computeSubjectValues`.**

### Key ACs (PRD AC-2.1–2.4)
- `MetricDefinition` gains optional `window?: { field, granularity }` (`field` is a `date` field)
  and `range?: { field, lastDays }`.
- **`computeSubjectSeries(rows, definition)`** returns `Array<{ subject, points: [{ bucket, value
  }] }>`; `computeSubjectValues` is untouched.
- Rolling `range` excludes rows outside the window before grouping.
- Bucketing is deterministic and **timezone-explicit** (see decision below), tested at week/month
  boundaries.

### Layers & files (sketch)
- **core:** `bucketByWindow.ts` (+ test) pure bucketer; `computeSubjectSeries.ts` (+ test);
  `Window`, `Granularity`, `Range` in `types.ts`; `withWindow`/`withRange` helpers; exports.
- **react:** `WindowControls.tsx` (date-field select + granularity select + optional lastDays);
  `useMetricBuilder` exposes window/range selectors and the list of `date` fields; `MetricStage`
  renders controls; a host renders the series (no chart in this package).
- **dev:** seed rows with dates spanning weeks/months to show a trend.

### Open decision (resolve at phase start)
- **Timezone anchor** for bucket boundaries: org / viewer / UTC. Recommend **UTC** with a documented
  option, so buckets are deterministic and tests are stable. (PRD open question #2.)

### Checkpoint
Series function tested at boundaries; playground shows per-subject weekly buckets; `computeSubjectValues`
regression still green.

---

# Phase R3 — Targets & thresholds (sketch)

**Goal:** attainment vs. goal and RAG status per subject. Builds on R2 (can classify a series point
or a single value).

### Key ACs (PRD AC-3.1–3.6)
- `MetricDefinition` gains optional `target?: { value | { min, max }, direction }` and
  `thresholds?: { amber, green }`.
- Pure `classify(value, target, thresholds)` → `{ attainment, status: red|amber|green }`, respecting
  `direction` and range targets; no target → no status.
- **(from L11)** Optional `pacing?: { strategy, excludeWeekends }` (`steady|rampUp|bigFinish`); pure
  `expectedPace(target, elapsedFraction, strategy)` returns the expected value at a point in the
  period. No pacing → no expected value.
- **(from L11)** Optional `rankMethod?: 'score' | 'percentToGoal'`; a pure `rankSubjects(results,
  rankMethod, target)` orders subjects for leaderboard display; default `score` preserves today's
  descending order (Next Level's core need).

### Layers & files (sketch)
- **core:** `classify.ts`, `expectedPace.ts`, `rankSubjects.ts` (+ tests); `Target` (value or
  `{min,max}`), `Thresholds`, `Direction`, `RagStatus`, `PacingStrategy`, `RankMethod` in
  `types.ts`; `withTarget`/`withThresholds`/`withPacing`/`withRankMethod`; exports. Keep each helper
  standalone and pure; map over `computeSubjectValues`/`computeSubjectSeries` output.
- **react:** `TargetInput.tsx`, `PacingSelect.tsx` (+ tests); `useMetricBuilder` selectors;
  `MetricStage` shows target/range + thresholds + pacing + rank method; hosts render RAG chips and
  the ranked leaderboard.

### Open decisions (resolve at phase start)
- **Pacing period boundary** — derive elapsed fraction from R2's `window`, or configure a period on
  the target independently? (PRD open question #10.)

### Checkpoint
`classify` covers higher/lower-is-better, range targets, all three statuses, no-target;
`expectedPace` covers all three strategies; `rankSubjects` covers score vs. percentToGoal; UI
round-trips; suites green.

---

# Phase R4 — Geography / mapping (sketch)

**Goal:** unblock Shepherd — metrics over `geography`/location fields, with optional coordinates on
results for host maps. No mapping library ships in this package.

### Key ACs (PRD AC-4.1–4.3)
- Builder allows selecting a `geography` field as subject/dimension where meaningful.
- `SubjectValue` may carry `coordinates?: { lat, lng }`; non-geo metrics never populate it.
- Aggregations invalid for geography (e.g. `sum` of coordinates) are not offered.

### Grounded in Shepherd's real schema
- `records` already expose flat `latitude Float?` / `longitude Float?` (+ address parts,
  `custom_fields Json`) — so `coordinates: { lat, lng }` maps **directly**; no parsing needed for the
  point case.
- `polygons.geometry` is GeoJSON in a `Json` column — polygon-as-subject/dimension is the open part
  (PRD open question #4).

### Layers & files (sketch)
- **core:** add optional `coordinates` to `SubjectValue` in `types.ts`; extend
  `computeSubjectValues` to pass through coordinates when the subject/source provides lat/lng;
  restrict aggregation options for `geography` (reuse the R1 operator-gating pattern).
- **provider:** document that Shepherd's PowerSync-backed provider (in the Shepherd repo, querying
  **local SQLite**) supplies rows with lat/lng; `createMockProvider` seeds gain coordinates for
  tests.
- **react:** aggregation/subject selects respect geography constraints; `MetricStage` degrades
  gracefully when no geography field exists.

### Migration note (Shepherd)
- After R4, plan migrating Shepherd's legacy per-layer metric (old `(layer_id, metric)` concept)
  into a stored `MetricDefinition`, so a layer carries a richer filtered/windowed metric. Tracked
  separately from this package's work.

### Checkpoint
Geo metric returns coordinates; invalid aggregations are absent; non-geo metrics unaffected; suites
green.

---

# Phase R5 — Formula / composite metrics (sketch, from L11)

**Goal:** define a metric as an arithmetic combination of other metrics (L11's formula KPIs). Reuses
R0–R4 — each component is an ordinary `MetricDefinition`. Sequenced last because it composes the
prior phases.

### Key ACs (PRD AC-5.1–5.4)
- `MetricDefinition` gains optional `formula?: { op, components: MetricDefinition[] }`,
  `op = add | subtract | multiply | divide`.
- Pure `computeFormula(componentResults, op)` combines per-subject values across components on
  matching subject keys; missing-subject rule documented; `divide`-by-zero → no value for that
  subject (no `Infinity`/throw).
- Components are independently computable; nesting beyond one level is out of scope for v1.
- `isMetricComplete` true only when every component is complete and an `op` is set.

### Layers & files (sketch)
- **core:** `computeFormula.ts` (+ test); `Formula`, `FormulaOp` in `types.ts`; `withFormula`,
  `withComponent`/`removeComponent` helpers; extend `isMetricComplete`; exports. Keep `computeFormula`
  pure — it takes already-computed component results, so the provider computes each component then the
  library combines.
- **react:** `FormulaBuilder.tsx` (+ test) — pick components (each via a nested `MetricStage` or a
  saved-metric picker from R0) and an operation; `MetricStage` branches into formula mode.
- **dev:** seed a formula (e.g. `sum(reps) / countDistinct(session)` = reps per session) to demo.

### Open decisions (resolve at phase start)
- **Component sourcing** — inline `MetricDefinition`s vs. references to R0 saved metrics (by id).
  References keep formulas small but couple to the store; inline is self-contained. (PRD open
  question #9.)
- **Missing-subject semantics** per `op` (exclude vs. treat as 0) — lock and test explicitly.

### Checkpoint
`computeFormula` covers all four ops, subject alignment, divide-by-zero, and missing subjects; UI
composes a two-component formula; suites green at 100%.

---

## Cross-cutting: decisions to resolve as phases start

Carried from the PRD open questions; each is a small gate, not a blocker for the whole plan:
1. **Server vs. client compute** (R1/R2) — Shepherd is client-side (local SQLite) by nature; Arena
   may push filters to the gateway. Keep compute pure and host-agnostic; the `data` adapter decides
   push-down per host.
2. **Timezone anchor** (R2) — decide before `bucketByWindow`.
3. **Next Level ranking semantics** — beyond descending sort (ties/percentiles/deltas)?
4. **Definition versioning** — add `version` to `MetricDefinition` if additive-optional evolution
   proves insufficient; revisit before R4.
5. **Multiple measures per metric** — one measure per metric assumed through R4.
6. **Subject identity vs. label** — grouping stays on raw field value; display-name resolution is
   host-side unless a phase proves otherwise.

## Suggested sequence
R0 → R0.5 → R1 → R2 → R3 → R4 → R5 (dependency- and demand-ordered). R0, R0.5, and R1 are ready to
build now; R2–R5 inherit R1's field-type/operator and date-representation decisions, and R5 composes
all prior phases.
