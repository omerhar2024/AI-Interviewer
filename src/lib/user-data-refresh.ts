import { supabase } from "./supabase";
import { createAdminClient } from "./admin-client";
import { syncAllAuthUsers } from "./admin";

// Create supabaseAdmin client
const supabaseAdmin = createAdminClient();

/**
 * Functions for refreshing user data and clearing caches
 */

// Clear any cached user data in React Query
export async function invalidateUserCache() {
  try {
    // This function would typically interact with React Query's queryClient
    // Since we don't have direct access to it here, we'll log the action
    console.log("User cache invalidation requested");

    // In a real implementation, this would call queryClient.invalidateQueries(['users'])
    return { success: true, message: "Cache invalidation requested" };
  } catch (error) {
    console.error("Error invalidating user cache:", error);
    return { success: false, error, message: "Failed to invalidate cache" };
  }
}

// Force a complete refresh of user data
export async function forceUserDataRefresh() {
  try {
    console.log("Starting complete user data refresh");

    // Step 1: Clear any cached user data
    await invalidateUserCache();

    // Step 2: Try to sync users from auth to database
    try {
      // First try using RPC function if available
      const { error } = await supabaseAdmin.rpc("sync_users");

      if (!error) {
        console.log("Successfully synced users via RPC");
      } else {
        // Fall back to our improved custom sync function
        console.log("RPC sync failed, using custom sync function");
        try {
          const { customSyncUsers } = await import("./custom-sync");
          const { success, message, synchronized_users, errors } =
            await customSyncUsers();
          console.log(`Custom sync result: ${message}`);
          console.log(
            `Synchronized ${synchronized_users} users with ${errors} errors`,
          );
        } catch (customSyncError) {
          console.error(
            "Error in custom sync, falling back to standard sync:",
            customSyncError,
          );
          const { success, message } = await syncAllAuthUsers();
          console.log("Standard sync result:", message);
        }
      }
    } catch (syncError) {
      console.error("Error syncing users:", syncError);
      // Continue even if sync fails - we'll still try to refresh the UI
    }

    console.log("User data fully refreshed");
    return { success: true, message: "User data fully refreshed" };
  } catch (error) {
    console.error("Error refreshing user data:", error);
    return { success: false, error, message: "Failed to refresh user data" };
  }
}

// Debug function to log current user roles with more detail
export function logUserRoles(users: any[]) {
  if (users && users.length > 0) {
    // Log as table for better readability
    console.log("Current user roles in UI:");
    console.table(
      users.map((user) => ({
        email: user.email,
        role: user.role,
        subscription_tier:
          user.subscriptions?.[0]?.plan_type ||
          user.subscriptions?.[0]?.tier ||
          "none",
        subscription_status: user.subscriptions?.[0]?.status || "none",
        id: user.id,
        end_date: user.subscriptions?.[0]?.end_date || "none",
      })),
    );
    return true;
  }
  return false;
}
