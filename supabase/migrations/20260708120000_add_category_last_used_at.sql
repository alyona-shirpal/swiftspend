alter table public.categories
  add column if not exists last_used_at timestamptz;

update public.categories c
set last_used_at = latest.latest_created_at
from (
  select category_id, max(created_at) as latest_created_at
  from public.expenses
  where category_id is not null
  group by category_id
) latest
where c.id = latest.category_id
  and c.last_used_at is null;

create index if not exists idx_categories_user_last_used
  on public.categories(user_id, last_used_at desc nulls last, name);
