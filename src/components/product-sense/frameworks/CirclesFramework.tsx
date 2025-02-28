import { Textarea } from "@/components/ui/textarea";

interface CirclesFrameworkProps {
  questionText: string;
  responses: Record<string, string>;
  onChange: (section: string, value: string) => void;
}

export function CirclesFramework({
  questionText,
  responses,
  onChange,
}: CirclesFrameworkProps) {
  const sections = [
    {
      id: "comprehend",
      title: "Comprehend the situation",
      description:
        "Assess the current state of the product or service and consider market trends.",
      placeholder:
        "Describe the current situation, including the product's state, market trends, and any relevant context...",
      example:
        "The messaging app is currently losing users to competitors due to slow features. Market trends show users value instant communication.",
    },
    {
      id: "identify",
      title: "Identify the customer",
      description: "Focus on a key user group and their characteristics.",
      placeholder:
        "Identify the primary users and their key characteristics...",
      example:
        "The primary users are teenagers who value speed and fun in messaging.",
    },
    {
      id: "report",
      title: "Report customer needs",
      description: "Highlight user desires and pain points.",
      placeholder: "Describe what the users need and their pain points...",
      example:
        "Users need quick, expressive communication. They're frustrated by delayed messages and lack of engaging features.",
    },
    {
      id: "cut",
      title: "Cut through prioritization",
      description: "Prioritize needs based on impact and importance.",
      placeholder: "Prioritize the most important needs and explain why...",
      example:
        "Speed is the top priority because it directly impacts user retention and satisfaction. Secondary priorities include expression and engagement.",
    },
    {
      id: "list",
      title: "List solutions",
      description: "Suggest multiple potential solutions.",
      placeholder:
        "List several potential solutions to address the prioritized needs...",
      example:
        "1. Voice snippets for quick communication\n2. Instant GIFs for expressive messaging\n3. 'Typing turbo' mode to speed up text entry",
    },
    {
      id: "evaluate",
      title: "Evaluate trade-offs",
      description: "Compare costs versus user impact for each solution.",
      placeholder: "Evaluate the pros and cons of each solution...",
      example:
        "Voice snippets: High impact but requires server upgrades (costly)\nInstant GIFs: Medium impact, easier to implement but less unique\nTyping turbo: Low cost but may not address core speed issues",
    },
    {
      id: "summarize",
      title: "Summarize recommendation",
      description: "Recommend the best solution and explain why.",
      placeholder: "Provide your final recommendation with justification...",
      example:
        "I recommend implementing voice snippets as the standout feature because it best addresses the speed need while providing a unique selling point that competitors don't have. The investment in server infrastructure will pay off through increased user engagement and retention.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">CIRCLES Framework</h3>
        <p className="text-sm text-blue-700">
          The CIRCLES framework helps structure your approach to product design
          questions by walking through Comprehension, Identification, Reporting,
          Cutting, Listing, Evaluating, and Summarizing.
        </p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-2">Question</h3>
        <p className="text-gray-700">{questionText}</p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h3 className="text-lg font-medium text-blue-800">
              {section.title}
            </h3>
            <p className="text-sm text-gray-600">{section.description}</p>
            <Textarea
              value={responses[section.id] || ""}
              onChange={(e) => onChange(section.id, e.target.value)}
              placeholder={section.placeholder}
              className="min-h-[100px]"
            />
            <div className="text-xs text-gray-500">
              <span className="font-medium">Example:</span> {section.example}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
