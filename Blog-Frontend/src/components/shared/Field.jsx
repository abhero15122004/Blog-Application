import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const Field = ({
  id,
  label,
  hint,
  error,
  required,
  className,
  labelAction,
  children,
}) => (
  <div className={cn("grid gap-2", className)}>
    {(label || labelAction) && (
      <div className="flex items-center justify-between gap-3">
        {label && (
          <label
            htmlFor={id}
            className="micro-text text-ink-subtle"
          >
            {label}
            {required && <span className="text-accent ml-1">*</span>}
          </label>
        )}
        {labelAction}
      </div>
    )}
    {children}
    {hint && !error && (
      <p className="text-xs text-ink-subtle">{hint}</p>
    )}
    {error && (
      <p className="text-xs text-danger flex items-center gap-1.5">
        <span className="inline-block w-1 h-1 bg-danger rounded-full" />
        {error}
      </p>
    )}
  </div>
);

const inputClasses = cn(
  "w-full px-4 py-3.5 bg-surface text-ink",
  "border border-ink-faint",
  "outline-none transition-colors",
  "placeholder:text-ink-subtle",
  "focus:border-accent focus:bg-bg",
  "focus:shadow-[0_0_0_3px_var(--accent-glow)]",
  "disabled:opacity-50 disabled:cursor-not-allowed"
);

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClasses, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(inputClasses, "min-h-[140px] resize-vertical", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/**
 * Password input with an eye / eye-off toggle. Same API as <Input> except
 * type is fixed to "password" / "text".
 */
export const PasswordInput = React.forwardRef(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(inputClasses, "pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-center",
            "w-11 text-ink-subtle hover:text-accent transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          )}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export default Field;
