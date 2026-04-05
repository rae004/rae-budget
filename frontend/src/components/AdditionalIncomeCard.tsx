import { useState } from 'react';
import { useUpdatePayPeriod } from '../hooks/usePayPeriods';
import { useToast } from '../contexts/ToastContext';

interface AdditionalIncomeCardProps {
  payPeriodId: number;
  currentValue: string | null;
  currentDescription: string | null;
}

function formatCurrency(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numValue);
}

export function AdditionalIncomeCard({
  payPeriodId,
  currentValue,
  currentDescription,
}: AdditionalIncomeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue || '0');
  const [description, setDescription] = useState(currentDescription || '');
  const updatePayPeriod = useUpdatePayPeriod();
  const { showToast } = useToast();

  const handleStartEdit = () => {
    setValue(currentValue || '0');
    setDescription(currentDescription || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setValue(currentValue || '0');
    setDescription(currentDescription || '');
    setIsEditing(false);
  };

  const handleSave = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    updatePayPeriod.mutate(
      {
        id: payPeriodId,
        data: {
          additional_income: numValue === 0 ? null : numValue,
          additional_income_description: description.trim() || null,
        },
      },
      {
        onSuccess: () => {
          showToast('Additional income updated', 'success');
          setIsEditing(false);
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to update', 'error');
        },
      }
    );
  };

  const displayValue = currentValue ? formatCurrency(currentValue) : '$0.00';

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body py-4">
        <h2 className="card-title text-base">Additional Income</h2>
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input input-bordered input-sm w-28"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            </div>
            <input
              type="text"
              placeholder="Description (e.g., Bonus, Side gig)"
              className="input input-bordered input-sm w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
            <div className="flex gap-2 pt-1">
              <button
                className="btn btn-success btn-sm"
                onClick={handleSave}
                disabled={updatePayPeriod.isPending}
              >
                {updatePayPeriod.isPending ? '...' : 'Save'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleCancel}
                disabled={updatePayPeriod.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xl font-semibold">{displayValue}</span>
              {currentDescription && (
                <p className="text-sm text-base-content/70 mt-1">{currentDescription}</p>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleStartEdit}>
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
