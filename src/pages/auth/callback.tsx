import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;

        // If we have a user, go to dashboard
        if (user) {
          navigate("/dashboard");
        } else {
          // If no user yet, wait a bit and check again
          setTimeout(() => {
            if (user) {
              navigate("/dashboard");
            } else {
              toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "Please try signing up again.",
              });
              navigate("/signup");
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Auth error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "Please try signing up again.",
        });
        navigate("/signup");
      }
    };

    handleCallback();
  }, [user, navigate, toast]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
