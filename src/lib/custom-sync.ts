import { supabase } from "./supabase";
import { createAdminClient } from "./admin-client";

// Create supabaseAdmin client
const supabaseAdmin = createAdminClient();

/**
 * Custom sync function to handle subscription status properly
 */

export async function customSyncUsers() {
  try {
    console.log("Starting custom user sync process");

    // Get all auth users via admin client
    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw authError;
    }

    if (!authUsers?.users?.length) {
      console.log("No auth users found");
      return { success: false, message: "No auth users found" };
    }

    console.log(`Found ${authUsers.users.length} auth users`);

    let successCount = 0;
    let errorCount = 0;

    // Process each auth user
    for (const authUser of authUsers.users) {
      try {
        // Check if user exists in profiles
        const { data: existingProfile } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        // Create or update user profile
        if (!existingProfile) {
          console.log(`Creating new profile for user ${authUser.id}`);
          // Create profile if doesn't exist
          const { error: createError } = await supabaseAdmin
            .from("users")
            .insert({
              id: authUser.id,
              email: authUser.email,
              created_at: authUser.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              role: "free", // Default role
            });

          if (createError) {
            // Try without updated_at if that's causing issues
            if (createError.message?.includes("updated_at")) {
              const { error: fallbackError } = await supabaseAdmin
                .from("users")
                .insert({
                  id: authUser.id,
                  email: authUser.email,
                  created_at: authUser.created_at || new Date().toISOString(),
                  role: "free", // Default role
                });

              if (fallbackError) {
                console.error(
                  `Error creating profile for ${authUser.id}:`,
                  fallbackError,
                );
                errorCount++;
                continue;
              }
            } else {
              console.error(
                `Error creating profile for ${authUser.id}:`,
                createError,
              );
              errorCount++;
              continue;
            }
          }
        }

        // Get subscription info
        const { data: subscription } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("user_id", authUser.id)
          .maybeSingle();

        // Create or update subscription based on profile and subscription status
        if (!subscription) {
          console.log(`Creating new subscription for user ${authUser.id}`);
          // Create default free subscription
          const { error: subError } = await supabaseAdmin
            .from("subscriptions")
            .insert({
              user_id: authUser.id,
              plan_type: "free",
              tier: "free", // Add tier field for compatibility
              status: "active",
              start_date: new Date().toISOString(),
              end_date: new Date("2099-12-31").toISOString(),
              question_limit: 10,
              perfect_response_limit: 5,
              perfect_responses_used: 0,
            });

          if (subError) {
            // Try with minimal fields
            const { error: minimalError } = await supabaseAdmin
              .from("subscriptions")
              .insert({
                user_id: authUser.id,
                plan_type: "free",
                tier: "free",
                status: "active",
                start_date: new Date().toISOString(),
                end_date: new Date("2099-12-31").toISOString(),
              });

            if (minimalError) {
              console.error(
                `Error creating subscription for ${authUser.id}:`,
                minimalError,
              );
              errorCount++;
              continue;
            }
          }
        } else {
          // Update user profile based on subscription status
          if (
            (subscription.plan_type === "premium" ||
              subscription.tier === "premium") &&
            subscription.status === "active"
          ) {
            console.log(
              `Updating user ${authUser.id} to premium based on subscription`,
            );

            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({
                role: "premium",
                updated_at: new Date().toISOString(),
              })
              .eq("id", authUser.id);

            if (updateError) {
              // Try without updated_at
              if (updateError.message?.includes("updated_at")) {
                const { error: fallbackError } = await supabaseAdmin
                  .from("users")
                  .update({ role: "premium" })
                  .eq("id", authUser.id);

                if (fallbackError) {
                  console.error(
                    `Error updating user ${authUser.id} role:`,
                    fallbackError,
                  );
                  errorCount++;
                  continue;
                }
              } else {
                console.error(
                  `Error updating user ${authUser.id} role:`,
                  updateError,
                );
                errorCount++;
                continue;
              }
            }
          }
        }

        successCount++;
      } catch (err) {
        console.error(`Error syncing user ${authUser.id}:`, err);
        errorCount++;
      }
    }

    return {
      success: true,
      message: `Synchronized ${successCount} users successfully. ${errorCount} errors.`,
      synchronized_users: successCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error("Error in custom sync:", error);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
      error,
    };
  }
}
