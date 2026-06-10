import React from "react";

export const BlogCardSkeleton = () => (
  <article className="border border-ink-faint bg-surface overflow-hidden">
    <div className="aspect-[16/9] skeleton-shimmer" />
    <div className="p-6 grid gap-3">
      <div className="h-3 w-24 skeleton-shimmer" />
      <div className="h-7 w-full skeleton-shimmer" />
      <div className="h-7 w-2/3 skeleton-shimmer" />
      <div className="h-4 w-full skeleton-shimmer mt-2" />
      <div className="h-4 w-4/5 skeleton-shimmer" />
    </div>
  </article>
);

export default BlogCardSkeleton;
