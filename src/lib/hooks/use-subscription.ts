import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useAuth } from "../auth";

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        // First check if the user exists in the users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (userError) {
          // Create the user if they don't exist
          await supabase.from("users").insert({
            id: user.id,
            email: user.email || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: "user",
          });
        }

        // Now try to get the subscription with proper headers
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          // If no subscription found, create a default one
          if (error.code === "PGRST116") {
            try {
              // Create a default subscription with all required fields
              const { data: newSubscription, error: insertError } =
                await supabase
                  .from("subscriptions")
                  .insert({
                    user_id: user.id,
                    plan_type: "free",
                    start_date: new Date().toISOString(),
                    status: "active",
                    question_limit: 10,
                    perfect_response_limit: 5,
                    perfect_responses_used: 0,
                  })
                  .select()
                  .single();

              if (insertError) throw insertError;
              return newSubscription;
            } catch (createError) {
              console.error("Error creating subscription:", createError);
              // Return a default subscription object instead of throwing
              return {
                id: "default",
                user_id: user.id,
                plan_type: "free",
                start_date: new Date().toISOString(),
                status: "active",
              };
            }
          } else {
            console.error("Error fetching subscription:", error);
            // Return a default subscription object instead of throwing
            return {
              id: "default",
              user_id: user.id,
              plan_type: "free",
              start_date: new Date().toISOString(),
              status: "active",
            };
          }
        }

        return data || { plan_type: "free" };
      } catch (e) {
        console.error("Unexpected error in useSubscription:", e);
        return {
          id: "default",
          user_id: user?.id || "unknown",
          plan_type: "free",
          start_date: new Date().toISOString(),
          status: "active",
        };
      }
    },
    enabled: !!user,
  });
}

export function useUsageStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["usage-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        // Get the user's responses
        const { data: responses, error: responsesError } = await supabase
          .from("responses")
          .select("id, created_at, feedback(score)")
          .eq("user_id", user.id);

        if (responsesError) {
          console.error("Error fetching responses:", responsesError);
          // Return default stats instead of throwing
          return {
            used: 0,
            average_score: 0,
            responses_count: 0,
          };
        }

        // Calculate average score
        let totalScore = 0;
        let scoreCount = 0;

        if (responses) {
          responses.forEach((response) => {
            if (response.feedback && response.feedback.length > 0) {
              response.feedback.forEach((feedback: any) => {
                if (feedback.score) {
                  totalScore += feedback.score;
                  scoreCount++;
                }
              });
            }
          });
        }

        const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

        return {
          used: responses?.length || 0,
          average_score: averageScore,
          responses_count: responses?.length || 0,
        };
      } catch (e) {
        console.error("Unexpected error in useUsageStats:", e);
        // Return default stats instead of throwing
        return {
          used: 0,
          average_score: 0,
          responses_count: 0,
        };
      }
    },
    enabled: !!user,
  });
}
