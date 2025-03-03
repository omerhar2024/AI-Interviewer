-- Drop the updated_at column if it exists to fix schema issues
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
    ALTER TABLE public.users DROP COLUMN updated_at;
  END IF;
END $$;

-- Recreate the direct_sync_users function without updated_at
CREATE OR REPLACE FUNCTION direct_sync_users()
RETURNS void AS $$
BEGIN
  -- Insert users from auth.users into public.users if they don't exist
  INSERT INTO public.users (id, email, created_at, role)
  SELECT 
    id, 
    email, 
    created_at, 
    COALESCE(role, 'user')
  FROM auth.users
  ON CONFLICT (id) DO NOTHING;
  
  -- Update the email for existing users if it has changed
  UPDATE public.users
  SET 
    email = auth.users.email
  FROM auth.users
  WHERE public.users.id = auth.users.id
  AND public.users.email != auth.users.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION direct_sync_users() TO authenticated;
