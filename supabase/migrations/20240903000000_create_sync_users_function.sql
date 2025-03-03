-- Create a function that can be called to create the sync_users_from_auth function
CREATE OR REPLACE FUNCTION create_sync_users_function()
RETURNS void AS $$
BEGIN
  -- Create the sync_users_from_auth function if it doesn't exist
  CREATE OR REPLACE FUNCTION sync_users_from_auth()
  RETURNS void AS $inner$
  DECLARE
    auth_user RECORD;
  BEGIN
    -- Loop through all users in auth.users
    FOR auth_user IN 
      SELECT id, email, created_at FROM auth.users
    LOOP
      -- Insert into public.users if not exists
      INSERT INTO public.users (id, email, created_at, updated_at)
      VALUES (
        auth_user.id,
        auth_user.email,
        auth_user.created_at,
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END;
  $inner$ LANGUAGE plpgsql SECURITY DEFINER;
 END;
$$ LANGUAGE plpgsql;

-- Execute the function to create the sync_users_from_auth function
SELECT create_sync_users_function();
