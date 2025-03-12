import { Progress } from "./progress";
import { ProgressProps } from "@radix-ui/react-progress";

type SafeProgressProps = ProgressProps & {
  value: number;
  max?: number;
  className?: string;
};

export function SafeProgress({
  value,
  max = 100,
  className = "",
  ...props
}: SafeProgressProps) {
  // Ensure value is between 0 and max
  const safeValue = Math.max(0, Math.min(value, max));
  const percentage = max === 0 ? 0 : (safeValue / max) * 100;

  return <Progress value={percentage} className={className} {...props} />;
}
