import { supabase } from "./supabase";
import { createAdminClient } from "./admin-client";

// Create supabaseAdmin client
const supabaseAdmin = createAdminClient();

/**
 * Utility functions for admin operations
 */

// Check if a user has admin privileges
export async function hasAdminPrivileges(userId: string) {
  try {
    // First check if user has admin role in the users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (!userError && userData?.role === "admin") {
      return true;
    }

    // If not found in users table or not admin, check admin_users table if it exists
    try {
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("user_id", userId)
        .single();

      return !adminError && adminData;
    } catch (adminTableError) {
      // admin_users table might not exist, which is fine
      console.log("Admin users table check failed, might not exist");
    }

    // Special case for specific admin email
    const { data: emailData, error: emailError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (!emailError && emailData?.email === "omerhar2024@gmail.com") {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking admin privileges:", error);
    return false;
  }
}

// Grant admin privileges to a user
export async function grantAdminPrivileges(userId: string) {
  try {
    // Update user role to admin
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ role: "admin" })
      .eq("id", userId);

    if (updateError) {
      console.error("Error granting admin privileges:", updateError);
      return { success: false, message: updateError.message };
    }

    // Also add to admin_users table if it exists
    try {
      await supabaseAdmin
        .from("admin_users")
        .upsert({ user_id: userId, granted_at: new Date().toISOString() });
    } catch (adminTableError) {
      // admin_users table might not exist, which is fine
      console.log("Admin users table insert failed, might not exist");
    }

    return { success: true, message: "Admin privileges granted successfully" };
  } catch (error) {
    console.error("Error in grantAdminPrivileges:", error);
    return { success: false, message: error.message || "Unknown error" };
  }
}

// Revoke admin privileges from a user
export async function revokeAdminPrivileges(userId: string) {
  try {
    // Check if this is a special admin that shouldn't be revoked
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (!userError && userData?.email === "omerhar2024@gmail.com") {
      return {
        success: false,
        message: "Cannot revoke admin privileges from system administrator",
      };
    }

    // Update user role to premium (downgrade from admin)
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ role: "premium" })
      .eq("id", userId);

    if (updateError) {
      console.error("Error revoking admin privileges:", updateError);
      return { success: false, message: updateError.message };
    }

    // Also remove from admin_users table if it exists
    try {
      await supabaseAdmin.from("admin_users").delete().eq("user_id", userId);
    } catch (adminTableError) {
      // admin_users table might not exist, which is fine
      console.log("Admin users table delete failed, might not exist");
    }

    return { success: true, message: "Admin privileges revoked successfully" };
  } catch (error) {
    console.error("Error in revokeAdminPrivileges:", error);
    return { success: false, message: error.message || "Unknown error" };
  }
}
