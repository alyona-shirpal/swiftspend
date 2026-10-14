import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { MonobankIntegration, MonobankPendingImport } from '@swiftspend/types';

export const MONOBANK_STATUS_QUERY_KEY = ['monobank', 'status'] as const;
export const MONOBANK_PENDING_QUERY_KEY = ['monobank', 'pending'] as const;

export interface MonobankStatusResponse {
  integrations: MonobankIntegration[];
  pendingCount: number;
}

export interface MonobankPendingResponse {
  imports: MonobankPendingImport[];
}

export function useMonobankStatus() {
  return useQuery<MonobankStatusResponse>({
    queryKey: MONOBANK_STATUS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<MonobankStatusResponse>('/integrations/monobank/status');
      return data;
    },
  });
}

export function useConnectMonobank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { token: string; displayName?: string }) => {
      const { data } = await api.post('/integrations/monobank/connect', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MONOBANK_STATUS_QUERY_KEY });
      toast.success('Monobank account connected');
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to connect Monobank';
      toast.error(errorMsg);
    },
  });
}

export function useDisconnectMonobank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/integrations/monobank/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MONOBANK_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONOBANK_PENDING_QUERY_KEY });
      toast.success('Monobank account disconnected');
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to disconnect Monobank';
      toast.error(errorMsg);
    },
  });
}

export function useMonobankPendingImports() {
  return useQuery<MonobankPendingResponse>({
    queryKey: MONOBANK_PENDING_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<MonobankPendingResponse>('/integrations/monobank/pending');
      return data;
    },
  });
}

export function useAcceptMonobankImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      category_id?: string;
      merchant?: string;
      description?: string;
      date?: string;
    }) => {
      const { data } = await api.post(`/integrations/monobank/pending/${id}/accept`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MONOBANK_PENDING_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONOBANK_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Transaction accepted');
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to accept transaction';
      toast.error(errorMsg);
    },
  });
}

export function useDeclineMonobankImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data } = await api.post(`/integrations/monobank/pending/${id}/decline`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MONOBANK_PENDING_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONOBANK_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Transaction declined');
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to decline transaction';
      toast.error(errorMsg);
    },
  });
}

export function useClearAllMonobankImports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/integrations/monobank/pending/clear');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MONOBANK_PENDING_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONOBANK_STATUS_QUERY_KEY });
      toast.success('Cleared all pending imports');
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to clear pending imports';
      toast.error(errorMsg);
    },
  });
}

export function useSyncMonobank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      integrationId,
      from,
      to,
    }: {
      integrationId: string;
      from?: string;
      to?: string;
    }) => {
      const { data } = await api.post<{ imported: number }>(
        `/integrations/monobank/${integrationId}/sync`,
        { from, to }
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MONOBANK_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONOBANK_PENDING_QUERY_KEY });
      const count = data?.imported ?? 0;
      toast.success(`Imported ${count} transaction${count === 1 ? '' : 's'}`);
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to sync Monobank';
      toast.error(errorMsg);
    },
  });
}

export interface VerifyWebhookResult {
  expectedWebhookUrl: string;
  currentRegisteredUrl: string | null;
  isRegistered: boolean;
  isLocalhost: boolean;
  reRegisterAttempted: boolean;
  reRegisterSuccess: boolean;
  reRegisterError: string | null;
  tip?: string;
}

export function useVerifyMonobankWebhook() {
  return useMutation({
    mutationFn: async ({
      integrationId,
      reregister = false,
    }: {
      integrationId: string;
      reregister?: boolean;
    }) => {
      const { data } = await api.post<VerifyWebhookResult>(
        `/integrations/monobank/${integrationId}/webhook/verify`,
        { reregister }
      );
      return data;
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to verify webhook';
      toast.error(errorMsg);
    },
  });
}
