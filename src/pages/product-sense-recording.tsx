import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mic, Square, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FormattedText } from "@/components/ui/formatted-text";
import { analyzeResponse } from "@/lib/analyze";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function ProductSenseRecordingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [framework, setFramework] = useState<string>("");
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout>();
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

        // Get framework from session storage
        const storedFramework = sessionStorage.getItem("selectedFramework");
        if (storedFramework) {
          setFramework(storedFramework);
        } else {
          // Try to get framework from previous responses
          const { data: prepData, error: prepError } = await supabase
            .from("responses")
            .select("notes")
            .eq("user_id", user?.id)
            .eq("question_id", questionId)
            .order("created_at", { ascending: false })
            .limit(5);

          if (!prepError && prepData && prepData.length > 0) {
            for (const prep of prepData) {
              if (prep.notes && prep.notes.framework) {
                setFramework(prep.notes.framework);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching question:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load question. Please try again.",
        });
      }
    };

    if (questionId && user) fetchQuestion();
  }, [questionId, user, toast]);

  const startSpeechRecognition = async () => {
    try {
      // Import the AudioProcessor dynamically to avoid loading it on initial page load
      const { AudioProcessor } = await import("@/lib/audio-processor");

      // Create and initialize the audio processor
      const processor = new AudioProcessor({
        language: "en-US",
        continuous: true,
        interimResults: true,
        maxAlternatives: 3,
        confidenceThreshold: 0.65, // Slightly lower threshold for better recall
      });

      const initialized = await processor.initialize();
      if (!initialized) {
        throw new Error("Failed to initialize audio processor");
      }

      // Store the processor in the ref
      recognitionRef.current = processor;

      // Start processing with callbacks
      processor.start(
        // Result callback
        (text, isFinal) => {
          if (isFinal) {
            setTranscript((prev) => prev + text);
          }
        },
        // Error callback
        (event) => {
          console.error("Speech recognition error:", event);
          stopRecording();
          toast({
            variant: "destructive",
            title: "Error",
            description: "Speech recognition failed. Please try again.",
          });
        },
      );
    } catch (error) {
      console.error("Error setting up speech recognition:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Speech recognition is not supported in this browser.",
      });
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startRecording = () => {
    startSpeechRecognition();
    setIsRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    stopSpeechRecognition();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleAnalyzeResponse = async () => {
    if (!transcript.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a response before submitting",
      });
      return;
    }

    try {
      setAnalyzing(true);
      console.log("Starting analysis with framework:", framework);
      const analysis = await analyzeResponse(
        transcript,
        question?.text,
        framework,
      );
      console.log(
        "Analysis result received:",
        analysis ? analysis.substring(0, 100) + "..." : "No analysis",
      );
      const scoreMatch = analysis.match(/Overall Score: ([0-9.]+)\/10/);
      const overallScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

      const { data: responseData, error: responseError } = await supabase
        .from("responses")
        .insert({
          user_id: user?.id,
          question_id: questionId,
          audio_url: "",
          transcript: transcript,
          notes: { framework },
        })
        .select()
        .single();

      if (responseError) throw responseError;

      if (responseData) {
        console.log("Saving feedback for response ID:", responseData.id);
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

        // Route based on the framework
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
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="space-y-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-blue-800">Question</h2>
            <p className="text-lg text-muted-foreground">
              {question?.text || "Loading question..."}
            </p>
            {framework && (
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Framework: {getFrameworkName(framework)}
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-blue-800">
                Your Response
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm font-mono text-muted-foreground">
                  {formatTime(duration)}
                </div>
                <Button
                  size="icon"
                  variant={isRecording ? "destructive" : "secondary"}
                  onClick={isRecording ? stopRecording : startRecording}
                  className="h-10 w-10 rounded-full"
                >
                  {isRecording ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[300px] resize-none"
              placeholder="Your speech will appear here as you speak..."
            />

            <Button
              onClick={handleAnalyzeResponse}
              disabled={analyzing || !question}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : !question ? (
                "Loading question..."
              ) : (
                "Submit Response"
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
