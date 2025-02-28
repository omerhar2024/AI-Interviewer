import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mic, Square, Loader2, Clock } from "lucide-react";
import { analyzeResponse } from "@/lib/analyze";
import { Textarea } from "@/components/ui/textarea";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface RecordingButtonProps {
  questionId: string;
  questionText: string;
  framework: string;
}

export function RecordingButton({
  questionId,
  questionText,
  framework,
}: RecordingButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

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
        confidenceThreshold: 0.5, // Lower threshold to avoid no-speech errors
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
            setTranscript((prev) => prev + text + " ");
          }
        },
        // Error callback
        (event) => {
          console.error("Speech recognition error:", event);
          // Don't stop recording on no-speech errors, just notify the user
          if (event.error === "no-speech") {
            toast({
              title: "No speech detected",
              description: "Please speak louder or check your microphone.",
            });
          } else {
            stopRecording();
            toast({
              variant: "destructive",
              title: "Error",
              description: "Speech recognition failed. Please try again.",
            });
          }
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
        description: "Please record your response before submitting",
      });
      return;
    }

    try {
      setAnalyzing(true);

      const analysis = await analyzeResponse(transcript, questionText);
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
        const { error: feedbackError } = await supabase
          .from("feedback")
          .insert({
            response_id: responseData.id,
            text: analysis,
            score: overallScore,
            rating: null,
          });

        if (feedbackError) throw feedbackError;

        // Skip usage stats update for now to avoid errors
        // We'll implement a proper solution later

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
      // Reset transcript and duration after submission
      setTranscript("");
      setDuration(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate remaining time for 5-minute limit
  const maxDuration = 300; // 5 minutes in seconds
  const remainingTime = maxDuration - duration;
  const remainingPercentage = (remainingTime / maxDuration) * 100;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
              <Mic className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-blue-800">
              Record Your Response
            </h3>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-blue-100">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-mono font-medium text-blue-700">
                {formatTime(duration)} / 5:00
              </span>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {isRecording ? (
            <p>Recording in progress. Click stop when you're finished.</p>
          ) : transcript ? (
            <p>Your response has been recorded. Click submit to analyze it.</p>
          ) : (
            <p>
              Click the button below to start recording your{" "}
              {getFrameworkName(framework)} framework response.
            </p>
          )}
        </div>

        {isRecording && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000"
              style={{ width: `${remainingPercentage}%` }}
            ></div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-between items-center">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            className={`${isRecording ? "animate-pulse" : ""} px-6`}
            disabled={analyzing}
          >
            {isRecording ? (
              <>
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </>
            ) : analyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : transcript ? (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Record Again
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </>
            )}
          </Button>

          {/* Submit button - only show when recording is stopped and there's a transcript */}
          {!isRecording && transcript.trim() && (
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
                "Submit Response"
              )}
            </Button>
          )}
        </div>

        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="min-h-[150px] resize-none"
          placeholder="Your speech will appear here when you start recording..."
        />
      </div>
    </div>
  );
}
