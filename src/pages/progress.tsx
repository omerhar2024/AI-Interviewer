import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useResponses } from "@/lib/hooks/use-responses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  BarChart,
  PieChart,
  TrendingUp,
  Award,
  Filter,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProgressPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("analytics");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: responses = [], isLoading } = useResponses(50); // Get more responses for analytics

  // Calculate average scores
  const calculateAverages = () => {
    if (responses.length === 0)
      return { situation: 0, task: 0, action: 0, result: 0, overall: 0 };

    let situationTotal = 0;
    let taskTotal = 0;
    let actionTotal = 0;
    let resultTotal = 0;
    let overallTotal = 0;
    let count = 0;

    responses.forEach((response) => {
      // Assuming feedback data is nested in the response
      if (response.feedback) {
        situationTotal += response.feedback.situation_score || 0;
        taskTotal += response.feedback.task_score || 0;
        actionTotal += response.feedback.action_score || 0;
        resultTotal += response.feedback.result_score || 0;
        overallTotal += response.feedback.score || 0;
        count++;
      }
    });

    return {
      situation: count > 0 ? situationTotal / count : 0,
      task: count > 0 ? taskTotal / count : 0,
      action: count > 0 ? actionTotal / count : 0,
      result: count > 0 ? resultTotal / count : 0,
      overall: count > 0 ? overallTotal / count : 0,
    };
  };

  const averages = calculateAverages();

  // Get trend data (last 5 responses)
  const trendData = responses
    .slice(0, 5)
    .map((response) => ({
      date: new Date(response.created_at).toLocaleDateString(),
      score: response.feedback?.score || 0,
    }))
    .reverse();

  // Calculate strengths and weaknesses
  const strengths = [];
  const weaknesses = [];

  const scores = {
    Situation: averages.situation,
    Task: averages.task,
    Action: averages.action,
    Result: averages.result,
  };

  // Sort scores to find strengths and weaknesses
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  sortedScores.forEach(([category, score], index) => {
    if (index < 2) {
      strengths.push({ category, score });
    } else {
      weaknesses.push({ category, score });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold">Your Progress</h1>

        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button
            variant={activeTab === "analytics" ? "default" : "outline"}
            onClick={() => setActiveTab("analytics")}
            className="flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Practice History
          </Button>
        </div>
      </div>

      {activeTab === "analytics" ? (
        <div className="grid gap-6 mb-8">
          {/* Overall Score Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <div className="p-1.5 rounded-full bg-blue-100">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                Overall Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Average Score</span>
                <span className="text-2xl font-bold">
                  {averages.overall.toFixed(1)}/10
                </span>
              </div>
              <Progress value={averages.overall * 10} className="h-2 mb-6" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-white shadow-sm">
                  <div className="text-sm text-muted-foreground mb-1">
                    Situation
                  </div>
                  <div className="text-xl font-semibold">
                    {averages.situation.toFixed(1)}
                  </div>
                  <Progress
                    value={averages.situation * 10}
                    className="h-1 mt-2"
                  />
                </div>
                <div className="p-4 rounded-lg bg-white shadow-sm">
                  <div className="text-sm text-muted-foreground mb-1">Task</div>
                  <div className="text-xl font-semibold">
                    {averages.task.toFixed(1)}
                  </div>
                  <Progress value={averages.task * 10} className="h-1 mt-2" />
                </div>
                <div className="p-4 rounded-lg bg-white shadow-sm">
                  <div className="text-sm text-muted-foreground mb-1">
                    Action
                  </div>
                  <div className="text-xl font-semibold">
                    {averages.action.toFixed(1)}
                  </div>
                  <Progress value={averages.action * 10} className="h-1 mt-2" />
                </div>
                <div className="p-4 rounded-lg bg-white shadow-sm">
                  <div className="text-sm text-muted-foreground mb-1">
                    Result
                  </div>
                  <div className="text-xl font-semibold">
                    {averages.result.toFixed(1)}
                  </div>
                  <Progress value={averages.result * 10} className="h-1 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Performance Trend */}
            <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <div className="p-1.5 rounded-full bg-blue-100">
                    <LineChart className="h-5 w-5 text-blue-600" />
                  </div>
                  Score Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center border rounded-lg bg-white">
                  {trendData.length > 0 ? (
                    <div className="w-full h-full p-4">
                      <div className="flex justify-between mb-2">
                        {trendData.map((item, i) => (
                          <div
                            key={i}
                            className="text-xs text-muted-foreground"
                          >
                            {item.date}
                          </div>
                        ))}
                      </div>
                      <div className="relative h-[200px] w-full">
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-200"></div>
                        <div className="absolute left-0 bottom-0 h-full w-[1px] bg-gray-200"></div>
                        <div className="flex justify-between h-full">
                          {trendData.map((item, i) => (
                            <div
                              key={i}
                              className="flex-1 flex items-end justify-center"
                            >
                              <div
                                className="w-8 bg-blue-500 rounded-t-sm"
                                style={{ height: `${item.score * 10}%` }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      Not enough data to show trend
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance by Question Type */}
            <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <div className="p-1.5 rounded-full bg-blue-100">
                    <BarChart className="h-5 w-5 text-blue-600" />
                  </div>
                  Performance by Question Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center border rounded-lg bg-white">
                  {responses.length > 0 ? (
                    <div className="w-full h-full p-4">
                      <div className="flex flex-col h-full justify-center">
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">
                                Behavioral Questions
                              </span>
                              <span className="text-lg font-bold">
                                {averages.overall.toFixed(1)}/10
                              </span>
                            </div>
                            <div className="h-8 bg-blue-100 rounded-md overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-md"
                                style={{
                                  width: `${averages.overall * 10}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">
                                Product Sense Questions
                              </span>
                              <span className="text-lg font-bold">--/10</span>
                            </div>
                            <div className="h-8 bg-blue-100 rounded-md overflow-hidden">
                              <div className="h-full bg-gray-300 rounded-md flex items-center justify-center text-xs text-gray-600">
                                Coming Soon
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      Not enough data to show comparison
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback Insights */}
          <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <div className="p-1.5 rounded-full bg-blue-100">
                  <PieChart className="h-5 w-5 text-blue-600" />
                </div>
                Feedback Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center border rounded-lg bg-white">
                {responses.length > 0 ? (
                  <div className="w-full h-full p-4">
                    <div className="flex flex-col h-full justify-center">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">
                              Needs more detail
                            </span>
                            <span className="text-sm font-medium">35%</span>
                          </div>
                          <div className="h-4 bg-blue-100 rounded-md overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-md"
                              style={{ width: "35%" }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Good structure</span>
                            <span className="text-sm font-medium">25%</span>
                          </div>
                          <div className="h-4 bg-blue-100 rounded-md overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-md"
                              style={{ width: "25%" }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Missing metrics</span>
                            <span className="text-sm font-medium">20%</span>
                          </div>
                          <div className="h-4 bg-blue-100 rounded-md overflow-hidden">
                            <div
                              className="h-full bg-yellow-500 rounded-md"
                              style={{ width: "20%" }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Other feedback</span>
                            <span className="text-sm font-medium">20%</span>
                          </div>
                          <div className="h-4 bg-blue-100 rounded-md overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-md"
                              style={{ width: "20%" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Not enough data to show insights
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Practice History</CardTitle>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex items-center gap-2">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="quarter">Last 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Question Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="behavioral">Behavioral</SelectItem>
                        <SelectItem value="product_sense">
                          Product Sense
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {responses.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responses
                        .filter((response) => {
                          // Apply date filter
                          if (dateFilter === "all") return true;
                          const responseDate = new Date(response.created_at);
                          const now = new Date();
                          const daysDiff = Math.floor(
                            (now.getTime() - responseDate.getTime()) /
                              (1000 * 60 * 60 * 24),
                          );

                          if (dateFilter === "week") return daysDiff <= 7;
                          if (dateFilter === "month") return daysDiff <= 30;
                          if (dateFilter === "quarter") return daysDiff <= 90;
                          return true;
                        })
                        .filter((response) => {
                          // Apply type filter
                          if (typeFilter === "all") return true;
                          return response.questions?.type === typeFilter;
                        })
                        .map((response) => (
                          <TableRow key={response.id}>
                            <TableCell>
                              {new Date(
                                response.created_at,
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="max-w-[300px] truncate">
                              {response.questions?.text}
                            </TableCell>
                            <TableCell className="capitalize">
                              {response.questions?.type.replace("_", " ")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {response.feedback?.score?.toFixed(1) || "--"}
                                  /10
                                </span>
                                <div className="w-16">
                                  <Progress
                                    value={(response.feedback?.score || 0) * 10}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/analysis/${response.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>
                    No practice sessions yet. Start practicing to build your
                    history!
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => (window.location.href = "/practice")}
                  >
                    Start Practice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
