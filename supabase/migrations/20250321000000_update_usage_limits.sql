-- Update usage limits table with default values if they don't exist
INSERT INTO public.usage_limits (plan_type, question_limit, perfect_response_limit)
VALUES 
  ('free', 10, 10),
  ('premium', 10, 10)
ON CONFLICT (plan_type) DO UPDATE
SET 
  question_limit = EXCLUDED.question_limit,
  perfect_response_limit = EXCLUDED.perfect_response_limit,
  updated_at = now();
