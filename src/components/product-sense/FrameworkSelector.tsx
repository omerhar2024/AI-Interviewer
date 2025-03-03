import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CirclesFramework } from "./frameworks/CirclesFramework";
import { DesignThinkingFramework } from "./frameworks/DesignThinkingFramework";
import { JTBDFramework } from "./frameworks/JTBDFramework";
import { UserCentricDesignFramework } from "./frameworks/UserCentricDesignFramework";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { analyzeResponse } from "@/lib/analyze";
import { Loader2, Send } from "lucide-react";
import { deepseek } from "@/lib/deepseek";

interface FrameworkSelectorProps {
  questionText: string;
  questionId: string;
  onSubmit: (framework: string, responses: Record<string, string>) => void;
}

export function FrameworkSelector({
  questionText,
  questionId,
  onSubmit,
}: FrameworkSelectorProps) {
  const [selectedFramework, setSelectedFramework] = useState("circles");
  const [responses, setResponses] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResponseChange = (
    framework: string,
    section: string,
    value: string,
  ) => {
    setResponses((prev) => ({
      ...prev,
      [framework]: {
        ...(prev[framework] || {}),
        [section]: value,
      },
    }));
  };

  const handleSaveNotes = () => {
    onSubmit(selectedFramework, responses[selectedFramework] || {});
  };

  const [progressPercent, setProgressPercent] = useState(0);

  const handlePerfectResponse = async () => {
    try {
      // Check if user has remaining perfect responses
      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user?.id)
          .single();

      if (subscriptionError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check subscription status. Please try again.",
        });
        return;
      }

      // If user has reached their limit
      if (
        subscriptionData.perfect_responses_used >=
        subscriptionData.perfect_response_limit
      ) {
        toast({
          variant: "destructive",
          title: "Limit Reached",
          description:
            subscriptionData.plan_type === "free"
              ? "You've reached your monthly limit of 5 perfect responses. Please upgrade to Premium for more."
              : "You've reached your monthly limit of perfect responses. Please try again next month.",
        });
        return;
      }

      setIsGenerating(true);
      setProgressPercent(0);

      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgressPercent((prev) => {
          // Gradually increase progress up to 95% (the last 5% will be completed when response is received)
          if (prev < 95) {
            return prev + 1;
          }
          return prev;
        });
      }, 630); // Update every 630ms to complete in ~60 seconds

      // Get framework-specific scoring criteria
      let scoringCriteria = "";
      switch (selectedFramework) {
        case "circles":
          scoringCriteria = `
            Comprehend: Clearly describe the current product situation and market context
            Identify: Specify target users with detailed demographics and characteristics
            Report: Articulate specific user needs and pain points with examples
            Cut: Prioritize needs with explicit reasoning and impact assessment
            List: Generate diverse solution options with clear descriptions
            Evaluate: Create a structured comparison of solutions considering costs, feasibility, and impact
            Summarize: Make a clear recommendation with supporting rationale and expected impact
          `;
          break;
        case "design-thinking":
          scoringCriteria = `
            Empathize: Demonstrate deep understanding of users with specific research methods
            Define: Create a user-centered problem statement that's specific and actionable
            Ideate: Generate numerous diverse solution ideas ranging from incremental to radical
            Prototype: Specify prototype form, fidelity, and creation process
            Test: Detail testing methodology, participant selection, metrics, and iteration plans
          `;
          break;
        case "jtbd":
          scoringCriteria = `
            Identify the Job: Clearly define the specific task users are trying to accomplish
            Current Solutions: Analyze existing solutions with specific examples and limitations
            Functional Requirements: List specific, measurable requirements that support the job
            Emotional and Social Needs: Explore both emotional needs and social aspects
            Proposed Solution: Describe solution in detail showing how it addresses requirements
            Validation: Specify concrete testing methods, metrics, and success criteria
          `;
          break;
        case "user-centric":
          scoringCriteria = `
            Understand Context: Include specific details about user interactions and environment
            Specify User Requirements: Clearly articulate specific user goals, needs, and pain points
            Design Solution: Describe solution in detail with connections to requirements
            Evaluate: Define specific success metrics and detailed feedback methods
          `;
          break;
      }

      // Generate a perfect response using DeepSeek with scoring criteria
      const prompt = `Generate an ABSOLUTELY PERFECT response to the following product sense question using the ${getFrameworkName(selectedFramework)} framework. Your goal is to achieve a PERFECT 10/10 score on EVERY component - nothing less is acceptable.\n\nQuestion: ${questionText}\n\nPlease structure your response according to the ${getFrameworkName(selectedFramework)} framework sections and provide extremely detailed, thoughtful content for each section.\n\nTo score a PERFECT 10/10 on each component, ensure your response includes these elements for each section:\n${scoringCriteria}\n\nABSOLUTELY CRITICAL FORMATTING INSTRUCTIONS:\n1. DO NOT use ANY markdown formatting - no #, *, **, |, or other special characters anywhere in your response\n2. Format each section with a simple section name followed by a colon, then your content (e.g. "Comprehend: Your detailed content here")\n3. Use plain text only with clear paragraph breaks between ideas\n4. For the Evaluate section or any comparisons, use this EXACT format with NO special characters:\n\nEvaluate: I've assessed the potential solutions based on key factors:\n\n1. [Solution Name]\n   Cost: [Low/Medium/High] - [Brief explanation]\n   Feasibility: [Low/Medium/High] - [Brief explanation]\n   Impact: [Low/Medium/High] - [Brief explanation]\n\n2. [Solution Name]\n   Cost: [Low/Medium/High] - [Brief explanation]\n   Feasibility: [Low/Medium/High] - [Brief explanation]\n   Impact: [Low/Medium/High] - [Brief explanation]\n\n5. Include SPECIFIC examples, data points, and concrete details throughout your response\n6. Your goal is to create a response that would score a PERFECT 10/10 on EVERY component\n7. Think deeply about each section and provide comprehensive, insightful analysis that demonstrates expert product management thinking\n8. IMPORTANT: After generating your response, review it carefully to remove ANY markdown or special characters that might have been included`;

      const result = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a WORLD-CLASS product manager with 15+ years of experience at top tech companies. You excel at answering product sense questions using various frameworks. Your responses are extremely detailed, specific, and include concrete examples, metrics, and data points. You ABSOLUTELY NEVER use markdown formatting or special characters like *, #, **, or | in your responses. You structure your responses with clear section headers followed by comprehensive content. You aim for perfection in every response, with nothing less than 9-10/10 scores acceptable. You carefully review your responses to ensure they contain no special characters and are formatted exactly as requested.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 3500,
      });

      // Get the response and clean it to ensure no markdown or special characters
      let aiResponse = result.choices[0].message.content;

      // Remove any potential markdown characters that might have slipped through
      aiResponse = aiResponse.replace(/[#*|`_~>]/g, "");
      aiResponse = aiResponse.replace(/\*\*/g, "");
      aiResponse = aiResponse.replace(/\n\s*\n\s*\n/g, "\n\n"); // Replace triple line breaks with double

      // Format section headers for better visual display
      // This formatting will be applied when displaying the response
      const sectionHeaders = {
        circles: [
          "Comprehend:",
          "Identify:",
          "Report:",
          "Cut:",
          "List:",
          "Evaluate:",
          "Summarize:",
        ],
        "design-thinking": [
          "Empathize:",
          "Define:",
          "Ideate:",
          "Prototype:",
          "Test:",
        ],
        jtbd: [
          "Identify the Job:",
          "Current Solutions:",
          "Functional Requirements:",
          "Emotional and Social Needs:",
          "Proposed Solution:",
          "Validation:",
        ],
        "user-centric": [
          "Understand Context:",
          "Specify User Requirements:",
          "Design Solution:",
          "Evaluate:",
        ],
      };

      // Get the appropriate headers based on the framework
      const headers = sectionHeaders[selectedFramework] || [];

      // Add HTML formatting for section headers
      let formattedResponse = aiResponse;
      headers.forEach((header) => {
        formattedResponse = formattedResponse.replace(
          new RegExp(`${header}`, "g"),
          `<strong>${header}</strong>`,
        );
      });

      // Improve formatting for numbered lists in the Evaluate section
      formattedResponse = formattedResponse.replace(
        /(\d+\.\s+)([^\n]+)/g,
        '<div class="mt-4 mb-2 font-semibold">$1$2</div>',
      );

      // Add proper indentation for evaluation criteria
      formattedResponse = formattedResponse.replace(
        /(Cost|Feasibility|Impact):\s+(Low|Medium|High)\s+-\s+([^\n]+)/g,
        '<div class="ml-6 mb-2"><span class="font-medium">$1:</span> <span class="font-semibold">$2</span> - $3</div>',
      );

      // Add spacing between paragraphs
      formattedResponse = formattedResponse.replace(
        /\n\n/g,
        '<div class="my-4"></div>',
      );

      // Create a response in the database with AI-generated flag and formatted response
      const { data: responseData, error: responseError } = await supabase
        .from("responses")
        .insert({
          user_id: user?.id,
          question_id: questionId,
          audio_url: "",
          transcript: aiResponse,
          notes: {
            framework: selectedFramework,
            is_ai_generated: true,
            formatted_response: formattedResponse,
          },
        })
        .select()
        .single();

      if (responseError) throw responseError;

      if (responseData) {
        // Analyze the AI-generated response
        const analysis = await analyzeResponse(
          aiResponse,
          questionText,
          selectedFramework,
        );
        const scoreMatch = analysis.match(/Overall Score: ([0-9.]+)\/10/);
        const overallScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

        // Store the feedback but don't count it toward usage
        const { error: feedbackError } = await supabase
          .from("feedback")
          .insert({
            response_id: responseData.id,
            text: analysis,
            score: overallScore,
            rating: null,
          });

        if (feedbackError) throw feedbackError;

        // Increment the perfect responses used counter
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            perfect_responses_used: subscriptionData.perfect_responses_used + 1,
          })
          .eq("user_id", user?.id);

        if (updateError) {
          console.error(
            "Failed to update perfect response usage:",
            updateError,
          );
        }

        // Navigate to the appropriate analysis page based on framework
        switch (selectedFramework) {
          case "circles":
            navigate(`/circles-analysis/${responseData.id}`);
            break;
          case "design-thinking":
            navigate(`/design-thinking-analysis/${responseData.id}`);
            break;
          case "jtbd":
            navigate(`/jtbd-analysis/${responseData.id}`);
            break;
          case "user-centric":
            navigate(`/user-centric-analysis/${responseData.id}`);
            break;
          default:
            navigate(`/product-sense-analysis/${responseData.id}`);
        }
      }
    } catch (error) {
      console.error("Error generating perfect response:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate a perfect response. Please try again.",
      });
    } finally {
      setProgressPercent(100); // Complete the progress bar
      setTimeout(() => {
        setIsGenerating(false);
        setProgressPercent(0);
      }, 500); // Reset after a short delay
    }
  };

  // Helper function to get framework name
  const getFrameworkName = (framework: string) => {
    switch (framework) {
      case "circles":
        return "CIRCLES";
      case "design-thinking":
        return "Design Thinking";
      case "jtbd":
        return "Jobs-To-Be-Done";
      case "user-centric":
        return "User-Centric Design";
      default:
        return "Product Framework";
    }
  };

  // Get framework-specific prompt for analysis
  const getPromptForFramework = (
    framework: string,
    combinedResponse: string,
    questionText: string,
  ) => {
    switch (framework) {
      case "circles":
        return `Analyze this CIRCLES framework response to the product question: "${questionText}"\n\nResponse:\n${combinedResponse}`;
      case "design-thinking":
        return `Analyze this Design Thinking framework response to the product question: "${questionText}"\n\nResponse:\n${combinedResponse}`;
      case "jtbd":
        return `Analyze this Jobs-To-Be-Done framework response to the product question: "${questionText}"\n\nResponse:\n${combinedResponse}`;
      case "user-centric":
        return `Analyze this User-Centric Design framework response to the product question: "${questionText}"\n\nResponse:\n${combinedResponse}`;
      default:
        return `Analyze this product framework response to the question: "${questionText}"\n\nResponse:\n${combinedResponse}`;
    }
  };

  const handleSubmitForAnalysis = async () => {
    // Get the current framework responses
    const frameworkResponses = responses[selectedFramework] || {};

    // Check if there are any responses
    if (Object.keys(frameworkResponses).length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in your responses before submitting",
      });
      return;
    }

    // Combine all responses into a single text for analysis
    const combinedResponse = Object.entries(frameworkResponses)
      .map(([section, text]) => `${section.toUpperCase()}: ${text}`)
      .join("\n\n");

    // Now analyze and submit the combined response
    try {
      setIsAnalyzing(true);

      // Use framework-specific prompt for better analysis
      const prompt = getPromptForFramework(
        selectedFramework,
        combinedResponse,
        questionText,
      );
      const analysis = await analyzeResponse(
        combinedResponse,
        questionText,
        selectedFramework,
      );

      // Extract overall score
      const scoreMatch = analysis.match(/Overall Score: ([0-9.]+)\/10/);
      const overallScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

      // Extract section-specific scores based on framework
      const sectionScores: Record<string, number> = {};

      if (selectedFramework === "circles") {
        // Extract CIRCLES framework scores
        const comprehendMatch = analysis.match(
          /Comprehend[^(]*\(([0-9.]+)\/10\)/,
        );
        const identifyMatch = analysis.match(/Identify[^(]*\(([0-9.]+)\/10\)/);
        const reportMatch = analysis.match(/Report[^(]*\(([0-9.]+)\/10\)/);
        const cutMatch = analysis.match(/Cut[^(]*\(([0-9.]+)\/10\)/);
        const listMatch = analysis.match(/List[^(]*\(([0-9.]+)\/10\)/);
        const evaluateMatch = analysis.match(/Evaluate[^(]*\(([0-9.]+)\/10\)/);
        const summarizeMatch = analysis.match(
          /Summarize[^(]*\(([0-9.]+)\/10\)/,
        );

        if (comprehendMatch)
          sectionScores.comprehend_score = parseFloat(comprehendMatch[1]);
        if (identifyMatch)
          sectionScores.identify_score = parseFloat(identifyMatch[1]);
        if (reportMatch)
          sectionScores.report_score = parseFloat(reportMatch[1]);
        if (cutMatch) sectionScores.cut_score = parseFloat(cutMatch[1]);
        if (listMatch) sectionScores.list_score = parseFloat(listMatch[1]);
        if (evaluateMatch)
          sectionScores.evaluate_score = parseFloat(evaluateMatch[1]);
        if (summarizeMatch)
          sectionScores.summarize_score = parseFloat(summarizeMatch[1]);
      } else if (selectedFramework === "design-thinking") {
        // Extract Design Thinking framework scores
        const empathizeMatch = analysis.match(
          /Empathize[^(]*\(([0-9.]+)\/10\)/,
        );
        const defineMatch = analysis.match(/Define[^(]*\(([0-9.]+)\/10\)/);
        const ideateMatch = analysis.match(/Ideate[^(]*\(([0-9.]+)\/10\)/);
        const prototypeMatch = analysis.match(
          /Prototype[^(]*\(([0-9.]+)\/10\)/,
        );
        const testMatch = analysis.match(/Test[^(]*\(([0-9.]+)\/10\)/);

        if (empathizeMatch)
          sectionScores.empathize_score = parseFloat(empathizeMatch[1]);
        if (defineMatch)
          sectionScores.define_score = parseFloat(defineMatch[1]);
        if (ideateMatch)
          sectionScores.ideate_score = parseFloat(ideateMatch[1]);
        if (prototypeMatch)
          sectionScores.prototype_score = parseFloat(prototypeMatch[1]);
        if (testMatch) sectionScores.test_score = parseFloat(testMatch[1]);
      } else if (selectedFramework === "jtbd") {
        // Extract JTBD framework scores
        const identifyJobMatch = analysis.match(
          /Identify the Job[^(]*\(([0-9.]+)\/10\)/,
        );
        const currentSolutionsMatch = analysis.match(
          /Current Solutions[^(]*\(([0-9.]+)\/10\)/,
        );
        const functionalRequirementsMatch = analysis.match(
          /Functional Requirements[^(]*\(([0-9.]+)\/10\)/,
        );
        const emotionalSocialMatch = analysis.match(
          /Emotional and Social[^(]*\(([0-9.]+)\/10\)/,
        );
        const proposedSolutionMatch = analysis.match(
          /Proposed Solution[^(]*\(([0-9.]+)\/10\)/,
        );
        const validationMatch = analysis.match(
          /Validation[^(]*\(([0-9.]+)\/10\)/,
        );

        if (identifyJobMatch)
          sectionScores.identify_job_score = parseFloat(identifyJobMatch[1]);
        if (currentSolutionsMatch)
          sectionScores.current_solutions_score = parseFloat(
            currentSolutionsMatch[1],
          );
        if (functionalRequirementsMatch)
          sectionScores.functional_requirements_score = parseFloat(
            functionalRequirementsMatch[1],
          );
        if (emotionalSocialMatch)
          sectionScores.emotional_social_score = parseFloat(
            emotionalSocialMatch[1],
          );
        if (proposedSolutionMatch)
          sectionScores.proposed_solution_score = parseFloat(
            proposedSolutionMatch[1],
          );
        if (validationMatch)
          sectionScores.validation_score = parseFloat(validationMatch[1]);
      } else if (selectedFramework === "user-centric") {
        // Extract User-Centric Design framework scores
        const contextMatch = analysis.match(
          /Understand Context[^(]*\(([0-9.]+)\/10\)/,
        );
        const requirementsMatch = analysis.match(
          /Specify[^(]*Requirements[^(]*\(([0-9.]+)\/10\)/,
        );
        const designMatch = analysis.match(
          /Design Solution[^(]*\(([0-9.]+)\/10\)/,
        );
        const evaluateMatch = analysis.match(/Evaluate[^(]*\(([0-9.]+)\/10\)/);

        if (contextMatch)
          sectionScores.context_score = parseFloat(contextMatch[1]);
        if (requirementsMatch)
          sectionScores.requirements_score = parseFloat(requirementsMatch[1]);
        if (designMatch)
          sectionScores.design_score = parseFloat(designMatch[1]);
        if (evaluateMatch)
          sectionScores.evaluate_score = parseFloat(evaluateMatch[1]);
      }

      const { data: responseData, error: responseError } = await supabase
        .from("responses")
        .insert({
          user_id: user?.id,
          question_id: questionId,
          audio_url: "",
          transcript: combinedResponse,
          notes: { framework: selectedFramework, ...frameworkResponses },
        })
        .select()
        .single();

      if (responseError) throw responseError;

      if (responseData) {
        const { error: feedbackError } = await supabase
          .from("feedback")
          .insert({
            response_id: responseData.id,
            text: analysis,
            score: overallScore,
            rating: null,
            // Add section scores to the feedback
            ...sectionScores,
          });

        if (feedbackError) throw feedbackError;

        // Update usage stats
        if (user) {
          try {
            await supabase.rpc("increment_usage_count", { p_user_id: user.id });
          } catch (err) {
            console.error("Failed to update usage stats:", err);
          }
        }

        // Navigate to the appropriate analysis page
        switch (selectedFramework) {
          case "circles":
            navigate(`/circles-analysis/${responseData.id}`);
            break;
          case "design-thinking":
            navigate(`/design-thinking-analysis/${responseData.id}`);
            break;
          case "jtbd":
            navigate(`/jtbd-analysis/${responseData.id}`);
            break;
          case "user-centric":
            navigate(`/user-centric-analysis/${responseData.id}`);
            break;
          default:
            navigate(`/product-sense-analysis/${responseData.id}`);
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze response. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">
          Select a Framework
        </h2>
        <Tabs
          defaultValue="circles"
          value={selectedFramework}
          onValueChange={setSelectedFramework}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="circles">CIRCLES</TabsTrigger>
            <TabsTrigger value="design-thinking">Design Thinking</TabsTrigger>
            <TabsTrigger value="jtbd">Jobs-To-Be-Done</TabsTrigger>
            <TabsTrigger value="user-centric">User-Centric Design</TabsTrigger>
          </TabsList>

          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <TabsContent value="circles">
              <CirclesFramework
                questionText={questionText}
                responses={responses.circles || {}}
                onChange={(section, value) =>
                  handleResponseChange("circles", section, value)
                }
              />
            </TabsContent>

            <TabsContent value="design-thinking">
              <DesignThinkingFramework
                questionText={questionText}
                responses={responses["design-thinking"] || {}}
                onChange={(section, value) =>
                  handleResponseChange("design-thinking", section, value)
                }
              />
            </TabsContent>

            <TabsContent value="jtbd">
              <JTBDFramework
                questionText={questionText}
                responses={responses.jtbd || {}}
                onChange={(section, value) =>
                  handleResponseChange("jtbd", section, value)
                }
              />
            </TabsContent>

            <TabsContent value="user-centric">
              <UserCentricDesignFramework
                questionText={questionText}
                responses={responses["user-centric"] || {}}
                onChange={(section, value) =>
                  handleResponseChange("user-centric", section, value)
                }
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={handleSaveNotes}
          className="px-6 py-3 bg-white border border-blue-200 text-blue-600 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        >
          Save Notes
        </button>

        <div className="relative">
          <button
            onClick={handlePerfectResponse}
            disabled={isAnalyzing || isGenerating}
            className="px-6 py-3 bg-white border border-purple-200 text-purple-600 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Perfect Response
              </>
            ) : (
              "Perfect Response"
            )}
          </button>

          {isGenerating && (
            <div className="absolute left-0 bottom-0 w-full h-1 bg-gray-200 rounded-b-lg overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmitForAnalysis}
          disabled={isAnalyzing}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Submit Response
            </>
          )}
        </button>
      </div>
    </div>
  );
}
