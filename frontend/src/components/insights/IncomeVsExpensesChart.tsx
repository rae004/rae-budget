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

const INCOME_COLOR = '#22c55e';
const SPENDING_COLOR = '#3b82f6';
const BILLS_COLOR = '#ef4444';

export function IncomeExpensesTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: InsightsIncomeVsExpensesBucket }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const bucket = payload[0].payload;
  const totalExpenses = bucket.bills + bucket.spending;

  return (
    <div className="rounded border border-base-300 bg-base-100 px-2 py-1.5 text-[11px] leading-tight shadow-lg">
      <div className="mb-1 font-semibold">{label}</div>
      <div className="flex items-center gap-1.5 py-px">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-sm"
          style={{ backgroundColor: INCOME_COLOR }}
        />
        <span className="mr-2">Income</span>
        <span className="ml-auto tabular-nums">${bucket.income.toFixed(2)}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 border-t border-base-300 pt-1">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-sm"
          style={{ backgroundColor: SPENDING_COLOR }}
        />
        <span className="mr-2">Discretionary</span>
        <span className="ml-auto tabular-nums">${bucket.spending.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-1.5 py-px">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-sm"
          style={{ backgroundColor: BILLS_COLOR }}
        />
        <span className="mr-2">Bills</span>
        <span className="ml-auto tabular-nums">${bucket.bills.toFixed(2)}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 border-t border-base-300 pt-1 font-semibold">
        <span>Total Expenses</span>
        <span
          className={`ml-auto tabular-nums ${
            totalExpenses > bucket.income ? 'text-error' : 'text-success'
          }`}
        >
          ${totalExpenses.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

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
          <Tooltip content={<IncomeExpensesTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => SERIES_LABELS[String(value)] ?? value}
          />
          <Bar dataKey="bills" stackId="expenses" fill={BILLS_COLOR} />
          <Bar dataKey="spending" stackId="expenses" fill={SPENDING_COLOR} />
          <Line
            type="monotone"
            dataKey="income"
            stroke={INCOME_COLOR}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
