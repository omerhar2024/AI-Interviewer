import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Analysis = {
  id: string;
  response_id: string;
  text: string;
  score: number;
};

function extractScore(text: string | null, section: string): number {
  if (!text) return 0;
  const regex = new RegExp(`${section} \\(Score ([0-9.]+)\/10\\):`);
  const match = text.match(regex);
  return match ? parseFloat(match[1]) : 0;
}

function extractOverallScore(text: string | null): number {
  if (!text) return 0;
  const regex = /Overall Score: ([0-9.]+)\/10/;
  const match = text.match(regex);
  return match ? parseFloat(match[1]) : 0;
}

function extractFeedback(
  text: string | null,
  section: string,
  type: string,
): string {
  if (!text) return "";
  const sectionRegex = new RegExp(
    `${section} \\(Score [0-9.]+\/10\\):[^]*?(?=\\n\\n|$)`,
  );
  const sectionMatch = text.match(sectionRegex);
  if (!sectionMatch) return "";

  const lines = sectionMatch[0].split("\n");
  const feedbackLine = lines.find((line) => line.includes(`${type}:`));
  return feedbackLine ? feedbackLine.split(":")[1]?.trim() || "" : "";
}

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const { responseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .eq("response_id", responseId)
          .single();

        if (error) throw error;
        setAnalysis(data);
      } catch (error) {
        console.error("Error fetching analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    if (responseId) fetchAnalysis();
  }, [responseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sections = ["Situation", "Task", "Action", "Result"];
  const feedbackTypes = [
    "What was observed",
    "What was missing",
    "Improvement suggestions",
  ];
  const overallScore = extractOverallScore(analysis?.text);

  return (
    <div className="container py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">STAR Analysis</h1>

      <div className="grid gap-6 mb-8">
        <Card className="p-6 bg-muted">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Overall Score</h3>
            <span className="text-2xl font-bold">{overallScore}/10</span>
          </div>
          <Progress value={overallScore * 10} className="h-2" />
        </Card>

        {sections.map((section) => {
          const score = extractScore(analysis?.text, section);
          return (
            <Card key={section} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{section}</h3>
                <span className="text-2xl font-bold">{score}/10</span>
              </div>
              <Progress value={score * 10} className="h-2 mb-4" />

              <div className="space-y-4">
                {feedbackTypes.map((type) => (
                  <div key={type} className="space-y-1">
                    <h4 className="font-medium">{type}:</h4>
                    <p className="text-sm text-muted-foreground">
                      {extractFeedback(analysis?.text, section, type)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    </div>
  );
}
