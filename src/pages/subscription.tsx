import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import {
  useSubscriptionSafe,
  useUsageStatsSafe,
} from "@/lib/hooks/use-subscription-safe";
import { useUsageLimits } from "@/lib/hooks/use-usage-limits";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPremiumAccess } from "@/lib/subscription-utils";
import { usePlan } from "@/context/PlanContext";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: subscription } = useSubscriptionSafe();
  const { data: usageStats } = useUsageStatsSafe();
  const { data: usageLimits } = useUsageLimits();
  const [loading, setLoading] = useState(false);

  // Get plan data from context
  const planContext = usePlan();

  // Use context data or fallback to local calculation
  const isPremium =
    planContext.isPremium ||
    hasPremiumAccess(
      user
        ? {
            ...user,
            subscriptions: subscription ? [subscription] : [],
            role: user.role || "free",
          }
        : null,
    );

  // Get the limits from the context and usage limits hook
  const freeQuestionLimit = usageLimits?.free?.question_limit || 10;
  const freePerfectResponseLimit =
    usageLimits?.free?.perfect_response_limit || 5;
  const premiumQuestionLimit =
    usageLimits?.premium?.question_limit || planContext.question_limit || 50;
  const premiumPerfectResponseLimit =
    usageLimits?.premium?.perfect_response_limit ||
    planContext.perfect_response_limit ||
    50;

  // Calculate remaining usage
  const questionsUsed = usageStats?.used || 0;
  const questionsLimit = isPremium ? premiumQuestionLimit : freeQuestionLimit;
  const questionsRemaining =
    isPremium || questionsLimit === -1
      ? "Unlimited"
      : Math.max(0, questionsLimit - questionsUsed);
  const questionsPercentage =
    isPremium || questionsLimit === -1
      ? 100
      : Math.min(100, (questionsUsed / questionsLimit) * 100);

  const perfectResponsesUsed = subscription?.perfect_responses_used || 0;
  const perfectResponsesLimit = isPremium
    ? premiumPerfectResponseLimit
    : freePerfectResponseLimit;
  const perfectResponsesRemaining =
    isPremium || perfectResponsesLimit === -1
      ? "Unlimited"
      : Math.max(0, perfectResponsesLimit - perfectResponsesUsed);
  const perfectResponsesPercentage =
    isPremium || perfectResponsesLimit === -1
      ? 100
      : Math.min(100, (perfectResponsesUsed / perfectResponsesLimit) * 100);

  const handleUpgrade = async () => {
    setLoading(true);
    // In a real implementation, this would redirect to a payment page
    // For now, we'll just simulate a delay
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Upgrade Initiated",
        description:
          "This is a demo. In a real app, you would be redirected to a payment page.",
      });
    }, 1500);
  };

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <h1 className="text-4xl font-bold mb-8">Subscription Plans</h1>

      {/* Current Usage Stats */}
      <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Your Current Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Practice Questions</span>
                <span className="text-blue-700 font-semibold">
                  {questionsUsed} / {isPremium ? "Unlimited" : questionsLimit}
                </span>
              </div>
              <Progress
                value={questionsPercentage}
                className="h-3 bg-blue-100"
              />
              <p className="text-sm text-muted-foreground">
                {isPremium
                  ? "You have unlimited practice questions with your premium plan."
                  : questionsRemaining === 0
                    ? "You've reached your monthly limit. Upgrade for unlimited questions."
                    : `You have ${questionsRemaining} questions remaining this month.`}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Perfect Responses</span>
                <span className="text-blue-700 font-semibold">
                  {perfectResponsesUsed} /{" "}
                  {isPremium ? "Unlimited" : perfectResponsesLimit}
                </span>
              </div>
              <Progress
                value={perfectResponsesPercentage}
                className="h-3 bg-blue-100"
              />
              <p className="text-sm text-muted-foreground">
                {isPremium
                  ? "You have unlimited perfect responses with your premium plan."
                  : perfectResponsesRemaining === 0
                    ? "You've reached your monthly limit. Upgrade for unlimited perfect responses."
                    : `${perfectResponsesUsed} of ${perfectResponsesLimit} perfect responses used`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="grid gap-8 md:grid-cols-2">
          {/* Free Plan */}
          <Card
            className={`bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg border ${!isPremium ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200"}`}
          >
            <CardHeader>
              <CardTitle className="text-2xl">Free Plan</CardTitle>
              <p className="text-3xl font-bold mt-2">$0</p>
              <p className="text-sm text-muted-foreground">
                {!isPremium ? "Current Plan" : "Limited features"}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>{freeQuestionLimit} practice questions per month</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>
                    {freePerfectResponseLimit} perfect responses per month
                  </span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Basic feedback on responses</span>
                </li>
                <li className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-gray-400">Advanced frameworks</span>
                </li>
                <li className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-gray-400">Detailed analytics</span>
                </li>
              </ul>

              {!isPremium ? (
                <Button
                  variant="outline"
                  className="w-full mt-6 border-blue-300"
                  disabled
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={() => {}}
                  variant="outline"
                  className="w-full mt-6"
                >
                  Downgrade
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card
            className={`bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border ${isPremium ? "border-blue-300 ring-2 ring-blue-100" : "border-blue-200"}`}
          >
            <CardHeader>
              <CardTitle className="text-2xl">Premium Plan</CardTitle>
              <p className="text-3xl font-bold mt-2">$19.99</p>
              <p className="text-sm text-muted-foreground">
                {isPremium ? "Current Plan" : "per month"}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>
                    {premiumQuestionLimit === -1
                      ? "Unlimited"
                      : premiumQuestionLimit}{" "}
                    practice questions
                  </span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>
                    {premiumPerfectResponseLimit === -1
                      ? "Unlimited"
                      : premiumPerfectResponseLimit}{" "}
                    perfect responses
                  </span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Advanced AI feedback</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>All product frameworks</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Detailed performance analytics</span>
                </li>
              </ul>

              {isPremium ? (
                <Button
                  variant="outline"
                  className="w-full mt-6 border-blue-300"
                  disabled
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                >
                  {loading ? "Processing..." : "Upgrade Now"}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-4">Usage Details</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Practice Questions</span>
                  <span>
                    {questionsUsed} / {isPremium ? "Unlimited" : questionsLimit}{" "}
                    questions
                  </span>
                </div>
                <Progress value={questionsPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {isPremium
                    ? "You have unlimited practice questions with your premium plan."
                    : questionsRemaining === 0
                      ? "You've reached your monthly limit. Upgrade for unlimited questions."
                      : `You have ${questionsRemaining} questions remaining this month.`}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Perfect Responses</span>
                  <span>
                    {perfectResponsesUsed} /{" "}
                    {isPremium ? "Unlimited" : perfectResponsesLimit} responses
                  </span>
                </div>
                <Progress value={perfectResponsesPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {isPremium
                    ? "You have unlimited perfect responses with your premium plan."
                    : perfectResponsesRemaining === 0
                      ? "You've reached your monthly limit. Upgrade for unlimited perfect responses."
                      : `${perfectResponsesUsed} of ${perfectResponsesLimit} perfect responses used`}
                </p>
              </div>
            </div>

            {subscription?.end_date && (
              <div className="mt-6 text-sm text-muted-foreground border-t pt-4">
                <p>
                  Plan renews/ends:{" "}
                  {new Date(subscription.end_date).toLocaleDateString()}
                </p>
              </div>
            )}
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
                    {isPremium ? "Premium" : "Free"}
                  </span>
                </p>
                {isPremium && subscription?.end_date && (
                  <p className="text-sm text-muted-foreground">
                    Your subscription renews on{" "}
                    {new Date(subscription.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                {isPremium ? (
                  <Button onClick={() => {}}>Manage Billing</Button>
                ) : (
                  <Button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                  >
                    {loading ? "Processing..." : "Upgrade to Premium"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Subscription Management Link */}
      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-2">
          Need more detailed subscription management?
        </p>
        <Button
          variant="outline"
          onClick={() => {}}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          Go to Subscription Management
        </Button>
      </div>
    </div>
  );
}
