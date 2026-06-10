/**
 * Convert a Date/ISO-string/number into a short relative phrase.
 * "just now", "5 minutes ago", "3 hours ago", "2 days ago", or — for
 * anything older than a week — falls back to an absolute "May 12".
 */
export const relativeTime = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  const now = Date.now();
  const diffMs = now - date.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(diffMs / 60_000);
  const hr = Math.round(diffMs / 3_600_000);
  const day = Math.round(diffMs / 86_400_000);

  if (sec < 30) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return min === 1 ? "1 min ago" : `${min} mins ago`;
  if (hr < 24) return hr === 1 ? "1 hour ago" : `${hr} hours ago`;
  if (day === 1) return "yesterday";
  if (day < 7) return `${day} days ago`;

  // Older than a week → absolute date
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
};

/** ISO timestamp suitable for the <time dateTime="..."> attribute */
export const isoDate = (value) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? "" : d.toISOString();
};

export default relativeTime;
