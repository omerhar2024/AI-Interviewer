import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useAuth } from "../auth";

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      // For testing purposes, allow specific email to be admin
      if (user.email === "omerhar2024@gmail.com") {
        return true;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data?.role === "admin";
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

      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Get premium users count
      const { count: premiumUsers, error: premiumError } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("plan_type", "pro");

      if (premiumError) throw premiumError;

      // Get active users in last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: activeUsers, error: activeError } = await supabase
        .from("analytics_events")
        .select("user_id", { count: "exact", head: true })
        .gt("created_at", yesterday.toISOString())
        .is("user_id", null, { negated: true })
        .limit(1000);

      if (activeError) throw activeError;

      return {
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        activeUsers: activeUsers || 0,
        conversionRate: totalUsers
          ? ((premiumUsers || 0) / totalUsers) * 100
          : 0,
      };
    },
    enabled: !!user && !!isAdmin,
  });
}

export function useGrantPremiumAccess() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  return useMutation({
    mutationFn: async ({
      userId,
      planType,
      endDate,
    }: {
      userId: string;
      planType: string;
      endDate: Date;
    }) => {
      if (!user || !isAdmin) throw new Error("Unauthorized");

      // Create or update subscription
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          plan_type: planType,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
        });

      if (subscriptionError) throw subscriptionError;

      // Record the grant
      const { error: grantError } = await supabase
        .from("premium_access_grants")
        .insert({
          user_id: userId,
          granted_by: user.id,
          plan_type: planType,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
        });

      if (grantError) throw grantError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useAdminUsers(limit = 100) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["adminUsers", limit],
    queryFn: async () => {
      if (!user || !isAdmin) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("users")
        .select("*, subscriptions(plan_type, end_date)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
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

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!isAdmin,
  });
}
