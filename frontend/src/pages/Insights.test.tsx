import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { Insights } from './Insights';
import { api } from '../services/api';
import type {
  Category,
  PayPeriod,
  PayPeriodBill,
  SpendingEntry,
} from '../types';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

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
];

const periods: PayPeriod[] = [
  makePeriod(1, '2026-04-06', '2026-04-19'),
  makePeriod(2, '2026-04-20', '2026-05-05'),
];

const spending: SpendingEntry[] = [
  makeEntry(101, 1, 10, '100.00'),
  makeEntry(102, 2, 10, '200.00'),
];

const bills: PayPeriodBill[] = [makeBill(201, 1, '1500.00')];

function makePeriod(id: number, start: string, end: string): PayPeriod {
  return {
    id,
    start_date: start,
    end_date: end,
    expected_income: '2500.00',
    actual_income: null,
    additional_income: null,
    additional_income_description: null,
    notes: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };
}

function makeEntry(
  id: number,
  payPeriodId: number,
  categoryId: number | null,
  amount: string,
): SpendingEntry {
  return {
    id,
    pay_period_id: payPeriodId,
    category_id: categoryId,
    description: 'test',
    amount,
    spent_date: '2026-04-08',
    notes: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };
}

function makeBill(
  id: number,
  payPeriodId: number,
  amount: string,
): PayPeriodBill {
  return {
    id,
    pay_period_id: payPeriodId,
    bill_template_id: null,
    name: 'Rent',
    amount,
    due_date: null,
    is_paid: false,
    paid_date: null,
    notes: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };
}

function setupApiMock() {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/pay-periods') return Promise.resolve(periods);
    if (url === '/categories') return Promise.resolve(categories);
    if (url === '/bills') return Promise.resolve(bills);
    if (url === '/spending') return Promise.resolve(spending);
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('Insights page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupApiMock();
  });

  it('renders the page heading and toolbar', async () => {
    render(<Insights />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'Insights' })).toBeInTheDocument();
    expect(screen.getByLabelText('Range')).toBeInTheDocument();
  });

  it('shows summary counts after data loads', async () => {
    render(<Insights />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('insights-period-count')).toHaveTextContent(
        '2',
      );
    });
    expect(screen.getByTestId('insights-category-count')).toHaveTextContent(
      '1',
    );
    // 100 + 200 + 1500 = 1800
    expect(screen.getByTestId('insights-grand-total')).toHaveTextContent(
      '$1800.00',
    );
  });

  it('updates the grand total when toggling Include to Bills only', async () => {
    render(<Insights />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('insights-grand-total')).toHaveTextContent(
        '$1800.00',
      );
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Bills' }));

    await waitFor(() => {
      expect(screen.getByTestId('insights-grand-total')).toHaveTextContent(
        '$1500.00',
      );
    });
  });
});
