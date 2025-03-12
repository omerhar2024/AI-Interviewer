import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { useToast } from "./use-toast";
import { Mic, Square } from "lucide-react";

type AudioRecorderProps = {
  onTranscriptChange: (transcript: string) => void;
  questionType?: "behavioral" | "product_sense";
  initialTranscript?: string;
  className?: string;
};

export function AudioRecorder({
  onTranscriptChange,
  questionType = "behavioral",
  initialTranscript = "",
  className = "",
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState(initialTranscript);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const startSpeechRecognition = async () => {
    try {
      // Check if browser supports speech recognition
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        throw new Error("Speech recognition is not supported in this browser.");
      }

      // Create speech recognition instance
      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = transcript;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const newTranscript = finalTranscript;
        setTranscript(newTranscript);
        onTranscriptChange(newTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast({
          variant: "destructive",
          title: "Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
        });
        stopRecording();
      };

      recognition.start();
      recognitionRef.current = recognition;
      return true;
    } catch (error) {
      console.error("Error setting up speech recognition:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to start speech recognition",
      );
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
      recognitionRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      await startSpeechRecognition();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to start recording",
      });
    }
  };

  const stopRecording = () => {
    stopSpeechRecognition();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Notify parent component of transcript
    onTranscriptChange(transcript);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {questionType === "behavioral"
            ? "Record Your STAR Response"
            : "Record Your Answer"}
        </h2>
        <div className="flex items-center gap-2">
          <div className="text-sm font-mono">{formatTime(duration)}</div>
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
        onChange={(e) => {
          setTranscript(e.target.value);
          onTranscriptChange(e.target.value);
        }}
        className="min-h-[200px] resize-none"
        placeholder="Your speech will appear here as you speak..."
      />
    </div>
  );
}
