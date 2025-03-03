-- Fix issues with user deletion - final version

-- Ensure RLS is disabled for all relevant tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats DISABLE ROW LEVEL SECURITY;

-- Grant all privileges to authenticated users
GRANT ALL PRIVILEGES ON TABLE public.users TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.subscriptions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.responses TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.feedback TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.usage_stats TO authenticated;

-- Create a direct delete function that bypasses checks
CREATE OR REPLACE FUNCTION public.delete_user_direct(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete subscriptions
  DELETE FROM public.subscriptions WHERE user_id = p_user_id;
  
  -- Delete feedback for all responses
  DELETE FROM public.feedback 
  WHERE response_id IN (SELECT id FROM public.responses WHERE user_id = p_user_id);
  
  -- Delete responses
  DELETE FROM public.responses WHERE user_id = p_user_id;
  
  -- Delete usage stats
  DELETE FROM public.usage_stats WHERE user_id = p_user_id;
  
  -- Delete the user
  DELETE FROM public.users WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.delete_user_direct(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_direct(UUID) TO anon;
