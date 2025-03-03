-- Create usage_limits table
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT NOT NULL UNIQUE,
  question_limit INTEGER NOT NULL,
  perfect_response_limit INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default limits
INSERT INTO usage_limits (plan_type, question_limit, perfect_response_limit)
VALUES
  ('free', 5, 10),
  ('premium', 50, -1)
ON CONFLICT (plan_type) DO UPDATE
SET 
  question_limit = EXCLUDED.question_limit,
  perfect_response_limit = EXCLUDED.perfect_response_limit,
  updated_at = NOW();

-- Create reset_monthly_usage function
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions SET perfect_responses_used = 0, updated_at = NOW();
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create increment_usage_count function
CREATE OR REPLACE FUNCTION increment_usage_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Update the usage_stats table
  INSERT INTO usage_stats (user_id, used, created_at, updated_at)
  VALUES (p_user_id, 1, NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    used = usage_stats.used + 1,
    updated_at = NOW();
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
