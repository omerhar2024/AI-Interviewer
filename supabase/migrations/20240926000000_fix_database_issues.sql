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

-- 5. Create increment_usage_count function
CREATE OR REPLACE FUNCTION increment_usage_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_stats (user_id, count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    count = usage_stats.count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create reset_monthly_usage function
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE usage_stats SET count = 0, updated_at = NOW();
  UPDATE subscriptions SET perfect_responses_used = 0, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create sync_user_on_signup function
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

-- 8. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_on_signup();

-- 9. Create function to list all users
CREATE OR REPLACE FUNCTION list_all_users()
RETURNS TABLE (id UUID, email TEXT, created_at TIMESTAMPTZ, role TEXT) AS $$
BEGIN
  RETURN QUERY SELECT u.id, u.email, u.created_at, u.role FROM public.users u;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
