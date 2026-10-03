import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { ensureUserCurrencies } from '../services/userCurrencies';
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  syncExpensesToSheet,
  getGoogleConfig,
  IntegrationRecord,
  ExpenseForSync,
  CategoryForSync,
} from '../services/googleSheets';

// ---------------------------------------------------------------------------
// Zod schemas for request validation
// ---------------------------------------------------------------------------

const ConnectBodySchema = z.object({
  code: z.string().min(1, 'OAuth authorization code is required'),
});

const SyncBodySchema = z.object({
  // SYNC_SPEC_V1: Optional array of 'YYYY-MM' strings to limit sync scope to specific months.
  months: z
    .array(z.string().regex(/^\d{4}-\d{2}$/, 'Each month must be in YYYY-MM format'))
    .optional(),
});

// ---------------------------------------------------------------------------
// Shared helper types
// ---------------------------------------------------------------------------

type IntegrationRow = IntegrationRecord & {
  id: string;
  user_id: string;
  provider: string;
  spreadsheet_id: string | null;
  refresh_token: string;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
};

// ---------------------------------------------------------------------------
// performSync — shared sync orchestration called by connect + manual sync + auto-trigger
// ---------------------------------------------------------------------------

/**
 * Orchestrates a full or scoped sync for a user.
 * SYNC_SPEC_V1: Exported so triggerSheetSync can call it fire-and-forget from any expense mutation.
 *
 * @param userId       The authenticated user's UUID
 * @param months       Optional list of 'YYYY-MM' keys to restrict the sync scope
 */
export async function performSync(userId: string, months?: string[]): Promise<void> {
  // Fetch integration record using service role (bypasses RLS)
  const { data: integration, error: intError } = await supabaseAdmin
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google_sheets')
    .single<IntegrationRow>();

  if (intError || !integration) {
    console.error('[performSync] No integration found for user:', userId);
    return;
  }

  try {
    // Refresh the access token before fetching data
    const config = getGoogleConfig();
    const { access_token } = await refreshAccessToken(integration.refresh_token, config);

    // SYNC_SPEC_V1: Determine date range — last 12 months by default if no months specified.
    const now = new Date();
    let fromDate: string;

    if (months && months.length > 0) {
      // Use the earliest requested month's first day as the lower bound
      const sorted = [...months].sort();
      fromDate = `${sorted[0]}-01`;
    } else {
      // First day of the month 12 months ago
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
      fromDate = d.toISOString().split('T')[0]!;

    }

    // Fetch expenses using supabaseAdmin (service role — bypasses RLS)
    let expenseQuery = supabaseAdmin
      .from('expenses')
      .select('id, date, merchant, description, amount, currency, amounts, exchange_rate_snapshot, category_id')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .order('date', { ascending: true });

    // If specific months are requested, also add an upper bound
    if (months && months.length > 0) {
      const sorted = [...months].sort();
      const lastMonth = sorted[sorted.length - 1]!;
      // Last day of the last requested month
      const parts = lastMonth.split('-').map(Number);
      const y = parts[0] as number;
      const m = parts[1] as number;
      const lastDay = new Date(Date.UTC(y, m, 0)); // day 0 of next month = last day of this month
      expenseQuery = expenseQuery.lte('date', lastDay.toISOString().split('T')[0]!);
    }


    const { data: expensesRaw, error: expensesError } = await expenseQuery;
    if (expensesError) throw expensesError;

    // Fetch all categories for this user
    const { data: categoriesRaw, error: catError } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .eq('user_id', userId);
    if (catError) throw catError;

    const expenses = (expensesRaw ?? []) as unknown as ExpenseForSync[];
    const categories = (categoriesRaw ?? []) as CategoryForSync[];

    // Resolve user's default currency
    const userCurrencies = await ensureUserCurrencies(userId, supabaseAdmin);
    const defaultCurrency =
      userCurrencies.find((c) => c.is_default)?.currency ?? 'EUR';
    const userCurrencyCodes = userCurrencies.map((c) => c.currency);

    const spreadsheetId = await syncExpensesToSheet(
      {
        integration,
        accessToken: access_token,
        defaultCurrency,
        userCurrencies: userCurrencyCodes,
      },
      expenses,
      categories,
      supabaseAdmin,
    );

    // On success: update status, timestamp, and spreadsheet ID
    await supabaseAdmin
      .from('user_integrations')
      .update({
        sync_status: 'idle',
        last_synced_at: new Date().toISOString(),
        spreadsheet_id: spreadsheetId,
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[performSync] Sync failed for user:', userId, message);

    // On error: persist error state
    await supabaseAdmin
      .from('user_integrations')
      .update({
        sync_status: 'error',
        sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'google_sheets');
  }
}

// ---------------------------------------------------------------------------
// GET /integrations/google/status
// ---------------------------------------------------------------------------

/**
 * Returns the current Google Sheets integration status for the authenticated user.
 */
export const getGoogleStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('user_integrations')
      .select('spreadsheet_id, last_synced_at, sync_status, sync_error')
      .eq('user_id', userId)
      .eq('provider', 'google_sheets')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.json({ connected: false, spreadsheetId: null, lastSyncedAt: null, syncStatus: null, syncError: null });
    }

    return res.json({
      connected: true,
      spreadsheetId: data.spreadsheet_id,
      lastSyncedAt: data.last_synced_at,
      syncStatus: data.sync_status,
      syncError: data.sync_error,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /integrations/google/connect
// ---------------------------------------------------------------------------

/**
 * Exchanges an OAuth authorization code for tokens and persists the integration.
 * Triggers an initial sync of the last 12 months as a fire-and-forget background task.
 */
export const connectGoogle = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code } = ConnectBodySchema.parse(req.body);
    const userId = req.user!.id;

    const config = getGoogleConfig();
    const tokens = await exchangeCodeForTokens(code, config);

    // SYNC_SPEC_V1: Upsert into user_integrations — one row per (user_id, provider).
    const { error: upsertError } = await supabaseAdmin
      .from('user_integrations')
      .upsert(
        {
          user_id: userId,
          provider: 'google_sheets',
          refresh_token: tokens.refresh_token,
          sync_status: 'syncing',
          sync_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
      );

    if (upsertError) throw upsertError;

    // Fire-and-forget initial sync: last 12 months, no month filter
    Promise.resolve().then(() => performSync(userId)).catch((err) => {
      console.error('[connectGoogle] Background sync error:', err);
    });

    return res.status(201).json({ connected: true, spreadsheetId: null, syncStatus: 'syncing' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /integrations/google/sync
// ---------------------------------------------------------------------------

/**
 * Manually triggers a Google Sheets sync. Returns 202 immediately; sync runs in background.
 */
export const syncToGoogle = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { months } = SyncBodySchema.parse(req.body);
    const userId = req.user!.id;

    const { data: integration, error: fetchError } = await supabaseAdmin
      .from('user_integrations')
      .select('sync_status, id')
      .eq('user_id', userId)
      .eq('provider', 'google_sheets')
      .maybeSingle<{ sync_status: string; id: string }>();

    if (fetchError) throw fetchError;
    if (!integration) {
      return res.status(404).json({ error: 'Google Sheets integration not connected' });
    }

    // SYNC_SPEC_V1: Guard against concurrent syncs — return 409 if already syncing.
    if (integration.sync_status === 'syncing') {
      return res.status(409).json({ error: 'Sync already in progress' });
    }

    // Mark as syncing before starting the background task
    await supabaseAdmin
      .from('user_integrations')
      .update({ sync_status: 'syncing', updated_at: new Date().toISOString() })
      .eq('id', integration.id);

    // Fire-and-forget sync
    Promise.resolve().then(() => performSync(userId, months)).catch((err) => {
      console.error('[syncToGoogle] Background sync error:', err);
    });

    return res.status(202).json({ message: 'Sync started' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /integrations/google
// ---------------------------------------------------------------------------

/**
 * Revokes the Google token and removes the integration record.
 */
export const disconnectGoogle = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;

    const { data: integration, error: fetchError } = await supabaseAdmin
      .from('user_integrations')
      .select('refresh_token')
      .eq('user_id', userId)
      .eq('provider', 'google_sheets')
      .maybeSingle<{ refresh_token: string }>();

    if (fetchError) throw fetchError;
    if (!integration) {
      return res.status(404).json({ error: 'Google Sheets integration not found' });
    }

    // Best-effort token revocation — don't block disconnect if Google revoke fails
    try {
      await revokeToken(integration.refresh_token);
    } catch (revokeErr) {
      console.warn('[disconnectGoogle] Token revocation failed (continuing):', revokeErr);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('user_integrations')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'google_sheets');

    if (deleteError) throw deleteError;

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};
