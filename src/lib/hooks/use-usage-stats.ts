import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useAuth } from "../auth";

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
