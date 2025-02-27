import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Activity, Calendar, Users } from "lucide-react";

interface MainContentProps {
  metrics?: {
    totalUsers: number;
    activeUsers: number;
    engagementRate: number;
    averageSessionTime: string;
  };
  activities?: Array<{
    id: string;
    title: string;
    timestamp: string;
    type: string;
  }>;
}

const MainContent = ({
  metrics = {
    totalUsers: 1234,
    activeUsers: 789,
    engagementRate: 76.5,
    averageSessionTime: "12m 30s",
  },
  activities = [
    {
      id: "1",
      title: "User session completed",
      timestamp: "2 hours ago",
      type: "session",
    },
    {
      id: "2",
      title: "New user registered",
      timestamp: "4 hours ago",
      type: "user",
    },
    {
      id: "3",
      title: "Milestone achieved",
      timestamp: "6 hours ago",
      type: "achievement",
    },
  ],
}: MainContentProps) => {
  return (
    <div className="h-full w-full p-6">
      <div className="grid gap-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-b from-white to-gray-50/50 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-white to-gray-50/50 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Activity className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-white to-gray-50/50 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Engagement Rate
              </CardTitle>
              <LineChart className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.engagementRate}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-white to-gray-50/50 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Session Time
              </CardTitle>
              <Calendar className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.averageSessionTime}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Activity Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
          {/* Charts */}
          <Card className="col-span-1 lg:col-span-5 bg-gradient-to-b from-white to-gray-50/50 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="overview"
                  className="h-[300px] flex items-center justify-center border rounded-xl bg-white/50"
                >
                  <div className="text-muted-foreground">
                    Overview Chart Placeholder
                  </div>
                </TabsContent>
                <TabsContent
                  value="analytics"
                  className="h-[300px] flex items-center justify-center border rounded-xl bg-white/50"
                >
                  <div className="text-muted-foreground">
                    Analytics Chart Placeholder
                  </div>
                </TabsContent>
                <TabsContent
                  value="reports"
                  className="h-[300px] flex items-center justify-center border rounded-xl bg-white/50"
                >
                  <div className="text-muted-foreground">
                    Reports Chart Placeholder
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="col-span-1 lg:col-span-2 bg-gradient-to-b from-white to-gray-50/50 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 rounded-xl border p-4 bg-white/50 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
