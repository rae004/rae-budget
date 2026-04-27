import { useState } from 'react';
import { InsightsToolbar } from '../components/InsightsToolbar';
import { BillsVsDiscretionaryChart } from '../components/insights/BillsVsDiscretionaryChart';
import { CategoryTrendChart } from '../components/insights/CategoryTrendChart';
import { SpendingByCategoryChart } from '../components/insights/SpendingByCategoryChart';
import { SpendingOverTimeChart } from '../components/insights/SpendingOverTimeChart';
import { useCategories } from '../hooks/useCategories';
import { useInsights, type InsightsFilter } from '../hooks/useInsights';

const DEFAULT_FILTER: InsightsFilter = {
  rangeMode: 'last-n',
  n: 6,
  include: 'both',
  categoryIds: [],
};

export function Insights() {
  const [filter, setFilter] = useState<InsightsFilter>(DEFAULT_FILTER);
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
        onChange={setFilter}
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
          <BillsVsDiscretionaryChart data={data.billsVsDiscretionary} />
        </div>
      ) : null}
    </div>
  );
}
