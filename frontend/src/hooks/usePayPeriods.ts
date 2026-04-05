import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  PayPeriod,
  PayPeriodCreate,
  PayPeriodDetail,
  PayPeriodUpdate,
} from '../types';

export const payPeriodKeys = {
  all: ['payPeriods'] as const,
  lists: () => [...payPeriodKeys.all, 'list'] as const,
  list: () => [...payPeriodKeys.lists()] as const,
  details: () => [...payPeriodKeys.all, 'detail'] as const,
  detail: (id: number) => [...payPeriodKeys.details(), id] as const,
};

export function usePayPeriods() {
  return useQuery({
    queryKey: payPeriodKeys.list(),
    queryFn: () => api.get<PayPeriod[]>('/pay-periods'),
  });
}

export function usePayPeriod(id: number | undefined) {
  return useQuery({
    queryKey: payPeriodKeys.detail(id!),
    queryFn: () => api.get<PayPeriodDetail>(`/pay-periods/${id}`),
    enabled: !!id,
  });
}

export function useCreatePayPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      populateBills = false,
    }: {
      data: PayPeriodCreate;
      populateBills?: boolean;
    }) => {
      const url = populateBills
        ? '/pay-periods?populate_bills=true'
        : '/pay-periods';
      return api.post<PayPeriod>(url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.lists() });
    },
  });
}

export function useUpdatePayPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PayPeriodUpdate }) =>
      api.put<PayPeriod>(`/pay-periods/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.lists() });
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.detail(id) });
    },
  });
}

export function useDeletePayPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/pay-periods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payPeriodKeys.lists() });
    },
  });
}

interface SuggestedDates {
  start_date: string;
  end_date: string;
}

export function useSuggestedPayPeriod() {
  return useQuery({
    queryKey: ['payPeriods', 'suggest'] as const,
    queryFn: () => api.get<SuggestedDates>('/pay-periods/suggest'),
  });
}
