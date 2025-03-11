import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare } from "lucide-react";

export default function PracticeCategoriesPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full p-6 mx-auto max-w-7xl">
      <h1 className="text-4xl font-bold mb-8">Select a Category</h1>
      <p className="text-muted-foreground mb-8">
        Choose a question category to practice your PM interview skills.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 hover:border-blue-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-medium flex items-center text-blue-800">
              <div className="p-2 rounded-full bg-blue-100 mr-3">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              Product Sense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test your product strategy and decision-making skills with
              real-world scenarios
            </p>
            <Button
              onClick={() => navigate("/practice?type=product_sense")}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white text-base font-medium py-3 rounded-lg"
            >
              Practice Product Sense
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 hover:border-blue-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-medium flex items-center text-blue-800">
              <div className="p-2 rounded-full bg-blue-100 mr-3">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              Behavioral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Practice answering common behavioral interview questions with STAR
              methodology
            </p>
            <Button
              onClick={() => navigate("/practice?type=behavioral")}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white text-base font-medium py-3 rounded-lg"
            >
              Practice Behavioral
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
