import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp,
  Eye,
  Pencil,
  Image as ImageIcon,
  X as XIcon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthContext } from "../AuthContext";
import { Container } from "@/components/shared/Container";
import { Section } from "@/components/shared/Section";
import { Field, Input, Textarea } from "@/components/shared/Field";
import { MarkdownView } from "@/components/shared/MarkdownView";
import apiFetch from "../utils/api";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
];

const WriteBlog = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem("redirectAfterLogin", "/write-blog");
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  const wordCount = useMemo(
    () =>
      blogContent
        .trim()
        .split(/\s+/)
        .filter(Boolean).length,
    [blogContent]
  );
  const readMin = Math.max(1, Math.round(wordCount / 220));

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Title is required",
        description: "Give your post a title.",
        variant: "destructive",
      });
      return;
    }
    if (!blogContent.trim()) {
      toast({
        title: "Content is required",
        description: "You haven't written anything yet.",
        variant: "destructive",
      });
      return;
    }
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", blogContent);
      if (codeContent.trim()) {
        formData.append("language", language);
        formData.append("code", codeContent);
      }
      if (selectedFile) formData.append("image", selectedFile);

      const response = await apiFetch("/api/blogs", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error("Failed to publish");
      }

      toast({
        title: "Published",
        description: "Your blog is now live.",
      });
      navigate("/profile");
    } catch (err) {
      let msg = "Failed to publish blog.";
      if (err.message?.includes("413"))
        msg = "Image too large. Please use a smaller file.";
      toast({
        title: "Could not publish",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg min-h-screen pt-20">
      <Section>
        <Container>
          {/* Header */}
          <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
            <div>
              <div className="micro-text text-accent mb-3 flex items-center gap-2">
                <span className="inline-block w-6 h-px bg-accent" />
                Compose
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-ink">
                Write a new post<span className="text-accent">.</span>
              </h1>
              <p className="text-ink-muted mt-3 max-w-2xl">
                Markdown supported. Use{" "}
                <code className="px-1.5 py-0.5 bg-surface-2 text-accent text-xs">
                  ##
                </code>{" "}
                for headings,{" "}
                <code className="px-1.5 py-0.5 bg-surface-2 text-accent text-xs">
                  **bold**
                </code>{" "}
                for emphasis.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-subtle">
              <span>
                <strong className="text-ink">{wordCount}</strong> words
              </span>
              <span>·</span>
              <span>
                <strong className="text-ink">{readMin}</strong> min read
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-8 max-w-4xl">
            {/* Title */}
            <Field id="title" label="Title" required>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A captivating, sharp title"
                disabled={loading}
                className="w-full p-4 text-2xl font-heading font-bold bg-surface border border-ink-faint text-ink outline-none transition-colors focus:border-accent focus:bg-bg placeholder:text-ink-subtle disabled:opacity-50"
              />
            </Field>

            {/* Content editor */}
            <Field
              id="blogContent"
              label="Content"
              required
              labelAction={
                <button
                  type="button"
                  onClick={() => setIsPreview((v) => !v)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 micro-text text-accent hover:text-ink transition-colors"
                >
                  {isPreview ? (
                    <>
                      <Pencil size={12} />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye size={12} />
                      Preview
                    </>
                  )}
                </button>
              }
            >
              {isPreview ? (
                <div className="min-h-[400px] p-6 bg-surface border border-ink-faint">
                  {blogContent ? (
                    <MarkdownView content={blogContent} />
                  ) : (
                    <p className="text-ink-subtle italic">
                      Nothing to preview yet.
                    </p>
                  )}
                </div>
              ) : (
                <Textarea
                  id="blogContent"
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  placeholder="Start writing… markdown supported."
                  disabled={loading}
                  className="min-h-[400px] text-base leading-relaxed"
                />
              )}
            </Field>

            {/* Code snippet */}
            <div className="grid gap-5">
              <h3 className="micro-text text-ink-subtle">Code (optional)</h3>
              <div className="grid sm:grid-cols-[1fr,2fr] gap-4">
                <Field id="codeLanguage" label="Language">
                  <Select
                    value={language}
                    onValueChange={setLanguage}
                    disabled={loading}
                  >
                    <SelectTrigger className="p-3 bg-surface border border-ink-faint text-ink h-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border border-ink-faint text-ink">
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="codeContent" label="Snippet">
                  <Textarea
                    id="codeContent"
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    placeholder="// Paste your code here…"
                    disabled={loading}
                    className="font-mono text-sm min-h-[180px]"
                  />
                </Field>
              </div>
            </div>

            {/* Image */}
            <Field
              id="featured-image"
              label="Featured image"
              hint="Optional · PNG/JPG/GIF up to 10MB"
            >
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <label
                  htmlFor="featured-image"
                  className="flex-1 cursor-pointer border border-dashed border-ink-faint hover:border-accent p-8 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <ImageIcon
                    size={28}
                    className="mb-3 text-ink-subtle"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-ink">
                    {selectedFile ? selectedFile.name : "Click to upload"}
                  </span>
                  <span className="text-xs text-ink-subtle mt-1">
                    or drag and drop
                  </span>
                  <input
                    type="file"
                    id="featured-image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
                {previewUrl && (
                  <div className="relative w-full md:w-1/3 border border-ink-faint">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full aspect-[4/3] object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-bg border border-danger text-danger flex items-center justify-center hover:bg-danger hover:text-ink transition-colors"
                      aria-label="Remove image"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                )}
              </div>
            </Field>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-ink-faint">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={scrollToTop}
                disabled={loading}
              >
                <ArrowUp size={14} />
                Back to top
              </Button>
              <Button
                type="submit"
                variant="accent"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Publish blog
                  </>
                )}
              </Button>
            </div>
          </form>
        </Container>
      </Section>
    </div>
  );
};

export default WriteBlog;
