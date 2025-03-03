import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  CreditCard,
} from "lucide-react";

export default function SubscriptionManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: subscription, isLoading, refetch } = useSubscription();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isPremium = subscription?.plan_type === "premium";
  const isActive = subscription?.status === "active";
  const isCanceled = subscription?.status === "canceled";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;

    try {
      setIsCancelling(true);

      // Update subscription status to canceled
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Send cancellation email via API
      try {
        const emailResponse = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            emailType: "subscription_canceled",
          }),
        });

        if (!emailResponse.ok) {
          console.error("Failed to send cancellation email");
        }
      } catch (emailError) {
        console.error("Error sending cancellation email:", emailError);
        // Continue with the flow even if email sending fails
      }

      // Show success message
      toast({
        title: "Subscription Canceled",
        description: `Your subscription has been canceled. You'll have access until ${formatDate(subscription.end_date)}`,
      });

      // Refresh subscription data
      refetch();
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-6 mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Subscription</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your subscription details
        </p>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">Plan</span>
              <div className="flex items-center gap-2">
                <span className="font-bold capitalize">
                  {subscription?.plan_type || "Free"}
                </span>
                {isPremium && isActive && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Active
                  </span>
                )}
                {isPremium && isCanceled && (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Canceled
                  </span>
                )}
              </div>
            </div>

            {isPremium && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Renewal Date</span>
                <span className="font-bold">
                  {isCanceled
                    ? "Will not renew"
                    : formatDate(subscription?.end_date)}
                </span>
              </div>
            )}

            {isPremium && isCanceled && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Access Until</span>
                <span className="font-bold">
                  {formatDate(subscription?.end_date)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="font-medium">Features</span>
              <span className="font-bold">
                {isPremium
                  ? "Unlimited questions & premium features"
                  : "Basic features"}
              </span>
            </div>

            <div className="pt-4 border-t">
              {isPremium && isActive ? (
                <Button
                  variant="destructive"
                  onClick={() => setIsCancelDialogOpen(true)}
                  className="w-full"
                >
                  Cancel Subscription
                </Button>
              ) : isPremium && isCanceled ? (
                <div className="text-center space-y-4">
                  <p className="text-amber-600">
                    Your subscription has been canceled but you still have
                    access until {formatDate(subscription?.end_date)}
                  </p>
                  <Button
                    variant="default"
                    onClick={() => navigate("/subscription")}
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                  >
                    Reactivate Subscription
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => navigate("/subscription")}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                >
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Benefits */}
      <Card className="bg-white rounded-xl shadow-sm border mb-8">
        <CardHeader>
          <CardTitle>Premium Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Unlimited practice questions</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Advanced AI feedback on your responses</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Access to all frameworks and templates</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Detailed performance analytics</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your premium subscription? You'll
              still have access until the end of your current billing period (
              {formatDate(subscription?.end_date)}), after which you'll be
              downgraded to the free plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
