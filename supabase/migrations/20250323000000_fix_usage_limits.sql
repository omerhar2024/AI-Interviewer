-- Ensure usage_limits table exists
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT NOT NULL UNIQUE,
  question_limit INTEGER NOT NULL DEFAULT 10,
  perfect_response_limit INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert or update the free plan with specific values
INSERT INTO public.usage_limits (plan_type, question_limit, perfect_response_limit, updated_at)
VALUES ('free', 20, 20, now())
ON CONFLICT (plan_type) 
DO UPDATE SET 
  question_limit = 20,
  perfect_response_limit = 20,
  updated_at = now();

-- Insert or update the premium plan with specific values
INSERT INTO public.usage_limits (plan_type, question_limit, perfect_response_limit, updated_at)
VALUES ('premium', -1, 200, now())
ON CONFLICT (plan_type) 
DO UPDATE SET 
  question_limit = -1,
  perfect_response_limit = 200,
  updated_at = now();
