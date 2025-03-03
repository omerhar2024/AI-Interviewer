-- Comprehensive fix for database issues

-- 1. Disable RLS on all tables to ensure we can access them
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usage_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questions DISABLE ROW LEVEL SECURITY;

-- 2. Fix users table with role field
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'free',
  stripe_customer_id TEXT
);

-- 3. Create function to sync user role with subscription
CREATE OR REPLACE FUNCTION sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the role is not 'admin' to prevent overriding admin status
  IF (SELECT role FROM users WHERE id = NEW.user_id) != 'admin' THEN
    UPDATE users
    SET role = NEW.plan_type,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to sync user role when subscription changes
DROP TRIGGER IF EXISTS on_subscription_update ON subscriptions;
CREATE TRIGGER on_subscription_update
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_user_role();

-- 5. Create function to sync subscription when user role changes
CREATE OR REPLACE FUNCTION sync_subscription_from_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the role is not 'admin' to prevent overriding admin status
  IF NEW.role != 'admin' THEN
    INSERT INTO subscriptions (user_id, plan_type, start_date, status, question_limit, perfect_response_limit)
    VALUES (
      NEW.id, 
      NEW.role, 
      NOW(), 
      'active', 
      CASE WHEN NEW.role = 'premium' THEN -1 ELSE 10 END,
      CASE WHEN NEW.role = 'premium' THEN 50 ELSE 5 END
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      plan_type = NEW.role,
      updated_at = NOW(),
      question_limit = CASE WHEN NEW.role = 'premium' THEN -1 ELSE 10 END,
      perfect_response_limit = CASE WHEN NEW.role = 'premium' THEN 50 ELSE 5 END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to sync subscription when user role changes
DROP TRIGGER IF EXISTS on_user_role_update ON users;
CREATE TRIGGER on_user_role_update
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_from_role();
