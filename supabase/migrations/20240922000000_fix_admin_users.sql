-- Direct fix for admin users

-- 1. Make sure both admin users exist in the users table
INSERT INTO public.users (id, email, created_at, role)
SELECT id, email, created_at, 'admin'
FROM auth.users
WHERE email IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 2. Make sure both admin users have premium subscriptions
INSERT INTO public.subscriptions (user_id, plan_type, start_date, status, question_limit, perfect_response_limit)
SELECT id, 'premium', NOW(), 'active', -1, -1
FROM auth.users
WHERE email IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET
  plan_type = 'premium',
  status = 'active',
  question_limit = -1,
  perfect_response_limit = -1;
