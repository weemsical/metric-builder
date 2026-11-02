# Implementation Plan — metric-builder roadmap

**Source PRD:** `docs/prd-metric-builder.md`
**Last updated:** 2026-11-02
**Method:** strict TDD (red → green → refactor) per global workflow; **100% coverage enforced**
(`vitest --coverage`). Every phase is a vertical, tracer-bullet slice touching **core → compute →
provider → react**, shippable on its own, additive and backward-compatible.

## L11 parity (decided 2026-11-02)

The package is a pluggable library that must reach **concepts + UX parity** with L11's current metric
builder (`~/Desktop/l11`, `clients/components/shared/metric-builder/metric-builder.jsx`; model
`clients/types/metric.d.ts`), while keeping the **domain-agnostic model** (current names:
`sourceId` / `measure{field,aggregation}` / `subjectField` / `window`+`range` /
`filters[]{field,operator,value}` / `filterLogic`). Do NOT rename to L11's `Metric` shape — it serves
4 products, not just the L11-like one.

- **Fold UX into each phase** — no separate UX slice. When a phase reworks `MetricStage`, relabel/
  reorder the sections it touches to mirror L11's flow + conversational labels ("What type of record
  is this?", "What Date should we use?"). R3 relabels measure/subject/timeframe; R5 adds formula.
- **Add the missing Advanced filter logic control** (`filterLogic` is in the model but has no UI yet)
  during the next `MetricStage` rework (R3).
- **Name stays in the store** — do not add name/description/abbreviation to `MetricDefinition`; naming
  is a `SavedMetric` (R0 store) concern.
- **Excluded** (per PRD): cross-object filters, waterline, points, competitions, integrations.

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

## Resolved decisions (from grill-me)

Locked design decisions that constrain the phases below. IDs are referenced inline in the phase ACs.

**Foundations**
- **D1 — Date model.** One `toEpoch(value)` seam parses ISO 8601 strings / epoch `number` / `Date`
  → epoch ms for all compute. Saved definitions store date operands as **ISO 8601 strings**.
- **D2 — Timezone.** Bucket in **UTC by default**; optional `window.timeZone` (IANA) uses
  `Intl.DateTimeFormat` for zone-correct calendar parts. No new dependency.
- **D3 — Week start.** Default **Sunday** (`weekStartsOn: 0`); optional `window.weekStartsOn` (0–6).

**R1 — Filters**
- **D4 — Coercion & case.** Numeric/date/bool coerce via `Number`/`toEpoch`/`Boolean`; coercion
  failure = filter miss. Text `equals`/`contains` are **case-insensitive**.
- **D5 — filterLogic.** Hand-written recursive-descent parser → AST (no `eval`, no dep). Grammar:
  1-based refs, `AND` (higher precedence), `OR`, parens, **no `NOT`** v1. Comma-in-value = OR
  within that filter. Invalid logic → structured surfaced error, never throws.

**R0 — Persistence**
- **D6 — Store ids.** `createMemoryStore` uses a **monotonic counter** (`m1`…) by default; optional
  injectable `idFactory`.

**R2 — Windows & trends**
- **D7 — Empty buckets.** **Dense** contiguous buckets across the range; empty = **`0`** for
  count/sum, **`null`** for avg/min/max/countDistinct. Range = `range.lastDays` if set, else observed
  min→max.
- **D8 — Range vs window split.** `range` is a **row filter applied in both** `computeSubjectValues`
  and `computeSubjectSeries`; `window` drives **only** the series. Rank/classify (R3) use the single
  **period-total** from `computeSubjectValues`.

**R3 — Targets, pacing, ranking**
- **D11 — Pacing.** Period derived from `window` (granularity + timeZone); host passes an **`asOf`**
  timestamp (no `Date.now` in `core`); `elapsedFraction = (asOf−start)/(end−start)`;
  `excludeWeekends` counts business days. No window ⇒ pacing inert unless target carries a period.

**R5 — Formula / composite**
- **D9 — Components.** **Inline `MetricDefinition[]`**; `computeFormula` pure over already-computed
  component results.
- **D10 — Missing/divide.** **Outer-join**; missing value = `0` for add/subtract/multiply; `divide`
  with missing/zero denominator = **excluded** (no `Infinity`/`NaN`/throw), missing numerator = `0`.

**Deferred out of v1** (revisit when a host needs them)
- **D12** no `version` field (additive-optional evolution). **D13** calendar periods only (no
  fiscal/Triannually). **D14** one measure per metric (multi-measure via R5). **D15** group by raw
  subject value (hosts resolve id→name).

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
- **Id generation (D6).** Default to a monotonic counter (`m1`…); accept an optional injectable
  `idFactory`. Deterministic for tests, trivial coverage.
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
- **Value typing (D4).** Store `value` loosely (PRD/Shepherd use JSON) but coerce per field type at
  compare time; coercion failure = filter miss. Text `equals`/`contains` case-insensitive.
- **Date comparison (D1).** Use the shared `toEpoch()` seam (ISO string / epoch / `Date` → ms);
  definitions store ISO 8601. Same seam serves R2 windowing.
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

### Resolved decisions
- **D2** UTC default, optional IANA `window.timeZone`. **D3** Sunday week-start, optional
  `weekStartsOn`. **D7** dense buckets, type-aware empties (0 count/sum, null others). **D8** `range`
  filters both compute fns; `window` only the series.

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
- **react (L11 UX parity, folded in):** while reworking `MetricStage`, relabel/reorder the sections
  this phase touches toward L11's flow + conversational labels (measure/subject/timeframe), and add
  the **Advanced filter logic** control that binds `filterLogic` (model supports it; no UI yet).
  Mirror L11's `goal-threshold-select`, `scoring-method-select`, `pacing-select` structure. Keep the
  domain-agnostic model — no L11 field renames; name stays in the store.

### Resolved decisions
- **D11** Pacing period = current `window` period (granularity + timeZone); host passes `asOf`
  (`core` stays pure/deterministic); `excludeWeekends` counts business days; no window ⇒ pacing inert
  unless the target carries a period. Rank/classify use the period-total (D8).
- **D11a (verified against L11 `Pace.cls` + `pacing-select.jsx`)** Expected pace formula:
  `expected = goal × elapsedFraction^(1 + paceFactor)`, where `elapsedFraction = daysElapsed/totalDays`
  (business days when `excludeWeekends`). Strategy → paceFactor: `steady = 0`, `rampUp = 1.3`,
  `bigFinish = 5` (so exponents 1 / 2.3 / 6). `expectedPace(goal, elapsedFraction, strategy)` is pure;
  a separate `elapsedFraction(start, end, asOf, excludeWeekends)` helper derives the fraction.

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

### Resolved decisions
- **D9** Components are **inline `MetricDefinition[]`** (self-contained; `computeFormula` pure over
  computed results). **D10** Outer-join; missing = `0` for add/subtract/multiply; `divide` with
  missing/zero denominator = excluded (no `Infinity`/`NaN`), missing numerator = `0`.

### Checkpoint
`computeFormula` covers all four ops, subject alignment, divide-by-zero, and missing subjects; UI
composes a two-component formula; suites green at 100%.

---

## Cross-cutting: still-open (not yet gated by grill-me)

Most design branches are locked in **Resolved decisions** above. These remain genuinely open:
1. **Server vs. client compute** (R1/R2) — Shepherd is client-side (local SQLite) by nature; Arena
   may push filters to the gateway. Keep compute pure and host-agnostic; the `data` adapter decides
   push-down per host. (Not blocking — compute stays pure regardless.)
2. **Next Level ranking semantics** — D-decisions cover score vs. percentToGoal ordering; ties/
   percentiles/period-over-period deltas remain open until Next Level scopes them.

Deferred out of v1 (see D12–D15): definition versioning, fiscal periods, multiple measures per
metric, subject display-name resolution.

## Suggested sequence
R0 → R0.5 → R1 → R2 → R3 → R4 → R5 (dependency- and demand-ordered). R0, R0.5, and R1 are ready to
build now; R2–R5 inherit R1's field-type/operator and date-representation decisions, and R5 composes
all prior phases.
