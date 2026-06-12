import { Expense } from '@swiftspend/types';
import api from './api';

export interface ExpensesListResponse {
  data: Expense[];
  metadata: { total: number; page: number; limit: number };
}

export async function fetchAllExpenses(params: {
  from: string;
  to: string;
  categoryId?: string;
}): Promise<Expense[]> {
  const all: Expense[] = [];
  let page = 1;
  const limit = 100;

  let hasMore = true;
  while (hasMore) {
    const searchParams = new URLSearchParams({
      from: params.from,
      to: params.to,
      page: String(page),
      limit: String(limit),
    });
    if (params.categoryId) searchParams.set('category_id', params.categoryId);

    const { data } = await api.get<ExpensesListResponse>(`/expenses?${searchParams}`);
    all.push(...data.data);

    if (all.length >= data.metadata.total || data.data.length === 0) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return all;
}
