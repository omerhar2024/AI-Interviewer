-- Fix user sync issues

-- 1. Make sure both users are in the public.users table
INSERT INTO public.users (id, email, created_at, role)
SELECT id, email, created_at, 
  CASE WHEN email IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com') THEN 'admin' ELSE 'user' END
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 2. Make sure both users have subscriptions
INSERT INTO public.subscriptions (user_id, plan_type, start_date, status, question_limit, perfect_response_limit)
SELECT id, 'free', NOW(), 'active', 10, 5
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 3. Drop the sync_all_users function since it's causing issues
DROP FUNCTION IF EXISTS public.sync_all_users();

-- 4. Create a simpler direct query function that doesn't rely on RPC
CREATE OR REPLACE FUNCTION public.get_all_users()
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
    SELECT u.id, u.email, u.created_at, u.role
    FROM public.users u;
  ELSE
    -- For non-admin users, return only their own record
    RETURN QUERY
    SELECT u.id, u.email, u.created_at, u.role
    FROM public.users u
    WHERE u.id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
