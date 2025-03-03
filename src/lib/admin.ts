import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";
import {
  syncCurrentUser,
  fetchUsersDirectly,
  disableRLS,
} from "./direct-user-management";
import { createOrUpdateSubscription } from "./subscription-management";

// Function to manually fetch all auth users and sync them to public.users table
export async function syncAllAuthUsers() {
  try {
    // Try to sync the current user first as a fallback
    try {
      const syncResult = await syncCurrentUser();
      console.log("Current user sync result:", syncResult.message);
    } catch (syncError) {
      console.error("Error syncing current user:", syncError);
      // Continue even if current user sync fails
    }

    // Try to get all users using admin client
    try {
      // Use admin client to list all users
      const { data: authUsers, error: authError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (
        !authError &&
        authUsers &&
        authUsers.users &&
        authUsers.users.length > 0
      ) {
        console.log(
          `Found ${authUsers.users.length} auth users via admin client`,
        );

        // Insert each auth user into public.users table
        let successCount = 0;
        let errorCount = 0;

        for (const authUser of authUsers.users) {
          try {
            // Handle potential type mismatches by converting values
            const userId =
              typeof authUser.id === "string"
                ? authUser.id
                : String(authUser.id);
            const email =
              typeof authUser.email === "string"
                ? authUser.email
                : String(authUser.email || "");
            const createdAt = authUser.created_at
              ? new Date(authUser.created_at).toISOString()
              : new Date().toISOString();
            const role = "user"; // Default role

            // Use admin client for user insertion
            const { error: insertError } = await supabaseAdmin
              .from("users")
              .upsert(
                {
                  id: userId,
                  email: email,
                  created_at: createdAt,
                  updated_at: new Date().toISOString(),
                  role: role,
                },
                { onConflict: "id" },
              );

            if (insertError && insertError.code !== "23505") {
              // Ignore duplicate key errors
              console.error(`Error inserting user ${email}:`, insertError);
              errorCount++;
            } else {
              successCount++;

              // Get existing subscription if any
              const { data: existingSubscription } = await supabaseAdmin
                .from("subscriptions")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle();

              // Create or update subscription using the new subscription management function
              const { success, error: subscriptionError } =
                await createOrUpdateSubscription(
                  userId,
                  role === "admin" ? "premium" : "free",
                  existingSubscription,
                );

              if (!success) {
                console.error(
                  `Error creating subscription for ${email}:`,
                  subscriptionError,
                );
              }
            }
          } catch (userError) {
            console.error(
              `Error processing user ${authUser.email || "unknown"}:`,
              userError,
            );
            errorCount++;
          }
        }

        return {
          success: true,
          message: `Synchronized ${successCount} users successfully. ${errorCount} errors.`,
        };
      }
    } catch (adminError) {
      console.error("Error with admin.listUsers:", adminError);
      // Continue to fallback methods
    }

    // Try the list_all_users function as fallback
    try {
      const { data: authUsers, error: authError } =
        await supabaseAdmin.rpc("list_all_users");

      if (!authError && authUsers && authUsers.length > 0) {
        console.log(`Found ${authUsers.length} auth users via RPC`);

        // Process users from RPC function
        let successCount = 0;
        let errorCount = 0;

        for (const authUser of authUsers) {
          try {
            // Handle potential type mismatches
            const userId =
              typeof authUser.id === "string"
                ? authUser.id
                : String(authUser.id);
            const email =
              typeof authUser.email === "string"
                ? authUser.email
                : String(authUser.email || "");
            const createdAt = authUser.created_at
              ? new Date(authUser.created_at).toISOString()
              : new Date().toISOString();
            const role =
              typeof authUser.role === "string" ? authUser.role : "user";

            // Use admin client for user insertion
            const { error: insertError } = await supabaseAdmin
              .from("users")
              .upsert(
                {
                  id: userId,
                  email: email,
                  created_at: createdAt,
                  updated_at: new Date().toISOString(),
                  role: role,
                },
                { onConflict: "id" },
              );

            if (insertError && insertError.code !== "23505") {
              console.error(`Error inserting user ${email}:`, insertError);
              errorCount++;
            } else {
              successCount++;

              // Get existing subscription if any
              const { data: existingSubscription } = await supabaseAdmin
                .from("subscriptions")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle();

              // Create or update subscription using the new subscription management function
              const { success, error: subscriptionError } =
                await createOrUpdateSubscription(
                  userId,
                  role === "admin" ? "premium" : "free",
                  existingSubscription,
                );

              if (!success) {
                console.error(
                  `Error creating subscription for ${email}:`,
                  subscriptionError,
                );
              }
            }
          } catch (userError) {
            console.error(
              `Error processing user ${authUser.email || "unknown"}:`,
              userError,
            );
            errorCount++;
          }
        }

        return {
          success: true,
          message: `Synchronized ${successCount} users successfully. ${errorCount} errors.`,
        };
      }
    } catch (rpcError) {
      console.error("Error with list_all_users RPC:", rpcError);
      // Continue to fallback methods
    }

    // If all methods fail, try to get at least the current user
    const directResult = await directSyncUsers();
    if (directResult.success) {
      return directResult;
    }

    // Last resort: just fetch existing users from the public.users table
    const { success, message, users } = await fetchUsersDirectly();
    if (success && users.length > 0) {
      return {
        success: true,
        message: `Found ${users.length} existing users in the database.`,
      };
    }

    // If we get here, all methods failed
    return {
      success: false,
      message:
        "Failed to sync or find any users. Please use the Fix Database tool.",
    };
  } catch (error) {
    console.error("Error in syncAllAuthUsers:", error);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
    };
  }
}

// Function to directly sync the current user
export async function directSyncUsers() {
  try {
    // Use the syncCurrentUser function from direct-user-management.ts
    const result = await syncCurrentUser();
    return result;
  } catch (error) {
    console.error("Error in directSyncUsers:", error);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
    };
  }
}

// Function to run the expired subscription check
export async function processExpiredSubscriptions() {
  try {
    // Import the function to avoid circular dependencies
    const { checkExpiredSubscriptions } = await import(
      "./subscription-management"
    );
    return await checkExpiredSubscriptions();
  } catch (error) {
    console.error("Error in processExpiredSubscriptions:", error);
    return {
      success: false,
      error,
      processed: 0,
      message: "Failed to process expired subscriptions",
    };
  }
}
