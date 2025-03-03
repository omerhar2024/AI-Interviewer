import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user?.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user, toast]);

  const handleUpdateEmail = async (newEmail: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Please check your email to confirm the change.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setUpdating(false);
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
    <div className="w-full p-6 mx-auto max-w-7xl">
      <h1 className="text-4xl font-bold mb-8">Profile</h1>

      <div className="max-w-md space-y-8 bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-lg border border-blue-100">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={profile?.email || ""}
            onChange={(e) => setProfile({ ...profile!, email: e.target.value })}
          />
          <Button
            onClick={() => handleUpdateEmail(profile?.email || "")}
            disabled={updating || profile?.email === user?.email}
            className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
          >
            Update Email
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Subscription Status</Label>
          <Input value={profile?.subscription_status || "free"} disabled />
        </div>

        <div className="space-y-2">
          <Label>Member Since</Label>
          <Input
            value={new Date(profile?.created_at || "").toLocaleDateString()}
            disabled
          />
        </div>

        {/* Subscription Management Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Subscription</h3>
            <Button
              variant="outline"
              onClick={() => navigate("/profile/subscription")}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Manage Subscription
            </Button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <span>Current Plan:</span>
              <span className="font-medium capitalize">
                {subscription?.plan_type || "Free"}
                {subscription?.status === "canceled" && " (Canceled)"}
              </span>
            </div>
            {subscription?.plan_type === "premium" && (
              <div className="flex justify-between items-center mt-2">
                <span>
                  {subscription?.status === "canceled"
                    ? "Access Until:"
                    : "Next Billing Date:"}
                </span>
                <span className="font-medium">
                  {subscription?.end_date
                    ? new Date(subscription.end_date).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
