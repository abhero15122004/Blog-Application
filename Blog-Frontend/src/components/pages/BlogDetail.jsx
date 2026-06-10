import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Linkedin,
  Twitter,
  Github,
  Copy,
  Check,
  Sparkles,
  Send,
  Clock,
  Calendar,
  Bell,
  BellOff,
  Share2,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { PageSpinner } from "@/components/shared/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tag } from "@/components/shared/Tag";
import { MarkdownView } from "@/components/shared/MarkdownView";
import { ReadingProgress } from "@/components/shared/ReadingProgress";
import { ReadNext } from "@/components/shared/ReadNext";
import CommentSection from "../CommentSection";
import apiFetch from "../utils/api";

// AI calls go through Netlify Functions so the API key stays server-side.
// Provider behind the proxy: Groq (Llama 3.1 8B by default) — sub-second
// responses, no cold starts.
const SUMMARIZE_ENDPOINT = "/.netlify/functions/summarize";
const QA_ENDPOINT = "/.netlify/functions/qa";

// Groq is almost always instant; only retry on transient gateway errors.
const RETRY_MAX_ATTEMPTS = 2;
const RETRY_WAIT_MS = 1500;
// Statuses we will retry on. Groq doesn't cold-start, so this is purely
// for ephemeral network hiccups / gateway flakes.
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

/**
 * Call an AI proxy endpoint. Retries only on transient gateway errors.
 * Reports progress via onProgress so the UI can show a "retrying" hint.
 *
 * Returns the final fetch Response (caller handles ok / !ok / status codes).
 */
const callAIWithRetry = async (endpoint, body, { onProgress, signal } = {}) => {
  let lastResponse = null;
  for (let attempt = 1; attempt <= RETRY_MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    onProgress?.({
      attempt,
      max: RETRY_MAX_ATTEMPTS,
      phase: "requesting",
    });
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    lastResponse = response;

    if (!RETRYABLE_STATUSES.has(response.status)) {
      onProgress?.({ attempt, max: RETRY_MAX_ATTEMPTS, phase: "done" });
      return response;
    }
    if (attempt === RETRY_MAX_ATTEMPTS) break;
    onProgress?.({
      attempt,
      max: RETRY_MAX_ATTEMPTS,
      phase: "retrying",
      waitMs: RETRY_WAIT_MS,
    });
    await new Promise((r) => setTimeout(r, RETRY_WAIT_MS));
  }
  return lastResponse;
};

const readingTime = (text = "") => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const formatDate = (date) => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const articleRef = useRef(null);
  const aiPanelRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [blog, setBlog] = useState(null);
  const [author, setAuthor] = useState(null);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [copied, setCopied] = useState(false);
  // { attempt, max, phase: "requesting" | "retrying" | "done", waitMs? } | null
  const [aiProgress, setAiProgress] = useState(null);

  /* ---- Fetch blog ---- */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const blogResponse = await apiFetch(`/api/blogs/${id}`);
        if (!blogResponse.ok) {
          if (blogResponse.status === 401) {
            localStorage.setItem("redirectAfterLogin", `/blog/${id}`);
            navigate("/login");
            return;
          }
          throw new Error("Failed to fetch blog");
        }
        const data = await blogResponse.json();
        if (!active) return;

        setBlog({
          id: data.id,
          title: data.title,
          content: data.content,
          codeSnippet: data.codeSnippet
            ? {
                language: data.codeLanguage || "javascript",
                content: data.codeSnippet,
              }
            : null,
          imageUrl: data.image ? `data:image/jpeg;base64,${data.image}` : null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        setAuthor({
          email: data.authorEmail,
          name: data.author?.name,
          photo: data.author?.photo
            ? `data:image/jpeg;base64,${data.author.photo}`
            : null,
          about: data.author?.about,
          linkedin: data.author?.linkedin,
          github: data.author?.github,
          twitter: data.author?.twitter,
        });

        if (data.authorEmail) {
          try {
            const subscriptionResponse = await apiFetch(
              `/api/subscribers/author/email/${encodeURIComponent(
                data.authorEmail
              )}/status`
            );
            if (subscriptionResponse.ok && active) {
              const subscriptionData = await subscriptionResponse.json();
              setIsSubscribed(subscriptionData.isSubscribed);
            }
          } catch {
            /* non-critical */
          }
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const wordCount = useMemo(
    () => readingTime(blog?.content || ""),
    [blog?.content]
  );

  // When the user clicks Summarise the AI panel mounts; smooth-scroll to it
  // so it isn't off-screen. Honors prefers-reduced-motion.
  useEffect(() => {
    if (!isSummarizing) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    // Wait one frame so the panel is in the DOM with a measurable position
    const id = requestAnimationFrame(() => {
      aiPanelRef.current?.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [isSummarizing]);

  /* ---- AI summary ---- */
  const handleSummarize = async () => {
    if (!blog?.content) {
      toast({
        title: "No content",
        description: "There is no content to summarize.",
        variant: "destructive",
      });
      return;
    }
    setIsSummarizing(true);
    setSummary("");
    setQaHistory([]);
    setAiProgress({ attempt: 1, max: RETRY_MAX_ATTEMPTS, phase: "requesting" });

    try {
      let fullContent = blog.content || "";
      if (blog.codeSnippet?.content) {
        const cleanedCode = blog.codeSnippet.content
          .replace(/\s+/g, " ")
          .trim();
        fullContent += `\n\nCode Example (${blog.codeSnippet.language}):\n${cleanedCode}`;
      }
      fullContent = fullContent
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
        .replace(/["'`]/g, '"');

      const inputWords = fullContent.split(" ");
      const maxWords = Math.floor(800 / 1.3);
      const truncatedContent =
        inputWords.length > maxWords
          ? inputWords.slice(0, maxWords).join(" ")
          : fullContent;

      const contentToSummarize = truncatedContent.trim();
      if (!contentToSummarize) throw new Error("Content is empty.");

      const response = await callAIWithRetry(
        SUMMARIZE_ENDPOINT,
        {
          inputs: contentToSummarize,
          parameters: { min_length: 50, max_length: 220, do_sample: false },
        },
        { onProgress: setAiProgress }
      );

      if (!response || !response.ok) {
        let detail = "";
        try {
          const j = await response.json();
          detail = j?.detail || j?.error || "";
        } catch {
          /* ignore */
        }
        const s = response?.status;
        if (s === 404)
          throw new Error("AI proxy not deployed. Run `npm run dev` or deploy to Netlify.");
        if (s === 429)
          throw new Error("Rate limit reached (30/min on free tier). Try again in a minute.");
        if (s === 500 && /GROQ_API_KEY/.test(detail))
          throw new Error("AI is missing GROQ_API_KEY. Add it to your .env (local) or Netlify env vars.");
        if (s === 502 || s === 504)
          throw new Error(
            detail
              ? `Couldn't reach Groq: ${detail}`
              : "Couldn't reach Groq. Check your network and try again."
          );
        throw new Error(detail || "Failed to summarize.");
      }

      const result = await response.json();
      const fullSummary = Array.isArray(result)
        ? result[0]?.summary_text
        : result?.summary_text;
      if (!fullSummary) throw new Error("No summary returned.");

      setAiProgress(null);

      // Stream word by word
      const words = fullSummary.split(" ");
      let current = "";
      let i = 0;
      const stream = () => {
        if (i < words.length) {
          current += (i > 0 ? " " : "") + words[i];
          setSummary(current);
          i++;
          setTimeout(stream, 50);
        } else {
          setIsSummarizing(false);
        }
      };
      stream();
    } catch (err) {
      console.error("Summarization error:", err);
      toast({
        title: "Summarization failed",
        description: err.message || "Could not summarize the post.",
        variant: "destructive",
      });
      setAiProgress(null);
      setIsSummarizing(false);
    }
  };

  /* ---- AI Q&A ---- */
  const handleAskQuestion = async () => {
    if (!question.trim() || !blog?.content) return;
    setIsAnswering(true);
    setAiProgress({ attempt: 1, max: RETRY_MAX_ATTEMPTS, phase: "requesting" });

    try {
      const contentToAnswer = blog.content
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
        .replace(/["'`]/g, '"')
        .trim();

      const response = await callAIWithRetry(
        QA_ENDPOINT,
        { question: question.trim(), context: contentToAnswer },
        { onProgress: setAiProgress }
      );

      if (!response || !response.ok) {
        let detail = "";
        try {
          const j = await response.json();
          detail = j?.detail || j?.error || "";
        } catch {
          /* ignore */
        }
        const s = response?.status;
        if (s === 404) throw new Error("AI proxy not deployed.");
        if (s === 429)
          throw new Error("Rate limit reached (30/min on free tier). Try again in a minute.");
        if (s === 500 && /GROQ_API_KEY/.test(detail))
          throw new Error("AI is missing GROQ_API_KEY.");
        if (s === 502 || s === 504)
          throw new Error(
            detail
              ? `Couldn't reach Groq: ${detail}`
              : "Couldn't reach Groq. Check your network and try again."
          );
        throw new Error(detail || "Failed to answer.");
      }
      const result = await response.json();
      if (!result.answer) throw new Error("No answer returned.");
      setQaHistory((prev) => [
        ...prev,
        { question: question.trim(), answer: result.answer },
      ]);
      setQuestion("");
    } catch (err) {
      toast({
        title: "Question failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAiProgress(null);
      setIsAnswering(false);
    }
  };

  /* ---- Subscribe ---- */
  const handleSubscribeToggle = async () => {
    if (!author?.email) return;
    setIsSubscribing(true);
    try {
      const endpoint = isSubscribed
        ? `/api/subscribers/author/email/${encodeURIComponent(author.email)}/unsubscribe`
        : `/api/subscribers/author/email/${encodeURIComponent(author.email)}`;
      const method = isSubscribed ? "DELETE" : "POST";
      const response = await apiFetch(endpoint, {
        method,
        body: method === "POST" ? JSON.stringify({}) : undefined,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update subscription");
      }
      setIsSubscribed(!isSubscribed);
      toast({
        title: isSubscribed ? "Unsubscribed" : "Subscribed",
        description: isSubscribed
          ? `You have unsubscribed from ${author.name}.`
          : `You will receive updates from ${author.name}.`,
      });
    } catch (err) {
      toast({
        title: "Subscription failed",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCopyCode = () => {
    if (!blog?.codeSnippet?.content) return;
    navigator.clipboard
      .writeText(blog.codeSnippet.content.trim())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() =>
        toast({
          title: "Copy failed",
          variant: "destructive",
        })
      );
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: blog.title, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  if (loading) return <PageSpinner label="Loading post" />;

  if (error || !blog) {
    return (
      <div className="bg-bg min-h-screen pt-20">
        <Container className="py-24">
          <EmptyState
            icon={ArrowLeft}
            title="Post unavailable"
            description="This post may have been removed, or you don't have access."
            action={
              <Button asChild variant="accent" size="lg">
                <Link to="/blogs">Browse other posts</Link>
              </Button>
            }
          />
        </Container>
      </div>
    );
  }

  return (
    <div ref={articleRef} className="bg-bg min-h-screen pt-20">
      <ReadingProgress targetRef={articleRef} />
      {/* Hero strip with image */}
      <header className="relative border-b border-ink-faint">
        <Container size="default" className="py-10 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="!px-3"
            >
              <ArrowLeft size={16} />
              Back
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="subtle"
                size="sm"
                onClick={handleShare}
                aria-label="Share post"
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleSummarize}
                disabled={isSummarizing}
              >
                <Sparkles size={14} />
                {isSummarizing ? "Summarising…" : "Summarise"}
              </Button>
            </div>
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Tag variant="accent">Article</Tag>
              <div className="flex items-center gap-1.5 micro-text text-ink-subtle">
                <Calendar size={12} />
                {formatDate(blog.createdAt)}
              </div>
              <div className="flex items-center gap-1.5 micro-text text-ink-subtle">
                <Clock size={12} />
                {wordCount} min read
              </div>
              {blog.updatedAt &&
                blog.createdAt &&
                new Date(blog.updatedAt).getTime() !==
                  new Date(blog.createdAt).getTime() && (
                  <div className="micro-text text-ink-subtle">
                    Updated {formatDate(blog.updatedAt)}
                  </div>
                )}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-ink leading-[1.05] text-balance mb-8">
              {blog.title}
            </h1>

            {author && (
              <div className="flex items-center gap-4">
                {author.photo ? (
                  <img
                    src={author.photo}
                    alt={author.name}
                    className="w-12 h-12 object-cover border border-ink-faint"
                  />
                ) : (
                  <div className="w-12 h-12 border border-ink-faint bg-surface-2 flex items-center justify-center text-ink-muted font-heading font-bold">
                    {(author.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-ink">
                    {author.name || "Unknown author"}
                  </div>
                  <div className="text-xs text-ink-subtle">
                    {author.email}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Container>
      </header>

      {/* Cover image */}
      {blog.imageUrl && (
        <Container className="pt-10">
          <div className="border border-ink-faint overflow-hidden">
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="w-full aspect-[21/9] object-cover"
            />
          </div>
        </Container>
      )}

      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-14">
        {/* Main column */}
        <article className="lg:col-span-8 min-w-0">
          {/* AI panel (single instance) */}
          {(summary || isSummarizing) && (
            <div
              ref={aiPanelRef}
              style={{ scrollMarginTop: "100px" }}
            >
              <AIPanel
                summary={summary}
                isSummarizing={isSummarizing}
                question={question}
                setQuestion={setQuestion}
                qaHistory={qaHistory}
                onAsk={handleAskQuestion}
                isAnswering={isAnswering}
                progress={aiProgress}
              />
            </div>
          )}

          <MarkdownView content={blog.content} />

          {blog.codeSnippet && (
            <CodeBlock
              language={blog.codeSnippet.language}
              code={blog.codeSnippet.content}
              onCopy={handleCopyCode}
              copied={copied}
            />
          )}

          {/* Footer meta */}
          {(blog.createdAt || blog.updatedAt) && (
            <div className="mt-12 pt-6 border-t border-ink-faint text-sm text-ink-subtle flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                Published {formatDate(blog.createdAt)}
              </div>
              {blog.updatedAt &&
                blog.createdAt &&
                new Date(blog.updatedAt).getTime() !==
                  new Date(blog.createdAt).getTime() && (
                  <div>Updated {formatDate(blog.updatedAt)}</div>
                )}
            </div>
          )}

          <CommentSection blogId={blog.id} />

          <ReadNext currentId={blog.id} authorEmail={author?.email} />
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-28 grid gap-6">
            {author && (
              <AuthorCard
                author={author}
                isSubscribed={isSubscribed}
                isSubscribing={isSubscribing}
                onToggle={handleSubscribeToggle}
              />
            )}
          </div>
        </aside>
      </Container>
    </div>
  );
};

/* =========================================================
   Author card
   ========================================================= */
const AuthorCard = ({ author, isSubscribed, isSubscribing, onToggle }) => (
  <div className="border border-ink-faint bg-surface p-6">
    <div className="micro-text text-accent mb-4 flex items-center gap-2">
      <span className="inline-block w-6 h-px bg-accent" />
      Written by
    </div>

    <div className="flex items-start gap-4 mb-5">
      {author.photo ? (
        <img
          src={author.photo}
          alt={author.name}
          className="w-16 h-16 object-cover border border-ink-faint"
        />
      ) : (
        <div className="w-16 h-16 border border-ink-faint bg-surface-2 flex items-center justify-center text-ink-muted font-heading font-bold text-xl">
          {(author.name || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-heading font-bold text-ink leading-tight">
          {author.name || "Unknown"}
        </h3>
        <p className="text-xs text-ink-subtle truncate">{author.email}</p>
      </div>
    </div>

    {author.about && (
      <p className="text-sm text-ink-muted leading-relaxed mb-5">
        {author.about}
      </p>
    )}

    {author.email && (
      <Button
        onClick={onToggle}
        disabled={isSubscribing}
        variant={isSubscribed ? "subtle" : "accent"}
        size="md"
        className="w-full mb-5"
      >
        {isSubscribed ? (
          <>
            <BellOff size={14} />
            {isSubscribing ? "Updating…" : "Unsubscribe"}
          </>
        ) : (
          <>
            <Bell size={14} />
            {isSubscribing ? "Subscribing…" : "Subscribe"}
          </>
        )}
      </Button>
    )}

    {(author.linkedin || author.twitter || author.github) && (
      <div className="flex gap-2">
        {author.linkedin && (
          <SocialIcon href={author.linkedin} label="LinkedIn">
            <Linkedin size={16} />
          </SocialIcon>
        )}
        {author.twitter && (
          <SocialIcon href={author.twitter} label="X (Twitter)">
            <Twitter size={16} />
          </SocialIcon>
        )}
        {author.github && (
          <SocialIcon href={author.github} label="GitHub">
            <Github size={16} />
          </SocialIcon>
        )}
      </div>
    )}
  </div>
);

const SocialIcon = ({ href, children, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="w-10 h-10 border border-ink-faint flex items-center justify-center text-ink-muted hover:text-accent-ink hover:bg-accent hover:border-accent transition-colors"
  >
    {children}
  </a>
);

/* =========================================================
   AI Panel — single source of truth
   ========================================================= */
const AIPanel = ({
  summary,
  isSummarizing,
  question,
  setQuestion,
  qaHistory,
  onAsk,
  isAnswering,
  progress,
}) => {
  // Only show the retry indicator if we actually entered the retry phase.
  // First-attempt Groq calls return in ~600ms, so the regular spinner is
  // enough — no point flashing a retry counter for a moment.
  const isRetrying = progress?.phase === "retrying";
  const showProgress = (isSummarizing || isAnswering) && isRetrying && !summary;

  return (
    <div className="mb-12 border border-accent/40 bg-accent/[0.03]">
      <div className="px-5 py-3 border-b border-accent/30 flex items-center gap-2 bg-accent/5">
        <Sparkles size={14} className="text-accent" />
        <span className="micro-text text-accent">AI summary</span>
      </div>
      <div className="p-5">
        {showProgress ? (
          <WarmupIndicator progress={progress} />
        ) : isSummarizing && !summary ? (
          <div className="flex items-center gap-2 text-ink-muted">
            <div className="w-3 h-3 border-2 border-t-accent border-r-accent/30 border-b-accent/10 border-l-accent/60 rounded-full animate-spin" />
            <span className="text-sm">Generating summary…</span>
          </div>
        ) : (
          <p className="text-ink leading-relaxed mb-4">
            {summary}
            {isSummarizing && (
              <span className="inline-block w-2 h-4 bg-accent ml-1 animate-pulse-dot align-text-bottom" />
            )}
          </p>
        )}

        {summary && (
          <div className="mt-6 pt-5 border-t border-accent/20">
            <div className="micro-text text-ink-subtle mb-3">
              Ask a question about this post
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isAnswering) onAsk();
                }}
                placeholder="What is the main idea?"
                className="flex-1 px-3 py-2 bg-surface border border-ink-faint text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-accent transition-colors"
                disabled={isAnswering}
              />
              <Button
                onClick={onAsk}
                disabled={isAnswering || !question.trim()}
                variant="accent"
                size="md"
              >
                <Send size={14} />
                {isAnswering ? "Answering…" : "Ask"}
              </Button>
            </div>

            {isAnswering && progress?.phase === "retrying" && (
              <div className="mt-3">
                <WarmupIndicator progress={progress} compact />
              </div>
            )}

            {qaHistory.length > 0 && (
              <div className="mt-5 grid gap-4">
                {qaHistory.map((qa, i) => (
                  <div key={i} className="border-l-2 border-accent pl-4">
                    <p className="text-xs text-ink-subtle uppercase tracking-[0.16em] mb-1">
                      Q
                    </p>
                    <p className="text-sm text-ink mb-2">{qa.question}</p>
                    <p className="text-xs text-accent uppercase tracking-[0.16em] mb-1">
                      A
                    </p>
                    <p className="text-sm text-ink-muted">{qa.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const WarmupIndicator = ({ progress, compact = false }) => {
  const { attempt, max, waitMs } = progress;
  const percent = Math.min(100, Math.round((attempt / max) * 100));
  const label = `Upstream hiccup, retrying… ${attempt} / ${max}`;
  const subLabel = waitMs
    ? `Next attempt in ${Math.round(waitMs / 1000)}s`
    : null;

  return (
    <div className={compact ? "" : "py-2"}>
      <div className="flex items-center gap-2 mb-2 text-ink">
        <div className="w-3 h-3 border-2 border-t-accent border-r-accent/30 border-b-accent/10 border-l-accent/60 rounded-full animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="h-1 w-full bg-accent/10 overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-500 ease-brutal"
          style={{ width: `${percent}%` }}
        />
      </div>
      {!compact && subLabel && (
        <p className="text-xs text-ink-subtle mt-2">{subLabel}</p>
      )}
    </div>
  );
};

/* =========================================================
   Code block with copy
   ========================================================= */
const CodeBlock = ({ language, code, onCopy, copied }) => (
  <div className="mt-12 mb-6">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-heading font-bold text-ink flex items-center gap-2">
        <span className="text-accent">{"<>"}</span>
        Code example
      </h3>
    </div>
    <div className="border border-ink-faint bg-[#0d0d0d] relative">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-faint bg-surface">
        <Tag>{language}</Tag>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 micro-text text-ink-subtle hover:text-accent transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-accent" />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          background: "transparent",
          padding: "1.25rem 1rem",
          margin: 0,
          fontSize: "14px",
          lineHeight: "1.65",
        }}
        codeTagProps={{
          style: {
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          },
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  </div>
);

export default BlogDetail;
