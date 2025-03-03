-- Create the delete_user_direct function
CREATE OR REPLACE FUNCTION public.delete_user_direct(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete related feedback records first
  DELETE FROM public.feedback
  WHERE response_id IN (SELECT id FROM public.responses WHERE user_id = p_user_id);
  
  -- Delete responses
  DELETE FROM public.responses WHERE user_id = p_user_id;
  
  -- Delete subscription
  DELETE FROM public.subscriptions WHERE user_id = p_user_id;
  
  -- Delete usage stats if they exist
  DELETE FROM public.usage_stats WHERE user_id = p_user_id;
  
  -- Finally delete the user
  DELETE FROM public.users WHERE id = p_user_id;
  
  -- Note: We can't delete from auth.users as that requires admin privileges
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.delete_user_direct(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_direct(UUID) TO anon;

-- Ensure RLS is disabled for all relevant tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats DISABLE ROW LEVEL SECURITY;

-- Add status column to subscriptions if it doesn't exist
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
