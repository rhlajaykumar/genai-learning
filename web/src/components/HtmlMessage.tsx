"use client";

import DOMPurify from "dompurify";

type HtmlMessageProps = {
  html: string;
  className?: string;
};

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "code",
  "pre",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "a",
  "span",
  "div",
  "hr",
];

export function HtmlMessage({ html, className }: HtmlMessageProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "title", "target", "rel", "class"],
  });

  return (
    <div
      className={className ? `chat-html ${className}` : "chat-html"}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
