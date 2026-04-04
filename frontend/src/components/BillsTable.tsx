import { useDeleteBill, useUpdateBill } from '../hooks/useBills';
import type { PayPeriodBill } from '../types';

interface BillsTableProps {
  bills: PayPeriodBill[];
  payPeriodId: number;
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
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();

  const handleTogglePaid = (bill: PayPeriodBill) => {
    const today = new Date().toISOString().split('T')[0];
    updateBill.mutate({
      billId: bill.id,
      payPeriodId,
      data: {
        is_paid: !bill.is_paid,
        paid_date: !bill.is_paid ? today : null,
      },
    });
  };

  const handleDelete = (billId: number) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      deleteBill.mutate({ billId, payPeriodId });
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
          {bills.map((bill) => (
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
                <button
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => handleDelete(bill.id)}
                  disabled={deleteBill.isPending}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
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
