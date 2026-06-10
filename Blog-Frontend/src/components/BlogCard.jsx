import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Tag } from "./shared/Tag";
import { MarkdownView } from "./shared/MarkdownView";
import { cn } from "@/lib/utils";

const FALLBACK_IMG =
  import.meta.env.VITE_FALLBACK_IMAGE ||
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg";

const wordsToReadTime = (str = "") => {
  const words = (str || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
};

const BlogCard = ({
  id,
  title,
  excerpt,
  imageUrl,
  authorName,
  date,
  variant = "default",
}) => {
  const readTime = wordsToReadTime(excerpt);

  if (variant === "compact") {
    return (
      <Link
        to={`/blog/${id}`}
        className="group block no-underline border border-ink-faint bg-surface transition-all hover:border-ink hover:-translate-y-1"
      >
        <div className="aspect-[16/9] overflow-hidden border-b border-ink-faint relative">
          <img
            src={imageUrl || FALLBACK_IMG}
            alt={title || "Blog image"}
            className="w-full h-full object-cover opacity-85 transition-all duration-500 ease-brutal group-hover:opacity-100 group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG;
            }}
            loading="lazy"
          />
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-ink-subtle">
            {date && <span>{date}</span>}
            <span className="inline-block w-1 h-1 bg-ink-faint" />
            <span>{readTime}</span>
          </div>
          <h3 className="text-lg md:text-xl font-heading font-bold text-ink tracking-tight leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {title || "Untitled"}
          </h3>
          {excerpt && (
            <p className="text-sm text-ink-muted leading-relaxed line-clamp-2">
              {excerpt
                .replace(/[#*`>_~\[\]]/g, "")
                .replace(/\s+/g, " ")
                .trim()}
            </p>
          )}
          {authorName && (
            <div className="flex items-center gap-2 pt-1 border-t border-ink-faint/60 mt-1 text-xs text-ink-subtle">
              <span className="w-1.5 h-1.5 bg-accent" />
              <span>{authorName}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <article className="group">
      <Link
        to={`/blog/${id}`}
        className={cn(
          "block no-underline border border-ink-faint bg-surface overflow-hidden",
          "transition-all duration-300 ease-brutal",
          "hover:border-ink hover:-translate-y-1 hover:shadow-sharp-sm"
        )}
      >
        <div className="grid grid-cols-12">
          {/* Image */}
          <div className="col-span-12 md:col-span-7 relative">
            <div className="aspect-[16/9] md:aspect-[5/3] overflow-hidden">
              <img
                src={imageUrl || FALLBACK_IMG}
                alt={title || "Blog image"}
                className="w-full h-full object-cover opacity-80 transition-all duration-700 ease-brutal group-hover:opacity-100 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMG;
                }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Content */}
          <div className="col-span-12 md:col-span-5 p-6 md:p-8 flex flex-col bg-bg border-t md:border-t-0 md:border-l border-ink-faint">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Tag>Article</Tag>
              <div className="flex items-center gap-1.5 micro-text text-ink-subtle">
                <Clock size={12} />
                {readTime}
              </div>
            </div>

            <h2 className="text-2xl md:text-[1.625rem] font-heading font-bold tracking-tight mb-3 leading-tight text-ink group-hover:text-accent transition-colors line-clamp-3">
              {title || "Untitled"}
            </h2>

            {excerpt && (
              <MarkdownView
                content={excerpt}
                variant="excerpt"
                className="mb-6 flex-1 line-clamp-3"
              />
            )}

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-ink-faint mt-auto">
              {authorName && (
                <span className="micro-text text-ink-subtle truncate">
                  {authorName}
                </span>
              )}
              {date && (
                <span className="micro-text text-ink-subtle whitespace-nowrap">
                  {date}
                </span>
              )}
            </div>

            <div className="mt-5 micro-text text-accent flex items-center gap-2 group-hover:gap-3 transition-all">
              Read article
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;
