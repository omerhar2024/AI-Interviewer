import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormattedText } from "@/components/ui/formatted-text";
import { ArrowLeft, ThumbsUp, ThumbsDown, Star } from "lucide-react";

export default function ProductSenseAnalysisPage() {
  const { responseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch response data
        const { data: responseData, error: responseError } = await supabase
          .from("responses")
          .select("*, questions(*)")
          .eq("id", responseId)
          .single();

        if (responseError) throw responseError;
        setResponse(responseData);
        setQuestion(responseData.questions);

        // Fetch feedback data
        const { data: feedbackData, error: feedbackError } = await supabase
          .from("feedback")
          .select("*")
          .eq("response_id", responseId)
          .single();

        if (feedbackError && feedbackError.code !== "PGRST116")
          throw feedbackError;
        setFeedback(feedbackData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load analysis data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (responseId) fetchData();
  }, [responseId, toast]);

  const handleRateFeedback = async (rating: number) => {
    try {
      if (!feedback) return;

      const { error } = await supabase
        .from("feedback")
        .update({ rating })
        .eq("id", feedback.id);

      if (error) throw error;

      setFeedback({ ...feedback, rating });

      toast({
        title: "Thank you!",
        description: "Your feedback has been recorded.",
      });
    } catch (error) {
      console.error("Error rating feedback:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your rating. Please try again.",
      });
    }
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
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-4xl font-bold">Product Sense Analysis</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Question and Response Section */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Question
            </h2>
            <p className="text-lg text-gray-700">{question?.text}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Your Response
            </h2>
            <div className="bg-white p-4 rounded-md border border-gray-100">
              <FormattedText
                text={response?.transcript || "No transcript available"}
              />
            </div>
          </Card>
        </div>

        {/* Analysis Section */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Product Sense Analysis
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.round(feedback?.score || 0) / 2 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-gray-800">
                  {feedback?.score?.toFixed(1) || "N/A"}/10
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md border border-gray-100 whitespace-pre-line overflow-auto max-h-[600px]">
              {feedback?.text || "No analysis available yet."}
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <p className="text-sm text-gray-600 mr-2">
                Was this analysis helpful?
              </p>
              <Button
                variant="outline"
                size="sm"
                className={`${feedback?.rating === 1 ? "bg-green-100 border-green-300" : ""}`}
                onClick={() => handleRateFeedback(1)}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${feedback?.rating === 0 ? "bg-red-100 border-red-300" : ""}`}
                onClick={() => handleRateFeedback(0)}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                No
              </Button>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/practice")}
              className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
            >
              Practice Another Question
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="flex-1"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
