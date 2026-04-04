import type { PayPeriodDetail } from '../types';

interface SummaryCardProps {
  payPeriod: PayPeriodDetail;
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(parseFloat(value));
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SummaryCard({ payPeriod }: SummaryCardProps) {
  const remaining = parseFloat(payPeriod.summary.remaining);
  const isNegative = remaining < 0;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          Pay Period: {formatDate(payPeriod.start_date)} - {formatDate(payPeriod.end_date)}
        </h2>

        <div className="stats stats-vertical lg:stats-horizontal shadow mt-4">
          <div className="stat">
            <div className="stat-title">Expected Income</div>
            <div className="stat-value text-primary text-2xl">
              {formatCurrency(payPeriod.expected_income)}
            </div>
            {payPeriod.actual_income && (
              <div className="stat-desc">
                Actual: {formatCurrency(payPeriod.actual_income)}
              </div>
            )}
          </div>

          <div className="stat">
            <div className="stat-title">Bills Total</div>
            <div className="stat-value text-2xl">
              {formatCurrency(payPeriod.summary.bill_total)}
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">Spending Total</div>
            <div className="stat-value text-2xl">
              {formatCurrency(payPeriod.summary.spending_total)}
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">Running Total</div>
            <div className="stat-value text-2xl">
              {formatCurrency(payPeriod.summary.running_total)}
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">Remaining</div>
            <div className={`stat-value text-2xl ${isNegative ? 'text-error' : 'text-success'}`}>
              {formatCurrency(payPeriod.summary.remaining)}
            </div>
          </div>
        </div>

        {payPeriod.notes && (
          <div className="mt-4">
            <span className="font-semibold">Notes:</span> {payPeriod.notes}
          </div>
        )}
      </div>
    </div>
  );
}
