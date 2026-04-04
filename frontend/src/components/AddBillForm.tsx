import { useState } from 'react';
import { useCreateBill } from '../hooks/useBills';
import { useBillTemplates } from '../hooks/useBillTemplates';
import { useToast } from '../contexts/ToastContext';

interface AddBillFormProps {
  payPeriodId: number;
}

export function AddBillForm({ payPeriodId }: AddBillFormProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const createBill = useCreateBill();
  const { data: templates } = useBillTemplates();
  const { showToast } = useToast();

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId && templates) {
      const template = templates.find((t) => t.id === parseInt(templateId));
      if (template) {
        setName(template.name);
        setAmount(template.default_amount);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !amount) return;

    createBill.mutate(
      {
        payPeriodId,
        data: {
          name,
          amount: parseFloat(amount),
          due_date: dueDate || undefined,
          bill_template_id: selectedTemplate ? parseInt(selectedTemplate) : undefined,
        },
      },
      {
        onSuccess: () => {
          setName('');
          setAmount('');
          setDueDate('');
          setSelectedTemplate('');
          showToast('Bill added successfully', 'success');
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to add bill', 'error');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
      {templates && templates.length > 0 && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Template</span>
          </label>
          <select
            className="select select-bordered select-sm"
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            <option value="">Custom</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-control">
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bill name"
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
          <span className="label-text">Due Date</span>
        </label>
        <input
          type="date"
          className="input input-bordered input-sm"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-sm"
        disabled={createBill.isPending}
      >
        {createBill.isPending ? 'Adding...' : 'Add Bill'}
      </button>
    </form>
  );
}
