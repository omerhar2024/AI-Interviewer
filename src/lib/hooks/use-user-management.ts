import { useState } from "react";
import { supabase } from "../supabase";
import { useToast } from "@/components/ui/use-toast";

export function useUserManagement() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all users with their subscriptions
  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Skip trying to sync users with RPC since it's causing 404 errors

      // Skip trying to use RPC functions and directly query the users table
      let userData;

      // Get users first
      const { data: directData, error: directError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (directError) throw directError;

      // Initialize userData with users but empty subscriptions
      userData = directData.map((user) => ({
        ...user,
        subscriptions: [],
      }));

      // Get all subscriptions at once
      try {
        const { data: allSubscriptions } = await supabase
          .from("subscriptions")
          .select("*");

        // Map subscriptions to users
        if (allSubscriptions && allSubscriptions.length > 0) {
          userData = userData.map((user) => ({
            ...user,
            subscriptions: allSubscriptions.filter(
              (sub) => sub.user_id === user.id,
            ),
          }));
        }
      } catch (e) {
        console.log("Could not fetch subscriptions", e);
      }

      return userData || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users. Please try again.",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update a user's subscription plan
  const updateUserSubscription = async (
    userId: string,
    planType: string,
    endDate?: string,
  ) => {
    try {
      setLoading(true);

      // Convert endDate string to Date object if provided
      const endDateObj = endDate ? new Date(endDate) : null;

      // Directly update the subscription without using RPC
      const { error: updateError } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          plan_type: planType,
          end_date: endDateObj ? endDateObj.toISOString() : null,
          status: "active",
          start_date: new Date().toISOString(), // Add start_date which is required
          updated_at: new Date().toISOString(),
          question_limit: planType === "premium" ? -1 : 10,
          perfect_response_limit: planType === "premium" ? 50 : 5,
          perfect_responses_used: 0, // Add default value
        });

      if (updateError) throw updateError;

      // Return a success indicator
      const data = { success: true };
      const error = null;

      if (error) throw error;

      toast({
        title: "Success",
        description: `User subscription updated to ${planType}.`,
      });

      return true;
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription. Please try again.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update multiple users' subscription plans
  const updateMultipleUserSubscriptions = async (
    userIds: string[],
    planType: string,
    endDate?: string,
  ) => {
    try {
      setLoading(true);

      // Convert endDate string to Date object if provided
      const endDateObj = endDate ? new Date(endDate) : null;

      // Update each user's subscription directly without RPC
      // Process one at a time to avoid batch issues
      const results = [];
      for (const userId of userIds) {
        const result = await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan_type: planType,
          end_date: endDateObj ? endDateObj.toISOString() : null,
          status: "active",
          start_date: new Date().toISOString(), // Add start_date which is required
          updated_at: new Date().toISOString(),
          question_limit: planType === "premium" ? -1 : 10,
          perfect_response_limit: planType === "premium" ? 50 : 5,
          perfect_responses_used: 0, // Add default value
        });
        results.push(result);
      }

      // Check for errors
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} subscriptions`);
      }

      toast({
        title: "Success",
        description: `Updated ${userIds.length} user subscriptions to ${planType}.`,
      });

      return true;
    } catch (error) {
      console.error("Error updating multiple subscriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update some subscriptions. Please try again.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a user
  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);

      // Delete the user from the public.users table
      // This will cascade to delete their subscription due to the foreign key constraint
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully.",
      });

      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user. Please try again.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchUsers,
    updateUserSubscription,
    updateMultipleUserSubscriptions,
    deleteUser,
  };
}
