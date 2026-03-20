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

-- ============================================================
-- NDFU (Next-Day Follow-Up) Sales Dashboard
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ndfu_clients (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name          text,
  last_name           text,
  phone               text,
  email               text,
  service_type        text,
  service_date        date,
  cleaner_name        text,
  price_paid          numeric,
  recurring_weekly    numeric,
  recurring_biweekly  numeric,
  recurring_monthly   numeric,
  job_notes           text,
  ndfu_status         text DEFAULT 'pending'
                      CHECK (ndfu_status IN ('pending','reached','voicemail','no_answer','converted','not_interested','callback')),
  ndfu_stage          text DEFAULT 'ndfu1'
                      CHECK (ndfu_stage IN ('ndfu1','ndfu1_offer','ndfu2','complete')),
  call_notes          text,
  feedback            text,
  best_part           text,
  interested_in_recurring boolean DEFAULT false,
  frequency_selected  text,
  preferred_days      text,
  preferred_times     text,
  preferred_cleaner   text,
  other_preferences   text,
  offer_expiry        timestamptz,
  referral_mentioned  boolean DEFAULT false,
  review_link_sent    boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id)
);

ALTER TABLE public.ndfu_clients ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on every change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS ndfu_clients_updated_at ON public.ndfu_clients;
CREATE TRIGGER ndfu_clients_updated_at
  BEFORE UPDATE ON public.ndfu_clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: all three staff roles can read and write every row
CREATE POLICY "Staff can select ndfu_clients"
  ON public.ndfu_clients FOR SELECT
  USING (public.current_user_role() IN ('owner','office_admin','sales_manager'));

CREATE POLICY "Staff can insert ndfu_clients"
  ON public.ndfu_clients FOR INSERT
  WITH CHECK (public.current_user_role() IN ('owner','office_admin','sales_manager'));

CREATE POLICY "Staff can update ndfu_clients"
  ON public.ndfu_clients FOR UPDATE
  USING (public.current_user_role() IN ('owner','office_admin','sales_manager'));

CREATE POLICY "Staff can delete ndfu_clients"
  ON public.ndfu_clients FOR DELETE
  USING (public.current_user_role() IN ('owner','office_admin','sales_manager'));
