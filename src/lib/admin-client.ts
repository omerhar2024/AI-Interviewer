import { supabaseAdmin } from "./supabase-admin";

/**
 * Function to create and return the admin client
 * This helps avoid direct imports of supabaseAdmin in components
 */
export function createAdminClient() {
  return supabaseAdmin;
}

/**
 * Helper function to update a subscription with schema issue handling
 */
export async function updateSubscription(
  userId: string,
  tier: string,
  status: string,
) {
  try {
    // Try to update with all fields
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: status,
        tier: tier,
        plan_type: tier, // Update both fields for compatibility
      })
      .eq("user_id", userId);

    if (error) {
      // If tier column error, try without tier
      if (error.message.includes("tier")) {
        console.log("Tier column not found, trying update without tier field");
        const { error: fallbackError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: status,
            plan_type: tier,
          })
          .eq("user_id", userId);

        if (fallbackError) {
          // Try with minimal fields
          const { error: minimalError } = await supabaseAdmin
            .from("subscriptions")
            .update({ status: status })
            .eq("user_id", userId);

          if (minimalError) throw minimalError;
        }
      } else if (error.message.includes("plan_type")) {
        // If plan_type column error, try with just tier
        console.log(
          "plan_type column not found, trying update with just tier field",
        );
        const { error: fallbackError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: status,
            tier: tier,
          })
          .eq("user_id", userId);

        if (fallbackError) {
          // Try with minimal fields
          const { error: minimalError } = await supabaseAdmin
            .from("subscriptions")
            .update({ status: status })
            .eq("user_id", userId);

          if (minimalError) throw minimalError;
        }
      } else {
        throw error;
      }
    }

    console.log(`Subscription updated successfully for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return { success: false, error };
  }
}
