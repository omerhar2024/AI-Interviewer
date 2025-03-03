import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useAuth } from "../auth";

// This is a safer version of the subscription hook that won't cause 502 errors
export function useSubscriptionSafe() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription-safe", user?.id],
    queryFn: async () => {
      if (!user) return defaultSubscription(null);

      try {
        // Try to get actual subscription data from the database
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error || !data) {
          console.log("Using default subscription data");
          return defaultSubscription(user.id);
        }

        return data;
      } catch (e) {
        console.error("Error in useSubscriptionSafe:", e);
        return defaultSubscription(user.id);
      }
    },
    enabled: !!user,
  });
}

export function useUsageStatsSafe() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["usage-stats-safe", user?.id],
    queryFn: async () => {
      if (!user) return defaultUsageStats();

      try {
        // Try to get actual usage stats from the database
        const { data: responses, error: responsesError } = await supabase
          .from("responses")
          .select("id")
          .eq("user_id", user.id);

        if (responsesError) {
          console.log("Using default usage stats");
          return defaultUsageStats();
        }

        // Get subscription data to determine total limit
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        const total = subscription?.question_limit || 10;

        return {
          used: responses?.length || 0,
          total: total === -1 ? Infinity : total,
          average_score: 0, // We'll skip calculating this for simplicity
          responses_count: responses?.length || 0,
        };
      } catch (e) {
        console.error("Error in useUsageStatsSafe:", e);
        return defaultUsageStats();
      }
    },
    enabled: !!user,
  });
}

// Helper function to create default subscription data
function defaultSubscription(userId: string | null) {
  return {
    id: "default",
    user_id: userId || "unknown",
    plan_type: "free",
    start_date: new Date().toISOString(),
    status: "active",
    question_limit: 10,
    perfect_response_limit: 5,
    perfect_responses_used: 0,
  };
}

// Helper function to create default usage stats
function defaultUsageStats() {
  return {
    used: 0,
    total: 10,
    average_score: 0,
    responses_count: 0,
  };
}
