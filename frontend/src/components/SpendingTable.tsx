import { useState } from 'react';
import { useDeleteSpending, useUpdateSpending } from '../hooks/useSpending';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../contexts/ToastContext';
import type { SpendingEntry } from '../types';

interface SpendingTableProps {
  entries: SpendingEntry[];
  payPeriodId: number;
}

interface EditingEntry {
  id: number;
  description: string;
  amount: string;
  spent_date: string;
  category_id: string;
  notes: string;
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
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const deleteSpending = useDeleteSpending();
  const updateSpending = useUpdateSpending();
  const { data: categories } = useCategories();
  const { showToast } = useToast();

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

  const handleStartEdit = (entry: SpendingEntry) => {
    setEditingEntry({
      id: entry.id,
      description: entry.description,
      amount: entry.amount,
      spent_date: entry.spent_date,
      category_id: entry.category_id?.toString() || '',
      notes: entry.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;

    updateSpending.mutate(
      {
        spendingId: editingEntry.id,
        payPeriodId,
        data: {
          description: editingEntry.description,
          amount: parseFloat(editingEntry.amount),
          spent_date: editingEntry.spent_date,
          category_id: editingEntry.category_id ? parseInt(editingEntry.category_id) : null,
          notes: editingEntry.notes || null,
        },
      },
      {
        onSuccess: () => {
          showToast('Spending entry updated', 'success');
          setEditingEntry(null);
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to update entry', 'error');
        },
      }
    );
  };

  const handleDelete = (spendingId: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteSpending.mutate(
        { spendingId, payPeriodId },
        {
          onSuccess: () => {
            showToast('Spending entry deleted', 'success');
          },
          onError: (error) => {
            showToast(error instanceof Error ? error.message : 'Failed to delete entry', 'error');
          },
        }
      );
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
          {entriesWithRunningTotal.map((entry) => {
            const isEditing = editingEntry?.id === entry.id;

            if (isEditing) {
              return (
                <tr key={entry.id} className="bg-base-200">
                  <td>
                    <input
                      type="date"
                      className="input input-bordered input-sm"
                      value={editingEntry.spent_date}
                      onChange={(e) =>
                        setEditingEntry({ ...editingEntry, spent_date: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        value={editingEntry.description}
                        onChange={(e) =>
                          setEditingEntry({ ...editingEntry, description: e.target.value })
                        }
                        placeholder="Description"
                      />
                      <input
                        type="text"
                        className="input input-bordered input-xs w-full"
                        value={editingEntry.notes}
                        onChange={(e) =>
                          setEditingEntry({ ...editingEntry, notes: e.target.value })
                        }
                        placeholder="Notes (optional)"
                      />
                    </div>
                  </td>
                  <td>
                    <select
                      className="select select-bordered select-sm"
                      value={editingEntry.category_id}
                      onChange={(e) =>
                        setEditingEntry({ ...editingEntry, category_id: e.target.value })
                      }
                    >
                      <option value="">None</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input input-bordered input-sm w-24"
                      value={editingEntry.amount}
                      onChange={(e) =>
                        setEditingEntry({ ...editingEntry, amount: e.target.value })
                      }
                    />
                  </td>
                  <td className="font-mono">{formatCurrency(entry.runningTotal)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-success btn-xs"
                        onClick={handleSaveEdit}
                        disabled={updateSpending.isPending}
                      >
                        {updateSpending.isPending ? '...' : 'Save'}
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={handleCancelEdit}
                        disabled={updateSpending.isPending}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
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
                  <div className="flex gap-1">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleStartEdit(entry)}
                      disabled={editingEntry !== null}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleteSpending.isPending}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
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
