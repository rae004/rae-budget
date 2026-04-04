import { useCategories } from '../hooks/useCategories';

export function Settings() {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Categories Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Categories</h2>
          <p className="text-base-content/70">
            Categories help organize your spending. These are pre-configured and used for future analytics.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner"></span>
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="badge badge-lg gap-2"
                  style={{ backgroundColor: category.color, color: 'white' }}
                >
                  {category.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-base-content/60">No categories found.</div>
          )}
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
