import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Users, Zap } from "lucide-react";

export default function UsageLimitsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default limits
  const [freePerfectResponses, setFreePerfectResponses] = useState(5);
  const [premiumPerfectResponses, setPremiumPerfectResponses] = useState(50);
  const [freeQuestions, setFreeQuestions] = useState(10);
  const [premiumQuestions, setPremiumQuestions] = useState(-1); // -1 means unlimited

  // Only admin users should access this page
  const isAdmin = user?.email === "omerhar2024@gmail.com";

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

    const fetchLimits = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("usage_limits").select("*");

        if (error) throw error;

        if (data && data.length > 0) {
          // Set values from database
          const freeLimits = data.find((item) => item.plan_type === "free");
          const premiumLimits = data.find(
            (item) => item.plan_type === "premium",
          );

          if (freeLimits) {
            setFreePerfectResponses(freeLimits.perfect_response_limit);
            setFreeQuestions(freeLimits.question_limit);
          }

          if (premiumLimits) {
            setPremiumPerfectResponses(premiumLimits.perfect_response_limit);
            setPremiumQuestions(premiumLimits.question_limit);
          }
        }
      } catch (error) {
        console.error("Error fetching usage limits:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load usage limits. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchLimits();
    }
  }, [user, isAdmin, navigate, toast]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Upsert free plan limits
      const { error: freeError } = await supabase.from("usage_limits").upsert(
        {
          plan_type: "free",
          perfect_response_limit: freePerfectResponses,
          question_limit: freeQuestions,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "plan_type" },
      );

      if (freeError) throw freeError;

      // Upsert premium plan limits
      const { error: premiumError } = await supabase
        .from("usage_limits")
        .upsert(
          {
            plan_type: "premium",
            perfect_response_limit: premiumPerfectResponses,
            question_limit: premiumQuestions,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "plan_type" },
        );

      if (premiumError) throw premiumError;

      toast({
        title: "Success",
        description: "Usage limits updated successfully.",
      });
    } catch (error) {
      console.error("Error saving usage limits:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save usage limits. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetUsage = async () => {
    if (
      !confirm(
        "Are you sure you want to reset all users' monthly usage counters? This will reset perfect response usage for all users.",
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      // Call the reset_monthly_usage function
      const { error } = await supabase.rpc("reset_monthly_usage");

      if (error) throw error;

      toast({
        title: "Success",
        description: "Monthly usage has been reset for all users.",
      });
    } catch (error) {
      console.error("Error resetting usage:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset usage. Please try again.",
      });
    } finally {
      setSaving(false);
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
        <h1 className="text-4xl font-bold">Usage Limits</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Plan Limits */}
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-blue-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Free Plan Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Perfect Responses per Month
              </label>
              <Input
                type="number"
                min="0"
                value={freePerfectResponses}
                onChange={(e) =>
                  setFreePerfectResponses(parseInt(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Questions per Month</label>
              <Input
                type="number"
                min="0"
                value={freeQuestions}
                onChange={(e) => setFreeQuestions(parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Premium Plan Limits */}
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-purple-800 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Premium Plan Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Perfect Responses per Month
              </label>
              <Input
                type="number"
                min="-1"
                value={premiumPerfectResponses}
                onChange={(e) =>
                  setPremiumPerfectResponses(parseInt(e.target.value))
                }
              />
              <p className="text-xs text-gray-500">Enter -1 for unlimited</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Questions per Month</label>
              <Input
                type="number"
                min="-1"
                value={premiumQuestions}
                onChange={(e) => setPremiumQuestions(parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500">Enter -1 for unlimited</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-between">
        <Button
          onClick={handleResetUsage}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          Reset All Monthly Usage
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">
          Important Notes
        </h3>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
          <li>
            Changes to usage limits will apply to all users of the specified
            plan type.
          </li>
          <li>Existing users will have their limits updated immediately.</li>
          <li>Setting a value to -1 means unlimited usage.</li>
          <li>
            Usage counters reset automatically at the beginning of each month,
            or you can manually reset them using the button above.
          </li>
        </ul>
      </div>
    </div>
  );
}
