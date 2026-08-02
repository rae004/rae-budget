import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  InsightsCategoryBucket,
  InsightsCategoryTrendBucket,
} from '../../hooks/useInsights';
import { ChartCard, ChartEmptyState } from './ChartCard';

interface Props {
  data: InsightsCategoryTrendBucket[];
  byCategory: InsightsCategoryBucket[];
}

interface FlatRow {
  label: string;
  [categoryKey: string]: number | string;
}

function categoryKey(b: InsightsCategoryBucket): string {
  return b.categoryId === null ? 'uncategorized' : String(b.categoryId);
}

interface TooltipRow {
  key: string;
  name: string;
  color: string;
  value: number;
}

/**
 * Compact tooltip. The default Recharts tooltip grows one row per stacked
 * series, which overflows the 300px chart box once there are more than a
 * handful of categories. This keeps rows tight, drops $0 categories, and
 * spills into a second column instead of running off the bottom. Rows are
 * sorted highest-to-lowest and fill column-major, so the biggest spend is
 * top-left and the smallest is at the bottom of the last column.
 */
export function CategoryTrendTooltip({
  active,
  label,
  rows,
}: {
  active: boolean;
  label: string;
  rows: TooltipRow[];
}) {
  if (!active || rows.length === 0) return null;

  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const twoColumn = sorted.length > 10;
  const perColumn = twoColumn ? Math.ceil(sorted.length / 2) : sorted.length;

  return (
    <div className="rounded border border-base-300 bg-base-100 px-2 py-1.5 text-[11px] leading-tight shadow-lg">
      <div className="mb-1 font-semibold">{label}</div>
      <div
        className={twoColumn ? 'grid grid-flow-col gap-x-3' : 'flex flex-col'}
        style={
          twoColumn
            ? { gridTemplateRows: `repeat(${perColumn}, minmax(0, auto))` }
            : undefined
        }
      >
        {sorted.map((row) => (
          <div key={row.key} className="flex items-center gap-1.5 py-px">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: row.color }}
            />
            <span className="mr-2 truncate max-w-[10rem]">{row.name}</span>
            <span className="ml-auto tabular-nums">
              ${row.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-1.5 border-t border-base-300 pt-1 font-semibold">
        <span>Total</span>
        <span className="ml-auto tabular-nums">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function CategoryTrendChart({ data, byCategory }: Props) {
  if (data.length === 0 || byCategory.length === 0) {
    return (
      <ChartCard title="Category Trend">
        <ChartEmptyState message="No spending in the selected range." />
      </ChartCard>
    );
  }

  const rows: FlatRow[] = data.map((row) => {
    const flat: FlatRow = { label: row.label };
    for (const bucket of byCategory) {
      flat[categoryKey(bucket)] = row.perCategory[categoryKey(bucket)] ?? 0;
    }
    return flat;
  });

  const periodCount = data.length;

  return (
    <ChartCard title="Category Trend">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={rows}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v: number) => `$${v}`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: 'currentColor', fillOpacity: 0.06 }}
            wrapperStyle={{ zIndex: 50, outline: 'none' }}
            allowEscapeViewBox={{ x: false, y: true }}
            content={(props) => {
              const items = Array.isArray(props.payload) ? props.payload : [];
              const rows: TooltipRow[] = items
                .map((item) => {
                  const key = String(item.dataKey ?? item.name ?? '');
                  const bucket = byCategory.find(
                    (b) => categoryKey(b) === key,
                  );
                  return {
                    key,
                    name: bucket?.name ?? key,
                    color: bucket?.color ?? String(item.color ?? '#888'),
                    value: typeof item.value === 'number' ? item.value : 0,
                  };
                })
                .filter((row) => row.value !== 0);
              return (
                <CategoryTrendTooltip
                  active={Boolean(props.active)}
                  label={String(props.label ?? '')}
                  rows={rows}
                />
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => {
              const bucket = byCategory.find(
                (b) => categoryKey(b) === value,
              );
              return bucket?.name ?? value;
            }}
          />
          {byCategory.map((bucket) => (
            <Bar
              key={categoryKey(bucket)}
              dataKey={categoryKey(bucket)}
              stackId="categories"
              fill={bucket.color}
            />
          ))}
          {byCategory
            .filter((b) => b.target !== null && periodCount > 0)
            .map((b) => (
              <ReferenceLine
                key={`target-${categoryKey(b)}`}
                y={b.target! / 2}
                stroke={b.color}
                strokeDasharray="4 2"
                label={{
                  value: `${b.name} target`,
                  position: 'right',
                  fontSize: 10,
                  fill: b.color,
                }}
                ifOverflow="extendDomain"
              />
            ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
