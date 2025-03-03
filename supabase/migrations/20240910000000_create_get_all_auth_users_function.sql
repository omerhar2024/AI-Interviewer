-- Create a function to get all users from auth.users
CREATE OR REPLACE FUNCTION public.get_all_auth_users()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', id,
      'email', email,
      'created_at', created_at,
      'role', raw_user_meta_data->>'role'
    )
  FROM auth.users;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_auth_users() TO authenticated;
