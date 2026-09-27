import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { InsightsPeriodBucket } from '../../hooks/useInsights';
import { ChartCard, ChartEmptyState } from './ChartCard';

interface Props {
  data: InsightsPeriodBucket[];
}

const SPENDING_COLOR = '#3b82f6';

export function SpendingTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: InsightsPeriodBucket }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const bucket = payload[0].payload;

  return (
    <div className="rounded border border-base-300 bg-base-100 px-2 py-1.5 text-[11px] leading-tight shadow-lg">
      <div className="mb-1 font-semibold">{label}</div>
      <div className="flex items-center gap-1.5 py-px">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-sm"
          style={{ backgroundColor: SPENDING_COLOR }}
        />
        <span className="mr-2">Total</span>
        <span className="ml-auto tabular-nums">${bucket.total.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function SpendingOverTimeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <ChartCard title="Spending Over Time">
        <ChartEmptyState message="No pay periods in the selected range." />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Spending Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SPENDING_COLOR} stopOpacity={0.5} />
              <stop offset="95%" stopColor={SPENDING_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v: number) => `$${v}`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<SpendingTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke={SPENDING_COLOR}
            strokeWidth={2}
            fill="url(#spendingGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
