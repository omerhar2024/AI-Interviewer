-- Ensure usage_limits table exists with correct structure
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT NOT NULL UNIQUE,
  question_limit INTEGER NOT NULL,
  perfect_response_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create or replace function to ensure usage limits are set
CREATE OR REPLACE FUNCTION ensure_usage_limits()
RETURNS VOID AS $$
BEGIN
  -- Insert free plan if it doesn't exist
  INSERT INTO public.usage_limits (plan_type, question_limit, perfect_response_limit)
  VALUES ('free', 20, 20)
  ON CONFLICT (plan_type) DO NOTHING;
  
  -- Insert premium plan if it doesn't exist
  INSERT INTO public.usage_limits (plan_type, question_limit, perfect_response_limit)
  VALUES ('premium', -1, 200)
  ON CONFLICT (plan_type) DO NOTHING;
  
  -- Log that the function ran
  RAISE NOTICE 'Usage limits ensured';
END;
$$ LANGUAGE plpgsql;

-- Run the function to ensure limits exist
SELECT ensure_usage_limits();

-- Add RLS policies to allow read access to all authenticated users
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access for all users" ON public.usage_limits;
CREATE POLICY "Allow read access for all users"
  ON public.usage_limits
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admin write access" ON public.usage_limits;
CREATE POLICY "Allow admin write access"
  ON public.usage_limits
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND (users.role = 'admin')
  ));
