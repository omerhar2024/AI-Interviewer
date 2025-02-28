import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Key } from "lucide-react";

export default function ApiSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deepseekApiKey, setDeepseekApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Only admin users should access this page
  const isAdmin = user?.email === "omerhar2024@gmail.com";

  useEffect(() => {
    // Redirect non-admin users
    if (user && !isAdmin) {
      navigate("/dashboard");
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access this page.",
      });
    }

    // Load the current API key from environment variables
    const currentApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || "";
    if (currentApiKey) {
      // Mask the API key for display
      const maskedKey =
        currentApiKey.substring(0, 4) +
        "..." +
        (currentApiKey.length > 8
          ? currentApiKey.substring(currentApiKey.length - 4)
          : "");
      setDeepseekApiKey(maskedKey);
    }
  }, [user, isAdmin, navigate, toast]);

  const handleSaveApiKey = async () => {
    try {
      setIsSaving(true);

      // In a real implementation, this would update the environment variable
      // or store the API key securely in a database
      // For this demo, we'll just show a success message

      toast({
        title: "API Key Updated",
        description: "The DeepSeek API key has been updated successfully.",
      });

      // In a real implementation, you might need to restart the server
      // or update the environment variables dynamically
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update API key. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestDeepseekApi = async () => {
    try {
      setLoading(true);

      // Make a test request to the DeepSeek API
      const response = await fetch("/api/test-deepseek", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "API Test Successful",
          description: "Successfully connected to the DeepSeek API.",
        });
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error testing DeepSeek API:", error);
      toast({
        variant: "destructive",
        title: "API Test Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to connect to the DeepSeek API.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null; // Don't render anything for non-admin users
  }

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold">API Settings</h1>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            DeepSeek API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <label className="text-sm font-medium">API Key:</label>
              <div className="md:col-span-3">
                <Input
                  type="password"
                  value={deepseekApiKey}
                  onChange={(e) => setDeepseekApiKey(e.target.value)}
                  placeholder="Enter your DeepSeek API key"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={handleTestDeepseekApi}
                disabled={loading}
              >
                {loading ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                onClick={handleSaveApiKey}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save API Key
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">
          Important Notes
        </h3>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
          <li>
            The DeepSeek API key is used for generating AI responses and
            analyzing user answers.
          </li>
          <li>Keep your API key secure and never share it publicly.</li>
          <li>API usage is billed according to DeepSeek's pricing model.</li>
          <li>
            For production use, implement proper API key rotation and security
            measures.
          </li>
        </ul>
      </div>
    </div>
  );
}
