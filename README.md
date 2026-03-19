# Cobalt Clean — Internal Operations Hub

Internal web application for Cobalt Clean, a residential and commercial cleaning business in Las Vegas, NV. This is the foundation shell — routing, authentication, and role-based access — that all future tools will be built on top of.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Auth / Database:** Supabase (Google OAuth)
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Hosting:** Vercel

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd cobalt-clean-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the `.env` file

Create a file named `.env` at the project root with your Supabase credentials:

```
VITE_SUPABASE_URL=https://clgygeemezawjzxdcrkm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_pPpgYxG78-lUj_qU-VKMgQ_MNCQa9Fi
```

> The `.env` file is in `.gitignore` and will **never** be committed. Keep your credentials safe.

### 4. Start the dev server

```bash
npm run dev
```

App will be available at `http://localhost:5173`.

---

## Supabase Setup (Jay — Action Required)

### 1. Create the `profiles` table

Run the following SQL in the **Supabase SQL Editor**:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'sales_manager' CHECK (role IN ('owner', 'office_admin', 'sales_manager')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: owner can read all profiles
CREATE POLICY "Owner can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Policy: users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Policy: owner can update any profile (including role changes)
CREATE POLICY "Owner can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Function: auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'sales_manager'
  );
  RETURN NEW;
END;
$$;

-- Trigger: fire on new user insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Enable Google OAuth in Supabase

1. Go to **Supabase Dashboard -> Authentication -> Providers**
2. Enable **Google**
3. Paste in your **Google OAuth Client ID** and **Client Secret** from Google Cloud Console
4. Save

### 3. Add Redirect URLs

In **Supabase Dashboard -> Authentication -> URL Configuration**, add:

- `http://localhost:5173` (for local dev)
- `https://your-vercel-app.vercel.app` (replace with your actual Vercel URL after deploying)

### 4. Set the first owner

After the first user signs up via Google, they'll have the `sales_manager` role by default. Manually promote the owner in the SQL editor:

```sql
UPDATE public.profiles
SET role = 'owner'
WHERE email = 'jay@cobaltclean.com'; -- replace with the owner's actual email
```

---

## Vercel Deployment

### 1. Connect the GitHub repo to Vercel

1. Go to [vercel.com](https://vercel.com) -> **New Project**
2. Import the GitHub repository
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

### 2. Add Environment Variables in Vercel

In **Vercel Project Settings -> Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://clgygeemezawjzxdcrkm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_pPpgYxG78-lUj_qU-VKMgQ_MNCQa9Fi` |

### 3. Deploy

Click **Deploy**. The `vercel.json` at the project root handles client-side routing automatically.

---

## Roles & Access

| Role | Access |
|---|---|
| `owner` | Full access — all tools, user management, all data |
| `office_admin` | All tools except user management |
| `sales_manager` | Sales tools only (Pricing Calculator for now) |

New users who sign in via Google default to `sales_manager`. The owner promotes them via the **User Management** page (`/admin/users`).

---

## Adding a New Tool Page (Future Sessions)

1. Create the page file: `src/pages/YourTool.jsx`
2. Import and use `<Sidebar />` and `<TopBar />` for consistent layout
3. Add a route in `src/App.jsx` inside a `<ProtectedRoute>`
4. Add a nav item in `src/components/Sidebar.jsx`
5. Add a tool card in `src/pages/Dashboard.jsx` with the appropriate `roles` array

---

## Project Structure

```
src/
├── lib/
│   └── supabaseClient.js       <- Supabase client initialization
├── context/
│   └── AuthContext.jsx         <- User + role stored in React context
├── components/
│   ├── ProtectedRoute.jsx      <- Auth + role guard for routes
│   ├── Sidebar.jsx             <- Role-aware navigation sidebar
│   └── TopBar.jsx              <- Top bar with user info + logout
├── pages/
│   ├── Login.jsx               <- Google OAuth login page
│   ├── Dashboard.jsx           <- Role-aware home screen
│   ├── PricingCalculator.jsx   <- Placeholder (full build next session)
│   ├── NotFound.jsx            <- 404 page
│   └── admin/
│       └── Users.jsx           <- Owner-only user management
├── App.jsx                     <- Routing
└── main.jsx                    <- Entry point
```
