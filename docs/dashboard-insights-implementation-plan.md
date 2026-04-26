# Insights Dashboard — Implementation Plan

## Goal
Add a dedicated `/insights` page for visualizing spending and bill metrics across pay periods, plus introduce per-category budget targets so "actual vs budget" charts have something to compare against. The existing `/` dashboard remains the operational editor; insights is read-only analytics with filters.

## Charts (in scope)
1. **Spending by Category** — donut, scoped to selected range
2. **Spending Over Time** — line/area, one point per pay period
3. **Category Trend (stacked)** — stacked bar per pay period, one stack segment per category
4. **Bills vs Discretionary** — two-line overlay per pay period

## Out of scope (for now)
- Per-period budget overrides (single monthly target only)
- Exporting charts as images
- Server-side aggregation endpoints — added later if client-side aggregation gets sluggish

---

## Architectural decisions

### Chart library: Recharts
Composable React components, ~100KB gzipped, React 19 compatible, no design system clash with DaisyUI/Tailwind. Tremor was considered and rejected (ships its own design system).

### Data flow: client-side aggregation
Single-user app, all rows fit in memory. The `useInsights` hook fetches `pay-periods`, `bills` (all), `spending` (all), `categories` once and memoizes all rollups in `useMemo` keyed on the filter object. Existing per-period hooks (`useBills(id)`, `useSpending(id)`) stay untouched and continue to power the operational dashboard.

If `GET /api/spending` and `GET /api/bills` don't already support unfiltered "return all" mode, that's a small backend change in PR 2.

### Time atom: pay periods
All charts plot one point per pay period. A monthly-rollup toggle is deferred to PR 5 (groups consecutive periods by `end_date` calendar month).

### Budget targets: monthly, single value per category
- New column `categories.monthly_target Numeric(10,2) NULL`
- Per-pay-period target rendered as `monthly_target / 2`
- Nullable — categories without a target don't show a budget line
- No history of changes — editing the target affects all past and future displays

This is the simplest model that supports the "vs budget" overlay. Per-period overrides can layer on top later without breaking this contract.

### Route: `/insights`
Add to `App.tsx` routes and `Navbar.tsx` menu (between Dashboard and Bill Templates).

---

## PR 1 — Add `monthly_target` to categories

**Why first**: small, mergeable on its own, unblocks the "vs budget" line in PR 4.

### Backend
- `backend/app/models/category.py` — add `monthly_target: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)`
- `backend/app/schemas/category.py` — extend `CategoryBase`, `CategoryUpdate`, `CategoryResponse` with `monthly_target: Decimal | None = Field(None, ge=0)`
- `backend/alembic/versions/` — new revision via `alembic revision --autogenerate -m "add monthly_target to categories"`. Review the generated file before applying.
- `backend/tests/test_categories.py` — add cases: create with target, update target, target rejects negatives, response includes target.

### Frontend
- `frontend/src/types/index.ts` — add `monthly_target: string | null` to `Category`, `CategoryCreate`, `CategoryUpdate` (decimals come back as strings — match existing `expected_income` pattern).
- `frontend/src/components/CategoryManagement.tsx` — add a number input (step `0.01`, min `0`) in both the inline edit row and add form. Empty input → `null`.
- `frontend/src/components/CategoryManagement.test.tsx` — extend existing tests to cover the new field.

### Acceptance
- `docker compose exec api alembic current` shows the new revision applied
- `pytest` and `npm test` pass
- Categories list displays the target column; editing persists; setting empty saves `null`

---

## PR 2 — Insights page scaffold + filter toolbar + `useInsights` hook

No charts yet — just the page shell, route, nav link, filter UI, and the data hook returning memoized aggregates. Renders a simple "selected range: N periods, M categories, $X.XX total" summary so the wiring is visible end-to-end.

### Backend
Verify `GET /api/spending` and `GET /api/bills` return all rows when no filter is supplied. If either currently requires `pay_period_id`, relax it. Add tests covering the unfiltered case.

### Frontend
- `frontend/src/pages/Insights.tsx` — new page. Renders `InsightsToolbar` + a `<div>` placeholder for charts.
- `frontend/src/pages/Insights.test.tsx` — renders, default range applied, filter changes update visible summary.
- `frontend/src/components/InsightsToolbar.tsx` — controls:
  - Range mode select: `Last 3 periods` | `Last 6` | `Last 12` | `YTD` | `Custom`
  - Custom: two date pickers (only shown when `Custom` selected)
  - Category multi-select (DaisyUI dropdown w/ checkboxes; empty = all)
  - Min/max amount (two number inputs, optional)
  - Toggle group: `Bills` / `Spending` / `Both` (default Both)
- `frontend/src/hooks/useInsights.ts` — signature:
  ```ts
  interface InsightsFilter {
    rangeMode: 'last-n' | 'ytd' | 'custom';
    n?: number;
    fromDate?: string;
    toDate?: string;
    categoryIds?: number[];
    minAmount?: number;
    maxAmount?: number;
    include: 'bills' | 'spending' | 'both';
  }
  interface InsightsData {
    periods: PayPeriod[];                    // periods in range, oldest first
    byCategory: { categoryId: number; name: string; color: string; total: number; target: number | null }[];
    spendingByPeriod: { periodId: number; label: string; total: number }[];
    categoryTrend: { periodId: number; label: string; perCategory: Record<number, number> }[];
    billsVsDiscretionary: { periodId: number; label: string; bills: number; spending: number }[];
    grandTotal: number;
  }
  function useInsights(filter: InsightsFilter): { data: InsightsData | undefined; isLoading: boolean };
  ```
  Internally calls `usePayPeriods()`, `useCategories()`, `useBills()` (all), `useSpending()` (all), then `useMemo` over `[filter, raw data]` to compute all five aggregate shapes in a single pass.
- `frontend/src/hooks/useInsights.test.ts` — pure-function-style unit tests with mocked TanStack hooks; verify rollups, range filtering, category filtering, and toggle behavior.
- `frontend/src/App.tsx` — register `<Route path="insights" element={<Insights />} />`
- `frontend/src/components/Navbar.tsx` — add `Insights` link between Dashboard and Bill Templates

### Acceptance
- Navigating to `/insights` shows the page with toolbar
- Changing range / categories / toggles updates the live summary count + total
- `useInsights` tests cover all filter shapes

---

## PR 3 — Charts 1 & 2 (Spending by Category + Spending Over Time)

### Frontend
- `frontend/package.json` — add `recharts` dependency
- `frontend/src/components/insights/SpendingByCategoryChart.tsx` — `ResponsiveContainer` + `PieChart` with donut style; uses `byCategory`. Color from each category's `color` field. Tooltip shows `name`, `$total`, `% of grand total`.
- `frontend/src/components/insights/SpendingOverTimeChart.tsx` — `ResponsiveContainer` + `AreaChart`; uses `spendingByPeriod`. X-axis = period label (e.g. `Mar 6–20`), Y-axis = $.
- Co-located `*.test.tsx` for each — render with mocked data, assert key DOM (recharts renders SVG; assert presence of `role="img"` or sample data points via accessible text).
- `Insights.tsx` — drop the placeholder, render the two charts in a 2-col responsive grid.

### Acceptance
- Charts render with real data when periods exist
- Empty state ("No data for selected range") when filters yield zero rows
- Charts respond to filter changes

---

## PR 4 — Charts 3 & 4 (Category Trend stacked + Bills vs Discretionary)

### Frontend
- `frontend/src/components/insights/CategoryTrendChart.tsx` — stacked `BarChart`. Each `Bar` is one category, stacked by `stackId="categories"`. Uses `categoryTrend`.
- `frontend/src/components/insights/BillsVsDiscretionaryChart.tsx` — `LineChart` with two `Line`s (`bills`, `spending`). Uses `billsVsDiscretionary`.
- **Budget overlay (the PR 1 payoff)**: in `CategoryTrendChart`, render a horizontal `ReferenceLine` per category at `monthly_target / 2` for periods within range, and in `SpendingByCategoryChart` (PR 3 component, lightly extended here) show `actual / target` ratio in the tooltip. Categories with `null` target are unaffected.
- Co-located tests.
- `Insights.tsx` — extend grid to 2×2.

### Acceptance
- All four charts render
- Budget reference lines appear only for categories that have a target
- 2×2 grid is responsive (collapses to single column on mobile)

---

## PR 5 (optional) — Monthly rollup toggle

### Frontend
- Add a `groupBy: 'period' | 'month'` toggle to `InsightsToolbar`
- `useInsights` — when `groupBy === 'month'`, group periods by `endOfMonth(period.end_date)` and sum across consecutive periods sharing a month
- Charts pick up the new buckets without per-component changes (label string + period bucket key are the only inputs)

### Acceptance
- Toggle switches all four charts to monthly buckets
- Period-level filters still work in monthly mode

---

## Testing summary (per PR)
Each PR keeps backend ≥94% coverage and frontend ≥87% coverage (current baseline per `CLAUDE.md`). New code is covered by:
- New backend tests for migration / schema changes (PR 1, PR 2)
- New unit tests for `useInsights` (PR 2)
- New component tests for each chart (PR 3, PR 4)

## Conventional Commit prefixes
- PR 1: `feat: add monthly_target to categories` (minor bump)
- PR 2: `feat: add Insights page scaffold and filter toolbar`
- PR 3: `feat: add Spending by Category and Spending Over Time charts`
- PR 4: `feat: add Category Trend and Bills vs Discretionary charts with budget overlay`
- PR 5: `feat: add monthly rollup toggle to Insights`

## Open questions before implementation
1. Is `Numeric(10, 2)` enough headroom for monthly targets? (max ~$99M — yes, fine.)
2. Insights nav label: `Insights` or `Analytics`? Plan currently says `Insights`.
3. Default range: `Last 6 periods` chosen as default. OK?
