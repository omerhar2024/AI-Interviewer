import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { FrameworkSelector } from "@/components/product-sense/FrameworkSelector";

const sections = [
  {
    id: "situation",
    title: "Situation",
    description: "Describe the context and background",
  },
  {
    id: "task",
    title: "Task",
    description: "What was your responsibility in this situation?",
  },
  {
    id: "action",
    title: "Action",
    description: "What specific steps did you take?",
  },
  {
    id: "result",
    title: "Result",
    description: "What was the outcome of your actions?",
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

      navigate(`/behavioral-recording/${questionId}`);
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

  const handleProductSenseSubmit = async (
    framework: string,
    responses: Record<string, string>,
  ) => {
    try {
      setSaving(true);
      // Store the framework information in a session variable to ensure it's available later
      sessionStorage.setItem("selectedFramework", framework);

      const { error } = await supabase.from("responses").insert({
        user_id: user?.id,
        question_id: questionId,
        notes: { framework, ...responses },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description:
          "Framework notes saved. You can now record your response using the recording button.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save framework responses. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate progress only for behavioral questions using STAR
  const progress =
    question?.type === "behavioral"
      ? Math.round(
          (Object.values(notes).filter((note) => note?.trim().length > 0)
            .length /
            sections.length) *
            100,
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // For product sense questions, show framework selector
  if (question?.type === "product_sense") {
    return (
      <div className="w-full p-6 mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Product Sense Preparation</h1>
          <p className="text-muted-foreground">{question?.text}</p>
        </div>

        <FrameworkSelector
          questionText={question?.text}
          questionId={questionId || ""}
          onSubmit={handleProductSenseSubmit}
        />
      </div>
    );
  }

  // For behavioral questions, show STAR framework
  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">STAR Preparation</h1>
          <p className="text-muted-foreground">{question?.text}</p>
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="text-sm text-muted-foreground">
              Progress: {progress}%
            </span>
          </div>
          <Progress value={progress} className="w-[200px] h-2 bg-blue-100" />
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
          className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
        >
          {saving ? "Saving..." : "Save and Proceed to Recording"}
        </Button>
      </div>
    </div>
  );
}
