-- Ensure usage_limits table exists with correct structure
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT NOT NULL UNIQUE,
  question_limit INTEGER NOT NULL,
  perfect_response_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Delete any duplicate records if they exist
DELETE FROM public.usage_limits
WHERE id NOT IN (
  SELECT MIN(id::text)::uuid
  FROM public.usage_limits
  GROUP BY plan_type
);

-- Ensure free plan exists
INSERT INTO public.usage_limits (plan_type, question_limit, perfect_response_limit, updated_at)
VALUES ('free', 10, 10, now())
ON CONFLICT (plan_type) 
DO UPDATE SET 
  question_limit = 10,
  perfect_response_limit = 10,
  updated_at = now();

-- Ensure premium plan exists
INSERT INTO public.usage_limits (plan_type, question_limit, perfect_response_limit, updated_at)
VALUES ('premium', 20, 20, now())
ON CONFLICT (plan_type) 
DO UPDATE SET 
  question_limit = 20,
  perfect_response_limit = 20,
  updated_at = now();

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
