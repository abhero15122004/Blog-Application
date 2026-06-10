import React from "react";
import { cn } from "@/lib/utils";

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
}) => {
  const accent = variant === "accent";
  const danger = variant === "danger";
  return (
    <div
      className={cn(
        "border border-ink-faint bg-surface px-6 py-14 text-center",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "mx-auto mb-6 w-14 h-14 border flex items-center justify-center",
            accent && "border-accent text-accent bg-accent/5",
            danger && "border-danger text-danger bg-danger/5",
            !accent && !danger && "border-ink-faint text-ink-subtle"
          )}
        >
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="text-xl md:text-2xl font-heading font-bold text-ink mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-ink-muted max-w-md mx-auto mb-6 text-balance">
          {description}
        </p>
      )}
      {action && <div className="mt-2 inline-flex">{action}</div>}
    </div>
  );
};

export default EmptyState;
