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
            formatter={(value, name) => {
              const num = typeof value === 'number' ? value : 0;
              const bucket = byCategory.find((b) => categoryKey(b) === name);
              return [`$${num.toFixed(2)}`, bucket?.name ?? String(name)];
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
