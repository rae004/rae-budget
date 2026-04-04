import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Category } from '../types';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => api.get<Category[]>('/categories'),
  });
}
