import { Button } from "./button";
import { ButtonProps } from "@/components/ui/button";

export function GradientButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
      {...props}
    >
      {children}
    </Button>
  );
}

type FrameworkButtonProps = ButtonProps & {
  framework?: string;
};

export function FrameworkButton({
  framework,
  children,
  ...props
}: FrameworkButtonProps) {
  // Framework-specific color schemes
  const colors = {
    circles: "from-blue-600 to-blue-400",
    "design-thinking": "from-purple-600 to-purple-400",
    jtbd: "from-green-600 to-green-400",
    "user-centric": "from-orange-600 to-orange-400",
    default: "from-blue-600 to-teal-500",
  };

  const gradientColors =
    colors[framework as keyof typeof colors] || colors.default;

  return (
    <Button
      className={`bg-gradient-to-r ${gradientColors} hover:opacity-90 text-white`}
      {...props}
    >
      {children}
    </Button>
  );
}
