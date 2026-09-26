import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { InsightsIncomeVsExpensesBucket } from '../../hooks/useInsights';
import { ChartCard, ChartEmptyState } from './ChartCard';

interface Props {
  data: InsightsIncomeVsExpensesBucket[];
}

const SERIES_LABELS: Record<string, string> = {
  bills: 'Bills',
  spending: 'Discretionary',
  income: 'Income',
};

export function IncomeVsExpensesChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <ChartCard title="Income vs Expenses">
        <ChartEmptyState message="No pay periods in the selected range." />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Income vs Expenses">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
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
              return [
                `$${num.toFixed(2)}`,
                SERIES_LABELS[String(name)] ?? String(name),
              ];
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => SERIES_LABELS[String(value)] ?? value}
          />
          <Bar dataKey="bills" stackId="expenses" fill="#ef4444" />
          <Bar dataKey="spending" stackId="expenses" fill="#3b82f6" />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
