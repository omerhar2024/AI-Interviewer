-- Fix missing columns and functions for user management

-- Add end_date column to subscriptions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'subscriptions' 
                AND column_name = 'end_date') THEN
    ALTER TABLE public.subscriptions ADD COLUMN end_date TIMESTAMPTZ;
  END IF;
END;
$$;

-- Add status column to subscriptions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'subscriptions' 
                AND column_name = 'status') THEN
    ALTER TABLE public.subscriptions ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END;
$$;

-- Create update_user_role function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's role
  UPDATE public.users
  SET role = p_role
  WHERE id = p_user_id;
  
  RETURN;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO anon;

-- Ensure RLS is disabled for admin operations
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;

-- Create list_all_users function if it doesn't exist
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    COALESCE(u.role, 'free')::text as role
  FROM public.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.list_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_all_users() TO anon;

-- Create cascade delete trigger for user deletion
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
  
  -- Delete usage stats
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
