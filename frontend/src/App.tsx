import { useQuery } from "@tanstack/react-query";

interface HealthStatus {
  status: string;
  database: string;
}

function App() {
  const { data: health, isLoading, error } = useQuery<HealthStatus>({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await fetch("/api/health");
      if (!response.ok) {
        throw new Error("Failed to fetch health status");
      }
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <span className="text-xl font-bold px-4">Rae Budget</span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Welcome to Rae Budget</h2>
            <p>Your personal budget tracking application.</p>

            <div className="divider"></div>

            <h3 className="font-semibold">API Status</h3>
            {isLoading && (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Checking API health...</span>
              </div>
            )}
            {error && (
              <div className="alert alert-error">
                <span>Failed to connect to API</span>
              </div>
            )}
            {health && (
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">API Status</div>
                  <div className={`stat-value text-${health.status === "healthy" ? "success" : "warning"}`}>
                    {health.status}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Database</div>
                  <div className={`stat-value text-${health.database === "connected" ? "success" : "error"}`}>
                    {health.database}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
