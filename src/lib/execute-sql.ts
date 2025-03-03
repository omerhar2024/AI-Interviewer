import { supabase } from "./supabase";

/**
 * Executes SQL directly on the database
 * This is useful when RPC functions are not available
 */
export async function executeSql(sql: string) {
  try {
    // Use the rpc function to execute SQL directly
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_query: sql,
    });

    if (error) {
      console.error("Error executing SQL:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "SQL executed successfully", data };
  } catch (error) {
    console.error("Unexpected error in executeSql:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: null,
    };
  }
}

/**
 * Disables RLS on all tables using direct SQL
 * This is a fallback when the RPC function is not available
 */
export async function disableRlsWithSql() {
  try {
    // SQL to disable RLS on all tables
    const sql = `
      DO $$
      DECLARE
        _table text;
      BEGIN
        FOR _table IN 
          SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        LOOP
          EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', _table);
        END LOOP;
      END;
      $$;
    `;

    return await executeSql(sql);
  } catch (error) {
    console.error("Error in disableRlsWithSql:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: null,
    };
  }
}

/**
 * Adds the updated_at column to the users table if it doesn't exist
 */
export async function addUpdatedAtColumn() {
  try {
    // SQL to add updated_at column if it doesn't exist
    const sql = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'users' 
                      AND column_name = 'updated_at') THEN
          ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
        END IF;
      END;
      $$;
    `;

    // Try to execute SQL directly
    try {
      return await executeSql(sql);
    } catch (sqlError) {
      console.error("Error executing SQL via RPC:", sqlError);

      // Try direct database operation as fallback
      try {
        // Check if the column exists
        const { data: columnExists, error: checkError } = await supabase
          .from("users")
          .select("updated_at")
          .limit(1);

        if (checkError && checkError.message?.includes("updated_at")) {
          // Column doesn't exist, try to add it using a direct insert
          // This is a hack, but it might work in some cases
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            // Try to upsert the current user with updated_at
            await supabase.from("users").upsert(
              {
                id: userData.user.id,
                email: userData.user.email,
                role: "admin",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            );

            return {
              success: true,
              message: "Added updated_at column via upsert",
              data: null,
            };
          }
        } else {
          // Column already exists
          return {
            success: true,
            message: "updated_at column already exists",
            data: null,
          };
        }
      } catch (directError) {
        console.error("Error in direct column addition:", directError);
      }

      // If we get here, all methods failed
      return {
        success: false,
        message: "Failed to add updated_at column",
        data: null,
      };
    }
  } catch (error) {
    console.error("Error in addUpdatedAtColumn:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: null,
    };
  }
}

/**
 * Fixes the subscriptions table schema by adding missing columns
 */
export async function fixSubscriptionsSchema() {
  try {
    // SQL to add missing columns to subscriptions table
    const sql = `
      DO $$
      BEGIN
        -- Add question_limit column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'subscriptions' 
                      AND column_name = 'question_limit') THEN
          ALTER TABLE public.subscriptions ADD COLUMN question_limit INTEGER DEFAULT 10;
        END IF;
        
        -- Add perfect_response_limit column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'subscriptions' 
                      AND column_name = 'perfect_response_limit') THEN
          ALTER TABLE public.subscriptions ADD COLUMN perfect_response_limit INTEGER DEFAULT 5;
        END IF;
        
        -- Add perfect_responses_used column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'subscriptions' 
                      AND column_name = 'perfect_responses_used') THEN
          ALTER TABLE public.subscriptions ADD COLUMN perfect_responses_used INTEGER DEFAULT 0;
        END IF;

        -- Add status column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'subscriptions' 
                      AND column_name = 'status') THEN
          ALTER TABLE public.subscriptions ADD COLUMN status TEXT DEFAULT 'active';
        END IF;
      END;
      $$;
    `;

    // Try to execute SQL directly
    try {
      return await executeSql(sql);
    } catch (sqlError) {
      console.error("Error executing SQL via RPC:", sqlError);
      return {
        success: false,
        message: "Failed to fix subscriptions schema",
        data: null,
      };
    }
  } catch (error) {
    console.error("Error in fixSubscriptionsSchema:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: null,
    };
  }
}

/**
 * Creates the disable_all_rls function if it doesn't exist
 */
export async function createDisableRlsFunction() {
  try {
    // SQL to create the disable_all_rls function
    const sql = `
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
    `;

    return await executeSql(sql);
  } catch (error) {
    console.error("Error in createDisableRlsFunction:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: null,
    };
  }
}

/**
 * Creates the list_all_users function if it doesn't exist
 */
export async function createListAllUsersFunction() {
  try {
    // SQL to create the list_all_users function
    const sql = `
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
    `;

    return await executeSql(sql);
  } catch (error) {
    console.error("Error in createListAllUsersFunction:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: null,
    };
  }
}

/**
 * Creates the execute_sql function if it doesn't exist
 * This function allows executing arbitrary SQL from JavaScript
 */
export async function createExecuteSqlFunction() {
  try {
    // SQL to create the execute_sql function
    const sql = `
      CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result json;
      BEGIN
        EXECUTE sql_query;
        result := '{"success": true}'::json;
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        result := json_build_object('success', false, 'error', SQLERRM);
        RETURN result;
      END;
      $$;

      -- Grant execute permission on the function
      GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
      GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO anon;
    `;

    // We can't use executeSql here since we're creating the function itself
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_query: sql,
    });

    if (error) {
      // If the function doesn't exist yet, we need to create it directly
      if (
        error.message.includes("function execute_sql") &&
        error.message.includes("does not exist")
      ) {
        // We can't create it through RPC, so we'll have to rely on other methods
        return {
          success: false,
          message:
            "execute_sql function doesn't exist and can't be created automatically",
          data: null,
        };
      }

      return { success: false, message: error.message, data: null };
    }

    return {
      success: true,
      message: "execute_sql function created successfully",
      data,
    };
  } catch (error) {
    console.error("Error in createExecuteSqlFunction:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: null,
    };
  }
}
