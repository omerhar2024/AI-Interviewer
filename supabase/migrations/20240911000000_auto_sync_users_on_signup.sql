-- Create a trigger to automatically sync users from auth.users to public.users

-- First, create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.sync_user_on_auth_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user into public.users
  INSERT INTO public.users (id, email, created_at, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
    
  -- Also create a default subscription for the user
  INSERT INTO public.subscriptions (
    user_id,
    plan_type,
    start_date,
    status,
    question_limit,
    perfect_response_limit,
    perfect_responses_used
  )
  VALUES (
    NEW.id,
    'free',
    NOW(),
    'active',
    10,
    5,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS sync_users_on_signup ON auth.users;

CREATE TRIGGER sync_users_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_on_auth_change();
