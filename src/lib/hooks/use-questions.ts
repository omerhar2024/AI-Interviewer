import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "@/types/database";

type Question = Database["public"]["Tables"]["questions"]["Row"];

export function useQuestions() {
  return useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
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
