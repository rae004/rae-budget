import { useState } from 'react';
import { useCreateSpending } from '../hooks/useSpending';
import { useCategories } from '../hooks/useCategories';

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
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Description</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you buy?"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
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

      <div className="form-control">
        <label className="label">
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

      {categories && categories.length > 0 && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Category</span>
          </label>
          <select
            className="select select-bordered select-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">None</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-control">
        <label className="label">
          <span className="label-text">Notes</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-sm"
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
    </form>
  );
}
