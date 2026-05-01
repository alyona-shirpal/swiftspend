-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL references auth.users ON DELETE CASCADE,
    name text NOT NULL,
    icon text NOT NULL,
    color text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL references auth.users ON DELETE CASCADE,
    category_id uuid NOT NULL references public.categories ON DELETE CASCADE,
    description text,
    date date NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL CHECK (currency IN ('UAH', 'ALL', 'EUR', 'USD')),
    amounts jsonb not null default '{}',
    exchange_rate_snapshot jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT expenses_pkey PRIMARY KEY (id)
);

-- Create exchange_rate_cache table
CREATE TABLE IF NOT EXISTS public.exchange_rate_cache (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    base text NOT NULL DEFAULT 'EUR',
    rates jsonb NOT NULL,
    fetched_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT exchange_rate_cache_pkey PRIMARY KEY (id)
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can view their own categories') THEN
        CREATE POLICY "Users can view their own categories" 
            ON public.categories FOR SELECT 
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can insert their own categories') THEN
        CREATE POLICY "Users can insert their own categories" 
            ON public.categories FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can update their own categories') THEN
        CREATE POLICY "Users can update their own categories" 
            ON public.categories FOR UPDATE 
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can delete their own categories') THEN
        CREATE POLICY "Users can delete their own categories" 
            ON public.categories FOR DELETE 
            USING (auth.uid() = user_id);
    END IF;
END
$$;

-- RLS Policies for expenses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can view their own expenses') THEN
        CREATE POLICY "Users can view their own expenses" 
            ON public.expenses FOR SELECT 
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can insert their own expenses') THEN
        CREATE POLICY "Users can insert their own expenses" 
            ON public.expenses FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can update their own expenses') THEN
        CREATE POLICY "Users can update their own expenses" 
            ON public.expenses FOR UPDATE 
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can delete their own expenses') THEN
        CREATE POLICY "Users can delete their own expenses" 
            ON public.expenses FOR DELETE 
            USING (auth.uid() = user_id);
    END IF;
END
$$;

-- RLS Policies for exchange_rate_cache
-- Service role can do everything. Authenticated users can only read.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exchange_rate_cache' AND policyname = 'Anyone can read exchange_rate_cache') THEN
        CREATE POLICY "Anyone can read exchange_rate_cache"
            ON public.exchange_rate_cache FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END
$$;
