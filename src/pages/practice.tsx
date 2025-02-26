import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/types/database";

type Question = Database["public"]["Tables"]["questions"]["Row"];

export default function PracticePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setQuestions(data || []);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load questions. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="text-4xl font-bold mb-8">Practice</h1>

      <div className="grid gap-6">
        {questions.map((question) => (
          <div
            key={question.id}
            className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-2">{question.text}</h3>
                <p className="text-sm text-muted-foreground">
                  Type: {question.type}
                </p>
              </div>
              <Button>Start Practice</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
