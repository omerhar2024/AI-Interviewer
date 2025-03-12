import React from "react";

type LoadingSpinnerProps = {
  fullPage?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
};

export function LoadingSpinner({
  fullPage = false,
  size = "medium",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  const spinnerClass = sizeClasses[size] || sizeClasses.medium;

  const spinner = (
    <div
      className={`animate-spin rounded-full ${spinnerClass} border-b-2 border-primary ${className}`}
    ></div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-screen">{spinner}</div>
    );
  }

  return <div className="flex items-center justify-center py-8">{spinner}</div>;
}

type LoadingOverlayProps = {
  isLoading: boolean;
  children: React.ReactNode;
  spinnerSize?: "small" | "medium" | "large";
};

export function LoadingOverlay({
  isLoading,
  children,
  spinnerSize = "medium",
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}

      {isLoading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <LoadingSpinner size={spinnerSize} />
        </div>
      )}
    </div>
  );
}
