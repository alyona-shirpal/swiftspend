/**
 * useGoogleSheetsIntegration.ts
 * ------------------------------
 * React Query hook for Google Sheets integration status + actions.
 *
 * SYNC_SPEC_V1: This hook wraps the 4 integration API endpoints:
 *   GET  /integrations/google/status
 *   POST /integrations/google/connect  (body: { code })
 *   POST /integrations/google/sync
 *   DELETE /integrations/google
 *
 * The connect flow uses Google OAuth PKCE:
 *   1. Frontend generates code_verifier + code_challenge (S256)
 *   2. Opens Google OAuth consent in a popup or redirect
 *   3. On callback, sends the auth code to POST /integrations/google/connect
 *   4. Backend exchanges the code for tokens (handles PKCE verification server-side)
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export interface GoogleIntegrationStatus {
  connected: boolean;
  spreadsheetId: string | null;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError: string | null;
}

export const GOOGLE_INTEGRATION_QUERY_KEY = ['integrations', 'google'] as const;

const OAUTH_STATE_KEY = 'google_oauth_state';

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function useGoogleSheetsIntegration() {
  const queryClient = useQueryClient();

  // Status query — polls every 3s when syncStatus === 'syncing'
  const status = useQuery<GoogleIntegrationStatus>({
    queryKey: GOOGLE_INTEGRATION_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<GoogleIntegrationStatus>('/integrations/google/status');
      return data;
    },
    refetchInterval: (query) => {
      return query.state.data?.syncStatus === 'syncing' ? 3000 : false;
    },
  });

  // Connect mutation — takes the OAuth code from the redirect callback
  const connect = useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post('/integrations/google/connect', { code });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_INTEGRATION_QUERY_KEY });
      toast.success('Google Sheets connected');
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to connect Google Sheets';
      toast.error(errorMsg);
    },
  });

  // Sync mutation
  const sync = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/integrations/google/sync');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_INTEGRATION_QUERY_KEY });
      toast.success('Sync started');
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to start sync';
      toast.error(errorMsg);
    },
  });

  // Disconnect mutation
  const disconnect = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/integrations/google');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_INTEGRATION_QUERY_KEY });
      toast.success('Google Sheets disconnected');
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to disconnect Google Sheets';
      toast.error(errorMsg);
    },
  });

  // Handle OAuth callback: detect ?code=...&state=... on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);

    if (code && state && storedState && state === storedState) {
      // Clean up sessionStorage and URL before calling connect
      sessionStorage.removeItem(OAUTH_STATE_KEY);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      connect.mutate(code);
    }
  }, []);

  // Initiate OAuth — builds the Google OAuth URL and redirects
  const initiateOAuth = () => {
    const state = generateRandomString(16);
    sessionStorage.setItem(OAUTH_STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return { status, connect, sync, disconnect, initiateOAuth };
}
