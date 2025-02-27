import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export function useRealtimeFeedback(responseId: string | undefined) {
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!responseId) return;

    const fetchInitialFeedback = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .eq("response_id", responseId)
          .single();

        if (error) throw error;
        setFeedback(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchInitialFeedback();

    // Set up realtime subscription
    const subscription = supabase
      .channel(`feedback:${responseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feedback",
          filter: `response_id=eq.${responseId}`,
        },
        (payload) => {
          setFeedback(payload.new);
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [responseId]);

  return { feedback, loading, error };
}
