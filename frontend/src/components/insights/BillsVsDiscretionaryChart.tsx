import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { InsightsBillsVsDiscretionaryBucket } from '../../hooks/useInsights';
import { ChartCard, ChartEmptyState } from './ChartCard';

interface Props {
  data: InsightsBillsVsDiscretionaryBucket[];
}

const SERIES_LABELS: Record<string, string> = {
  bills: 'Bills',
  spending: 'Discretionary',
};

export function BillsVsDiscretionaryChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <ChartCard title="Bills vs Discretionary">
        <ChartEmptyState message="No pay periods in the selected range." />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Bills vs Discretionary">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
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
          <Line
            type="monotone"
            dataKey="bills"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="spending"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
