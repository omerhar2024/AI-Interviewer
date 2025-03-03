-- Create a secure function to get all auth users
-- This function will be used by the admin interface to list all users

CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  role text
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) = 'omerhar2024@gmail.com' THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      au.created_at,
      COALESCE(au.raw_user_meta_data->>'role', 'user') as role
    FROM auth.users au;
  ELSE
    -- For non-admin users, return only their own record
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      au.created_at,
      COALESCE(au.raw_user_meta_data->>'role', 'user') as role
    FROM auth.users au
    WHERE au.id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.list_all_users() TO authenticated;
