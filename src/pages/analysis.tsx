import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFeedback } from "@/lib/hooks/use-feedback";
import { useRealtimeFeedback } from "@/lib/hooks/use-realtime-feedback";

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
  const { responseId } = useParams();
  const navigate = useNavigate();
  const { feedback: analysis, loading } = useRealtimeFeedback(responseId);

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
    <div className="w-full p-6 mx-auto max-w-7xl">
      <h1 className="text-4xl font-bold mb-8">STAR Analysis</h1>

      <div className="grid gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-800">
              Overall Score
            </h3>
            <span className="text-2xl font-bold">{overallScore}/10</span>
          </div>
          <Progress value={overallScore * 10} className="h-2 bg-blue-100" />
        </Card>

        {sections.map((section) => {
          const score = extractScore(analysis?.text, section);
          return (
            <Card
              key={section}
              className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-blue-800">
                  {section}
                </h3>
                <span className="text-2xl font-bold">{score}/10</span>
              </div>
              <Progress value={score * 10} className="h-2 mb-4 bg-blue-100" />

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
        <Button
          onClick={() => navigate("/dashboard")}
          className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
