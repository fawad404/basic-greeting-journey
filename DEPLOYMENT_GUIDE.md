# Deployment Guide - Ads Gorilla Customer Panel

This guide will help you deploy this application independently using your own Supabase project.

## Prerequisites

1. A [Supabase](https://supabase.com) account and project
2. A [Vercel](https://vercel.com) account (or any hosting platform)

## Step 1: Set Up Your Supabase Project

### 1.1 Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details and wait for it to be created

### 1.2 Get Your API Credentials

1. Go to Project Settings → API
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key**

### 1.3 Set Up Database Schema

Run the following SQL in your Supabase SQL Editor to create all necessary tables:

```sql
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  telegram_id TEXT,
  telegram_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create ad_accounts table
CREATE TABLE public.ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  account_name TEXT NOT NULL,
  account_id TEXT,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  spend DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create requests table (for replacement/change access requests)
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (id IN (
    SELECT user_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- Admins can view all data
CREATE POLICY "Admins can view all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Similar policies for other tables (payments, ad_accounts, tickets, requests)
CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.users WHERE id IN (
      SELECT user_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Admins view all payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### 1.4 Configure Authentication

1. Go to Authentication → URL Configuration
2. Set **Site URL** to your deployed URL (or `http://localhost:5173` for local)
3. Add **Redirect URLs**:
   - `http://localhost:5173/**` (for local development)
   - `https://your-vercel-domain.vercel.app/**` (for production)

4. Go to Authentication → Providers
5. Enable **Email** authentication
6. Disable "Confirm email" for easier testing (optional)

## Step 2: Local Development Setup

### 2.1 Create Environment File

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2.2 Install Dependencies and Run

```bash
npm install
npm run dev
```

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub

1. Create a new GitHub repository
2. Push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### 3.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add Environment Variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click "Deploy"

### 3.3 Update Supabase Redirect URLs

After deployment:
1. Copy your Vercel deployment URL
2. Go back to Supabase → Authentication → URL Configuration
3. Add your Vercel URL to Redirect URLs

## Step 4: Create Admin User

After deployment, you need to create an admin user:

1. Sign up through your app's UI
2. Go to your Supabase SQL Editor and run:

```sql
-- Replace 'user-uuid-here' with the actual UUID from auth.users
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists locally
- Make sure environment variables are set in Vercel

### "requested path is invalid" error
- Check that redirect URLs are properly configured in Supabase
- Make sure Site URL matches your deployment URL

### Can't see data
- Check RLS policies are properly set up
- Make sure you have a user_role assigned (admin or customer)

## Current File Structure

The app now uses a single Supabase client from `src/lib/supabaseClient.js`.

All imports should use:
```typescript
import { supabase } from '@/lib/supabaseClient';
```

## Support

For issues or questions, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
