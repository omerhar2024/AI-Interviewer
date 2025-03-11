import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useResponses } from "@/lib/hooks/use-responses";
import {
  useSubscriptionSafe,
  useUsageStatsSafe,
} from "@/lib/hooks/use-subscription-safe";
import { useUsageLimits } from "@/lib/hooks/use-usage-limits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, ArrowRight, Clock } from "lucide-react";
import GamificationWidget from "./GamificationWidget";
import { hasPremiumAccess } from "@/lib/subscription-utils";
import { usePlan } from "@/context/PlanContext";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Use safe versions of the hooks that won't cause 502 errors
  const { data: subscription } = useSubscriptionSafe();
  const { data: usageStats = { used: 0, total: 10 }, isLoading: statsLoading } =
    useUsageStatsSafe();
  const { data: recentResponses = [], isLoading: responsesLoading } =
    useResponses(5);
  const { data: usageLimits, isLoading: limitsLoading } = useUsageLimits();

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

  const loading = statsLoading || responsesLoading || limitsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="grid gap-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Card className="w-full md:w-2/3 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-800">
                Welcome back, {user?.email?.split("@")[0] || "User"}!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-lg">
                  Ready to level up your PM interview skills today?
                </p>
                <Button
                  onClick={() => navigate("/practice")}
                  className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white text-lg py-6 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Practice Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card className="w-full md:w-1/3 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <div className="p-1.5 rounded-full bg-blue-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20v-6" />
                    <path d="M6 20v-6" />
                    <path d="M18 20v-6" />
                    <path d="M6 14v-4" />
                    <path d="M18 14v-4" />
                    <path d="M12 14v-4" />
                    <path d="M12 6V4" />
                    <path d="M6 6V4" />
                    <path d="M18 6V4" />
                  </svg>
                </div>
                Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>
                    {usageStats.used} /{" "}
                    {planContext.question_limit === -1
                      ? "Unlimited"
                      : planContext.question_limit}{" "}
                    questions
                  </span>
                  <span className="text-blue-700 font-semibold">
                    {isPremium
                      ? "Premium"
                      : Math.min(
                          100,
                          (usageStats.used / planContext.question_limit) * 100,
                        ).toFixed(0) + "%"}
                  </span>
                </div>
                <Progress
                  value={
                    isPremium || planContext.question_limit === -1
                      ? 100
                      : Math.min(
                          100,
                          (usageStats.used / planContext.question_limit) * 100,
                        )
                  }
                  className="h-3 bg-blue-100"
                />
                <div className="pt-1">
                  {subscription?.plan_type !== "premium" &&
                    !isPremium &&
                    usageStats.used >=
                      (usageLimits?.free?.question_limit || 10) && (
                      <Button
                        onClick={() => navigate("/subscription")}
                        className="w-full mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2"
                      >
                        <span className="mr-1">✨</span> Upgrade to Premium
                      </Button>
                    )}
                  {isPremium && (
                    <div className="text-xs text-center text-green-600 font-medium mt-1">
                      <span className="inline-block mr-1">✓</span> Premium
                      subscription active
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Practice Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 hover:border-blue-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-medium flex items-center text-blue-800">
                <div className="p-2 rounded-full bg-blue-100 mr-3">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                Product Sense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Test your product strategy and decision-making skills with
                real-world scenarios
              </p>
              <Button
                onClick={() => navigate("/practice")}
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50 text-base font-medium py-3 rounded-lg"
              >
                Start Practice
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 hover:border-blue-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-medium flex items-center text-blue-800">
                <div className="p-2 rounded-full bg-blue-100 mr-3">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                Behavioral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Practice answering common behavioral interview questions with
                STAR methodology
              </p>
              <Button
                onClick={() => navigate("/practice")}
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50 text-base font-medium py-3 rounded-lg"
              >
                Start Practice
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gamification Widget */}
          <div className="md:col-span-1">
            <GamificationWidget />
          </div>

          {/* Recent Activity */}
          <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <div className="p-1.5 rounded-full bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentResponses.length > 0 ? (
                <div className="space-y-4">
                  {recentResponses.map((response) => (
                    <div
                      key={response.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-blue-100 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md hover:border-blue-300"
                      role="button"
                      onClick={() => navigate(`/analysis/${response.id}`)}
                      tabIndex={0}
                      aria-label={`View analysis for ${response.questions?.text}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-full bg-blue-100">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-sm truncate max-w-[300px] font-medium">
                          {response.questions?.text}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-blue-50 p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-blue-50">
                      <Clock className="h-8 w-8 text-blue-300" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-blue-800 mb-2">
                    No recent activity
                  </p>
                  <p className="mb-4">
                    Start practicing to see your history here.
                  </p>
                  <Button
                    onClick={() => navigate("/practice")}
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600"
                  >
                    Start Practicing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
