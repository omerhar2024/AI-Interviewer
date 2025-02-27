import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useAuth } from "../auth";

export function useResponses(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["responses", user?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error("User is not authenticated");

      const { data, error } = await supabase
        .from("responses")
        .select("*, questions(text)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useResponse(id: string | undefined) {
  return useQuery({
    queryKey: ["responses", id],
    queryFn: async () => {
      if (!id) throw new Error("Response ID is required");

      const { data, error } = await supabase
        .from("responses")
        .select("*, questions(text)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
