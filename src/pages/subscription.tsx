import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stripe } from "@/lib/stripe";
import { createCheckoutSession, createPortalSession } from "@/lib/api";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [usageStats, setUsageStats] = useState({ used: 0, total: 3 });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subscription
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user?.id)
          .single();

        if (subError && subError.code !== "PGRST116") throw subError;
        setSubscription(subData);

        // Fetch usage stats
        const { data: responseCount, error: countError } = await supabase
          .from("responses")
          .select("id", { count: "exact" })
          .eq("user_id", user?.id)
          .gte(
            "created_at",
            new Date(
              new Date().setMonth(new Date().getMonth() - 1),
            ).toISOString(),
          );

        if (countError) throw countError;
        setUsageStats({
          used: responseCount?.length || 0,
          total: subData?.plan_type === "pro" ? Infinity : 3,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load subscription data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, toast]);

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
    <div className="container py-16">
      <h1 className="text-4xl font-bold mb-8">Subscription</h1>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-4">Monthly Usage</h3>
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
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-4">Billing Management</h3>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Current Plan:{" "}
                {subscription?.plan_type === "pro" ? "Pro" : "Free"}
              </p>
              <Button onClick={handleManageSubscription}>Manage Billing</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="plans"
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Free Plan */}
          <div className="rounded-lg border bg-card p-8">
            <h3 className="text-2xl font-semibold mb-2">Free Plan</h3>
            <p className="text-muted-foreground mb-4">
              Get started with basic features
            </p>
            <ul className="space-y-2 mb-8">
              <li>✓ 3 practice questions per month</li>
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
              className="w-full"
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

          {/* Enterprise Plan */}
          <div className="rounded-lg border bg-card p-8">
            <h3 className="text-2xl font-semibold mb-2">Enterprise</h3>
            <p className="text-muted-foreground mb-4">
              For teams and organizations
            </p>
            <ul className="space-y-2 mb-8">
              <li>✓ All Pro features</li>
              <li>✓ Team management</li>
              <li>✓ Custom questions</li>
              <li>✓ Dedicated support</li>
            </ul>
            <Button className="w-full" variant="outline">
              Contact Sales
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
