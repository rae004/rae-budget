import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import {
  CategoryTrendChart,
  CategoryTrendTooltip,
} from './CategoryTrendChart';
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

describe('CategoryTrendTooltip', () => {
  const rows = [
    { key: '10', name: 'Food', color: '#f59e0b', value: 100 },
    { key: '20', name: 'Travel', color: '#3b82f6', value: 50.5 },
  ];

  it('renders nothing when inactive', () => {
    const { container } = render(
      <CategoryTrendTooltip active={false} label="Apr" rows={rows} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there are no rows', () => {
    const { container } = render(
      <CategoryTrendTooltip active label="Apr" rows={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each category with a totals row', () => {
    render(<CategoryTrendTooltip active label="Apr 6 - Apr 19" rows={rows} />);
    expect(screen.getByText('Apr 6 - Apr 19')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('Travel')).toBeInTheDocument();
    expect(screen.getByText('$50.50')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$150.50')).toBeInTheDocument();
  });

  it('sorts rows highest value first', () => {
    const unsorted = [
      { key: '1', name: 'Small', color: '#111', value: 5 },
      { key: '2', name: 'Big', color: '#222', value: 500 },
      { key: '3', name: 'Mid', color: '#333', value: 50 },
    ];
    render(<CategoryTrendTooltip active label="Apr" rows={unsorted} />);
    const names = screen
      .getAllByText(/^(Small|Big|Mid)$/)
      .map((el) => el.textContent);
    expect(names).toEqual(['Big', 'Mid', 'Small']);
  });

  it('fills column-major with balanced rows when there are many categories', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      key: String(i),
      name: `Cat ${i}`,
      color: '#888888',
      value: i + 1,
    }));
    const { container } = render(
      <CategoryTrendTooltip active label="Apr" rows={many} />,
    );
    const grid = container.querySelector<HTMLElement>('.grid-flow-col');
    expect(grid).toBeInTheDocument();
    // 12 rows → 6 per column, so the grid declares 6 template rows
    expect(grid?.style.gridTemplateRows).toBe('repeat(6, minmax(0, auto))');
  });
});
