import { supabase } from "./supabase";
import { createAdminClient } from "./admin-client";
import { toast } from "@/components/ui/use-toast";

// Create supabaseAdmin client
const supabaseAdmin = createAdminClient();

/**
 * Comprehensive user management functions with robust error handling and fallbacks
 */

// Delete a user completely from the system
export async function deleteUser(userId: string) {
  try {
    // Check if userId is valid
    if (!userId || typeof userId !== "string" || userId.length < 10) {
      console.error("Invalid user ID:", userId);
      return {
        success: false,
        message: "Invalid user ID format",
      };
    }

    console.log("Attempting to delete user with ID:", userId);

    try {
      // Delete from database tables first
      const { error: dbError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", userId);

      if (dbError) {
        console.error("Error deleting user from database:", dbError);
        throw dbError;
      }

      // Delete from Auth system
      try {
        const { error: authError } =
          await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
          console.error("Error deleting user from auth system:", authError);
          // Continue even if auth deletion fails - the database records are gone
          return {
            success: true,
            message:
              "User deleted from database, but auth deletion failed: " +
              authError.message,
            partialSuccess: true,
          };
        }
      } catch (authDeleteError) {
        console.error("Exception during auth user deletion:", authDeleteError);
        // Continue even if auth deletion fails
        return {
          success: true,
          message: "User deleted from database, but auth deletion failed",
          partialSuccess: true,
        };
      }

      console.log("User successfully deleted from both database and auth");
      return { success: true, message: "User completely deleted" };
    } catch (error) {
      console.error("Error in primary deletion method:", error);

      // Fallback: Try deleting related records first, then the user
      try {
        console.log("Using fallback deletion method");

        // 1. Get all responses for this user
        const { data: responses } = await supabaseAdmin
          .from("responses")
          .select("id")
          .eq("user_id", userId);

        // 2. Delete feedback for those responses
        if (responses && responses.length > 0) {
          for (const response of responses) {
            await supabaseAdmin
              .from("feedback")
              .delete()
              .eq("response_id", response.id);
          }
        }

        // 3. Delete responses
        await supabaseAdmin.from("responses").delete().eq("user_id", userId);

        // 4. Delete subscriptions
        await supabaseAdmin
          .from("subscriptions")
          .delete()
          .eq("user_id", userId);

        // 5. Delete usage stats if they exist
        await supabaseAdmin.from("usage_stats").delete().eq("user_id", userId);

        // 6. Finally delete the user
        const { error: userDeleteError } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", userId);

        if (userDeleteError) {
          throw userDeleteError;
        }

        // Try to delete from auth as well
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch (authError) {
          // Continue even if auth deletion fails
          console.log("Auth deletion failed in fallback method");
        }

        return {
          success: true,
          message: "User deleted successfully using fallback method",
        };
      } catch (fallbackError) {
        console.error("Fallback deletion method failed:", fallbackError);
        return {
          success: false,
          message: "Failed to delete user: " + fallbackError.message,
        };
      }
    }
  } catch (error) {
    console.error("Unexpected error in deleteUser:", error);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
    };
  }
}

// Update a user's role with simplified free/premium options
export async function updateUserRole(
  userId: string,
  newRole: "free" | "premium",
) {
  try {
    console.log(`Updating user ${userId} to role ${newRole}`);

    // 1. First check if user exists in profiles table
    const { data: userData, error: userCheckError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (userCheckError && userCheckError.code !== "PGRST116") {
      console.error("Error checking user:", userCheckError);
      return {
        success: false,
        message: "Database error when checking user",
      };
    }

    // Check if user is an admin - preserve admin status behind the scenes
    const isAdmin = userData?.role === "admin";
    console.log(`User admin status: ${isAdmin}`);

    // 2. Update user role in users table - preserve admin status if it exists
    const roleToSet = isAdmin ? "admin" : newRole;
    let userUpdateSuccess = false;

    // If user doesn't exist in profiles table, create them
    if (!userData) {
      console.log("User not found in profiles table, creating profile record");

      // Try to get user from auth to get their email
      let userEmail = "";
      try {
        const { data: authData } =
          await supabaseAdmin.auth.admin.getUserById(userId);
        if (authData?.user?.email) {
          userEmail = authData.user.email;
        }
      } catch (authError) {
        console.log("Could not get user email from auth", authError);
      }

      // Create user profile
      const { error: createError } = await supabaseAdmin.from("users").insert({
        id: userId,
        email: userEmail,
        role: roleToSet,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (createError) {
        console.error("Error creating user profile:", createError);
        // Continue to subscription update even if profile creation fails
      } else {
        userUpdateSuccess = true;
      }
    } else {
      // User exists, update their role
      try {
        const { error: adminUpdateError } = await supabaseAdmin
          .from("users")
          .update({ role: roleToSet, updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (!adminUpdateError) {
          userUpdateSuccess = true;
          console.log("User role updated successfully with admin client");
        } else {
          console.error("Error updating with admin client:", adminUpdateError);

          // Try without updated_at if that's causing issues
          if (adminUpdateError.message?.includes("updated_at")) {
            const { error: fallbackError } = await supabaseAdmin
              .from("users")
              .update({ role: roleToSet })
              .eq("id", userId);

            if (!fallbackError) {
              userUpdateSuccess = true;
              console.log(
                "User role updated successfully with fallback method",
              );
            } else {
              throw fallbackError;
            }
          } else {
            throw adminUpdateError;
          }
        }
      } catch (updateError) {
        console.error("All user update methods failed:", updateError);
        // Continue to subscription update even if profile update fails
      }
    }

    // 3. Update subscription based on new role
    try {
      console.log(`Updating subscription for user ${userId} to ${newRole}`);

      // Check if subscription exists first
      const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (newRole === "premium" || isAdmin) {
        // For premium users, create or update subscription with premium settings
        console.log("Setting up premium subscription");

        try {
          // Import the updateSubscription function to handle schema issues
          const { updateSubscription } = await import("./admin-client");

          // First check if subscription exists
          if (existingSub) {
            // Update existing subscription
            const result = await updateSubscription(
              userId,
              "premium",
              "active",
            );
            if (!result.success) {
              throw result.error;
            }
          } else {
            // Create new subscription
            const { error: subscriptionError } = await supabaseAdmin
              .from("subscriptions")
              .upsert(
                {
                  user_id: userId,
                  plan_type: "premium",
                  tier: "premium", // Add tier field for compatibility
                  status: "active",
                  start_date: new Date().toISOString(),
                  end_date: new Date("2099-12-31").toISOString(), // "Never expires" date
                  question_limit: -1, // Unlimited
                  perfect_response_limit: 100,
                  perfect_responses_used:
                    existingSub?.perfect_responses_used || 0,
                },
                { onConflict: "user_id" },
              );

            if (subscriptionError) {
              console.error(
                "Error updating premium subscription:",
                subscriptionError,
              );

              // Try with minimal fields
              const { error: minimalError } = await supabaseAdmin
                .from("subscriptions")
                .upsert(
                  {
                    user_id: userId,
                    plan_type: "premium",
                    tier: "premium", // Add tier field for compatibility
                    status: "active",
                    start_date: new Date().toISOString(),
                    end_date: new Date("2099-12-31").toISOString(),
                  },
                  { onConflict: "user_id" },
                );

              if (minimalError) {
                throw minimalError;
              }
            }
          }
        } catch (subscriptionError) {
          console.error(
            "Error handling premium subscription:",
            subscriptionError,
          );
          throw subscriptionError;
        }
      } else {
        // For free users
        console.log("Setting up free subscription");

        if (
          existingSub &&
          (existingSub.plan_type === "premium" ||
            existingSub.tier === "premium")
        ) {
          // Mark as canceled but keep access until end date
          console.log("Downgrading from premium to free - marking as canceled");

          try {
            // Import the updateSubscription function to handle schema issues
            const { updateSubscription } = await import("./admin-client");

            // Update subscription status to canceled
            const result = await updateSubscription(userId, "free", "canceled");
            if (!result.success) {
              throw result.error;
            }
          } catch (cancelError) {
            console.error("Error canceling subscription:", cancelError);

            // Try minimal update as last resort
            const { error: minimalError } = await supabaseAdmin
              .from("subscriptions")
              .update({ status: "canceled" })
              .eq("user_id", userId);

            if (minimalError) {
              throw minimalError;
            }
          }
        } else {
          // Create or update free subscription
          console.log("Creating/updating free subscription");
          const { error: freeSubError } = await supabaseAdmin
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                plan_type: "free",
                tier: "free", // Add tier field for compatibility
                status: "active",
                start_date: new Date().toISOString(),
                end_date: new Date("2099-12-31").toISOString(),
                question_limit: 10,
                perfect_response_limit: 5,
                perfect_responses_used:
                  existingSub?.perfect_responses_used || 0,
              },
              { onConflict: "user_id" },
            );

          if (freeSubError) {
            console.error("Error updating free subscription:", freeSubError);

            // Try with minimal fields
            const { error: minimalError } = await supabaseAdmin
              .from("subscriptions")
              .upsert(
                {
                  user_id: userId,
                  plan_type: "free",
                  tier: "free", // Add tier field for compatibility
                  status: "active",
                  start_date: new Date().toISOString(),
                  end_date: new Date("2099-12-31").toISOString(),
                },
                { onConflict: "user_id" },
              );

            if (minimalError) {
              throw minimalError;
            }
          }
        }
      }

      // Force a complete refresh of user data after update
      try {
        // Import the function to avoid circular dependencies
        const { forceUserDataRefresh } = await import("./user-data-refresh");
        await forceUserDataRefresh();
        console.log("Forced user data refresh after role update");
      } catch (refreshError) {
        console.error("Error refreshing user data:", refreshError);
        // Continue even if refresh fails
      }

      console.log("Subscription updated successfully");
      return {
        success: true,
        message: `User subscription updated to ${newRole} successfully`,
      };
    } catch (subscriptionError) {
      console.error("Error updating subscription:", subscriptionError);

      if (userUpdateSuccess) {
        return {
          success: false,
          message: "User role updated but subscription update failed",
          partialSuccess: true,
        };
      } else {
        return {
          success: false,
          message: "Failed to update user role and subscription",
        };
      }
    }
  } catch (error) {
    console.error("Unexpected error in updateUserRole:", error);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
    };
  }
}

// Create a new user with proper validation and error handling
export async function createUser(
  email: string,
  password: string,
  role: string,
) {
  try {
    // 1. Validate inputs
    if (!email || !password) {
      return {
        success: false,
        message: "Email and password are required",
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: "Invalid email format",
      };
    }

    // Password strength validation
    if (password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters long",
      };
    }

    // 2. Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return {
        success: false,
        message: "Email already exists",
      };
    }

    // 3. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error("Auth signup error:", authError);
      return {
        success: false,
        message: authError.message || "Failed to create auth user",
      };
    }

    if (!authData.user) {
      return {
        success: false,
        message: "Auth user created but no user data returned",
      };
    }

    // 4. Add user to users table with selected role
    const userId = authData.user.id;
    let userInsertSuccess = false;

    // Try using admin client first for elevated permissions
    try {
      const { error: adminInsertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email: email,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (!adminInsertError) {
        userInsertSuccess = true;
        console.log("User created successfully with admin client");
      } else {
        throw adminInsertError;
      }
    } catch (adminError) {
      console.error("Error creating user with admin client:", adminError);

      // Fall back to regular client
      try {
        // Try with all fields first
        const { error: insertError } = await supabase.from("users").insert({
          id: userId,
          email: email,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (!insertError) {
          userInsertSuccess = true;
        } else if (insertError.message?.includes("updated_at")) {
          // Try without updated_at
          const { error: fallbackError } = await supabase.from("users").insert({
            id: userId,
            email: email,
            role: role,
            created_at: new Date().toISOString(),
          });

          if (!fallbackError) {
            userInsertSuccess = true;
          } else {
            throw fallbackError;
          }
        } else {
          throw insertError;
        }
      } catch (userError) {
        console.error("Error creating user record:", userError);
        return {
          success: false,
          message: "Auth user created but failed to create user record",
          userId: userId, // Return userId so we can try to clean up the auth user
        };
      }
    }

    // 5. Create subscription record
    if (userInsertSuccess) {
      try {
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan_type:
              role === "premium" || role === "admin" ? "premium" : "free",
            start_date: new Date().toISOString(),
            end_date: null,
            status: "active",
            question_limit: role === "premium" || role === "admin" ? -1 : 10,
            perfect_response_limit:
              role === "premium" || role === "admin" ? 50 : 5,
            perfect_responses_used: 0,
          });

        if (subscriptionError) {
          console.error("Error creating subscription:", subscriptionError);
          // Try minimal fields version
          const { error: minimalError } = await supabase
            .from("subscriptions")
            .insert({
              user_id: userId,
              plan_type:
                role === "premium" || role === "admin" ? "premium" : "free",
              start_date: new Date().toISOString(),
              end_date: null,
              status: "active",
            });

          if (minimalError) {
            console.error("Error creating minimal subscription:", minimalError);
            return {
              success: true,
              message: "User created but subscription creation failed",
              userId: userId,
              partialSuccess: true,
            };
          }
        }

        return {
          success: true,
          message: `User ${email} created successfully with ${role} role`,
          userId: userId,
        };
      } catch (subscriptionError) {
        console.error("Unexpected subscription error:", subscriptionError);
        return {
          success: true,
          message: "User created but subscription creation failed",
          userId: userId,
          partialSuccess: true,
        };
      }
    }

    return {
      success: false,
      message: "Failed to create user",
    };
  } catch (error) {
    console.error("Unexpected error in createUser:", error);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
    };
  }
}
