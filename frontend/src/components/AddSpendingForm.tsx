import { useState } from 'react';
import { useCreateSpending } from '../hooks/useSpending';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../contexts/ToastContext';

interface AddSpendingFormProps {
  payPeriodId: number;
}

export function AddSpendingForm({ payPeriodId }: AddSpendingFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [spentDate, setSpentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');

  const createSpending = useCreateSpending();
  const { data: categories } = useCategories();
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !spentDate) return;

    createSpending.mutate(
      {
        payPeriodId,
        data: {
          description,
          amount: parseFloat(amount),
          spent_date: spentDate,
          category_id: categoryId ? parseInt(categoryId) : undefined,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          setDescription('');
          setAmount('');
          setSpentDate(new Date().toISOString().split('T')[0]);
          setCategoryId('');
          setNotes('');
          showToast('Spending entry added', 'success');
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to add spending', 'error');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Row 1: Description, Amount, Date */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col flex-1 min-w-48">
          <label className="label py-1">
            <span className="label-text">Description</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you buy?"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="label py-1">
            <span className="label-text">Amount</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input input-bordered input-sm w-28"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="label py-1">
            <span className="label-text">Date</span>
          </label>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={spentDate}
            onChange={(e) => setSpentDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Row 2: Category, Notes, Submit */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="label py-1">
            <span className="label-text">Category</span>
          </label>
          <select
            className="select select-bordered select-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">None</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col flex-1 min-w-48">
          <label className="label py-1">
            <span className="label-text">Notes</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={createSpending.isPending}
        >
          {createSpending.isPending ? 'Adding...' : 'Add Spending'}
        </button>
      </div>
    </form>
  );
}
