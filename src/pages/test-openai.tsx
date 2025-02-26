import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { openai } from "@/lib/openai";

export default function TestOpenAIPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    try {
      setLoading(true);
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: input || "Say hello!",
          },
        ],
      });

      setOutput(completion.choices[0].message.content);
    } catch (error) {
      console.error("OpenAI Error:", error);
      setOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-16 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Test OpenAI Integration</h1>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Input Text:</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter some text or leave empty for default 'hello' message"
            className="min-h-[100px]"
          />
        </div>

        <Button onClick={handleTest} disabled={loading} className="w-full">
          {loading ? "Testing..." : "Test OpenAI"}
        </Button>

        {output && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Response:</label>
            <div className="p-4 rounded-lg border bg-muted">{output}</div>
          </div>
        )}
      </div>
    </div>
  );
}
