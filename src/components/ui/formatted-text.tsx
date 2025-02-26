import React from "react";

interface FormattedTextProps {
  text: string;
}

export function FormattedText({ text }: FormattedTextProps) {
  const formatText = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (
        line.startsWith("Situation") ||
        line.startsWith("Task") ||
        line.startsWith("Action") ||
        line.startsWith("Result")
      ) {
        return (
          <div key={i} className="font-bold">
            {line}
          </div>
        );
      }
      return <div key={i}>{line}</div>;
    });
  };

  return <div className="whitespace-pre-wrap">{formatText(text)}</div>;
}
