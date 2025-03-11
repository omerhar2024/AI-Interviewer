import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";

/**
 * Hook to fetch usage limits from the database
 */
export function useUsageLimits() {
  return useQuery({
    queryKey: ["usage-limits"],
    queryFn: async () => {
      console.log("Fetching usage limits from database...");
      try {
        const { data, error } = await supabase
          .from("usage_limits")
          .select("*")
          .order("plan_type", { ascending: true });

        if (error) {
          console.error("Error fetching usage limits:", error);
          throw error;
        }

        console.log("Fetched usage limits from database:", data);

        // Format the data into an object for easier access
        const limits: Record<string, any> = {};

        if (data && data.length > 0) {
          data.forEach((limit) => {
            limits[limit.plan_type] = limit;
          });
        } else {
          // Default values if no data is found
          limits.free = {
            plan_type: "free",
            question_limit: 10,
            perfect_response_limit: 5,
          };
          limits.premium = {
            plan_type: "premium",
            question_limit: -1,
            perfect_response_limit: -1,
          };
        }

        return limits;
      } catch (error) {
        console.error("Error fetching usage limits:", error);
        // Return default values if there's an error
        return {
          free: {
            plan_type: "free",
            question_limit: 10,
            perfect_response_limit: 5,
          },
          premium: {
            plan_type: "premium",
            question_limit: -1,
            perfect_response_limit: -1,
          },
        };
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 10 * 1000, // 10 seconds - refresh very frequently to catch admin changes
  });
}
