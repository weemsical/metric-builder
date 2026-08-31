# PRD — `@ascentcloud/metric-builder`

**Status:** North-star vision & roadmap (living reference)
**Last updated:** 2026-08-31
**Owner:** matt

> This document is the shared reference for the metric-builder package across Ascent Cloud
> products. It captures the product vision, the host products it must serve, the current
> state of the library, and the capability roadmap. It is intended to be re-read at the start
> of future working sessions before making changes.

---

## Overview

`@ascentcloud/metric-builder` is a domain-agnostic, framework-light library for **defining and
computing metrics over arbitrary tabular data**. A user picks a data **source**, defines a
**measure** (an aggregation over a field), and groups the result by a **subject** (the person or
entity being measured). The library is deliberately *not* sales-specific: the subject can be a
sales rep, a trainee, a field technician, a store, a vehicle — anyone or anything.

The package is shared across four host products (one live, three planned) and must stay decoupled
from any single host's store, auth, gateway, or domain vocabulary. It ships as three subpath
exports so hosts adopt only what they need:

- `@ascentcloud/metric-builder/core` — framework-agnostic model, pure transforms, types, and the
  `MetricDataProvider` port. No React, no Redux.
- `@ascentcloud/metric-builder/data` — platform-gateway data adapter (RTK Query), parameterized by
  an injected base URL and auth headers. Optional.
- `@ascentcloud/metric-builder/react` — `MetricBuilderProvider`, `useMetricBuilder`, and the
  `MetricStage` UI. Host supplies org id and a provider.

Why it matters: every Ascent Cloud product needs "let a manager measure their people/entities over
time" without each product re-implementing aggregation, field discovery, and the builder UI. One
tested, host-agnostic package keeps that logic consistent and cheap to adopt in new products.

---

## Host products

The library must serve all of the following from a single shared model. Product-specific behavior
lives in the *host* (via the provider port and host UI), not in the package.

| Product | Status | Subject example | Distinctive need |
| --- | --- | --- | --- |
| **Arena** | Live | Sales rep | Sales activity metrics; the original consumer |
| **Next Level** (L11-like) | Planned | Any competitor | L11 **without coaching or competitions**. Ranked comparison of subjects; trends over time |
| **Coaching** | Planned | Trainee / employee | Ongoing performance tracking; targets & thresholds per subject |
| **Shepherd** (geopointe-like) | Planned | Location / field entity (record, assignee, layer) | Location-based metrics; `geography` field type; map output. **Offline-first**: repos `ascentcloud/shepherd-api` (write side → Postgres via Prisma) + `ascentcloud/shepherd-powersync` (read side; clients stream a local SQLite replica over PowerSync). Auth0 JWT; reached via ascent-gateway at `/shepherd-api`. |

**Canonical non-sales example (drives design):** a physical trainer (the *manager*) builds a
metric to measure each trainee's *ongoing workout performance* — e.g. "average reps per session,
per trainee, this month, against a target of 100." This single example exercises subject grouping,
non-sales sources, time windows, and targets.

**Replacing Shepherd's existing metric concept.** Shepherd today has a rudimentary per-layer metric
(the schema history shows an old `(layer_id, metric)` primary key — "one metric per layer"). The
intent is for **this package to become Shepherd's metric builder**, replacing that ad-hoc concept.
When R4 lands, plan a migration of Shepherd's per-layer metric into a `MetricDefinition` so a layer
can carry richer, multi-aggregation, filtered, windowed metrics rather than a single stored value.

---

## Current state (baseline — already built)

The package already implements the core loop end-to-end. The PRD roadmap builds on this; it does
not replace it.

**Model (`core`)**
- `MetricDefinition = { sourceId?, measure?, subjectField? }`
- `Measure = { field?, aggregation }` where `Aggregation = count | sum | avg | min | max`
- Immutable transition helpers: `withSource`, `withAggregation`, `withMeasureField`,
  `withSubjectField`; `isMetricComplete`, `emptyMetricDefinition`.
- `SourceField.type: FieldType = text | number | date | bool | object | geography | unknown`
  (note `geography` already exists in the type union).
- `computeSubjectValues(rows, definition)` — pure client-side group-by-subject + aggregate, sorted
  descending. `aggregate(values, aggregation)` — the pure reducer.

**Ports & adapters**
- `MetricDataProvider` port: `listSources()`, `describeSource(sourceId)`, `queryData(definition)`.
- `createMockProvider(seeds)` — in-memory provider (used by the dev playground and tests).
- `gatewayProvider` (`data`) — RTK Query adapter over the platform gateway.

**UI (`react`)**
- `MetricBuilderProvider` + `useMetricDataProvider` context.
- `useMetricBuilder(definition, onChange)` — loads sources, describes the selected source, exposes
  loading/error state and selection callbacks.
- `MetricStage` — stateless controlled UI (source → aggregation → field → subject selects) with
  loading/error affordances. Definition state is owned by the host (`onChange`).

**Quality bar (established, must be maintained)**
- Strict TDD; Vitest with **100% coverage thresholds enforced**.
- Published to GitHub Packages; ESM + `.d.ts` per subpath; React/Redux are peer deps.

---

## Prior art — L11 (LevelEleven) alignment

L11's Scorecard/KPI builder (`ascentcloud/l11`, `Metric__c`) is the most mature metric builder in the
portfolio and is the conceptual ancestor of Next Level. Its model maps onto ours and validated
several design choices; it also surfaced capabilities we are adopting.

**Confirms our model.** L11 = `objectName` (source) + `aggregateField`/`aggregationType` (measure) +
`userField` (subject). Its filter shape `{ field, comparator, value }` matches both our R1 design
and Shepherd's `filters` table — three independent sources agree.

**Adopted from L11 (folded into this PRD):**
- **Count Distinct** aggregation, in addition to count/sum/avg/min/max. (See baseline model change
  below.)
- **First-class date field.** L11 separates `userField` (subject) from `dateField` (the date used
  for period filtering). We promote an optional `dateField` to a first-class part of the model; R2
  windowing and R1 date filters both consume it.
- **Advanced filter logic** (R1): OR-grouping like `"1 AND (2 OR 3)"` and comma-as-OR, beyond plain
  AND.
- **Richer goals** (R3): min/max goal range, `targetIsMinimum` (= our `direction`), **pacing**
  (steady / ramp-up / big-finish), and leaderboard **rank method** (score vs. percentage).
- **Formula / composite metrics** (new **R5**): a metric defined as Add/Subtract/Multiply/Divide
  over other metrics.

**Baseline model change (Count Distinct).** `Aggregation` becomes
`count | countDistinct | sum | avg | min | max`; `countDistinct` requires a `measure.field` (the
field whose distinct values are counted) and `isMetricComplete` treats it like the other
field-requiring aggregations.

**Deliberately NOT adopted** (Next Level = L11 *without coaching or competitions*): waterline/ranking
metrics as a distinct type, points/`pointMultiplier` gamification, and competition metrics. L11's
cross-object relationship filters are Salesforce-specific and are **out of scope** for the non-SF
hosts (Shepherd/Next Level/Coaching); the advanced filter logic we adopt operates on a single
source's fields.

> Note: `ascentcloud/platform-levelup` + `levelup-api` are the non-Salesforce React rewrite of L11
> and are the closest UI/architecture reference for Next Level. This PRD models on `l11`
> (richest model); the `platform-levelup` builder UX can be mined when we build the R-phase UIs.

---

## Guiding principles

1. **Domain-agnostic core.** No sales (or fitness, or geo) vocabulary in `core`. Domain meaning is
   supplied by the host's data and labels.
2. **Host owns state & persistence.** The library stays stateless and controlled; hosts decide how
   definitions are stored, loaded, and secured. (See Persistence below.)
3. **Ports over coupling.** New capabilities that need I/O extend the `MetricDataProvider` port (or
   add a new optional port), never a hard dependency on a specific gateway/store.
4. **Any input type.** The builder adapts its options to `FieldType`; adding a capability must
   degrade gracefully for sources that lack the relevant fields.
5. **Backward compatible model.** `MetricDefinition` evolves additively; existing saved definitions
   must keep computing. New fields are optional.
6. **Pure, tested transforms.** Every compute path has a pure function with exhaustive tests before
   any UI is wired.

---

## User stories

### Existing (baseline)
- **US-0.1** As a manager, I want to pick a data source, an aggregation, a measured field, and a
  subject, so that I get one value per subject ranked highest-to-lowest.
- **US-0.2** As a host developer, I want to supply my own data provider, so that the builder works
  against my product's gateway without the library knowing my auth or URLs.

### Filters / criteria (Roadmap R1)
- **US-1.1** As a trainer, I want to include only rows that match criteria (e.g. `sessionType =
  strength`, `completed = true`, date in range), so that the metric measures the right subset.
- **US-1.2** As a manager, I want to combine multiple criteria with AND, so that I can narrow to
  exactly the population I care about.

### Time windows & trends (Roadmap R2)
- **US-2.1** As a coach, I want to measure ongoing performance bucketed by week or month, so that I
  see a trend per subject rather than a single lifetime number.
- **US-2.2** As a manager, I want to constrain a metric to a rolling window (e.g. last 30 days), so
  that stale data doesn't distort current performance.

### Targets & thresholds (Roadmap R3)
- **US-3.1** As a coach, I want to set a target value for a metric, so that each subject shows
  attainment against goal.
- **US-3.2** As a manager, I want red/amber/green thresholds, so that I can see at a glance who is
  on/off track.

### Geography / mapping (Roadmap R4)
- **US-4.1** As a field-ops manager, I want to define a metric over a `geography` field, so that
  subjects can be measured and located.
- **US-4.2** As a host, I want subject values to optionally carry coordinates, so that my map UI can
  plot them without a second query.

### Persistence (Roadmap R0, cross-cutting)
- **US-5.1** As a host developer, I want an optional persistence port to save, load, and list metric
  definitions, so that managers can name and reuse metrics without every product reinventing storage.

---

## Acceptance criteria

Criteria are written to be testable as pure-function or component tests, consistent with the
existing suite. Each roadmap item is additive and must not break `computeSubjectValues` for
definitions that omit its new fields.

### Baseline (already met — regression guardrails)
- **AC-0.1** Given a complete definition, `computeSubjectValues` returns one `SubjectValue` per
  distinct non-null subject, aggregated per `aggregation`, sorted by value descending.
- **AC-0.2** `count` requires no field; all other aggregations (incl. `countDistinct`) require
  `measure.field`. `isMetricComplete` reflects this.
- **AC-0.3** `MetricStage` renders source → aggregation → field → subject, hides the field select
  for `count`, and surfaces source/field loading and error states.

### R0.5 — Count Distinct (baseline enhancement, from L11)
- **AC-0.7** `Aggregation` gains `countDistinct`; `aggregate(values, 'countDistinct')` returns the
  number of distinct values. `count` behavior is unchanged (regression test).
- **AC-0.8** In `computeSubjectValues`, `countDistinct` counts distinct non-null values of
  `measure.field` per subject; the aggregation option appears in `MetricStage`.

### R0 — Persistence port
- **AC-0.4** `core` exports an optional `MetricStore` port: `save(name, definition) → id`,
  `load(id) → { name, definition }`, `list() → Array<{ id, name }>`, `remove(id)`.
- **AC-0.5** The port is **not** required to use the builder; hosts that don't need saved metrics
  ignore it. No `core` transform depends on it.
- **AC-0.6** A `createMemoryStore()` reference implementation exists for tests/playground.

### R1 — Filters / criteria
- **AC-1.1** `MetricDefinition` gains optional `filters: Filter[]` where
  `Filter = { field, operator, value }`. Absent/empty `filters` computes identically to today. (This
  intentionally mirrors Shepherd's existing `filters` table shape — `{ field, operator, value }` —
  so Shepherd layer filters can be expressed as metric filters without a translation layer.)
- **AC-1.2** Operators cover the field types in `FieldType`: equality/inequality (all), numeric
  comparison (`number`/`date`), `contains` (`text`), boolean is-true/is-false, and null/not-null.
- **AC-1.3** `computeSubjectValues` applies all filters with AND semantics before grouping; a row
  failing any filter is excluded.
- **AC-1.4** The builder only offers operators valid for the chosen field's `FieldType`.
- **AC-1.5** (from L11) A filter's `value` may be a comma-separated list, treated as **OR** for that
  filter (e.g. `stage in [won, closed]`).
- **AC-1.6** (from L11) `MetricDefinition` may carry optional `filterLogic: string` expressing
  boolean combination by 1-based filter index (e.g. `"1 AND (2 OR 3)"`); absent `filterLogic`
  defaults to all-AND (AC-1.3 unchanged). A pure `evaluateFilterLogic(results, logic)` parses and
  evaluates the expression; invalid logic is a validation error surfaced by the builder, never a
  crash. Cross-object/relationship filters (Salesforce-specific) are **out of scope**.

### R2 — Time windows & trends
- **AC-2.1** `MetricDefinition` gains optional `window: { field, granularity }` where
  `granularity = daily | weekly | monthly | quarterly | annually` and `field` is a `date` field.
- **AC-2.2** With a window set, compute returns a series per subject: `{ subject, points:
  [{ bucket, value }] }`; without a window, the current single-value shape is unchanged.
- **AC-2.3** An optional rolling range (`{ field, lastDays }`) excludes rows outside the range
  before grouping.
- **AC-2.4** Bucketing is deterministic and timezone-explicit (documented), with tests at
  week/month boundaries.

### R3 — Targets & thresholds
- **AC-3.1** `MetricDefinition` gains optional `target: { value, direction }` where `direction =
  higherIsBetter | lowerIsBetter`.
- **AC-3.2** Optional `thresholds: { amber, green }` classify each subject's value into
  `red | amber | green` respecting `direction`.
- **AC-3.3** A pure `classify(value, target, thresholds)` helper returns attainment (`value/target`)
  and RAG status; definitions without targets return no status.
- **AC-3.4** (from L11) `target` may be a range `{ min, max }` instead of a single `value`;
  attainment/RAG respect the range and `direction`.
- **AC-3.5** (from L11) Optional `pacing: { strategy, excludeWeekends }` where `strategy = steady |
  rampUp | bigFinish`; a pure `expectedPace(target, elapsedFraction, strategy)` returns the expected
  value at a point in the period so hosts can show ahead/behind. No pacing → no expected value.
- **AC-3.6** (from L11) Optional `rankMethod: 'score' | 'percentToGoal'` determines how subjects are
  ranked/sorted for leaderboard display (Next Level's core need); default `score` preserves today's
  descending-by-value ordering.

### R4 — Geography / mapping
- **AC-4.1** The builder allows selecting a `geography` field as the subject or as a measured
  dimension where meaningful.
- **AC-4.2** `SubjectValue` may optionally carry `coordinates?: { lat, lng }` so map hosts can plot
  results; non-geo metrics never populate it.
- **AC-4.3** Aggregations invalid for geography (e.g. `sum` of coordinates) are not offered.

### R5 — Formula / composite metrics (from L11)
- **AC-5.1** A composite metric references two or more component `MetricDefinition`s combined by an
  operation: `formula: { op, components }` where `op = add | subtract | multiply | divide`.
- **AC-5.2** A pure `computeFormula(componentResults, op)` combines per-subject values across
  components on matching subject keys; a subject missing from a component is treated per documented
  rule (e.g. absent → excluded for `divide`, 0 for `add`); `divide` by zero yields no value for that
  subject, never a crash/`Infinity`.
- **AC-5.3** Components are ordinary `MetricDefinition`s (each independently computable), so a formula
  reuses all of R0–R4; nesting depth beyond one level is out of scope for the first cut.
- **AC-5.4** The builder lets a user pick components and an operation; `isMetricComplete` is true only
  when every component is complete and an `op` is chosen.

### Error / edge cases (all roadmap items)
- **AC-E.1** Unknown source id from a provider surfaces a user-facing error, never a crash
  (`MetricStage` already handles `sourcesError`/`fieldsError`).
- **AC-E.2** Rows with null/undefined subject are skipped, not grouped under an empty key.
- **AC-E.3** Non-numeric values for a numeric aggregation are ignored (current `Number.isNaN`
  behavior) and covered by tests.
- **AC-E.4** Empty result sets return `[]` (or empty series), not an error.

---

## Technical scope

Layers, mapped to the existing structure. Each roadmap item is a vertical slice touching model →
compute → provider (if I/O) → UI.

**`core` (model & pure transforms)**
- `metricDefinition.ts` — extend `MetricDefinition` additively (`filters`, `window`, `target`,
  `thresholds`); add `with…` transition helpers per capability; keep `isMetricComplete` accurate.
- `types.ts` — add `Filter`, `FilterOperator`, `Window`, `Granularity` (`daily | weekly | monthly
  | quarterly | annually`), `Target`, `Thresholds`,
  optional `coordinates` on `SubjectValue`.
- `computeSubjectValues.ts` / `aggregate.ts` — apply filters, bucket by window (new series shape),
  classify against targets. New pure helpers: `applyFilters`, `bucketByWindow`, `classify`.
- `provider.ts` — `MetricDataProvider` may gain an optional richer `queryData` contract; add the
  optional `MetricStore` port + `createMemoryStore`.
- `index.ts` — export the new types/helpers.

**`data` (gateway adapter)**
- `gatewayProvider.ts` / `requests.ts` — translate filters/windows into gateway query params where
  the gateway supports server-side filtering; otherwise fall back to client-side compute. Keep the
  injected-baseURL/auth-header parameterization.
- **Not all hosts use this adapter.** Shepherd is offline-first: its clients query a **local SQLite
  replica** (PowerSync), so its provider implements the `MetricDataProvider` port against local SQL,
  not the RTK-Query gateway. Consequence: **client-side compute (`computeSubjectValues`) must remain
  fully functional with no server round-trip**, and filter/window logic must be expressible against
  local rows — not solely as gateway params. Arena/Next Level/Coaching may use `data`; Shepherd
  ships its own PowerSync-backed provider (lives in the Shepherd repo, not this package).

**`react` (UI)**
- `MetricStage.tsx` — add filter rows, window controls, and target/threshold inputs, gated by field
  types; stay stateless/controlled via `onChange`.
- `useMetricBuilder.ts` — expose new selection callbacks and any derived option lists (valid
  operators per field type, date fields for windowing).
- New small components as needed (e.g. `FilterRow`, `WindowControls`, `TargetInput`) with their own
  tests.

**Dependencies**
- Peer deps unchanged: `react`, `react-dom`, and (for `data`) `@reduxjs/toolkit`, `react-redux`.
- No new hard runtime dependencies in `core`. Avoid pulling a mapping library into the package for
  R4 — expose coordinates and let the host render the map.

**Data model change summary (additive, backward compatible)**
```
Aggregation = count | countDistinct | sum | avg | min | max     // R0.5 adds countDistinct

MetricDefinition {
  sourceId?, measure?, subjectField?          // existing
  dateField?                                  // promoted first-class (from L11); used by R1/R2
  filters?: Filter[]                          // R1
  filterLogic?: string                        // R1 (from L11: "1 AND (2 OR 3)")
  window?: { field, granularity }             // R2
  range?:  { field, lastDays }                // R2
  target?: { value | { min, max }, direction }// R3 (range from L11)
  thresholds?: { amber, green }               // R3
  pacing?: { strategy, excludeWeekends }      // R3 (from L11)
  rankMethod?: 'score' | 'percentToGoal'      // R3 (from L11)
  formula?: { op, components: MetricDefinition[] } // R5 (from L11)
}
SubjectValue { subject, value, coordinates? } // R4 adds coordinates
```

---

## Persistence recommendation

**Keep the library stateless; add persistence as an optional port, not a requirement.**

- Rationale: the current design already delegates definition state to the host via `onChange`, and
  the provider-port pattern is the established seam for I/O. Baking storage into the package would
  couple it to a store/auth model that differs across four products.
- Deliverable (R0): an optional `MetricStore` port in `core` (`save`/`load`/`list`/`remove`) plus a
  `createMemoryStore()` reference implementation for tests and the playground. Hosts implement the
  port against their own backend; hosts that only need ephemeral builder state ignore it entirely.
- This preserves Guiding Principles #2 and #3 and keeps `core` free of I/O.

---

## Out of scope

- **Dashboards / charts.** The package returns computed values (and, for R2, series). Rendering
  charts, leaderboards, and maps is the host's job. R4 exposes coordinates but ships no map.
- **Metric authoring permissions / RBAC.** Who may create or view a metric is a host concern.
- **Alerting / notifications** on threshold breaches.
- **Cross-source joins.** A metric is defined over a single source; blending sources is out.
- **Calculated/derived fields & formula expressions** beyond the supported aggregations.
- **Real-time streaming / live updates.** Compute is request-driven.
- **A hosted backend or storage service.** Persistence is a port the host implements.
- **Salesforce-specific behavior.** These are non-Salesforce products; no SF coupling.
- **AI/natural-language metric authoring.** Not in this roadmap.

---

## Roadmap (suggested sequencing)

Vertical, tracer-bullet slices. Each is shippable and independently valuable; order reflects
dependency and demand.

1. **R0 — Persistence port** (small, unblocks "named metrics" in every host).
2. **R0.5 — Count Distinct** (tiny baseline add from L11; do alongside R0 or R1).
3. **R1 — Filters** (highest cross-product demand; foundational). Includes L11 comma-OR and optional
   `filterLogic`.
4. **R2 — Time windows & trends** (delivers the "ongoing performance" story; needed by Coaching &
   Next Level).
5. **R3 — Targets & thresholds** (builds on R2; core to Coaching). Includes L11 goal range, pacing,
   and rank method (Next Level).
6. **R4 — Geography / mapping** (unblocks **Shepherd**, the geopointe-like product; `geography` type
   already exists in the model).
7. **R5 — Formula / composite metrics** (from L11; reuses R0–R4 — last because it composes them).

---

## Open questions

Most design branches were resolved in a grill-me pass — see **Resolved decisions (D1–D15)** in
`docs/plan-metric-builder-roadmap.md`. What remains genuinely open:

1. **Server vs. client compute for filters/windows.** Does the platform gateway support server-side
   filtering/bucketing, or should `data` always fetch rows and compute client-side? Affects R1/R2
   provider contract and performance at scale. (Not blocking — compute stays pure and host-agnostic;
   the `data` adapter decides push-down per host.)
2. **Next Level ranking beyond score/percent.** D-decisions cover score vs. percent-to-goal ordering;
   **ties, percentiles, and period-over-period deltas** remain open until Next Level scopes them.
   Next Level is L11 **without coaching or competitions**, so leaderboard display is its core need.
3. **Shepherd polygon geometry & custom fields.** `records` map directly to `coordinates {lat,lng}`
   (resolved). Still open: whether/how to surface `polygons.geometry` (GeoJSON) as a subject or
   dimension, and how `records.custom_fields (Json)` map to `SourceField`s. Confirm when R4 planning
   pulls the Shepherd repo.

**Resolved (recorded as decisions in the plan):** date representation → D1; timezone/week-start → D2/
D3; empty-bucket & range/window split → D7/D8; pacing period → D11; formula sourcing & missing-value
semantics → D9/D10; filter coercion/case & `filterLogic` → D4/D5; store ids → D6. **Deferred out of
v1:** definition versioning (D12), fiscal periods incl. Triannually (D13), multiple measures per
metric (D14), subject display-name resolution (D15).
