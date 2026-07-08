alter table public.expenses
  add column if not exists normalized_description text
  generated always as (nullif(lower(btrim(description)), '')) stored;

create index if not exists idx_expenses_user_category_normalized_description
  on public.expenses(user_id, category_id, normalized_description)
  where normalized_description is not null;
