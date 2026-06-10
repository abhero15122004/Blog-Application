import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "./shared/Tag";
import { MarkdownView } from "./shared/MarkdownView";

const FALLBACK_IMG =
  import.meta.env.VITE_FALLBACK_IMAGE ||
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg";

const FeaturedBlog = ({ id, title, excerpt, imageUrl, authorName, date }) => {
  return (
    <div className="group relative">
      <div className="absolute -inset-px bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="relative grid grid-cols-12 border border-ink-faint bg-surface overflow-hidden">
        {/* Image side — fixed cinematic aspect, never stretches */}
        <div className="col-span-12 lg:col-span-7 relative overflow-hidden">
          <div className="aspect-[16/9]">
            <img
              src={imageUrl || FALLBACK_IMG}
              alt={title || "Featured"}
              className="w-full h-full object-cover transition-transform duration-700 ease-brutal group-hover:scale-[1.03]"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_IMG;
              }}
              loading="eager"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent pointer-events-none" />
          <div className="absolute top-5 left-5">
            <Tag variant="solid">Featured</Tag>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
            <div className="flex items-center gap-3 mb-3 flex-wrap micro-text text-ink-muted">
              {date && <span>{date}</span>}
              {authorName && (
                <>
                  <span className="inline-block w-1 h-1 bg-ink-faint" />
                  <span>{authorName}</span>
                </>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight text-ink leading-[1.1] text-balance line-clamp-3">
              {title || "Untitled"}
            </h2>
          </div>
        </div>

        {/* Side panel — centered, doesn't force image to stretch */}
        <div className="col-span-12 lg:col-span-5 p-6 md:p-8 bg-bg flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-ink-faint">
          <div className="flex items-center gap-3 micro-text text-accent mb-5">
            <span className="inline-block w-6 h-px bg-accent" />
            Editor's pick
          </div>

          {excerpt && (
            <MarkdownView
              content={excerpt}
              variant="excerpt"
              className="mb-6 line-clamp-4"
            />
          )}

          <div className="flex items-center gap-2 mb-6 micro-text text-ink-subtle">
            <Clock size={12} />
            Quick read
          </div>

          <Button asChild variant="accent" size="lg" className="w-full">
            <Link to={`/blog/${id}`}>
              Read article
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedBlog;
