import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { processExpiredSubscriptions } from "@/lib/admin";
import { useIsAdmin } from "@/lib/hooks/use-admin";

export default function AdminSubscriptionManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processingExpired, setProcessingExpired] = useState(false);
  const [expiredStats, setExpiredStats] = useState<any>(null);
  const [subscriptionStats, setSubscriptionStats] = useState({
    total: 0,
    premium: 0,
    free: 0,
    canceled: 0,
    expired: 0,
  });

  useEffect(() => {
    // Redirect non-admin users
    if (user && !isAdmin) {
      navigate("/dashboard");
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access this page.",
      });
    }

    fetchSubscriptionStats();
  }, [user, isAdmin, navigate, toast]);

  const fetchSubscriptionStats = async () => {
    try {
      setLoading(true);

      // Get total subscriptions
      const { count: totalCount, error: totalError } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true });

      // Get premium subscriptions
      const { count: premiumCount, error: premiumError } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("plan_type", "premium");

      // Get canceled subscriptions
      const { count: canceledCount, error: canceledError } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "canceled");

      // Get expired subscriptions (canceled and past end date)
      const now = new Date().toISOString();
      const { count: expiredCount, error: expiredError } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "canceled")
        .lt("end_date", now);

      setSubscriptionStats({
        total: totalCount || 0,
        premium: premiumCount || 0,
        free: (totalCount || 0) - (premiumCount || 0),
        canceled: canceledCount || 0,
        expired: expiredCount || 0,
      });
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load subscription statistics.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessExpired = async () => {
    try {
      setProcessingExpired(true);
      const result = await processExpiredSubscriptions();

      if (result.success) {
        setExpiredStats(result);
        toast({
          title: "Success",
          description:
            result.message ||
            `Processed ${result.processed} expired subscriptions.`,
        });
        // Refresh stats after processing
        fetchSubscriptionStats();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to process expired subscriptions.",
        });
      }
    } catch (error) {
      console.error("Error processing expired subscriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setProcessingExpired(false);
    }
  };

  if (!isAdmin) {
    return null; // Don't render anything for non-admin users
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        <h1 className="text-4xl font-bold">Subscription Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {subscriptionStats.total}
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg border border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Premium Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {subscriptionStats.premium}
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-lg border border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Canceled Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {subscriptionStats.canceled}
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white rounded-xl shadow-lg border border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {subscriptionStats.expired}
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Process Expired Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-gray-600">
            This tool will find all canceled premium subscriptions that have
            passed their end date and convert them to free subscriptions.
          </p>

          {expiredStats && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="font-medium mb-2 text-blue-800">
                Last Processing Result
              </h3>
              <p className="text-blue-700">{expiredStats.message}</p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-blue-600">Processed:</span>
                  <span className="ml-2 font-medium">
                    {expiredStats.processed}
                  </span>
                </div>
                {expiredStats.errors > 0 && (
                  <div>
                    <span className="text-sm text-red-600">Errors:</span>
                    <span className="ml-2 font-medium">
                      {expiredStats.errors}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleProcessExpired}
              disabled={processingExpired}
              className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
            >
              {processingExpired ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Process Expired Subscriptions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl shadow-sm border">
        <CardHeader>
          <CardTitle>Subscription Model Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Free Tier</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Access until December 31, 2099 (effectively unlimited)</li>
                <li>Limited to 10 questions per month</li>
                <li>Limited to 5 perfect responses per month</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Premium Tier</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>30-day subscription period</li>
                <li>Unlimited questions</li>
                <li>100 perfect responses per month</li>
                <li>When canceled, access continues until the end date</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Subscription States</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>
                  <span className="font-medium">Active:</span> Subscription is
                  in good standing
                </li>
                <li>
                  <span className="font-medium">Canceled:</span> User has
                  canceled but retains access until end date
                </li>
                <li>
                  <span className="font-medium">Payment Failed:</span> Payment
                  attempt failed, access until end date
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
