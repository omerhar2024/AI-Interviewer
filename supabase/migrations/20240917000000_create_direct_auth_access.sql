-- Create a function to directly get auth users without using RPC

CREATE OR REPLACE FUNCTION public.get_current_user()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at
  FROM auth.users au
  WHERE au.id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user() TO authenticated;

-- Create a function to manually sync the current user
CREATE OR REPLACE FUNCTION public.sync_current_user()
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_created_at timestamptz;
BEGIN
  -- Get current user info from auth.users
  SELECT id, email, created_at INTO v_user_id, v_email, v_created_at
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, created_at, role)
  VALUES (
    v_user_id,
    v_email,
    v_created_at,
    CASE WHEN v_email = 'omerhar2024@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
    
  -- Insert into subscriptions
  INSERT INTO public.subscriptions (user_id, plan_type, start_date, status)
  VALUES (
    v_user_id,
    'free',
    NOW(),
    'active'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.sync_current_user() TO authenticated;
