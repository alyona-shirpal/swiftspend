alter table public.expenses
  add column if not exists merchant text,
  add column if not exists normalized_merchant text
    generated always as (nullif(lower(btrim(merchant)), '')) stored;

create index if not exists idx_expenses_user_normalized_merchant
  on public.expenses(user_id, normalized_merchant)
  where normalized_merchant is not null;
