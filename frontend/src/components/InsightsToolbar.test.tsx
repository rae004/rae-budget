import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { InsightsToolbar } from './InsightsToolbar';
import type { Category } from '../types';
import type { InsightsFilter } from '../hooks/useInsights';

const categories: Category[] = [
  {
    id: 10,
    name: 'Food',
    description: null,
    color: '#f59e0b',
    monthly_target: '500.00',
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 20,
    name: 'Travel',
    description: null,
    color: '#3b82f6',
    monthly_target: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
];

const defaultFilter: InsightsFilter = {
  rangeMode: 'last-n',
  n: 6,
  include: 'both',
  categoryIds: [],
};

describe('InsightsToolbar', () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it('selects the matching range preset on render', () => {
    render(
      <InsightsToolbar
        filter={defaultFilter}
        onChange={onChange}
        categories={categories}
      />,
    );
    const select = screen.getByLabelText('Range') as HTMLSelectElement;
    expect(select.value).toBe('last-n:6');
  });

  it('emits a new filter when changing the range preset', () => {
    render(
      <InsightsToolbar
        filter={defaultFilter}
        onChange={onChange}
        categories={categories}
      />,
    );
    fireEvent.change(screen.getByLabelText('Range'), {
      target: { value: 'last-n:3' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ rangeMode: 'last-n', n: 3 }),
    );
  });

  it('shows custom date pickers when Custom range is selected', () => {
    render(
      <InsightsToolbar
        filter={{ ...defaultFilter, rangeMode: 'custom' }}
        onChange={onChange}
        categories={categories}
      />,
    );
    expect(screen.getByLabelText('From date')).toBeInTheDocument();
    expect(screen.getByLabelText('To date')).toBeInTheDocument();
  });

  it('does not show date pickers for non-custom ranges', () => {
    render(
      <InsightsToolbar
        filter={defaultFilter}
        onChange={onChange}
        categories={categories}
      />,
    );
    expect(screen.queryByLabelText('From date')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('To date')).not.toBeInTheDocument();
  });

  it('toggling a category checkbox emits the new selection', () => {
    render(
      <InsightsToolbar
        filter={defaultFilter}
        onChange={onChange}
        categories={categories}
      />,
    );
    const foodCheckbox = screen.getByLabelText(/Food/) as HTMLInputElement;
    fireEvent.click(foodCheckbox);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ categoryIds: [10] }),
    );
  });

  it('shows selected category count in the dropdown trigger', () => {
    render(
      <InsightsToolbar
        filter={{ ...defaultFilter, categoryIds: [10, 20] }}
        onChange={onChange}
        categories={categories}
      />,
    );
    expect(screen.getByLabelText('Categories filter')).toHaveTextContent(
      '2 categories',
    );
  });

  it('emits min/max amount changes', () => {
    render(
      <InsightsToolbar
        filter={defaultFilter}
        onChange={onChange}
        categories={categories}
      />,
    );
    fireEvent.change(screen.getByLabelText('Minimum amount'), {
      target: { value: '20' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ minAmount: 20 }),
    );
    fireEvent.change(screen.getByLabelText('Maximum amount'), {
      target: { value: '100' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ maxAmount: 100 }),
    );
  });

  it('clears amount when input is emptied', () => {
    render(
      <InsightsToolbar
        filter={{ ...defaultFilter, minAmount: 20 }}
        onChange={onChange}
        categories={categories}
      />,
    );
    fireEvent.change(screen.getByLabelText('Minimum amount'), {
      target: { value: '' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ minAmount: undefined }),
    );
  });

  it('include toggle switches between Bills, Spending, Both', () => {
    render(
      <InsightsToolbar
        filter={defaultFilter}
        onChange={onChange}
        categories={categories}
      />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Include' });
    fireEvent.click(within(group).getByRole('radio', { name: 'Bills' }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ include: 'bills' }),
    );
    fireEvent.click(within(group).getByRole('radio', { name: 'Spending' }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ include: 'spending' }),
    );
  });

  it('shows "No categories yet" when none exist', () => {
    render(
      <InsightsToolbar
        filter={defaultFilter}
        onChange={onChange}
        categories={[]}
      />,
    );
    expect(screen.getByText(/No categories yet/)).toBeInTheDocument();
  });
});
