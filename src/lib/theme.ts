export const theme = {
  colors: {
    primary: {
      main: "#2563eb", // Blue
      light: "#60a5fa",
      dark: "#1d4ed8",
    },
    secondary: {
      main: "#f97316", // Orange
      light: "#fb923c",
      dark: "#ea580c",
    },
    success: {
      main: "#22c55e", // Green
      light: "#4ade80",
      dark: "#16a34a",
    },
    background: {
      default: "#ffffff",
      paper: "#f8fafc",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
  },
  transitions: {
    button: "all 0.2s ease-in-out",
    fade: "opacity 0.2s ease-in-out",
  },
} as const;

export type Theme = typeof theme;
