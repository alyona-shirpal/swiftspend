-- SwiftSpend: user_integrations table for third-party sync (Google Sheets etc.)
-- SYNC_SPEC_V1: this table drives the Google Sheets auto-sync feature
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        text NOT NULL,         -- 'google_sheets'
  spreadsheet_id  text,                  -- Google Spreadsheet ID once created
  refresh_token   text NOT NULL,         -- long-lived Google OAuth refresh token
  last_synced_at  timestamptz,
  sync_status     text DEFAULT 'idle',   -- 'idle' | 'syncing' | 'error'
  sync_error      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own integrations"
  ON public.user_integrations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
