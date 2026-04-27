import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { BillsVsDiscretionaryChart } from './BillsVsDiscretionaryChart';
import type { InsightsBillsVsDiscretionaryBucket } from '../../hooks/useInsights';

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

const data: InsightsBillsVsDiscretionaryBucket[] = [
  {
    periodId: 1,
    label: 'Apr 6 - Apr 19, 2026',
    bills: 1500,
    spending: 150,
  },
  {
    periodId: 2,
    label: 'Apr 20 - May 5, 2026',
    bills: 1500,
    spending: 200,
  },
];

describe('BillsVsDiscretionaryChart', () => {
  it('renders empty state when no data', () => {
    render(<BillsVsDiscretionaryChart data={[]} />);
    expect(
      screen.getByText(/No pay periods in the selected range/),
    ).toBeInTheDocument();
  });

  it('renders the chart card with title when data is present', () => {
    render(<BillsVsDiscretionaryChart data={data} />);
    expect(
      screen.getByRole('heading', { name: 'Bills vs Discretionary' }),
    ).toBeInTheDocument();
  });

  it('renders two Recharts line series', () => {
    const { container } = render(<BillsVsDiscretionaryChart data={data} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-line').length).toBe(2);
  });
});
