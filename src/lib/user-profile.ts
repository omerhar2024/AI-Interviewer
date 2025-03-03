import { supabase } from "./supabase";
import { createAdminClient } from "./admin-client";

// Create supabaseAdmin client
const supabaseAdmin = createAdminClient();

/**
 * Functions for user profile management with proper error handling
 */

// Get user details by ID with fallback methods
export async function getUserDetails(userId: string) {
  try {
    // First try to get the user from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user from users table:", userError);

      // Try to get auth user data as fallback
      try {
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.getUserById(userId);

        if (authError) throw authError;

        if (authData?.user) {
          // Return minimal user data from auth
          return {
            success: true,
            data: {
              id: authData.user.id,
              email: authData.user.email,
              created_at: authData.user.created_at,
              role: "free", // Default role
              authDetails: authData.user,
            },
            source: "auth",
          };
        }
      } catch (authFetchError) {
        console.error("Error fetching auth user:", authFetchError);
      }

      return { success: false, error: userError, data: null };
    }

    // Try to get auth data to combine with profile data
    try {
      const { data: authData } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (authData?.user) {
        // Combine the data
        return {
          success: true,
          data: {
            ...userData,
            email: userData.email || authData.user.email,
            authDetails: authData.user,
          },
          source: "combined",
        };
      }
    } catch (authError) {
      console.log("Could not fetch additional auth data", authError);
      // Continue with just the profile data
    }

    return { success: true, data: userData, source: "profile" };
  } catch (error) {
    console.error("Unexpected error in getUserDetails:", error);
    return { success: false, error, data: null };
  }
}

// Check if a user exists by ID
export async function checkUserExists(userId: string) {
  try {
    // Try multiple methods to check if user exists

    // 1. Check users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!userError && userData) {
      return { exists: true, source: "users" };
    }

    // 2. Check auth users
    try {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (!authError && authData?.user) {
        return { exists: true, source: "auth" };
      }
    } catch (authError) {
      console.log("Auth check failed", authError);
    }

    // 3. Check subscriptions table as last resort
    const { data: subData, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!subError && subData) {
      return { exists: true, source: "subscriptions" };
    }

    return { exists: false };
  } catch (error) {
    console.error("Error in checkUserExists:", error);
    return { exists: false, error };
  }
}

// Get user by email
export async function getUserByEmail(email: string) {
  try {
    // First check users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!userError && userData) {
      return { success: true, data: userData, source: "users" };
    }

    // Try auth users
    try {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (!authError && authData?.users) {
        const matchingUser = authData.users.find(
          (user) => user.email === email,
        );
        if (matchingUser) {
          return {
            success: true,
            data: {
              id: matchingUser.id,
              email: matchingUser.email,
              created_at: matchingUser.created_at,
              role: "free", // Default role
              authDetails: matchingUser,
            },
            source: "auth",
          };
        }
      }
    } catch (authError) {
      console.log("Auth check failed", authError);
    }

    return { success: false, message: "User not found" };
  } catch (error) {
    console.error("Error in getUserByEmail:", error);
    return { success: false, error, message: "Error fetching user" };
  }
}
