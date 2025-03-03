-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'user',
  subscription_status TEXT DEFAULT 'free',
  stripe_customer_id TEXT
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
    ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add role column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
  
  -- Add subscription_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
    ALTER TABLE public.users ADD COLUMN subscription_status TEXT DEFAULT 'free';
  END IF;
  
  -- Add stripe_customer_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE public.users ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

-- Create or replace the direct_sync_users function
CREATE OR REPLACE FUNCTION direct_sync_users()
RETURNS void AS $$
BEGIN
  -- Insert users from auth.users into public.users if they don't exist
  INSERT INTO public.users (id, email, created_at, updated_at, role)
  SELECT 
    id, 
    email, 
    created_at, 
    NOW(), 
    COALESCE(role, 'user')
  FROM auth.users
  ON CONFLICT (id) DO NOTHING;
  
  -- Update the email for existing users if it has changed
  UPDATE public.users
  SET 
    email = auth.users.email,
    updated_at = NOW()
  FROM auth.users
  WHERE public.users.id = auth.users.id
  AND public.users.email != auth.users.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION direct_sync_users() TO authenticated;
