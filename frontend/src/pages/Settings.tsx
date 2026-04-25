import { CategoryManagement } from '../components/CategoryManagement';
import { DataManagement } from '../components/DataManagement';

export function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Categories Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Categories</h2>
          <p className="text-base-content/70">
            Categories help organize your bills and spending. Add, edit, or remove
            them as your needs change.
          </p>
          <CategoryManagement />
        </div>
      </div>

      {/* Data Management Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Data Management</h2>
          <p className="text-base-content/70 mb-4">
            Export your data for backup, import previously exported data, or reset all data.
          </p>
          <DataManagement />
        </div>
      </div>

      {/* About Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">About Rae Budget</h2>
          <p className="text-base-content/70">
            A personal budget tracking application for managing pay periods, bills, and spending.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>Version:</strong> 0.1.0</p>
            <p><strong>Stack:</strong> React 19, TypeScript, TailwindCSS, DaisyUI</p>
            <p><strong>Backend:</strong> Flask, PostgreSQL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
