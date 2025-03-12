import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.error("Query error:", error);
        // Display error toast if needed
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching data.",
        });
      },
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        console.error("Mutation error:", error);
        // Display error toast if needed
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while updating data.",
        });
      },
    },
  },
});
