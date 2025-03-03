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
