import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { DEFAULT_LIMITS } from "../constants";

export function useUsageLimits() {
  return useQuery({
    queryKey: ["usage-limits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("usage_limits").select("*");

      if (error) throw error;

      // Format the data into a more usable structure with default fallbacks
      const limits: Record<string, any> = {};

      if (data && data.length > 0) {
        data.forEach((item) => {
          limits[item.plan_type] = {
            question_limit:
              item.question_limit ??
              DEFAULT_LIMITS[item.plan_type]?.question_limit,
            perfect_response_limit:
              item.perfect_response_limit ??
              DEFAULT_LIMITS[item.plan_type]?.perfect_response_limit,
          };
        });
      } else {
        // If no data, use defaults
        return DEFAULT_LIMITS;
      }

      return limits;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: DEFAULT_LIMITS,
  });
}
