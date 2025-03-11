-- Create or update the users table structure
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- Update existing users based on their current subscription status
UPDATE public.users u
SET subscription_plan = CASE
    WHEN EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id AND (s.plan_type = 'premium' OR s.tier = 'premium') AND s.status = 'active') THEN 'premium'
    WHEN EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id AND (s.plan_type = 'premium' OR s.tier = 'premium') AND s.status = 'canceled' AND s.end_date > NOW()) THEN 'premium'
    ELSE 'free'
  END,
subscription_end_date = (
  SELECT s.end_date 
  FROM public.subscriptions s 
  WHERE s.user_id = u.id 
  LIMIT 1
);

-- Create function to get user plan and limits
CREATE OR REPLACE FUNCTION get_user_plan_and_limits(user_id uuid)
RETURNS TABLE (
  subscription_plan text,
  subscription_end_date timestamp with time zone,
  role text,
  question_limit integer,
  perfect_response_limit integer,
  questions_used integer,
  perfect_responses_used integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(u.subscription_plan, 'free'),
    u.subscription_end_date,
    COALESCE(u.role, 'free'),
    COALESCE(ul.question_limit, 10),
    COALESCE(ul.perfect_response_limit, 5),
    COALESCE((SELECT used FROM usage_stats WHERE user_id = $1 LIMIT 1), 0) AS questions_used,
    COALESCE((SELECT perfect_responses_used FROM subscriptions WHERE user_id = $1 LIMIT 1), 0) AS perfect_responses_used
  FROM users u
  LEFT JOIN usage_limits ul ON ul.plan_type = COALESCE(u.subscription_plan, 'free')
  WHERE u.id = $1;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync user subscription data
CREATE OR REPLACE FUNCTION sync_user_subscription(user_id uuid)
RETURNS boolean AS $$
DECLARE
  sub_record RECORD;
  user_record RECORD;
BEGIN
  -- Get subscription data
  SELECT * INTO sub_record FROM subscriptions WHERE user_id = $1 LIMIT 1;
  
  -- Get user data
  SELECT * INTO user_record FROM users WHERE id = $1 LIMIT 1;
  
  -- Update user subscription_plan based on subscription status
  UPDATE users
  SET 
    subscription_plan = CASE
      WHEN user_record.role = 'admin' THEN 'premium'
      WHEN sub_record.plan_type = 'premium' OR sub_record.tier = 'premium' THEN
        CASE
          WHEN sub_record.status = 'active' OR (sub_record.status = 'canceled' AND sub_record.end_date > NOW()) THEN 'premium'
          ELSE 'free'
        END
      ELSE 'free'
    END,
    subscription_end_date = sub_record.end_date
  WHERE id = $1;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync user subscription data on subscription changes
CREATE OR REPLACE FUNCTION sync_subscription_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_user_subscription(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS subscription_update_trigger ON subscriptions;

-- Create trigger
CREATE TRIGGER subscription_update_trigger
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_subscription_trigger();

-- Enable RPC access to the function
GRANT EXECUTE ON FUNCTION get_user_plan_and_limits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_subscription(uuid) TO authenticated;
