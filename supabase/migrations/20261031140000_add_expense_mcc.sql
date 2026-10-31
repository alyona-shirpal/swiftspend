-- Migration: Add mcc column to expenses for intelligent category assignment
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS mcc integer;

CREATE INDEX IF NOT EXISTS idx_expenses_user_mcc
  ON public.expenses (user_id, mcc)
  WHERE mcc IS NOT NULL;

-- Backfill mcc from monobank_pending_imports for already accepted imports
UPDATE public.expenses e
SET mcc = mpi.mcc
FROM public.monobank_pending_imports mpi
WHERE mpi.expense_id = e.id
  AND mpi.mcc IS NOT NULL
  AND e.mcc IS NULL;
