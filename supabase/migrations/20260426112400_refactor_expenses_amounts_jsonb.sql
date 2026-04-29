-- Refactor expenses schema to support extensible currencies via jsonb amounts.
-- Safe clean-break migration: no production data exists yet.

-- Drop existing tables that will be replaced
drop table if exists public.expenses cascade;
drop table if exists public.exchange_rate_cache cascade;

-- Drop old report RPCs that referenced fixed currency columns
drop function if exists public.get_daily_report(uuid, date);
drop function if exists public.get_monthly_report(uuid, int, int);
drop function if exists public.get_yearly_report(uuid, int);

-- Clean expenses table
create table public.expenses (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users not null,
  category_id            uuid references public.categories(id) on delete set null,
  description            text,
  date                   date not null default current_date,
  created_at             timestamptz not null default now(),

  -- what the user actually typed
  amount                 numeric not null check (amount > 0),
  currency               text not null,

  -- all converted amounts: { "EUR": 18.40, "USD": 20.10, "UAH": 743.20, "ALL": 2654.00 }
  amounts                jsonb not null default '{}'::jsonb,

  -- full API rates snapshot at moment of entry
  exchange_rate_snapshot jsonb not null
);

-- RLS
alter table public.expenses enable row level security;
create policy "Users own their expenses"
  on public.expenses for all
  using (auth.uid() = user_id);

-- Indexes for fast report queries
create index idx_expenses_user_date
  on public.expenses(user_id, date);

create index idx_expenses_user_created
  on public.expenses(user_id, created_at desc);

create index idx_expenses_category
  on public.expenses(category_id);

create index idx_expenses_amounts
  on public.expenses using gin(amounts);

-- Exchange rate cache — store ALL rates the API returns
create table public.exchange_rate_cache (
  id          uuid primary key default gen_random_uuid(),
  base        text not null default 'EUR',
  rates       jsonb not null,
  fetched_at  timestamptz not null default now()
);

alter table public.exchange_rate_cache enable row level security;
create policy "Anyone can read exchange_rate_cache"
  on public.exchange_rate_cache for select
  to authenticated
  using (true);

-- User currency preferences
create table public.user_currencies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  currency    text not null,
  is_default  boolean not null default false,
  position    integer not null default 0,
  added_at    timestamptz not null default now(),

  unique(user_id, currency)
);

alter table public.user_currencies enable row level security;
create policy "Users own their currency settings"
  on public.user_currencies for all
  using (auth.uid() = user_id);

-- Automatically seed 4 default currencies when a new user signs up
create or replace function public.seed_default_currencies()
returns trigger as $$
begin
  insert into public.user_currencies (user_id, currency, is_default, position) values
    (new.id, 'EUR', true,  0),
    (new.id, 'USD', false, 1),
    (new.id, 'UAH', false, 2),
    (new.id, 'ALL', false, 3);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_user_created on auth.users;
create trigger on_user_created
  after insert on auth.users
  for each row execute procedure public.seed_default_currencies();

