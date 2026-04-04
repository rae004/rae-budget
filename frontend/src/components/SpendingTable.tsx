import { useDeleteSpending } from '../hooks/useSpending';
import { useCategories } from '../hooks/useCategories';
import type { SpendingEntry } from '../types';

interface SpendingTableProps {
  entries: SpendingEntry[];
  payPeriodId: number;
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function SpendingTable({ entries, payPeriodId }: SpendingTableProps) {
  const deleteSpending = useDeleteSpending();
  const { data: categories } = useCategories();

  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId || !categories) return '-';
    const category = categories.find((c) => c.id === categoryId);
    return category?.name ?? '-';
  };

  const getCategoryColor = (categoryId: number | null): string => {
    if (!categoryId || !categories) return '#6b7280';
    const category = categories.find((c) => c.id === categoryId);
    return category?.color ?? '#6b7280';
  };

  const handleDelete = (spendingId: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteSpending.mutate({ spendingId, payPeriodId });
    }
  };

  // Calculate running total
  let runningTotal = 0;
  const entriesWithRunningTotal = entries.map((entry) => {
    runningTotal += parseFloat(entry.amount);
    return { ...entry, runningTotal };
  });

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        No spending entries for this pay period. Add one below.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Running Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entriesWithRunningTotal.map((entry) => (
            <tr key={entry.id}>
              <td>{formatDate(entry.spent_date)}</td>
              <td>
                {entry.description}
                {entry.notes && (
                  <span className="text-xs text-base-content/60 ml-2">
                    ({entry.notes})
                  </span>
                )}
              </td>
              <td>
                <span
                  className="badge badge-sm"
                  style={{ backgroundColor: getCategoryColor(entry.category_id), color: 'white' }}
                >
                  {getCategoryName(entry.category_id)}
                </span>
              </td>
              <td>{formatCurrency(entry.amount)}</td>
              <td className="font-mono">{formatCurrency(entry.runningTotal)}</td>
              <td>
                <button
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleteSpending.isPending}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="font-bold">Total</td>
            <td className="font-bold">
              {formatCurrency(
                entries.reduce((sum, e) => sum + parseFloat(e.amount), 0)
              )}
            </td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
