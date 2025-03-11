-- Update usage limits table with specific values
UPDATE public.usage_limits
SET 
  perfect_response_limit = 20,
  question_limit = 30,
  updated_at = now()
WHERE plan_type = 'free';

UPDATE public.usage_limits
SET 
  perfect_response_limit = 200,
  question_limit = -1,
  updated_at = now()
WHERE plan_type = 'premium';
