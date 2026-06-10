import React from "react";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formatRelative = (savedAt) => {
  if (!savedAt) return "earlier";
  const diff = Date.now() - savedAt;
  const min = Math.round(diff / 60000);
  if (min < 1) return "moments ago";
  if (min === 1) return "1 minute ago";
  if (min < 60) return `${min} minutes ago`;
  const hr = Math.round(min / 60);
  if (hr === 1) return "1 hour ago";
  if (hr < 24) return `${hr} hours ago`;
  const day = Math.round(hr / 24);
  return day === 1 ? "1 day ago" : `${day} days ago`;
};

export const StaleBanner = ({
  savedAt,
  onRetry,
  retrying = false,
  className,
}) => (
  <div
    role="status"
    className={cn(
      "border border-accent/40 bg-accent/[0.04]",
      "p-4 sm:px-5 sm:py-4",
      "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4",
      className
    )}
  >
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <div className="shrink-0 w-8 h-8 border border-accent text-accent flex items-center justify-center">
        <AlertTriangle size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink font-medium">
          Showing previously-loaded posts
        </p>
        <p className="text-xs text-ink-subtle mt-0.5">
          Couldn't reach the server. Cached {formatRelative(savedAt)}.
        </p>
      </div>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        disabled={retrying}
        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-accent text-accent bg-bg hover:bg-accent hover:text-accent-ink transition-colors micro-text disabled:opacity-60 disabled:cursor-wait"
      >
        {retrying ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Retrying…
          </>
        ) : (
          <>
            <RefreshCw size={12} />
            Try again
          </>
        )}
      </button>
    )}
  </div>
);

export default StaleBanner;
