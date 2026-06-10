import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Grid3x3,
  List,
  RefreshCw,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Section } from "@/components/shared/Section";
import { PageHeader } from "@/components/shared/PageHeader";
import { BlogCardSkeleton } from "@/components/shared/BlogCardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StaleBanner } from "@/components/shared/StaleBanner";
import { Button } from "@/components/ui/button";
import BlogCard from "@/components/BlogCard";
import { useBlogs } from "@/hooks/useBlogs";
import { useSearchHotkey } from "@/hooks/useSearchHotkey";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

const formatBlog = (blog) => ({
  id: blog.id,
  title: blog.title,
  excerpt:
    blog.content && blog.content.length > 240
      ? blog.content.substring(0, 240).trim() + "…"
      : blog.content || "",
  imageUrl: blog.image ? `data:image/jpeg;base64,${blog.image}` : null,
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

const AllBlogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState("grid"); // grid | list
  const searchInputRef = useRef(null);
  const { isMac } = useSearchHotkey(searchInputRef);

  const {
    blogs: rawBlogs,
    loading,
    error,
    isStale,
    savedAt,
    refetch,
    hasCachedFallback,
  } = useBlogs();

  const blogs = useMemo(() => rawBlogs.map(formatBlog), [rawBlogs]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return blogs;
    return blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.authorName.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q)
    );
  }, [blogs, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageBlogs = filtered.slice(start, start + PAGE_SIZE);

  const handlePageChange = (n) => {
    setCurrentPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showStale = isStale && hasCachedFallback;
  const showHardError = !loading && error && !hasCachedFallback;
  const showLoadingState = loading && blogs.length === 0;

  return (
    <div className="bg-bg min-h-screen pt-20">
      <Section>
        <Container>
          <PageHeader
            eyebrow="Archive"
            title={
              <>
                Every post on AIDEN
                <span className="text-accent">.</span>
              </>
            }
            description={`${blogs.length} ${blogs.length === 1 ? "story" : "stories"} written, sharpened, and shipped.`}
          />

          {/* Stale banner */}
          {showStale && (
            <StaleBanner
              savedAt={savedAt}
              onRetry={refetch}
              retrying={loading}
              className="mb-10"
            />
          )}

          {/* Toolbar */}
          {!showHardError && (
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-10">
              <div className="relative flex-1 max-w-xl">
                <Search
                  size={18}
                  className="absolute inset-y-0 left-4 my-auto text-ink-subtle"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by title, author, or content…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-24 py-3.5 bg-surface border border-ink-faint text-ink placeholder:text-ink-subtle outline-none transition-colors focus:border-accent focus:bg-bg"
                  aria-label="Search blogs"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-4 my-auto text-ink-subtle hover:text-ink"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <kbd className="hidden md:flex absolute inset-y-0 right-3 my-auto h-7 items-center gap-1 px-2 border border-ink-faint bg-bg text-[10px] uppercase tracking-[0.12em] text-ink-subtle font-mono pointer-events-none">
                    <span>{isMac ? "⌘" : "Ctrl"}</span>
                    <span>K</span>
                  </kbd>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="micro-text text-ink-subtle">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "result" : "results"}
                </div>
                <div className="flex border border-ink-faint">
                  <ViewToggle
                    active={view === "grid"}
                    onClick={() => setView("grid")}
                    icon={<Grid3x3 size={14} />}
                    label="Grid"
                  />
                  <ViewToggle
                    active={view === "list"}
                    onClick={() => setView("list")}
                    icon={<List size={14} />}
                    label="List"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {showLoadingState && (
            <div
              className={cn(
                view === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "grid gap-8"
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Hard error (nothing cached) */}
          {showHardError && (
            <EmptyState
              icon={X}
              variant="danger"
              title="Couldn't load posts"
              description="The blog service is unavailable. Please try again in a moment."
              action={
                <Button
                  onClick={refetch}
                  variant="accent"
                  size="lg"
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                  Try again
                </Button>
              }
            />
          )}

          {/* Empty */}
          {!showLoadingState && !showHardError && filtered.length === 0 && (
            <EmptyState
              icon={searchQuery ? Search : BookOpen}
              title={
                searchQuery
                  ? `No matches for "${searchQuery}"`
                  : "No posts yet"
              }
              description={
                searchQuery
                  ? "Try a different keyword or clear the search."
                  : "Once authors start publishing, you'll see their work here."
              }
              action={
                !searchQuery && (
                  <Button asChild variant="accent" size="lg">
                    <Link to="/write-blog">
                      <Sparkles size={16} />
                      Write the first one
                    </Link>
                  </Button>
                )
              }
            />
          )}

          {/* Content */}
          {!showLoadingState && !showHardError && filtered.length > 0 && (
            <>
              {view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {pageBlogs.map((blog) => (
                    <BlogCard key={blog.id} {...blog} variant="compact" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-8">
                  {pageBlogs.map((blog) => (
                    <BlogCard key={blog.id} {...blog} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  current={safePage}
                  total={totalPages}
                  onChange={handlePageChange}
                />
              )}
            </>
          )}
        </Container>
      </Section>
    </div>
  );
};

const ViewToggle = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-2 flex items-center gap-2 micro-text transition-colors",
      active
        ? "bg-accent text-accent-ink"
        : "bg-transparent text-ink-muted hover:text-ink"
    )}
    aria-label={`${label} view`}
    aria-pressed={active}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const Pagination = ({ current, total, onChange }) => {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <nav
      className="mt-14 flex flex-wrap items-center justify-center gap-2"
      aria-label="Pagination"
    >
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="flex items-center gap-1 px-3 py-2 border border-ink-faint micro-text text-ink-muted hover:text-ink hover:border-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft size={14} />
        Prev
      </button>
      <div className="flex gap-1.5">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === current ? "page" : undefined}
            className={cn(
              "w-10 h-10 micro-text border transition-colors",
              p === current
                ? "bg-accent text-accent-ink border-accent"
                : "bg-transparent text-ink-muted border-ink-faint hover:text-ink hover:border-ink"
            )}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="flex items-center gap-1 px-3 py-2 border border-ink-faint micro-text text-ink-muted hover:text-ink hover:border-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        Next
        <ChevronRight size={14} />
      </button>
    </nav>
  );
};

export default AllBlogs;
