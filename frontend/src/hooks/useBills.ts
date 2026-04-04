import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  PayPeriodBill,
  PayPeriodBillCreate,
  PayPeriodBillUpdate,
} from '../types';
import { payPeriodKeys } from './usePayPeriods';

export const billKeys = {
  all: ['bills'] as const,
  lists: () => [...billKeys.all, 'list'] as const,
  list: (payPeriodId: number) => [...billKeys.lists(), payPeriodId] as const,
};

export function useBills(payPeriodId: number | undefined) {
  return useQuery({
    queryKey: billKeys.list(payPeriodId!),
    queryFn: () => api.get<PayPeriodBill[]>(`/pay-periods/${payPeriodId}/bills`),
    enabled: !!payPeriodId,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payPeriodId,
      data,
    }: {
      payPeriodId: number;
      data: PayPeriodBillCreate;
    }) => api.post<PayPeriodBill>(`/pay-periods/${payPeriodId}/bills`, data),
    onSuccess: (_, { payPeriodId }) => {
      queryClient.invalidateQueries({ queryKey: billKeys.list(payPeriodId) });
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.detail(payPeriodId) });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      billId,
      data,
    }: {
      billId: number;
      payPeriodId: number;
      data: PayPeriodBillUpdate;
    }) => api.put<PayPeriodBill>(`/bills/${billId}`, data),
    onSuccess: (_, { payPeriodId }) => {
      queryClient.invalidateQueries({ queryKey: billKeys.list(payPeriodId) });
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.detail(payPeriodId) });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ billId }: { billId: number; payPeriodId: number }) =>
      api.delete(`/bills/${billId}`),
    onSuccess: (_, { payPeriodId }) => {
      queryClient.invalidateQueries({ queryKey: billKeys.list(payPeriodId) });
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.detail(payPeriodId) });
    },
  });
}
