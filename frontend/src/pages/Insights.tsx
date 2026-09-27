import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InsightsToolbar } from '../components/InsightsToolbar';
import { CategoryTrendChart } from '../components/insights/CategoryTrendChart';
import { IncomeOverTimeChart } from '../components/insights/IncomeOverTimeChart';
import { IncomeVsExpensesChart } from '../components/insights/IncomeVsExpensesChart';
import { SpendingByCategoryChart } from '../components/insights/SpendingByCategoryChart';
import { SpendingOverTimeChart } from '../components/insights/SpendingOverTimeChart';
import { useCategories } from '../hooks/useCategories';
import {
  useInsights,
  filterToSearchParams,
  searchParamsToFilter,
  type InsightsFilter,
} from '../hooks/useInsights';

export function Insights() {
  const [searchParams, setSearchParams] = useSearchParams();
  // The URL is the source of truth so a filtered view is bookmarkable/
  // shareable and survives a refresh or back/forward navigation. Keyed on
  // the string value so an unchanged URL doesn't produce a new filter
  // object (and re-trigger useInsights' own memoized aggregation) every
  // render.
  const searchParamsString = searchParams.toString();
  const filter = useMemo(
    () => searchParamsToFilter(searchParams),
    [searchParamsString], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const handleFilterChange = (next: InsightsFilter) => {
    setSearchParams(filterToSearchParams(next), { replace: true });
  };
  const { data: categories } = useCategories();
  const { data, isLoading } = useInsights(filter);

  const periodCount = data?.periods.length ?? 0;
  const categoryCount = data?.byCategory.length ?? 0;
  const grandTotal = data?.grandTotal ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-base-content/60 text-sm mt-1">
          Filter and roll up your spending across pay periods.
        </p>
      </div>

      <InsightsToolbar
        filter={filter}
        onChange={handleFilterChange}
        categories={categories ?? []}
      />

      {/* Summary strip */}
      <div className="text-sm text-base-content/70">
        <strong data-testid="insights-period-count">{periodCount}</strong>{' '}
        pay period{periodCount === 1 ? '' : 's'} ·{' '}
        <strong data-testid="insights-category-count">{categoryCount}</strong>{' '}
        {categoryCount === 1 ? 'category' : 'categories'} ·{' '}
        <strong data-testid="insights-grand-total">
          ${grandTotal.toFixed(2)}
        </strong>{' '}
        total
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingByCategoryChart
            data={data.byCategory}
            grandTotal={data.grandTotal}
            periodCount={data.periods.length}
          />
          <SpendingOverTimeChart data={data.spendingByPeriod} />
          <CategoryTrendChart
            data={data.categoryTrend}
            byCategory={data.byCategory}
          />
          <IncomeVsExpensesChart data={data.incomeVsExpenses} />
          <IncomeOverTimeChart data={data.incomeByPeriod} />
        </div>
      ) : null}
    </div>
  );
}
