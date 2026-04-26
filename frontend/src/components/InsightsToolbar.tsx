import type { Category } from '../types';
import type {
  InsightsFilter,
  InsightsInclude,
  InsightsRangeMode,
} from '../hooks/useInsights';

interface Props {
  filter: InsightsFilter;
  onChange: (next: InsightsFilter) => void;
  categories: Category[];
}

const RANGE_PRESETS: { label: string; mode: InsightsRangeMode; n?: number }[] = [
  { label: 'Last 3 periods', mode: 'last-n', n: 3 },
  { label: 'Last 6 periods', mode: 'last-n', n: 6 },
  { label: 'Last 12 periods', mode: 'last-n', n: 12 },
  { label: 'Year to date', mode: 'ytd' },
  { label: 'Custom range', mode: 'custom' },
];

function rangeKey(filter: InsightsFilter): string {
  if (filter.rangeMode === 'last-n') return `last-n:${filter.n ?? 6}`;
  return filter.rangeMode;
}

export function InsightsToolbar({ filter, onChange, categories }: Props) {
  const selectedRangeKey = rangeKey(filter);

  const handleRangeChange = (key: string) => {
    if (key === 'ytd') {
      onChange({ ...filter, rangeMode: 'ytd', n: undefined });
      return;
    }
    if (key === 'custom') {
      onChange({ ...filter, rangeMode: 'custom', n: undefined });
      return;
    }
    const n = Number(key.split(':')[1]);
    onChange({ ...filter, rangeMode: 'last-n', n });
  };

  const toggleCategory = (id: number) => {
    const current = filter.categoryIds ?? [];
    const next = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    onChange({ ...filter, categoryIds: next });
  };

  const clearCategories = () => onChange({ ...filter, categoryIds: [] });

  const handleAmountChange = (
    field: 'minAmount' | 'maxAmount',
    value: string,
  ) => {
    if (value === '') {
      onChange({ ...filter, [field]: undefined });
      return;
    }
    const num = Number(value);
    if (Number.isFinite(num)) {
      onChange({ ...filter, [field]: num });
    }
  };

  const selectedCount = filter.categoryIds?.length ?? 0;
  const categoryButtonLabel =
    selectedCount === 0
      ? 'All categories'
      : selectedCount === 1
        ? '1 category'
        : `${selectedCount} categories`;

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4 gap-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Range */}
          <div className="flex flex-col">
            <label className="label py-1">
              <span className="label-text">Range</span>
            </label>
            <select
              className="select select-bordered select-sm"
              value={selectedRangeKey}
              onChange={(e) => handleRangeChange(e.target.value)}
              aria-label="Range"
            >
              {RANGE_PRESETS.map((p) => {
                const key = p.mode === 'last-n' ? `last-n:${p.n}` : p.mode;
                return (
                  <option key={key} value={key}>
                    {p.label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Custom range dates */}
          {filter.rangeMode === 'custom' && (
            <>
              <div className="flex flex-col">
                <label className="label py-1">
                  <span className="label-text">From</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={filter.fromDate ?? ''}
                  onChange={(e) =>
                    onChange({ ...filter, fromDate: e.target.value || undefined })
                  }
                  aria-label="From date"
                />
              </div>
              <div className="flex flex-col">
                <label className="label py-1">
                  <span className="label-text">To</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={filter.toDate ?? ''}
                  onChange={(e) =>
                    onChange({ ...filter, toDate: e.target.value || undefined })
                  }
                  aria-label="To date"
                />
              </div>
            </>
          )}

          {/* Categories */}
          <div className="flex flex-col">
            <label className="label py-1">
              <span className="label-text">Categories</span>
            </label>
            <details className="dropdown">
              <summary
                className="btn btn-sm btn-outline w-44 justify-between"
                aria-label="Categories filter"
              >
                <span>{categoryButtonLabel}</span>
                <span aria-hidden>▾</span>
              </summary>
              <div className="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-56 max-h-64 overflow-y-auto">
                {categories.length === 0 ? (
                  <div className="text-sm text-base-content/60 px-2 py-1">
                    No categories yet
                  </div>
                ) : (
                  <>
                    {categories.map((c) => {
                      const checked = filter.categoryIds?.includes(c.id) ?? false;
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-base-200 rounded"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={checked}
                            onChange={() => toggleCategory(c.id)}
                          />
                          <span
                            className="w-3 h-3 rounded inline-block"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="text-sm">{c.name}</span>
                        </label>
                      );
                    })}
                    {selectedCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost mt-1"
                        onClick={clearCategories}
                      >
                        Clear
                      </button>
                    )}
                  </>
                )}
              </div>
            </details>
          </div>

          {/* Min/Max amount */}
          <div className="flex flex-col">
            <label className="label py-1">
              <span className="label-text">Min $</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input input-bordered input-sm w-24"
              value={filter.minAmount ?? ''}
              onChange={(e) => handleAmountChange('minAmount', e.target.value)}
              placeholder="—"
              aria-label="Minimum amount"
            />
          </div>
          <div className="flex flex-col">
            <label className="label py-1">
              <span className="label-text">Max $</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input input-bordered input-sm w-24"
              value={filter.maxAmount ?? ''}
              onChange={(e) => handleAmountChange('maxAmount', e.target.value)}
              placeholder="—"
              aria-label="Maximum amount"
            />
          </div>

          {/* Include toggle */}
          <div className="flex flex-col">
            <label className="label py-1">
              <span className="label-text">Include</span>
            </label>
            <div role="radiogroup" className="join" aria-label="Include">
              {(['both', 'spending', 'bills'] as InsightsInclude[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={filter.include === v}
                  className={`join-item btn btn-sm ${filter.include === v ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => onChange({ ...filter, include: v })}
                >
                  {v === 'both' ? 'Both' : v === 'spending' ? 'Spending' : 'Bills'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
