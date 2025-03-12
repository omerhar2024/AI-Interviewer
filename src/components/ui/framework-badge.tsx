import { getFrameworkColors, getFrameworkName } from "@/lib/framework-utils";

type FrameworkBadgeProps = {
  framework: string;
  className?: string;
};

export function FrameworkBadge({
  framework,
  className = "",
}: FrameworkBadgeProps) {
  const colors = getFrameworkColors(framework);
  const name = getFrameworkName(framework);

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} ${className}`}
    >
      {name}
    </span>
  );
}
