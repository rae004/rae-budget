import type { PayPeriod } from '../types';

interface PayPeriodSelectorProps {
  payPeriods: PayPeriod[];
  selectedId: number | undefined;
  onSelect: (id: number) => void;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const end = new Date(endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${start} - ${end}`;
}

export function PayPeriodSelector({
  payPeriods,
  selectedId,
  onSelect,
}: PayPeriodSelectorProps) {
  if (payPeriods.length === 0) {
    return (
      <div className="text-base-content/60">
        No pay periods yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <label className="font-semibold">Pay Period:</label>
      <select
        className="select select-bordered select-sm"
        value={selectedId ?? ''}
        onChange={(e) => onSelect(parseInt(e.target.value))}
      >
        {payPeriods.map((pp) => (
          <option key={pp.id} value={pp.id}>
            {formatDateRange(pp.start_date, pp.end_date)}
          </option>
        ))}
      </select>
    </div>
  );
}
