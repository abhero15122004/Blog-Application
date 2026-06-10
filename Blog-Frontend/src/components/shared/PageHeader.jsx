import React from "react";
import { cn } from "@/lib/utils";

export const PageHeader = ({
  eyebrow,
  title,
  description,
  action,
  className,
  align = "left",
}) => {
  const isCenter = align === "center";
  return (
    <div
      className={cn(
        "mb-12 md:mb-16",
        isCenter && "text-center",
        className
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "flex items-center gap-3 micro-text text-accent mb-5",
            isCenter && "justify-center"
          )}
        >
          <span className="inline-block w-8 h-px bg-accent" />
          {eyebrow}
          <span className="inline-block w-8 h-px bg-accent" />
        </div>
      )}
      <div
        className={cn(
          "flex flex-col gap-6",
          !isCenter && "md:flex-row md:items-end md:justify-between"
        )}
      >
        <div className={cn("max-w-3xl", isCenter && "mx-auto")}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-ink text-balance">
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                "mt-5 text-lg text-ink-muted text-balance",
                isCenter && "mx-auto"
              )}
            >
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className={cn("shrink-0", isCenter && "mx-auto")}>{action}</div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
