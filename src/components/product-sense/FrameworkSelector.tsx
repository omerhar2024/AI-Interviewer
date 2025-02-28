import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CirclesFramework } from "./frameworks/CirclesFramework";
import { DesignThinkingFramework } from "./frameworks/DesignThinkingFramework";
import { JTBDFramework } from "./frameworks/JTBDFramework";
import { UserCentricDesignFramework } from "./frameworks/UserCentricDesignFramework";
import { RecordingButton } from "./RecordingButton";

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

  const handleSubmit = () => {
    onSubmit(selectedFramework, responses[selectedFramework] || {});
  };

  return (
    <div className="space-y-6 relative">
      {/* Recording button component - moved to the top */}
      <RecordingButton
        questionId={questionId}
        questionText={questionText}
        framework={selectedFramework}
      />

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

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          Save Framework Notes
        </button>
      </div>
    </div>
  );
}
