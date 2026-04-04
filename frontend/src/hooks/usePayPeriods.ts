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
    mutationFn: (data: PayPeriodCreate) =>
      api.post<PayPeriod>('/pay-periods', data),
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
