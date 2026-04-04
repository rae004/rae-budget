import { useState } from 'react';
import { useCreatePayPeriod } from '../hooks/usePayPeriods';

interface PayPeriodFormProps {
  onSuccess?: () => void;
}

export function PayPeriodForm({ onSuccess }: PayPeriodFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expectedIncome, setExpectedIncome] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const createPayPeriod = useCreatePayPeriod();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !expectedIncome) return;

    createPayPeriod.mutate(
      {
        start_date: startDate,
        end_date: endDate,
        expected_income: parseFloat(expectedIncome),
      },
      {
        onSuccess: () => {
          setStartDate('');
          setEndDate('');
          setExpectedIncome('');
          setIsOpen(false);
          onSuccess?.();
        },
      }
    );
  };

  if (!isOpen) {
    return (
      <button
        className="btn btn-primary btn-sm"
        onClick={() => setIsOpen(true)}
      >
        + New Pay Period
      </button>
    );
  }

  return (
    <div className="card bg-base-100 shadow-lg p-4">
      <h3 className="font-bold mb-4">Create New Pay Period</h3>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Start Date</span>
          </label>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">End Date</span>
          </label>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Expected Income</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input input-bordered input-sm w-32"
            value={expectedIncome}
            onChange={(e) => setExpectedIncome(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={createPayPeriod.isPending}
          >
            {createPayPeriod.isPending ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
