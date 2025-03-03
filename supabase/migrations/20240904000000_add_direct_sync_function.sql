-- Create a function that directly syncs users from auth.users to public.users
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
