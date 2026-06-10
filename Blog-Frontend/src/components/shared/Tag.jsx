import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-ink-faint text-ink-muted bg-surface",
  accent: "border-accent text-accent bg-accent/5",
  outline: "border-ink text-ink bg-transparent",
  solid: "border-transparent text-bg bg-accent",
};

export const Tag = ({
  children,
  variant = "default",
  className,
  as: As = "span",
  ...props
}) => (
  <As
    className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em]",
      "border whitespace-nowrap leading-none",
      variants[variant],
      className
    )}
    {...props}
  >
    {children}
  </As>
);

export default Tag;
