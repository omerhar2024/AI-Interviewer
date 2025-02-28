import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useQuestions, QuestionFilters } from "@/lib/hooks/use-questions";
import { useSubscription, useUsageStats } from "@/lib/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, MessageSquare, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const typeFromUrl = queryParams.get("type");

  const [filters, setFilters] = useState<QuestionFilters>({
    type: typeFromUrl || "all",
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const {
    data: questions = [],
    isLoading: questionsLoading,
    refetch: refetchQuestions,
  } = useQuestions(filters);

  // Ensure we have the latest questions when this page loads
  useEffect(() => {
    refetchQuestions();
  }, [refetchQuestions, filters]);

  const { data: subscription } = useSubscription();
  const { data: usageStats, isLoading: statsLoading } = useUsageStats();

  const loading = questionsLoading || statsLoading;
  const usageCount = usageStats?.used || 0;

  // For admin user (omerhar2024@gmail.com), show all questions regardless of type
  const isAdmin = user?.email === "omerhar2024@gmail.com";

  const handleSelectQuestion = (questionId: string, type: string) => {
    // Admin users (omerhar2024@gmail.com) bypass usage limits
    // Check if user has reached the free tier limit (10 questions)
    if (!isAdmin && usageCount >= 10 && subscription?.plan_type !== "pro") {
      navigate("/subscription");
      return;
    }
    // For behavioral questions, go to behavioral recording
    // For product sense questions, go to preparation first
    const nextRoute =
      type === "behavioral" ? "behavioral-recording" : "preparation";
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
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-4xl font-bold">Select a Question</h1>
      </div>

      {!isAdmin && usageCount >= 10 && subscription?.plan_type !== "pro" && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8">
          <p className="text-yellow-700">
            You have reached your free tier limit of 10 questions. Please
            upgrade to continue practicing.
          </p>
          <Button
            onClick={() => navigate("/subscription")}
            className="mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            Upgrade Now
          </Button>
        </div>
      )}

      {isAdmin && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-8">
          <p className="text-blue-700">
            Admin access enabled. You have access to all features and question
            types.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((question) => (
          <Card
            key={question.id}
            className="hover:shadow-md transition-all duration-200"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {question.type === "product_sense" ? (
                      <Brain className="h-5 w-5 text-blue-500" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                    )}
                    <span className="font-medium">
                      {question.type === "product_sense"
                        ? "Product Sense"
                        : "Behavioral"}
                    </span>
                  </div>
                  <p className="text-lg font-medium">{question.text}</p>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    onClick={() =>
                      handleSelectQuestion(question.id, question.type)
                    }
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                  >
                    Select
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border">
            <p className="text-lg text-muted-foreground">
              No questions found matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
