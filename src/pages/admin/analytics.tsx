import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  CreditCard,
  Clock,
  BarChart,
  PieChart,
  LineChart,
  Activity,
  FileText,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data for analytics
  const userMetrics = {
    totalUsers: 124,
    newUsers: 18,
    activeUsers: 76,
    retentionRate: "68%",
  };

  const engagementMetrics = {
    avgSessionTime: "12m 30s",
    practiceCompletionRate: "72%",
    avgPracticesPerUser: 4.2,
    feedbackRating: 4.7,
  };

  const revenueMetrics = {
    mrr: "$3,580",
    arr: "$42,960",
    conversionRate: "29.8%",
    churnRate: "3.2%",
    ltv: "$247",
  };

  const contentMetrics = {
    totalQuestions: 42,
    avgScoreProduct: 7.2,
    avgScoreBehavioral: 7.8,
    mostPopularQuestion: "Tell me about a time you faced a challenge...",
  };

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Tabs defaultValue="user" className="w-full">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="user">User Growth</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Growth Analytics */}
          <TabsContent value="user" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {userMetrics.totalUsers}
                    </div>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    New Users ({timeRange})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {userMetrics.newUsers}
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {userMetrics.activeUsers}
                    </div>
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Retention Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {userMetrics.retentionRate}
                    </div>
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <div className="p-1.5 rounded-full bg-blue-100">
                    <LineChart className="h-5 w-5 text-blue-600" />
                  </div>
                  User Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border rounded-lg bg-white">
                  <div className="text-muted-foreground">
                    User Growth Chart Placeholder
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Analytics */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Session Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {engagementMetrics.avgSessionTime}
                    </div>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {engagementMetrics.practiceCompletionRate}
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Practices Per User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {engagementMetrics.avgPracticesPerUser}
                    </div>
                    <div className="p-2 bg-purple-100 rounded-full">
                      <BarChart className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Feedback Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {engagementMetrics.feedbackRating}/5
                    </div>
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Activity className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <div className="p-1.5 rounded-full bg-blue-100">
                      <LineChart className="h-5 w-5 text-blue-600" />
                    </div>
                    User Journey Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border rounded-lg bg-white">
                    <div className="text-muted-foreground">
                      User Journey Chart Placeholder
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <div className="p-1.5 rounded-full bg-blue-100">
                      <BarChart className="h-5 w-5 text-blue-600" />
                    </div>
                    Practice Session Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border rounded-lg bg-white">
                    <div className="text-muted-foreground">
                      Session Frequency Chart Placeholder
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Analytics */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    MRR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {revenueMetrics.mrr}
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    ARR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {revenueMetrics.arr}
                    </div>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {revenueMetrics.conversionRate}
                    </div>
                    <div className="p-2 bg-purple-100 rounded-full">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Churn Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {revenueMetrics.churnRate}
                    </div>
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Activity className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    LTV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {revenueMetrics.ltv}
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <div className="p-1.5 rounded-full bg-blue-100">
                      <LineChart className="h-5 w-5 text-blue-600" />
                    </div>
                    Revenue Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border rounded-lg bg-white">
                    <div className="text-muted-foreground">
                      Revenue Growth Chart Placeholder
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <div className="p-1.5 rounded-full bg-blue-100">
                      <PieChart className="h-5 w-5 text-blue-600" />
                    </div>
                    Conversion Funnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border rounded-lg bg-white">
                    <div className="text-muted-foreground">
                      Conversion Funnel Chart Placeholder
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Analytics */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {contentMetrics.totalQuestions}
                    </div>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Product Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {contentMetrics.avgScoreProduct}/10
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <BarChart className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Behavioral Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {contentMetrics.avgScoreBehavioral}/10
                    </div>
                    <div className="p-2 bg-purple-100 rounded-full">
                      <BarChart className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Most Popular
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm truncate">
                    {contentMetrics.mostPopularQuestion}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <div className="p-1.5 rounded-full bg-blue-100">
                      <BarChart className="h-5 w-5 text-blue-600" />
                    </div>
                    Question Popularity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border rounded-lg bg-white">
                    <div className="text-muted-foreground">
                      Question Popularity Chart Placeholder
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <div className="p-1.5 rounded-full bg-blue-100">
                      <PieChart className="h-5 w-5 text-blue-600" />
                    </div>
                    Completion Rates by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border rounded-lg bg-white">
                    <div className="text-muted-foreground">
                      Completion Rates Chart Placeholder
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
