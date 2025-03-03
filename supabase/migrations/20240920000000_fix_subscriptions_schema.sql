-- Fix subscriptions schema issues

-- 1. Check if status column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'subscriptions' 
                AND column_name = 'status') THEN
    ALTER TABLE public.subscriptions ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
END$$;

-- 2. Make sure all required columns exist with proper defaults
DO $$
BEGIN
  -- Add end_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'subscriptions' 
                AND column_name = 'end_date') THEN
    ALTER TABLE public.subscriptions ADD COLUMN end_date TIMESTAMPTZ;
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

-- 3. Create a direct function to get users that doesn't rely on RPC
CREATE OR REPLACE FUNCTION public.direct_get_users()
RETURNS SETOF public.users
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com') THEN
    RETURN QUERY
    SELECT * FROM public.users;
  ELSE
    -- For non-admin users, return only their own record
    RETURN QUERY
    SELECT * FROM public.users WHERE id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.direct_get_users() TO authenticated;

-- 4. Create a direct function to update subscriptions
CREATE OR REPLACE FUNCTION public.direct_update_subscription(
  p_user_id UUID,
  p_plan_type TEXT,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow admin users to update other users' subscriptions
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com') OR auth.uid() = p_user_id THEN
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
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.direct_update_subscription(UUID, TEXT, TIMESTAMPTZ) TO authenticated;

-- 5. Make sure both admin users exist and have proper roles
INSERT INTO public.users (id, email, created_at, role)
SELECT id, email, created_at, 'admin'
FROM auth.users
WHERE email IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 6. Make sure both admin users have subscriptions
INSERT INTO public.subscriptions (user_id, plan_type, start_date, status, question_limit, perfect_response_limit)
SELECT id, 'premium', NOW(), 'active', -1, -1
FROM auth.users
WHERE email IN ('omerhar2024@gmail.com', 'omerhar206@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET
  plan_type = 'premium',
  status = 'active',
  question_limit = -1,
  perfect_response_limit = -1;
