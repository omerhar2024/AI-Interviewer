import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function FloatingActionButton() {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate("/practice")}
      className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 h-16 w-16 p-0 flex items-center justify-center z-50 animate-bounce-slow"
      size="icon"
    >
      <ArrowRight className="h-7 w-7" />
    </Button>
  );
}
