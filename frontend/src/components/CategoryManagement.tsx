import { useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/useCategories';
import { ApiError } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { Category, CategoryInUseError } from '../types';

const DEFAULT_COLOR = '#6b7280';

interface DeleteTarget {
  category: Category;
  usage: CategoryInUseError;
}

export function CategoryManagement() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { showToast } = useToast();

  // Add form state
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [newDescription, setNewDescription] = useState('');

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(DEFAULT_COLOR);
  const [editDescription, setEditDescription] = useState('');

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    createCategory.mutate(
      {
        name: newName.trim(),
        color: newColor,
        description: newDescription.trim() || null,
      },
      {
        onSuccess: () => {
          setNewName('');
          setNewColor(DEFAULT_COLOR);
          setNewDescription('');
          showToast('Category created', 'success');
        },
        onError: (error) => {
          showToast(
            error instanceof Error ? error.message : 'Failed to create category',
            'error'
          );
        },
      }
    );
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
    setEditDescription(category.description ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: number) => {
    if (!editName.trim()) return;

    updateCategory.mutate(
      {
        id,
        data: {
          name: editName.trim(),
          color: editColor,
          description: editDescription.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          showToast('Category updated', 'success');
        },
        onError: (error) => {
          showToast(
            error instanceof Error ? error.message : 'Failed to update category',
            'error'
          );
        },
      }
    );
  };

  const handleDelete = (category: Category, force: boolean) => {
    deleteCategory.mutate(
      { id: category.id, force },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          showToast(
            force
              ? `Deleted "${category.name}" and uncategorized affected items`
              : `Category "${category.name}" deleted`,
            'success'
          );
        },
        onError: (error) => {
          if (
            error instanceof ApiError &&
            error.status === 409 &&
            isInUseError(error.body)
          ) {
            setDeleteTarget({ category, usage: error.body });
            return;
          }
          showToast(
            error instanceof Error ? error.message : 'Failed to delete category',
            'error'
          );
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <span className="loading loading-spinner"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories && categories.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th className="w-16">Color</th>
                <th>Name</th>
                <th>Description</th>
                <th className="w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) =>
                editingId === category.id ? (
                  <tr key={category.id}>
                    <td>
                      <input
                        type="color"
                        className="w-10 h-8 rounded cursor-pointer border border-base-300"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Optional"
                      />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => saveEdit(category.id)}
                          disabled={updateCategory.isPending}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={cancelEdit}
                          disabled={updateCategory.isPending}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={category.id}>
                    <td>
                      <div
                        className="w-8 h-8 rounded border border-base-300"
                        style={{ backgroundColor: category.color }}
                        title={category.color}
                      />
                    </td>
                    <td className="font-medium">{category.name}</td>
                    <td className="text-base-content/70">
                      {category.description || '-'}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => startEdit(category)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDelete(category, false)}
                          disabled={deleteCategory.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-base-content/60">
          No categories yet. Add one below.
        </div>
      )}

      <div className="divider"></div>

      {/* Add form */}
      <h3 className="font-semibold">Add Category</h3>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="label py-1">
            <span className="label-text">Color</span>
          </label>
          <input
            type="color"
            className="w-12 h-8 rounded cursor-pointer border border-base-300"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="label py-1">
            <span className="label-text">Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Groceries"
            required
            maxLength={100}
          />
        </div>

        <div className="flex flex-col flex-1 min-w-48">
          <label className="label py-1">
            <span className="label-text">Description</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Optional"
            maxLength={255}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={createCategory.isPending}
        >
          {createCategory.isPending ? 'Adding...' : 'Add Category'}
        </button>
      </form>

      {/* Delete confirmation modal — opens only when delete returned 409 */}
      {deleteTarget && (
        <DeleteConfirmModal
          target={deleteTarget}
          isPending={deleteCategory.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.category, true)}
        />
      )}
    </div>
  );
}

interface DeleteConfirmModalProps {
  target: DeleteTarget;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({
  target,
  isPending,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const { category, usage } = target;
  const usageParts: string[] = [];
  if (usage.bill_templates > 0) {
    usageParts.push(
      `${usage.bill_templates} bill template${usage.bill_templates === 1 ? '' : 's'}`
    );
  }
  if (usage.spending_entries > 0) {
    usageParts.push(
      `${usage.spending_entries} spending entr${usage.spending_entries === 1 ? 'y' : 'ies'}`
    );
  }
  const usageText = usageParts.join(' and ');

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Category in use</h3>
        <p className="py-2">
          <span className="font-semibold">{category.name}</span> is currently used by{' '}
          {usageText}.
        </p>
        <div className="alert alert-warning text-sm">
          <span>
            Deleting it will leave those items <strong>uncategorized</strong>. They
            will not be deleted, just unlinked. This cannot be undone.
          </span>
        </div>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </button>
          <button className="btn btn-error" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete anyway'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onCancel}></div>
    </div>
  );
}

function isInUseError(body: unknown): body is CategoryInUseError {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    (body as { error: unknown }).error === 'in_use'
  );
}
