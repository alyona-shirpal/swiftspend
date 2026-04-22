import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '../services/categories';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });
};
