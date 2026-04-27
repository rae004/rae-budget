import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { InsightsCategoryBucket } from '../../hooks/useInsights';
import { ChartCard, ChartEmptyState } from './ChartCard';

interface Props {
  data: InsightsCategoryBucket[];
  grandTotal: number;
  periodCount: number;
}

export function SpendingByCategoryChart({
  data,
  grandTotal,
  periodCount,
}: Props) {
  if (data.length === 0) {
    return (
      <ChartCard title="Spending by Category">
        <ChartEmptyState message="No spending in the selected range." />
      </ChartCard>
    );
  }

  const total = grandTotal > 0 ? grandTotal : data.reduce((s, d) => s + d.total, 0);

  return (
    <ChartCard title="Spending by Category">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell
                key={entry.categoryId ?? 'uncategorized'}
                fill={entry.color}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, item) => {
              const num = typeof value === 'number' ? value : 0;
              const pct = total > 0 ? ((num / total) * 100).toFixed(1) : '0.0';
              const bucket = item?.payload as
                | InsightsCategoryBucket
                | undefined;
              if (bucket?.target && periodCount > 0) {
                // Two pay periods per month; selected range covers periodCount/2 months.
                const expected = (bucket.target * periodCount) / 2;
                const ratio = expected > 0 ? (num / expected) * 100 : 0;
                return [
                  `$${num.toFixed(2)} (${pct}%) — ${ratio.toFixed(0)}% of $${expected.toFixed(2)} target`,
                  String(name),
                ];
              }
              return [`$${num.toFixed(2)} (${pct}%)`, String(name)];
            }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
