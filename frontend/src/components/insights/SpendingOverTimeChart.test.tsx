import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { SpendingOverTimeChart } from './SpendingOverTimeChart';
import type { InsightsPeriodBucket } from '../../hooks/useInsights';

vi.mock('recharts', async (importActual) => {
  const actual = await importActual<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({
      children,
    }: {
      children: ReactElement<{ width?: number; height?: number }>;
    }) => cloneElement(children, { width: 600, height: 300 }),
  };
});

const buckets: InsightsPeriodBucket[] = [
  { periodId: 1, label: 'Apr 6 - Apr 19, 2026', total: 100 },
  { periodId: 2, label: 'Apr 20 - May 5, 2026', total: 250 },
];

describe('SpendingOverTimeChart', () => {
  it('renders the empty state when no data', () => {
    render(<SpendingOverTimeChart data={[]} />);
    expect(
      screen.getByText(/No pay periods in the selected range/),
    ).toBeInTheDocument();
  });

  it('renders the chart card with title when data is present', () => {
    render(<SpendingOverTimeChart data={buckets} />);
    expect(
      screen.getByRole('heading', { name: 'Spending Over Time' }),
    ).toBeInTheDocument();
  });

  it('renders a Recharts area SVG when data is present', () => {
    const { container } = render(<SpendingOverTimeChart data={buckets} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('.recharts-area')).toBeInTheDocument();
  });
});
