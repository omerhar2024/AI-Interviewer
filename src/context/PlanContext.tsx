import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type PlanData = {
  subscription_plan: string;
  subscription_end_date: string | null;
  role: string;
  question_limit: number;
  perfect_response_limit: number;
  questions_used: number;
  perfect_responses_used: number;
  isPremium: boolean;
  isLoading: boolean;
};

const defaultPlanData: PlanData = {
  subscription_plan: "free",
  subscription_end_date: null,
  role: "free",
  question_limit: 10,
  perfect_response_limit: 5,
  questions_used: 0,
  perfect_responses_used: 0,
  isPremium: false,
  isLoading: true,
};

const PlanContext = createContext<PlanData>(defaultPlanData);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [planData, setPlanData] = useState<PlanData>(defaultPlanData);

  useEffect(() => {
    const fetchPlanData = async () => {
      if (!user) {
        setPlanData({ ...defaultPlanData, isLoading: false });
        return;
      }

      try {
        // Fetch user plan and limits using RPC function
        console.log("Fetching plan data for user:", user.id);
        const { data, error } = await supabase.rpc("get_user_plan_and_limits", {
          user_id: user.id,
        });

        if (error) {
          console.error("Error fetching plan data:", error);
          setPlanData({ ...defaultPlanData, isLoading: false });
          return;
        }

        if (data && data.length > 0) {
          const userData = data[0];

          // Determine if user has premium access
          const isPremium =
            userData.role === "admin" ||
            userData.subscription_plan === "premium" ||
            userData.role === "premium";

          setPlanData({
            subscription_plan: userData.subscription_plan || "free",
            subscription_end_date: userData.subscription_end_date,
            role: userData.role || "free",
            question_limit: userData.question_limit || 10,
            perfect_response_limit: userData.perfect_response_limit || 5,
            questions_used: userData.questions_used || 0,
            perfect_responses_used: userData.perfect_responses_used || 0,
            isPremium,
            isLoading: false,
          });

          console.log("Fetched Plan Data:", {
            ...userData,
            isPremium,
            question_limit: userData.question_limit,
            perfect_response_limit: userData.perfect_response_limit,
          });
        } else {
          // Fallback to default values if no data returned
          setPlanData({ ...defaultPlanData, isLoading: false });
        }
      } catch (error) {
        console.error("Error in plan data fetch:", error);
        setPlanData({ ...defaultPlanData, isLoading: false });
      }
    };

    fetchPlanData();

    // Set up subscription to refresh when auth state changes
    const subscription = supabase.auth.onAuthStateChange(() => {
      fetchPlanData();
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, [user]);

  return (
    <PlanContext.Provider value={planData}>{children}</PlanContext.Provider>
  );
};

export const usePlan = () => useContext(PlanContext);
