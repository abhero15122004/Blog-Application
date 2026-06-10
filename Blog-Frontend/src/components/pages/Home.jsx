import React, { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, X, Sparkles, BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Hero from "@/components/Hero";
import BlogCard from "@/components/BlogCard";
import FeaturedBlog from "@/components/FeaturedBlog";
import { Container } from "@/components/shared/Container";
import { Section } from "@/components/shared/Section";
import { BlogCardSkeleton } from "@/components/shared/BlogCardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StaleBanner } from "@/components/shared/StaleBanner";
import { useBlogs } from "@/hooks/useBlogs";
import { useSearchHotkey } from "@/hooks/useSearchHotkey";

const FALLBACK_IMG =
  import.meta.env.VITE_FALLBACK_IMAGE ||
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg";

const formatBlog = (blog) => ({
  id: blog.id,
  title: blog.title,
  excerpt:
    blog.content && blog.content.length > 220
      ? blog.content.substring(0, 220).trim() + "…"
      : blog.content || "",
  imageUrl: blog.image
    ? `data:image/jpeg;base64,${blog.image}`
    : FALLBACK_IMG,
  authorName: blog.author?.name || (blog.authorEmail ? blog.authorEmail.split("@")[0] : "Unknown"),
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

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
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

  const allBlogs = useMemo(() => rawBlogs.map(formatBlog), [rawBlogs]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allBlogs;
    return allBlogs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.authorName.toLowerCase().includes(q)
    );
  }, [allBlogs, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const featuredBlog = !isSearching && allBlogs[0];
  const recentBlogs = useMemo(() => {
    if (isSearching) return filtered.slice(0, 9);
    return allBlogs.slice(1, 7);
  }, [allBlogs, filtered, isSearching]);

  const showStale = isStale && hasCachedFallback;
  // Show full-screen error only when there is NO data to display
  const showHardError = !loading && error && !hasCachedFallback;

  return (
    <div className="bg-bg">
      <Hero />

      <Section size="default">
        <Container>
          {/* Stale banner */}
          {showStale && (
            <div className="mb-10">
              <StaleBanner
                savedAt={savedAt}
                onRetry={refetch}
                retrying={loading}
              />
            </div>
          )}

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-ink-subtle">
                <Search size={18} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by title, author, or topic…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-24 py-4 bg-surface border border-ink-faint text-ink placeholder:text-ink-subtle outline-none transition-colors focus:border-accent focus:bg-bg"
                aria-label="Search blogs"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-ink-subtle hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              ) : (
                <kbd className="hidden md:flex absolute inset-y-0 right-4 my-auto h-7 items-center gap-1 px-2 border border-ink-faint bg-bg text-[10px] uppercase tracking-[0.12em] text-ink-subtle font-mono pointer-events-none">
                  <span>{isMac ? "⌘" : "Ctrl"}</span>
                  <span>K</span>
                </kbd>
              )}
            </div>
            {isSearching && (
              <p className="mt-3 text-sm text-ink-subtle">
                {filtered.length} result{filtered.length === 1 ? "" : "s"} for "
                <span className="text-ink">{searchQuery}</span>"
              </p>
            )}
          </div>

          {/* Loading — only show skeletons when we have nothing yet */}
          {loading && allBlogs.length === 0 && (
            <div className="grid gap-10">
              <div className="h-[420px] skeleton-shimmer" />
              <div className="grid md:grid-cols-2 gap-8">
                <BlogCardSkeleton />
                <BlogCardSkeleton />
              </div>
            </div>
          )}

          {/* Hard error (no cache to fall back on) */}
          {showHardError && (
            <EmptyState
              icon={X}
              variant="danger"
              title="Couldn't load blogs"
              description="The blog service didn't respond. Try again in a moment."
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

          {/* Featured */}
          {!showHardError && !isSearching && featuredBlog && (
            <>
              <SectionHead
                eyebrow="Featured"
                title="The latest, in depth."
              />
              <FeaturedBlog {...featuredBlog} />
            </>
          )}

          {/* Recent / Search results */}
          {!showHardError && (allBlogs.length > 0 || isSearching) && (
            <div className="mt-20">
              <SectionHead
                eyebrow={isSearching ? "Results" : "Latest"}
                title={isSearching ? "Matching posts" : "Recent posts"}
                action={
                  !isSearching && (
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/blogs">
                        See all
                        <ArrowRight size={14} />
                      </Link>
                    </Button>
                  )
                }
              />
              {recentBlogs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                  {recentBlogs.map((blog) => (
                    <BlogCard key={blog.id} {...blog} variant="compact" />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={isSearching ? Search : BookOpen}
                  title={
                    isSearching
                      ? `No matches for "${searchQuery}"`
                      : "No posts yet"
                  }
                  description={
                    isSearching
                      ? "Try a different search term."
                      : "Be the first to publish something here."
                  }
                  action={
                    !isSearching && (
                      <Button asChild variant="accent" size="lg">
                        <Link to="/write-blog">
                          <Sparkles size={16} />
                          Write the first post
                        </Link>
                      </Button>
                    )
                  }
                />
              )}
              {!isSearching && allBlogs.length > 0 && (
                <div className="mt-14 text-center">
                  <Button asChild variant="outline" size="lg">
                    <Link to="/blogs">
                      Explore all blogs
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
};

const SectionHead = ({ eyebrow, title, action }) => (
  <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
    <div>
      <div className="micro-text text-accent mb-3 flex items-center gap-2">
        <span className="inline-block w-6 h-px bg-accent" />
        {eyebrow}
      </div>
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-ink tracking-tight">
        {title}
      </h2>
    </div>
    {action}
  </div>
);

export default Home;
