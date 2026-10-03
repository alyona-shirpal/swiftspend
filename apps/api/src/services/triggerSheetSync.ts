/**
 * triggerSheetSync.ts
 * -------------------
 * Fire-and-forget helper called after every expense mutation.
 * Checks if the user has an active Google Sheets integration.
 * If yes, starts an async sync without blocking the HTTP response.
 *
 * SYNC_SPEC_V1: Auto-sync is triggered on create/update/delete.
 * The affected month is passed to limit sync scope (only re-sync that month).
 */

import { supabaseAdmin } from './supabase';
import { performSync } from '../controllers/integrations';

/**
 * Trigger a background Google Sheets sync for the given user.
 * Safe to call without awaiting — errors are swallowed and logged.
 *
 * @param userId        The user whose integration to sync
 * @param affectedMonth Optional 'YYYY-MM' string to scope the sync to a single month
 */
export async function triggerSheetSync(userId: string, affectedMonth?: string): Promise<void> {
  // SYNC_SPEC_V1: Use setImmediate so the HTTP response is sent before sync work begins.
  setImmediate(async () => {
    try {
      // 1. Check if the user has an active Google Sheets integration
      const { data: integration, error } = await supabaseAdmin
        .from('user_integrations')
        .select('sync_status, id')
        .eq('user_id', userId)
        .eq('provider', 'google_sheets')
        .maybeSingle<{ sync_status: string; id: string }>();

      if (error) {
        console.error('[triggerSheetSync] Failed to query integration:', error);
        return;
      }

      // 2. No integration or already syncing — skip
      if (!integration || integration.sync_status === 'syncing') return;

      // 3. Mark as syncing before launching background work
      await supabaseAdmin
        .from('user_integrations')
        .update({ sync_status: 'syncing', updated_at: new Date().toISOString() })
        .eq('id', integration.id);

      // 4. Run the sync scoped to the affected month (or full if not provided)
      await performSync(userId, affectedMonth ? [affectedMonth] : undefined);
    } catch (err) {
      // SYNC_SPEC_V1: Errors here must never propagate — sync is best-effort on mutations.
      console.error('[triggerSheetSync] Unexpected error during auto-sync:', err);
    }
  });
}
