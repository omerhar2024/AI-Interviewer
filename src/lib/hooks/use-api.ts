import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export function useApiMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TError, TVariables, TContext> = {},
) {
  const { toast } = useToast();

  const defaultOptions: UseMutationOptions<
    TData,
    TError,
    TVariables,
    TContext
  > = {
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again.",
      });
    },
    ...options,
  };

  return useMutation({
    mutationFn,
    ...defaultOptions,
  });
}
