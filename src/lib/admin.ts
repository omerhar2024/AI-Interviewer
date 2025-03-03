import { supabase } from "./supabase";
import {
  syncCurrentUser,
  fetchUsersDirectly,
  disableRLS,
} from "./direct-user-management";

// Function to manually fetch all auth users and sync them to public.users table
export async function syncAllAuthUsers() {
  try {
    // Skip disabling RLS since it's failing with 404

    // Try to sync the current user first as a fallback
    try {
      const syncResult = await syncCurrentUser();
      console.log("Current user sync result:", syncResult.message);
    } catch (syncError) {
      console.error("Error syncing current user:", syncError);
      // Continue even if current user sync fails
    }

    // Try the new list_all_users function first
    try {
      const { data: authUsers, error: authError } =
        await supabase.rpc("list_all_users");

      if (!authError && authUsers && authUsers.length > 0) {
        console.log(`Found ${authUsers.length} auth users via RPC`);

        // Insert each auth user into public.users table
        let successCount = 0;
        let errorCount = 0;

        for (const authUser of authUsers) {
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
            const role =
              typeof authUser.role === "string" ? authUser.role : "user";

            const { error: insertError } = await supabase.from("users").upsert(
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

              // Also ensure each user has a subscription
              try {
                const { error: subscriptionError } = await supabase
                  .from("subscriptions")
                  .upsert(
                    {
                      user_id: userId,
                      plan_type: role === "admin" ? "premium" : "free",
                      start_date: new Date().toISOString(),
                      end_date: null,
                      status: "active",
                      question_limit:
                        role === "admin" || role === "premium" ? -1 : 10,
                      perfect_response_limit:
                        role === "admin" || role === "premium" ? 50 : 5,
                      perfect_responses_used: 0,
                    },
                    { onConflict: "user_id" },
                  );

                if (subscriptionError) {
                  console.error(
                    `Error creating subscription for ${email}:`,
                    subscriptionError,
                  );
                }
              } catch (subscriptionError) {
                console.error(
                  `Error in subscription creation for ${email}:`,
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

    // Try the old get_all_auth_users function as fallback
    try {
      const { data: oldAuthUsers, error: oldAuthError } =
        await supabase.rpc("get_all_auth_users");

      if (!oldAuthError && oldAuthUsers && oldAuthUsers.length > 0) {
        console.log(`Found ${oldAuthUsers.length} auth users via old RPC`);

        // Process users from old function
        let successCount = 0;
        let errorCount = 0;

        for (const authUser of oldAuthUsers) {
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

            const { error: insertError } = await supabase.from("users").upsert(
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

              // Create subscription
              try {
                const { error: subscriptionError } = await supabase
                  .from("subscriptions")
                  .upsert(
                    {
                      user_id: userId,
                      plan_type: role === "admin" ? "premium" : "free",
                      start_date: new Date().toISOString(),
                      end_date: null,
                      status: "active",
                      question_limit:
                        role === "admin" || role === "premium" ? -1 : 10,
                      perfect_response_limit:
                        role === "admin" || role === "premium" ? 50 : 5,
                      perfect_responses_used: 0,
                    },
                    { onConflict: "user_id" },
                  );

                if (subscriptionError) {
                  console.error(
                    `Error creating subscription for ${email}:`,
                    subscriptionError,
                  );
                }
              } catch (subscriptionError) {
                console.error(
                  `Error in subscription creation for ${email}:`,
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
    } catch (oldRpcError) {
      console.error("Error with get_all_auth_users RPC:", oldRpcError);
      // Continue to fallback methods
    }

    // If all RPC methods fail, try to get at least the current user
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
