import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  SpendingEntry,
  SpendingEntryCreate,
  SpendingEntryUpdate,
} from '../types';
import { payPeriodKeys } from './usePayPeriods';

export const spendingKeys = {
  all: ['spending'] as const,
  lists: () => [...spendingKeys.all, 'list'] as const,
  list: (payPeriodId: number) => [...spendingKeys.lists(), payPeriodId] as const,
  allEntries: () => [...spendingKeys.all, 'all'] as const,
};

export function useSpending(payPeriodId: number | undefined) {
  return useQuery({
    queryKey: spendingKeys.list(payPeriodId!),
    queryFn: () => api.get<SpendingEntry[]>(`/pay-periods/${payPeriodId}/spending`),
    enabled: !!payPeriodId,
  });
}

export function useAllSpending() {
  return useQuery({
    queryKey: spendingKeys.allEntries(),
    queryFn: () => api.get<SpendingEntry[]>('/spending'),
  });
}

export function useCreateSpending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payPeriodId,
      data,
    }: {
      payPeriodId: number;
      data: SpendingEntryCreate;
    }) => api.post<SpendingEntry>(`/pay-periods/${payPeriodId}/spending`, data),
    onSuccess: (_, { payPeriodId }) => {
      queryClient.invalidateQueries({ queryKey: spendingKeys.list(payPeriodId) });
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.detail(payPeriodId) });
    },
  });
}

export function useUpdateSpending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      spendingId,
      data,
    }: {
      spendingId: number;
      payPeriodId: number;
      data: SpendingEntryUpdate;
    }) => api.put<SpendingEntry>(`/spending/${spendingId}`, data),
    onSuccess: (_, { payPeriodId }) => {
      queryClient.invalidateQueries({ queryKey: spendingKeys.list(payPeriodId) });
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.detail(payPeriodId) });
    },
  });
}

export function useDeleteSpending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spendingId }: { spendingId: number; payPeriodId: number }) =>
      api.delete(`/spending/${spendingId}`),
    onSuccess: (_, { payPeriodId }) => {
      queryClient.invalidateQueries({ queryKey: spendingKeys.list(payPeriodId) });
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.detail(payPeriodId) });
    },
  });
}
