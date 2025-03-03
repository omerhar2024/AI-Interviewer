-- Add missing RPC functions and fix schema issues

-- 1. First add the missing updated_at column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END$$;

-- 2. Create the disable_all_rls function
CREATE OR REPLACE FUNCTION public.disable_all_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _table text;
BEGIN
    FOR _table IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', _table);
    END LOOP;
    
    RETURN;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.disable_all_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_all_rls() TO anon;

-- 3. Create the list_all_users function with proper type handling
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE (
    id uuid,
    email text,
    created_at timestamptz,
    role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email::text,
        au.created_at,
        COALESCE(u.role, 'user')::text as role
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.list_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_all_users() TO anon;

-- 4. Create the make_user_admin function
CREATE OR REPLACE FUNCTION public.make_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update or insert the user record
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    SELECT 
        au.id, 
        au.email, 
        'admin', 
        au.created_at, 
        now()
    FROM auth.users au 
    WHERE au.id = user_id
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', updated_at = now();
    
    -- Create or update subscription
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
        user_id, 
        'premium', 
        now(), 
        'active', 
        -1, 
        50, 
        0
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET 
        plan_type = 'premium',
        status = 'active',
        question_limit = -1,
        perfect_response_limit = 50;
    
    RETURN true;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.make_user_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.make_user_admin(uuid) TO anon;
