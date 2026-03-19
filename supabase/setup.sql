-- ============================================================
-- Cobalt Clean — Supabase Database Setup
-- Run this in the Supabase SQL Editor to initialize the schema.
-- ============================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'sales_manager' CHECK (role IN ('owner', 'office_admin', 'sales_manager')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own profile (by auth UUID)
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: users can read their own profile by email (fallback for rows
-- pre-inserted before first OAuth sign-in, where the id may differ)
CREATE POLICY "Users can read own profile by email"
  ON public.profiles FOR SELECT
  USING (auth.email() = email);

-- Helper: returns the current user's role without touching RLS-protected rows.
-- SECURITY DEFINER runs as the function owner (postgres), bypassing RLS on the
-- sub-query and breaking the recursive loop that the policies below would
-- otherwise create.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Policy: owner can read all profiles
CREATE POLICY "Owner can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.current_user_role() = 'owner');

-- Policy: users can update their own profile (role field is protected)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = public.current_user_role()
  );

-- Policy: owner can update any profile (including role)
CREATE POLICY "Owner can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.current_user_role() = 'owner');

-- Function: auto-insert profile row when a new user signs up via OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    'sales_manager'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: fire after every new auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- After the first owner signs up, run this to promote them:
-- UPDATE public.profiles SET role = 'owner' WHERE email = 'jay@cobaltclean.com';
-- ============================================================
