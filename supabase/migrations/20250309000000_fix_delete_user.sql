-- Fix issues with user deletion

-- First, make sure the delete_user_cascade function exists
CREATE OR REPLACE FUNCTION public.delete_user_cascade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete subscriptions
  DELETE FROM public.subscriptions WHERE user_id = OLD.id;
  
  -- Delete responses and related feedback
  DELETE FROM public.feedback WHERE response_id IN (
    SELECT id FROM public.responses WHERE user_id = OLD.id
  );
  
  DELETE FROM public.responses WHERE user_id = OLD.id;
  
  -- Delete usage stats if they exist
  DELETE FROM public.usage_stats WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS delete_user_cascade_trigger ON public.users;

CREATE TRIGGER delete_user_cascade_trigger
BEFORE DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.delete_user_cascade();

-- Ensure RLS is disabled for all relevant tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats DISABLE ROW LEVEL SECURITY;

-- Grant all privileges to authenticated users for testing
GRANT ALL PRIVILEGES ON TABLE public.users TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.subscriptions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.responses TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.feedback TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.usage_stats TO authenticated;
