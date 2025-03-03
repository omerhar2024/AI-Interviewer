interface FormattedTextHtmlProps {
  html: string;
}

export function FormattedTextHtml({ html }: FormattedTextHtmlProps) {
  if (!html) return null;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
