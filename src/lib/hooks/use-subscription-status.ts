import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth";
import { useSubscriptionSafe } from "./use-subscription-safe";
import { useUsageStatsSafe } from "./use-subscription-safe";
import {
  hasPremiumAccess,
  getRemainingQuestions,
  getRemainingPerfectResponses,
  getSubscriptionDisplayName,
  getSubscriptionStatus,
  isSubscriptionExpired,
} from "../subscription-utils";

/**
 * Hook that provides comprehensive subscription status information
 */
export function useSubscriptionStatus() {
  const { user } = useAuth();
  const { data: subscription } = useSubscriptionSafe();
  const { data: usageStats } = useUsageStatsSafe();

  return useQuery({
    queryKey: ["subscription-status", user?.id, subscription, usageStats],
    queryFn: async () => {
      if (!user) {
        return {
          isPremium: false,
          remainingQuestions: 0,
          remainingPerfectResponses: 0,
          displayName: "Not Logged In",
          status: "inactive",
          isExpired: false,
        };
      }

      // Get user with subscription data
      const userWithSubscription = {
        ...user,
        subscriptions: subscription ? [subscription] : [],
        role: user.role || "free",
      };

      return {
        isPremium: hasPremiumAccess(userWithSubscription),
        remainingQuestions: getRemainingQuestions(
          userWithSubscription,
          usageStats,
        ),
        remainingPerfectResponses:
          getRemainingPerfectResponses(userWithSubscription),
        displayName: getSubscriptionDisplayName(userWithSubscription),
        status: getSubscriptionStatus(userWithSubscription),
        isExpired: isSubscriptionExpired(userWithSubscription),
        subscription,
        usageStats,
        planType: subscription?.plan_type || "free",
      };
    },
    enabled: !!user,
  });
}
