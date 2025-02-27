import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";

export function useFeedback(responseId: string | undefined) {
  return useQuery({
    queryKey: ["feedback", responseId],
    queryFn: async () => {
      if (!responseId) throw new Error("Response ID is required");

      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("response_id", responseId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!responseId,
  });
}
