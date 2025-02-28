import { Textarea } from "@/components/ui/textarea";

interface JTBDFrameworkProps {
  questionText: string;
  responses: Record<string, string>;
  onChange: (section: string, value: string) => void;
}

export function JTBDFramework({
  questionText,
  responses,
  onChange,
}: JTBDFrameworkProps) {
  const sections = [
    {
      id: "identify_job",
      title: "Identify the Job",
      description:
        "Identify the specific task or goal the user is trying to accomplish.",
      placeholder:
        "What job is the user trying to get done? Be specific about their goal...",
      example:
        "Users are trying to get quick updates on breaking news that matters to them without having to actively search for information or wade through irrelevant content.",
    },
    {
      id: "current_solutions",
      title: "Current Solutions",
      description: "Analyze existing solutions and their limitations.",
      placeholder:
        "What solutions do users currently use, and what are their limitations?...",
      example:
        "Currently, users rely on news apps that require manual refreshing and often have slow loading times. Social media provides quick updates but mixes news with personal content, making it difficult to focus on important information. Traditional news websites are comprehensive but not personalized to users' interests.",
    },
    {
      id: "functional_requirements",
      title: "Functional Requirements",
      description:
        "Define the practical requirements needed to complete the job effectively.",
      placeholder: "What functional capabilities must the solution have?...",
      example:
        "The solution needs fast loading times (under 2 seconds), personalized content filtering based on user interests, push notifications for breaking news, and offline reading capabilities for commuters with spotty connections.",
    },
    {
      id: "emotional_social",
      title: "Emotional and Social Needs",
      description:
        "Consider the emotional and social aspects of completing the job.",
      placeholder: "What emotional and social needs are tied to this job?...",
      example:
        "Emotionally, users need to feel informed and prepared (reducing anxiety about missing important news). Socially, they want to be able to share relevant stories with friends and colleagues to demonstrate awareness and contribute to conversations.",
    },
    {
      id: "proposed_solution",
      title: "Proposed Solution",
      description:
        "Propose a solution that addresses the job better than current alternatives.",
      placeholder:
        "Describe your proposed solution and how it addresses the job better than alternatives...",
      example:
        "I propose a news alert feature that uses AI to analyze user reading patterns and deliver personalized, real-time alerts for truly important stories. It would include a 'briefing' mode that summarizes key points in 30 seconds or less, and a 'deep dive' option for when users have more time. The solution would pre-load content in the background to ensure instant access when opened.",
    },
    {
      id: "validation",
      title: "Validation Approach",
      description:
        "Plan how to confirm the solution effectively meets the job.",
      placeholder:
        "How would you validate that your solution effectively meets the job?...",
      example:
        "I would validate this solution through a combination of quantitative and qualitative methods: A/B testing with a subset of users to measure engagement metrics (time in app, click-through rates on alerts), user interviews to gather feedback on the relevance of alerts, and a satisfaction survey comparing the new solution to previous methods of consuming news.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 rounded-lg">
        <h3 className="font-bold text-green-800 mb-2">
          Jobs-To-Be-Done (JTBD) Framework
        </h3>
        <p className="text-sm text-green-700">
          The JTBD framework helps understand why customers buy a product or
          service by focusing on the specific tasks they are trying to
          accomplish, considering functional, emotional, and social aspects.
        </p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-2">Question</h3>
        <p className="text-gray-700">{questionText}</p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h3 className="text-lg font-medium text-green-800">
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
