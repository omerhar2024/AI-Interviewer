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

export default function BehavioralRecordingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
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
      } catch (error) {
        console.error("Error fetching question:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load question. Please try again.",
        });
      }
    };

    if (questionId) fetchQuestion();
  }, [questionId, toast]);

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

      const analysis = await analyzeResponse(transcript, question?.text);
      const scoreMatch = analysis.match(/Overall Score: ([0-9.]+)\/10/);
      const overallScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

      const { data: responseData, error: responseError } = await supabase
        .from("responses")
        .insert({
          user_id: user?.id,
          question_id: questionId,
          audio_url: "",
          transcript: transcript,
          situation: null,
          task: null,
          action: null,
          result: null,
        })
        .select()
        .single();

      if (responseError) throw responseError;

      if (responseData) {
        const situationMatch = analysis.match(/Situation \(([0-9.]+)\/10\)/);
        const taskMatch = analysis.match(/Task \(([0-9.]+)\/10\)/);
        const actionMatch = analysis.match(/Action \(([0-9.]+)\/10\)/);
        const resultMatch = analysis.match(/Result \(([0-9.]+)\/10\)/);

        const { error: feedbackError } = await supabase
          .from("feedback")
          .insert({
            response_id: responseData.id,
            text: analysis,
            score: overallScore,
            rating: null,
            situation_score: situationMatch
              ? parseFloat(situationMatch[1])
              : null,
            task_score: taskMatch ? parseFloat(taskMatch[1]) : null,
            action_score: actionMatch ? parseFloat(actionMatch[1]) : null,
            result_score: resultMatch ? parseFloat(resultMatch[1]) : null,
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

        // Navigate to the behavioral analysis page
        navigate(`/analysis/${responseData.id}`);
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

  const sampleResponse = `Situation
In my previous role as a Project Manager at XYZ Corp, I was overseeing a software development project for a key client. The stakeholder in this case was the client's VP of Operations, who proved challenging due to conflicting priorities. He insisted on an aggressive timeline to meet a market deadline, yet frequently requested significant changes to perfect the product. These demands created tension, as the constant revisions risked derailing the project schedule.


Task
My primary responsibility was to ensure the project was delivered on time while balancing the stakeholder's high expectations. I also needed to keep the development team on track and motivated, despite the shifting requirements.


Action
To address this, I took a proactive and collaborative approach:
Step 1: Stakeholder Engagement – I scheduled a one-on-one meeting with the VP to fully understand his concerns and priorities. By listening actively, I validated his need for both speed and quality.
Step 2: Solution Proposal – I suggested a phased approach: we'd focus on delivering the core features by the deadline and plan additional enhancements for a follow-up release. This aligned with his goals while keeping the timeline intact.
Step 3: Communication Plan – I established weekly check-ins with the stakeholder to provide updates and gather feedback early, minimizing late-stage surprises.
Step 4: Team Coordination – I worked with the development team to break the project into smaller sprints, enabling us to pivot quickly when new requests arose.


Result
The outcome was a success. We delivered the project on schedule, meeting the critical market deadline with the essential features in place. The stakeholder was pleased with the result and appreciated the plan for incorporating his additional changes in a subsequent update. This not only maintained a positive relationship but also boosted team morale, as they saw their efforts recognized. Reflecting on this, I learned the value of clear communication and adaptable planning when navigating challenging stakeholder dynamics.`;

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="space-y-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-blue-800">Question</h2>
            <p className="text-lg text-muted-foreground">
              {question?.text || "Loading question..."}
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-blue-800">
                  Sample Response
                </h2>
              </div>
              <div className="bg-white p-4 rounded-md border border-blue-100">
                <FormattedText text={sampleResponse} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-blue-800">
                  STAR Response
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
                className="min-h-[200px] resize-none"
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
    </div>
  );
}
