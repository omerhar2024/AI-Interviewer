import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send } from "lucide-react";
import { analyzeResponse } from "@/lib/analyze";
import { Textarea } from "@/components/ui/textarea";

interface ResponseSubmitterProps {
  questionId: string;
  questionText: string;
  framework: string;
}

export function ResponseSubmitter({
  questionId,
  questionText,
  framework,
}: ResponseSubmitterProps) {
  const [response, setResponse] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAnalyzeResponse = async () => {
    if (!response.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your response before submitting",
      });
      return;
    }

    try {
      setAnalyzing(true);

      const analysis = await analyzeResponse(response, questionText);
      const scoreMatch = analysis.match(/Overall Score: ([0-9.]+)\/10/);
      const overallScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

      const { data: responseData, error: responseError } = await supabase
        .from("responses")
        .insert({
          user_id: user?.id,
          question_id: questionId,
          audio_url: "",
          transcript: response, // Using the same field to maintain compatibility
          notes: { framework },
        })
        .select()
        .single();

      if (responseError) throw responseError;

      if (responseData) {
        const { error: feedbackError } = await supabase
          .from("feedback")
          .insert({
            response_id: responseData.id,
            text: analysis,
            score: overallScore,
            rating: null,
          });

        if (feedbackError) throw feedbackError;

        // Update usage stats by incrementing the count
        if (user) {
          try {
            const { error: usageError } = await supabase.rpc(
              "increment_usage_count",
              { p_user_id: user.id },
            );
            if (usageError)
              console.error("Error updating usage stats:", usageError);
          } catch (err) {
            console.error("Failed to update usage stats:", err);
            // Continue with the flow even if usage stats update fails
          }
        }

        // Route based on the framework - keeping the same navigation logic
        if (framework) {
          switch (framework) {
            case "circles":
              navigate(`/circles-analysis/${responseData.id}`);
              break;
            case "design-thinking":
              navigate(`/design-thinking-analysis/${responseData.id}`);
              break;
            case "jtbd":
              navigate(`/jtbd-analysis/${responseData.id}`);
              break;
            case "user-centric":
              navigate(`/user-centric-analysis/${responseData.id}`);
              break;
            default:
              navigate(`/product-sense-analysis/${responseData.id}`);
          }
        } else {
          // Default to product sense analysis if no framework is found
          navigate(`/product-sense-analysis/${responseData.id}`);
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze response. Please try again.",
      });
    } finally {
      setAnalyzing(false);
      // Reset response after submission
      setResponse("");
    }
  };

  const getFrameworkName = (framework: string) => {
    switch (framework) {
      case "circles":
        return "CIRCLES";
      case "design-thinking":
        return "Design Thinking";
      case "jtbd":
        return "Jobs-To-Be-Done";
      case "user-centric":
        return "User-Centric Design";
      default:
        return "Product Framework";
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 p-6 mb-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-blue-800">
              Your {getFrameworkName(framework)} Response
            </h3>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            Type your response using the {getFrameworkName(framework)} framework
            and click submit for analysis.
          </p>
        </div>

        <Textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          className="min-h-[250px] resize-none"
          placeholder=""
        />

        <div className="flex justify-end">
          <Button
            onClick={handleAnalyzeResponse}
            disabled={analyzing}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white px-6"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Submit Response
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
