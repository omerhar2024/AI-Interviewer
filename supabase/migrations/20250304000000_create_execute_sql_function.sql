-- Create the execute_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql_query;
  result := '{"success": true}'::json;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := json_build_object('success', false, 'error', SQLERRM);
  RETURN result;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO anon;

-- Create the disable_all_rls function if it doesn't exist
CREATE OR REPLACE FUNCTION public.disable_all_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _table text;
BEGIN
  FOR _table IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', _table);
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.disable_all_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_all_rls() TO anon;

-- Add missing columns to subscriptions table if they don't exist

-- Add question_limit column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'subscriptions' 
                AND column_name = 'question_limit') THEN
    ALTER TABLE public.subscriptions ADD COLUMN question_limit INTEGER DEFAULT 10;
  END IF;
END$$;

-- Add perfect_response_limit column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'subscriptions' 
                AND column_name = 'perfect_response_limit') THEN
    ALTER TABLE public.subscriptions ADD COLUMN perfect_response_limit INTEGER DEFAULT 5;
  END IF;
END$$;

-- Add perfect_responses_used column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'subscriptions' 
                AND column_name = 'perfect_responses_used') THEN
    ALTER TABLE public.subscriptions ADD COLUMN perfect_responses_used INTEGER DEFAULT 0;
  END IF;
END$$;

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'subscriptions' 
                AND column_name = 'status') THEN
    ALTER TABLE public.subscriptions ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END$$;
