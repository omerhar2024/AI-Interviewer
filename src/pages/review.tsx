import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function ReviewPage() {
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [transcript, setTranscript] = useState("");
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        const { data, error } = await supabase
          .from("responses")
          .select("*, questions(text)")
          .eq("id", questionId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        setResponse(data);

        // Check if transcript exists
        const { data: transcriptData, error: transcriptError } = await supabase
          .from("transcripts")
          .select("text")
          .eq("response_id", data.id)
          .single();

        if (!transcriptError && transcriptData) {
          setTranscript(transcriptData.text);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load response. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (questionId && user) fetchResponse();
  }, [questionId, user, toast]);

  const transcribeAudio = async () => {
    if (!response?.audio_url) return;

    try {
      setTranscribing(true);
      // Get signed URL from Supabase storage
      // Extract path from the full URL
      const audioPath = response.audio_url.split("/").slice(3).join("/");
      const {
        data: { signedUrl },
        error: signedUrlError,
      } = await supabase.storage
        .from("recordings")
        .createSignedUrl(audioPath, 60);

      if (signedUrlError) throw signedUrlError;

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: signedUrl }),
      });

      if (!transcribeResponse.ok) {
        const error = await transcribeResponse.json();
        throw new Error(error.error || "Transcription failed");
      }

      const { text } = await transcribeResponse.json();
      setTranscript(text);

      // Save transcript
      const { error } = await supabase.from("transcripts").insert({
        response_id: response.id,
        text,
      });

      if (error) throw error;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
      });
    } finally {
      setTranscribing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const { error } = await supabase.from("transcripts").upsert({
        response_id: response.id,
        text: transcript,
      });

      if (error) throw error;

      navigate("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save transcript. Please try again.",
      });
    } finally {
      setSubmitting(false);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-4">Review Your Answer</h1>
          <p className="text-muted-foreground">{response?.questions?.text}</p>
        </div>

        {/* Audio Player */}
        <div className="p-6 rounded-xl shadow-lg border bg-gradient-to-br from-blue-50 to-white">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            Recording
          </h2>
          <audio src={response?.audio_url} controls className="w-full" />
        </div>

        {/* Transcript */}
        <div className="p-6 rounded-xl shadow-lg border bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-800">Transcript</h2>
            {!transcript && (
              <Button
                onClick={transcribeAudio}
                disabled={transcribing}
                variant="outline"
              >
                {transcribing ? "Transcribing..." : "Generate Transcript"}
              </Button>
            )}
          </div>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your transcript will appear here..."
            className="min-h-[200px]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/recording/${questionId}`)}
          >
            Re-record
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !transcript}
            className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
          >
            {submitting ? "Saving..." : "Submit"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
