-- Fix the subscriptions table schema to ensure it has all required columns

-- First check if the table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.subscriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      plan_type TEXT NOT NULL DEFAULT 'free',
      start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      end_date TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'active',
      question_limit INTEGER DEFAULT 10,
      perfect_response_limit INTEGER DEFAULT 5,
      perfect_responses_used INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    );
  ELSE
    -- Add missing columns if they don't exist
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'question_limit') THEN
        ALTER TABLE public.subscriptions ADD COLUMN question_limit INTEGER DEFAULT 10;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Column might already exist
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'perfect_response_limit') THEN
        ALTER TABLE public.subscriptions ADD COLUMN perfect_response_limit INTEGER DEFAULT 5;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Column might already exist
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'perfect_responses_used') THEN
        ALTER TABLE public.subscriptions ADD COLUMN perfect_responses_used INTEGER DEFAULT 0;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Column might already exist
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'status') THEN
        ALTER TABLE public.subscriptions ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Column might already exist
    END;
  END IF;
END $$;

-- Create or replace the function to sync users from auth to public
CREATE OR REPLACE FUNCTION public.sync_user_on_auth_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user into public.users
  INSERT INTO public.users (id, email, created_at, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
    
  -- Also create a default subscription for the user
  INSERT INTO public.subscriptions (
    user_id,
    plan_type,
    start_date,
    status,
    question_limit,
    perfect_response_limit,
    perfect_responses_used
  )
  VALUES (
    NEW.id,
    'free',
    NOW(),
    'active',
    10,
    5,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the secure function to list all users
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  role text
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) = 'omerhar2024@gmail.com' THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      au.created_at,
      COALESCE(au.raw_user_meta_data->>'role', 'user') as role
    FROM auth.users au;
  ELSE
    -- For non-admin users, return only their own record
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      au.created_at,
      COALESCE(au.raw_user_meta_data->>'role', 'user') as role
    FROM auth.users au
    WHERE au.id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.list_all_users() TO authenticated;
