import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "@/types/database";

type Question = Database["public"]["Tables"]["questions"]["Row"];

export type QuestionFilters = {
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export function useQuestions(filters?: QuestionFilters) {
  return useQuery<Question[]>({
    queryKey: ["questions", filters],
    queryFn: async () => {
      let query = supabase.from("questions").select("*");

      // Apply type filter
      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }

      // Apply sorting
      const sortBy = filters?.sortBy || "created_at";
      const sortOrder = filters?.sortOrder || "desc";
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Refetch every 10 seconds to ensure latest data
    staleTime: 5000, // Consider data stale after 5 seconds
  });
}

export function useQuestion(id: string | undefined) {
  return useQuery<Question>({
    queryKey: ["questions", id],
    queryFn: async () => {
      if (!id) throw new Error("Question ID is required");

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
