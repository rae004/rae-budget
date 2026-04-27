import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { CategoryTrendChart } from './CategoryTrendChart';
import type {
  InsightsCategoryBucket,
  InsightsCategoryTrendBucket,
} from '../../hooks/useInsights';

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

const byCategory: InsightsCategoryBucket[] = [
  { categoryId: 10, name: 'Food', color: '#f59e0b', total: 300, target: 500 },
  { categoryId: 20, name: 'Travel', color: '#3b82f6', total: 50, target: null },
];

const trend: InsightsCategoryTrendBucket[] = [
  {
    periodId: 1,
    label: 'Apr 6 - Apr 19, 2026',
    perCategory: { '10': 100, '20': 50 },
  },
  {
    periodId: 2,
    label: 'Apr 20 - May 5, 2026',
    perCategory: { '10': 200 },
  },
];

describe('CategoryTrendChart', () => {
  it('renders empty state when no trend data', () => {
    render(<CategoryTrendChart data={[]} byCategory={byCategory} />);
    expect(
      screen.getByText(/No spending in the selected range/),
    ).toBeInTheDocument();
  });

  it('renders empty state when no categories', () => {
    render(<CategoryTrendChart data={trend} byCategory={[]} />);
    expect(
      screen.getByText(/No spending in the selected range/),
    ).toBeInTheDocument();
  });

  it('renders the chart card with title when data is present', () => {
    render(<CategoryTrendChart data={trend} byCategory={byCategory} />);
    expect(
      screen.getByRole('heading', { name: 'Category Trend' }),
    ).toBeInTheDocument();
  });

  it('renders Recharts bars and a reference line for categories with targets', () => {
    const { container } = render(
      <CategoryTrendChart data={trend} byCategory={byCategory} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    // One stacked bar per period; multiple .recharts-bar groups expected
    expect(container.querySelectorAll('.recharts-bar').length).toBeGreaterThan(
      0,
    );
    // Food has a target → reference line present
    expect(
      container.querySelector('.recharts-reference-line'),
    ).toBeInTheDocument();
  });

  it('does not render any reference line when no category has a target', () => {
    const noTargets: InsightsCategoryBucket[] = byCategory.map((b) => ({
      ...b,
      target: null,
    }));
    const { container } = render(
      <CategoryTrendChart data={trend} byCategory={noTargets} />,
    );
    expect(
      container.querySelector('.recharts-reference-line'),
    ).not.toBeInTheDocument();
  });
});
