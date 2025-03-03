import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, MessageSquare, Star, Clock, ChevronRight } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  useSubscriptionSafe,
  useUsageStatsSafe,
} from "@/lib/hooks/use-subscription-safe";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentResponses, setRecentResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Use safe versions of the hooks that won't cause 502 errors
  const { data: subscription } = useSubscriptionSafe();
  const { data: usageStats } = useUsageStatsSafe();

  useEffect(() => {
    const fetchRecentResponses = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("responses")
          .select(
            "*, questions(text, type), feedback(score, situation_score, task_score, action_score, result_score)",
          )
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentResponses(data || []);
      } catch (error) {
        console.error("Error fetching recent responses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchRecentResponses();
  }, [user]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your PM Practice dashboard. Start practicing for your next
          interview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-blue-800">
              Practice Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Product Sense</span>
                </div>
                <Button
                  onClick={() => navigate("/practice?type=product_sense")}
                  className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                >
                  Practice
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Behavioral</span>
                </div>
                <Button
                  onClick={() => navigate("/practice?type=behavioral")}
                  className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                >
                  Practice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-purple-800">
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Average Score</span>
                </div>
                <span className="text-lg font-bold">
                  {usageStats?.average_score
                    ? usageStats.average_score.toFixed(1)
                    : "N/A"}
                  /10
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Questions Practiced</span>
                </div>
                <span className="text-lg font-bold">
                  {usageStats?.used || 0}
                </span>
              </div>

              <Button
                onClick={() => navigate("/progress")}
                variant="outline"
                className="w-full mt-2 border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                View Detailed Progress
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-orange-800">
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Current Plan</span>
                <span className="text-lg font-bold capitalize">
                  {subscription?.plan_type || "Free"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium">Questions Remaining</span>
                <span className="text-lg font-bold">
                  {subscription?.question_limit === -1
                    ? "Unlimited"
                    : Math.max(
                        0,
                        (subscription?.question_limit || 0) -
                          (usageStats?.used || 0),
                      )}
                </span>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="font-medium">Perfect Responses</span>
                <span className="text-lg font-bold">
                  {subscription?.perfect_response_limit === -1
                    ? "Unlimited"
                    : Math.max(
                        0,
                        (subscription?.perfect_response_limit || 0) -
                          (subscription?.perfect_responses_used || 0),
                      )}
                  {subscription?.perfect_response_limit !== -1 &&
                    ` / ${subscription?.perfect_response_limit || 0}`}
                </span>
              </div>

              {subscription?.plan_type !== "premium" && (
                <Button
                  onClick={() => navigate("/subscription")}
                  className="w-full mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Practice Sessions</h2>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : recentResponses.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentResponses.map((response) => (
                    <tr key={response.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(response.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${response.questions?.type === "behavioral" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}
                        >
                          {response.questions?.type === "product_sense"
                            ? "Product Sense"
                            : "Behavioral"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {response.questions?.text}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {response.feedback && response.feedback[0]?.score ? (
                          <span
                            className={`font-medium ${getScoreColor(response.feedback[0].score)}`}
                          >
                            {typeof response.feedback[0].score === "number"
                              ? response.feedback[0].score.toFixed(1)
                              : "N/A"}
                            /10
                          </span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Determine which analysis page to navigate to
                            if (response.questions?.type === "product_sense") {
                              // Check if we have framework info in the notes
                              if (
                                response.notes &&
                                typeof response.notes === "object" &&
                                response.notes.framework
                              ) {
                                const framework = response.notes.framework;
                                switch (framework) {
                                  case "circles":
                                    navigate(
                                      `/circles-analysis/${response.id}`,
                                    );
                                    break;
                                  case "design-thinking":
                                    navigate(
                                      `/design-thinking-analysis/${response.id}`,
                                    );
                                    break;
                                  case "jtbd":
                                    navigate(`/jtbd-analysis/${response.id}`);
                                    break;
                                  case "user-centric":
                                    navigate(
                                      `/user-centric-analysis/${response.id}`,
                                    );
                                    break;
                                  default:
                                    navigate(
                                      `/product-sense-analysis/${response.id}`,
                                    );
                                }
                              } else {
                                navigate(
                                  `/product-sense-analysis/${response.id}`,
                                );
                              }
                            } else {
                              navigate(`/analysis/${response.id}`);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Analysis
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 text-center border">
            <p className="text-gray-500">
              You haven't practiced any questions yet. Start practicing to see
              your results here.
            </p>
            <Button
              onClick={() => navigate("/practice")}
              className="mt-4 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
            >
              Start Practicing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
