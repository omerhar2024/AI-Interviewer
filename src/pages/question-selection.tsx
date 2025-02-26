import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, MessageSquare } from "lucide-react";

type Question = {
  id: string;
  text: string;
  type: "product_sense" | "behavioral";
};

export default function QuestionSelectionPage() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*");

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);

        // Fetch usage count
        const { count, error: countError } = await supabase
          .from("responses")
          .select("*", { count: "exact" })
          .eq("user_id", user?.id)
          .gte(
            "created_at",
            new Date(
              new Date().setMonth(new Date().getMonth() - 1),
            ).toISOString(),
          );

        if (countError) throw countError;
        setUsageCount(count || 0);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const productQuestions = questions.filter((q) => q.type === "product_sense");
  const behavioralQuestions = questions.filter((q) => q.type === "behavioral");

  const handleSelectQuestion = (questionId: string, type: string) => {
    // Temporarily disabled for development
    // if (usageCount >= 3) {
    //   navigate("/subscription");
    //   return;
    // }
    // For behavioral questions, skip preparation and go straight to recording
    // For product sense questions, go to preparation first
    const nextRoute = type === "behavioral" ? "recording" : "preparation";
    navigate(`/${nextRoute}/${questionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="text-4xl font-bold mb-8">Select a Question</h1>

      {usageCount >= 3 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8">
          <p className="text-yellow-700">
            You have reached your monthly limit. Please upgrade to continue
            practicing.
          </p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Product Sense Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <CardTitle>Product Sense</CardTitle>
            </div>
            <CardDescription>
              Test your product strategy and decision-making skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {productQuestions.slice(0, 3).map((question) => (
              <div
                key={question.id}
                className="p-4 rounded-lg border bg-card hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm">{question.text}</p>
                  <Button
                    onClick={() =>
                      handleSelectQuestion(question.id, "product_sense")
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Behavioral Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <CardTitle>Behavioral</CardTitle>
            </div>
            <CardDescription>
              Practice answering common behavioral interview questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {behavioralQuestions.slice(0, 3).map((question) => (
              <div
                key={question.id}
                className="p-4 rounded-lg border bg-card hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm">{question.text}</p>
                  <Button
                    onClick={() =>
                      handleSelectQuestion(question.id, "behavioral")
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
