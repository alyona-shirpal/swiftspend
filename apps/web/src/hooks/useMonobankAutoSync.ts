import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMonobankStatus,
  useSyncMonobank,
  MONOBANK_STATUS_QUERY_KEY,
  MONOBANK_PENDING_QUERY_KEY,
} from './useMonobankIntegration';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export function useMonobankAutoSync() {
  const { data: statusData, isLoading } = useMonobankStatus();
  const syncMutation = useSyncMonobank();
  const queryClient = useQueryClient();
  const syncingIntegrationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isLoading || !statusData?.integrations || statusData.integrations.length === 0) {
      return;
    }

    const now = Date.now();
    const staleIntegrations = statusData.integrations.filter((integration) => {
      // Avoid firing duplicate syncs for an integration already in-flight
      if (syncingIntegrationsRef.current.has(integration.id)) {
        return false;
      }

      if (!integration.last_synced_at) {
        return true;
      }

      const lastSyncTime = new Date(integration.last_synced_at).getTime();
      return isNaN(lastSyncTime) || now - lastSyncTime > FIFTEEN_MINUTES_MS;
    });

    if (staleIntegrations.length === 0) {
      return;
    }

    // Mark as in-flight
    staleIntegrations.forEach((int) => syncingIntegrationsRef.current.add(int.id));

    // Trigger sync for all stale instances in parallel
    Promise.allSettled(
      staleIntegrations.map((integration) =>
        syncMutation.mutateAsync({ integrationId: integration.id })
      )
    ).finally(() => {
      staleIntegrations.forEach((int) => syncingIntegrationsRef.current.delete(int.id));
      queryClient.invalidateQueries({ queryKey: MONOBANK_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MONOBANK_PENDING_QUERY_KEY });
    });
  }, [isLoading, statusData, syncMutation, queryClient]);
}
