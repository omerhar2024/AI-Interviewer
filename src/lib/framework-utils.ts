export function getFrameworkColors(framework: string) {
  const colors = {
    circles: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-200",
      gradient: "from-blue-50 to-white",
    },
    "design-thinking": {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-200",
      gradient: "from-purple-50 to-white",
    },
    jtbd: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      gradient: "from-green-50 to-white",
    },
    "user-centric": {
      bg: "bg-orange-100",
      text: "text-orange-800",
      border: "border-orange-200",
      gradient: "from-orange-50 to-white",
    },
    star: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-200",
      gradient: "from-blue-50 to-white",
    },
    generic: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
      gradient: "from-gray-50 to-white",
    },
  };

  return colors[framework as keyof typeof colors] || colors.generic;
}

export function getFrameworkName(framework: string): string {
  const names: Record<string, string> = {
    circles: "CIRCLES",
    "design-thinking": "Design Thinking",
    jtbd: "Jobs-To-Be-Done",
    "user-centric": "User-Centric Design",
    star: "STAR",
    generic: "Product Framework",
  };

  return names[framework] || framework;
}
