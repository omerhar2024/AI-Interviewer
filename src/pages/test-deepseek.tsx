import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deepseek } from "@/lib/deepseek";
import { Loader2 } from "lucide-react";

export default function TestDeepseekPage() {
  const [prompt, setPrompt] = useState(
    "Generate a challenging product sense interview question for a PM candidate.",
  );
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setResponse("");

      const result = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are an expert product manager interviewer. Generate high-quality, challenging interview questions.",
          },
          { role: "user", content: prompt },
        ],
      });

      if (result.choices && result.choices.length > 0) {
        setResponse(result.choices[0].message.content);
      } else {
        setResponse("No response generated. Please try again.");
      }
    } catch (error) {
      console.error("Error calling DeepSeek API:", error);
      setResponse(
        `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Test DeepSeek API</h1>
        <p className="text-muted-foreground mt-2">
          Test the DeepSeek API integration by generating interview questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader>
            <CardTitle>Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="min-h-[200px]"
              />
              <Button
                onClick={handleSubmit}
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Response"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200">
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`bg-white p-4 rounded-md border border-gray-200 min-h-[200px] ${loading ? "animate-pulse" : ""}`}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : response ? (
                <div className="whitespace-pre-line">{response}</div>
              ) : (
                <div className="text-gray-400 italic">
                  Response will appear here...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Note</h3>
        <p className="text-yellow-700">
          This page is for testing purposes only. It allows you to verify that
          the DeepSeek API integration is working correctly. In a production
          environment, you would want to implement proper rate limiting and
          error handling.
        </p>
      </div>
    </div>
  );
}
