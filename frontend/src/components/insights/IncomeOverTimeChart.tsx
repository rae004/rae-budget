import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { InsightsIncomeBucket } from '../../hooks/useInsights';
import { ChartCard, ChartEmptyState } from './ChartCard';

interface Props {
  data: InsightsIncomeBucket[];
}

const SERIES_LABELS: Record<string, string> = {
  baseIncome: 'Base',
  additionalIncome: 'Additional',
};

const BASE_COLOR = '#14532d';
const ADDITIONAL_COLOR = '#86efac';

export function IncomeTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: InsightsIncomeBucket }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const bucket = payload[0].payload;

  return (
    <div className="rounded border border-base-300 bg-base-100 px-2 py-1.5 text-[11px] leading-tight shadow-lg">
      <div className="mb-1 font-semibold">{label}</div>
      {bucket.additionalIncome !== 0 && (
        <div className="flex items-center gap-1.5 py-px">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-sm"
            style={{ backgroundColor: ADDITIONAL_COLOR }}
          />
          <span className="mr-2">Additional</span>
          <span className="ml-auto tabular-nums">
            ${bucket.additionalIncome.toFixed(2)}
          </span>
        </div>
      )}
      <div className="flex items-center gap-1.5 py-px">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-sm"
          style={{ backgroundColor: BASE_COLOR }}
        />
        <span className="mr-2">Base</span>
        <span className="ml-auto tabular-nums">
          ${bucket.baseIncome.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 border-t border-base-300 pt-1 font-semibold">
        <span>Total</span>
        <span className="ml-auto tabular-nums">
          ${bucket.income.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export function IncomeOverTimeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <ChartCard title="Income Over Time">
        <ChartEmptyState message="No pay periods in the selected range." />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Income Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="baseIncomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={BASE_COLOR} stopOpacity={0.7} />
              <stop offset="95%" stopColor={BASE_COLOR} stopOpacity={0.15} />
            </linearGradient>
            <linearGradient
              id="additionalIncomeGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={ADDITIONAL_COLOR} stopOpacity={0.6} />
              <stop offset="95%" stopColor={ADDITIONAL_COLOR} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v: number) => `$${v}`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<IncomeTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => SERIES_LABELS[String(value)] ?? value}
          />
          <Area
            type="monotone"
            dataKey="baseIncome"
            stackId="income"
            stroke={BASE_COLOR}
            strokeWidth={2}
            fill="url(#baseIncomeGradient)"
          />
          <Area
            type="monotone"
            dataKey="additionalIncome"
            stackId="income"
            stroke={ADDITIONAL_COLOR}
            strokeWidth={2}
            fill="url(#additionalIncomeGradient)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
