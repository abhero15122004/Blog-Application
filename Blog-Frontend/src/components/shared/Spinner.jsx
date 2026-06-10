import React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-[3px]",
  xl: "w-16 h-16 border-4",
};

export const Spinner = ({ size = "md", className }) => (
  <div
    role="status"
    aria-label="Loading"
    className={cn(
      sizes[size],
      "rounded-full animate-spin",
      "border-t-accent border-r-ink/30 border-b-ink/10 border-l-ink/60",
      className
    )}
  />
);

export const PageSpinner = ({ label }) => (
  <div className="pt-20 min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
    <Spinner size="xl" />
    {label && (
      <p className="micro-text text-ink-subtle">{label}</p>
    )}
  </div>
);

export default Spinner;
