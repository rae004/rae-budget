import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useInsights, type InsightsFilter } from './useInsights';
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

const mockCategories: Category[] = [
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

// Six pay periods, oldest to newest. start_date is what filterPeriods sorts on.
const mockPayPeriods: PayPeriod[] = [
  makePeriod(1, '2025-12-06', '2025-12-19'),
  makePeriod(2, '2025-12-20', '2026-01-05'),
  makePeriod(3, '2026-02-06', '2026-02-19'),
  makePeriod(4, '2026-03-06', '2026-03-19'),
  makePeriod(5, '2026-04-06', '2026-04-19'),
  makePeriod(6, '2026-04-20', '2026-05-05'),
];

const mockSpending: SpendingEntry[] = [
  // Period 5 (Apr 6–19): 100 Food + 50 Travel
  makeEntry(101, 5, 10, '100.00', '2026-04-08'),
  makeEntry(102, 5, 20, '50.00', '2026-04-10'),
  // Period 6 (Apr 20–May 5): 200 Food + 30 uncategorized
  makeEntry(103, 6, 10, '200.00', '2026-04-22'),
  makeEntry(104, 6, null, '30.00', '2026-04-25'),
  // Period 1 (Dec 2025): 75 Food (out of last-6 default range when others present)
  makeEntry(105, 1, 10, '75.00', '2025-12-08'),
];

const mockBills: PayPeriodBill[] = [
  makeBill(201, 5, '1500.00'),
  makeBill(202, 6, '1500.00'),
  makeBill(203, 1, '1400.00'),
];

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
  spentDate: string,
): SpendingEntry {
  return {
    id,
    pay_period_id: payPeriodId,
    category_id: categoryId,
    description: 'test',
    amount,
    spent_date: spentDate,
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
    if (url === '/pay-periods') return Promise.resolve(mockPayPeriods);
    if (url === '/categories') return Promise.resolve(mockCategories);
    if (url === '/bills') return Promise.resolve(mockBills);
    if (url === '/spending') return Promise.resolve(mockSpending);
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

async function renderInsights(filter: InsightsFilter) {
  setupApiMock();
  const { result } = renderHook(() => useInsights(filter), {
    wrapper: createWrapper(),
  });
  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
  return result;
}

describe('useInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('range filtering', () => {
    it("last-n: 6 returns the 6 most recent periods sorted oldest→newest", async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 6,
        include: 'both',
      });
      const ids = result.current.data!.periods.map((p) => p.id);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('last-n: 3 trims to the 3 most recent periods', async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 3,
        include: 'both',
      });
      const ids = result.current.data!.periods.map((p) => p.id);
      expect(ids).toEqual([4, 5, 6]);
    });

    it('custom range filters by start_date inclusive', async () => {
      const result = await renderInsights({
        rangeMode: 'custom',
        fromDate: '2026-03-01',
        toDate: '2026-04-19',
        include: 'both',
      });
      const ids = result.current.data!.periods.map((p) => p.id);
      expect(ids).toEqual([4, 5]);
    });
  });

  describe('byCategory aggregation (spending only)', () => {
    it('groups spending by category, sorted by total desc', async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 3,
        include: 'both',
      });
      const buckets = result.current.data!.byCategory;
      // Periods 4, 5, 6: Food = 100+200=300; Travel = 50; Uncategorized = 30
      expect(buckets.map((b) => [b.name, b.total])).toEqual([
        ['Food', 300],
        ['Travel', 50],
        [UNCATEGORIZED, 30],
      ]);
    });

    it('includes monthly_target on category buckets', async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 3,
        include: 'both',
      });
      const food = result.current.data!.byCategory.find(
        (b) => b.name === 'Food',
      );
      expect(food?.target).toBe(500);
      const travel = result.current.data!.byCategory.find(
        (b) => b.name === 'Travel',
      );
      expect(travel?.target).toBeNull();
    });

    it('respects categoryIds filter (excludes Travel)', async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 3,
        categoryIds: [10],
        include: 'both',
      });
      const names = result.current.data!.byCategory.map((b) => b.name);
      // Travel is filtered out; uncategorized entry has category_id=null so also excluded
      expect(names).toEqual(['Food']);
    });
  });

  describe('include toggle', () => {
    it("'spending' empties bills aggregations", async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 3,
        include: 'spending',
      });
      const billsTotals = result.current.data!.billsVsDiscretionary.map(
        (b) => b.bills,
      );
      expect(billsTotals).toEqual([0, 0, 0]);
    });

    it("'bills' empties spending aggregations", async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 3,
        include: 'bills',
      });
      expect(result.current.data!.byCategory).toEqual([]);
      const spendingTotals = result.current.data!.spendingByPeriod.map(
        (s) => s.total,
      );
      expect(spendingTotals).toEqual([0, 0, 0]);
    });
  });

  describe('grandTotal', () => {
    it("sums all bills + spending in scope when include='both'", async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 3,
        include: 'both',
      });
      // Periods 4, 5, 6:
      //   Spending: 100 + 50 + 200 + 30 = 380
      //   Bills: 1500 + 1500 = 3000
      //   Total: 3380
      expect(result.current.data!.grandTotal).toBe(3380);
    });
  });

  describe('amount range filter', () => {
    it('respects minAmount + maxAmount', async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 3,
        include: 'spending',
        minAmount: 40,
        maxAmount: 150,
      });
      // Spending in last 3 periods within [40, 150]: 100 (Food P5), 50 (Travel P5)
      // Excluded: 200 (>150), 30 (<40)
      expect(result.current.data!.grandTotal).toBe(150);
    });
  });

  describe('groupBy month rollup', () => {
    // Periods (sorted by start_date):
    //   P1: 2025-12-06 → Dec 2025
    //   P2: 2025-12-20 → Dec 2025
    //   P3: 2026-02-06 → Feb 2026
    //   P4: 2026-03-06 → Mar 2026
    //   P5: 2026-04-06 → Apr 2026
    //   P6: 2026-04-20 → Apr 2026
    // → 4 month buckets across all 6 periods.

    it('collapses 6 periods into 4 month buckets', async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 6,
        include: 'both',
        groupBy: 'month',
      });
      const labels = result.current.data!.spendingByPeriod.map((b) => b.label);
      expect(labels).toEqual(['Dec 2025', 'Feb 2026', 'Mar 2026', 'Apr 2026']);
    });

    it('sums spending across periods within the same month', async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 6,
        include: 'both',
        groupBy: 'month',
      });
      const apr = result.current.data!.spendingByPeriod.find(
        (b) => b.label === 'Apr 2026',
      );
      // P5 spending: 100 + 50 = 150 ; P6 spending: 200 + 30 = 230 → total 380
      expect(apr?.total).toBe(380);
      const dec = result.current.data!.spendingByPeriod.find(
        (b) => b.label === 'Dec 2025',
      );
      // P1 spending: 75 ; P2 spending: 0 → total 75
      expect(dec?.total).toBe(75);
    });

    it('sums bills across periods within the same month', async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 6,
        include: 'both',
        groupBy: 'month',
      });
      const apr = result.current.data!.billsVsDiscretionary.find(
        (b) => b.label === 'Apr 2026',
      );
      // P5 bills: 1500 ; P6 bills: 1500 → 3000
      expect(apr?.bills).toBe(3000);
    });

    it('rolls categoryTrend perCategory across periods within a month', async () => {
      const result = await renderInsights({
        rangeMode: 'last-n',
        n: 6,
        include: 'both',
        groupBy: 'month',
      });
      const apr = result.current.data!.categoryTrend.find(
        (b) => b.label === 'Apr 2026',
      );
      // Food across P5+P6: 100 + 200 = 300
      // Travel across P5+P6: 50
      // Uncategorized across P5+P6: 30
      expect(apr?.perCategory['10']).toBe(300);
      expect(apr?.perCategory['20']).toBe(50);
      expect(apr?.perCategory.uncategorized).toBe(30);
    });

    it('byCategory and grandTotal are unaffected by groupBy', async () => {
      const periodMode = await renderInsights({
        rangeMode: 'last-n',
        n: 6,
        include: 'both',
        groupBy: 'period',
      });
      const monthMode = await renderInsights({
        rangeMode: 'last-n',
        n: 6,
        include: 'both',
        groupBy: 'month',
      });
      expect(monthMode.current.data!.grandTotal).toBe(
        periodMode.current.data!.grandTotal,
      );
      expect(monthMode.current.data!.byCategory.length).toBe(
        periodMode.current.data!.byCategory.length,
      );
    });
  });
});

const UNCATEGORIZED = 'Uncategorized';
