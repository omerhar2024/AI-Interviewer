import React from "react";

interface FormattedTextProps {
  text: string;
}

export function FormattedText({ text }: FormattedTextProps) {
  if (!text) return null;

  // Convert newlines to <br> tags
  const formattedText = text.split("\n").map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < text.split("\n").length - 1 && <br />}
    </React.Fragment>
  ));

  return <div className="whitespace-pre-wrap">{formattedText}</div>;
}
