import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface DocumentProcessingCapability {
  enabled: boolean;
  providers: Array<'gemini' | 'anthropic' | 'openai'>;
}

const ONE_DAY = 24 * 60 * 60 * 1000;

export function useDocumentProcessing() {
  return useQuery({
    queryKey: ['document-processing', 'capability'],
    queryFn: async () => {
      const { data } = await api.get<DocumentProcessingCapability>('/expenses/document/config');
      return data;
    },
    staleTime: ONE_DAY,
    gcTime: 7 * ONE_DAY,
  });
}
