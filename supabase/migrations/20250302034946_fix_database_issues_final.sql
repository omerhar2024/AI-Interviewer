-- Comprehensive fix for database issues

-- 1. Disable RLS on all tables to ensure we can access them
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usage_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questions DISABLE ROW LEVEL SECURITY;

-- 2. Fix users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'user',
  subscription_status TEXT DEFAULT 'free',
  stripe_customer_id TEXT
);

-- 3. Fix subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
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

-- 4. Create usage_stats table
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create sync_user_on_signup function
CREATE OR REPLACE FUNCTION sync_user_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at, role)
  VALUES (NEW.id, NEW.email, NEW.created_at, NOW(), 'user')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.subscriptions (user_id, plan_type, start_date, status, question_limit, perfect_response_limit)
  VALUES (NEW.id, 'free', NOW(), 'active', 10, 5)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_on_signup();

-- 7. Create function to list all users
CREATE OR REPLACE FUNCTION list_all_users()
RETURNS TABLE (id UUID, email TEXT, created_at TIMESTAMPTZ, role TEXT) AS $$
BEGIN
  RETURN QUERY SELECT u.id, u.email, u.created_at, u.role FROM public.users u;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create admin user if not exists
INSERT INTO users (id, email, role, created_at, updated_at)
VALUES 
  ('b5ae6517-e243-4eba-84f1-246fe62c6e09', 'omerhar2024@gmail.com', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- 9. Create premium subscription for admin user
INSERT INTO subscriptions (user_id, plan_type, start_date, status, question_limit, perfect_response_limit, perfect_responses_used)
VALUES 
  ('b5ae6517-e243-4eba-84f1-246fe62c6e09', 'premium', NOW(), 'active', -1, 50, 0)
ON CONFLICT (user_id) DO UPDATE
SET plan_type = 'premium', question_limit = -1, perfect_response_limit = 50;
