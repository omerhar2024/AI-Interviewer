import { User } from "@supabase/supabase-js";

/**
 * Utility functions for subscription status checking
 */

// Check if a user has premium access based on role and subscription
export function hasPremiumAccess(user: any) {
  // Check user role
  if (user?.role === "admin" || user?.role === "premium") {
    return true;
  }

  // Check subscription status
  const subscription = Array.isArray(user?.subscriptions)
    ? user?.subscriptions[0]
    : user?.subscriptions;

  if (
    subscription &&
    (subscription.plan_type === "premium" || subscription.tier === "premium") &&
    (subscription.status === "active" || subscription.status === "canceled")
  ) {
    // For canceled subscriptions, check if they're still within their end date
    if (subscription.status === "canceled" && subscription.end_date) {
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      return endDate > now;
    }
    return true;
  }

  return false;
}

// Get remaining questions for a user
export function getRemainingQuestions(user: any, usageStats: any) {
  if (hasPremiumAccess(user)) {
    // Check if question_limit is -1 (unlimited)
    const subscription = Array.isArray(user?.subscriptions)
      ? user?.subscriptions[0]
      : user?.subscriptions;

    if (subscription?.question_limit === -1) {
      return Infinity; // Unlimited questions for premium users
    }
  }

  // Get subscription info
  const subscription = Array.isArray(user?.subscriptions)
    ? user?.subscriptions[0]
    : user?.subscriptions;

  // Calculate remaining questions
  const questionLimit = subscription?.question_limit || 10; // Default to 10 for free users

  // If question_limit is -1, return Infinity
  if (questionLimit === -1) {
    return Infinity;
  }

  const questionsUsed = usageStats?.used || 0;

  return Math.max(0, questionLimit - questionsUsed);
}

// Get remaining perfect responses for a user
export function getRemainingPerfectResponses(user: any) {
  if (hasPremiumAccess(user)) {
    // Check if perfect_response_limit is -1 (unlimited)
    const subscription = Array.isArray(user?.subscriptions)
      ? user?.subscriptions[0]
      : user?.subscriptions;

    if (subscription?.perfect_response_limit === -1) {
      return Infinity; // Unlimited perfect responses for premium users
    }
  }

  // Get subscription info
  const subscription = Array.isArray(user?.subscriptions)
    ? user?.subscriptions[0]
    : user?.subscriptions;

  // Calculate remaining perfect responses
  const perfectResponseLimit = subscription?.perfect_response_limit || 5; // Default to 5 for free users

  // If perfect_response_limit is -1, return Infinity
  if (perfectResponseLimit === -1) {
    return Infinity;
  }

  const perfectResponsesUsed = subscription?.perfect_responses_used || 0;

  return Math.max(0, perfectResponseLimit - perfectResponsesUsed);
}

// Get subscription display name
export function getSubscriptionDisplayName(user: any) {
  if (user?.role === "admin") {
    return "Admin";
  }

  if (hasPremiumAccess(user)) {
    return "Premium";
  }

  return "Free";
}

// Get consistent display name for subscription status - never show "Canceled"
export function getSubscriptionCardDisplayName(
  subscription: any,
  isPremium: boolean,
) {
  // If user has premium access, show Premium
  if (isPremium) {
    return "Premium";
  }

  // Otherwise, always show Free (never show Canceled)
  return "Free";
}

// Get subscription status
export function getSubscriptionStatus(user: any) {
  // Get subscription info
  const subscription = Array.isArray(user?.subscriptions)
    ? user?.subscriptions[0]
    : user?.subscriptions;

  if (!subscription) {
    return "active"; // Default to active if no subscription found
  }

  return subscription.status || "active";
}

// Check if subscription is expired
export function isSubscriptionExpired(user: any) {
  // Get subscription info
  const subscription = Array.isArray(user?.subscriptions)
    ? user?.subscriptions[0]
    : user?.subscriptions;

  if (!subscription) {
    return false; // Default to not expired if no subscription found
  }

  // Check if subscription is canceled and end date is in the past
  if (subscription.status === "canceled" && subscription.end_date) {
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    return endDate < now;
  }

  return false;
}
