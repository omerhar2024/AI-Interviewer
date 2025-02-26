import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { deepseek } from "@/lib/deepseek";
import { Card } from "@/components/ui/card";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    try {
      setLoading(true);
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: input,
          },
        ],
      });

      setResponse(completion.choices[0].message.content);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Sorry, there was an error processing your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card className="p-6 bg-background">
        <div className="space-y-4">
          <Textarea
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Thinking..." : "Ask"}
          </Button>
          {response && (
            <div className="mt-6 space-y-2">
              <h3 className="font-medium">Response:</h3>
              <div className="p-4 rounded-lg bg-muted whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
