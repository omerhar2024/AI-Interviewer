import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface AnalysisComponentProps {
  title: string;
  score: number;
  observed: string;
  missing: string;
  suggestions: string;
}

const AnalysisComponent: React.FC<AnalysisComponentProps> = ({
  title,
  score,
  observed,
  missing,
  suggestions,
}) => {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 6) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const scoreColorClass = getScoreColor(score);

  return (
    <div className="mb-6 border rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div
          className={`px-3 py-1 rounded-full font-medium ${scoreColorClass}`}
        >
          {score}/10
        </div>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <Progress
            value={score * 10}
            className={`h-2 ${score >= 8 ? "bg-green-100" : score >= 6 ? "bg-amber-100" : "bg-red-100"}`}
          />
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium flex items-center text-green-700 mb-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              What was observed
            </h4>
            <p className="text-sm text-gray-700 pl-5">{observed}</p>
          </div>

          {missing && (
            <div>
              <h4 className="text-sm font-medium flex items-center text-amber-700 mb-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                What could be improved
              </h4>
              <p className="text-sm text-gray-700 pl-5">{missing}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium flex items-center text-blue-700 mb-1">
              <ArrowRight className="h-4 w-4 mr-1" />
              Suggestions
            </h4>
            <p className="text-sm text-gray-700 pl-5">{suggestions}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AnalysisCardProps {
  analysisText: string;
  framework: string;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  analysisText,
  framework,
}) => {
  // Parse the analysis text to extract components and scores
  const parseAnalysisText = (text: string, framework: string) => {
    let components: AnalysisComponentProps[] = [];
    let overallScore = "0";
    let keyStrengths: string[] = [];
    let areasForImprovement: string[] = [];

    // Extract overall score
    const overallScoreMatch = text.match(/Overall Score: ([0-9.]+)\/10/);
    if (overallScoreMatch) {
      overallScore = overallScoreMatch[1];
    }

    // Extract key strengths
    const strengthsSection = text.match(
      /Key Strengths:[\s\S]*?(?=Areas for Improvement:|$)/,
    );
    if (strengthsSection) {
      const strengthLines = strengthsSection[0]
        .split("\n")
        .filter((line) => line.trim().startsWith("-"));
      keyStrengths = strengthLines.map((line) =>
        line.replace(/^-\s*/, "").trim(),
      );
    }

    // Extract areas for improvement
    const improvementSection = text.match(
      /Areas for Improvement:[\s\S]*?(?=$)/,
    );
    if (improvementSection) {
      const improvementLines = improvementSection[0]
        .split("\n")
        .filter((line) => line.trim().startsWith("-"));
      areasForImprovement = improvementLines
        .map((line) => line.replace(/^-\s*/, "").trim())
        .filter((line) => line);
    }

    // Define component titles based on framework
    let componentTitles: string[] = [];

    if (framework === "circles") {
      componentTitles = [
        "Comprehend the Situation",
        "Identify the Customer",
        "Report Customer Needs",
        "Cut Through Prioritization",
        "List Solutions",
        "Evaluate Trade-offs",
        "Summarize Recommendation",
      ];
    } else if (framework === "design-thinking") {
      componentTitles = ["Empathize", "Define", "Ideate", "Prototype", "Test"];
    } else if (framework === "jtbd") {
      componentTitles = [
        "Identify the Job",
        "Current Solutions",
        "Functional Requirements",
        "Emotional and Social Jobs",
        "Proposed Solution",
        "Validation Approach",
      ];
    } else if (framework === "user-centric") {
      componentTitles = [
        "Understand Context",
        "Specify User Requirements",
        "Design Solution",
        "Evaluate",
      ];
    } else {
      // Generic product framework
      componentTitles = [
        "Problem Understanding",
        "User Analysis",
        "Solution Design",
        "Implementation Plan",
        "Success Metrics",
      ];
    }

    // Extract component data
    componentTitles.forEach((title) => {
      const regex = new RegExp(
        `\\*\\*${title} \\(Score ([0-9]+)\/10\\):\\*\\*[\\s\\S]*?What was observed:[\\s]*(.*?)(?=What was missing|What could be improved|Specific suggestions)[\\s\\S]*?(What was missing[\\s]*:|What could be improved[\\s]*:)[\\s]*(.*?)(?=Specific suggestions|Improvement suggestions)[\\s\\S]*?(Specific suggestions for enhancement|Improvement suggestions):[\\s]*(.*?)(?=\\n\\n|$)`,
        "i",
      );

      const match = text.match(regex);

      if (match) {
        components.push({
          title,
          score: parseInt(match[1]),
          observed: match[2].trim(),
          missing: match[4].trim(),
          suggestions: match[6].trim(),
        });
      } else {
        // Fallback for components that don't match the exact pattern
        const simpleRegex = new RegExp(
          `\\*\\*${title} \\(Score ([0-9]+)\/10\\):\\*\\*[\\s\\S]*?(?=\\*\\*|$)`,
          "i",
        );
        const simpleMatch = text.match(simpleRegex);

        if (simpleMatch) {
          const content = simpleMatch[0];
          const scoreMatch = content.match(/Score ([0-9]+)\/10/);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

          components.push({
            title,
            score,
            observed: "Component details could not be parsed correctly.",
            missing: "",
            suggestions: "Please review the full analysis text for details.",
          });
        }
      }
    });

    return { components, overallScore, keyStrengths, areasForImprovement };
  };

  const { components, overallScore, keyStrengths, areasForImprovement } =
    parseAnalysisText(analysisText, framework);

  // Get framework display name
  const getFrameworkDisplayName = (framework: string) => {
    switch (framework) {
      case "circles":
        return "CIRCLES Framework";
      case "design-thinking":
        return "Design Thinking Framework";
      case "jtbd":
        return "Jobs-To-Be-Done Framework";
      case "user-centric":
        return "User-Centric Design Framework";
      default:
        return "Product Framework";
    }
  };

  // Determine overall score color
  const getOverallScoreColor = (score: number) => {
    if (score >= 8) return "text-green-700 bg-green-100";
    if (score >= 6) return "text-amber-700 bg-amber-100";
    return "text-red-700 bg-red-100";
  };

  return (
    <Card className="mb-8 border-t-4 border-t-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex justify-between items-center">
          <span>{getFrameworkDisplayName(framework)} Analysis</span>
          <span
            className={`px-4 py-1 rounded-full text-sm ${getOverallScoreColor(parseFloat(overallScore))}`}
          >
            Overall: {overallScore}/10
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="font-medium text-green-800 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Key Strengths
              </h3>
              <ul className="space-y-1">
                {keyStrengths.length > 0 ? (
                  keyStrengths.map((strength, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start"
                    >
                      <span className="text-green-500 mr-2">•</span>
                      <span>{strength}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-700">
                    No specific strengths highlighted.
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="font-medium text-amber-800 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Areas for Improvement
              </h3>
              <ul className="space-y-1">
                {areasForImprovement.length > 0 ? (
                  areasForImprovement.map((area, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start"
                    >
                      <span className="text-amber-500 mr-2">•</span>
                      <span>{area}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-700">
                    No specific improvement areas highlighted.
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium text-gray-800 mb-2">Component Scores</h3>
            <div className="flex flex-wrap gap-2">
              {components.map((component, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${component.score >= 8 ? "bg-green-100 text-green-800" : component.score >= 6 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}
                >
                  {component.title.split(" ")[0]}: {component.score}/10
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {components.map((component, index) => (
            <AnalysisComponent
              key={index}
              title={component.title}
              score={component.score}
              observed={component.observed}
              missing={component.missing}
              suggestions={component.suggestions}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
