import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { IncomeVsExpensesChart } from './IncomeVsExpensesChart';
import type { InsightsIncomeVsExpensesBucket } from '../../hooks/useInsights';

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

const data: InsightsIncomeVsExpensesBucket[] = [
  {
    periodId: 1,
    label: 'Apr 6 - Apr 19, 2026',
    bills: 1500,
    spending: 150,
    income: 2500,
  },
  {
    periodId: 2,
    label: 'Apr 20 - May 5, 2026',
    bills: 1500,
    spending: 200,
    income: 2500,
  },
];

describe('IncomeVsExpensesChart', () => {
  it('renders empty state when no data', () => {
    render(<IncomeVsExpensesChart data={[]} />);
    expect(
      screen.getByText(/No pay periods in the selected range/),
    ).toBeInTheDocument();
  });

  it('renders the chart card with title when data is present', () => {
    render(<IncomeVsExpensesChart data={data} />);
    expect(
      screen.getByRole('heading', { name: 'Income vs Expenses' }),
    ).toBeInTheDocument();
  });

  it('renders bills and spending as stacked bars, income as a line', () => {
    const { container } = render(<IncomeVsExpensesChart data={data} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-bar').length).toBe(2);
    expect(container.querySelectorAll('.recharts-line').length).toBe(1);
  });
});
