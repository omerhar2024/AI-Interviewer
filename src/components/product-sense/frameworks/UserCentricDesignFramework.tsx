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
      title: "Understand the Context of Use",
      description:
        "Describe how the product is currently used and the environment in which it operates.",
      placeholder:
        "Describe the current usage context, including user environment and scenarios...",
      example:
        "The fitness app is primarily used by urban professionals aged 25-40 during early mornings and evenings. Users typically engage with it in short sessions (5-15 minutes) at home or in the gym, often in noisy environments with limited attention spans. Many users are juggling the app while preparing for work or managing other responsibilities.",
    },
    {
      id: "specify_requirements",
      title: "Specify User and Organizational Requirements",
      description:
        "Identify specific needs, goals, and pain points of users and the organization.",
      placeholder:
        "List the specific user needs, goals, and pain points, as well as organizational objectives...",
      example:
        "User needs: Quick workout selection based on available time, clear visual instructions that don't require reading, progress tracking across sessions, and offline functionality for gym use.\n\nPain points: Complex navigation requiring too many taps, workouts that don't adapt to available equipment, and difficulty maintaining consistency.\n\nOrganizational goals: Increase user retention, drive premium subscriptions, and establish the brand as a leader in convenient fitness solutions.",
    },
    {
      id: "design_solution",
      title: "Produce Design Solutions",
      description:
        "Propose a solution that addresses the identified requirements.",
      placeholder: "Describe your proposed design solution in detail...",
      example:
        "I propose redesigning the app with a time-based quick start feature on the home screen, allowing users to select available time (5, 10, 15, 30 min) and immediately see appropriate workouts. Each exercise would use motion graphics rather than text instructions, with optional audio guidance. The solution would include an equipment filter and a one-tap 'save for offline' feature. A weekly calendar view would visualize consistency and progress, with gentle reminders based on user-defined goals.",
    },
    {
      id: "evaluate",
      title: "Evaluate Designs Against Requirements",
      description:
        "Outline methods to assess if the design meets the identified needs.",
      placeholder:
        "Describe how you would evaluate whether your design meets the requirements...",
      example:
        "I would evaluate the design through multiple methods:\n1. Usability testing with 12 target users, measuring task completion time for starting a time-appropriate workout (target: under 10 seconds)\n2. A/B testing the new home screen against the current version, measuring engagement metrics and session frequency\n3. Diary studies with 8 users over two weeks to assess how the design fits into their daily routines\n4. Analytics tracking of feature usage, particularly focusing on the correlation between the quick-start feature and user retention\n5. Qualitative feedback through in-app surveys focusing on perceived convenience and satisfaction",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-orange-50 rounded-lg">
        <h3 className="font-bold text-orange-800 mb-2">
          User-Centric Design Framework
        </h3>
        <p className="text-sm text-orange-700">
          User-Centered Design focuses on designing products that meet user
          needs and expectations, ensuring usability and satisfaction through
          understanding context, specifying requirements, designing solutions,
          and evaluating against those requirements.
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
