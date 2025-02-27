import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useQuestions } from "@/lib/hooks/use-questions";
import { useSubscription, useUsageStats } from "@/lib/hooks/use-subscription";
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: questions = [], isLoading: questionsLoading } = useQuestions();
  const { data: subscription } = useSubscription();
  const { data: usageStats, isLoading: statsLoading } = useUsageStats();

  const loading = questionsLoading || statsLoading;
  const usageCount = usageStats?.used || 0;

  // For admin user (omerhar2024@gmail.com), show all questions regardless of type
  // For regular users, filter based on subscription status
  const isAdmin = user?.email === "omerhar2024@gmail.com";
  const productQuestions = questions.filter((q) => q.type === "product_sense");
  const behavioralQuestions = questions.filter((q) => q.type === "behavioral");

  const handleSelectQuestion = (questionId: string, type: string) => {
    // Admin users (omerhar2024@gmail.com) bypass usage limits
    // Check if user has reached the free tier limit (10 questions)
    if (!isAdmin && usageCount >= 10 && subscription?.plan_type !== "pro") {
      navigate("/subscription");
      return;
    }
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
    <div className="w-full p-6 mx-auto max-w-7xl">
      <h1 className="text-4xl font-bold mb-8">Select a Question</h1>

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
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
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
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
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
