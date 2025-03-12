import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import { FormattedText } from "@/components/ui/formatted-text";
import { AnalysisCard } from "@/components/ui/analysis-card";

export default function AnalysisPage() {
  const { responseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!responseId || !user) return;

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

        if (feedbackData) {
          setFeedback(feedbackData);
          setNotes(feedbackData.notes || "");
        }
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

    fetchData();
  }, [responseId, user, toast]);

  const handleRateFeedback = async (rating: number) => {
    try {
      if (!feedback || !responseId) return;

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

  const handleSaveNotes = async () => {
    try {
      if (!feedback || !responseId) return;

      const { error } = await supabase
        .from("feedback")
        .update({ notes })
        .eq("id", feedback.id);

      if (error) throw error;

      toast({
        title: "Notes Saved",
        description: "Your notes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notes. Please try again.",
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
        <h1 className="text-3xl font-bold">STAR Analysis</h1>
      </div>

      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle>Question</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{question?.text}</p>
          </CardContent>
        </Card>

        {/* Analysis Card */}
        {feedback && (
          <AnalysisCard analysisText={feedback.text} framework="star" />
        )}

        {/* Response Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">
              <FormattedText
                text={response?.transcript || "No transcript available"}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
