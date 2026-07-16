import { Expense } from '@swiftspend/types';
import api from './api';

export interface ParsedDocumentExpense {
  amount: number;
  currency: string;
  category_id: string;
  date: string | null;
  merchant: string | null;
  items: string[];
  extra_info: string | null;
  description: string;
}

export type DocumentExpenseResponse =
  | { status: 'parsed'; provider: string; expense: ParsedDocumentExpense }
  | { status: 'created'; provider: string; expense: Expense };

export async function processExpenseDocument(file: File, auto: boolean) {
  const { data } = await api.post<DocumentExpenseResponse>(
    `/expenses/document?auto=${auto}`,
    file,
    {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
      },
    },
  );
  return data;
}

export function getDocumentProcessingErrorMessage(error: unknown) {
  return (
    (error as { response?: { data?: { error?: string } } }).response?.data
      ?.error ??
    (error instanceof Error
      ? error.message
      : 'Could not process this document.')
  );
}

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
