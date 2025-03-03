-- Disable RLS on all tables to ensure admin access
CREATE OR REPLACE FUNCTION disable_all_rls()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to make a user an admin
CREATE OR REPLACE FUNCTION make_user_admin(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Update user role to admin
  UPDATE public.users
  SET role = 'admin', updated_at = NOW()
  WHERE id = user_id;
  
  -- Ensure user has a premium subscription
  INSERT INTO public.subscriptions (
    user_id, plan_type, start_date, status, 
    question_limit, perfect_response_limit, perfect_responses_used
  )
  VALUES (
    user_id, 'premium', NOW(), 'active', 
    -1, 50, 0
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    plan_type = 'premium',
    status = 'active',
    question_limit = -1,
    perfect_response_limit = 50;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS boolean AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO is_admin FROM public.users WHERE id = user_id;
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
