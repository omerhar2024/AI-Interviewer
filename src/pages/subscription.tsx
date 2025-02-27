import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { useSubscription, useUsageStats } from "@/lib/hooks/use-subscription";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stripe } from "@/lib/stripe";
import { createCheckoutSession, createPortalSession } from "@/lib/api";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: subscription, isLoading: subscriptionLoading } =
    useSubscription();
  const { data: usageStats, isLoading: statsLoading } = useUsageStats();

  const loading = subscriptionLoading || statsLoading;

  const handleManageSubscription = async () => {
    try {
      const portalUrl = await createPortalSession();
      window.location.href = portalUrl;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <h1 className="text-4xl font-bold mb-8">Subscription</h1>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-4">Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {usageStats.used} /{" "}
                  {usageStats.total === Infinity
                    ? "Unlimited"
                    : usageStats.total}{" "}
                  questions
                </span>
                <span>
                  {Math.min(
                    100,
                    (usageStats.used /
                      (usageStats.total === Infinity
                        ? usageStats.used
                        : usageStats.total)) *
                      100,
                  )}
                  %
                </span>
              </div>
              <Progress
                value={Math.min(
                  100,
                  (usageStats.used /
                    (usageStats.total === Infinity
                      ? usageStats.used
                      : usageStats.total)) *
                    100,
                )}
              />
              {subscription?.end_date && (
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    Plan ends:{" "}
                    {new Date(subscription.end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-4">Billing Management</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <p className="font-medium">
                  Current Plan:{" "}
                  <span className="font-bold text-primary">
                    {subscription?.plan_type === "pro" ? "Pro" : "Free"}
                  </span>
                </p>
                {subscription?.plan_type === "pro" &&
                  subscription?.end_date && (
                    <p className="text-sm text-muted-foreground">
                      Your subscription renews on{" "}
                      {new Date(subscription.end_date).toLocaleDateString()}
                    </p>
                  )}
              </div>
              <div className="flex gap-4">
                {subscription?.plan_type === "pro" ? (
                  <Button onClick={handleManageSubscription}>
                    Manage Billing
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      try {
                        const sessionId =
                          await createCheckoutSession("price_H5ggYwtDq123");
                        const stripeInstance = await stripe;
                        if (stripeInstance) {
                          await stripeInstance.redirectToCheckout({
                            sessionId,
                          });
                        }
                      } catch (error) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description:
                            "Failed to start checkout. Please try again.",
                        });
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="grid gap-8 md:grid-cols-2">
          {/* Free Plan */}
          <div className="rounded-lg border bg-card p-8">
            <h3 className="text-2xl font-semibold mb-2">Free Plan</h3>
            <p className="text-muted-foreground mb-4">
              Get started with basic features
            </p>
            <ul className="space-y-2 mb-8">
              <li>✓ 10 practice questions total</li>
              <li>✓ Basic feedback</li>
              <li>✓ Community support</li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              disabled={subscription?.plan_type === "free"}
            >
              {subscription?.plan_type === "free"
                ? "Current Plan"
                : "Get Started"}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="rounded-lg border bg-card p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm">
              Popular
            </div>
            <h3 className="text-2xl font-semibold mb-2">Pro Plan</h3>
            <p className="text-muted-foreground mb-4">
              For serious practitioners
            </p>
            <ul className="space-y-2 mb-8">
              <li>✓ Unlimited practice questions</li>
              <li>✓ Advanced AI feedback</li>
              <li>✓ Priority support</li>
              <li>✓ Progress tracking</li>
            </ul>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
              disabled={subscription?.plan_type === "pro"}
              onClick={async () => {
                try {
                  const sessionId =
                    await createCheckoutSession("price_H5ggYwtDq123");
                  const stripeInstance = await stripe;
                  if (stripeInstance) {
                    await stripeInstance.redirectToCheckout({ sessionId });
                  }
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to start checkout. Please try again.",
                  });
                }
              }}
            >
              {subscription?.plan_type === "pro"
                ? "Manage Subscription"
                : "Upgrade to Pro - $29/mo"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
