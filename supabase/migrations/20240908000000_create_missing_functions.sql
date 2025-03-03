-- Create the create_users_table_if_not_exists function
CREATE OR REPLACE FUNCTION create_users_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the users table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    -- Create the users table
    CREATE TABLE public.users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      role TEXT DEFAULT 'user'
    );

    -- Add RLS policies
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Grant access to authenticated users
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_users_table_if_not_exists() TO authenticated;

-- Create the direct_sync_users function
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

-- Create the create_sync_users_function function
CREATE OR REPLACE FUNCTION create_sync_users_function()
RETURNS void AS $$
BEGIN
  -- Create the sync_users_from_auth function if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_users_from_auth' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    EXECUTE $FUNC$
    CREATE OR REPLACE FUNCTION sync_users_from_auth()
    RETURNS void AS $INNER$
    BEGIN
      -- Insert users from auth.users into public.users if they don't exist
      INSERT INTO public.users (id, email, created_at, role)
      SELECT 
        id, 
        email, 
        created_at, 
        'user'
      FROM auth.users
      ON CONFLICT (id) DO NOTHING;
    END;
    $INNER$ LANGUAGE plpgsql SECURITY DEFINER;
    $FUNC$;
    
    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION sync_users_from_auth() TO authenticated;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_sync_users_function() TO authenticated;
