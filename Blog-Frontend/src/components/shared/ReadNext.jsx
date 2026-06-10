import React, { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import BlogCard from "../BlogCard";
import { useBlogs } from "@/hooks/useBlogs";

const FALLBACK_IMG =
  import.meta.env.VITE_FALLBACK_IMAGE ||
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg";

const formatBlog = (blog) => ({
  id: blog.id,
  title: blog.title,
  excerpt:
    blog.content && blog.content.length > 200
      ? blog.content.substring(0, 200).trim() + "…"
      : blog.content || "",
  imageUrl: blog.image
    ? `data:image/jpeg;base64,${blog.image}`
    : FALLBACK_IMG,
  authorName:
    blog.author?.name ||
    (blog.authorEmail ? blog.authorEmail.split("@")[0] : "Unknown"),
  authorEmail: blog.authorEmail,
  date: blog.createdAt
    ? new Date(blog.createdAt)
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    : "",
});

/**
 * Strip of 3 other recent posts shown at the bottom of a single-post page.
 * Prefers other posts by the same author; falls back to most-recent.
 * Pulls from the shared useBlogs cache so it doesn't trigger a new fetch.
 */
export const ReadNext = ({ currentId, authorEmail }) => {
  const { blogs, loading } = useBlogs();

  const items = useMemo(() => {
    if (!blogs || blogs.length === 0) return [];
    const others = blogs.filter((b) => b.id !== currentId);
    const sameAuthor = authorEmail
      ? others.filter((b) => b.authorEmail === authorEmail)
      : [];
    const rest = others.filter((b) => !sameAuthor.includes(b));
    return [...sameAuthor, ...rest].slice(0, 3).map(formatBlog);
  }, [blogs, currentId, authorEmail]);

  if (loading && items.length === 0) return null;
  if (items.length === 0) return null;

  return (
    <section
      aria-label="Read next"
      className="mt-20 pt-12 border-t border-ink-faint"
    >
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="micro-text text-accent mb-2 flex items-center gap-2">
            <span className="inline-block w-6 h-px bg-accent" />
            Read next
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-ink tracking-tight">
            Keep going<span className="text-accent">.</span>
          </h2>
        </div>
        <Link
          to="/blogs"
          className="micro-text text-ink-muted hover:text-accent transition-colors flex items-center gap-2"
        >
          All posts
          <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((blog) => (
          <BlogCard key={blog.id} {...blog} variant="compact" />
        ))}
      </div>
    </section>
  );
};

export default ReadNext;
