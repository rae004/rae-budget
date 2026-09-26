import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { IncomeOverTimeChart, IncomeTooltip } from './IncomeOverTimeChart';
import type { InsightsIncomeBucket } from '../../hooks/useInsights';

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

const buckets: InsightsIncomeBucket[] = [
  {
    periodId: 1,
    label: 'Apr 6 - Apr 19, 2026',
    income: 4027.22,
    baseIncome: 4027.22,
    additionalIncome: 0,
  },
  {
    periodId: 2,
    label: 'Apr 20 - May 5, 2026',
    income: 7088.22,
    baseIncome: 4027.22,
    additionalIncome: 3061,
  },
];

describe('IncomeOverTimeChart', () => {
  it('renders the empty state when no data', () => {
    render(<IncomeOverTimeChart data={[]} />);
    expect(
      screen.getByText(/No pay periods in the selected range/),
    ).toBeInTheDocument();
  });

  it('renders the chart card with title when data is present', () => {
    render(<IncomeOverTimeChart data={buckets} />);
    expect(
      screen.getByRole('heading', { name: 'Income Over Time' }),
    ).toBeInTheDocument();
  });

  it('renders a Recharts area SVG when data is present', () => {
    const { container } = render(<IncomeOverTimeChart data={buckets} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('.recharts-area')).toBeInTheDocument();
  });
});

describe('IncomeTooltip', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(
      <IncomeTooltip active={false} label="Apr" payload={[{ payload: buckets[0] }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there is no payload', () => {
    const { container } = render(
      <IncomeTooltip active label="Apr" payload={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('hides the additional row when there is no additional income', () => {
    render(
      <IncomeTooltip
        active
        label="Apr 6 - Apr 19"
        payload={[{ payload: buckets[0] }]}
      />,
    );
    expect(screen.getByText('Apr 6 - Apr 19')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.queryByText('Additional')).not.toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getAllByText('$4027.22')).toHaveLength(2);
  });

  it('shows the additional row and total when additional income is present', () => {
    render(
      <IncomeTooltip
        active
        label="Apr 20 - May 5"
        payload={[{ payload: buckets[1] }]}
      />,
    );
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('$4027.22')).toBeInTheDocument();
    expect(screen.getByText('Additional')).toBeInTheDocument();
    expect(screen.getByText('$3061.00')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$7088.22')).toBeInTheDocument();
  });
});
