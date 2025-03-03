-- Emergency fix for database issues

-- 1. Drop all problematic functions
DROP FUNCTION IF EXISTS public.sync_all_users() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_users() CASCADE;
DROP FUNCTION IF EXISTS public.direct_get_users() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_subscription(UUID, TEXT, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS public.direct_update_subscription(UUID, TEXT, TIMESTAMPTZ) CASCADE;

-- 2. Create a simple function to get users directly
CREATE OR REPLACE FUNCTION public.get_users()
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.users;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_users() TO authenticated;

-- 3. Create a simple function to update subscriptions directly
CREATE OR REPLACE FUNCTION public.update_subscription(
  p_user_id UUID,
  p_plan_type TEXT,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the subscription
  UPDATE public.subscriptions
  SET 
    plan_type = p_plan_type,
    end_date = p_end_date,
    status = 'active',
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no rows were updated, insert a new subscription
  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan_type,
      start_date,
      end_date,
      status,
      question_limit,
      perfect_response_limit,
      perfect_responses_used
    ) VALUES (
      p_user_id,
      p_plan_type,
      NOW(),
      p_end_date,
      'active',
      CASE WHEN p_plan_type = 'premium' THEN -1 ELSE 10 END,
      CASE WHEN p_plan_type = 'premium' THEN 50 ELSE 5 END,
      0
    );
  END IF;
    
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_subscription(UUID, TEXT, TIMESTAMPTZ) TO authenticated;

-- 4. Make sure all required columns exist in subscriptions table
DO $$
BEGIN
  -- Add status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'subscriptions' 
                AND column_name = 'status') THEN
    ALTER TABLE public.subscriptions ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
  
  -- Add question_limit if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'subscriptions' 
                AND column_name = 'question_limit') THEN
    ALTER TABLE public.subscriptions ADD COLUMN question_limit INTEGER DEFAULT 10;
  END IF;
  
  -- Add perfect_response_limit if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'subscriptions' 
                AND column_name = 'perfect_response_limit') THEN
    ALTER TABLE public.subscriptions ADD COLUMN perfect_response_limit INTEGER DEFAULT 5;
  END IF;
  
  -- Add perfect_responses_used if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'subscriptions' 
                AND column_name = 'perfect_responses_used') THEN
    ALTER TABLE public.subscriptions ADD COLUMN perfect_responses_used INTEGER DEFAULT 0;
  END IF;
END$$;

-- 5. Directly insert admin users
INSERT INTO public.users (id, email, created_at, role)
SELECT id, email, created_at, 'admin'
FROM auth.users
WHERE email IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 6. Directly insert admin subscriptions
INSERT INTO public.subscriptions (user_id, plan_type, start_date, status, question_limit, perfect_response_limit)
SELECT id, 'premium', NOW(), 'active', -1, -1
FROM auth.users
WHERE email IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET
  plan_type = 'premium',
  status = 'active',
  question_limit = -1,
  perfect_response_limit = -1;
