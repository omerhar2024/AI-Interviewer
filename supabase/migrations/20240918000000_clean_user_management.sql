-- Clean User Management System
-- This migration creates a clean, simplified user management system

-- 1. Create or update the users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role TEXT NOT NULL DEFAULT 'user',
  UNIQUE(email)
);

-- 2. Create or update the subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
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

-- 3. Create a trigger to automatically sync users from auth.users to public.users
CREATE OR REPLACE FUNCTION public.sync_user_on_auth_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user into public.users
  INSERT INTO public.users (id, email, created_at, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.created_at, NOW()),
    CASE WHEN NEW.email = 'omerhar2024@gmail.com' OR NEW.email = 'omerhar206@gmail.com' THEN 'admin' ELSE 'user' END
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

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS sync_users_on_signup ON auth.users;

CREATE TRIGGER sync_users_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_on_auth_signup();

-- 4. Create a function to list all users (for admin access)
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
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com') THEN
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

-- 5. Create a function to update user subscription plans
CREATE OR REPLACE FUNCTION public.update_user_subscription(
  p_user_id UUID,
  p_plan_type TEXT,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow admin users to update other users' subscriptions
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com') OR auth.uid() = p_user_id THEN
    -- Update the subscription
    INSERT INTO public.subscriptions (
      user_id,
      plan_type,
      start_date,
      end_date,
      status,
      updated_at
    )
    VALUES (
      p_user_id,
      p_plan_type,
      NOW(),
      p_end_date,
      'active',
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan_type = EXCLUDED.plan_type,
      end_date = EXCLUDED.end_date,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at;
      
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_subscription(UUID, TEXT, TIMESTAMPTZ) TO authenticated;

-- 6. Create a function to get current user details
CREATE OR REPLACE FUNCTION public.get_current_user()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  role text,
  plan_type text,
  end_date timestamptz,
  status text,
  question_limit integer,
  perfect_response_limit integer,
  perfect_responses_used integer
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.created_at,
    u.role,
    s.plan_type,
    s.end_date,
    s.status,
    s.question_limit,
    s.perfect_response_limit,
    s.perfect_responses_used
  FROM public.users u
  LEFT JOIN public.subscriptions s ON u.id = s.user_id
  WHERE u.id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user() TO authenticated;

-- 7. Create a function to sync existing users (one-time operation)
CREATE OR REPLACE FUNCTION public.sync_all_users()
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER := 0;
  v_user RECORD;
  v_admin_emails TEXT[] := ARRAY['omerhar2024@gmail.com', 'omerhar206@gmail.com'];
BEGIN
  -- Only allow admin users to run this function
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(v_admin_emails) THEN
    -- Loop through all auth users
    FOR v_user IN SELECT id, email, created_at FROM auth.users LOOP
      -- Insert into public.users
      INSERT INTO public.users (id, email, created_at, role)
      VALUES (
        v_user.id,
        v_user.email,
        v_user.created_at,
        CASE WHEN v_user.email = ANY(v_admin_emails) THEN 'admin' ELSE 'user' END
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
        
      -- Insert into subscriptions
      INSERT INTO public.subscriptions (user_id, plan_type, start_date, status)
      VALUES (
        v_user.id,
        'free',
        NOW(),
        'active'
      )
      ON CONFLICT (user_id) DO NOTHING;
      
      v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
  ELSE
    RETURN 0;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.sync_all_users() TO authenticated;

-- 8. Set up proper RLS policies for both tables
-- Enable row level security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for the users table
DROP POLICY IF EXISTS "Users can view their own user" ON public.users;
CREATE POLICY "Users can view their own user"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;
CREATE POLICY "Admin can manage all users"
  ON public.users
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com'));

-- Create policies for the subscriptions table
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admin can manage all subscriptions"
  ON public.subscriptions
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com'));

-- 9. Sync existing users
SELECT public.sync_all_users();
