import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const sections = [
  {
    id: "comprehend",
    title: "Comprehend",
    description: "Clarify the problem and understand the context",
  },
  {
    id: "identify",
    title: "Identify",
    description: "Who are the users and what are their needs?",
  },
  {
    id: "report",
    title: "Report",
    description: "What metrics will measure success?",
  },
  { id: "cut", title: "Cut", description: "Prioritize and focus on key areas" },
  { id: "list", title: "List", description: "Generate potential solutions" },
  {
    id: "evaluate",
    title: "Evaluate",
    description: "Analyze trade-offs and pick the best solution",
  },
  {
    id: "summarize",
    title: "Summarize",
    description: "Recap your recommendation",
  },
];

export default function PreparationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("id", questionId)
          .single();

        if (error) throw error;
        setQuestion(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load question. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (questionId) fetchQuestion();
  }, [questionId, toast]);

  const handleSaveAndProceed = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from("responses").insert({
        user_id: user?.id,
        question_id: questionId,
        notes: notes,
      });

      if (error) throw error;

      navigate(`/recording/${questionId}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const progress = Math.round(
    (Object.values(notes).filter((note) => note?.trim().length > 0).length /
      sections.length) *
      100,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-16 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Preparation</h1>
          <p className="text-muted-foreground">{question?.text}</p>
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="text-sm text-muted-foreground">
              Progress: {progress}%
            </span>
          </div>
          <Progress value={progress} className="w-[200px]" />
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
            <Textarea
              value={notes[section.id] || ""}
              onChange={(e) =>
                setNotes((prev) => ({
                  ...prev,
                  [section.id]: e.target.value,
                }))
              }
              placeholder={`Enter your ${section.title.toLowerCase()} notes here...`}
              className="min-h-[100px]"
            />
          </motion.div>
        ))}

        <Button
          onClick={handleSaveAndProceed}
          disabled={saving}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {saving ? "Saving..." : "Save and Proceed to Recording"}
        </Button>
      </div>
    </div>
  );
}
