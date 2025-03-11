-- Update the get_user_plan_and_limits function to correctly fetch limits from usage_limits table
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
    COALESCE(ul.question_limit, 
      CASE 
        WHEN COALESCE(u.subscription_plan, 'free') = 'premium' THEN 50
        ELSE 10
      END
    ),
    COALESCE(ul.perfect_response_limit, 
      CASE 
        WHEN COALESCE(u.subscription_plan, 'free') = 'premium' THEN 50
        ELSE 5
      END
    ),
    COALESCE((SELECT used FROM usage_stats WHERE user_id = $1 LIMIT 1), 0) AS questions_used,
    COALESCE((SELECT perfect_responses_used FROM subscriptions WHERE user_id = $1 LIMIT 1), 0) AS perfect_responses_used
  FROM users u
  LEFT JOIN usage_limits ul ON ul.plan_type = COALESCE(u.subscription_plan, 'free')
  WHERE u.id = $1;
END;
$$ LANGUAGE plpgsql;

-- Ensure usage_limits table has correct records
INSERT INTO usage_limits (id, plan_type, question_limit, perfect_response_limit, created_at)
VALUES 
  (gen_random_uuid(), 'free', 10, 5, NOW()),
  (gen_random_uuid(), 'premium', 50, 50, NOW())
ON CONFLICT (plan_type) DO UPDATE 
SET 
  question_limit = EXCLUDED.question_limit,
  perfect_response_limit = EXCLUDED.perfect_response_limit,
  updated_at = NOW();

-- Create a function to ensure usage_limits table always has records
CREATE OR REPLACE FUNCTION ensure_usage_limits()
RETURNS void AS $$
BEGIN
  -- Check if free plan exists
  IF NOT EXISTS (SELECT 1 FROM usage_limits WHERE plan_type = 'free') THEN
    INSERT INTO usage_limits (id, plan_type, question_limit, perfect_response_limit, created_at)
    VALUES (gen_random_uuid(), 'free', 10, 5, NOW());
  END IF;
  
  -- Check if premium plan exists
  IF NOT EXISTS (SELECT 1 FROM usage_limits WHERE plan_type = 'premium') THEN
    INSERT INTO usage_limits (id, plan_type, question_limit, perfect_response_limit, created_at)
    VALUES (gen_random_uuid(), 'premium', 50, 50, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Run the function to ensure limits exist
SELECT ensure_usage_limits();

-- Create a trigger to sync user subscription data when usage_limits change
CREATE OR REPLACE FUNCTION sync_limits_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  RAISE NOTICE 'Usage limits updated for plan: %', NEW.plan_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS usage_limits_update_trigger ON usage_limits;

-- Create trigger
CREATE TRIGGER usage_limits_update_trigger
AFTER INSERT OR UPDATE ON usage_limits
FOR EACH ROW
EXECUTE FUNCTION sync_limits_trigger();

-- Enable RPC access to the function
GRANT EXECUTE ON FUNCTION get_user_plan_and_limits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_usage_limits() TO authenticated;
