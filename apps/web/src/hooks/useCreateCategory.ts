import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Category } from '../types/api';
import api from '../services/api';

interface CreateCategoryPayload {
  name: string;
  icon: string;
  color: string;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload): Promise<Category> => {
      const { data } = await api.post('/categories', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'all'] });
    },
  });
}
