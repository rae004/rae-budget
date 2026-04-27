import { useMemo } from 'react';
import type {
  Category,
  PayPeriod,
  PayPeriodBill,
  SpendingEntry,
} from '../types';
import { formatDateRange, parseLocalDate } from '../utils/date';
import { useAllBills } from './useBills';
import { useCategories } from './useCategories';
import { usePayPeriods } from './usePayPeriods';
import { useAllSpending } from './useSpending';

export type InsightsRangeMode = 'last-n' | 'ytd' | 'custom';
export type InsightsInclude = 'bills' | 'spending' | 'both';
export type InsightsGroupBy = 'period' | 'month';

export interface InsightsFilter {
  rangeMode: InsightsRangeMode;
  n?: number;
  fromDate?: string;
  toDate?: string;
  categoryIds?: number[];
  minAmount?: number;
  maxAmount?: number;
  include: InsightsInclude;
  groupBy?: InsightsGroupBy;
}

export interface InsightsCategoryBucket {
  categoryId: number | null;
  name: string;
  color: string;
  total: number;
  target: number | null;
}

export interface InsightsPeriodBucket {
  periodId: number;
  label: string;
  total: number;
}

export interface InsightsCategoryTrendBucket {
  periodId: number;
  label: string;
  perCategory: Record<string, number>;
}

export interface InsightsBillsVsDiscretionaryBucket {
  periodId: number;
  label: string;
  bills: number;
  spending: number;
}

export interface InsightsData {
  periods: PayPeriod[];
  byCategory: InsightsCategoryBucket[];
  spendingByPeriod: InsightsPeriodBucket[];
  categoryTrend: InsightsCategoryTrendBucket[];
  billsVsDiscretionary: InsightsBillsVsDiscretionaryBucket[];
  grandTotal: number;
}

const UNCATEGORIZED_NAME = 'Uncategorized';
const UNCATEGORIZED_COLOR = '#6b7280';
const UNCATEGORIZED_KEY = 'uncategorized';

export function useInsights(filter: InsightsFilter): {
  data: InsightsData | undefined;
  isLoading: boolean;
} {
  const periodsQuery = usePayPeriods();
  const categoriesQuery = useCategories();
  const billsQuery = useAllBills();
  const spendingQuery = useAllSpending();

  const isLoading =
    periodsQuery.isLoading ||
    categoriesQuery.isLoading ||
    billsQuery.isLoading ||
    spendingQuery.isLoading;

  const periodsData = periodsQuery.data;
  const categoriesData = categoriesQuery.data;
  const billsData = billsQuery.data;
  const spendingData = spendingQuery.data;

  const data = useMemo<InsightsData | undefined>(() => {
    if (!periodsData || !categoriesData || !billsData || !spendingData) {
      return undefined;
    }
    return aggregate(filter, periodsData, categoriesData, billsData, spendingData);
  }, [filter, periodsData, categoriesData, billsData, spendingData]);

  return { data, isLoading };
}

function aggregate(
  filter: InsightsFilter,
  allPeriods: PayPeriod[],
  categories: Category[],
  allBills: PayPeriodBill[],
  allSpending: SpendingEntry[],
): InsightsData {
  const periods = filterPeriods(filter, allPeriods);
  const periodIds = new Set(periods.map((p) => p.id));

  const includeBills = filter.include === 'bills' || filter.include === 'both';
  const includeSpending =
    filter.include === 'spending' || filter.include === 'both';

  const bills = includeBills
    ? allBills.filter((b) => billPasses(b, periodIds, filter))
    : [];
  const spending = includeSpending
    ? allSpending.filter((e) => entryPasses(e, periodIds, filter))
    : [];

  const categoryMap = new Map<number, Category>(
    categories.map((c) => [c.id, c]),
  );

  const totalsByCategory = new Map<number | null, number>();
  for (const e of spending) {
    const key = e.category_id;
    totalsByCategory.set(
      key,
      (totalsByCategory.get(key) ?? 0) + Number(e.amount),
    );
  }

  const byCategory: InsightsCategoryBucket[] = [];
  for (const [catId, total] of totalsByCategory) {
    if (catId === null) {
      byCategory.push({
        categoryId: null,
        name: UNCATEGORIZED_NAME,
        color: UNCATEGORIZED_COLOR,
        total,
        target: null,
      });
      continue;
    }
    const cat = categoryMap.get(catId);
    if (!cat) continue;
    byCategory.push({
      categoryId: catId,
      name: cat.name,
      color: cat.color,
      total,
      target: cat.monthly_target ? Number(cat.monthly_target) : null,
    });
  }
  byCategory.sort((a, b) => b.total - a.total);

  const spendingByPeriodMap = new Map<number, number>();
  for (const e of spending) {
    spendingByPeriodMap.set(
      e.pay_period_id,
      (spendingByPeriodMap.get(e.pay_period_id) ?? 0) + Number(e.amount),
    );
  }
  const billsByPeriodMap = new Map<number, number>();
  for (const b of bills) {
    billsByPeriodMap.set(
      b.pay_period_id,
      (billsByPeriodMap.get(b.pay_period_id) ?? 0) + Number(b.amount),
    );
  }

  // Per-period × category map, used to roll up categoryTrend across buckets.
  const spendingByPeriodCategory = new Map<number, Map<string, number>>();
  for (const e of spending) {
    let inner = spendingByPeriodCategory.get(e.pay_period_id);
    if (!inner) {
      inner = new Map();
      spendingByPeriodCategory.set(e.pay_period_id, inner);
    }
    const key =
      e.category_id === null ? UNCATEGORIZED_KEY : String(e.category_id);
    inner.set(key, (inner.get(key) ?? 0) + Number(e.amount));
  }

  const groupBy: InsightsGroupBy = filter.groupBy ?? 'period';
  const timeBuckets = buildTimeBuckets(periods, groupBy);

  const spendingByPeriod: InsightsPeriodBucket[] = timeBuckets.map((b, idx) => ({
    periodId: idx,
    label: b.label,
    total: b.periodIds.reduce(
      (sum, pid) => sum + (spendingByPeriodMap.get(pid) ?? 0),
      0,
    ),
  }));

  const categoryTrend: InsightsCategoryTrendBucket[] = timeBuckets.map(
    (b, idx) => {
      const perCategory: Record<string, number> = {};
      for (const pid of b.periodIds) {
        const inner = spendingByPeriodCategory.get(pid);
        if (!inner) continue;
        for (const [k, v] of inner) {
          perCategory[k] = (perCategory[k] ?? 0) + v;
        }
      }
      return { periodId: idx, label: b.label, perCategory };
    },
  );

  const billsVsDiscretionary: InsightsBillsVsDiscretionaryBucket[] =
    timeBuckets.map((b, idx) => ({
      periodId: idx,
      label: b.label,
      bills: b.periodIds.reduce(
        (s, pid) => s + (billsByPeriodMap.get(pid) ?? 0),
        0,
      ),
      spending: b.periodIds.reduce(
        (s, pid) => s + (spendingByPeriodMap.get(pid) ?? 0),
        0,
      ),
    }));

  let grandTotal = 0;
  for (const e of spending) grandTotal += Number(e.amount);
  for (const b of bills) grandTotal += Number(b.amount);

  return {
    periods,
    byCategory,
    spendingByPeriod,
    categoryTrend,
    billsVsDiscretionary,
    grandTotal,
  };
}

interface TimeBucket {
  key: string;
  label: string;
  periodIds: number[];
}

function buildTimeBuckets(
  periods: PayPeriod[],
  groupBy: InsightsGroupBy,
): TimeBucket[] {
  if (groupBy === 'month') {
    // Group by start_date YYYY-MM. With semi-monthly periods on the 6th/20th
    // cadence, periods starting Apr 6 and Apr 20 both fall into "Apr".
    const map = new Map<string, TimeBucket>();
    for (const p of periods) {
      const key = p.start_date.slice(0, 7);
      let bucket = map.get(key);
      if (!bucket) {
        const date = parseLocalDate(p.start_date);
        const label = date
          ? date.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })
          : key;
        bucket = { key, label, periodIds: [] };
        map.set(key, bucket);
      }
      bucket.periodIds.push(p.id);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.key.localeCompare(b.key),
    );
  }
  return periods.map((p) => ({
    key: String(p.id),
    label: formatDateRange(p.start_date, p.end_date),
    periodIds: [p.id],
  }));
}

function filterPeriods(
  filter: InsightsFilter,
  all: PayPeriod[],
): PayPeriod[] {
  const sorted = [...all].sort((a, b) =>
    a.start_date.localeCompare(b.start_date),
  );

  if (filter.rangeMode === 'last-n') {
    const n = filter.n ?? 6;
    return sorted.slice(-n);
  }
  if (filter.rangeMode === 'ytd') {
    const year = new Date().getFullYear();
    return sorted.filter((p) => {
      const end = parseLocalDate(p.end_date);
      return end !== null && end.getFullYear() === year;
    });
  }
  if (!filter.fromDate || !filter.toDate) return sorted;
  return sorted.filter(
    (p) => p.start_date >= filter.fromDate! && p.start_date <= filter.toDate!,
  );
}

function billPasses(
  b: PayPeriodBill,
  periodIds: Set<number>,
  filter: InsightsFilter,
): boolean {
  if (!periodIds.has(b.pay_period_id)) return false;
  return amountInRange(Number(b.amount), filter);
}

function entryPasses(
  e: SpendingEntry,
  periodIds: Set<number>,
  filter: InsightsFilter,
): boolean {
  if (!periodIds.has(e.pay_period_id)) return false;
  if (filter.categoryIds && filter.categoryIds.length > 0) {
    if (e.category_id === null || !filter.categoryIds.includes(e.category_id)) {
      return false;
    }
  }
  return amountInRange(Number(e.amount), filter);
}

function amountInRange(amount: number, filter: InsightsFilter): boolean {
  if (filter.minAmount !== undefined && amount < filter.minAmount) return false;
  if (filter.maxAmount !== undefined && amount > filter.maxAmount) return false;
  return true;
}
