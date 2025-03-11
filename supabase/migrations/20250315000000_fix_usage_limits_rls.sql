-- Enable RLS on the usage_limits table
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to have full access to usage_limits
CREATE POLICY admin_all_access_usage_limits ON public.usage_limits 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND (users.role = 'admin')
  )
);

-- Check if the table has a user_id column
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_limits' 
    AND column_name = 'user_id'
  ) INTO column_exists;

  -- If user_id column exists, create policy for users to access their own data
  IF column_exists THEN
    EXECUTE 'CREATE POLICY user_own_access_usage_limits ON public.usage_limits 
             FOR ALL 
             TO authenticated
             USING (user_id = auth.uid())';
  END IF;
END
$$;

-- If the table doesn't have user_id column but has id column that references users
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_limits' 
    AND column_name = 'id'
  ) INTO column_exists;

  -- If id column exists, create policy for users to access their own data
  IF column_exists THEN
    EXECUTE 'CREATE POLICY user_id_access_usage_limits ON public.usage_limits 
             FOR ALL 
             TO authenticated
             USING (id = auth.uid())';
  END IF;
END
$$;
