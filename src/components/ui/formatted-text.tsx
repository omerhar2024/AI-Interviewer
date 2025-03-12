import React from "react";

interface FormattedTextProps {
  text: string;
  className?: string;
}

export function FormattedText({ text, className = "" }: FormattedTextProps) {
  if (!text) return null;

  // Process the text to handle various formatting
  const paragraphs = text.split("\n\n");

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => {
        // Handle bullet points and numbered lists
        if (
          paragraph.trim().startsWith("- ") ||
          paragraph.trim().startsWith("* ")
        ) {
          const listItems = paragraph
            .trim()
            .split("\n")
            .filter(
              (item) =>
                item.trim().startsWith("- ") || item.trim().startsWith("* "),
            );

          return (
            <ul key={index} className="list-disc pl-5 mb-4">
              {listItems.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {item.trim().replace(/^-\s+|\*\s+/, "")}
                </li>
              ))}
            </ul>
          );
        }

        // Handle numbered lists
        if (/^\d+\.\s/.test(paragraph.trim())) {
          const listItems = paragraph
            .trim()
            .split("\n")
            .filter((item) => /^\d+\.\s/.test(item.trim()));

          return (
            <ol key={index} className="list-decimal pl-5 mb-4">
              {listItems.map((item, itemIndex) => (
                <li key={itemIndex}>{item.trim().replace(/^\d+\.\s+/, "")}</li>
              ))}
            </ol>
          );
        }

        // Handle bold text
        const processedText = paragraph.replace(
          /\*\*(.*?)\*\*/g,
          "<strong>$1</strong>",
        );

        // Handle section titles that begin with **
        if (
          paragraph.trim().startsWith("**") &&
          paragraph.trim().endsWith("**")
        ) {
          return (
            <h3
              key={index}
              className="font-bold text-lg my-3"
              dangerouslySetInnerHTML={{ __html: processedText }}
            />
          );
        }

        return (
          <p
            key={index}
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: processedText }}
          />
        );
      })}
    </div>
  );
}
