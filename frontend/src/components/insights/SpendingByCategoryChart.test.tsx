import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { SpendingByCategoryChart } from './SpendingByCategoryChart';
import type { InsightsCategoryBucket } from '../../hooks/useInsights';

// jsdom doesn't compute layout, so ResponsiveContainer can't size its child.
// Bypass it: clone the wrapped chart with explicit width/height so Recharts
// has dimensions to render against.
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

const buckets: InsightsCategoryBucket[] = [
  {
    categoryId: 10,
    name: 'Food',
    color: '#f59e0b',
    total: 300,
    target: 500,
  },
  {
    categoryId: 20,
    name: 'Travel',
    color: '#3b82f6',
    total: 50,
    target: null,
  },
];

describe('SpendingByCategoryChart', () => {
  it('renders the empty state when no data', () => {
    render(<SpendingByCategoryChart data={[]} grandTotal={0} />);
    expect(screen.getByText(/No spending in the selected range/)).toBeInTheDocument();
  });

  it('renders the chart card with title when data is present', () => {
    render(<SpendingByCategoryChart data={buckets} grandTotal={350} />);
    expect(
      screen.getByRole('heading', { name: 'Spending by Category' }),
    ).toBeInTheDocument();
  });

  it('renders a Recharts pie SVG when data is present', () => {
    const { container } = render(
      <SpendingByCategoryChart data={buckets} grandTotal={350} />,
    );
    // jsdom doesn't compute layout, so legend/tooltip text is absent — but the
    // SVG container and pie group are emitted. That's enough to prove the
    // component wired Recharts correctly.
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });
});
