import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Category } from '../types/api';
import { createMockCategory } from '../services/mockExpenses';

interface CreateCategoryPayload {
  name: string;
  icon: string;
  color: string;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload): Promise<Category> => createMockCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'recent'] });
    },
  });
}
