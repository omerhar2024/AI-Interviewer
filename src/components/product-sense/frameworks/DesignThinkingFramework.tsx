import { Textarea } from "@/components/ui/textarea";

interface DesignThinkingFrameworkProps {
  questionText: string;
  responses: Record<string, string>;
  onChange: (section: string, value: string) => void;
}

export function DesignThinkingFramework({
  questionText,
  responses,
  onChange,
}: DesignThinkingFrameworkProps) {
  const sections = [
    {
      id: "empathize",
      title: "Empathize",
      description:
        "Understand the users and their current experience with the product, identifying pain points or unmet needs.",
      placeholder:
        "Describe the users and their current experience, including pain points and unmet needs...",
      example:
        "Users of the app are primarily young professionals who use it for daily task management. They're frustrated by the complex navigation and slow load times, which prevent them from quickly adding tasks on the go.",
    },
    {
      id: "define",
      title: "Define",
      description:
        "Clearly state the problem or opportunity based on user understanding.",
      placeholder:
        "Define the core problem or opportunity based on user needs...",
      example:
        "The problem is that users cannot efficiently add and organize tasks on mobile devices due to the app's complex interface and performance issues, leading to decreased productivity and user frustration.",
    },
    {
      id: "ideate",
      title: "Ideate",
      description:
        "Generate ideas for improvement, listing multiple possible solutions.",
      placeholder:
        "List multiple potential solutions to address the defined problem...",
      example:
        "1. Redesign the mobile interface with a simplified, one-tap task creation flow\n2. Implement a voice input feature for hands-free task creation\n3. Create a 'quick add' widget for the home screen\n4. Optimize app performance to reduce load times by 50%",
    },
    {
      id: "prototype",
      title: "Prototype",
      description:
        "Think about how to test those ideas, perhaps through rough drafts or small experiments.",
      placeholder:
        "Describe how you would create prototypes to test your ideas...",
      example:
        "I would create a clickable wireframe of the simplified interface using Figma, focusing on the task creation flow. For the voice input feature, I'd develop a basic working prototype that team members could test in daily use scenarios.",
    },
    {
      id: "test",
      title: "Test",
      description:
        "Plan how to validate those ideas with users, considering feedback or metrics.",
      placeholder:
        "Outline your approach to testing the prototypes with users and measuring success...",
      example:
        "I would conduct usability testing with 10-15 current users, observing them complete specific tasks using the prototypes. Success metrics would include task completion time, error rate, and satisfaction scores. We'd also implement A/B testing with a small percentage of users to measure engagement metrics like task creation frequency and time spent in the app.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 rounded-lg">
        <h3 className="font-bold text-purple-800 mb-2">
          Design Thinking Framework
        </h3>
        <p className="text-sm text-purple-700">
          Design Thinking is a user-centered approach that involves empathizing
          with users, defining the problem, ideating solutions, prototyping, and
          testing.
        </p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-2">Question</h3>
        <p className="text-gray-700">{questionText}</p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h3 className="text-lg font-medium text-purple-800">
              {section.title}
            </h3>
            <p className="text-sm text-gray-600">{section.description}</p>
            <Textarea
              value={responses[section.id] || ""}
              onChange={(e) => onChange(section.id, e.target.value)}
              placeholder=""
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
