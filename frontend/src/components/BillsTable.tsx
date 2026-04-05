import { useState } from 'react';
import { useDeleteBill, useUpdateBill } from '../hooks/useBills';
import { useToast } from '../contexts/ToastContext';
import type { PayPeriodBill } from '../types';

interface BillsTableProps {
  bills: PayPeriodBill[];
  payPeriodId: number;
}

interface EditingBill {
  id: number;
  name: string;
  amount: string;
  due_date: string;
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(parseFloat(value));
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function BillsTable({ bills, payPeriodId }: BillsTableProps) {
  const [editingBill, setEditingBill] = useState<EditingBill | null>(null);
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();
  const { showToast } = useToast();

  const handleTogglePaid = (bill: PayPeriodBill) => {
    const today = new Date().toISOString().split('T')[0];
    const newPaidStatus = !bill.is_paid;
    updateBill.mutate(
      {
        billId: bill.id,
        payPeriodId,
        data: {
          is_paid: newPaidStatus,
          paid_date: newPaidStatus ? today : null,
        },
      },
      {
        onSuccess: () => {
          showToast(newPaidStatus ? 'Bill marked as paid' : 'Bill marked as unpaid', 'success');
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to update bill', 'error');
        },
      }
    );
  };

  const handleStartEdit = (bill: PayPeriodBill) => {
    setEditingBill({
      id: bill.id,
      name: bill.name,
      amount: bill.amount,
      due_date: bill.due_date || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingBill(null);
  };

  const handleSaveEdit = () => {
    if (!editingBill) return;

    updateBill.mutate(
      {
        billId: editingBill.id,
        payPeriodId,
        data: {
          name: editingBill.name,
          amount: parseFloat(editingBill.amount),
          due_date: editingBill.due_date || null,
        },
      },
      {
        onSuccess: () => {
          showToast('Bill updated', 'success');
          setEditingBill(null);
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to update bill', 'error');
        },
      }
    );
  };

  const handleDelete = (billId: number) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      deleteBill.mutate(
        { billId, payPeriodId },
        {
          onSuccess: () => {
            showToast('Bill deleted', 'success');
          },
          onError: (error) => {
            showToast(error instanceof Error ? error.message : 'Failed to delete bill', 'error');
          },
        }
      );
    }
  };

  if (bills.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        No bills for this pay period. Add one below.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Paid</th>
            <th>Name</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Paid Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => {
            const isEditing = editingBill?.id === bill.id;

            if (isEditing) {
              return (
                <tr key={bill.id} className="bg-base-200">
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-success"
                      checked={bill.is_paid}
                      disabled
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full"
                      value={editingBill.name}
                      onChange={(e) =>
                        setEditingBill({ ...editingBill, name: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input input-bordered input-sm w-24"
                      value={editingBill.amount}
                      onChange={(e) =>
                        setEditingBill({ ...editingBill, amount: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="input input-bordered input-sm"
                      value={editingBill.due_date}
                      onChange={(e) =>
                        setEditingBill({ ...editingBill, due_date: e.target.value })
                      }
                    />
                  </td>
                  <td>{formatDate(bill.paid_date)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-success btn-xs"
                        onClick={handleSaveEdit}
                        disabled={updateBill.isPending}
                      >
                        {updateBill.isPending ? '...' : 'Save'}
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={handleCancelEdit}
                        disabled={updateBill.isPending}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={bill.id} className={bill.is_paid ? 'opacity-60' : ''}>
                <td>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-success"
                    checked={bill.is_paid}
                    onChange={() => handleTogglePaid(bill)}
                    disabled={updateBill.isPending}
                  />
                </td>
                <td className={bill.is_paid ? 'line-through' : ''}>
                  {bill.name}
                </td>
                <td>{formatCurrency(bill.amount)}</td>
                <td>{formatDate(bill.due_date)}</td>
                <td>{formatDate(bill.paid_date)}</td>
                <td>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleStartEdit(bill)}
                      disabled={editingBill !== null}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => handleDelete(bill.id)}
                      disabled={deleteBill.isPending}
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
            <td colSpan={2} className="font-bold">Total</td>
            <td className="font-bold">
              {formatCurrency(
                bills.reduce((sum, b) => sum + parseFloat(b.amount), 0).toFixed(2)
              )}
            </td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
