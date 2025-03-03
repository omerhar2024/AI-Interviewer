import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useAuth } from "../auth";

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      try {
        // Check if user has admin role in database
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) return false;
        return data?.role === "admin";
      } catch (e) {
        console.error("Error checking admin status:", e);
        return false;
      }
    },
    enabled: !!user,
  });
}

export function useAdminStats() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!user || !isAdmin) throw new Error("Unauthorized");

      try {
        // Get total users count
        const { count: totalUsers, error: usersError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        if (usersError) throw usersError;

        // Get premium users count
        const { count: premiumUsers, error: premiumError } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("plan_type", "premium");

        if (premiumError) throw premiumError;

        // Return stats with fallback values if queries fail
        return {
          totalUsers: totalUsers || 0,
          premiumUsers: premiumUsers || 0,
          activeUsers: 0, // Simplified for now
          conversionRate: totalUsers
            ? ((premiumUsers || 0) / totalUsers) * 100
            : 0,
        };
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        // Return default values if there's an error
        return {
          totalUsers: 0,
          premiumUsers: 0,
          activeUsers: 0,
          conversionRate: 0,
        };
      }
    },
    enabled: !!user && !!isAdmin,
  });
}

export function useAdminUsers(limit = 100) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["adminUsers", limit],
    queryFn: async () => {
      if (!user || !isAdmin) throw new Error("Unauthorized");

      try {
        const { data, error } = await supabase
          .from("users")
          .select("*, subscriptions(plan_type, end_date)")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching admin users:", error);
        return [];
      }
    },
    enabled: !!user && !!isAdmin,
  });
}

export function useAdminQuestions(limit = 100) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["adminQuestions", limit],
    queryFn: async () => {
      if (!user || !isAdmin) throw new Error("Unauthorized");

      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching admin questions:", error);
        return [];
      }
    },
    enabled: !!user && !!isAdmin,
  });
}
