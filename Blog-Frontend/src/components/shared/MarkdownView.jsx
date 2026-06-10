import React, { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

export const MarkdownView = ({ content, variant = "article", className }) => {
  const html = useMemo(() => {
    if (!content) return "";
    try {
      return DOMPurify.sanitize(marked.parse(content));
    } catch {
      return DOMPurify.sanitize(content);
    }
  }, [content]);

  if (!html) return null;

  return (
    <div
      className={cn(
        variant === "article" ? "markdown-content" : "markdown-excerpt",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownView;
