import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * Hook to sync user subscription data with the database
 * This ensures the user's subscription plan is always up-to-date
 */
export function useSyncSubscription() {
  const { user } = useAuth();

  useEffect(() => {
    const syncSubscription = async () => {
      if (!user) return;

      try {
        // Call the sync_user_subscription RPC function
        const { data, error } = await supabase.rpc("sync_user_subscription", {
          user_id: user.id,
        });

        if (error) {
          console.error("Error syncing user subscription:", error);
        } else {
          console.log("Subscription synced successfully:", data);
        }
      } catch (error) {
        console.error("Exception in subscription sync:", error);
      }
    };

    // Sync on mount
    syncSubscription();

    // Set up interval to sync every 5 minutes
    const interval = setInterval(syncSubscription, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  return null; // This hook doesn't return anything
}
