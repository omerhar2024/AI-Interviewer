import { Textarea } from "@/components/ui/textarea";

interface UserCentricDesignFrameworkProps {
  questionText: string;
  responses: Record<string, string>;
  onChange: (section: string, value: string) => void;
}

export function UserCentricDesignFramework({
  questionText,
  responses,
  onChange,
}: UserCentricDesignFrameworkProps) {
  const sections = [
    {
      id: "understand_context",
      title: "Understand Context of Use",
      description:
        "Analyze the current situation, user interactions, and environmental factors.",
      placeholder:
        "Describe the current product situation, how users interact with it, and relevant environmental factors...",
      example:
        "The fitness app is primarily used by urban professionals aged 25-40 during early mornings and evenings, often in noisy gym environments with limited attention spans and frequent interruptions.",
    },
    {
      id: "specify_requirements",
      title: "Specify User Requirements",
      description: "Identify user goals, needs, expectations, and pain points.",
      placeholder: "List specific user goals, needs, and pain points...",
      example:
        "Users need: 1) Quick workout selection based on available time (5-30 min), 2) Visual rather than text-based instructions for noisy environments, 3) Progress tracking across sessions, 4) Offline functionality for areas with poor connectivity.",
    },
    {
      id: "design_solution",
      title: "Design Solution",
      description:
        "Propose a solution that addresses the specified user requirements.",
      placeholder:
        "Describe your solution and how it addresses each identified requirement...",
      example:
        "The redesigned app will feature: 1) A time-based quick start on the home screen allowing users to select available time (5, 10, 15, 30 min) and immediately see appropriate workouts, 2) Motion graphics rather than text instructions with optional audio guidance, 3) A weekly calendar view visualizing consistency and progress.",
    },
    {
      id: "evaluate",
      title: "Evaluate",
      description: "Define how to measure success and gather user feedback.",
      placeholder:
        "Outline specific success metrics and methods for gathering user feedback...",
      example:
        "Evaluation will include: 1) Usability testing with 12 target users measuring task completion time for starting a workout (target: under 10 seconds), 2) A/B testing the new home screen against the current version measuring engagement metrics, 3) Analytics tracking correlation between quick-start feature usage and retention rate (target: 20% improvement).",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-orange-50 rounded-lg">
        <h3 className="font-bold text-orange-800 mb-2">
          User-Centric Design Framework
        </h3>
        <p className="text-sm text-orange-700">
          The User-Centric Design framework focuses on understanding users'
          needs and contexts, specifying requirements, designing solutions, and
          evaluating them with users to ensure they meet the intended goals.
        </p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-2">Question</h3>
        <p className="text-gray-700">{questionText}</p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h3 className="text-lg font-medium text-orange-800">
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
