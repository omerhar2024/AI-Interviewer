import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useAuth } from "../auth";

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User is not authenticated");

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || { plan_type: "free" };
    },
    enabled: !!user,
  });
}

export function useUsageStats() {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();

  return useQuery({
    queryKey: ["usage", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User is not authenticated");

      // Admin users (omerhar2024@gmail.com) always have unlimited access
      if (user.email === "omerhar2024@gmail.com") {
        return {
          used: 0,
          total: Infinity,
        };
      }

      const { count, error } = await supabase
        .from("responses")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);

      if (error) throw error;

      return {
        used: count || 0,
        total: subscription?.plan_type === "pro" ? Infinity : 10,
      };
    },
    enabled: !!user && !!subscription,
  });
}
