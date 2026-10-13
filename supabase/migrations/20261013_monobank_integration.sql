-- Migration for Monobank Integration
-- 1. Update user_integrations table for Monobank support
ALTER TABLE public.user_integrations
  ALTER COLUMN refresh_token DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS encrypted_token text,
  ADD COLUMN IF NOT EXISTS webhook_token uuid DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS monobank_accounts jsonb,
  ADD COLUMN IF NOT EXISTS monobank_client_id text,
  ADD COLUMN IF NOT EXISTS display_name text;

-- Drop original unique constraint on (user_id, provider) to allow multiple monobank instances per user
-- while retaining 1 instance per user for other providers (e.g. google_sheets).
ALTER TABLE public.user_integrations
  DROP CONSTRAINT IF EXISTS user_integrations_user_id_provider_key;

CREATE UNIQUE INDEX IF NOT EXISTS user_integrations_user_id_provider_unique
  ON public.user_integrations (user_id, provider)
  WHERE provider != 'monobank';

CREATE UNIQUE INDEX IF NOT EXISTS user_integrations_user_id_monobank_client_id_unique
  ON public.user_integrations (user_id, monobank_client_id)
  WHERE provider = 'monobank';

-- 2. Create monobank_pending_imports table
CREATE TABLE IF NOT EXISTS public.monobank_pending_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.user_integrations(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  account_id text NOT NULL,
  time timestamptz NOT NULL,
  description text,
  mcc integer,
  original_mcc integer,
  amount bigint NOT NULL,
  operation_amount bigint,
  currency_code integer NOT NULL,
  operation_currency_code integer,
  hold boolean DEFAULT false,
  raw_payload jsonb,
  suggested_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT monobank_pending_imports_user_id_external_id_key UNIQUE (user_id, external_id)
);

ALTER TABLE public.monobank_pending_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own monobank pending imports"
  ON public.monobank_pending_imports
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_monobank_pending_imports_user_status
  ON public.monobank_pending_imports(user_id, status);

CREATE INDEX IF NOT EXISTS idx_monobank_pending_imports_integration
  ON public.monobank_pending_imports(integration_id);

-- 3. Update expenses table for provider and external_id tracking
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE INDEX IF NOT EXISTS idx_expenses_user_provider_external
  ON public.expenses (user_id, provider, external_id);
