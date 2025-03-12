import { Card } from "./card";
import { CardProps } from "@/components/ui/card";

type FrameworkCardProps = CardProps & {
  framework?: string;
};

export function FrameworkCard({
  framework,
  children,
  ...props
}: FrameworkCardProps) {
  const bgColors = {
    circles: "from-blue-50 to-white border-blue-100",
    "design-thinking": "from-purple-50 to-white border-purple-100",
    jtbd: "from-green-50 to-white border-green-100",
    "user-centric": "from-orange-50 to-white border-orange-100",
    default: "from-gray-50 to-white border-gray-200",
  };

  const bgColor =
    bgColors[framework as keyof typeof bgColors] || bgColors.default;

  return (
    <Card
      className={`bg-gradient-to-br ${bgColor} rounded-xl shadow-lg`}
      {...props}
    >
      {children}
    </Card>
  );
}
