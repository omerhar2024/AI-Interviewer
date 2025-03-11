-- Update user subscription status to reflect current plan

-- First, ensure all users have a subscription record
INSERT INTO public.subscriptions (user_id, plan_type, tier, status, start_date, end_date, question_limit, perfect_response_limit, perfect_responses_used)
SELECT 
  id as user_id, 
  'free' as plan_type, 
  'free' as tier, 
  'active' as status, 
  now() as start_date, 
  '2099-12-31'::timestamp as end_date,
  10 as question_limit,
  5 as perfect_response_limit,
  0 as perfect_responses_used
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- Update subscription limits based on usage_limits table
UPDATE public.subscriptions s
SET 
  question_limit = CASE 
    WHEN s.plan_type = 'premium' THEN (SELECT question_limit FROM public.usage_limits WHERE plan_type = 'premium')
    ELSE (SELECT question_limit FROM public.usage_limits WHERE plan_type = 'free')
  END,
  perfect_response_limit = CASE 
    WHEN s.plan_type = 'premium' THEN (SELECT perfect_response_limit FROM public.usage_limits WHERE plan_type = 'premium')
    ELSE (SELECT perfect_response_limit FROM public.usage_limits WHERE plan_type = 'free')
  END
WHERE EXISTS (SELECT 1 FROM public.usage_limits);
