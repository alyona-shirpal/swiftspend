import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { supabase } from '../services/supabase';
import { NoteSuggestion } from '../types/api';

const normalizeNote = (value: string) => value.trim().toLowerCase();

export function useExpenseNoteSuggestions(categoryId: string, note: string) {
  const normalizedNote = normalizeNote(note);
  const query = normalizedNote.length >= 2 ? normalizedNote : '';

  return useQuery({
    queryKey: ['expenses', 'note-suggestions', categoryId, query],
    enabled: Boolean(categoryId) && (normalizedNote.length === 0 || normalizedNote.length >= 2),
    queryFn: async (): Promise<NoteSuggestion[]> => {
      if (!supabase) {
        const mockSuggestions: NoteSuggestion[] = [
          { note: 'Groceries', normalized_note: 'groceries', count: 4, last_used_at: new Date().toISOString() },
          { note: 'Lunch', normalized_note: 'lunch', count: 3, last_used_at: new Date().toISOString() },
          { note: 'Coffee', normalized_note: 'coffee', count: 2, last_used_at: new Date().toISOString() },
        ];

        return mockSuggestions.filter((suggestion) =>
          query ? suggestion.normalized_note.includes(query) : true
        );
      }

      const searchParams = new URLSearchParams({
        category_id: categoryId,
        limit: '6',
      });
      if (query) searchParams.set('q', query);

      const { data } = await api.get<NoteSuggestion[]>(`/expenses/note-suggestions?${searchParams}`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
