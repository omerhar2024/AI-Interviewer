-- Drop and recreate the subscriptions table with proper constraints
DROP TABLE IF EXISTS subscriptions;

-- Create the subscriptions table with all required fields
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  question_limit INTEGER NOT NULL DEFAULT 10,
  perfect_response_limit INTEGER NOT NULL DEFAULT 5,
  perfect_responses_used INTEGER NOT NULL DEFAULT 0,
  stripe_subscription_id TEXT
);

-- Disable RLS temporarily for setup
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Create default subscriptions for existing users
INSERT INTO subscriptions (user_id, plan_type, start_date, status, question_limit, perfect_response_limit, perfect_responses_used)
SELECT id, 'free', NOW(), 'active', 10, 5, 0
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE subscriptions.user_id = users.id
);

-- Create admin users if they don't exist
INSERT INTO users (id, email, role, created_at, updated_at)
VALUES 
  ('b5ae6517-e243-4eba-84f1-246fe62c6e09', 'omerhar2024@gmail.com', 'admin', NOW(), NOW()),
  ('c6bf7528-f354-5fcb-95g2-357gf73d7f10', 'omerhar206@gmail.com', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- Create premium subscriptions for admin users
INSERT INTO subscriptions (user_id, plan_type, start_date, status, question_limit, perfect_response_limit, perfect_responses_used)
VALUES 
  ('b5ae6517-e243-4eba-84f1-246fe62c6e09', 'premium', NOW(), 'active', -1, 50, 0),
  ('c6bf7528-f354-5fcb-95g2-357gf73d7f10', 'premium', NOW(), 'active', -1, 50, 0)
ON CONFLICT (user_id) DO UPDATE
SET plan_type = 'premium', question_limit = -1, perfect_response_limit = 50;

-- Re-enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON subscriptions;

-- Create new policies with proper syntax
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view subscriptions"
  ON subscriptions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete subscriptions"
  ON subscriptions FOR DELETE
  USING (true);
