import type { ReactNode } from 'react';

export function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-base-content/60">
      {message}
    </div>
  );
}
