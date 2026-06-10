import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  accent:
    "bg-accent text-accent-ink border border-accent hover:bg-accent-hover hover:border-accent-hover " +
    "hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-accent",
  primary:
    "bg-ink text-bg border border-ink hover:bg-platinum hover:border-platinum " +
    "hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-ink",
  outline:
    "bg-transparent text-ink border border-ink hover:bg-ink hover:text-bg " +
    "focus-visible:ring-ink",
  subtle:
    "bg-surface text-ink border border-ink-faint hover:border-ink hover:bg-surface-2 " +
    "focus-visible:ring-ink",
  ghost:
    "bg-transparent text-ink border border-transparent hover:bg-surface-2 " +
    "focus-visible:ring-ink",
  danger:
    "bg-transparent text-danger border border-danger/60 hover:bg-danger hover:text-ink hover:border-danger " +
    "focus-visible:ring-danger",
  link:
    "bg-transparent text-accent border border-transparent underline underline-offset-4 " +
    "hover:text-ink p-0 h-auto focus-visible:ring-accent",
};

const sizes = {
  xs: "h-8 px-3 text-[11px]",
  sm: "h-10 px-4 text-xs",
  md: "h-12 px-6 text-xs",
  lg: "h-14 px-7 text-sm",
  xl: "h-16 px-8 text-sm",
  icon: "h-10 w-10 p-0",
};

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      type = "button",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap",
      "font-heading font-bold uppercase tracking-[0.1em]",
      "transition-all duration-200 ease-brutal",
      "disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0",
      "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      variants[variant] || variants.primary,
      sizes[size] || sizes.md,
      className
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ref,
        className: cn(baseClasses, children.props.className),
      });
    }

    return (
      <button ref={ref} type={type} className={baseClasses} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
