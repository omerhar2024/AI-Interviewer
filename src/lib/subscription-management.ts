import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";

/**
 * Comprehensive subscription management functions with robust error handling
 */

// Create or update a subscription with proper date handling
export async function createOrUpdateSubscription(
  userId: string,
  planType: string,
  existingSubscription: any = null,
) {
  try {
    const now = new Date();

    // For new subscriptions
    if (!existingSubscription) {
      // Set default values
      const subscriptionData: any = {
        user_id: userId,
        plan_type: planType,
        start_date: now.toISOString(),
        perfect_responses_used: 0,
        status: "active",
      };

      // Set plan-specific values
      if (planType === "premium" || planType === "admin") {
        // Premium plan gets 30 days access
        subscriptionData.end_date = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString();
        subscriptionData.perfect_response_limit = 100;
        subscriptionData.question_limit = -1; // Unlimited
      } else {
        // Free plan gets "forever" access (with limited features)
        subscriptionData.end_date = new Date("2099-12-31").toISOString();
        subscriptionData.perfect_response_limit = 5;
        subscriptionData.question_limit = 10;
      }

      // Use admin client for elevated permissions
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .upsert(subscriptionData, { onConflict: "user_id" });

      return { success: !error, error, data: subscriptionData };
    }

    // For existing subscriptions - handle renewals and plan changes
    else {
      // If subscription is being changed from free to premium
      if (
        existingSubscription.plan_type === "free" &&
        (planType === "premium" || planType === "admin")
      ) {
        const updateData = {
          plan_type: planType,
          start_date: now.toISOString(),
          end_date: new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          perfect_response_limit: 100,
          question_limit: -1, // Unlimited
          status: "active",
        };

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update(updateData)
          .eq("user_id", userId);

        return { success: !error, error, data: updateData };
      }

      // If subscription is being renewed (payment successful)
      else if (
        (planType === "premium" || planType === "admin") &&
        (existingSubscription.plan_type === "premium" ||
          existingSubscription.plan_type === "admin")
      ) {
        // Parse the end_date string to a Date object
        const endDate = new Date(existingSubscription.end_date);

        const updateData = {
          start_date: endDate.toISOString(), // Previous end date becomes new start date
          end_date: new Date(
            endDate.getTime() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: "active",
        };

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update(updateData)
          .eq("user_id", userId);

        return { success: !error, error, data: updateData };
      }

      // If subscription is being downgraded to free
      else if (
        planType === "free" &&
        (existingSubscription.plan_type === "premium" ||
          existingSubscription.plan_type === "admin")
      ) {
        // They keep premium until end_date, then system will convert to free
        const updateData = {
          status: "canceled", // Mark as canceled but don't change end_date
        };

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update(updateData)
          .eq("user_id", userId);

        return { success: !error, error, data: updateData };
      }

      // No change needed
      return { success: true, error: null, data: existingSubscription };
    }
  } catch (error) {
    console.error("Error in createOrUpdateSubscription:", error);
    return { success: false, error, data: null };
  }
}

// Cancel a subscription but keep premium access until end date
export async function cancelSubscription(userId: string) {
  try {
    // Get the current subscription
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError };
    }

    // Only cancel if it's a premium subscription and active
    if (
      (subscription.plan_type === "premium" ||
        subscription.plan_type === "admin") &&
      subscription.status === "active"
    ) {
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "canceled",
        })
        .eq("user_id", userId);

      return {
        success: !error,
        error,
        message: !error
          ? `Subscription canceled. Premium access available until ${new Date(subscription.end_date).toLocaleDateString()}.`
          : "Failed to cancel subscription.",
      };
    }

    return {
      success: false,
      error: null,
      message: "No active premium subscription found.",
    };
  } catch (error) {
    console.error("Error in cancelSubscription:", error);
    return { success: false, error, message: "An unexpected error occurred." };
  }
}

// Check for expired subscriptions and convert them to free
export async function checkExpiredSubscriptions() {
  try {
    const now = new Date();

    // Find subscriptions that are expired but still premium
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .or(`plan_type.eq.premium,plan_type.eq.admin`)
      .or(`status.eq.canceled,status.eq.payment_failed`)
      .lt("end_date", now.toISOString());

    if (error) {
      console.error("Error checking expired subscriptions:", error);
      return { success: false, error, processed: 0 };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        error: null,
        processed: 0,
        message: "No expired subscriptions found.",
      };
    }

    // Convert each expired subscription to free
    let successCount = 0;
    let errorCount = 0;

    for (const subscription of data) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            plan_type: "free",
            perfect_response_limit: 5,
            question_limit: 10,
            end_date: new Date("2099-12-31").toISOString(),
            status: "active",
          })
          .eq("user_id", subscription.user_id);

        if (updateError) {
          console.error(
            `Error converting subscription for user ${subscription.user_id}:`,
            updateError,
          );
          errorCount++;
        } else {
          successCount++;
        }
      } catch (subError) {
        console.error(
          `Error processing subscription for user ${subscription.user_id}:`,
          subError,
        );
        errorCount++;
      }
    }

    return {
      success: true,
      error: null,
      processed: successCount,
      errors: errorCount,
      message: `Processed ${successCount} expired subscriptions. ${errorCount} errors.`,
    };
  } catch (error) {
    console.error("Error in checkExpiredSubscriptions:", error);
    return { success: false, error, processed: 0 };
  }
}

// Get subscription details with proper error handling
export async function getSubscriptionDetails(userId: string) {
  try {
    // Try to get subscription using admin client first
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If no subscription found, create a default free one
      if (error.code === "PGRST116") {
        const { success, data: newSubscription } =
          await createOrUpdateSubscription(userId, "free");
        if (success) {
          return { success: true, data: newSubscription, error: null };
        }
      }

      return { success: false, data: null, error };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error("Error in getSubscriptionDetails:", error);
    return { success: false, data: null, error };
  }
}
