import { useState } from 'react';
import {
  useBillTemplates,
  useCreateBillTemplate,
  useDeleteBillTemplate,
} from '../hooks/useBillTemplates';
import { useToast } from '../contexts/ToastContext';

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(parseFloat(value));
}

export function BillTemplates() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');

  const { data: templates, isLoading } = useBillTemplates();
  const createTemplate = useCreateBillTemplate();
  const deleteTemplate = useDeleteBillTemplate();
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !amount) return;

    createTemplate.mutate(
      {
        name,
        default_amount: parseFloat(amount),
        due_day_of_month: dueDay ? parseInt(dueDay) : undefined,
        is_recurring: true,
      },
      {
        onSuccess: () => {
          setName('');
          setAmount('');
          setDueDay('');
          showToast('Bill template created', 'success');
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to create template', 'error');
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate.mutate(id, {
        onSuccess: () => {
          showToast('Template deleted', 'success');
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to delete template', 'error');
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bill Templates</h1>
      <p className="text-base-content/70">
        Create templates for recurring bills. These will appear as quick options when adding bills to a pay period.
      </p>

      {/* Templates List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {templates && templates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Default Amount</th>
                    <th>Due Day</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td>{template.name}</td>
                      <td>{formatCurrency(template.default_amount)}</td>
                      <td>
                        {template.due_day_of_month
                          ? `${template.due_day_of_month}${getOrdinalSuffix(template.due_day_of_month)}`
                          : '-'}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDelete(template.id)}
                          disabled={deleteTemplate.isPending}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/60">
              No bill templates yet. Create one below.
            </div>
          )}

          <div className="divider"></div>

          {/* Add Template Form */}
          <h3 className="font-semibold">Add New Template</h3>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Rent, Electric"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Default Amount</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input input-bordered input-sm w-32"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Due Day (optional)</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                className="input input-bordered input-sm w-20"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="1-31"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={createTemplate.isPending}
            >
              {createTemplate.isPending ? 'Adding...' : 'Add Template'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
