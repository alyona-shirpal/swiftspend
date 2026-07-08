alter table public.categories
  add column if not exists is_hidden boolean not null default false;
