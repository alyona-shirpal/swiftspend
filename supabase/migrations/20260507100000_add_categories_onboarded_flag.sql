-- Add a categories_onboarded_at column to user_currencies
-- We store this on a new user_profiles table to track onboarding completion
-- without polluting the per-currency rows.

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  categories_onboarded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile"
      ON public.user_profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile"
      ON public.user_profiles FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Seed a profile row for every new user
CREATE OR REPLACE FUNCTION public.seed_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_profile ON auth.users;
CREATE TRIGGER on_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.seed_user_profile();

-- Backfill: create profile rows for existing users who don't have one yet,
-- and mark them as onboarded so they are NOT sent back through onboarding.
INSERT INTO public.user_profiles (user_id, categories_onboarded_at)
SELECT id, now()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;
