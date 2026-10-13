import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { createExpenseRecordAdmin } from '../services/createExpenseAdmin';
import {
  fetchClientInfo,
  registerWebhook,
  clearWebhook,
  fetchStatement,
  encryptToken,
  decryptToken,
  resolveExpenseCurrency,
  mccToCategoryHint,
  MonobankAccount,
  MonobankStatementItem,
} from '../services/monobank';

const ConnectBodySchema = z.object({
  token: z.string().min(1, 'Monobank token is required'),
  displayName: z.string().optional(),
});

const AcceptImportBodySchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  merchant: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

// ---------------------------------------------------------------------------
// GET /integrations/monobank/status
// ---------------------------------------------------------------------------
export const getMonobankStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;

    const { data: integrationsRaw, error: intError } = await supabaseAdmin
      .from('user_integrations')
      .select('id, display_name, monobank_client_id, monobank_accounts, created_at, last_synced_at')
      .eq('user_id', userId)
      .eq('provider', 'monobank')
      .order('created_at', { ascending: true });

    if (intError) throw intError;

    const integrations = (integrationsRaw ?? []).map((row) => {
      let accounts = row.monobank_accounts;
      if (typeof accounts === 'string') {
        try {
          accounts = JSON.parse(accounts);
        } catch {
          accounts = [];
        }
      }

      return {
        id: row.id,
        display_name: row.display_name,
        monobank_client_id: row.monobank_client_id,
        monobank_accounts: accounts ?? [],
        created_at: row.created_at,
        last_synced_at: row.last_synced_at,
      };
    });

    const { count, error: countError } = await supabaseAdmin
      .from('monobank_pending_imports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (countError) throw countError;

    return res.json({
      integrations,
      pendingCount: count ?? 0,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /integrations/monobank/connect
// ---------------------------------------------------------------------------
export const connectMonobank = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, displayName } = ConnectBodySchema.parse(req.body);
    const userId = req.user!.id;

    let clientInfo;
    try {
      clientInfo = await fetchClientInfo(token.trim());
    } catch (err: any) {
      const message = err?.message || 'Failed to authenticate with Monobank';
      const statusCode = message.includes('401') || message.includes('403') ? 401 : 400;
      return res.status(statusCode).json({ error: message });
    }

    // Check if integration with this monobank_client_id already exists for this user
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('user_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'monobank')
      .eq('monobank_client_id', clientInfo.clientId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return res.status(409).json({ error: 'Already connected' });
    }

    const webhookToken = crypto.randomUUID();
    const encryptedToken = encryptToken(token.trim());
    const baseUrl = process.env.API_BASE_URL || 'https://api.swiftspend.app';
    const webhookUrl = `${baseUrl.replace(/\/+$/, '')}/integrations/monobank/webhook/${webhookToken}`;

    let webhookRegistered = false;
    try {
      await registerWebhook(token.trim(), webhookUrl);
      webhookRegistered = true;
    } catch (err) {
      console.warn('[connectMonobank] Failed to register webhook with Monobank:', err);
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('user_integrations')
      .insert({
        user_id: userId,
        provider: 'monobank',
        encrypted_token: encryptedToken,
        webhook_token: webhookToken,
        monobank_client_id: clientInfo.clientId,
        monobank_accounts: clientInfo.accounts,
        display_name: displayName?.trim() || clientInfo.name,
        sync_status: 'idle',
        last_synced_at: null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      id: inserted.id,
      display_name: inserted.display_name,
      monobank_client_id: inserted.monobank_client_id,
      accounts: clientInfo.accounts,
      webhookRegistered,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /integrations/monobank/:id
// ---------------------------------------------------------------------------
export const disconnectMonobank = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: integration, error } = await supabaseAdmin
      .from('user_integrations')
      .select('id, encrypted_token')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('provider', 'monobank')
      .maybeSingle();

    if (error) throw error;
    if (!integration) {
      return res.status(404).json({ error: 'Monobank integration not found' });
    }

    if (integration.encrypted_token) {
      try {
        const token = decryptToken(integration.encrypted_token);
        await clearWebhook(token);
      } catch (err) {
        console.warn('[disconnectMonobank] Best-effort clearWebhook failed (ignored):', err);
      }
    }

    // Delete pending imports for this integration
    const { error: pendingDeleteError } = await supabaseAdmin
      .from('monobank_pending_imports')
      .delete()
      .eq('integration_id', id)
      .eq('status', 'pending');

    if (pendingDeleteError) throw pendingDeleteError;

    // Delete integration record
    const { error: deleteError } = await supabaseAdmin
      .from('user_integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /integrations/monobank/pending
// ---------------------------------------------------------------------------
export const getPendingImports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;

    const { data: rows, error } = await supabaseAdmin
      .from('monobank_pending_imports')
      .select(`
        id,
        external_id,
        account_id,
        time,
        description,
        mcc,
        amount,
        currency_code,
        operation_amount,
        operation_currency_code,
        hold,
        created_at,
        suggested_category_id,
        categories:suggested_category_id (
          id,
          name,
          icon
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('time', { ascending: false });

    if (error) throw error;

    const imports = (rows ?? []).map((row: any) => {
      const resolved = resolveExpenseCurrency(
        Number(row.amount),
        row.currency_code,
        row.operation_amount != null ? Number(row.operation_amount) : undefined,
        row.operation_currency_code != null ? row.operation_currency_code : undefined,
      );

      let suggestedCategory: { id: string; name: string; icon: string } | null = null;
      if (row.categories) {
        const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
        if (cat && cat.id) {
          suggestedCategory = {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
          };
        }
      }

      return {
        id: row.id,
        external_id: row.external_id,
        account_id: row.account_id,
        time: row.time,
        description: row.description,
        mcc: row.mcc,
        amount: resolved.amount,
        currency: resolved.currency,
        hold: row.hold,
        suggested_category: suggestedCategory,
        created_at: row.created_at,
      };
    });

    return res.json({ imports });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /integrations/monobank/pending/:id/accept
// ---------------------------------------------------------------------------
export const acceptPendingImport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const overrides = AcceptImportBodySchema.parse(req.body);

    const { data: pendingImport, error } = await supabaseAdmin
      .from('monobank_pending_imports')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) throw error;
    if (!pendingImport) {
      return res.status(404).json({ error: 'Pending import not found' });
    }

    // Check if expense already exists with provider='monobank' and external_id=pendingImport.external_id
    const { data: existingExpense } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'monobank')
      .eq('external_id', pendingImport.external_id)
      .maybeSingle();

    if (existingExpense) {
      return res.status(409).json({ error: 'Expense already imported' });
    }

    // Resolve currency & decimal amount
    const resolved = resolveExpenseCurrency(
      Number(pendingImport.amount),
      pendingImport.currency_code,
      pendingImport.operation_amount != null ? Number(pendingImport.operation_amount) : undefined,
      pendingImport.operation_currency_code != null ? pendingImport.operation_currency_code : undefined,
    );

    const expenseDate =
      overrides.date ||
      (pendingImport.time
        ? new Date(pendingImport.time).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]);

    const expense = await createExpenseRecordAdmin(userId, {
      amount: resolved.amount,
      currency: resolved.currency,
      category_id:
        overrides.category_id !== undefined
          ? overrides.category_id
          : pendingImport.suggested_category_id,
      merchant:
        overrides.merchant !== undefined
          ? overrides.merchant
          : pendingImport.description,
      description:
        overrides.description !== undefined
          ? overrides.description
          : null,
      date: expenseDate,
      provider: 'monobank',
      external_id: pendingImport.external_id,
    });

    // Mark pending import as accepted
    const { error: updateError } = await supabaseAdmin
      .from('monobank_pending_imports')
      .update({
        status: 'accepted',
        expense_id: expense.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingImport.id);

    if (updateError) throw updateError;

    return res.status(201).json({ expense });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /integrations/monobank/pending/:id/decline
// ---------------------------------------------------------------------------
export const declinePendingImport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: pendingImport, error } = await supabaseAdmin
      .from('monobank_pending_imports')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) throw error;
    if (!pendingImport) {
      return res.status(404).json({ error: 'Pending import not found' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('monobank_pending_imports')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /integrations/monobank/webhook/:webhookToken (PUBLIC)
// ---------------------------------------------------------------------------
export const validateMonobankWebhook = (req: Request, res: Response) => {
  return res.status(200).send('OK');
};

// ---------------------------------------------------------------------------
// POST /integrations/monobank/webhook/:webhookToken (PUBLIC)
// ---------------------------------------------------------------------------
export const handleMonobankWebhook = async (
  req: Request,
  res: Response,
) => {
  // Immediately respond 200 OK before any asynchronous processing
  res.status(200).json({ ok: true });

  const { webhookToken } = req.params;
  if (!webhookToken) return;

  try {
    const { data: integration, error: intError } = await supabaseAdmin
      .from('user_integrations')
      .select('id, user_id')
      .eq('webhook_token', webhookToken)
      .maybeSingle();

    if (intError || !integration) return;

    const body = req.body;
    if (!body || body.type !== 'StatementItem' || !body.data || !body.data.statementItem) {
      return;
    }

    const item: MonobankStatementItem = body.data.statementItem;
    // Only process debits: skip if item.amount >= 0 (positive = credit/income)
    if (item.amount >= 0) return;

    const accountId = body.data.account || '';

    // Check if expense with this external_id already exists for this user
    const { data: existingExpense } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('user_id', integration.user_id)
      .eq('provider', 'monobank')
      .eq('external_id', item.id)
      .maybeSingle();

    if (existingExpense) return;

    // Check if already in pending imports
    const { data: existingPending } = await supabaseAdmin
      .from('monobank_pending_imports')
      .select('id')
      .eq('user_id', integration.user_id)
      .eq('external_id', item.id)
      .maybeSingle();

    if (existingPending) return;

    // Suggest category:
    // 1. Check recent expense with matching merchant name
    let suggestedCategoryId: string | null = null;
    const trimmedDesc = item.description ? item.description.trim().toLowerCase() : '';
    if (trimmedDesc) {
      const { data: matchedExpense } = await supabaseAdmin
        .from('expenses')
        .select('category_id')
        .eq('user_id', integration.user_id)
        .eq('normalized_merchant', trimmedDesc)
        .not('category_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (matchedExpense?.category_id) {
        suggestedCategoryId = matchedExpense.category_id;
      }
    }

    // 2. Fallback: mcc to category name hint
    if (!suggestedCategoryId && item.mcc) {
      const hint = mccToCategoryHint(item.mcc);
      if (hint) {
        const { data: matchedCat } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('user_id', integration.user_id)
          .ilike('name', hint)
          .limit(1)
          .maybeSingle();

        if (matchedCat?.id) {
          suggestedCategoryId = matchedCat.id;
        }
      }
    }

    // Insert pending import
    await supabaseAdmin
      .from('monobank_pending_imports')
      .upsert(
        {
          user_id: integration.user_id,
          integration_id: integration.id,
          external_id: item.id,
          account_id: accountId,
          time: new Date(item.time * 1000).toISOString(),
          description: item.description,
          mcc: item.mcc,
          original_mcc: item.originalMcc ?? null,
          amount: item.amount,
          operation_amount: item.operationAmount,
          currency_code: item.currencyCode,
          operation_currency_code: item.operationCurrencyCode ?? null,
          hold: item.hold ?? false,
          raw_payload: item,
          suggested_category_id: suggestedCategoryId,
          status: 'pending',
        },
        { onConflict: 'user_id,external_id', ignoreDuplicates: true },
      );
  } catch (err) {
    // Webhook must always finish silently without throwing
    console.error('[handleMonobankWebhook] Error processing webhook:', err);
  }
};

// ---------------------------------------------------------------------------
// POST /integrations/monobank/:id/sync (authenticated)
// ---------------------------------------------------------------------------
export const syncMonobankStatement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: integration, error } = await supabaseAdmin
      .from('user_integrations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('provider', 'monobank')
      .maybeSingle();

    if (error) throw error;
    if (!integration) {
      return res.status(404).json({ error: 'Monobank integration not found' });
    }

    if (!integration.encrypted_token) {
      return res.status(400).json({ error: 'Missing token for integration' });
    }

    const token = decryptToken(integration.encrypted_token);

    let accounts: MonobankAccount[] = [];
    if (Array.isArray(integration.monobank_accounts)) {
      accounts = integration.monobank_accounts;
    } else if (typeof integration.monobank_accounts === 'string') {
      try {
        accounts = JSON.parse(integration.monobank_accounts);
      } catch {
        accounts = [];
      }
    }

    if (!accounts || accounts.length === 0) {
      accounts = [{ id: '0', currencyCode: 980, balance: 0, creditLimit: 0, type: 'default' }];
    }

    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

    let importedCount = 0;

    for (const acc of accounts) {
      let statementItems: MonobankStatementItem[] = [];
      try {
        statementItems = await fetchStatement(token, acc.id, thirtyDaysAgo, now);
      } catch (err) {
        console.warn(`[syncMonobankStatement] Failed to fetch statement for account ${acc.id}:`, err);
        // Continue to other accounts if one fails (e.g. rate limit 429)
        continue;
      }

      for (const item of statementItems) {
        // Skip non-debit transactions
        if (item.amount >= 0) continue;

        // Skip if already in expenses
        const { data: existingExpense } = await supabaseAdmin
          .from('expenses')
          .select('id')
          .eq('user_id', userId)
          .eq('provider', 'monobank')
          .eq('external_id', item.id)
          .maybeSingle();

        if (existingExpense) continue;

        // Skip if already in pending imports
        const { data: existingPending } = await supabaseAdmin
          .from('monobank_pending_imports')
          .select('id')
          .eq('user_id', userId)
          .eq('external_id', item.id)
          .maybeSingle();

        if (existingPending) continue;

        // Suggest category:
        // 1. Check recent expense with matching merchant name
        let suggestedCategoryId: string | null = null;
        const trimmedDesc = item.description ? item.description.trim().toLowerCase() : '';
        if (trimmedDesc) {
          const { data: matchedExpense } = await supabaseAdmin
            .from('expenses')
            .select('category_id')
            .eq('user_id', userId)
            .eq('normalized_merchant', trimmedDesc)
            .not('category_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (matchedExpense?.category_id) {
            suggestedCategoryId = matchedExpense.category_id;
          }
        }

        // 2. Fallback: mcc to category hint
        if (!suggestedCategoryId && item.mcc) {
          const hint = mccToCategoryHint(item.mcc);
          if (hint) {
            const { data: matchedCat } = await supabaseAdmin
              .from('categories')
              .select('id')
              .eq('user_id', userId)
              .ilike('name', hint)
              .limit(1)
              .maybeSingle();

            if (matchedCat?.id) {
              suggestedCategoryId = matchedCat.id;
            }
          }
        }

        const { error: insertError } = await supabaseAdmin
          .from('monobank_pending_imports')
          .insert({
            user_id: userId,
            integration_id: integration.id,
            external_id: item.id,
            account_id: acc.id,
            time: new Date(item.time * 1000).toISOString(),
            description: item.description,
            mcc: item.mcc,
            original_mcc: item.originalMcc ?? null,
            amount: item.amount,
            operation_amount: item.operationAmount,
            currency_code: item.currencyCode,
            operation_currency_code: item.operationCurrencyCode ?? null,
            hold: item.hold ?? false,
            raw_payload: item,
            suggested_category_id: suggestedCategoryId,
            status: 'pending',
          });

        if (!insertError) {
          importedCount++;
        }
      }
    }

    await supabaseAdmin
      .from('user_integrations')
      .update({
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    return res.status(200).json({ imported: importedCount });
  } catch (err) {
    next(err);
  }
};
