import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, RefreshCw, Users, Zap } from "lucide-react";
import { useIsAdmin } from "@/lib/hooks/use-admin";

// Define default values
const DEFAULT_FREE_PERFECT_RESPONSES = 20;
const DEFAULT_FREE_QUESTIONS = 30;
const DEFAULT_PREMIUM_PERFECT_RESPONSES = 200;
const DEFAULT_PREMIUM_QUESTIONS = -1;

export default function UsageLimitsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usageLimits, setUsageLimits] = useState<any[]>([]);

  // Use refs to store input values
  const freePerfectResponsesRef = useRef<HTMLInputElement>(null);
  const freeQuestionsRef = useRef<HTMLInputElement>(null);
  const premiumPerfectResponsesRef = useRef<HTMLInputElement>(null);
  const premiumQuestionsRef = useRef<HTMLInputElement>(null);

  // Track if the component is mounted
  const isMounted = useRef(false);

  // Define all hooks at the top level
  const [freePlan, setFreePlan] = useState({
    perfect_response_limit: DEFAULT_FREE_PERFECT_RESPONSES,
    question_limit: DEFAULT_FREE_QUESTIONS,
  });

  const [premiumPlan, setPremiumPlan] = useState({
    perfect_response_limit: DEFAULT_PREMIUM_PERFECT_RESPONSES,
    question_limit: DEFAULT_PREMIUM_QUESTIONS,
  });

  // Fetch usage limits from the database
  const fetchUsageLimits = async () => {
    console.log("Fetching usage limits...");
    try {
      setLoading(true);
      // Use admin client for better permissions
      const { data, error } = await supabase
        .from("usage_limits")
        .select("*")
        .order("plan_type", { ascending: true });

      if (error) {
        console.error("Error fetching usage limits:", error);
        throw error;
      }

      console.log("Fetched usage limits:", data);

      if (data && data.length > 0) {
        setUsageLimits(data);

        // Update free and premium plan states
        const foundFreePlan = data.find((limit) => limit.plan_type === "free");
        const foundPremiumPlan = data.find(
          (limit) => limit.plan_type === "premium",
        );

        if (foundFreePlan) {
          setFreePlan(foundFreePlan);
        }

        if (foundPremiumPlan) {
          setPremiumPlan(foundPremiumPlan);
        }
      } else {
        // If no data, create default plans
        const defaultPlans = [
          {
            plan_type: "free",
            perfect_response_limit: DEFAULT_FREE_PERFECT_RESPONSES,
            question_limit: DEFAULT_FREE_QUESTIONS,
          },
          {
            plan_type: "premium",
            perfect_response_limit: DEFAULT_PREMIUM_PERFECT_RESPONSES,
            question_limit: DEFAULT_PREMIUM_QUESTIONS,
          },
        ];
        setUsageLimits(defaultPlans);
        setFreePlan(defaultPlans[0]);
        setPremiumPlan(defaultPlans[1]);
      }
    } catch (error) {
      console.error("Error fetching usage limits:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load usage limits. Please try again.",
      });

      // Set default values if fetch fails
      const defaultPlans = [
        {
          plan_type: "free",
          perfect_response_limit: DEFAULT_FREE_PERFECT_RESPONSES,
          question_limit: DEFAULT_FREE_QUESTIONS,
        },
        {
          plan_type: "premium",
          perfect_response_limit: DEFAULT_PREMIUM_PERFECT_RESPONSES,
          question_limit: DEFAULT_PREMIUM_QUESTIONS,
        },
      ];
      setUsageLimits(defaultPlans);
      setFreePlan(defaultPlans[0]);
      setPremiumPlan(defaultPlans[1]);
    } finally {
      setLoading(false);
    }
  };

  // Handle saving changes
  const handleSaveChanges = async () => {
    try {
      setSaving(true);

      // Check if component is still mounted
      if (!isMounted.current) {
        throw new Error("Component is not mounted");
      }

      // Get values from refs instead of direct DOM access
      if (
        !freePerfectResponsesRef.current ||
        !freeQuestionsRef.current ||
        !premiumPerfectResponsesRef.current ||
        !premiumQuestionsRef.current
      ) {
        throw new Error("Input fields not properly initialized");
      }

      const freePerfectResponses = freePerfectResponsesRef.current.value;
      const freeQuestions = freeQuestionsRef.current.value;
      const premiumPerfectResponses = premiumPerfectResponsesRef.current.value;
      const premiumQuestions = premiumQuestionsRef.current.value;

      console.log("Saving values:", {
        freePerfectResponses,
        freeQuestions,
        premiumPerfectResponses,
        premiumQuestions,
      });

      // Create free plan update data
      const freeUpdateData = {
        perfect_response_limit: parseInt(freePerfectResponses),
        question_limit: parseInt(freeQuestions),
        updated_at: new Date().toISOString(),
      };

      // Create premium plan update data
      const premiumUpdateData = {
        perfect_response_limit: parseInt(premiumPerfectResponses),
        question_limit: parseInt(premiumQuestions),
        updated_at: new Date().toISOString(),
      };

      console.log("Free update data:", freeUpdateData);
      console.log("Premium update data:", premiumUpdateData);

      // First check if free plan exists
      const { data: existingFreePlan, error: freeFetchError } = await supabase
        .from("usage_limits")
        .select("*")
        .eq("plan_type", "free")
        .maybeSingle();

      if (freeFetchError) {
        console.error("Error fetching free plan:", freeFetchError);
        throw freeFetchError;
      }

      let freeData;
      let freeError;

      if (existingFreePlan) {
        // Update existing record
        console.log(
          "Updating existing free plan with ID:",
          existingFreePlan.id,
        );
        const result = await supabase
          .from("usage_limits")
          .update(freeUpdateData)
          .eq("id", existingFreePlan.id)
          .select();

        freeData = result.data;
        freeError = result.error;
      } else {
        // Insert new record if it doesn't exist
        console.log("Creating new free plan record");
        const result = await supabase
          .from("usage_limits")
          .insert({
            plan_type: "free",
            ...freeUpdateData,
          })
          .select();

        freeData = result.data;
        freeError = result.error;
      }

      if (freeError) {
        console.error("Free plan update error:", freeError);
        throw freeError;
      }

      console.log("Free plan update response:", freeData);

      // First check if premium plan exists
      const { data: existingPremiumPlan, error: premiumFetchError } =
        await supabase
          .from("usage_limits")
          .select("*")
          .eq("plan_type", "premium")
          .maybeSingle();

      if (premiumFetchError) {
        console.error("Error fetching premium plan:", premiumFetchError);
        throw premiumFetchError;
      }

      let premiumData;
      let premiumError;

      if (existingPremiumPlan) {
        // Update existing record
        console.log(
          "Updating existing premium plan with ID:",
          existingPremiumPlan.id,
        );
        const result = await supabase
          .from("usage_limits")
          .update(premiumUpdateData)
          .eq("id", existingPremiumPlan.id)
          .select();

        premiumData = result.data;
        premiumError = result.error;
      } else {
        // Insert new record if it doesn't exist
        console.log("Creating new premium plan record");
        const result = await supabase
          .from("usage_limits")
          .insert({
            plan_type: "premium",
            ...premiumUpdateData,
          })
          .select();

        premiumData = result.data;
        premiumError = result.error;
      }

      if (premiumError) {
        console.error("Premium plan update error:", premiumError);
        throw premiumError;
      }

      console.log("Premium plan update response:", premiumData);

      // Update state with new values
      const newFreePlan =
        freeData && freeData.length > 0
          ? freeData[0]
          : { ...freePlan, ...freeUpdateData };

      const newPremiumPlan =
        premiumData && premiumData.length > 0
          ? premiumData[0]
          : { ...premiumPlan, ...premiumUpdateData };

      // Update state
      setFreePlan(newFreePlan);
      setPremiumPlan(newPremiumPlan);

      // Update usage limits array
      setUsageLimits([newFreePlan, newPremiumPlan]);

      // Call ensure_usage_limits to make sure the database has the latest values
      try {
        const { error: ensureError } = await supabase.rpc(
          "ensure_usage_limits",
        );
        if (ensureError) {
          console.error("Error ensuring usage limits:", ensureError);
        } else {
          console.log("Usage limits ensured in database");
        }
      } catch (ensureError) {
        console.error("Exception ensuring usage limits:", ensureError);
      }

      // Force a refresh of the usage limits in the query cache
      try {
        const { queryClient } = await import("@/lib/query-client");
        await queryClient.invalidateQueries({ queryKey: ["usage-limits"] });
        console.log("Invalidated usage-limits query cache");

        // Wait a moment for the cache to clear
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Refetch to ensure we have the latest data
        await queryClient.refetchQueries({ queryKey: ["usage-limits"] });
        console.log("Refetched usage-limits query");
      } catch (cacheError) {
        console.error("Error refreshing query cache:", cacheError);
      }

      // Fetch the updated limits to confirm changes were saved
      await fetchUsageLimits();

      toast({
        title: "Success",
        description: `Usage limits updated successfully. Free Plan: ${freePerfectResponses} perfect responses, ${freeQuestions} questions. Premium Plan: ${premiumPerfectResponses} perfect responses, ${premiumQuestions === "-1" ? "unlimited" : premiumQuestions} questions.`,
      });
    } catch (error) {
      console.error("Error updating usage limits:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update usage limits: ${error.message || "Please try again"}`,
      });
      console.error("Detailed error:", error);
    } finally {
      setSaving(false);
    }
  };

  // Initialize component and fetch data
  useEffect(() => {
    // Redirect non-admin users
    if (user && !isAdmin) {
      navigate("/dashboard");
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access this page.",
      });
      return;
    }

    fetchUsageLimits();
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, [user, isAdmin, navigate, toast]);

  // Update input refs when plan data changes
  useEffect(() => {
    if (!isMounted.current) return;

    if (freePerfectResponsesRef.current) {
      freePerfectResponsesRef.current.value =
        freePlan.perfect_response_limit.toString();
      console.log(
        "Updated free perfect responses input to:",
        freePerfectResponsesRef.current.value,
      );
    }

    if (freeQuestionsRef.current) {
      freeQuestionsRef.current.value = freePlan.question_limit.toString();
      console.log(
        "Updated free questions input to:",
        freeQuestionsRef.current.value,
      );
    }
  }, [freePlan]);

  // Update premium plan input refs when plan data changes
  useEffect(() => {
    if (!isMounted.current) return;

    if (premiumPerfectResponsesRef.current) {
      premiumPerfectResponsesRef.current.value =
        premiumPlan.perfect_response_limit.toString();
      console.log(
        "Updated premium perfect responses input to:",
        premiumPerfectResponsesRef.current.value,
      );
    }

    if (premiumQuestionsRef.current) {
      premiumQuestionsRef.current.value = premiumPlan.question_limit.toString();
      console.log(
        "Updated premium questions input to:",
        premiumQuestionsRef.current.value,
      );
    }
  }, [premiumPlan]);

  // Early return for non-admin users
  if (!isAdmin) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Debug log to check if plans are loaded correctly
  console.log("Free plan state:", freePlan);
  console.log("Premium plan state:", premiumPlan);

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
                ref={freePerfectResponsesRef}
                type="number"
                min="0"
                defaultValue={freePlan.perfect_response_limit}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Questions per Month</label>
              <Input
                ref={freeQuestionsRef}
                type="number"
                min="0"
                defaultValue={freePlan.question_limit}
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
                ref={premiumPerfectResponsesRef}
                type="number"
                min="-1"
                defaultValue={premiumPlan.perfect_response_limit}
              />
              <p className="text-xs text-gray-500">Enter -1 for unlimited</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Questions per Month</label>
              <Input
                ref={premiumQuestionsRef}
                type="number"
                min="-1"
                defaultValue={premiumPlan.question_limit}
              />
              <p className="text-xs text-gray-500">Enter -1 for unlimited</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-between">
        <Button
          onClick={fetchUsageLimits}
          variant="outline"
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>

        <Button
          onClick={handleSaveChanges}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
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
            Usage counters reset automatically at the beginning of each month.
          </li>
        </ul>
      </div>
    </div>
  );
}
