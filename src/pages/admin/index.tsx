import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  Users,
  CreditCard,
  FileText,
  BarChart,
  Zap,
  Settings,
  Database,
  Shield,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Admin dashboard metrics
  const metrics = {
    totalUsers: 124,
    premiumUsers: 37,
    conversionRate: "29.8%",
    activeToday: 42,
  };

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-4">
          <Button
            onClick={() => navigate("/admin/users")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Manage Users
          </Button>
          <Button
            onClick={() => navigate("/admin/analytics")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Premium Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metrics.premiumUsers}</div>
              <div className="p-2 bg-green-100 rounded-full">
                <CreditCard className="h-5 w-5 text-green-600" />
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
              <div className="text-2xl font-bold">{metrics.conversionRate}</div>
              <div className="p-2 bg-purple-100 rounded-full">
                <BarChart className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metrics.activeToday}</div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200 cursor-pointer"
          onClick={() => navigate("/admin/users")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>User Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Manage users, roles, and premium access grants
            </p>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200 cursor-pointer"
          onClick={() => navigate("/admin/analytics")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Analytics Dashboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View detailed analytics and growth metrics
            </p>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200 cursor-pointer"
          onClick={() => navigate("/admin/content")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Content Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Manage interview questions and content
            </p>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white">
              Manage Content
            </Button>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200 cursor-pointer"
          onClick={() => navigate("/admin/usage-limits")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Usage Limits</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Configure usage limits for free and premium users
            </p>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white">
              Configure Limits
            </Button>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200 cursor-pointer"
          onClick={() => navigate("/admin/api-settings")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <Settings className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>API Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Configure API keys and settings for DeepSeek
            </p>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white">
              Manage API Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
