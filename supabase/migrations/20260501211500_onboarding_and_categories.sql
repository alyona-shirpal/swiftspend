-- Remove auto-currency seeding
drop trigger if exists on_user_created on auth.users;
drop function if exists public.seed_default_currencies();

-- Add is_system column to categories
alter table public.categories
add column if not exists is_system boolean not null default false;

-- Create a trigger to seed default categories on signup
create or replace function public.seed_default_categories()
returns trigger as $$
begin
  insert into public.categories (user_id, name, icon, color, is_system) values
    (new.id, 'Food & Drinks',  'restaurant',     '#FF6B6B', true),
    (new.id, 'Transport',      'directions_car', '#4ECDC4', true),
    (new.id, 'Shopping',       'shopping_bag',   '#45B7D1', true),
    (new.id, 'Home',           'home',           '#96CEB4', true),
    (new.id, 'Health',         'favorite',       '#FFEAA7', true),
    (new.id, 'Entertainment',  'movie',          '#DDA0DD', true),
    (new.id, 'Beauty',         'face',           '#F0E68C', true),
    (new.id, 'Education',      'school',         '#98D8C8', true),
    (new.id, 'Travel',         'flight',         '#FFB347', true),
    (new.id, 'Other',          'category',       '#B0B0B0', true);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_created_categories on auth.users;
create trigger on_user_created_categories
  after insert on auth.users
  for each row execute procedure public.seed_default_categories();
