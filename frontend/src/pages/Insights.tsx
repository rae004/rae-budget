import { useState } from 'react';
import { InsightsToolbar } from '../components/InsightsToolbar';
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
          Filter and roll up your spending across pay periods. Charts coming
          soon.
        </p>
      </div>

      <InsightsToolbar
        filter={filter}
        onChange={setFilter}
        categories={categories ?? []}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Selected range</h2>
            <p className="text-base">
              <strong data-testid="insights-period-count">{periodCount}</strong>{' '}
              pay period{periodCount === 1 ? '' : 's'} ·{' '}
              <strong data-testid="insights-category-count">
                {categoryCount}
              </strong>{' '}
              {categoryCount === 1 ? 'category' : 'categories'} ·{' '}
              <strong data-testid="insights-grand-total">
                ${grandTotal.toFixed(2)}
              </strong>{' '}
              total
            </p>
            <p className="text-base-content/60 mt-2 text-sm">
              Charts (Spending by Category, Spending Over Time, Category Trend,
              Bills vs Discretionary) land in upcoming PRs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
