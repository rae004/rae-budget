import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import {
  IncomeExpensesTooltip,
  IncomeVsExpensesChart,
} from './IncomeVsExpensesChart';
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

describe('IncomeExpensesTooltip', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(
      <IncomeExpensesTooltip active={false} label="Apr" payload={[{ payload: data[0] }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there is no payload', () => {
    const { container } = render(
      <IncomeExpensesTooltip active label="Apr" payload={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows income, the bills/discretionary breakdown, and total expenses with matching swatches', () => {
    const { container } = render(
      <IncomeExpensesTooltip
        active
        label="Apr 6 - Apr 19, 2026"
        payload={[{ payload: data[0] }]}
      />,
    );
    expect(screen.getByText('Apr 6 - Apr 19, 2026')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('$2500.00')).toBeInTheDocument();
    expect(screen.getByText('Discretionary')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('Bills')).toBeInTheDocument();
    expect(screen.getByText('$1500.00')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    const totalEl = screen.getByText('$1650.00');
    expect(totalEl).toHaveClass('text-success');
    expect(totalEl).not.toHaveClass('text-error');

    const swatches = container.querySelectorAll<HTMLElement>('.rounded-sm');
    expect(swatches).toHaveLength(3);
    expect(swatches[0].style.backgroundColor).toBe('rgb(34, 197, 94)'); // income #22c55e
    expect(swatches[1].style.backgroundColor).toBe('rgb(59, 130, 246)'); // discretionary #3b82f6
    expect(swatches[2].style.backgroundColor).toBe('rgb(239, 68, 68)'); // bills #ef4444
  });

  it('colors total expenses red when expenses exceed income', () => {
    const overspendBucket: InsightsIncomeVsExpensesBucket = {
      periodId: 3,
      label: 'May 6 - May 19, 2026',
      bills: 1500,
      spending: 1200,
      income: 2500,
    };
    render(
      <IncomeExpensesTooltip
        active
        label="May 6 - May 19, 2026"
        payload={[{ payload: overspendBucket }]}
      />,
    );
    const totalEl = screen.getByText('$2700.00');
    expect(totalEl).toHaveClass('text-error');
    expect(totalEl).not.toHaveClass('text-success');
  });
});
