import { useState, useEffect } from 'react';
import { useCreatePayPeriod, useSuggestedPayPeriod } from '../hooks/usePayPeriods';
import { useBillTemplates } from '../hooks/useBillTemplates';
import { useToast } from '../contexts/ToastContext';

interface PayPeriodFormProps {
  onSuccess?: () => void;
}

export function PayPeriodForm({ onSuccess }: PayPeriodFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expectedIncome, setExpectedIncome] = useState('');
  const [populateBills, setPopulateBills] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const createPayPeriod = useCreatePayPeriod();
  const { data: suggestedDates, isLoading: isLoadingSuggestion } = useSuggestedPayPeriod();
  const { data: billTemplates } = useBillTemplates();
  const { showToast } = useToast();

  // Auto-fill suggested dates when form opens
  useEffect(() => {
    if (isOpen && suggestedDates && !startDate && !endDate) {
      setStartDate(suggestedDates.start_date);
      setEndDate(suggestedDates.end_date);
    }
  }, [isOpen, suggestedDates, startDate, endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !expectedIncome) return;

    createPayPeriod.mutate(
      {
        data: {
          start_date: startDate,
          end_date: endDate,
          expected_income: parseFloat(expectedIncome),
        },
        populateBills,
      },
      {
        onSuccess: () => {
          setStartDate('');
          setEndDate('');
          setExpectedIncome('');
          setPopulateBills(true);
          setIsOpen(false);
          const message = populateBills
            ? 'Pay period created with bills from templates'
            : 'Pay period created successfully';
          showToast(message, 'success');
          onSuccess?.();
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to create pay period', 'error');
        },
      }
    );
  };

  const handleCancel = () => {
    setStartDate('');
    setEndDate('');
    setExpectedIncome('');
    setPopulateBills(true);
    setIsOpen(false);
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

  const hasTemplates = billTemplates && billTemplates.length > 0;

  return (
    <div className="card bg-base-100 shadow-lg p-4">
      <h3 className="font-bold mb-4">Create New Pay Period</h3>
      {isLoadingSuggestion ? (
        <div className="flex items-center gap-2 text-base-content/60 mb-4">
          <span className="loading loading-spinner loading-sm"></span>
          Loading suggested dates...
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Start Date (Pay Day)</span>
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
        </div>

        {hasTemplates && (
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm"
                checked={populateBills}
                onChange={(e) => setPopulateBills(e.target.checked)}
              />
              <span className="label-text">
                Auto-add bills from templates ({billTemplates.length} template{billTemplates.length !== 1 ? 's' : ''})
              </span>
            </label>
          </div>
        )}

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
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
