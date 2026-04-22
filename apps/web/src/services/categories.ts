import api from './api';
import { Category } from '../types/api';

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await api.get('/categories');
    return data;
  },

  create: async (category: Partial<Category>): Promise<Category> => {
    const { data } = await api.post('/categories', category);
    return data;
  },

  update: async (id: string, category: Partial<Category>): Promise<Category> => {
    const { data } = await api.patch(`/categories/${id}`, category);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
