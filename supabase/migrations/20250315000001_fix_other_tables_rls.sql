-- Enable RLS on other tables that might need it

-- Check and fix usage_stats table
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_stats') THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY';
    
    -- Create admin policy
    EXECUTE 'CREATE POLICY IF NOT EXISTS admin_all_access_usage_stats ON public.usage_stats 
             FOR ALL 
             TO authenticated
             USING (
               EXISTS (
                 SELECT 1 FROM public.users
                 WHERE users.id = auth.uid() AND (users.role = ''admin'')
               )
             )';
    
    -- Check if user_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usage_stats' AND column_name = 'user_id') THEN
      -- Create user policy
      EXECUTE 'CREATE POLICY IF NOT EXISTS user_own_access_usage_stats ON public.usage_stats 
               FOR ALL 
               TO authenticated
               USING (user_id = auth.uid())';
    END IF;
  END IF;
END
$$;

-- Check and fix responses table
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'responses') THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY';
    
    -- Create admin policy
    EXECUTE 'CREATE POLICY IF NOT EXISTS admin_all_access_responses ON public.responses 
             FOR ALL 
             TO authenticated
             USING (
               EXISTS (
                 SELECT 1 FROM public.users
                 WHERE users.id = auth.uid() AND (users.role = ''admin'')
               )
             )';
    
    -- Check if user_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'responses' AND column_name = 'user_id') THEN
      -- Create user policy
      EXECUTE 'CREATE POLICY IF NOT EXISTS user_own_access_responses ON public.responses 
               FOR ALL 
               TO authenticated
               USING (user_id = auth.uid())';
    END IF;
  END IF;
END
$$;

-- Check and fix feedback table
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedback') THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY';
    
    -- Create admin policy
    EXECUTE 'CREATE POLICY IF NOT EXISTS admin_all_access_feedback ON public.feedback 
             FOR ALL 
             TO authenticated
             USING (
               EXISTS (
                 SELECT 1 FROM public.users
                 WHERE users.id = auth.uid() AND (users.role = ''admin'')
               )
             )';
    
    -- Check if response_id column exists for joining to responses
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feedback' AND column_name = 'response_id') THEN
      -- Create user policy based on response ownership
      EXECUTE 'CREATE POLICY IF NOT EXISTS user_own_access_feedback ON public.feedback 
               FOR ALL 
               TO authenticated
               USING (
                 EXISTS (
                   SELECT 1 FROM public.responses
                   WHERE responses.id = feedback.response_id AND responses.user_id = auth.uid()
                 )
               )';
    END IF;
  END IF;
END
$$;
