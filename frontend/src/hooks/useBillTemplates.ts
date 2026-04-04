import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  BillTemplate,
  BillTemplateCreate,
  BillTemplateUpdate,
} from '../types';

export const billTemplateKeys = {
  all: ['billTemplates'] as const,
  lists: () => [...billTemplateKeys.all, 'list'] as const,
  list: () => [...billTemplateKeys.lists()] as const,
  details: () => [...billTemplateKeys.all, 'detail'] as const,
  detail: (id: number) => [...billTemplateKeys.details(), id] as const,
};

export function useBillTemplates() {
  return useQuery({
    queryKey: billTemplateKeys.list(),
    queryFn: () => api.get<BillTemplate[]>('/bill-templates'),
  });
}

export function useBillTemplate(id: number | undefined) {
  return useQuery({
    queryKey: billTemplateKeys.detail(id!),
    queryFn: () => api.get<BillTemplate>(`/bill-templates/${id}`),
    enabled: !!id,
  });
}

export function useCreateBillTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BillTemplateCreate) =>
      api.post<BillTemplate>('/bill-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billTemplateKeys.lists() });
    },
  });
}

export function useUpdateBillTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BillTemplateUpdate }) =>
      api.put<BillTemplate>(`/bill-templates/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: billTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: billTemplateKeys.detail(id) });
    },
  });
}

export function useDeleteBillTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/bill-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billTemplateKeys.lists() });
    },
  });
}
