import { useState } from 'react';
import {
  useUpdatePayPeriod,
  useRepopulatePayPeriodBills,
} from '../hooks/usePayPeriods';
import { useBillTemplates } from '../hooks/useBillTemplates';
import { useToast } from '../contexts/ToastContext';
import type { PayPeriodDetail, PayPeriodUpdate } from '../types';

interface EditPayPeriodFormProps {
  payPeriod: PayPeriodDetail;
  onClose: () => void;
}

export function EditPayPeriodForm({
  payPeriod,
  onClose,
}: EditPayPeriodFormProps) {
  const [startDate, setStartDate] = useState(payPeriod.start_date);
  const [endDate, setEndDate] = useState(payPeriod.end_date);
  const [expectedIncome, setExpectedIncome] = useState(
    payPeriod.expected_income
  );
  const [actualIncome, setActualIncome] = useState(
    payPeriod.actual_income ?? ''
  );
  const [notes, setNotes] = useState(payPeriod.notes ?? '');

  const updatePayPeriod = useUpdatePayPeriod();
  const repopulateBills = useRepopulatePayPeriodBills();
  const { data: billTemplates } = useBillTemplates();
  const { showToast } = useToast();

  const isSaving = updatePayPeriod.isPending || repopulateBills.isPending;
  const datesChanged =
    startDate !== payPeriod.start_date || endDate !== payPeriod.end_date;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !expectedIncome) return;
    if (endDate < startDate) {
      showToast('End date must be on or after the start date', 'error');
      return;
    }

    const data: PayPeriodUpdate = {
      start_date: startDate,
      end_date: endDate,
      expected_income: parseFloat(expectedIncome),
      actual_income: actualIncome.trim() ? parseFloat(actualIncome) : null,
      notes: notes.trim() || null,
    };

    updatePayPeriod.mutate(
      { id: payPeriod.id, data },
      {
        onSuccess: () => {
          // When the date range changed, re-derive template bills for the new
          // window. Manually-added bills are preserved by the backend.
          const hasTemplates = (billTemplates?.length ?? 0) > 0;
          if (datesChanged && hasTemplates) {
            repopulateBills.mutate(payPeriod.id, {
              onSuccess: (result) => {
                showToast(
                  `Pay period updated — ${result.bills_created} bill(s) added, ${result.bills_deleted} removed`,
                  'success'
                );
                onClose();
              },
              onError: (error) => {
                showToast(
                  `Pay period saved, but bills failed to update: ${
                    error instanceof Error ? error.message : 'unknown error'
                  }`,
                  'error'
                );
                onClose();
              },
            });
          } else {
            showToast('Pay period updated', 'success');
            onClose();
          }
        },
        onError: (error) => {
          showToast(
            error instanceof Error
              ? error.message
              : 'Failed to update pay period',
            'error'
          );
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="label" htmlFor="edit-start-date">
            <span className="label-text">Start Date (Pay Day)</span>
          </label>
          <input
            id="edit-start-date"
            type="date"
            className="input input-bordered input-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="label" htmlFor="edit-end-date">
            <span className="label-text">End Date</span>
          </label>
          <input
            id="edit-end-date"
            type="date"
            className="input input-bordered input-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="label" htmlFor="edit-expected-income">
            <span className="label-text">Expected Income</span>
          </label>
          <input
            id="edit-expected-income"
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

        <div className="flex flex-col">
          <label className="label" htmlFor="edit-actual-income">
            <span className="label-text">Actual Income</span>
          </label>
          <input
            id="edit-actual-income"
            type="number"
            step="0.01"
            min="0"
            className="input input-bordered input-sm w-32"
            value={actualIncome}
            onChange={(e) => setActualIncome(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label className="label" htmlFor="edit-notes">
          <span className="label-text">Notes</span>
        </label>
        <textarea
          id="edit-notes"
          className="textarea textarea-bordered textarea-sm w-full"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          maxLength={500}
          rows={2}
        />
      </div>

      {datesChanged && (billTemplates?.length ?? 0) > 0 && (
        <div className="text-sm text-base-content/70">
          Changing the dates will re-add template bills that fall in the new
          range. Manually-added bills are kept.
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
